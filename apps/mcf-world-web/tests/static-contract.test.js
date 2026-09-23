import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const appRoot = new URL('../', import.meta.url);

async function readAppFile(path) {
  return readFile(new URL(path, appRoot), 'utf8');
}

test('hosted shell pins Three.js and exposes world recovery controls', async () => {
  const indexHtml = await readAppFile('index.html');

  assert.match(indexHtml, /type="importmap"/);
  assert.match(indexHtml, /three@0\.180\.0/);
  assert.match(indexHtml, /id="webgl-error"/);
  assert.match(indexHtml, /id="browser-surface"/);
  assert.match(indexHtml, /id="return-to-world"/);
});

test('Browser Surface keeps sandbox and safe external-tab behavior', async () => {
  const browserSurface = await readAppFile('src/browser-surface.js');
  const indexHtml = await readAppFile('index.html');

  assert.match(indexHtml, /sandbox="allow-forms allow-scripts allow-same-origin allow-popups"/);
  assert.match(browserSurface, /noopener,noreferrer/);
  assert.match(browserSurface, /normalizeHttpUrl/);
});

test('world input supports keyboard movement on desktop browsers', async () => {
  const mainJs = await readAppFile('src/main.js');

  assert.match(mainJs, /ArrowUp/);
  assert.match(mainJs, /KeyW/);
  assert.match(mainJs, /movementVector/);
});

test('WebGL adapter exposes a readable initialization failure path', async () => {
  const threeScene = await readAppFile('src/three-scene.js');

  assert.match(threeScene, /onWebglError/);
  assert.match(threeScene, /WebGLRenderer/);
});
