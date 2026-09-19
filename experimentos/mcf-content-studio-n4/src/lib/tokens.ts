import type {AspectRatio, LayoutContext} from './types';

export const designTokens = {
  color: {
    background:'#080c14', surface:'#111827', surfaceStrong:'#172033',
    text:'#f7f9fc', muted:'#aab4c6', accent:'#7c8cff',
    positive:'#58d68d', negative:'#ff7f87', line:'#31405e',
  },
  radius:{sm:12,md:20,lg:32},
  spacing:{xs:8,sm:16,md:24,lg:40,xl:64,xxl:96},
} as const;

export const layoutFor=(aspect:AspectRatio,reducedMotion=false):LayoutContext =>
  aspect==='9:16'
    ? {aspect,width:1080,height:1920,fps:30,safeInsets:{top:120,right:72,bottom:360,left:72},reducedMotion}
    : {aspect,width:1920,height:1080,fps:30,safeInsets:{top:72,right:96,bottom:180,left:96},reducedMotion};

export const captionLayoutFor=(aspect:AspectRatio)=>aspect==='9:16'
  ? {side:64,bottom:76,maxWidth:940,fontSize:42,lineHeight:1.25,paddingY:24,paddingX:30,reservedHeight:300}
  : {side:110,bottom:44,maxWidth:1320,fontSize:34,lineHeight:1.25,paddingY:18,paddingX:28,reservedHeight:150};
