export type BrowserEventType =
  | 'navigation.started'
  | 'navigation.committed'
  | 'navigation.completed'
  | 'domcontentloaded'
  | 'load'
  | 'url.changed'
  | 'request.failed'
  | 'response.error'
  | 'page.error'
  | 'console.error'
  | 'console.warning'
  | 'dialog.opened'
  | 'popup.opened'
  | 'download.started'
  | 'tab.created'
  | 'tab.changed'
  | 'tab.closed'
  | 'dom.changed'
  | 'action.started'
  | 'action.completed'
  | 'action.denied';

export type BrowserEvent = {
  seq: number;
  at: string;
  type: BrowserEventType;
  url?: string;
  data?: Record<string, string | number | boolean | null>;
};

export type BrowserEventQuery = {
  afterSeq?: number;
  types?: BrowserEventType[];
  limit?: number;
};

export type BrowserEventWait = BrowserEventQuery & {
  timeoutMs?: number;
};

type Waiter = {
  query: BrowserEventWait;
  resolve: (events: BrowserEvent[]) => void;
  timer: ReturnType<typeof setTimeout>;
};

function sanitizeUrl(raw: string): string {
  try {
    const url = new URL(raw);
    url.username = '';
    url.password = '';
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return raw.slice(0, 500);
  }
}

function matches(event: BrowserEvent, query: BrowserEventQuery): boolean {
  if (query.afterSeq !== undefined && event.seq <= query.afterSeq) return false;
  if (query.types?.length && !query.types.includes(event.type)) return false;
  return true;
}

export class BrowserEventStream {
  private seq = 0;
  private readonly history: BrowserEvent[] = [];
  private readonly waiters = new Set<Waiter>();

  constructor(private readonly historyLimit = 250) {}

  record(
    type: BrowserEventType,
    input: { url?: string; data?: Record<string, string | number | boolean | null> } = {},
  ): BrowserEvent {
    const event: BrowserEvent = {
      seq: ++this.seq,
      at: new Date().toISOString(),
      type,
      ...(input.url ? { url: sanitizeUrl(input.url) } : {}),
      ...(input.data ? { data: input.data } : {}),
    };
    this.history.push(event);
    if (this.history.length > this.historyLimit) {
      this.history.splice(0, this.history.length - this.historyLimit);
    }
    for (const waiter of [...this.waiters]) {
      const ready = this.read(waiter.query);
      if (ready.length) {
        this.waiters.delete(waiter);
        clearTimeout(waiter.timer);
        waiter.resolve(ready);
      }
    }
    return event;
  }

  read(query: BrowserEventQuery = {}): BrowserEvent[] {
    const limit = Math.max(1, Math.min(query.limit ?? 20, 100));
    return this.history.filter((event) => matches(event, query)).slice(0, limit);
  }

  cursor(): number {
    return this.seq;
  }

  async wait(query: BrowserEventWait = {}): Promise<BrowserEvent[]> {
    const existing = this.read(query);
    if (existing.length) return existing;

    const timeoutMs = Math.max(50, Math.min(query.timeoutMs ?? 5_000, 30_000));
    let waiter!: Waiter;
    return await new Promise<BrowserEvent[]>((resolve) => {
      const timer = setTimeout(() => {
        this.waiters.delete(waiter);
        resolve([]);
      }, timeoutMs);
      waiter = { query, resolve, timer };
      this.waiters.add(waiter);
    });
  }

  close(): void {
    for (const waiter of this.waiters) {
      clearTimeout(waiter.timer);
      waiter.resolve([]);
    }
    this.waiters.clear();
  }
}
