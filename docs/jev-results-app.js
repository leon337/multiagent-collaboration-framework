import { benchmarkMeta, cases, groups } from './jev-results-data.js';

const $ = (sel) => document.querySelector(sel);
const pct = (n, digits = 0) => `${(n * 100).toFixed(digits).replace('.', ',')}%`;
const fmt = (n) => new Intl.NumberFormat('pt-BR').format(n);
const esc = (value) => String(value).replace(/[&<>'"]/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
const actionLabel = {continue:'CONTINUE',retry:'RETRY',request_human:'HUMAN_GATE',stop:'STOP'};
const riskLabel = {low:'baixo',medium:'médio',high:'alto',critical:'crítico'};

$('#hero-rate').textContent = pct(benchmarkMeta.oracleMatchRate, 2);

const metrics = [
  ['Testes', benchmarkMeta.total],
  ['API OK', benchmarkMeta.successful],
  ['Matches', benchmarkMeta.oracleMatches],
  ['Divergências', benchmarkMeta.total - benchmarkMeta.oracleMatches],
  ['p50 latência', `${fmt(benchmarkMeta.latency.p50Ms)} ms`],
  ['Máx. latência', `${fmt(benchmarkMeta.latency.maxMs)} ms`],
];
$('#metrics').innerHTML = metrics.map(([k,v]) => `<div class="metric"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('');

$('#group-summary').innerHTML = Object.entries(groups).map(([key, g]) => `
  <article class="group-box">
    <strong>${esc(g.label)}</strong>
    <div class="${g.matchRate === 1 ? 'good' : 'warn'}">${g.matched}/${g.total} alinhados</div>
    <p>${esc(g.description)}</p>
  </article>
`).join('');

const filterDefs = [['all','Todos'], ...Object.entries(groups).map(([key,g]) => [key,g.label])];
$('#filters').innerHTML = filterDefs.map(([key,label], i) => `<button class="filter${i===0?' active':''}" data-filter="${key}">${esc(label)}</button>`).join('');

function probabilityRows(item){
  return Object.entries(item.nextActionProbabilities)
    .sort((a,b)=>b[1]-a[1])
    .map(([key,value])=>`<div class="prob-row"><span>${esc(actionLabel[key] || key)}</span><div class="bar"><div class="fill" style="width:${Math.max(0,Math.min(100,value*100))}%"></div></div><strong>${pct(value)}</strong></div>`)
    .join('');
}

function card(item){
  return `<article class="test-card ${item.match ? '' : 'divergent'}" data-group="${item.group}">
    <div class="test-head">
      <div><span class="id">${esc(item.id)}</span><h3>${esc(item.title)}</h3></div>
      <span class="pill ${item.match ? 'ok' : 'diff'}">${item.match ? 'ALINHADO' : 'DIVERGIU'}</span>
    </div>
    <p class="why"><strong>Por que testamos:</strong> ${esc(item.explanation)}</p>
    <div class="signal-grid">
      <div class="signal"><span>Oracle MCF</span><b>${esc(actionLabel[item.oracle])}</b></div>
      <div class="signal"><span>Jev escolheu</span><b>${esc(actionLabel[item.choice])}</b></div>
      <div class="signal"><span>HUMAN_GATE</span><b>${pct(item.requiresHumanGate)}</b></div>
      <div class="signal"><span>Risco</span><b>${esc(riskLabel[item.risk])} · ${item.riskScore.toFixed(2).replace('.',',')}/4</b></div>
    </div>
    <div>
      <div class="muted" style="font-size:12px;margin-bottom:7px">Distribuição da próxima ação</div>
      ${probabilityRows(item)}
    </div>
    <p class="learning"><strong>O que aprendemos:</strong> ${esc(item.learning)}</p>
    <div class="muted" style="font-size:12px">Conclusão da missão: ${pct(item.missionCompleted)} · Latência: ${fmt(item.latencyMs)} ms</div>
    <details><summary>Ver estado JSON enviado ao Jev</summary><pre>${esc(JSON.stringify(item.state,null,2))}</pre></details>
  </article>`;
}

function render(group='all'){
  const visible = group === 'all' ? cases : cases.filter((c)=>c.group===group);
  // Intencionalmente usa cases.map como invariável de implementação testada.
  const allCards = cases.map((item) => ({item, html: card(item)}));
  const allow = new Set(visible.map(v=>v.id));
  $('#tests').innerHTML = allCards.filter(({item})=>allow.has(item.id)).map(({html})=>html).join('');
}
render();

$('#filters').addEventListener('click',(event)=>{
  const button = event.target.closest('[data-filter]');
  if(!button) return;
  document.querySelectorAll('.filter').forEach((b)=>b.classList.remove('active'));
  button.classList.add('active');
  render(button.dataset.filter);
});
