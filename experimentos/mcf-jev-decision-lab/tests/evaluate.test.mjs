import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/evaluate.js';

function makeRes() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

test('rejects non-POST requests', async () => {
  const res = makeRes();
  await handler({ method: 'GET' }, res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.body.error, 'METHOD_NOT_ALLOWED');
});

test('fails closed when gateway auth is missing', async () => {
  const oldKey = process.env.AI_GATEWAY_API_KEY;
  const oldOidc = process.env.VERCEL_OIDC_TOKEN;
  delete process.env.AI_GATEWAY_API_KEY;
  delete process.env.VERCEL_OIDC_TOKEN;
  const res = makeRes();
  await handler({ method: 'POST', body: { state: { mission: 'x' } } }, res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.error, 'AI_GATEWAY_AUTH_MISSING');
  if (oldKey) process.env.AI_GATEWAY_API_KEY = oldKey;
  if (oldOidc) process.env.VERCEL_OIDC_TOKEN = oldOidc;
});

test('sends typed evaluation payload to Jev and returns result', async () => {
  const previousFetch = global.fetch;
  process.env.AI_GATEWAY_API_KEY = 'test-key';
  let captured;
  global.fetch = async (url, options) => {
    captured = { url, options };
    return {
      ok: true,
      status: 200,
      async text() {
        return JSON.stringify({ answers: { nextAction: { value: 'continue' } } });
      }
    };
  };

  const state = { mission: 'lab', production: false, errors: 0 };
  const res = makeRes();
  await handler({ method: 'POST', body: { state } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.model, 'typesafe-ai/jev');
  assert.deepEqual(res.body.state, state);
  assert.equal(captured.url, 'https://ai-gateway.vercel.sh/v1/evaluate');
  const sent = JSON.parse(captured.options.body);
  assert.equal(sent.model, 'typesafe-ai/jev');
  assert.equal(sent.questions.requiresHumanGate.type, 'boolean');
  assert.equal(sent.questions.nextAction.type, 'choice');

  global.fetch = previousFetch;
  delete process.env.AI_GATEWAY_API_KEY;
});
