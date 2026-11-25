import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

import { ContextSchemaValidator } from './context-schema.validator.js';

const root = fileURLToPath(new URL('../../../../../../', import.meta.url));

describe('App Hub capability metadata', () => {
  it('validates against canonical capability schema and does not claim an active provider', () => {
    const document = parse(
      readFileSync(join(root, 'context/capabilities/gcp-apphub-inventory-read.yaml'), 'utf8'),
    );
    const validator = new ContextSchemaValidator(
      join(root, 'schemas/context/capability-registry-entry.schema.json'),
    );
    expect(validator.validate(document)).toEqual({ valid: true, errors: [] });
    expect(document.capability).toMatchObject({
      id: 'gcp.apphub.inventory.read',
      mode: 'READ_ONLY',
    });
    expect(document.lifecycle).toMatchObject({
      runtime_state: 'INACTIVE',
      connection_state: 'DISCONNECTED',
    });
  });
});
