"""
Fine-tune the existing poker GPT checkpoint (evolution/ckpt.pt) on the
evolutionary dataset (evolution/train.bin, evolution/val.bin).

The result is written to evolution/eckpt.pt. The input ckpt.pt is never modified.
Targets Apple Silicon (MPS) by default.
"""
import os
import time
import math
import pickle
import random
from contextlib import nullcontext

import torch

from model import GPTConfig, GPT

# I/O
out_dir = 'evolution'
data_dir = 'evolution'
init_from = 'resume'
in_ckpt_path = os.path.join(out_dir, 'ckpt.pt')
out_ckpt_path = os.path.join(out_dir, 'eckpt.pt')

eval_interval = 250
eval_iters = 200
log_interval = 10

# only save when val loss improves on the best seen so far (starting with the
# val loss of the un-tuned model). A final save is made if nothing ever improved,
# so eckpt.pt always exists after a run.
always_save_checkpoint = False

# -----------------------------------------------------------------------------
# training hyperparameters (fine-tuning: lower LR, shorter schedule)
gradient_accumulation_steps = 1
batch_size = 64

learning_rate = 5e-4      # ~20x lower than from-scratch (1e-3)
min_lr = 5e-5             # learning_rate / 10
max_iters = 3000
lr_decay_iters = 2000     # make equal to max_iters usually
warmup_iters = 50
decay_lr = True

beta1 = 0.9
beta2 = 0.99
weight_decay = 1e-1
grad_clip = 1.0

dropout_override = None   # e.g. 0.1 to change dropout vs. the checkpoint; None keeps it as saved
eval_only = False

# system
if torch.cuda.is_available():
    device = 'cuda'
elif torch.backends.mps.is_available():
    device = 'mps'
else:
    device = 'cpu'
if device_type == 'cuda' and torch.cuda.is_bf16_supported():
    dtype = 'bfloat16'
else:
    dtype = 'float16'
compile = False
device_type = device      # device may include an index but not in this script

# -----------------------------------------------------------------------------
# optional: allow overriding any of the above from the command line / a config file
_cfg_keys = [k for k, v in globals().items()
             if not k.startswith('_') and isinstance(v, (int, float, bool, str, type(None)))]
_cfg_snapshot = {k: globals()[k] for k in _cfg_keys}
exec(open('configurator.py').read()) if os.path.exists('configurator.py') else None
# -----------------------------------------------------------------------------

torch.manual_seed(1337)
random.seed(1337)

if device_type == 'mps' and not torch.backends.mps.is_available():
    raise RuntimeError("device='mps' requested but MPS is not available in this PyTorch build/machine")

# CUDA-only optimisations: skip on macOS
if device_type == 'cuda':
    torch.backends.cuda.matmul.allow_tf32 = True
    torch.backends.cudnn.allow_tf32 = True

ptdtype = {'float32': torch.float32, 'bfloat16': torch.bfloat16, 'float16': torch.float16}[dtype]
if device_type == 'cpu' or dtype == 'float32':
    ctx = nullcontext()
else:
    try:
        ctx = torch.amp.autocast(device_type=device_type, dtype=ptdtype)
    except Exception as e:  # older torch without MPS autocast
        print(f"autocast unavailable on {device_type} ({e}); running in float32")
        ctx = nullcontext()

# GradScaler: needed for float16. Falls back to a no-op if unsupported on this backend.
try:
    scaler = torch.amp.GradScaler(device_type, enabled=(dtype == 'float16' and device_type != 'cpu'))
except Exception as e:
    print(f"GradScaler unavailable on {device_type} ({e}); training without loss scaling")
    scaler = torch.amp.GradScaler('cuda', enabled=False)

# -----------------------------------------------------------------------------
# model: load config + weights from the existing checkpoint
print(f"Resuming from {in_ckpt_path}")
checkpoint = torch.load(in_ckpt_path, map_location='cpu', weights_only=False)
ckpt_model_args = checkpoint['model_args']

model_args = {k: ckpt_model_args[k] for k in
              ['n_layer', 'n_head', 'n_embd', 'n_input', 'block_size', 'bias', 'vocab_size', 'dropout']
              if k in ckpt_model_args}
if dropout_override is not None:
    model_args['dropout'] = dropout_override

block_size = model_args['block_size']
print(f"model_args from checkpoint: {model_args}")

gptconf = GPTConfig(**model_args)
model = GPT(gptconf)

state_dict = checkpoint['model']
# strip prefix left behind by torch.compile / DDP wrappers, if present
for prefix in ('_orig_mod.', 'module.'):
    for k in list(state_dict.keys()):
        if k.startswith(prefix):
            state_dict[k[len(prefix):]] = state_dict.pop(k)
model.load_state_dict(state_dict)

prev_iter = checkpoint.get('iter_num', 0)
prev_best = checkpoint.get('best_val_loss', None)
print(f"loaded checkpoint (trained for {prev_iter} iters, best_val_loss={prev_best})")

model.to(device)

# fresh optimizer for fine-tuning (new, lower LR; old moment estimates not reused)
optimizer = model.configure_optimizers(weight_decay, learning_rate, (beta1, beta2), device_type)
del checkpoint, state_dict  # free memory

raw_model = model
if compile:
    print("compiling the model...")
    model = torch.compile(model)

