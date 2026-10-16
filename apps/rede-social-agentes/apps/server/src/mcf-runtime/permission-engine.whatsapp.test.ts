import { describe, expect, it } from 'vitest';

import { PermissionEngine } from './permission-engine.js';

const skill = {
  skillId: 'MCF-WHATSAPP-COMMUNICATE',
  name: 'WhatsApp',
  version: '1.0.0',
  purpose: 'Send governed WhatsApp messages',
  ownerAgents: ['Mestre'],
  requiredInputs: ['to', 'body', 'authorizedScope'],
  allowedTools: ['WhatsApp'],
  forbiddenTools: ['bulk-broadcast'],
  permissionProfile: 'SCOPED_WRITE' as const,
  executionSteps: [],
  requiredEvidence: [],
  acceptanceCriteria: [],
  failureModes: [],
  fallback: 'ADB',
  handoffTo: 'Mestre',
};

describe('PermissionEngine WhatsApp boundary', () => {
  it('allows the bounded authorized send-text operation', () => {
    expect(() =>
      new PermissionEngine().assertAllowed(
        skill,
        'Mestre',
        { provider: 'whatsapp', operation: 'send-text', resource: 'whatsapp-cloud-api' },
        { authorizedScope: true, to: '+5581999999999', body: 'Oi' },
      ),
    ).not.toThrow();
  });

  it('rejects unapproved scope and alternate provider operations', () => {
    const engine = new PermissionEngine();
    expect(() =>
      engine.assertAllowed(
        skill,
        'Mestre',
        { provider: 'whatsapp', operation: 'send-text', resource: 'whatsapp-cloud-api' },
        { authorizedScope: false, to: '+5581999999999', body: 'Oi' },
      ),
    ).toThrow(/authorizedScope/u);

    expect(() =>
      engine.assertAllowed(
        skill,
        'Mestre',
        { provider: 'whatsapp', operation: 'send-template', resource: 'whatsapp-cloud-api' },
        { authorizedScope: true, to: '+5581999999999', body: 'Oi' },
      ),
    ).toThrow(/restricted/u);
  });
});
