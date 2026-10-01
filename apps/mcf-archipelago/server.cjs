const http = require('http');
const fs = require('fs');
const path = require('path');
const { ChatStore } = require('./lib/chat-store.cjs');
const { createArchipelagoApi } = require('./lib/archipelago-api.cjs');
const { streamOpenAIResponse } = require('./lib/providers/openai.cjs');
const { DeviceSessionBroker } = require('./lib/device-session-broker.cjs');
const { DualBrowserClient } = require('./lib/dual-browser-client.cjs');

const root = __dirname;
const clients = new Set();
const port = Number(process.env.PORT || 4173);
const envPath = path.join(root, '.env.local');
const liveReload = process.env.ARCHIPELAGO_LIVE_RELOAD === '1';

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

const dualBrowserClient = new DualBrowserClient({
  instanceId: process.env.MCF_DUAL_BROWSER_INSTANCE || 'archipelago',
  descriptorPath: process.env.MCF_DUAL_BROWSER_BRIDGE_FILE || null
});

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
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

function providerConfig() {
  const model = process.env.OPENAI_MODEL || 'gpt-5.6-luna';
  return {
    public: {
      chatgptBrowser: dualBrowserClient.publicStatus(),
      openai: { configured: Boolean(process.env.OPENAI_API_KEY), model },
      mcf: { configured: Boolean(process.env.MCF_BASE_URL && process.env.MCF_SESSION_COOKIE) }
    },
    secret: {
      apiKey: process.env.OPENAI_API_KEY || null
    }
  };
}

function providerStatus() {
  return providerConfig().public;
}

function isLocalRequest(req) {
  const remote = req.socket.remoteAddress || '';
  const origin = req.headers.origin || '';
  const remoteOk = ['127.0.0.1','::1','::ffff:127.0.0.1'].includes(remote);
  const originOk = !origin || origin === `http://127.0.0.1:${port}` || origin === `http://localhost:${port}`;
  return remoteOk && originOk;
}

function saveOpenAIConfig(input) {
  const key = String(input.openaiApiKey || '').trim();
  const model = String(input.openaiModel || 'gpt-5.6-luna').trim();
  if (!/^sk-[A-Za-z0-9_-]{20,}$/u.test(key)) throw new Error('INVALID_OPENAI_KEY');
  if (!/^[A-Za-z0-9._:-]{2,80}$/u.test(model)) throw new Error('INVALID_MODEL');
  fs.writeFileSync(envPath, `OPENAI_API_KEY=${key}\nOPENAI_MODEL=${model}\n`, { encoding:'utf8', mode:0o600 });
  process.env.OPENAI_API_KEY = key;
  process.env.OPENAI_MODEL = model;
  return providerStatus();
}

function sse(res, event, payload) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
}

// Compatibilidade temporária da V1.3. O frontend V1.4 usa /api/v1/chats/*.
async function handleLegacyChat(req, res) {
  let body;
  try { body = await readJson(req); }
  catch (error) { return json(res, error.message === 'PAYLOAD_TOO_LARGE' ? 413 : 400, {code:'INVALID_REQUEST'}); }

  const config = providerConfig();
  if (!config.secret.apiKey) {
    return json(res, 503, {code:'OPENAI_NOT_CONFIGURED', message:'Provider OpenAI ainda não configurado no backend local.'});
  }

  res.writeHead(200, {
    'Content-Type':'text/event-stream; charset=utf-8',
    'Cache-Control':'no-cache, no-store',
    'Connection':'keep-alive'
  });
  sse(res, 'meta', {provider:'openai', model:config.public.openai.model});

  try {
    const result = await streamOpenAIResponse({
      apiKey: config.secret.apiKey,
      model: config.public.openai.model,
      title: body.title,
      messages: body.messages,
      onDelta: async delta => sse(res, 'delta', {text:delta})
    });
    sse(res, 'done', {text:result.text});
  } catch (error) {
    sse(res, 'error', {code:error.code || 'PROVIDER_ERROR', message:String(error.message || error).slice(0,1600)});
  } finally {
    res.end();
  }
}

