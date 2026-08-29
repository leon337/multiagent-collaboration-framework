import { Body, Controller, HttpCode, Inject, Param, Post, Req, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { parseBody } from '../http/parse-body.js';
import {
  BootstrapGithubOidcGuard,
  type BootstrapControlPlaneRequest,
} from './github-oidc.guard.js';
import { HumanAuthorityBootstrapService } from './human-authority-bootstrap.service.js';
import { HumanAuthorityRuntimeVerifier } from './human-authority-runtime-verifier.js';

const intentRefSchema = z.string().uuid();
const claimDigestSchema = z
  .object({
    claimRef: z.string().uuid(),
    providerMutationDigest: z.string().regex(/^[a-f0-9]{64}$/u),
  })
  .strict();
const claimOnlySchema = z.object({ claimRef: z.string().uuid() }).strict();
const reconciliationSchema = z
  .object({
    claimRef: z.string().uuid(),
    reconciliationDigest: z.string().regex(/^[a-f0-9]{64}$/u),
    reason: z.enum(['PROVIDER_ATOMIC_CREATE_UNAVAILABLE', 'PROVIDER_STATE_DRIFT']),
  })
  .strict();
const resultSchema = z
  .object({
    outcome: z.enum(['CONFLICT', 'FAILED']),
    claimRef: z.string().uuid(),
    receiptDigest: z.string().regex(/^[a-f0-9]{64}$/u),
  })
  .strict();

@Controller('v1/bootstrap/human-authority/intents')
@UseGuards(BootstrapGithubOidcGuard)
export class HumanAuthorityBootstrapControlPlaneController {
  constructor(
    @Inject(HumanAuthorityBootstrapService)
    private readonly service: HumanAuthorityBootstrapService,
    @Inject(HumanAuthorityRuntimeVerifier)
    private readonly runtimeVerifier: HumanAuthorityRuntimeVerifier,
  ) {}

  @Post(':intentRef/claim')
  @HttpCode(200)
  async claim(@Param('intentRef') raw: string, @Req() request: BootstrapControlPlaneRequest) {
    return this.service.claimIntent(
      intentRefSchema.parse(raw),
      request.bootstrapControlPlane.principalFingerprint,
    );
  }

  @Post(':intentRef/provider-applied')
  @HttpCode(200)
  async providerApplied(
    @Param('intentRef') raw: string,
    @Body() body: unknown,
    @Req() request: BootstrapControlPlaneRequest,
  ) {
    const intentRef = intentRefSchema.parse(raw);
    const parsed = parseBody(claimDigestSchema, body, request.id);
    await this.service.markProviderApplied(
      intentRef,
      parsed.claimRef,
      parsed.providerMutationDigest,
    );
    return { intentRef, state: 'PROVIDER_APPLIED', identityDisclosed: false };
  }

  @Post(':intentRef/reconciliation-required')
  @HttpCode(200)
  async reconciliationRequired(
    @Param('intentRef') raw: string,
    @Body() body: unknown,
    @Req() request: BootstrapControlPlaneRequest,
  ) {
    const intentRef = intentRefSchema.parse(raw);
    const parsed = parseBody(reconciliationSchema, body, request.id);
    await this.service.markReconciliationRequired(
      intentRef,
      parsed.claimRef,
      parsed.reconciliationDigest,
      parsed.reason,
    );
    return { intentRef, state: 'RECONCILIATION_REQUIRED', identityDisclosed: false };
  }

  @Post(':intentRef/verifying')
  @HttpCode(200)
  async verifying(
    @Param('intentRef') raw: string,
    @Body() body: unknown,
    @Req() request: BootstrapControlPlaneRequest,
  ) {
    const intentRef = intentRefSchema.parse(raw);
    const parsed = parseBody(claimOnlySchema, body, request.id);
    await this.service.markVerifying(intentRef, parsed.claimRef);
    return { intentRef, state: 'VERIFYING', identityDisclosed: false };
  }

  @Post(':intentRef/runtime-verified')
  @HttpCode(200)
  async runtimeVerified(
    @Param('intentRef') raw: string,
    @Body() body: unknown,
    @Req() request: BootstrapControlPlaneRequest,
  ) {
    const intentRef = intentRefSchema.parse(raw);
    const parsed = parseBody(claimOnlySchema, body, request.id);
    const evidence = await this.runtimeVerifier.verify();
    await this.service.markRuntimeVerified(
      intentRef,
      parsed.claimRef,
      evidence.runtimeEvidenceDigest,
    );
    return {
      intentRef,
      state: 'RUNTIME_VERIFIED',
      runtimeEvidenceDigest: evidence.runtimeEvidenceDigest,
      identityDisclosed: false,
    };
  }

  @Post(':intentRef/result')
  @HttpCode(200)
  async result(
    @Param('intentRef') raw: string,
    @Body() body: unknown,
    @Req() request: BootstrapControlPlaneRequest,
  ) {
    const intentRef = intentRefSchema.parse(raw);
    const parsed = parseBody(resultSchema, body, request.id);
    await this.service.finalizeIntent(
      intentRef,
      parsed.claimRef,
      parsed.outcome,
      parsed.receiptDigest,
    );
    return { intentRef, state: parsed.outcome, identityDisclosed: false };
  }
}
