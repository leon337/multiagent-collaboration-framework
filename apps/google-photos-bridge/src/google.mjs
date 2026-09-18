const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const PICKER_BASE = "https://photospicker.googleapis.com/v1";
export const PICKER_SCOPE = "https://www.googleapis.com/auth/photospicker.mediaitems.readonly";

export class GooglePhotosClient {
  constructor({ clientId, clientSecret, redirectUri, store }) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.store = store;
  }

  get configured() {
    return Boolean(this.clientId && this.clientSecret && this.redirectUri);
  }

  authorizationUrl(state) {
    if (!this.configured) throw new Error("Google OAuth is not configured");
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: "code",
      scope: PICKER_SCOPE,
      access_type: "offline",
      include_granted_scopes: "true",
      prompt: "consent",
      state,
    });
    return `${AUTH_URL}?${params}`;
  }

  async exchangeCode(code) {
    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: this.redirectUri,
    });
    const response = await fetch(TOKEN_URL, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body });
    if (!response.ok) throw new Error(`Google token exchange failed (${response.status})`);
    const token = await response.json();
    token.expires_at = Math.floor(Date.now() / 1000) + Number(token.expires_in ?? 3600);
    return token;
  }

  async accessToken(connectionId) {
    const connection = this.store.connection(connectionId);
    if (!connection?.token) throw new Error("Google Photos is not connected");
    let token = connection.token;
    if (Number(token.expires_at ?? 0) <= Math.floor(Date.now() / 1000) + 60) {
      if (!token.refresh_token) throw new Error("Google refresh token unavailable; reconnect the account");
      const body = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: token.refresh_token,
        grant_type: "refresh_token",
      });
      const response = await fetch(TOKEN_URL, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body });
      if (!response.ok) throw new Error(`Google token refresh failed (${response.status})`);
      const refreshed = await response.json();
      token = { ...refreshed, refresh_token: token.refresh_token, expires_at: Math.floor(Date.now() / 1000) + Number(refreshed.expires_in ?? 3600) };
      this.store.saveToken(connectionId, token);
    }
    return token.access_token;
  }

  async request(connectionId, method, path, { params, body } = {}) {
    const token = await this.accessToken(connectionId);
    const url = new URL(`${PICKER_BASE}${path}`);
    for (const [key, value] of Object.entries(params ?? {})) if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    const response = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) throw new Error(`Google Photos Picker API failed (${response.status})`);
    if (response.status === 204) return {};
    return await response.json();
  }

  async createSession(connectionId, maxItems = 100) {
    const count = Math.max(1, Math.min(2000, Number(maxItems) || 100));
    const session = await this.request(connectionId, "POST", "/sessions", { body: { pickingConfig: { maxItemCount: String(count) } } });
    this.store.saveSession(connectionId, session);
    return session;
  }

  async getSession(connectionId, sessionId) {
    this.store.assertSessionOwner(connectionId, sessionId);
    return this.request(connectionId, "GET", `/sessions/${encodeURIComponent(sessionId)}`);
  }

  async listItems(connectionId, sessionId) {
    this.store.assertSessionOwner(connectionId, sessionId);
    const all = [];
    let pageToken;
    do {
      const result = await this.request(connectionId, "GET", "/mediaItems", { params: { sessionId, pageSize: 100, pageToken } });
      all.push(...(result.mediaItems ?? []));
      pageToken = result.nextPageToken;
    } while (pageToken);
    return all;
  }


  async getImageBytes(connectionId, sessionId, mediaId, maxWidth = 1600, maxHeight = 1600) {
    this.store.assertSessionOwner(connectionId, sessionId);
    const width = Math.max(1, Math.min(4096, Number(maxWidth) || 1600));
    const height = Math.max(1, Math.min(4096, Number(maxHeight) || 1600));
    const items = await this.listItems(connectionId, sessionId);
    const item = items.find((candidate) => String(candidate.id) === String(mediaId));
    if (!item) throw new Error("Selected media item not found in this Picker session");
    if (String(item.type || "") !== "PHOTO") throw new Error("Only photos are returned as image content in this MVP");
    const baseUrl = item.mediaFile?.baseUrl;
    const mimeType = item.mediaFile?.mimeType || "image/jpeg";
    if (!baseUrl) throw new Error("Google Photos did not return a media base URL");

    const token = await this.accessToken(connectionId);
    const response = await fetch(`${baseUrl}=w${width}-h${height}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Google Photos media download failed (${response.status})`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 8 * 1024 * 1024) throw new Error("Selected image exceeds the 8 MB MCP response limit for this MVP");
    return {
      id: String(item.id),
      filename: item.mediaFile?.filename ?? null,
      mimeType,
      bytes,
      width,
      height,
    };
  }

  async deleteSession(connectionId, sessionId) {
    this.store.assertSessionOwner(connectionId, sessionId);
    await this.request(connectionId, "DELETE", `/sessions/${encodeURIComponent(sessionId)}`);
    this.store.deleteSession(connectionId, sessionId);
  }

  async disconnect(connectionId) {
    const connection = this.store.connection(connectionId);
    if (!connection) return false;
    const token = connection.token?.refresh_token || connection.token?.access_token;
    if (token) {
      const body = new URLSearchParams({ token });
      const response = await fetch(REVOKE_URL, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
      });
      if (!response.ok && response.status !== 400) {
        throw new Error(`Google token revocation failed (${response.status})`);
      }
    }
    this.store.deleteConnection(connectionId);
    return true;
  }
}
