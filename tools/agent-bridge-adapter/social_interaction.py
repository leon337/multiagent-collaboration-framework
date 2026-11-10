#!/usr/bin/env python3
"""Preflight and guarded single-action state machine for MCF social interactions.

This module NEVER sends actions to a live browser. A trusted runtime must inject
a write-authorized adapter and supply an externally validated capability.
"""
from __future__ import annotations

from dataclasses import dataclass
import datetime as dt
import fcntl
import hashlib
import hmac
import json
import time
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
    actor_id: str = ""

    def checked(self, *, require_actor: bool = False) -> "Action":
        if not re.fullmatch(r"[A-Za-z0-9_.]{1,64}", self.profile):
            raise InteractionBlocked("invalid_profile")
        validate_post_url(self.url, self.profile)
        if require_actor and not re.fullmatch(r"[A-Za-z0-9_.-]{3,80}", self.actor_id):
            raise InteractionBlocked("verified_actor_required")
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
            (self.actor_id + "|" + self.profile + "|" + normalized + "|" + self.kind).encode()
        ).hexdigest()


class SignedGrantVerifier:
    """Verifier only: the trusted MissionRuntime owns grant issuance and signing.

    Grants are scoped to a single actor, post, operation and exact comment.
    No grant minting, account login or browser action is exposed here.
    """
    SCHEMA = "mcf-social-action-grant/v1"

    def __init__(self, secret: bytes, *, audience: str = "mcf-social-executor",
                 now=None):
        if not isinstance(secret, bytes) or len(secret) < 32:
            raise InteractionBlocked("invalid_verifier_secret")
        self._secret = secret
        self._audience = audience
        self._now = now or time.time

    def verify(self, action: Action, grant: object) -> bool:
        if not isinstance(grant, dict):
            return False
        claims = grant.get("claims")
        signature = grant.get("signature")
        if not isinstance(claims, dict) or not isinstance(signature, str):
            return False
        if set(claims) != {
            "schema", "issuer", "audience", "actorId", "profile", "postUrl",
            "kind", "commentDigest", "expiresAt", "issuedAt", "nonce"
        }:
            return False
        now = self._now()
        issued = claims.get("issuedAt")
        expires = claims.get("expiresAt")
        if (type(issued) not in (int, float) or type(expires) not in (int, float)
                or issued > now + 10 or issued < now - 300
                or expires <= now or expires > issued + 300
                or not isinstance(claims.get("nonce"), str)
                or not re.fullmatch(r"[0-9a-f]{32}", claims["nonce"])):
            return False
        match = (
            claims["schema"] == self.SCHEMA
            and claims["issuer"] == "MCF-MissionRuntime"
            and claims["audience"] == self._audience
            and claims["actorId"] == action.actor_id
            and claims["profile"] == action.profile
            and claims["postUrl"] == validate_post_url(action.url, action.profile)
            and claims["kind"] == action.kind
            and claims["commentDigest"] == hashlib.sha256(
                (action.text or "").encode("utf-8")
            ).hexdigest()
        )
        if not match or not re.fullmatch(r"[0-9a-f]{64}", signature):
            return False
        canonical = json.dumps(claims, sort_keys=True, separators=(",", ":")).encode()
        expected = hmac.new(self._secret, canonical, hashlib.sha256).hexdigest()
        return hmac.compare_digest(signature, expected)


class ActionAdapter(Protocol):
    """Only an authorized MCF runtime may implement this interface."""
    def observe(self, action: Action) -> dict: ...
    def perform(self, action: Action, control: dict) -> None: ...


def confirmed_owned_comment(comments: object, action: Action) -> bool:
    """A draft, raw page text or third-party copy is not publishing evidence."""
    if not isinstance(comments, list):
        return False
    return any(
        isinstance(row, dict)
        and row.get("authorId") == action.actor_id
        and row.get("text") == action.text
        and row.get("published") is True
        for row in comments
    )


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
        if status not in {"PREPARED", "VERIFIED", "UNKNOWN"}:
            raise InteractionBlocked("invalid_journal_status")
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
                    "status": status, "at": dt.datetime.now(dt.timezone.utc).isoformat(),
                    "actorDigest": hashlib.sha256(action.actor_id.encode()).hexdigest(),
                    "target": validate_post_url(action.url, action.profile)}
            os.lseek(fd, 0, os.SEEK_END)
            os.write(fd, (json.dumps(item, ensure_ascii=False) + "\n").encode())
            os.fsync(fd)
        finally:
            fcntl.flock(fd, fcntl.LOCK_UN)
            os.close(fd)


def execute_one(action: Action, adapter: ActionAdapter, journal: ActionJournal,
                grant: object, verifier: SignedGrantVerifier) -> str:
    """Execute a single action only with a scoped, signed MissionRuntime grant.

    This core exposes no live browser writer and never mints its own grant.
    """
    action.checked(require_actor=True)
    if not isinstance(verifier, SignedGrantVerifier) or not verifier.verify(action, grant):
        raise InteractionBlocked("valid_runtime_grant_required")
    before = adapter.observe(action)
    if before.get("url", "").rstrip("/") != action.url.rstrip("/"):
        raise InteractionBlocked("wrong_page")
    if before.get("actorId") != action.actor_id:
        raise InteractionBlocked("authenticated_actor_mismatch")
    controls = control_preflight(before.get("accessibility", {}), action.url)
    if action.kind == "like" and controls["alreadyLiked"]:
        return "ALREADY_LIKED_NO_WRITE"
    if action.kind == "comment" and confirmed_owned_comment(before.get("ownComments"), action):
        return "ALREADY_COMMENTED_NO_WRITE"
    # Ensure ambiguity and policy failures happen BEFORE reservation.
    journal.record(action, "PREPARED")
    try:
        adapter.perform(action, controls)
        after = adapter.observe(action)
        if after.get("url", "").rstrip("/") != action.url.rstrip("/"):
            raise InteractionUncertain("post_action_wrong_page")
        if after.get("actorId") != action.actor_id:
            raise InteractionUncertain("post_action_actor_changed")
        if action.kind == "like":
            after_controls = control_preflight(after.get("accessibility", {}), action.url)
            verified = after.get("likedByMe") is True and after_controls["alreadyLiked"]
        else:
            verified = confirmed_owned_comment(after.get("ownComments"), action)
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
