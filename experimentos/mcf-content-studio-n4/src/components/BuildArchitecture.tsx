import {useCurrentFrame} from 'remotion';
import {progressAt} from '../lib/motion';
import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {Card,SafeFrame} from './shared';

export type BuildArchitectureProps=CommonProps&{title?:string;nodes?:string[]};

export const BuildArchitecture=({aspect='9:16',reducedMotion=false,title='Construindo a arquitetura',nodes=['Usuário','Aplicação','Agente','Runtime']}:BuildArchitectureProps)=>{
  const frame=useCurrentFrame();
  return <SafeFrame aspect={aspect} reducedMotion={reducedMotion}>
    <div style={{fontSize:46,fontWeight:850}}>{title}</div>
    <div style={{display:'grid',gridTemplateColumns:aspect==='9:16'?'1fr':'repeat(2,1fr)',gap:22,marginTop:44}}>
      {nodes.map((node,index)=>{
        const p=progressAt(frame,index*22,index*22+14,reducedMotion);
        return <Card key={node+index} style={{opacity:p,transform:`translateY(${(1-p)*20}px)`,borderColor:index===nodes.length-1?designTokens.color.accent:designTokens.color.line}}>
          <div style={{fontSize:22,color:designTokens.color.muted}}>NÓ {index+1}</div>
          <div style={{fontSize:36,fontWeight:850,marginTop:10}}>{node}</div>
        </Card>;
      })}
    </div>
  </SafeFrame>;
};
