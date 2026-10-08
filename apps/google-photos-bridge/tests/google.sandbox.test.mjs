import test from 'node:test';
import assert from 'node:assert/strict';
import { GooglePhotosClient, PICKER_SCOPE } from '../src/google.mjs';
import { EphemeralStore } from '../src/store.mjs';

function connectedClient(token = { access_token: 'access', expires_at: Math.floor(Date.now()/1000)+3600, refresh_token: 'refresh' }) {
  const store = new EphemeralStore();
  const connectionId = store.createConnection();
  store.saveToken(connectionId, token);
  const client = new GooglePhotosClient({ clientId:'cid', clientSecret:'secret', redirectUri:'https://example.test/oauth/google/callback', store });
  return { store, connectionId, client };
}

test('authorization URL uses Picker readonly scope and offline consent', () => {
  const { client } = connectedClient();
  const url = new URL(client.authorizationUrl('state123'));
  assert.equal(url.origin, 'https://accounts.google.com');
  assert.equal(url.searchParams.get('scope'), PICKER_SCOPE);
  assert.equal(url.searchParams.get('access_type'), 'offline');
  assert.equal(url.searchParams.get('prompt'), 'consent');
  assert.equal(url.searchParams.get('state'), 'state123');
});

test('createSession clamps max items and sends int64 JSON string', async () => {
  const { client, connectionId, store } = connectedClient();
  const calls=[]; const old=global.fetch;
  global.fetch=async (url, init={}) => {
    calls.push({url:String(url), init});
    return new Response(JSON.stringify({id:'s1',pickerUri:'https://photos.google.com/picker/x',expireTime:'2026-09-18T12:00:00Z',mediaItemsSet:false}),{status:200,headers:{'content-type':'application/json'}});
  };
  try {
    const s=await client.createSession(connectionId, 5000);
    assert.equal(s.id,'s1');
    assert.equal(JSON.parse(calls[0].init.body).pickingConfig.maxItemCount,'2000');
    assert.equal(store.assertSessionOwner(connectionId,'s1').pickerUri,'https://photos.google.com/picker/x');
  } finally { global.fetch=old; }
});

test('listItems paginates with sessionId and pageToken', async () => {
  const { client, connectionId, store } = connectedClient();
  store.saveSession(connectionId,{id:'s1',pickerUri:'https://photos.google.com/picker/x'});
  const urls=[]; const old=global.fetch;
  global.fetch=async (url) => {
    const u=new URL(url); urls.push(u);
    if (!u.searchParams.get('pageToken')) return new Response(JSON.stringify({mediaItems:[{id:'a'}],nextPageToken:'next'}),{status:200});
    return new Response(JSON.stringify({mediaItems:[{id:'b'}]}),{status:200});
  };
  try {
    const items=await client.listItems(connectionId,'s1');
    assert.deepEqual(items.map(x=>x.id),['a','b']);
    assert.equal(urls[0].searchParams.get('sessionId'),'s1');
    assert.equal(urls[1].searchParams.get('pageToken'),'next');
  } finally { global.fetch=old; }
});

test('getImageBytes only fetches a selected photo and sends bearer token', async () => {
  const { client, connectionId, store } = connectedClient();
  store.saveSession(connectionId,{id:'s1',pickerUri:'https://photos.google.com/picker/x'});
  const calls=[]; const old=global.fetch;
  global.fetch=async (url, init={}) => {
    calls.push({url:String(url),init});
    if (String(url).startsWith('https://photospicker.googleapis.com/v1/mediaItems')) {
      return new Response(JSON.stringify({mediaItems:[{id:'img1',type:'PHOTO',mediaFile:{baseUrl:'https://lh3.googleusercontent.com/example',mimeType:'image/jpeg',filename:'me.jpg'}}]}),{status:200});
    }
    return new Response(Uint8Array.from([1,2,3,4]),{status:200,headers:{'content-type':'image/jpeg'}});
  };
  try {
    const out=await client.getImageBytes(connectionId,'s1','img1',800,600);
    assert.equal(out.filename,'me.jpg');
    assert.equal(out.bytes.length,4);
    assert.equal(calls[1].url,'https://lh3.googleusercontent.com/example=w800-h600');
    assert.equal(calls[1].init.headers.Authorization,'Bearer access');
  } finally { global.fetch=old; }
});

test('disconnect revokes refresh token and clears connection plus sessions', async () => {
  const { client, connectionId, store } = connectedClient();
  store.saveSession(connectionId,{id:'s1',pickerUri:'https://photos.google.com/picker/x'});
  const old=global.fetch; let body='';
  global.fetch=async (_url, init={}) => { body=String(init.body); return new Response('',{status:200}); };
  try {
    assert.equal(await client.disconnect(connectionId),true);
    assert.match(body,/token=refresh/);
    assert.equal(store.connection(connectionId),null);
    assert.throws(()=>store.assertSessionOwner(connectionId,'s1'));
  } finally { global.fetch=old; }
});
