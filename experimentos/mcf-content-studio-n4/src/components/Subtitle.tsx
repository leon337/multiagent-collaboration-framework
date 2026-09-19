import {useReveal} from '../lib/motion';
import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {Card,SafeFrame} from './shared';

export type SubtitleProps=CommonProps&{title?:string;body?:string};

export const Subtitle=({aspect='9:16',reducedMotion=false,title='Subtítulo',body='Uma segunda camada de explicação com menos peso visual.'}:SubtitleProps)=>{
  const p=useReveal(0,reducedMotion);
  return <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{justifyContent:'center'}}>
    <Card style={{opacity:p,transform:`scale(${0.97+p*0.03})`}}>
      <div style={{fontSize:aspect==='9:16'?52:62,fontWeight:800,lineHeight:1.08}}>{title}</div>
      <div style={{fontSize:30,lineHeight:1.5,color:designTokens.color.muted,marginTop:22}}>{body}</div>
    </Card>
  </SafeFrame>;
};
