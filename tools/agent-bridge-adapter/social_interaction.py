#!/usr/bin/env python3
"""Preflight and guarded single-action state machine for MCF social interactions.

This module NEVER sends actions to a live browser. A trusted runtime must inject
a write-authorized adapter and supply an externally validated capability.
"""
from __future__ import annotations

from dataclasses import dataclass
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import stat
from typing import Protocol
from urllib.parse import urlsplit

SCHEMA = "mcf-social-interaction/v1"
POST_PATH = re.compile(r"^/([a-zA-Z0-9_.]+)/(?:(reel|p))/([a-zA-Z0-9_-]+)/?$")
ALLOWED_KINDS = frozenset({"like", "comment"})


class InteractionBlocked(Exception):
    """No side effects were authorized or safe to begin."""


class InteractionUncertain(Exception):
    """An action may have occurred; never retry without reconciliation."""


def validate_post_url(url: str, profile: str) -> str:
    if not isinstance(url, str) or len(url) > 300:
        raise InteractionBlocked("invalid_post_url")
    parts = urlsplit(url)
    found = POST_PATH.fullmatch(parts.path)
    if (parts.scheme != "https" or parts.netloc != "www.instagram.com"
            or parts.username or parts.password or parts.query or parts.fragment
            or not found or found.group(1) != profile):
        raise InteractionBlocked("post_outside_target_profile")
    return "https://www.instagram.com" + parts.path.rstrip("/") + "/"


def control_preflight(ax: dict, expected_url: str) -> dict:
    """Resolve primary post buttons by nearby semantic controls, not text alone.

    Comment likes appear next to Responder, not next to Comentar + Compartilhar.
    Ambiguous or missing post controls fail closed.
    """
    if ax.get("ok") is not True or not isinstance(ax.get("nodes"), list):
        raise InteractionBlocked("accessibility_unavailable")
    nodes = [
        n for n in ax["nodes"]
        if n.get("frameUrl", "").split("?")[0].rstrip("/") == expected_url.rstrip("/")
        and n.get("ignored") is not True
    ]
    candidates = []
    for i, n in enumerate(nodes):
        if n.get("role") != "button" or n.get("name") not in ("Curtir", "Descurtir"):
            continue
        next_buttons = [
            x.get("name") for x in nodes[i + 1:i + 8] if x.get("role") == "button"
        ]
        # Both controls must be near the primary post button, in proper order.
        if "Comentar" not in next_buttons or "Compartilhar" not in next_buttons:
            continue
        if next_buttons.index("Comentar") >= next_buttons.index("Compartilhar"):
            continue
        candidates.append(n)
    if len(candidates) != 1:
        raise InteractionBlocked("primary_like_ambiguous_or_missing")
    editors = [
        n for n in nodes if n.get("role") == "textbox"
        and n.get("name") == "Adicione um comentário..."
        and n.get("properties", {}).get("readonly") is False
    ]
    if len(editors) != 1:
        raise InteractionBlocked("comment_editor_ambiguous_or_missing")
    return {
        "primaryLikeNode": candidates[0]["id"],
        "alreadyLiked": candidates[0]["name"] == "Descurtir",
        "commentEditorNode": editors[0]["id"],
        "frameUrl": expected_url,
        "commentLikeButtons": sum(
            1 for n in nodes
            if n.get("role") == "button" and n.get("name") == "Curtir"
        ) - (candidates[0]["name"] == "Curtir"),
    }


@dataclass(frozen=True)
class Action:
    profile: str
    url: str
    kind: str
    text: str | None = None

    def checked(self) -> "Action":
        if not re.fullmatch(r"[A-Za-z0-9_.]{1,64}", self.profile):
            raise InteractionBlocked("invalid_profile")
        validate_post_url(self.url, self.profile)
        if self.kind not in ALLOWED_KINDS:
            raise InteractionBlocked("unsupported_action")
        if self.kind == "comment":
            if (not isinstance(self.text, str) or not 8 <= len(self.text.strip()) <= 240
                    or "\n" in self.text):
                raise InteractionBlocked("invalid_comment")
        elif self.text is not None:
            raise InteractionBlocked("like_must_not_include_comment")
        return self

    @property
    def key(self) -> str:
        self.checked()
        normalized = validate_post_url(self.url, self.profile)
        return hashlib.sha256(
            (self.profile + "|" + normalized + "|" + self.kind).encode()
        ).hexdigest()


