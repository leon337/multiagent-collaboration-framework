#!/usr/bin/env python3
import argparse
import html
import json
from pathlib import Path
from string import Template

def e(v):
    return html.escape(str(v if v is not None else ""))

def refs_list(refs):
    if not refs:
        return '<div class="empty">Nenhuma referência</div>'
    return '<ul class="refs">' + ''.join(
        '<li data-ref-id="'+e(r["id"])+'"><span class="kind">'+e(r["kind"])+'</span> <code>'+e(r["canonicalRef"])+'</code></li>'
        for r in refs
    ) + '</ul>'

def source_refs(refs):
    if not refs:
        return '<div class="empty">Nenhuma fonte registrada</div>'
    return '<ul class="sources">' + ''.join(
        '<li><code>'+e(r["source"])+'</code> · '+e(r["ref"])+'</li>' for r in refs
    ) + '</ul>'

def proof_block(x):
    prov = x.get("provenance", {})
    rows = [
        '<div><b>Subject:</b> <code>'+e(x["subject"]["canonicalRef"])+'</code></div>',
        '<div><b>Provenance:</b> '+e(prov.get("mode",""))+'</div>',
        '<div><b>Revision:</b> <code>'+e(x["revision"]["source"])+'@'+e(x["revision"]["value"])+'</code></div>'
    ]
    if prov.get("ruleId"):
        rows.insert(2,'<div><b>Rule:</b> <code>'+e(prov["ruleId"])+'</code></div>')
    if x.get("trust",{}).get("reason"):
        rows.insert(2,'<div><b>Trust reason:</b> '+e(x["trust"]["reason"])+'</div>')
    rows.append(source_refs(prov.get("sourceRefs", [])))
    return '<details><summary>Por que estou vendo isso?</summary><div class="proof">'+''.join(rows)+'</div></details>'

def relation_block(subject, relations, objects_by_id):
    links=[]
    for r in relations:
        if r.get("type") != "supported_by" or r.get("from") != subject:
            continue
        target=r["to"]
        obj=objects_by_id.get(target["id"])
        freshness=obj["freshness"] if obj else r["freshness"]
        trust_class=obj["trust"]["class"] if obj else r["trust"]["class"]
        detail=[
            '<div><b>Relation provenance:</b> '+e(r["provenance"]["mode"])+'</div>',
            source_refs(r["provenance"].get("sourceRefs",[]))
        ]
        if obj:
            detail.insert(0,'<div><b>Evidence revision:</b> <code>'+e(obj["revision"]["source"])+'@'+e(obj["revision"]["value"])+'</code></div>')
            detail.append(source_refs(obj.get("sourceRefs",[])))
        links.append(
            '<li data-supported-by-ref="'+e(target["id"])+'">'
            '<code>'+e(target["canonicalRef"])+'</code> '
            '<span class="meta">'+e(freshness)+' · '+e(trust_class)+'</span>'
            '<details><summary>Relação / fonte</summary><div class="proof">'+''.join(detail)+'</div></details>'
            '</li>'
        )
    if not links:
        return ''
    return '<div class="evidence-links"><div class="cat">SUSTENTADO POR</div><ul class="refs">'+''.join(links)+'</ul></div>'

def entry_card(x, relations=None, objects_by_id=None):
    relations=relations or []
    objects_by_id=objects_by_id or {}
    return (
        '<article class="card" data-entry-id="'+e(x["id"])+'" data-freshness="'+e(x["freshness"])+'" data-trust="'+e(x["trust"]["class"])+'">'
        '<div class="row"><div><div class="cat">'+e(x["category"])+'</div><div class="content">'+e(x["content"])+'</div></div>'
        '<div class="badges"><span>'+e(x["freshness"])+'</span><span>'+e(x["trust"]["class"])+'</span></div></div>'
        + proof_block(x)
        + relation_block(x["subject"], relations, objects_by_id)
        + '</article>'
    )

