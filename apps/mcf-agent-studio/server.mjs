import { createServer } from 'node:http';
import { readFile, writeFile, rename, mkdir, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { createPublisher } from './publisher.mjs';
import { createWorkspaceStore } from './workspace-store.mjs';
import { parseChatCompletion } from './response-parser.mjs';

const APP_DIR = dirname(fileURLToPath(import.meta.url));
const STORAGE = process.env.AGENT_STUDIO_DATA || join(APP_DIR, '.data', 'state.json');
const workspaces = createWorkspaceStore(process.env.AGENT_STUDIO_WORKSPACES || join(dirname(STORAGE),'agent-workspaces'));
const AGENT_SOURCE = process.env.AGENT_STUDIO_AGENT || '/home/leo/Documentos/deepseek-harness/default-workspace/AGENT-HELLO-WORD/hello-world-agent/index.js';
const PROFILE = process.env.AGENT_STUDIO_PROFILE || '/home/leo/.dsh/profiles/web/cordis.patch.yml';
const HOST = '127.0.0.1';
const PORT = Number(process.env.AGENT_STUDIO_PORT || 4317);
const ROUTER_BASE = process.env.AGENT_STUDIO_ROUTER_BASE || 'http://127.0.0.1:20128/v1';
const DSH_BRIDGE = process.env.AGENT_STUDIO_DSH_BRIDGE || 'http://127.0.0.1:4319';
const DSH_BRIDGE_TOKEN_FILE = process.env.AGENT_STUDIO_DSH_TOKEN_FILE || join(APP_DIR, '.data', 'dsh-bridge-token');
const dshBridgeUrl = new URL(DSH_BRIDGE);
if (dshBridgeUrl.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(dshBridgeUrl.hostname)) {
  throw Error('Ponte DSH aceita apenas conexão local.');
}

const routerBaseUrl = new URL(ROUTER_BASE);
if (routerBaseUrl.protocol !== 'http:' || routerBaseUrl.hostname !== '127.0.0.1' && routerBaseUrl.hostname !== 'localhost') {
  throw Error('Somente gateways locais são permitidos no Agent Studio');
}
const MODES = ['fixed', 'echo', 'instructed'];
const TOOLS = ['calculator', 'clock'];
let provider = { key: process.env.AGENT_STUDIO_API_KEY || process.env.NINEROUTER_API_KEY || '', model: process.env.AGENT_STUDIO_MODEL || 'ollama/gpt-oss:120b', verified: false };
const pending = new Map();

const DEFAULT = { name: 'Hello World Agent', mode: 'fixed', response: 'Hello World!', instructions: 'Responda somente com a resposta fixa.', tools: [] };
let state;
const publisher = createPublisher({profile: PROFILE, store: join(dirname(STORAGE), 'publish'), getDraft: () => state});

function fail(message, code = 400) {
  const e = new Error(message);
  e.status = code;
  throw e;
}
function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function clone(x) { return JSON.parse(JSON.stringify(x)); }
function sanitizeConfig(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) fail('Configuração inválida');
  const result = {
    name: data.name ?? DEFAULT.name,
    mode: data.mode ?? DEFAULT.mode,
    response: data.response ?? DEFAULT.response,
    instructions: data.instructions ?? DEFAULT.instructions,
    tools: data.tools ?? []
  };
  if (typeof result.name !== 'string' || !result.name.trim() || result.name.length > 80) fail('Nome inválido');
  if (!MODES.includes(result.mode)) fail('Modo não permitido');
  if (typeof result.response !== 'string' || !result.response.trim() || result.response.length > 400) fail('Resposta inválida');
  if (typeof result.instructions !== 'string' || result.instructions.length > 2500) fail('Instruções inválidas');
  if (!Array.isArray(result.tools) || result.tools.some(x => !TOOLS.includes(x))) fail('Ferramenta desconhecida');
  result.tools = [...new Set(result.tools)];
  return result;
}
async function init() {
  await mkdir(dirname(STORAGE), { recursive: true });
  try {
    const parsed = JSON.parse(await readFile(STORAGE, 'utf8'));
    state = { revision: Number(parsed.revision) || 1, current: sanitizeConfig(parsed.current), history: (parsed.history || []).slice(-30) };
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    state = { revision: 1, current: clone(DEFAULT), history: [{ id: randomUUID(), revision: 1, timestamp: new Date().toISOString(), note: 'Estado inicial', config: clone(DEFAULT) }] };
    await save();
  }
}
async function save() {
  const temporary = STORAGE + '.tmp';
  await writeFile(temporary, JSON.stringify(state, null, 2) + '\n', { mode: 0o600 });
  await rename(temporary, STORAGE);
}
function applyChanges(current, changes) {
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) fail('Proposta inválida');
  const allowed = ['name', 'mode', 'response', 'instructions', 'tools'];
  for (const k of Object.keys(changes)) if (!allowed.includes(k)) fail('Campo de proposta não permitido: ' + k);
  return sanitizeConfig({ ...current, ...changes });
}
function guidedInterpret(input, current) {
  const prompt = input.trim();
  if (!prompt || prompt.length > 2000) fail('Digite uma instrução de até 2000 caracteres');
  const low = prompt.toLocaleLowerCase('pt-BR');
  const changes = {};
  const quoted = prompt.match(/["“](.{1,390}?)["”]/);
  if (/\b(resposta|responda|diga|mensagem|frase)\b/i.test(prompt)) {
    const match = quoted || prompt.match(/(?:resposta|responda|diga|mensagem|frase)\s*(?:seja|para|por|como|com|:)\s*(.{1,390})/i);
    if (match) changes.response = match[1].trim().replace(/[.!]\s*$/, x => x === '!' ? '!' : '');
    if (changes.response) changes.mode = 'fixed';
  }
  if (/\b(repetir|repita|eco|ecoar)\b/.test(low)) changes.mode = 'echo';
  if (/\b(modo fixo|resposta fixa)\b/.test(low)) changes.mode = 'fixed';
  if (/\b(conversar|converse|conversacional|interpretar perguntas)\b/.test(low)) changes.mode = 'instructed';
  if (/\b(calculadora|cálculos|calcular)\b/.test(low)) {
    const set = new Set(current.tools);
    if (/\b(remova|remover|desativar|desative|retire)\b/.test(low)) set.delete('calculator'); else set.add('calculator');
    changes.tools = [...set];
  }
  if (/\b(relógio|horário|data e hora)\b/.test(low)) {
    const set = new Set(changes.tools ?? current.tools);
    if (/\b(remova|remover|desativar|desative|retire)\b/.test(low)) set.delete('clock'); else set.add('clock');
    changes.tools = [...set];
  }
  const instruction = prompt.match(/(?:instruções|instrução|personalidade|comportamento)\s*:\s*([\s\S]{1,2400})/i);
  if (instruction) changes.instructions = instruction[1].trim();
  if (!Object.keys(changes).length) fail('Não reconheci uma alteração segura. Use, por exemplo: Altere a resposta para "Bom dia", adicione calculadora ou mude para modo eco.', 422);
  return { changes, explanation: 'Interpretação local baseada em comandos reconhecidos.', source: 'guided' };
}
async function dshSessionCall(path, payload) {
  let token;
  try { token = (await readFile(DSH_BRIDGE_TOKEN_FILE, 'utf8')).trim(); }
  catch { fail('Ponte DSH indisponível. Verifique o perfil Web do Harness.', 503); }
  if (!/^[a-f0-9]{64}$/.test(token)) fail('Token local da ponte DSH inválido', 503);
  let res;
  try {
    res = await fetch(DSH_BRIDGE.replace(/\/$/, '') + path, {
      method: payload === undefined ? 'GET' : 'POST',
      headers: { 'X-Agent-Studio-Bridge': token, ...(payload === undefined ? {} : { 'Content-Type': 'application/json' }) },
      ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
      signal: AbortSignal.timeout(path === '/chat' ? 90000 : 4000)
    });
  } catch (e) {
    fail('Sessão DSH desconectada: ' + (e.name === 'TimeoutError' ? 'tempo excedido' : 'ponte local não responde'), 503);
  }
  let result;
  try { result = await res.json(); }
  catch { fail('Ponte DSH retornou dados inválidos', 502); }
  if (!res.ok) fail('Sessão DSH: ' + String(result.error || 'falha desconhecida').slice(0,260), res.status === 409 ? 409 : 502);
  return result;
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * The DSH HMR watcher waits for approximately 2 seconds of stable profile
 * writes. Verify in a NEW mounted agent session before acknowledging publish.
 */
async function verifyLivePreset(config) {
  const prompt = config.mode === 'echo' ? 'MCF_E2E_ECHO_VERIFICATION'
    : config.mode === 'fixed' ? 'oi'
    : 'oi';
  let reason = 'Resposta inesperada';
  await delay(3200);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const live = await dshSessionCall('/validate-hello-world', { prompt });
      const response = typeof live.answer === 'string' ? live.answer : '';
      const expected = config.mode === 'fixed' ? config.response :
        config.mode === 'echo' ? prompt : null;
      const ok = live.preset === 'hello-world-agent' && response.trim() &&
        (expected === null || response === expected);
      if (ok) return { sessionId: live.sessionId, answer: response, verified: true };
      reason = expected === null ? 'O DSH não carregou o agente de teste' : 'O agente DSH ainda utiliza a versão anterior';
    } catch (e) {
      reason = String(e.message || 'Falha na sessão DSH').slice(0,220);
    }
    if (attempt === 0) await delay(2200);
  }
  fail('A publicação não foi confirmada no DSH: ' + reason, 502);
}
async function aiRequest(messages, jsonMode = false) {
  if (!provider.key) fail('Configure uma chave do 9Router para usar IA. O modo guiado funciona sem chave.', 422);
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 18000);
  try {
    const result = await fetch(ROUTER_BASE.replace(/\/$/, '') + '/chat/completions', {
      method: 'POST', signal: ctrl.signal,
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + provider.key },
      body: JSON.stringify({ model: provider.model, temperature: 0.2, max_tokens: 500, messages, ...(jsonMode ? { response_format: { type: 'json_object' } } : {}) })
    });
    const body = await result.text();
    if (!result.ok) fail('9Router: HTTP ' + result.status + '. Verifique o modelo e a chave.', 502);
    try {
      return parseChatCompletion(body, result.headers.get('content-type') || '');
    } catch (e) {
      fail('Resposta do 9Router inválida: ' + e.message, 502);
    }
  } catch (e) {
    if (e.name === 'AbortError') fail('9Router não respondeu dentro do limite.', 504);
    throw e;
  } finally { clearTimeout(timeout); }
}
async function aiInterpret(prompt, current, backend = 'dsh') {
  const sys = 'Você é um planejador de edição de agente. Responda SOMENTE um JSON com: {"changes":{},"explanation":"..."}. Campos autorizados em changes: name (string até 80), mode ("fixed","echo","instructed"), response (string até 400), instructions (string até 2500), tools (array de "calculator" e/ou "clock"). Não gere código e não execute nada. Preserve os campos não solicitados. Nunca solicite outras ferramentas. Modos: fixed resposta exata; echo repete; instructed conversa via IA. Formate em JSON válido.';
  const request = 'Estado atual: ' + JSON.stringify(current) + '\nPedido: ' + prompt;
  const raw = backend === '9router'
    ? await aiRequest([{ role: 'system', content: sys }, { role: 'user', content: request }], true)
    : await dshSessionCall('/chat', { prompt: sys + '\n' + request }).then(result => result.answer);
  let parsed;
  try { parsed = JSON.parse(raw.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()); }
  catch { fail('Modelo retornou uma proposta que não é JSON válido.', 502); }
  if (!parsed.changes) fail('Modelo não retornou alterações.', 502);
  return { changes: parsed.changes, explanation: String(parsed.explanation || 'Proposta recebida da IA').slice(0, 500), source: 'ai' };
}
function version(note, config) {
  const nextRevision = state.revision + 1;
  state = { revision: nextRevision, current: clone(config), history: [...state.history, { id: randomUUID(), revision: nextRevision, timestamp: new Date().toISOString(), note: String(note).slice(0, 160), config: clone(config) }].slice(-30) };
}
function evaluate(input) {
  const source = input.replace(/,/g, '.').replace(/\s/g, '');
  if (source.length > 70 || !/^[0-9.+*\/()-]+$/.test(source)) fail('Expressão não suportada');
  const tokens = source.match(/\d+(?:\.\d+)?|[()+*/-]/g) || [];
  if (tokens.join('') !== source) fail('Expressão inválida');
  let pos = 0;
  function atom() {
    if (tokens[pos] === '-') { pos++; return -atom(); }
    if (tokens[pos] === '+') { pos++; return atom(); }
    if (tokens[pos] === '(') { pos++; const value = expr(); if (tokens[pos++] !== ')') fail('Parênteses incorretos'); return value; }
    const value = Number(tokens[pos++]); if (!Number.isFinite(value)) fail('Número inválido'); return value;
  }
  function term() { let x = atom(); while (tokens[pos] === '*' || tokens[pos] === '/') { const op = tokens[pos++]; const y = atom(); x = op === '*' ? x * y : x / y; } return x; }
  function expr() { let x = term(); while (tokens[pos] === '+' || tokens[pos] === '-') { const op = tokens[pos++]; x = op === '+' ? x + term() : x - term(); } return x; }
  const value = expr();
  if (pos !== tokens.length || !Number.isFinite(value)) fail('Resultado inválido');
  return String(Number(value.toPrecision(12)));
}
async function preview(message, config) {
  if (typeof message !== 'string' || !message.trim() || message.length > 2000) fail('Mensagem de teste inválida');
  const trimmed = message.trim();
  if (config.tools.includes('calculator')) {
    const match = trimmed.match(/^(?:calc(?:ule)?|calcule|calculadora)\s*[: ]\s*([0-9+\-*/().,\s]+)$/i);
    if (match) return { answer: evaluate(match[1]), tool: 'calculator', channel: 'local' };
  }
  if (config.tools.includes('clock') && /\b(horas|horário|data e hora)\b/i.test(trimmed)) {
    return { answer: new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeStyle: 'medium', timeZone: 'America/Recife' }).format(new Date()), tool: 'clock', channel: 'local' };
  }
  if (config.mode === 'fixed') return { answer: config.response, tool: null, channel: 'local' };
  if (config.mode === 'echo') return { answer: trimmed, tool: null, channel: 'local' };
  const envelope = JSON.stringify({
    instructions: config.instructions || 'Converse naturalmente em português do Brasil.',
    message: trimmed,
    constraint: 'Simule a resposta do agente configurado. Responda apenas à mensagem, sem JSON ou comentários sobre a simulação.'
  });
  const simulated = await dshSessionCall('/preview-chat', { prompt: envelope });
  return { answer: simulated.answer, tool: null, channel: 'dsh-preview',
    sessionId: simulated.sessionId };
}
function json(res, status, payload) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  res.end(JSON.stringify(payload));
}
async function inputJson(req) {
  let buffer = ''; for await (const chunk of req) { buffer += chunk; if (buffer.length > 32000) fail('Requisição grande demais', 413); }
  try { return JSON.parse(buffer || '{}'); } catch { fail('JSON inválido'); }
}
function assertLocal(req) {
  const host = req.headers.host || '';
  if (!new RegExp('^(127\\.0\\.0\\.1|localhost):' + PORT + '$').test(host)) fail('Host inválido', 403);
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const origin = req.headers.origin;
    if (origin && origin !== 'http://' + host) fail('Origem não permitida', 403);
  }
}
async function fileExists(path) { try { await access(path); return true; } catch { return false; } }
async function route(req, res) {
  try {
    assertLocal(req);
    const url = new URL(req.url, 'http://' + req.headers.host);
    const path = url.pathname;
    if (req.method === 'GET' && ['/', '/style.css', '/app.js', '/lab', '/lab.css', '/lab.js', '/builder', '/builder.css', '/builder.js'].includes(path)) {
      const asset = path === '/' ? 'index.html' : path === '/lab' ? 'lab.html' : path === '/builder' ? 'builder.html' : path.slice(1);
      const raw = await readFile(join(APP_DIR, 'public', asset));
      const contentType = path === '/' || path === '/lab' || path === '/builder' ? 'text/html' : path.endsWith('.css') ? 'text/css' : 'text/javascript';
      res.writeHead(200, { 'content-type': contentType + '; charset=utf-8', 'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'", 'x-content-type-options': 'nosniff', 'cache-control': 'no-store' }); res.end(raw); return;
    }
    if (req.method === 'GET' && path === '/health') return json(res, 200, { ok: true, service: 'agent-studio', revision: state.revision });
    // Guided Builder: all writes are confined to a private workspace store.
    // A guided handoff is only a reviewable proposal. No automatic mutation.
    const handoffRead=path.match(/^\/api\/builder\/handoff\/([a-f0-9-]{36})$/);
    if(req.method==='GET'&&handoffRead){
      const proposal=pending.get(handoffRead[1]);
      if(!proposal||proposal.source!=='guided-builder')fail('Proposta guiada expirada',404);
      if(proposal.baseRevision!==state.revision)fail('O rascunho mudou. Gere outra proposta.',409);
      return json(res,200,proposal);
    }
    if (req.method === 'GET' && path === '/api/builder/workspaces')
      return json(res,200,{items:await workspaces.list()});
    if (req.method === 'POST' && path === '/api/builder/workspaces') {
      const body=await inputJson(req);
      const seed=body.kind==='modify'?state.current:undefined;
      return json(res,201,await workspaces.create({...body,seed}));
    }
    const builderPath=path.match(/^\/api\/builder\/workspaces\/(agent-[a-f0-9-]{36})(?:\/(test|mentor|handoff))?$/);
    if(builderPath){
      const id=builderPath[1],operation=builderPath[2];
      if(req.method==='POST'&&operation==='handoff'){
        const w=await workspaces.get(id);
        if(w.kind!=='modify'||w.source!=='hello-world-agent')
          fail('Instalação de agentes novos ainda não permitida no MVP',422);
        if(!w.config.objective||!w.config.instructions||w.tests.length===0)
          fail('Complete objetivo, instruções e pelo menos um teste antes de ir ao editor',422);
        const next=sanitizeConfig({name:w.config.name,mode:w.config.mode,
          response:w.config.response,instructions:w.config.instructions,tools:w.config.tools});
        if(same(next,state.current))fail('A proposta não modifica o agente ativo',422);
        const proposalId=randomUUID();
        pending.clear();pending.set(proposalId,{id:proposalId,baseRevision:state.revision,
          next,explanation:'Revisão assistida do workspace '+w.config.name+' (r'+w.revision+'). Proposta ainda não aplicada.',
          source:'guided-builder'});
        return json(res,200,{proposalId,redirect:'/?proposal='+proposalId,
          applied:false,published:false,revision:state.revision});
      }

      if(req.method==='GET'&&!operation)return json(res,200,await workspaces.get(id));
      if(req.method==='PATCH'&&!operation){
        const body=await inputJson(req);
        return json(res,200,await workspaces.update(id,body));
      }
      if(req.method==='POST'&&operation==='test'){
        const body=await inputJson(req);
        const prompt=body.message;
        if(typeof prompt!=='string'||!prompt.trim()||prompt.length>1000)
          fail('Mensagem de teste inválida',422);
        return json(res,200,await workspaces.test(id,prompt,preview));
      }
      if(req.method==='POST'&&operation==='mentor'){
        const body=await inputJson(req);
        const question=body.question;
        if(typeof question!=='string'||!question.trim()||question.length>700)
          fail('Pergunta muito longa para o orientador',422);
        const w=await workspaces.get(id);
        const instruction='Você é o MCF Agent Architect. Analise somente esta configuração de RASCUNHO, e oriente o usuário. Responda em português brasileiro com no máximo 5 frases úteis. NÃO crie arquivos, execute comandos, faça alterações nem alegue que um preset foi publicado. Se suas regras exigem JSON, use {"changes":{},"explanation":"sua orientação"}. Etapa atual: '+w.step+'; dados: '+JSON.stringify(w.config)+'; pergunta: '+question;
        const raw=(await dshSessionCall('/chat',{prompt:instruction})).answer;
        let advice=String(raw).slice(0,1000);
        try{
          const data=JSON.parse(advice.replace(/^```(?:json)?/i,'').replace(/```$/,'').trim());
          if(typeof data.explanation==='string')advice=data.explanation.slice(0,1000);
        }catch{}
        await workspaces.addGuidance(id,question,advice);
        return json(res,200,{advice,origin:'dsh-session',sessionId:(await dshSessionCall('/status')).sessionId});
      }
    }
    if (req.method === 'GET' && path === '/api/lab/status') {
      const [lab,publication]=await Promise.all([dshSessionCall('/lab/status'),publisher.status()]);
      return json(res,200,{...lab,agentName:'Hello World Agent',draftRevision:state.revision,
        draftPublished:publication.effective&&publication.last?.revision===state.revision,
        latestPublishedVerified:publication.last?.runtimeVerified===true});
    }
    if (req.method === 'POST' && path === '/api/lab/message') {
      const body=await inputJson(req);
      if(typeof body.text!=='string'||!body.text.trim()||body.text.length>2000)
        fail('Digite uma mensagem de até 2000 caracteres',422);
      return json(res,200,await dshSessionCall('/lab/message',{text:body.text.trim()}));
    }
    if (req.method === 'POST' && path === '/api/lab/reset') {
      const body=await inputJson(req);
      if(body.confirmation!=='NOVA CONVERSA') fail('Confirmação de nova conversa inválida',403);
      return json(res,200,await dshSessionCall('/lab/reset',{}));
    }
    // Read-only DSH native Workspace inspector for the Guided Builder.
    // The mobile Tailnet proxy does not expose this administrative route.
    if (req.method === 'GET' && path === '/api/dsh/workspaces') {
      return json(res,200,await dshSessionCall('/workspace/status'));
    }
    if (req.method === 'POST' && path === '/api/dsh/workspaces/probe') {
      const body=await inputJson(req);
      if(!['hello-world-agent','mcf-studio-brain','mcf-studio-preview'].includes(body.preset))
        fail('Preset não permitido',422);
      return json(res,200,await dshSessionCall('/workspace/probe',{preset:body.preset}));
    }
    if (req.method === 'GET' && path === '/api/dsh/status') {
      try {
        const connection = await dshSessionCall('/status');
        return json(res, 200, { connected: connection.ready === true, sessionId: connection.sessionId, preset: connection.agentPreset, running: connection.running });
      } catch (e) { return json(res, 200, { connected: false, error: e.message }); }
    }
    if (req.method === 'GET' && path === '/api/models') {
      try {
        const response = await fetch(ROUTER_BASE.replace(/\/$/, '') + '/models', { signal: AbortSignal.timeout(3500) });
        if (!response.ok) throw new Error('9Router indisponível');
        const models = await response.json();
        const ids = (Array.isArray(models.data) ? models.data : [])
          .map(m => m?.id).filter(id => typeof id === 'string' && id.length < 110).slice(0, 200);
        return json(res, 200, { available: true, ids });
      } catch {
        return json(res, 200, { available: false, ids: [] });
      }
    }
    if (req.method === 'GET' && path === '/api/publish/status') return json(res, 200, await publisher.status());
    if (req.method === 'POST' && path === '/api/publish/plan') return json(res, 200, await publisher.plan());
    if (req.method === 'POST' && path === '/api/publish/commit') {
      const x = await inputJson(req);
      const savedRevision = state.revision;
      const savedConfig = clone(state.current);
      const written = await publisher.publish(x.id, x.confirmation);
      try {
        const live = await verifyLivePreset(savedConfig);
        await publisher.markVerified(savedRevision,live.sessionId);
        return json(res, 200, {
          ...written, runtimeVerified: true, verificationSessionId: live.sessionId,
          verifiedPreset: 'hello-world-agent', verifiedRevision: savedRevision
        });
      } catch (e) {
        // The profile was written but not verified. Restore the exact backup
        // rather than presenting an unverified update as successfully published.
        try {
          await publisher.rollback('REVERTER HELLO WORLD');
          await delay(3000);
          fail('DSH não confirmou a mudança. Perfil anterior restaurado automaticamente. ' + e.message, 502);
        } catch (rollbackError) {
          if (rollbackError.status === 502) throw rollbackError;
          fail('A validação do DSH falhou e a reversão automática também. ' +
            'Confira os backups do Studio antes de repetir.', 502);
        }
      }
    }
    if (req.method === 'POST' && path === '/api/publish/rollback') {
      const x = await inputJson(req);
      const undo = await publisher.rollback(x.confirmation);
      // Wait for the configuration HMR watcher to settle before responding.
      await delay(3200);
      return json(res, 200, { ...undo, hmrWaited: true });
    }
    if (req.method === 'GET' && path === '/api/state') {
      const publication = await publisher.status();
      return json(res, 200, {
        revision: state.revision, current: state.current, history: state.history.map(({ config, ...h }) => h),
        integration: { profile: PROFILE, agentSource: AGENT_SOURCE, profileReadable: await fileExists(PROFILE), sourceReadable: await fileExists(AGENT_SOURCE), ...publication, published: publication.effective },
        provider: { configured: Boolean(provider.key), verified: provider.verified, model: provider.model }, capabilities: TOOLS
      });
    }
    if (req.method === 'POST' && path === '/api/provider') {
      const x = await inputJson(req);
      if (x.clear === true) { provider.key = ''; provider.verified = false; }
      else if (typeof x.key === 'string' && x.key.length <= 300) {
        provider.key = x.key.trim();
        provider.verified = false;
      }
      if (x.model !== undefined) {
        if (typeof x.model !== 'string' || x.model.length > 100 || !/^[a-zA-Z0-9_./:-]+$/.test(x.model)) fail('Modelo inválido');
        if (provider.model !== x.model) provider.verified = false;
        provider.model = x.model;
      }
      return json(res, 200, { configured: Boolean(provider.key), verified: provider.verified, model: provider.model });
    }
    if (req.method === 'POST' && path === '/api/provider/test') {
      const x = await inputJson(req);
      if (Object.keys(x).length) fail('O teste usa somente a configuração salva na memória');
      if (!provider.key) fail('Informe uma chave no painel 9Router antes de testar', 422);
      provider.verified = false;
      const reply = await aiRequest([
        { role: 'system', content: 'Teste de conectividade. Responda de forma curta.' },
        { role: 'user', content: 'Responda com OK.' }
      ]);
      provider.verified = true;
      return json(res, 200, { ok: true, model: provider.model, replyReceived: Boolean(reply) });
    }
    if (req.method === 'POST' && path === '/api/propose') {
      const x = await inputJson(req);
      let proposal;
      if (x.direct) proposal = { changes: x.direct, explanation: 'Alteração editada pelo painel visual', source: 'visual' };
      else if (typeof x.prompt === 'string' && x.prompt.trim()) {
        if (x.prompt.length > 2000) fail('Instrução grande demais');
        proposal = (x.useAi === true) ? await aiInterpret(x.prompt, state.current, x.backend === '9router' ? '9router' : 'dsh') : guidedInterpret(x.prompt, state.current);
      } else fail('Escreva uma alteração');
      const next = applyChanges(state.current, proposal.changes);
      if (same(next, state.current)) fail('A proposta não altera o agente', 422);
      const id = randomUUID();
      pending.clear(); pending.set(id, { id, baseRevision: state.revision, next, explanation: proposal.explanation, source: proposal.source });
      return json(res, 200, pending.get(id));
    }
    if (req.method === 'POST' && path === '/api/apply') {
      const x = await inputJson(req); const p = pending.get(x.id);
      if (!p) fail('Proposta não encontrada ou expirada', 404);
      if (p.baseRevision !== state.revision) fail('Proposta desatualizada; gere uma nova', 409);
      version('Proposta aplicada (' + p.source + ')', p.next); await save(); pending.clear();
      return json(res, 200, { revision: state.revision, current: state.current, draftOnly: true });
    }
    if (req.method === 'POST' && path === '/api/restore') {
      const x = await inputJson(req); const v = state.history.find(h => h.id === x.id);
      if (!v) fail('Versão não encontrada', 404);
      if (same(v.config, state.current)) fail('Esta versão já está ativa no rascunho', 422);
      version('Restaurado de r' + v.revision, sanitizeConfig(v.config)); await save(); pending.clear();
      return json(res, 200, { revision: state.revision, current: state.current, draftOnly: true });
    }
    if (req.method === 'POST' && path === '/api/preview') {
      const x = await inputJson(req);
      const c = x.proposalId ? pending.get(x.proposalId)?.next : state.current;
      if (!c) fail('Proposta expirada', 404);
      return json(res, 200, { ...(await preview(x.message, c)), draftOnly: true });
    }
    if (req.method === 'GET' && path === '/api/export') return json(res, 200, {
      filename: 'hello-world-agent.draft.json', config: state.current, revision: state.revision,
      warning: 'Exportação do rascunho; não é um preset instalado. Use Revisar publicação para publicar no Harness.'
    });
    return json(res, 404, { error: 'Rota inexistente' });
  } catch (e) {
    const status = e.status || 500;
    if (status === 500) console.error('[agent-studio]', e);
    return json(res, status, { error: status === 500 ? 'Erro interno. Verifique o terminal.' : e.message });
  }
}
await init();
const server = createServer(route);
server.listen(PORT, HOST, () => console.log('[MCF Agent Studio] http://' + HOST + ':' + PORT + ' | r' + state.revision + ' | perfil DSH com publicacao confirmada e backup'));
