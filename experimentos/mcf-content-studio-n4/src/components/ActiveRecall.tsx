import {useCurrentFrame} from 'remotion';
import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {Card,SafeFrame} from './shared';

export type ActiveRecallProps=CommonProps&{question?:string;answer?:string;revealAfterFrame?:number};

export const ActiveRecall=({aspect='9:16',reducedMotion=false,question='Quem executa o comando?',answer='O runtime autorizado.',revealAfterFrame=60}:ActiveRecallProps)=>{
  const frame=useCurrentFrame();
  const reveal=frame>=revealAfterFrame;
  return <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{justifyContent:'center'}}>
    <div style={{fontSize:28,letterSpacing:4,color:designTokens.color.accent,marginBottom:24}}>RECUPERAÇÃO ATIVA</div>
    <div style={{fontSize:aspect==='9:16'?62:70,fontWeight:800,lineHeight:1.08}}>{question}</div>
    <Card style={{marginTop:64,opacity:reveal?1:0.15,borderStyle:reveal?'solid':'dashed'}}>
      <div style={{fontSize:36,color:reveal?designTokens.color.text:designTokens.color.muted}}>{reveal?answer:'Pense antes de revelar…'}</div>
    </Card>
  </SafeFrame>;
};
