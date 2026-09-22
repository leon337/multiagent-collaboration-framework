import { seedState, createNode, normalizeState, connect, removeNode, autoLayout, searchNodes } from './model.js';
import { loadState, saveState, clearState, downloadState } from './storage.js';
import { svgEl, islandPath, fitCamera, worldBounds } from './graph.js';

const $ = (s) => document.querySelector(s);
const graph = $('#graph');
const detailPanel = $('#detailPanel');
const minimap = $('#minimap');
const dialog = $('#nodeDialog');

let state = normalizeState(loadState(seedState));
let selectedId = null;
let drag = null;
let panDrag = null;
let connectFrom = null;
let createType = 'chat';
let listMode = false;

function persist(status = 'Salvo localmente') {
  saveState(state);
  $('#statusText').textContent = status;
  updateStats();
}

function updateStats() {
  const projects = state.nodes.filter(n => n.type === 'project').length;
  const chats = state.nodes.filter(n => n.type === 'chat').length;
  $('#statsText').textContent = `${state.nodes.length} ilhas · ${projects} projetos · ${chats} chats · ${state.edges.length} conexões`;
}

function buildDefs() {
  const defs = svgEl('defs');
  defs.innerHTML = `
    <radialGradient id="gradProject"><stop stop-color="#a3ffea"/><stop offset=".45" stop-color="#28a78d"/><stop offset="1" stop-color="#0a5045"/></radialGradient>
    <radialGradient id="gradChat"><stop stop-color="#c3e2ff"/><stop offset=".5" stop-color="#3c83bd"/><stop offset="1" stop-color="#173f64"/></radialGradient>
    <radialGradient id="gradAgent"><stop stop-color="#edc7ff"/><stop offset=".5" stop-color="#9558c7"/><stop offset="1" stop-color="#4a2864"/></radialGradient>
    <filter id="softGlow"><feGaussianBlur stdDeviation="7" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  `;
  graph.append(defs);
}

function screenToWorld(clientX, clientY) {
  const rect = graph.getBoundingClientRect();
  const { x, y, zoom } = state.camera;
  return { x: (clientX - rect.left - x) / zoom, y: (clientY - rect.top - y) / zoom };
}

function render() {
  graph.innerHTML = '';
  buildDefs();
  const root = svgEl('g', { transform: `translate(${state.camera.x} ${state.camera.y}) scale(${state.camera.zoom})` });
  graph.append(root);

  for (const edge of state.edges) {
    const a = state.nodes.find(n => n.id === edge.source);
    const b = state.nodes.find(n => n.id === edge.target);
    if (!a || !b) continue;
    root.append(svgEl('line', {
      x1: a.x, y1: a.y, x2: b.x, y2: b.y,
      class: `edge ${edge.kind === 'contains' ? 'contains' : ''}`
    }));
  }

  const query = $('#searchInput').value || '';
  const matchedIds = new Set(searchNodes(state, query).map(n => n.id));

  for (const n of state.nodes) {
    const selected = n.id === selectedId;
    const matched = !query || matchedIds.has(n.id);
    const g = svgEl('g', {
      class: `island ${n.type}${selected ? ' selected' : ''}${matched ? '' : ' dimmed'}`,
      transform: `translate(${n.x} ${n.y})`,
      tabindex: '0', role: 'button',
      'aria-label': `${n.type}: ${n.title}`,
      'data-node-id': n.id
    });

    g.append(
      svgEl('circle', { r: n.r + (selected ? 24 : 16), class: 'halo' }),
      svgEl('path', { d: islandPath(n.r), class: 'land' }),
      svgEl('ellipse', { cx: -n.r*.2, cy: -n.r*.24, rx: n.r*.24, ry: n.r*.12, class: 'shine' })
    );

    if (state.camera.zoom > .62) {
      const title = svgEl('text', { y: 3, class: 'title' });
      title.textContent = n.title;
      const sub = svgEl('text', { y: 22, class: 'sub' });
      sub.textContent = n.type.toUpperCase();
      g.append(title, sub);
    }
    if (state.camera.zoom > 1.15 && n.tags?.length) {
      const tags = svgEl('text', { y: 39, class: 'tags' });
      tags.textContent = n.tags.slice(0, 2).map(t => `#${t}`).join(' ');
      g.append(tags);
    }

    g.addEventListener('pointerdown', (e) => startNodeDrag(e, n));
    g.addEventListener('click', (e) => {
      e.stopPropagation();
      if (drag?.moved) return;
      if (connectFrom && connectFrom !== n.id) {
        const ok = connect(state, connectFrom, n.id);
        connectFrom = null;
        persist(ok ? 'Conexão criada' : 'As ilhas já estão conectadas');
        render();
        openPanel(n.id);
        return;
      }
      openPanel(n.id);
    });
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openPanel(n.id);
      }
    });
    root.append(g);
  }

  renderMinimap();
  renderFallback();
}

