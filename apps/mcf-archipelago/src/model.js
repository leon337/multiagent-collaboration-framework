export const seedState = {
  version: 1,
  camera: { x: 0, y: 0, zoom: 1 },
  nodes: [
    { id: 'mcf', type: 'project', title: 'MCF', x: 760, y: 390, r: 88, parentId: null, tags: ['framework', 'principal'], messages: [] },
    { id: 'runtime', type: 'chat', title: 'Runtime', x: 1030, y: 230, r: 60, parentId: 'mcf', tags: ['runtime'], messages: [] },
    { id: 'agents', type: 'chat', title: 'Agentes', x: 500, y: 230, r: 60, parentId: 'mcf', tags: ['agentes'], messages: [] },
    { id: 'dual', type: 'chat', title: 'Dual Browser', x: 1070, y: 555, r: 66, parentId: 'mcf', tags: ['ui'], messages: [] },
    { id: 'voice', type: 'chat', title: 'Voice Hub', x: 485, y: 560, r: 58, parentId: 'mcf', tags: ['voz'], messages: [] },
    { id: 'sofia', type: 'agent', title: 'Sofia', x: 765, y: 665, r: 46, parentId: 'mcf', tags: ['arquitetura'], messages: [] }
  ],
  edges: [
    { id: 'e1', source: 'mcf', target: 'runtime', kind: 'contains' },
    { id: 'e2', source: 'mcf', target: 'agents', kind: 'contains' },
    { id: 'e3', source: 'mcf', target: 'dual', kind: 'contains' },
    { id: 'e4', source: 'mcf', target: 'voice', kind: 'contains' },
    { id: 'e5', source: 'mcf', target: 'sofia', kind: 'contains' },
    { id: 'e6', source: 'agents', target: 'sofia', kind: 'related' }
  ]
};

export function uid(prefix = 'n') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createNode({ type, title, parentId = null, tags = [], x = 800, y = 450 }) {
  return {
    id: uid(type), type, title: title.trim(), parentId: parentId || null,
    tags: tags.map(t => t.trim()).filter(Boolean),
    x, y, r: type === 'project' ? 82 : type === 'agent' ? 46 : 58,
    messages: [], collapsed: false, createdAt: new Date().toISOString()
  };
}

export function normalizeState(input) {
  if (!input || !Array.isArray(input.nodes) || !Array.isArray(input.edges)) throw new Error('JSON inválido: nodes/edges ausentes.');
  const ids = new Set();
  const nodes = input.nodes.map(n => {
    if (!n.id || ids.has(n.id)) throw new Error('JSON inválido: IDs de nós ausentes ou duplicados.');
    ids.add(n.id);
    return {
      id: String(n.id), type: ['project', 'chat', 'agent'].includes(n.type) ? n.type : 'chat',
      title: String(n.title || 'Sem título').slice(0, 80), x: Number(n.x) || 0, y: Number(n.y) || 0,
      r: Number(n.r) || 58, parentId: n.parentId || null,
      tags: Array.isArray(n.tags) ? n.tags.map(String).slice(0, 12) : [],
      messages: Array.isArray(n.messages) ? n.messages.map(String).slice(-200) : [],
      collapsed: n.type === 'project' ? Boolean(n.collapsed) : false
    };
  });
  const edges = input.edges.filter(e => ids.has(e.source) && ids.has(e.target)).map(e => ({
    id: e.id || uid('e'),
    source: e.source,
    target: e.target,
    kind: e.kind || 'related',
    reason: String(e.reason || '').slice(0, 120)
  }));
  return { version: 1, camera: input.camera || { x: 0, y: 0, zoom: 1 }, nodes, edges };
}

export function connect(state, source, target, kind = 'related', reason = '') {
  if (!source || !target || source === target) return false;
  if (state.edges.some(e => (e.source === source && e.target === target) || (e.source === target && e.target === source))) return false;
  state.edges.push({ id: uid('e'), source, target, kind, reason: String(reason || '').trim().slice(0, 120) });
  return true;
}

export function removeNode(state, nodeId) {
  state.nodes = state.nodes.filter(n => n.id !== nodeId);
  state.edges = state.edges.filter(e => e.source !== nodeId && e.target !== nodeId);
  for (const n of state.nodes) if (n.parentId === nodeId) n.parentId = null;
}

export function autoLayout(state) {
  const projects = state.nodes.filter(n => n.type === 'project');
  if (!projects.length) return state;
  const centerX = 800, centerY = 450, projectRing = 280;
  projects.forEach((p, i) => {
    const a = projects.length === 1 ? 0 : (Math.PI * 2 * i) / projects.length;
    p.x = centerX + (projects.length === 1 ? 0 : Math.cos(a) * projectRing);
    p.y = centerY + (projects.length === 1 ? 0 : Math.sin(a) * projectRing);
    const children = state.nodes.filter(n => n.id !== p.id && n.parentId === p.id);
    children.forEach((n, j) => {
      const ca = (Math.PI * 2 * j) / Math.max(children.length, 1) - Math.PI / 2;
      const radius = 190 + (j % 2) * 45;
      n.x = p.x + Math.cos(ca) * radius;
      n.y = p.y + Math.sin(ca) * radius;
    });
  });
  const orphans = state.nodes.filter(n => n.type !== 'project' && !n.parentId);
  orphans.forEach((n, i) => { n.x = 180 + (i % 3) * 150; n.y = 140 + Math.floor(i / 3) * 130; });
  return state;
}

export function searchNodes(state, query) {
  const q = query.trim().toLocaleLowerCase('pt-BR');
  if (!q) return state.nodes;
  return state.nodes.filter(n => `${n.title} ${n.type} ${(n.tags || []).join(' ')}`.toLocaleLowerCase('pt-BR').includes(q));
}
