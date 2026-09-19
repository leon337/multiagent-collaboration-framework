// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
//
// Adapted for MCF Content Studio N4 from:
// RenderComp/free-remotion-templates@f648980e528defb7594e24c6447055f0540f340b
// src/components/bounce-in-headline/BounceInHeadline.tsx
import {interpolate,useCurrentFrame} from 'remotion';
import type {CommonProps} from '../lib/types';
import {SafeFrame} from './shared';

export type BounceHeadlineN4Props=CommonProps&{
  headline?:string;
  accent?:string;
  background?:string;
  bounces?:number;
  height?:number;
  delay?:number;
  duration?:number;
};

export const BounceHeadlineN4=({
  aspect='9:16',
  reducedMotion=false,
  headline='CONCEITO-CHAVE',
  accent='#7c8cff',
  background='#080c14',
  bounces=2,
  height=84,
  delay=8,
  duration=36,
}:BounceHeadlineN4Props)=>{
  const frame=useCurrentFrame();
  const progress=interpolate(frame,[delay,delay+duration],[0,1],{
    extrapolateLeft:'clamp',
    extrapolateRight:'clamp',
  });
  const opacity=reducedMotion?1:interpolate(progress,[0,0.12],[0,1],{
    extrapolateLeft:'clamp',
    extrapolateRight:'clamp',
  });
  const bounceY=reducedMotion||progress>=1
    ? 0
    : Math.abs(Math.sin(progress*Math.PI*bounces))*height*(1-progress);

  return <SafeFrame
    aspect={aspect}
    reducedMotion={reducedMotion}
    style={{background,display:'grid',placeItems:'center'}}
  >
    <div style={{
      fontSize:aspect==='9:16'?76:92,
      fontWeight:900,
      lineHeight:1,
      letterSpacing:3,
      textAlign:'center',
      color:accent,
      opacity,
      transform:`translateY(${-bounceY}px)`,
      maxWidth:'92%',
      overflowWrap:'anywhere',
    }}>{headline}</div>
  </SafeFrame>;
};
