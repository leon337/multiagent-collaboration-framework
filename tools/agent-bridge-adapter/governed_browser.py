#!/usr/bin/env python3
"""MCF local governed browser mission executor.

Bounded semantic planner for PUBLIC navigation only. Never clicks buttons, fills
forms, authenticates, publishes, executes JS, or sends a ChatGPT message.
"""
from __future__ import annotations

from contextlib import contextmanager
import datetime as dt
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import sys
import time
from urllib.parse import urlsplit
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from bridge_adapter import BridgeClient, BridgeError, load_descriptor, receipt

SCHEMA = "mcf-governed-browser-mission/v1"
ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]{0,79}$")
HOST = re.compile(r"^[a-z0-9](?:[a-z0-9.-]{0,251}[a-z0-9])?$")
DENIED = re.compile(
    r"(login|log.in|sign.in|sign.up|register|checkout|pay|purchase|delete|remove|"
    r"publish|post|submit|account|password|settings|admin|token|logout)", re.I,
)
MAX_STEPS = 8
STATE_DIR = Path.home() / ".local" / "state" / "mcf-agent-bridge" / "missions"


class MissionBlocked(Exception):
    pass


def utc() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat()


def digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def validate_url(raw: object, hosts: list[str]) -> str:
    if not isinstance(raw, str) or len(raw) > 2048:
        raise MissionBlocked("invalid_target_url")
    try:
        u = urlsplit(raw)
        if (u.scheme != "https" or u.username or u.password or u.port not in (None, 443)
                or not u.hostname or u.hostname.lower() not in hosts or u.query or u.fragment):
            raise MissionBlocked("url_outside_explicit_public_scope")
        if u.hostname.lower() in ("localhost",) or (
                u.hostname.lower().startswith(("127.", "0.", "10.", "192.168.", "169.254.", "172."))
                or not HOST.fullmatch(u.hostname.lower()) or "." not in u.hostname):
            raise MissionBlocked("private_or_invalid_hostname")
        if DENIED.search(u.path):
            raise MissionBlocked("sensitive_route_requires_human_gate")
    except ValueError as exc:
        raise MissionBlocked("invalid_target_url") from exc
    return raw


def validated_config(config: object) -> dict:
    if not isinstance(config, dict):
        raise MissionBlocked("invalid_mission")
    mission_id = config.get("missionId")
    instance = config.get("instanceId")
    objective = config.get("objective")
    hosts = config.get("allowedHosts")
    waypoints = config.get("waypoints")
    max_steps = config.get("maxSteps", 6)
    if not isinstance(mission_id, str) or not ID.fullmatch(mission_id):
        raise MissionBlocked("invalid_mission_id")
    if not isinstance(instance, str) or not ID.fullmatch(instance):
        raise MissionBlocked("invalid_instance")
    if not isinstance(objective, str) or not 4 <= len(objective) <= 400:
        raise MissionBlocked("invalid_objective")
    if (not isinstance(hosts, list) or not hosts or len(hosts) > 4
            or any(not isinstance(h, str) or h != h.lower()
                   or not HOST.fullmatch(h) or "." not in h for h in hosts)
            or len(set(hosts)) != len(hosts)):
        raise MissionBlocked("invalid_allowed_hosts")
    if (not isinstance(waypoints, list) or not waypoints or len(waypoints) > MAX_STEPS
            or any(not isinstance(x, str) or not 2 <= len(x.strip()) <= 100
                   or DENIED.search(x) for x in waypoints)):
        raise MissionBlocked("unsafe_or_invalid_waypoints")
    if type(max_steps) is not int or max_steps < len(waypoints) + 1 or max_steps > MAX_STEPS:
        raise MissionBlocked("invalid_step_budget")
    if config.get("authorizedScope") is not True:
        raise MissionBlocked("authorized_scope_required")
    if set(config) - {
        "missionId", "instanceId", "objective", "startUrl", "allowedHosts",
        "waypoints", "maxSteps", "authorizedScope", "restoreWorkspace"
    }:
        raise MissionBlocked("unknown_mission_fields")
    start = validate_url(config.get("startUrl"), hosts)
    if config.get("restoreWorkspace", True) is not True:
        raise MissionBlocked("workspace_restore_required")
    return {
        "missionId": mission_id, "instanceId": instance, "objective": objective,
        "allowedHosts": hosts, "startUrl": start, "waypoints": waypoints,
        "maxSteps": max_steps, "authorizedScope": True, "restoreWorkspace": True,
    }


