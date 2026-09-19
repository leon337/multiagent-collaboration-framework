import {describe,expect,it} from 'vitest';
import architecture from '../src/templates/architecture-control-plane.lesson.json';
import uiCode from '../src/templates/ui-code-agent-flow.lesson.json';
import registry from '../registry/registry.json';
import type {TechnicalLessonSpec} from '../src/templates/types';
import {getTechnicalLessonDuration} from '../src/templates/types';

const lessons=[architecture as TechnicalLessonSpec,uiCode as TechnicalLessonSpec];

describe('N4 scale lesson payloads',()=>{
  const registered=new Set(registry.components.map((component)=>component.id));

  it('uses only registry components',()=>{
    for(const lesson of lessons){
      for(const scene of lesson.scenes) expect(registered.has(scene.componentId)).toBe(true);
    }
  });

  it('uses the same generic lesson shape',()=>{
    for(const lesson of lessons){
      expect(lesson.scenes.length).toBeGreaterThanOrEqual(5);
      expect(lesson.narration.cues.length).toBe(lesson.scenes.length);
      expect(getTechnicalLessonDuration(lesson)).toBeGreaterThan(0);
    }
  });

  it('proves materially different component mixes',()=>{
    const architectureIds=new Set(architecture.scenes.map((scene)=>scene.componentId));
    const uiIds=new Set(uiCode.scenes.map((scene)=>scene.componentId));
    expect([...architectureIds].some((id)=>!uiIds.has(id))).toBe(true);
    expect([...uiIds].some((id)=>!architectureIds.has(id))).toBe(true);
  });
});
