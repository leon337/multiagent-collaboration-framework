#!/usr/bin/env python3
import argparse
import html
import json
from pathlib import Path
from string import Template

from context_consumer_v02 import (
    e,
    hero_entry,
    refs_list,
    source_refs,
    proof_block,
    diagnostic_card,
    packet_entry_ids,
)

def evidence_nav_block(entry, relations, objects_by_id):
    links=[]
    for r in relations:
        if r.get("type") != "supported_by" or r.get("from") != entry["subject"]:
            continue
        target=r["to"]
        obj=objects_by_id.get(target["id"])
        if not obj or obj.get("freshness")=="UNKNOWN":
            continue
        links.append(
            '<button class="evidence-nav" type="button" '
            'data-origin-entry="'+e(entry["id"])+'" '
            'data-nav-evidence="'+e(target["id"])+'">'
            'Abrir evidência · '+e(target["canonicalRef"])+'</button>'
        )
    if not links:
        return ""
    return '<div class="evidence-links"><div class="cat">SUSTENTADO POR</div>'+''.join(links)+'</div>'

def entry_card(entry, relations, objects_by_id):
    return (
        '<article class="card" data-entry-id="'+e(entry["id"])+'" '
        'data-freshness="'+e(entry["freshness"])+'" '
        'data-trust="'+e(entry["trust"]["class"])+'">'
        '<div class="row"><div><div class="cat">'+e(entry["category"])+'</div>'
        '<div class="content">'+e(entry["content"])+'</div></div>'
        '<div class="badges"><span>'+e(entry["freshness"])+'</span>'
        '<span>'+e(entry["trust"]["class"])+'</span></div></div>'
        + proof_block(entry)
        + evidence_nav_block(entry, relations, objects_by_id)
        + '</article>'
    )

def evidence_detail(obj, inbound_relations):
    ref=obj["ref"]
    rels=[]
    for r in inbound_relations:
        rels.append(
            '<div class="relation-proof">'
            '<div><b>Relation:</b> '+e(r["type"])+'</div>'
            '<div><b>Relation trust:</b> '+e(r["trust"]["class"])+'</div>'
            '<div><b>Relation provenance:</b> '+e(r["provenance"]["mode"])+'</div>'
            + ('<div><b>Relation reason:</b> '+e(r["trust"].get("reason"))+'</div>' if r["trust"].get("reason") else '')
            + source_refs(r["provenance"].get("sourceRefs",[]))
            + '</div>'
        )
    payload=obj.get("payload",{})
    return (
        '<article class="evidence-detail" data-evidence-detail="'+e(ref["id"])+'" hidden>'
        '<div class="cat">EVIDENCE · READ-ONLY</div>'
        '<h2>'+e(payload.get("summary",ref["canonicalRef"]))+'</h2>'
        '<div class="badges"><span>'+e(obj["freshness"])+'</span><span>'+e(obj["trust"]["class"])+'</span></div>'
        '<dl>'
        '<dt>Canonical ref</dt><dd><code>'+e(ref["canonicalRef"])+'</code></dd>'
        '<dt>Revision</dt><dd><code>'+e(obj["revision"]["source"])+'@'+e(obj["revision"]["value"])+'</code></dd>'
        '<dt>Observed at</dt><dd>'+e(obj.get("observedAt",""))+'</dd>'
        '<dt>Trust reason</dt><dd>'+e(obj.get("trust",{}).get("reason","—"))+'</dd>'
        '</dl>'
        '<details open><summary>Fonte da evidência</summary>'+source_refs(obj.get("sourceRefs",[]))+'</details>'
        '<details open><summary>Como esta evidência sustenta a decisão?</summary>'+(''.join(rels) if rels else '<div class="empty">Nenhuma relação supported_by observada.</div>')+'</details>'
        '<button type="button" class="back-context" data-back-context>Voltar ao contexto</button>'
        '</article>'
    )

