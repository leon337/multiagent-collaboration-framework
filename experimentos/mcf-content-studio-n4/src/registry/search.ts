import registryData from '../../registry/registry.json';
import type {AspectRatio,Complexity} from '../lib/types';

const rank={low:0,medium:1,high:2} as const;

export type ComponentSearchQuery={
  intent?:string;
  tag?:string;
  aspect?:AspectRatio;
  supportsAudioSync?:boolean;
  maxComplexity?:Complexity;
  status?:'APPROVED'|'ADAPTED'|'REVIEWED'|'DISCOVERED'|'DEPRECATED';
};

export const searchComponentManifests=(query:ComponentSearchQuery={})=>
  registryData.components.filter((component)=>{
    if(query.intent&&!component.intents.includes(query.intent)) return false;
    if(query.tag&&!component.tags.includes(query.tag)) return false;
    if(query.aspect&&!component.supportedAspects.includes(query.aspect)) return false;
    if(query.supportsAudioSync!==undefined&&component.supportsAudioSync!==query.supportsAudioSync) return false;
    if(query.maxComplexity&&rank[component.complexity]>rank[query.maxComplexity]) return false;
    if(query.status&&component.status!==query.status) return false;
    return true;
  });
