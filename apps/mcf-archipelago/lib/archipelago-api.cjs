function json(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(body));
}

async function readJson(req, maxBytes = 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw Object.assign(new Error('PAYLOAD_TOO_LARGE'), { status: 413 });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    throw Object.assign(new Error('INVALID_JSON'), { status: 400 });
  }
}

function sse(res, event, payload) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
}

function decodeId(value) {
  try { return decodeURIComponent(value); } catch { return value; }
}

function createArchipelagoApi({ store, providerConfig, streamOpenAIResponse, deviceBroker }) {
  return async function handleArchipelagoApi(req, res, requestUrl) {
    const pathname = requestUrl.pathname;

    if (req.method === 'GET' && pathname === '/api/v1/health') {
      json(res, 200, {
        ok: true,
        api: 'mcf-archipelago',
        version: 1,
        providers: providerConfig().public
      });
      return true;
    }

    if (pathname === '/api/v1/device/session' && req.method === 'POST') {
      try {
        const body = await readJson(req, 64 * 1024);
        const session = deviceBroker.connect(body);
        json(res, 201, { session });
      } catch (error) {
        json(res, error.status || 400, { code: error.message || 'DEVICE_CONNECT_FAILED' });
      }
      return true;
    }

    const heartbeatMatch = pathname.match(/^\/api\/v1\/device\/session\/([^/]+)\/heartbeat$/);
    if (heartbeatMatch && req.method === 'POST') {
      const session = deviceBroker.heartbeat(decodeId(heartbeatMatch[1]));
      json(res, session ? 200 : 404, session ? { session } : { code:'DEVICE_SESSION_NOT_FOUND' });
      return true;
    }

    const deviceMatch = pathname.match(/^\/api\/v1\/device\/session\/([^/]+)$/);
    if (deviceMatch && req.method === 'GET') {
      const session = deviceBroker.get(decodeId(deviceMatch[1]));
      json(res, session ? 200 : 404, session ? { session } : { code:'DEVICE_SESSION_NOT_FOUND' });
      return true;
    }

    if (pathname === '/api/v1/chat-sessions' && req.method === 'POST') {
      let body;
      try { body = await readJson(req); }
      catch (error) { json(res, error.status || 400, { code:error.message || 'INVALID_REQUEST' }); return true; }

      let createdFresh = false;
      let createdChatId = null;
      try {
        const device = deviceBroker.requireConnected(String(body.deviceSessionId || ''));
        const requestedId = String(body.id || '').trim();
        const existed = requestedId ? store.get(requestedId, false) : null;
        const chat = store.create({
          id: body.id,
          islandId: body.islandId,
          title: body.title,
          projectId: body.projectId,
          legacyMessages: body.legacyMessages,
          metadata: {
            ...(body.metadata && typeof body.metadata === 'object' ? body.metadata : {}),
            deviceId: device.deviceId,
            instanceId: device.instanceId
          }
        });
        createdFresh = !existed;
        createdChatId = chat.id;
        const connection = deviceBroker.bindChat(chat.id, device.id);
        json(res, 201, { chat, connection, state:'READY' });
      } catch (error) {
        if (createdFresh && createdChatId) {
          try { store.remove(createdChatId); } catch {}
          try { deviceBroker.unbindChat(createdChatId); } catch {}
        }
        json(res, error.status || 409, { code:error.message || 'CHAT_SESSION_CREATE_FAILED', state:'OFFLINE' });
      }
      return true;
    }

    const connectionMatch = pathname.match(/^\/api\/v1\/chat-sessions\/([^/]+)\/connection$/);
    if (connectionMatch && req.method === 'GET') {
      const connection = deviceBroker.getChatBinding(decodeId(connectionMatch[1]));
      json(res, connection ? 200 : 404, connection ? { connection } : { code:'CHAT_CONNECTION_NOT_FOUND' });
      return true;
    }

    if (pathname === '/api/v1/chats') {
      if (req.method === 'GET') {
        json(res, 200, { chats: store.list() });
        return true;
      }
      if (req.method === 'POST') {
        try {
          const body = await readJson(req);
          const chat = store.create(body);
          json(res, 201, { chat });
        } catch (error) {
          json(res, error.status || 400, { code: error.message || 'CHAT_CREATE_FAILED' });
        }
        return true;
      }
    }

    const chatMatch = pathname.match(/^\/api\/v1\/chats\/([^/]+)$/);
    if (chatMatch) {
      const chatId = decodeId(chatMatch[1]);
      if (req.method === 'GET') {
        const chat = store.get(chatId, true);
        json(res, chat ? 200 : 404, chat ? { chat } : { code: 'CHAT_NOT_FOUND' });
        return true;
      }
      if (req.method === 'PATCH') {
        try {
          const body = await readJson(req);
          const chat = store.update(chatId, body);
          json(res, chat ? 200 : 404, chat ? { chat } : { code: 'CHAT_NOT_FOUND' });
        } catch (error) {
          json(res, error.status || 400, { code: error.message || 'CHAT_UPDATE_FAILED' });
        }
        return true;
      }
      if (req.method === 'DELETE') {
        const removed = store.remove(chatId);
        if (removed) deviceBroker.unbindChat(chatId);
        json(res, removed ? 200 : 404, removed ? { ok: true } : { code: 'CHAT_NOT_FOUND' });
        return true;
      }
    }

    const messageMatch = pathname.match(/^\/api\/v1\/chats\/([^/]+)\/messages$/);
    if (messageMatch) {
      const chatId = decodeId(messageMatch[1]);
      if (req.method === 'GET') {
        const messages = store.messages(chatId);
        json(res, messages ? 200 : 404, messages ? { messages } : { code: 'CHAT_NOT_FOUND' });
        return true;
      }
      if (req.method === 'POST') {
        try {
          const body = await readJson(req);
          const message = store.appendMessage(chatId, {
            role: 'user',
            text: body.text
          });
          json(res, 201, { message });
        } catch (error) {
          const code = error.message || 'MESSAGE_CREATE_FAILED';
          json(res, code === 'CHAT_NOT_FOUND' ? 404 : 400, { code });
        }
        return true;
      }
    }

    const responseMatch = pathname.match(/^\/api\/v1\/chats\/([^/]+)\/responses$/);
    if (responseMatch && req.method === 'POST') {
      const chatId = decodeId(responseMatch[1]);
      const chat = store.get(chatId, true);
      if (!chat) {
        json(res, 404, { code: 'CHAT_NOT_FOUND' });
        return true;
      }

      const config = providerConfig();
      if (!config.secret.apiKey) {
        json(res, 503, { code: 'OPENAI_NOT_CONFIGURED', message: 'Configure um provider de IA no Archipelago.' });
        return true;
      }

      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-store',
        'Connection': 'keep-alive'
      });
      sse(res, 'meta', {
        chatId,
        provider: 'openai',
        model: config.public.openai.model
      });

      let partial = '';
      try {
        const result = await streamOpenAIResponse({
          apiKey: config.secret.apiKey,
          model: config.public.openai.model,
          title: chat.title,
          messages: chat.messages,
          onDelta: async delta => {
            partial += delta;
            sse(res, 'delta', { text: delta });
          }
        });
        const message = store.appendMessage(chatId, {
          role: 'assistant',
          text: result.text || partial,
          provider: result.provider,
          model: result.model
        });
        sse(res, 'done', { message });
      } catch (error) {
        if (partial.trim()) {
          store.appendMessage(chatId, {
            role: 'assistant',
            text: partial,
            provider: 'openai',
            model: config.public.openai.model,
            status: 'error'
          });
        }
        sse(res, 'error', {
          code: error.code || 'PROVIDER_ERROR',
          message: String(error.message || error).slice(0, 1600)
        });
      } finally {
        res.end();
      }
      return true;
    }

    return false;
  };
}

module.exports = { createArchipelagoApi };
