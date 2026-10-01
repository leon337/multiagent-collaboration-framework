#!/usr/bin/env python3
import argparse
import html
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

from adapter_v01 import ROOT, build

DEFAULT_MISSION = ROOT / "context/missions/mcf-world-projection-001.json"

def git_head():
    return subprocess.check_output(["git","-C",str(ROOT),"rev-parse","HEAD"], text=True).strip()

def first_entry(entries, category):
    for e in entries:
        if e.get("category") == category:
            return e
    return None

def entries(entries, category):
    return [e for e in entries if e.get("category") == category]

def render(bundle):
    sl = bundle["contextSlice"]
    packet = bundle["agentContextPacket"]
    mission_ref = sl["scope"]["mission"]
    state = first_entry(sl["entries"], "STATE")
    goal = first_entry(sl["entries"], "GOAL")
    constraints = entries(sl["entries"], "CONSTRAINT")
    decisions = entries(sl["entries"], "DECISION")
    next_actions = entries(sl["entries"], "NEXT_ACTION")
    open_questions = entries(sl["entries"], "OPEN_QUESTION")

    def e(v):
        return html.escape(str(v if v is not None else ""))

    def cards(items, empty):
        if not items:
            return '<div class="empty">'+e(empty)+'</div>'
        return "".join(
            '<article class="card"><div class="cat">'+e(x["category"])+'</div>'
            '<div class="content">'+e(x["content"])+'</div>'
            '<div class="meta">'+e(x["freshness"])+' · '+e(x["trust"]["class"])+'</div></article>'
            for x in items
        )

    packet_json = html.escape(json.dumps(packet, ensure_ascii=False, indent=2))
    sources = "".join('<li><code>'+e(x["source"])+'</code> '+e(x["ref"])+'</li>' for x in sl["sourceRefs"])
    evidence = "".join('<li>'+e(x["kind"])+' · <code>'+e(x["canonicalRef"])+'</code></li>' for x in packet["relevantEvidence"]) or "<li>Nenhuma evidência referenciada</li>"
    artifacts = "".join('<li>'+e(x["kind"])+' · <code>'+e(x["canonicalRef"])+'</code></li>' for x in packet["relevantArtifacts"]) or "<li>Nenhum artefato referenciado</li>"

    return """<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>MCF World Context Consumer v0.1</title>
<style>
:root{color-scheme:dark;font:15px system-ui;background:#080d12;color:#eef3f8;--panel:#111923;--line:#2a3848;--muted:#93a4b7}
*{box-sizing:border-box}body{margin:0}.wrap{max-width:1250px;margin:auto;padding:20px}.head,.panel{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:12px}
h1,h2,h3{margin:.2rem 0 .7rem}.muted,.meta{color:var(--muted)}.hero{display:grid;grid-template-columns:1.2fr .8fr;gap:12px}.hero>div{border:1px solid var(--line);border-radius:12px;padding:16px;background:#151f2b}.state{font-size:clamp(25px,4vw,44px);font-weight:900}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.card{border:1px solid var(--line);border-radius:10px;padding:12px;background:#141e29;margin:8px 0}.cat{font-size:11px;letter-spacing:.12em;font-weight:800;color:var(--muted)}.content{font-size:16px;font-weight:700;margin:5px 0}.meta{font-size:12px}.tabs{display:flex;gap:8px;margin:12px 0}.tabs button{font:inherit;color:inherit;background:transparent;border:1px solid var(--line);border-radius:999px;padding:8px 12px;cursor:pointer}.tabs button.on{background:#eef3f8;color:#081019}.view[hidden]{display:none}pre{white-space:pre-wrap;overflow:auto;background:#060a0e;border-radius:10px;padding:14px}code{overflow-wrap:anywhere}.empty{color:var(--muted);padding:10px 0}details{margin-top:12px}
@media(max-width:800px){.hero,.grid{grid-template-columns:1fr}.wrap{padding:10px}}
</style></head>
<body><div class="wrap">
<header class="head"><div class="muted">MCF-WORLD-PROJECTION-001 · SAME MODEL / TWO REPRESENTATIONS</div><h1>World Context Consumer v0.1</h1><p>Read-only, derivado e descartável. Fonte canônica continua fora do World.</p></header>
<nav class="tabs"><button class="on" data-view="human">Visão humana</button><button data-view="agent">Pacote MESTRE</button></nav>

<section id="human" class="view">
<div class="hero">
<div><div class="muted">MISSÃO · AGORA</div><div class="state">"""+e(state["content"] if state else "UNKNOWN")+"""</div><div class="meta">"""+e(state["freshness"] if state else "UNKNOWN")+""" · """+e(state["trust"]["class"] if state else "UNKNOWN")+"""</div></div>
<div><div class="muted">ESCOPO ATIVO</div><h2>"""+e(mission_ref["canonicalRef"])+"""</h2><p>Revision: <code>"""+e(bundle["sourceRevision"])+"""</code></p></div>
</div>
<section class="panel"><div class="muted">OBJETIVO</div><h2>"""+e(goal["content"] if goal else "Não estabelecido")+"""</h2></section>
<div class="grid">
<section class="panel"><h2>Limites / constraints</h2>"""+cards(constraints,"Nenhum constraint projetado")+"""</section>
<section class="panel"><h2>Decisões vigentes</h2>"""+cards(decisions,"Nenhuma decisão projetada")+"""</section>
<section class="panel"><h2>Próximos pontos</h2>"""+cards(next_actions,"Nenhuma próxima ação projetada")+"""</section>
<section class="panel"><h2>Questões abertas</h2>"""+cards(open_questions,"Nenhuma questão aberta projetada")+"""</section>
</div>
<section class="panel"><h2>Evidência e artefatos alcançáveis</h2><h3>Evidências</h3><ul>"""+evidence+"""</ul><h3>Artefatos</h3><ul>"""+artifacts+"""</ul>
<details><summary>Proveniência / fontes</summary><ul>"""+sources+"""</ul></details></section>
</section>

<section id="agent" class="view" hidden>
<div class="panel"><div class="muted">MACHINE-READABLE · NÃO CONCEDE AUTORIDADE</div><h2>AgentContextPacket</h2><p>Recipient: <code>"""+e(packet["recipient"]["canonicalRef"])+"""</code></p><p>Authority reference: <code>"""+e(packet.get("authorityRef",""))+"""</code></p><pre>"""+packet_json+"""</pre></div>
</section>
</div>
<script>
document.querySelectorAll("[data-view]").forEach(function(b){
 b.addEventListener("click",function(){
  document.querySelectorAll("[data-view]").forEach(function(x){x.classList.toggle("on",x===b)});
  document.querySelectorAll(".view").forEach(function(v){v.hidden=v.id!==b.dataset.view});
 });
});
</script></body></html>"""

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--mission-file",default=str(DEFAULT_MISSION))
    ap.add_argument("--revision")
    ap.add_argument("--generated-at")
    ap.add_argument("--repo",default="leon337/multiagent-collaboration-framework")
    ap.add_argument("--output",required=True)
    args=ap.parse_args()

    mission=json.loads(Path(args.mission_file).read_text())
    rev=args.revision or git_head()
    generated=args.generated_at or datetime.now(timezone.utc).isoformat().replace("+00:00","Z")
    bundle=build(mission,rev,generated,args.repo)
    Path(args.output).write_text(render(bundle),encoding="utf-8")
    print(args.output)

if __name__=="__main__":
    main()
