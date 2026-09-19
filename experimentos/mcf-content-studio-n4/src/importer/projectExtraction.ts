import type {ProjectExtractionCandidate,ProjectExtractionPlan} from './projectTypes';

export type CandidateDecision='ELIGIBLE'|'REVIEW_REQUIRED'|'REJECTED';

const supportedSource=/\.(tsx?|jsx?|json|svg|css)$/i;

export const evaluateProjectCandidate=(candidate:ProjectExtractionCandidate):CandidateDecision=>{
  if(!supportedSource.test(candidate.path)) return 'REJECTED';
  if(candidate.dynamicCode) return 'REVIEW_REQUIRED';
  if(candidate.networkRequired) return 'REVIEW_REQUIRED';
  if(candidate.dependencies.some((dep)=>/^(latest|\*)$/.test(dep.split('@').at(-1)??''))) return 'REVIEW_REQUIRED';
  if(candidate.dependencies.length>8) return 'REVIEW_REQUIRED';
  return 'ELIGIBLE';
};

export const buildExtractionQueue=(plan:ProjectExtractionPlan)=>{
  if(!plan.source.license.reviewed) return [];
  return plan.candidates
    .map((candidate)=>({...candidate,status:evaluateProjectCandidate(candidate)}))
    .filter((candidate)=>candidate.status!=='REJECTED');
};

export const summarizeExtraction=(plan:ProjectExtractionPlan)=>{
  const queue=buildExtractionQueue(plan);
  return {
    extractionId:plan.extractionId,
    sourceRevision:plan.source.revision,
    eligible:queue.filter((x)=>x.status==='ELIGIBLE').map((x)=>x.id),
    reviewRequired:queue.filter((x)=>x.status==='REVIEW_REQUIRED').map((x)=>x.id),
    rejected:plan.candidates.filter((x)=>evaluateProjectCandidate(x)==='REJECTED').map((x)=>x.id),
  };
};
