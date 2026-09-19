import type {AspectRatio} from '../lib/types';
import {designTokens} from '../lib/tokens';

export type AdobeExpressSource={
  kind:'adobe-express';
  templateURN:string;
  documentURN:string;
  capturedAt:string;
  aspectRatio:number;
  temporaryDocument:boolean;
  editorUrl?:string;
  previewUrl?:string;
};

export type AdobeExpressInspection={
  textEditing:boolean;
  imageReplacement:boolean;
  backgroundEditing:boolean;
  animation:boolean;
  pdfExport:boolean;
  nodeIntrospection:false;
  tokenIntrospection:false;
};

export type AdobeExpressBridgeSpec={
  bridgeVersion:string;
  source:AdobeExpressSource;
  inspection:AdobeExpressInspection;
  handoffMode:'visual-reference-plus-n4-target-tokens';
  target:{
    componentId:string;
    aspect:AspectRatio;
    props:Record<string,unknown>;
    tokens:{
      colors:Record<string,string>;
      spacing:Record<string,number>;
      radius:Record<string,number>;
    };
  };
  evidence:{
    authoringInstruction:string;
    sourceIsTemporary:boolean;
    claims:string[];
    nonClaims:string[];
  };
};

export const adobeExpressN4TokenSnapshot=()=>({
  colors:{...designTokens.color},
  spacing:Object.fromEntries(Object.entries(designTokens.spacing).map(([key,value])=>[key,Number(value)])),
  radius:Object.fromEntries(Object.entries(designTokens.radius).map(([key,value])=>[key,Number(value)])),
});

export const validateAdobeExpressBridge=(spec:AdobeExpressBridgeSpec)=>{
  const findings:string[]=[];
  if(spec.source.kind!=='adobe-express') findings.push('SOURCE_KIND_INVALID');
  if(!spec.source.templateURN.startsWith('urn:')) findings.push('TEMPLATE_URN_INVALID');
  if(!spec.source.documentURN.startsWith('urn:')) findings.push('DOCUMENT_URN_INVALID');
  if(spec.inspection.nodeIntrospection!==false) findings.push('NODE_INTROSPECTION_MUST_NOT_BE_CLAIMED');
  if(spec.inspection.tokenIntrospection!==false) findings.push('TOKEN_INTROSPECTION_MUST_NOT_BE_CLAIMED');
  if(spec.handoffMode!=='visual-reference-plus-n4-target-tokens') findings.push('HANDOFF_MODE_INVALID');
  if(!spec.target.componentId) findings.push('TARGET_COMPONENT_REQUIRED');
  if(!spec.evidence.nonClaims.includes('pixel-perfect parity')) findings.push('PIXEL_PARITY_NON_CLAIM_REQUIRED');
  return findings;
};

export const toN4Handoff=(spec:AdobeExpressBridgeSpec)=>({
  componentId:spec.target.componentId,
  aspect:spec.target.aspect,
  props:{...spec.target.props},
  provenance:{
    sourceKind:spec.source.kind,
    templateURN:spec.source.templateURN,
    documentURN:spec.source.documentURN,
    temporaryDocument:spec.source.temporaryDocument,
    capturedAt:spec.source.capturedAt,
  },
});
