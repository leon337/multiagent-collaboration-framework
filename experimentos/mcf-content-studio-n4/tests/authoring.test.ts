// Authoring core invariants are validated under strict TypeScript.
import {describe,expect,it} from 'vitest';
import lesson from '../src/templates/runtime-agentico-data-demo.lesson.json';
import type {TechnicalLessonSpec} from '../src/templates/types';
import {reorderScene,serializeLesson,updateSceneComponent,updateSceneDuration} from '../src/authoring/lessonOps';
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

  it('finds templates by pedagogical intent',()=>{
    expect(searchTemplates({intent:'retrieval-practice'}).map((x)=>x.id)).toContain('technical-lesson-n4');
  });

  it('can replace a scene component and reset its props',()=>{
    const next=updateSceneComponent(spec,0,'title',{title:'Novo título'});
    expect(next.scenes[0]!.componentId).toBe('title');
    expect(next.scenes[0]!.props).toEqual({title:'Novo título'});
  });
});
