#!/usr/bin/env python3
import copy
import json
from pathlib import Path

from adapter_v01 import (
    IdentityResolver,
    build,
    context_entry,
    relation,
    resolve_fact,
)

ROOT = Path(__file__).resolve().parents[2]
mission = json.loads((ROOT / "context/missions/mcf-world-projection-001.json").read_text())
FIXED_REV = "adapter-test-revision"
FIXED_AT = "2026-09-26T10:00:00Z"

a = build(mission, FIXED_REV, FIXED_AT, "leon337/multiagent-collaboration-framework")
b = build(copy.deepcopy(mission), FIXED_REV, FIXED_AT, "leon337/multiagent-collaboration-framework")
assert a == b, "deterministic rebuild failed"

assert a["contextSlice"]["scope"]["mission"]["canonicalRef"].startswith("mcf://mission/")
assert a["agentContextPacket"]["authorityRef"].startswith("mcf://authority/")
assert a["agentContextPacket"]["authorityRef"] != a["agentContextPacket"]["recipient"]["canonicalRef"]

resolver = IdentityResolver()
r1 = resolver.resolve("mission", "mcf://mission/X")
r2 = resolver.resolve("mission", "mcf://mission/X")
assert r1 == r2, "identity resolver is not stable"

missing = copy.deepcopy(mission)
missing.pop("current_state", None)
m = build(missing, FIXED_REV, FIXED_AT, "leon337/multiagent-collaboration-framework")
state_obj = next(x for x in m["projectedObjects"] if x["ref"]["kind"] == "mission")
state_entry = next(x for x in m["contextSlice"]["entries"] if x["category"] == "STATE")
assert state_obj["freshness"] == "UNKNOWN"
assert state_obj["payload"]["state"] == "UNKNOWN"
assert state_entry["freshness"] == "UNKNOWN"
assert any(d["type"] == "MISSING_CANONICAL_VALUE" for d in m["contextSlice"]["diagnostics"])

subject = resolver.resolve("evidence", "mcf://evidence/test")
stale = context_entry(
    "ctx:stale-test", subject, "EVIDENCE", "previous observation",
    "test", FIXED_REV, freshness="STALE"
)
assert stale["freshness"] == "STALE", "STALE was promoted"

untrusted = context_entry(
    "ctx:untrusted-test", subject, "OPEN_QUESTION", "external claim",
    "external", FIXED_REV, trust_class="UNTRUSTED_EXTERNAL"
)
assert untrusted["trust"]["class"] == "UNTRUSTED_EXTERNAL"
assert "authority" not in untrusted

conflict = resolve_fact([
    {
        "value": "A",
        "sourceRef": {"source": "mcf", "ref": "state/A"},
        "freshness": "FRESH",
        "trust": {"class": "CANONICAL_SOURCE"},
    },
    {
        "value": "B",
        "sourceRef": {"source": "provider", "ref": "state/B"},
        "freshness": "FRESH",
        "trust": {"class": "VERIFIED_EXTERNAL"},
    },
], subject, "state")
assert conflict["value"] is None
assert conflict["freshness"] == "UNKNOWN"
assert any(d["type"] == "SOURCE_CONFLICT" for d in conflict["diagnostics"])

try:
    relation(
        "rel:bad", "depends_on", r1, subject, "INFERRED",
        [{"source": "mcf", "ref": "x"}],
        trust_class="CANONICAL_SOURCE",
        rule_id="bad/v1"
    )
except ValueError:
    pass
else:
    raise AssertionError("inferred relation was promoted to CANONICAL_SOURCE")

assert not any(Path(__file__).parent.glob("*.db"))
assert not any(Path(__file__).parent.glob("*.sqlite"))

print("ADAPTER_V01_TEST PASS")
print("projectedObjects", len(a["projectedObjects"]))
print("contextEntries", len(a["contextSlice"]["entries"]))
print("relations", len(a["contextSlice"]["relations"]))
print("relevantArtifacts", len(a["agentContextPacket"]["relevantArtifacts"]))
print("relevantEvidence", len(a["agentContextPacket"]["relevantEvidence"]))
