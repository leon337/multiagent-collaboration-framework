const PREFIX = '/mestre ';

export function normalizeJid(jid) {
  if (typeof jid !== 'string') return '';
  const [user, domain] = jid.split('@');
  if (!['s.whatsapp.net', 'lid'].includes(domain)) return '';
  if (!/^[0-9]{5,25}(?::[0-9]{1,4})?$/.test(user)) return '';
  return user.split(':')[0] + '@' + domain;
}

export function isOwnChat(remoteJid, identityJids = []) {
  const source = normalizeJid(remoteJid);
  return !!source && identityJids.some(id => normalizeJid(id) === source);
}

export function readPlainText(message) {
  let x = message?.message;
  for (let i = 0; i < 3 && x; i += 1) {
    if (x.ephemeralMessage?.message) x = x.ephemeralMessage.message;
    else if (x.viewOnceMessage?.message) x = x.viewOnceMessage.message;
    else if (x.documentWithCaptionMessage?.message) x = x.documentWithCaptionMessage.message;
    else break;
  }
  const plain = x?.conversation ?? x?.extendedTextMessage?.text;
  return typeof plain === 'string' ? plain : '';
}

export function inspectMessage(msg, { identities, connectedAt, sentIds = new Set(), naturalMode = false } = {}) {
  if (!msg || msg.key?.fromMe !== true) return { kind: 'ignore', reason: 'not_self_sent' };
  if (!isOwnChat(msg.key.remoteJid, identities)) return { kind: 'ignore', reason: 'not_own_chat' };
  if (typeof msg.key.id !== 'string' || !/^[\w.-]{5,180}$/.test(msg.key.id)) return { kind: 'ignore', reason: 'invalid_id' };
  if (sentIds.has(msg.key.id)) return { kind: 'ignore', reason: 'self_generated' };
  const ts = Number(msg.messageTimestamp?.low ?? msg.messageTimestamp ?? 0) * 1000;
  if (!Number.isFinite(ts) || ts < connectedAt - 5000 || ts > Date.now() + 60000) return { kind: 'ignore', reason: 'stale_or_invalid_timestamp' };
  const body = readPlainText(msg).trim();
  // All bot messages use this marker, including replies emitted before their send ID is known.
  if (/^MESTRE:/i.test(body)) return { kind: 'ignore', reason: 'own_bot_reply' };
  const explicit = /^\/mestre(?:\s|$)/i.test(body);
  // Conversation mode is activated by an explicit command on this self-chat only.
  if (!explicit && !naturalMode) return { kind: 'ignore', reason: 'no_command' };
  if (body.length > 950) return { kind: 'ignore', reason: 'too_long' };
  const value = (explicit ? body.replace(/^\/mestre(?:\s|$)/i, '') : body).trim();
  if (!value) return { kind: 'ignore', reason: 'empty_command' };
  if (value.length > 800) return { kind: 'ignore', reason: 'too_long' };
  const cmd = value.toLocaleLowerCase('pt-BR');
  if (explicit && (cmd === 'parar' || cmd === 'stop')) return { kind: 'stop', id: msg.key.id };
  if (explicit && (cmd === 'iniciar' || cmd === 'start')) return { kind: 'start', id: msg.key.id };
  if (explicit && (cmd === 'status' || cmd === 'ping')) return { kind: 'status', id: msg.key.id };
  return { kind: 'prompt', id: msg.key.id, text: value, explicit };
}

export function enforceRate(times, now, { count = 3, intervalMs = 60000 } = {}) {
  const recent = times.filter(t => Number.isFinite(t) && now - t < intervalMs && now >= t);
  if (recent.length >= count) return { allowed: false, times: recent };
  return { allowed: true, times: [...recent, now] };
}

export function safeResponse(input) {
  if (typeof input !== 'string') throw Error('bad_reply');
  const clean = input.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '').trim();
  if (!clean) throw Error('empty_reply');
  return 'MESTRE: ' + clean.slice(0, 2500);
}
