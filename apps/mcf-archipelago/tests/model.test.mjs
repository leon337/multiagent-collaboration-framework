import test from 'node:test';
import assert from 'node:assert/strict';
import { seedState, createNode, normalizeState, connect, removeNode, autoLayout, searchNodes } from '../src/model.js';

test('normalizeState preserva grafo válido', () => {
  const state = normalizeState(structuredClone(seedState));
  assert.equal(state.nodes.length, 6);
  assert.equal(state.edges.length, 6);
});

test('createNode cria chat com campos mínimos', () => {
  const n = createNode({ type:'chat', title:' Novo chat ', parentId:'mcf', tags:[' ui '] });
  assert.equal(n.title, 'Novo chat');
  assert.equal(n.parentId, 'mcf');
  assert.deepEqual(n.tags, ['ui']);
  assert.ok(n.id.startsWith('chat-'));
  assert.equal(n.collapsed, false);
});

test('connect impede duplicata e self-edge', () => {
  const state = normalizeState(structuredClone(seedState));
  assert.equal(connect(state, 'runtime', 'dual', 'related', 'compartilham interface'), true);
  const edge = state.edges.find(e => e.source === 'runtime' && e.target === 'dual');
  assert.equal(edge.reason, 'compartilham interface');
  assert.equal(connect(state, 'dual', 'runtime'), false);
  assert.equal(connect(state, 'runtime', 'runtime'), false);
});

test('removeNode remove edges relacionadas', () => {
  const state = normalizeState(structuredClone(seedState));
  removeNode(state, 'mcf');
  assert.equal(state.nodes.some(n => n.id === 'mcf'), false);
  assert.equal(state.edges.some(e => e.source === 'mcf' || e.target === 'mcf'), false);
});

test('autoLayout mantém coordenadas numéricas', () => {
  const state = normalizeState(structuredClone(seedState));
  autoLayout(state);
  assert.ok(state.nodes.every(n => Number.isFinite(n.x) && Number.isFinite(n.y)));
});

test('searchNodes busca por título e tags', () => {
  const state = normalizeState(structuredClone(seedState));
  assert.equal(searchNodes(state, 'dual').at(0)?.id, 'dual');
  assert.equal(searchNodes(state, 'arquitetura').at(0)?.id, 'sofia');
});

test('normalizeState preserva estado recolhido de projeto', () => {
  const raw = structuredClone(seedState);
  raw.nodes.find(n => n.id === 'mcf').collapsed = true;
  const state = normalizeState(raw);
  assert.equal(state.nodes.find(n => n.id === 'mcf').collapsed, true);
});

test('normalizeState migra edges legadas em formato array', () => {
  const legacy = {
    version: 1,
    nodes: [
      { id:'p', type:'project', title:'Projeto', x:0, y:0, r:80 },
      { id:'c', type:'chat', title:'Chat', x:100, y:0, r:58 }
    ],
    edges: [['p','c']]
  };
  const state = normalizeState(legacy);
  assert.equal(state.version, 4);
  assert.equal(state.edges.length, 1);
  assert.equal(state.edges[0].source, 'p');
  assert.equal(state.edges[0].target, 'c');
  assert.equal(state.edges[0].kind, 'contains');
  assert.equal(state.nodes.find(n => n.id === 'c').parentId, 'p');
});

test('normalizeState recupera conexões canônicas perdidas no legado', () => {
  const broken = structuredClone(seedState);
  broken.version = 2;
  broken.edges = [];
  broken.nodes = broken.nodes.map(n => ({ ...n, parentId: null }));
  const state = normalizeState(broken);
  assert.equal(state.version, 4);
  assert.equal(state.edges.length, 6);
  assert.equal(state.nodes.find(n => n.id === 'runtime').parentId, 'mcf');
});

test('normalizeState migra histórico textual legado para mensagens com papel', () => {
  const raw = structuredClone(seedState);
  raw.nodes.find(n => n.id === 'runtime').messages = ['olá'];
  const state = normalizeState(raw);
  const message = state.nodes.find(n => n.id === 'runtime').messages[0];
  assert.equal(message.role, 'user');
  assert.equal(message.text, 'olá');
  assert.equal(message.localOnly, undefined);
});

test('normalizeState preserva mensagens locais de sistema sem enviá-las ao provider', () => {
  const raw = structuredClone(seedState);
  raw.nodes.find(n => n.id === 'runtime').messages = [
    { role:'system', text:'provider offline', localOnly:true }
  ];
  const state = normalizeState(raw);
  const message = state.nodes.find(n => n.id === 'runtime').messages[0];
  assert.equal(message.role, 'system');
  assert.equal(message.localOnly, true);
});

test('normalizeState rejeita IDs duplicados', () => {
  const bad = { nodes:[{id:'x',title:'a'},{id:'x',title:'b'}], edges:[] };
  assert.throws(() => normalizeState(bad), /duplicados/);
});
