import {describe,expect,it} from 'vitest';
import {decideImport} from '../src/importer/policy';
import {validateImportManifest} from '../src/importer/validate';
import type {ImportManifest,ProjectSnapshot} from '../src/importer/types';
import {extractProjectCandidates} from '../src/importer/projectExtract';

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
    it('extracts candidate components from a project snapshot without trusting them',()=>{
    const snapshot:ProjectSnapshot={
      source:{url:'https://example.com/remotion-project',revision:'deadbeef'},
      dependencies:{remotion:'4.0.0',react:'19.0.0'},
      files:[
        {path:'src/Title.tsx',content:"export const Title=()=> <div>Hi</div>;"},
        {path:'src/Root.tsx',content:"import {Composition} from 'remotion'; export const Root=()=> <Composition id='X' component={Title} durationInFrames={90} fps={30} width={1080} height={1920}/>;"},
        {path:'src/net.ts',content:"export const load=()=>fetch('https://example.com/data')"},
        {path:'node_modules/x.ts',content:"export const Ignore=()=>null"},
      ]
    };
    const result=extractProjectCandidates(snapshot);
    expect(result.remotionDetected).toBe(true);
    expect(result.candidates.map((candidate)=>candidate.path)).toEqual(['src/Root.tsx','src/Title.tsx']);
    expect(result.projectFindings).toEqual([]);
  });

  it('flags project candidates that require security review',()=>{
    const snapshot:ProjectSnapshot={
      source:{url:'https://example.com/remotion-project',revision:'deadbeef'},
      dependencies:{remotion:'4.0.0'},
      files:[{path:'src/Risky.tsx',content:"export const Risky=()=>{fetch('https://example.com');return <div/>}"}]
    };
    const result=extractProjectCandidates(snapshot);
    expect(result.candidates[0]?.riskSignals).toContain('network');
    expect(result.projectFindings).toContain('One or more candidates require manual security review.');
  });
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
