import { createHash, randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { GOOGLE_SCOPES, saveOauthTokens, BridgeError } from './bridge.mjs';

export function pkcePair() {
  const verifier=randomBytes(48).toString('base64url');
  const challenge=createHash('sha256').update(verifier).digest('base64url');
  return {verifier,challenge};
}
export async function authorizeDesktop({out=process.stderr,timeoutMs=180000}={}) {
  const clientId=process.env.GOOGLE_OAUTH_CLIENT_ID;
  if(!clientId) throw new BridgeError('GOOGLE_OAUTH_CLIENT_ID_REQUIRED');
  const state=randomBytes(32).toString('hex');
  const {verifier,challenge}=pkcePair();
  return await new Promise((resolve,reject)=>{
    let timer, finished=false;
    function done(error,result) {
      if(finished) return;
      finished=true;clearTimeout(timer);server.close();
      error?reject(error):resolve(result);
    }
    const server=createServer(async(req,res)=>{
      let url;
      try { url=new URL(req.url||'/', 'http://127.0.0.1'); }
      catch {
        res.writeHead(400);res.end('Invalid callback path');return;
      }
      if(url.pathname!=='/oauth/callback' || req.method!=='GET') {
        res.writeHead(404);res.end('Not found');return;
      }
      if(url.searchParams.get('state')!==state) {
        res.writeHead(400);res.end('Invalid state');return;
      }
      const code=url.searchParams.get('code');
      if(!code) {
        res.writeHead(400);res.end('Authorization declined');done(new BridgeError('OAUTH_DECLINED'));return;
      }
      try {
        const form=new URLSearchParams({
          client_id:clientId, code, code_verifier:verifier,
          redirect_uri:'http://127.0.0.1:'+server.address().port+'/oauth/callback',
          grant_type:'authorization_code'
        });
        if(process.env.GOOGLE_OAUTH_CLIENT_SECRET) form.set('client_secret',process.env.GOOGLE_OAUTH_CLIENT_SECRET);
        const tokenResponse=await fetch('https://oauth2.googleapis.com/token',{
          method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},
          body:form,signal:AbortSignal.timeout(20000)
        });
        if(!tokenResponse.ok) throw new BridgeError('OAUTH_TOKEN_EXCHANGE_FAILED',401);
        const tokens=await tokenResponse.json();
        if(!tokens.refresh_token) throw new BridgeError('OAUTH_REFRESH_TOKEN_MISSING',401);
        await saveOauthTokens({...tokens,expires_at:Date.now()+(tokens.expires_in||3500)*1000});
        res.writeHead(200,{'content-type':'text/plain;charset=utf-8'});
        res.end('MCF Google Bridge: conta Google conectada. Esta janela pode ser fechada.');
        done(null,{connected:true,scopes:GOOGLE_SCOPES});
      } catch {
        res.writeHead(500);res.end('Falha na autorizacao; consulte o terminal.');
        done(new BridgeError('OAUTH_EXCHANGE_FAILED',502));
      }
    });
    server.on('error',e=>done(new BridgeError('OAUTH_LOOPBACK_FAILED',500)));
    server.listen(0,'127.0.0.1',()=>{
      const port=server.address().port;
      const u=new URL('https://accounts.google.com/o/oauth2/v2/auth');
      const fields={
        client_id:clientId,response_type:'code',redirect_uri:'http://127.0.0.1:'+port+'/oauth/callback',
        scope:GOOGLE_SCOPES.join(' '),access_type:'offline',prompt:'consent',
        state,code_challenge:challenge,code_challenge_method:'S256'
      };
      Object.entries(fields).forEach(([k,v])=>u.searchParams.set(k,v));
      out.write('Abra no navegador DESTE computador para autorizar a conta Google:\n'+u.toString()+'\n');
      timer=setTimeout(()=>done(new BridgeError('OAUTH_TIMEOUT',408)),timeoutMs);
      timer.unref();
    });
  });
}
if(import.meta.url==='file://'+process.argv[1]) {
  authorizeDesktop().then(()=>process.stderr.write('Autorizacao registrada com sucesso.\n'))
    .catch(e=>{process.stderr.write('Autorizacao: '+(e.code||'FAILED')+'\n');process.exitCode=1;});
}
