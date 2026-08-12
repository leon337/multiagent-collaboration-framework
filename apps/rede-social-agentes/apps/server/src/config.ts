import { z } from 'zod';

import { parseRegistrationAllowlist } from './identity/registration-policy.js';

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
        throw new Error(
          'ALLOWED_ORIGINS entries must be exact origins without paths or credentials.',
        );
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
    MCF_RECEIPT_SECRET: z.string().min(32).default('development-only-mcf-receipt-secret-0001'),
    MCF_RUNTIME_TOKEN: z.string().min(32).default('development-only-mcf-runtime-token-0001'),
    ALLOWED_ORIGINS: z.string().default('http://127.0.0.1:5173'),
    REGISTRATION_ALLOWLIST: z.string().default(''),
  })
  .superRefine((config, context) => {
    const insecureProductionSecrets: Array<[string, string, string]> = [
      ['RATE_LIMIT_KEY_SECRET', config.RATE_LIMIT_KEY_SECRET, 'development-only-rate-limit-secret'],
      ['MCF_RECEIPT_SECRET', config.MCF_RECEIPT_SECRET, 'development-only-mcf-receipt-secret-0001'],
      ['MCF_RUNTIME_TOKEN', config.MCF_RUNTIME_TOKEN, 'development-only-mcf-runtime-token-0001'],
    ];

    if (config.NODE_ENV === 'production') {
      for (const [name, value, insecureDefault] of insecureProductionSecrets) {
        if (value === insecureDefault) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [name],
            message: `${name} must be explicitly configured in production.`,
          });
        }
      }

      const registrationAllowlist = parseRegistrationAllowlist(config.REGISTRATION_ALLOWLIST);
      if (registrationAllowlist.length === 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['REGISTRATION_ALLOWLIST'],
          message: 'REGISTRATION_ALLOWLIST must declare at least one controlled pilot invitation in production.',
        });
      }
      for (const email of registrationAllowlist) {
        const parsedEmail = z.string().email().max(320).safeParse(email);
        if (!parsedEmail.success) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['REGISTRATION_ALLOWLIST'],
            message: 'REGISTRATION_ALLOWLIST entries must be valid email addresses.',
          });
          break;
        }
      }
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

export type RuntimeConfig = Omit<
  ParsedRuntimeConfig,
  'ALLOWED_ORIGINS' | 'REGISTRATION_ALLOWLIST'
> & {
  ALLOWED_ORIGINS: string[];
  REGISTRATION_ALLOWLIST: string[];
};

export function loadRuntimeConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const parsed = runtimeConfigSchema.parse(env);
  return {
    ...parsed,
    ALLOWED_ORIGINS: parseAllowedOrigins(parsed.ALLOWED_ORIGINS),
    REGISTRATION_ALLOWLIST: parseRegistrationAllowlist(parsed.REGISTRATION_ALLOWLIST),
  };
}
