"""
Export trained model checkpoint to ONNX format.

Usage:
    Standard:   python makeonnx.py
    Evolution:  python makeonnx.py evo
"""

import os
import sys
import torch
import onnx
from model import GPTConfig, GPT

# Check mode via sys.argv for consistency with prepare.py
is_evo = "evo" in sys.argv

# Configure paths based on mode
if is_evo:
    ckpt_path = os.path.join('evolution', 'eckpt.pt')
    onnx_path = os.path.join('evolution', 'epoker-split.onnx')
    combined_path = os.path.join('evolution', 'epoker.onnx')
    print("--- Exporting Evolutionary Fine-tuned Model ---")
else:
    ckpt_path = os.path.join('out-poker', 'ckpt.pt')
    onnx_path = os.path.join('out-poker', 'poker-split.onnx')
    combined_path = os.path.join('out-poker', 'poker.onnx')
    print("--- Exporting Original Model ---")

# Wrapper for ONNX checkpoint
class GPTOnnxWrapper(torch.nn.Module):
    def __init__(self, model):
        super().__init__()
        self.model = model
    def forward(self, x, mask):
        logits, _ = self.model(x, key_padding_mask=mask)
        return logits

# Load checkpoint
print(f"Loading checkpoint from {ckpt_path}...")
checkpoint = torch.load(ckpt_path, map_location='cpu', weights_only=False)
gptconf = GPTConfig(**checkpoint['model_args'])
model = GPT(gptconf)
state_dict = checkpoint['model']

unwanted_prefix = '_orig_mod.'
clean_state_dict = {}
for k, v in state_dict.items():
    if k.startswith(unwanted_prefix):
        clean_state_dict[k[len(unwanted_prefix):]] = v
    else:
        clean_state_dict[k] = v
state_dict = clean_state_dict

model.load_state_dict(state_dict)
model.eval()
model.to('cpu')

# Prepare for conversion
onnx_model = GPTOnnxWrapper(model)
onnx_model.eval() # pointless but stops a warning
block_size = gptconf.block_size
n_embd = gptconf.n_embd
dummy_input = torch.zeros((1, block_size, n_embd), dtype=torch.float32)
dummy_mask = torch.zeros([1, block_size], dtype=torch.bool)

# Export to ONNX
print(f"Exporting split ONNX to {onnx_path}...")
torch.onnx.export(
    onnx_model,
    (dummy_input, dummy_mask),
    onnx_path,
    opset_version=18
)
print(f"Exported model to {onnx_path}")

# Combine / save external data
model = onnx.load(onnx_path, load_external_data=True)
onnx.save(model, combined_path, save_as_external_data=False)

print(f"Placed combined copy at {combined_path}")
