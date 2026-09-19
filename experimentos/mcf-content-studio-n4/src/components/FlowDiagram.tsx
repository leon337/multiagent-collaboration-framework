import {useCurrentFrame} from 'remotion';
import {progressAt} from '../lib/motion';
import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {Card,SafeFrame} from './shared';

export type FlowDiagramProps=CommonProps&{title?:string;steps?:string[]};

export const FlowDiagram=({aspect='9:16',reducedMotion=false,title='Fluxo',steps=['Entrada','Decisão','Execução','Resultado']}:FlowDiagramProps)=>{
  const frame=useCurrentFrame();
  return <SafeFrame aspect={aspect} reducedMotion={reducedMotion}>
    <div style={{fontSize:46,fontWeight:850}}>{title}</div>
    <div style={{display:'flex',flexDirection:aspect==='9:16'?'column':'row',gap:14,alignItems:'stretch',marginTop:44,flex:1,justifyContent:'center'}}>
      {steps.map((step,index)=>{
        const p=progressAt(frame,index*16,index*16+12,reducedMotion);
        return <div key={step+index} style={{display:'contents'}}>
          <Card style={{flex:1,display:'grid',placeItems:'center',minHeight:130,opacity:p,borderColor:index===steps.length-1?designTokens.color.accent:designTokens.color.line}}>
            <div style={{fontSize:30,fontWeight:820,textAlign:'center'}}>{step}</div>
          </Card>
          {index<steps.length-1?<div style={{alignSelf:'center',fontSize:34,color:designTokens.color.accent,opacity:p,transform:aspect==='9:16'?'rotate(90deg)':undefined}}>→</div>:null}
        </div>;
      })}
    </div>
  </SafeFrame>;
};
