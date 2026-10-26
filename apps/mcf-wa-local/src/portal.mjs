import http from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer"><title>MCF · WhatsApp local</title><link rel="stylesheet" href="/style.css"></head><body><main><header><h1>MCF · WhatsApp local</h1><p>Integração própria com o DSH / Step 5 Preview, sem serviços externos adicionais.</p></header><section><h2>Vincular WhatsApp</h2><p id="status">Consultando o serviço…</p><img id="qr" alt="QR para vincular dispositivo MCF" hidden><p id="hint">No celular: WhatsApp → ⋮ → Dispositivos conectados → Conectar dispositivo. Aponte a câmera ao QR desta tela.</p></section><section><h2>Conversa restrita</h2><p>Após conectar, abra no WhatsApp <strong>Mensagem para você</strong> e envie <code>/mestre oi</code> uma única vez. Depois, converse normalmente, sem prefixo. <strong>Atenção:</strong> novas mensagens dessa conversa pessoal poderão ser enviadas ao modelo de IA externo enquanto estiver ativo. Contatos e grupos não são encaminhados.</p><p>Controles: <code>/mestre status</code> · <code>/mestre parar</code> · <code>/mestre iniciar</code></p><p id="counts"></p><div class="buttons"><button id="pause" type="button">Pausar respostas</button><button id="resume" type="button">Reativar respostas</button></div></section><footer>Privado no notebook. Uma sessão vinculada não oficial pode perder conexão ou sofrer restrições do WhatsApp. Você pode revogar em Dispositivos conectados.</footer></main><script src="/app.js"></script></body></html>`;
export const css = `:root{font-family:system-ui, sans-serif;color-scheme:dark;background:#101724;color:#e9f1fb}body{margin:0;padding:18px}main{max-width:600px;margin:0 auto}h1{font-size:1.5rem;margin-bottom:6px}h2{font-size:1.05rem}section{margin:16px 0;padding:18px;border:1px solid #3e4c62;border-radius:12px;background:#1a2433}p{line-height:1.52}#status{font-weight:650}img{display:block;background:white;border:12px solid white;border-radius:9px;max-width:100%;height:auto;width:300px;min-height:300px;object-fit:contain;margin:12px auto}img[hidden]{display:none}code{background:#28394d;border-radius:5px;padding:2px 5px;overflow-wrap:anywhere}button{border:1px solid #5c779c;background:#293c54;color:white;border-radius:8px;padding:11px 15px;cursor:pointer}button:disabled{opacity:.5}.buttons{display:flex;gap:12px;flex-wrap:wrap}footer{font-size:.81rem;color:#a2b1c5}`;
export const browserCode = `const token=location.hash.slice(1);history.replaceState(null,'',location.pathname);const status=document.querySelector('#status');let lastQR='',stopped=false;async function call(path,method='GET'){if(!/^[a-f0-9]{64}$/.test(token))throw Error('Link privado inválido');const r=await fetch(path,{method,headers:{authorization:'Bearer '+token,...(method==='POST'?{'content-type':'application/json'}:{})},...(method==='POST'?{body:'{}'}:{})});if(!r.ok)throw Error('Acesso negado ou serviço indisponível ('+r.status+')');return r.json()}async function refresh(){if(stopped)return;try{const s=await call('/api/status');status.textContent=s.connected?'WhatsApp vinculado e '+(s.armed?'MESTRE ativo':'MESTRE pausado'):s.qrAvailable?'Aguardando escaneamento do QR no celular':s.phase==='logged_out'?'Sessão revogada. Requer novo pareamento.':'Preparando a sessão local…';document.querySelector('#counts').textContent='Testes concluídos: '+s.processed+' · falhas: '+s.failed+' · processando: '+(s.processing?'sim':'não');document.querySelector('#pause').disabled=!s.armed;document.querySelector('#resume').disabled=s.armed;document.querySelector('#hint').hidden=s.connected;if(s.qrAvailable&&!s.connected){const q=await call('/api/qr');if(q.data&&q.data!==lastQR){lastQR=q.data;document.querySelector('#qr').src='data:image/png;base64,'+q.data}document.querySelector('#qr').hidden=false}else{document.querySelector('#qr').hidden=true;lastQR=''}}catch(e){status.textContent=e.message;}setTimeout(refresh,3500)}async function action(path){try{await call(path,'POST');await refresh()}catch(e){status.textContent=e.message}}document.querySelector('#pause').onclick=()=>action('/api/pause');document.querySelector('#resume').onclick=()=>action('/api/resume');refresh();`;

