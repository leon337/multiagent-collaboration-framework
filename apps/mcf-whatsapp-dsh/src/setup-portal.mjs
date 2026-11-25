import http from 'node:http';
import { randomBytes } from 'node:crypto';
import { readFile, mkdir, writeFile, rename, chmod } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

const dir = join(homedir(), '.config/mcf-whatsapp-dsh');
const target = join(dir, 'env');
const secretPath = join(dir, 'setup-token');
const host = '127.0.0.1', port = 38765;
const publicHost = 'mcf-leo-n43sm.tail582305.ts.net:8498';
await mkdir(dir, {recursive:true,mode:0o700});
let access;
try { access=(await readFile(secretPath,'utf8')).trim(); }
catch(e) {
  if(e.code!=='ENOENT') throw e;
  access=randomBytes(32).toString('hex');
  await writeFile(secretPath,access+'\n',{mode:0o600,flag:'wx'});
}
await chmod(secretPath,0o600);
if(!/^[a-f0-9]{64}$/.test(access)) throw Error('invalid_setup_credential');

const headers = {
  'cache-control':'no-store','x-frame-options':'DENY',
  'referrer-policy':'no-referrer','x-content-type-options':'nosniff',
  'content-security-policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"
};
const html = `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MCF · Configuração Meta</title><link rel="stylesheet" href="/setup.css"></head><body><main><h1>MCF · WhatsApp de teste</h1><p>Configuração privada pelo Tailscale. Apenas o remetente de teste da Meta é permitido nesta fase.</p><p id="status">Conectando com segurança...</p><section><h2>1. Configuração no Meta Developers</h2><p>Abra <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer">Meta for Developers</a> no telefone. Em WhatsApp → API Setup, copie os campos abaixo. O App Secret fica nas configurações básicas do aplicativo.</p></section><form id="setup" autocomplete="off"><label>Phone Number ID (de teste)<input name="WA_PHONE_NUMBER_ID" required inputmode="numeric" pattern="[0-9]{8,30}"></label><label>Token de acesso temporário<input name="WA_ACCESS_TOKEN" type="password" required minlength="30" autocomplete="off"></label><label>App Secret da Meta<input name="WA_APP_SECRET" type="password" required minlength="16" autocomplete="off"></label><label>Versão Graph API<input name="WA_GRAPH_API_VERSION" required value="v23.0" pattern="v[0-9]{2,3}\\.[0-9]"></label><label>Seu telefone de destino (55 + DDD + número)<input name="WA_ALLOW_FROM" required inputmode="numeric" pattern="[0-9]{8,15}"></label><button type="submit">Salvar no notebook</button></form><section><h2>2. Webhook do aplicativo</h2><p>Callback URL (copiar no painel Meta):</p><code>https://mcf-leo-n43sm.tail582305.ts.net/webhook</code><p>Token de verificação:</p><div class="token"><code id="verify">Autenticação necessária</code><button id="copy" type="button">Copiar</button></div><p>Assine o evento <strong>messages</strong> no painel Meta. O processamento de mensagens continuará desligado até a validação real do modelo.</p></section><p id="result"></p></main><script src="/setup.js"></script></body></html>`;
const css=`:root{font-family:system-ui,sans-serif;color-scheme:dark;background:#10141d;color:#e7edf4}*{box-sizing:border-box}body{margin:0;padding:20px}main{max-width:610px;margin:auto}h1{font-size:1.45rem}h2{font-size:1.1rem}section,form{padding:16px;border:1px solid #334156;border-radius:12px;margin:15px 0}label{display:block;margin:12px 0;font-size:.92rem}input{display:block;width:100%;padding:12px;border:1px solid #53657a;border-radius:8px;margin-top:6px;background:#1a2534;color:white;font-size:1rem}button{border:0;background:#4176ee;color:white;padding:12px 18px;border-radius:9px;cursor:pointer;font-size:1rem}button:disabled{opacity:.45}p{line-height:1.55}code{overflow-wrap:anywhere}.token{display:flex;gap:8px;align-items:center;flex-wrap:wrap}a{color:#a3c2ff}#status{font-weight:600}`;
const script=`const access=location.hash.slice(1);history.replaceState(null,'',location.pathname);const status=document.getElementById('status'),result=document.getElementById('result'),verify=document.getElementById('verify');async function api(path,body){if(!/^[a-f0-9]{64}$/.test(access))throw Error('Link privado inválido');const res=await fetch(path,{method:body?'POST':'GET',headers:{authorization:'Bearer '+access,...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});if(!res.ok)throw Error('Acesso não autorizado ou configuração inválida ('+res.status+')');return res.json()}async function boot(){try{const x=await api('/api/status');verify.textContent=x.verifyToken;status.textContent='Conexão autenticada • modo teste • campos faltantes: '+(x.missing.join(', ')||'nenhum');}catch(e){status.textContent=e.message;document.querySelector('#setup button').disabled=true}}document.getElementById('copy').addEventListener('click',()=>navigator.clipboard.writeText(verify.textContent));document.getElementById('setup').addEventListener('submit',async e=>{e.preventDefault();result.textContent='Salvando...';const body=Object.fromEntries(new FormData(e.currentTarget).entries());try{const x=await api('/api/save',body);result.textContent='Salvo no notebook com acesso restrito. Proximo passo: verificação do aplicativo Meta.';e.currentTarget.reset();await boot()}catch(error){result.textContent=error.message}});boot();`;

