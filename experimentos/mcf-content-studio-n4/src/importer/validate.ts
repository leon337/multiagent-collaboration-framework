import type {ImportManifest} from './types';

export type ValidationResult={ok:boolean;errors:string[]};

export const validateImportManifest=(manifest:ImportManifest):ValidationResult=>{
  const errors:string[]=[];
  if(!manifest.importId.trim()) errors.push('importId is required');
  if(!/^https?:\/\//.test(manifest.source.url)) errors.push('source.url must be http(s)');
  if(!manifest.source.revision.trim()) errors.push('source.revision is required');
  if(!manifest.license.reviewed) errors.push('license must be reviewed');
  if(!manifest.license.evidence.trim()) errors.push('license evidence is required');
  if(!manifest.security.reviewed) errors.push('security review is required');
  if(manifest.security.dynamicCode) errors.push('dynamic code requires manual rejection or dedicated review');
  if(!manifest.performance.reviewed) errors.push('performance review is required');
  if(!manifest.adaptation.targetComponentId.trim()) errors.push('target component id is required');
  if(manifest.adaptation.tests.length===0) errors.push('at least one adaptation test is required');
  if(manifest.status==='APPROVED'&&errors.length>0) errors.push('manifest cannot be APPROVED with unresolved findings');
  return {ok:errors.length===0,errors};
};

export const canPromoteToApproved=(manifest:ImportManifest)=>{
  const result=validateImportManifest({...manifest,status:'ADAPTED'});
  return result.ok&&manifest.status==='ADAPTED';
};
