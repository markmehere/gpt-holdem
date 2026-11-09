"""
Extract weights from poker.onnx and rebuild a PyTorch checkpoint (ckpt.pt) for fine-tuning
"""

import os
import torch
import onnx
from model import GPTConfig, GPT

onnx_path = 'poker.onnx'
ckpt_path = os.path.join('evolution', 'ckpt.pt')

n_layer = 4
n_head = 9
n_embd = 27
n_input = 27
block_size = 26
bias = False
meta_vocab_size = 9
dropout = 0.2

# 1. Instantiate your PyTorch model architecture
gptconf = GPTConfig(
    n_layer=n_layer, n_head=n_head, n_embd=n_embd, n_input=n_input, block_size=block_size,
    bias=bias, vocab_size=meta_vocab_size, dropout=dropout
)
model = GPT(gptconf)

# 2. Load the ONNX model
print(f"Loading ONNX model from {onnx_path}...")
onnx_model = onnx.load(onnx_path, load_external_data=True)
onnx_weights = []
for initializer in onnx_model.graph.initializer:
    weight_np = onnx.numpy_helper.to_array(initializer)
    onnx_weights.append({
        'name': initializer.name,
        'tensor': torch.from_numpy(weight_np.copy()),
        'shape': weight_np.shape
    })

print(f"Extracted {len(onnx_weights)} weight tensors from ONNX.")

pytorch_state_dict = model.state_dict()
new_state_dict = {}
used_onnx_indices = set()

# Helper to match and assign a tensor with automatic transposition
def assign_weight(pt_key, target_shape, onnx_idx):
    ow = onnx_weights[onnx_idx]
    tensor = ow['tensor']
    if tensor.shape == target_shape:
        new_state_dict[pt_key] = tensor
    elif tensor.shape == tuple(reversed(target_shape)):
        new_state_dict[pt_key] = tensor.t()
    else:
        # Fallback: find any unused tensor matching the shape
        return False
    used_onnx_indices.add(onnx_idx)
    return True

# --- Pass 1: Exact Name Matching (LayerNorms, Biases, etc.) ---
for pt_key, pt_tensor in pytorch_state_dict.items():
    onnx_key = 'model.' + pt_key
    for idx, ow in enumerate(onnx_weights):
        if idx not in used_onnx_indices and ow['name'] == onnx_key:
            if assign_weight(pt_key, pt_tensor.shape, idx):
                break

print(f"Pass 1 (Name matching): Matched {len(new_state_dict)}/{len(pytorch_state_dict)} weights.")

# --- Pass 2: Sequential Layer-by-Layer Transformer Block Mapping ---
# Find remaining unused ONNX tensors by index order
def get_next_unused_with_shape(target_shape):
    for idx, ow in enumerate(onnx_weights):
        if idx not in used_onnx_indices:
            t = ow['tensor']
            if t.shape == target_shape or t.shape == tuple(reversed(target_shape)):
                return idx
    return None

# Map embeddings if not already matched
for pt_key in ['transformer.wte.weight', 'transformer.wpe.weight']:
    if pt_key not in new_state_dict and pt_key in pytorch_state_dict:
        target_shape = pytorch_state_dict[pt_key].shape
        idx = get_next_unused_with_shape(target_shape)
        if idx is not None:
            assign_weight(pt_key, target_shape, idx)
            print(f"Mapped embedding '{pt_key}'")

# Map transformer blocks h.0 through h.3 sequentially
for i in range(n_layer):
    block_keys = [
        f'transformer.h.{i}.attn.c_attn.weight',
        f'transformer.h.{i}.attn.c_proj.weight',
        f'transformer.h.{i}.mlp.c_fc.weight',
        f'transformer.h.{i}.mlp.c_proj.weight'
    ]
    for pt_key in block_keys:
        if pt_key in new_state_dict or pt_key not in pytorch_state_dict:
            continue
        target_shape = pytorch_state_dict[pt_key].shape
        idx = get_next_unused_with_shape(target_shape)
        if idx is not None:
            assign_weight(pt_key, target_shape, idx)
            print(f"Mapped block weight '{pt_key}'")

# Map lm_head if remaining
if 'lm_head.weight' in pytorch_state_dict and 'lm_head.weight' not in new_state_dict:
    target_shape = pytorch_state_dict['lm_head.weight'].shape
    idx = get_next_unused_with_shape(target_shape)
    if idx is not None:
        assign_weight('lm_head.weight', target_shape, idx)
        print("Mapped 'lm_head.weight'")

print(f"Successfully mapped {len(new_state_dict)}/{len(pytorch_state_dict)} weights total.")

# 3. Load into model and save checkpoint
model.load_state_dict(new_state_dict, strict=True)
model.eval()

checkpoint = {
    'model': model.state_dict(),
    'model_args': gptconf.__dict__,
    'iter_num': 0,
    'best_val_loss': 0.0
}

torch.save(checkpoint, ckpt_path)
print(f"✅ Successfully reconstructed pristine PyTorch checkpoint at {ckpt_path} ready for fine-tuning!")
