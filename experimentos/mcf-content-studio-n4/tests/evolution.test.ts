import {describe,expect,it} from 'vitest';
import {searchAssets} from '../src/assets/searchAssets';
import {getMotionPreset,resolveMotionStyle} from '../src/motion/presets';
import {searchComponentManifests} from '../src/registry/search';
import lesson from '../src/templates/runtime-agentico-data-demo.lesson.json';
import {getTechnicalLessonDuration,type TechnicalLessonSpec} from '../src/templates/types';

describe('N4 evolution foundations',()=>{
  it('finds approved assets by semantic usage metadata',()=>{
    expect(searchAssets({usage:'sandbox'}).map((x)=>x.id)).toContain('sandbox-boundary-icon');
  });

  it('resolves implemented motion styles deterministically',()=>{
    expect(getMotionPreset('fade')?.status).toBe('IMPLEMENTED');
    expect(resolveMotionStyle('fade',0.5).opacity).toBe(0.5);
  });

  it('discovers components by pedagogical intent',()=>{
    expect(searchComponentManifests({intent:'retrieval-practice',status:'APPROVED'}).map((x)=>x.id)).toContain('active-recall');
  });

  it('derives lesson duration from scene data',()=>{
    expect(getTechnicalLessonDuration(lesson as TechnicalLessonSpec)).toBe(570);
  });
});
