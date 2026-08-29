import { createHash } from 'node:crypto';
import { z } from 'zod';

const versionSchema = z.object({
  service: z.literal('rede-social-agentes'),
  component: z.literal('server'),
  commitSha: z.string().regex(/^[a-f0-9]{40}$/u),
  branch: z.string().nullable(),
  runtime: z.literal('render'),
});
const readySchema = z.object({
  status: z.literal('ok'),
  service: z.literal('rede-social-agentes'),
  component: z.literal('server'),
  timestamp: z.string().datetime({ offset: true }),
});

export class HumanAuthorityRuntimeVerifier {
  constructor(
    private readonly runtimeBaseUrl: string,
    private readonly expectedCommitSha: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async verify() {
    const base = this.runtimeBaseUrl.replace(/\/$/u, '');
    const versionResponse = await this.fetchImpl(`${base}/health/version`, {
      method: 'GET',
      headers: { accept: 'application/json' },
    });
    if (!versionResponse.ok)
      throw new Error(`Runtime version probe failed with HTTP ${versionResponse.status}.`);
    const version = versionSchema.parse(await versionResponse.json());
    if (version.commitSha !== this.expectedCommitSha) {
      throw new Error('Runtime revision does not match the authorized bootstrap candidate.');
    }

    const readyResponse = await this.fetchImpl(`${base}/health/ready`, {
      method: 'GET',
      headers: { accept: 'application/json' },
    });
    if (!readyResponse.ok)
      throw new Error(`Runtime ready probe failed with HTTP ${readyResponse.status}.`);
    readySchema.parse(await readyResponse.json());

    const evidence = {
      schema: 'mcf-human-authority-runtime-evidence/v1',
      expectedCommitSha: this.expectedCommitSha,
      observedCommitSha: version.commitSha,
      runtime: version.runtime,
      ready: true,
      versionPath: '/health/version',
      readyPath: '/health/ready',
    };
    return {
      ...evidence,
      runtimeEvidenceDigest: createHash('sha256').update(JSON.stringify(evidence)).digest('hex'),
    };
  }
}
