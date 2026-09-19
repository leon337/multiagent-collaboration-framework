import {spawn} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';

const registry=JSON.parse(readFileSync(new URL('../registry/registry.json',import.meta.url),'utf8'));
mkdirSync('out/component-matrix',{recursive:true});

const concurrency=Math.max(1,Math.min(4,Number(process.env.MCF_QA_CONCURRENCY||2)));
const jobs=[];
for(const component of registry.components){
  jobs.push({componentId:component.id,composition:'RegistryComponentQaPortrait',label:'portrait',props:{componentId:component.id,reducedMotion:false}});
  jobs.push({componentId:component.id,composition:'RegistryComponentQaLandscape',label:'landscape',props:{componentId:component.id,reducedMotion:false}});
  if(component.reducedMotion==='supported'){
    jobs.push({componentId:component.id,composition:'RegistryComponentQaPortrait',label:'reduced-motion',props:{componentId:component.id,reducedMotion:true}});
  }
}

const results=[];
const run=({componentId,composition,label,props})=>new Promise((resolve,reject)=>{
  const output=`out/component-matrix/${componentId}-${label}.png`;
  const started=Date.now();
  const child=spawn('pnpm',[
    'exec','remotion','still','src/remotion/index.ts',composition,output,
    '--frame=75','--props',JSON.stringify(props),
  ],{stdio:'inherit'});
  child.on('error',reject);
  child.on('exit',(code)=>{
    if(code!==0){reject(new Error(`matrix render failed: ${componentId}/${label} exit=${code}`));return;}
    results.push({componentId,label,output,durationMs:Date.now()-started});
    resolve();
  });
});

let cursor=0;
const worker=async()=>{
  while(true){
    const index=cursor++;
    if(index>=jobs.length)return;
    await run(jobs[index]);
  }
};
await Promise.all(Array.from({length:Math.min(concurrency,jobs.length)},()=>worker()));

results.sort((a,b)=>a.componentId.localeCompare(b.componentId)||a.label.localeCompare(b.label));
const report={
  generatedAt:new Date().toISOString(),
  componentCount:registry.components.length,
  renderCount:results.length,
  concurrency,
  results,
};
writeFileSync('out/component-matrix.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