function startNodeDrag(e, node) {
  e.stopPropagation();
  const p = screenToWorld(e.clientX, e.clientY);
  drag = { node, dx: p.x - node.x, dy: p.y - node.y, moved: false };
  graph.setPointerCapture?.(e.pointerId);
}

function openPanel(id) {
  const node = state.nodes.find(n => n.id === id);
  if (!node) return;
  selectedId = id;
  $('#panelType').textContent = node.type.toUpperCase();
  $('#panelTitle').textContent = node.title;
  const parent = state.nodes.find(n => n.id === node.parentId);
  $('#panelMeta').textContent = `${node.tags?.length ? node.tags.map(t => `#${t}`).join(' ') + ' · ' : ''}${parent ? `Projeto: ${parent.title}` : 'Sem projeto pai'}`;
  $('#panelActions').hidden = false;
  $('#messageInput').disabled = false;
  $('#sendBtn').disabled = false;
  detailPanel.classList.add('open');
  renderMessages(node);
  render();
}

function closePanel() {
  selectedId = null;
  $('#panelType').textContent = 'CONTEXTO';
  $('#panelTitle').textContent = 'Selecione uma ilha';
  $('#panelMeta').textContent = 'Clique em uma ilha para abrir o contexto.';
  $('#panelActions').hidden = true;
  $('#messageInput').disabled = true;
  $('#sendBtn').disabled = true;
  $('#messages').innerHTML = '';
  detailPanel.classList.remove('open');
  render();
}

function renderMessages(node) {
  const box = $('#messages');
  const messages = node.messages || [];
  box.innerHTML = `<div class="message system">Contexto local carregado. ${messages.length ? '' : 'Ainda não há mensagens nesta ilha.'}</div>`;
  for (const m of messages) {
    const div = document.createElement('div');
    div.className = 'message user';
    div.textContent = m;
    box.append(div);
  }
  box.scrollTop = box.scrollHeight;
}

function openCreateDialog(type, point = null) {
  createType = type;
  $('#dialogType').textContent = type === 'project' ? 'NOVO PROJETO' : 'NOVO CHAT';
  $('#dialogTitle').textContent = type === 'project' ? 'Criar uma ilha de projeto' : 'Criar uma ilha de conversa';
  $('#nodeTitleInput').value = '';
  $('#nodeTagsInput').value = '';
  const select = $('#nodeParentSelect');
  select.innerHTML = '<option value="">Sem projeto pai</option>';
  for (const p of state.nodes.filter(n => n.type === 'project')) {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.title;
    select.append(opt);
  }
  if (type === 'chat' && state.nodes.some(n => n.id === selectedId && n.type === 'project')) select.value = selectedId;
  select.disabled = type === 'project';
  dialog.dataset.x = String(point?.x ?? 800);
  dialog.dataset.y = String(point?.y ?? 450);
  dialog.showModal();
  setTimeout(() => $('#nodeTitleInput').focus(), 0);
}

function confirmCreate(event) {
  event.preventDefault();
  const title = $('#nodeTitleInput').value.trim();
  if (!title) return;
  const parentId = createType === 'project' ? null : ($('#nodeParentSelect').value || null);
  const tags = $('#nodeTagsInput').value.split(',').map(s => s.trim()).filter(Boolean);
  const node = createNode({
    type: createType, title, parentId, tags,
    x: Number(dialog.dataset.x), y: Number(dialog.dataset.y)
  });
  state.nodes.push(node);
  if (parentId) connect(state, parentId, node.id, 'contains');
  persist(`${createType === 'project' ? 'Projeto' : 'Chat'} criado`);
  dialog.close();
  openPanel(node.id);
}

