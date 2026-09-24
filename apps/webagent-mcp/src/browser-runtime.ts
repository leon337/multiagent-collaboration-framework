import { randomUUID } from 'node:crypto';
import { chromium, type Browser } from 'playwright';
import { type EgressPolicy, PublicEgressPolicy } from './egress-policy.js';
import { OperationError } from './execution.js';
import { PublicTargetResolver, type TargetResolver } from './pinned-fetch.js';
import { PinnedEgressProxy } from './pinned-proxy.js';

export type BrowserRunStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type BrowserRuntimeKind = 'deterministic-mvp' | 'playwright';

export type BrowserRunRequest = {
  url: string;
  goal: string;
  maxSteps?: number;
  maxDurationMs?: number;
};

export type BrowserRunSnapshot = {
  runId: string;
  status: BrowserRunStatus;
  runtime: BrowserRuntimeKind;
  url: string;
  goal: string;
  createdAt: string;
  updatedAt: string;
  budget: {
    maxSteps: number;
    maxDurationMs: number;
    consumedSteps: number;
  };
  result?: {
    summary: string;
    title?: string;
    finalUrl?: string;
    textExcerpt?: string;
  };
  error?: {
    code: string;
    message: string;
  };
};

export interface BrowserRuntime {
  readonly kind: BrowserRuntimeKind;
  start(request: BrowserRunRequest): BrowserRunSnapshot;
  get(runId: string): BrowserRunSnapshot;
  cancel(runId: string): BrowserRunSnapshot;
  dispose?(): Promise<void>;
}

function parseBrowserUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new OperationError('INVALID_URL', 'url must be an absolute HTTP or HTTPS URL');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new OperationError('INVALID_URL', 'only http and https URLs are allowed');
  }
  if (url.username || url.password) {
    throw new OperationError('INVALID_URL', 'embedded URL credentials are not allowed');
  }
  return url;
}

function validateRequest(request: BrowserRunRequest): {
  url: URL;
  goal: string;
  maxSteps: number;
  maxDurationMs: number;
} {
  const url = parseBrowserUrl(request.url);
  const goal = request.goal.trim();
  if (!goal || goal.length > 2_000) {
    throw new OperationError('INVALID_ARGUMENT', 'goal must contain between 1 and 2000 characters');
  }

  const maxSteps = request.maxSteps ?? 30;
  const maxDurationMs = request.maxDurationMs ?? 120_000;
  if (!Number.isInteger(maxSteps) || maxSteps < 1 || maxSteps > 500) {
    throw new OperationError('INVALID_ARGUMENT', 'maxSteps must be an integer between 1 and 500');
  }
  if (!Number.isInteger(maxDurationMs) || maxDurationMs < 1 || maxDurationMs > 900_000) {
    throw new OperationError('INVALID_ARGUMENT', 'maxDurationMs must be an integer between 1 and 900000');
  }

  return { url, goal, maxSteps, maxDurationMs };
}

function cloneSnapshot(snapshot: BrowserRunSnapshot): BrowserRunSnapshot {
  return {
    ...snapshot,
    budget: { ...snapshot.budget },
    result: snapshot.result ? { ...snapshot.result } : undefined,
    error: snapshot.error ? { ...snapshot.error } : undefined,
  };
}

function createSnapshot(kind: BrowserRuntimeKind, request: BrowserRunRequest): BrowserRunSnapshot {
  const { url, goal, maxSteps, maxDurationMs } = validateRequest(request);
  const now = new Date().toISOString();
  return {
    runId: randomUUID(),
    status: 'PENDING',
    runtime: kind,
    url: url.toString(),
    goal,
    createdAt: now,
    updatedAt: now,
    budget: { maxSteps, maxDurationMs, consumedSteps: 0 },
  };
}

export class DeterministicBrowserRuntime implements BrowserRuntime {
  readonly kind = 'deterministic-mvp' as const;
  private readonly runs = new Map<string, BrowserRunSnapshot>();
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(private readonly completionDelayMs = 5) {}

  start(request: BrowserRunRequest): BrowserRunSnapshot {
    const snapshot = createSnapshot(this.kind, request);
    this.runs.set(snapshot.runId, snapshot);

    const timer = setTimeout(() => {
      const current = this.runs.get(snapshot.runId);
      if (!current || current.status !== 'PENDING') return;
      this.runs.set(snapshot.runId, {
        ...current,
        status: 'COMPLETED',
        updatedAt: new Date().toISOString(),
        budget: { ...current.budget, consumedSteps: 1 },
        result: { summary: 'Deterministic MVP completed without live browser execution.' },
      });
      this.timers.delete(snapshot.runId);
    }, Math.max(0, this.completionDelayMs));
    this.timers.set(snapshot.runId, timer);

    return cloneSnapshot(snapshot);
  }

