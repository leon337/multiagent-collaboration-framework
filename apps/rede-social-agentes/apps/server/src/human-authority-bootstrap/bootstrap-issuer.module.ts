import { Module } from '@nestjs/common';

import { SessionTokenService } from '../identity/session-token.service.js';
import { loadBootstrapConfig } from './bootstrap-config.js';
import { BOOTSTRAP_DATABASE_URL, BootstrapDatabaseService } from './bootstrap-database.service.js';
import { BootstrapHealthController } from './bootstrap-health.controller.js';
import { BootstrapGithubOidcGuard, BootstrapGithubOidcVerifier } from './github-oidc.guard.js';
import { BootstrapSessionAuthGuard } from './bootstrap-session-auth.guard.js';
import { HumanAuthorityBootstrapControlPlaneController } from './human-authority-bootstrap.control-plane.controller.js';
import { HumanAuthorityBootstrapController } from './human-authority-bootstrap.controller.js';
import { HumanAuthorityBindingSealer } from './human-authority-bootstrap.sealer.js';
import { HumanAuthorityBootstrapService } from './human-authority-bootstrap.service.js';
import { PostgresHumanAuthorityBootstrapRepository } from './postgres-human-authority-bootstrap.repository.js';

@Module({
  controllers: [
    BootstrapHealthController,
    HumanAuthorityBootstrapController,
    HumanAuthorityBootstrapControlPlaneController,
  ],
  providers: [
    {
      provide: BOOTSTRAP_DATABASE_URL,
      useFactory: () => loadBootstrapConfig().DATABASE_URL,
    },
    BootstrapDatabaseService,
    SessionTokenService,
    BootstrapSessionAuthGuard,
    BootstrapGithubOidcVerifier,
    BootstrapGithubOidcGuard,
    PostgresHumanAuthorityBootstrapRepository,
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
