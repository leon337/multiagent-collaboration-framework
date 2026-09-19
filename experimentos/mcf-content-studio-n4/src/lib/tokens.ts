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
    ? {aspect,width:1080,height:1920,fps:30,safeInsets:{top:120,right:72,bottom:220,left:72},reducedMotion}
    : {aspect,width:1920,height:1080,fps:30,safeInsets:{top:72,right:96,bottom:96,left:96},reducedMotion};
