#!/usr/bin/env python3
import argparse
import hashlib
import json
import subprocess
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_MISSION = ROOT / "context/missions/mcf-world-projection-001.json"

FRESHNESS = {"FRESH", "STALE", "UNKNOWN"}
TRUST = {
    "CANONICAL_SOURCE",
    "VERIFIED_EXTERNAL",
    "UNTRUSTED_EXTERNAL",
    "REPRESENTATIVE_FIXTURE",
    "PROJECTION_DERIVED",
}

def stable_world_id(kind, canonical_ref):
    digest = hashlib.sha256(f"{kind}|{canonical_ref}".encode()).hexdigest()[:16]
    return f"{kind}:{digest}"

class IdentityResolver:
    def __init__(self):
        self.by_key = {}
        self.by_id = {}

    def resolve(self, kind, canonical_ref):
        key = (kind, canonical_ref)
        world_id = stable_world_id(kind, canonical_ref)
        previous_id = self.by_key.get(key)
        previous_key = self.by_id.get(world_id)
        if previous_id is not None and previous_id != world_id:
            raise ValueError(f"identity instability for {key}")
        if previous_key is not None and previous_key != key:
            raise ValueError(f"world id collision for {world_id}")
        self.by_key[key] = world_id
        self.by_id[world_id] = key
        return {"id": world_id, "kind": kind, "canonicalRef": canonical_ref}

def source_ref(source, ref):
    return {"source": source, "ref": ref}

def revision(source, value):
    return {"source": source, "value": value}

def trust(class_name, reason=None):
    if class_name not in TRUST:
        raise ValueError(f"invalid trust class: {class_name}")
    out = {"class": class_name}
    if reason:
        out["reason"] = reason
    return out

def provenance(mode, refs, rule_id=None):
    if mode not in {"EXPLICIT", "DERIVED", "INFERRED", "PROPOSED"}:
        raise ValueError(f"invalid provenance mode: {mode}")
    out = {"mode": mode, "sourceRefs": refs}
    if rule_id:
        out["ruleId"] = rule_id
    return out

def context_entry(entry_id, subject, category, content, source_field, rev, freshness="FRESH",
                  trust_class="CANONICAL_SOURCE", mode="EXPLICIT", rule_id=None, reason=None):
    if freshness not in FRESHNESS:
        raise ValueError(f"invalid freshness: {freshness}")
    return {
        "id": entry_id,
        "subject": subject,
        "category": category,
        "content": content,
        "provenance": provenance(
            mode,
            [source_ref("github", f"context/missions/mcf-world-projection-001.json#{source_field}")],
            rule_id,
        ),
        "freshness": freshness,
        "trust": trust(trust_class, reason),
        "revision": revision("github", rev),
    }

def relation(rel_id, rel_type, from_ref, to_ref, mode, refs, freshness="FRESH",
             trust_class="CANONICAL_SOURCE", rule_id=None, reason=None):
    if mode in {"INFERRED", "PROPOSED"} and trust_class == "CANONICAL_SOURCE":
        raise ValueError("INFERRED/PROPOSED relation cannot use CANONICAL_SOURCE trust")
    return {
        "id": rel_id,
        "type": rel_type,
        "from": from_ref,
        "to": to_ref,
        "provenance": provenance(mode, refs, rule_id),
        "freshness": freshness,
        "trust": trust(trust_class, reason),
    }

def resolve_fact(facts, subject_ref, label):
    non_null = [f for f in facts if f.get("value") is not None]
    diagnostics = []
    if not non_null:
        diagnostics.append({
            "type": "MISSING_CANONICAL_VALUE",
            "severity": "WARNING",
            "message": f"{label} could not be established.",
            "subjectRef": subject_ref,
            "sourceRefs": [f["sourceRef"] for f in facts if f.get("sourceRef")],
        })
        return {"value": None, "freshness": "UNKNOWN", "diagnostics": diagnostics}

    values = {json.dumps(f["value"], sort_keys=True) for f in non_null}
    if len(values) > 1:
        diagnostics.append({
            "type": "SOURCE_CONFLICT",
            "severity": "WARNING",
            "message": f"Conflicting values for {label}; no silent winner selected.",
            "subjectRef": subject_ref,
            "sourceRefs": [f["sourceRef"] for f in non_null],
        })
        return {"value": None, "freshness": "UNKNOWN", "diagnostics": diagnostics}

    fact = non_null[0]
    return {
        "value": deepcopy(fact["value"]),
        "freshness": fact.get("freshness", "UNKNOWN"),
        "trust": deepcopy(fact.get("trust", {"class": "CANONICAL_SOURCE"})),
        "diagnostics": diagnostics,
    }

