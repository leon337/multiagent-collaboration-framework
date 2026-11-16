import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('./pet-conversation.js', import.meta.url),'utf8');
function element(){
  const callbacks=new Map();
  const kids=[];
  return {
    style:{}, dataset:{}, children:kids, value:'', checked:false, hidden:false,
    disabled:false, textContent:'', className:'',
    addEventListener(type,fn){callbacks.set(type,fn)},
    event(type,evt={}){return callbacks.get(type)?.(evt)},
    appendChild(node){kids.push(node)},
    removeChild(node){const index=kids.indexOf(node);if(index>=0)kids.splice(index,1)},
    focus(){}, pause(){}, load(){}, scrollTop:0, scrollHeight:0,
    removeAttribute(){}, setAttribute(){},
  };
}
function json(status, obj){
  return {
    status,ok:status>=200&&status<300,
    async json(){return structuredClone(obj)},
    clone(){return json(status,obj)},
    headers:{get(){return 'application/json'}},
  };
}
async function waitUntil(condition){
  for(let i=0;i<150;i++){
    if(condition())return;
    await new Promise(resolve=>setImmediate(resolve));
  }
  throw Error('Timed out waiting for mocked DOM event');
}
async function harness(failure='INVALID_SESSION'){
  let countSession=0, countStt=0, countChat=0, countState=0;
  let clock=1731800000000;
  const seen=[];
  const els=new Map();
  const get=id=>{
    if(!els.has(id))els.set(id,element());
    return els.get(id);
  };
  get('petTalkSpeak').checked=false;
  const fetch=async (url,options={})=>{
    const resource=String(url);
    seen.push({resource,options});
    if(resource.endsWith('/session')){
      countSession++;
      return json(200,{ok:true,csrf:'csrf-value-'+'x'.repeat(27)+countSession,expires_in:3600});
    }
    if(resource.endsWith('/status'))return json(200,{chat_configured:true});
    if(resource.endsWith('/state')){
      countState++;
      return json(200,{ok:true});
    }
    if(resource.endsWith('/stt')){
      countStt++;
      if((countStt===1 || (countStt===2 && failure==='PERSISTENT_INVALID_SESSION')) && (failure==='INVALID_SESSION'||failure==='ORIGIN_FORBIDDEN'||failure==='PERSISTENT_INVALID_SESSION')){
        const name=failure==='PERSISTENT_INVALID_SESSION'?'INVALID_SESSION':failure;
        return json(403,{ok:false,error:name,message:'Sessão inválida.'});
      }
      if(failure==='NETWORK_ERROR')throw Error('offline');
      return json(200,{ok:true,text:'teste de gravação em português'});
    }
    if(resource.endsWith('/chat')){
      countChat++;
      return json(200,{ok:true,reply:'Resposta do MESTRE.',source:'MESTRE_AGENT_CHAT'});
    }
    throw Error('Unexpected URL '+resource);
  };
  class FakeRecorder{
    static isTypeSupported(x){return x.startsWith('audio/webm')}
    constructor(){this.mimeType='audio/webm';this.state='inactive'}
    start(){this.state='recording'}
    stop(){
      this.state='inactive';
      this.ondataavailable?.({data:new Blob([new Uint8Array(2100)])});
      this.onstop?.();
    }
  }
  const scope={
    document:{getElementById:get,createElement:()=>element()},
    window:{addEventListener(){}},
    navigator:{mediaDevices:{getUserMedia:async()=>({getTracks:()=>[{stop(){}}]})}},
    MediaRecorder:FakeRecorder,
    Blob,fetch,URL,Date:{now:()=>clock},crypto:{randomUUID:()=> 'acb73987-536a-4f88-9a6f-7033c6cce801'},
    console,
    setTimeout:()=> 123,clearTimeout(){},
    AbortController,structuredClone,
  };
  vm.runInNewContext(source,scope,{timeout:1000});
  await waitUntil(()=>scope.window.McfPetAuth.getCsrf().length>0);
  return {
    get,seen,advance(ms){clock+=ms;},
    counters:()=>({sessions:countSession,stt:countStt,chat:countChat,state:countState}),
    async record(){
      get('petTalkMic').event('click');
      await waitUntil(()=>get('petTalkMic').textContent.includes('Parar'));
      get('petTalkMic').event('click');
      await waitUntil(()=>countStt>0);
      await waitUntil(()=>{
        const label=get('petTalkStatus').textContent;
        return label.includes('Conversa concluída')||label.includes('Falha na transcrição')||label.includes('Resposta recebida');
      });
    },
  };
}

test('403 INVALID_SESSION renews csrf then retries same microphone blob only once',async()=>{
  const h=await harness('INVALID_SESSION');
  await h.record();
  const c=h.counters();
  assert.equal(c.sessions,2);
  assert.equal(c.stt,2);
  assert.equal(c.chat,1);
  const stts=h.seen.filter(x=>x.resource.endsWith('/stt'));
  assert.strictEqual(stts[0].options.body,stts[1].options.body);
  assert.notEqual(stts[0].options.headers['X-MCF-Pet-CSRF'],
                  stts[1].options.headers['X-MCF-Pet-CSRF']);
  assert.equal(h.get('petTalkStatus').dataset.level,'info');
});

test('authorization not renewed for ORIGIN_FORBIDDEN',async()=>{
  const h=await harness('ORIGIN_FORBIDDEN');
  await h.record();
  const c=h.counters();
  assert.equal(c.sessions,1);
  assert.equal(c.stt,1);
  assert.equal(c.chat,0);
  assert.equal(h.get('petTalkStatus').dataset.level,'error');
});

test('persistent INVALID_SESSION gets at most one retry',async()=>{
  const h=await harness('PERSISTENT_INVALID_SESSION');
  await h.record();
  const c=h.counters();
  assert.equal(c.sessions,2);
  assert.equal(c.stt,2);
  assert.equal(c.chat,0);
  assert.equal(h.get('petTalkStatus').dataset.level,'error');
});

test('network failure never repeats audio upload',async()=>{
  const h=await harness('NETWORK_ERROR');
  await h.record();
  const c=h.counters();
  assert.equal(c.sessions,1);
  assert.equal(c.stt,1);
  assert.equal(c.chat,0);
  assert.equal(h.get('petTalkStatus').dataset.level,'error');
});

test('idle page renews token proactively before its one-hour expiration',async()=>{
  const h=await harness(null);
  h.advance(3_590_000);
  await h.record();
  const c=h.counters();
  assert.equal(c.sessions,2);
  assert.equal(c.stt,1);
  assert.equal(c.chat,1);
  assert.equal(h.get('petTalkStatus').dataset.level,'info');
});
