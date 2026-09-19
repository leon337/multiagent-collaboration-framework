import {useCurrentFrame} from 'remotion';
import {progressAt} from '../lib/motion';
import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {Card,SafeFrame} from './shared';

export type ProgressiveConceptProps=CommonProps&{title?:string;concepts?:string[];linkLabel?:string};

export const ProgressiveConcept=({aspect='9:16',reducedMotion=false,title='Conceitos que se conectam',concepts=['Modelo','Runtime'],linkLabel='pede → executa'}:ProgressiveConceptProps)=>{
  const frame=useCurrentFrame();
  return <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{justifyContent:'center'}}>
    <div style={{fontSize:46,fontWeight:850,marginBottom:44}}>{title}</div>
    <div style={{display:'flex',flexDirection:aspect==='9:16'?'column':'row',alignItems:'center',gap:22}}>
      {concepts.map((concept,index)=>{
        const p=progressAt(frame,index*24,index*24+16,reducedMotion);
        return <div key={concept+index} style={{display:'contents'}}>
          <Card style={{minWidth:aspect==='9:16'?'100%':300,opacity:p,transform:`scale(${.92+.08*p})`,textAlign:'center'}}>
            <div style={{fontSize:38,fontWeight:850}}>{concept}</div>
          </Card>
          {index<concepts.length-1?<div style={{fontSize:24,color:designTokens.color.accent,opacity:progressAt(frame,index*24+14,index*24+30,reducedMotion),transform:aspect==='9:16'?'rotate(90deg)':undefined}}>{linkLabel}</div>:null}
        </div>;
      })}
    </div>
  </SafeFrame>;
};
