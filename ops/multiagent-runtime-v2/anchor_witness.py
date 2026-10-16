from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass, asdict
from typing import Any
from urllib.parse import urlparse

WITNESS_SCHEMA = "mcf_public_anchor_witness/v1"


class WitnessError(RuntimeError):
    pass


def _canonical(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def anchor_sha256(anchor: dict[str, Any]) -> str:
    return hashlib.sha256(_canonical(anchor).encode("utf-8")).hexdigest()


@dataclass(frozen=True)
class PublicWitness:
    schema: str
    provider: str
    publication_id: str
    publication_uri: str
    published_at: str
    mission_id: str
    anchor_id: str
    anchor_sha256: str
    commit_sha: str | None
    immutable_claimed: bool
    witness_strength: str

    def as_dict(self) -> dict[str, Any]:
        return asdict(self)


def build_witness(
    anchor: dict[str, Any],
    *,
    provider: str,
    publication_id: str,
    publication_uri: str,
    published_at: str,
    commit_sha: str | None = None,
    immutable_claimed: bool = False,
) -> PublicWitness:
    required = {
        "schema",
        "anchor_id",
        "mission_id",
        "journal_chain_head",
        "snapshot_sha256",
        "hmac_sha256",
    }
    missing = sorted(required.difference(anchor))
    if missing:
        raise WitnessError(f"anchor missing fields: {', '.join(missing)}")
    if not provider or not publication_id or not published_at:
        raise WitnessError("provider, publication_id and published_at are required")

    parsed = urlparse(publication_uri)
    if parsed.scheme not in {"https", "http"} or not parsed.netloc:
        raise WitnessError("publication_uri must be an absolute http(s) URL")

    if immutable_claimed:
        raise WitnessError(
            "immutable witness claims require a provider-specific verifier; "
            "generic public witnesses must declare immutable_claimed=false"
        )

    return PublicWitness(
        schema=WITNESS_SCHEMA,
        provider=provider,
        publication_id=publication_id,
        publication_uri=publication_uri,
        published_at=published_at,
        mission_id=str(anchor["mission_id"]),
        anchor_id=str(anchor["anchor_id"]),
        anchor_sha256=anchor_sha256(anchor),
        commit_sha=commit_sha,
        immutable_claimed=False,
        witness_strength="public_timestamped_reference",
    )


def verify_witness(anchor: dict[str, Any], witness: PublicWitness | dict[str, Any]) -> dict[str, Any]:
    if isinstance(witness, dict):
        witness = PublicWitness(**witness)
    if witness.schema != WITNESS_SCHEMA:
        raise WitnessError("unsupported witness schema")
    if witness.immutable_claimed:
        raise WitnessError("generic verifier refuses immutable witness claims")
    if witness.mission_id != str(anchor.get("mission_id")):
        raise WitnessError("witness mission mismatch")
    if witness.anchor_id != str(anchor.get("anchor_id")):
        raise WitnessError("witness anchor id mismatch")
    expected = anchor_sha256(anchor)
    if witness.anchor_sha256 != expected:
        raise WitnessError("witness anchor digest mismatch")
    parsed = urlparse(witness.publication_uri)
    if parsed.scheme not in {"https", "http"} or not parsed.netloc:
        raise WitnessError("invalid publication URI")
    return {
        "ok": True,
        "provider": witness.provider,
        "publication_id": witness.publication_id,
        "anchor_sha256": expected,
        "immutable_claimed": False,
        "witness_strength": witness.witness_strength,
    }
