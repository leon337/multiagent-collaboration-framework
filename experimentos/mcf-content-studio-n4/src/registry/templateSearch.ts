import registryData from '../../registry/registry.json';
import type {AspectRatio,Complexity} from '../lib/types';

const complexityRank:Record<Complexity,number>={low:0,medium:1,high:2};

export type TemplateIntentQuery={
  text?:string;
  intent?:string;
  tag?:string;
  nodes?:number;
  aspect?:AspectRatio;
  learning?:boolean;
  componentId?:string;
  maxComplexity?:Complexity;
  status?:'APPROVED'|'ADAPTED'|'REVIEWED'|'DISCOVERED'|'DEPRECATED';
};

export const searchTemplates=(query:TemplateIntentQuery={})=>{
  const text=query.text?.trim().toLowerCase();
  return registryData.templates
    .filter((template)=>{
      if(text&&![
        template.id,template.displayName,template.purpose,...template.tags,...template.intents
      ].some((value)=>value.toLowerCase().includes(text))) return false;
      if(query.intent&&!template.intents.includes(query.intent)) return false;
      if(query.tag&&!template.tags.includes(query.tag)) return false;
      if(query.nodes!==undefined&&(query.nodes<template.minNodes||query.nodes>template.maxNodes)) return false;
      if(query.aspect&&!template.supportedAspects.includes(query.aspect)) return false;
      if(query.learning!==undefined&&template.learning!==query.learning) return false;
      if(query.componentId&&!template.componentIds.includes(query.componentId)) return false;
      if(query.maxComplexity&&complexityRank[template.complexity as Complexity]>complexityRank[query.maxComplexity]) return false;
      if(query.status&&template.status!==query.status) return false;
      return true;
    })
    .map((template)=>({
      ...template,
      score:
        (query.intent&&template.intents.includes(query.intent)?4:0)+
        (query.tag&&template.tags.includes(query.tag)?2:0)+
        (query.componentId&&template.componentIds.includes(query.componentId)?2:0)+
        (query.nodes!==undefined?1:0)
    }))
    .sort((a,b)=>b.score-a.score);
};
