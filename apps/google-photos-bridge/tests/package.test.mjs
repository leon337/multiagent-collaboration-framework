import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

function json(path) { return JSON.parse(fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8")); }

test("portable plugin package is internally consistent", () => {
  const plugin = json("plugin.json");
  const mcp = json("mcp.json");
  assert.equal(plugin.$schema, "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json");
  assert.equal(plugin.name, "google-photos-bridge");
  assert.equal(plugin.version, "0.4.3");
  assert.equal(mcp.$schema, "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json");
  const server = mcp.mcpServers?.["google-photos-bridge"];
  assert.equal(server?.type, "streamable-http");
  assert.equal(server?.url, "https://mcf-google-photos-bridge.onrender.com/mcp");
  assert.match(plugin.extensions?.["com.openai"]?.interface?.privacyPolicyURL || "", /^https:\/\//);
  assert.match(plugin.extensions?.["com.openai"]?.interface?.termsOfServiceURL || "", /^https:\/\//);
  assert.equal(fs.existsSync(new URL("../skills/google-photos-bridge/SKILL.md", import.meta.url)), true);
  assert.equal(fs.existsSync(new URL("../skills/google-photos-bridge/agents/openai.yaml", import.meta.url)), true);
});
