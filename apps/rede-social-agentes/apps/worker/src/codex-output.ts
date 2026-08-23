import { z } from 'zod';

import { redactSensitiveText } from './command-runner.js';
import { parseCodexTaskResult, type CodexTaskResult } from './result-schema.js';

const eventSchema = z.object({ type: z.string() }).passthrough();

export interface CodexOutputLimits {
  readonly maximumLines?: number;
  readonly maximumLineBytes?: number;
  readonly maximumAgentMessageBytes?: number;
  readonly redactionSecrets?: readonly string[];
}

export interface ParsedCodexOutput {
  readonly threadId: string | null;
  readonly result: CodexTaskResult | null;
  readonly finalAgentMessage: string | null;
  readonly turnCompleted: boolean;
  readonly turnFailed: boolean;
  readonly invalidLineCount: number;
  readonly acceptedEventCount: number;
}

function boundedUtf8(value: string, maximumBytes: number): string {
  const buffer = Buffer.from(value);
  if (buffer.length <= maximumBytes) return value;
  return buffer.subarray(0, maximumBytes).toString('utf8');
}

function parseAgentResult(message: string): CodexTaskResult | null {
  try {
    return parseCodexTaskResult(JSON.parse(message) as unknown);
  } catch {
    return null;
  }
}

export function parseCodexJsonl(
  jsonl: string,
  limits: CodexOutputLimits = {},
): ParsedCodexOutput {
  const maximumLines = limits.maximumLines ?? 100_000;
  const maximumLineBytes = limits.maximumLineBytes ?? 1_024 * 1_024;
  const maximumAgentMessageBytes = limits.maximumAgentMessageBytes ?? 256 * 1_024;
  if (!Number.isSafeInteger(maximumLines) || maximumLines <= 0) {
    throw new Error('maximum lines must be a positive integer');
  }

  let threadId: string | null = null;
  let finalAgentMessage: string | null = null;
  let result: CodexTaskResult | null = null;
  let turnCompleted = false;
  let turnFailed = false;
  let invalidLineCount = 0;
  let acceptedEventCount = 0;

  const lines = jsonl.split(/\r?\n/u);
  for (let index = 0; index < lines.length && index < maximumLines; index += 1) {
    const line = lines[index];
    if (line === undefined || line.trim() === '') continue;
    if (Buffer.byteLength(line) > maximumLineBytes) {
      invalidLineCount += 1;
      continue;
    }

    let value: unknown;
    try {
      value = JSON.parse(line) as unknown;
    } catch {
      invalidLineCount += 1;
      continue;
    }
    const parsed = eventSchema.safeParse(value);
    if (!parsed.success) {
      invalidLineCount += 1;
      continue;
    }

    acceptedEventCount += 1;
    const event = parsed.data;
    if (event.type === 'thread.started' && typeof event.thread_id === 'string') {
      threadId = event.thread_id.slice(0, 256);
    } else if (event.type === 'turn.completed') {
      turnCompleted = true;
    } else if (event.type === 'turn.failed' || event.type === 'error') {
      turnFailed = true;
    } else if (event.type === 'item.completed' && typeof event.item === 'object' && event.item) {
      const item = event.item as Record<string, unknown>;
      if (item.type === 'agent_message' && typeof item.text === 'string') {
        const bounded = boundedUtf8(item.text, maximumAgentMessageBytes);
        finalAgentMessage = redactSensitiveText(bounded, limits.redactionSecrets);
        result = parseAgentResult(finalAgentMessage);
      }
    }
  }

  if (lines.length > maximumLines) {
    invalidLineCount += lines.length - maximumLines;
  }

  return {
    threadId,
    result,
    finalAgentMessage,
    turnCompleted,
    turnFailed,
    invalidLineCount,
    acceptedEventCount,
  };
}

