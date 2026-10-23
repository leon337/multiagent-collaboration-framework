
import { readFile, writeFile, mkdir, rename, lstat } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const PLUGIN = join(dirname(fileURLToPath(import.meta.url)), 'dsh-plugin-v2.mjs');
const TAGS = ['# MCF/Hello World:', '# MCF Agent Studio managed:'];
const ROW = 'preset-hello-world-agent';
const hash=v=>createHash('sha256').update(v).digest('hex');
function fail(message,status=400){const e=new Error(message);e.status=status;throw e}
export function managedBlock(c) {
  const fields=[
    '# MCF Agent Studio managed: preset hello-world-agent, reversivel',
    '- insert:',
    '    - id: '+ROW,
    "      name: '@deepseek-ai/dsh-agent-preset'",
    '      config:',
    '        id: hello-world-agent',
    '        name: '+JSON.stringify(c.name),
    '        description: "MCF Agent Studio - preset gerenciado"',
    '        order: 10',
    '        plugins:',
    '          - id: hello-world-agent',
    '            name: '+JSON.stringify(pathToFileURL(PLUGIN).href),
    '            config:',
    '              mode: '+JSON.stringify(c.mode),
    '              response: '+JSON.stringify(c.response),
    '              instructions: '+JSON.stringify(c.instructions),
    '              allowedTools: '+JSON.stringify(c.tools)
  ];
  return fields.join('\n')+'\n';
}
export function updateProfile(source,config) {
  if(source.split(ROW).length!==2)fail('Preset duplicado ou ausente no perfil',409);
  const marks=TAGS.map(x=>source.indexOf(x)).filter(n=>n>=0);
  if(marks.length!==1)fail('Marcador original ausente ou ambiguo',409);
  const start=marks[0],rowStart=source.indexOf('- insert:\n',start);
  if(rowStart<start||rowStart>start+140)fail('Estrutura do preset alterada',409);
  const next=source.indexOf('\n- ',rowStart+10);
  const end=next<0?source.length:next+1;
  if(!source.slice(rowStart,end).includes('    - id: '+ROW))fail('Bloco nao corresponde ao preset permitido',409);
  return source.slice(0,start)+managedBlock(config)+source.slice(end).replace(/^\n/,'');
}
export function createPublisher({profile,store,getDraft}) {
  const recordPath=join(store,'publish-record.json');
  const backupDir=join(store,'backups');
  let pending=null,busy=false;
  async function readProfile(){
    let st;
    try{st=await lstat(profile)}catch{fail('Perfil ativo nao encontrado',404)}
    if(!st.isFile()||st.isSymbolicLink())fail('Perfil nao e arquivo regular',409);
    if(st.size>1000000)fail('Perfil excede limite',409);
    return readFile(profile,'utf8');
  }
  async function record(){try{return JSON.parse(await readFile(recordPath,'utf8'))}catch(e){if(e.code==='ENOENT')return null;throw e}}
  async function atomic(file,str){const tmp=file+'.mcf-'+randomUUID()+'.tmp';await writeFile(tmp,str,{mode:0o600,flag:'wx'});await rename(tmp,file)}
  async function exclusive(fn){if(busy)fail('Outra publicacao esta em andamento',409);busy=true;try{return await fn()}finally{busy=false}}
  return {
    async status(){
      const src=await readProfile(),meta=await record(),currentHash=hash(src);
      return {profile,managed:src.includes(TAGS[1]),profileHash:currentHash,
        last:meta?{revision:meta.revision,date:meta.date,publishedHash:meta.publishedHash,
          matchesProfile:meta.publishedHash===currentHash,mode:meta.mode,tools:meta.tools}:null,
        effective:!!meta&&meta.revision!==null&&meta.publishedHash===currentHash};
    },
    async plan(){
      const draft=getDraft(),src=await readProfile(),next=updateProfile(src,draft.current);
      if(next===src)fail('Nenhuma alteracao a publicar',422);
      const id=randomUUID();
      pending={id,profileHash:hash(src),revision:draft.revision,content:next,config:draft.current,expires:Date.now()+180000};
      return {id,revision:draft.revision,expiresAt:new Date(pending.expires).toISOString(),profile,changedPreset:ROW,
        previousSha:pending.profileHash,nextSha:hash(next),requiresConfirmation:true,
        preview:{name:draft.current.name,mode:draft.current.mode,response:draft.current.response,
          instructions:draft.current.instructions,tools:draft.current.tools},backup:true,
        note:'Somente o Hello World do perfil Web. Novas sessoes usam a revisao atualizada.'};
    },
    async publish(id,confirmation){return exclusive(async()=>{
      if(confirmation!=='PUBLICAR HELLO WORLD')fail('Confirmacao de publicacao invalida',403);
      if(!pending||pending.id!==id||Date.now()>pending.expires)fail('Previa expirada',409);
      if(getDraft().revision!==pending.revision)fail('Rascunho alterado; nova previa obrigatoria',409);
      const src=await readProfile();
      if(hash(src)!==pending.profileHash)fail('Perfil alterado externamente; publicacao bloqueada',409);
      await mkdir(backupDir,{recursive:true,mode:0o700});
      const backup=join(backupDir,new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomUUID()+'.yml');
      await writeFile(backup,src,{flag:'wx',mode:0o600});
      const nextHash=hash(pending.content);
      await atomic(profile,pending.content);
      const meta={date:new Date().toISOString(),revision:pending.revision,publishedHash:nextHash,
        previousHash:pending.profileHash,backup,source:PLUGIN,mode:pending.config.mode,tools:pending.config.tools};
      await atomic(recordPath,JSON.stringify(meta,null,2)+'\n');
      pending=null;
      return {written:true,revision:meta.revision,changedPreset:ROW,backup,profileHash:nextHash,
        runtimeVerified:false,note:'Gravado no perfil. Teste em uma NOVA sessao DSH.'};
    })},
    async rollback(confirmation){return exclusive(async()=>{
      if(confirmation!=='REVERTER HELLO WORLD')fail('Confirmacao de reversao invalida',403);
      const meta=await record();if(!meta)fail('Nenhuma publicacao registrada',404);
      const src=await readProfile();
      if(hash(src)!==meta.publishedHash)fail('Perfil alterado apos publicacao; reversao bloqueada',409);
      const previous=await readFile(meta.backup,'utf8');
      if(hash(previous)!==meta.previousHash)fail('Backup nao passou na integridade',409);
      const undoCopy=join(backupDir,'before-rollback-'+randomUUID()+'.yml');
      await writeFile(undoCopy,src,{flag:'wx',mode:0o600});
      await atomic(profile,previous);
      await atomic(recordPath,JSON.stringify({...meta,publishedHash:hash(previous),previousHash:meta.publishedHash,
        backup:undoCopy,date:new Date().toISOString(),revision:null,mode:'restored'},null,2)+'\n');
      pending=null;
      return {restored:true,profileHash:hash(previous),backup:undoCopy,runtimeVerified:false};
    })}
  };
}