  get(runId: string): BrowserRunSnapshot {
    const snapshot = this.runs.get(runId);
    if (!snapshot) throw new OperationError('RUN_NOT_FOUND', `browser run not found: ${runId}`);
    return cloneSnapshot(snapshot);
  }

  cancel(runId: string): BrowserRunSnapshot {
    const current = this.runs.get(runId);
    if (!current) throw new OperationError('RUN_NOT_FOUND', `browser run not found: ${runId}`);
    if (current.status === 'COMPLETED' || current.status === 'FAILED' || current.status === 'CANCELLED') {
      return cloneSnapshot(current);
    }

    const timer = this.timers.get(runId);
    if (timer) clearTimeout(timer);
    this.timers.delete(runId);

    const cancelled: BrowserRunSnapshot = {
      ...current,
      status: 'CANCELLED',
      updatedAt: new Date().toISOString(),
    };
    this.runs.set(runId, cancelled);
    return cloneSnapshot(cancelled);
  }
}

type ChromiumLaunchOptions = NonNullable<Parameters<typeof chromium.launch>[0]>;

export type PlaywrightBrowserRuntimeOptions = {
  egressPolicy?: EgressPolicy;
  targetResolver?: TargetResolver;
  launchOptions?: ChromiumLaunchOptions;
  excerptMaxChars?: number;
};

export class PlaywrightBrowserRuntime implements BrowserRuntime {
  readonly kind = 'playwright' as const;
  private readonly runs = new Map<string, BrowserRunSnapshot>();
  private readonly browsers = new Map<string, Browser>();
  private readonly proxies = new Map<string, PinnedEgressProxy>();
  private readonly egressPolicy: EgressPolicy;
  private readonly targetResolver: TargetResolver;
  private readonly launchOptions: ChromiumLaunchOptions;
  private readonly excerptMaxChars: number;

  constructor(options: PlaywrightBrowserRuntimeOptions = {}) {
    this.egressPolicy = options.egressPolicy ?? new PublicEgressPolicy();
    this.targetResolver = options.targetResolver ?? new PublicTargetResolver();
    this.launchOptions = { headless: true, ...options.launchOptions };
    this.excerptMaxChars = Math.max(500, Math.min(options.excerptMaxChars ?? 8_000, 50_000));
  }

  start(request: BrowserRunRequest): BrowserRunSnapshot {
    const snapshot = createSnapshot(this.kind, request);
    this.runs.set(snapshot.runId, snapshot);
    void this.execute(snapshot.runId);
    return cloneSnapshot(snapshot);
  }

  get(runId: string): BrowserRunSnapshot {
    const snapshot = this.runs.get(runId);
    if (!snapshot) throw new OperationError('RUN_NOT_FOUND', `browser run not found: ${runId}`);
    return cloneSnapshot(snapshot);
  }

  cancel(runId: string): BrowserRunSnapshot {
    const current = this.runs.get(runId);
    if (!current) throw new OperationError('RUN_NOT_FOUND', `browser run not found: ${runId}`);
    if (current.status === 'COMPLETED' || current.status === 'FAILED' || current.status === 'CANCELLED') {
      return cloneSnapshot(current);
    }

    const cancelled: BrowserRunSnapshot = {
      ...current,
      status: 'CANCELLED',
      updatedAt: new Date().toISOString(),
    };
    this.runs.set(runId, cancelled);

    const browser = this.browsers.get(runId);
    if (browser) void browser.close().catch(() => undefined);
    const proxy = this.proxies.get(runId);
    if (proxy) void proxy.close().catch(() => undefined);
    return cloneSnapshot(cancelled);
  }

  async dispose(): Promise<void> {
    const browsers = [...this.browsers.values()];
    const proxies = [...this.proxies.values()];
    this.browsers.clear();
    this.proxies.clear();
    await Promise.all(browsers.map((browser) => browser.close().catch(() => undefined)));
    await Promise.all(proxies.map((proxy) => proxy.close().catch(() => undefined)));
  }

