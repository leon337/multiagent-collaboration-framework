import {describe,expect,it} from 'vitest';
import lesson from '../src/templates/runtime-agentico-data-demo.lesson.json';
import type {TechnicalLessonSpec} from '../src/templates/types';
import {updateSceneComponent,updateSceneMotion} from '../src/authoring/lessonOps';

const spec=lesson as TechnicalLessonSpec;

describe('Video Lab V3 authoring operations',()=>{
  it('changes scene component without creating a bespoke composition',()=>{
    expect(updateSceneComponent(spec,1,'definition').scenes[1]?.componentId).toBe('definition');
  });

  it('stores a motion preset at scene level',()=>{
    expect(updateSceneMotion(spec,1,'fade').scenes[1]?.motionPreset).toBe('fade');
  });
});
