import { z } from 'zod';

const schema = z.object({
  HOST: z.string().min(1).default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  DATABASE_URL: z.string().regex(/^postgres(?:ql)?:\/\//u),
  BOOTSTRAP_SEAL_PUBLIC_JWK: z.string().min(20),
  BOOTSTRAP_SUBJECT_PEPPER: z.string().min(32),
  BOOTSTRAP_OIDC_AUDIENCE: z.string().min(3),
  BOOTSTRAP_ALLOWED_REPOSITORY: z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u),
  BOOTSTRAP_ALLOWED_REPOSITORY_ID: z.string().regex(/^[0-9]+$/u),
  BOOTSTRAP_ALLOWED_REPOSITORY_OWNER_ID: z.string().regex(/^[0-9]+$/u),
  BOOTSTRAP_ALLOWED_REF: z.string().startsWith('refs/'),
  BOOTSTRAP_ALLOWED_WORKFLOW_REF: z.string().includes('/.github/workflows/'),
  BOOTSTRAP_ALLOWED_WORKFLOW_SHA: z.string().regex(/^[a-f0-9]{40}$/u),
  BOOTSTRAP_ALLOWED_ENVIRONMENT: z.string().min(1),
  BOOTSTRAP_RUNTIME_BASE_URL: z
    .string()
    .url()
    .refine((value) => value.startsWith('https://')),
  BOOTSTRAP_EXPECTED_RUNTIME_SHA: z.string().regex(/^[a-f0-9]{40}$/u),
  BOOTSTRAP_INTENT_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(600),
  BOOTSTRAP_CLAIM_LEASE_SECONDS: z.coerce.number().int().min(30).max(900).default(300),
  BOOTSTRAP_ALLOWED_ORIGIN: z.string().url().optional(),
});

export type BootstrapConfig = z.infer<typeof schema>;

export function loadBootstrapConfigFrom(
  environment: Record<string, string | undefined>,
): BootstrapConfig {
  const config = schema.parse(environment);
  JSON.parse(config.BOOTSTRAP_SEAL_PUBLIC_JWK);
  return config;
}

export function loadBootstrapConfig(): BootstrapConfig {
  return loadBootstrapConfigFrom(process.env);
}
