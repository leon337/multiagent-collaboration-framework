#!/usr/bin/env python3
import argparse
import json
from pathlib import Path
import yaml

from adapter_v01 import IdentityResolver, provenance, source_ref, stable_world_id, trust

def diag(kind, message, subject, refs):
    return {
        "type": kind,
        "severity": "WARNING",
        "message": message,
        "subjectRef": subject,
        "sourceRefs": refs,
    }

def require_policy(policies, fact_key, owner):
    p = policies.get(fact_key)
    if not p:
        raise ValueError("missing ownership policy for " + fact_key)
    if p.get("owner") != owner:
        raise ValueError("ownership mismatch for " + fact_key + ": expected " + owner)
    return p

def entry(entry_id, subject, category, content, freshness, trust_value, revision, refs, mode="EXPLICIT", rule_id=None):
    return {
        "id": entry_id,
        "subject": subject,
        "category": category,
        "content": content,
        "provenance": provenance(mode, refs, rule_id),
        "freshness": freshness,
        "trust": trust_value,
        "revision": revision,
    }

def projected_evidence(ref, summary, freshness, trust_value, revision, observed_at, refs, diagnostics=None):
    return {
        "ref": ref,
        "revision": revision,
        "observedAt": observed_at,
        "freshness": freshness,
        "trust": trust_value,
        "payload": {
            "evidenceType": "provider-observation",
            "summary": summary,
        },
        "sourceRefs": refs,
        "diagnostics": diagnostics or [],
    }

