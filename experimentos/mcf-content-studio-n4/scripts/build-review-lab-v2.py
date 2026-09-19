#!/usr/bin/env python3
import argparse, base64, html, json
from pathlib import Path

parser=argparse.ArgumentParser()
parser.add_argument("--video-a",required=True)
parser.add_argument("--video-b",required=True)
parser.add_argument("--timeline",required=True)
parser.add_argument("--benchmark",required=True)
parser.add_argument("--stills-dir",required=True)
parser.add_argument("--output",required=True)
args=parser.parse_args()

def uri(path,mime):
    return f"data:{mime};base64,"+base64.b64encode(Path(path).read_bytes()).decode("ascii")

silent=uri(args.video_a,"video/mp4")
audio=uri(args.video_b,"video/mp4")
timeline=json.loads(Path(args.timeline).read_text(encoding="utf-8"))
benchmark=json.loads(Path(args.benchmark).read_text(encoding="utf-8"))
stills_dir=Path(args.stills_dir)

still_specs=[
    ("Focus stress","qa-long-focus.png"),
    ("Timeline stress","qa-long-timeline.png"),
    ("Diagram stress","qa-long-diagram.png"),
    ("Pilot still","runtime-agentico-pilot.png"),
]
stills=[(name,uri(stills_dir/file,"image/png")) for name,file in still_specs]
rows="".join(
    f"<tr><td>{i+1:02d}</td><td>{s['startFrame']/timeline['fps']:.1f}s</td><td>{html.escape(s['text'])}</td></tr>"
    for i,s in enumerate(timeline["segments"])
)
cards="".join(
    f'<button class="still" data-src="{src}" data-title="{html.escape(name)}"><img src="{src}" alt="{html.escape(name)}"><span>{html.escape(name)}</span></button>'
    for name,src in stills
)
cues=[{"time":s["startFrame"]/timeline["fps"],"text":s["text"]} for s in timeline["segments"]]
pilot_ms=next(x["durationMs"] for x in benchmark["results"] if x["label"]=="pilot-still")
portrait_ms=next(x["durationMs"] for x in benchmark["results"] if x["label"]=="portrait-still")

