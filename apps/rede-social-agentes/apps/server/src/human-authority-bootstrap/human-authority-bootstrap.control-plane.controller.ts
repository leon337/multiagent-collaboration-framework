import { Body, Controller, HttpCode, Inject, Param, Post, Req, UseGuards } from '@nestjs/common';
import { z } from 'zod';

import { parseBody } from '../http/parse-body.js';
import {
  BootstrapGithubOidcGuard,
  type BootstrapControlPlaneRequest,
} from './github-oidc.guard.js';
import { HumanAuthorityBootstrapService } from './human-authority-bootstrap.service.js';

const intentRefSchema = z.string().uuid();
const verifySchema = z
  .object({
    claimRef: z.string().uuid(),
    providerMutationDigest: z.string().regex(/^[a-f0-9]{64}$/u),
  })
  .strict();
const resultSchema = z
  .object({
    claimRef: z.string().uuid(),
    outcome: z.enum(['BOUND', 'CONFLICT', 'FAILED']),
    receiptDigest: z.string().regex(/^[a-f0-9]{64}$/u),
  })
  .strict();

@Controller('v1/bootstrap/human-authority/intents')
@UseGuards(BootstrapGithubOidcGuard)
export class HumanAuthorityBootstrapControlPlaneController {
  constructor(
    @Inject(HumanAuthorityBootstrapService)
    private readonly service: HumanAuthorityBootstrapService,
  ) {}

  @Post(':intentRef/claim')
  @HttpCode(200)
  async claim(
    @Param('intentRef') rawIntentRef: string,
    @Req() request: BootstrapControlPlaneRequest,
  ) {
    const intentRef = intentRefSchema.parse(rawIntentRef);
    return this.service.claimIntent(intentRef, request.bootstrapControlPlane.principalFingerprint);
  }

  @Post(':intentRef/verifying')
  @HttpCode(200)
  async verifying(
    @Param('intentRef') rawIntentRef: string,
    @Body() body: unknown,
    @Req() request: BootstrapControlPlaneRequest,
  ) {
    const intentRef = intentRefSchema.parse(rawIntentRef);
    const parsed = parseBody(verifySchema, body, request.id);
    await this.service.markVerifying(intentRef, parsed.claimRef, parsed.providerMutationDigest);
    return { intentRef, state: 'VERIFYING', identityDisclosed: false };
  }

  @Post(':intentRef/result')
  @HttpCode(200)
  async result(
    @Param('intentRef') rawIntentRef: string,
    @Body() body: unknown,
    @Req() request: BootstrapControlPlaneRequest,
  ) {
    const intentRef = intentRefSchema.parse(rawIntentRef);
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
