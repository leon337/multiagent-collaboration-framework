/**
 * MCF Agent Lab — tailnet-only, least-privilege local proxy.
 * Serves ONLY the agent chat UI and its permitted API methods.
 * The Studio editor, publication, credentials and DSH bridge are excluded.
 * TLS + identity are enforced by Tailscale Serve.
 */
import {createServer} from 'node:http';
const HOST='127.0.0.1', PORT=Number(process.env.MCF_AGENT_LAB_PROXY_PORT||4323);
const UPSTREAM=process.env.MCF_AGENT_LAB_LOCAL_UPSTREAM||'http://127.0.0.1:4317';
const u=new URL(UPSTREAM);
if(u.protocol!=='http:' || !['127.0.0.1','localhost'].includes(u.hostname)) throw Error('Upstream precisa ser local');
const ALLOWED_ORIGIN=process.env.MCF_AGENT_LAB_PUBLIC_ORIGIN||'https://mcf-leo-n43sm.tail582305.ts.net:8492';
const publicUri=new URL(ALLOWED_ORIGIN);
if(publicUri.protocol!=='https:'||!publicUri.hostname.endsWith('.ts.net')) throw Error('Origem Tailscale HTTPS necessária');
const READ_PATHS=new Set(['/lab','/lab.css','/lab.js','/api/lab/status','/health']);
const WRITE_PATHS=new Set(['/api/lab/message','/api/lab/reset']);
const MAX_BODY=4096;
function respond(res,code,body,contentType='text/plain; charset=utf-8'){
  res.writeHead(code,{
    'content-type':contentType,
    'cache-control':'no-store',
    'x-content-type-options':'nosniff',
    'referrer-policy':'no-referrer',
    'x-frame-options':'DENY',
    'content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"
  });
  res.end(body);
}
function htmlForMobile(html){
  return html.replace(
    '<a href="/">↗ Editar comportamento no Studio</a>',
    '<span class="lab-access-note">Editor do agente: somente no notebook</span>'
  ).replace(
    '<a href="/#publish">Publicação ↗</a>',
    ''
  );
}
const server=createServer(async(req,res)=>{
  if(req.socket.remoteAddress!=='127.0.0.1'&&req.socket.remoteAddress!=='::ffff:127.0.0.1'){
    return respond(res,403,'Acesso não permitido');
  }
  let url;
  try{url=new URL(req.url||'/',UPSTREAM);}
  catch{return respond(res,400,'URL inválida');}
  // In-app browsers can append tracking parameters to links. Ignore query
  // strings ONLY for allowlisted GET resources; never forward them upstream.
  // Keep POST strict and preserve the path/method allowlist below.
  if((req.url||'').length > 4096)return respond(res,414,'URL muito longa');
  if(req.method!=='GET' && (url.search||url.hash))
    return respond(res,400,'Parâmetros não aceitos em operações de escrita');
  const path=url.pathname==='/'?'/lab':url.pathname;
  const allowed=req.method==='GET'?READ_PATHS.has(path):req.method==='POST'&&WRITE_PATHS.has(path);
  if(!allowed)return respond(res,404,'Recurso não disponível neste acesso remoto');
  if(req.method==='POST'){
    if(req.headers.origin!==ALLOWED_ORIGIN){
      return respond(res,403,'Origem não autorizada');
    }
    if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json')){
      return respond(res,415,'Envie JSON');
    }
  }
  let body='';
  if(req.method==='POST'){
    try{
      for await(const chunk of req){
        body+=chunk;
        if(body.length>4096)return respond(res,413,'Mensagem excessiva');
      }
    }catch{return respond(res,400,'Falha na leitura da mensagem');}
  }
  try{
    const upstream=await fetch(UPSTREAM+path,{
      method:req.method,
      headers:req.method==='POST'
        ?{'content-type':'application/json','origin':UPSTREAM,'accept':'application/json'}
        :{'accept':'text/html,application/json,text/css,*/*'},
      body:req.method==='POST'?body:undefined,
      signal:AbortSignal.timeout(req.method==='POST'?95000:7000)
    });
    let content=await upstream.text();
    const types={'/lab':'text/html; charset=utf-8','/lab.css':'text/css; charset=utf-8',
      '/lab.js':'text/javascript; charset=utf-8'};
    if(path==='/lab'&&upstream.ok)content=htmlForMobile(content);
    return respond(res,upstream.status,content,types[path]||'application/json; charset=utf-8');
  }catch{
    return respond(res,502,'O laboratório local não respondeu. Verifique o notebook.');
  }
});
server.listen(PORT,HOST,()=>{
  process.stdout.write('MCF Agent Lab mobile proxy listening on '+HOST+':'+PORT+'\n');
});