def projected_object(ref, payload, rev, observed_at, freshness="FRESH",
                     trust_class="CANONICAL_SOURCE", diagnostics=None):
    return {
        "ref": ref,
        "revision": revision("github", rev),
        "observedAt": observed_at,
        "freshness": freshness,
        "trust": trust(trust_class),
        "payload": payload,
        "sourceRefs": [source_ref("github", "context/missions/mcf-world-projection-001.json")],
        "diagnostics": diagnostics or [],
    }

def file_ref(resolver, kind, repo, path, rev):
    canonical = f"github://{repo}/{path}@{rev}"
    return resolver.resolve(kind, canonical)

def build(mission, rev, generated_at, repo):
    resolver = IdentityResolver()
    mission_id = mission["mission_id"]
    mission_ref = resolver.resolve("mission", f"mcf://mission/{mission_id}")
    project_repo = mission.get("canonical_repository", repo)
    project_ref = resolver.resolve("project", f"github://{project_repo}")

    diagnostics = []
    state_value = mission.get("current_state")
    if state_value:
        mission_freshness = "FRESH"
        mission_state = state_value
    else:
        mission_freshness = "UNKNOWN"
        mission_state = "UNKNOWN"
        diagnostics.append({
            "type": "MISSING_CANONICAL_VALUE",
            "severity": "WARNING",
            "message": "Current mission state could not be established.",
            "subjectRef": mission_ref,
            "sourceRefs": [source_ref("github", "context/missions/mcf-world-projection-001.json#current_state")],
        })

    mission_obj = projected_object(
        mission_ref,
        {
            "title": mission.get("title", mission_id),
            "state": mission_state,
            "objective": mission.get("primary_jtbd", mission.get("title", mission_id)),
        },
        rev,
        generated_at,
        freshness=mission_freshness,
        diagnostics=diagnostics,
    )

    objects = [mission_obj]
    context_ref = None
    phase = mission.get("current_phase")
    if phase:
        context_ref = resolver.resolve(
            "context",
            f"mcf://mission/{mission_id}#phase/{quote(str(phase), safe='')}"
        )
        context_obj = projected_object(
            context_ref,
            {
                "label": str(phase),
                "purpose": mission.get("parallel_architecture_state")
                           or mission.get("primary_jtbd")
                           or "Current mission phase",
            },
            rev,
            generated_at,
        )
        objects.append(context_obj)

    entries = []
    entries.append(context_entry(
        "ctx:mission-state",
        mission_ref,
        "STATE",
        mission_state if state_value else "Current mission state could not be established.",
        "current_state",
        rev,
        freshness=mission_freshness,
    ))

    if mission.get("primary_jtbd"):
        entries.append(context_entry(
            "ctx:primary-jtbd",
            mission_ref,
            "GOAL",
            mission["primary_jtbd"],
            "primary_jtbd",
            rev,
        ))

    if mission.get("prototype_scope"):
        entries.append(context_entry(
            "ctx:prototype-scope",
            mission_ref,
            "CONSTRAINT",
            f"Prototype scope: {mission['prototype_scope']}",
            "prototype_scope",
            rev,
        ))

    if mission.get("production_authorized") is not None:
        entries.append(context_entry(
            "ctx:production-boundary",
            mission_ref,
            "CONSTRAINT",
            f"Production authorized: {str(mission['production_authorized']).lower()}",
            "production_authorized",
            rev,
        ))

    if mission.get("three_d_gate"):
        entries.append(context_entry(
            "ctx:three-d-boundary",
            mission_ref,
            "CONSTRAINT",
            f"3D gate: {mission['three_d_gate']}",
            "three_d_gate",
            rev,
        ))

    if mission.get("world_model_architecture_class"):
        entries.append(context_entry(
            "ctx:world-model-architecture",
            mission_ref,
            "DECISION",
            f"World Model architecture class: {mission['world_model_architecture_class']}",
            "world_model_architecture_class",
            rev,
        ))

    if mission.get("next_action"):
        entries.append(context_entry(
            "ctx:next-action",
            mission_ref,
            "NEXT_ACTION",
            mission["next_action"],
            "next_action",
            rev,
        ))

    if mission.get("world_model_next_action"):
        entries.append(context_entry(
            "ctx:world-model-next-action",
            mission_ref,
            "NEXT_ACTION",
            mission["world_model_next_action"],
            "world_model_next_action",
            rev,
        ))

    if mission.get("product_value_gate"):
        entries.append(context_entry(
            "ctx:product-value-gate",
            mission_ref,
            "OPEN_QUESTION",
            f"Product value gate: {mission['product_value_gate']}",
            "product_value_gate",
            rev,
        ))

    relations = [
        relation(
            "rel:project-contains-mission",
            "contains",
            project_ref,
            mission_ref,
            "EXPLICIT",
            [source_ref("github", "context/missions/mcf-world-projection-001.json#persistent_project")],
        )
    ]

    if context_ref:
        relations.append(relation(
            "rel:mission-contains-context",
            "contains",
            mission_ref,
            context_ref,
            "DERIVED",
            [source_ref("github", "context/missions/mcf-world-projection-001.json#current_phase")],
            trust_class="PROJECTION_DERIVED",
            rule_id="mission-current-phase/v1",
            reason="Context object is deterministically projected from the canonical current_phase field.",
        ))

    artifact_fields = ["protocol", "world_model_contract"]
    evidence_fields = ["human_evidence_review", "test_validity_review", "findability_r_gate"]
    relevant_artifacts = []
    relevant_evidence = []

    for field in artifact_fields:
        path = mission.get(field)
        if path:
            relevant_artifacts.append(file_ref(resolver, "artifact", repo, path, rev))

    for field in evidence_fields:
        path = mission.get(field)
        if path:
            relevant_evidence.append(file_ref(resolver, "evidence", repo, path, rev))

    unknown_refs = []
    stale_refs = []

    slice_doc = {
        "schema": "world-context-slice/v1",
        "scope": {
            "project": project_ref,
            "mission": mission_ref,
            **({"context": context_ref} if context_ref else {}),
        },
        "revisionVector": [{"source": "github", "revision": rev}],
        "generatedAt": generated_at,
        "focus": [context_ref or mission_ref],
        "entries": entries,
        "relations": relations,
        "unknownRefs": unknown_refs,
        "staleRefs": stale_refs,
        "sourceRefs": [source_ref("github", "context/missions/mcf-world-projection-001.json")],
        "diagnostics": diagnostics,
    }

    coordinator = mission.get("coordinator", "MESTRE")
    recipient = resolver.resolve("agent", f"mcf://agent/{coordinator}")
    packet = {
        "schema": "mcf-agent-context-packet/v1",
        "packetId": stable_world_id("context", f"packet://{mission_id}/{coordinator}/{rev}"),
        "generatedAt": generated_at,
        "recipient": recipient,
        "scope": {
            "project": project_ref,
            "mission": mission_ref,
            **({"context": context_ref} if context_ref else {}),
        },
        "objective": [e for e in entries if e["category"] == "GOAL"],
        "constraints": [e for e in entries if e["category"] == "CONSTRAINT"],
        "currentState": [e for e in entries if e["category"] == "STATE"],
        "decisions": [e for e in entries if e["category"] == "DECISION"],
        "blockers": [e for e in entries if e["category"] == "BLOCKER"],
        "nextActions": [e for e in entries if e["category"] == "NEXT_ACTION"],
        "relevantArtifacts": relevant_artifacts,
        "relevantEvidence": relevant_evidence,
        "openQuestions": [e for e in entries if e["category"] == "OPEN_QUESTION"],
        "revisionVector": [{"source": "github", "revision": rev}],
        "sourceRefs": [source_ref("github", "context/missions/mcf-world-projection-001.json")],
        "diagnostics": diagnostics,
    }
    if mission.get("human_authority"):
        packet["authorityRef"] = f"mcf://authority/{mission['human_authority']}"

    return {
        "schema": "world-adapter-output/v1",
        "sourceRevision": rev,
        "generatedAt": generated_at,
        "projectedObjects": objects,
        "contextSlice": slice_doc,
        "agentContextPacket": packet,
    }

