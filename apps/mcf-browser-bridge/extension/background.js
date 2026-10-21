import { safeOrigin } from './contract.js';
import { snapshot } from './sanitizer.js';
let lease = null, generation = 0;
function stop() { generation++; const old = lease; lease = null; old?.port.disconnect(); }
chrome.tabs.onActivated.addListener(stop);
chrome.tabs.onUpdated.addListener((id, change) => { if (lease?.target.tabId === id && (change.status === 'loading' || change.url)) stop(); });
chrome.tabs.onRemoved.addListener(id => { if (lease?.target.tabId === id) stop(); });
function rpc(port, request) {
  return new Promise((resolve, reject) => {
    const finish = (err, value) => { clearTimeout(timer); port.onMessage.removeListener(message); port.onDisconnect.removeListener(disconnect); err ? reject(Error(err)) : resolve(value); };
    const message = r => { if (r?.actionId !== request.actionId || r?.protocolVersion !== 1 || r?.state !== 'VALIDATED') finish('HOST_DENIED'); else finish(null, r); };
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
function request(action, l) { return { protocolVersion: 1, missionId: 'MCF-BROWSER-BRIDGE-001', phaseId: 'PHASE-02', actionId: crypto.randomUUID(), action, sessionId: action === 'hello' ? null : l.sessionId, expiresAt: Date.now() + 5000, target: l.target, budget: { maxChars: 4000, maxNodes: 2000, timeoutMs: 5000 } }; }
async function run(command) {
  if (command === 'stop') { stop(); return { status: 'STOPPED' }; }
  if (command === 'connect') {
    stop(); const ticket = generation;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (generation !== ticket) throw Error('STOPPED');
    if (!tab || safeOrigin(tab.url) !== 'file://') throw Error('LOCAL_FIXTURE_ONLY');
    const results = await chrome.scripting.executeScript({ target: { tabId: tab.id, frameIds: [0] }, func: () => ({ url: location.href, fixture: document.documentElement.hasAttribute('data-mcf-synthetic-fixture') }) });
    if (results.length !== 1 || !results[0].result?.fixture || results[0].result.url !== tab.url || !results[0].documentId || generation !== ticket) throw Error('CONTEXT_CHANGED');
    const port = chrome.runtime.connectNative('com.mcf.browser_bridge');
    const l = { port, target: { tabId: tab.id, documentId: results[0].documentId, url: tab.url, origin: 'file://' }, sessionId: null, expiresAt: 0 };
    lease = l; port.onDisconnect.addListener(() => { void chrome.runtime.lastError; if (lease === l) stop(); });
    await current(l, ticket, false);
    assertLease(l, ticket, false);
    const hello = await rpc(port, request('hello', l));
    assertLease(l, ticket, false);
    if (!/^[\w-]{1,80}$/.test(hello.sessionId) || !Number.isSafeInteger(hello.expiresAt)) throw Error('INVALID_SESSION');
    l.sessionId = hello.sessionId; l.expiresAt = hello.expiresAt;
    assertLease(l, ticket);
    const capabilities = await rpc(port, request('capabilities', l));
    assertLease(l, ticket);
    await current(l, ticket);
    assertLease(l, ticket);
    return { status: 'CONNECTED', mission: 'MCF-BROWSER-BRIDGE-001 / PHASE-02', capabilities: capabilities.capabilities, screenshot: false };
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
  if (sender.id !== chrome.runtime.id || sender.url !== chrome.runtime.getURL('popup.html') || sender.tab || !m || Object.keys(m).length !== 1 || !['connect','summary','stop'].includes(m.command)) return false;
  if (m.command === 'stop') { stop(); respond({ status: 'STOPPED' }); return false; }
  if (busy) { respond({ status: 'DENIED', code: 'BUSY' }); return false; }
  busy = true;
  run(m.command).then(result => { busy = false; respond(result); }).catch(() => { busy = false; stop(); respond({ status: 'DENIED', code: 'CHECK_FIXTURE_PERMISSION_AND_NATIVE_HOST' }); });
  return true;
});
// Popup closure revokes consent; worker restart starts with lease=null.
chrome.runtime.onConnect.addListener(port => { if (port.name === 'popup' && port.sender?.url === chrome.runtime.getURL('popup.html')) port.onDisconnect.addListener(stop); });
