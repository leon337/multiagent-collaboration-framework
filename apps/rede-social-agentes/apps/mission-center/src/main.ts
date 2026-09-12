import { loadMissionCenterConfig } from './config.js';
import { createMissionCenterServer } from './server.js';
import { MissionStatusSource, type StatusFetchResponse } from './status-source.js';

const config = loadMissionCenterConfig(process.env);
const source = new MissionStatusSource({
  url: config.statusUrl,
  ttlMs: config.cacheTtlMs,
  fetcher: async (url): Promise<StatusFetchResponse> => {
    const response = await fetch(url, {
      headers: {
        accept: 'application/vnd.github.raw+json',
        'user-agent': 'mcf-mission-center',
      },
      signal: AbortSignal.timeout(8_000),
    });
    return {
      ok: response.ok,
      status: response.status,
      json: async () => response.json(),
    };
  },
});

const server = createMissionCenterServer(source);
server.listen(config.port, config.host, () => {
  console.log(`MCF Mission Center listening on http://${config.host}:${config.port}`);
});

function shutdown(): void {
  server.close(() => process.exit(0));
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
