import { describe, expect, it } from 'vitest';
import { BrowserEventStream } from '../src/browser-events.js';

describe('BrowserEventStream', () => {
  it('returns matching events immediately after a cursor', () => {
    const stream = new BrowserEventStream();
    stream.record('navigation.started', { url: 'https://example.com/' });
    stream.record('navigation.completed', { url: 'https://example.com/' });

    expect(stream.read({ afterSeq: 1 })).toEqual([
      expect.objectContaining({ seq: 2, type: 'navigation.completed' }),
    ]);
  });

  it('waits for a future event without polling', async () => {
    const stream = new BrowserEventStream();
    const pending = stream.wait({
      afterSeq: 0,
      types: ['load'],
      timeoutMs: 2_000,
    });

    await new Promise((resolve) => setTimeout(resolve, 20));
    stream.record('load', { url: 'https://example.com/' });

    await expect(pending).resolves.toEqual([
      expect.objectContaining({ seq: 1, type: 'load' }),
    ]);
  });

  it('returns quickly on timeout', async () => {
    const stream = new BrowserEventStream();
    const started = performance.now();

    const events = await stream.wait({
      afterSeq: 0,
      types: ['load'],
      timeoutMs: 60,
    });

    expect(events).toEqual([]);
    expect(performance.now() - started).toBeGreaterThanOrEqual(50);
    expect(performance.now() - started).toBeLessThan(500);
  });

  it('filters event types and bounds history', () => {
    const stream = new BrowserEventStream(3);
    stream.record('navigation.started');
    stream.record('load');
    stream.record('console.warning');
    stream.record('navigation.completed');

    expect(stream.read({})).toHaveLength(3);
    expect(stream.read({ types: ['load'] })).toEqual([
      expect.objectContaining({ type: 'load' }),
    ]);
    expect(stream.cursor()).toBe(4);
  });

  it('sanitizes query strings and fragments from event URLs', () => {
    const stream = new BrowserEventStream();
    stream.record('url.changed', {
      url: 'https://example.com/path?token=secret#fragment',
    });

    const [event] = stream.read();
    expect(event.url).toBe('https://example.com/path');
    expect(event.url).not.toContain('secret');
    expect(event.url).not.toContain('fragment');
  });
});
