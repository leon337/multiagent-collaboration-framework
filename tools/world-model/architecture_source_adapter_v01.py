#!/usr/bin/env python3
import argparse
import json
from collections import defaultdict
from pathlib import Path

from adapter_v01 import (
    IdentityResolver,
    provenance,
    relation,
    source_ref,
    stable_world_id,
    trust,
)

COMPETENT = {"CANONICAL_SOURCE", "VERIFIED_EXTERNAL", "REPRESENTATIVE_FIXTURE"}

def diagnostic(kind, message, subject, refs):
    return {
        "type": kind,
        "severity": "WARNING",
        "message": message,
        "subjectRef": subject,
        "sourceRefs": refs,
    }

def entry_from_fact(fact, subject):
    return {
        "id": "ctx:" + fact["id"].split(":",1)[-1],
        "subject": subject,
        "category": fact["category"],
        "content": fact["label"] + ": " + str(fact["value"]),
        "provenance": {
            "mode": "EXPLICIT",
            "sourceRefs": [fact["sourceRef"]],
        },
        "freshness": fact["freshness"],
        "trust": fact["trust"],
        "revision": fact["revision"],
    }

def resolve_group(group, subject):
    label = group[0]["label"]
    refs = [x["sourceRef"] for x in group]
    observation_only = all(x.get("observationOnly") for x in group)
    if observation_only:
        fact = group[0]
        return {
            "value": fact["value"],
            "freshness": fact["freshness"],
            "trust": fact["trust"],
            "revision": fact["revision"],
            "sourceRefs": refs,
            "diagnostics": [],
            "observationOnly": True,
        }

    competent = [x for x in group if x["trust"]["class"] in COMPETENT and x.get("value") is not None]
    untrusted = [x for x in group if x["trust"]["class"] == "UNTRUSTED_EXTERNAL"]

    if not competent:
        diags = [diagnostic(
            "MISSING_CANONICAL_VALUE",
            label + " could not be established from competent sources.",
            subject,
            refs,
        )]
        if untrusted:
            diags.append(diagnostic(
                "UNTRUSTED_INPUT",
                label + " has only untrusted observations; they remain data, not authority.",
                subject,
                [x["sourceRef"] for x in untrusted],
            ))
        return {
            "value": None,
            "freshness": "UNKNOWN",
            "trust": {"class": "PROJECTION_DERIVED", "reason": "No competent source established a value."},
            "revision": group[0]["revision"],
            "sourceRefs": refs,
            "diagnostics": diags,
            "observationOnly": False,
        }

    values = {json.dumps(x["value"], sort_keys=True) for x in competent}
    if len(values) > 1:
        return {
            "value": None,
            "freshness": "UNKNOWN",
            "trust": {"class": "PROJECTION_DERIVED", "reason": "Competent sources conflict; no silent winner selected."},
            "revision": competent[0]["revision"],
            "sourceRefs": [x["sourceRef"] for x in competent],
            "diagnostics": [diagnostic(
                "SOURCE_CONFLICT",
                "Conflicting competent values for " + label + "; no silent winner selected.",
                subject,
                [x["sourceRef"] for x in competent],
            )],
            "observationOnly": False,
        }

    fact = competent[0]
    diags = []
    for x in untrusted:
        if x.get("value") != fact.get("value"):
            diags.append(diagnostic(
                "UNTRUSTED_INPUT",
                "Untrusted observation differs from the established " + label + " and does not override it.",
                subject,
                [fact["sourceRef"], x["sourceRef"]],
            ))
    return {
        "value": fact["value"],
        "freshness": fact["freshness"],
        "trust": fact["trust"],
        "revision": fact["revision"],
        "sourceRefs": [fact["sourceRef"]],
        "diagnostics": diags,
        "observationOnly": False,
    }

