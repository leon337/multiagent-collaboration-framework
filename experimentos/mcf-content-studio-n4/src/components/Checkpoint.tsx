import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {Card,SafeFrame} from './shared';

export type CheckpointProps=CommonProps&{title?:string;known?:string[];next?:string[]};

export const Checkpoint=({aspect='9:16',reducedMotion=false,title='Checkpoint',known=['Modelo decide','Runtime executa'],next=['Aplicação governa']}:CheckpointProps)=>
  <SafeFrame aspect={aspect} reducedMotion={reducedMotion}>
    <div style={{fontSize:26,letterSpacing:4,color:designTokens.color.accent}}>APRENDIZAGEM</div>
    <div style={{fontSize:aspect==='9:16'?58:68,fontWeight:900,marginTop:18}}>{title}</div>
    <div style={{display:'grid',gridTemplateColumns:aspect==='9:16'?'1fr':'1fr 1fr',gap:24,marginTop:44}}>
      <Card>
        <div style={{fontSize:24,color:designTokens.color.positive,marginBottom:20}}>VOCÊ JÁ SABE</div>
        {known.map((item)=><div key={item} style={{fontSize:30,lineHeight:1.5}}>✓ {item}</div>)}
      </Card>
      <Card>
        <div style={{fontSize:24,color:designTokens.color.accent,marginBottom:20}}>AGORA FALTA</div>
        {next.map((item)=><div key={item} style={{fontSize:30,lineHeight:1.5}}>○ {item}</div>)}
      </Card>
    </div>
  </SafeFrame>;
};
