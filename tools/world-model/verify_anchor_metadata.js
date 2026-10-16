#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const Ajv2020 = require("ajv/dist/2020");

if (process.argv.length < 3) {
  console.error("usage: verify_anchor_metadata.js METADATA_JSON");
  process.exit(2);
}

const root = path.resolve(__dirname, "../..");
const schema = JSON.parse(
  fs.readFileSync(
    path.join(root, "docs/contracts/MCF-WORLD-EVIDENCE-ANCHOR-METADATA-v0.1.schema.json"),
    "utf8"
  )
);
const metadata = JSON.parse(fs.readFileSync(path.resolve(process.argv[2]), "utf8"));
const ajv = new Ajv2020({allErrors: true, strict: false});
const validate = ajv.compile(schema);

if (!validate(metadata)) {
  console.error("ANCHOR METADATA SCHEMA FAIL");
  console.error(JSON.stringify(validate.errors, null, 2));
  process.exit(1);
}

const owners = new Map();
for (const a of metadata.anchors) {
  if (a.lineEnd < a.lineStart) {
    console.error("ANCHOR METADATA SEMANTIC FAIL lineEnd < lineStart", a.anchorId);
    process.exit(1);
  }
  const previous = owners.get(a.anchorId);
  if (previous && previous !== a.evidenceCanonicalRef) {
    console.error("ANCHOR METADATA SEMANTIC FAIL duplicate anchorId across Evidence", a.anchorId);
    process.exit(1);
  }
  owners.set(a.anchorId, a.evidenceCanonicalRef);
}
console.log("ANCHOR_METADATA_VERIFY PASS");
console.log("anchors", metadata.anchors.length);
