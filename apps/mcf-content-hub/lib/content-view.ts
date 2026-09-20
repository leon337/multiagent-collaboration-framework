import type {ContentItem,QaStatus} from './types';

export type StageState='DONE'|'ACTIVE'|'PENDING'|'FAIL';
export type FactoryStage={key:'source'|'render'|'audio'|'qa'|'storage'|'review';label:string;state:StageState};
export type ContentFamily={key:string;latest:ContentItem;versions:ContentItem[]};
export type ReviewBatch={key:string;mission:string;version:string;items:ContentItem[];createdAt:string};
export type FactoryRunView={run:string;items:ContentItem[];createdAt:string;stages:FactoryStage[]};

const time=(item:ContentItem)=>new Date(item.createdAt).getTime();
const versionParts=(value:string)=>value.split('.').map((part)=>Number.parseInt(part,10)||0);
export const compareVersions=(a:string,b:string)=>{const aa=versionParts(a),bb=versionParts(b);for(let i=0;i<Math.max(aa.length,bb.length);i++){const diff=(bb[i]??0)-(aa[i]??0);if(diff) return diff;}return 0;};
export const contentFamilyKey=(item:ContentItem)=>item.slug.replace(/-v\d+(?:-\d+)*$/,'');
const outputPriority=(item:ContentItem)=>item.slug.includes('-engine-')?10:item.slug.includes('-motion-')?20:item.slug.includes('-editor-')?30:item.slug.includes('consolidated')?40:50;
const sortOutputs=(a:ContentItem,b:ContentItem)=>outputPriority(a)-outputPriority(b)||a.title.localeCompare(b.title);

export function getContentFamilies(items:ContentItem[]):ContentFamily[]{
  const groups=new Map<string,ContentItem[]>();
  for(const item of items){const key=contentFamilyKey(item);groups.set(key,[...(groups.get(key)??[]),item]);}
  return [...groups.entries()].map(([key,versions])=>{const sorted=[...versions].sort((a,b)=>compareVersions(a.version,b.version)||time(b)-time(a));return {key,latest:sorted[0],versions:sorted};}).sort((a,b)=>sortOutputs(a.latest,b.latest)||time(b.latest)-time(a.latest));
}

export function getVersionHistory(items:ContentItem[],current:ContentItem){return getContentFamilies(items).find((family)=>family.key===contentFamilyKey(current))?.versions??[current];}

export function getReviewBatches(items:ContentItem[]):ReviewBatch[]{
  const groups=new Map<string,ContentItem[]>();
  for(const item of items.filter((entry)=>entry.status==='REVIEW')){const key=`${item.mission}::${item.version}`;groups.set(key,[...(groups.get(key)??[]),item]);}
  const batches=[...groups.entries()].map(([key,batchItems])=>({key,mission:batchItems[0].mission,version:batchItems[0].version,createdAt:[...batchItems].sort((a,b)=>time(b)-time(a))[0].createdAt,items:[...batchItems].sort(sortOutputs)}));
  const latestByMission=new Map<string,ReviewBatch>();
  for(const batch of batches){
    const current=latestByMission.get(batch.mission);
    const isNewer=!current||compareVersions(batch.version,current.version)<0||(batch.version===current.version&&new Date(batch.createdAt)>new Date(current.createdAt));
    if(isNewer) latestByMission.set(batch.mission,batch);
  }
  return [...latestByMission.values()].sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
}

const allQaPass=(qa:QaStatus)=>Object.values(qa).every((value)=>value==='PASS');
const anyQaFail=(qa:QaStatus)=>Object.values(qa).some((value)=>value==='FAIL');
const anyQaObserved=(qa:QaStatus)=>Object.values(qa).some((value)=>value!=='PENDING');

function deriveStages(items:ContentItem[]):FactoryStage[]{
  const source=items.every((item)=>Boolean(item.mission&&(item.commit||item.issue||item.pr)));
  const render=items.every((item)=>Boolean(item.videoUrl||item.durationSec||item.qa.visual!=='PENDING'));
  const audioFail=items.some((item)=>item.qa.audio==='FAIL');
  const audioDone=items.every((item)=>item.qa.audio==='PASS');
  const qaFail=items.some((item)=>anyQaFail(item.qa));
  const qaDone=items.every((item)=>allQaPass(item.qa));
  const qaActive=!qaDone&&!qaFail&&items.some((item)=>anyQaObserved(item.qa));
  const storage=items.every((item)=>Boolean(item.videoUrl));
  const reviewDone=items.every((item)=>item.status==='APPROVED'||item.status==='PUBLISHED');
  const reviewActive=items.some((item)=>item.status==='REVIEW');
  return [
    {key:'source',label:'source',state:source?'DONE':'PENDING'},
    {key:'render',label:'render',state:render?'DONE':'PENDING'},
    {key:'audio',label:'audio',state:audioFail?'FAIL':audioDone?'DONE':'PENDING'},
    {key:'qa',label:'QA',state:qaFail?'FAIL':qaDone?'DONE':qaActive?'ACTIVE':'PENDING'},
    {key:'storage',label:'storage',state:storage?'DONE':'PENDING'},
    {key:'review',label:'review',state:reviewDone?'DONE':reviewActive?'ACTIVE':'PENDING'},
  ];
}

const factoryRunGroupKey=(run:string)=>run.replace(/-consolidated$/,'');

export function getFactoryRuns(items:ContentItem[]):FactoryRunView[]{
  const groups=new Map<string,ContentItem[]>();
  for(const item of items){const run=factoryRunGroupKey(item.factoryRun??'unassigned');groups.set(run,[...(groups.get(run)??[]),item]);}
  return [...groups.entries()].map(([run,runItems])=>({run,items:[...runItems].sort(sortOutputs),createdAt:[...runItems].sort((a,b)=>time(b)-time(a))[0].createdAt,stages:deriveStages(runItems)})).sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
}
