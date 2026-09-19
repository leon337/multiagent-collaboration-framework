import registryData from '../../registry/registry.json';

export type TemplateSearchQuery={
  text?:string;
  componentId?:string;
  aspect?:'9:16'|'16:9';
  status?:string;
};

export const searchTemplates=(query:TemplateSearchQuery={})=>{
  const text=query.text?.trim().toLowerCase();
  return registryData.templates.filter((template)=>{
    if(text&&!(
      template.id.toLowerCase().includes(text)||
      template.displayName.toLowerCase().includes(text)||
      template.purpose.toLowerCase().includes(text)
    )) return false;
    if(query.componentId&&!template.componentIds.includes(query.componentId)) return false;
    if(query.aspect&&!template.supportedAspects.includes(query.aspect)) return false;
    if(query.status&&template.status!==query.status) return false;
    return true;
  });
};
