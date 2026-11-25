#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const Ajv2020 = require("ajv/dist/2020");

if (process.argv.length < 3) {
  console.error("usage: verify_adapter_output.js OUTPUT_DIR");
  process.exit(2);
}
const outDir = path.resolve(process.argv[2]);
const root = path.resolve(__dirname, "../..");
const schema = JSON.parse(fs.readFileSync(path.join(root, "docs/contracts/MCF-WORLD-MODEL-CONTRACT-v0.1.schema.json"), "utf8"));
const bundle = JSON.parse(fs.readFileSync(path.join(outDir, "bundle.json"), "utf8"));

const ajv = new Ajv2020({allErrors: true, strict: false});
const validate = ajv.compile(schema);

const docs = [
  ["contextSlice", bundle.contextSlice],
  ["agentContextPacket", bundle.agentContextPacket]
];
bundle.projectedObjects.forEach((x, i) => docs.push(["projectedObject[" + i + "]", x]));

for (const pair of docs) {
  const name = pair[0];
  const doc = pair[1];
  if (!validate(doc)) {
    console.error("ADAPTER SCHEMA FAIL", name);
    console.error(JSON.stringify(validate.errors, null, 2));
    process.exit(1);
  }
  console.log("ADAPTER SCHEMA PASS", name);
}
