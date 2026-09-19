import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {Card,SafeFrame} from './shared';

export type StackProps=CommonProps&{title?:string;items?:string[];gap?:number};

export const Stack=({aspect='9:16',reducedMotion=false,title='Stack',items=['Entrada','Processamento','Saída'],gap=18}:StackProps)=>
  <SafeFrame aspect={aspect} reducedMotion={reducedMotion}>
    <div style={{fontSize:46,fontWeight:850,marginBottom:36}}>{title}</div>
    <div style={{display:'flex',flexDirection:'column',gap}}>
      {items.map((item,index)=><Card key={item+index} style={{padding:28}}>
        <div style={{display:'flex',alignItems:'center',gap:18}}>
          <div style={{width:44,height:44,borderRadius:14,display:'grid',placeItems:'center',background:designTokens.color.surfaceStrong,color:designTokens.color.accent,fontWeight:900}}>{index+1}</div>
          <div style={{fontSize:32,fontWeight:720}}>{item}</div>
        </div>
      </Card>)}
    </div>
  </SafeFrame>;