def hero_entry(x, label, state_style=False, fallback="Não estabelecido"):
    if not x:
        return '<div><div class="muted">'+e(label)+'</div><div class="empty">'+e(fallback)+'</div></div>'
    main = '<div class="state">'+e(x["content"])+'</div>' if state_style else '<h2>'+e(x["content"])+'</h2>'
    return (
        '<div data-entry-id="'+e(x["id"])+'" data-freshness="'+e(x["freshness"])+'" data-trust="'+e(x["trust"]["class"])+'">'
        '<div class="muted">'+e(label)+'</div>'+main+
        '<div class="meta">'+e(x["freshness"])+' · '+e(x["trust"]["class"])+'</div>'+
        proof_block(x)+'</div>'
    )

def diagnostic_card(d):
    return (
        '<article class="diag" data-diagnostic-type="'+e(d["type"])+'" data-severity="'+e(d["severity"])+'">'
        '<div class="row"><div><div class="cat">'+e(d["type"])+'</div><div class="content">'+e(d["message"])+'</div></div>'
        '<div class="badges"><span>'+e(d["severity"])+'</span></div></div>'
        '<details><summary>Fontes do diagnóstico</summary>'+source_refs(d.get("sourceRefs",[]))+'</details></article>'
    )

def packet_entry_ids(packet):
    keys = ["objective","constraints","currentState","decisions","blockers","nextActions","openQuestions"]
    return {k:[x["id"] for x in packet.get(k,[])] for k in keys}

