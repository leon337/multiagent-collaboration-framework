#!/usr/bin/env python3
import argparse
import html
import json
from pathlib import Path

from context_consumer_v04 import render as render_v04

def e(v):
    return html.escape(str(v if v is not None else ""))

def inject_anchor(page, anchor_bundle):
    matched={k:v for k,v in anchor_bundle.get("anchors",{}).items() if v.get("status")=="MATCHED"}
    if not matched:
        return page

    details=[]
    for evidence_id,a in matched.items():
        button=(
            '<button type="button" class="anchor-nav" '
            'data-anchor-evidence="'+e(evidence_id)+'" '
            'data-anchor-id="'+e(a["anchorId"])+'">Abrir trecho declarado</button>'
        )
        marker='data-source-preview-detail="'+html.escape(evidence_id)+'"'
        idx=page.find(marker)
        if idx>=0:
            close=page.find('</article>',idx)
            if close>=0:
                page=page[:close]+button+page[close:]

        details.append(
            '<article class="anchor-detail" data-anchor-detail="'+e(a["anchorId"])+'" '
            'data-anchor-evidence-id="'+e(evidence_id)+'" hidden>'
            '<div class="cat">EXPLICIT EVIDENCE ANCHOR · READ-ONLY</div>'
            '<h2>'+e(a["anchorId"])+'</h2>'
            '<div class="breadcrumb">Context → Decision → Evidence → Source → <b>Relevant Anchor</b></div>'
            '<dl>'
            '<dt>Declared by</dt><dd><code>'+e(a["declaredBy"]["source"])+' · '+e(a["declaredBy"]["ref"])+'</code></dd>'
            '<dt>Metadata revision</dt><dd><code>'+e(a["metadataRevision"])+'</code></dd>'
            '<dt>Source revision</dt><dd><code>'+e(a["sourceRevision"])+'</code></dd>'
            '<dt>Exact range</dt><dd>lines '+e(a["lineStart"])+'–'+e(a["lineEnd"])+'</dd>'
            '<dt>Context range</dt><dd>lines '+e(a["contextStart"])+'–'+e(a["contextEnd"])+'</dd>'
            '</dl>'
            '<h3>Declared range</h3><pre class="anchor-exact">'+e(a["content"])+'</pre>'
            '<details><summary>Bounded context</summary><pre>'+e(a["context"])+'</pre></details>'
            '<p class="muted">Este anchor declara localização. Não prova relevância semântica, verdade ou autoridade.</p>'
            '<button type="button" data-back-source>Voltar à fonte</button>'
            '</article>'
        )

    pane=(
        '<section id="anchor-pane" class="evidence-pane" hidden>'
        '<div class="muted">RELEVANCE ANCHOR · EXPLICIT METADATA ONLY</div>'
        +''.join(details)+
        '</section>'
    )
    insert_at=page.find('<section class="panel"><h2>Diagnósticos</h2>')
    if insert_at>=0:
        page=page[:insert_at]+pane+page[insert_at:]

    script=r'''
<script>
function anchorNode(anchorId){
  return [...document.querySelectorAll("[data-anchor-detail]")].find(function(x){return x.dataset.anchorDetail===anchorId});
}
function applyAnchor(scroll){
  const p=new URLSearchParams(location.hash.replace(/^#/,""));
  const anchor=p.get("anchor")||"";
  const evidence=p.get("evidence")||"";
  document.querySelectorAll("[data-anchor-detail]").forEach(function(x){
    x.hidden=!(x.dataset.anchorDetail===anchor && x.dataset.anchorEvidenceId===evidence);
  });
  const pane=document.querySelector("#anchor-pane");
  const detail=anchorNode(anchor);
  pane.hidden=!(detail && detail.dataset.anchorEvidenceId===evidence);
  if(scroll && !pane.hidden)detail.scrollIntoView({block:"nearest"});
}
document.querySelectorAll("[data-anchor-id]").forEach(function(b){
  b.addEventListener("click",function(){
    const p=new URLSearchParams(location.hash.replace(/^#/,""));
    if(p.get("evidence")!==b.dataset.anchorEvidence)return;
    p.set("anchor",b.dataset.anchorId);
    history.replaceState(null,"","#"+p.toString());
    applyAnchor(true);
  });
});
document.querySelectorAll("[data-back-source]").forEach(function(b){
  b.addEventListener("click",function(){
    const p=new URLSearchParams(location.hash.replace(/^#/,""));
    p.delete("anchor");
    history.replaceState(null,"","#"+p.toString());
    applyAnchor(false);
    const sp=document.querySelector("#source-preview-pane");
    if(sp && !sp.hidden)sp.scrollIntoView({block:"nearest"});
  });
});
window.addEventListener("hashchange",function(){applyAnchor(true)});
applyAnchor(false);
</script>
'''
    return page.replace('</body>',script+'</body>')

def render(bundle,preview_bundle,anchor_bundle):
    return inject_anchor(render_v04(bundle,preview_bundle),anchor_bundle)

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--bundle",required=True)
    ap.add_argument("--previews",required=True)
    ap.add_argument("--anchors",required=True)
    ap.add_argument("--output",required=True)
    args=ap.parse_args()
    bundle=json.loads(Path(args.bundle).read_text())
    previews=json.loads(Path(args.previews).read_text())
    anchors=json.loads(Path(args.anchors).read_text())
    Path(args.output).write_text(render(bundle,previews,anchors),encoding="utf-8")
    print(args.output)

if __name__=="__main__":
    main()
