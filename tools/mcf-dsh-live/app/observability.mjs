import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, chmodSync } from 'node:fs';
const DIR='/home/leo/.local/share/mcf-gemini38-agent/observability';
mkdirSync(DIR,{recursive:true,mode:0o700});
const db=new DatabaseSync(DIR+'/events.sqlite',{timeout:1000});
chmodSync(DIR+'/events.sqlite',0o600);
db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=1000; PRAGMA synchronous=NORMAL;');
db.exec('CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT,at TEXT NOT NULL,trace_id TEXT,component TEXT NOT NULL,operation TEXT NOT NULL,status TEXT NOT NULL,error_code TEXT,duration_ms INTEGER,model_id TEXT)');
db.exec('CREATE INDEX IF NOT EXISTS events_by_time ON events(at); CREATE INDEX IF NOT EXISTS events_by_trace ON events(trace_id);');
const insert=db.prepare('INSERT INTO events(at,trace_id,component,operation,status,error_code,duration_ms,model_id) VALUES(?,?,?,?,?,?,?,?)');
const recent=db.prepare('SELECT * FROM events ORDER BY id DESC LIMIT ?');
const countByCode=db.prepare("SELECT COALESCE(error_code,'UNKNOWN') AS error_code, count(*) AS count FROM events WHERE status IN ('error','blocked','timeout','warning') AND at >= ? GROUP BY error_code ORDER BY count DESC LIMIT 10");
const stats=db.prepare("SELECT component, count(*) AS total, sum(CASE WHEN status IN ('error','blocked') THEN 1 ELSE 0 END) AS failures, round(avg(duration_ms),0) AS avg_ms FROM events WHERE at >= ? GROUP BY component");
const cleanup=db.prepare('DELETE FROM events WHERE at < ?');
const trim=db.prepare('DELETE FROM events WHERE id NOT IN (SELECT id FROM events ORDER BY id DESC LIMIT 12000)');
const allowed={component:new Set(['gateway','gemini','dsh','browser','approval','bridge','observability']),status:new Set(['started','ok','error','blocked','timeout','approved','denied','connected','disconnected','warning'])};
const safeToken=(s,max=60)=>typeof s==='string'&&/^[a-z0-9_.:-]{1,80}$/i.test(s)?s.slice(0,max):null;
export function errorCode(e){
  const status=Number(e?.status||e?.code||0);
  if(status===429)return 'PROVIDER_RATE_LIMIT';
  if(status===400)return 'PROVIDER_REQUEST_INVALID';
  if(status===401||status===403)return 'AUTH_OR_PERMISSION';
  if(status===404)return 'MODEL_OR_ROUTE_NOT_FOUND';
  if(status===504)return 'TIMEOUT';
  if(status>=500)return 'UPSTREAM_SERVER_ERROR';
  const explicit=String(e?.code||'').toUpperCase();
  if(/^(TARGET_NOT_FOUND|TARGET_NOT_ACTIONABLE|TARGET_AMBIGUOUS|TARGET_MISSING|REPEATED_ACTION_BLOCKED|CLICK_TIMEOUT|CLICK_FAILED|FILL_TIMEOUT|FILL_FAILED|SENSITIVE_FIELD_BLOCKED|INVALID_REQUEST)$/.test(explicit))return explicit;
  const msg=String(e?.message||e||'').toLowerCase();
  if(/429|resource.?exhausted|rate.?limit|quota exceeded/.test(msg))return 'PROVIDER_RATE_LIMIT';
  if(/404|model.*not found/.test(msg))return 'MODEL_OR_ROUTE_NOT_FOUND';
  if(/400|invalid.argument/.test(msg))return 'PROVIDER_REQUEST_INVALID';
  if(/timeout|timed out|abort/.test(msg))return 'TIMEOUT';
  if(/endereço interno|rede privada|endereço privado|destino.*interno/.test(msg))return 'PRIVATE_NETWORK_BLOCKED';
  if(/not authorized|não autorizado|recusad|denied/.test(msg))return 'APPROVAL_DENIED';
  if(/navigation|browser|chrome|cdp/.test(msg))return 'BROWSER_FAILURE';
  if(/invalid|malformed/.test(msg))return 'INVALID_REQUEST';
  return 'UNCLASSIFIED_ERROR';
}
let writes=0;
export function record(entry) {
 try {
  const component=allowed.component.has(entry.component)?entry.component:'gateway';
  const status=allowed.status.has(entry.status)?entry.status:'error';
  insert.run(new Date().toISOString(),safeToken(entry.traceId,64),component,
    safeToken(entry.operation,55)||'unknown',status,safeToken(entry.errorCode,55),
    Number.isFinite(entry.durationMs)?Math.max(0,Math.min(600000,Math.round(entry.durationMs))):null,
    safeToken(entry.modelId,80));
  writes++;
  if(writes%200===0) {
    cleanup.run(new Date(Date.now()-14*86400000).toISOString());
    trim.run();
    db.exec('PRAGMA wal_checkpoint(PASSIVE)');
  }
 } catch(e){console.error('OBSERVABILITY_WRITE_ERROR',errorCode(e));}
}
export function report(limit=80) {
 const cutoff=new Date(Date.now()-24*3600000).toISOString();
 return {window:'24h',retentionDays:14,storage:'local-sqlite',rawPromptsStored:false,audioStored:false,
   stats:stats.all(cutoff),errorCodes:countByCode.all(cutoff),
   recent:recent.all(Math.max(1,Math.min(120,Number(limit)||80))).reverse()};
}
export function probe() {
 try{ return {ok:db.prepare('PRAGMA quick_check').get().quick_check==='ok',dbWritable:true};}
 catch{return {ok:false,dbWritable:false};}
}
