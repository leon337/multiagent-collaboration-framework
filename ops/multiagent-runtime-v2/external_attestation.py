from __future__ import annotations

import hashlib
import json
import time
from typing import Any

ATTESTATION_SCHEMA = "mcf_external_attestation/v1"
PUBLICATION_SCHEMA = "mcf_external_anchor_publication/v1"


class AttestationError(RuntimeError):
    pass


def _canonical(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def _sha(value: Any) -> str:
    return hashlib.sha256(_canonical(value).encode("utf-8")).hexdigest()


def build_attestation(
    *,
    mission_id: str,
    authority_id: str,
    source_commit: str,
    artifact_sha256: str,
    assertions: dict[str, Any] | None = None,
    created_at: float | None = None,
) -> dict[str, Any]:
    if len(str(source_commit)) < 7:
        raise AttestationError("source_commit is required")
    if len(str(artifact_sha256)) != 64:
        raise AttestationError("artifact_sha256 must be a SHA-256 hex digest")

    material = {
        "schema": ATTESTATION_SCHEMA,
        "mission_id": mission_id,
        "authority_id": authority_id,
        "source_commit": source_commit,
        "artifact_sha256": artifact_sha256,
        "assertions": dict(assertions or {}),
        "created_at": float(time.time() if created_at is None else created_at),
    }
    return {**material, "attestation_sha256": _sha(material)}


def validate_attestation(attestation: dict[str, Any]) -> dict[str, Any]:
    material = dict(attestation)
    claimed = material.pop("attestation_sha256", None)
    if material.get("schema") != ATTESTATION_SCHEMA:
        raise AttestationError("unsupported attestation schema")
    if claimed != _sha(material):
        raise AttestationError("attestation digest mismatch")
    return attestation


def build_publication_receipt(
    attestation: dict[str, Any],
    *,
    provider: str,
    remote_ref: str,
    published_at: float | None = None,
) -> dict[str, Any]:
    validate_attestation(attestation)
    if not provider or not remote_ref:
        raise AttestationError("provider and remote_ref are required")

    material = {
        "schema": PUBLICATION_SCHEMA,
        "provider": provider,
        "remote_ref": remote_ref,
        "attestation_sha256": attestation["attestation_sha256"],
        "source_commit": attestation["source_commit"],
        "published_at": float(time.time() if published_at is None else published_at),
        "immutability_claimed": False,
    }
    return {**material, "publication_sha256": _sha(material)}


def validate_publication_receipt(
    attestation: dict[str, Any],
    receipt: dict[str, Any],
) -> dict[str, Any]:
    validate_attestation(attestation)
    material = dict(receipt)
    claimed = material.pop("publication_sha256", None)
    if material.get("schema") != PUBLICATION_SCHEMA:
        raise AttestationError("unsupported publication schema")
    if claimed != _sha(material):
        raise AttestationError("publication receipt digest mismatch")
    if receipt.get("attestation_sha256") != attestation.get("attestation_sha256"):
        raise AttestationError("publication does not reference this attestation")
    if receipt.get("source_commit") != attestation.get("source_commit"):
        raise AttestationError("publication source commit mismatch")
    if receipt.get("immutability_claimed") is not False:
        raise AttestationError("mutable provider cannot be labeled immutable")
    return receipt
