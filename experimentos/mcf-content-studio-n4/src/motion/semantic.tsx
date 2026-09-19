import type {CSSProperties,ReactNode} from 'react';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
import {designTokens} from '../lib/tokens';
import type {MotionPresetId} from './presets';
import {motionProgress} from './presets';

export type SemanticFocusIntent='model'|'relation'|'sequence'|'metric'|'text-entry';
export type SemanticFocusAction='dim-others'|'scale-target'|'draw-connector'|'camera-zoom'|'underline'|'progress'|'typewriter'|'counter';

export const resolveSemanticFocus=(intent:SemanticFocusIntent):SemanticFocusAction[]=>{
  switch(intent){
    case 'model': return ['dim-others','scale-target','camera-zoom'];
    case 'relation': return ['dim-others','draw-connector','scale-target'];
    case 'sequence': return ['progress','draw-connector'];
    case 'metric': return ['counter','scale-target'];
    case 'text-entry': return ['typewriter','underline'];
  }
};

const overlayBase:CSSProperties={position:'absolute',pointerEvents:'none',zIndex:30};

export const SemanticMotionLayer=({id,reducedMotion=false,children}:{id:MotionPresetId;reducedMotion?:boolean;children:ReactNode})=>{
  const frame=useCurrentFrame();
  const p=motionProgress(frame,0,24,reducedMotion);
  if(id==='underline') return <AbsoluteFill>
    {children}
    <div style={{...overlayBase,left:'18%',right:'18%',bottom:'16%',height:8,borderRadius:8,background:designTokens.color.accent,transform:`scaleX(${p})`,transformOrigin:'left'}}/>
  </AbsoluteFill>;
  if(id==='draw-arrow') return <AbsoluteFill>
    {children}
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{...overlayBase,inset:'20%',width:'60%',height:'60%',overflow:'visible'}}>
      <line x1="12" y1="70" x2={12+66*p} y2={70-42*p} stroke={designTokens.color.accent} strokeWidth="2.5" strokeLinecap="round"/>
      <polyline points={`${70*p+8},${32+38*(1-p)} ${78*p+10},${28+42*(1-p)} ${72*p+10},${38+32*(1-p)}`} fill="none" stroke={designTokens.color.accent} strokeWidth="2.5"/>
    </svg>
  </AbsoluteFill>;
  if(id==='connector') return <AbsoluteFill>
    {children}
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{...overlayBase,inset:0,width:'100%',height:'100%'}}>
      <path d="M22 50 C38 20,62 80,78 50" pathLength="1" fill="none" stroke={designTokens.color.accent} strokeWidth="0.9" strokeDasharray="1" strokeDashoffset={1-p}/>
      <circle cx="22" cy="50" r="1.8" fill={designTokens.color.accent}/><circle cx="78" cy="50" r="1.8" fill={designTokens.color.accent}/>
    </svg>
  </AbsoluteFill>;
  if(id==='morph') return <AbsoluteFill style={{transform:`scale(${.93+.07*p})`,borderRadius:`${Math.round((1-p)*48)}px`,overflow:'hidden'}}>{children}</AbsoluteFill>;
  if(id==='typewriter') return <AbsoluteFill>
    <AbsoluteFill style={{clipPath:`inset(0 ${(1-p)*100}% 0 0)`}}>{children}</AbsoluteFill>
    <div style={{...overlayBase,top:'12%',bottom:'12%',left:`${Math.max(2,p*96)}%`,width:4,background:designTokens.color.accent,opacity:frame%16<8?1:.25}}/>
  </AbsoluteFill>;
  if(id==='counter') return <AbsoluteFill>
    {children}
    <div style={{...overlayBase,right:'7%',top:'7%',fontSize:44,fontWeight:900,color:designTokens.color.accent,fontVariantNumeric:'tabular-nums'}}>{Math.round(p*100)}</div>
  </AbsoluteFill>;
  if(id==='progress') return <AbsoluteFill>
    {children}
    <div style={{...overlayBase,left:'8%',right:'8%',bottom:'8%',height:12,background:'rgba(255,255,255,.12)',borderRadius:8,overflow:'hidden'}}>
      <div style={{height:'100%',width:`${p*100}%`,background:designTokens.color.accent}}/>
    </div>
  </AbsoluteFill>;
  return <>{children}</>;
};
