import { z } from 'zod';

const workerConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

const config = workerConfigSchema.parse(process.env);

console.info(
  JSON.stringify({
    level: config.LOG_LEVEL,
    service: 'rede-social-agentes',
    component: 'worker',
    event: 'worker_started',
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
  }),
);