// QR pairing-only view. It is available strictly on the loopback Host, never via tailnet or Funnel.
export const pairHtml = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MCF · Vincular WhatsApp</title><link rel="stylesheet" href="/style.css"></head><body><main><section><h1>Conectar WhatsApp ao MCF</h1><p id="status">Gerando QR de pareamento local…</p><img id="qr" alt="QR Code para conectar WhatsApp ao MCF" hidden><p>Abra o WhatsApp no celular → <strong>Dispositivos conectados</strong> → <strong>Conectar dispositivo</strong>. Aponte a câmera para este código na tela do notebook.</p><p>Depois, abra <strong>Mensagem para você</strong> e envie <code>/mestre oi</code> uma única vez. A seguir, converse normalmente. Enquanto o agente estiver ativo, novas mensagens enviadas nessa conversa pessoal serão processadas pela IA.</p><p>O comando /mestre ativa a conversa natural nessa conversa pessoal; outros contatos e grupos são ignorados. /mestre parar desativa o atendimento.</p></section><footer>Integração local não oficial. Desconecte pelo WhatsApp → Dispositivos conectados quando desejar.</footer></main><script src="/pair.js"></script></body></html>`;
export const pairJS = `const msg=document.querySelector('#status'),img=document.querySelector('#qr');let old='';async function refresh(){try{const x=await (await fetch('/api/local-status',{cache:'no-store'})).json();if(x.connected){msg.textContent='WhatsApp conectado! Abra Mensagem para você e envie /mestre oi.';img.hidden=true;}else if(x.qrAvailable){msg.textContent='Escaneie este QR com o WhatsApp do seu celular.';const q=await (await fetch('/api/local-qr',{cache:'no-store'})).json();if(q.data&&q.data!==old){img.src='data:image/png;base64,'+q.data;old=q.data;}img.hidden=false;}else {msg.textContent=x.phase==='logged_out'?'Sessão revogada. Reabra o aplicativo para novo pareamento.':'Preparando QR: '+x.phase;img.hidden=true;old=''}}catch(e){msg.textContent='Serviço indisponível: '+e.message}setTimeout(refresh,3000)}refresh();`;

export async function loadAdminToken(dir) {
  await mkdir(dir, {recursive: true, mode: 0o700});
  const path = join(dir, 'admin-token');
  let token;
  try { token = (await readFile(path, 'utf8')).trim(); }
  catch (e) {
    if (e.code !== 'ENOENT') throw e;
    token = randomBytes(32).toString('hex');
    await writeFile(path, token + '\n', {mode:0o600, flag:'wx'});
  }
  if (!/^[a-f0-9]{64}$/.test(token)) throw Error('invalid_admin_token');
  await chmod(path, 0o600);
  return token;
}

export function isAuthenticated(candidate, token) {
  if (typeof candidate !== 'string' || !candidate.startsWith('Bearer ')) return false;
  const raw = candidate.slice(7);
  if (!/^[a-f0-9]{64}$/.test(raw)) return false;
  return timingSafeEqual(Buffer.from(raw), Buffer.from(token));
}

export function makePortal({ token, getStatus, getQr, setArmed, host='127.0.0.1', port=38766 }) {
  const headers = {
    'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer',
    'x-frame-options':'DENY','content-security-policy':"default-src 'none'; script-src 'self'; style-src 'self'; img-src data:; connect-src 'self'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'"
  };
  const send = (res, status, type, text) => { res.writeHead(status, {...headers, 'content-type':type});res.end(text); };
  return http.createServer(async (req,res) => {
    if (!['127.0.0.1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress)) return send(res,403,'text/plain','Forbidden');
    const allowedHosts = new Set([host+':'+port, 'localhost:'+port, 'mcf-leo-n43sm.tail582305.ts.net:8499']);
    if (!allowedHosts.has(String(req.headers.host))) return send(res,403,'text/plain','Forbidden');
    const path = new URL(req.url||'/', 'http://localhost').pathname;
    // Private pairing bridge is bound to localhost and refuses any proxy/Tailscale host.
    if (req.headers.host === host+':'+port) {
      if (req.method==='GET' && path==='/pair') return send(res,200,'text/html; charset=utf-8',pairHtml);
      if (req.method==='GET' && path==='/pair.js') return send(res,200,'application/javascript',pairJS);
      if (req.method==='GET' && path==='/api/local-status') return send(res,200,'application/json',JSON.stringify(getStatus()));
      if (req.method==='GET' && path==='/api/local-qr') {
        const data=getQr();return send(res,data?200:404,'application/json',JSON.stringify(data?{data}:{}));
      }
    }
    if (req.method==='GET' && path==='/') return send(res,200,'text/html; charset=utf-8',html);
    if (req.method==='GET' && path==='/app.js') return send(res,200,'application/javascript',browserCode);
    if (req.method==='GET' && path==='/style.css') return send(res,200,'text/css',css);
    if (!isAuthenticated(req.headers.authorization, token)) return send(res,401,'application/json','{}');
    if (req.method==='GET' && path==='/api/status') return send(res,200,'application/json',JSON.stringify(getStatus()));
    if (req.method==='GET' && path==='/api/qr') {
      const data=getQr();
      return send(res,data?200:404,'application/json',JSON.stringify(data?{data}:{}));
    }
    if (req.method==='POST' && ['/api/pause','/api/resume'].includes(path)) {
      const origin=req.headers.origin;
      if (origin && !['http://'+host+':'+port, 'https://mcf-leo-n43sm.tail582305.ts.net:8499'].includes(origin)) {
        return send(res,403,'application/json','{}');
      }
      try {
        await setArmed(path==='/api/resume');
        return send(res,200,'application/json',JSON.stringify({ok:true}));
      } catch { return send(res,500,'application/json','{}'); }
    }
    return send(res,404,'application/json','{}');
  });
}
