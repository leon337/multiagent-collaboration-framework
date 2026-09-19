import {useCurrentFrame} from 'remotion';
import {interpolate} from 'remotion';
import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {SafeFrame} from './shared';

export type TransitionCueProps=CommonProps&{fromLabel?:string;toLabel?:string;styleName?:string};

export const TransitionCue=({aspect='9:16',reducedMotion=false,fromLabel='Conceito',toLabel='Aplicação',styleName='wipe'}:TransitionCueProps)=>{
  const frame=useCurrentFrame();
  const p=reducedMotion?1:interpolate(frame,[0,24],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{justifyContent:'center',overflow:'hidden'}}>
    <div style={{fontSize:22,letterSpacing:4,color:designTokens.color.muted}}>TRANSITION • {styleName.toUpperCase()}</div>
    <div style={{display:'grid',gridTemplateColumns:aspect==='9:16'?'1fr':'1fr 1fr',gap:20,marginTop:30}}>
      <div style={{padding:42,borderRadius:28,background:designTokens.color.surface,opacity:1-p*.55,transform:`translateX(${-p*30}px)`}}>
        <div style={{fontSize:42,fontWeight:850}}>{fromLabel}</div>
      </div>
      <div style={{padding:42,borderRadius:28,background:designTokens.color.surfaceStrong,border:`1px solid ${designTokens.color.accent}`,opacity:p,transform:`translateX(${(1-p)*30}px)`}}>
        <div style={{fontSize:42,fontWeight:850}}>{toLabel}</div>
      </div>
    </div>
  </SafeFrame>;
};
