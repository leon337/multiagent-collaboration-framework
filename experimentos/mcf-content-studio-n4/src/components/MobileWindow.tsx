import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {SafeFrame} from './shared';

export type MobileWindowProps=CommonProps&{app?:string;title?:string;body?:string};

export const MobileWindow=({aspect='9:16',reducedMotion=false,app='MCF',title='Review Lab',body='Uma interface mobile simulada para demonstrar fluxos sem depender de screenshot externo.'}:MobileWindowProps)=>
  <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{display:'grid',placeItems:'center'}}>
    <div style={{width:aspect==='9:16'?620:460,minHeight:760,borderRadius:56,border:`10px solid ${designTokens.color.surfaceStrong}`,background:'#05070c',padding:28,boxShadow:'0 30px 90px rgba(0,0,0,.45)'}}>
      <div style={{textAlign:'center',fontSize:18,color:designTokens.color.muted}}>09:41</div>
      <div style={{marginTop:36,fontSize:24,color:designTokens.color.accent,fontWeight:850}}>{app}</div>
      <div style={{fontSize:48,fontWeight:900,marginTop:18}}>{title}</div>
      <div style={{fontSize:28,lineHeight:1.5,color:designTokens.color.muted,marginTop:24}}>{body}</div>
    </div>
  </SafeFrame>;
