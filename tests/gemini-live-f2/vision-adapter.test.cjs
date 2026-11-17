'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const router=require('../../apps/gemini-live-studio/capability-router.cjs');
const vision=require('../../apps/gemini-live-studio/vision-adapter.cjs');
const PNG=Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),Buffer.alloc(70,6)]);
const MP4=Buffer.from('000000186674797069736f6d0000020069736f6d6d703431','hex');
const makePayload=(kind='image')=>({consent:true,kind,model:'gemini-3.5-flash',
 mimeType:kind==='image'?'image/png':'video/mp4',
 prompt:'Descreva o arquivo em português do Brasil.',base64:(kind==='image'?PNG:MP4).toString('base64')});
const successful=(data,headers={})=>({ok:true,status:200,headers:{get:k=>headers[k.toLowerCase()]||null},json:async()=>data});
function mockGoogle({badGenerationStatus=0,badUploadUrl=false,deleteFails=false,processing=false,invalidFileUri=false,finalizeFails=false}={}){
 const calls=[];
 async function fetchFn(url,options={}){
  const u=String(url),method=options.method||'GET';
  calls.push({url:u,method,headers:options.headers,body:options.body,redirect:options.redirect});
  if(u.includes('/models?pageSize='))return successful({models:[
   {name:'models/gemini-3.5-flash',supportedGenerationMethods:['generateContent'],inputTokenLimit:9000},
   {name:'models/gemini-3.8-live',supportedGenerationMethods:['bidiGenerateContent']},
   {name:'models/unrelated',supportedGenerationMethods:['generateContent']}
  ]});
  if(u.endsWith('/upload/v1beta/files')&&method==='POST')
   return successful({}, {'x-goog-upload-url':badUploadUrl?'https://example.org/evil':'https://generativelanguage.googleapis.com/upload/finalize?id=1'});
  if(u.includes('/upload/finalize')&&method==='POST')
   return finalizeFails?{ok:false,status:503}:successful({file:{name:'files/abc123',uri:invalidFileUri?'https://attacker.invalid/media':'https://generativelanguage.googleapis.com/v1beta/files/abc123',state:processing?'PROCESSING':'ACTIVE'}});
  if(u.includes('/v1beta/files/abc123')&&method==='GET')return successful({name:'files/abc123',state:'ACTIVE'});
  if(u.includes('/v1beta/files/abc123')&&method==='DELETE')
   return deleteFails?{ok:false,status:500}:successful({});
  if(u.includes(':generateContent')){
   if(badGenerationStatus)return {ok:false,status:badGenerationStatus,json:async()=>({})};
   return successful({candidates:[{content:{parts:[{text:'Análise visual de teste.'}]},finishReason:'STOP'}],
    usageMetadata:{totalTokenCount:89}});
  }
  throw Error('unexpected provider route '+method+' '+u.split('?')[0]);
 }
 return {calls,fetchFn};
}
test('catalog only certifies generateContent, not vision or quota',async()=>{
 const m=mockGoogle();
 const c=await router.fetchCatalog('secret',{fetchFn:m.fetchFn});
 assert.deepEqual(c.map(x=>x.id),['gemini-3.5-flash']);
 assert.equal(c[0].imageVerified,false);assert.equal(c[0].videoVerified,false);
 assert.equal(c[0].methodVerified,true);
});
test('router rejects unknown models and never performs fallback',()=>{
 const catalog=router.sanitizeCatalog([{name:'models/gemini-3.5-flash',supportedGenerationMethods:['generateContent']}]);
 assert.throws(()=>router.route({model:'gemini-unlisted',kind:'image',catalog}),/não verificado/);
 const r=router.route({model:'gemini-3.5-flash',kind:'video',catalog});
 assert.equal(r.automaticFallback,false);assert.equal(r.costVerified,false);
});
test('images cannot be sent without explicit consent',()=>{
 assert.throws(()=>vision.validatePayload({...makePayload(),consent:false}),/Confirme/);
});
test('magic bytes and mime types must agree',()=>{
 assert.throws(()=>vision.validatePayload({...makePayload(),mimeType:'video/mp4',kind:'video'}),/Assinatura/);
 assert.throws(()=>vision.validatePayload({...makePayload(),mimeType:'image/svg+xml'}),/não permitido/);
});
test('base64 padding and size cannot be bypassed',()=>{
 assert.throws(()=>vision.validatePayload({...makePayload(),base64:'_'.repeat(200)}),/inválido/);
 assert.throws(()=>vision.validatePayload({...makePayload(),base64:'A'.repeat(12*1024*1024)}),/limite/);
});
test('image uses inlineData without Files API and returns trace ID',async()=>{
 const m=mockGoogle();
 const r=await vision.makeVisionAdapter({fetchFn:m.fetchFn}).analyze(makePayload(),'secret');
 assert.equal(r.kind,'image');assert.equal(r.content,'Análise visual de teste.');
 assert.equal(r.usage.totalTokens,89);assert.equal(r.autoFallback,false);
 assert.match(r.traceId,/^[0-9a-f-]{36}$/);
 const gen=m.calls.find(x=>x.url.includes(':generateContent'));
 const payload=JSON.parse(gen.body);
 assert.equal(payload.contents[0].parts[1].inlineData.mimeType,'image/png');
 assert.equal(payload.contents[0].parts[1].inlineData.data,PNG.toString('base64'));
 assert.equal(m.calls.some(x=>x.url.includes('/upload/v1beta/files')),false);
 assert.equal(r.rawMediaRetainedLocally,false);
});
test('video uses resumable Files API and always deletes remote file',async()=>{
 const m=mockGoogle();
 const r=await vision.makeVisionAdapter({fetchFn:m.fetchFn}).analyze(makePayload('video'),'secret');
 assert.equal(r.kind,'video');assert.equal(r.uploadedToGoogleFiles,true);
 assert.equal(r.remoteFileDeleted,true);
 const start=m.calls.find(x=>x.url.endsWith('/upload/v1beta/files'));
 const send=m.calls.find(x=>x.url.includes('/upload/finalize'));
 const gen=m.calls.find(x=>x.url.includes(':generateContent'));
 const remove=m.calls.find(x=>x.method==='DELETE');
 assert.equal(start.headers['X-Goog-Upload-Protocol'],'resumable');
 assert.equal(send.headers['X-Goog-Upload-Command'],'upload, finalize');
 assert.equal(JSON.parse(gen.body).contents[0].parts[1].fileData.fileUri,'https://generativelanguage.googleapis.com/v1beta/files/abc123');
 assert.ok(remove);
});
test('failure to generate still executes remote delete',async()=>{
 const m=mockGoogle({badGenerationStatus:429});
 await assert.rejects(()=>vision.makeVisionAdapter({fetchFn:m.fetchFn}).analyze(makePayload('video'),'secret'),e=>e.status===429);
 assert.ok(m.calls.some(x=>x.method==='DELETE'));
});
test('provider deletion failure is returned as caveat, not a false claim',async()=>{
 const m=mockGoogle({deleteFails:true});
 const r=await vision.makeVisionAdapter({fetchFn:m.fetchFn}).analyze(makePayload('video'),'secret');
 assert.equal(r.remoteFileDeleted,false);
});
test('upload URL from foreign host is blocked before raw media egress',async()=>{
 const m=mockGoogle({badUploadUrl:true});
 await assert.rejects(()=>vision.makeVisionAdapter({fetchFn:m.fetchFn}).analyze(makePayload('video'),'secret'),/não confiável/);
 assert.ok(!m.calls.some(x=>x.url.startsWith('https://example.org')));
});
test('processing video polls until ACTIVE',async()=>{
 const m=mockGoogle({processing:true});
 const r=await vision.makeVisionAdapter({fetchFn:m.fetchFn}).analyze(makePayload('video'),'secret');
 assert.equal(r.kind,'video');
 assert.ok(m.calls.some(x=>x.method==='GET'&&x.url.endsWith('files/abc123')));
});
test('video reports unavailable model instead of substituting another',async()=>{
 const m=mockGoogle();
 const req={...makePayload('video'),model:'gemini-3.8-live'};
 await assert.rejects(()=>vision.makeVisionAdapter({fetchFn:m.fetchFn}).analyze(req,'secret'),/não verificado/);
 assert.ok(!m.calls.some(x=>x.url.includes(':generateContent')));
});
test('no base64/media bodies in output metadata',async()=>{
 const m=mockGoogle();
 const r=await vision.makeVisionAdapter({fetchFn:m.fetchFn}).analyze(makePayload(),'secret');
 assert.ok(!JSON.stringify(r).includes(PNG.toString('base64')));
 assert.ok(!JSON.stringify(r).includes('secret'));
});

