const { randomUUID } = require('crypto');

class DeviceSessionBroker {
  constructor({ ttlMs = 30000 } = {}) {
    this.ttlMs = ttlMs;
    this.sessions = new Map();
    this.chatBindings = new Map();
  }

  connect(input = {}) {
    const now = Date.now();
    const id = 'dev-' + randomUUID();
    const session = {
      id,
      deviceId: String(input.deviceId || 'local-device').slice(0, 160),
      instanceId: String(input.instanceId || 'archipelago').slice(0, 160),
      transport: String(input.transport || 'local-http').slice(0, 80),
      status: 'connected',
      connectedAt: new Date(now).toISOString(),
      lastSeenAt: new Date(now).toISOString(),
      expiresAt: new Date(now + this.ttlMs).toISOString()
    };
    this.sessions.set(id, session);
    return this.publicSession(session);
  }

  heartbeat(id) {
    const session = this.sessions.get(id);
    if (!session) return null;
    const now = Date.now();
    session.status = 'connected';
    session.lastSeenAt = new Date(now).toISOString();
    session.expiresAt = new Date(now + this.ttlMs).toISOString();
    return this.publicSession(session);
  }

  disconnect(id) {
    const session = this.sessions.get(id);
    if (!session) return false;
    session.status = 'disconnected';
    session.lastSeenAt = new Date().toISOString();
    return true;
  }

  get(id) {
    const session = this.sessions.get(id);
    if (!session) return null;
    this.#refresh(session);
    return this.publicSession(session);
  }

  requireConnected(id) {
    const session = this.sessions.get(id);
    if (!session) throw Object.assign(new Error('DEVICE_SESSION_NOT_FOUND'), { status: 409 });
    this.#refresh(session);
    if (session.status !== 'connected') throw Object.assign(new Error('DEVICE_SESSION_OFFLINE'), { status: 409 });
    return session;
  }

  bindChat(chatId, deviceSessionId) {
    const session = this.requireConnected(deviceSessionId);
    const binding = {
      chatId,
      deviceSessionId,
      deviceId: session.deviceId,
      instanceId: session.instanceId,
      transport: session.transport,
      status: 'connected',
      boundAt: new Date().toISOString()
    };
    this.chatBindings.set(chatId, binding);
    return this.getChatBinding(chatId);
  }

  unbindChat(chatId) {
    return this.chatBindings.delete(chatId);
  }

  clearBindings() {
    const cleared = this.chatBindings.size;
    this.chatBindings.clear();
    return cleared;
  }

  getChatBinding(chatId) {
    const binding = this.chatBindings.get(chatId);
    if (!binding) return null;
    const session = this.get(binding.deviceSessionId);
    return {
      ...binding,
      status: session?.status === 'connected' ? 'connected' : 'offline',
      lastSeenAt: session?.lastSeenAt || null,
      expiresAt: session?.expiresAt || null
    };
  }

  #refresh(session) {
    if (session.status === 'connected' && Date.now() > Date.parse(session.expiresAt)) {
      session.status = 'offline';
    }
  }

  publicSession(session) {
    this.#refresh(session);
    return {
      id: session.id,
      deviceId: session.deviceId,
      instanceId: session.instanceId,
      transport: session.transport,
      status: session.status,
      connectedAt: session.connectedAt,
      lastSeenAt: session.lastSeenAt,
      expiresAt: session.expiresAt,
      heartbeatIntervalMs: Math.max(3000, Math.floor(this.ttlMs / 3))
    };
  }
}

module.exports = { DeviceSessionBroker };
