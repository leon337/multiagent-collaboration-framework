import {useReveal} from '../lib/motion';
import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {Card,SafeFrame} from './shared';

export type ErrorVsCorrectProps=CommonProps&{wrong?:string;right?:string;title?:string};

export const ErrorVsCorrect=({aspect='9:16',reducedMotion=false,title='Erro comum vs. forma correta',wrong='Capacidade = permissão',right='Capacidade ≠ permissão'}:ErrorVsCorrectProps)=>{
  const left=useReveal(0,reducedMotion);
  const rightP=useReveal(20,reducedMotion);
  return <SafeFrame aspect={aspect} reducedMotion={reducedMotion}>
    <div style={{fontSize:50,fontWeight:800,marginBottom:56}}>{title}</div>
    <div style={{display:'grid',gridTemplateColumns:aspect==='9:16'?'1fr':'1fr 1fr',gap:30}}>
      <Card style={{opacity:left,borderColor:designTokens.color.negative}}>
        <div style={{fontSize:26,color:designTokens.color.negative,marginBottom:20}}>EVITE</div>
        <div style={{fontSize:38,fontWeight:700}}>{wrong}</div>
      </Card>
      <Card style={{opacity:rightP,borderColor:designTokens.color.positive}}>
        <div style={{fontSize:26,color:designTokens.color.positive,marginBottom:20}}>PREFIRA</div>
        <div style={{fontSize:38,fontWeight:700}}>{right}</div>
      </Card>
    </div>
  </SafeFrame>;
};
