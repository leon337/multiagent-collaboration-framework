from __future__ import annotations

import hashlib
import json
import time
import uuid
from dataclasses import asdict, dataclass
from typing import Any

SCHEMA = "mcf_receipt/v1"
VALID_STATUS = {"PASS", "FAIL", "BLOCKED", "CANCELLED"}


class ReceiptError(ValueError):
    pass


def _canonical(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def _sha(value: Any) -> str:
    return hashlib.sha256(_canonical(value).encode("utf-8")).hexdigest()


@dataclass(frozen=True)
class Receipt:
    schema: str
    receipt_id: str
    mission_id: str
    task_id: str
    execution_id: str
    actor_id: str
    status: str
    result_sha256: str | None
    evidence_refs: tuple[str, ...]
    resource_usage: dict[str, Any]
    correlation_id: str | None
    created_at: float
    receipt_sha256: str

    def material(self) -> dict[str, Any]:
        result = asdict(self)
        result["evidence_refs"] = list(self.evidence_refs)
        result.pop("receipt_sha256")
        return result


def make_receipt(
    *,
    mission_id: str,
    task_id: str,
    execution_id: str,
    actor_id: str,
    status: str,
    result: Any | None = None,
    evidence_refs: list[str] | tuple[str, ...] = (),
    resource_usage: dict[str, Any] | None = None,
    correlation_id: str | None = None,
    created_at: float | None = None,
    receipt_id: str | None = None,
) -> Receipt:
    status = str(status).upper()
    if status not in VALID_STATUS:
        raise ReceiptError("invalid receipt status")

    refs = tuple(str(ref) for ref in evidence_refs if str(ref))
    if status == "PASS" and not refs:
        raise ReceiptError("PASS receipt requires at least one evidence reference")

    material = {
        "schema": SCHEMA,
        "receipt_id": receipt_id or str(uuid.uuid4()),
        "mission_id": mission_id,
        "task_id": task_id,
        "execution_id": execution_id,
        "actor_id": actor_id,
        "status": status,
        "result_sha256": None if result is None else _sha(result),
        "evidence_refs": list(refs),
        "resource_usage": dict(resource_usage or {}),
        "correlation_id": correlation_id,
        "created_at": float(time.time() if created_at is None else created_at),
    }
    return Receipt(
        **material,
        evidence_refs=refs,
        receipt_sha256=_sha(material),
    )


def validate_receipt(receipt: Receipt | dict[str, Any]) -> Receipt:
    if isinstance(receipt, dict):
        data = dict(receipt)
        data["evidence_refs"] = tuple(data.get("evidence_refs", ()))
        receipt = Receipt(**data)

    if receipt.schema != SCHEMA or receipt.status not in VALID_STATUS:
        raise ReceiptError("unsupported receipt schema/status")
    if receipt.status == "PASS" and not receipt.evidence_refs:
        raise ReceiptError("PASS receipt missing evidence")
    if _sha(receipt.material()) != receipt.receipt_sha256:
        raise ReceiptError("receipt digest mismatch")
    return receipt
