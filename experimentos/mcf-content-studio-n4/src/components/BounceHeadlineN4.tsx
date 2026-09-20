// SPDX-FileCopyrightText: 2026 Trimora Inc.
// SPDX-License-Identifier: MIT
import {interpolate,useCurrentFrame} from 'remotion';
import {designTokens} from '../lib/tokens';
import type {CommonProps} from '../lib/types';
import {Card,SafeFrame} from './shared';

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
  accent=designTokens.color.accent,
  background='transparent',
  bounces=2,
  height=84,
  delay=8,
  duration=36,
}:BounceHeadlineN4Props)=>{
  const frame=useCurrentFrame();
  const progress=interpolate(frame,[delay,delay+duration],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const opacity=reducedMotion?1:interpolate(progress,[0,0.12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const bounceY=reducedMotion||progress>=1?0:Math.abs(Math.sin(progress*Math.PI*bounces))*height*(1-progress);
  return <SafeFrame aspect={aspect} reducedMotion={reducedMotion} style={{background,display:'grid',placeItems:'center'}}>
    <Card style={{padding:'54px 48px',minWidth:'82%',textAlign:'center',background:'rgba(255,255,255,.9)'}}>
      <div style={{fontSize:22,letterSpacing:4,color:'#5a78d5',fontWeight:900,marginBottom:24}}>ADAPTED COMPONENT</div>
      <div style={{fontSize:aspect==='9:16'?76:92,fontWeight:950,lineHeight:1,letterSpacing:1,textAlign:'center',color:accent,opacity,transform:`translateY(${-bounceY}px)`,overflowWrap:'anywhere'}}>{headline}</div>
    </Card>
  </SafeFrame>;
};