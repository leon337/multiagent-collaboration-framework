#!/usr/bin/env python3
import argparse
import copy
import hashlib
import json
from pathlib import Path
from urllib.parse import quote

from adapter_v01 import IdentityResolver, provenance, relation, source_ref, stable_world_id, trust
from real_source_adapter_v01 import input_set_revision

GATES = [
    {
        "name": "world-model-contract",
        "statusField": "world_model_contract_gate",
        "docField": "world_model_contract_gate_doc",
        "shaField": "world_model_contract_audited_sha",
    },
    {
        "name": "world-model-adapter",
        "statusField": "world_model_adapter_gate",
        "docField": "world_model_adapter_gate_doc",
        "shaField": "world_model_adapter_audited_sha",
    },
    {
        "name": "context-consumer-v0.2",
        "statusField": "world_context_consumer_v0_2_gate",
        "docField": "world_context_consumer_v0_2_gate_doc",
        "shaField": "world_context_consumer_v0_2_audited_sha",
    },
    {
        "name": "full-pipeline-v0.1",
        "statusField": "world_full_pipeline_gate",
        "docField": "world_full_pipeline_gate_doc",
        "shaField": "world_full_pipeline_audited_sha",
    },
    {
        "name": "real-source-v0.1",
        "statusField": "world_real_source_gate",
        "docField": "world_real_source_gate_doc",
        "shaField": "world_real_source_audited_sha",
    },
]

def digest_file(path):
    return "sha256:" + hashlib.sha256(Path(path).read_bytes()).hexdigest()

def evidence_set_revision(items):
    raw=json.dumps(items,sort_keys=True,separators=(",",":")).encode()
    return "evidence-set:" + hashlib.sha256(raw).hexdigest()

def canonical_file_ref(repo, rel_path):
    return "repo-file://" + repo + "/" + rel_path

def mission_revision(base_bundle):
    for x in base_bundle["contextSlice"]["revisionVector"]:
        if x["source"]=="mission-record":
            return {"source":"mission-record","value":x["revision"]}
    raise ValueError("mission-record revision missing from base bundle")

