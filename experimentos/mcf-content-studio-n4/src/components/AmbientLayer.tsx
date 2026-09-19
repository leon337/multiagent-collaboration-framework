import {useCurrentFrame} from 'remotion';
import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {SafeFrame} from './shared';

export type AmbientLayerProps=CommonProps&{title?:string;density?:number};

export const AmbientLayer=({aspect='9:16',reducedMotion=false,title='Ambiente técnico',density=6}:AmbientLayerProps)=>{
  const frame=useCurrentFrame();
  const shift=reducedMotion?0:frame*.35;
  const count=Math.max(3,Math.min(12,Math.round(density)));
  return <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{justifyContent:'center',overflow:'hidden'}}>
    <div style={{position:'absolute',inset:0,opacity:.3,backgroundImage:`linear-gradient(rgba(124,140,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(124,140,255,.08) 1px,transparent 1px)`,backgroundSize:'64px 64px',backgroundPosition:`${shift}px ${shift}px`}}/>
    {Array.from({length:count},(_,i)=><div key={i} style={{position:'absolute',left:`${10+(i*17)%80}%`,top:`${12+(i*23)%72}%`,width:10+(i%3)*6,height:10+(i%3)*6,borderRadius:999,background:designTokens.color.accent,opacity:.16+(i%4)*.07,transform:`translateY(${reducedMotion?0:Math.sin((frame+i*9)/18)*12}px)`}}/>)}
    <div style={{position:'relative',fontSize:aspect==='9:16'?64:76,fontWeight:900,textAlign:'center'}}>{title}</div>
  </SafeFrame>;
};
