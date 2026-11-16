// Gemini Live Studio F0.7: evidence-only PR/CI observer. No checkbox or gate writes.
import {createHash} from 'node:crypto';
const REPO='leon337/multiagent-collaboration-framework',ISSUE=527,PR=528;
const BRANCH='mission/gemini-live-evolution-20261116-001';
const BASE='https://api.github.com/repos/'+REPO,PER_PAGE=100,MAX_PAGES=10;
const BAD=new Set(['failure','timed_out','cancelled','action_required','startup_failure','stale']);
function digest(value){return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0,20);}
function assertCandidate(pr,issueBody){
 if(!pr||pr.number!==PR||pr.state!=='open'||pr.head?.ref!==BRANCH)throw Error('unexpected-pr');
 if(typeof issueBody!=='string'||!issueBody.includes('MCF-GEMINI-LIVE-EVOLUTION-20261116-001'))throw Error('unexpected-issue');
 if(!/^[0-9a-f]{40}$/.test(String(pr.head?.sha||'')))throw Error('invalid-sha');
}
export function buildObservation(pr,checks,issueBody,now='2026-11-16T00:00:00Z'){
 assertCandidate(pr,issueBody);
 if(!Array.isArray(checks))throw Error('checks-not-array');
 const sha=pr.head.sha, matched=checks.filter(x=>x.head_sha===sha);
 const normalized=matched.map(x=>({id:String(x.id??''),name:String(x.name||''),status:String(x.status||''),conclusion:String(x.conclusion??''),head_sha:sha})).sort((a,b)=>(a.id+'|'+a.name).localeCompare(b.id+'|'+b.name));
 const passed=normalized.filter(x=>x.status==='completed'&&x.conclusion==='success').length;
 const failed=normalized.filter(x=>x.status==='completed'&&BAD.has(x.conclusion)).length;
 const pending=normalized.length-passed-failed;
 const marker='<!-- mcf-f0-sync:'+PR+':'+sha+':'+digest(normalized)+' -->';
 const comment=marker+'\n'+
   '### Sinal de PR/CI verificado (NÃO É ACEITE NEM GATE)\n'+
   '- Missão: MCF-GEMINI-LIVE-EVOLUTION-20261116-001\n'+
   '- PR: https://github.com/'+REPO+'/pull/'+PR+' (draft: '+Boolean(pr.draft)+')\n'+
   '- SHA verificado: '+sha+'\n'+
   '- Checks correspondentes ao SHA: '+normalized.length+'; '+passed+' sucesso, '+failed+' falha, '+pending+' pendente/não classificável.\n'+
   '- Consultado em: '+now+'\n'+
   '- Nenhum checkbox, gate, decisão ou estado executivo foi alterado.\n';
 return {marker,comment,sha,passed,failed,pending,checkCount:normalized.length,ignoredOtherSha:checks.length-matched.length,changedCheckboxes:false};
}
function headers(token){return {Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(token?{Authorization:'Bearer '+token}:{})};}
async function get(p,token){const r=await fetch(BASE+p,{headers:headers(token),signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('github-read-'+r.status);return r.json();}
async function post(p,payload,token){const r=await fetch(BASE+p,{method:'POST',headers:{...headers(token),'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('github-write-'+r.status);return r.json();}
async function allPages(getFn,path,token,key){
 const out=[];
 for(let page=1;page<=MAX_PAGES;page++){
  const sep=path.includes('?')?'&':'?';
  const data=await getFn(path+sep+'per_page='+PER_PAGE+'&page='+page,token);
  const arr=key?data?.[key]:data;
  if(!Array.isArray(arr))throw Error('invalid-pagination-response');
  out.push(...arr);
  if(arr.length<PER_PAGE)return out;
 }
 throw Error('pagination-limit-exceeded');
}
function sameHead(a,b){return a?.state==='open'&&b?.state==='open'&&a.head?.sha===b.head?.sha&&a.head?.ref===b.head?.ref;}
export async function reconcile({token,apply=false,applyEnv='',now=new Date().toISOString(),transport={get,post}}={}){
 const pr=await transport.get('/pulls/'+PR,token);
 const issue=await transport.get('/issues/'+ISSUE,token);
 assertCandidate(pr,issue?.body);
 const checks=await allPages(transport.get,'/commits/'+pr.head.sha+'/check-runs',token,'check_runs');
 const observation=buildObservation(pr,checks,issue.body,now);
 if(!apply)return {...observation,action:'DRY_RUN'};
 if(applyEnv!=='1')throw Error('write-requires-MCF_CHECKLIST_APPLY=1');
 if(!token)throw Error('write-requires-token');
 const headAgain=await transport.get('/pulls/'+PR,token);
 if(!sameHead(pr,headAgain))throw Error('pr-head-changed');
 const comments=await allPages(transport.get,'/issues/'+ISSUE+'/comments',token);
 if(comments.some(c=>String(c.body||'').includes(observation.marker)))return {...observation,action:'ALREADY_RECORDED'};
 if(!transport.post)throw Error('write-transport-unavailable');
 try{await transport.post('/issues/'+ISSUE+'/comments',{body:observation.comment},token);}
 catch(e){
  // A timeout may happen AFTER the server commits a comment. Query for receipt before retry.
  const after=await allPages(transport.get,'/issues/'+ISSUE+'/comments',token);
  if(after.some(c=>String(c.body||'').includes(observation.marker)))return {...observation,action:'RECOVERED_AFTER_UNCERTAIN_WRITE'};
  throw Error('write-uncertain-not-retried:'+String(e.message||e));
 }
 return {...observation,action:'COMMENT_ONLY'};
}
if(process.argv[1]&&import.meta.url.endsWith(process.argv[1].replaceAll('\\','/'))){
 const apply=process.argv.includes('--apply');
 reconcile({token:process.env.GITHUB_TOKEN,apply,applyEnv:process.env.MCF_CHECKLIST_APPLY}).then(r=>
  console.log(JSON.stringify({action:r.action,sha:r.sha,checks:r.checkCount,passed:r.passed,failed:r.failed,pending:r.pending,changedCheckboxes:r.changedCheckboxes}))
 ).catch(e=>{console.error('SYNC_FAILED',e.message);process.exitCode=1;});
}