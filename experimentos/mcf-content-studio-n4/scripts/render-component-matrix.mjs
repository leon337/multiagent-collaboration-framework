import {execFileSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';

const registry=JSON.parse(readFileSync(new URL('../registry/registry.json',import.meta.url),'utf8'));
mkdirSync('out/component-matrix',{recursive:true});

const results=[];
const run=(componentId,composition,label,props)=>{
  const output=`out/component-matrix/${componentId}-${label}.png`;
  const started=Date.now();
  execFileSync('pnpm',[
    'exec','remotion','still','src/remotion/index.ts',composition,output,
    '--frame=75','--props',JSON.stringify(props),
  ],{stdio:'inherit'});
  results.push({componentId,label,output,durationMs:Date.now()-started});
};

for(const component of registry.components){
  run(component.id,'RegistryComponentQaPortrait','portrait',{componentId:component.id,reducedMotion:false});
  run(component.id,'RegistryComponentQaLandscape','landscape',{componentId:component.id,reducedMotion:false});
  if(component.reducedMotion==='supported'){
    run(component.id,'RegistryComponentQaPortrait','reduced-motion',{componentId:component.id,reducedMotion:true});
  }
}

const report={
  generatedAt:new Date().toISOString(),
  componentCount:registry.components.length,
  renderCount:results.length,
  results,
};
writeFileSync('out/component-matrix.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
