import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { FrameParser, encode } from './framing.js';
import { exact, validAgentRead, validSummary, agentId, AGENT_FAILURE_CODES } from '../extension/agent-contract.js';
// Same-UID malware is out of scope. Pin directory inode and refuse all symlink components.
export function privateDirectory(dir) {
  if (typeof dir !== 'string' || !path.isAbsolute(dir) || path.normalize(dir) !== dir || Buffer.byteLength(dir) > 70) throw Error('UNSAFE_DIRECTORY');
  let current = '/';
  for (const part of dir.split('/').filter(Boolean)) {
    current = path.join(current, part);
    const s = fs.lstatSync(current);
    if (!s.isDirectory() || s.isSymbolicLink()) throw Error('UNSAFE_DIRECTORY');
  }
  const s = fs.lstatSync(dir);
  if (s.uid !== process.getuid() || (s.mode & 0o777) !== 0o700) throw Error('UNSAFE_DIRECTORY');
  return s;
}
// Shared by the real socket receiver and deterministic sandbox tests.
export function authorizeAgentRead(r, { grant, seen, pending, now }) {
  if (!grant || now >= grant.expiresAt || !validAgentRead(r, now) || !timingSafeEqual(Buffer.from(r.token), Buffer.from(grant.token)) || seen.has(r.actionId) || seen.size >= 128) return false;
  seen.add(r.actionId);
  return !pending;
}
// Valid stale/duplicate replies are data to discard, never a process failure.
export function routeAgentResult(r, { grant, pending, now }) {
  const denied = r?.type === 'agent_read_denied';
  if (!exact(r, ['type','protocolVersion','actionId','consentRef', denied ? 'failureCode' : 'summary']) || !['agent_read_result','agent_read_denied'].includes(r.type) || r.protocolVersion !== 1 || !agentId(r.actionId) || !agentId(r.consentRef) || (denied ? !AGENT_FAILURE_CODES.includes(r.failureCode) : !validSummary(r.summary))) throw Error('INVALID_AGENT_RESULT');
  if (!grant || !pending || r.actionId !== pending.id || r.consentRef !== grant.ref) return null;
  if (now >= pending.deadline || now >= grant.expiresAt) return { protocolVersion: 1, actionId: r.actionId, status: 'DENIED', failureCode: 'TIMEOUT', retryable: false };
  return denied ? { protocolVersion: 1, actionId: r.actionId, status: 'DENIED', failureCode: r.failureCode, retryable: false } : { protocolVersion: 1, actionId: r.actionId, status: 'VALIDATED', summary: r.summary };
}
export function createAgentBroker(dir, send, now = Date.now) {
  const pinned = privateDirectory(dir), socketPath = path.join(dir, 'mcf-agent.sock'), tokenPath = path.join(dir, 'mcf-agent-capability.json');
  let grant = null, server = null, pending = null, timer, socketInode, tokenInode, cancelled = false;
  const clients = new Set(), seen = new Set();
  const pinnedDirectory = () => { const s = privateDirectory(dir); if (s.dev !== pinned.dev || s.ino !== pinned.ino) throw Error('DIRECTORY_CHANGED'); };
  const unlinkOwned = (file, inode) => { if (!inode) return; try { pinnedDirectory(); const s = fs.lstatSync(file); if (s.dev === inode.dev && s.ino === inode.ino && s.uid === process.getuid()) fs.unlinkSync(file); } catch {} };
  function revoke() {
    cancelled = true; grant = null; clearTimeout(timer);
    if (pending) {
      const p = pending; pending = null; clearTimeout(p.timer);
      if (!p.client.destroyed) p.client.end(encode({ protocolVersion: 1, actionId: p.id, status: 'DENIED', failureCode: 'CONSENT_REQUIRED', retryable: false }));
    }
    // Flush an already bounded denial/result before closing; never accept more reads.
    for (const c of clients) { if (c.writableEnded) c.destroySoon(); else c.destroy(); }
    clients.clear();
    server?.close(); server = null;
    unlinkOwned(tokenPath, tokenInode); unlinkOwned(socketPath, socketInode);
    tokenInode = socketInode = null;
  }
  function result(r) {
    const response = routeAgentResult(r, { grant, pending, now: now() });
    if (!response) return;
    const p = pending; pending = null; clearTimeout(p.timer);
    if (!p.client.destroyed) p.client.end(encode(response));
  }

  async function allow(session) {
    if (cancelled || grant || server) throw Error('ALREADY_ALLOWED');
    pinnedDirectory();
    for (const p of [socketPath, tokenPath]) { try { fs.lstatSync(p); } catch (e) { if (e.code === 'ENOENT') continue; throw e; } throw Error('PATH_EXISTS'); }
    if (session.expiresAt <= now() || session.expiresAt > now() + 60000) throw Error('EXPIRED');
    const token = randomBytes(32).toString('hex');
    grant = { ...session, ref: randomUUID(), token };
    server = net.createServer(client => {
      if (!grant || clients.size >= 4) { client.destroy(); return; }
      clients.add(client); client.setTimeout(5000, () => client.destroy());
      let received = false;
      const parser = new FrameParser(r => {
        if (received) throw Error('ONE_REQUEST_ONLY'); received = true;
        const deny = () => client.end(encode({ protocolVersion: 1, status: 'DENIED', retryable: false }));
        if (!authorizeAgentRead(r, { grant, seen, pending, now: now() })) { deny(); return; }
        const deadline = Math.min(r.expiresAt, now() + r.timeoutMs, grant.expiresAt);
        const p = { id: r.actionId, client, deadline, timer: null };
        pending = p;
        p.timer = setTimeout(() => {
          if (pending !== p) return;
          pending = null;
          if (!client.destroyed) client.end(encode({ protocolVersion: 1, actionId: p.id, status: 'DENIED', failureCode: 'TIMEOUT', retryable: false }));
        }, Math.max(1, deadline - now()));
        try { send({ type: 'agent_read_request', protocolVersion: 1, missionId: 'MCF-BROWSER-BRIDGE-001', phaseId: 'PHASE-03', actionId: r.actionId, consentRef: grant.ref, expiresAt: deadline, target: grant.target, budget: { maxChars: 4000, maxNodes: 2000, timeoutMs: Math.min(r.timeoutMs, deadline - now()) } }); } catch { revoke(); }
      });
      client.on('data', chunk => { try { parser.push(chunk); } catch { client.destroy(); } });
      client.on('end', () => { try { parser.end(); } catch { client.destroy(); } });
      client.on('error', () => {});
      client.on('close', () => { clients.delete(client); if (pending?.client === client) { clearTimeout(pending.timer); pending = null; } });
    });
    try {
      await new Promise((resolve, reject) => { server.once('error', reject);
        const mask = process.umask(0o177);
        try { server.listen(socketPath, resolve); } finally { process.umask(mask); } });
      pinnedDirectory(); socketInode = fs.lstatSync(socketPath);
      if (cancelled) throw Error('REVOKED');
      fs.chmodSync(socketPath, 0o600);
      const fd = fs.openSync(tokenPath, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, 0o600);
      try { tokenInode = fs.fstatSync(fd); fs.fchmodSync(fd, 0o600); fs.writeFileSync(fd, JSON.stringify({ protocolVersion: 1, token, expiresAt: grant.expiresAt })); } finally { fs.closeSync(fd); }
      timer = setTimeout(revoke, Math.max(1, grant.expiresAt - now()));
      server.on('error', revoke);
      return { consentRef: grant.ref, expiresAt: grant.expiresAt };
    } catch (e) { revoke(); throw e; }
  }
  return { allow, revoke, result };
}
