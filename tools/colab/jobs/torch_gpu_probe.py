"""Bounded synthetic PyTorch GPU check; no user files, no model downloads."""
from __future__ import annotations
import json
import time

import torch

if not torch.cuda.is_available():
    raise RuntimeError("GPU_T4_NOT_AVAILABLE")
started = time.perf_counter()
device = torch.device("cuda:0")
torch.manual_seed(2026)
left = torch.randn((256, 256), device=device)
right = torch.randn((256, 256), device=device)
with torch.no_grad():
    product = torch.matmul(left, right)
    torch.cuda.synchronize()
norm = float(product.norm().item())
assert norm > 0
print(json.dumps({
    "schema": "mcf-colab-torch-probe/v1",
    "status": "PASS",
    "acceleratorDetected": torch.cuda.get_device_name(device),
    "torchVersion": torch.__version__,
    "cudaAvailable": True,
    "matrixShape": [256, 256],
    "resultNorm": round(norm, 4),
    "elapsedSeconds": round(time.perf_counter() - started, 4),
    "privateDataTransmitted": False,
}, sort_keys=True))
