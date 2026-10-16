import crypto from "node:crypto";

function b64url(input) {
  return Buffer.from(input).toString("base64url");
}

function unb64url(input) {
  return Buffer.from(input, "base64url");
}

export function signState(secret, payload, ttlSeconds = 900) {
  if (!secret) throw new Error("APP_STATE_SECRET is required");
  const body = JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) });
  const encoded = b64url(body);
  const sig = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifyState(secret, token, ttlSeconds = 900) {
  if (!secret || !token) throw new Error("Invalid OAuth state");
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) throw new Error("Invalid OAuth state");
  const expected = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new Error("Invalid OAuth state");
  const payload = JSON.parse(unb64url(encoded).toString("utf8"));
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isInteger(payload.iat) || now - payload.iat > ttlSeconds || payload.iat > now + 60) {
    throw new Error("OAuth state expired");
  }
  return payload;
}
