import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';

mkdirSync('out',{recursive:true});

const run=(label,args)=>{
  const started=performance.now();
  execFileSync('pnpm',['exec','remotion',...args],{stdio:'inherit'});
  return {label,durationMs:Math.round(performance.now()-started)};
};

const results=[
  run('pilot-still',['still','src/remotion/index.ts','RuntimeAgenticoPilot','out/benchmark-pilot.png','--frame=900']),
  run('portrait-still',['still','src/remotion/index.ts','BounceHeadlinePreviewPortrait','out/benchmark-portrait.png','--frame=45']),
];

const report={
  generatedAt:new Date().toISOString(),
  node:process.version,
  results,
  note:'CI/runtime measurements are environment-specific and must not be treated as universal performance claims.'
};

writeFileSync('out/benchmark.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
