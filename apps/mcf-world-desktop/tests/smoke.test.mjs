import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('package and Electron shell keep secure desktop defaults', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts.start, 'electron .');
  const main = read('electron/main.mjs');
  assert.match(main, /WebContentsView/);
  assert.match(main, /contextIsolation:\s*true/);
  assert.match(main, /nodeIntegration:\s*false/);
  assert.match(main, /sandbox:\s*true/);
  assert.match(main, /MCF_WORLD_READY/);
});

test('browser controller emits runtime open and close markers', () => {
  const controller = read('electron/browser-controller.mjs');
  assert.match(controller, /MCF_BROWSER_OPENED/);
  assert.match(controller, /MCF_BROWSER_CLOSED/);
});

test('launch script targets the active XFCE X11 session and detaches cleanly', () => {
  const launch = read('scripts/launch-x11.sh');
  assert.match(launch, /DISPLAY=:0/);
  assert.match(launch, /XDG_RUNTIME_DIR=\/run\/user\/1000/);
  assert.match(launch, /DBUS_SESSION_BUS_ADDRESS=unix:path=\/run\/user\/1000\/bus/);
  assert.match(launch, /v22\.23\.2\/bin/);
  assert.match(launch, /export PATH=/);
  assert.match(launch, /nohup npm start/);
});

test('shell HTML exposes the world and browser toolbar controls', () => {
  const html = read('index.html');
  for (const id of ['stage','browserToolbar','worldBack','navBack','navForward','navReload','address','go','createLocal']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
});

test('development smoke hook can exercise browser open and close without shipping enabled', () => {
  const main = read('electron/main.mjs');
  assert.match(main, /MCF_WORLD_SMOKE_BROWSER/);
  assert.match(main, /https:\/\/example\.com/);
  assert.match(main, /browserController\.open/);
  assert.match(main, /browserController\.close/);
});
