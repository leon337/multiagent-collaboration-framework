import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  OBSERVATIONAL_RUNTIME_MIGRATION,
  classifyStructuralDatabaseChanges,
} from '../../../.github/scripts/mcf-v11-structural-migrations.mjs';

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

test('QP-018 permits only the content-pinned observational runtime migration, never project state', () => {
  const root = '../..';
  const current = classifyStructuralDatabaseChanges([OBSERVATIONAL_RUNTIME_MIGRATION], root);
  assert.deepEqual(current.forbiddenDatabaseStateChanges, []);
  assert.deepEqual(current.exemptedRuntimeObservations, [OBSERVATIONAL_RUNTIME_MIGRATION]);

  const unauthorized = classifyStructuralDatabaseChanges(
    [
      OBSERVATIONAL_RUNTIME_MIGRATION,
      'apps/rede-social-agentes/packages/database/migrations/0033_new_project_state.sql',
    ],
    root,
  );
  assert.deepEqual(unauthorized.forbiddenDatabaseStateChanges, [
    'apps/rede-social-agentes/packages/database/migrations/0033_new_project_state.sql',
  ]);

  const tampered = classifyStructuralDatabaseChanges([OBSERVATIONAL_RUNTIME_MIGRATION], root, () =>
    Buffer.from('CREATE TABLE unsafe_project_store();'),
  );
  assert.deepEqual(tampered.exemptedRuntimeObservations, []);
  assert.deepEqual(tampered.forbiddenDatabaseStateChanges, [OBSERVATIONAL_RUNTIME_MIGRATION]);
});
