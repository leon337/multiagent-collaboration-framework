import {useCurrentFrame} from 'remotion';
import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {SafeFrame} from './shared';

export type GlowPulseProps=CommonProps&{
  label?:string;
  intensity?:number;
};

export const GlowPulse=({aspect='9:16',reducedMotion=false,label='Foco',intensity=1}:GlowPulseProps)=>{
  const frame=useCurrentFrame();
  const pulse=reducedMotion?1:0.72+Math.sin(frame/8)*0.18;
  const alpha=Math.max(0.08,Math.min(0.45,0.22*intensity*pulse));
  return <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{display:'grid',placeItems:'center'}}>
    <div style={{position:'relative',display:'grid',placeItems:'center'}}>
      <div style={{position:'absolute',width:330,height:330,borderRadius:999,background:`rgba(124,140,255,${alpha})`,filter:'blur(42px)',transform:`scale(${pulse})`}}/>
      <div style={{position:'relative',padding:'28px 42px',borderRadius:28,border:`1px solid ${designTokens.color.accent}`,background:designTokens.color.surface,fontSize:48,fontWeight:900,boxShadow:`0 0 70px rgba(124,140,255,${alpha})`}}>{label}</div>
    </div>
  </SafeFrame>;
};
