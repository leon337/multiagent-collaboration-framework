import type {AspectRatio} from '../lib/types';
import {designTokens} from '../lib/tokens';

export type FigmaTypographyToken={
  fontFamily:string;
  fontSize:number;
  fontWeight:number;
  lineHeight:number;
};

export type FigmaBridgeSpec={
  bridgeVersion:string;
  source:{kind:'figma';fileKey:string;nodeId:string;capturedAt:string};
  tokens:{
    colors:Record<string,string>;
    spacing:Record<string,number>;
    radius:Record<string,number>;
    typography:Record<string,FigmaTypographyToken>;
  };
  component:{
    name:string;
    kind:'card'|'callout'|'quiz'|'terminal'|'browser'|'architecture-node'|'header'|'progress-bar'|'custom';
    width:number;
    height:number;
    props:Record<string,unknown>;
    bindings:Record<string,string>;
  };
};

export type N4TokenSnapshot={
  colors:Record<string,string>;
  spacing:Record<string,number>;
  radius:Record<string,number>;
  typography:Record<string,FigmaTypographyToken>;
};

export const n4TokenSnapshot=():N4TokenSnapshot=>({
  colors:{...designTokens.color},
  spacing:Object.fromEntries(Object.entries(designTokens.spacing).map(([key,value])=>[key,Number(value)])),
  radius:Object.fromEntries(Object.entries(designTokens.radius).map(([key,value])=>[key,Number(value)])),
  typography:{
    title:{fontFamily:'Inter',fontSize:64,fontWeight:800,lineHeight:1.05},
    body:{fontFamily:'Inter',fontSize:34,fontWeight:400,lineHeight:1.35},
    label:{fontFamily:'Inter',fontSize:24,fontWeight:700,lineHeight:1.2},
  },
});

const tokenValue=(spec:FigmaBridgeSpec,path:string):unknown=>{
  const parts=path.split('.');
  let value:unknown=spec.tokens;
  for(const part of parts){
    if(!value||typeof value!=='object') return undefined;
    value=(value as Record<string,unknown>)[part];
  }
  return value;
};

export const resolveFigmaBindings=(spec:FigmaBridgeSpec)=>{
  const resolved:Record<string,unknown>={};
  for(const [prop,tokenPath] of Object.entries(spec.component.bindings)){
    resolved[prop]=tokenValue(spec,tokenPath);
  }
  return resolved;
};

export const toN4ComponentDefaults=(spec:FigmaBridgeSpec,aspect:AspectRatio='9:16')=>({
  ...spec.component.props,
  ...resolveFigmaBindings(spec),
  aspect,
});

export const compareTokenSnapshots=(figma:FigmaBridgeSpec['tokens'],n4=N4TokenSnapshot())=>{
  const conflicts:string[]=[];
  for(const [name,value] of Object.entries(figma.colors)){
    if(name in n4.colors&&n4.colors[name]!==value) conflicts.push(`colors.${name}`);
  }
  for(const [name,value] of Object.entries(figma.spacing)){
    if(name in n4.spacing&&n4.spacing[name]!==value) conflicts.push(`spacing.${name}`);
  }
  for(const [name,value] of Object.entries(figma.radius)){
    if(name in n4.radius&&n4.radius[name]!==value) conflicts.push(`radius.${name}`);
  }
  return conflicts;
};