def build_source_bundle(src, generated_at):
    resolver = IdentityResolver()
    project_ref = resolver.resolve("project", src["project"]["canonicalRef"])
    mission_ref = resolver.resolve("mission", "mcf://mission/" + src["mission"]["mission_id"])

    groups = defaultdict(list)
    subjects = {}
    for fact in src["facts"]:
        groups[fact["factKey"]].append(fact)
        subjects[fact["factKey"]] = resolver.resolve(fact["subject"]["kind"], fact["subject"]["canonicalRef"])

    diagnostics = []
    entries = []
    unknown_refs = []
    stale_refs = []
    relevant_evidence = []
    projected_objects = []

    state_result = resolve_group(groups["mission.state"], mission_ref)
    diagnostics.extend(state_result["diagnostics"])
    mission_state = state_result["value"] if state_result["value"] is not None else "UNKNOWN"

    state_entry = {
        "id": "ctx:mission-state",
        "subject": mission_ref,
        "category": "STATE",
        "content": str(mission_state),
        "provenance": provenance("EXPLICIT", state_result["sourceRefs"]),
        "freshness": state_result["freshness"],
        "trust": state_result["trust"],
        "revision": state_result["revision"],
    }
    entries.append(state_entry)

    goal_entry = {
        "id": "ctx:mission-goal",
        "subject": mission_ref,
        "category": "GOAL",
        "content": src["mission"]["objective"],
        "provenance": provenance("EXPLICIT", [source_ref("fixture-source", "mission#objective")]),
        "freshness": "FRESH",
        "trust": trust("REPRESENTATIVE_FIXTURE"),
        "revision": {"source": "fixture-source", "value": src["sourceRevision"]},
    }
    entries.append(goal_entry)

    projected_objects.append({
        "ref": mission_ref,
        "revision": {"source": "fixture-source", "value": src["sourceRevision"]},
        "observedAt": generated_at,
        "freshness": state_result["freshness"],
        "trust": state_result["trust"],
        "payload": {
            "title": src["mission"]["title"],
            "state": mission_state,
            "objective": src["mission"]["objective"],
        },
        "sourceRefs": state_result["sourceRefs"],
        "diagnostics": state_result["diagnostics"],
    })

    for fact_key, group in groups.items():
        if fact_key == "mission.state":
            continue
        subject = subjects[fact_key]
        result = resolve_group(group, subject)
        diagnostics.extend(result["diagnostics"])

        if result["observationOnly"]:
            fact = group[0]
            entry = entry_from_fact(fact, subject)
        else:
            category = group[0]["category"]
            label = group[0]["label"]
            content = label + ": " + (str(result["value"]) if result["value"] is not None else "UNKNOWN")
            entry = {
                "id": "ctx:" + fact_key.replace(".","-"),
                "subject": subject,
                "category": category,
                "content": content,
                "provenance": provenance("EXPLICIT", result["sourceRefs"]),
                "freshness": result["freshness"],
                "trust": result["trust"],
                "revision": result["revision"],
            }
        entries.append(entry)

        if entry["freshness"] == "UNKNOWN":
            unknown_refs.append(subject)
        if entry["freshness"] == "STALE":
            stale_refs.append(subject)
        if subject["kind"] == "evidence" and subject not in relevant_evidence:
            relevant_evidence.append(subject)

        if subject["kind"] == "evidence":
            projected_objects.append({
                "ref": subject,
                "revision": entry["revision"],
                "observedAt": generated_at,
                "freshness": entry["freshness"],
                "trust": entry["trust"],
                "payload": {
                    "evidenceType": group[0]["factKey"],
                    "summary": entry["content"],
                },
                "sourceRefs": entry["provenance"]["sourceRefs"],
                "diagnostics": [d for d in diagnostics if d.get("subjectRef",{}).get("id") == subject["id"]],
            })

    relations = []
    next_actions = []
    for ref in stale_refs:
        action_ref = resolver.resolve("action", "mcf://action/revalidate/" + ref["id"])
        action_text = "Revalidate " + ref["canonicalRef"] + " before treating it as current."
        action_entry = {
            "id": "ctx:action-revalidate-" + ref["id"].replace(":","-"),
            "subject": action_ref,
            "category": "NEXT_ACTION",
            "content": action_text,
            "provenance": provenance(
                "DERIVED",
                [source_ref("projection", ref["canonicalRef"])],
                "stale-evidence-next-action/v1",
            ),
            "freshness": "FRESH",
            "trust": trust("PROJECTION_DERIVED", "Next action is derived from a STALE evidence condition."),
            "revision": {"source": "fixture-source", "value": src["sourceRevision"]},
        }
        entries.append(action_entry)
        next_actions.append(action_entry)
        relations.append(relation(
            "rel:" + action_ref["id"] + ":depends:" + ref["id"],
            "depends_on",
            action_ref,
            ref,
            "DERIVED",
            [source_ref("projection", ref["canonicalRef"])],
            trust_class="PROJECTION_DERIVED",
            rule_id="stale-evidence-next-action/v1",
            reason="Dependency is derived from the stale evidence condition.",
        ))
        projected_objects.append({
            "ref": action_ref,
            "revision": {"source": "fixture-source", "value": src["sourceRevision"]},
            "observedAt": generated_at,
            "freshness": "FRESH",
            "trust": trust("PROJECTION_DERIVED", "Action is derived from a STALE evidence condition."),
            "payload": {
                "description": action_text,
                "status": "PROPOSED_INSPECTION",
                "dependsOn": [ref],
            },
            "sourceRefs": [source_ref("projection", ref["canonicalRef"])],
            "diagnostics": [],
        })

    slice_doc = {
        "schema": "world-context-slice/v1",
        "scope": {"project": project_ref, "mission": mission_ref},
        "revisionVector": [{"source": "fixture-source", "revision": src["sourceRevision"]}],
        "generatedAt": generated_at,
        "focus": [mission_ref],
        "entries": entries,
        "relations": relations,
        "unknownRefs": unknown_refs,
        "staleRefs": stale_refs,
        "sourceRefs": [source_ref("fixture-source", "architecture-source-bundle")],
        "diagnostics": diagnostics,
    }

    recipient = resolver.resolve("agent", "mcf://agent/" + src["mission"]["coordinator"])
    packet = {
        "schema": "mcf-agent-context-packet/v1",
        "packetId": stable_world_id("context", "packet://" + src["mission"]["mission_id"] + "/" + src["sourceRevision"]),
        "generatedAt": generated_at,
        "recipient": recipient,
        "scope": {"project": project_ref, "mission": mission_ref},
        "objective": [x for x in entries if x["category"] == "GOAL"],
        "constraints": [x for x in entries if x["category"] == "CONSTRAINT"],
        "currentState": [x for x in entries if x["category"] == "STATE"],
        "decisions": [x for x in entries if x["category"] == "DECISION"],
        "blockers": [x for x in entries if x["category"] == "BLOCKER"],
        "nextActions": [x for x in entries if x["category"] == "NEXT_ACTION"],
        "relevantArtifacts": [],
        "relevantEvidence": relevant_evidence,
        "openQuestions": [x for x in entries if x["category"] == "OPEN_QUESTION"],
        "revisionVector": [{"source": "fixture-source", "revision": src["sourceRevision"]}],
        "sourceRefs": [source_ref("fixture-source", "architecture-source-bundle")],
        "diagnostics": diagnostics,
        "authorityRef": "mcf://authority/" + src["mission"]["human_authority"],
    }

    return {
        "schema": "world-adapter-output/v1",
        "sourceRevision": src["sourceRevision"],
        "generatedAt": generated_at,
        "projectedObjects": projected_objects,
        "contextSlice": slice_doc,
        "agentContextPacket": packet,
    }

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--source-bundle",required=True)
    ap.add_argument("--generated-at",required=True)
    ap.add_argument("--output",required=True)
    args=ap.parse_args()
    src=json.loads(Path(args.source_bundle).read_text())
    out=build_source_bundle(src,args.generated_at)
    Path(args.output).write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
    print(args.output)

if __name__=="__main__":
    main()
