"""Small public synthetic Colab preflight: CPU, hashlib, and JSON output only."""
from __future__ import annotations

import hashlib
import json
import os
import platform
import time

started = time.perf_counter()
payload = b"MCF-COLAB-PUBLIC-SYNTHETIC-V1"
digest = hashlib.sha256(payload).hexdigest()
assert len(digest) == 64
assert hashlib.sha256(payload).hexdigest() == digest
print(json.dumps({
    "schema": "mcf-colab-smoke/v1",
    "status": "PASS",
    "executionEnvironment": "PYTHON_STD_LIB",
    "platform": platform.system(),
    "python": platform.python_version(),
    "cpuCountReported": os.cpu_count(),
    "sha256": digest,
    "seconds": round(time.perf_counter() - started, 6),
    "privateDataTransmitted": False,
}, sort_keys=True))
