#!/usr/bin/env python3
import argparse
import hashlib
import json
from pathlib import Path

def sha256_file(path):
    return "sha256:" + hashlib.sha256(Path(path).read_bytes()).hexdigest()

def safe_repo_path(repo_root, rel_path):
    root=Path(repo_root).resolve()
    target=(root/rel_path).resolve()
    if target != root and root not in target.parents:
        raise ValueError("source path escapes repository root: "+rel_path)
    return target

def first_section(text, max_lines=28, max_chars=4200):
    lines=text.splitlines()
    if not lines:
        return 1,1,""
    start=0
    # Prefer the first markdown heading if one exists near the beginning.
    for i,line in enumerate(lines[:20]):
        if line.lstrip().startswith("#"):
            start=i
            break
    end=min(len(lines), start+max_lines)
    # Stop at the next top-level-ish heading after at least a few lines.
    for i in range(start+4,end):
        if lines[i].lstrip().startswith("# "):
            end=i
            break
    content="\n".join(lines[start:end])
    if len(content)>max_chars:
        content=content[:max_chars].rstrip()+"\n…"
    return start+1,end,content

def build_source_previews(bundle, repo_root):
    objects={x["ref"]["id"]:x for x in bundle.get("projectedObjects",[])}
    previews={}
    errors=[]
    supported_targets=[]
    for r in bundle.get("contextSlice",{}).get("relations",[]):
        if r.get("type")=="supported_by":
            tid=r["to"]["id"]
            if tid not in supported_targets:
                supported_targets.append(tid)

    for tid in supported_targets:
        obj=objects.get(tid)
        if not obj or obj.get("freshness")=="UNKNOWN":
            continue
        refs=[x for x in obj.get("sourceRefs",[]) if x.get("source")=="repo-file"]
        if len(refs)!=1:
            continue
        rel_path=refs[0]["ref"]
        try:
            path=safe_repo_path(repo_root,rel_path)
        except ValueError as ex:
            errors.append({"evidenceId":tid,"type":"PATH_OUTSIDE_REPO","message":str(ex)})
            continue
        if not path.is_file():
            errors.append({"evidenceId":tid,"type":"SOURCE_MISSING","message":"Source file unavailable: "+rel_path})
            continue
        raw=path.read_bytes()
        digest="sha256:" + hashlib.sha256(raw).hexdigest()
        expected=obj.get("revision",{}).get("value")
        if digest != expected:
            previews[tid]={
                "evidenceId":tid,
                "status":"REVISION_MISMATCH",
                "sourceRef":refs[0],
                "canonicalRef":obj["ref"]["canonicalRef"],
                "expectedRevision":expected,
                "observedRevision":digest,
                "lineStart":None,
                "lineEnd":None,
                "content":None,
            }
            continue
        text=raw.decode("utf-8",errors="replace")
        line_start,line_end,content=first_section(text)
        previews[tid]={
            "evidenceId":tid,
            "status":"MATCHED",
            "sourceRef":refs[0],
            "canonicalRef":obj["ref"]["canonicalRef"],
            "expectedRevision":expected,
            "observedRevision":digest,
            "lineStart":line_start,
            "lineEnd":line_end,
            "content":content,
        }
    return {"schema":"world-source-preview/v1","previews":previews,"errors":errors}

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--bundle",required=True)
    ap.add_argument("--repo-root",required=True)
    ap.add_argument("--output",required=True)
    args=ap.parse_args()
    bundle=json.loads(Path(args.bundle).read_text())
    out=build_source_previews(bundle,args.repo_root)
    Path(args.output).write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
    print(args.output)

if __name__=="__main__":
    main()
