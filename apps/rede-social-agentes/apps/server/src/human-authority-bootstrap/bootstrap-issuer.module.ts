import { Module } from '@nestjs/common';

import { PasswordService } from '../identity/password.service.js';
import { SessionTokenService } from '../identity/session-token.service.js';
import { loadBootstrapConfig } from './bootstrap-config.js';
import { BOOTSTRAP_DATABASE_URL, BootstrapDatabaseService } from './bootstrap-database.service.js';
import { BootstrapHealthController } from './bootstrap-health.controller.js';
import { BootstrapGithubOidcGuard, BootstrapGithubOidcVerifier } from './github-oidc.guard.js';
import { BootstrapSessionAuthGuard } from './bootstrap-session-auth.guard.js';
import { HumanAuthorityBootstrapControlPlaneController } from './human-authority-bootstrap.control-plane.controller.js';
import { InitialHumanBootstrapController } from './initial-human-bootstrap.controller.js';
import { InitialHumanBootstrapService } from './initial-human-bootstrap.service.js';
import { PostgresInitialHumanBootstrapRepository } from './postgres-initial-human-bootstrap.repository.js';
import { HumanAuthorityBootstrapController } from './human-authority-bootstrap.controller.js';
import { HumanAuthorityBindingSealer } from './human-authority-bootstrap.sealer.js';
import { HumanAuthorityBootstrapService } from './human-authority-bootstrap.service.js';
import { HumanAuthorityRuntimeVerifier } from './human-authority-runtime-verifier.js';
import { PostgresHumanAuthorityBootstrapRepository } from './postgres-human-authority-bootstrap.repository.js';

@Module({
  controllers: [
    BootstrapHealthController,
    HumanAuthorityBootstrapController,
    HumanAuthorityBootstrapControlPlaneController,
    InitialHumanBootstrapController,
  ],
  providers: [
    {
      provide: BOOTSTRAP_DATABASE_URL,
      useFactory: () => loadBootstrapConfig().DATABASE_URL,
    },
    BootstrapDatabaseService,
    PasswordService,
    SessionTokenService,
    PostgresInitialHumanBootstrapRepository,
    BootstrapSessionAuthGuard,
    BootstrapGithubOidcVerifier,
    BootstrapGithubOidcGuard,
    PostgresHumanAuthorityBootstrapRepository,
    {
      provide: InitialHumanBootstrapService,
      useFactory: (
        repository: PostgresInitialHumanBootstrapRepository,
        passwords: PasswordService,
        tokens: SessionTokenService,
      ) => {
        const config = loadBootstrapConfig();
        return new InitialHumanBootstrapService(
          repository,
          passwords,
          tokens,
          config.BOOTSTRAP_INITIAL_HUMAN_EMAIL,
          config.BOOTSTRAP_INITIAL_REGISTRATION_TOKEN,
        );
      },
      inject: [PostgresInitialHumanBootstrapRepository, PasswordService, SessionTokenService],
    },
    {
      provide: HumanAuthorityRuntimeVerifier,
      useFactory: () => {
        const config = loadBootstrapConfig();
        return new HumanAuthorityRuntimeVerifier(
          config.BOOTSTRAP_RUNTIME_BASE_URL,
          config.BOOTSTRAP_EXPECTED_RUNTIME_SHA,
        );
      },
    },
    {
      provide: HumanAuthorityBootstrapService,
      useFactory: (repository: PostgresHumanAuthorityBootstrapRepository) => {
        const config = loadBootstrapConfig();
        const sealer = new HumanAuthorityBindingSealer(config.BOOTSTRAP_SEAL_PUBLIC_JWK);
        return new HumanAuthorityBootstrapService(
          repository,
          (payload) => sealer.seal(payload),
          config.BOOTSTRAP_SUBJECT_PEPPER,
          config.BOOTSTRAP_INTENT_TTL_SECONDS * 1000,
          config.BOOTSTRAP_CLAIM_LEASE_SECONDS * 1000,
        );
      },
      inject: [PostgresHumanAuthorityBootstrapRepository],
    },
  ],
})
export class BootstrapIssuerModule {}
