import { OperationError } from './execution.js';

export type BrowserActionRisk = 'READ' | 'WRITE' | 'DESTRUCTIVE';

export type BrowserAction =
  | { type: 'navigate'; url: string }
  | { type: 'click'; selector: string }
  | { type: 'fill'; selector: string; value: string }
  | { type: 'select'; selector: string; value: string }
  | { type: 'press'; selector: string; key: string };

export type SanitizedBrowserAction =
  | { type: 'navigate'; risk: 'READ'; url: string }
  | { type: 'click'; risk: 'WRITE'; selector: string }
  | { type: 'fill'; risk: 'WRITE'; selector: string; value: '[REDACTED]' }
  | { type: 'select'; risk: 'WRITE'; selector: string; value: '[REDACTED]' }
  | { type: 'press'; risk: 'WRITE'; selector: string; key: string };

export interface BrowserActionPolicy {
  assertAllowed(action: BrowserAction): void;
}

export function classifyBrowserAction(action: BrowserAction): BrowserActionRisk {
  return action.type === 'navigate' ? 'READ' : 'WRITE';
}

export class ReadOnlyBrowserActionPolicy implements BrowserActionPolicy {
  assertAllowed(action: BrowserAction): void {
    const risk = classifyBrowserAction(action);
    if (risk !== 'READ') {
      throw new OperationError(
        'ACTION_POLICY_DENIED',
        `browser action ${action.type} is classified as ${risk} and is denied by the read-only policy`,
      );
    }
  }
}

export class AllowWriteBrowserActionPolicy implements BrowserActionPolicy {
  assertAllowed(action: BrowserAction): void {
    const risk = classifyBrowserAction(action);
    if (risk === 'DESTRUCTIVE') {
      throw new OperationError(
        'ACTION_POLICY_DENIED',
        `browser action ${action.type} is classified as DESTRUCTIVE and requires a separate governed boundary`,
      );
    }
  }
}

export function createDefaultBrowserActionPolicy(
  env: NodeJS.ProcessEnv = process.env,
): BrowserActionPolicy {
  return env.WEBAGENT_BROWSER_ACTION_MODE?.trim().toLowerCase() === 'allow-writes'
    ? new AllowWriteBrowserActionPolicy()
    : new ReadOnlyBrowserActionPolicy();
}

export function sanitizeBrowserAction(action: BrowserAction): SanitizedBrowserAction {
  switch (action.type) {
    case 'navigate':
      return { type: 'navigate', risk: 'READ', url: action.url };
    case 'click':
      return { type: 'click', risk: 'WRITE', selector: action.selector };
    case 'fill':
      return { type: 'fill', risk: 'WRITE', selector: action.selector, value: '[REDACTED]' };
    case 'select':
      return { type: 'select', risk: 'WRITE', selector: action.selector, value: '[REDACTED]' };
    case 'press':
      return { type: 'press', risk: 'WRITE', selector: action.selector, key: action.key };
  }
}

function validateAbsoluteHttpUrl(raw: string): void {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new OperationError('INVALID_URL', 'navigate action url must be an absolute HTTP or HTTPS URL');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new OperationError('INVALID_URL', 'navigate action only supports HTTP or HTTPS URLs');
  }
  if (url.username || url.password) {
    throw new OperationError('INVALID_URL', 'embedded URL credentials are not allowed');
  }
}

function validateSelector(selector: string): void {
  const normalized = selector.trim();
  if (!normalized || normalized.length > 1_000) {
    throw new OperationError('INVALID_ARGUMENT', 'action selector must contain between 1 and 1000 characters');
  }
}

export function validateBrowserActions(
  actions: BrowserAction[] | undefined,
  maxSteps: number,
): BrowserAction[] {
  const plan = actions ?? [];
  if (plan.length > 100) {
    throw new OperationError('INVALID_ARGUMENT', 'browser action plan cannot contain more than 100 actions');
  }
  if (1 + plan.length > maxSteps) {
    throw new OperationError(
      'STEP_BUDGET_EXCEEDED',
      `browser run requires ${1 + plan.length} steps but maxSteps is ${maxSteps}`,
    );
  }

  for (const action of plan) {
    switch (action.type) {
      case 'navigate':
        validateAbsoluteHttpUrl(action.url);
        break;
      case 'click':
        validateSelector(action.selector);
        break;
      case 'fill':
        validateSelector(action.selector);
        if (action.value.length > 10_000) {
          throw new OperationError('INVALID_ARGUMENT', 'fill value cannot exceed 10000 characters');
        }
        break;
      case 'select':
        validateSelector(action.selector);
        if (!action.value || action.value.length > 2_000) {
          throw new OperationError('INVALID_ARGUMENT', 'select value must contain between 1 and 2000 characters');
        }
        break;
      case 'press':
        validateSelector(action.selector);
        if (!action.key || action.key.length > 100) {
          throw new OperationError('INVALID_ARGUMENT', 'press key must contain between 1 and 100 characters');
        }
        break;
    }
  }

  return structuredClone(plan);
}
