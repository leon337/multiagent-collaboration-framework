from __future__ import annotations

import base64
import hashlib
import json
import os
import time
import urllib.error
import urllib.request
import uuid
from dataclasses import dataclass
from typing import Any, Protocol

from capability_tokens import CapabilityDenied, CapabilityIssuer
from runtime import MissionRuntime


TOOL_NAME = "cognitive_memory_write"
RECEIPT_SCHEMA = "mcf_cognitive_memory_receipt/v1"


class CognitiveMemoryError(RuntimeError):
    pass


class ConfirmationRequired(CognitiveMemoryError):
    pass


class ProviderWriteError(CognitiveMemoryError):
    pass


class ReadBackVerificationError(CognitiveMemoryError):
    pass


class CognitiveLedgerProvider(Protocol):
    name: str

    def write(
        self,
        *,
        event: dict[str, Any],
        sources: list[dict[str, Any]],
        relations: list[dict[str, Any]],
    ) -> dict[str, Any]:
        ...

    def read_back(self, event_id: str) -> dict[str, Any] | None:
        ...


def _canonical(value: Any) -> str:
    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )


def _sha(value: Any) -> str:
    return hashlib.sha256(_canonical(value).encode("utf-8")).hexdigest()


def _require_event(event: dict[str, Any]) -> None:
    required = ("id", "timestamp", "tipo", "titulo", "resumo")
    missing = [
        key
        for key in required
        if not isinstance(event.get(key), str) or not event[key].strip()
    ]
    if missing:
        raise ValueError(f"memory event missing required fields: {missing}")


@dataclass(frozen=True)
class MemoryWriteReceipt:
    schema: str
    receipt_id: str
    mission_id: str
    execution_id: str
    agent_id: str
    task_id: str
    event_id: str
    provider: str
    provider_status: str
    event_sha256: str
    read_back_sha256: str
    source_count: int
    relation_count: int
    read_back_verified: bool
    created_at: float
    receipt_sha256: str

    def as_dict(self) -> dict[str, Any]:
        return dict(self.__dict__)


