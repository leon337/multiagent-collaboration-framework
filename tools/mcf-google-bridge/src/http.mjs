import http from 'node:http';
import { invoke, status, getLocalHttpToken, tokenMatches, BridgeError } from './bridge.mjs';

export async function startHttp({port=Number(process.env.GOOGLE_BRIDGE_PORT||8755)}={}) {
  const secret=await getLocalHttpToken();
  const server=http.createServer(async(req,res)=>{
    function json(statusCode,data) {
      res.writeHead(statusCode,{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'});
      res.end(JSON.stringify(data));
    }
    if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)) {
      json(403,{error:'LOOPBACK_ONLY'});return;
    }
    if(req.method==='GET' && req.url==='/healthz') {
      json(200,{service:'mcf-google-bridge',state:'running',version:status().version});return;
    }
    if(req.method!=='POST' || req.url!=='/v1/execute') {
      json(404,{error:'NOT_FOUND'});return;
    }
    const bearer=req.headers.authorization||'';
    if(!bearer.startsWith('Bearer ') || !tokenMatches(bearer.slice(7),secret)) {
      json(401,{error:'UNAUTHORIZED'});return;
    }
    try {
      let body='',overflow=false;
      for await(const chunk of req) {
        body+=chunk.toString('utf8');
        if(body.length>16000) {overflow=true;break;}
      }
      if(overflow) {json(413,{error:'PAYLOAD_TOO_LARGE'});return;}
      const parsed=JSON.parse(body);
      if(!parsed || typeof parsed.operation!=='string' || typeof parsed.args!=='object' || Array.isArray(parsed.args) || parsed.args===null) {
        json(400,{error:'INVALID_REQUEST'});return;
      }
      const output=await invoke(parsed.operation,parsed.args);
      json(200,output);
    } catch(e) {
      json(e instanceof BridgeError?e.status:400,{
        error:e instanceof BridgeError?e.code:'INVALID_REQUEST'
      });
    }
  });
  await new Promise((resolve,reject)=>server.once('error',reject).listen(port,'127.0.0.1',resolve));
  return server;
}
if(import.meta.url==='file://'+process.argv[1]) {
  startHttp().then(server=>console.error('MCF Google Bridge HTTP ativo em http://127.0.0.1:'+server.address().port))
    .catch(e=>{console.error('Falha ao iniciar Bridge: '+(e.code||'START_FAILED'));process.exitCode=1;});
}
