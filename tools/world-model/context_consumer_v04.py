#!/usr/bin/env python3
import argparse
import html
import json
from pathlib import Path

from context_consumer_v03 import render as render_v03

def e(v):
    return html.escape(str(v if v is not None else ""))

def inject_source_preview(page, preview_bundle):
    previews=preview_bundle.get("previews",{})
    matched={k:v for k,v in previews.items() if v.get("status")=="MATCHED"}
    if not matched:
        return page

    buttons=[]
    details=[]
    for evidence_id,p in matched.items():
        buttons.append(
            '<button type="button" class="source-preview-nav" data-source-preview="'+e(evidence_id)+'">'
            'Prévia da fonte</button>'
        )
        details.append(
            '<article class="source-preview-detail" data-source-preview-detail="'+e(evidence_id)+'" hidden>'
            '<div class="cat">SOURCE PREVIEW · READ-ONLY</div>'
            '<h2>'+e(p["sourceRef"]["ref"])+'</h2>'
            '<div class="breadcrumb">Context → Decision → Evidence → <b>Source</b></div>'
            '<dl>'
            '<dt>Source ref</dt><dd><code>'+e(p["sourceRef"]["source"])+' · '+e(p["sourceRef"]["ref"])+'</code></dd>'
            '<dt>Revision</dt><dd><code>'+e(p["observedRevision"])+'</code></dd>'
            '<dt>Location</dt><dd>lines '+e(p["lineStart"])+'–'+e(p["lineEnd"])+'</dd>'
            '</dl>'
            '<pre class="source-excerpt">'+e(p["content"])+'</pre>'
            '<button type="button" class="back-evidence" data-back-evidence>Voltar à evidência</button>'
            '</article>'
        )

    # Add a preview button only inside the matching evidence detail.
    for evidence_id,button in zip(matched.keys(),buttons):
        marker='data-evidence-detail="'+html.escape(evidence_id)+'"'
        idx=page.find(marker)
        if idx<0:
            continue
        close=page.find('</article>',idx)
        if close<0:
            continue
        page=page[:close]+button+page[close:]

    source_pane=(
        '<section id="source-preview-pane" class="evidence-pane" hidden>'
        '<div class="muted">SOURCE PREVIEW · APENAS FONTE JÁ REFERENCIADA</div>'
        + ''.join(details) +
        '</section>'
    )
    insert_at=page.find('<section class="panel"><h2>Diagnósticos</h2>')
    if insert_at>=0:
        page=page[:insert_at]+source_pane+page[insert_at:]

    script_add=r'''
<script>
function sourcePreviewNode(id){
  return [...document.querySelectorAll("[data-source-preview-detail]")].find(function(x){return x.dataset.sourcePreviewDetail===id});
}
function applySourcePreview(scroll){
  const p=new URLSearchParams(location.hash.replace(/^#/,""));
  const evidence=p.get("evidence")||"";
  const source=p.get("source")||"";
  document.querySelectorAll("[data-source-preview-detail]").forEach(function(x){x.hidden=!(source==="1" && x.dataset.sourcePreviewDetail===evidence)});
  const pane=document.querySelector("#source-preview-pane");
  const detail=sourcePreviewNode(evidence);
  pane.hidden=!(source==="1" && detail);
  if(scroll && !pane.hidden) detail.scrollIntoView({block:"nearest"});
}
document.querySelectorAll("[data-source-preview]").forEach(function(b){
  b.addEventListener("click",function(){
    const p=new URLSearchParams(location.hash.replace(/^#/,""));
    p.set("source","1");
    history.replaceState(null,"","#"+p.toString());
    applySourcePreview(true);
  });
});
document.querySelectorAll("[data-back-evidence]").forEach(function(b){
  b.addEventListener("click",function(){
    const p=new URLSearchParams(location.hash.replace(/^#/,""));
    p.delete("source");
    history.replaceState(null,"","#"+p.toString());
    applySourcePreview(false);
    const ev=[...document.querySelectorAll("[data-evidence-detail]")].find(function(x){return !x.hidden});
    if(ev)ev.scrollIntoView({block:"nearest"});
  });
});
window.addEventListener("hashchange",function(){applySourcePreview(true)});
applySourcePreview(false);
</script>
'''
    page=page.replace('</body>',script_add+'</body>')
    return page

def render(bundle,preview_bundle):
    return inject_source_preview(render_v03(bundle),preview_bundle)

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--bundle",required=True)
    ap.add_argument("--previews",required=True)
    ap.add_argument("--output",required=True)
    args=ap.parse_args()
    bundle=json.loads(Path(args.bundle).read_text())
    previews=json.loads(Path(args.previews).read_text())
    Path(args.output).write_text(render(bundle,previews),encoding="utf-8")
    print(args.output)

if __name__=="__main__":
    main()
