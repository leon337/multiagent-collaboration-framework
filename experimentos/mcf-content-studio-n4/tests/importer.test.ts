import {describe,expect,it} from 'vitest';
import {decideImport} from '../src/importer/policy';
import {validateImportManifest} from '../src/importer/validate';
import type {ImportManifest} from '../src/importer/types';

const valid:ImportManifest={
  importId:'sample-component',
  source:{url:'https://example.com/repo',revision:'abc123',retrievedAt:'2026-09-19T00:00:00Z'},
  license:{id:'MIT',evidence:'LICENSE@abc123',reviewed:true},
  dependencies:[{name:'demo',version:'1.0.0',purpose:'fixture'}],
  security:{reviewed:true,networkRequired:false,dynamicCode:false,findings:[]},
  performance:{reviewed:true,notes:['fixture']},
  adaptation:{targetComponentId:'sample',changes:['adapted'],tests:['preview']},
  status:'ADAPTED',
};

describe('governed importer',()=>{
  it('accepts a reviewed adapted manifest as eligible',()=>{
    expect(validateImportManifest(valid).ok).toBe(true);
    expect(decideImport(valid)).toBe('ELIGIBLE_FOR_APPROVAL');
  });

  it('requires review for wildcard dependencies',()=>{
    const manifest={...valid,dependencies:[{name:'demo',version:'latest',purpose:'fixture'}]};
    expect(decideImport(manifest)).toBe('REVIEW_REQUIRED');
  });

  it('requires review for network access',()=>{
    const manifest={...valid,security:{...valid.security,networkRequired:true}};
    expect(decideImport(manifest)).toBe('REVIEW_REQUIRED');
  });
});