  private async execute(runId: string): Promise<void> {
    const started = this.runs.get(runId);
    if (!started || started.status !== 'PENDING') return;

    this.runs.set(runId, {
      ...started,
      status: 'RUNNING',
      updatedAt: new Date().toISOString(),
    });

    let browser: Browser | undefined;
    let proxy: PinnedEgressProxy | undefined;
    let blockedError: OperationError | undefined;
    const timeout = setTimeout(() => {
      const current = this.runs.get(runId);
      if (!current || current.status === 'COMPLETED' || current.status === 'FAILED' || current.status === 'CANCELLED') return;
      this.runs.set(runId, {
        ...current,
        status: 'FAILED',
        updatedAt: new Date().toISOString(),
        error: {
          code: 'BROWSER_TIMEOUT',
          message: `browser run exceeded ${current.budget.maxDurationMs}ms`,
        },
      });
      const active = this.browsers.get(runId);
      if (active) void active.close().catch(() => undefined);
      const activeProxy = this.proxies.get(runId);
      if (activeProxy) void activeProxy.close().catch(() => undefined);
    }, started.budget.maxDurationMs);

    try {
      const initialUrl = new URL(started.url);
      await this.egressPolicy.assertAllowed(initialUrl);

      const afterEgress = this.runs.get(runId);
      if (!afterEgress || afterEgress.status !== 'RUNNING') return;

      proxy = new PinnedEgressProxy({ targetResolver: this.targetResolver });
      await proxy.listen();
      this.proxies.set(runId, proxy);

      browser = await chromium.launch({
        ...this.launchOptions,
        proxy: { server: proxy.proxyUrl() },
      });
      this.browsers.set(runId, browser);

      const afterLaunch = this.runs.get(runId);
      if (!afterLaunch || afterLaunch.status !== 'RUNNING') return;

      const context = await browser.newContext();
      await context.route('**/*', async (route) => {
        const rawUrl = route.request().url();
        let requestUrl: URL;
        try {
          requestUrl = new URL(rawUrl);
        } catch {
          await route.abort('blockedbyclient');
          return;
        }

        if (requestUrl.protocol !== 'http:' && requestUrl.protocol !== 'https:') {
          await route.continue();
          return;
        }

        try {
          await this.egressPolicy.assertAllowed(requestUrl);
          await route.continue();
        } catch (error) {
          blockedError =
            error instanceof OperationError
              ? error
              : new OperationError('EGRESS_BLOCKED', 'browser request blocked by egress policy');
          await route.abort('blockedbyclient');
        }
      });

      const page = await context.newPage();
      await page.goto(started.url, {
        waitUntil: 'domcontentloaded',
        timeout: Math.min(started.budget.maxDurationMs, 120_000),
      });

      const afterNavigation = this.runs.get(runId);
      if (!afterNavigation || afterNavigation.status !== 'RUNNING') return;

      const title = await page.title();
      const bodyText = await page.locator('body').innerText({ timeout: 5_000 }).catch(() => '');
      const textExcerpt = bodyText.replace(/\s+/g, ' ').trim().slice(0, this.excerptMaxChars);
      const finalUrl = page.url();

      const current = this.runs.get(runId);
      if (!current || current.status !== 'RUNNING') return;
      this.runs.set(runId, {
        ...current,
        status: 'COMPLETED',
        updatedAt: new Date().toISOString(),
        budget: { ...current.budget, consumedSteps: 1 },
        result: {
          summary: 'Playwright completed real headless Chromium navigation.',
          title,
          finalUrl,
          textExcerpt,
        },
      });
    } catch (error) {
      const current = this.runs.get(runId);
      if (!current || current.status === 'CANCELLED' || current.status === 'FAILED') return;
      const normalized =
        blockedError ??
        (error instanceof OperationError
          ? error
          : new OperationError('BROWSER_FAILED', error instanceof Error ? error.message : 'browser execution failed'));
      this.runs.set(runId, {
        ...current,
        status: 'FAILED',
        updatedAt: new Date().toISOString(),
        error: { code: normalized.code, message: normalized.message },
      });
    } finally {
      clearTimeout(timeout);
      this.browsers.delete(runId);
      this.proxies.delete(runId);
      if (browser) await browser.close().catch(() => undefined);
      if (proxy) await proxy.close().catch(() => undefined);
    }
  }
}

export function createDefaultBrowserRuntime(env: NodeJS.ProcessEnv = process.env): BrowserRuntime {
  return env.WEBAGENT_BROWSER_RUNTIME?.trim().toLowerCase() === 'deterministic'
    ? new DeterministicBrowserRuntime()
    : new PlaywrightBrowserRuntime();
}
