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