class ActionAdapter(Protocol):
    """Only an authorized MCF runtime may implement this interface."""
    def observe(self, action: Action) -> dict: ...
    def perform(self, action: Action, control: dict) -> None: ...


class ActionJournal:
    """Single-writer 0600 receipt store; never retries an unknown action."""
    def __init__(self, path: Path):
        self.path = path

    def _open(self):
        self.path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        os.chmod(self.path.parent, 0o700)
        flags = os.O_RDWR | os.O_CREAT
        if hasattr(os, "O_NOFOLLOW"):
            flags |= os.O_NOFOLLOW
        fd = os.open(self.path, flags, 0o600)
        meta = os.fstat(fd)
        if meta.st_uid != os.getuid() or stat.S_IMODE(meta.st_mode) != 0o600:
            os.close(fd)
            raise InteractionBlocked("journal_ownership_or_permissions")
        fcntl.flock(fd, fcntl.LOCK_EX)
        return fd

    def record(self, action: Action, status: str) -> None:
        fd = self._open()
        try:
            raw = os.read(fd, 2_000_001)
            if len(raw) > 2_000_000:
                raise InteractionBlocked("journal_too_large")
            entries = [json.loads(row) for row in raw.decode().splitlines() if row.strip()]
            current = [x for x in entries if x.get("key") == action.key]
            if status == "PREPARED" and current:
                raise InteractionBlocked("action_already_attempted_reconcile_first")
            if status != "PREPARED":
                if not current or current[-1].get("status") != "PREPARED":
                    raise InteractionBlocked("invalid_action_transition")
            item = {"schema": SCHEMA, "key": action.key, "kind": action.kind,
                    "status": status, "target": validate_post_url(action.url, action.profile)}
            os.lseek(fd, 0, os.SEEK_END)
            os.write(fd, (json.dumps(item, ensure_ascii=False) + "\n").encode())
            os.fsync(fd)
        finally:
            fcntl.flock(fd, fcntl.LOCK_UN)
            os.close(fd)


def execute_one(action: Action, adapter: ActionAdapter, journal: ActionJournal,
                capability_valid: bool) -> str:
    """A single user-scoped action, not a bulk runner.

    Runtime must validate scope/capability separately. No token is minted here.
    """
    action.checked()
    if capability_valid is not True:
        raise InteractionBlocked("runtime_write_capability_required")
    before = adapter.observe(action)
    if before.get("url", "").rstrip("/") != action.url.rstrip("/"):
        raise InteractionBlocked("wrong_page")
    controls = control_preflight(before.get("accessibility", {}), action.url)
    if action.kind == "like" and controls["alreadyLiked"]:
        return "ALREADY_LIKED_NO_WRITE"
    if action.kind == "comment" and action.text in before.get("ownComments", []):
        return "ALREADY_COMMENTED_NO_WRITE"
    # Ensure ambiguity and policy failures happen BEFORE reservation.
    journal.record(action, "PREPARED")
    try:
        adapter.perform(action, controls)
        after = adapter.observe(action)
        if after.get("url", "").rstrip("/") != action.url.rstrip("/"):
            raise InteractionUncertain("post_action_wrong_page")
        if action.kind == "like":
            after_controls = control_preflight(after.get("accessibility", {}), action.url)
            verified = after.get("likedByMe") is True and after_controls["alreadyLiked"]
        else:
            verified = bool(action.text in after.get("ownComments", []))
        if not verified:
            raise InteractionUncertain("postcondition_not_verified")
    except Exception as exc:
        journal.record(action, "UNKNOWN")
        raise InteractionUncertain("action_outcome_unknown") from exc
    journal.record(action, "VERIFIED")
    return "VERIFIED"


def build_review_plan(source: dict, profile: str) -> dict:
    if not isinstance(source, dict) or not isinstance(source.get("acoes"), list):
        raise InteractionBlocked("invalid_source_plan")
    entries = []
    unique = set()
    for item in source["acoes"]:
        url = validate_post_url(item["url"], profile)
        if url in unique:
            raise InteractionBlocked("duplicate_post_url")
        unique.add(url)
        comment = item.get("acao_comentar", {}).get("texto_sugerido")
        if comment is not None:
            Action(profile, url, "comment", comment).checked()
        entries.append({"url": url, "comment": comment, "like": "PENDING",
                        "commentStatus": "DRAFT" if comment else "NEEDS_VISUAL_REVIEW"})
    return {"schema": SCHEMA, "profile": profile, "writeEnabled": False,
            "total": len(entries), "actions": entries}
