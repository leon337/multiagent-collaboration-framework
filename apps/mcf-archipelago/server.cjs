const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const clients = new Set();
const port = Number(process.env.PORT || 4173);
const envPath = path.join(root, '.env.local');

function loadLocalEnv() {
  if (!fs.existsSync(envPath)) return;
  for (const raw of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i <= 0) continue;
    const key = line.slice(0, i).trim();
    const value = line.slice(i + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadLocalEnv();

const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
};

function json(res, status, body) {
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  res.end(JSON.stringify(body));
}

async function readJson(req, maxBytes = 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw new Error('PAYLOAD_TOO_LARGE');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

function providerStatus() {
  return {
    openai: { configured: Boolean(process.env.OPENAI_API_KEY), model: process.env.OPENAI_MODEL || 'gpt-5.6-luna' },
    mcf: { configured: Boolean(process.env.MCF_BASE_URL && process.env.MCF_SESSION_COOKIE) }
  };
}

function toInput(messages) {
  return (Array.isArray(messages) ? messages : [])
    .filter(m => m && ['user','assistant'].includes(m.role) && typeof m.text === 'string' && m.text.trim())
    .slice(-30)
    .map(m => ({ role: m.role, content: m.text.slice(0, 12000) }));
}

function sse(res, event, payload) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
}

async function handleChat(req, res) {
  if (!process.env.OPENAI_API_KEY) return json(res, 503, {code:'OPENAI_NOT_CONFIGURED', message:'Provider OpenAI ainda não configurado no backend local.'});
  let body;
  try { body = await readJson(req); } catch (e) { return json(res, e.message === 'PAYLOAD_TOO_LARGE' ? 413 : 400, {code:'INVALID_REQUEST'}); }
  const input = toInput(body.messages);
  if (!input.length) return json(res, 400, {code:'EMPTY_CHAT'});

  const model = process.env.OPENAI_MODEL || 'gpt-5.6-luna';
  const upstream = await fetch('https://api.openai.com/v1/responses', {
    method:'POST',
    headers:{'Authorization':`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},
    body:JSON.stringify({
      model,
      store:false,
      stream:true,
      instructions:`Você é o assistente dentro de uma ilha do MCF Archipelago. Ilha: ${String(body.title || 'Sem título').slice(0,120)}. Responda em português do Brasil por padrão. Preserve o contexto desta ilha e não alegue executar ações externas sem evidência.`,
      input
    })
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(()=>'');
    return json(res, upstream.status || 502, {code:'OPENAI_UPSTREAM_ERROR', message:text.slice(0,1200)});
  }

  res.writeHead(200, {'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-cache, no-store','Connection':'keep-alive'});
  sse(res, 'meta', {provider:'openai', model});
  const decoder = new TextDecoder();
  let buffer = '';
  for await (const chunk of upstream.body) {
    buffer += decoder.decode(chunk, {stream:true});
    let cut;
    while ((cut = buffer.indexOf('\n\n')) >= 0) {
      const block = buffer.slice(0, cut);
      buffer = buffer.slice(cut + 2);
      const data = block.split(/\r?\n/).filter(l => l.startsWith('data:')).map(l => l.slice(5).trim()).join('');
      if (!data || data === '[DONE]') continue;
      try {
        const evt = JSON.parse(data);
        if (evt.type === 'response.output_text.delta' && evt.delta) sse(res, 'delta', {text:evt.delta});
        else if (evt.type === 'response.output_text.done') sse(res, 'done', {text:evt.text || ''});
        else if (evt.type === 'error') sse(res, 'error', {message:evt.message || 'Erro do provider'});
      } catch {}
    }
  }
  res.end();
}

async function handleMcfDispatch(req, res) {
  if (!process.env.MCF_BASE_URL) return json(res, 503, {code:'MCF_NOT_CONFIGURED'});
  let body;
  try { body = await readJson(req); } catch { return json(res, 400, {code:'INVALID_REQUEST'}); }
  const base = process.env.MCF_BASE_URL.replace(/\/$/, '');
  const headers = {'Content-Type':'application/json'};
  if (process.env.MCF_SESSION_COOKIE) headers.Cookie = process.env.MCF_SESSION_COOKIE;
  const upstream = await fetch(`${base}/v1/mcf/chat/dispatch`, {method:'POST', headers, body:JSON.stringify(body)});
  const text = await upstream.text();
  res.writeHead(upstream.status, {'Content-Type':upstream.headers.get('content-type') || 'application/json; charset=utf-8','Cache-Control':'no-store'});
  res.end(text);
}

function serveStatic(req, res) {
  const url = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const file = path.normalize(path.join(root, decodeURIComponent(url)));
  if (!file.startsWith(root)) return json(res, 403, {code:'FORBIDDEN'});
  fs.readFile(file, (err, buf) => {
    if (err) return json(res, 404, {code:'NOT_FOUND'});
    let body = buf;
    if (path.extname(file) === '.html') body = Buffer.from(buf.toString().replace('</body>','<script>const es=new EventSource("/__events");es.onmessage=e=>{if(e.data==="reload")location.reload()}</script></body>'));
    res.writeHead(200, {'Content-Type':types[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-store'});
    res.end(body);
  });
}

const server = http.createServer(async (req,res) => {
  try {
    if (req.url === '/__events') {
      res.writeHead(200, {'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});
      res.write('data: connected\n\n'); clients.add(res); req.on('close',()=>clients.delete(res)); return;
    }
    if (req.method === 'GET' && req.url === '/api/provider/status') return json(res, 200, providerStatus());
    if (req.method === 'POST' && req.url === '/api/chat') return await handleChat(req,res);
    if (req.method === 'POST' && req.url === '/api/mcf/dispatch') return await handleMcfDispatch(req,res);
    return serveStatic(req,res);
  } catch (error) {
    return json(res, 500, {code:'SERVER_ERROR', message:String(error?.message || error).slice(0,500)});
  }
});

fs.watch(root,{recursive:false},(event,name)=>{if(name && !['server.cjs','.env.local'].includes(name)) for(const c of clients)c.write('data: reload\n\n')});
server.listen(port,'127.0.0.1',()=>console.log(`MCF Archipelago em http://127.0.0.1:${port} | OpenAI=${providerStatus().openai.configured?'ON':'OFF'} | MCF=${providerStatus().mcf.configured?'ON':'OFF'}`));
