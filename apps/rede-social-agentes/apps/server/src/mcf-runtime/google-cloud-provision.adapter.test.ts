import { describe, expect, it, vi } from 'vitest';

import type { McfSkillDefinition } from '@rsa/contracts';

import type { EvidenceValidator } from './evidence-validator.js';
import type { ExternalActionRequest } from './external-action.contracts.js';
import { GoogleCloudProvisionAdapter } from './google-cloud-provision.adapter.js';
import { PermissionEngine } from './permission-engine.js';

const trace = '11111111-1111-4111-8111-111111111111';
const projectId = 'mcf-obras-logistica-v1';
const missionId = 'agente-logistica-v1';
const skill: McfSkillDefinition = {
  skillId: 'MCF-GOOGLE-CLOUD-PROVISION',
  name: 'Provisionamento Google Cloud governado',
  version: '0.1.0',
  purpose: 'Criar projeto e habilitar APIs Maps com escopo aprovado, sem billing.',
  ownerAgents: ['Mestre'],
  requiredInputs: [
    'projectId',
    'missionId',
    'approvedProjectId',
    'humanGateApproved',
    'authorizedScope',
    'sensitiveAuthorization',
    'cloudAccountVerified',
    'cloudTermsAccepted',
  ],
  allowedTools: ['mcf-google-bridge'],
  forbiddenTools: ['billing', 'iam', 'delete', 'deploy', 'public_deployment'],
  permissionProfile: 'HUMAN_GATE',
  executionSteps: ['validar_gate', 'provisionar_projeto', 'habilitar_apis', 'criar_chave_restrita', 'validar_evidencia'],
  requiredEvidence: ['project_id', 'api_restrictions', 'secret_fingerprint', 'local_secret_permissions'],
  acceptanceCriteria: ['project_owned_by_mcf', 'no_billing_link', 'maps_key_restricted', 'secret_not_exposed'],
  failureModes: ['account_mismatch', 'terms_not_accepted', 'billing_gate', 'operation_unknown', 'key_restrictions_mismatch'],
  fallback: 'Parar e reconciliar estado remoto antes de repetir qualquer operação mutável.',
  handoffTo: 'Mestre',
};
function inputs(overrides: Record<string, unknown> = {}) {
  return {
    projectId,
    missionId,
    approvedProjectId: projectId,
    displayName: 'MCF Agente Logistica Obras V1',
    humanGateApproved: true,
    authorizedScope: true,
    sensitiveAuthorization: true,
    cloudAccountVerified: true,
    cloudTermsAccepted: true,
    ...overrides,
  };
}
function request(operation = 'create-project', inputOverrides: Record<string, unknown> = {}): ExternalActionRequest {
  return {
    skill,
    agentId: 'Mestre',
    inputs: inputs(inputOverrides),
    tool: { provider: 'mcf-google-bridge', operation, resource: 'google-cloud' },
  };
}
function evidence(): EvidenceValidator {
  return {
    createTrustedReceipt: vi.fn((input) => ({
      ...input,
      signature: 'test-signature',
      receiptId: trace,
      payloadDigest: 'test-digest',
    })),
  } as unknown as EvidenceValidator;
}
function bridgeResponse(operation: string, result: unknown): Response {
  return new Response(JSON.stringify({ trace_id: trace, operation, result }), { status: 200 });
}
function adapter(operation: string, result: unknown) {
  const transport = vi.fn(async (_input: string, _init?: RequestInit) => bridgeResponse(operation, result));
  const evidenceValidator = evidence();
  return {
    transport,
    evidenceValidator,
    adapter: new GoogleCloudProvisionAdapter(
      evidenceValidator,
      true,
      transport,
      async () => 'private-test-bearer',
    ),
  };
}

