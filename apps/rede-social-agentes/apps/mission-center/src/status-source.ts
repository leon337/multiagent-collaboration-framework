import { parseMissionStatus, type MissionStatusSnapshot } from './status.js';

export interface StatusFetchResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}

export type StatusFetcher = (url: string) => Promise<StatusFetchResponse>;

export interface MissionStatusResult {
  snapshot: MissionStatusSnapshot;
  stale: boolean;
  fetchedAt: string;
}

export interface MissionStatusSourceOptions {
  url: string;
  fetcher: StatusFetcher;
  ttlMs?: number;
  now?: () => number;
}

export class MissionStatusSource {
  private readonly ttlMs: number;
  private readonly now: () => number;
  private cache?: { snapshot: MissionStatusSnapshot; fetchedAtMs: number };

  constructor(private readonly options: MissionStatusSourceOptions) {
    if (!options.url) throw new Error('Mission status URL is required');
    this.ttlMs = options.ttlMs ?? 10_000;
    this.now = options.now ?? Date.now;
  }

  async getStatus(): Promise<MissionStatusResult> {
    const now = this.now();
    if (this.cache && now - this.cache.fetchedAtMs < this.ttlMs) {
      return {
        snapshot: this.cache.snapshot,
        stale: false,
        fetchedAt: new Date(this.cache.fetchedAtMs).toISOString(),
      };
    }

    try {
      const response = await this.options.fetcher(this.options.url);
      if (!response.ok) throw new Error(`Mission status upstream returned HTTP ${response.status}`);
      const snapshot = parseMissionStatus(await response.json());
      this.cache = { snapshot, fetchedAtMs: now };
      return {
        snapshot,
        stale: false,
        fetchedAt: new Date(now).toISOString(),
      };
    } catch {
      if (this.cache) {
        return {
          snapshot: this.cache.snapshot,
          stale: true,
          fetchedAt: new Date(this.cache.fetchedAtMs).toISOString(),
        };
      }
      throw new Error('Mission status unavailable and no valid cached snapshot exists.');
    }
  }
}
