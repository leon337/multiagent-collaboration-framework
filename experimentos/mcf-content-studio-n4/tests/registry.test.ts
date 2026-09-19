import {describe,expect,it} from 'vitest';
import registry from '../registry/registry.json';

describe('N4 registry',()=>{
  it('has unique component ids',()=>{
    const ids=registry.components.map((component)=>component.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps approved components pinned to license evidence',()=>{
    for(const component of registry.components.filter((item)=>item.status==='APPROVED')){
      expect(component.license.id.length).toBeGreaterThan(0);
      expect(component.license.evidence.length).toBeGreaterThan(0);
      expect(component.supportedAspects.length).toBeGreaterThan(0);
    }
  });

  it('references only registered components from templates',()=>{
    const ids=new Set(registry.components.map((component)=>component.id));
    for(const template of registry.templates){
      for(const componentId of template.componentIds) expect(ids.has(componentId)).toBe(true);
    }
  });
});
