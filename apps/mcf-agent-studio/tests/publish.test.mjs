import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPublisher, updateProfile } from '../publisher.mjs';
import { apply } from '../dsh-plugin-v2.mjs';

const oldProfile=[
  "- id: example",
  "  name: '@deepseek-ai/example'",
  '# MCF/Hello World: preset nativo personalizado (reversivel, somente Web).',
  '- insert:',
  '    - id: preset-hello-world-agent',
  "      name: '@deepseek-ai/dsh-agent-preset'",
  '      config:',
  '        id: hello-world-agent',
  '        plugins:',
  '          - id: hello-world-agent',
  "            name: 'file:///home/leo/.../index.js'",
  '            config:',
  "              response: 'Hello World!'",
  '              disableTools: true',''
].join('\n');
const configured={name:'Hello World Agent',mode:'fixed',response:'Bom dia do DSH!',instructions:'Responder apenas à solicitação.',tools:[]};
test('publisher real writes exactly permitted preset; conflict, backup and rollback',async t=>{
  const root=await mkdtemp(join(tmpdir(),'mcf-publish-'));
  t.after(()=>rm(root,{force:true,recursive:true}));
  const file=join(root,'cordis.patch.yml'),store=join(root,'state');
  await mkdir(store);await writeFile(file,oldProfile);
  let rev=2;
  const pub=createPublisher({profile:file,store,getDraft:()=>({revision:rev,current:configured})});
  const planned=await pub.plan();
  assert.equal(planned.preview.response,'Bom dia do DSH!');
  await assert.rejects(()=>pub.publish(planned.id,'bad'),{status:403});
  assert.equal(await readFile(file,'utf8'),oldProfile);
  const applied=await pub.publish(planned.id,'PUBLICAR HELLO WORLD');
  assert.equal(applied.written,true);
  const written=await readFile(file,'utf8');
  assert.match(written,/Bom dia do DSH!/);
  assert.match(written,/dsh-plugin-v2\.mjs/);
  assert.match(written,/id: example/);
  assert.equal((await pub.status()).effective,true);
  rev++; configured.response='Outro teste';
  const second=await pub.plan();
  await writeFile(file,written+'\n# external mutation\n');
  await assert.rejects(()=>pub.publish(second.id,'PUBLICAR HELLO WORLD'),{status:409});
  await assert.rejects(()=>pub.rollback('REVERTER HELLO WORLD'),{status:409});
  await writeFile(file,written);
  assert.equal((await pub.rollback('REVERTER HELLO WORLD')).restored,true);
  assert.equal(await readFile(file,'utf8'),oldProfile);
  assert.equal((await pub.status()).managed,false);
  assert.equal((await pub.status()).effective,false, 'rollback must not be reported as the published draft');
  const replacement=updateProfile(oldProfile,configured);
  assert.ok(replacement.includes('Outro teste'));
  assert.throws(()=>updateProfile(oldProfile.replace('preset-hello-world-agent','not-registered'),configured),{status:409});
});

test('real Cordis adapter scopes tools and constructs prompt modes',async()=>{
  const recorded=[];
  const ctx={
    systemPrompt:{getSectionOrder:()=>100,section:x=>{recorded.push({kind:'prompt',...x});return()=>{}}},
    tools:{restrict:x=>{recorded.push({kind:'restrict',...x});return()=>{}},
      register:x=>{recorded.push({kind:'tool',tool:x});return()=>{}},guard:x=>{recorded.push({kind:'guard',guard:x});return()=>{}}},
    effect:(fn)=>fn()
  };
  apply(ctx,{mode:'fixed',response:'Bom dia real!',allowedTools:['calculator','clock']});
  const prompt=recorded.find(x=>x.kind==='prompt');
  assert.match(prompt.text,/Bom dia real!/);
  assert.equal(prompt.complete,true);
  assert.equal(typeof recorded.find(x=>x.kind==='guard').guard,'function');
  const calc=recorded.find(x=>x.kind==='tool'&&x.tool.name==='agent_studio_calculator').tool;
  const clock=recorded.find(x=>x.kind==='tool'&&x.tool.name==='agent_studio_clock').tool;
  assert.ok(calc);assert.ok(clock);
  assert.equal(typeof clock.execute,'function');
  assert.equal(typeof calc.execute,'function');
  assert.equal(await calc.execute({expression:'(8+7)*2'}),'30');
  const recorded2=[];
  const ctx2={...ctx,systemPrompt:{...ctx.systemPrompt,section:x=>{recorded2.push(x);return()=>{}}}};
  apply(ctx2,{mode:'echo',allowedTools:[]});
  assert.match(recorded2[0].text,/echo agent/);
});
