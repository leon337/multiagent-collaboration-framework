import { mkdir, readFile, writeFile } from 'node:fs/promises';

const files = [
  'apps/server/src/mcf-runtime/external-action-ledger.ts',
  'apps/server/src/mcf-runtime/github-branch-pr.adapter.test.ts',
  'apps/server/src/mcf-runtime/github-branch-pr.adapter.ts',
  'apps/server/src/mcf-runtime/github-branch-pr.evidence.ts',
  'apps/server/src/mcf-runtime/github-branch-pr.permission.test.ts',
  'apps/server/src/mcf-runtime/github-branch-pr.timeout.test.ts',
  'apps/server/src/mcf-runtime/permission-engine.ts',
];

const formatted = {};
for (const file of files) {
  formatted[file] = await readFile(file, 'utf8');
}

await mkdir('apps/server/test-results', { recursive: true });
await writeFile(
  'apps/server/test-results/vitest.json',
  JSON.stringify({ purpose: 'C1_PRETTIER_CAPTURE', files: formatted }),
  'utf8',
);
