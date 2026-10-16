from __future__ import annotations

import os
import time
from dataclasses import dataclass
from typing import Protocol

from capability_tokens import CapabilityDenied
from security_guard import ConfusedDeputyGuard, SecretPolicy


class SecretProviderError(RuntimeError):
    pass


class SecretNotFound(SecretProviderError):
    pass


class SecretRevoked(SecretProviderError):
    pass


@dataclass(frozen=True)
class SecretRef:
    name: str
    version: str | None = None


@dataclass
class SecretLease:
    """Ephemeral secret buffer.

    The value is kept in a mutable bytearray so close() can overwrite it.
    No value should be journaled, serialized or placed in receipts.
    """

    ref: SecretRef
    provider: str
    _buffer: bytearray
    acquired_at: float
    expires_at: float | None
    closed: bool = False

    def reveal_text(self) -> str:
        if self.closed:
            raise SecretRevoked(f"secret lease {self.ref.name} is closed")
        if self.expires_at is not None and time.time() >= self.expires_at:
            self.close()
            raise SecretRevoked(f"secret lease {self.ref.name} expired")
        return bytes(self._buffer).decode("utf-8")

    def metadata(self) -> dict[str, str | float | None]:
        return {
            "name": self.ref.name,
            "version": self.ref.version,
            "provider": self.provider,
            "acquired_at": self.acquired_at,
            "expires_at": self.expires_at,
        }

    def close(self) -> None:
        if self.closed:
            return
        for i in range(len(self._buffer)):
            self._buffer[i] = 0
        self.closed = True

    def __enter__(self) -> "SecretLease":
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        self.close()


class SecretProvider(Protocol):
    name: str

    def acquire(self, ref: SecretRef, *, ttl_seconds: int | None = None) -> SecretLease:
        ...

    def revoke(self, ref: SecretRef) -> None:
        ...


class EnvSecretProvider:
    """Explicit env-name mapping; never arbitrary environment access."""

    name = "env"

    def __init__(self, mapping: dict[str, str]):
        self.mapping = dict(mapping)
        self.revoked: set[tuple[str, str | None]] = set()

    def acquire(self, ref: SecretRef, *, ttl_seconds: int | None = None) -> SecretLease:
        key = (ref.name, ref.version)
        if key in self.revoked:
            raise SecretRevoked(f"secret {ref.name} revoked")
        env_name = self.mapping.get(ref.name)
        if not env_name:
            raise SecretNotFound(f"no environment mapping for {ref.name}")
        value = os.environ.get(env_name)
        if value is None:
            raise SecretNotFound(f"mapped secret {ref.name} is unavailable")
        now = time.time()
        expires = None if ttl_seconds is None else now + int(ttl_seconds)
        return SecretLease(ref, self.name, bytearray(value.encode("utf-8")), now, expires)

    def revoke(self, ref: SecretRef) -> None:
        self.revoked.add((ref.name, ref.version))


class SecretBroker:
    """Policy-gated secret retrieval with metadata-only audit material."""

    def __init__(self, policy: SecretPolicy, providers: dict[str, SecretProvider]):
        self.policy = policy
        self.providers = dict(providers)

    def acquire(
        self,
        provider_name: str,
        ref: SecretRef,
        *,
        ttl_seconds: int | None = None,
    ) -> SecretLease:
        self.policy.authorize_reference(ref.name)
        provider = self.providers.get(provider_name)
        if provider is None:
            raise SecretProviderError(f"unknown secret provider {provider_name}")
        if ttl_seconds is not None and ttl_seconds <= 0:
            raise ValueError("ttl_seconds must be positive")
        return provider.acquire(ref, ttl_seconds=ttl_seconds)

    def revoke(self, provider_name: str, ref: SecretRef) -> None:
        self.policy.authorize_reference(ref.name)
        provider = self.providers.get(provider_name)
        if provider is None:
            raise SecretProviderError(f"unknown secret provider {provider_name}")
        provider.revoke(ref)

    def acquire_for_execution(
        self,
        provider_name: str,
        ref: SecretRef,
        *,
        issuer,
        token: str,
        agent_id: str,
        task_id: str,
        execution_id: str,
        execution: dict[str, object],
        ttl_seconds: int | None = None,
        now: float | None = None,
    ) -> SecretLease:
        capability = f"secret:{ref.name}"
        ConfusedDeputyGuard.authorize_tool_call(
            issuer,
            token,
            agent_id=agent_id,
            task_id=task_id,
            execution_id=execution_id,
            tool=capability,
            execution=execution,
            now=now,
        )
        return self.acquire(
            provider_name,
            ref,
            ttl_seconds=ttl_seconds,
        )

    @staticmethod
    def audit_metadata(lease: SecretLease) -> dict[str, object]:
        meta = lease.metadata()
        return {
            "schema": "mcf_secret_lease_metadata/v1",
            "secret": {
                "name": meta["name"],
                "version": meta["version"],
                "provider": meta["provider"],
            },
            "acquired_at": meta["acquired_at"],
            "expires_at": meta["expires_at"],
            "value_persisted": False,
        }
