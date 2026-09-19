import {useReveal} from '../lib/motion';
import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {SafeFrame} from './shared';

export type TitleProps=CommonProps&{eyebrow?:string;title?:string;subtitle?:string};

export const Title=({aspect='9:16',reducedMotion=false,eyebrow='CAPÍTULO',title='Título principal',subtitle='Contexto curto para orientar a cena.'}:TitleProps)=>{
  const p=useReveal(0,reducedMotion);
  return <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{justifyContent:'center'}}>
    <div style={{opacity:p,transform:`translateY(${(1-p)*32}px)`}}>
      <div style={{fontSize:24,letterSpacing:5,color:designTokens.color.accent,fontWeight:800}}>{eyebrow}</div>
      <div style={{fontSize:aspect==='9:16'?76:92,fontWeight:900,lineHeight:1.02,marginTop:24,maxWidth:aspect==='9:16'?'100%':'75%'}}>{title}</div>
      <div style={{fontSize:30,lineHeight:1.4,color:designTokens.color.muted,marginTop:30,maxWidth:aspect==='9:16'?'100%':'68%'}}>{subtitle}</div>
    </div>
  </SafeFrame>;
};
