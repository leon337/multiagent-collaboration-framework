import { seedState, createNode, normalizeState, connect, removeNode, autoLayout, searchNodes } from './model.js';
import { loadState, saveState, clearState, downloadState } from './storage.js';
import { svgEl, islandPath, fitCamera, worldBounds } from './graph.js';
import { getApiHealth, ensureChat, getChat, postUserMessage, updateChat, deleteChat, streamChatResponse, mapApiMessage, connectDeviceSession, heartbeatDeviceSession, createAtomicChatSession } from './chat-api.js';

const $ = (s) => document.querySelector(s);
const graph = $('#graph');
const detailPanel = $('#detailPanel');
const minimap = $('#minimap');
const dialog = $('#nodeDialog');
const providerDialog = $('#providerDialog');

let state = normalizeState(loadState(seedState));
saveState(state);
let selectedId = null;
let drag = null;
let panDrag = null;
let connectFrom = null;
let createType = 'chat';
let listMode = false;
let newbornId = null;
let pendingConnectionReason = '';
let branchFromId = null;
let providers = { openai: { configured: false, model: null }, mcf: { configured: false } };
let chatBusy = false;
let deviceSession = null;
let heartbeatTimer = null;

function persist(status = 'Salvo localmente') {
  saveState(state);
  $('#statusText').textContent = status;
  updateStats();
}

function selectedNode() {
  return state.nodes.find(n => n.id === selectedId) || null;
}

function stableDeviceId() {
  const key = 'mcf-archipelago-device-id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = 'browser-' + crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

async function connectThisDevice() {
  deviceSession = await connectDeviceSession({
    deviceId: stableDeviceId(),
    instanceId: 'archipelago',
    transport: 'dual-browser-local'
  });
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(async () => {
    try {
      deviceSession = await heartbeatDeviceSession(deviceSession.id);
      for (const node of state.nodes.filter(n => n.type === 'chat' && n.deviceSessionId === deviceSession.id)) node.connectionState = 'READY';
      saveState(state);
      render();
      updateProviderUi();
    } catch {
      for (const node of state.nodes.filter(n => n.type === 'chat' && n.deviceSessionId === deviceSession?.id)) node.connectionState = 'OFFLINE';
      saveState(state);
      render();
      updateProviderUi();
    }
  }, deviceSession.heartbeatIntervalMs || 10000);
  return deviceSession;
}

async function bindNodeAtomically(node) {
  if (!deviceSession || deviceSession.status !== 'connected') await connectThisDevice();
  node.connectionState = 'CONNECTING';
  render();
  const result = await createAtomicChatSession(node, deviceSession.id);
  node.connectionState = result.state === 'READY' ? 'READY' : 'OFFLINE';
  node.deviceSessionId = deviceSession.id;
  node.messages = (result.chat.messages || []).map(mapApiMessage);
  saveState(state);
  render();
  return result;
}

async function syncNodeChat(node, create = true) {
  if (!node || node.type !== 'chat') return null;
  const chat = create ? await ensureChat(node) : await getChat(node.id);
  node.messages = (chat.messages || []).map(mapApiMessage);
  saveState(state);
  if (selectedId === node.id) renderMessages(node);
  return chat;
}

function updateProviderUi() {
  const node = selectedNode();
  const isChat = node?.type === 'chat';
  const aiReady = providers.openai?.configured === true;
  const dot = $('#providerDot');
  const label = $('#providerStatus');
  if (dot) dot.className = 'provider-dot ' + (aiReady ? 'online' : 'offline');
  if (label) label.textContent = aiReady
    ? 'API Archipelago · OpenAI · ' + (providers.openai.model || 'modelo configurado')
    : 'API Archipelago online · IA ainda não configurada';
  const connected = node?.connectionState === 'READY';
  if ($('#messageInput')) $('#messageInput').disabled = !isChat || !connected || chatBusy;
  if ($('#sendBtn')) {
    $('#sendBtn').disabled = !isChat || !connected || chatBusy;
    $('#sendBtn').textContent = aiReady ? 'Enviar e responder' : 'Salvar no chat';
  }
  if ($('#dispatchMcfBtn')) $('#dispatchMcfBtn').hidden = !(isChat && providers.mcf?.configured);
}

async function refreshProviderStatus() {
  try {
    const health = await getApiHealth();
    providers = health.providers;
  } catch {
    providers = { openai: { configured: false, model: null }, mcf: { configured: false } };
  }
  updateProviderUi();
}

function addLocalSystemMessage(node, text) {
  node.messages ||= [];
  node.messages.push({
    role: 'system',
    text: String(text || '').slice(0, 12000),
    status: 'done',
    localOnly: true,
    at: new Date().toISOString()
  });
}

function applySseBlock(block, assistant) {
  let event = 'message';
  let data = '';
  for (const line of block.split(/\r?\n/)) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    if (line.startsWith('data:')) data += line.slice(5).trim();
  }
  if (!data) return;
  let payload;
  try { payload = JSON.parse(data); } catch { return; }
  if (event === 'delta' && payload.text) assistant.text += payload.text;
  if (event === 'done') {
    if (!assistant.text && payload.text) assistant.text = payload.text;
    assistant.status = 'done';
  }
  if (event === 'error') throw new Error(payload.message || 'Erro no streaming da IA');
}

