import { z } from 'zod';

const booleanEnvironmentValue = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

function parseAllowedOrigins(value: string): string[] {
  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)
    .map((origin) => {
      const parsed = new URL(origin);
      if (parsed.origin !== origin || parsed.username || parsed.password) {
        throw new Error('ALLOWED_ORIGINS entries must be exact origins without paths or credentials.');
      }
      return parsed.origin;
    });

  return [...new Set(origins)];
}

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
    BODY_LIMIT_BYTES: z.coerce.number().int().min(16_384).max(2_097_152).default(262_144),
    RATE_LIMIT_KEY_SECRET: z.string().min(32).default('development-only-rate-limit-secret'),
    ALLOWED_ORIGINS: z.string().default('http://127.0.0.1:5173'),
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

    try {
      const allowedOrigins = parseAllowedOrigins(config.ALLOWED_ORIGINS);
      if (config.NODE_ENV === 'production' && allowedOrigins.length === 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ALLOWED_ORIGINS'],
          message: 'ALLOWED_ORIGINS must declare at least one public web origin in production.',
        });
      }
      if (
        config.NODE_ENV === 'production' &&
        allowedOrigins.some((origin) => !origin.startsWith('https://'))
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ALLOWED_ORIGINS'],
          message: 'ALLOWED_ORIGINS must use HTTPS in production.',
        });
      }
    } catch (error) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ALLOWED_ORIGINS'],
        message: error instanceof Error ? error.message : 'ALLOWED_ORIGINS is invalid.',
      });
    }
  });

type ParsedRuntimeConfig = z.infer<typeof runtimeConfigSchema>;

export type RuntimeConfig = Omit<ParsedRuntimeConfig, 'ALLOWED_ORIGINS'> & {
  ALLOWED_ORIGINS: string[];
};

export function loadRuntimeConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const parsed = runtimeConfigSchema.parse(env);
  return {
    ...parsed,
    ALLOWED_ORIGINS: parseAllowedOrigins(parsed.ALLOWED_ORIGINS),
  };
}
