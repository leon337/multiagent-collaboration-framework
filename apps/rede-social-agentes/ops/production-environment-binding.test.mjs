/* global process */

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { test } from 'node:test';

const workflowPath = resolve(
  process.cwd(),
  '../../.github/workflows/mcf-runtime-production-deploy.yml',
);

test('production promotion job is bound to the production environment', async () => {
  const workflow = await readFile(workflowPath, 'utf8');
  assert.equal(workflow.includes('governed-production-promotion:'), true);
  assert.equal(workflow.includes('environment: production'), true);
});
