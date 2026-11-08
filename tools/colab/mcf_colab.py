#!/usr/bin/env python3
"""MCF: one-shot Google Colab jobs with explicit compute and scope gates."""
from __future__ import annotations
import argparse
import datetime as dt
import fcntl
import json
import os
from pathlib import Path
import shutil
import stat
import subprocess
import time
from uuid import uuid4

ROOT = Path(__file__).resolve().parent
JOBS = {"smoke": ROOT / "jobs" / "smoke.py", "torch-gpu-probe": ROOT / "jobs" / "torch_gpu_probe.py"}
AUTH = Path.home() / ".config" / "colab-cli" / "token.json"
STATE = Path.home() / ".local" / "state" / "mcf-colab"

class Blocked(Exception):
    pass

def token_state():
    if not AUTH.exists():
        return "HUMAN_OAUTH_REQUIRED"
    s = AUTH.lstat()
    if not stat.S_ISREG(s.st_mode) or s.st_uid != os.getuid() or s.st_mode & 0o077:
        return "UNSAFE_TOKEN_PERMISSIONS"
    return "PRESENT_NOT_VERIFIED" if s.st_size else "EMPTY_TOKEN"

def safe_job(job):
    p = JOBS.get(job)
    if p is None or p.is_symlink() or not p.is_file():
        raise Blocked("only_fixed_public_synthetic_jobs_allowed")
    s = p.stat()
    if s.st_uid != os.getuid() or s.st_mode & 0o022 or s.st_size > 128000:
        raise Blocked("unsafe_job_file")
    if not p.resolve().is_relative_to(ROOT.resolve()):
        raise Blocked("job_path_escape")
    return str(p.resolve())

def make_plan(job, gpu):
    script = safe_job(job)
    if gpu not in (None, "T4"):
        raise Blocked("accelerator_not_allowed")
    if job == "torch-gpu-probe" and gpu != "T4":
        raise Blocked("gpu_probe_requires_T4")
    if job == "smoke" and gpu is not None:
        raise Blocked("cpu_smoke_does_not_need_gpu")
    return {
        "schema": "mcf-colab-offload/v1",
        "job": job, "script": script, "accelerator": gpu or "CPU",
        "computeApprovalRequired": True, "acceleratorApprovalRequired": bool(gpu),
        "publicSyntheticOnly": True, "autoStop": True,
        "auth": token_state(), "cli": bool(shutil.which("colab")),
        "executed": False,
    }

def execute(job, gpu, approve_compute, approve_accelerator):
    plan = make_plan(job, gpu)
    if not approve_compute:
        raise Blocked("explicit_compute_approval_required")
    if gpu and not approve_accelerator:
        raise Blocked("explicit_accelerator_approval_required")
    binary = shutil.which("colab")
    if not binary:
        raise Blocked("colab_not_installed")
    if token_state() != "PRESENT_NOT_VERIFIED":
        raise Blocked("oauth_human_gate_required_or_unsafe_token")
    cfg = AUTH.parent
    cfg.mkdir(mode=0o700, parents=True, exist_ok=True)
    os.chmod(cfg, 0o700)
    STATE.mkdir(mode=0o700, parents=True, exist_ok=True)
    os.chmod(STATE, 0o700)
    session = "mcf-" + uuid4().hex[:14]
    started = dt.datetime.now(dt.timezone.utc).isoformat()
    before = time.monotonic()
    out = STATE / (session + "-stdout.log")
    err = STATE / (session + "-stderr.log")
    command = [
        binary, "--auth", "oauth2", "--config",
        str(STATE / (session + "-state.json")),
        "run", "-s", session, "--timeout", "90",
    ]
    if gpu:
        command += ["--gpu", gpu]
    command += [plan["script"]]
    # Lock one MCF-managed Colab VM at a time to bound consumption.
    lock_fd = os.open(STATE / "compute.lock", os.O_CREAT | os.O_RDWR, 0o600)
    try:
        try:
            fcntl.flock(lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as exc:
            raise Blocked("another_colab_job_is_active") from exc
        # No shell, arbitrary uploads, environment forwarding, or --keep.
        with out.open("x") as stdout, err.open("x") as stderr:
            result = subprocess.run(
                command, check=False, stdin=subprocess.DEVNULL,
                stdout=stdout, stderr=stderr, env={
                    "PATH": os.environ.get("PATH", "/usr/bin:/bin"),
                    "HOME": str(Path.home()), "LANG": "C.UTF-8",
                },
            )
    finally:
        fcntl.flock(lock_fd, fcntl.LOCK_UN)
        os.close(lock_fd)
    receipt = {
        "schema": plan["schema"], "session": session, "job": job,
        "accelerator": plan["accelerator"], "startedAt": started,
        "elapsedSeconds": round(time.monotonic() - before, 2),
        "exitCode": result.returncode, "completed": result.returncode == 0,
        "autoStopRequested": True, "remoteStopIndependentlyVerified": False,
        "stdout": str(out), "stderr": str(err),
    }
    rp = STATE / (session + "-receipt.json")
    rp.write_text(json.dumps(receipt, indent=2) + "\n")
    os.chmod(rp, 0o600)
    return receipt

def main(argv=None):
    os.umask(0o077)
    parser = argparse.ArgumentParser(description="MCF Colab guarded remote execution")
    sub = parser.add_subparsers(dest="action", required=True)
    sub.add_parser("doctor")
    p = sub.add_parser("plan")
    p.add_argument("job", choices=sorted(JOBS))
    p.add_argument("--gpu", choices=["T4"])
    r = sub.add_parser("run")
    r.add_argument("job", choices=sorted(JOBS))
    r.add_argument("--gpu", choices=["T4"])
    r.add_argument("--approve-compute", action="store_true")
    r.add_argument("--approve-accelerator", action="store_true")
    args = parser.parse_args(argv)
    try:
        if args.action == "doctor":
            result = {
                "cliInstalled": bool(shutil.which("colab")),
                "auth": token_state(), "availableJobs": sorted(JOBS),
                "remoteExecutionVerified": False,
            }
        elif args.action == "plan":
            result = make_plan(args.job, args.gpu)
        else:
            result = execute(args.job, args.gpu, args.approve_compute,
                             args.approve_accelerator)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0 if args.action != "run" or result["completed"] else 2
    except Blocked as exc:
        print(json.dumps({"status": "BLOCKED", "reason": str(exc)}))
        return 2

if __name__ == "__main__":
    raise SystemExit(main())