function answer(res,status,type,data) {
  res.writeHead(status,{...headers,'content-type':type});
  res.end(data);
}
async function bodyJson(req) {
  let chunks=[],size=0;
  for await (const c of req) {
    size+=c.length;
    if(size>15000)throw Error('body_too_large');
    chunks.push(c);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
function entries(text) {
  return text.split('\n').filter(line => /^[A-Z][A-Z0-9_]*=/.test(line)).map(line => [line.slice(0,line.indexOf('=')),line.slice(line.indexOf('=')+1)]);
}
let busy=false,failures=0,windowStart=Date.now();
http.createServer(async(req,res)=>{
  const pathname=new URL(req.url||'/','http://localhost').pathname;
  const remote=req.socket.remoteAddress;
  if(remote!=='127.0.0.1' && remote!=='::ffff:127.0.0.1')return answer(res,403,'text/plain','');
  if(!['127.0.0.1:'+port,'localhost:'+port,publicHost].includes(String(req.headers.host)))return answer(res,403,'text/plain','');
  if(req.method==='GET' && pathname==='/')return answer(res,200,'text/html; charset=utf-8',html);
  if(req.method==='GET' && pathname==='/setup.css')return answer(res,200,'text/css; charset=utf-8',css);
  if(req.method==='GET' && pathname==='/setup.js')return answer(res,200,'text/javascript; charset=utf-8',script);
  if(Date.now()-windowStart>60000){windowStart=Date.now();failures=0;}
  if(failures>=20)return answer(res,429,'application/json','{}');
  if(req.headers.authorization !== 'Bearer '+access){failures++;return answer(res,401,'application/json','{}');}
  if(req.method==='GET' && pathname==='/api/status'){
    try{
      const m=Object.fromEntries(entries(await readFile(target,'utf8')));
      const missing=['WA_APP_SECRET','WA_ACCESS_TOKEN','WA_PHONE_NUMBER_ID','WA_GRAPH_API_VERSION','WA_ALLOW_FROM'].filter(k=>!m[k]);
      return answer(res,200,'application/json',JSON.stringify({ok:true,verifyToken:m.WA_VERIFY_TOKEN,missing,active:false}));
    }catch{return answer(res,503,'application/json','{}');}
  }
  if(req.method!=='POST'||pathname!=='/api/save')return answer(res,404,'application/json','{}');
  if(req.headers.origin!== 'https://'+publicHost && req.headers.origin!=='http://127.0.0.1:'+port)return answer(res,403,'application/json','{}');
  if(busy)return answer(res,409,'application/json','{}');
  busy=true;
  try{
    const data=await bodyJson(req);
    const required=['WA_APP_SECRET','WA_ACCESS_TOKEN','WA_PHONE_NUMBER_ID','WA_GRAPH_API_VERSION','WA_ALLOW_FROM'];
    if(required.some(k=>typeof data[k]!=='string'))throw Error('invalid_configuration');
    if(!/^[0-9]{8,30}$/.test(data.WA_PHONE_NUMBER_ID)||
       !/^[0-9]{8,15}$/.test(data.WA_ALLOW_FROM)||
       !/^v[0-9]{2,3}\.[0-9]$/.test(data.WA_GRAPH_API_VERSION)||
       !/^[A-Za-z0-9_-]{16,256}$/.test(data.WA_APP_SECRET)||
       data.WA_ACCESS_TOKEN.length<30 || data.WA_ACCESS_TOKEN.length>4096 ||
       /[\r\n]/.test(data.WA_ACCESS_TOKEN))throw Error('invalid_configuration');
    const fields=Object.fromEntries(entries(await readFile(target,'utf8')));
    Object.assign(fields,Object.fromEntries(required.map(k=>[k,data[k]])));
    fields.WA_META_TEST_MODE='1';
    fields.WA_ACTIVATE_CHAT='0'; // irreversible publication blocked until full model validation
    const temp=target+'.staging';
    await writeFile(temp,Object.entries(fields).map(([k,v])=>k+'='+v).join('\n')+'\n',{mode:0o600});
    await rename(temp,target);
    await chmod(target,0o600);
    return answer(res,200,'application/json',JSON.stringify({ok:true,saved:true,active:false}));
  } catch {
    return answer(res,422,'application/json',JSON.stringify({ok:false,error:'invalid_configuration'}));
  }finally {busy=false;}
}).listen(port,host,()=>console.log('MCF Meta configuration portal tailnet-only listening '+host+':'+port));
