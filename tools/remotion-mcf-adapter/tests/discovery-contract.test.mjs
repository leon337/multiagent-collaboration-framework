import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const base=join(dirname(fileURLToPath(import.meta.url)),"..","..","..");
const read=(p)=>readFileSync(join(base,p),"utf8");
test("MESTRE startup links to a discoverable Remotion skill",()=>{
 const start=read("AGENTS.md");
 assert.match(start,/MCF-REMOTION-VIDEO-PRODUCE/);
 assert.match(start,/skills\/video\/mcf-remotion-produce\/SKILL\.md/);
 assert.ok(existsSync(join(base,"skills/video/mcf-remotion-produce/SKILL.md")));
});
test("Canonical registry and capability agree on ID and gates",()=>{
 const registry=read("skills/registry.yaml");
 const capability=read("context/capabilities/remotion-video-engine-local.yaml");
 assert.match(registry,/- skill_id: MCF-REMOTION-VIDEO-PRODUCE/);
 assert.match(registry,/status: EXPERIMENTAL/);
 assert.match(capability,/skill_id: MCF-REMOTION-VIDEO-PRODUCE/);
 assert.match(capability,/write_enabled_in_mcf_adapter: false/);
 assert.match(capability,/central_runtime_executable_state: NOT_REGISTERED/);
 assert.match(capability,/chatgpt_native_plugin_state: NOT_CONNECTED/);
});
test("Source repos are advertised, not secret files",()=>{
 const guide=read("docs/operations/MCF-REMOTION-CAPABILITY-DISCOVERY.md");
 assert.match(guide,/leon337\/mcf-remotion-mcp/);
 assert.match(guide,/leon337\/mcf-remotion-studio/);
 assert.match(guide,/\.secrets/);
 assert.match(guide,/SQLite/);
 assert.match(guide,/NÃO instala um plugin/);
});
