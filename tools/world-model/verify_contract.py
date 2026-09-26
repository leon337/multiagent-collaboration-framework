#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
basic = json.loads((ROOT / "docs/examples/MCF-WORLD-MODEL-EXAMPLE-v0.1.json").read_text())
edge = json.loads((ROOT / "docs/examples/MCF-WORLD-MODEL-EDGE-CASES-v0.1.json").read_text())
schema = json.loads((ROOT / "docs/contracts/MCF-WORLD-MODEL-CONTRACT-v0.1.schema.json").read_text())

ALLOWED_FRESHNESS = {"FRESH", "STALE", "UNKNOWN"}
ALLOWED_TRUST = {
    "CANONICAL_SOURCE", "VERIFIED_EXTERNAL",
    "UNTRUSTED_EXTERNAL", "REPRESENTATIVE_FIXTURE"
}
ALLOWED_REL_MODE = {"EXPLICIT", "DERIVED", "INFERRED", "PROPOSED"}

def ref_key(ref):
    return (ref["kind"], ref["canonicalRef"])

def verify_slice(data, name):
    assert data["schema"] == "world-context-slice/v1", name
    refs = {}
    for ref in list(data.get("focus", [])) + list(data.get("unknownRefs", [])) + list(data.get("staleRefs", [])):
        k = ref_key(ref)
        if k in refs:
            assert refs[k] == ref["id"], f"{name}: nondeterministic id for {k}"
        refs[k] = ref["id"]

    entry_by_subject = {}
    for e in data["entries"]:
        assert e["freshness"] in ALLOWED_FRESHNESS
        assert e["trust"]["class"] in ALLOWED_TRUST
        assert e["provenance"]["sourceRefs"], f"{name}: entry without source refs"
        assert e["revision"]["source"] and e["revision"]["value"]
        entry_by_subject.setdefault(e["subject"]["id"], []).append(e)

    for r in data["relations"]:
        assert r["freshness"] in ALLOWED_FRESHNESS
        assert r["trust"]["class"] in ALLOWED_TRUST
        assert r["provenance"]["mode"] in ALLOWED_REL_MODE
        assert r["provenance"]["sourceRefs"], f"{name}: relation without source refs"

    unknown_ids = {r["id"] for r in data["unknownRefs"]}
    stale_ids = {r["id"] for r in data["staleRefs"]}
    assert unknown_ids.isdisjoint(stale_ids), f"{name}: same ref cannot be UNKNOWN and STALE"

    for rid in unknown_ids:
        assert any(e["freshness"] == "UNKNOWN" for e in entry_by_subject.get(rid, [])), f"{name}: unknown ref lacks UNKNOWN entry"
    for rid in stale_ids:
        assert any(e["freshness"] == "STALE" for e in entry_by_subject.get(rid, [])), f"{name}: stale ref lacks STALE entry"

    inferred = [r for r in data["relations"] if r["provenance"]["mode"] in {"INFERRED", "PROPOSED"}]
    for r in inferred:
        assert r["provenance"].get("ruleId") or r["provenance"]["mode"] == "PROPOSED", f"{name}: inferred relation lacks ruleId"

    return {
        "entries": len(data["entries"]),
        "relations": len(data["relations"]),
        "unknown": len(unknown_ids),
        "stale": len(stale_ids),
        "diagnostics": len(data.get("diagnostics", [])),
        "untrustedEntries": sum(e["trust"]["class"] == "UNTRUSTED_EXTERNAL" for e in data["entries"])
    }

assert schema["$id"] == "mcf-world-model-contract-v0.1"
b = verify_slice(basic, "basic")
e = verify_slice(edge, "edge")
assert e["unknown"] >= 1
assert e["stale"] >= 1
assert e["diagnostics"] >= 1
assert e["untrustedEntries"] >= 1
assert any(r["provenance"]["mode"] == "INFERRED" for r in edge["relations"])
assert any(d["type"] == "SOURCE_CONFLICT" for d in edge["diagnostics"])

print("WORLD_MODEL_CONTRACT_VERIFY PASS")
print("basic", json.dumps(b, sort_keys=True))
print("edge", json.dumps(e, sort_keys=True))