function focusNode(node) {
  const rect = graph.getBoundingClientRect();
  const zoom = Math.max(state.camera.zoom, 1);
  state.camera.zoom = zoom;
  state.camera.x = rect.width / 2 - node.x * zoom;
  state.camera.y = rect.height / 2 - node.y * zoom;
  openPanel(node.id);
}

function zoomAt(factor, cx = null, cy = null) {
  const rect = graph.getBoundingClientRect();
  const sx = cx ?? rect.width / 2;
  const sy = cy ?? rect.height / 2;
  const old = state.camera.zoom;
  const next = Math.max(.35, Math.min(2.4, old * factor));
  const wx = (sx - state.camera.x) / old;
  const wy = (sy - state.camera.y) / old;
  state.camera.zoom = next;
  state.camera.x = sx - wx * next;
  state.camera.y = sy - wy * next;
  persist('Zoom atualizado');
  render();
}

function fitAll() {
  const rect = graph.getBoundingClientRect();
  state.camera = fitCamera(state.nodes, rect.width, rect.height);
  persist('Mapa enquadrado');
  render();
}

function renderMinimap() {
  const b = worldBounds(state.nodes, 80);
  const w = 176, h = 108;
  const sx = w / Math.max(b.width, 1), sy = h / Math.max(b.height, 1);
  minimap.innerHTML = '';
  const miniSvg = svgEl('svg', { viewBox: `0 0 ${w} ${h}`, 'aria-hidden': 'true' });

  for (const e of state.edges) {
    const a = state.nodes.find(n => n.id === e.source);
    const c = state.nodes.find(n => n.id === e.target);
    if (!a || !c) continue;
    miniSvg.append(svgEl('line', {
      x1: (a.x-b.minX)*sx, y1:(a.y-b.minY)*sy,
      x2:(c.x-b.minX)*sx, y2:(c.y-b.minY)*sy,
      class:'mini-edge'
    }));
  }
  for (const n of state.nodes) {
    miniSvg.append(svgEl('circle', {
      cx:(n.x-b.minX)*sx, cy:(n.y-b.minY)*sy,
      r:n.type==='project'?4:2.5, class:`mini-node ${n.type}`
    }));
  }
  minimap.append(miniSvg);
}

function renderFallback() {
  const box = $('#listFallback');
  if (!listMode) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  const projects = state.nodes.filter(n => n.type === 'project');
  const orphans = state.nodes.filter(n => n.type !== 'project' && !n.parentId);
  box.innerHTML = '<div class="list-head"><div><span class="eyebrow">ALTERNATIVA HTML</span><h2>Todos os contextos</h2></div><button id="closeListBtn">Voltar ao mapa</button></div>';

  for (const p of projects) {
    const group = document.createElement('article');
    group.className = 'list-group';
    group.innerHTML = `<h3>${escapeHtml(p.title)}</h3>`;
    const children = state.nodes.filter(n => n.parentId === p.id);
    for (const n of [p, ...children]) group.append(makeListItem(n));
    box.append(group);
  }

  if (orphans.length) {
    const group = document.createElement('article');
    group.className = 'list-group';
    group.innerHTML = '<h3>Sem projeto</h3>';
    for (const n of orphans) group.append(makeListItem(n));
    box.append(group);
  }
  $('#closeListBtn')?.addEventListener('click', () => {
    listMode = false;
    renderFallback();
  });
}

