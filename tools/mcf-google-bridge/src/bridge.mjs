import { randomBytes, createCipheriv, createDecipheriv, randomUUID, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, writeFile, appendFile, stat, rename, unlink } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { GoogleAuth } from 'google-auth-library';

function stateDir() { return process.env.MCF_GOOGLE_BRIDGE_STATE_DIR || path.join(homedir(), '.config', 'mcf-google-bridge'); }
const safeOps = Object.freeze([
  'google.status', 'google.gemini.models', 'google.drive.search',
  'google.gmail.search', 'google.calendar.events', 'google.cloud.projects'
]);
const meteredOps = Object.freeze(['google.gemini.generate']);
export const OPERATIONS = Object.freeze([...safeOps, ...meteredOps]);
const timeoutMs = 12000;
const GOOGLE_SCOPES = Object.freeze([
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.readonly'
]);
export { GOOGLE_SCOPES, stateDir };

export class BridgeError extends Error {
  constructor(code, status=400) { super(code); this.code=code; this.status=status; }
}
function validString(value, max=120) {
  return typeof value === 'string' && value.length > 0 && value.length <= max;
}
function safeCount(value, fallback=10, max=25) {
  const n=Number(value ?? fallback);
  if (!Number.isInteger(n) || n<1 || n>max) throw new BridgeError('INVALID_LIMIT');
  return n;
}
export function isAllowedOperation(op) {
  return OPERATIONS.includes(op) &&
    (op !== 'google.gemini.generate' || process.env.GOOGLE_BRIDGE_ALLOW_GENERATION === 'true');
}
export function requireAllowed(op) {
  if (!OPERATIONS.includes(op)) throw new BridgeError('UNSUPPORTED_OPERATION', 404);
  if (!isAllowedOperation(op)) throw new BridgeError('OPERATION_DISABLED', 403);
}
function apiKey() { return process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || ''; }
export function status() {
  return {
    service: 'mcf-google-bridge', version: '0.1.0',
    googleGeminiKeyConfigured: Boolean(apiKey()),
    oauthClientConfigured: Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID),
    adcConfigured: Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS),
    operations: OPERATIONS.map(name=>({ name, enabled: isAllowedOperation(name) })),
    binding: 'localhost-or-local-mcp', policy: 'read-only-default',
    oauthConnected: 'check with google.status only after authorization',
  };
}
async function ensureDir() { await mkdir(stateDir(),{recursive:true,mode:0o700}); }
async function secureRead(file) {
  const metadata=await stat(file).catch(e=>e.code==='ENOENT'?null:Promise.reject(e));
  if (!metadata) return null;
  if ((metadata.mode&0o077)!==0 || !metadata.isFile()) throw new BridgeError('INSECURE_FILE_PERMISSIONS',500);
  return readFile(file);
}
async function getStoreKey() {
  await ensureDir();
  const file=path.join(stateDir(),'key');
  let value=await secureRead(file);
  if (value) { if (value.length!==32) throw new BridgeError('INVALID_STORE_KEY',500); return value; }
  value=randomBytes(32);
  try { await writeFile(file,value,{flag:'wx',mode:0o600}); return value; }
  catch(e) { if(e.code!=='EEXIST') throw e; return (await secureRead(file)); }
}
export async function saveOauthTokens(tokens) {
  if (!tokens || typeof tokens.refresh_token!=='string' || !tokens.refresh_token) throw new BridgeError('NO_REFRESH_TOKEN');
  const key=await getStoreKey(), iv=randomBytes(12);
  const cipher=createCipheriv('aes-256-gcm',key,iv);
  const encoded=Buffer.concat([cipher.update(JSON.stringify(tokens),'utf8'),cipher.final()]);
  const blob=Buffer.concat([Buffer.from([1]),iv,cipher.getAuthTag(),encoded]);
  const file=path.join(stateDir(),'workspace-tokens.enc');
  const temporary=path.join(stateDir(),'.workspace-tokens-'+randomUUID()+'.tmp');
  try {
    // Never truncate the live token store: readers must see either complete version.
    await writeFile(temporary,blob,{mode:0o600,flag:'wx'});
    await rename(temporary,file);
  } finally {
    await unlink(temporary).catch(e=>{if(e.code!=='ENOENT') throw e;});
  }
}
export async function loadOauthTokens() {
  const blob=await secureRead(path.join(stateDir(),'workspace-tokens.enc'));
  if (!blob) return null;
  if (blob.length<30 || blob[0]!==1) throw new BridgeError('INVALID_TOKEN_STORE',500);
  const key=await getStoreKey(), decipher=createDecipheriv('aes-256-gcm',key,blob.subarray(1,13));
  decipher.setAuthTag(blob.subarray(13,29));
  try { return JSON.parse(Buffer.concat([decipher.update(blob.subarray(29)),decipher.final()]).toString('utf8')); }
  catch { throw new BridgeError('TOKEN_STORE_DECRYPT_FAILED',500); }
}
async function refreshOauth(tokens) {
  if (!process.env.GOOGLE_OAUTH_CLIENT_ID || !tokens?.refresh_token) throw new BridgeError('OAUTH_NOT_CONFIGURED',401);
  if (tokens.access_token && tokens.expires_at>Date.now()+90_000) return tokens.access_token;
  const form=new URLSearchParams({
    grant_type:'refresh_token',refresh_token:tokens.refresh_token,
    client_id:process.env.GOOGLE_OAUTH_CLIENT_ID
  });
  if(process.env.GOOGLE_OAUTH_CLIENT_SECRET) form.set('client_secret',process.env.GOOGLE_OAUTH_CLIENT_SECRET);
  const res=await fetch('https://oauth2.googleapis.com/token',{
    method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},
    body:form,signal:AbortSignal.timeout(timeoutMs)
  });
  if (!res.ok) throw new BridgeError('OAUTH_REFRESH_FAILED',401);
  const output=await res.json();
  if(!output.access_token) throw new BridgeError('OAUTH_INVALID_RESPONSE',502);
  const updated={...tokens,...output,refresh_token:tokens.refresh_token,expires_at:Date.now()+(output.expires_in||3000)*1000};
  await saveOauthTokens(updated);
  return updated.access_token;
}
async function authorizedHeaders(kind) {
  if (kind==='gemini') {
    if(!apiKey()) throw new BridgeError('GEMINI_AUTH_NOT_CONFIGURED',401);
    return {'x-goog-api-key':apiKey()};
  }
  if (kind==='workspace') {
    const tokens=await loadOauthTokens();
    if(!tokens) throw new BridgeError('WORKSPACE_OAUTH_REQUIRED',401);
    return {'authorization':'Bearer '+await refreshOauth(tokens)};
  }
  if (kind==='cloud') {
    const auth=new GoogleAuth({scopes:['https://www.googleapis.com/auth/cloud-platform.read-only']});
    let token;
    try { token=await auth.getAccessToken(); } catch { throw new BridgeError('ADC_AUTH_REQUIRED',401); }
    if(!token) throw new BridgeError('ADC_AUTH_REQUIRED',401);
    return {'authorization':'Bearer '+token};
  }
  throw new BridgeError('INVALID_AUTH_KIND',500);
}
export async function googleRequest(url, kind, init={}) {
  const host=new URL(url).hostname;
  if(!['generativelanguage.googleapis.com','www.googleapis.com','gmail.googleapis.com','calendar.googleapis.com','cloudresourcemanager.googleapis.com'].includes(host))
    throw new BridgeError('GOOGLE_HOST_NOT_ALLOWED',403);
  const headers={...(await authorizedHeaders(kind)), 'accept':'application/json', ...(init.body?{'content-type':'application/json'}:{})};
  let result;
  try {
    result=await fetch(url,{...init,headers,redirect:'error',signal:AbortSignal.timeout(timeoutMs)});
  } catch { throw new BridgeError('GOOGLE_TRANSPORT_FAILED',502); }
  if(!result.ok) throw new BridgeError('GOOGLE_HTTP_'+result.status,result.status);
  try { return await result.json(); } catch { throw new BridgeError('INVALID_GOOGLE_JSON',502); }
}
async function dispatch(op,args={}) {
  switch(op) {
    case 'google.status': {
      const tokens=await loadOauthTokens();
      return {...status(),oauthConnected:Boolean(tokens?.refresh_token)};
    }
    case 'google.gemini.models': {
      const data=await googleRequest('https://generativelanguage.googleapis.com/v1beta/models?pageSize=100','gemini');
      return {models:(data.models||[]).map(m=>({
        name:m.name,displayName:m.displayName,supportedGenerationMethods:m.supportedGenerationMethods
      }))};
    }
    case 'google.gemini.generate': {
      // Discovery reports names as "models/<id>"; accept either that or the bare ID.
      const model=typeof args.model==='string' && args.model.startsWith('models/')?args.model.slice(7):args.model;
      if(!validString(args.model,80) || !validString(model,73) || !/^[a-z0-9][a-z0-9._-]*$/.test(model)) throw new BridgeError('INVALID_MODEL');
      if(!validString(args.prompt,3000)) throw new BridgeError('INVALID_PROMPT');
      const data=await googleRequest('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent','gemini',{
        method:'POST', body:JSON.stringify({contents:[{parts:[{text:args.prompt}]}],generationConfig:{maxOutputTokens:256}})
      });
      return {model:args.model, text:(data.candidates||[]).flatMap(c=>(c.content?.parts||[]).map(p=>p.text||'')).join('\n').slice(0,12000)};
    }
    case 'google.drive.search': {
      if(!validString(args.query,200)) throw new BridgeError('INVALID_QUERY');
      const u=new URL('https://www.googleapis.com/drive/v3/files');
      u.searchParams.set('q',args.query);u.searchParams.set('pageSize',String(safeCount(args.limit)));
      u.searchParams.set('fields','nextPageToken,files(id,name,mimeType,modifiedTime,webViewLink)');
      const data=await googleRequest(u.toString(),'workspace');
      return {files:data.files||[],hasMore:Boolean(data.nextPageToken)};
    }
    case 'google.gmail.search': {
      if(!validString(args.query,200)) throw new BridgeError('INVALID_QUERY');
      const u=new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
      u.searchParams.set('q',args.query);u.searchParams.set('maxResults',String(safeCount(args.limit)));
      const data=await googleRequest(u.toString(),'workspace');
      return {messages:data.messages||[],resultSizeEstimate:data.resultSizeEstimate||0};
    }
    case 'google.calendar.events': {
      const now=new Date().toISOString();
      const u=new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
      u.searchParams.set('timeMin',now);u.searchParams.set('singleEvents','true');
      u.searchParams.set('orderBy','startTime');u.searchParams.set('maxResults',String(safeCount(args.limit)));
      const data=await googleRequest(u.toString(),'workspace');
      return {events:(data.items||[]).map(e=>({id:e.id,summary:e.summary,start:e.start,end:e.end,htmlLink:e.htmlLink}))};
    }
    case 'google.cloud.projects': {
      const data=await googleRequest('https://cloudresourcemanager.googleapis.com/v3/projects:search?pageSize=20','cloud');
      return {projects:(data.projects||[]).map(p=>({name:p.name,projectId:p.projectId,displayName:p.displayName,state:p.state}))};
    }
    default: throw new BridgeError('UNSUPPORTED_OPERATION',404);
  }
}
export async function invoke(op,args={}) {
  const trace_id=randomUUID(),started=Date.now();
  let outcome='ok';
  try { requireAllowed(op); const result=await dispatch(op,args); return {trace_id,operation:op,result}; }
  catch(error) {
    outcome=error instanceof BridgeError?error.code:'INTERNAL_ERROR';
    if(error instanceof BridgeError) throw error;
    throw new BridgeError('INTERNAL_ERROR',500);
  } finally {
    try {
      await ensureDir();
      await appendFile(path.join(stateDir(),'audit.jsonl'), JSON.stringify({
        time:new Date().toISOString(),trace_id,operation:op,outcome,elapsed_ms:Date.now()-started
      })+'\n',{encoding:'utf8',mode:0o600});
    } catch { /* never leak user data or tokens via logging */ }
  }
}
export async function getLocalHttpToken() {
  await ensureDir();const f=path.join(stateDir(),'http-token');
  let b=await secureRead(f);
  if(!b) {
    try { await writeFile(f,randomBytes(32).toString('hex')+'\n',{flag:'wx',mode:0o600}); }
    catch(e) { if(e.code!=='EEXIST') throw e; }
    b=await secureRead(f);
  }
  return b.toString('utf8').trim();
}
export function tokenMatches(a,b) {
  if(typeof a!=='string'||typeof b!=='string') return false;
  const x=Buffer.from(a),y=Buffer.from(b);
  return x.length===y.length && timingSafeEqual(x,y);
}
