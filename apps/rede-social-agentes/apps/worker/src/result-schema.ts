import { z } from 'zod';

import { normalizeRelativeWorkspacePath } from './policy.js';

const boundedText = (maximum: number) => z.string().min(1).max(maximum);

const changedFileSchema = z
  .string()
  .min(1)
  .max(1_024)
  .transform((value, context) => {
    try {
      return normalizeRelativeWorkspacePath(value);
    } catch {
      context.addIssue({ code: 'custom', message: 'changed file must be a safe relative path' });
      return z.NEVER;
    }
  });

export const codexTaskResultSchema = z
  .object({
    schemaVersion: z.literal('1.0'),
    status: z.enum(['COMPLETED', 'BLOCKED', 'FAILED']),
    summary: boundedText(4_000),
    changedFiles: z.array(changedFileSchema).max(256),
    validations: z
      .array(
        z
          .object({
            commandId: z.string().regex(/^[a-z][a-z0-9-]{0,63}$/),
            status: z.enum(['PASSED', 'FAILED', 'NOT_RUN']),
            summary: boundedText(2_000),
          })
          .strict(),
      )
      .max(64),
    residualRisks: z.array(boundedText(2_000)).max(64),
    nextAction: z.string().max(2_000).nullable(),
  })
  .strict();

export type CodexTaskResult = z.infer<typeof codexTaskResultSchema>;

export const CODEX_TASK_RESULT_JSON_SCHEMA = Object.freeze({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'McfCodexTaskResultV1',
  type: 'object',
  additionalProperties: false,
  required: [
    'schemaVersion',
    'status',
    'summary',
    'changedFiles',
    'validations',
    'residualRisks',
    'nextAction',
  ],
  properties: {
    schemaVersion: { const: '1.0' },
    status: { enum: ['COMPLETED', 'BLOCKED', 'FAILED'] },
    summary: { type: 'string', minLength: 1, maxLength: 4_000 },
    changedFiles: {
      type: 'array',
      maxItems: 256,
      items: {
        type: 'string',
        minLength: 1,
        maxLength: 1_024,
        pattern: '^(?!/)(?!.*(?:^|/)\\.\\.(?:/|$))(?!.*(?:^|/)\\.git(?:/|$)).+$',
      },
    },
    validations: {
      type: 'array',
      maxItems: 64,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['commandId', 'status', 'summary'],
        properties: {
          commandId: { type: 'string', pattern: '^[a-z][a-z0-9-]{0,63}$' },
          status: { enum: ['PASSED', 'FAILED', 'NOT_RUN'] },
          summary: { type: 'string', minLength: 1, maxLength: 2_000 },
        },
      },
    },
    residualRisks: {
      type: 'array',
      maxItems: 64,
      items: { type: 'string', minLength: 1, maxLength: 2_000 },
    },
    nextAction: {
      anyOf: [{ type: 'string', maxLength: 2_000 }, { type: 'null' }],
    },
  },
} as const);

export function parseCodexTaskResult(value: unknown): CodexTaskResult {
  return codexTaskResultSchema.parse(value);
}

