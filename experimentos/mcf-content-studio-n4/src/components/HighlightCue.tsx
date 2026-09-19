import {useReveal} from '../lib/motion';
import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {Card,SafeFrame} from './shared';

export type HighlightCueProps=CommonProps&{prefix?:string;highlight?:string;suffix?:string};

export const HighlightCue=({aspect='9:16',reducedMotion=false,prefix='O modelo ',highlight='decide',suffix=', mas o ambiente executa.'}:HighlightCueProps)=>{
  const p=useReveal(0,reducedMotion);
  return <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{justifyContent:'center'}}>
    <Card>
      <div style={{fontSize:aspect==='9:16'?52:64,fontWeight:850,lineHeight:1.22}}>
        {prefix}<span style={{color:designTokens.color.accent,background:`rgba(124,140,255,${.16*p})`,padding:'0 8px',borderRadius:10}}>{highlight}</span>{suffix}
      </div>
    </Card>
  </SafeFrame>;
};
