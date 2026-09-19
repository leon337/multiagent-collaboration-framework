export type ImportStatus='DISCOVERED'|'REVIEWED'|'ADAPTED'|'APPROVED'|'REJECTED';

export type ImportManifest={
  importId:string;
  source:{url:string;revision:string;retrievedAt:string};
  license:{id:string;evidence:string;reviewed:boolean};
  dependencies:Array<{name:string;version:string;purpose:string}>;
  security:{reviewed:boolean;networkRequired:boolean;dynamicCode:boolean;findings:string[]};
  performance:{reviewed:boolean;notes:string[]};
  adaptation:{targetComponentId:string;changes:string[];tests:string[]};
  status:ImportStatus;
};

export type ProjectSourceFile={
  path:string;
  content?:string;
  sizeBytes?:number;
};

export type ProjectSnapshot={
  source:{url:string;revision:string};
  dependencies:Record<string,string>;
  files:ProjectSourceFile[];
};

export type ProjectImportCandidate={
  path:string;
  kind:'component'|'composition'|'utility';
  signals:string[];
  riskSignals:string[];
};

export type ProjectExtractionResult={
  remotionDetected:boolean;
  candidates:ProjectImportCandidate[];
  projectFindings:string[];
};