test('all requests to Google fail closed on HTTP redirects',async()=>{
 const m=mockGoogle();
 await vision.makeVisionAdapter({fetchFn:m.fetchFn}).analyze(makePayload('video'),'secret');
 const requests=m.calls.filter(c=>c.url.startsWith('https://generativelanguage.googleapis.com/'));
 assert.ok(requests.length>=5);
 assert.ok(requests.every(x=>x.headers&&x.headers['x-goog-api-key']==='secret'));
 assert.ok(requests.every(x=>x.redirect==='error'));
});
test('video invalid file URI with valid name must delete remote file',async()=>{
 const m=mockGoogle({invalidFileUri:true});
 await assert.rejects(()=>vision.makeVisionAdapter({fetchFn:m.fetchFn}).analyze(makePayload('video'),'secret'),/URI inválida/);
 assert.equal(m.calls.some(x=>x.method==='DELETE'),true);
});
test('failed generation and failed delete must disclose cleanup uncertainty',async()=>{
 const m=mockGoogle({badGenerationStatus:429,deleteFails:true});
 await assert.rejects(()=>vision.makeVisionAdapter({fetchFn:m.fetchFn}).analyze(makePayload('video'),'secret'),
  e=>e.status===429&&e.message.includes('não confirmada'));
});
test('ambiguous finalize error warns remote retention is unknown',async()=>{
 const m=mockGoogle({finalizeFails:true});
 await assert.rejects(()=>vision.makeVisionAdapter({fetchFn:m.fetchFn}).analyze(makePayload('video'),'secret'),
  /sem exclusão confirmada/);
});
