'use strict';
// Optional browser-only qualification harness. No production imports/dependencies.
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawn, execFile } = require('node:child_process');
const { promisify } = require('node:util');
const assert = require('node:assert/strict');
const exec = promisify(execFile);
const canonicalMode = process.argv.includes('--canonical');
const agentMode = canonicalMode || process.argv.includes('--agent');
const canonical = { missionId: 'MCF-BROWSER-BRIDGE-001', phaseId: 'PHASE-04', actionId: require('node:crypto').randomUUID(), missionVersion: 1 };
const canonicalArgs = canonicalMode ? ['--canonical-action-id', canonical.actionId, '--canonical-mission', canonical.missionId, '--canonical-phase', canonical.phaseId, '--mission-version', String(canonical.missionVersion)] : [];
const base = path.resolve(__dirname, '..');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const children = [];
let temporary, browser, closing = false, phase = 'prerequisites';
let evidence = { test: canonicalMode ? 'e2e-canonical-disposable' : agentMode ? 'e2e-agent-disposable' : 'e2e-brave-disposable', status: 'FAIL', disposable: true, checks: [] };
function bounded(promise, ms, label) {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(Error(label + '_TIMEOUT')), ms); })]).finally(() => clearTimeout(timer));
}
function child(command, args, env, stdio = 'ignore') {
  const proc = spawn(command, args, { env, stdio, detached: true });
  children.push(proc);
  // Retain errors rather than allowing an unhandled spawn error to skip cleanup.
  proc.on('error', error => { proc.launchError = error; });
  return proc;
}
function killTree(proc) {
  if (!proc?.pid || proc.exitCode !== null || proc.signalCode !== null) return;
  try {
    // Only kill a process group when this specific child is its leader.
    const stat = fs.readFileSync(`/proc/${proc.pid}/stat`, 'utf8');
    const fields = stat.slice(stat.lastIndexOf(')') + 2).split(' ');
    if (Number(fields[2]) === proc.pid) process.kill(-proc.pid, 'SIGKILL');
    else proc.kill('SIGKILL');
  } catch { try { proc.kill('SIGKILL'); } catch {} }
}
async function cleanup() {
  if (closing) return;
  closing = true;
  const browserProcess = browser?.process();
  try { if (browser) await bounded(browser.close(), 4000, 'BROWSER_CLOSE'); } catch {} finally { killTree(browserProcess); }
  for (const proc of children.reverse()) killTree(proc);
  await Promise.all(children.map(proc => proc.exitCode !== null || !proc.pid ? Promise.resolve() : bounded(new Promise(resolve => proc.once('close', resolve)), 1500, 'CHILD_EXIT').catch(() => {})));
  if (temporary) fs.rmSync(temporary, { recursive: true, force: true });
}
async function terminate(code, reason) {
  evidence = { ...evidence, status: 'FAIL', phase, reason };
  try { await cleanup(); } finally { console.log(JSON.stringify(evidence)); process.exit(code); }
}
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { void terminate(signal === 'SIGINT' ? 130 : 143, signal); });
const deadline = setTimeout(() => { void terminate(1, 'TOTAL_TIMEOUT'); }, 90000);
async function poll(check, label, timeout = 8000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (closing) throw Error('CLEANUP_STARTED');
    const value = await bounded(Promise.resolve().then(check), 5000, label);
    if (value) return value;
    await delay(80);
  }
  throw Error(label + '_TIMEOUT');
}
async function main() {
  let puppeteer;
  try { puppeteer = require(process.env.PUPPETEER_CORE_PATH || 'puppeteer-core'); }
  catch { throw Error('OPTIONAL_PUPPETEER_CORE_UNAVAILABLE'); }
  temporary = fs.mkdtempSync('/tmp/mcf-bridge-browser-e2e-');
  fs.chmodSync(temporary, 0o700);
  const xdg = path.join(temporary, 'xdg');
  const runtime = path.join(temporary, 'runtime');
  fs.mkdirSync(xdg); fs.mkdirSync(runtime, { mode: 0o700 });
  const socketDir = path.join(temporary, 'ipc');
  if (agentMode) fs.mkdirSync(socketDir, { mode: 0o700 });
  const env = { ...process.env, HOME: temporary, TMPDIR: temporary, XDG_CONFIG_HOME: xdg, XDG_RUNTIME_DIR: runtime,
    XDG_CACHE_HOME: path.join(temporary, 'cache'), XDG_DATA_HOME: path.join(temporary, 'data'), XDG_STATE_HOME: path.join(temporary, 'state') };
  delete env.MCF_BRIDGE_AGENT_SOCKET_DIR;
  if (agentMode) env.MCF_BRIDGE_AGENT_SOCKET_DIR = socketDir;
  for (const key of ['DISPLAY', 'WAYLAND_DISPLAY', 'XAUTHORITY', 'DBUS_SESSION_BUS_ADDRESS', 'SESSION_MANAGER']) delete env[key];
  phase = 'isolated-display';
  // X server atomically selects/reserves an unused display; never reuse user DISPLAY.
  const xvfb = child('Xvfb', ['-displayfd', '3', '-screen', '0', '1360x850x24', '-nolisten', 'tcp'], env, ['ignore','ignore','pipe','pipe']);
  const display = await bounded(new Promise((resolve, reject) => {
    let text = '', diagnostic = '';
    xvfb.stderr.on('data', chunk => { diagnostic = (diagnostic + chunk.toString()).slice(0, 8192); });
    xvfb.once('error', reject);
    xvfb.once('close', () => {
      const error = Error('XVFB_EXITED');
      if (/operation not permitted|permission denied/i.test(diagnostic)) error.code = 'EACCES';
      reject(error);
    });
    xvfb.stdio[3].on('data', chunk => {
      text += chunk.toString();
      if (text.length > 32) reject(Error('INVALID_DISPLAY'));
      if (/^\d+\n$/.test(text)) resolve(':' + text.trim());
    });
  }), 5000, 'XVFB_READY');
  env.DISPLAY = display;
  await exec('python3', ['-c', 'from Xlib import display; from Xlib.ext import xtest; d=display.Display(); assert d.has_extension("XTEST"); d.close()'], { env, timeout: 5000 });
  const wm = child('metacity', ['--replace', '--sm-disable'], env);
  await poll(async () => {
    if (wm.launchError) throw wm.launchError;
    if (wm.exitCode !== null) throw Error('METACITY_EXITED');
    try { await exec('wmctrl', ['-m'], { env, timeout: 2000 }); return true; } catch { return false; }
  }, 'WINDOW_MANAGER');
  phase = 'temporary-clones';
  const extension = path.join(temporary, 'extension');
  fs.cpSync(path.join(base, 'extension'), extension, { recursive: true });
  const manifestPath = path.join(extension, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.commands = { _execute_action: { suggested_key: { default: 'Alt+Shift+M' } } };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest)); // Test clone only.
  const fixture = path.join(temporary, 'fixtures', 'bridge-fixture.html');
  fs.mkdirSync(path.dirname(fixture));
  // Include a visible label inside form as a negative sentinel (clone only).
  fs.writeFileSync(fixture, fs.readFileSync(path.join(base, 'fixtures/bridge-fixture.html'), 'utf8').replace('<form>', '<form><p>FORM_SECRET</p>'));
  const hostRoot = path.join(temporary, 'native');
  for (const folder of ['host', 'extension']) fs.mkdirSync(path.join(hostRoot, folder), { recursive: true });
  for (const file of ['package.json','host/host.js','host/framing.js','host/session.js','host/agent-broker.js','extension/contract.js','extension/agent-contract.js']) fs.copyFileSync(path.join(base, file), path.join(hostRoot, file));
  const hostFile = path.join(hostRoot, 'host/host.js');
  // Use current Node executable explicitly, independent of desktop/browser PATH.
  const hostCode = fs.readFileSync(hostFile, 'utf8');
  assert.ok(!/[\r\n ]/.test(process.execPath), 'Node executable path must support a Linux shebang');
  fs.writeFileSync(hostFile, hostCode.replace(/^#![^\n]+/, '#!' + process.execPath), { mode: 0o755 });
  fs.chmodSync(hostFile, 0o755);
  phase = 'launch-brave';
  browser = await puppeteer.launch({
    executablePath: process.env.BRAVE_EXECUTABLE_PATH || '/usr/bin/brave-browser',
    headless: false, pipe: true, timeout: 20000, protocolTimeout: 8000,
    defaultViewport: { width: 1100, height: 700 }, userDataDir: path.join(temporary, 'profile'), env,
    args: ['--disable-extensions-except=' + extension, '--load-extension=' + extension,
      '--no-first-run','--no-default-browser-check','--disable-sync','--disable-component-update',
      '--disable-background-networking','--no-proxy-server'],
  });
  const workerTarget = await browser.waitForTarget(t => t.type() === 'service_worker' && t.url().startsWith('chrome-extension://'), { timeout: 12000 });
  const id = new URL(workerTarget.url()).host;
  assert.match(id, /^[a-p]{32}$/);
  const worker = await workerTarget.worker(); assert.ok(worker);
  const nativeManifests = path.join(xdg, 'BraveSoftware/Brave-Browser/NativeMessagingHosts');
  fs.mkdirSync(nativeManifests, { recursive: true });
  fs.writeFileSync(path.join(hostRoot, 'host/config.local.json'), JSON.stringify({ extensionId: id }), { mode: 0o600 });
  fs.writeFileSync(path.join(nativeManifests, 'com.mcf.browser_bridge.json'), JSON.stringify({
    name: 'com.mcf.browser_bridge', description: 'Disposable synthetic E2E only', path: hostFile,
    type: 'stdio', allowed_origins: [`chrome-extension://${id}/`],
  }));
  phase = 'file-permission';
  if (!await worker.evaluate(() => chrome.extension.isAllowedFileSchemeAccess())) {
    // Explicitly enable file access through settings in THIS disposable profile only.
    const settings = await browser.newPage();
    await settings.goto('chrome://extensions/?id=' + id, { timeout: 8000 });
    await poll(async () => settings.evaluate(() => {
      const detail = document.querySelector('extensions-manager')?.shadowRoot?.querySelector('extensions-detail-view');
      const row = detail?.shadowRoot?.querySelector('#allow-on-file-urls');
      const toggle = row?.shadowRoot?.querySelector('cr-toggle');
      if (!toggle) return false;
      if (!toggle.checked) toggle.click();
      return true;
    }), 'FILE_ACCESS_CONTROL');
    await poll(() => worker.evaluate(() => chrome.extension.isAllowedFileSchemeAccess()), 'FILE_ACCESS_GRANTED');
    await settings.close();
  }
  phase = 'real-action-shortcut';
  const page = await browser.newPage();
  await page.goto(pathToFileURL(fixture).href, { timeout: 8000 });
  await page.bringToFront();
  await poll(async () => {
    try { await exec('wmctrl', ['-a', 'Fixture sintética MCF'], { env, timeout: 2000 }); return true; } catch { return false; }
  }, 'FIXTURE_WINDOW');
  // Wait for EWMH focus rather than assuming wmctrl activation is synchronous.
  await exec('python3', ['-c', `from Xlib import display, X, XK
from Xlib.ext import xtest
import time
d=display.Display()
root=d.screen().root
active=d.intern_atom('_NET_ACTIVE_WINDOW')
for attempt in range(40):
    p=root.get_full_property(active, X.AnyPropertyType)
    if p is not None and len(p.value) and int(p.value[0]) != 0: break
    time.sleep(0.05)
else: raise RuntimeError('No active disposable window')
keys=[d.keysym_to_keycode(XK.string_to_keysym(k)) for k in ['Alt_L','Shift_L','m']]
assert all(keys)
for k in keys: xtest.fake_input(d,X.KeyPress,k)
d.sync(); time.sleep(0.15)
for k in reversed(keys): xtest.fake_input(d,X.KeyRelease,k)
d.sync(); d.close()
`], { env, timeout: 5000 });
  // Programmatic openPopup is deliberately never used: it cannot prove activeTab.
  const popup = await browser.waitForTarget(t => t.url() === `chrome-extension://${id}/popup.html`, { timeout: 8000 });
  const session = await popup.createCDPSession();
  await session.send('Runtime.enable');
  async function evaluate(expression, userGesture = false) {
    const result = await session.send('Runtime.evaluate', { expression, returnByValue: true, userGesture });
    if (result.exceptionDetails) throw Error('POPUP_EVALUATION_FAILED');
    return result.result.value;
  }
  await poll(() => evaluate('document.readyState === "complete" && !!document.querySelector("#connect")'), 'POPUP_READY');
  async function status(expected) {
    return poll(async () => {
      const text = await evaluate('document.querySelector("#status").textContent');
      let result; try { result = JSON.parse(text); } catch { return false; }
      if (result.status === 'DENIED') throw Error('POPUP_DENIED');
      return result.status === expected ? result : false;
    }, 'POPUP_' + expected);
  }
  phase = 'connect';
  await evaluate('document.querySelector("#consent").click(); document.querySelector("#connect").click()', true);
  await status('CONNECTED'); evidence.checks.push('CONNECTED');
  await poll(() => evaluate('!document.querySelector("#summary").disabled'), 'SUMMARY_ENABLED');
  phase = 'read-summary';
  await evaluate('document.querySelector("#summary").click()', true);
  const result = await status('VALIDATED');
  assert.equal(result.summary.untrusted, true);
  assert.equal(result.summary.title, 'Fixture sintética MCF');
  assert.match(result.summary.text, /Catálogo de demonstração/);
  assert.match(result.summary.text, /Produto fictício: caderno azul/);
  assert.match(result.summary.text, /\[REDACTED_EMAIL\]/);
  const serialized = JSON.stringify(result.summary);
  for (const marker of ['FORM_SECRET','MARKED_SECRET','HIDDEN_SECRET','CSS_HIDDEN_SECRET','FRAME_SECRET','SYNTHETIC_SECRET_ONLY','NOT_A_REAL_PASSWORD','teste@example.invalid']) assert.ok(!serialized.includes(marker), 'SANITIZER_SENTINEL_LEAK');
  evidence.checks.push('VALIDATED', 'SYNTHETIC_PUBLIC_TEXT', 'REDACTED_EMAIL', 'NO_SENSITIVE_SENTINELS');
  if (agentMode) {
    phase = 'agent-opt-in';
    assert.equal(fs.existsSync(path.join(socketDir, 'mcf-agent.sock')), false);
    await evaluate('document.querySelector("#agent-consent").click()', true);
    await poll(() => evaluate('document.querySelector("#agent-state").textContent.includes("agent read allowed: true")'), 'AGENT_ALLOWED');
    phase = 'agent-cli';
    const cli = await exec(process.execPath, [path.join(base, 'scripts/agent-read-fixture.cjs'), socketDir, ...canonicalArgs], { env, timeout: 6000, maxBuffer: 32768 });
    const envelope = JSON.parse(cli.stdout);
    if (canonicalMode) {
      assert.equal(envelope.protocolVersion, 2); assert.equal(envelope.status, 'VALIDATED');
      assert.deepEqual(envelope.canonical, canonical); assert.equal(envelope.actionId, canonical.actionId);
      assert.match(envelope.consentRef, /^[0-9a-f-]{36}$/); assert.ok(envelope.expiresAt > Date.now());
      assert.equal(envelope.target, 'file:///[LOCAL_FIXTURE]'); assert.equal(Object.hasOwn(envelope, 'token'), false);
      evidence.checks.push('CANONICAL_REAL_CLI_CORRELATION');
    }
    const agentSummary = canonicalMode ? envelope.summary : envelope;
    assert.equal(agentSummary.untrusted, true);
    assert.equal(agentSummary.title, 'Fixture sintética MCF');
    assert.ok(agentSummary.text.length <= 4000);
    assert.match(agentSummary.text, /Produto fictício: caderno azul/);
    assert.match(agentSummary.text, /\[REDACTED_EMAIL\]/);
    for (const marker of ['FORM_SECRET','MARKED_SECRET','HIDDEN_SECRET','CSS_HIDDEN_SECRET','FRAME_SECRET','SYNTHETIC_SECRET_ONLY','NOT_A_REAL_PASSWORD','teste@example.invalid']) assert.ok(!JSON.stringify(agentSummary).includes(marker), 'AGENT_SANITIZER_SENTINEL_LEAK');
    evidence.checks.push('AGENT_REAL_CLI_SUMMARY', 'AGENT_SANITIZED');
  }
  phase = 'stop';
  await evaluate('document.querySelector("#stop").click()', true);
  await status('STOPPED');
  assert.equal(await evaluate('document.querySelector("#summary").disabled && !document.querySelector("#consent").checked'), true);
  evidence.checks.push('STOPPED', 'SUMMARY_DISABLED');
  if (agentMode) {
    await poll(() => !fs.existsSync(path.join(socketDir, 'mcf-agent-capability.json')) && !fs.existsSync(path.join(socketDir, 'mcf-agent.sock')), 'AGENT_REVOKED');
    let denied = false;
    try { await exec(process.execPath, [path.join(base, 'scripts/agent-read-fixture.cjs'), socketDir, ...canonicalArgs], { env, timeout: 6000 }); } catch (e) { denied = e.code === 1 && e.stdout === ''; }
    assert.equal(denied, true);
    evidence.checks.push('AGENT_DENIED_AFTER_STOP');
  }
  evidence.browser = await browser.version();
  evidence.status = 'PASS';
}
(async () => {
  try { await main(); }
  catch (error) {
    // Do not emit page data, child logs, paths, or arbitrary error messages.
    const code = error.code;
    evidence.status = ['EPERM','EACCES','ENOENT'].includes(code) || error.message === 'OPTIONAL_PUPPETEER_CORE_UNAVAILABLE' ? 'NOT_RUN' : 'FAIL';
    evidence.phase = phase;
    evidence.reason = code || (/^[A-Z_]+$/.test(error.message) ? error.message : 'ASSERTION_OR_BROWSER_FAILURE');
    process.exitCode = 1;
  } finally {
    try { await cleanup(); } catch { evidence.status = 'FAIL'; evidence.cleanup = 'FAILED'; process.exitCode = 1; }
    clearTimeout(deadline);
    console.log(JSON.stringify(evidence));
  }
})();
