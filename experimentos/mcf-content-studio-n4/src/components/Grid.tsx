import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {Card,SafeFrame} from './shared';

export type GridProps=CommonProps&{title?:string;items?:string[];columns?:number};

export const Grid=({aspect='9:16',reducedMotion=false,title='Grid',items=['Modelo','Agente','Sessão','Runtime'],columns=2}:GridProps)=>{
  const safeColumns=Math.max(1,Math.min(aspect==='9:16'?2:4,columns));
  return <SafeFrame aspect={aspect} reducedMotion={reducedMotion}>
    <div style={{fontSize:46,fontWeight:850,marginBottom:36}}>{title}</div>
    <div style={{display:'grid',gridTemplateColumns:`repeat(${safeColumns}, minmax(0,1fr))`,gap:20}}>
      {items.map((item,index)=><Card key={item+index} style={{minHeight:160,display:'grid',placeItems:'center',textAlign:'center'}}>
        <div style={{fontSize:32,fontWeight:760,color:index===0?designTokens.color.accent:designTokens.color.text}}>{item}</div>
      </Card>)}
    </div>
  </SafeFrame>;
};
