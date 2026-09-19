import type {ComponentType} from 'react';

export type LabAspect='9:16'|'16:9';

export type LabEntry={
  id:string;
  name:string;
  category:string;
  status:string;
  supportedAspects:LabAspect[];
  durationInFrames:number;
  defaultProps:Record<string,unknown>;
  editableProps:string[];
  component:ComponentType<any>;
};

export type LabTemplate={
  id:string;
  name:string;
  purpose:string;
  supportedAspects:LabAspect[];
  componentIds:string[];
  status:string;
};
