import type {ComponentType} from 'react';

export type LabAspect='9:16'|'16:9';

export type LabEntry={
  id:string;
  name:string;
  category:string;
  durationInFrames:number;
  defaultProps:Record<string,unknown>;
  editableProps:string[];
  component:ComponentType<any>;
};
