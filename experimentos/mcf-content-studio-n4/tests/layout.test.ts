import {describe,expect,it} from 'vitest';
import {layoutFor} from '../src/lib/tokens';

describe('layout contexts',()=>{
  it('keeps portrait safe area away from player controls',()=>{
    const layout=layoutFor('9:16');
    expect(layout.width).toBe(1080);
    expect(layout.height).toBe(1920);
    expect(layout.safeInsets.bottom).toBeGreaterThan(layout.safeInsets.top);
  });

  it('supports landscape',()=>{
    const layout=layoutFor('16:9',true);
    expect(layout.width).toBe(1920);
    expect(layout.height).toBe(1080);
    expect(layout.reducedMotion).toBe(true);
  });
});