class LegacyHttpCognitiveLedgerProvider:
    """Adapter for the existing Basic-auth /registros + /timeline boundary.

    Credentials are never returned, journaled or placed in receipts.
    """

    name = "cognitive-ledger-legacy-http"

    def __init__(
        self,
        base_url: str,
        username: str,
        password: str,
        *,
        timeout_seconds: float = 15.0,
    ):
        if not base_url.startswith(("https://", "http://")):
            raise ValueError("base_url must be http(s)")
        if not username or not password:
            raise ValueError("username and password are required")
        self.base_url = base_url.rstrip("/")
        self._auth = base64.b64encode(
            f"{username}:{password}".encode("utf-8")
        ).decode("ascii")
        self.timeout_seconds = float(timeout_seconds)

    @classmethod
    def from_env(cls) -> "LegacyHttpCognitiveLedgerProvider":
        required = {
            "COGNITIVE_LEDGER_API_URL": os.getenv("COGNITIVE_LEDGER_API_URL"),
            "COGNITIVE_LEDGER_BASIC_USER": os.getenv(
                "COGNITIVE_LEDGER_BASIC_USER"
            ),
            "COGNITIVE_LEDGER_BASIC_PASSWORD": os.getenv(
                "COGNITIVE_LEDGER_BASIC_PASSWORD"
            ),
        }
        missing = [key for key, value in required.items() if not value]
        if missing:
            raise CognitiveMemoryError(
                f"missing Cognitive Ledger provider settings: {missing}"
            )
        return cls(
            required["COGNITIVE_LEDGER_API_URL"] or "",
            required["COGNITIVE_LEDGER_BASIC_USER"] or "",
            required["COGNITIVE_LEDGER_BASIC_PASSWORD"] or "",
        )

    def _request(
        self,
        method: str,
        path: str,
        body: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        data = None
        headers = {
            "Authorization": f"Basic {self._auth}",
            "Accept": "application/json",
        }
        if body is not None:
            data = json.dumps(body, ensure_ascii=False).encode("utf-8")
            headers["Content-Type"] = "application/json"
        req = urllib.request.Request(
            f"{self.base_url}{path}",
            data=data,
            headers=headers,
            method=method,
        )
        try:
            with urllib.request.urlopen(
                req,
                timeout=self.timeout_seconds,
            ) as response:
                raw = response.read().decode("utf-8")
                return json.loads(raw or "{}")
        except urllib.error.HTTPError as exc:
            payload = exc.read().decode("utf-8", errors="replace")
            raise ProviderWriteError(
                f"provider HTTP {exc.code}: {payload[:400]}"
            ) from exc
        except (urllib.error.URLError, TimeoutError) as exc:
            raise ProviderWriteError(
                f"provider unavailable: {type(exc).__name__}"
            ) from exc

    def write(
        self,
        *,
        event: dict[str, Any],
        sources: list[dict[str, Any]],
        relations: list[dict[str, Any]],
    ) -> dict[str, Any]:
        return self._request(
            "POST",
            "/registros",
            {
                "evento": event,
                "fontes": sources,
                "relacoes": relations,
            },
        )

    def read_back(self, event_id: str) -> dict[str, Any] | None:
        timeline = self._request("GET", "/timeline")
        records = timeline.get("registros", [])
        for record in records if isinstance(records, list) else []:
            if isinstance(record, dict) and record.get("id") == event_id:
                return record
        return None


class MachineTokenCognitiveLedgerProvider:
    """MCF-specific machine boundary exposed by the private Ledger service."""

    name = "cognitive-ledger-mcf-proxy"

    def __init__(
        self,
        base_url: str,
        token: str,
        *,
        timeout_seconds: float = 15.0,
    ):
        if not base_url.startswith(("https://", "http://")):
            raise ValueError("base_url must be http(s)")
        if not token:
            raise ValueError("machine token is required")
        self.base_url = base_url.rstrip("/")
        self._token = token
        self.timeout_seconds = float(timeout_seconds)

    @classmethod
    def from_env(cls) -> "MachineTokenCognitiveLedgerProvider":
        base_url = os.getenv("COGNITIVE_LEDGER_MCF_URL")
        token = os.getenv("COGNITIVE_LEDGER_MCF_TOKEN")
        missing = []
        if not base_url:
            missing.append("COGNITIVE_LEDGER_MCF_URL")
        if not token:
            missing.append("COGNITIVE_LEDGER_MCF_TOKEN")
        if missing:
            raise CognitiveMemoryError(
                f"missing Cognitive Ledger MCF settings: {missing}"
            )
        return cls(base_url or "", token or "")

    def _request(
        self,
        method: str,
        path: str,
        body: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        data = None
        headers = {
            "Authorization": f"Bearer {self._token}",
            "Accept": "application/json",
        }
        if body is not None:
            data = json.dumps(body, ensure_ascii=False).encode("utf-8")
            headers["Content-Type"] = "application/json"
        req = urllib.request.Request(
            f"{self.base_url}{path}",
            data=data,
            headers=headers,
            method=method,
        )
        try:
            with urllib.request.urlopen(
                req,
                timeout=self.timeout_seconds,
            ) as response:
                raw = response.read().decode("utf-8")
                return json.loads(raw or "{}")
        except urllib.error.HTTPError as exc:
            payload = exc.read().decode("utf-8", errors="replace")
            raise ProviderWriteError(
                f"provider HTTP {exc.code}: {payload[:400]}"
            ) from exc
        except (urllib.error.URLError, TimeoutError) as exc:
            raise ProviderWriteError(
                f"provider unavailable: {type(exc).__name__}"
            ) from exc

    def write(
        self,
        *,
        event: dict[str, Any],
        sources: list[dict[str, Any]],
        relations: list[dict[str, Any]],
    ) -> dict[str, Any]:
        return self._request(
            "POST",
            "/internal/mcf-memory/registros",
            {
                "evento": event,
                "fontes": sources,
                "relacoes": relations,
            },
        )

    def read_back(self, event_id: str) -> dict[str, Any] | None:
        timeline = self._request(
            "GET",
            "/internal/mcf-memory/timeline",
        )
        records = timeline.get("registros", [])
        for record in records if isinstance(records, list) else []:
            if isinstance(record, dict) and record.get("id") == event_id:
                return record
        return None


class CognitiveMemoryCapability:
    def __init__(
        self,
        *,
        runtime: MissionRuntime,
        issuer: CapabilityIssuer,
        provider: CognitiveLedgerProvider,
    ):
        self.runtime = runtime
        self.issuer = issuer
        self.provider = provider

    def write(
        self,
        *,
        token: str,
        execution_id: str,
        agent_id: str,
        task_id: str,
        event: dict[str, Any],
        sources: list[dict[str, Any]] | None = None,
        relations: list[dict[str, Any]] | None = None,
        confirmed: bool,
        actor: str,
        call_id: str | None = None,
        now: float | None = None,
    ) -> MemoryWriteReceipt:
        if not confirmed:
            raise ConfirmationRequired(
                "cognitive memory write requires explicit confirmation"
            )
        _require_event(event)
        sources = list(sources or [])
        relations = list(relations or [])

        claims = self.issuer.verify(token, tool=TOOL_NAME, now=now)
        if claims["agent_id"] != agent_id or claims["task_id"] != task_id:
            raise CapabilityDenied("memory capability scope mismatch")

        execution = self.runtime.projection().executions.get(execution_id)
        if execution is None:
            raise CognitiveMemoryError("unknown execution")
        if execution["status"] != "running":
            raise CognitiveMemoryError("execution is not running")
        if (
            execution["agent_id"] != agent_id
            or execution["task_id"] != task_id
        ):
            raise CapabilityDenied("execution scope mismatch")

        call_id = call_id or str(uuid.uuid4())
        args_material = {
            "event": event,
            "sources": sources,
            "relations": relations,
            "confirmed": True,
        }
        self.runtime.request_tool(
            call_id,
            execution_id,
            TOOL_NAME,
            _sha(args_material),
            actor,
        )

        try:
            provider_result = self.provider.write(
                event=event,
                sources=sources,
                relations=relations,
            )
            provider_status = str(provider_result.get("status") or "")
            if provider_status not in {"criado", "existente"}:
                raise ProviderWriteError(
                    f"unexpected provider status: {provider_status!r}"
                )

            read_back = self.provider.read_back(event["id"])
            if read_back is None:
                raise ReadBackVerificationError(
                    "memory event not found during read-back"
                )
            if str(read_back.get("id")) != event["id"]:
                raise ReadBackVerificationError("read-back id mismatch")
            for key in ("titulo", "resumo"):
                if (
                    key in read_back
                    and str(read_back.get(key)) != str(event.get(key))
                ):
                    raise ReadBackVerificationError(
                        f"read-back field mismatch: {key}"
                    )

            created_at = float(time.time() if now is None else now)
            material = {
                "schema": RECEIPT_SCHEMA,
                "receipt_id": str(uuid.uuid4()),
                "mission_id": self.runtime.mission_id,
                "execution_id": execution_id,
                "agent_id": agent_id,
                "task_id": task_id,
                "event_id": event["id"],
                "provider": self.provider.name,
                "provider_status": provider_status,
                "event_sha256": _sha(event),
                "read_back_sha256": _sha(read_back),
                "source_count": len(sources),
                "relation_count": len(relations),
                "read_back_verified": True,
                "created_at": created_at,
            }
            receipt_sha256 = _sha(material)
            receipt = MemoryWriteReceipt(
                **material,
                receipt_sha256=receipt_sha256,
            )
            self.runtime.finish_tool(
                call_id,
                actor,
                success=True,
                result_sha256=receipt_sha256,
            )
            return receipt
        except Exception as exc:
            self.runtime.finish_tool(
                call_id,
                actor,
                success=False,
                error_class=type(exc).__name__,
            )
            raise
