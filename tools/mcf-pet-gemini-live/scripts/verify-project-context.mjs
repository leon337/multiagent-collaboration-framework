#!/usr/bin/env node
/**
 * MCF canonical PIP proof, local-only and read-only with respect to the repo.
 *
 * Runs the SAME MissionV11ContextGuard and IntentAlignmentService as the
 * runtime, then writes a private, short-lived cache for the Pet draft adapter.
 * Does not create missions, authorize execution, or fabricate human decisions.
 *
 * Prerequisite: pnpm --filter @rsa/server build (in apps/rede-social-agentes).
 */
import { createHash } from 'node:crypto';
import { lstat, mkdir, open, rename } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
const repository='leon337/multiagent-collaboration-framework';
const projectId='multiagent-collaboration-framework';
const revisionId='v1.1-canonical-001';
const target=join(homedir(),'.local/state/mcf-pet-mission-bridge/verified-project-context.json');

const load=async file=>import(pathToFileURL(join(root,
  'apps/rede-social-agentes/apps/server/dist',file)).href);
const {RepositoryProjectArtifactStore}=await load(
  'project-artifacts/repository-project-artifact.store.js');
const {IntentAlignmentService}=await load('project-intake/intent-alignment.service.js');
const {MissionV11ContextGuard}=await load('mcf-runtime/mission-v11-context.guard.js');

const store=new RepositoryProjectArtifactStore({
  repositoryRoot:root,schemaDirectory:join(root,'schemas'),repository,
});
const pip=await store.resolveLocalPipRevision(projectId,revisionId);
const alignment=new IntentAlignmentService(store);
const pair=await alignment.verifyAlignmentPair(pip.reference);
if(pair.state!=='PASS_VERIFIED'||pair.implementationAuthorized!==false){
  throw Error('Canonical PIP + alignment receipt did not pass verification.');
}
const guard=new MissionV11ContextGuard(store,alignment);
const contract={
  title:'MCF canonical Pet MissionRuntime admission context',
  objective:'Verify the canonical v1.1 project context for the MCF Pet mission handoff',
  expectedOutcome:'Valid PIP and alignment receipt with immutable provenance',
  scope:['Inspect checked-out canonical project artifacts'],
  outOfScope:['No mission creation','No runtime execution','No human gate approval'],
  acceptanceCriteria:['Alignment and MissionV11ContextGuard both PASS_VERIFIED'],
  riskClass:'C',selectedAgents:['Mestre'],selectedSkills:['MCF-START-MISSION'],
  sourceOfTruth:['repo://'+repository],
  contractSchemaVersion:'1.1',projectId,projectEntryMode:'RESUME_MCF_PROJECT',
  methodologyPin:pip.artifact.methodologyPin,alignedPipRef:pip.reference,
};
const verified=await guard.validate(contract);
const now=new Date(), expires=new Date(now.getTime()+30*60*1000);
const document={
  schemaVersion:1,
  authority:'LOCAL_VERIFIED_CANONICAL_ARTIFACTS',
  state:'PASS_VERIFIED_LOCAL',
  repository,projectId,
  methodologyPin:verified.methodologyPin,
  alignedPipRef:verified.alignedPipRef,
  alignmentReceiptRef:pair.receipt.reference,
  verifiedAt:now.toISOString(),expiresAt:expires.toISOString(),
  remoteRuntimeAdmissionVerified:false,
  missionCreated:false,
  executionAuthorized:false,
  humanGateApproved:false,
};
const payload=JSON.stringify(document,null,2)+'\n';
const folder=dirname(target);
await mkdir(folder,{recursive:true,mode:0o700});
const d=await lstat(folder);
if(!d.isDirectory()||(d.mode&0o077)!==0||d.uid!==process.getuid()){
  throw Error('Cache directory is not owner-private.');
}
try {
 const existing=await lstat(target);
 if(!existing.isFile()||(existing.mode&0o077)!==0||existing.uid!==process.getuid()){
  throw Error('Existing cache must be a private regular file.');
 }
}catch(error){
 if(error?.code!=='ENOENT')throw error;
}
const tmp=target+'.pending-'+process.pid;
const fd=await open(tmp,'wx',0o600);
try{await fd.writeFile(payload,{encoding:'utf8'});await fd.sync();}
finally{await fd.close();}
await rename(tmp,target);
console.log(JSON.stringify({
  state:document.state,repository,projectId,
  pipRevision:revisionId,
  sourceDigest:pip.reference.contentDigest,
  cacheSha256:createHash('sha256').update(payload).digest('hex'),
  expiresAt:document.expiresAt,
  remoteRuntimeAdmissionVerified:false,
  missionCreated:false,executionAuthorized:false,
}));
