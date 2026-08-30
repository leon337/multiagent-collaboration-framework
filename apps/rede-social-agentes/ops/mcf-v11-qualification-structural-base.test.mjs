import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflow = await readFile('../../.github/workflows/mcf-v11-qualification.yml', 'utf8');
const qualification = await readFile('../../.github/scripts/mcf-v11-qualification.mjs', 'utf8');

test('QP-018 compares the PR base to the candidate without replacing the v1.0 historical baseline', () => {
  assert.match(workflow, /MCF_V10_BASELINE_SHA:/u);
  assert.match(
    workflow,
    /MCF_STRUCTURAL_BASE_SHA:\s*\$\{\{\s*github\.event\.pull_request\.base\.sha/u,
  );
  assert.match(
    qualification,
    /const structuralBase =\s*process\.env\.MCF_STRUCTURAL_BASE_SHA\?\.trim\(\) \|\| baselineMain;/u,
  );
  assert.match(qualification, /git-diff:\$\{structuralBase\}\.\.\.\$\{testedHead\}/u);
  assert.doesNotMatch(
    qualification,
    /structuralNoParallelArchitecture\(\)[\s\S]*?git-diff:\$\{baselineMain\}\.\.\.\$\{testedHead\}/u,
  );
});
