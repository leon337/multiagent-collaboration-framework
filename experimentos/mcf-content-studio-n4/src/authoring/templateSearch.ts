import registryData from '../../registry/registry.json';
export type TemplateSearchQuery={text?:string;componentId?:string;aspect?:'9:16'|'16:9';status?:string;intent?:string;tag?:string;type?:string;nodes?:number;learning?:boolean};
export const searchTemplates=(query:TemplateSearchQuery={})=>{
 const text=query.text?.trim().toLowerCase();
 return registryData.templates.filter((template)=>{
  if(text&&!(template.id.toLowerCase().includes(text)||template.displayName.toLowerCase().includes(text)||template.purpose.toLowerCase().includes(text)))return false;
  if(query.componentId&&!template.componentIds.includes(query.componentId))return false;
  if(query.aspect&&!template.supportedAspects.includes(query.aspect))return false;
  if(query.status&&template.status!==query.status)return false;
  if(query.type&&!template.types.includes(query.type))return false;
  if(query.nodes!==undefined&&(query.nodes<template.nodeRange.min||query.nodes>template.nodeRange.max))return false;
  if(query.learning!==undefined&&template.learning!==query.learning)return false;
  if(query.intent&&!template.componentIds.some(id=>registryData.components.find(c=>c.id===id)?.intents.includes(query.intent!)))return false;
  if(query.tag&&!template.componentIds.some(id=>registryData.components.find(c=>c.id===id)?.tags.includes(query.tag!)))return false;
  return true;
 });
};
export type RankedTemplate={template:(typeof registryData.templates)[number];score:number;reasons:string[]};
export const rankTemplates=(query:TemplateSearchQuery={}):RankedTemplate[]=>registryData.templates.map(template=>{
 let score=0;const reasons:string[]=[];const q=query.text?.trim().toLowerCase();
 if(q&&(template.id.toLowerCase().includes(q)||template.displayName.toLowerCase().includes(q)||template.purpose.toLowerCase().includes(q))){score+=4;reasons.push('text');}
 if(query.aspect&&template.supportedAspects.includes(query.aspect)){score+=2;reasons.push('aspect');}
 if(query.type&&template.types.includes(query.type)){score+=5;reasons.push('type');}
 if(query.nodes!==undefined&&query.nodes>=template.nodeRange.min&&query.nodes<=template.nodeRange.max){score+=4;reasons.push('nodes');}
 if(query.learning!==undefined&&template.learning===query.learning){score+=3;reasons.push('learning');}
 if(query.componentId&&template.componentIds.includes(query.componentId)){score+=4;reasons.push('component');}
 if(query.intent&&template.componentIds.some(id=>registryData.components.find(c=>c.id===id)?.intents.includes(query.intent!))){score+=5;reasons.push('intent');}
 if(query.tag&&template.componentIds.some(id=>registryData.components.find(c=>c.id===id)?.tags.includes(query.tag!))){score+=3;reasons.push('tag');}
 if(template.status==='APPROVED'){score+=1;reasons.push('approved');}
 return {template,score,reasons};
}).filter(item=>item.score>0).sort((a,b)=>b.score-a.score||a.template.id.localeCompare(b.template.id));
export const TemplateRegistry={search:searchTemplates,rank:rankTemplates};
