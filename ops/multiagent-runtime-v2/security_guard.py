from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Any

from capability_tokens import CapabilityDenied


_SECRET_PATTERNS = [
    ("openai_key", re.compile(r"\bsk-[A-Za-z0-9_-]{16,}\b")),
    ("github_token", re.compile(r"\bgh[pousr]_[A-Za-z0-9]{20,}\b")),
    ("bearer_token", re.compile(r"(?i)\bBearer\s+[A-Za-z0-9._~+/=-]{12,}")),
    ("aws_access_key", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    ("private_key", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----")),
]

_INJECTION_PATTERNS = [
    re.compile(r"(?i)ignore\s+(?:all\s+)?(?:previous|prior)\s+instructions"),
    re.compile(r"(?i)system\s+message\s*[:=]"),
    re.compile(r"(?i)developer\s+message\s*[:=]"),
    re.compile(r"(?i)exfiltrat(?:e|ion)\b"),
    re.compile(r"(?i)send\s+(?:the\s+)?(?:secret|token|password|key)\b"),
]


@dataclass(frozen=True)
class SanitizedOutput:
    text: str
    redactions: tuple[str, ...]
    untrusted_instruction: bool
    truncated: bool


class ToolOutputSanitizer:
    def __init__(self, *, max_chars: int = 32768):
        if max_chars < 256:
            raise ValueError("max_chars too small")
        self.max_chars = int(max_chars)

    def sanitize_text(self, value: str) -> SanitizedOutput:
        text = str(value)
        redactions: list[str] = []
        for name, pattern in _SECRET_PATTERNS:
            if pattern.search(text):
                redactions.append(name)
                text = pattern.sub(f"[REDACTED:{name}]", text)

        untrusted = any(pattern.search(text) for pattern in _INJECTION_PATTERNS)
        if untrusted:
            text = "[UNTRUSTED_TOOL_OUTPUT]\n" + text

        truncated = len(text) > self.max_chars
        if truncated:
            text = text[: self.max_chars] + "\n[TRUNCATED]"

        return SanitizedOutput(
            text,
            tuple(sorted(set(redactions))),
            untrusted,
            truncated,
        )

    def sanitize(self, value: Any) -> dict[str, Any]:
        if not isinstance(value, str):
            value = json.dumps(value, ensure_ascii=False, sort_keys=True)
        result = self.sanitize_text(value)
        return {
            "value": result.text,
            "redactions": list(result.redactions),
            "untrusted_instruction": result.untrusted_instruction,
            "truncated": result.truncated,
        }


class SecretPolicy:
    """Allow secret identifiers, never embed secret values in capability state."""

    def __init__(self, allowed_secret_names: set[str] | None = None):
        self.allowed_secret_names = set(allowed_secret_names or set())

    def authorize_reference(self, secret_name: str) -> None:
        if secret_name not in self.allowed_secret_names:
            raise CapabilityDenied(f"secret reference {secret_name} not allowed")


class ConfusedDeputyGuard:
    @staticmethod
    def authorize_tool_call(
        issuer,
        token: str,
        *,
        agent_id: str,
        task_id: str,
        execution_id: str,
        tool: str,
        execution: dict[str, Any],
        now: float | None = None,
    ) -> dict[str, Any]:
        claims = issuer.verify(token, tool=tool, now=now)

        if claims.get("agent_id") != agent_id or claims.get("task_id") != task_id:
            raise CapabilityDenied("capability principal/scope mismatch")
        if execution.get("execution_id") != execution_id:
            raise CapabilityDenied("execution id mismatch")
        if execution.get("agent_id") != agent_id or execution.get("task_id") != task_id:
            raise CapabilityDenied("execution ownership mismatch")
        if execution.get("status") not in {"running", "active"}:
            raise CapabilityDenied("execution is not active")

        return claims
