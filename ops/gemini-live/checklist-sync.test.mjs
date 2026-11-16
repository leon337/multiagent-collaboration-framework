import test from 'node:test';
import assert from 'node:assert/strict';
import {buildObservation,reconcile} from './checklist-sync.mjs';
const SHA='0123456789abcdef0123456789abcdef01234567';
const pr={number:528,draft:true,head:{ref:'mission/gemini-live-evolution-20261116-001',sha:SHA}};
const issue={body:'# MCF-GEMINI-LIVE-EVOLUTION-20261116-001\n- [ ] F0.7\n- [ ] F0.8'};
const checks={check_runs:[{head_sha:SHA,status:'completed',conclusion:'success'},{head_sha:SHA,status:'completed',conclusion:'failure'}]};
function fake({comments=[],postFn}={}){
 const posts=[];
 const transport={
 get:async(path)=>{
  if(path==='/pulls/528')return pr;
  if(path==='/issues/527')return issue;
  if(path.includes('/check-runs'))return checks;
  if(path.includes('/comments'))return comments;
  throw Error('unexpected-path');
 },
 post:async(path,body)=>{posts.push({path,body});if(postFn)await postFn();}
 };
 return {transport,posts};
}
test('valid observation is evidence-only and leaves checklist unchecked',()=>{
 const r=buildObservation(pr,checks.check_runs,issue.body);
 assert.equal(r.changedCheckboxes,false);assert.equal(r.passed,1);assert.equal(r.failed,1);
 assert.match(r.comment,/NÃO alterar checkboxes/);
});
test('rejects mismatched branch',()=>{
 assert.throws(()=>buildObservation({...pr,head:{...pr.head,ref:'other'}},[],issue.body),/unexpected-pr/);
});
test('rejects mismatched mission/issue',()=>{
 assert.throws(()=>buildObservation(pr,[],'wrong issue'),/unexpected-issue/);
});
test('rejects malformed SHA',()=>{
 assert.throws(()=>buildObservation({...pr,head:{...pr.head,sha:'nope'}},[],issue.body),/invalid-sha/);
});
test('DRY_RUN cannot call write endpoint',async()=>{
 const f=fake();const r=await reconcile({transport:f.transport});
 assert.equal(r.action,'DRY_RUN');assert.equal(f.posts.length,0);
});
test('WRITE requires explicit opt-in environment',async()=>{
 const f=fake();await assert.rejects(reconcile({transport:f.transport,apply:true,token:'mock'}),/write-requires/);
 assert.equal(f.posts.length,0);
});
test('WRITE requires token even with opt-in',async()=>{
 const f=fake();await assert.rejects(reconcile({transport:f.transport,apply:true,applyEnv:'1'}),/write-requires-token/);
 assert.equal(f.posts.length,0);
});
test('duplicate comment is skipped idempotently',async()=>{
 const preview=buildObservation(pr,checks.check_runs,issue.body);
 const f=fake({comments:[{body:preview.comment}]});
 const r=await reconcile({transport:f.transport,apply:true,applyEnv:'1',token:'mock',now:'2026-11-16T00:00:00Z'});
 assert.equal(r.action,'ALREADY_RECORDED');assert.equal(f.posts.length,0);
});
test('opt-in writes COMMENT ONLY; never modifies issue body or checkbox',async()=>{
 const f=fake();
 const r=await reconcile({transport:f.transport,apply:true,applyEnv:'1',token:'mock'});
 assert.equal(r.action,'COMMENT_ONLY');
 assert.equal(f.posts.length,1);assert.equal(f.posts[0].path,'/issues/527/comments');
 assert.equal(r.changedCheckboxes,false);
});