describe('Google Cloud provisioning MCF adapter', () => {
  it('matches only the dedicated skill, provider, resource and operations', () => {
    const { adapter: subject } = adapter('google.cloud.projects.create', {
      status: 'SUCCEEDED',
      projectId,
      projectNumber: '123456789',
      displayName: 'MCF Agente Logistica Obras V1',
      state: 'ACTIVE',
      billingEnabled: false,
      billingLinked: false,
    });
    expect(subject.supports(request())).toBe(true);
    expect(subject.supports(request('enable-maps-apis'))).toBe(true);
    expect(subject.supports(request('link-billing'))).toBe(false);
    expect(subject.supports({ ...request(), skill: { ...skill, skillId: 'MCF-GOOGLE-CLOUD-READ' } })).toBe(false);
    expect(subject.supports({ ...request(), tool: { ...request().tool, resource: 'other' } })).toBe(false);
  });

  it('fails closed when the runtime adapter is disabled', async () => {
    const { adapter: enabledAdapter, evidenceValidator, transport } = adapter('google.cloud.projects.create', {});
    const subject = new GoogleCloudProvisionAdapter(evidenceValidator, false, transport, async () => 'token');
    await expect(subject.execute(request())).rejects.toMatchObject({ code: 'UNSUPPORTED_TARGET' });
    expect(transport).not.toHaveBeenCalled();
    expect(enabledAdapter).toBeDefined();
  });

  it('requires exact project approval, verified account, accepted terms and scoped human authorization', async () => {
    const { adapter: subject, transport } = adapter('google.cloud.projects.create', {});
    await expect(subject.execute(request('create-project', { cloudAccountVerified: false }))).rejects.toMatchObject({
      code: 'INVALID_CONTEXT',
    });
    await expect(subject.execute(request('create-project', { cloudTermsAccepted: false }))).rejects.toMatchObject({
      code: 'INVALID_CONTEXT',
    });
    await expect(subject.execute(request('create-project', { approvedProjectId: 'mcf-other-project' }))).rejects.toMatchObject({
      code: 'INVALID_CONTEXT',
    });
    expect(transport).not.toHaveBeenCalled();
  });

  it('enforces PermissionEngine scope and blocks billing mutations', () => {
    const engine = new PermissionEngine();
    expect(() => engine.assertAllowed(skill, 'Mestre', request().tool, inputs())).not.toThrow();
    expect(() => engine.assertAllowed(skill, 'Mestre', request().tool, inputs({ approvedProjectId: 'mcf-other-project' }))).toThrow();
    expect(() => engine.assertAllowed(skill, 'Mestre', request().tool, inputs({ billingEnabled: true }))).toThrow();
    expect(() => engine.assertAllowed(skill, 'Mestre', request().tool, inputs({ cloudTermsAccepted: false }))).toThrow();
    expect(() => engine.assertAllowed(
      { ...skill, skillId: 'MCF-GOOGLE-CLOUD-READ' },
      'Mestre',
      request().tool,
      inputs(),
    )).toThrow();
  });

  it('creates a trusted receipt containing only safe project metadata', async () => {
    const { adapter: subject, transport, evidenceValidator } = adapter('google.cloud.projects.create', {
      status: 'SUCCEEDED',
      projectId,
      projectNumber: '123456789',
      displayName: 'MCF Agente Logistica Obras V1',
      state: 'ACTIVE',
      billingEnabled: false,
      billingLinked: false,
      reused: false,
      secret: 'must-not-be-forwarded',
    });
    const receipt = await subject.execute(request());
    expect(receipt).toMatchObject({
      provider: 'mcf-google-bridge',
      operation: 'create-project',
      status: 'SUCCEEDED',
      externalId: trace,
      metadata: {
        projectId,
        billingEnabled: false,
        billingLinked: false,
        projectNumber: '123456789',
        readOnly: false,
        billingMutationAllowed: false,
      },
    });
    expect(JSON.stringify(receipt)).not.toContain('must-not-be-forwarded');
    const [, options] = transport.mock.calls[0]!;
    expect(JSON.parse(String(options?.body))).toEqual({
      operation: 'google.cloud.projects.create',
      args: { projectId, missionId, displayName: 'MCF Agente Logistica Obras V1' },
    });
    expect(evidenceValidator.createTrustedReceipt).toHaveBeenCalledTimes(1);
  });

  it('turns ambiguous network outcomes into PARTIAL receipts for reconciliation, never blind retries', async () => {
    const transport = vi.fn(async () => {
      throw new Error('connection reset');
    });
    const evidenceValidator = evidence();
    const subject = new GoogleCloudProvisionAdapter(evidenceValidator, true, transport, async () => 'token');
    const receipt = await subject.execute(request());
    expect(receipt.status).toBe('PARTIAL');
    expect(receipt.metadata).toMatchObject({
      outcome: 'UNKNOWN',
      reconciliationRequired: true,
      reason: 'TRANSPORT_OUTCOME_UNKNOWN',
      projectId,
    });
  });

  it('rejects a successful-looking Maps key receipt without the exact API restrictions and secret fingerprint', async () => {
    const { adapter: subject } = adapter('google.cloud.apiKeys.createMaps', {
      status: 'SUCCEEDED',
      projectId,
      billingEnabled: false,
      billingLinked: false,
      projectNumber: '123456789',
      keyResourceName: 'projects/123456789/locations/global/keys/mcf-obras-maps-v1',
      keyId: 'mcf-obras-maps-v1',
      apiRestrictions: ['routes.googleapis.com'],
      secretAlias: 'agente-logistica-obras/google_maps_api_key',
      secretFingerprint: 'a'.repeat(64),
    });
    await expect(subject.execute(request('create-maps-key'))).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });
});
