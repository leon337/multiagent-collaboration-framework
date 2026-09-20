import {describe,expect,it} from 'vitest';
import placeholder from '../figma/bridge.placeholder.json';
import type {FigmaBridgeSpec} from '../src/figma/bridge';
import {compareTokenSnapshots,resolveFigmaBindings,toN4ComponentDefaults} from '../src/figma/bridge';

const spec=placeholder as FigmaBridgeSpec;

describe('N4 Figma bridge',()=>{
  it('resolves token bindings deterministically',()=>{
    expect(resolveFigmaBindings(spec)).toMatchObject({
      background:'rgba(255,255,255,.86)',
      accent:'#2d5bff',
      radius:32,
      padding:40,
    });
  });

  it('maps a bridge spec into N4 defaults',()=>{
    expect(toN4ComponentDefaults(spec,'16:9')).toMatchObject({
      title:'O modelo decide',
      aspect:'16:9',
      accent:'#2d5bff',
    });
  });

  it('detects no conflicts in the code-aligned placeholder snapshot',()=>{
    expect(compareTokenSnapshots(spec.tokens)).toEqual([]);
  });
});
