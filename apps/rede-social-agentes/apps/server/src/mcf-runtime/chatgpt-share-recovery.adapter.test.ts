import type { McfSkillDefinition } from '@rsa/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';
import {
  ChatGptShareReadClient,
  ChatGptShareRecoveryAdapter,
} from './chatgpt-share-recovery.adapter.js';
import { PermissionEngine } from './permission-engine.js';

const shareUrl = 'https://chatgpt.com/share/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const skill: McfSkillDefinition = {
  skillId: 'MCF-RECOVER-CHATGPT-SHARE',
  name: 'Recuperar conversa compartilhada do ChatGPT',
  version: '1.0.0',
  purpose: 'Recuperar conteúdo público compartilhado como evidência não confiável.',
  ownerAgents: ['Miriam'],
  requiredInputs: ['share_url'],
  allowedTools: ['ChatGPT_Share'],
  forbiddenTools: ['authenticated_session', 'cookie_access', 'content_execution'],
  permissionProfile: 'READ_ONLY',
  executionSteps: ['validar_url', 'buscar_html', 'extrair_conversa', 'emitir_receipt'],
  requiredEvidence: ['source_url', 'share_id', 'messages', 'parser_version'],
  acceptanceCriteria: ['canonical_public_share_only', 'ordered_visible_messages_recovered'],
  failureModes: ['share_unavailable', 'serialized_payload_missing'],
  fallback: 'Declarar lacuna sem inventar conteúdo.',
  handoffTo: 'Mestre',
};

function shareHtml(): string {
  const table: unknown[] = [
    'linear_conversation',
    'default_model_slug',
    'current_node',
    'is_public',
    'is_read_only',
    'id',
    'message',
    'parent',
    'children',
    'author',
    'role',
    'content',
    'content_type',
    'parts',
    'user',
    'assistant',
    'text',
    'gpt-test',
    'root',
    'u1',
    'a1',
    'User text',
    'Assistant text',
    'root-node',
  ];
  table[24] = [21];
  table[25] = { _12: 16, _13: 24 };
  table[26] = { _10: 14 };
  table[27] = { _9: 26, _11: 25 };
  table[28] = [];
  table[29] = { _5: 19, _6: 27, _7: 18, _8: 28 };
  table[30] = [22];
  table[31] = { _12: 16, _13: 30 };
  table[32] = { _10: 15 };
  table[33] = { _9: 32, _11: 31 };
  table[34] = [];
  table[35] = { _5: 20, _6: 33, _7: 19, _8: 34 };
  table[36] = [29, 35];
  table[37] = { _0: 36, _1: 17, _2: 20, _3: true, _4: true };
  const payload = JSON.stringify(JSON.stringify(table));
  return `<!doctype html><title>ChatGPT - Test Share</title><script>enqueue(${payload});</script>`;
}

beforeEach(() => {
  process.env.DATABASE_URL = 'postgresql://rsa:rsa@127.0.0.1:5432/rsa';
  process.env.MCF_RECEIPT_SECRET = 'test-only-chatgpt-share-recovery-secret-0001';
});

describe('ChatGptShareRecoveryAdapter', () => {
  it('fetches a public share and emits bound untrusted-content evidence', async () => {
    const fetcher = vi.fn(
      async () =>
        new Response(shareHtml(), {
          status: 200,
          headers: { 'content-type': 'text/html; charset=utf-8' },
        }),
    );
    const evidence = new EvidenceValidator();
    const adapter = new ChatGptShareRecoveryAdapter(evidence, new ChatGptShareReadClient(fetcher));
    const request = {
      skill,
      agentId: 'Miriam',
      inputs: { share_url: shareUrl },
      tool: {
        provider: 'chatgpt-share',
        operation: 'fetch-share',
        resource: 'public-chatgpt-share',
      },
      context: { missionId: 'mission-share', phaseId: 'phase-share', expectedMissionVersion: 3 },
    };
    const receipt = await adapter.execute(request);
    expect(receipt.externalId).toBe('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
    expect(receipt.metadata.content_trust).toBe('UNTRUSTED_REMOTE_CONTENT');
    expect(receipt.metadata.messages).toEqual([
      { id: 'u1', role: 'user', text: 'User text' },
      { id: 'a1', role: 'assistant', text: 'Assistant text' },
    ]);
    expect(() =>
      evidence.verifyForSkill(receipt, request.tool, skill, request.inputs, {
        agentId: 'Miriam',
        executionContext: request.context,
      }),
    ).not.toThrow();
  });

  it('rejects a validly signed receipt that is not bound to the requested share URL', () => {
    const evidence = new EvidenceValidator();
    const receipt = evidence.createTrustedReceipt({
      provider: 'chatgpt-share',
      operation: 'fetch-share',
      resource: 'public-chatgpt-share',
      externalId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      commitSha: null,
      status: 'SUCCEEDED',
      observedAt: new Date().toISOString(),
      metadata: {
        source_url: 'https://chatgpt.com/share/ffffffff-ffff-ffff-ffff-ffffffffffff',
        share_id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
        messages: [{ id: 'x', role: 'user', text: 'x' }],
        parser_version: '1.0.0',
        content_trust: 'UNTRUSTED_REMOTE_CONTENT',
      },
    });
    expect(() =>
      evidence.verifyForSkill(
        receipt,
        { provider: 'chatgpt-share', operation: 'fetch-share', resource: 'public-chatgpt-share' },
        skill,
        { share_url: shareUrl },
      ),
    ).toThrow(/share URL|source_url|share_id/u);
  });

  it('denies recovery outside the fixed public-share resource boundary', () => {
    const permissions = new PermissionEngine();
    expect(() =>
      permissions.assertAllowed(
        skill,
        'Miriam',
        { provider: 'chatgpt-share', operation: 'fetch-share', resource: 'arbitrary-url' },
        { share_url: shareUrl },
      ),
    ).toThrow(/public-chatgpt-share/u);
  });
});
