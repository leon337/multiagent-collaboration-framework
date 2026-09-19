import {useReveal} from '../lib/motion';
import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {SafeFrame} from './shared';

export type CursorCueProps=CommonProps&{label?:string;x?:number;y?:number};

export const CursorCue=({aspect='9:16',reducedMotion=false,label='Clique aqui',x=62,y=48}:CursorCueProps)=>{
  const p=useReveal(0,reducedMotion);
  const cx=Math.max(8,Math.min(92,x));
  const cy=Math.max(12,Math.min(88,y));
  return <SafeFrame aspect={aspect} reducedMotion={reducedMotion}>
    <div style={{position:'absolute',left:`${cx}%`,top:`${cy}%`,opacity:p,transform:'translate(-10px,-8px)'}}>
      <div style={{fontSize:58,color:'white',textShadow:'0 4px 18px rgba(0,0,0,.45)'}}>➤</div>
      <div style={{marginTop:8,padding:'10px 14px',borderRadius:12,background:designTokens.color.accent,color:'white',fontSize:22,fontWeight:800,whiteSpace:'nowrap'}}>{label}</div>
    </div>
  </SafeFrame>;
};
