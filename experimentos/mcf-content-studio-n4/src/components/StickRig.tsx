import {useCurrentFrame} from 'remotion';
import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {SafeFrame} from './shared';

export type StickRigPose='idle'|'thinking'|'talking'|'pointing'|'typing'|'surprised'|'celebrating';
export type StickRigAction='idle'|'walk'|'run'|'turn'|'lookAt'|'pointAt'|'type'|'talk'|'fall'|'jump'|'react';

export type StickRigProps=CommonProps&{
  label?:string;
  pose?:StickRigPose;
  action?:StickRigAction;
  showLabel?:boolean;
};

const rad=(deg:number)=>deg*Math.PI/180;
const end=(x:number,y:number,length:number,angleDeg:number)=>({
  x:x+Math.sin(rad(angleDeg))*length,
  y:y+Math.cos(rad(angleDeg))*length,
});

export const StickRig=({
  aspect='9:16',
  reducedMotion=false,
  label='AGENTE',
  pose='idle',
  action='idle',
  showLabel=true,
}:StickRigProps)=>{
  const frame=useCurrentFrame();
  const t=reducedMotion?0:frame/7;
  const cycle=Math.sin(t);
  const fast=Math.sin(t*1.7);
  const bounce=
    action==='jump'?-Math.abs(cycle)*70:
    action==='run'?-Math.abs(fast)*18:
    action==='walk'?-Math.abs(cycle)*8:0;
  const bodyRotate=
    action==='fall'?Math.min(78,frame*2.2):
    action==='react'?cycle*3:0;
  const turnScale=action==='turn'?(Math.cos(Math.min(Math.PI,frame/18))||0.001):1;

  let leftUpper=24;
  let leftLower=12;
  let rightUpper=-24;
  let rightLower=-12;
  let leftLeg=10;
  let rightLeg=-10;
  let leftKnee=4;
  let rightKnee=-4;

  if(pose==='thinking'){
    leftUpper=120; leftLower=55; rightUpper=-18; rightLower=-8;
  }else if(pose==='pointing'){
    rightUpper=-88; rightLower=2;
  }else if(pose==='typing'){
    leftUpper=68; leftLower=70; rightUpper=-68; rightLower=-70;
  }else if(pose==='surprised'){
    leftUpper=150; leftLower=10; rightUpper=-150; rightLower=-10;
  }else if(pose==='celebrating'){
    leftUpper=154; leftLower=12; rightUpper=-154; rightLower=-12;
  }

  if(action==='pointAt'){
    rightUpper=-88; rightLower=2;
  }
  if(action==='type'){
    leftUpper=68+cycle*5; leftLower=70;
    rightUpper=-68-cycle*5; rightLower=-70;
  }
  if(action==='walk' || action==='run'){
    const amp=action==='run'?34:20;
    leftLeg=cycle*amp;
    rightLeg=-cycle*amp;
    leftKnee=-cycle*amp*0.55;
    rightKnee=cycle*amp*0.55;
    leftUpper=-cycle*amp*0.7;
    rightUpper=cycle*amp*0.7;
  }
  if(action==='react'){
    leftUpper=140+cycle*8; rightUpper=-140-cycle*8;
  }

  const shoulderY=225;
  const leftShoulder={x:160,y:shoulderY};
  const rightShoulder={x:240,y:shoulderY};
  const leftElbow=end(leftShoulder.x,leftShoulder.y,105,leftUpper);
  const rightElbow=end(rightShoulder.x,rightShoulder.y,105,rightUpper);
  const leftHand=end(leftElbow.x,leftElbow.y,92,leftUpper+leftLower);
  const rightHand=end(rightElbow.x,rightElbow.y,92,rightUpper+rightLower);

  const leftHip={x:185,y:390};
  const rightHip={x:215,y:390};
  const leftKneePoint=end(leftHip.x,leftHip.y,135,leftLeg);
  const rightKneePoint=end(rightHip.x,rightHip.y,135,rightLeg);
  const leftFoot=end(leftKneePoint.x,leftKneePoint.y,125,leftLeg+leftKnee);
  const rightFoot=end(rightKneePoint.x,rightKneePoint.y,125,rightLeg+rightKnee);

  const talking=pose==='talking'||action==='talk';
  const mouthOpen=talking && !reducedMotion ? 5+Math.abs(Math.sin(frame/3))*10 : talking?8:2;
  const eyeShift=action==='lookAt'?6:0;

  const stroke=designTokens.color.text;
  const accent=designTokens.color.accent;

  return <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{display:'grid',placeItems:'center'}}>
    <div style={{display:'grid',placeItems:'center',gap:28,transform:`translateY(${bounce}px) rotate(${bodyRotate}deg) scaleX(${turnScale})`,transformOrigin:'50% 70%'}}>
      <svg width={aspect==='9:16'?650:560} height={aspect==='9:16'?980:760} viewBox="0 0 400 700" role="img" aria-label={`${label}: ${pose}, ${action}`}>
        <g fill="none" stroke={stroke} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="200" cy="125" r="62" fill={designTokens.color.surfaceStrong} stroke={accent}/>
          <line x1="200" y1="190" x2="200" y2="390"/>
          <line x1="160" y1="225" x2="240" y2="225"/>
          <line x1={leftShoulder.x} y1={leftShoulder.y} x2={leftElbow.x} y2={leftElbow.y}/>
          <line x1={leftElbow.x} y1={leftElbow.y} x2={leftHand.x} y2={leftHand.y}/>
          <line x1={rightShoulder.x} y1={rightShoulder.y} x2={rightElbow.x} y2={rightElbow.y}/>
          <line x1={rightElbow.x} y1={rightElbow.y} x2={rightHand.x} y2={rightHand.y}/>
          <line x1={leftHip.x} y1={leftHip.y} x2={leftKneePoint.x} y2={leftKneePoint.y}/>
          <line x1={leftKneePoint.x} y1={leftKneePoint.y} x2={leftFoot.x} y2={leftFoot.y}/>
          <line x1={rightHip.x} y1={rightHip.y} x2={rightKneePoint.x} y2={rightKneePoint.y}/>
          <line x1={rightKneePoint.x} y1={rightKneePoint.y} x2={rightFoot.x} y2={rightFoot.y}/>
        </g>
        <g fill={stroke}>
          <circle cx={178+eyeShift} cy="112" r="7"/>
          <circle cx={222+eyeShift} cy="112" r="7"/>
        </g>
        <rect x="181" y="145" width="38" height={mouthOpen} rx="6" fill={talking?accent:stroke}/>
        <circle cx={leftHand.x} cy={leftHand.y} r="12" fill={accent}/>
        <circle cx={rightHand.x} cy={rightHand.y} r="12" fill={accent}/>
        <circle cx={leftElbow.x} cy={leftElbow.y} r="8" fill={designTokens.color.muted}/>
        <circle cx={rightElbow.x} cy={rightElbow.y} r="8" fill={designTokens.color.muted}/>
        <circle cx={leftKneePoint.x} cy={leftKneePoint.y} r="8" fill={designTokens.color.muted}/>
        <circle cx={rightKneePoint.x} cy={rightKneePoint.y} r="8" fill={designTokens.color.muted}/>
      </svg>
      {showLabel&&<div style={{marginTop:-100,padding:'18px 30px',borderRadius:999,border:`1px solid ${designTokens.color.line}`,background:designTokens.color.surface,fontSize:34,fontWeight:800,letterSpacing:2}}>{label}</div>}
    </div>
  </SafeFrame>;
};
