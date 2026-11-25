import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

/**
 * Experimental, host-mediated bridge to the MCF Dual Browser Cockpit.
 * This is NOT a second MCF runtime or an authorization authority.
 * It never accesses ChatGPT session cookies, bypasses login, or retries mutations.
 */
export class GatewayError extends Error {
  constructor(code, { uncertain = false } = {}) {
    super(code);
    this.name = 'GatewayError';
    this.code = code;
    this.uncertain = uncertain;
  }
}
const VALID_INSTANCE = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/;
const DIGEST = /^[a-f0-9]{64}$/;
const TERMINAL = new Set(['COMPLETED', 'FAILED', 'REJECTED', 'UNVERIFIED', 'INTERRUPTED', 'CANCELLED_BY_AUTHORITY']);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function requireText(value, limit, code) {
  if (typeof value !== 'string' || !value.trim() || value.length > limit) throw new GatewayError(code);
  return value.trim();
}
function envelopeIdFrom(value) {
  return value?.envelope?.envelopeId ?? value?.envelopeId ?? null;
}
function sessionSummary(s) {
  return {
    sessionId: s?.sessionId ?? null,
    agentId: s?.agentId ?? null,
    conversationId: s?.conversationId ?? null,
    surfaceState: s?.surfaceState ?? null,
    windowOpen: s?.windowOpen === true,
    deliveryVerified: s?.deliveryVerified === true,
    stateWarning: s?.stateWarning ?? null,
  };
}

export class ChatGPTSessionGateway {
  constructor({ instanceId = 'notebook', home = homedir(), fetchFn = fetch, timeoutMs = 12000 } = {}) {
    if (!VALID_INSTANCE.test(instanceId)) throw new GatewayError('INVALID_INSTANCE_ID');
    if (typeof fetchFn !== 'function' || !Number.isFinite(timeoutMs) || timeoutMs < 100) {
      throw new GatewayError('INVALID_GATEWAY_CONFIGURATION');
    }
    this.instanceId = instanceId;
    this.home = home;
    this.fetchFn = fetchFn;
    this.timeoutMs = timeoutMs;
  }

  async descriptor() {
    const path = join(this.home, '.config/mcf-dual-browser-cockpit/instances', this.instanceId, 'agent-bridge.json');
    let config;
    try { config = JSON.parse(await readFile(path, 'utf8')); }
    catch { throw new GatewayError('BRIDGE_DESCRIPTOR_UNAVAILABLE'); }
    if (config?.enabled !== true || config.instanceId !== this.instanceId ||
        config.host !== '127.0.0.1' || !Number.isInteger(config.port) ||
        config.port < 1 || config.port > 65535 ||
        typeof config.token !== 'string' || config.token.length < 8) {
      throw new GatewayError('BRIDGE_DESCRIPTOR_INVALID');
    }
    // The ephemeral token is never returned by CLI, receipts or diagnostics.
    return { host: config.host, port: config.port, token: config.token };
  }

