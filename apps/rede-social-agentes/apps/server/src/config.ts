import { z } from 'zod';

const booleanEnvironmentValue = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

const runtimeConfigSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    HOST: z.string().min(1).default('127.0.0.1'),
    PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
    DATABASE_URL: z
      .string()
      .regex(/^postgres(?:ql)?:\/\//u, 'DATABASE_URL must use the PostgreSQL protocol.'),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    TRUST_PROXY: booleanEnvironmentValue,
    BODY_LIMIT_BYTES: z.coerce
      .number()
      .int()
      .min(16_384)
      .max(2_097_152)
      .default(262_144),
    RATE_LIMIT_KEY_SECRET: z.string().min(32).default('development-only-rate-limit-secret'),
  })
  .superRefine((config, context) => {
    if (
      config.NODE_ENV === 'production' &&
      config.RATE_LIMIT_KEY_SECRET === 'development-only-rate-limit-secret'
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['RATE_LIMIT_KEY_SECRET'],
        message: 'RATE_LIMIT_KEY_SECRET must be explicitly configured in production.',
      });
    }
  });

export type RuntimeConfig = z.infer<typeof runtimeConfigSchema>;

export function loadRuntimeConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  return runtimeConfigSchema.parse(env);
}