def render(bundle):
    sl=bundle["contextSlice"]
    packet=bundle["agentContextPacket"]
    all_entries=sl["entries"]
    relations=sl.get("relations",[])
    objects=bundle.get("projectedObjects",[])
    objects_by_id={x["ref"]["id"]:x for x in objects}
    state=next((x for x in all_entries if x["category"]=="STATE"),None)
    goal=next((x for x in all_entries if x["category"]=="GOAL"),None)

    active_context_ref=sl.get("scope",{}).get("context")
    active_context_obj=objects_by_id.get(active_context_ref["id"]) if active_context_ref else None
    if active_context_obj:
        cp=active_context_obj["payload"]
        context_block=(
            '<section class="panel" data-active-context-id="'+e(active_context_obj["ref"]["id"])+'">'
            '<div class="cat">CONTEXTO ATIVO</div><h2>'+e(cp.get("label",""))+'</h2>'
            '<div class="content">'+e(cp.get("purpose",""))+'</div>'
            '<div class="meta">'+e(active_context_obj["freshness"])+' · '+e(active_context_obj["trust"]["class"])+'</div>'
            '<details><summary>Identidade / fonte</summary><div class="proof">'
            '<div><b>Canonical ref:</b> <code>'+e(active_context_obj["ref"]["canonicalRef"])+'</code></div>'
            '<div><b>Revision:</b> <code>'+e(active_context_obj["revision"]["source"])+'@'+e(active_context_obj["revision"]["value"])+'</code></div>'
            + source_refs(active_context_obj.get("sourceRefs",[]))
            + '</div></details></section>'
        )
    else:
        context_block=""

    categories=[
        ("CONSTRAINT","Limites / constraints"),
        ("DECISION","Decisões vigentes"),
        ("BLOCKER","Bloqueios"),
        ("EVIDENCE","Evidências contextuais"),
        ("NEXT_ACTION","Próximos pontos"),
        ("OPEN_QUESTION","Questões abertas"),
    ]
    sections=[]
    for category,title in categories:
        items=[x for x in all_entries if x["category"]==category]
        body=''.join(entry_card(x,relations,objects_by_id) for x in items) if items else '<div class="empty">Nenhum item</div>'
        sections.append('<section class="panel"><h2>'+e(title)+'</h2>'+body+'</section>')

    inbound={}
    for r in relations:
        if r.get("type")=="supported_by":
            inbound.setdefault(r["to"]["id"],[]).append(r)

    evidence_ids=[]
    for r in relations:
        if r.get("type")=="supported_by" and r["to"]["id"] in objects_by_id:
            obj=objects_by_id[r["to"]["id"]]
            if obj.get("freshness")!="UNKNOWN" and r["to"]["id"] not in evidence_ids:
                evidence_ids.append(r["to"]["id"])
    evidence_details=''.join(evidence_detail(objects_by_id[x],inbound.get(x,[])) for x in evidence_ids)

    diagnostics=''.join(diagnostic_card(d) for d in sl.get("diagnostics",[])) or '<div class="empty">Nenhum diagnóstico</div>'
    packet_ids=packet_entry_ids(packet)

    tpl=Template(r'''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>MCF World Context Consumer v0.3</title>
<style>
:root{color-scheme:dark;font:15px system-ui;background:#080d12;color:#eef3f8;--panel:#111923;--line:#2a3848;--muted:#93a4b7}
*{box-sizing:border-box}body{margin:0}.wrap{max-width:1250px;margin:auto;padding:18px}.head,.panel,.evidence-pane{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:12px}
h1,h2{margin:.2rem 0 .7rem}.muted,.meta{color:var(--muted)}.hero,.attention{display:grid;grid-template-columns:1fr 1fr;gap:12px}.hero>div,.attention>div{border:1px solid var(--line);border-radius:12px;padding:14px;background:#151f2b}.state{font-size:clamp(24px,4vw,42px);font-weight:900}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.card,.diag{border:1px solid var(--line);border-radius:10px;padding:12px;background:#141e29;margin:8px 0}.card.selected{outline:2px solid #eef3f8;outline-offset:2px}.row{display:flex;justify-content:space-between;gap:12px}.cat{font-size:11px;letter-spacing:.12em;font-weight:800;color:var(--muted)}.content{font-size:16px;font-weight:700;margin:5px 0}.badges{display:flex;gap:5px;align-items:flex-start;flex-wrap:wrap}.badges span{border:1px solid currentColor;border-radius:999px;padding:3px 6px;font-size:10px;font-weight:800}.tabs{display:flex;gap:8px;margin:12px 0}.tabs button,.evidence-nav,.back-context{font:inherit;color:inherit;background:transparent;border:1px solid var(--line);border-radius:9px;padding:8px 12px;cursor:pointer}.tabs button.on{background:#eef3f8;color:#081019}.evidence-nav{display:block;width:100%;text-align:left;margin:7px 0}.back-context{margin-top:14px}.view[hidden],.evidence-detail[hidden],.evidence-pane[hidden]{display:none}pre{white-space:pre-wrap;overflow:auto;background:#060a0e;border-radius:10px;padding:14px}code{overflow-wrap:anywhere}.empty{color:var(--muted);padding:8px 0}details{margin-top:8px}.proof,.relation-proof{padding:9px 0;color:#c8d2dd}.refs,.sources{padding-left:20px}.kind{font-size:11px;font-weight:800;color:var(--muted)}.diag{border-style:dashed}.evidence-pane{position:sticky;bottom:8px;box-shadow:0 -8px 30px #0008}.evidence-pane dl{display:grid;grid-template-columns:120px 1fr;gap:7px}.evidence-pane dt{color:var(--muted)}.evidence-pane dd{margin:0}
@media(max-width:800px){.hero,.attention,.grid{grid-template-columns:1fr}.wrap{padding:9px}.row{display:block}.badges{margin-top:8px}.evidence-pane{position:static}.evidence-pane dl{grid-template-columns:1fr}}
</style></head>
<body><div class="wrap">
<header class="head"><div class="muted">OPERATIONAL EVIDENCE NAVIGATION · READ-ONLY</div><h1>World Context Consumer v0.3</h1><p>Decision → Evidence → provenance/revision/source → voltar ao contexto. O hash representa apenas seleção de apresentação.</p></header>
<nav class="tabs"><button class="on" data-view="human">Visão humana</button><button data-view="agent">Pacote MESTRE</button></nav>

<section id="human" class="view">
<div class="hero">$hero_state$hero_goal</div>
$context_block
<section class="panel"><h2>Atenção explícita</h2><div class="attention">
<div><div class="cat">UNKNOWN</div>$unknown_refs</div>
<div><div class="cat">STALE</div>$stale_refs</div>
</div></section>
<div class="grid">$sections</div>
<section id="evidence-pane" class="evidence-pane" hidden>
<div class="muted">SELEÇÃO DE EVIDÊNCIA · APENAS LEITURA</div>
$evidence_details
</section>
<section class="panel"><h2>Diagnósticos</h2>$diagnostics</section>
<section class="panel"><h2>Fontes globais do slice</h2>$global_sources</section>
</section>

<section id="agent" class="view" hidden>
<div class="panel"><div class="muted">MACHINE-READABLE · NÃO CONCEDE AUTORIDADE</div><h2>AgentContextPacket</h2>
<p>Recipient: <code>$recipient</code></p>
<p>Authority reference: <code>$authority</code></p>
<div id="packet-index" data-packet-entry-ids='$packet_index'></div>
<pre>$packet_json</pre></div>
</section>
</div>
<script>
function entryNode(id){
  return [...document.querySelectorAll("[data-entry-id]")].find(function(x){return x.dataset.entryId===id});
}
function evidenceNode(id){
  return [...document.querySelectorAll("[data-evidence-detail]")].find(function(x){return x.dataset.evidenceDetail===id});
}
function readSelection(){
  const p=new URLSearchParams(location.hash.replace(/^#/,""));
  return {entry:p.get("entry")||"", evidence:p.get("evidence")||""};
}
function writeSelection(entry,evidence){
  const p=new URLSearchParams();
  if(entry)p.set("entry",entry);
  if(evidence)p.set("evidence",evidence);
  const next=p.toString();
  history.replaceState(null,"",next ? "#"+next : location.pathname+location.search);
  applySelection(false);
}
function applySelection(scroll){
  const s=readSelection();
  document.querySelectorAll("[data-entry-id]").forEach(function(x){x.classList.toggle("selected",x.dataset.entryId===s.entry)});
  document.querySelectorAll("[data-evidence-detail]").forEach(function(x){x.hidden=x.dataset.evidenceDetail!==s.evidence});
  const pane=document.querySelector("#evidence-pane");
  const detail=evidenceNode(s.evidence);
  pane.hidden=!detail;
  if(scroll){
    const target=detail || entryNode(s.entry);
    if(target)target.scrollIntoView({block:"nearest"});
  }
}
document.querySelectorAll("[data-nav-evidence]").forEach(function(b){
  b.addEventListener("click",function(){writeSelection(b.dataset.originEntry,b.dataset.navEvidence);});
});
document.querySelectorAll("[data-back-context]").forEach(function(b){
  b.addEventListener("click",function(){const s=readSelection();writeSelection(s.entry,"");applySelection(true);});
});
document.querySelectorAll("[data-view]").forEach(function(b){
 b.addEventListener("click",function(){
  document.querySelectorAll("[data-view]").forEach(function(x){x.classList.toggle("on",x===b)});
  document.querySelectorAll(".view").forEach(function(v){v.hidden=v.id!==b.dataset.view});
 });
});
window.addEventListener("hashchange",function(){applySelection(true)});
applySelection(false);
</script></body></html>''')

    return tpl.substitute(
        hero_state=hero_entry(state,"MISSÃO · ESTADO",True,"UNKNOWN"),
        hero_goal=hero_entry(goal,"OBJETIVO",False,"Não estabelecido"),
        context_block=context_block,
        unknown_refs=refs_list(sl.get("unknownRefs",[])),
        stale_refs=refs_list(sl.get("staleRefs",[])),
        sections=''.join(sections),
        evidence_details=evidence_details or '<div class="empty">Nenhuma evidência supported_by observada.</div>',
        diagnostics=diagnostics,
        global_sources=source_refs(sl.get("sourceRefs",[])),
        recipient=e(packet["recipient"]["canonicalRef"]),
        authority=e(packet.get("authorityRef","")),
        packet_index=e(json.dumps(packet_ids,ensure_ascii=False,sort_keys=True)),
        packet_json=e(json.dumps(packet,ensure_ascii=False,indent=2)),
    )

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--bundle",required=True)
    ap.add_argument("--output",required=True)
    args=ap.parse_args()
    bundle=json.loads(Path(args.bundle).read_text())
    Path(args.output).write_text(render(bundle),encoding="utf-8")
    print(args.output)

if __name__=="__main__":
    main()
