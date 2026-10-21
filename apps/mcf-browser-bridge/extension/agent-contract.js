import { safeOrigin } from './contract.js';
// Data-only PHASE-03 protocol; no canonical runtime authority is implied.
export const exact = (v, keys) => v !== null && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v, k));
export const agentId = v => typeof v === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(v);
export function validAgentRead(r, now = Date.now()) {
  return exact(r, ['protocolVersion','missionId','phaseId','actionId','action','token','expiresAt','timeoutMs']) && r.protocolVersion === 1 && r.missionId === 'MCF-BROWSER-BRIDGE-001' && r.phaseId === 'PHASE-03' && agentId(r.actionId) && r.action === 'read-summary' && typeof r.token === 'string' && /^[a-f0-9]{64}$/.test(r.token) && Number.isSafeInteger(r.expiresAt) && r.expiresAt > now && r.expiresAt <= now + 5000 && Number.isInteger(r.timeoutMs) && r.timeoutMs >= 1 && r.timeoutMs <= 5000;
}
export function validAgentMessage(r) {
  return exact(r, ['type','protocolVersion','missionId','phaseId','actionId','consentRef','expiresAt','target','budget']) && r.type === 'agent_read_request' && r.protocolVersion === 1 && r.missionId === 'MCF-BROWSER-BRIDGE-001' && r.phaseId === 'PHASE-03' && agentId(r.actionId) && agentId(r.consentRef) && Number.isSafeInteger(r.expiresAt) && exact(r.target, ['tabId','documentId','url','origin']) && Number.isSafeInteger(r.target.tabId) && r.target.tabId >= 0 && agentId(r.target.documentId) && typeof r.target.url === 'string' && r.target.url.length <= 2048 && r.target.origin === 'file://' && safeOrigin(r.target.url) === 'file://' && exact(r.budget, ['maxChars','maxNodes','timeoutMs']) && r.budget.maxChars === 4000 && r.budget.maxNodes === 2000 && Number.isInteger(r.budget.timeoutMs) && r.budget.timeoutMs >= 1 && r.budget.timeoutMs <= 5000;
}
export function validSummary(s) {
  return exact(s, ['title','url','text','truncated','visited','untrusted']) && typeof s.title === 'string' && s.title.length <= 160 && s.url === 'file:///[LOCAL_FIXTURE]' && typeof s.text === 'string' && s.text.length <= 4000 && typeof s.truncated === 'boolean' && Number.isInteger(s.visited) && s.visited >= 0 && s.visited <= 2001 && s.untrusted === true;
}

export const AGENT_FAILURE_CODES = ['CONSENT_REQUIRED','CONTEXT_CHANGED','EXPIRED','INVALID_RESULT','BUSY','TIMEOUT'];
