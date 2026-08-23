import { Module } from '@nestjs/common';

import {
  MCF_CONTEXT_READ_TOKEN,
  McfContextReadTokenGuard,
} from './mcf-context-read-token.guard.js';
import { McfCapabilityRegistryApiService } from './mcf-capability-registry-api.service.js';
import { McfCapabilityRegistryController } from './mcf-capability-registry.controller.js';
import { McfContextRecoveryApiService } from './mcf-context-recovery-api.service.js';
import { McfContextRecoveryController } from './mcf-context-recovery.controller.js';
import { McfLedgerReadApiService } from './mcf-ledger-read-api.service.js';
import { McfLedgerReadController } from './mcf-ledger-read.controller.js';

@Module({
  controllers: [
    McfCapabilityRegistryController,
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
      provide: McfLedgerReadApiService,
      useFactory: () => McfLedgerReadApiService.fromEnvironment(process.env),
    },
    {
      provide: MCF_CONTEXT_READ_TOKEN,
      useFactory: () => process.env.MCF_CONTEXT_READ_TOKEN ?? '',
    },
    McfContextReadTokenGuard,
  ],
  exports: [McfCapabilityRegistryApiService, McfContextRecoveryApiService, McfLedgerReadApiService],
})
export class McfContextModule {}
