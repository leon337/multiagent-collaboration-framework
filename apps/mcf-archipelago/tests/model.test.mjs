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
});

test('connect impede duplicata e self-edge', () => {
  const state = normalizeState(structuredClone(seedState));
  assert.equal(connect(state, 'runtime', 'dual'), true);
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

test('normalizeState rejeita IDs duplicados', () => {
  const bad = { nodes:[{id:'x',title:'a'},{id:'x',title:'b'}], edges:[] };
  assert.throws(() => normalizeState(bad), /duplicados/);
});
