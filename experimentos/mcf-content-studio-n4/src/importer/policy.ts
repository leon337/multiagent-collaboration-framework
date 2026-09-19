import type {ImportManifest} from './types';
import {validateImportManifest} from './validate';

export type ImportDecision='REJECT'|'REVIEW_REQUIRED'|'ELIGIBLE_FOR_APPROVAL';

export const decideImport=(manifest:ImportManifest):ImportDecision=>{
  if(manifest.status==='REJECTED') return 'REJECT';
  if(manifest.security.dynamicCode) return 'REVIEW_REQUIRED';
  if(manifest.security.networkRequired) return 'REVIEW_REQUIRED';
  if(manifest.dependencies.some((dep)=>dep.version==='*'||dep.version==='latest')) return 'REVIEW_REQUIRED';
  const result=validateImportManifest(manifest);
  return result.ok?'ELIGIBLE_FOR_APPROVAL':'REVIEW_REQUIRED';
};