async function askAssistant(node) {
  const assistant = { role:'assistant', text:'', status:'streaming', localOnly:false, at:new Date().toISOString() };
  node.messages ||= [];
  node.messages.push(assistant);
  renderMessages(node);

  await streamChatResponse(node.id, {
    onDelta: payload => {
      if (payload.text) assistant.text += payload.text;
      if (selectedId === node.id) renderMessages(node);
    },
    onDone: payload => {
      if (payload.message) Object.assign(assistant, mapApiMessage(payload.message));
      else assistant.status = 'done';
      if (selectedId === node.id) renderMessages(node);
    }
  });

  await syncNodeChat(node, false);
  persist('Resposta sincronizada pela API Archipelago');
}
async function dispatchSelectedToMcf() {
  const node = selectedNode();
  if (!node || node.type !== 'chat') return;
  const lastUser = [...(node.messages || [])].reverse().find(m => m.role === 'user' && m.text?.trim());
  if (!lastUser) {
    addLocalSystemMessage(node, 'Adicione uma mensagem ao chat antes de despachar ao MCF.');
    persist('Nada para despachar ao MCF');
    renderMessages(node);
    return;
  }
  try {
    const response = await fetch('/api/mcf/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        objective: lastUser.text.length >= 10 ? lastUser.text : ('Executar objetivo: ' + lastUser.text),
        expectedOutcome: 'Retornar resultado rastreável e evidência verificável para esta ilha do Archipelago.',
        repository: 'leon337/multiagent-collaboration-framework',
        sourceOfTruth: ['MCF Archipelago island:' + node.id],
        requestedRiskClass: 'A'
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || result.code || ('HTTP ' + response.status));
    const missionId = result.missionId || result.mission?.missionId || result.mission?.id || result.id || 'recebida';
    addLocalSystemMessage(node, 'MCF: missão despachada (' + missionId + ').');
    persist('Missão enviada ao MCF');
    renderMessages(node);
  } catch (error) {
    addLocalSystemMessage(node, 'MCF indisponível: ' + error.message);
    persist('Falha no dispatch MCF');
    renderMessages(node);
  }
}

