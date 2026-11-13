import { test } from 'node:test';
import { connect } from 'node:net';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { authorizeDesktop } from '../src/oauth.mjs';
import { loadOauthTokens } from '../src/bridge.mjs';

test('OAuth Desktop PKCE checks state and encrypts mock token',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'mcf-oauth-e2e-'));
  const previous={
    stateDir:process.env.MCF_GOOGLE_BRIDGE_STATE_DIR,
    client:process.env.GOOGLE_OAUTH_CLIENT_ID,
    secret:process.env.GOOGLE_OAUTH_CLIENT_SECRET
  };
  process.env.MCF_GOOGLE_BRIDGE_STATE_DIR=dir;
  process.env.GOOGLE_OAUTH_CLIENT_ID='fake-client-id-for-test';
  delete process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const realFetch=globalThis.fetch;
  let exchangeCount=0;
  globalThis.fetch=async (url,options)=>{
    if(url==='https://oauth2.googleapis.com/token') {
      exchangeCount++;
      assert.equal(options.body.get('code'),'test-auth-code');
      assert.ok(options.body.get('code_verifier')?.length>=43);
      return Response.json({refresh_token:'fake-refresh-test',access_token:'fake-access-test',expires_in:3600});
    }
    return realFetch(url,options);
  };
  let publishUrl;
  const linkReady=new Promise(resolve=>publishUrl=resolve);
  const output={write(text){
    const line=text.trim().split('\n').at(-1);
    publishUrl(line);
  }};
  try {
    const pending=authorizeDesktop({out:output,timeoutMs:7000});
    const url=new URL(await linkReady);
    assert.equal(url.searchParams.get('code_challenge_method'),'S256');
    const callback=new URL(url.searchParams.get('redirect_uri'));
    const malformedResponse=await new Promise((resolve,reject)=>{
      const socket=connect({host:'127.0.0.1',port:Number(callback.port)});
      let received='';
      socket.on('connect',()=>socket.write('GET //[ HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n'));
      socket.on('data',bytes=>received+=bytes.toString('latin1'));
      socket.on('end',()=>resolve(received));
      socket.on('error',reject);
    });
    assert.match(malformedResponse,/HTTP\/1\.1 400/);
    callback.searchParams.set('state','invalid');
    callback.searchParams.set('code','test-auth-code');
    const bad=await realFetch(callback);
    assert.equal(bad.status,400);
    callback.searchParams.set('state',url.searchParams.get('state'));
    const good=await realFetch(callback);
    assert.equal(good.status,200);
    assert.equal((await pending).connected,true);
    assert.equal(exchangeCount,1);
    assert.equal((await loadOauthTokens()).refresh_token,'fake-refresh-test');
  } finally {
    globalThis.fetch=realFetch;
    if(previous.stateDir===undefined) delete process.env.MCF_GOOGLE_BRIDGE_STATE_DIR;
    else process.env.MCF_GOOGLE_BRIDGE_STATE_DIR=previous.stateDir;
    if(previous.client===undefined) delete process.env.GOOGLE_OAUTH_CLIENT_ID;
    else process.env.GOOGLE_OAUTH_CLIENT_ID=previous.client;
    if(previous.secret===undefined) delete process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    else process.env.GOOGLE_OAUTH_CLIENT_SECRET=previous.secret;
    await rm(dir,{recursive:true,force:true});
  }
});
