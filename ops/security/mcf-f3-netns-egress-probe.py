#!/usr/bin/env python3
"""MCF F3: verify fail-closed deny-all network namespace on a Linux test host.

No remote connection is attempted from the host. The child is created with
unshare -Urn, cannot access host loopback and has no network route. This is
NOT a production public-HTTPS egress policy or DNS rebinding defense.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import sys
import time


def network_namespace() -> str:
    return os.readlink("/proc/self/ns/net")


def attempt_connection(label: str, host: str, port: int, family: int) -> dict:
    start = time.monotonic()
    try:
        sock = socket.socket(family, socket.SOCK_STREAM)
    except OSError as exc:
        return {"check": label, "result": "UNSUPPORTED", "errno": exc.errno}
    try:
        sock.settimeout(0.65)
        sock.connect((host, port))
        return {"check": label, "result": "CONNECTED_UNSAFE"}
    except OSError as exc:
        return {"check": label, "result": "BLOCKED", "errno": exc.errno,
                "elapsed_ms": round((time.monotonic() - start) * 1000)}
    finally:
        sock.close()


def child(port: int, host_ns: str) -> int:
    checks = [
        attempt_connection("host_loopback_ipv4", "127.0.0.1", port, socket.AF_INET),
        attempt_connection("metadata_link_local_ipv4", "169.254.169.254", 80, socket.AF_INET),
        attempt_connection("private_ipv4", "10.15.15.15", 443, socket.AF_INET),
        attempt_connection("public_ipv4", "1.1.1.1", 443, socket.AF_INET),
        attempt_connection("host_loopback_ipv6", "::1", port, socket.AF_INET6),
    ]
    child_ns = network_namespace()
    separated = child_ns != host_ns
    good = separated and all(c["result"] == "BLOCKED" for c in checks if
                             c["check"] != "host_loopback_ipv6")
    good = good and all(c["result"] != "CONNECTED_UNSAFE" for c in checks)
    out = {"schema": "mcf-netns-egress-probe/v1", "mode": "deny_all_only",
           "namespace_separated": separated, "host_namespace": host_ns,
           "child_namespace": child_ns, "checks": checks,
           "passed": bool(good), "public_https_navigation_supported": False,
           "ssrf_dns_rebinding_protection_qualified": False,
           "hdf_identity_qualified": False}
    print(json.dumps(out, sort_keys=True))
    return 0 if good else 1


def parent() -> int:
    if sys.platform != "linux" or not shutil.which("unshare"):
        print(json.dumps({"passed": False, "status": "UNSUPPORTED_HOST"}))
        return 2
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as listener:
        listener.bind(("127.0.0.1", 0))
        listener.listen(1)
        listener.setblocking(False)
        port = listener.getsockname()[1]
        command = ["unshare", "-Urn", sys.executable, str(Path(__file__).resolve()),
                   "--probe-child", "--port", str(port), "--host-ns", network_namespace()]
        try:
            run = subprocess.run(command, capture_output=True, text=True,
                                 timeout=12, check=False)
        except subprocess.TimeoutExpired:
            print(json.dumps({"passed": False, "status": "CHILD_TIMEOUT"}))
            return 3
        if run.returncode != 0:
            print(json.dumps({"passed": False, "status": "NAMESPACE_FAILED",
                              "exit_code": run.returncode,
                              "stderr": run.stderr[:220]}))
            return 4
        try:
            record = json.loads(run.stdout.strip().splitlines()[-1])
        except (ValueError, IndexError):
            print(json.dumps({"passed": False, "status": "NO_PROBE_RESULT"}))
            return 5
        try:
            unexpected, _ = listener.accept()
            unexpected.close()
            record["host_listener_received_connection"] = True
        except BlockingIOError:
            record["host_listener_received_connection"] = False
        record["passed"] = record["passed"] and not record["host_listener_received_connection"]
        record["execution_surface"] = "LINUX_USER_NETWORK_NAMESPACE"
        record["physical_microphone_tested"] = False
        print(json.dumps(record, sort_keys=True, indent=2))
        return 0 if record["passed"] else 6


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--probe-child", action="store_true")
    p.add_argument("--port", type=int, default=0)
    p.add_argument("--host-ns", default="")
    args = p.parse_args()
    if args.probe_child:
        if not 1 <= args.port <= 65535 or not args.host_ns.startswith("net:["):
            raise SystemExit("invalid child probe arguments")
        raise SystemExit(child(args.port, args.host_ns))
    raise SystemExit(parent())
