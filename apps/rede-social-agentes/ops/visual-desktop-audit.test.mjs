import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ocrBand,
  parseAuditOptions,
  parseWmctrlWindows,
  sanitizeOcrText,
  validateAuditResult,
} from './visual-desktop-audit.mjs';

const wmctrl = `
0x03000037  0 1356 0    680  714  leo-N43SM ChatGPT - GROK BOT - Brave
0x03000004  0 0    0    1360 768  leo-N43SM GROK BOT - Branch · Saudação inicial - Brave
0x030000ad  0 2028 0    680  714  leo-N43SM ChatGPT - GROK BOT - Brave
0x04400001  0 10   10   500  500  leo-N43SM Terminal
`;

test('parses matching desktop windows and sorts them left to right', () => {
  const windows = parseWmctrlWindows(wmctrl, 'Brave');

  assert.deepEqual(
    windows.map(({ windowId, x, width, title }) => ({ windowId, x, width, title })),
    [
      { windowId: '0x03000004', x: 0, width: 1360, title: 'GROK BOT - Branch · Saudação inicial - Brave' },
      { windowId: '0x03000037', x: 1356, width: 680, title: 'ChatGPT - GROK BOT - Brave' },
      { windowId: '0x030000ad', x: 2028, width: 680, title: 'ChatGPT - GROK BOT - Brave' },
    ],
  );
});

test('builds an OCR band below browser chrome while preserving window bounds', () => {
  assert.deepEqual(
    ocrBand({ x: 1356, y: 0, width: 680, height: 714 }),
    { x: 1356, y: 72, width: 680, height: 220 },
  );

  assert.deepEqual(
    ocrBand({ x: 0, y: 0, width: 500, height: 120 }),
    { x: 0, y: 60, width: 500, height: 60 },
  );
});

test('sanitizes OCR into a bounded visible-content label without control noise', () => {
  const label = sanitizeOcrText('  GROK BOT\n\nChats\nChats\nBranch · Saudação inicial\n\u0000garbage\nInicie a missão\nextra line');

  assert.equal(label, 'GROK BOT | Chats | Branch · Saudação inicial | garbage');
});

test('parses a bounded visual-audit CLI contract', () => {
  const options = parseAuditOptions([
    '--output-dir', '/tmp/visual-audit',
    '--window-pattern', 'Brave',
    '--expected-surfaces', '3',
    '--open-surface', '3',
    '--time-budget-ms', '8000',
    '--session-user', 'leo',
  ]);

  assert.deepEqual(options, {
    outputDir: '/tmp/visual-audit',
    windowPattern: 'Brave',
    expectedSurfaces: 3,
    openSurface: 3,
    timeBudgetMs: 8000,
    sessionUser: 'leo',
  });
});

test('rejects unsafe or contradictory CLI options', () => {
  assert.throws(
    () => parseAuditOptions(['--output-dir', 'relative/path', '--expected-surfaces', '3', '--open-surface', '4']),
    /absolute output directory|open surface/u,
  );
});

test('accepts only a complete verified audit result', () => {
  const result = validateAuditResult(
    {
      requestedUnit: 'browser-window',
      expectedSurfaceCount: 3,
      actualSurfaceCount: 3,
      surfaces: [
        { windowId: '0x1', title: 'left', x: 0, y: 0, width: 100, height: 100, label: 'visible left' },
        { windowId: '0x2', title: 'center', x: 100, y: 0, width: 100, height: 100, label: 'visible center' },
        { windowId: '0x3', title: 'right', x: 200, y: 0, width: 100, height: 100, label: 'visible right' },
      ],
      artifacts: { raw: '/tmp/raw.png', annotated: '/tmp/annotated.png', verification: '/tmp/verification.png' },
      elapsedMs: 3448,
      openVerified: true,
      criticalFailures: [],
      interpretationMode: 'ocr-fallback',
    },
    { expectedSurfaces: 3, timeBudgetMs: 8000 },
  );

  assert.equal(result.verdict, 'PASS');
});

test('fails closed when final opening is not verified', () => {
  const result = validateAuditResult(
    {
      requestedUnit: 'browser-window',
      expectedSurfaceCount: 1,
      actualSurfaceCount: 1,
      surfaces: [{ windowId: '0x1', title: 'left', x: 0, y: 0, width: 100, height: 100, label: 'visible' }],
      artifacts: { raw: '/tmp/raw.png', annotated: '/tmp/annotated.png', verification: '/tmp/verification.png' },
      elapsedMs: 1000,
      openVerified: false,
      criticalFailures: [],
      interpretationMode: 'ocr-fallback',
    },
    { expectedSurfaces: 1, timeBudgetMs: 8000 },
  );

  assert.equal(result.verdict, 'FAIL');
  assert.ok(result.criticalFailures.includes('OPEN_NOT_VERIFIED'));
});
