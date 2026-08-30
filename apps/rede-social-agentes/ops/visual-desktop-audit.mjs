/* global process, setTimeout */

import { execFile as execFileCallback, spawn } from 'node:child_process';
import { constants as fsConstants } from 'node:fs';
import { access, chown, mkdir, mkdtemp, rm, stat } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { basename, isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { performance } from 'node:perf_hooks';

const execFile = promisify(execFileCallback);
const REQUIRED_COMMANDS = ['wmctrl', 'xrandr', 'scrot', 'xdotool', 'xclip', 'tesseract', 'python3'];
const USER_PATTERN = /^[a-z_][a-z0-9_-]{0,31}$/u;

const CROP_PYTHON = String.raw`
import json, os, sys
from PIL import Image, ImageOps
raw, specs_json, outdir = sys.argv[1:4]
image = Image.open(raw).convert('RGB')
paths = []
for index, spec in enumerate(json.loads(specs_json), 1):
    x, y, w, h = spec['x'], spec['y'], spec['width'], spec['height']
    crop = image.crop((x, y, x + w, y + h))
    crop = crop.resize((max(1, crop.width * 2), max(1, crop.height * 2)))
    crop = ImageOps.autocontrast(ImageOps.grayscale(crop))
    path = os.path.join(outdir, f'ocr-{index}.png')
    crop.save(path)
    paths.append(path)
print(json.dumps(paths))
`;

const ANNOTATE_PYTHON = String.raw`
import json, os, sys, textwrap
from PIL import Image, ImageDraw, ImageFont
raw, annotated, specs_json = sys.argv[1:4]
specs = json.loads(specs_json)
image = Image.open(raw).convert('RGB')
draw = ImageDraw.Draw(image)
try:
    title_font = ImageFont.truetype('DejaVuSans-Bold.ttf', 17)
    body_font = ImageFont.truetype('DejaVuSans.ttf', 13)
except Exception:
    title_font = ImageFont.load_default()
    body_font = ImageFont.load_default()
for index, spec in enumerate(specs, 1):
    x, y, w, h = spec['x'], spec['y'], spec['width'], spec['height']
    draw.rectangle((x + 2, y + 2, x + w - 3, y + h - 3), outline=(255, 0, 0), width=3)
    banner_h = min(76, max(54, h // 8))
    draw.rectangle((x + 4, y + 4, x + w - 5, y + banner_h), fill=(0, 0, 0), outline=(255, 0, 0), width=2)
    heading = f"SUPERFICIE OPERACIONAL {index} — {spec['title']}"
    draw.text((x + 9, y + 8), heading, fill=(255, 255, 255), font=title_font)
    width_chars = max(24, min(110, (w - 24) // 7))
    lines = textwrap.wrap(spec['label'], width=width_chars)[:2]
    for line_index, line in enumerate(lines):
        draw.text((x + 9, y + 31 + line_index * 17), line, fill=(255, 255, 255), font=body_font)
image.save(annotated)
`;

function integerOption(value, name, { min = 1 } = {}) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min) {
    throw new Error(`${name} must be an integer >= ${min}`);
  }
  return parsed;
}

export function parseAuditOptions(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || value === undefined) {
      throw new Error('visual audit options must be --key value pairs');
    }
    values.set(key, value);
  }

  const outputDir = values.get('--output-dir');
  if (!outputDir || !isAbsolute(outputDir)) {
    throw new Error('visual audit requires an absolute output directory');
  }
  const expectedSurfaces = integerOption(
    values.get('--expected-surfaces') ?? '1',
    'expected surfaces',
  );
  const openSurface = integerOption(
    values.get('--open-surface') ?? String(expectedSurfaces),
    'open surface',
  );
  if (openSurface > expectedSurfaces) {
    throw new Error('open surface cannot exceed expected surfaces');
  }
  const timeBudgetMs = integerOption(values.get('--time-budget-ms') ?? '8000', 'time budget ms');
  const windowPattern = (values.get('--window-pattern') ?? 'Brave').trim();
  if (!windowPattern) throw new Error('window pattern cannot be empty');
  const sessionUser = (
    values.get('--session-user') ??
    process.env.SUDO_USER ??
    process.env.USER ??
    ''
  ).trim();
  if (!USER_PATTERN.test(sessionUser)) {
    throw new Error('session user is invalid');
  }

  return { outputDir, windowPattern, expectedSurfaces, openSurface, timeBudgetMs, sessionUser };
}

