import { test } from "node:test";
import assert from "node:assert/strict";
import { health, infer } from "../probe.mjs";

test("health checks the local allowlisted Ollama model", async () => {
  const result = await health(async (url) => {
    assert.equal(url, "http://127.0.0.1:11434/api/tags");
    return new Response(JSON.stringify({ models: [{ name: "qwen3.5:4b" }] }), {
      status: 200,
    });
  });
  assert.equal(result.status, "READY");
  assert.equal(result.externalEffects, false);
});

test("infer creates an auditable text-only receipt for a local request", async () => {
  const receipt = await infer("2+2", async (url, init) => {
    assert.equal(url, "http://127.0.0.1:11434/api/chat");
    const data = JSON.parse(init.body);
    assert.equal(data.model, "qwen3.5:4b");
    assert.equal(data.stream, false);
    assert.equal(data.think, false);
    return new Response('{"message":{"content":"4"},"eval_count":2}', {
      status: 200,
    });
  });
  assert.equal(receipt.output, "4");
  assert.equal(receipt.lifecycle, "COMPLETED");
  assert.equal(receipt.effectState, "NONE_OBSERVED");
  assert.match(receipt.sha256, /^[a-f0-9]{64}$/);
});

test("input validation fails closed before reaching the network", async () => {
  await assert.rejects(
    infer("", async () => {
      throw new Error("network reached");
    }),
    /Prompt/,
  );
  await assert.rejects(
    infer("x".repeat(8001), async () => {
      throw new Error("network reached");
    }),
    /Prompt/,
  );
});
