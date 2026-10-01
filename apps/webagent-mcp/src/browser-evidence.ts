import type { SanitizedBrowserAction } from './browser-actions.js';

export type BrowserEvidenceVersion = 1;

export type BrowserTimelineEventType =
  | 'run.created'
  | 'browser.launch.started'
  | 'browser.launch.completed'
  | 'navigation.started'
  | 'navigation.completed'
  | 'action.started'
  | 'action.completed'
  | 'action.denied'
  | 'evidence.captured'
  | 'run.completed';

export type BrowserTimelineEvent = {
  seq: number;
  at: string;
  type: BrowserTimelineEventType;
  url?: string;
  detail?: string;
};

export type BrowserNavigationEvidence = {
  at: string;
  phase: 'requested' | 'action' | 'final';
  url: string;
};

export type BrowserNetworkEvidence = {
  at: string;
  url: string;
  method: string;
  resourceType: string;
};

export type BrowserScreenshotEvidence = {
  mimeType: 'image/jpeg';
  base64: string;
  bytes: number;
  width: number;
  height: number;
};

export type BrowserSemanticEvidence = {
  format: 'aria-snapshot';
  content: string;
  chars: number;
  truncated: boolean;
};

export type BrowserReplayRequest = {
  url: string;
  goal: string;
  maxSteps: number;
  maxDurationMs: number;
  actions?: SanitizedBrowserAction[];
};

export type BrowserReplayOutcome = {
  status: 'COMPLETED' | 'FAILED' | 'CANCELLED';
  title?: string;
  finalUrl?: string;
  errorCode?: string;
};

export type BrowserReplayManifestV1 = {
  version: 1;
  runtime: 'deterministic-mvp' | 'playwright';
  request: BrowserReplayRequest;
  observedSteps: Array<{
    seq: number;
    type: BrowserTimelineEventType;
    url?: string;
    detail?: string;
  }>;
  outcome: BrowserReplayOutcome;
};

export type BrowserEvidenceBundle = {
  version: BrowserEvidenceVersion;
  capturedAt: string;
  screenshot?: BrowserScreenshotEvidence;
  semantic?: BrowserSemanticEvidence;
  timeline: BrowserTimelineEvent[];
  navigation: BrowserNavigationEvidence[];
  network: BrowserNetworkEvidence[];
  replay: BrowserReplayManifestV1;
};

export function createTimelineRecorder() {
  const events: BrowserTimelineEvent[] = [];

  return {
    events,
    record(
      type: BrowserTimelineEventType,
      input: { at?: string; url?: string; detail?: string } = {},
    ): BrowserTimelineEvent {
      const event: BrowserTimelineEvent = {
        seq: events.length + 1,
        at: input.at ?? new Date().toISOString(),
        type,
        ...(input.url ? { url: input.url } : {}),
        ...(input.detail ? { detail: input.detail } : {}),
      };
      events.push(event);
      return event;
    },
  };
}

export function createSemanticEvidence(content: string, maxChars: number): BrowserSemanticEvidence {
  const bounded = content.slice(0, maxChars);
  return {
    format: 'aria-snapshot',
    content: bounded,
    chars: bounded.length,
    truncated: content.length > bounded.length,
  };
}

export function buildReplayManifest(input: {
  runtime: 'deterministic-mvp' | 'playwright';
  request: BrowserReplayRequest;
  timeline: BrowserTimelineEvent[];
  outcome: BrowserReplayOutcome;
}): BrowserReplayManifestV1 {
  return {
    version: 1,
    runtime: input.runtime,
    request: structuredClone(input.request),
    observedSteps: input.timeline.map((event) => ({
      seq: event.seq,
      type: event.type,
      ...(event.url ? { url: event.url } : {}),
      ...(event.detail ? { detail: event.detail } : {}),
    })),
    outcome: { ...input.outcome },
  };
}