export function parseWmctrlWindows(output, windowPattern) {
  const needle = windowPattern.toLocaleLowerCase();
  return output
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = /^(\S+)\s+\S+\s+(-?\d+)\s+(-?\d+)\s+(\d+)\s+(\d+)\s+\S+\s+(.+)$/u.exec(line);
      if (!match) return null;
      return {
        windowId: match[1],
        x: Number(match[2]),
        y: Number(match[3]),
        width: Number(match[4]),
        height: Number(match[5]),
        title: match[6].trim(),
      };
    })
    .filter((window) => window && window.title.toLocaleLowerCase().includes(needle))
    .sort((left, right) => left.x - right.x || left.y - right.y);
}

export function ocrBand(surface) {
  const inset = Math.min(72, Math.floor(surface.height / 2));
  const remaining = Math.max(1, surface.height - inset);
  return {
    x: surface.x,
    y: surface.y + inset,
    width: surface.width,
    height: Math.min(220, remaining),
  };
}

function stripAsciiControls(text) {
  return [...text]
    .filter((character) => {
      const codePoint = character.codePointAt(0) ?? 0;
      return (
        codePoint === 0x09 ||
        codePoint === 0x0a ||
        codePoint === 0x0d ||
        (codePoint >= 0x20 && codePoint !== 0x7f)
      );
    })
    .join('');
}

export function sanitizeOcrText(text, maxSegments = 4) {
  const seen = new Set();
  const segments = [];
  for (const rawLine of stripAsciiControls(text).split(/\r?\n/u)) {
    const line = rawLine.replace(/\s+/gu, ' ').trim();
    if (line.length < 3) continue;
    const folded = line.toLocaleLowerCase();
    if (seen.has(folded)) continue;
    seen.add(folded);
    segments.push(line);
    if (segments.length >= maxSegments) break;
  }
  return segments.join(' | ');
}

function distinctArtifacts(artifacts) {
  if (!artifacts || typeof artifacts !== 'object') return false;
  const paths = [artifacts.raw, artifacts.annotated, artifacts.verification];
  return (
    paths.every((item) => typeof item === 'string' && isAbsolute(item)) && new Set(paths).size === 3
  );
}

export function validateAuditResult(result, constraints) {
  const failures = [...(Array.isArray(result.criticalFailures) ? result.criticalFailures : [])];
  const fail = (code) => {
    if (!failures.includes(code)) failures.push(code);
  };

  if (result.expectedSurfaceCount !== constraints.expectedSurfaces)
    fail('EXPECTED_SURFACE_COUNT_MISMATCH');
  if (result.actualSurfaceCount !== constraints.expectedSurfaces) fail('SURFACE_COUNT_MISMATCH');
  if (!Array.isArray(result.surfaces) || result.surfaces.length !== result.actualSurfaceCount) {
    fail('SURFACE_INVENTORY_MISMATCH');
  } else if (
    result.surfaces.some(
      (surface) => typeof surface.label !== 'string' || surface.label.trim().length === 0,
    )
  ) {
    fail('EMPTY_VISIBLE_LABEL');
  }
  if (!distinctArtifacts(result.artifacts)) fail('ARTIFACTS_INVALID');
  if (result.openVerified !== true) fail('OPEN_NOT_VERIFIED');
  if (!Number.isInteger(result.elapsedMs) || result.elapsedMs < 0) fail('ELAPSED_TIME_INVALID');
  if (Number.isInteger(result.elapsedMs) && result.elapsedMs > constraints.timeBudgetMs)
    fail('TIME_BUDGET_EXCEEDED');

  return {
    ...result,
    criticalFailures: failures,
    verdict: failures.length === 0 ? 'PASS' : 'FAIL',
  };
}

