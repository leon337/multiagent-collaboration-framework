import { randomUUID } from 'node:crypto';
import { policy } from '../extension/contract.js';
export function createSession(now = Date.now) {
  const startedAt = now(), sessionId = randomUUID(), seen = new Set();
  let target = null, paired = false;
  return r => {
    const error = policy(r, { now: now(), sessionId, target, seen, startedAt });
    const deny = code => ({ protocolVersion: 1, actionId: typeof r?.actionId === 'string' && /^[\w-]{1,80}$/.test(r.actionId) ? r.actionId : null, state: 'DENIED', failureCode: code, retryable: false });
    if (error) return deny(error);
    if ((!paired && r.action !== 'hello') || (paired && r.action === 'hello')) return deny('PAIRING_REQUIRED');
    seen.add(r.actionId);
    if (!paired) { target = structuredClone(r.target); paired = true; }
    return { protocolVersion: 1, actionId: r.actionId, state: 'VALIDATED', failureCode: null, retryable: false, sessionId, observedTarget: target, expiresAt: startedAt + 60000, capabilities: ['capabilities','read-summary'], screenshot: false, effects: 'NONE', untrustedPageData: true };
  };
}
export function validCaller(origin, extensionId) {
  return typeof extensionId === 'string' && /^[a-p]{32}$/.test(extensionId) && origin === `chrome-extension://${extensionId}/`;
}
