import test from 'node:test';
import assert from 'node:assert/strict';
import {buildObservation,reconcile} from './checklist-sync.mjs';
const SHA='0123456789abcdef0123456789abcdef01234567';
const ALT='fedcba9876543210fedcba9876543210fedcba98';
const pr={number:528,state:'open',draft:true,head:{ref:'mission/gemini-live-evolution-20261116-001',sha:SHA}};
const issue={body:'# MCF-GEMINI-LIVE-EVOLUTION-20261116-001\n- [ ] F0.8'};
const one={id:1,name:'test',head_sha:SHA,status:'completed',conclusion:'success'};
const two={id:2,name:'build',head_sha:SHA,status:'completed',conclusion:'failure'};
function fake({checks=[one,two],comments=[],secondPr=null,writeError=false,writePersists=false}={}){
 let prReads=0;const posts=[];const calls=[];
 const t={
  get:async(path)=>{
   calls.push(path);
   if(path==='/pulls/528')return (++prReads>=2&&secondPr)||pr;
   if(path==='/issues/527')return issue;
   if(path.startsWith('/commits/')&&path.includes('/check-runs')){
    const page=Number(new URL('https://x.invalid'+path).searchParams.get('page'));const start=(page-1)*100;
    return {check_runs:checks.slice(start,start+100)};
   }
   if(path.startsWith('/issues/527/comments')){
    const page=Number(new URL('https://x.invalid'+path).searchParams.get('page'));const start=(page-1)*100;
    return comments.slice(start,start+100);
   }
   throw Error('unexpected-path:'+path);
  },
  post:async(path,payload)=>{
   posts.push({path,payload});
   if(writeError){if(writePersists)comments.push({body:payload.body});throw Error('network-timeout');}
   comments.push({body:payload.body});
  }
 };
 return {t,posts,calls,comments};
}
test('counts checked states without changing checkboxes',()=>{
 const r=buildObservation(pr,[one,two],issue.body);
 assert.equal(r.changedCheckboxes,false);assert.equal(r.passed,1);assert.equal(r.failed,1);assert.equal(r.pending,0);
 assert.match(r.comment,/Nenhum checkbox/);
});
test('blocks mismatched PR branch',()=>assert.throws(()=>buildObservation({...pr,head:{...pr.head,ref:'other'}},[],issue.body),/unexpected-pr/));
test('blocks closed PR',()=>assert.throws(()=>buildObservation({...pr,state:'closed'},[],issue.body),/unexpected-pr/));
test('blocks mismatched issue',()=>assert.throws(()=>buildObservation(pr,[],'other'),/unexpected-issue/));
test('blocks malformed SHA',()=>assert.throws(()=>buildObservation({...pr,head:{...pr.head,sha:'invalid'}},[],issue.body),/invalid-sha/));
test('only checks with candidate SHA count',()=>{
 const r=buildObservation(pr,[one,{...two,head_sha:ALT}],issue.body);
 assert.equal(r.checkCount,1);assert.equal(r.ignoredOtherSha,1);
});
test('unknown successful-looking conclusions are not PASS',()=>{
 for(const c of ['neutral','skipped','',null,'weird']){
  const r=buildObservation(pr,[{...one,conclusion:c}],issue.body);
  assert.equal(r.passed,0);assert.equal(r.failed,0);assert.equal(r.pending,1);
 }
});
test('action_required startup_failure and stale are failures',()=>{
 for(const c of ['action_required','startup_failure','stale']){
  const r=buildObservation(pr,[{...one,conclusion:c}],issue.body);
  assert.equal(r.failed,1);
 }
});
test('checksum marker changes when names or conclusions change',()=>{
 const a=buildObservation(pr,[one,two],issue.body);
 const b=buildObservation(pr,[{...one,name:'other'},two],issue.body);
 const c=buildObservation(pr,[one,{...two,conclusion:'success'}],issue.body);
 assert.notEqual(a.marker,b.marker);assert.notEqual(a.marker,c.marker);
});
test('DRY_RUN makes no mutations',async()=>{
 const f=fake();const r=await reconcile({transport:f.t});
 assert.equal(r.action,'DRY_RUN');assert.equal(f.posts.length,0);
});
test('WRITE requires environment opt-in',async()=>{
 const f=fake();await assert.rejects(reconcile({transport:f.t,apply:true,token:'fake'}),/write-requires/);
});
test('WRITE requires token independently of opt-in',async()=>{
 const f=fake();await assert.rejects(reconcile({transport:f.t,apply:true,applyEnv:'1'}),/write-requires-token/);
});
test('duplicate comment is idempotently skipped',async()=>{
 const comment=buildObservation(pr,[one,two],issue.body).comment;
 const f=fake({comments:[{body:comment}]});
 const r=await reconcile({transport:f.t,apply:true,applyEnv:'1',token:'fake'});
 assert.equal(r.action,'ALREADY_RECORDED');assert.equal(f.posts.length,0);
});
test('opt-in writes only one issue comment',async()=>{
 const f=fake();const r=await reconcile({transport:f.t,apply:true,applyEnv:'1',token:'fake'});
 assert.equal(r.action,'COMMENT_ONLY');assert.equal(f.posts.length,1);
 assert.equal(f.posts[0].path,'/issues/527/comments');assert.equal(r.changedCheckboxes,false);
});
test('changes of HEAD between observation and write are blocked',async()=>{
 const f=fake({secondPr:{...pr,head:{...pr.head,sha:ALT}}});
 await assert.rejects(reconcile({transport:f.t,apply:true,applyEnv:'1',token:'fake'}),/pr-head-changed/);
 assert.equal(f.posts.length,0);
});
test('closed PR between observation and write is blocked',async()=>{
 const f=fake({secondPr:{...pr,state:'closed'}});
 await assert.rejects(reconcile({transport:f.t,apply:true,applyEnv:'1',token:'fake'}),/pr-head-changed/);
 assert.equal(f.posts.length,0);
});
test('pagination counts more than 100 checks',async()=>{
 const checks=Array.from({length:105},(_,i)=>({...one,id:i+1,name:'check-'+i}));
 const f=fake({checks});
 const r=await reconcile({transport:f.t});assert.equal(r.checkCount,105);assert.equal(r.passed,105);
 assert.ok(f.calls.some(p=>p.includes('page=2')));
});
test('pagination can find duplicate on second page of comments',async()=>{
 const marker=buildObservation(pr,[one,two],issue.body).comment;
 const comments=Array.from({length:100},(_,i)=>({body:'other-'+i}));comments.push({body:marker});
 const f=fake({comments});
 const r=await reconcile({transport:f.t,apply:true,applyEnv:'1',token:'fake'});
 assert.equal(r.action,'ALREADY_RECORDED');assert.equal(f.posts.length,0);
});
test('uncertain write searches receipts and recovers without a second POST',async()=>{
 const f=fake({writeError:true,writePersists:true});
 const r=await reconcile({transport:f.t,apply:true,applyEnv:'1',token:'fake'});
 assert.equal(r.action,'RECOVERED_AFTER_UNCERTAIN_WRITE');assert.equal(f.posts.length,1);
});
test('uncertain write without receipt fails closed without retry',async()=>{
 const f=fake({writeError:true});
 await assert.rejects(reconcile({transport:f.t,apply:true,applyEnv:'1',token:'fake'}),/write-uncertain-not-retried/);
 assert.equal(f.posts.length,1);
});
test('invalid pagination cannot silently green',async()=>{
 const f=fake();
 f.t.get=async(path)=>path==='/pulls/528'?pr:path==='/issues/527'?issue:({check_runs:null});
 await assert.rejects(reconcile({transport:f.t}),/invalid-pagination-response/);
});
