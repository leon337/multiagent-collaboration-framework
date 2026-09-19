import {describe,expect,it} from 'vitest';
import lesson from '../src/templates/runtime-agentico-data-demo.lesson.json';
import type {TechnicalLessonSpec} from '../src/templates/types';
import {reorderScene,serializeLesson,updateSceneDuration} from '../src/authoring/lessonOps';
import {searchTemplates} from '../src/authoring/templateSearch';

const spec=lesson as TechnicalLessonSpec;

describe('N4 authoring core',()=>{
  it('reorders scenes without mutating the source',()=>{
    const next=reorderScene(spec,0,1);
    expect(next.scenes[0]!.id).toBe(spec.scenes[1]!.id);
    expect(spec.scenes[0]!.id).toBe('orientation');
  });

  it('updates scene duration with a safe positive frame count',()=>{
    const next=updateSceneDuration(spec,0,0);
    expect(next.scenes[0]!.durationFrames).toBe(1);
  });

  it('exports stable JSON',()=>{
    expect(JSON.parse(serializeLesson(spec)).lesson.id).toBe(spec.lesson.id);
  });

  it('finds templates by component compatibility',()=>{
    expect(searchTemplates({componentId:'active-recall'}).map((x)=>x.id)).toContain('technical-lesson-n4');
  });
});