def route(client: BridgeClient, method: str, endpoint: str, body: dict | None = None) -> dict:
    d = load_descriptor(client.instance, client.home)
    req = Request(
        "http://127.0.0.1:%d%s" % (d["port"], endpoint),
        data=json.dumps(body).encode() if body is not None else None,
        headers={
            "Authorization": "Bearer " + d["token"],
            "X-MCF-Instance": client.instance,
            "Content-Type": "application/json",
        },
        method=method,
    )
    try:
        with urlopen(req, timeout=12) as response:
            if response.headers.get("X-MCF-Instance") != client.instance:
                raise MissionBlocked("bridge_instance_response_mismatch")
            raw = response.read(2_000_001)
            if len(raw) > 2_000_000:
                raise MissionBlocked("bridge_payload_too_large")
            result = json.loads(raw)
            if result.get("ok") is not True:
                raise MissionBlocked("bridge_response_not_ok")
            return result
    except HTTPError as exc:
        if exc.code == 409:
            raise MissionBlocked("human_gate_or_recovery_checkpoint_required") from exc
        raise MissionBlocked("bridge_http_error_%s" % exc.code) from exc
    except (URLError, TimeoutError, OSError, ValueError) as exc:
        raise MissionBlocked("bridge_transport_failure") from exc


def guarded(client: BridgeClient) -> dict:
    discovery = client.discovery()["discovery"]
    inst = discovery["instance"]
    if inst.get("paused") or inst.get("busy") or inst.get("queueDepth"):
        raise MissionBlocked("bridge_not_idle")
    checkpoint = route(client, "GET", "/v1/recovery-checkpoint?pane=workspace")
    if checkpoint.get("recoveryRequired") or checkpoint.get("mutationAllowed") is not True:
        raise MissionBlocked("human_gate_or_recovery_checkpoint_required")
    return route(client, "GET", "/v1/state?pane=workspace")["state"]


def stable(client: BridgeClient, expected: str) -> dict:
    deadline = time.monotonic() + 14
    last = None
    while time.monotonic() < deadline:
        last = route(client, "GET", "/v1/state?pane=workspace")["state"]
        if last.get("url") == expected and last.get("loading") is False:
            return last
        time.sleep(0.3)
    raise MissionBlocked("navigation_not_verified")


def page_evidence(client: BridgeClient, expected_url: str) -> dict:
    state = stable(client, expected_url)
    result = client.read("text")["page"]
    if result.get("url") != expected_url or not isinstance(result.get("text"), str):
        raise MissionBlocked("page_identity_changed_during_observation")
    text = result["text"]
    if not text.strip():
        raise MissionBlocked("empty_page_content")
    return {
        "url": expected_url, "title": state.get("title", ""),
        "textLength": len(text), "textDigest": hashlib.sha256(text.encode()).hexdigest(),
        "observedAt": utc(),
    }


def select_link(client: BridgeClient, label: str, hosts: list[str], current_url: str) -> str:
    page = client.read("interactive")["page"]
    if page.get("url") != current_url:
        raise MissionBlocked("page_identity_changed_during_link_resolution")
    nodes = page.get("nodes")
    if not isinstance(nodes, list):
        raise MissionBlocked("invalid_semantic_snapshot")
    # Exact semantic label required, no arbitrary first-match or coordinate fallback.
    candidates = [
        n for n in nodes if isinstance(n, dict) and n.get("tag") == "a"
        and str(n.get("text") or "").strip().casefold() == label.strip().casefold()
        and isinstance(n.get("href"), str)
    ]
    permitted = []
    for candidate in candidates:
        try:
            permitted.append(validate_url(candidate["href"], hosts))
        except MissionBlocked:
            # An out-of-scope documentation/footer link is never actionable.
            continue
    # Multiple visible links to the very same URL are semantically equivalent.
    # Different destinations remain ambiguous and fail-closed.
    distinct = sorted(set(permitted))
    if len(distinct) != 1:
        raise MissionBlocked("semantic_target_ambiguous_or_missing")
    return distinct[0]