function makeListItem(n) {
  const btn = document.createElement('button');
  btn.className = 'list-item';
  btn.innerHTML = `<strong>${escapeHtml(n.title)}</strong><span>${n.type} · ${(n.tags||[]).map(t=>`#${escapeHtml(t)}`).join(' ')}</span>`;
  btn.addEventListener('click', () => {
    listMode = false;
    focusNode(n);
  });
  return btn;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

graph.addEventListener('pointerdown', (e) => {
  if (e.target.closest?.('.island')) return;
  panDrag = {
    x: e.clientX, y: e.clientY,
    cx: state.camera.x, cy: state.camera.y,
    moved: false
  };
  graph.setPointerCapture?.(e.pointerId);
});

graph.addEventListener('pointermove', (e) => {
  if (drag) {
    const p = screenToWorld(e.clientX, e.clientY);
    drag.node.x = p.x - drag.dx;
    drag.node.y = p.y - drag.dy;
    drag.moved = true;
    render();
    return;
  }
  if (panDrag) {
    state.camera.x = panDrag.cx + e.clientX - panDrag.x;
    state.camera.y = panDrag.cy + e.clientY - panDrag.y;
    panDrag.moved = true;
    render();
  }
});

graph.addEventListener('pointerup', () => {
  if (drag?.moved) persist('Posição da ilha salva');
  if (panDrag?.moved) persist('Mapa reposicionado');
  drag = null;
  panDrag = null;
});

graph.addEventListener('wheel', (e) => {
  e.preventDefault();
  const rect = graph.getBoundingClientRect();
  zoomAt(
    e.deltaY < 0 ? 1.09 : .92,
    e.clientX - rect.left,
    e.clientY - rect.top
  );
}, { passive: false });

graph.addEventListener('dblclick', (e) => {
  if (e.target.closest?.('.island')) return;
  openCreateDialog('chat', screenToWorld(e.clientX, e.clientY));
});

graph.addEventListener('click', (e) => {
  if (!e.target.closest?.('.island') && connectFrom) {
    connectFrom = null;
    $('#statusText').textContent = 'Modo conectar cancelado';
    render();
  }
});

$('#newChatBtn').addEventListener('click', () => openCreateDialog('chat'));
$('#newProjectBtn').addEventListener('click', () => openCreateDialog('project'));
$('#nodeForm').addEventListener('submit', confirmCreate);
$('#closePanelBtn').addEventListener('click', closePanel);

$('#autoLayoutBtn').addEventListener('click', () => {
  autoLayout(state);
  fitAll();
  persist('Arquipélago organizado');
  render();
});

$('#zoomInBtn').addEventListener('click', () => zoomAt(1.16));
$('#zoomOutBtn').addEventListener('click', () => zoomAt(.86));
$('#fitBtn').addEventListener('click', fitAll);

$('#searchInput').addEventListener('input', () => render());
$('#searchInput').addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const results = searchNodes(state, e.currentTarget.value);
  if (results.length) focusNode(results[0]);
});

$('#composer').addEventListener('submit', (e) => {
  e.preventDefault();
  const node = state.nodes.find(n => n.id === selectedId);
  const input = $('#messageInput');
  const value = input.value.trim();
  if (!node || !value) return;
  node.messages ||= [];
  node.messages.push(value);
  input.value = '';
  persist('Mensagem salva nesta ilha');
  renderMessages(node);
});

$('#renameBtn').addEventListener('click', () => {
  const node = state.nodes.find(n => n.id === selectedId);
  if (!node) return;
  const name = prompt('Novo título:', node.title)?.trim();
  if (!name) return;
  node.title = name.slice(0,80);
  persist('Ilha renomeada');
  openPanel(node.id);
});

$('#connectBtn').addEventListener('click', () => {
  if (!selectedId) return;
  connectFrom = selectedId;
  $('#statusText').textContent = 'Conectar: clique em outra ilha';
});

$('#deleteBtn').addEventListener('click', () => {
  const node = state.nodes.find(n => n.id === selectedId);
  if (!node) return;
  if (!confirm(`Excluir “${node.title}” e suas conexões?`)) return;
  removeNode(state, node.id);
  selectedId = null;
  persist('Ilha excluída');
  closePanel();
});

$('#listViewBtn').addEventListener('click', () => {
  listMode = true;
  renderFallback();
});

$('#exportBtn').addEventListener('click', () => downloadState(state));

$('#importInput').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    state = normalizeState(JSON.parse(await file.text()));
    selectedId = null;
    persist('Mapa importado com sucesso');
    fitAll();
    render();
  } catch (err) {
    alert(err.message || 'Falha ao importar JSON.');
  }
  e.target.value = '';
});

$('#resetBtn').addEventListener('click', () => {
  if (!confirm('Resetar o Archipelago para o estado inicial?')) return;
  clearState();
  state = normalizeState(seedState);
  selectedId = null;
  fitAll();
  persist('Mapa resetado');
  closePanel();
});

window.addEventListener('resize', () => render());
updateStats();

requestAnimationFrame(() => {
  if (!localStorage.getItem('mcf-archipelago-v1')) fitAll();
  else render();
});
