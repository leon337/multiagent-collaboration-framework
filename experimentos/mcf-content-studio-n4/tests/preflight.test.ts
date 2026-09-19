import {describe,expect,it} from 'vitest';
import lesson from '../src/templates/runtime-agentico-data-demo.lesson.json';
import type {TechnicalLessonSpec} from '../src/templates/types';
import {preflightPasses,runLessonPreflight} from '../src/preflight/preflight';
import {toPreflightPayload} from '../src/preflight/adapter';

const spec=lesson as TechnicalLessonSpec;

describe('N4 lesson preflight',()=>{
  it('accepts the current data-driven demo without errors',()=>{
    const findings=runLessonPreflight(spec);
    expect(findings.filter((x)=>x.severity==='error')).toEqual([]);
    expect(preflightPasses(findings)).toBe(true);
  });

  it('detects narration beyond timeline',()=>{
    const broken={...spec,narration:{cues:[{from:0,to:9999,text:'too long'}]}};
    expect(runLessonPreflight(broken).map((x)=>x.code)).toContain('NARRATION_EXCEEDS_TIMELINE');
  });

  it('detects internal labels',()=>{
    const broken={
      ...spec,
      scenes:[{...spec.scenes[0]!,props:{title:'DEBUG INTERNAL_ONLY'}}]
    };
    expect(runLessonPreflight(broken).map((x)=>x.code)).toContain('INTERNAL_LABEL_LEAK');
  });

  it('exports an adapter-neutral preflight payload',()=>{
    const payload=toPreflightPayload(spec);
    expect(payload.expectedAudio).toBe(true);
    expect(payload.scenes).toHaveLength(spec.scenes.length);
  });
});
