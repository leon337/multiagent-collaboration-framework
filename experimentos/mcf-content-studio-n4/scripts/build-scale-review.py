#!/usr/bin/env python3
import argparse,base64,html,json
from pathlib import Path

p=argparse.ArgumentParser()
p.add_argument("--architecture",required=True)
p.add_argument("--ui-code",required=True)
p.add_argument("--architecture-spec",required=True)
p.add_argument("--ui-code-spec",required=True)
p.add_argument("--benchmark")
p.add_argument("--output",required=True)
args=p.parse_args()

def data_uri(path,mime):
    return f"data:{mime};base64,"+base64.b64encode(Path(path).read_bytes()).decode("ascii")

arch_video=data_uri(args.architecture,"video/mp4")
ui_video=data_uri(args.ui_code,"video/mp4")
arch=json.loads(Path(args.architecture_spec).read_text(encoding="utf-8"))
ui=json.loads(Path(args.ui_code_spec).read_text(encoding="utf-8"))
benchmark=json.loads(Path(args.benchmark).read_text(encoding="utf-8")) if args.benchmark else None

def scene_rows(spec):
    return "".join(
      f"<tr><td>{i+1:02d}</td><td>{html.escape(s['componentId'])}</td><td>{s['durationFrames']}f</td></tr>"
      for i,s in enumerate(spec["scenes"])
    )

bench_html=""
if benchmark:
    def fmt_ms(value):
        return f"{value/1000:.2f}s"
    def fmt_mb(value):
        return f"{value/1024/1024:.2f} MB"
    bench_html=f"""<section class="card" style="margin-top:20px"><h2>Benchmark do Scale Proof</h2><table><thead><tr><th>Aula</th><th>Render</th><th>Arquivo</th></tr></thead><tbody>
    <tr><td>Arquitetura</td><td>{fmt_ms(benchmark["architecture"]["renderMs"])}</td><td>{fmt_mb(benchmark["architecture"]["bytes"])}</td></tr>
    <tr><td>UI + Código</td><td>{fmt_ms(benchmark["uiCode"]["renderMs"])}</td><td>{fmt_mb(benchmark["uiCode"]["bytes"])}</td></tr>
    </tbody></table><p>Tempos específicos do runner CI; não são promessa universal de performance.</p></section>"""

page=f"""<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>MCF N4 Scale Proof</title>
<style>
:root{{--bg:#060a11;--panel:#0f1725;--line:#283853;--text:#f5f7fb;--muted:#97a6bd;--accent:#7c8cff;--ok:#58d68d}}
*{{box-sizing:border-box}}body{{margin:0;background:radial-gradient(circle at top,#182744 0,#060a11 38%);color:var(--text);font-family:Inter,system-ui,sans-serif}}
main{{max-width:1300px;margin:auto;padding:24px}}.top{{display:flex;justify-content:space-between;gap:18px;align-items:end;margin-bottom:24px}}h1{{font-size:clamp(30px,5vw,58px);line-height:1;margin:8px 0 0}}.eyebrow{{color:var(--accent);font-weight:900;letter-spacing:.14em;font-size:12px}}.state{{color:var(--ok);border:1px solid var(--line);padding:10px 14px;border-radius:999px;background:#0b1321}}
.grid{{display:grid;grid-template-columns:1fr 1fr;gap:20px}}.card{{background:rgba(15,23,37,.96);border:1px solid var(--line);border-radius:22px;padding:16px}}video{{display:block;width:100%;max-height:72vh;background:#000;border-radius:14px}}h2{{font-size:22px;margin:14px 0 8px}}p,td,th{{color:var(--muted);line-height:1.5}}table{{width:100%;border-collapse:collapse;margin-top:14px;font-size:13px}}td,th{{padding:9px;border-bottom:1px solid var(--line);text-align:left}}.note{{margin-top:18px;padding:14px;border-left:3px solid var(--accent);background:#111b2b;border-radius:10px;color:var(--muted)}}
@media(max-width:860px){{.grid{{grid-template-columns:1fr}}.top{{align-items:flex-start;flex-direction:column}}}}
</style></head><body><main>
<div class="top"><div><div class="eyebrow">MCF CONTENT STUDIO • N4 SCALE PROOF</div><h1>Uma engine, duas aulas diferentes</h1></div><div class="state">● GENERIC TEMPLATE</div></div>
<div class="grid">
<section class="card"><video controls playsinline preload="metadata"><source src="{arch_video}" type="video/mp4"></video><h2>{html.escape(arch["lesson"]["title"])}</h2><p>{html.escape(arch["lesson"].get("summary",""))}</p><table><thead><tr><th>#</th><th>Componente</th><th>Duração</th></tr></thead><tbody>{scene_rows(arch)}</tbody></table></section>
<section class="card"><video controls playsinline preload="metadata"><source src="{ui_video}" type="video/mp4"></video><h2>{html.escape(ui["lesson"]["title"])}</h2><p>{html.escape(ui["lesson"].get("summary",""))}</p><table><thead><tr><th>#</th><th>Componente</th><th>Duração</th></tr></thead><tbody>{scene_rows(ui)}</tbody></table></section>
</div>
{bench_html}
<div class="note">Os dois vídeos usam a mesma composição <strong>TechnicalLessonTemplate</strong>. O que muda é o payload da aula e a seleção de componentes. Esta prova valida escala estrutural; não representa master de publicação nem áudio final.</div>
</main></body></html>"""
Path(args.output).write_text(page,encoding="utf-8")
print(args.output)