@contextmanager
def exclusive_mission(base: Path, mission_id: str, instance: str):
    base.mkdir(mode=0o700, parents=True, exist_ok=True)
    os.chmod(base, 0o700)
    locks = [base / ("workspace-" + instance + ".lock"), base / (mission_id + ".lock")]
    descriptors = []
    try:
        for lock in locks:
            fd = os.open(lock, os.O_CREAT | os.O_RDWR | getattr(os, "O_NOFOLLOW", 0), 0o600)
            descriptors.append(fd)
            try:
                fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError as exc:
                raise MissionBlocked("workspace_or_mission_already_running") from exc
        yield base / (mission_id + ".json")
    finally:
        for fd in reversed(descriptors):
            try:
                fcntl.flock(fd, fcntl.LOCK_UN)
            finally:
                os.close(fd)


def checkpoint_write(path: Path, state: dict):
    tmp = path.with_suffix(".tmp.%d" % os.getpid())
    fd = os.open(tmp, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    try:
        data = (json.dumps(state, ensure_ascii=False, indent=2) + "\n").encode()
        os.write(fd, data)
        os.fsync(fd)
    finally:
        os.close(fd)
    os.replace(tmp, path)
    dirfd = os.open(path.parent, os.O_RDONLY)
    try:
        os.fsync(dirfd)
    finally:
        os.close(dirfd)


def checkpoint_read(path: Path) -> dict:
    if not path.exists():
        return {}
    st = path.lstat()
    if not stat.S_ISREG(st.st_mode) or st.st_uid != os.getuid() or st.st_mode & 0o077:
        raise MissionBlocked("checkpoint_file_permissions_invalid")
    return json.loads(path.read_text())


def record(state: dict, kind: str, **details: object):
    state["events"].append({"kind": kind, "at": utc(), **details})


def navigate(client: BridgeClient, state: dict, checkpoint: Path,
             target: str, step_number: int) -> dict:
    current = guarded(client)
    if current.get("pane") != "workspace":
        raise MissionBlocked("workspace_identity_mismatch")
    state["inFlight"] = {"step": step_number, "url": target}
    record(state, "NAVIGATION_PLANNED", step=step_number, url=target)
    checkpoint_write(checkpoint, state)
    if current.get("url") != target:
        route(client, "POST", "/v1/navigate", {"pane": "workspace", "url": target})
    observed = page_evidence(client, target)
    record(state, "NAVIGATION_VERIFIED", step=step_number, **observed)
    state["completedSteps"] = step_number + 1
    state["inFlight"] = None
    checkpoint_write(checkpoint, state)
    return observed


def run(config: dict, base: Path = STATE_DIR) -> dict:
    cfg = validated_config(config)
    client = BridgeClient(cfg["instanceId"])
    with exclusive_mission(base, cfg["missionId"], cfg["instanceId"]) as checkpoint:
        previous = checkpoint_read(checkpoint)
        if previous:
            if previous.get("configDigest") != digest(cfg):
                raise MissionBlocked("mission_config_conflict")
            if previous.get("status") == "COMPLETED":
                return summarise(previous)
            if previous.get("status") not in (
                    "RECOVERING", "RUNNING", "SUCCEEDED_PENDING_RESTORE"):
                raise MissionBlocked("mission_checkpoint_requires_reconciliation")
            state = previous
            # A previous run may have restored the user's page. New work must
            # reverify restoration rather than trust a stale boolean.
            state["restored"] = False
            checkpoint_write(checkpoint, state)
        else:
            state = {
                "schema": SCHEMA, "missionId": cfg["missionId"],
                "instanceId": cfg["instanceId"], "configDigest": digest(cfg),
                "status": "RUNNING", "completedSteps": 0,
                "inFlight": None, "events": [], "restored": False,
            }
            checkpoint_write(checkpoint, state)
        try:
            observation = guarded(client)
            if not state.get("originalUrl"):
                state["originalUrl"] = observation.get("url")
                if not isinstance(state["originalUrl"], str):
                    raise MissionBlocked("missing_original_workspace_url")
                checkpoint_write(checkpoint, state)
            steps = state["completedSteps"]
            if state.get("inFlight"):
                flight = state["inFlight"]
                current = route(client, "GET", "/v1/state?pane=workspace")["state"]
                if current.get("url") != flight["url"] or current.get("loading"):
                    raise MissionBlocked("uncertain_inflight_navigation_human_review")
                observed = page_evidence(client, flight["url"])
                record(state, "NAVIGATION_VERIFIED",
                       step=flight["step"], recovered=True, **observed)
                steps = flight["step"] + 1
                state["completedSteps"] = steps
                state["inFlight"] = None
                checkpoint_write(checkpoint, state)
            if steps > cfg["maxSteps"]:
                raise MissionBlocked("step_budget_exceeded")
            if steps > 0:
                verified = [event for event in state["events"]
                            if event.get("kind") in
                            ("NAVIGATION_VERIFIED", "NAVIGATION_RECOVERED_BY_OBSERVATION")]
                if not verified or verified[-1].get("step") != steps - 1:
                    raise MissionBlocked("checkpoint_missing_verified_step")
                last = validate_url(verified[-1]["url"], cfg["allowedHosts"])
                now = guarded(client)
                if now.get("url") != last:
                    # Reopen a previously verified public GET page; never blindly
                    # replay an in-flight/unknown action or submit a form.
                    route(client, "POST", "/v1/navigate", {"pane": "workspace", "url": last})
                    observed = page_evidence(client, last)
                    record(state, "RECOVERY_REOPENED_VERIFIED", **observed)
                    checkpoint_write(checkpoint, state)
            else:
                navigate(client, state, checkpoint, cfg["startUrl"], 0)
                steps = 1
            for i in range(max(0, steps - 1), len(cfg["waypoints"])):
                if i + 1 >= cfg["maxSteps"]:
                    raise MissionBlocked("step_budget_exceeded")
                s = guarded(client)
                candidate = select_link(client, cfg["waypoints"][i], cfg["allowedHosts"], s["url"])
                if candidate == s.get("url"):
                    raise MissionBlocked("planner_navigation_cycle")
                record(state, "SEMANTIC_PLAN", step=i + 1,
                       targetLabel=cfg["waypoints"][i], url=candidate)
                checkpoint_write(checkpoint, state)
                navigate(client, state, checkpoint, candidate, i + 1)
            state.pop("lastError", None)
            state["status"] = "SUCCEEDED_PENDING_RESTORE"
        except (MissionBlocked, BridgeError) as exc:
            state["status"] = "RECOVERING"
            state["lastError"] = str(exc)
            record(state, "BLOCKED", error=str(exc))
        finally:
            original = state.get("originalUrl")
            if original:
                try:
                    # Restore precisely the originally observed URL. No proxy exposure.
                    u = urlsplit(original)
                    if u.scheme != "https" or not u.hostname or u.username or u.password:
                        raise MissionBlocked("unsafe_original_workspace_url")
                    current = guarded(client)
                    if current.get("url") != original:
                        route(client, "POST", "/v1/navigate",
                              {"pane": "workspace", "url": original})
                    stable(client, original)
                    state["restored"] = True
                    record(state, "WORKSPACE_RESTORED")
                except (MissionBlocked, BridgeError) as exc:
                    state["status"] = "RECOVERING"
                    state["lastError"] = "restore_failed_" + str(exc)
                    record(state, "RESTORE_BLOCKED", reason=str(exc))
            if state.get("status") == "SUCCEEDED_PENDING_RESTORE":
                state["status"] = "COMPLETED" if state.get("restored") else "RECOVERING"
            checkpoint_write(checkpoint, state)
            receipt(client.instance, "governed-mission", state["status"] == "COMPLETED",
                    state.get("lastError"), home=client.home)
        return summarise(state)


def summarise(state: dict) -> dict:
    return {
        "schema": SCHEMA, "missionId": state["missionId"],
        "instanceId": state["instanceId"],
        "status": state["status"],
        "verified": state["status"] == "COMPLETED" and state.get("restored") is True,
        "completedSteps": state.get("completedSteps", 0),
        "restored": state.get("restored", False),
        "evidenceDigest": digest(state["events"]),
        "failureCode": state.get("lastError"),
        "events": state["events"],
    }


if __name__ == "__main__":
    try:
        payload = json.load(sys.stdin)
        result = run(payload)
        print(json.dumps(result, ensure_ascii=False))
        raise SystemExit(0 if result["verified"] else 2)
    except (MissionBlocked, BridgeError, ValueError, KeyError, TypeError) as exc:
        print(json.dumps({"schema": SCHEMA, "verified": False,
                          "status": "BLOCKED", "failureCode": str(exc)}))
        raise SystemExit(2)