def render(bundle):
    sl = bundle["contextSlice"]
    packet = bundle["agentContextPacket"]
    all_entries = sl["entries"]
    state = next((x for x in all_entries if x["category"]=="STATE"), None)
    goal = next((x for x in all_entries if x["category"]=="GOAL"), None)
    active_context_ref = sl.get("scope", {}).get("context")
    active_context_obj = None
    if active_context_ref:
        active_context_obj = next(
            (x for x in bundle.get("projectedObjects", []) if x.get("ref") == active_context_ref),
            None
        )
    packet_ids = packet_entry_ids(packet)
    objects_by_id = {x["ref"]["id"]: x for x in bundle.get("projectedObjects", [])}

    categories = [
        ("CONSTRAINT","Limites / constraints"),
        ("DECISION","Decisões vigentes"),
        ("BLOCKER","Bloqueios"),
        ("EVIDENCE","Evidências contextuais"),
        ("NEXT_ACTION","Próximos pontos"),
        ("OPEN_QUESTION","Questões abertas")
    ]
    sections = []
    for category,title in categories:
        items=[x for x in all_entries if x["category"]==category]
        body=''.join(entry_card(x, sl.get("relations",[]), objects_by_id) for x in items) if items else '<div class="empty">Nenhum item</div>'
        sections.append('<section class="panel"><h2>'+e(title)+'</h2>'+body+'</section>')

    diagnostics=''.join(diagnostic_card(d) for d in sl.get("diagnostics",[])) or '<div class="empty">Nenhum diagnóstico</div>'

    if active_context_obj:
        cp = active_context_obj["payload"]
        context_block = (
            '<section class="panel" data-active-context-id="'+e(active_context_obj["ref"]["id"])+'">'
            '<div class="cat">CONTEXTO ATIVO</div><h2>'+e(cp.get("label",""))+'</h2>'
            '<div class="content">'+e(cp.get("purpose",""))+'</div>'
            '<div class="meta">'+e(active_context_obj["freshness"])+' · '+e(active_context_obj["trust"]["class"])+'</div>'
            '<details><summary>Identidade / fonte</summary><div class="proof">'
            '<div><b>Canonical ref:</b> <code>'+e(active_context_obj["ref"]["canonicalRef"])+'</code></div>'
            '<div><b>Revision:</b> <code>'+e(active_context_obj["revision"]["source"])+'@'+e(active_context_obj["revision"]["value"])+'</code></div>'
            +source_refs(active_context_obj.get("sourceRefs",[]))+
            '</div></details></section>'
        )
    else:
        context_block = ""

    tpl = Template(r'''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>MCF World Context Consumer v0.2</title>
<style>
:root{color-scheme:dark;font:15px system-ui;background:#080d12;color:#eef3f8;--panel:#111923;--line:#2a3848;--muted:#93a4b7}
*{box-sizing:border-box}body{margin:0}.wrap{max-width:1250px;margin:auto;padding:18px}.head,.panel{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:12px}
h1,h2{margin:.2rem 0 .7rem}.muted,.meta{color:var(--muted)}.hero,.attention{display:grid;grid-template-columns:1fr 1fr;gap:12px}.hero>div,.attention>div{border:1px solid var(--line);border-radius:12px;padding:14px;background:#151f2b}.state{font-size:clamp(24px,4vw,42px);font-weight:900}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.card,.diag{border:1px solid var(--line);border-radius:10px;padding:12px;background:#141e29;margin:8px 0}.row{display:flex;justify-content:space-between;gap:12px}.cat{font-size:11px;letter-spacing:.12em;font-weight:800;color:var(--muted)}.content{font-size:16px;font-weight:700;margin:5px 0}.badges{display:flex;gap:5px;align-items:flex-start;flex-wrap:wrap}.badges span{border:1px solid currentColor;border-radius:999px;padding:3px 6px;font-size:10px;font-weight:800}.tabs{display:flex;gap:8px;margin:12px 0}.tabs button{font:inherit;color:inherit;background:transparent;border:1px solid var(--line);border-radius:999px;padding:8px 12px;cursor:pointer}.tabs button.on{background:#eef3f8;color:#081019}.view[hidden]{display:none}pre{white-space:pre-wrap;overflow:auto;background:#060a0e;border-radius:10px;padding:14px}code{overflow-wrap:anywhere}.empty{color:var(--muted);padding:8px 0}details{margin-top:8px}.proof{padding:9px 0;color:#c8d2dd}.refs,.sources{padding-left:20px}.kind{font-size:11px;font-weight:800;color:var(--muted)}.diag{border-style:dashed}
@media(max-width:800px){.hero,.attention,.grid{grid-template-columns:1fr}.wrap{padding:9px}.row{display:block}.badges{margin-top:8px}}
</style></head>
<body><div class="wrap">
<header class="head"><div class="muted">ARCHITECTURAL READ-ONLY TRACK · SAME MODEL / SAME UNCERTAINTY</div><h1>World Context Consumer v0.2</h1><p>O humano e MESTRE recebem representações diferentes do mesmo bundle. UNKNOWN, STALE, conflito e trust não podem desaparecer.</p></header>
<nav class="tabs"><button class="on" data-view="human">Visão humana</button><button data-view="agent">Pacote MESTRE</button></nav>

<section id="human" class="view">
<div class="hero">$hero_state$hero_goal</div>
$context_block
<section class="panel"><h2>Atenção explícita</h2><div class="attention">
<div><div class="cat">UNKNOWN</div>$unknown_refs</div>
<div><div class="cat">STALE</div>$stale_refs</div>
</div></section>
<div class="grid">$sections</div>
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
document.querySelectorAll("[data-view]").forEach(function(b){
 b.addEventListener("click",function(){
  document.querySelectorAll("[data-view]").forEach(function(x){x.classList.toggle("on",x===b)});
  document.querySelectorAll(".view").forEach(function(v){v.hidden=v.id!==b.dataset.view});
 });
});
</script></body></html>''')

    return tpl.substitute(
        hero_state=hero_entry(state,"MISSÃO · ESTADO",True,"UNKNOWN"),
        hero_goal=hero_entry(goal,"OBJETIVO",False,"Não estabelecido"),
        context_block=context_block,
        unknown_refs=refs_list(sl.get("unknownRefs",[])),
        stale_refs=refs_list(sl.get("staleRefs",[])),
        sections=''.join(sections),
        diagnostics=diagnostics,
        global_sources=source_refs(sl.get("sourceRefs",[])),
        recipient=e(packet["recipient"]["canonicalRef"]),
        authority=e(packet.get("authorityRef","")),
        packet_index=e(json.dumps(packet_ids,ensure_ascii=False,sort_keys=True)),
        packet_json=e(json.dumps(packet,ensure_ascii=False,indent=2))
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
