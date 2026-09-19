import {useReveal} from '../lib/motion';
import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {SafeFrame} from './shared';

export type ArchitectureNodeProps=CommonProps&{label?:string;subtitle?:string};

export const ArchitectureNode=({aspect='9:16',reducedMotion=false,label='AGENTE',subtitle='organiza modelo + tools + policy'}:ArchitectureNodeProps)=>{
  const p=useReveal(0,reducedMotion);
  return <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{display:'grid',placeItems:'center'}}>
    <div style={{width:aspect==='9:16'?'82%':'55%',borderRadius:42,border:`2px solid ${designTokens.color.accent}`,background:designTokens.color.surface,padding:56,opacity:p,transform:`scale(${0.86+0.14*p})`,boxShadow:`0 0 80px rgba(124,140,255,${0.18*p})`}}>
      <div style={{fontSize:60,fontWeight:900}}>{label}</div>
      <div style={{fontSize:32,color:designTokens.color.muted,marginTop:22}}>{subtitle}</div>
    </div>
  </SafeFrame>;
};
