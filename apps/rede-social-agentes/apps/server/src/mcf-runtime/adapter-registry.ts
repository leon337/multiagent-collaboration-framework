import { Injectable } from '@nestjs/common';

import type { ExternalActionAdapter, ExternalActionRequest } from './external-action.contracts.js';

@Injectable()
export class AdapterRegistry {
  constructor(private readonly adapters: readonly ExternalActionAdapter[] = []) {}

  resolve(request: ExternalActionRequest): ExternalActionAdapter | null {
    const matches = this.adapters.filter((adapter) => adapter.supports(request));
    if (matches.length > 1) {
      throw new Error(
        `Multiple external action adapters matched ${request.skill.skillId}/${request.tool.provider}/${request.tool.operation}`,
      );
    }
    return matches[0] ?? null;
  }

  listAdapterIds(): string[] {
    return this.adapters.map((adapter) => adapter.adapterId).sort();
  }
}
