const $ = (id) => document.getElementById(id);
let snapshot = null;
let pending = null;
let toastTimer = null;
const keys = { name: 'Nome', mode: 'Modo', response: 'Resposta', instructions: 'Instruções', tools: 'Ferramentas' };
const modes = { fixed: 'Resposta fixa', echo: 'Eco da mensagem', instructed: 'Conversacional com IA' };
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}
function notify(msg, kind = '') {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'toast ' + kind;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.className = 'toast hidden', 4900);
}
async function api(url, method = 'GET', body) {
  const r = await fetch(url, { method, headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  let payload;
  try { payload = await r.json(); } catch { throw new Error('Resposta não é JSON'); }
  if (!r.ok) throw new Error(payload.error || 'Falha de comunicação: HTTP ' + r.status);
  return payload;
}
function humanMessage(text) {
  const row = el('div', 'message human');
  row.append(el('div', 'bubble', text));
  $('chatLog').append(row);
}
function assistantMessage(title, msg) {
  const row = el('div', 'message assistant');
  row.append(el('div', 'avatar', '✳'));
  const bubble = el('div', 'bubble');
  bubble.append(el('b', '', title), el('p', '', msg));
  row.append(bubble);
  $('chatLog').append(row);
}
function formToConfig() {
  return {
    name: $('nameField').value.trim(),
    mode: $('modeField').value,
    response: $('responseField').value.trim(),
    instructions: $('instructionsField').value,
    tools: [...($('calculatorField').checked ? ['calculator'] : []), ...($('clockField').checked ? ['clock'] : [])]
  };
}
function fillForm(c) {
  $('nameField').value = c.name;
  $('modeField').value = c.mode;
  $('responseField').value = c.response;
  $('instructionsField').value = c.instructions;
  $('calculatorField').checked = c.tools.includes('calculator');
  $('clockField').checked = c.tools.includes('clock');
}
function formatValue(v) {
  if (Array.isArray(v)) return v.length ? v.join(', ') : 'Nenhuma';
  return modes[v] || String(v || '—');
}
function renderDiff(before, after) {
  $('diffList').replaceChildren();
  let total = 0;
  for (const [key, label] of Object.entries(keys)) {
    if (JSON.stringify(before[key]) === JSON.stringify(after[key])) continue;
    total++;
    const item = el('div', 'diffitem');
    item.append(el('h3', '', label));
    const vals = el('div', 'diffval');
    for (const [name, content] of [['ANTES', before[key]], ['DEPOIS', after[key]]]) {
      const col = el('div');
      col.append(el('small', '', name), el('span', '', formatValue(content)));
      vals.append(col);
    }
    item.append(vals); $('diffList').append(item);
  }
  if (!total) $('diffList').append(el('p', '', 'Nenhuma alteração detectada.'));
}
function renderVersions(history) {
  const holder = $('versionList');
  holder.replaceChildren();
  for (const version of history.slice().reverse()) {
    const row = el('div', 'version');
    row.append(el('div', 'vnum', 'r' + version.revision));
    const mid = el('div', 'vtext');
    mid.append(el('strong', '', version.note), el('small', '', new Date(version.timestamp).toLocaleString('pt-BR')));
    row.append(mid);
    const btn = el('button', '', version.revision === snapshot.revision ? 'Atual' : 'Restaurar');
    btn.type = 'button';
    btn.disabled = version.revision === snapshot.revision;
    btn.addEventListener('click', async () => {
      if (!confirm('Restaurar a revisão r' + version.revision + '? Isso criará outra versão do rascunho, sem modificar o Harness.')) return;
      try {
        await api('/api/restore', 'POST', { id: version.id });
        pending = null; $('proposalPanel').classList.add('hidden');
        await refresh();
        notify('Versão restaurada no rascunho.', 'success');
      } catch (err) { notify(err.message, 'error'); }
    });
    row.append(btn);
    holder.append(row);
  }
}
async function refresh() {
  snapshot = await api('/api/state');
  fillForm(snapshot.current);
  $('revisionMetric').textContent = 'r' + snapshot.revision;
  $('serverStatus').textContent = 'Ambiente local';
  $('providerDot').classList.toggle('online', snapshot.provider.configured);
  $('providerModel').value = snapshot.provider.model;
  renderVersions(snapshot.history);
  if (!snapshot.integration.profileReadable || !snapshot.integration.sourceReadable) {
    notify('Confira os caminhos do arquivo de agente e do perfil DSH.', 'error');
  }
}
function setBusy(button, value) {
  button.disabled = value;
  button.dataset.original = button.dataset.original || button.textContent;
  button.textContent = value ? 'Processando…' : button.dataset.original;
}
function showProposal(proposal) {
  pending = proposal;
  $('proposalExplanation').textContent = proposal.explanation + ' • origem: ' + (proposal.source === 'ai' ? '9Router' : proposal.source === 'guided' ? 'modo guiado' : 'painel visual');
  renderDiff(snapshot.current, proposal.next);
  $('proposalPanel').classList.remove('hidden');
  $('proposalPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
$('promptForm').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const prompt = $('promptInput').value.trim();
  if (!prompt) return;
  const b = $('proposeBtn'); setBusy(b, true);
  humanMessage(prompt);
  try {
    const proposal = await api('/api/propose', 'POST', { prompt, useAi: $('aiSwitch').checked });
    assistantMessage('Proposta gerada', 'Preparei ' + Object.keys(proposal.next).length + ' campos de configuração. Revise o comparativo abaixo antes de salvar.');
    showProposal(proposal); $('promptInput').value = '';
  } catch (err) {
    assistantMessage('Não foi possível interpretar', err.message);
    notify(err.message, 'error');
  } finally { setBusy(b, false); }
});
document.querySelectorAll('[data-prompt]').forEach(button => button.addEventListener('click', () => {
  $('promptInput').value = button.dataset.prompt;
  $('promptInput').focus();
}));
$('visualForm').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const button = ev.currentTarget.querySelector('button[type=submit]'); setBusy(button, true);
  try {
    const proposal = await api('/api/propose', 'POST', { direct: formToConfig() });
    showProposal(proposal);
    notify('Proposta visual pronta para revisão.');
  } catch (err) { notify(err.message, 'error'); } finally { setBusy(button, false); }
});
$('discardBtn').addEventListener('click', () => {
  pending = null;
  $('proposalPanel').classList.add('hidden');
  fillForm(snapshot.current);
  notify('Proposta descartada.');
});
$('applyBtn').addEventListener('click', async () => {
  if (!pending) return;
  const button = $('applyBtn'); setBusy(button, true);
  try {
    await api('/api/apply', 'POST', { id: pending.id });
    assistantMessage('Rascunho atualizado', 'Alterações registradas com versão e restauração. O preset ativo do DeepSeek Harness continua intacto.');
    pending = null;
    $('proposalPanel').classList.add('hidden');
    await refresh();
    notify('Alteração salva no rascunho.', 'success');
  } catch (err) { notify(err.message, 'error'); } finally { setBusy(button, false); }
});
$('testForm').addEventListener('submit', async ev => {
  ev.preventDefault();
  const input = $('testInput');
  const message = input.value.trim(); if (!message) return;
  const button = ev.currentTarget.querySelector('button[type=submit]'); setBusy(button, true);
  try {
    const result = await api('/api/preview', 'POST', { message, ...(pending ? { proposalId: pending.id } : {}) });
    const box = $('testHistory');
    const empty = box.querySelector('.emptytest'); if (empty) empty.remove();
    const entry = el('div', 'testentry');
    entry.append(el('div', 'question', message));
    const answer = el('div', 'answer', result.answer);
    answer.append(el('small', '', result.tool ? 'Ferramenta: ' + result.tool : result.channel === '9router' ? 'Resposta via 9Router' : pending ? 'Prévia da proposta' : 'Resposta do rascunho'));
    entry.append(answer); box.append(entry);
    box.scrollTop = box.scrollHeight;
    input.value = '';
  } catch (err) { notify(err.message, 'error'); } finally { setBusy(button, false); }
});
$('providerForm').addEventListener('submit', async ev => {
  ev.preventDefault();
  try {
    const data = { model: $('providerModel').value.trim() };
    if ($('providerKey').value.trim()) data.key = $('providerKey').value.trim();
    await api('/api/provider', 'POST', data);
    $('providerKey').value = '';
    await refresh();
    notify('Configuração do 9Router atualizada em memória.', 'success');
  } catch (err) { notify(err.message, 'error'); }
});
$('clearKeyBtn').addEventListener('click', async () => {
  try { await api('/api/provider', 'POST', { clear: true }); await refresh(); notify('Chave descartada da memória do servidor.'); }
  catch (err) { notify(err.message, 'error'); }
});
$('exportBtn').addEventListener('click', async () => {
  try {
    const exported = await api('/api/export');
    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = exported.filename;
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('Rascunho exportado. Não foi publicado no Harness.');
  } catch (err) { notify(err.message, 'error'); }
});
refresh().catch(err => {
  $('serverStatus').textContent = 'Conexão indisponível';
  notify(err.message, 'error');
});
