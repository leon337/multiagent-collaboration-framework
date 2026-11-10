#!/usr/bin/env python3
"""MCF social interaction read-only diagnostics and review plan CLI.

Commands deliberately do not dispatch likes, comments, clicks or form submissions.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

from bridge_adapter import BridgeClient, BridgeError
from social_interaction import (
    InteractionBlocked, build_review_plan, control_preflight, validate_post_url,
)


def parse_args():
    parser = argparse.ArgumentParser(description="MCF social interaction preflight")
    sub = parser.add_subparsers(dest="command", required=True)
    diag = sub.add_parser("diagnose", help="Inspect a single open Instagram post (read-only)")
    diag.add_argument("--instance", required=True)
    diag.add_argument("--profile", required=True)
    diag.add_argument("--url", required=True)
    plan = sub.add_parser("plan", help="Validate existing per-post drafts (no writes)")
    plan.add_argument("--profile", required=True)
    plan.add_argument("--source", type=Path, required=True)
    plan.add_argument("--output", type=Path)
    return parser.parse_args()


def diagnose(instance: str, profile: str, url: str) -> dict:
    target = validate_post_url(url, profile)
    client = BridgeClient(instance)
    client.discovery()
    state = client.read("state").get("state", {})
    if state.get("instanceId") != instance or state.get("loading") is not False:
        raise InteractionBlocked("instance_unavailable_or_loading")
    if (state.get("url") or "").rstrip("/") != target.rstrip("/"):
        raise InteractionBlocked("expected_post_not_open")
    ax = client.read("accessibility")
    controls = control_preflight(ax, target)
    return {
        "ok": True, "schema": "mcf-social-preflight-result/v1",
        "instanceId": instance, "url": target,
        "primaryLikeNode": controls["primaryLikeNode"],
        "alreadyLiked": controls["alreadyLiked"],
        "commentEditorPresent": bool(controls["commentEditorNode"]),
        "commentLikeButtonsIgnored": controls["commentLikeButtons"],
        "writeAllowed": False, "status": "OBSERVATION_ONLY",
    }


def main() -> int:
    args = parse_args()
    try:
        if args.command == "diagnose":
            result = diagnose(args.instance, args.profile, args.url)
        else:
            if args.source.stat().st_size > 2_000_000:
                raise InteractionBlocked("source_too_large")
            source = json.loads(args.source.read_text(encoding="utf-8"))
            result = build_review_plan(source, args.profile)
            if args.output:
                # No overwrite: review plans are immutable, and never authoritative gates.
                import os
                fd = os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
                with os.fdopen(fd, "w", encoding="utf-8") as f:
                    json.dump(result, f, ensure_ascii=False, indent=2)
                    f.write("\n")
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    except (BridgeError, InteractionBlocked, OSError, ValueError, KeyError) as exc:
        print(json.dumps({"ok": False, "error": str(exc), "writeAllowed": False}))
        return 2


if __name__ == "__main__":
    sys.exit(main())
