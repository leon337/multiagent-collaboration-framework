import type { McfSkillDefinition } from '@rsa/contracts';
import { beforeEach, describe, expect, it } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';
import type { ExternalActionDispatcher } from './external-action-dispatcher.js';
import { PermissionEngine } from './permission-engine.js';
import { SkillExecutor } from './skill-executor.js';
import type { SkillRegistryLoader } from './skill-registry.loader.js';

const whatsappSkill: McfSkillDefinition = {
  skillId: 'MCF-WHATSAPP-COMMUNICATE',
  name: 'Comunicar pelo WhatsApp oficial',
  version: '1.0.0',
  purpose: 'Enviar mensagem governada.',
  ownerAgents: ['Mestre'],
  requiredInputs: ['to', 'body', 'authorizedScope'],
  allowedTools: ['WhatsApp'],
  forbiddenTools: ['bulk_broadcast'],
  permissionProfile: 'SCOPED_WRITE',
  executionSteps: ['validar_destino', 'enviar_cloud_api'],
  requiredEvidence: ['provider_message_id', 'accepted_by_provider'],
  acceptanceCriteria: ['provider_accepted_message'],
  failureModes: ['authentication_required'],
  fallback: 'ADB',
  handoffTo: 'Mestre',
};

describe('SkillExecutor WhatsApp integration', () => {
  beforeEach(() => {
    process.env.DATABASE_URL = 'postgresql://rsa:rsa@127.0.0.1:5432/rsa';
    process.env.MCF_RECEIPT_SECRET = 'test-only-mcf-receipt-secret-0000000001';
  });

  it('executes MCF-WHATSAPP-COMMUNICATE as a governed external skill', async () => {
    const evidence = new EvidenceValidator();
    const receipt = evidence.createTrustedReceipt({
      provider: 'whatsapp',
      operation: 'send-text',
      resource: 'whatsapp-cloud-api',
      externalId: 'wamid.TEST123456789',
      commitSha: null,
      status: 'SUCCEEDED',
      observedAt: new Date().toISOString(),
      metadata: {
        adapterId: 'whatsapp-cloud-send-text-v1',
        messageId: 'wamid.TEST123456789',
        recipientHash: 'a'.repeat(64),
        bodyDigest: 'b'.repeat(64),
        bodyLength: 2,
        acceptedByProvider: true,
        deliveryConfirmed: false,
      },
    });
    const registry = {
      load: async () => whatsappSkill,
    } as unknown as SkillRegistryLoader;
    const externalActions = {
      dispatch: async () => ({
        status: 'EXECUTED' as const,
        adapterId: 'whatsapp-cloud-send-text-v1',
        attemptId: 'attempt-whatsapp-1',
        receipt,
      }),
      recordEvidenceValidated: async () => {},
      recordEvidenceRejected: async () => {},
    } as unknown as ExternalActionDispatcher;

    const executor = new SkillExecutor(registry, new PermissionEngine(), evidence, externalActions);

    const result = await executor.execute({
      skillId: 'MCF-WHATSAPP-COMMUNICATE',
      agentId: 'Mestre',
      inputs: {
        to: '+5581999999999',
        body: 'Oi',
        authorizedScope: true,
      },
      tool: {
        provider: 'whatsapp',
        operation: 'send-text',
        resource: 'whatsapp-cloud-api',
      },
      executionContext: {
        missionId: 'mission-whatsapp',
        phaseId: 'phase-whatsapp',
        expectedMissionVersion: 1,
      },
    });

    expect(result).toMatchObject({
      evidenceStatus: 'VALID',
      phaseState: 'COMPLETED',
      missionState: 'EXECUTING',
      handoffTo: 'Mestre',
      externalAction: {
        status: 'EXECUTED',
        adapterId: 'whatsapp-cloud-send-text-v1',
      },
    });
  });
});