function receiptMetadata(result) {
  return {
    requestedUnit: result.requestedUnit,
    expectedSurfaceCount: result.expectedSurfaceCount,
    actualSurfaceCount: result.actualSurfaceCount,
    rawArtifact: result.artifacts.raw,
    annotatedArtifact: result.artifacts.annotated,
    verificationArtifact: result.artifacts.verification,
    surfaceInventory: result.surfaces,
    elapsedMs: result.elapsedMs,
    openVerified: result.openVerified,
    criticalFailures: result.criticalFailures,
    interpretationMode: result.interpretationMode,
  };
}

async function run(command, args, options = {}) {
  return execFile(command, args, {
    encoding: 'utf8',
    timeout: options.timeout ?? 5000,
    env: options.env ?? process.env,
  });
}

async function assertDependencies(env) {
  for (const command of REQUIRED_COMMANDS) {
    try {
      await run('which', [command], { env, timeout: 1500 });
    } catch {
      throw new Error(`required command is unavailable: ${command}`);
    }
  }
  try {
    await run('python3', ['-c', 'import PIL'], { env, timeout: 2000 });
  } catch {
    throw new Error('required Python Pillow module is unavailable');
  }
}

function desktopEnvironment(sessionUser) {
  const userHome = sessionUser === process.env.USER ? homedir() : `/home/${sessionUser}`;
  return {
    ...process.env,
    DISPLAY: process.env.DISPLAY || ':0',
    XAUTHORITY: process.env.XAUTHORITY || `${userHome}/.Xauthority`,
    DBUS_SESSION_BUS_ADDRESS:
      process.env.DBUS_SESSION_BUS_ADDRESS ||
      `unix:path=/run/user/${process.env.SUDO_UID || '1000'}/bus`,
  };
}

async function ensureArtifact(path) {
  await access(path, fsConstants.R_OK);
  const info = await stat(path);
  if (!info.isFile() || info.size === 0) throw new Error(`artifact missing or empty: ${path}`);
}

async function createOcrCrops(rawPath, surfaces, workDir, env) {
  const { stdout } = await run(
    'python3',
    ['-c', CROP_PYTHON, rawPath, JSON.stringify(surfaces.map(ocrBand)), workDir],
    { env, timeout: 3000 },
  );
  return JSON.parse(stdout);
}

async function ocrCrop(path, env) {
  const { stdout } = await run('tesseract', [path, 'stdout', '-l', 'por+eng', '--psm', '6'], {
    env,
    timeout: 4000,
  });
  return sanitizeOcrText(stdout);
}

async function annotate(rawPath, annotatedPath, surfaces, env) {
  await run('python3', ['-c', ANNOTATE_PYTHON, rawPath, annotatedPath, JSON.stringify(surfaces)], {
    env,
    timeout: 3000,
  });
}

async function openAnnotated(windowId, annotatedPath, env) {
  await run('xdotool', ['windowactivate', '--sync', windowId], { env, timeout: 1500 });
  const clipboard = spawn('xclip', ['-selection', 'clipboard'], {
    env,
    detached: true,
    stdio: ['pipe', 'ignore', 'ignore'],
  });
  clipboard.unref();
  clipboard.stdin.end(pathToFileURL(annotatedPath).href);
  await new Promise((resolveDelay) => setTimeout(resolveDelay, 80));
  await run('xdotool', ['key', 'ctrl+l'], { env, timeout: 1000 });
  await run('xdotool', ['key', 'ctrl+v'], { env, timeout: 1000 });
  await run('xdotool', ['key', 'Return'], { env, timeout: 1000 });
  await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  await run('xdotool', ['key', 'Return'], { env, timeout: 1000 });
  await new Promise((resolveDelay) => setTimeout(resolveDelay, 450));
  try {
    clipboard.kill();
  } catch {
    // Clipboard helper may already have exited after the paste request.
  }
  const { stdout } = await run('xdotool', ['getactivewindow', 'getwindowname'], {
    env,
    timeout: 1000,
  });
  return stdout.includes(basename(annotatedPath));
}

