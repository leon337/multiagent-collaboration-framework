#!/usr/bin/env python3
import math
import os
import random
import shutil
import struct
import subprocess
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
START = ASSETS / "radio-start.wav"
END = ASSETS / "radio-end.wav"
RATE = 44100

def _envelope(i, total):
    edge = max(1, int(RATE * 0.008))
    if i < edge:
        return i / edge
    if i > total - edge:
        return max(0.0, (total - i) / edge)
    return 1.0

def _render(path, segments, seed=337):
    ASSETS.mkdir(parents=True, exist_ok=True)
    rng = random.Random(seed)
    frames = []
    for kind, duration, freq, amp in segments:
        total = max(1, int(RATE * duration))
        for i in range(total):
            env = _envelope(i, total)
            if kind == "tone":
                value = math.sin(2 * math.pi * freq * (i / RATE))
            else:
                value = rng.uniform(-1.0, 1.0)
            sample = int(max(-1, min(1, value * amp * env)) * 32767)
            frames.append(struct.pack("<h", sample))
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(RATE)
        wav.writeframes(b"".join(frames))

def ensure_assets():
    if not START.exists():
        _render(START, [
            ("noise", 0.025, 0, 0.05),
            ("tone", 0.075, 920, 0.18),
            ("tone", 0.045, 1180, 0.11),
        ], seed=337)
    if not END.exists():
        _render(END, [
            ("tone", 0.055, 760, 0.15),
            ("tone", 0.050, 540, 0.11),
            ("noise", 0.020, 0, 0.04),
        ], seed=733)

def play(which):
    ensure_assets()
    target = START if which == "start" else END
    player = shutil.which("paplay") or shutil.which("aplay")
    if not player:
        return False
    env = os.environ.copy()
    env.setdefault("PULSE_SERVER", f"unix:/run/user/{os.getuid()}/pulse/native")
    subprocess.run([player, str(target)], timeout=3, check=False, env=env,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return True

ensure_assets()
