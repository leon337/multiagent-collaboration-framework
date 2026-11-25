import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  authChallenge,
  loadMcpAuthConfig,
  protectedResourceMetadata,
  verifyMcpAccessToken,
  McpAuthError,
} from "../src/auth.mjs";

function signJwt(privateKey, payload, { kid = "k1", alg = "RS256" } = {}) {
  const header = Buffer.from(JSON.stringify({ alg, typ: "JWT", kid })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const data = `${header}.${body}`;
  const sig = crypto.sign("RSA-SHA256", Buffer.from(data), privateKey).toString("base64url");
  return `${data}.${sig}`;
}

let fixtureCounter = 0;
function fixture() {
  fixtureCounter += 1;
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  const jwk = publicKey.export({ format: "jwk" });
  jwk.kid = "k1";
  jwk.use = "sig";
  jwk.alg = "RS256";
  const config = {
    enabled: true,
    issuer: `https://id${fixtureCounter}.example.test`,
    audience: "https://bridge.example.test/mcp",
    requiredScopes: ["photos.read"],
    jwksUri: `https://id${fixtureCounter}.example.test/jwks`,
    metadataUrl: "https://bridge.example.test/.well-known/oauth-protected-resource/mcp",
  };
  const fetchImpl = async (url) => {
    if (String(url) === config.jwksUri) return new Response(JSON.stringify({ keys: [jwk] }), { status: 200, headers: { "content-type": "application/json" } });
    return new Response("not found", { status: 404 });
  };
  return { privateKey, config, fetchImpl };
}

test("auth config stays disabled by default", () => {
  assert.equal(loadMcpAuthConfig({}).enabled, false);
});

test("protected resource metadata is path-aware", () => {
  const { config } = fixture();
  const body = protectedResourceMetadata(config, config.audience);
  assert.equal(body.resource, "https://bridge.example.test/mcp");
  assert.deepEqual(body.authorization_servers, [config.issuer]);
});

test("auth challenge advertises resource metadata and scopes", () => {
  const { config } = fixture();
  const challenge = authChallenge(config, { code: "invalid_token", description: "login" });
  assert.match(challenge, /resource_metadata="https:\/\/bridge\.example\.test\/\.well-known\/oauth-protected-resource\/mcp"/);
  assert.match(challenge, /scope="photos\.read"/);
});

test("valid JWT verifies issuer, audience, expiry and scope", async () => {
  const { privateKey, config, fetchImpl } = fixture();
  const now = 2_000_000_000;
  const token = signJwt(privateKey, { iss: config.issuer, aud: config.audience, sub: "leo", exp: now + 600, scope: "photos.read" });
  const auth = await verifyMcpAccessToken(token, config, { fetchImpl, nowSeconds: now });
  assert.equal(auth.subject, "leo");
  assert.deepEqual(auth.scopes, ["photos.read"]);
});

test("JWT with wrong audience is rejected", async () => {
  const { privateKey, config, fetchImpl } = fixture();
  const now = 2_000_000_000;
  const token = signJwt(privateKey, { iss: config.issuer, aud: "https://wrong.example/mcp", sub: "leo", exp: now + 600, scope: "photos.read" });
  await assert.rejects(() => verifyMcpAccessToken(token, config, { fetchImpl, nowSeconds: now }), McpAuthError);
});

test("JWT missing scope returns insufficient_scope", async () => {
  const { privateKey, config, fetchImpl } = fixture();
  const now = 2_000_000_000;
  const token = signJwt(privateKey, { iss: config.issuer, aud: config.audience, sub: "leo", exp: now + 600, scope: "openid" });
  await assert.rejects(
    () => verifyMcpAccessToken(token, config, { fetchImpl, nowSeconds: now }),
    (error) => error instanceof McpAuthError && error.status === 403 && error.code === "insufficient_scope"
  );
});
