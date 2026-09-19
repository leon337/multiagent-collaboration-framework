import {describe,expect,it} from 'vitest';
import fixture from '../instavar/proof-walkthrough.fixture.json';
import {fromInstavarVideoSpec,toInstavarVideoSpec,type InstavarVideoSpec} from '../src/preflight/instavar';
import lesson from '../src/templates/runtime-agentico-data-demo.lesson.json';
import type {TechnicalLessonSpec} from '../src/templates/types';

describe('native Instavar VideoSpec 1.0 bridge',()=>{
  it('adapts the real proof-walkthrough scaffold into approved N4 component ids',()=>{
    const spec=fromInstavarVideoSpec(fixture as InstavarVideoSpec);
    expect(spec.visuals.aspect).toBe('9:16');
    expect(spec.scenes.map(scene=>scene.componentId)).toEqual(['title','code-panel','callout']);
  });
  it('round-trips an N4 lesson into the verified Instavar 1.0 contract',()=>{
    const out=toInstavarVideoSpec(lesson as TechnicalLessonSpec);
    expect(out.schemaVersion).toBe('1.0');
    expect(out.templateFamily).toBe('proof-walkthrough');
    expect(out.target.aspect).toBe('9:16');
    expect(out.audio?.ducking).toBe(true);
  });
  it('does not claim native 16:9 support that the verified contract lacks',()=>{
    expect(()=>toInstavarVideoSpec({...lesson,visuals:{aspect:'16:9',reducedMotion:false}} as TechnicalLessonSpec)).toThrow(/does not expose 16:9/);
  });
});
