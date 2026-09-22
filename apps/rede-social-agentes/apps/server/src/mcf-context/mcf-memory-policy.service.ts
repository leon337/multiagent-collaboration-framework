export type McfMemoryPolicyOperation = 'propagate' | 'write' | 'supersede';

export interface McfMemoryPolicyRule {
  operation: McfMemoryPolicyOperation;
  sourceScope: string;
  targetScope: string;
  effect: 'allow' | 'deny';
}

export interface McfMemoryPolicyConfiguration {
  version: string;
  rules: readonly McfMemoryPolicyRule[];
}

export interface McfMemoryPolicyDecision {
  allowed: boolean;
  policyVersion: string;
  reason: 'EXPLICIT_ALLOW_RULE' | 'EXPLICIT_DENY_RULE' | 'NO_EXPLICIT_ALLOW_RULE';
}

function validAtom(value: string): boolean {
  return value.length > 0 && value.length <= 512 && value === value.trim() && !value.includes('*');
}

export class McfMemoryPolicyService {
  private readonly version: string;
  private readonly rules: readonly McfMemoryPolicyRule[];

  constructor(configuration: McfMemoryPolicyConfiguration) {
    if (!validAtom(configuration.version)) {
      throw new Error('Invalid memory policy version.');
    }
    for (const rule of configuration.rules) {
      if (
        !validAtom(rule.sourceScope) ||
        !validAtom(rule.targetScope) ||
        !['propagate', 'write', 'supersede'].includes(rule.operation) ||
        !['allow', 'deny'].includes(rule.effect)
      ) {
        throw new Error('Invalid memory policy rule.');
      }
    }
    this.version = configuration.version;
    this.rules = configuration.rules.map((rule) => ({ ...rule }));
  }

  evaluate(input: {
    operation: string;
    sourceScope: string;
    targetScope: string;
  }): McfMemoryPolicyDecision {
    const exact = this.rules.filter(
      (rule) =>
        rule.operation === input.operation &&
        rule.sourceScope === input.sourceScope &&
        rule.targetScope === input.targetScope,
    );
    if (exact.some((rule) => rule.effect === 'deny')) {
      return {
        allowed: false,
        policyVersion: this.version,
        reason: 'EXPLICIT_DENY_RULE',
      };
    }
    if (exact.some((rule) => rule.effect === 'allow')) {
      return {
        allowed: true,
        policyVersion: this.version,
        reason: 'EXPLICIT_ALLOW_RULE',
      };
    }
    return {
      allowed: false,
      policyVersion: this.version,
      reason: 'NO_EXPLICIT_ALLOW_RULE',
    };
  }
}