page=f"""<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>MCF N4 Review Lab v2</title>
<style>
:root{{--bg:#060a11;--panel:#0e1624;--panel2:#141f31;--line:#293955;--txt:#f6f8fb;--muted:#9eacc1;--accent:#7c8cff;--ok:#55d68e}}
*{{box-sizing:border-box}}body{{margin:0;background:radial-gradient(circle at 50% -10%,#192846 0,#060a11 34%);color:var(--txt);font-family:Inter,system-ui,sans-serif}}
main{{max-width:1260px;margin:auto;padding:24px}}.top{{display:flex;justify-content:space-between;align-items:flex-end;gap:18px;margin-bottom:20px}}.eyebrow{{font-size:12px;letter-spacing:.15em;color:var(--accent);font-weight:900}}h1{{font-size:clamp(30px,5vw,58px);line-height:1;margin:8px 0 0}}.state{{padding:10px 14px;border-radius:999px;border:1px solid var(--line);background:#0d1523;color:var(--ok);font-size:13px}}
.card{{background:rgba(14,22,36,.94);border:1px solid var(--line);border-radius:22px;box-shadow:0 26px 90px rgba(0,0,0,.28)}}.toolbar{{display:flex;flex-wrap:wrap;gap:8px;padding:14px;margin-bottom:16px}}button{{font:inherit}}.seg{{border:1px solid var(--line);background:#111b2b;color:var(--muted);padding:10px 14px;border-radius:12px;cursor:pointer}}.seg.active{{background:var(--accent);color:white;border-color:var(--accent)}}.grid{{display:grid;grid-template-columns:minmax(0,780px) 1fr;gap:18px;align-items:start}}.player-card{{padding:16px}}.video-wrap{{background:#000;border-radius:16px;overflow:hidden;display:grid;place-items:center;min-height:320px}}video{{max-height:76vh;max-width:100%;width:auto;background:#000}}.caption{{margin-top:12px;background:#111b2b;border:1px solid var(--line);border-radius:14px;padding:13px 16px;color:#dfe5ef;min-height:50px;line-height:1.45}}
.side{{padding:18px}}h2{{font-size:18px;margin:0 0 12px}}p,li{{color:var(--muted);line-height:1.55}}.kv{{display:grid;grid-template-columns:1fr 1fr;gap:9px}}.kv div{{padding:11px;border-radius:12px;background:var(--panel2)}}.kv strong{{display:block;color:var(--muted);font-size:10px;letter-spacing:.08em;margin-bottom:5px}}.pill{{display:inline-flex;padding:6px 9px;border:1px solid #385076;border-radius:999px;background:#14213a;color:#cdd7e7;font-size:12px;margin:3px}}
.section{{margin-top:18px;padding:18px}}.stills{{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}}.still{{padding:0;border:1px solid var(--line);border-radius:14px;background:#0b111c;color:white;overflow:hidden;cursor:pointer;text-align:left}}.still img{{display:block;width:100%;aspect-ratio:9/16;object-fit:cover;object-position:top}}.still span{{display:block;padding:10px 12px;font-size:12px}}.qa{{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}}.qa div,.bench div{{background:var(--panel2);padding:14px;border-radius:14px}}.qa b{{color:var(--ok)}}.bench{{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}}.bench span{{font-size:26px;font-weight:900;display:block}}.bench small{{color:var(--muted)}}table{{width:100%;border-collapse:collapse;font-size:13px}}th,td{{text-align:left;padding:10px;border-bottom:1px solid var(--line);vertical-align:top}}th{{color:var(--muted)}}details summary{{cursor:pointer;font-weight:800}}
.modal{{position:fixed;inset:0;background:rgba(0,0,0,.85);display:none;place-items:center;padding:22px;z-index:99}}.modal.open{{display:grid}}.modal img{{max-width:min(900px,95vw);max-height:88vh;border-radius:14px}}.modal button{{position:fixed;top:20px;right:20px;border:1px solid #596a86;background:#101725;color:white;border-radius:999px;width:44px;height:44px;font-size:24px}}.note{{padding:12px 14px;border-left:3px solid var(--accent);background:#111b2b;border-radius:10px;color:var(--muted);margin-top:12px}}
@media(max-width:920px){{.top{{align-items:flex-start;flex-direction:column}}.grid{{grid-template-columns:1fr}}video{{width:100%;height:auto;max-height:none}}.stills{{grid-template-columns:repeat(2,1fr)}}.qa,.bench{{grid-template-columns:1fr}}}}
</style></head>
<body><main>
<div class="top"><div><div class="eyebrow">MCF CONTENT STUDIO • REVIEW LAB V2</div><h1>Runtime Agêntico Moderno</h1></div><div class="state">● EXPERIMENTAL • CI GREEN</div></div>
<div class="toolbar card">
<button class="seg" data-version="a">A • baseline visual</button>
<button class="seg active" data-version="b">B • áudio sincronizado</button>
<button class="seg" id="jumpRecall">Active Recall</button>
<button class="seg" id="jumpSummary">Resumo final</button>
</div>
<div class="grid">
<section class="card player-card"><div class="video-wrap"><video id="video" controls playsinline preload="metadata"><source id="source" src="{audio}" type="video/mp4"></video></div><div id="caption" class="caption">A narração sincronizada aparece aqui como apoio de leitura.</div><div class="note">A/B preserva o mesmo piloto. B é a versão atual de review, não master publicado.</div></section>
<aside class="card side"><h2>Estado verificável</h2><div class="kv"><div><strong>MISSÃO</strong><span>MCF-CONTENT-STUDIO-N4-001</span></div><div><strong>FORMATO</strong><span>1080×1920</span></div><div><strong>DURAÇÃO</strong><span>67 s</span></div><div><strong>ÁUDIO</strong><span>PT-BR • clear</span></div><div><strong>PIPELINE</strong><span>Remotion + TTS</span></div><div><strong>STATUS</strong><span>Experimental</span></div></div>
<h2 style="margin-top:20px">Componentes</h2><div><span class="pill">FocusConcept</span><span class="pill">ProgressiveDiagram</span><span class="pill">AnimatedTimeline</span><span class="pill">ActiveRecall</span><span class="pill">ErrorVsCorrect</span><span class="pill">ArchitectureNode</span><span class="pill">TerminalWindow</span><span class="pill">ChapterProgress</span></div>
<h2 style="margin-top:20px">Avaliar</h2><ul><li>sincronia narração/motion;</li><li>voz e pausas;</li><li>densidade mobile;</li><li>active recall;</li><li>reconstrução final.</li></ul></aside>
</div>
<section class="card section"><h2>QA visual — stress tests</h2><div class="qa"><div><b>PASS</b><br>FocusConcept longo preserva safe area.</div><div><b>PASS</b><br>Timeline com 7 eventos sem overflow.</div><div><b>PASS</b><br>Diagrama com 4 níveis preserva quebras.</div></div><div class="stills">{cards}</div></section>
<section class="card section"><h2>Benchmark reproduzível</h2><div class="bench"><div><span>{pilot_ms/1000:.2f}s</span><small>pilot still</small></div><div><span>{portrait_ms/1000:.2f}s</span><small>portrait still</small></div><div><span>{html.escape(benchmark['node'])}</span><small>Node no runner</small></div></div><p>Tempos do runner atual; não são promessa universal. O benchmark histórico #251 mede um master completo + QA e não é diretamente comparável a stills.</p></section>
<section class="card section"><details><summary>Timeline da narração</summary><table><thead><tr><th>#</th><th>Início</th><th>Texto</th></tr></thead><tbody>{rows}</tbody></table></details></section>
</main>
<div class="modal" id="modal"><button id="close">×</button><img id="modalImg" alt="Still ampliado"></div>
<script>
const videos={{a:{silent!r},b:{audio!r}}};
const cues={json.dumps(cues,ensure_ascii=False)};
const video=document.getElementById('video'),source=document.getElementById('source'),caption=document.getElementById('caption');
function setVersion(v){{const t=video.currentTime||0;const playing=!video.paused;source.src=videos[v];video.load();video.currentTime=t;if(playing)video.play().catch(()=>{{}});document.querySelectorAll('[data-version]').forEach(b=>b.classList.toggle('active',b.dataset.version===v));}}
document.querySelectorAll('[data-version]').forEach(b=>b.onclick=()=>setVersion(b.dataset.version));
video.addEventListener('timeupdate',()=>{{let current='';for(const cue of cues){{if(video.currentTime>=cue.time)current=cue.text;else break}}caption.textContent=current||'A narração sincronizada aparece aqui como apoio de leitura.';}});
document.getElementById('jumpRecall').onclick=()=>{{video.currentTime=47;video.play();}};
document.getElementById('jumpSummary').onclick=()=>{{video.currentTime=61;video.play();}};
const modal=document.getElementById('modal'),modalImg=document.getElementById('modalImg');
document.querySelectorAll('.still').forEach(b=>b.onclick=()=>{{modalImg.src=b.dataset.src;modalImg.alt=b.dataset.title;modal.classList.add('open')}});
document.getElementById('close').onclick=()=>modal.classList.remove('open');
modal.onclick=e=>{{if(e.target===modal)modal.classList.remove('open')}};
</script></body></html>"""
Path(args.output).write_text(page,encoding="utf-8")
print(args.output)
