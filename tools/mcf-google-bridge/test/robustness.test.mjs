import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { mkdtemp, readdir, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { saveOauthTokens, loadOauthTokens } from '../src/bridge.mjs';
import { readJsonBody } from '../src/http.mjs';

test('token store remains valid during concurrent atomic writes and reads',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'mcf-google-atomic-'));
  const old=process.env.MCF_GOOGLE_BRIDGE_STATE_DIR;
  process.env.MCF_GOOGLE_BRIDGE_STATE_DIR=dir;
  try {
    await saveOauthTokens({refresh_token:'baseline'});
    const writes=Array.from({length:25},(_,i)=>saveOauthTokens({refresh_token:'refresh-'+i,access_token:'token-'+i}));
    const reads=Array.from({length:25},async()=>{
      const tokens=await loadOauthTokens();
      assert.match(tokens.refresh_token,/^(baseline|refresh-\d+)$/);
    });
    await Promise.all([...writes,...reads]);
    const final=await loadOauthTokens();
    assert.match(final.refresh_token,/^refresh-\d+$/);
    const files=await readdir(dir);
    assert.equal(files.filter(f=>f.startsWith('.workspace-tokens-')).length,0);
    assert.equal((await stat(path.join(dir,'workspace-tokens.enc'))).mode&0o077,0);
  } finally {
    if(old===undefined) delete process.env.MCF_GOOGLE_BRIDGE_STATE_DIR;
    else process.env.MCF_GOOGLE_BRIDGE_STATE_DIR=old;
    await rm(dir,{recursive:true,force:true});
  }
});

test('JSON request body keeps Unicode spanning chunk boundaries',async()=>{
  const expected={operation:'google.drive.search',args:{query:'name contains "café"'}};
  const full=Buffer.from(JSON.stringify(expected));
  const mark=full.indexOf(Buffer.from('é'));
  assert.ok(mark>0);
  const chunks=[full.subarray(0,mark+1),full.subarray(mark+1)];
  assert.deepEqual(await readJsonBody(Readable.from(chunks)),expected);
});

test('HTTP request size limit counts actual bytes, not UTF-16 characters',async()=>{
  const over=Buffer.from(JSON.stringify({text:'é'.repeat(9000)}));
  assert.ok(over.length>16000);
  await assert.rejects(readJsonBody(Readable.from([over])),e=>e.code==='PAYLOAD_TOO_LARGE'&&e.status===413);
});

test('committed systemd unit uses stable installed path, not worktree',async()=>{
  const unit=await readFile(new URL('../systemd/mcf-google-bridge.service',import.meta.url),'utf8');
  assert.match(unit,/ExecStart=\/home\/leo\/\.nvm\/versions\/node\/[^ ]+\/bin\/node \/home\/leo\/\.local\/share\/mcf-google-bridge\/src\/http\.mjs/);
  assert.match(unit,/WorkingDirectory=\/home\/leo\/\.local\/share\/mcf-google-bridge/);
  assert.doesNotMatch(unit,/mcf-workspaces/);
});
