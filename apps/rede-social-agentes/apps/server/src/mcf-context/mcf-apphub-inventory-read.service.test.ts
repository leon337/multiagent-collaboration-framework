import { describe, expect, it, vi } from 'vitest';

import {
  McfAppHubInventoryReadService,
  McfAppHubInventoryUnavailableError,
  loadMcfAppHubInventoryConfiguration,
  type McfAppHubFetch,
  type McfAppHubInventoryConfiguration,
} from './mcf-apphub-inventory-read.service.js';

const config: McfAppHubInventoryConfiguration = {
  project: 'mcf-potiguar-gemini-261109',
  account: 'potiguaradm23@gmail.com',
  location: 'global',
  gcloudBin: '/usr/bin/gcloud',
};

const base = `projects/${config.project}/locations/global`;
const item = (resource: string, id: string) => ({ name: `${base}/${resource}/${id}` });
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

function build(
  fetcher: McfAppHubFetch,
  tokenProvider = vi.fn().mockResolvedValue('fake-test-token-at-least-20-chars'),
): McfAppHubInventoryReadService {
  return new McfAppHubInventoryReadService(
    config,
    tokenProvider,
    fetcher,
    () => '2026-11-10T03:00:00.000Z',
  );
}

describe('McfAppHubInventoryReadService', () => {
  it('is disabled by default, in production, and for malformed scope', async () => {
    expect(loadMcfAppHubInventoryConfiguration({})).toBeNull();
    expect(
      loadMcfAppHubInventoryConfiguration({
        MCF_APPHUB_INVENTORY_ENABLE: 'LOCAL_READ_ONLY',
        MCF_APPHUB_PROJECT_ID: config.project,
        MCF_APPHUB_ACCOUNT: config.account,
        MCF_APPHUB_GCLOUD_BIN: config.gcloudBin,
        NODE_ENV: 'production',
      }),
    ).toBeNull();
    expect(
      loadMcfAppHubInventoryConfiguration({
        MCF_APPHUB_INVENTORY_ENABLE: 'LOCAL_READ_ONLY',
        MCF_APPHUB_PROJECT_ID: '../another-project',
        MCF_APPHUB_ACCOUNT: config.account,
        MCF_APPHUB_GCLOUD_BIN: config.gcloudBin,
      }),
    ).toBeNull();
    expect(
      loadMcfAppHubInventoryConfiguration({
        MCF_APPHUB_INVENTORY_ENABLE: 'LOCAL_READ_ONLY',
        MCF_APPHUB_PROJECT_ID: config.project,
        MCF_APPHUB_ACCOUNT: config.account,
        MCF_APPHUB_GCLOUD_BIN: config.gcloudBin,
      }),
    ).toEqual(config);
    await expect(new McfAppHubInventoryReadService(null).readOnly()).rejects.toMatchObject({
      code: 'MCF_APPHUB_READ_DISABLED',
    });
  });

  it('reads three collections and paginates with only fixed GET calls', async () => {
    const fetcher = vi.fn<McfAppHubFetch>(async (url, init) => {
      expect(init.method).toBe('GET');
      expect(init.redirect).toBe('error');
      expect((init.headers as Record<string, string>).Authorization).toBe(
        'Bearer fake-test-token-at-least-20-chars',
      );
      expect(url).toContain(
        'https://apphub.googleapis.com/v1/projects/mcf-potiguar-gemini-261109/locations/global/',
      );
      if (url.includes('pageToken=part2'))
        return response({ applications: [item('applications', 'beta')] });
      if (url.includes('/applications')) {
        return response({ applications: [item('applications', 'alpha')], nextPageToken: 'part2' });
      }
      if (url.includes('/discoveredServices')) {
        return response({
          discoveredServices: [
            {
              ...item('discoveredServices', 's1'),
              serviceReference: { uri: 'urn:mcp:googleapis.com:projects:123:locations:global:iam' },
              secret: 'MUST-NOT-LEAK',
            },
          ],
        });
      }
      return response({ discoveredWorkloads: [] });
    });
    const result = await build(fetcher).readOnly();
    expect(result.counts).toEqual({
      applications: 2,
      discoveredServices: 1,
      discoveredWorkloads: 0,
    });
    expect(result.read_only).toBe(true);
    expect(result.material_action).toBe(false);
    expect(result.provenance.freshness).toBe('LIVE_REQUIRED');
    expect(JSON.stringify(result)).not.toContain('MUST-NOT-LEAK');
    expect(fetcher).toHaveBeenCalledTimes(4);
  });

  it.each([
    [
      'wrong project resource',
      {
        discoveredServices: [
          item('discoveredServices', 'valid'),
          { name: 'projects/foreign/locations/global/discoveredServices/foreign' },
        ],
      },
      'MCF_APPHUB_CONTRACT_INVALID',
    ],
    ['unreachable region', { unreachable: ['global'] }, 'MCF_APPHUB_UPSTREAM_FAILED'],
    ['invalid result', { discoveredServices: {} }, 'MCF_APPHUB_CONTRACT_INVALID'],
  ])('fails closed on %s', async (_description, payload, code) => {
    const fetcher: McfAppHubFetch = async (url) =>
      url.includes('/discoveredServices') ? response(payload) : response({});
    await expect(build(fetcher).readOnly()).rejects.toMatchObject({ code });
  });

  it('fails closed on permission errors and never exposes provider error payloads', async () => {
    const fetcher: McfAppHubFetch = async () => response({ error: 'secret-upstream' }, 403);
    await expect(build(fetcher).readOnly()).rejects.toMatchObject({
      code: 'MCF_APPHUB_AUTH_FAILED',
    });
  });

  it('rejects repeated pagination cursors instead of publishing partial inventory', async () => {
    const fetcher: McfAppHubFetch = async (url) =>
      url.includes('/applications')
        ? response({ applications: [item('applications', 'a')], nextPageToken: 'again' })
        : response({});
    await expect(build(fetcher).readOnly()).rejects.toMatchObject({
      code: 'MCF_APPHUB_CONTRACT_INVALID',
    });
  });

  it('rejects oversized streamed bodies even when Content-Length is absent', async () => {
    const fetcher: McfAppHubFetch = async () =>
      new Response(
        new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(new Uint8Array(512 * 1024 + 1));
            controller.close();
          },
        }),
      );
    await expect(build(fetcher).readOnly()).rejects.toMatchObject({
      code: 'MCF_APPHUB_CONTRACT_INVALID',
    });
  });

  it('rejects names from another collection inside a response', async () => {
    const fetcher: McfAppHubFetch = async (url) =>
      url.includes('/applications')
        ? response({ applications: [item('discoveredServices', 'wrong-collection')] })
        : response({});
    await expect(build(fetcher).readOnly()).rejects.toMatchObject({
      code: 'MCF_APPHUB_CONTRACT_INVALID',
    });
  });

  it('rejects concurrent reads, while permitting retry after failure', async () => {
    let release: ((value: Response) => void) | undefined;
    const fetcher: McfAppHubFetch = vi.fn(
      (url) =>
        new Promise<Response>((resolve) => {
          if (url.includes('/applications')) release = resolve;
          else resolve(response({}));
        }),
    );
    const service = build(fetcher);
    const first = service.readOnly();
    await vi.waitFor(() => expect(release).toBeTypeOf('function'));
    await expect(service.readOnly()).rejects.toMatchObject({ code: 'MCF_APPHUB_BUSY' });
    release?.(response({}));
    await expect(first).resolves.toHaveProperty('counts.applications', 0);
  });

  it('keeps upstream exception payloads private', async () => {
    const fetcher: McfAppHubFetch = async () => {
      throw new Error('token-leak-no-return');
    };
    await expect(build(fetcher).readOnly()).rejects.toSatisfy(
      (e: unknown) =>
        e instanceof McfAppHubInventoryUnavailableError &&
        !e.message.includes('token-leak-no-return'),
    );
  });
});
