import {describe,expect,it} from 'vitest';
import manifest from '../src/importer/rendercomp-bounce-in-headline.manifest.json';
import {decideImport} from '../src/importer/policy';
import type {ImportManifest} from '../src/importer/types';
import registry from '../registry/registry.json';

describe('RenderComp BounceInHeadline import',()=>{
  it('is pinned and eligible for approval after adaptation',()=>{
    expect(manifest.source.revision).toBe('f648980e528defb7594e24c6447055f0540f340b');
    expect(manifest.license.id).toBe('MIT');
    expect(decideImport(manifest as ImportManifest)).toBe('ELIGIBLE_FOR_APPROVAL');
  });

  it('stays non-automatic until preview evidence exists',()=>{
    const entry=registry.components.find((component)=>component.id==='bounce-headline-n4');
    expect(entry?.status).toBe('ADAPTED');
  });
});
