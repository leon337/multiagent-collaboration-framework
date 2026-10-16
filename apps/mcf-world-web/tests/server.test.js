import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const serverPath = fileURLToPath(new URL('../serve.mjs', import.meta.url));

function startPreviewServer() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [serverPath, '0'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let settled = false;
    let stderr = '';

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        child.kill();
        reject(new Error(`preview server did not start; stderr=${stderr}`));
      }
    }, 5_000);

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      const match = chunk.match(/MCF_WORLD_WEB_URL=(http:\/\/[^\s]+)/);
      if (!settled && match) {
        settled = true;
        clearTimeout(timeout);
        resolve({ child, baseUrl: match[1] });
      }
    });

    child.on('exit', (code) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        reject(
          new Error(`preview server exited before ready with code ${code}; stderr=${stderr}`),
        );
      }
    });
  });
}

test('portable preview server serves HTML and JavaScript with correct content types', async (t) => {
  const { child, baseUrl } = await startPreviewServer();
  t.after(() => child.kill());

  const indexResponse = await fetch(`${baseUrl}/`);
  assert.equal(indexResponse.status, 200);
  assert.match(indexResponse.headers.get('content-type') ?? '', /text\/html/);
  assert.match(await indexResponse.text(), /MCF World 3D/);

  const moduleResponse = await fetch(`${baseUrl}/src/world-domain.js`);
  assert.equal(moduleResponse.status, 200);
  assert.match(
    moduleResponse.headers.get('content-type') ?? '',
    /text\/javascript|application\/javascript/,
  );
});

test('portable preview server blocks path traversal', async (t) => {
  const { child, baseUrl } = await startPreviewServer();
  t.after(() => child.kill());

  const response = await fetch(`${baseUrl}/..%2F..%2FREADME.md`);
  assert.equal(response.status, 403);
});
