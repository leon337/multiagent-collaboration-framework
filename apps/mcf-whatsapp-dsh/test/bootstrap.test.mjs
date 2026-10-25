import test from 'node:test';
import assert from 'node:assert/strict';
import { createBootstrapServer } from '../src/bootstrap-webhook.mjs';

test('bootstrap does not accept traffic other than signed setup challenge', async t => {
  const secret = 'a'.repeat(64);
  const server = createBootstrapServer(secret);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const url = 'http://127.0.0.1:' + server.address().port;
  const query = '?hub.mode=subscribe&hub.verify_token=' + secret + '&hub.challenge=12345';
  const first = await fetch(url + '/webhook' + query);
  assert.equal(first.status, 200);
  assert.equal(await first.text(), '12345');
  const mountStripped = await fetch(url + '/' + query);
  assert.equal(mountStripped.status, 200);
  const no = await fetch(url + '/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=12345');
  assert.equal(no.status, 403);
  const unrelated = await fetch(url + '/health');
  assert.equal(unrelated.status, 404);
  const post = await fetch(url + '/webhook', {method:'POST', body:'{}'});
  assert.equal(post.status, 503);
});
test('bootstrap requires cryptographically long challenge secret', () => {
  assert.throws(() => createBootstrapServer('short'), /meta_verify_token_missing/);
});