async function physicalMonitorCount(env) {
  try {
    const { stdout } = await run('xrandr', ['--query'], { env, timeout: 1500 });
    return stdout.split(/\r?\n/u).filter((line) => /\sconnected(?:\s|$)/u.test(line)).length;
  } catch {
    return null;
  }
}

async function maybeChown(paths, sessionUser, env) {
  if (typeof process.getuid !== 'function' || process.getuid() !== 0) return;
  try {
    const { stdout } = await run('id', ['-u', sessionUser], { env, timeout: 1000 });
    const uid = Number(stdout.trim());
    const group = await run('id', ['-g', sessionUser], { env, timeout: 1000 });
    const gid = Number(group.stdout.trim());
    if (!Number.isInteger(uid) || !Number.isInteger(gid)) return;
    for (const path of paths) await chown(path, uid, gid);
  } catch {
    // Ownership normalization is best-effort and must not invalidate audit evidence.
  }
}

export async function runVisualDesktopAudit(options) {
  const env = desktopEnvironment(options.sessionUser);
  await assertDependencies(env);
  await mkdir(options.outputDir, { recursive: true });
  const workDir = await mkdtemp(join(tmpdir(), 'mcf-visual-audit-'));
  const stamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/gu, '')
    .slice(0, 14);
  const rawPath = resolve(options.outputDir, `mcf_visual_audit_${stamp}_raw.png`);
  const annotatedPath = resolve(options.outputDir, `mcf_visual_audit_${stamp}_annotated.png`);
  const verificationPath = resolve(options.outputDir, `mcf_visual_audit_${stamp}_verification.png`);
  const totalStart = performance.now();

  try {
    const { stdout: wmctrlOutput } = await run('wmctrl', ['-lG'], { env, timeout: 1500 });
    const windows = parseWmctrlWindows(wmctrlOutput, options.windowPattern);
    if (windows.length !== options.expectedSurfaces) {
      throw new Error(
        `expected ${options.expectedSurfaces} matching surfaces, observed ${windows.length}`,
      );
    }

    await run('scrot', [rawPath], { env, timeout: 2500 });
    await ensureArtifact(rawPath);
    const metricStart = performance.now();

    const cropPaths = await createOcrCrops(rawPath, windows, workDir, env);
    const ocrLabels = await Promise.all(cropPaths.map((path) => ocrCrop(path, env)));
    const surfaces = windows.map((window, index) => ({
      ...window,
      label: ocrLabels[index] || window.title,
    }));

    await annotate(rawPath, annotatedPath, surfaces, env);
    await ensureArtifact(annotatedPath);
    const target = surfaces[options.openSurface - 1];
    if (!target) throw new Error('requested open surface is unavailable');
    const openVerified = await openAnnotated(target.windowId, annotatedPath, env);
    await run('scrot', [verificationPath], { env, timeout: 2500 });
    await ensureArtifact(verificationPath);
    const elapsedMs = Math.round(performance.now() - metricStart);

    const validated = validateAuditResult(
      {
        requestedUnit: 'browser-window',
        expectedSurfaceCount: options.expectedSurfaces,
        actualSurfaceCount: surfaces.length,
        physicalMonitors: await physicalMonitorCount(env),
        surfaces,
        artifacts: { raw: rawPath, annotated: annotatedPath, verification: verificationPath },
        elapsedMs,
        totalElapsedMs: Math.round(performance.now() - totalStart),
        openVerified,
        criticalFailures: [],
        interpretationMode: 'ocr-fallback',
      },
      options,
    );
    const result = { ...validated, receiptMetadata: receiptMetadata(validated) };
    await maybeChown([rawPath, annotatedPath, verificationPath], options.sessionUser, env);
    return result;
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

async function main() {
  try {
    const options = parseAuditOptions(process.argv.slice(2));
    const result = await runVisualDesktopAudit(options);
    process.stdout.write(`${JSON.stringify(result)}\n`);
    if (result.verdict !== 'PASS') process.exitCode = 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stdout.write(
      `${JSON.stringify({ verdict: 'FAIL', criticalFailures: ['EXECUTION_FAILED'], message })}\n`,
    );
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
