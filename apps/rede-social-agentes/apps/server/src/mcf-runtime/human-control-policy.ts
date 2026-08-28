export const HUMAN_CONTROL_COMMAND = 'HUMANO NO CONTROLE';

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/gu, ' ');
}

export function normalizeHumanControlCommand(value: string): string {
  return normalizeWhitespace(value).toLocaleUpperCase('pt-BR');
}

export function isHumanControlCommand(actorId: string, message: string): boolean {
  return (
    actorId.trim().toLocaleLowerCase('pt-BR') === 'leandro' &&
    normalizeHumanControlCommand(message) === HUMAN_CONTROL_COMMAND
  );
}

export function isReservedHumanControlCommand(
  authenticatedAccountId: string,
  reservedHumanAuthorityAccountId: string | undefined,
  message: string,
): boolean {
  return (
    Boolean(reservedHumanAuthorityAccountId) &&
    authenticatedAccountId === reservedHumanAuthorityAccountId &&
    normalizeHumanControlCommand(message) === HUMAN_CONTROL_COMMAND
  );
}

export interface HumanControlCheckpointInput {
  lastCompletedAction: string | null;
  actionInFlight: string | null;
  preservedState: Record<string, unknown>;
  evidence: string[];
  surface: string | null;
  automationChannel: string | null;
}

export interface HumanControlCheckpoint extends HumanControlCheckpointInput {
  gate: 'HUMAN_CONTROL';
  executionPaused: true;
  nextAction: 'HUMAN_GATE';
  resumeRequiresExplicitHumanInstruction: true;
}

export function buildHumanControlCheckpoint(
  input: HumanControlCheckpointInput,
): HumanControlCheckpoint {
  return {
    gate: 'HUMAN_CONTROL',
    executionPaused: true,
    ...input,
    nextAction: 'HUMAN_GATE',
    resumeRequiresExplicitHumanInstruction: true,
  };
}
