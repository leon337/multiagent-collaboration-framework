import { Module } from '@nestjs/common';

import {
  MCF_CONTEXT_READ_TOKEN,
  McfContextReadTokenGuard,
} from './mcf-context-read-token.guard.js';
import {
  loadMcfCloudContextIngressToken,
  MCF_CLOUD_CONTEXT_INGRESS_TOKEN,
  McfCloudContextIngressTokenGuard,
} from './mcf-cloud-context-ingress-token.guard.js';
import { McfCloudContextReadController } from './mcf-cloud-context-read.controller.js';
import { McfCloudContextReadService } from './mcf-cloud-context-read.service.js';
import { McfCapabilityRegistryApiService } from './mcf-capability-registry-api.service.js';
import { McfCapabilityRegistryController } from './mcf-capability-registry.controller.js';
import { McfContextRecoveryApiService } from './mcf-context-recovery-api.service.js';
import { McfContextRecoveryController } from './mcf-context-recovery.controller.js';
import {
  loadMcfLedgerReadConfiguration,
  McfLedgerReadApiService,
} from './mcf-ledger-read-api.service.js';
import { McfLedgerReadController } from './mcf-ledger-read.controller.js';
import {
  loadMcfLedgerReadIngressToken,
  MCF_LEDGER_READ_INGRESS_TOKEN,
  McfLedgerReadTokenGuard,
} from './mcf-ledger-read-token.guard.js';

@Module({
  controllers: [
    McfCapabilityRegistryController,
    McfCloudContextReadController,
    McfContextRecoveryController,
    McfLedgerReadController,
  ],
  providers: [
    {
      provide: McfCapabilityRegistryApiService,
      useFactory: () => McfCapabilityRegistryApiService.fromEnvironment(process.env),
    },
    {
      provide: McfContextRecoveryApiService,
      useFactory: () => McfContextRecoveryApiService.fromEnvironment(process.env),
    },
    {
      provide: McfCloudContextReadService,
      useFactory: () => McfCloudContextReadService.fromEnvironment(process.env),
    },
    {
      provide: McfLedgerReadApiService,
      useFactory: () => McfLedgerReadApiService.fromEnvironment(process.env),
    },
    {
      provide: MCF_LEDGER_READ_INGRESS_TOKEN,
      useFactory: () =>
        loadMcfLedgerReadConfiguration(process.env) === null
          ? null
          : loadMcfLedgerReadIngressToken(process.env),
    },
    {
      provide: MCF_CONTEXT_READ_TOKEN,
      useFactory: () => process.env.MCF_CONTEXT_READ_TOKEN ?? '',
    },
    {
      provide: MCF_CLOUD_CONTEXT_INGRESS_TOKEN,
      useFactory: () => loadMcfCloudContextIngressToken(process.env),
    },
    McfCloudContextIngressTokenGuard,
    McfContextReadTokenGuard,
    McfLedgerReadTokenGuard,
  ],
  exports: [McfCapabilityRegistryApiService, McfContextRecoveryApiService, McfLedgerReadApiService],
})
export class McfContextModule {}
