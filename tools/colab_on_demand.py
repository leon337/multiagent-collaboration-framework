#!/usr/bin/env python3
"""Experimental manual, single-shot Colab CLI adapter; never a persistent worker.

Mission MCF-COLAB-20261104. No auth changes, no auto-retries, no daemon.
Colab managed runtimes with zero compute-unit balance must not be used
as distributed compute workers. Use only user-initiated, limited experiments.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time

SESSION_RE = re.compile(r"^[a-z][a-z0-9-]{2,48}$")
MAX_RUNTIME_SECONDS = 120
MAX_WAIT_SECONDS = 240


def _invoke(argv: list[str], wait: int) -> subprocess.CompletedProcess[str]:
    return subprocess.run(argv, text=True, capture_output=True, timeout=wait, check=False)


def run_once(script: Path, session: str, *, gpu: bool = False,
             timeout: int = 60, output: Path | None = None,
             invoke=_invoke) -> dict:
    """Run one explicit experiment; always attempt remote session cleanup."""
    script = script.expanduser().resolve(strict=True)
    if not script.is_file() or script.suffix != ".py":
        raise ValueError("Script must be an existing .py file")
    if not SESSION_RE.fullmatch(session):
        raise ValueError("Session must match ^[a-z][a-z0-9-]{2,48}$")
    if not 1 <= timeout <= MAX_RUNTIME_SECONDS:
        raise ValueError(f"Timeout must be 1..{MAX_RUNTIME_SECONDS} seconds")
    if output is not None and output.exists():
        raise FileExistsError("Output path already exists; never overwrite evidence")

    cmd = ["colab", "run", "--session", session, "--timeout", str(timeout)]
    if gpu:
        cmd += ["--gpu", "T4"]
    cmd.append(str(script))
    started = time.time()
    primary = None
    problem = None
    cleanup = None
    try:
        primary = invoke(cmd, MAX_WAIT_SECONDS)
    except (OSError, subprocess.TimeoutExpired) as exc:
        problem = f"{type(exc).__name__}: execution interrupted"
    finally:
        # Safe even when 'colab run' already finalized the session.
        # Never retry the remote computation itself.
        try:
            cleanup = invoke(["colab", "stop", "--session", session], 25)
        except (OSError, subprocess.TimeoutExpired):
            cleanup = None

    # Do not persist stdout/stderr: user scripts may print sensitive values.
    receipt = {
        "schema": "mcf-colab-on-demand/v1",
        "mission": "MCF-COLAB-20261104",
        "mode": "manual-single-shot",
        "session": session,
        "accelerator_requested": "T4" if gpu else "CPU",
        "duration_seconds": round(time.time() - started, 2),
        "run_exit_code": primary.returncode if primary else None,
        "run_completed": primary is not None and primary.returncode == 0,
        "cleanup_attempted": True,
        "cleanup_exit_code": cleanup.returncode if cleanup else None,
        "cleanup_confirmed": cleanup is not None and cleanup.returncode == 0,
        "exception_type": problem,
        "script_name": script.name,
        "stdout": primary.stdout[-12000:] if primary else "",
        "stderr": primary.stderr[-2000:] if primary else "",
    }
    if output is not None:
        output.parent.mkdir(parents=True, exist_ok=True)
        flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
        fd = os.open(output, flags, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            json.dump({k: v for k, v in receipt.items() if k not in ("stdout", "stderr")},
                      stream, ensure_ascii=False, indent=2)
            stream.write("\n")
    return receipt


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("script", type=Path)
    parser.add_argument("--session", required=True)
    parser.add_argument("--gpu-t4", action="store_true")
    parser.add_argument("--timeout", type=int, default=60)
    parser.add_argument("--receipt", type=Path)
    args = parser.parse_args()
    try:
        outcome = run_once(args.script, args.session, gpu=args.gpu_t4,
                           timeout=args.timeout, output=args.receipt)
    except (ValueError, OSError, FileNotFoundError) as exc:
        print(f"Invalid experiment: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 2
    # stdout is available to the caller only, never written into receipts.
    print(outcome["stdout"], end="")
    if outcome["stderr"]:
        print(outcome["stderr"], end="", file=sys.stderr)
    print(json.dumps({k: v for k, v in outcome.items()
                      if k not in ("stdout", "stderr")}, ensure_ascii=False))
    return 0 if outcome["run_completed"] and outcome["cleanup_confirmed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
