import { z } from 'zod';

const runtimeConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().min(1).default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  DATABASE_URL: z.string().min(1).optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type RuntimeConfig = z.infer<typeof runtimeConfigSchema>;

export function loadRuntimeConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  return runtimeConfigSchema.parse(env);
}
