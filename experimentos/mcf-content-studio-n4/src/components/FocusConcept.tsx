import {useReveal} from '../lib/motion';
import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {Card,SafeFrame} from './shared';

export type FocusConceptProps=CommonProps&{eyebrow?:string;title?:string;body?:string};

export const FocusConcept=({aspect='9:16',reducedMotion=false,eyebrow='CONCEITO',title='O modelo decide',body='Contexto entra. Uma decisão estruturada sai.'}:FocusConceptProps)=>{
  const p=useReveal(0,reducedMotion);
  return <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{justifyContent:'center'}}>
    <Card style={{transform:`translateY(${(1-p)*32}px) scale(${0.96+p*0.04})`,opacity:p}}>
      <div style={{fontSize:26,letterSpacing:4,color:designTokens.color.accent,marginBottom:24}}>{eyebrow}</div>
      <div style={{fontSize:aspect==='9:16'?64:72,fontWeight:800,lineHeight:1.05}}>{title}</div>
      <div style={{fontSize:34,lineHeight:1.35,color:designTokens.color.muted,marginTop:28}}>{body}</div>
    </Card>
  </SafeFrame>;
};
