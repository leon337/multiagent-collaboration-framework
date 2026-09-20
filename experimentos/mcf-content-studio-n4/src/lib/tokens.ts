import type {AspectRatio, LayoutContext} from './types';
import {socialCaptionLane,socialCoreContentInsets} from './socialSafeArea';

export const designTokens = {
  color: {
    background:'#f7faff',
    surface:'rgba(255,255,255,.86)',
    surfaceStrong:'#edf3ff',
    text:'#07142f',
    muted:'#63789d',
    accent:'#2d5bff',
    positive:'#10b981',
    negative:'#f04468',
    line:'#cfe0ff',
  },
  shadow:{
    card:'0 22px 70px rgba(44,82,170,.14), 0 4px 16px rgba(44,82,170,.08)',
    soft:'0 14px 38px rgba(45,91,255,.12)'
  },
  radius:{sm:12,md:20,lg:32},
  spacing:{xs:8,sm:16,md:24,lg:40,xl:64,xxl:96},
} as const;

export const layoutFor=(aspect:AspectRatio,reducedMotion=false):LayoutContext =>
  aspect==='9:16'
    ? {aspect,width:1080,height:1920,fps:30,safeInsets:socialCoreContentInsets,reducedMotion}
    : {aspect,width:1920,height:1080,fps:30,safeInsets:{top:72,right:96,bottom:180,left:96},reducedMotion};

export const captionLayoutFor=(aspect:AspectRatio)=>aspect==='9:16'
  ? socialCaptionLane
  : {left:110,right:110,bottom:44,maxWidth:1320,fontSize:34,lineHeight:1.25,paddingY:18,paddingX:28,reservedHeight:150};
