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

async function relayAssistantToMestre(dualBrowserClient, chat, message) {
  return dualBrowserClient.enqueueMestreMessage({
    messageId: message.id,
    from: String(chat.title || chat.id || 'ILHA').slice(0, 120),
    fromChatId: chat.id,
    text: message.text
  });
}

async function emitMestreRelay(res, dualBrowserClient, chat, message) {
  try {
    const relay = await relayAssistantToMestre(dualBrowserClient, chat, message);
    sse(res, 'relay', relay);
  } catch (error) {
    sse(res, 'relay_error', {
      code:error.code || error.message || 'MESTRE_RELAY_FAILED',
      message:String(error.message || error).slice(0,500)
    });
  }
}

function createArchipelagoApi({ store, providerConfig, createOpenAIConversation, streamOpenAIResponse, deviceBroker, dualBrowserClient }) {
  async function ensureOpenAIConversation(chat) {
    const config = providerConfig();
    const previous = chat?.metadata?.openai || {};
    const existingId = previous.conversationId || null;

    if (!config.secret.apiKey || existingId) {
      return { chat, created:false, conversationId:existingId };
    }

    const conversation = await createOpenAIConversation({
      apiKey: config.secret.apiKey,
      chatId: chat.id,
      title: chat.title,
      projectId: chat.projectId
    });
    const createdAt = conversation.createdAt
      ? new Date(conversation.createdAt * 1000).toISOString()
      : new Date().toISOString();
    const updated = store.update(chat.id, {
      metadata: {
        openai: {
          ...previous,
          conversationId: conversation.id,
          createdAt,
          state: 'READY'
        }
      }
    });
    return {
      chat: updated || chat,
      created: true,
      conversationId: conversation.id
    };
  }

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

    if (req.method === 'DELETE' && pathname === '/api/v1/workspace') {
      const chats = store.list();
      for (const chat of chats) {
        try { await dualBrowserClient.closeConversation(chat.id); } catch {}
      }
      const clearedBindings = deviceBroker.clearBindings();
      const clearedChats = store.clear();
      try { await dualBrowserClient.openChatSurface('https://chatgpt.com/'); } catch {}
      json(res, 200, { ok:true, clearedChats, clearedBindings });
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

        const surface = await dualBrowserClient.openConversation({
          id: chat.id,
          title: chat.title,
          url: existed?.metadata?.chatgpt?.url || null
        });
        if (!surface?.ok || surface?.conversation?.state !== 'READY') {
          const surfaceError = new Error(surface?.error || 'CHATGPT_SURFACE_NOT_READY');
          surfaceError.status = 422;
          throw surfaceError;
        }

        await ensureOpenAIConversation(store.get(chat.id, true) || chat);

        const current = store.get(chat.id, false);
        const previousChatgpt = current?.metadata?.chatgpt || existed?.metadata?.chatgpt || {};
        const surfaceUrl = surface.conversation.chatgptUrl || null;
        const previousUrl = previousChatgpt.url || null;
        const resolvedUrl = /\/(?:c|uc)\//.test(surfaceUrl || '')
          ? surfaceUrl
          : (/\/(?:c|uc)\//.test(previousUrl || '') ? previousUrl : (surfaceUrl || previousUrl || null));
        const resolvedConversationId =
          surface.conversation.chatgptConversationId ||
          previousChatgpt.conversationId ||
          null;

        const chatWithSurface = store.update(chat.id, {
          metadata: {
            chatgpt: {
              ...previousChatgpt,
              instanceId: dualBrowserClient.instanceId,
              state: surface.conversation.state,
              url: resolvedUrl,
              conversationId: resolvedConversationId,
              deliveryState: previousChatgpt.deliveryState || 'READY',
              pendingUserMessageId: previousChatgpt.pendingUserMessageId || null,
              lastForwardedUserMessageId: previousChatgpt.lastForwardedUserMessageId || null
            }
          }
        });

        json(res, 201, {
          chat: chatWithSurface,
          connection,
          chatgpt: surface.conversation,
          state:'READY'
        });
      } catch (error) {
        const code = error.code || error.message || 'CHAT_SESSION_CREATE_FAILED';
        const authRequired = code === 'chatgpt_auth_required';
        if (createdChatId) {
          try { deviceBroker.unbindChat(createdChatId); } catch {}
          if (authRequired) {
            const current = store.get(createdChatId, false);
            const previousChatgpt = current?.metadata?.chatgpt || {};
            try {
              store.update(createdChatId, {
                metadata: {
                  chatgpt: {
                    ...previousChatgpt,
                    instanceId: dualBrowserClient.instanceId,
                    state: 'AUTH_REQUIRED',
                    lastError: 'chatgpt_auth_required'
                  }
                }
              });
            } catch {}
          } else {
            try { await dualBrowserClient.closeConversation(createdChatId); } catch {}
          }
        }
        if (createdFresh && createdChatId && !authRequired) {
          try { store.remove(createdChatId); } catch {}
        }
        json(res, error.status || 409, { code, state: authRequired ? 'AUTH_REQUIRED' : 'OFFLINE' });
      }
      return true;
    }

    const connectionMatch = pathname.match(/^\/api\/v1\/chat-sessions\/([^/]+)\/connection$/);
    if (connectionMatch && req.method === 'GET') {
      const chatId = decodeId(connectionMatch[1]);
      const connection = deviceBroker.getChatBinding(chatId);
      let chatgpt = null;
      try {
        const result = await dualBrowserClient.getConversation(chatId);
        chatgpt = result?.conversation || null;
      } catch {}
      const ready = connection?.status === 'connected' && chatgpt?.state === 'READY';
      json(
        res,
        connection || chatgpt ? 200 : 404,
        connection || chatgpt
          ? { connection, chatgpt, state: ready ? 'READY' : 'OFFLINE' }
          : { code:'CHAT_CONNECTION_NOT_FOUND' }
      );
      return true;
    }

    if (pathname === '/api/v1/chats') {
      if (req.method === 'GET') {
        json(res, 200, { chats: store.list() });
        return true;
      }
      if (req.method === 'POST') {
        let createdFresh = false;
        let createdId = null;
        try {
          const body = await readJson(req);
          const requestedId = String(body.id || '').trim();
          const existed = requestedId ? store.get(requestedId, false) : null;
          const chat = store.create(body);
          createdFresh = !existed;
          createdId = chat.id;
          const binding = await ensureOpenAIConversation(chat);
          json(res, 201, { chat: binding.chat });
        } catch (error) {
          if (createdFresh && createdId) {
            try { store.remove(createdId); } catch {}
          }
          json(res, error.status || 400, { code: error.code || error.message || 'CHAT_CREATE_FAILED' });
        }
        return true;
      }
    }

    const focusMatch = pathname.match(/^\/api\/v1\/chats\/([^/]+)\/focus$/);
    if (focusMatch && req.method === 'POST') {
      const chatId = decodeId(focusMatch[1]);
      const chat = store.get(chatId, false);
      if (!chat) {
        json(res, 404, { code:'CHAT_NOT_FOUND' });
        return true;
      }
      const storedUrl = chat.metadata?.chatgpt?.url || null;
      const url = /\/(?:c|uc)\//.test(storedUrl || '') ? storedUrl : 'https://chatgpt.com/';
      try {
        const result = await dualBrowserClient.openChatSurface(url);
        json(res, result?.ok ? 200 : 422, result?.ok
          ? { ok:true, chatId, url:result.url || url }
          : { code:result?.error || 'CHAT_SURFACE_OPEN_FAILED' });
      } catch (error) {
        json(res, error.status || 502, { code:error.code || error.message || 'CHAT_SURFACE_OPEN_FAILED' });
      }
      return true;
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
        if (removed) {
          deviceBroker.unbindChat(chatId);
          try { await dualBrowserClient.closeConversation(chatId); } catch {}
        }
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
      const relayToMestre = requestUrl.searchParams.get('relay') === 'mestre';
      const chatId = decodeId(responseMatch[1]);
      const chat = store.get(chatId, true);
      if (!chat) {
        json(res, 404, { code: 'CHAT_NOT_FOUND' });
        return true;
      }

      const lastUserIndex = [...chat.messages].map(m => m.role).lastIndexOf('user');
      if (lastUserIndex < 0) {
        json(res, 400, { code: 'EMPTY_CHAT' });
        return true;
      }
      const lastUser = chat.messages[lastUserIndex];
      const chatgptMeta = chat.metadata?.chatgpt || {};

      if (chatgptMeta.pendingUserMessageId === lastUser.id && chatgptMeta.deliveryState === 'UNKNOWN') {
        json(res, 409, {
          code: 'CHATGPT_DELIVERY_UNKNOWN',
          message: 'A entrega anterior ficou em estado incerto. O Archipelago bloqueou o reenvio automático para evitar duplicação.'
        });
        return true;
      }

      if (chatgptMeta.lastForwardedUserMessageId === lastUser.id) {
        const existing = chat.messages.slice(lastUserIndex + 1).find(m => m.role === 'assistant');
        if (existing) {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-store',
            'Connection': 'keep-alive'
          });
          sse(res, 'meta', { chatId, provider:'chatgpt-browser', replay:true });
          sse(res, 'delta', { text: existing.text });
          if (relayToMestre) await emitMestreRelay(res, dualBrowserClient, chat, existing);
          sse(res, 'done', { message: existing, replay:true });
          res.end();
          return true;
        }
      }

      const browserStatus = dualBrowserClient.publicStatus();
      if (browserStatus.configured) {
        store.update(chatId, {
          metadata: {
            chatgpt: {
              ...chatgptMeta,
              pendingUserMessageId: lastUser.id,
              deliveryState: 'SENDING',
              lastError: null
            }
          }
        });

        res.writeHead(200, {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-store',
          'Connection': 'keep-alive'
        });
        sse(res, 'meta', {
          chatId,
          provider: 'chatgpt-browser',
          instanceId: dualBrowserClient.instanceId
        });

        try {
          let surface;
          try {
            surface = await dualBrowserClient.getConversation(chatId);
          } catch {
            surface = await dualBrowserClient.openConversation({
              id: chatId,
              title: chat.title,
              url: chatgptMeta.url || null
            });
          }
          if (!surface?.ok || surface?.conversation?.state !== 'READY') {
            const error = new Error(surface?.error || 'CHATGPT_SURFACE_NOT_READY');
            error.code = surface?.error || 'CHATGPT_SURFACE_NOT_READY';
            error.delivery = 'NOT_SENT';
            throw error;
          }

          const result = await dualBrowserClient.sendMessage(chatId, lastUser.text);
          const responseText = String(result?.response?.text || '').trim();
          if (!result?.ok || !responseText) {
            const error = new Error(result?.error || 'CHATGPT_EMPTY_RESPONSE');
            error.code = result?.error || 'CHATGPT_EMPTY_RESPONSE';
            throw error;
          }

          const message = store.appendMessage(chatId, {
            role: 'assistant',
            text: responseText,
            provider: 'chatgpt-browser',
            model: 'chatgpt-web-session'
          });
          const conversation = result.conversation || surface.conversation || {};
          store.update(chatId, {
            metadata: {
              chatgpt: {
                ...chatgptMeta,
                instanceId: dualBrowserClient.instanceId,
                state: conversation.state || 'READY',
                url: conversation.chatgptUrl || chatgptMeta.url || null,
                conversationId: conversation.chatgptConversationId || chatgptMeta.conversationId || null,
                pendingUserMessageId: null,
                lastForwardedUserMessageId: lastUser.id,
                deliveryState: 'DELIVERED',
                lastError: null
              }
            }
          });

          sse(res, 'delta', { text: responseText });
          if (relayToMestre) await emitMestreRelay(res, dualBrowserClient, chat, message);
          sse(res, 'done', { message, conversation });
        } catch (error) {
          const delivery = error.delivery === 'NOT_SENT' || error.payload?.delivery === 'NOT_SENT' ? 'NOT_SENT' : 'UNKNOWN';
          const conversation = error.payload?.conversation || null;
          const diagnostics = error.payload?.diagnostics || conversation?.diagnostics || null;
          store.update(chatId, {
            metadata: {
              chatgpt: {
                ...chatgptMeta,
                instanceId: dualBrowserClient.instanceId,
                state: conversation?.state || chatgptMeta.state || 'READY',
                url: conversation?.chatgptUrl || chatgptMeta.url || null,
                conversationId: conversation?.chatgptConversationId || chatgptMeta.conversationId || null,
                pendingUserMessageId: delivery === 'NOT_SENT' ? null : lastUser.id,
                deliveryState: delivery,
                diagnostics,
                lastError: String(error.message || error).slice(0, 500)
              }
            }
          });
          sse(res, 'error', {
            code: error.code || 'CHATGPT_BRIDGE_ERROR',
            delivery,
            conversation,
            diagnostics,
            message: String(error.message || error).slice(0, 1600)
          });
        } finally {
          res.end();
        }
        return true;
      }

      const config = providerConfig();
      if (!config.secret.apiKey) {
        json(res, 503, {
          code: 'NO_CHAT_PROVIDER',
          message: 'Dual Browser ChatGPT e OpenAI API estão indisponíveis.'
        });
        return true;
      }

      let openaiBinding;
      try {
        openaiBinding = await ensureOpenAIConversation(chat);
      } catch (error) {
        json(res, error.status || 502, {
          code: error.code || 'OPENAI_CONVERSATION_CREATE_FAILED',
          message: String(error.message || error).slice(0, 1600)
        });
        return true;
      }
      const openaiChat = openaiBinding.chat;

      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-store',
        'Connection': 'keep-alive'
      });
      sse(res, 'meta', {
        chatId,
        provider: 'openai',
        model: config.public.openai.model,
        conversationId: openaiBinding.conversationId
      });

      let partial = '';
      try {
        const result = await streamOpenAIResponse({
          apiKey: config.secret.apiKey,
          model: config.public.openai.model,
          title: openaiChat.title,
          messages: openaiChat.messages,
          conversationId: openaiBinding.conversationId,
          seedConversation: openaiBinding.created,
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
        const currentOpenAI = store.get(chatId, false)?.metadata?.openai || {};
        store.update(chatId, {
          metadata: {
            openai: {
              ...currentOpenAI,
              conversationId: result.conversationId || openaiBinding.conversationId,
              lastResponseId: result.responseId || currentOpenAI.lastResponseId || null,
              lastUsedAt: new Date().toISOString(),
              state: 'READY'
            }
          }
        });
        if (relayToMestre) await emitMestreRelay(res, dualBrowserClient, openaiChat, message);
        sse(res, 'done', {
          message,
          conversationId: result.conversationId || openaiBinding.conversationId,
          responseId: result.responseId || null
        });
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