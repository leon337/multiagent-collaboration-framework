import crypto from "node:crypto";

export class EphemeralStore {
  constructor() {
    this.connections = new Map();
    this.sessions = new Map();
  }

  createConnection(ownerId = "anonymous") {
    const connectionId = crypto.randomBytes(24).toString("base64url");
    this.connections.set(connectionId, { ownerId: String(ownerId), status: "pending", token: null, createdAt: Date.now() });
    return connectionId;
  }

  connection(connectionId) {
    return this.connections.get(connectionId) ?? null;
  }

  assertConnectionOwner(ownerId, connectionId) {
    const connection = this.connection(connectionId);
    if (!connection || connection.ownerId !== String(ownerId)) {
      throw new Error("Google Photos connection does not belong to this authenticated user");
    }
    return connection;
  }

  deleteConnection(connectionId) {
    const item = this.connection(connectionId);
    if (!item) return false;
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.connectionId === connectionId) this.sessions.delete(sessionId);
    }
    this.connections.delete(connectionId);
    return true;
  }

  saveToken(connectionId, token) {
    const item = this.connection(connectionId);
    if (!item) throw new Error("Unknown connection");
    item.status = "connected";
    item.token = token;
    item.updatedAt = Date.now();
  }

  saveSession(connectionId, session) {
    this.sessions.set(String(session.id), {
      connectionId,
      pickerUri: String(session.pickerUri),
      expireTime: session.expireTime ?? null,
      createdAt: Date.now(),
    });
  }

  assertSessionOwner(connectionId, sessionId) {
    const session = this.sessions.get(String(sessionId));
    if (!session || session.connectionId !== connectionId) throw new Error("Picker session does not belong to this connection");
    return session;
  }

  deleteSession(connectionId, sessionId) {
    this.assertSessionOwner(connectionId, sessionId);
    this.sessions.delete(String(sessionId));
  }
}
