#!/usr/bin/env python3
import json
import os
import subprocess
import sys
import tempfile
import threading
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
from voicehub_speech_queue import SpeechQueue

events = []
events_lock = threading.Lock()
active = 0
max_active = 0

def log(*args):
    pass

def fake_execute(text, mode, meta=None):
    global active, max_active
    with events_lock:
        active += 1
        max_active = max(max_active, active)
        events.append(("start", text, time.monotonic()))
    time.sleep(0.06)
    with events_lock:
        events.append(("end", text, time.monotonic()))
        active -= 1
    return {"provider": "fake", "voice": "test", "fallback": False, "attempts": []}

q = SpeechQueue(fake_execute, log)
meta = {"agent":"TEST","project":"MCF","mission":"QUEUE-TEST","phase":"qa","source":"test"}

jobs = [q.enqueue(x, meta=meta, identify=True, wait=False) for x in ("A","B","C")]
deadline = time.time() + 5
while time.time() < deadline:
    states = [q.job(j["id"])["status"] for j in jobs]
    if all(s == "DONE" for s in states):
        break
    time.sleep(0.02)
else:
    raise SystemExit("queue timeout")

starts = [text for kind,text,_ in events if kind == "start"]
assert starts == [
    "TEST. Projeto MCF. Missão QUEUE-TEST. Fase qa. A",
    "TEST. Projeto MCF. Missão QUEUE-TEST. Fase qa. B",
    "TEST. Projeto MCF. Missão QUEUE-TEST. Fase qa. C",
], starts
assert max_active == 1, max_active

audio_meta = {
    "agent":"MESTRE",
    "project":"MCF",
    "mission":"MCF-PERSISTENT-VOICE-COMMS-001",
    "phase":"qa",
    "source":"test",
    "voice_profile":"clear",
}
audio_job = q.enqueue_audio("/tmp/mcf-checkpoint.mp3", meta=audio_meta, wait=True, timeout=3)
assert audio_job["status"] == "DONE", audio_job
assert audio_job["kind"] == "rendered_audio", audio_job
assert audio_job["audio_name"] == "mcf-checkpoint.mp3", audio_job
assert events[-2][1] == "", events
assert max_active == 1, max_active

try:
    q.enqueue("X", meta={"agent":"TEST"}, identify=True)
    raise AssertionError("missing metadata accepted")
except ValueError:
    pass

try:
    q.enqueue_audio("/tmp/x.mp3", meta={"agent":"MESTRE"})
    raise AssertionError("rendered audio accepted without mission identity")
except ValueError:
    pass

lock_dir = Path(tempfile.mkdtemp(prefix="voicehub-lock-test-"))
trace = lock_dir / "trace.jsonl"
child = lock_dir / "child.py"
child.write_text(
    """
import json, os, sys, time
from pathlib import Path
sys.path.insert(0, sys.argv[3])
import voicehub_router
voicehub_router.AUDIO_LOCK = Path(sys.argv[4])
trace=Path(sys.argv[1]); label=sys.argv[2]
with voicehub_router._exclusive_audio():
    with trace.open('a') as f:
        f.write(json.dumps({'event':'start','label':label,'t':time.time()})+'\\n')
    time.sleep(0.35)
    with trace.open('a') as f:
        f.write(json.dumps({'event':'end','label':label,'t':time.time()})+'\\n')
""",
    encoding="utf-8",
)
test_lock = lock_dir / "audio.lock"
p1 = subprocess.Popen([sys.executable, str(child), str(trace), "P1", str(ROOT), str(test_lock)])
time.sleep(0.03)
p2 = subprocess.Popen([sys.executable, str(child), str(trace), "P2", str(ROOT), str(test_lock)])
assert p1.wait(timeout=5) == 0
assert p2.wait(timeout=5) == 0
rows=[json.loads(x) for x in trace.read_text().splitlines()]
assert [r["event"] for r in rows] == ["start","end","start","end"], rows
assert rows[2]["t"] >= rows[1]["t"], rows

print(json.dumps({
    "queue_fifo": True,
    "max_simultaneous_execute": max_active,
    "identity_required": True,
    "rendered_audio_queue": True,
    "rendered_audio_identity_required": True,
    "cross_process_lock": True,
    "lock_trace": [{"event":r["event"],"label":r["label"]} for r in rows],
}, indent=2))
