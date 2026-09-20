import fs from 'node:fs';
const root=process.cwd();
const checks=[
  ['review route','app/review/page.tsx',/getReviewBatches/],
  ['review supersession','lib/content-view.ts',/latestByMission/],
  ['natural output ordering','lib/content-view.ts',/outputPriority/],
  ['factory run consolidation','lib/content-view.ts',/factoryRunKey/],
  ['library route','app/library/page.tsx',/getContentFamilies/],
  ['queue metric','app/page.tsx',/queueCount/],
  ['overview','app/page.tsx',/Review Queue|Revis[aã]o/],
  ['factory truthfulness','app/factory-runs/page.tsx',/stage\.state/],
  ['watch version history','app/videos/[slug]/page.tsx',/getVersionHistory/],
  ['mobile navigation fit','app/globals.css',/justify-content:space-between;gap:2px;overflow-x:visible/],
];
let failed=false;
for(const [name,file,pattern] of checks){const text=fs.readFileSync(`${root}/${file}`,'utf8');const ok=pattern.test(text);console.log(`${ok?'PASS':'FAIL'} ${name}`);failed ||= !ok;}
const factory=fs.readFileSync(`${root}/app/factory-runs/page.tsx`,'utf8');
if(/index\s*<\s*4/.test(factory)){console.log('FAIL hard-coded factory pipeline state');failed=true;}else console.log('PASS no hard-coded factory pipeline state');
if(failed) process.exit(1);