def build_real_sources(mission, project_registry, snapshot, ownership):
    policies = ownership["factPolicies"]
    resolver = IdentityResolver()
    repo = project_registry["identity"]["canonical_repository"]
    mission_id = mission["mission_id"]

    require_policy(policies, "project.canonical_repository", "project_registry")
    require_policy(policies, "mission.current_state", "mission_record")
    require_policy(policies, "mission.product_value_gate", "mission_record")
    require_policy(policies, "mission.architecture_class", "mission_record")
    require_policy(policies, "github.issue379.state", "github_issue_379")
    require_policy(policies, "github.pr380.state", "github_pr_380")
    require_policy(policies, "github.pr380.draft", "github_pr_380")
    require_policy(policies, "github.pr380.head_sha", "github_pr_380")
    require_policy(policies, "git.local.branch", "local_git")
    require_policy(policies, "git.local.head_sha", "local_git")

    project_ref = resolver.resolve("project", "github://" + repo)
    mission_ref = resolver.resolve("mission", "mcf://mission/" + mission_id)
    issue_ref = resolver.resolve("evidence", "github://" + repo + "/issues/379")
    pr_ref = resolver.resolve("evidence", "github://" + repo + "/pull/380")
    local_git_ref = resolver.resolve("evidence", "git://local/" + snapshot.get("localGit",{}).get("branch","unknown"))

    observed_at = snapshot["observedAt"]
    local_sha = snapshot.get("localGit",{}).get("headSha")
    local_branch = snapshot.get("localGit",{}).get("branch")
    gh = snapshot.get("github",{})
    issue = gh.get("issue379")
    pr = gh.get("pr380")
    diagnostics = []

    mission_revision = {"source":"git","value":local_sha or "UNKNOWN"}
    entries = [
        entry(
            "ctx:real-mission-state", mission_ref, "STATE",
            mission.get("current_state","UNKNOWN"),
            "FRESH" if mission.get("current_state") else "UNKNOWN",
            trust("CANONICAL_SOURCE"),
            mission_revision,
            [source_ref("mission-record","context/missions/mcf-world-projection-001.json#current_state")]
        ),
        entry(
            "ctx:real-goal", mission_ref, "GOAL",
            mission.get("primary_jtbd", mission.get("title", mission_id)),
            "FRESH",
            trust("CANONICAL_SOURCE"),
            mission_revision,
            [source_ref("mission-record","context/missions/mcf-world-projection-001.json#primary_jtbd")]
        ),
        entry(
            "ctx:real-product-gate", mission_ref, "OPEN_QUESTION",
            "Product value gate: " + str(mission.get("product_value_gate","UNKNOWN")),
            "FRESH" if mission.get("product_value_gate") else "UNKNOWN",
            trust("CANONICAL_SOURCE"),
            mission_revision,
            [source_ref("mission-record","context/missions/mcf-world-projection-001.json#product_value_gate")]
        ),
        entry(
            "ctx:real-architecture-class", mission_ref, "DECISION",
            "World architecture class: " + str(mission.get("world_model_architecture_class","UNKNOWN")),
            "FRESH" if mission.get("world_model_architecture_class") else "UNKNOWN",
            trust("CANONICAL_SOURCE"),
            mission_revision,
            [source_ref("mission-record","context/missions/mcf-world-projection-001.json#world_model_architecture_class")]
        ),
        entry(
            "ctx:real-project-repo", project_ref, "CONSTRAINT",
            "Canonical repository: " + repo,
            "FRESH",
            trust("CANONICAL_SOURCE"),
            {"source":"project-registry","value":project_registry["project"]["id"]},
            [source_ref("project-registry","context/projects/multiagent-collaboration-framework.yaml#identity.canonical_repository")]
        )
    ]

    projected = [{
        "ref": mission_ref,
        "revision": mission_revision,
        "observedAt": observed_at,
        "freshness": "FRESH" if mission.get("current_state") else "UNKNOWN",
        "trust": trust("CANONICAL_SOURCE"),
        "payload": {
            "title": mission.get("title",mission_id),
            "state": mission.get("current_state","UNKNOWN"),
            "objective": mission.get("primary_jtbd",mission.get("title",mission_id)),
        },
        "sourceRefs":[source_ref("mission-record","context/missions/mcf-world-projection-001.json")],
        "diagnostics":[],
    }]

    evidence_refs = []

    if issue:
        issue_rev={"source":"github-issue-379","value":issue["updatedAt"]}
        issue_summary="GitHub Issue #379 state: " + issue["state"]
        issue_entry=entry(
            "ctx:real-issue379",issue_ref,"EVIDENCE",issue_summary,"FRESH",
            trust("VERIFIED_EXTERNAL"),issue_rev,
            [source_ref("github-issue-379",issue["url"])]
        )
        entries.append(issue_entry); evidence_refs.append(issue_ref)
        projected.append(projected_evidence(issue_ref,issue_summary,"FRESH",trust("VERIFIED_EXTERNAL"),issue_rev,observed_at,issue_entry["provenance"]["sourceRefs"]))
    else:
        issue_entry=entry(
            "ctx:real-issue379",issue_ref,"EVIDENCE","GitHub Issue #379 state: UNKNOWN","UNKNOWN",
            trust("PROJECTION_DERIVED","GitHub issue owner unavailable in this snapshot."),
            {"source":"github-issue-379","value":"UNAVAILABLE"},
            [source_ref("github-issue-379","github://"+repo+"/issues/379")]
        )
        entries.append(issue_entry); evidence_refs.append(issue_ref)
        d=diag("MISSING_CANONICAL_VALUE","GitHub Issue #379 owner data is unavailable; World will not infer issue state from other sources.",issue_ref,issue_entry["provenance"]["sourceRefs"])
        diagnostics.append(d)
        projected.append(projected_evidence(issue_ref,issue_entry["content"],"UNKNOWN",issue_entry["trust"],issue_entry["revision"],observed_at,issue_entry["provenance"]["sourceRefs"],[d]))

    if pr:
        pr_rev={"source":"github-pr-380","value":pr["updatedAt"]+"|"+pr["headSha"]}
        pr_summary="GitHub PR #380 state: "+pr["state"]+"; draft="+str(pr["draft"]).lower()+"; merged="+str(pr["merged"]).lower()+"; head="+pr["headSha"]
        pr_entry=entry(
            "ctx:real-pr380",pr_ref,"EVIDENCE",pr_summary,"FRESH",
            trust("VERIFIED_EXTERNAL"),pr_rev,
            [source_ref("github-pr-380",pr["url"])]
        )
        entries.append(pr_entry); evidence_refs.append(pr_ref)
        pr_diags=[]
        if snapshot.get("repository") != repo:
            d=diag("SOURCE_CONFLICT","GitHub provider snapshot repository differs from project registry canonical_repository.",pr_ref,[source_ref("project-registry",repo),source_ref("github-pr-380",snapshot.get("repository","UNKNOWN"))])
            diagnostics.append(d);pr_diags.append(d)
        projected.append(projected_evidence(pr_ref,pr_summary,"FRESH",trust("VERIFIED_EXTERNAL"),pr_rev,observed_at,pr_entry["provenance"]["sourceRefs"],pr_diags))
    else:
        pr_entry=entry(
            "ctx:real-pr380",pr_ref,"EVIDENCE","GitHub PR #380 state: UNKNOWN","UNKNOWN",
            trust("PROJECTION_DERIVED","GitHub PR owner unavailable in this snapshot."),
            {"source":"github-pr-380","value":"UNAVAILABLE"},
            [source_ref("github-pr-380","github://"+repo+"/pull/380")]
        )
        entries.append(pr_entry); evidence_refs.append(pr_ref)
        d=diag("MISSING_CANONICAL_VALUE","GitHub PR #380 owner data is unavailable; local Git cannot substitute for PR state.",pr_ref,pr_entry["provenance"]["sourceRefs"])
        diagnostics.append(d)
        projected.append(projected_evidence(pr_ref,pr_entry["content"],"UNKNOWN",pr_entry["trust"],pr_entry["revision"],observed_at,pr_entry["provenance"]["sourceRefs"],[d]))

    if local_sha and local_branch:
        local_rev={"source":"local-git","value":local_sha}
        local_summary="Local Git branch: "+local_branch+"; HEAD="+local_sha
        local_entry=entry(
            "ctx:real-local-git",local_git_ref,"EVIDENCE",local_summary,"FRESH",
            trust("CANONICAL_SOURCE"),local_rev,
            [source_ref("local-git","git://local/"+local_branch+"@"+local_sha)]
        )
        entries.append(local_entry); evidence_refs.append(local_git_ref)
        projected.append(projected_evidence(local_git_ref,local_summary,"FRESH",trust("CANONICAL_SOURCE"),local_rev,observed_at,local_entry["provenance"]["sourceRefs"]))
    else:
        d=diag("MISSING_CANONICAL_VALUE","Local Git owner data unavailable.",local_git_ref,[source_ref("local-git","git://local/unknown")])
        diagnostics.append(d)

    if pr and local_sha and pr["headSha"] != local_sha:
        d=diag(
            "SOURCE_CONFLICT",
            "Local Git HEAD differs from GitHub PR #380 head_sha. Each source retains ownership of its own fact; synchronization is not inferred.",
            pr_ref,
            [source_ref("local-git","git://local/"+local_branch+"@"+local_sha),source_ref("github-pr-380",pr["url"]+"#head_sha")]
        )
        diagnostics.append(d)

    unknown_refs=[]
    stale_refs=[]
    for x in entries:
        if x["freshness"]=="UNKNOWN" and x["subject"] not in unknown_refs:
            unknown_refs.append(x["subject"])
        if x["freshness"]=="STALE" and x["subject"] not in stale_refs:
            stale_refs.append(x["subject"])

    slice_doc={
        "schema":"world-context-slice/v1",
        "scope":{"project":project_ref,"mission":mission_ref},
        "revisionVector":[
            {"source":"mission-record","revision":local_sha or "UNKNOWN"},
            {"source":"project-registry","revision":project_registry["project"]["id"]},
            {"source":"github-snapshot","revision":observed_at}
        ],
        "generatedAt":observed_at,
        "focus":[mission_ref],
        "entries":entries,
        "relations":[],
        "unknownRefs":unknown_refs,
        "staleRefs":stale_refs,
        "sourceRefs":[
            source_ref("mission-record","context/missions/mcf-world-projection-001.json"),
            source_ref("project-registry","context/projects/multiagent-collaboration-framework.yaml"),
            source_ref("github-snapshot","docs/evidence/MCF-WORLD-REAL-PROVIDER-SNAPSHOT-20260926T094030Z.json")
        ],
        "diagnostics":diagnostics
    }

    recipient=resolver.resolve("agent","mcf://agent/"+mission.get("coordinator","MESTRE"))
    packet={
        "schema":"mcf-agent-context-packet/v1",
        "packetId":stable_world_id("context","packet://real-sources/"+mission_id+"/"+observed_at),
        "generatedAt":observed_at,
        "recipient":recipient,
        "scope":{"project":project_ref,"mission":mission_ref},
        "objective":[x for x in entries if x["category"]=="GOAL"],
        "constraints":[x for x in entries if x["category"]=="CONSTRAINT"],
        "currentState":[x for x in entries if x["category"]=="STATE"],
        "decisions":[x for x in entries if x["category"]=="DECISION"],
        "blockers":[x for x in entries if x["category"]=="BLOCKER"],
        "nextActions":[x for x in entries if x["category"]=="NEXT_ACTION"],
        "relevantArtifacts":[],
        "relevantEvidence":evidence_refs,
        "openQuestions":[x for x in entries if x["category"]=="OPEN_QUESTION"],
        "revisionVector":slice_doc["revisionVector"],
        "sourceRefs":slice_doc["sourceRefs"],
        "diagnostics":diagnostics,
        "authorityRef":"mcf://authority/"+mission.get("human_authority","LEANDRO")
    }

    return {
        "schema":"world-adapter-output/v1",
        "sourceRevision":local_sha or observed_at,
        "generatedAt":observed_at,
        "projectedObjects":projected,
        "contextSlice":slice_doc,
        "agentContextPacket":packet
    }

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--mission-file",required=True)
    ap.add_argument("--project-registry",required=True)
    ap.add_argument("--provider-snapshot",required=True)
    ap.add_argument("--ownership",required=True)
    ap.add_argument("--output",required=True)
    args=ap.parse_args()
    mission=json.loads(Path(args.mission_file).read_text())
    project=yaml.safe_load(Path(args.project_registry).read_text())
    snapshot=json.loads(Path(args.provider_snapshot).read_text())
    ownership=json.loads(Path(args.ownership).read_text())
    out=build_real_sources(mission,project,snapshot,ownership)
    Path(args.output).write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
    print(args.output)

if __name__=="__main__":
    main()
