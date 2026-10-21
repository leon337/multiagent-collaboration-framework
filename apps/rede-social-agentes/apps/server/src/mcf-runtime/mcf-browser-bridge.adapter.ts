import { createHash, randomUUID } from 'node:crypto';
import { EvidenceValidator } from './evidence-validator.js';
import { execFile } from 'node:child_process';
import { isAbsolute, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { McfToolReceipt } from '@rsa/contracts';

import { PermissionEngine, canonicalizeProvider, canonicalizeToolValue } from './permission-engine.js';
import { ExternalActionAdapterError, type ExternalActionAdapter, type ExternalActionRequest } from './external-action.contracts.js';

// Repository-owned executable and schema; neither can be selected by action inputs.
const bridgeRoot = new URL('../../../../../mcf-browser-bridge/', import.meta.url);
const cli = fileURLToPath(new URL('scripts/agent-read-fixture.cjs', bridgeRoot));
const schemaUrl = new URL('extension/agent-contract.js', bridgeRoot).href;
export interface BrowserBridgeCandidateConfig {
  enabled: boolean;
  socketDir: string;
}
export interface CanonicalBinding { missionId: string; phaseId: string; actionId: string; missionVersion: number }
export interface BrowserBridgeRunner {
  run(socketDir: string, canonical: CanonicalBinding): Promise<string>;
}
function deny(code: 'INVALID_CONTEXT' | 'INVALID_RESPONSE' | 'UNSUPPORTED_TARGET', message: string): never {
  throw new ExternalActionAdapterError(code, message, false);
}
export class NodeBrowserBridgeRunner implements BrowserBridgeRunner {
  async run(socketDir: string, canonical: CanonicalBinding): Promise<string> {
    return new Promise((resolve, reject) => {
      execFile(process.execPath, [cli, socketDir, '--canonical-action-id', canonical.actionId, '--canonical-mission', canonical.missionId, '--canonical-phase', canonical.phaseId, '--mission-version', String(canonical.missionVersion)], {
        timeout: 5000, killSignal: 'SIGKILL', maxBuffer: 16_384,
        encoding: 'utf8', shell: false,
        // No inherited NODE_OPTIONS, credentials, or alternative CLI configuration.
        env: {},
      }, (error, stdout) => {
        if (error) {
          reject(new ExternalActionAdapterError(
            error.killed ? 'ADAPTER_TIMEOUT' : 'ADAPTER_FAILURE',
            'Local fixture read denied; no retry', false,
          ));
        } else resolve(stdout);
      });
    });
  }
}

/** Local synthetic fixture only; disabled by default. */
export class McfBrowserBridgeAdapter implements ExternalActionAdapter {
  readonly adapterId = 'mcf-browser-bridge-fixture-candidate-v2';
  constructor(
    private readonly config: BrowserBridgeCandidateConfig = { enabled: false, socketDir: '' },
    private readonly runner: BrowserBridgeRunner = new NodeBrowserBridgeRunner(),
    private readonly evidence: EvidenceValidator = new EvidenceValidator(),
  ) {}

  supports(request: ExternalActionRequest): boolean {
    return this.config.enabled === true && request.skill.skillId === 'MCF-WEB-INTERACT' &&
      canonicalizeProvider(request.tool.provider) === 'mcf-browser-bridge' &&
      canonicalizeToolValue(request.tool.operation) === 'read-local-fixture' &&
      canonicalizeToolValue(request.tool.resource) === 'mcf-synthetic-fixture' &&
      ['Mestre', 'Rafael'].includes(request.agentId) && request.skill.ownerAgents.includes(request.agentId);
  }

  async execute(request: ExternalActionRequest): Promise<McfToolReceipt> {
    if (!this.supports(request)) deny('UNSUPPORTED_TARGET', 'Experimental fixture adapter disabled or outside boundary');
    new PermissionEngine().assertAllowed(request.skill, request.agentId, request.tool, request.inputs);
    const context = request.context;
    if (!context || context.missionId !== 'MCF-BROWSER-BRIDGE-001' || context.phaseId !== 'PHASE-04' ||
        !Number.isSafeInteger(context.expectedMissionVersion) || context.expectedMissionVersion < 0) {
      deny('INVALID_CONTEXT', 'Canonical Phase04 mission context required');
    }
    if (request.skill.permissionProfile !== 'SCOPED_WRITE' || request.inputs.authorizedScope !== true ||
        request.inputs.target_url !== 'file:///[LOCAL_FIXTURE]' ||
        request.inputs.interaction_goal !== 'read-local-fixture' ||
        Object.keys(request.inputs).some(key => !['authorizedScope', 'target_url', 'interaction_goal'].includes(key))) {
      deny('INVALID_CONTEXT', 'Only the explicit synthetic fixture read scope is permitted');
    }
    const dir = this.config.socketDir;
    if (!isAbsolute(dir) || normalize(dir) !== dir || dir === '/' || Buffer.byteLength(dir) > 70) {
      deny('INVALID_CONTEXT', 'Private same-host socket directory required');
    }
    // CLI enforces same UID, private directory, socket mode, capability expiry and host opt-in.
    const canonical: CanonicalBinding = { missionId: context.missionId, phaseId: context.phaseId, missionVersion: context.expectedMissionVersion, actionId: randomUUID() };
    let stdout: string;
    try { stdout = await this.runner.run(dir, { ...canonical }); }
    catch (error) {
      if (error instanceof ExternalActionAdapterError) throw error;
      throw new ExternalActionAdapterError('ADAPTER_FAILURE', 'Local fixture read denied; no retry', false);
    }
    if (Buffer.byteLength(stdout) > 16_384) deny('INVALID_RESPONSE', 'Fixture summary exceeds bound');
    let envelope: any;
    try { envelope = JSON.parse(stdout); }
    catch { deny('INVALID_RESPONSE', 'Malformed fixture envelope'); }
    const { validSummary, exact, sameCanonical, canonicalConsentRef } = await import(schemaUrl) as {
      validSummary(value: unknown): boolean; exact(value: unknown, keys: string[]): boolean;
      sameCanonical(a: unknown, b: unknown): boolean; canonicalConsentRef(value: unknown): boolean;
    };
    if (!exact(envelope, ['protocolVersion','actionId','status','summary','canonical','consentRef','expiresAt','target']) ||
        envelope.protocolVersion !== 2 || envelope.status !== 'VALIDATED' || envelope.actionId !== canonical.actionId ||
        !sameCanonical(envelope.canonical, canonical) || !validSummary(envelope.summary) ||
        !canonicalConsentRef(envelope.consentRef) || !Number.isSafeInteger(envelope.expiresAt) ||
        envelope.expiresAt <= Date.now() || envelope.expiresAt > Date.now() + 5000 ||
        envelope.target !== 'file:///[LOCAL_FIXTURE]') deny('INVALID_RESPONSE', 'Invalid canonical fixture provenance');
    const summaryDigest = createHash('sha256').update(JSON.stringify(envelope.summary)).digest('hex');
    return this.evidence.createTrustedReceipt({
      provider: request.tool.provider, operation: request.tool.operation, resource: request.tool.resource,
      externalId: canonical.actionId, commitSha: summaryDigest, status: 'SUCCEEDED', observedAt: new Date().toISOString(),
      metadata: { ...canonical, consentRef: envelope.consentRef, expiresAt: envelope.expiresAt,
        origin: 'file://', title: envelope.summary.title, summaryDigest, untrusted: true },
    });
  }
}
