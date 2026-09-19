import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {SafeFrame} from './shared';

export type CaptionProps=CommonProps&{text?:string;label?:string};

export const Caption=({aspect='9:16',reducedMotion=false,text='A legenda deve acompanhar a fala sem competir com o foco visual.',label='CAPTION'}:CaptionProps)=>
  <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{justifyContent:'flex-end'}}>
    <div style={{alignSelf:'center',maxWidth:aspect==='9:16'?900:1180,padding:'20px 28px',borderRadius:22,background:'rgba(5,7,12,.90)',border:`1px solid ${designTokens.color.line}`,fontSize:30,lineHeight:1.35,textAlign:'center'}}>
      <div style={{fontSize:16,letterSpacing:4,color:designTokens.color.accent,marginBottom:10}}>{label}</div>
      {text}
    </div>
  </SafeFrame>;
