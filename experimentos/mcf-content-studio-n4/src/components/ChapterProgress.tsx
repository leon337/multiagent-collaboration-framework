import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {SafeFrame} from './shared';

export type ChapterProgressProps=CommonProps&{chapters?:string[];activeIndex?:number};

export const ChapterProgress=({aspect='9:16',reducedMotion=false,chapters=['Modelo','Agente','Sessão','Ambiente'],activeIndex=1}:ChapterProgressProps)=>
  <SafeFrame aspect={aspect} reducedMotion={reducedMotion}>
    <div style={{fontSize:46,fontWeight:800,marginBottom:56}}>Mapa da aula</div>
    <div style={{display:'grid',gap:24}}>
      {chapters.map((chapter,index)=>{
        const active=index===activeIndex;
        const done=index<activeIndex;
        return <div key={`${chapter}-${index}`} style={{display:'grid',gridTemplateColumns:'70px 1fr',alignItems:'center',gap:24,opacity:active?1:done?0.55:0.3}}>
          <div style={{height:10,borderRadius:20,background:active||done?designTokens.color.accent:designTokens.color.line}}/>
          <div style={{fontSize:active?42:34,fontWeight:active?800:500}}>{chapter}</div>
        </div>;
      })}
    </div>
  </SafeFrame>;
