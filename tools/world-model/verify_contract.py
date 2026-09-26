#!/usr/bin/env python3
import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
basic = json.loads((ROOT / "docs/examples/MCF-WORLD-MODEL-EXAMPLE-v0.1.json").read_text())
edge = json.loads((ROOT / "docs/examples/MCF-WORLD-MODEL-EDGE-CASES-v0.1.json").read_text())
projected = json.loads((ROOT / "docs/examples/MCF-WORLD-MODEL-PROJECTED-MISSION-v0.1.json").read_text())
schema = json.loads((ROOT / "docs/contracts/MCF-WORLD-MODEL-CONTRACT-v0.1.schema.json").read_text())

ALLOWED_FRESHNESS = {"FRESH", "STALE", "UNKNOWN"}
ALLOWED_TRUST = {
    "CANONICAL_SOURCE", "VERIFIED_EXTERNAL",
    "UNTRUSTED_EXTERNAL", "REPRESENTATIVE_FIXTURE",
    "PROJECTION_DERIVED"
}
ALLOWED_REL_MODE = {"EXPLICIT", "DERIVED", "INFERRED", "PROPOSED"}
SUPPORTED_PROJECTED_KINDS = {"mission", "context", "decision", "evidence", "action"}

def is_world_ref(x):
    return isinstance(x, dict) and {"id","kind","canonicalRef"}.issubset(x.keys())

def iter_refs(x):
    if is_world_ref(x):
        yield x
    if isinstance(x, dict):
        for v in x.values():
            yield from iter_refs(v)
    elif isinstance(x, list):
        for v in x:
            yield from iter_refs(v)

def verify_identity(data, name):
    by_key = {}
    by_id = {}
    count = 0
    for ref in iter_refs(data):
        count += 1
        key = (ref["kind"], ref["canonicalRef"])
        if key in by_key and by_key[key] != ref["id"]:
            raise AssertionError(f"{name}: same canonical identity has multiple world ids: {key}")
        if ref["id"] in by_id and by_id[ref["id"]] != key:
            raise AssertionError(f"{name}: same world id maps to multiple canonical identities: {ref['id']}")
        by_key[key] = ref["id"]
        by_id[ref["id"]] = key
    assert count > 0, f"{name}: no WorldRef found"
    return count

def verify_relation(r, name):
    assert r["freshness"] in ALLOWED_FRESHNESS
    assert r["trust"]["class"] in ALLOWED_TRUST
    mode = r["provenance"]["mode"]
    assert mode in ALLOWED_REL_MODE
    assert r["provenance"]["sourceRefs"], f"{name}: relation without source refs"
    if mode in {"INFERRED", "PROPOSED"}:
        assert r["trust"]["class"] != "CANONICAL_SOURCE", f"{name}: inferred/proposed relation masquerades as canonical"
    if mode == "INFERRED":
        assert r["provenance"].get("ruleId"), f"{name}: inferred relation lacks ruleId"

def verify_slice(data, name):
    assert data["schema"] == "world-context-slice/v1", name
    ref_count = verify_identity(data, name)

    entry_by_subject = {}
    for e in data["entries"]:
        assert e["freshness"] in ALLOWED_FRESHNESS
        assert e["trust"]["class"] in ALLOWED_TRUST
        assert e["provenance"]["sourceRefs"], f"{name}: entry without source refs"
        assert e["revision"]["source"] and e["revision"]["value"]
        entry_by_subject.setdefault(e["subject"]["id"], []).append(e)

    for r in data["relations"]:
        verify_relation(r, name)

    unknown_ids = {r["id"] for r in data["unknownRefs"]}
    stale_ids = {r["id"] for r in data["staleRefs"]}
    assert unknown_ids.isdisjoint(stale_ids), f"{name}: same ref cannot be UNKNOWN and STALE"

    for rid in unknown_ids:
        assert any(e["freshness"] == "UNKNOWN" for e in entry_by_subject.get(rid, [])), f"{name}: unknown ref lacks UNKNOWN entry"
    for rid in stale_ids:
        assert any(e["freshness"] == "STALE" for e in entry_by_subject.get(rid, [])), f"{name}: stale ref lacks STALE entry"

    return {
        "worldRefs": ref_count,
        "entries": len(data["entries"]),
        "relations": len(data["relations"]),
        "unknown": len(unknown_ids),
        "stale": len(stale_ids),
        "diagnostics": len(data.get("diagnostics", [])),
        "untrustedEntries": sum(e["trust"]["class"] == "UNTRUSTED_EXTERNAL" for e in data["entries"])
    }

def verify_projected_object(data, name):
    verify_identity(data, name)
    assert data["ref"]["kind"] in SUPPORTED_PROJECTED_KINDS
    assert data["freshness"] in ALLOWED_FRESHNESS
    assert data["trust"]["class"] in ALLOWED_TRUST
    assert data["revision"]["source"] and data["revision"]["value"]
    assert data["sourceRefs"]

def expect_identity_failure(data, label):
    try:
        verify_identity(data, label)
    except AssertionError:
        return
    raise AssertionError(f"{label}: expected identity failure was not detected")

assert schema["$id"] == "mcf-world-model-contract-v0.1"
assert "projectedObject" in schema["$defs"]

b = verify_slice(basic, "basic")
e = verify_slice(edge, "edge")
verify_projected_object(projected, "projected")

assert e["unknown"] >= 1
assert e["stale"] >= 1
assert e["diagnostics"] >= 1
assert e["untrustedEntries"] >= 1
assert any(r["provenance"]["mode"] == "INFERRED" for r in edge["relations"])
assert any(d["type"] == "SOURCE_CONFLICT" for d in edge["diagnostics"])

bad_key = copy.deepcopy(basic)
bad_key["relations"][0]["to"]["id"] = "mission:different-world-id"
expect_identity_failure(bad_key, "negative-same-key-different-id")

bad_id = copy.deepcopy(basic)
bad_id["relations"][0]["to"]["canonicalRef"] = "mcf://mission/DIFFERENT"
expect_identity_failure(bad_id, "negative-same-id-different-key")

bad_inference = copy.deepcopy(edge)
bad_inference["relations"][0]["trust"] = {"class": "CANONICAL_SOURCE"}
try:
    verify_slice(bad_inference, "negative-inferred-canonical")
except AssertionError:
    pass
else:
    raise AssertionError("negative-inferred-canonical: expected failure was not detected")

print("WORLD_MODEL_CONTRACT_VERIFY PASS")
print("basic", json.dumps(b, sort_keys=True))
print("edge", json.dumps(e, sort_keys=True))
print("negative_identity_tests PASS")
print("negative_inference_trust_test PASS")
