import crypto from "node:crypto";

const DEFAULT_JWKS_TTL_MS = 5 * 60 * 1000;
const jwksCache = new Map();

export class McpAuthError extends Error {
  constructor(message, { status = 401, code = "invalid_token" } = {}) {
    super(message);
    this.name = "McpAuthError";
    this.status = status;
    this.code = code;
  }
}

function normalizeIssuer(value) {
  return String(value || "").replace(/\/$/, "");
}

function parseScopes(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return String(value || "").split(/[ ,]+/).map((s) => s.trim()).filter(Boolean);
}

export function loadMcpAuthConfig(env = process.env) {
  const enabled = /^(1|true|yes|on)$/i.test(String(env.MCP_AUTH_ENABLED || ""));
  const issuer = normalizeIssuer(env.MCP_AUTH_ISSUER);
  const audience = String(env.MCP_AUTH_AUDIENCE || "");
  const requiredScopes = parseScopes(env.MCP_AUTH_SCOPES || "photos.read");
  const jwksUri = String(env.MCP_AUTH_JWKS_URI || "");
  const metadataUrl = String(env.MCP_AUTH_RESOURCE_METADATA_URL || "");
  if (enabled && (!issuer || !audience)) {
    throw new Error("MCP_AUTH_ENABLED requires MCP_AUTH_ISSUER and MCP_AUTH_AUDIENCE");
  }
  return { enabled, issuer, audience, requiredScopes, jwksUri, metadataUrl };
}

export function protectedResourceMetadata(config, resourceUrl) {
  return {
    resource: resourceUrl,
    authorization_servers: [config.issuer],
    scopes_supported: config.requiredScopes,
    bearer_methods_supported: ["header"],
  };
}

export function authChallenge(config, { code = "invalid_token", description = "Authentication required" } = {}) {
  const metadataUrl = config.metadataUrl;
  const safe = String(description).replace(/["\\\r\n]/g, " ").slice(0, 240);
  const scope = config.requiredScopes.length ? `, scope="${config.requiredScopes.join(" ")}"` : "";
  return `Bearer resource_metadata="${metadataUrl}", error="${code}", error_description="${safe}"${scope}`;
}

function decodeJsonSegment(segment, label) {
  try {
    return JSON.parse(Buffer.from(segment, "base64url").toString("utf8"));
  } catch {
    throw new McpAuthError(`Malformed JWT ${label}`);
  }
}

function scopesFromPayload(payload) {
  if (Array.isArray(payload.scp)) return payload.scp.map(String);
  if (typeof payload.scp === "string") return parseScopes(payload.scp);
  return parseScopes(payload.scope);
}

async function discoverJwksUri(config, fetchImpl) {
  if (config.jwksUri) return config.jwksUri;
  const candidates = [
    `${config.issuer}/.well-known/oauth-authorization-server`,
    `${config.issuer}/.well-known/openid-configuration`,
  ];
  for (const url of candidates) {
    const response = await fetchImpl(url, { headers: { accept: "application/json" } });
    if (!response.ok) continue;
    const metadata = await response.json();
    if (metadata.issuer && normalizeIssuer(metadata.issuer) !== config.issuer) {
      throw new McpAuthError("Authorization server issuer mismatch");
    }
    if (metadata.jwks_uri) return String(metadata.jwks_uri);
  }
  throw new McpAuthError("Authorization server did not publish jwks_uri");
}

async function getJwks(uri, fetchImpl, nowMs = Date.now()) {
  const cached = jwksCache.get(uri);
  if (cached && cached.expiresAt > nowMs) return cached.keys;
  const response = await fetchImpl(uri, { headers: { accept: "application/json" } });
  if (!response.ok) throw new McpAuthError(`JWKS fetch failed (${response.status})`);
  const body = await response.json();
  if (!Array.isArray(body.keys)) throw new McpAuthError("Invalid JWKS document");
  jwksCache.set(uri, { keys: body.keys, expiresAt: nowMs + DEFAULT_JWKS_TTL_MS });
  return body.keys;
}

function verifySignature(alg, signingInput, signature, jwk) {
  const key = crypto.createPublicKey({ key: jwk, format: "jwk" });
  const data = Buffer.from(signingInput);
  if (alg === "RS256") return crypto.verify("RSA-SHA256", data, key, signature);
  if (alg === "ES256") return crypto.verify("sha256", data, { key, dsaEncoding: "ieee-p1363" }, signature);
  throw new McpAuthError(`Unsupported JWT alg: ${alg}`);
}

export async function verifyMcpAccessToken(token, config, { fetchImpl = fetch, nowSeconds = Math.floor(Date.now() / 1000), clockSkewSeconds = 60 } = {}) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) throw new McpAuthError("Malformed bearer token");
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = decodeJsonSegment(encodedHeader, "header");
  const payload = decodeJsonSegment(encodedPayload, "payload");
  if (!header.kid) throw new McpAuthError("JWT is missing kid");
  if (!header.alg || header.alg === "none") throw new McpAuthError("JWT alg is invalid");

  const jwksUri = await discoverJwksUri(config, fetchImpl);
  const keys = await getJwks(jwksUri, fetchImpl);
  const jwk = keys.find((candidate) => String(candidate.kid) === String(header.kid));
  if (!jwk) throw new McpAuthError("Signing key not found");
  const signature = Buffer.from(encodedSignature, "base64url");
  if (!verifySignature(header.alg, `${encodedHeader}.${encodedPayload}`, signature, jwk)) {
    throw new McpAuthError("JWT signature validation failed");
  }

  if (normalizeIssuer(payload.iss) !== config.issuer) throw new McpAuthError("JWT issuer mismatch");
  const audiences = Array.isArray(payload.aud) ? payload.aud.map(String) : [String(payload.aud || "")];
  if (!audiences.includes(config.audience)) throw new McpAuthError("JWT audience mismatch");
  if (!Number.isFinite(payload.exp) || Number(payload.exp) <= nowSeconds - clockSkewSeconds) throw new McpAuthError("JWT expired");
  if (payload.nbf != null && Number(payload.nbf) > nowSeconds + clockSkewSeconds) throw new McpAuthError("JWT is not active yet");

  const scopes = scopesFromPayload(payload);
  const missingScopes = config.requiredScopes.filter((scope) => !scopes.includes(scope));
  if (missingScopes.length) {
    throw new McpAuthError(`Missing required scope: ${missingScopes.join(" ")}`, { status: 403, code: "insufficient_scope" });
  }

  return {
    token,
    clientId: String(payload.client_id || payload.azp || payload.sub || ""),
    subject: payload.sub ? String(payload.sub) : null,
    scopes,
    expiresAt: Number(payload.exp),
    claims: payload,
  };
}

export function bearerTokenFromRequest(req) {
  const header = String(req.get?.("authorization") || req.headers?.authorization || "");
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match?.[1]?.trim() || null;
}

export function createMcpAuthMiddleware(config, { fetchImpl = fetch } = {}) {
  return async function mcpAuthMiddleware(req, res, next) {
    if (!config.enabled) return next();
    try {
      const token = bearerTokenFromRequest(req);
      if (!token) throw new McpAuthError("No bearer token provided");
      req.mcpAuth = await verifyMcpAccessToken(token, config, { fetchImpl });
      return next();
    } catch (error) {
      const authError = error instanceof McpAuthError ? error : new McpAuthError("Token verification failed");
      res.setHeader("WWW-Authenticate", authChallenge(config, { code: authError.code, description: authError.message }));
      return res.status(authError.status).json({ error: authError.code, error_description: authError.message });
    }
  };
}
