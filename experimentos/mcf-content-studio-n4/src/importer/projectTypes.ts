export type ProjectCandidateKind='component'|'motion'|'template'|'asset';
export type ProjectCandidateStatus='DISCOVERED'|'ELIGIBLE'|'REVIEW_REQUIRED'|'REJECTED';

export type ProjectExtractionCandidate={
  id:string;
  path:string;
  kind:ProjectCandidateKind;
  reason:string;
  dependencies:string[];
  networkRequired:boolean;
  dynamicCode:boolean;
  assetRefs:string[];
  status:ProjectCandidateStatus;
};

export type ProjectExtractionPlan={
  extractionId:string;
  source:{
    url:string;
    revision:string;
    license:{id:string;evidence:string;reviewed:boolean};
  };
  candidates:ProjectExtractionCandidate[];
  status:'DISCOVERED'|'REVIEWED'|'EXTRACTED'|'REJECTED';
};
