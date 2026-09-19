import {describe,expect,it} from 'vitest';
import extraction from '../src/importer/project-extraction.fixture.json';
import type {ProjectExtractionPlan} from '../src/importer/projectTypes';
import {buildExtractionQueue,summarizeExtraction} from '../src/importer/projectExtraction';
import {searchTemplates} from '../src/registry/templateSearch';

describe('N4 discovery and project extraction',()=>{
  it('finds a learning architecture template by intent and node count',()=>{
    const result=searchTemplates({intent:'architecture',nodes:5,aspect:'9:16',learning:true,status:'APPROVED'});
    expect(result[0]?.id).toBe('technical-lesson-n4');
  });

  it('rejects templates outside the supported node range',()=>{
    expect(searchTemplates({intent:'architecture',nodes:99})).toHaveLength(0);
  });

  it('extracts eligible project candidates without blindly copying the project',()=>{
    const plan=extraction as ProjectExtractionPlan;
    const queue=buildExtractionQueue(plan);
    expect(queue.find((x)=>x.id==='bounce-headline')?.status).toBe('ELIGIBLE');
    expect(queue.find((x)=>x.id==='remote-demo')?.status).toBe('REVIEW_REQUIRED');
    expect(queue.some((x)=>x.id==='readme')).toBe(false);
  });

  it('summarizes extraction decisions',()=>{
    const summary=summarizeExtraction(extraction as ProjectExtractionPlan);
    expect(summary.eligible).toContain('bounce-headline');
    expect(summary.reviewRequired).toContain('remote-demo');
    expect(summary.rejected).toContain('readme');
  });
});
