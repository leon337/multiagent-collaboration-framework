#!/usr/bin/env python3
import argparse, base64, html, json
from pathlib import Path

p=argparse.ArgumentParser()
p.add_argument("--video",required=True)
p.add_argument("--timeline",required=True)
p.add_argument("--output",required=True)
args=p.parse_args()

video=Path(args.video).read_bytes()
video_b64=base64.b64encode(video).decode("ascii")
timeline=json.loads(Path(args.timeline).read_text(encoding="utf-8"))
rows="".join(
    f"<tr><td>{i+1:02d}</td><td>{s['startFrame']/timeline['fps']:.1f}s</td><td>{html.escape(s['text'])}</td></tr>"
    for i,s in enumerate(timeline["segments"])
)

page=f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>MCF Content Studio N4 — Pilot Review</title>
<style>
:root{{--bg:#070b12;--panel:#101725;--panel2:#151f31;--text:#f7f9fc;--muted:#9aa8bc;--accent:#7c8cff;--ok:#58d68d;--line:#26344f}}
*{{box-sizing:border-box}} body{{margin:0;background:radial-gradient(circle at top,#14203a 0,#070b12 42%);color:var(--text);font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif}}
main{{max-width:1180px;margin:auto;padding:28px}} header{{display:flex;justify-content:space-between;gap:20px;align-items:end;margin-bottom:24px}}
h1{{font-size:clamp(28px,5vw,56px);line-height:1;margin:0}} .eyebrow{{color:var(--accent);font-weight:800;letter-spacing:.14em;font-size:12px;margin-bottom:10px}}
.status{{border:1px solid var(--line);background:rgba(16,23,37,.8);padding:12px 16px;border-radius:999px;color:var(--ok);white-space:nowrap}}
.grid{{display:grid;grid-template-columns:minmax(0,760px) 1fr;gap:24px;align-items:start}}
.card{{background:rgba(16,23,37,.94);border:1px solid var(--line);border-radius:22px;padding:18px;box-shadow:0 30px 100px rgba(0,0,0,.25)}}
.video-shell{{background:#000;border-radius:16px;overflow:hidden;display:flex;justify-content:center;max-height:78vh}} video{{width:auto;max-width:100%;height:min(78vh,900px);display:block;background:#000}}
h2{{font-size:18px;margin:0 0 14px}} p,li{{color:var(--muted);line-height:1.55}} .meta{{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}}
.meta div{{background:var(--panel2);border-radius:14px;padding:12px}} .meta strong{{display:block;font-size:11px;letter-spacing:.08em;color:var(--muted);margin-bottom:5px}}
.meta span{{font-weight:700}} .tag{{display:inline-flex;background:#1b2540;border:1px solid #34446a;border-radius:999px;padding:6px 10px;margin:4px;font-size:12px}}
details{{margin-top:24px}} summary{{cursor:pointer;font-weight:800}} table{{width:100%;border-collapse:collapse;margin-top:12px;font-size:13px}} td,th{{border-bottom:1px solid var(--line);padding:10px;text-align:left;vertical-align:top}} th{{color:var(--muted)}}
.notice{{margin-top:18px;padding:14px;border-left:3px solid var(--accent);background:#10182a;border-radius:8px;color:var(--muted)}}
@media(max-width:900px){{header{{align-items:start;flex-direction:column}}.grid{{grid-template-columns:1fr}}.video-shell{{max-height:none}}video{{height:auto;width:100%}}}}
</style>
</head>
<body>
<main>
<header>
<div><div class="eyebrow">MCF CONTENT STUDIO • NÍVEL 4</div><h1>Runtime Agêntico Moderno</h1></div>
<div class="status">● PILOTO EXPERIMENTAL</div>
</header>

<div class="grid">
<section class="card">
<div class="video-shell">
<video controls playsinline preload="metadata">
<source src="data:video/mp4;base64,{video_b64}" type="video/mp4">
</video>
</div>
<div class="notice">Este review contém o MP4 embutido no próprio HTML. A narração foi montada por cena com voz neural PT-BR <strong>clear</strong>. Ainda não representa o master final de publicação.</div>
</section>

<aside class="card">
<h2>Review da missão</h2>
<p>Entrega de validação da missão <strong>MCF-CONTENT-STUDIO-N4-001</strong>, preservando a branch experimental e sem implicar merge ou publicação.</p>
<div class="meta">
<div><strong>FORMATO</strong><span>1080 × 1920</span></div>
<div><strong>FRAME RATE</strong><span>30 fps</span></div>
<div><strong>DURAÇÃO</strong><span>≈ 67 s</span></div>
<div><strong>ÁUDIO</strong><span>PT-BR • clear</span></div>
<div><strong>STATUS</strong><span>Experimental</span></div>
<div><strong>PIPELINE</strong><span>Remotion + TTS</span></div>
</div>
<h2 style="margin-top:22px">Componentes</h2>
<div>
<span class="tag">FocusConcept</span><span class="tag">ProgressiveDiagram</span><span class="tag">AnimatedTimeline</span><span class="tag">ActiveRecall</span><span class="tag">ErrorVsCorrect</span><span class="tag">ArchitectureNode</span><span class="tag">TerminalWindow</span><span class="tag">ChapterProgress</span>
</div>
<h2 style="margin-top:22px">O que observar</h2>
<ul>
<li>sincronia entre fala e mudança visual;</li>
<li>densidade de texto e legibilidade no celular;</li>
<li>ritmo entre cenas;</li>
<li>active recall e tempo de reflexão;</li>
<li>qualidade e naturalidade da voz.</li>
</ul>
</aside>
</div>

<details class="card">
<summary>Ver timeline de narração</summary>
<table><thead><tr><th>#</th><th>Início</th><th>Narração</th></tr></thead><tbody>{rows}</tbody></table>
</details>
</main>
</body>
</html>"""
Path(args.output).write_text(page,encoding="utf-8")
print(args.output)
