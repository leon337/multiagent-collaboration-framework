import {describe,expect,it} from 'vitest';
import spec from '../qa/visual-smoke-spec.json';

describe('visual QA contract',()=>{
  it('has explicit checks for every smoke composition',()=>{
    expect(spec.compositions.length).toBeGreaterThan(0);
    for(const item of spec.compositions) expect(item.checks.length).toBeGreaterThanOrEqual(2);
  });

  it('keeps portrait smoke as the first mobile target',()=>{
    expect(spec.compositions.every((item)=>item.aspect==='9:16')).toBe(true);
  });
});