def build_operational_context(base_bundle, mission, repo_root, repo):
    out=copy.deepcopy(base_bundle)
    sl=out["contextSlice"]
    packet=out["agentContextPacket"]
    resolver=IdentityResolver()

    # Prime resolver with all existing refs to enforce identity consistency.
    def walk(x):
        if isinstance(x,dict):
            if {"id","kind","canonicalRef"}.issubset(x):
                r=resolver.resolve(x["kind"],x["canonicalRef"])
                if r["id"]!=x["id"]:
                    raise ValueError("base bundle identity is not compatible with deterministic resolver: "+x["canonicalRef"])
            for v in x.values(): walk(v)
        elif isinstance(x,list):
            for v in x: walk(v)
    walk(out)

    mission_ref=sl["scope"]["mission"]
    mrev=mission_revision(out)
    diagnostics=sl["diagnostics"]
    evidence_revisions=[]

    # Active context comes from canonical current_phase, but the context object itself is a projection.
    phase=mission.get("current_phase")
    if phase:
        context_ref=resolver.resolve("context",mission_ref["canonicalRef"]+"#phase/"+quote(str(phase),safe=""))
        context_obj={
            "ref":context_ref,
            "revision":mrev,
            "observedAt":out["generatedAt"],
            "freshness":"FRESH",
            "trust":trust("PROJECTION_DERIVED","Active context is projected from mission.current_phase."),
            "payload":{
                "label":str(phase),
                "purpose":mission.get("parallel_architecture_state") or mission.get("world_model_next_action") or "Current mission phase"
            },
            "sourceRefs":[source_ref("mission-record","context/missions/mcf-world-projection-001.json#current_phase")],
            "diagnostics":[]
        }
        out["projectedObjects"].append(context_obj)
        sl["scope"]["context"]=context_ref
        sl["focus"]=[context_ref]
        packet["scope"]["context"]=context_ref
        sl["relations"].append(relation(
            "rel:operational-mission-contains-context","contains",mission_ref,context_ref,
            "DERIVED",
            [source_ref("mission-record","context/missions/mcf-world-projection-001.json#current_phase")],
            trust_class="PROJECTION_DERIVED",
            rule_id="mission-current-phase/v1",
            reason="Active context is projected from the canonical mission current_phase field."
        ))

    # Human test status is a boundary/constraint, not a new mission lifecycle.
    findability_status=mission.get("human_findability_r_status")
    if findability_status:
        e={
            "id":"ctx:operational-findability-boundary",
            "subject":mission_ref,
            "category":"CONSTRAINT",
            "content":"Findability R status: "+str(findability_status)+"; experiment remains frozen/deferred.",
            "provenance":provenance("EXPLICIT",[source_ref("mission-record","context/missions/mcf-world-projection-001.json#human_findability_r_status")]),
            "freshness":"FRESH",
            "trust":trust("CANONICAL_SOURCE"),
            "revision":mrev,
        }
        sl["entries"].append(e)
        packet["constraints"].append(e)

    # Architecture continuation is distinct from the pending human-test next action.
    arch_next=mission.get("world_model_next_action")
    if arch_next:
        action_ref=resolver.resolve("action",mission_ref["canonicalRef"]+"#action/world-model-next")
        e={
            "id":"ctx:operational-world-next",
            "subject":action_ref,
            "category":"NEXT_ACTION",
            "content":arch_next,
            "provenance":provenance("EXPLICIT",[source_ref("mission-record","context/missions/mcf-world-projection-001.json#world_model_next_action")]),
            "freshness":"FRESH",
            "trust":trust("CANONICAL_SOURCE"),
            "revision":mrev,
        }
        sl["entries"].append(e)
        packet["nextActions"].append(e)
        out["projectedObjects"].append({
            "ref":action_ref,
            "revision":mrev,
            "observedAt":out["generatedAt"],
            "freshness":"FRESH",
            "trust":trust("CANONICAL_SOURCE"),
            "payload":{"description":arch_next,"status":"NEXT_READ_ONLY_WORK"},
            "sourceRefs":e["provenance"]["sourceRefs"],
            "diagnostics":[]
        })

    # Only gated architectural milestones needed for orientation are materialized.
    for spec in GATES:
        status=mission.get(spec["statusField"])
        doc=mission.get(spec["docField"])
        audited_sha=mission.get(spec["shaField"])
        decision_ref=resolver.resolve("decision",mission_ref["canonicalRef"]+"#gate/"+spec["name"])
        decision_entry={
            "id":"ctx:gate:"+spec["name"],
            "subject":decision_ref,
            "category":"DECISION",
            "content":spec["name"]+" gate: "+str(status or "UNKNOWN"),
            "provenance":provenance("EXPLICIT",[source_ref("mission-record","context/missions/mcf-world-projection-001.json#"+spec["statusField"])]),
            "freshness":"FRESH" if status else "UNKNOWN",
            "trust":trust("CANONICAL_SOURCE" if status else "PROJECTION_DERIVED",
                          None if status else "Gate status missing from mission record."),
            "revision":mrev,
        }
        sl["entries"].append(decision_entry)
        packet["decisions"].append(decision_entry)
        out["projectedObjects"].append({
            "ref":decision_ref,
            "revision":mrev,
            "observedAt":out["generatedAt"],
            "freshness":decision_entry["freshness"],
            "trust":decision_entry["trust"],
            "payload":{
                "statement":decision_entry["content"],
                "status":str(status or "UNKNOWN"),
                "decidedAt":None
            },
            "sourceRefs":decision_entry["provenance"]["sourceRefs"],
            "diagnostics":[]
        })

        if doc:
            file_path=Path(repo_root)/doc
            evidence_ref=resolver.resolve("evidence",canonical_file_ref(repo,doc))
            if file_path.is_file():
                dg=digest_file(file_path)
                evidence_revisions.append({"source":"repo-file:"+doc,"revision":dg})
                evidence_obj={
                    "ref":evidence_ref,
                    "revision":{"source":"repo-file","value":dg},
                    "observedAt":out["generatedAt"],
                    "freshness":"FRESH",
                    "trust":trust("CANONICAL_SOURCE"),
                    "payload":{
                        "evidenceType":"gate-review",
                        "summary":"Gate evidence for "+spec["name"]+"; audited SHA="+str(audited_sha or "not-recorded")
                    },
                    "sourceRefs":[source_ref("repo-file",doc)],
                    "diagnostics":[]
                }
            else:
                d={
                    "type":"MISSING_CANONICAL_VALUE",
                    "severity":"WARNING",
                    "message":"Gate evidence file is missing: "+doc,
                    "subjectRef":evidence_ref,
                    "sourceRefs":[source_ref("repo-file",doc)]
                }
                diagnostics.append(d)
                evidence_obj={
                    "ref":evidence_ref,
                    "revision":{"source":"repo-file","value":"UNAVAILABLE"},
                    "observedAt":out["generatedAt"],
                    "freshness":"UNKNOWN",
                    "trust":trust("PROJECTION_DERIVED","Expected gate evidence file was unavailable."),
                    "payload":{"evidenceType":"gate-review","summary":"UNKNOWN: missing gate evidence for "+spec["name"]},
                    "sourceRefs":[source_ref("repo-file",doc)],
                    "diagnostics":[d]
                }
                if evidence_ref not in sl["unknownRefs"]:
                    sl["unknownRefs"].append(evidence_ref)
            out["projectedObjects"].append(evidence_obj)
            if evidence_ref not in packet["relevantEvidence"]:
                packet["relevantEvidence"].append(evidence_ref)
            sl["relations"].append(relation(
                "rel:gate:"+spec["name"]+":supported-by",
                "supported_by",
                decision_ref,
                evidence_ref,
                "EXPLICIT",
                [source_ref("mission-record","context/missions/mcf-world-projection-001.json#"+spec["docField"])],
                freshness=evidence_obj["freshness"],
                trust_class=evidence_obj["trust"]["class"],
                reason=evidence_obj["trust"].get("reason")
            ))

    if evidence_revisions:
        sl["revisionVector"].extend(evidence_revisions)
        packet["revisionVector"]=copy.deepcopy(sl["revisionVector"])

    # Attention always mirrors after enrichment.
    packet["attention"]={
        "unknownRefs":copy.deepcopy(sl["unknownRefs"]),
        "staleRefs":copy.deepcopy(sl["staleRefs"])
    }
    packet["diagnostics"]=copy.deepcopy(sl["diagnostics"])

    # Bundle sourceRevision is a technical digest of the enriched exact input set.
    out["sourceRevision"]=input_set_revision(sl["revisionVector"])
    return out

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--base-bundle",required=True)
    ap.add_argument("--mission-file",required=True)
    ap.add_argument("--repo-root",required=True)
    ap.add_argument("--repo",default="leon337/multiagent-collaboration-framework")
    ap.add_argument("--output",required=True)
    args=ap.parse_args()
    base=json.loads(Path(args.base_bundle).read_text())
    mission=json.loads(Path(args.mission_file).read_text())
    out=build_operational_context(base,mission,args.repo_root,args.repo)
    Path(args.output).write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
    print(args.output)

if __name__=="__main__":
    main()
