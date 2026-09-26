#!/usr/bin/env python3
import hashlib
import json
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ADAPTER = ROOT / "tools/world-model/adapter_v01.py"
FIXED_AT = "2026-09-26T10:05:00Z"
REV = subprocess.check_output(["git","-C",str(ROOT),"rev-parse","HEAD"], text=True).strip()

def run(dest):
    subprocess.check_call([
        "python3", str(ADAPTER),
        "--revision", REV,
        "--generated-at", FIXED_AT,
        "--output-dir", str(dest)
    ])
    return json.loads((dest / "bundle.json").read_text())

with tempfile.TemporaryDirectory() as a_dir, tempfile.TemporaryDirectory() as b_dir:
    a = run(Path(a_dir))
    b = run(Path(b_dir))
    a_bytes = json.dumps(a, sort_keys=True, separators=(",",":")).encode()
    b_bytes = json.dumps(b, sort_keys=True, separators=(",",":")).encode()
    assert a_bytes == b_bytes, "rebuild outputs differ"
    digest = hashlib.sha256(a_bytes).hexdigest()

print("REBUILD_V01 PASS")
print("sourceRevision", REV)
print("semanticDigest", digest)
print("projectedObjects", len(a["projectedObjects"]))
print("contextEntries", len(a["contextSlice"]["entries"]))
print("relations", len(a["contextSlice"]["relations"]))
