// Gemini Live Evolution F0.7 — opt-in GitHub issue status sync.
// Reconciles observable PR/CI signals; never changes checkboxes.
const REPO='leon337/multiagent-collaboration-framework',ISSUE=527,PR=528;
const BASE='https://api.github.com/repos/'+REPO;
export function buildObservation(pr,checks,issueBody,now='2026-11-16T00:00:00Z'){
 if(!pr||pr.number!==PR||pr.head?.ref!=='mission/gemini-live-evolution-20261116-001')throw Error('unexpected-pr');
 if(typeof issueBody!=='string'||!issueBody.includes('MCF-GEMINI-LIVE-EVOLUTION-20261116-001'))throw Error('unexpected-issue');
 const sha=String(pr.head?.sha||'');
 if(!/^[0-9a-f]{40}$/.test(sha))throw Error('invalid-sha');
 const count=Array.isArray(checks)?checks.length:0;
 const passed=(checks||[]).filter(x=>x.head_sha===sha&&x.conclusion==='success').length;
 const failed=(checks||[]).filter(x=>x.head_sha===sha&&['failure','timed_out','cancelled'].includes(x.conclusion)).length;
 const pending=(checks||[]).filter(x=>x.head_sha===sha&&(x.status!=='completed'||!x.conclusion)).length;
 const marker='<!-- mcf-f0-sync:'+PR+':'+sha+':'+passed+':'+failed+':'+pending+' -->';
 const comment=marker+'\n'+
   '### Sinal de integração CI/PR (não é gate nem aceite)\n'+
   '- Missão: MCF-GEMINI-LIVE-EVOLUTION-20261116-001\n'+
   '- PR: https://github.com/'+REPO+'/pull/'+PR+' (draft: '+Boolean(pr.draft)+')\n'+
   '- SHA observado: '+sha+'\n'+
   '- Checks do SHA: '+count+' retornados; '+passed+' sucesso, '+failed+' falha, '+pending+' pendentes.\n'+
   '- Data da reconciliação: '+now+'\n'+
   '- NÃO alterar checkboxes por este sinal. Somente evidência E2E + auditoria/gate aplicável validam itens.\n';
 return {marker,comment,sha,passed,failed,pending,checkCount:count,changedCheckboxes:false};
}
function headers(token){return {Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(token?{Authorization:'Bearer '+token}:{})};}
async function get(apiPath,token){const r=await fetch(BASE+apiPath,{headers:headers(token),signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('github-read-'+r.status);return r.json();}
export async function reconcile({token,apply=false,applyEnv='',now=new Date().toISOString(),transport={get,post:null}}={}){
 const pr=await transport.get('/pulls/'+PR,token);
 const issue=await transport.get('/issues/'+ISSUE,token);
 const checksResp=await transport.get('/commits/'+pr.head.sha+'/check-runs?per_page=100',token);
 const observation=buildObservation(pr,checksResp.check_runs||[],issue.body,now);
 if(!apply)return {...observation,action:'DRY_RUN'};
 if(applyEnv!=='1')throw Error('write-requires-MCF_CHECKLIST_APPLY=1');
 if(!token)throw Error('write-requires-token');
 const comments=await transport.get('/issues/'+ISSUE+'/comments?per_page=100',token);
 if(comments.some(c=>String(c.body||'').includes(observation.marker)))return {...observation,action:'ALREADY_RECORDED'};
 if(!transport.post)throw Error('write-transport-unavailable');
 await transport.post('/issues/'+ISSUE+'/comments',{body:observation.comment},token);
 return {...observation,action:'COMMENT_ONLY'};
}
async function apiPost(apiPath,payload,token){const r=await fetch(BASE+apiPath,{method:'POST',headers:{...headers(token),'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('github-write-'+r.status);return r.json();}
if(process.argv[1]&&import.meta.url.endsWith(process.argv[1].replaceAll('\\','/'))){
 const apply=process.argv.includes('--apply');
 reconcile({token:process.env.GITHUB_TOKEN,apply,applyEnv:process.env.MCF_CHECKLIST_APPLY,transport:{get,post:apiPost}}).then(r=>{
  console.log(JSON.stringify({action:r.action,sha:r.sha,checks:r.checkCount,passed:r.passed,failed:r.failed,pending:r.pending,changedCheckboxes:r.changedCheckboxes}));
 }).catch(e=>{console.error('SYNC_FAILED',e.message);process.exitCode=1;});
}