async function handleMcfDispatch(req, res) {
  if (!process.env.MCF_BASE_URL || !process.env.MCF_SESSION_COOKIE) {
    return json(res, 503, {code:'MCF_NOT_CONFIGURED'});
  }
  let body;
  try { body = await readJson(req); }
  catch { return json(res, 400, {code:'INVALID_REQUEST'}); }

  const base = process.env.MCF_BASE_URL.replace(/\/$/, '');
  const headers = {'Content-Type':'application/json', 'Cookie':process.env.MCF_SESSION_COOKIE};
  const upstream = await fetch(`${base}/v1/mcf/chat/dispatch`, {
    method:'POST',
    headers,
    body:JSON.stringify(body)
  });
  const text = await upstream.text();
  res.writeHead(upstream.status, {
    'Content-Type':upstream.headers.get('content-type') || 'application/json; charset=utf-8',
    'Cache-Control':'no-store'
  });
  res.end(text);
}

function serveStatic(req, res) {
  const url = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const file = path.normalize(path.join(root, decodeURIComponent(url)));
  if (!file.startsWith(root)) return json(res, 403, {code:'FORBIDDEN'});

  fs.readFile(file, (err, buf) => {
    if (err) return json(res, 404, {code:'NOT_FOUND'});
    let body = buf;
    if (path.extname(file) === '.html' && liveReload) {
      body = Buffer.from(buf.toString().replace(
        '</body>',
        '<script>const es=new EventSource("/__events");es.onmessage=e=>{if(e.data==="reload")location.reload()}</script></body>'
      ));
    }
    res.writeHead(200, {
      'Content-Type':types[path.extname(file)] || 'application/octet-stream',
      'Cache-Control':'no-store'
    });
    res.end(body);
  });
}

const chatStore = new ChatStore(root);
const deviceBroker = new DeviceSessionBroker({ ttlMs: Number(process.env.ARCHIPELAGO_DEVICE_TTL_MS || 30000) });
const handleApiV1 = createArchipelagoApi({
  store: chatStore,
  providerConfig,
  streamOpenAIResponse,
  deviceBroker,
  dualBrowserClient
});

const server = http.createServer(async (req,res) => {
  try {
    const requestUrl = new URL(req.url || '/', `http://127.0.0.1:${port}`);

    if (requestUrl.pathname === '/__events') {
      res.writeHead(200, {
        'Content-Type':'text/event-stream',
        'Cache-Control':'no-cache',
        'Connection':'keep-alive'
      });
      res.write('data: connected\n\n');
      clients.add(res);
      req.on('close',()=>clients.delete(res));
      return;
    }

    if (await handleApiV1(req, res, requestUrl)) return;

    if (req.method === 'GET' && requestUrl.pathname === '/api/provider/status') {
      return json(res, 200, providerStatus());
    }

    if (req.method === 'POST' && requestUrl.pathname === '/api/provider/configure') {
      if (!isLocalRequest(req)) return json(res, 403, {code:'LOCAL_ONLY'});
      let input;
      try { input = await readJson(req, 64 * 1024); }
      catch { return json(res, 400, {code:'INVALID_REQUEST'}); }
      try { return json(res, 200, saveOpenAIConfig(input)); }
      catch (error) { return json(res, 400, {code:error.message || 'INVALID_PROVIDER_CONFIG'}); }
    }

    if (req.method === 'POST' && requestUrl.pathname === '/api/chat') {
      return await handleLegacyChat(req,res);
    }

    if (req.method === 'POST' && requestUrl.pathname === '/api/mcf/dispatch') {
      return await handleMcfDispatch(req,res);
    }

    return serveStatic(req,res);
  } catch (error) {
    return json(res, 500, {
      code:'SERVER_ERROR',
      message:String(error?.message || error).slice(0,500)
    });
  }
});

if (liveReload) {
  fs.watch(root,{recursive:false},(event,name)=>{
    if (!name) return;
    const safeName = String(name).replace(/\\/g, '/');
    if (safeName.startsWith('.archipelago-data') || safeName === '.env.local' || safeName === 'server.cjs') return;
    for(const client of clients) client.write('data: reload\n\n');
  });
}

server.listen(port,'127.0.0.1',()=>{
  console.log(
    `MCF Archipelago API v1 em http://127.0.0.1:${port} | OpenAI=${providerStatus().openai.configured?'ON':'OFF'} | MCF=${providerStatus().mcf.configured?'ON':'OFF'}`
  );
});