# -----------------------------------------------------------------------------
# data: pickled lists of vector sequences, loaded once into memory
def load_split(name):
    path = os.path.join(data_dir, name)
    with open(path, 'rb') as f:
        sets = pickle.load(f)
    assert len(sets) > 0, f"{path} is empty"
    print(f"loaded {len(sets):,} sequences from {path}")
    return sets

datasets = {
    'train': load_split('train.bin'),
    'val': load_split('val.bin'),
}

def get_batch(split):
    sets = datasets[split]
    chosen = random.choices(sets, k=batch_size)
    x_batch, y_batch, mask_batch = [], [], []
    for vecset in chosen:
        orig_len = len(vecset)
        if orig_len > block_size:
            vecset = [vecset[0]] + vecset[-(block_size - 1):]
            orig_len = block_size
        elif orig_len < block_size:
            pad = [[0.0] * len(vecset[0]) for _ in range(block_size - orig_len)]
            vecset = pad + vecset
        x_vecs = [list(v) for v in vecset]       # copy so the cached data is never mutated
        y_val = x_vecs[-1][-1]
        x_vecs[-1][-1] = 0.0
        x_batch.append(x_vecs)
        y_batch.append(int(y_val) + 1)           # map -1..7 -> 0..8
        mask_batch.append([0] * (block_size - orig_len) + [1] * orig_len)  # 1 = real, 0 = padding
    x = torch.tensor(x_batch, dtype=torch.float32)
    y = torch.tensor(y_batch, dtype=torch.float32)
    mask = torch.tensor(mask_batch, dtype=torch.bool)
    if device_type == 'cuda':
        x, y, mask = (t.pin_memory().to(device, non_blocking=True) for t in (x, y, mask))
    else:
        x, y, mask = x.to(device), y.to(device), mask.to(device)
    return x, y, mask

# -----------------------------------------------------------------------------
@torch.no_grad()
def estimate_loss():
    out = {}
    model.eval()
    for split in ['train', 'val']:
        losses = torch.zeros(eval_iters)
        for k in range(eval_iters):
            X, Y, mask = get_batch(split)
            with ctx:
                logits, loss = model(X, Y, key_padding_mask=~mask)
            losses[k] = loss.item()
        out[split] = losses.mean().item()
    model.train()
    return out

def get_lr(it):
    if it < warmup_iters:
        return learning_rate * (it + 1) / (warmup_iters + 1)
    if it > lr_decay_iters:
        return min_lr
    decay_ratio = (it - warmup_iters) / (lr_decay_iters - warmup_iters)
    assert 0 <= decay_ratio <= 1
    coeff = 0.5 * (1.0 + math.cos(math.pi * decay_ratio))
    return min_lr + coeff * (learning_rate - min_lr)

def save_checkpoint(it, val_loss):
    ckpt = {
        'model': raw_model.state_dict(),
        'optimizer': optimizer.state_dict(),
        'model_args': model_args,
        'iter_num': it,
        'best_val_loss': val_loss,
        'config': gptconf,
        'finetuned_from': in_ckpt_path,
    }
    print(f"saving checkpoint to {out_ckpt_path}")
    torch.save(ckpt, out_ckpt_path)

# -----------------------------------------------------------------------------
# training loop
iter_num = 0
best_val_loss = float('inf')
saved_any = False
last_val_loss = None

X, Y, mask = get_batch('train')
t0 = time.time()
model.train()

while True:
    lr = get_lr(iter_num) if decay_lr else learning_rate
    for param_group in optimizer.param_groups:
        param_group['lr'] = lr

    if iter_num % eval_interval == 0 or iter_num == max_iters:
        losses = estimate_loss()
        last_val_loss = losses['val']
        print(f"step {iter_num}: train loss {losses['train']:.4f}, val loss {losses['val']:.4f}")
        if iter_num == 0:
            # baseline: only overwrite-worthy if fine-tuning beats the starting model
            best_val_loss = losses['val']
        elif losses['val'] < best_val_loss or always_save_checkpoint:
            best_val_loss = min(best_val_loss, losses['val'])
            save_checkpoint(iter_num, best_val_loss)
            saved_any = True
    if iter_num == 0 and eval_only:
        break

    for micro_step in range(gradient_accumulation_steps):
        with ctx:
            logits, loss = model(X, Y, key_padding_mask=~mask)
            loss = loss / gradient_accumulation_steps
        X, Y, mask = get_batch('train')
        scaler.scale(loss).backward()

    if grad_clip != 0.0:
        scaler.unscale_(optimizer)
        torch.nn.utils.clip_grad_norm_(model.parameters(), grad_clip)
    scaler.step(optimizer)
    scaler.update()
    optimizer.zero_grad(set_to_none=True)

    t1 = time.time()
    dt = t1 - t0
    t0 = t1
    if iter_num % log_interval == 0:
        lossf = loss.item() * gradient_accumulation_steps
        print(f"iter {iter_num}: loss {lossf:.4f}, lr {lr:.2e}, time {dt*1000:.2f}ms")
    iter_num += 1

    if iter_num > max_iters:
        break

# make sure eckpt.pt always exists, even if val loss never beat the starting model
if not eval_only and not saved_any:
    print("val loss never improved on the starting checkpoint; saving final weights anyway")
    save_checkpoint(iter_num, last_val_loss if last_val_loss is not None else best_val_loss)

print("done.")