function isNodeVisible(node) {
  if (!node?.parentId) return true;
  const parent = state.nodes.find(n => n.id === node.parentId);
  return !(parent?.type === 'project' && parent.collapsed);
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

function renderProjectZones(root) {
  for (const project of state.nodes.filter(n => n.type === 'project')) {
    const allChildren = state.nodes.filter(n => n.parentId === project.id);
    const children = project.collapsed ? [] : allChildren;
    const points = [project, ...children];
    const maxDx = Math.max(145, ...points.map(n => Math.abs(n.x - project.x) + n.r));
    const maxDy = Math.max(118, ...points.map(n => Math.abs(n.y - project.y) + n.r));
    const zone = svgEl('g', { class: 'archipelago-zone', 'data-project-id': project.id });
    zone.append(
      svgEl('ellipse', { cx: project.x, cy: project.y, rx: maxDx + 68, ry: maxDy + 54, class: 'zone-water outer' }),
      svgEl('ellipse', { cx: project.x, cy: project.y, rx: maxDx + 34, ry: maxDy + 24, class: 'zone-water inner' })
    );
    if (state.camera.zoom > .38) {
      const label = svgEl('text', { x: project.x, y: project.y - maxDy - 78, class: 'zone-label' });
      label.textContent = project.collapsed
        ? `${project.title} · ${allChildren.length} oculto${allChildren.length === 1 ? '' : 's'}`
        : `${project.title} · ${allChildren.length} contexto${allChildren.length === 1 ? '' : 's'}`;
      zone.append(label);
    }
    root.append(zone);
  }
}

function renderEdges(root) {
  for (const edge of state.edges) {
    const a = state.nodes.find(n => n.id === edge.source);
    const b = state.nodes.find(n => n.id === edge.target);
    if (!a || !b || !isNodeVisible(a) || !isNodeVisible(b)) continue;
    const dx = b.x - a.x, dy = b.y - a.y;
    const mx = (a.x + b.x) / 2 - dy * .08;
    const my = (a.y + b.y) / 2 + dx * .08;
    const pathId = `edge-path-${edge.id}`;
    const path = svgEl('path', {
      id: pathId,
      d: `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`,
      class: `edge ${edge.kind === 'contains' ? 'contains' : edge.kind === 'branch' ? 'branch' : 'related'}${selectedId && (edge.source === selectedId || edge.target === selectedId) ? ' active' : ''}`
    });
    root.append(path);
    if (edge.reason && state.camera.zoom > .68) {
      const text = svgEl('text', { class: 'edge-label' });
      const textPath = svgEl('textPath', { href: `#${pathId}`, startOffset: '50%' });
      textPath.textContent = edge.reason;
      text.append(textPath);
      root.append(text);
    }
  }
}

function render() {
  graph.innerHTML = '';
  buildDefs();
  const root = svgEl('g', { transform: `translate(${state.camera.x} ${state.camera.y}) scale(${state.camera.zoom})` });
  graph.append(root);

  renderProjectZones(root);
  renderEdges(root);

  const query = $('#searchInput').value || '';
  const matchedIds = new Set(searchNodes(state, query).map(n => n.id));

  for (const n of state.nodes) {
    if (!isNodeVisible(n)) continue;
    const selected = n.id === selectedId;
    const matched = !query || matchedIds.has(n.id);
    const g = svgEl('g', {
      class: `island ${n.type}${selected ? ' selected' : ''}${matched ? '' : ' dimmed'}${n.id === newbornId ? ' born' : ''}`,
      transform: `translate(${n.x} ${n.y})`,
      tabindex: '0', role: 'button',
      'aria-label': `${n.type}: ${n.title}`,
      'data-node-id': n.id
    });

    g.append(
      svgEl('ellipse', { cx: 0, cy: n.r * .72, rx: n.r * .92, ry: n.r * .28, class: 'island-shadow' }),
      svgEl('ellipse', { cx: 0, cy: n.r * .52, rx: n.r * 1.12, ry: n.r * .38, class: 'shore-ring' }),
      svgEl('circle', { r: n.r + (selected ? 24 : 16), class: 'halo' }),
      svgEl('path', { d: islandPath(n.r), class: 'land' }),
      svgEl('ellipse', { cx: -n.r*.2, cy: -n.r*.24, rx: n.r*.24, ry: n.r*.12, class: 'shine' })
    );

    if (state.camera.zoom > .38) {
      const title = svgEl('text', { y: 3, class: 'title' });
      title.textContent = n.title;
      const sub = svgEl('text', { y: 22, class: 'sub' });
      sub.textContent = n.type === 'chat' ? ('CHAT · ' + (n.connectionState || 'OFFLINE')) : n.type.toUpperCase();
      g.append(title, sub);
    }
    if (state.camera.zoom > .95 && n.tags?.length) {
      const tags = svgEl('text', { y: 39, class: 'tags' });
      tags.textContent = n.tags.slice(0, 2).map(t => `#${t}`).join(' ');
      g.append(tags);
    }
    if ((n.messages?.length || 0) > 0 && state.camera.zoom > .72) {
      const badge = svgEl('g', { class: 'activity-badge', transform: `translate(${n.r*.62} ${-n.r*.66})` });
      badge.append(svgEl('circle', { r: 12 }), svgEl('text', { y: 3 }));
      badge.querySelector('text').textContent = String(Math.min(n.messages.length, 99));
      g.append(badge);
    }

    g.addEventListener('pointerdown', (e) => startNodeDrag(e, n));
    g.addEventListener('click', (e) => {
      e.stopPropagation();
      if (drag?.moved) return;
      if (connectFrom && connectFrom !== n.id) {
        const ok = connect(state, connectFrom, n.id, 'related', pendingConnectionReason);
        connectFrom = null;
        pendingConnectionReason = '';
        persist(ok ? 'Conexão semântica criada' : 'As ilhas já estão conectadas');
        render();
        openPanel(n.id);
        return;
      }
      openPanel(n.id);
    });
    g.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      if (n.type === 'project') focusProject(n);
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

function renderConnections(node) {
  const box = $('#connectionsBox');
  const edges = state.edges.filter(e => e.source === node.id || e.target === node.id);
  box.innerHTML = '';
  if (!edges.length) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  const label = document.createElement('div');
  label.className = 'connections-title';
  label.textContent = 'CONEXÕES';
  box.append(label);
  for (const edge of edges) {
    const otherId = edge.source === node.id ? edge.target : edge.source;
    const other = state.nodes.find(n => n.id === otherId);
    if (!other) continue;
    const btn = document.createElement('button');
    btn.className = 'connection-item';
    btn.innerHTML = `<strong>${escapeHtml(other.title)}</strong><span>${escapeHtml(edge.reason || (edge.kind === 'contains' ? 'pertence ao mesmo projeto' : 'contextos relacionados'))}</span>`;
    btn.addEventListener('click', () => focusNode(other));
    box.append(btn);
  }
}

function focusProject(project) {
  const cluster = [project, ...state.nodes.filter(n => n.parentId === project.id)];
  const rect = graph.getBoundingClientRect();
  state.camera = fitCamera(cluster, rect.width, rect.height);
  persist(`Foco: ${project.title}`);
  render();
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
  $('#focusProjectBtn').hidden = node.type !== 'project';
  $('#toggleProjectBtn').hidden = node.type !== 'project';
  if (node.type === 'project') $('#toggleProjectBtn').textContent = node.collapsed ? 'Expandir projeto' : 'Recolher projeto';
  $('#branchChatBtn').hidden = node.type !== 'chat';
  updateProviderUi();
  detailPanel.classList.add('open');
  renderConnections(node);
  renderMessages(node);
  render();
  if (node.type === 'chat') {
    const syncPromise = node.connectionState === 'READY' ? syncNodeChat(node, true) : bindNodeAtomically(node);
    syncPromise.catch(error => {
      node.connectionState = 'OFFLINE';
      addLocalSystemMessage(node, 'Conexão do chat indisponível: ' + error.message);
      saveState(state);
      renderMessages(node);
      render();
    });
  }
}

function closePanel() {
  selectedId = null;
  $('#panelType').textContent = 'CONTEXTO';
  $('#panelTitle').textContent = 'Selecione uma ilha';
  $('#panelMeta').textContent = 'Clique em uma ilha para abrir o contexto.';
  $('#panelActions').hidden = true;
  $('#focusProjectBtn').hidden = true;
  $('#toggleProjectBtn').hidden = true;
  $('#branchChatBtn').hidden = true;
  $('#dispatchMcfBtn').hidden = true;
  $('#connectionsBox').hidden = true;
  $('#connectionsBox').innerHTML = '';
  $('#messageInput').disabled = true;
  $('#sendBtn').disabled = true;
  $('#messages').innerHTML = '';
  detailPanel.classList.remove('open');
  render();
}

function renderMessages(node) {
  const box = $('#messages');
  const messages = node.messages || [];
  box.innerHTML = '';
  if (!messages.length) {
    const empty = document.createElement('div');
    empty.className = 'message system';
    empty.textContent = 'Contexto local carregado. Ainda não há mensagens nesta ilha.';
    box.append(empty);
  }
  for (const m of messages) {
    const div = document.createElement('div');
    div.className = 'message ' + (m.role || 'user') + (m.status === 'streaming' ? ' streaming' : '');
    const role = document.createElement('div');
    role.className = 'message-role';
    role.textContent = m.role === 'assistant' ? 'IA' : m.role === 'system' ? 'SISTEMA' : 'VOCÊ';
    const text = document.createElement('div');
    text.className = 'message-text';
    text.textContent = m.text || (m.status === 'streaming' ? 'Pensando…' : '');
    div.append(role, text);
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
  if (branchFromId) {
    const origin = state.nodes.find(n => n.id === branchFromId);
    if (origin?.parentId) select.value = origin.parentId;
  }
  select.disabled = type === 'project';
  dialog.dataset.x = String(point?.x ?? 800);
  dialog.dataset.y = String(point?.y ?? 450);
  dialog.showModal();
  setTimeout(() => $('#nodeTitleInput').focus(), 0);
}

async function confirmCreate(event) {
  event.preventDefault();
  const title = $('#nodeTitleInput').value.trim();
  if (!title) return;
  const parentId = createType === 'project' ? null : ($('#nodeParentSelect').value || null);
  const tags = $('#nodeTagsInput').value.split(',').map(s => s.trim()).filter(Boolean);
  let x = Number(dialog.dataset.x), y = Number(dialog.dataset.y);
  if (parentId && x === 800 && y === 450) {
    const parent = state.nodes.find(n => n.id === parentId);
    const siblings = state.nodes.filter(n => n.parentId === parentId).length;
    if (parent) {
      const angle = -Math.PI / 2 + siblings * 1.12;
      const radius = 190 + (siblings % 2) * 42;
      x = parent.x + Math.cos(angle) * radius;
      y = parent.y + Math.sin(angle) * radius;
    }
  }
  const node = createNode({
    type: createType, title, parentId, tags, x, y
  });
  state.nodes.push(node);
  if (node.type === 'chat') node.connectionState = 'CONNECTING';
  if (parentId) connect(state, parentId, node.id, 'contains', 'pertence ao projeto');
  if (branchFromId) {
    const origin = state.nodes.find(n => n.id === branchFromId);
    if (origin) connect(state, origin.id, node.id, 'branch', `ramificação de ${origin.title}`);
    branchFromId = null;
  }
  newbornId = node.id;
  persist(`${createType === 'project' ? 'Projeto' : 'Chat'} criado`);
  dialog.close();
  openPanel(node.id);
  if (node.type === 'chat') {
    try {
      await bindNodeAtomically(node);
      persist('Chat criado e conectado ao dispositivo');
      openPanel(node.id);
    } catch (error) {
      node.connectionState = 'OFFLINE';
      addLocalSystemMessage(node, 'Falha ao conectar chat ao dispositivo: ' + error.message);
      persist('Chat criado sem conexão');
      renderMessages(node);
      render();
    }
  }
  setTimeout(() => {
    if (newbornId === node.id) {
      newbornId = null;
      render();
    }
  }, 900);
}

function focusNode(node) {
  if (node.parentId) {
    const parent = state.nodes.find(n => n.id === node.parentId);
    if (parent?.type === 'project' && parent.collapsed) parent.collapsed = false;
  }
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
    if (!a || !c || !isNodeVisible(a) || !isNodeVisible(c)) continue;
    miniSvg.append(svgEl('line', {
      x1: (a.x-b.minX)*sx, y1:(a.y-b.minY)*sy,
      x2:(c.x-b.minX)*sx, y2:(c.y-b.minY)*sy,
      class:'mini-edge'
    }));
  }
  for (const n of state.nodes) {
    if (!isNodeVisible(n)) continue;
    miniSvg.append(svgEl('circle', {
      cx:(n.x-b.minX)*sx, cy:(n.y-b.minY)*sy,
      r:n.type==='project'?4:2.5, class:`mini-node ${n.type}`
    }));
  }
  const rect = graph.getBoundingClientRect();
  const viewX = (-state.camera.x / state.camera.zoom - b.minX) * sx;
  const viewY = (-state.camera.y / state.camera.zoom - b.minY) * sy;
  const viewW = (rect.width / state.camera.zoom) * sx;
  const viewH = (rect.height / state.camera.zoom) * sy;
  miniSvg.append(svgEl('rect', {
    x:viewX, y:viewY, width:viewW, height:viewH, class:'mini-viewport'
  }));
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
  branchFromId = null;
  openCreateDialog('chat', screenToWorld(e.clientX, e.clientY));
});

graph.addEventListener('click', (e) => {
  if (!e.target.closest?.('.island') && connectFrom) {
    connectFrom = null;
    $('#statusText').textContent = 'Modo conectar cancelado';
    render();
  }
});

$('#newChatBtn').addEventListener('click', () => {
  branchFromId = null;
  openCreateDialog('chat');
});
$('#newProjectBtn').addEventListener('click', () => {
  branchFromId = null;
  openCreateDialog('project');
});
$('#nodeForm').addEventListener('submit', confirmCreate);
$('#closePanelBtn').addEventListener('click', closePanel);
$('#focusProjectBtn').addEventListener('click', () => {
  const node = state.nodes.find(n => n.id === selectedId);
  if (node?.type === 'project') focusProject(node);
});
$('#toggleProjectBtn').addEventListener('click', () => {
  const node = state.nodes.find(n => n.id === selectedId);
  if (!node || node.type !== 'project') return;
  node.collapsed = !node.collapsed;
  persist(node.collapsed ? `Projeto ${node.title} recolhido` : `Projeto ${node.title} expandido`);
  openPanel(node.id);
});
$('#refreshProviderBtn').addEventListener('click', refreshProviderStatus);
$('#providerConfigBtn').addEventListener('click', () => {
  $('#providerFormStatus').textContent = '';
  $('#openaiKeyInput').value = '';
  $('#openaiModelSelect').value = providers.openai?.model || 'gpt-5.6-luna';
  providerDialog.showModal();
  setTimeout(() => $('#openaiKeyInput').focus(), 0);
});
$('#cancelProviderBtn').addEventListener('click', () => providerDialog.close());
$('#providerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const key = $('#openaiKeyInput').value.trim();
  const model = $('#openaiModelSelect').value;
  $('#providerFormStatus').textContent = 'Salvando localmente…';
  $('#saveProviderBtn').disabled = true;
  try {
    const response = await fetch('/api/provider/configure', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({openaiApiKey:key, openaiModel:model})
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.code || ('HTTP ' + response.status));
    providers = result;
    $('#openaiKeyInput').value = '';
    $('#providerFormStatus').textContent = 'Provider ativado.';
    updateProviderUi();
    setTimeout(() => providerDialog.close(), 350);
  } catch (error) {
    $('#providerFormStatus').textContent = 'Falha: ' + error.message;
  } finally {
    $('#saveProviderBtn').disabled = false;
  }
});
$('#dispatchMcfBtn').addEventListener('click', dispatchSelectedToMcf);
$('#branchChatBtn').addEventListener('click', () => {
  const origin = state.nodes.find(n => n.id === selectedId);
  if (!origin || origin.type !== 'chat') return;
  branchFromId = origin.id;
  openCreateDialog('chat', { x: origin.x + 155, y: origin.y + 115 });
  $('#dialogType').textContent = 'RAMIFICAR CONVERSA';
  $('#dialogTitle').textContent = `Nova ilha a partir de “${origin.title}”`;
});

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

$('#composer').addEventListener('submit', async (e) => {
  e.preventDefault();
  const node = selectedNode();
  const input = $('#messageInput');
  const value = input.value.trim();
  if (!node || node.type !== 'chat' || !value || chatBusy) return;

  input.value = '';
  chatBusy = true;
  updateProviderUi();

  try {
    await syncNodeChat(node, true);
    await postUserMessage(node.id, value.slice(0, 12000));
    await syncNodeChat(node, false);
    persist('Mensagem salva pela API Archipelago');

    if (providers.openai?.configured) {
      await askAssistant(node);
    } else {
      addLocalSystemMessage(node, 'Mensagem salva. Configure a IA para gerar respostas.');
      renderMessages(node);
    }
  } catch (error) {
    addLocalSystemMessage(node, 'API/IA indisponível: ' + error.message);
    persist('Falha na conversa');
    renderMessages(node);
  } finally {
    chatBusy = false;
    updateProviderUi();
  }
});

$('#renameBtn').addEventListener('click', async () => {
  const node = state.nodes.find(n => n.id === selectedId);
  if (!node) return;
  const name = prompt('Novo título:', node.title)?.trim();
  if (!name) return;
  node.title = name.slice(0,80);
  if (node.type === 'chat') {
    try { await updateChat(node.id, { title: node.title, projectId: node.parentId || null }); } catch {}
  }
  persist('Ilha renomeada');
  openPanel(node.id);
});

$('#connectBtn').addEventListener('click', () => {
  if (!selectedId) return;
  connectFrom = selectedId;
  pendingConnectionReason = prompt('O que conecta estes dois contextos? (opcional)', 'contextos relacionados')?.trim() || '';
  $('#statusText').textContent = 'Conectar: clique em outra ilha';
});

$('#deleteBtn').addEventListener('click', async () => {
  const node = state.nodes.find(n => n.id === selectedId);
  if (!node) return;
  if (!confirm(`Excluir “${node.title}” e suas conexões?`)) return;
  if (node.type === 'chat') {
    try { await deleteChat(node.id); } catch {}
  }
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
refreshProviderStatus();
connectThisDevice()
  .then(() => Promise.allSettled(state.nodes.filter(n => n.type === 'chat').map(n => bindNodeAtomically(n))))
  .then(() => { saveState(state); render(); })
  .catch(() => {
    for (const node of state.nodes.filter(n => n.type === 'chat')) node.connectionState = 'OFFLINE';
    saveState(state);
    render();
  });

requestAnimationFrame(() => {
  if (!localStorage.getItem('mcf-archipelago-v1')) fitAll();
  else render();
});