def git_head(root):
    return subprocess.check_output(
        ["git", "-C", str(root), "rev-parse", "HEAD"], text=True
    ).strip()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mission-file", default=str(DEFAULT_MISSION))
    ap.add_argument("--revision")
    ap.add_argument("--generated-at")
    ap.add_argument("--repo", default="leon337/multiagent-collaboration-framework")
    ap.add_argument("--output-dir")
    args = ap.parse_args()

    mission_path = Path(args.mission_file)
    mission = json.loads(mission_path.read_text())
    rev = args.revision or git_head(ROOT)
    generated_at = args.generated_at or datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    out = build(mission, rev, generated_at, args.repo)

    if args.output_dir:
        dest = Path(args.output_dir)
        dest.mkdir(parents=True, exist_ok=True)
        (dest / "bundle.json").write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n")
        (dest / "context-slice.json").write_text(json.dumps(out["contextSlice"], ensure_ascii=False, indent=2) + "\n")
        (dest / "agent-context-packet.json").write_text(json.dumps(out["agentContextPacket"], ensure_ascii=False, indent=2) + "\n")
        (dest / "projected-objects.json").write_text(json.dumps(out["projectedObjects"], ensure_ascii=False, indent=2) + "\n")
        print(dest)
    else:
        print(json.dumps(out, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
