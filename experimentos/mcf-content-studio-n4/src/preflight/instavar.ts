import type {TechnicalLessonScene,TechnicalLessonSpec} from '../templates/types';

export type InstavarVideoSpec={
  schemaVersion:'1.0';
  id:string;
  templateFamily:'qa-ad'|'proof-walkthrough'|'announcement-brief'|'social-remix'|'finance-brief';
  meta:{title:string;description?:string;source?:string;sourceDigest?:string;tags?:string[]};
  target:{aspect:'9:16'|'4:5'|'1:1';fps:number;durationMode:'auto'|'fixed';fixedDurationSec?:number};
  style?:{theme?:string;variant?:string;safeAreaProfile?:'baseline'|'metaSafe'};
  audio?:{
    mode?:'auto'|'narration'|'music'|'silent';narrationText?:string;narrationSrc?:string;musicSrc?:string;ducking?:boolean;
    narrationTiming?:{schemaVersion:'1.0';source:'segmented-synthesis';durationMs:number;segments:Array<{sceneId:string;startMs:number;endMs:number;durationMs:number}>};
  };
  assets?:{logoSrc?:string;posterSrc?:string};
  scenes:Array<{id:string;kind:'hero'|'points'|'equation'|'video-window'|'cta'|'custom';content:Record<string,unknown>;timing?:Record<string,unknown>}>;
};

const text=(value:unknown,fallback='')=>typeof value==='string'?value:fallback;
const strings=(value:unknown)=>Array.isArray(value)?value.filter((v):v is string=>typeof v==='string'):[];

const mapScene=(scene:InstavarVideoSpec['scenes'][number],fps:number):TechnicalLessonScene=>{
  const durationFrames=Math.max(45,Math.round(Number(scene.timing?.durationSec??3)*fps));
  switch(scene.kind){
    case 'hero': return {id:scene.id,componentId:'title',durationFrames,props:{eyebrow:'INSTAVAR',title:text(scene.content.title,'Aula técnica'),subtitle:text(scene.content.subtitle,'')}};
    case 'points': return {id:scene.id,componentId:'stack',durationFrames,props:{title:text(scene.content.title,'Pontos'),items:strings(scene.content.points)}};
    case 'equation': return {id:scene.id,componentId:'code-panel',durationFrames,props:{title:text(scene.content.title,'Mecanismo'),language:'text',code:strings(scene.content.latexBlocks).join('\n')}};
    case 'video-window': return {id:scene.id,componentId:'video-clip',durationFrames,props:{title:text(scene.content.title,'Demonstração'),src:text(scene.content.mediaSrc,''),caption:text(scene.content.caption,'')}};
    case 'cta': return {id:scene.id,componentId:'callout',durationFrames,props:{label:'PRÓXIMO PASSO',title:text(scene.content.line1,'Continue'),body:text(scene.content.line2,'')}};
    case 'custom': return {id:scene.id,componentId:'focus-concept',durationFrames,props:{eyebrow:'CUSTOM',title:text(scene.content.title,'Cena'),body:text(scene.content.body,'')}};
  }
};

export const fromInstavarVideoSpec=(input:InstavarVideoSpec):TechnicalLessonSpec=>{
  if(input.schemaVersion!=='1.0') throw new Error('Unsupported Instavar VideoSpec version');
  if(input.target.aspect!=='9:16') throw new Error(`Instavar bridge currently supports native 9:16 only; received ${input.target.aspect}`);
  const fps=input.target.fps||30;
  const scenes=input.scenes.map(scene=>mapScene(scene,fps));
  const sceneStart=new Map<string,number>(); let cursor=0;
  for(const scene of scenes){sceneStart.set(scene.id,cursor);cursor+=scene.durationFrames;}
  const cues=(input.audio?.narrationTiming?.segments??[]).map(segment=>({
    from:Math.round(segment.startMs/1000*fps),to:Math.max(1,Math.round(segment.endMs/1000*fps)),text:segment.sceneId
  }));
  return {
    lesson:{id:`instavar-${input.id}`,title:input.meta.title,summary:input.meta.description??'Instavar VideoSpec 1.0 adaptado para N4.'},
    chapters:input.scenes.map(scene=>scene.id),scenes,narration:{cues},
    visuals:{aspect:'9:16',reducedMotion:false},theme:{id:input.style?.theme??'mcf-dark',background:'#080c14',accent:'#7c8cff'},
    assets:[],timings:{fps}
  };
};

const sceneKindFor=(scene:TechnicalLessonScene):InstavarVideoSpec['scenes'][number]['kind']=>{
  if(scene.componentId==='title')return 'hero';
  if(['stack','grid','checkpoint'].includes(scene.componentId))return 'points';
  if(['code-panel','diff-viewer','terminal-window'].includes(scene.componentId))return 'equation';
  if(['video-clip','screenshot-frame','browser-window'].includes(scene.componentId))return 'video-window';
  if(['callout'].includes(scene.componentId))return 'cta';
  return 'custom';
};

export const toInstavarVideoSpec=(spec:TechnicalLessonSpec):InstavarVideoSpec=>{
  if(spec.visuals.aspect!=='9:16') throw new Error('Instavar VideoSpec 1.0 does not expose 16:9 in the verified runtime contract.');
  return {
    schemaVersion:'1.0',id:spec.lesson.id,templateFamily:'proof-walkthrough',
    meta:{title:spec.lesson.title,description:spec.lesson.summary,source:'MCF TechnicalLessonSpec',tags:['mcf','n4']},
    target:{aspect:'9:16',fps:spec.timings.fps,durationMode:'fixed',fixedDurationSec:spec.scenes.reduce((n,s)=>n+s.durationFrames,0)/spec.timings.fps},
    style:{theme:spec.theme.id,variant:'n4',safeAreaProfile:'metaSafe'},
    audio:{mode:spec.narration.cues.length?'narration':'silent',ducking:true,narrationText:spec.narration.cues.map(c=>c.text).join('\n\n')},
    assets:{},
    scenes:spec.scenes.map(scene=>({id:scene.id,kind:sceneKindFor(scene),content:{componentId:scene.componentId,...scene.props},timing:{durationSec:scene.durationFrames/spec.timings.fps}}))
  };
};
