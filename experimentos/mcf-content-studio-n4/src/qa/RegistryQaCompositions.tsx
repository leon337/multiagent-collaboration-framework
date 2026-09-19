import {labEntries} from '../registry/registry';

export type RegistryQaProps={
  componentId:string;
  reducedMotion?:boolean;
};

const RegistryComponentQa=({componentId,aspect,reducedMotion=false}:{componentId:string;aspect:'9:16'|'16:9';reducedMotion?:boolean})=>{
  const entry=labEntries.find((item)=>item.id===componentId);
  if(!entry) throw new Error(`Unknown registry component: ${componentId}`);
  if(!entry.supportedAspects.includes(aspect)) throw new Error(`${componentId} does not support ${aspect}`);
  const Component=entry.component;
  return <Component {...entry.defaultProps} aspect={aspect} reducedMotion={reducedMotion}/>;
};

export const RegistryComponentQaPortrait=({componentId,reducedMotion=false}:RegistryQaProps)=>
  <RegistryComponentQa componentId={componentId} aspect="9:16" reducedMotion={reducedMotion}/>;

export const RegistryComponentQaLandscape=({componentId,reducedMotion=false}:RegistryQaProps)=>
  <RegistryComponentQa componentId={componentId} aspect="16:9" reducedMotion={reducedMotion}/>;
