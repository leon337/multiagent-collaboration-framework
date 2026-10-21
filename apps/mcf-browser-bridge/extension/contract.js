// Prototype contract, not a canonical MCF permission engine or receipt/ledger.
export const VERSION = 1;
export const ACTIONS = ['hello', 'capabilities', 'read-summary', 'agent-allow'];
const id = v => typeof v === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(v);
const exact = (v, keys) => v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v, k));
export function safeOrigin(raw) {
  try {
    const u = new URL(raw);
    if (u.username || u.password || u.search || u.hash) return null;
    if (u.protocol === 'file:' && !u.host && u.pathname.endsWith('/fixtures/bridge-fixture.html')) return 'file://';
    return null; // P0: local synthetic fixture only; no authenticated websites.
  } catch { return null; }
}
/** @typedef {{protocolVersion:1,missionId:string,phaseId:string,actionId:string,action:string,sessionId:string|null,expiresAt:number,target:{tabId:number,documentId:string,url:string,origin:string},budget:{maxChars:number,maxNodes:number,timeoutMs:number}}} BridgeRequest */
export function validateRequest(r) {
  if (!exact(r, ['protocolVersion','missionId','phaseId','actionId','action','sessionId','expiresAt','target','budget'])) return 'INVALID_SCHEMA';
  if (r.protocolVersion !== VERSION || r.missionId !== 'MCF-BROWSER-BRIDGE-001' || r.phaseId !== (r.action === 'agent-allow' ? 'PHASE-03' : 'PHASE-02') || !id(r.actionId)) return 'INVALID_SCHEMA';
  if (!ACTIONS.includes(r.action)) return 'ACTION_POLICY_DENIED';
  if (r.action === 'hello' ? r.sessionId !== null : !id(r.sessionId)) return 'INVALID_SESSION';
  if (!Number.isSafeInteger(r.expiresAt)) return 'INVALID_SCHEMA';
  const t = r.target, b = r.budget;
  if (!exact(t,['tabId','documentId','url','origin']) || !Number.isSafeInteger(t.tabId) || t.tabId < 0 || !id(t.documentId) || typeof t.url !== 'string' || t.url.length > 2048 || safeOrigin(t.url) !== t.origin || t.origin !== 'file://') return 'UNSAFE_ORIGIN';
  if (!exact(b,['maxChars','maxNodes','timeoutMs']) || !Number.isInteger(b.maxChars) || b.maxChars < 1 || b.maxChars > 4000 || !Number.isInteger(b.maxNodes) || b.maxNodes < 1 || b.maxNodes > 2000 || !Number.isInteger(b.timeoutMs) || b.timeoutMs < 1 || b.timeoutMs > 5000) return 'INVALID_BUDGET';
  return null;
}
// Pure decision: caller owns session-local replay set; no eviction before session ends.
export function policy(r, { now, sessionId, target, seen, startedAt }) {
  const error = validateRequest(r);
  if (error) return error;
  if (now - startedAt >= 60000 || r.expiresAt <= now || r.expiresAt > now + 10000) return 'EXPIRED';
  if (seen.has(r.actionId)) return 'REPLAY';
  if (seen.size >= 128) return 'BUDGET_EXHAUSTED';
  if (r.action !== 'hello' && r.sessionId !== sessionId) return 'INVALID_SESSION';
  if (target && JSON.stringify(r.target) !== JSON.stringify(target)) return 'CONTEXT_CHANGED';
  return null;
}
