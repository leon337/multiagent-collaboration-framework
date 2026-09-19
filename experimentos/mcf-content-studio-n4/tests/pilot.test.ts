import {describe,expect,it} from 'vitest';
import {RUNTIME_AGENTICO_PILOT,RUNTIME_AGENTICO_PILOT_DURATION} from '../src/pilot/lesson';

describe('Runtime Agentico N4 pilot',()=>{
  it('has contiguous scenes',()=>{
    let cursor=0;
    for(const scene of RUNTIME_AGENTICO_PILOT.scenes){
      expect(scene.from).toBe(cursor);
      cursor+=scene.duration;
    }
    expect(cursor).toBe(RUNTIME_AGENTICO_PILOT_DURATION);
  });

  it('keeps a meaningful visual duration',()=>{
    expect(RUNTIME_AGENTICO_PILOT_DURATION/RUNTIME_AGENTICO_PILOT.fps).toBeGreaterThan(60);
  });
});
