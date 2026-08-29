import 'reflect-metadata';

import { z } from 'zod';

import { requestGithubActionsOidcToken } from './human-authority-bootstrap/github-actions-oidc.js';
import { runHumanAuthorityBootstrapControlPlane } from './human-authority-bootstrap/human-authority-bootstrap.control-plane.js';

const environmentSchema = z.object({
  ACTIONS_ID_TOKEN_REQUEST_URL: z.string().url(),
  ACTIONS_ID_TOKEN_REQUEST_TOKEN: z.string().min(10),
  BOOTSTRAP_OIDC_AUDIENCE: z.string().min(3),
  BOOTSTRAP_ISSUER_URL: z.string().url(),
  BOOTSTRAP_INTENT_REF: z.string().uuid(),
  BOOTSTRAP_SEAL_PRIVATE_JWK: z.string().min(20),
  RENDER_API_KEY: z.string().min(10),
  RENDER_STAGING_SERVICE_ID: z.string().min(3),
});

async function main(): Promise<void> {
  const environment = environmentSchema.parse(process.env);
  const oidcToken = await requestGithubActionsOidcToken(
    environment.ACTIONS_ID_TOKEN_REQUEST_URL,
    environment.ACTIONS_ID_TOKEN_REQUEST_TOKEN,
    environment.BOOTSTRAP_OIDC_AUDIENCE,
  );
  const result = await runHumanAuthorityBootstrapControlPlane({
    issuerBaseUrl: environment.BOOTSTRAP_ISSUER_URL,
    oidcToken,
    intentRef: environment.BOOTSTRAP_INTENT_REF,
    privateJwkJson: environment.BOOTSTRAP_SEAL_PRIVATE_JWK,
    renderServiceId: environment.RENDER_STAGING_SERVICE_ID,
    renderApiKey: environment.RENDER_API_KEY,
  });

  console.info(
    JSON.stringify({
      event: 'human_authority_bootstrap_control_plane_completed',
      intentRef: result.intentRef,
      target: result.target,
      outcome: result.outcome,
      mutated: result.mutated,
      receiptDigest: result.receiptDigest,
      identityDisclosed: false,
    }),
  );
}

void main().catch((error: unknown) => {
  console.error(
    JSON.stringify({
      event: 'human_authority_bootstrap_control_plane_failed',
      error: error instanceof Error ? error.message : 'unknown_error',
      identityDisclosed: false,
    }),
  );
  process.exitCode = 1;
});
