#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const Ajv2020 = require("ajv/dist/2020");

const root = path.resolve(__dirname, "../..");
const schema = JSON.parse(fs.readFileSync(path.join(root, "docs/contracts/MCF-WORLD-MODEL-CONTRACT-v0.1.schema.json"), "utf8"));
const files = [
  "docs/examples/MCF-WORLD-MODEL-EXAMPLE-v0.1.json",
  "docs/examples/MCF-WORLD-MODEL-EDGE-CASES-v0.1.json",
  "docs/examples/MCF-WORLD-MODEL-PROJECTED-MISSION-v0.1.json"
];

const ajv = new Ajv2020({allErrors: true, strict: false});
const validate = ajv.compile(schema);

for (const rel of files) {
  const data = JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
  if (!validate(data)) {
    console.error("SCHEMA FAIL", rel);
    console.error(JSON.stringify(validate.errors, null, 2));
    process.exit(1);
  }
  console.log("SCHEMA PASS", rel);
}

const bad = JSON.parse(fs.readFileSync(path.join(root, "docs/examples/MCF-WORLD-MODEL-EDGE-CASES-v0.1.json"), "utf8"));
bad.relations[0].trust = {class: "CANONICAL_SOURCE"};
if (validate(bad)) {
  console.error("SCHEMA NEGATIVE FAIL inferred relation accepted as canonical");
  process.exit(1);
}
console.log("SCHEMA NEGATIVE PASS inferred relation cannot use CANONICAL_SOURCE");
