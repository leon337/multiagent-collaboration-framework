import type {CSSProperties,PropsWithChildren} from 'react';
import {AbsoluteFill} from 'remotion';
import {designTokens,layoutFor} from '../lib/tokens';
import type {CommonProps} from '../lib/types';

export const SafeFrame=({aspect='9:16',reducedMotion=false,children,style}:PropsWithChildren<CommonProps&{style?:CSSProperties}>)=>{
  const layout=layoutFor(aspect,reducedMotion);
  return <AbsoluteFill style={{
    background:designTokens.color.background,color:designTokens.color.text,
    fontFamily:'Inter, ui-sans-serif, system-ui, sans-serif',
    paddingTop:layout.safeInsets.top,paddingRight:layout.safeInsets.right,
    paddingBottom:layout.safeInsets.bottom,paddingLeft:layout.safeInsets.left,
    boxSizing:'border-box',...style,
  }}>{children}</AbsoluteFill>;
};

export const Card=({children,style}:PropsWithChildren<{style?:CSSProperties}>)=>
  <div style={{
    border:`1px solid ${designTokens.color.line}`,background:designTokens.color.surface,
    borderRadius:designTokens.radius.lg,padding:designTokens.spacing.lg,boxSizing:'border-box',...style,
  }}>{children}</div>;
