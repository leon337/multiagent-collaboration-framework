import {useCurrentFrame} from 'remotion';
import {progressAt} from '../lib/motion';
import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {Card,SafeFrame} from './shared';

export type ProgressiveDiagramProps=CommonProps&{title?:string;nodes?:string[]};

export const ProgressiveDiagram=({aspect='9:16',reducedMotion=false,title='Fluxo progressivo',nodes=['Contexto','Modelo','Ação']}:ProgressiveDiagramProps)=>{
  const frame=useCurrentFrame();
  return <SafeFrame aspect={aspect} reducedMotion={reducedMotion}>
    <div style={{fontSize:52,fontWeight:800,marginBottom:56}}>{title}</div>
    <div style={{display:'flex',flexDirection:aspect==='9:16'?'column':'row',gap:24,alignItems:'stretch',justifyContent:'center',flex:1}}>
      {nodes.map((node,index)=>{
        const p=progressAt(frame,index*18,index*18+14,reducedMotion);
        return <div key={`${node}-${index}`} style={{display:'contents'}}>
          <Card style={{flex:1,display:'grid',placeItems:'center',minHeight:180,opacity:p,transform:`scale(${0.92+p*0.08})`}}>
            <span style={{fontSize:36,fontWeight:700,textAlign:'center',whiteSpace:'pre-line',lineHeight:1.15}}>{node}</span>
          </Card>
          {index<nodes.length-1?<div style={{fontSize:44,color:designTokens.color.accent,opacity:p,alignSelf:'center',transform:aspect==='9:16'?'rotate(90deg)':undefined}}>→</div>:null}
        </div>;
      })}
    </div>
  </SafeFrame>;
};