  async request(method, path, body = undefined) {
    if (!['GET', 'POST'].includes(method) || !/^\/v1\/[a-z0-9/?=&%-]+$/i.test(path)) {
      throw new GatewayError('INVALID_BRIDGE_REQUEST');
    }
    const { host, port, token } = await this.descriptor();
    let response;
    try {
      response = await this.fetchFn('http://' + host + ':' + port + path, {
        method,
        redirect: 'error',
        headers: {
          Authorization: 'Bearer ' + token,
          'X-MCF-Instance': this.instanceId,
          ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(method === 'POST' ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch {
      throw new GatewayError(method === 'POST' ? 'MUTATION_OUTCOME_UNKNOWN' : 'BRIDGE_UNREACHABLE', {
        uncertain: method === 'POST',
      });
    }
    let data;
    try { data = await response.json(); } catch { throw new GatewayError('INVALID_BRIDGE_RESPONSE'); }
    if (!response.ok || data?.ok !== true) {
      const code = typeof data?.error === 'string' && /^[a-z0-9_]{1,100}$/i.test(data.error)
        ? 'BRIDGE_' + data.error.toUpperCase() : 'BRIDGE_REQUEST_REJECTED';
      throw new GatewayError(code);
    }
    return data;
  }

  async discover() {
    const data = (await this.request('GET', '/v1/discovery')).discovery;
    if (data?.schema !== 'mcf-dual-browser-runtime-discovery/v1' ||
        data?.instance?.instanceId !== this.instanceId ||
        data?.authority?.human !== 'LEANDRO' ||
        data?.authority?.orchestrator !== 'MESTRE' ||
        !Array.isArray(data?.current?.paneAgents)) {
      throw new GatewayError('DISCOVERY_CONTRACT_MISMATCH');
    }
    return data;
  }

  async sessions() {
    const discovery = await this.discover();
    return { instanceId: this.instanceId, sessions: (discovery.current.agentSessions ?? []).map(sessionSummary) };
  }

  async openAgentSession({ agent, mission = '', objective = '' }) {
    requireText(agent, 80, 'INVALID_AGENT');
    if (mission.length > 160 || objective.length > 1600) throw new GatewayError('INVALID_SESSION_INPUT');
    const discovery = await this.discover();
    if (discovery.instance.paused || discovery.instance.busy) throw new GatewayError('BRIDGE_NOT_READY');
    const candidates = (discovery.current.canonicalAgents ?? [])
      .filter(item => item?.agentId === agent);
    if (candidates.length !== 1) throw new GatewayError('AGENT_NOT_UNIQUE_OR_NOT_REGISTERED');
    const created = await this.request('POST', '/v1/agent-session/open', { agent, mission, objective });
    const id = created.session?.sessionId;
    if (typeof id !== 'string' || !id) throw new GatewayError('SESSION_ID_MISSING');
    // The application itself owns bootstrap evidence and conversation verification.
    const after = await this.discover();
    const record = (after.current.agentSessions ?? []).find(s => s.sessionId === id);
    const verified = record?.deliveryVerified === true && !record.stateWarning &&
      typeof record.conversationId === 'string' && record.conversationId.length > 0;
    return {
      instanceId: this.instanceId,
      sessionId: id,
      agentId: agent,
      state: verified ? 'READY' : 'UNVERIFIED',
      deliveryVerified: verified,
      reason: verified ? null : 'chat_conversation_not_created',
      conversationId: verified ? record.conversationId : null,
    };
  }

  async dispatchPaneMission({ agentId, missionId, objective, parentMissionId = null, inputs = [], constraints = [], expectedOutputs = [] }) {
    requireText(agentId, 80, 'INVALID_AGENT');
    requireText(missionId, 160, 'INVALID_MISSION_ID');
    requireText(objective, 1600, 'INVALID_OBJECTIVE');
    if (![inputs, constraints, expectedOutputs].every(Array.isArray)) throw new GatewayError('INVALID_MISSION_ARRAY');
    const discovery = await this.discover();
    if (discovery.instance.paused || discovery.instance.busy || discovery.instance.queueDepth > 0) {
      throw new GatewayError('BRIDGE_NOT_READY');
    }
    const panes = discovery.current.paneAgents.filter(a => a.agentId === agentId);
    if (panes.length !== 1) throw new GatewayError('AGENT_NOT_UNIQUE_OR_NOT_BOUND');
    if (panes[0].state !== 'READY' || panes[0].handshakeVerified !== true) {
      throw new GatewayError('AGENT_IDENTITY_UNVERIFIED');
    }
    if ((discovery.warnings ?? []).some(w => w?.pane === panes[0].pane)) {
      throw new GatewayError('PANE_WARNING_BLOCKS_DISPATCH');
    }
    const data = await this.request('POST', '/v1/mission-envelope', {
      agentId, missionId, objective, parentMissionId,
      inputs, constraints, expectedOutputs, required: true,
    });
    const id = envelopeIdFrom(data);
    if (typeof id !== 'string' || !id) throw new GatewayError('DISPATCH_WITHOUT_ENVELOPE');
    return {
      instanceId: this.instanceId,
      missionId,
      agentId,
      envelopeId: id,
      state: data.state ?? (data.queued ? 'QUEUED' : 'DISPATCHED'),
      deduplicated: data.deduplicated === true,
      deliveryVerified: data.delivered === true,
      completed: false,
    };
  }

  async missionResult(envelopeId) {
    requireText(envelopeId, 160, 'INVALID_ENVELOPE_ID');
    const id = encodeURIComponent(envelopeId);
    const data = await this.request('GET', '/v1/mission-status?envelopeId=' + id);
    const mission = data.mission;
    if (!mission || mission.envelopeId !== envelopeId) throw new GatewayError('MISSION_IDENTITY_MISMATCH');
    const state = String(mission.state ?? 'UNKNOWN');
    if (state !== 'COMPLETED') {
      return { envelopeId, state, completed: false, terminal: TERMINAL.has(state), result: null };
    }
    const final = await this.request('GET', '/v1/mission-result?envelopeId=' + id);
    if (final.envelopeId !== envelopeId || final.state !== 'COMPLETED' ||
        !DIGEST.test(final.result?.resultSha256 ?? '')) {
      throw new GatewayError('RESULT_EVIDENCE_UNVERIFIED');
    }
    return { envelopeId, state, completed: true, terminal: true, result: final.result };
  }

  async waitForResult(envelopeId, { timeoutMs = 60000, pollMs = 1500 } = {}) {
    if (!Number.isFinite(timeoutMs) || timeoutMs < 100 || pollMs < 100) {
      throw new GatewayError('INVALID_POLL_CONFIGURATION');
    }
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const result = await this.missionResult(envelopeId);
      if (result.terminal) return result;
      await sleep(Math.min(pollMs, Math.max(0, deadline - Date.now())));
    }
    return { envelopeId, state: 'TIMEOUT_UNVERIFIED', completed: false, terminal: false, result: null };
  }
}
