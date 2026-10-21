import { safeOrigin } from './contract.js';
import { validAgentMessage, validSummary, exact } from './agent-contract.js';
import { snapshot } from './sanitizer.js';
let lease = null, generation = 0, expiryTimer;
const popups = new Set(), pendingRpc = new Set();
function notify(status) { for (const p of popups) { try { p.postMessage?.({ agentReadAllowed: !!lease?.agentDelegation, status }); } catch {} } }
function stop(status = 'REVOKED') { generation++; clearTimeout(expiryTimer); const old = lease; lease = null; notify(status); old?.port.disconnect(); }
chrome.tabs.onActivated.addListener(() => stop());
chrome.tabs.onUpdated.addListener((id, change) => { if (lease?.target.tabId === id && (change.status === 'loading' || change.url)) stop(); });
chrome.tabs.onRemoved.addListener(id => { if (lease?.target.tabId === id) stop(); });
function validHostResponse(r) {
  return exact(r, ['protocolVersion','actionId','state','failureCode','retryable','sessionId','observedTarget','expiresAt','capabilities','screenshot','effects','untrustedPageData', ...(r?.consentRef === undefined ? [] : ['consentRef'])]) && r.protocolVersion === 1 && r.state === 'VALIDATED' && r.failureCode === null && r.retryable === false && r.screenshot === false && r.effects === 'NONE' && r.untrustedPageData === true && Array.isArray(r.capabilities) && JSON.stringify(r.capabilities) === JSON.stringify(['capabilities','read-summary']) && typeof r.sessionId === 'string' && Number.isSafeInteger(r.expiresAt);
}
async function agentRead(r, l, ticket) {
  if (busy) { stop(); return; }
  busy = true;
  try {
    assertLease(l, ticket);
    if (!l.agentDelegation || r.consentRef !== l.consentRef || r.expiresAt <= Date.now() || r.expiresAt > Math.min(l.expiresAt, Date.now() + 5000) || JSON.stringify(r.target) !== JSON.stringify(l.target) || l.seen.has(r.actionId) || l.seen.size >= 128) throw Error('AGENT_DENIED');
    l.seen.add(r.actionId);
    await current(l, ticket);
    assertLease(l, ticket);
    if (Date.now() >= r.expiresAt) throw Error('EXPIRED');
    const result = await chrome.scripting.executeScript({ target: { tabId: l.target.tabId, documentIds: [l.target.documentId] }, func: snapshot, args: [4000, 2000] });
    assertLease(l, ticket);
    await current(l, ticket);
    assertLease(l, ticket);
    if (Date.now() >= r.expiresAt || result.length !== 1 || result[0].documentId !== l.target.documentId || !validSummary(result[0].result)) throw Error('INVALID_RESULT');
    l.port.postMessage({ type: 'agent_read_result', protocolVersion: r.protocolVersion, ...(r.canonical ? { canonical: r.canonical } : {}), actionId: r.actionId, consentRef: l.consentRef, summary: result[0].result });
    notify('AGENT_READ_COMPLETED');
  } catch (error) {
    if (lease === l) {
      // Never send after a revocation already processed by the worker.
      try { l.port.postMessage({ type: 'agent_read_denied', protocolVersion: r.protocolVersion, ...(r.canonical ? { canonical: r.canonical } : {}), actionId: r.actionId, consentRef: r.consentRef, failureCode: ['CONTEXT_CHANGED','EXPIRED','INVALID_RESULT'].includes(error.message) ? error.message : 'CONSENT_REQUIRED' }); } catch {}
      stop();
    }
  } finally { busy = false; }
}
export function rpc(port, request) {
  return new Promise((resolve, reject) => {
    pendingRpc.add(request.actionId);
    const finish = (err, value) => { pendingRpc.delete(request.actionId); clearTimeout(timer); port.onMessage.removeListener(message); port.onDisconnect.removeListener(disconnect); err ? reject(Error(err)) : resolve(value); };
    const message = r => { if (validAgentMessage(r)) return; if (r?.actionId !== request.actionId || r?.protocolVersion !== 1 || r?.state !== 'VALIDATED' || !validHostResponse(r) || JSON.stringify(r.observedTarget) !== JSON.stringify(request.target) || (request.action !== 'hello' && r.sessionId !== request.sessionId) || (request.action === 'agent-allow' ? typeof r.consentRef !== 'string' : Object.hasOwn(r, 'consentRef'))) finish('HOST_DENIED'); else finish(null, r); };
    const disconnect = () => { void chrome.runtime.lastError; finish('HOST_DISCONNECTED'); };
    const timer = setTimeout(() => finish('HOST_TIMEOUT'), 5000);
    port.onMessage.addListener(message); port.onDisconnect.addListener(disconnect);
    try { port.postMessage(request); } catch { finish('HOST_UNAVAILABLE'); }
  });
}
// Check synchronously before dispatch and after every asynchronous boundary.
// No await may separate the final consent check from scheduling a DOM operation.
function assertLease(l, ticket, paired = true) {
  if (!l || lease !== l || generation !== ticket) throw Error('STOPPED');
  if (paired && (!l.sessionId || Date.now() >= l.expiresAt)) throw Error('CONSENT_REQUIRED');
}
async function current(l, ticket, paired = true) {
  assertLease(l, ticket, paired);
  const target = l.target;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  assertLease(l, ticket, paired);
  if (!tab || tab.id !== target.tabId || tab.url !== target.url || safeOrigin(tab.url) !== target.origin) throw Error('CONTEXT_CHANGED');
  const result = await chrome.scripting.executeScript({ target: { tabId: tab.id, documentIds: [target.documentId] }, func: () => location.href });
  assertLease(l, ticket, paired);
  if (result.length !== 1 || result[0].documentId !== target.documentId || result[0].result !== target.url) throw Error('CONTEXT_CHANGED');
}
function request(action, l) { return { protocolVersion: 1, missionId: 'MCF-BROWSER-BRIDGE-001', phaseId: action === 'agent-allow' ? 'PHASE-03' : 'PHASE-02', actionId: crypto.randomUUID(), action, sessionId: action === 'hello' ? null : l.sessionId, expiresAt: Date.now() + 5000, target: l.target, budget: { maxChars: 4000, maxNodes: 2000, timeoutMs: 5000 } }; }
async function run(command) {
  if (command === 'stop') { stop(); return { status: 'STOPPED' }; }
  if (command === 'connect') {
    stop('SESSION_RESET'); const ticket = generation;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (generation !== ticket) throw Error('STOPPED');
    if (!tab || safeOrigin(tab.url) !== 'file://') throw Error('LOCAL_FIXTURE_ONLY');
    const results = await chrome.scripting.executeScript({ target: { tabId: tab.id, frameIds: [0] }, func: () => ({ url: location.href, fixture: document.documentElement.hasAttribute('data-mcf-synthetic-fixture') }) });
    if (results.length !== 1 || !results[0].result?.fixture || results[0].result.url !== tab.url || !results[0].documentId || generation !== ticket) throw Error('CONTEXT_CHANGED');
    const port = chrome.runtime.connectNative('com.mcf.browser_bridge');
    const l = { port, target: { tabId: tab.id, documentId: results[0].documentId, url: tab.url, origin: 'file://' }, sessionId: null, expiresAt: 0, agentDelegation: false, consentRef: null, seen: new Set() };
    lease = l;
    port.onMessage.addListener(r => {
      if (lease !== l) return;
      if (validAgentMessage(r)) { void agentRead(r, l, ticket); return; }
      if (!validHostResponse(r) || !pendingRpc.has(r.actionId)) stop();
    });
    port.onDisconnect.addListener(() => { void chrome.runtime.lastError; if (lease === l) stop(); });
    await current(l, ticket, false);
    assertLease(l, ticket, false);
    const hello = await rpc(port, request('hello', l));
    assertLease(l, ticket, false);
    if (!/^[\w-]{1,80}$/.test(hello.sessionId) || !Number.isSafeInteger(hello.expiresAt)) throw Error('INVALID_SESSION');
    l.sessionId = hello.sessionId; l.expiresAt = hello.expiresAt;
    if (l.expiresAt > Date.now() + 60000) throw Error('INVALID_EXPIRY');
    expiryTimer = setTimeout(() => { if (lease === l) stop(); }, Math.max(1, l.expiresAt - Date.now()));
    expiryTimer.unref?.();
    assertLease(l, ticket);
    const capabilities = await rpc(port, request('capabilities', l));
    assertLease(l, ticket);
    await current(l, ticket);
    assertLease(l, ticket);
    return { status: 'CONNECTED', mission: 'MCF-BROWSER-BRIDGE-001 / PHASE-02', capabilities: capabilities.capabilities, screenshot: false };
  }
  if (command === 'agent-allow') {
    const l = lease, ticket = generation;
    assertLease(l, ticket);
    if (!popups.size || l.agentDelegation) throw Error('POPUP_REQUIRED');
    await current(l, ticket);
    assertLease(l, ticket);
    const grant = await rpc(l.port, request('agent-allow', l));
    assertLease(l, ticket);
    if (typeof grant.consentRef !== 'string' || !/^[\w-]{1,80}$/.test(grant.consentRef) || grant.expiresAt !== l.expiresAt) throw Error('INVALID_GRANT');
    l.consentRef = grant.consentRef; l.agentDelegation = true;
    notify('AGENT_ALLOWED');
    return { status: 'CONNECTED', agentReadAllowed: true, expiresAt: l.expiresAt };
  }
  if (command !== 'summary') throw Error('UNKNOWN_COMMAND');
  const l = lease, ticket = generation;
  assertLease(l, ticket);
  await current(l, ticket);
  assertLease(l, ticket);
  await rpc(l.port, request('read-summary', l));
  assertLease(l, ticket);
  await current(l, ticket);
  assertLease(l, ticket);
  const result = await chrome.scripting.executeScript({ target: { tabId: l.target.tabId, documentIds: [l.target.documentId] }, func: snapshot, args: [4000, 2000] });
  assertLease(l, ticket);
  await current(l, ticket);
  assertLease(l, ticket);
  if (result.length !== 1 || result[0].documentId !== l.target.documentId || !result[0].result) throw Error('CONTEXT_CHANGED');
  return { status: 'VALIDATED', summary: result[0].result };
}
let busy = false;
chrome.runtime.onMessage.addListener((m, sender, respond) => {
  if (sender.id !== chrome.runtime.id || sender.url !== chrome.runtime.getURL('popup.html') || sender.tab || !m || Object.keys(m).length !== 1 || !['connect','summary','stop','agent-allow'].includes(m.command)) return false;
  if (m.command === 'stop') { stop(); respond({ status: 'STOPPED' }); return false; }
  if (busy) { respond({ status: 'DENIED', code: 'BUSY' }); return false; }
  busy = true;
  run(m.command).then(result => { busy = false; respond(result); }).catch(() => { busy = false; stop(); respond({ status: 'DENIED', code: 'CHECK_FIXTURE_PERMISSION_AND_NATIVE_HOST' }); });
  return true;
});
// Popup closure revokes consent; worker restart starts with lease=null.
chrome.runtime.onConnect.addListener(port => {
  if (port.name === 'popup' && port.sender?.id === chrome.runtime.id && port.sender?.url === chrome.runtime.getURL('popup.html') && !port.sender?.tab) {
    popups.add(port);
    port.onDisconnect.addListener(() => { popups.delete(port); stop(); });
  }
});
