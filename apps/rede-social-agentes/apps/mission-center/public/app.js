const byId = (id) => document.getElementById(id);
const elements = Object.fromEntries(
  [
    'freshness', 'mission-id', 'mission-title', 'mission-state', 'current-stage',
    'progress-bar', 'progress-label', 'stale-banner', 'deadline', 'stages',
    'last-action', 'last-action-meta', 'last-evidence', 'next-step', 'gates',
    'blockers', 'updated-at',
  ].map((id) => [id, byId(id)]),
);

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function shortEvidence(value) {
  return value.length > 54 ? `${value.slice(0, 51)}…` : value;
}

function statusClass(status) {
  if (status === 'ENTREGUE') return 'done';
  if (status === 'IN_PROGRESS') return 'active';
  if (status.includes('BLOCK')) return 'blocked';
  return 'pending';
}

function renderEvidence(target, evidence) {
  target.replaceChildren(
    ...evidence.map((item) => {
      const chip = node('span', 'evidence-chip');
      chip.append(node('b', '', item.type), document.createTextNode(` ${shortEvidence(item.value)}`));
      return chip;
    }),
  );
}

function render(result) {
  const { snapshot, stale, fetchedAt } = result;
  elements['mission-id'].textContent = snapshot.missionId;
  elements['mission-title'].textContent = snapshot.title;
  elements['mission-state'].textContent = snapshot.state;
  elements['mission-state'].className = `badge ${statusClass(snapshot.state)}`;
  elements['current-stage'].textContent = `${snapshot.currentStage.id} · ${snapshot.currentStage.label}`;
  elements.deadline.textContent = `Deadline: ${snapshot.deadline}`;

  const delivered = snapshot.stages.filter((stage) => stage.status === 'ENTREGUE').length;
  const percent = Math.round((delivered / snapshot.stages.length) * 100);
  elements['progress-bar'].style.width = `${percent}%`;
  elements['progress-label'].textContent = `${delivered}/${snapshot.stages.length} etapas entregues · ${percent}%`;

  elements.stages.replaceChildren(
    ...snapshot.stages.map((stage) => {
      const card = node('article', `stage ${statusClass(stage.status)}`);
      const head = node('div', 'stage-head');
      head.append(
        node('span', 'stage-id', stage.id),
        node('span', `stage-status ${statusClass(stage.status)}`, stage.status),
      );
      card.append(head, node('h4', '', stage.label));
      if (stage.decision) card.append(node('p', 'decision', stage.decision));
      const evidence = node('div', 'evidence');
      renderEvidence(evidence, stage.evidence);
      card.append(evidence);
      return card;
    }),
  );

  elements['last-action'].textContent = snapshot.lastAction.summary;
  elements['last-action-meta'].textContent = `${snapshot.lastAction.executor} · ${new Date(snapshot.lastAction.at).toLocaleString('pt-BR')}`;
  renderEvidence(elements['last-evidence'], snapshot.lastAction.evidence);
  elements['next-step'].textContent = snapshot.nextStep;

  elements.gates.replaceChildren(
    ...Object.entries(snapshot.humanGates).map(([key, value]) => {
      const row = node('div', 'gate-row');
      row.append(
        node('span', '', key),
        node('strong', value === 'AUTHORIZED' ? 'gate-ok' : 'gate-warn', value),
      );
      return row;
    }),
  );

  const blockers = snapshot.blockers.length ? snapshot.blockers : ['Nenhum blocker registrado.'];
  elements.blockers.replaceChildren(...blockers.map((blocker) => node('li', '', blocker)));
  elements['stale-banner'].classList.toggle('hidden', !stale);
  elements.freshness.textContent = stale ? 'STALE · último snapshot válido' : 'LIVE · atualização automática';
  elements.freshness.className = `freshness ${stale ? 'stale' : 'live'}`;
  elements['updated-at'].textContent = `Projeto: ${new Date(snapshot.updatedAt).toLocaleString('pt-BR')} · Fonte: ${new Date(fetchedAt).toLocaleString('pt-BR')}`;
}

async function refresh() {
  try {
    const response = await fetch('/api/status', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    render(await response.json());
  } catch {
    elements.freshness.textContent = 'ERRO · tentando reconectar';
    elements.freshness.className = 'freshness stale';
  }
}

await refresh();
setInterval(refresh, 15_000);
