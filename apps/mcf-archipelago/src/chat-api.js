export function mapApiMessage(message) {
  return {
    id: message.id,
    role: message.role,
    text: message.text,
    status: message.status || 'done',
    localOnly: message.role === 'system',
    at: message.createdAt
  };
}

async function readJson(response) {
  return response.json().catch(() => ({}));
}

export async function getApiHealth() {
  const response = await fetch('/api/v1/health', { cache: 'no-store' });
  const body = await readJson(response);
  if (!response.ok) throw new Error(body.code || ('HTTP ' + response.status));
  return body;
}

export async function ensureChat(node) {
  const response = await fetch('/api/v1/chats', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({
      id: node.id,
      islandId: node.id,
      title: node.title,
      projectId: node.parentId || null,
      legacyMessages: node.messages || []
    })
  });
  const body = await readJson(response);
  if (!response.ok) throw new Error(body.code || ('HTTP ' + response.status));
  return body.chat;
}

export async function getChat(chatId) {
  const response = await fetch('/api/v1/chats/' + encodeURIComponent(chatId), { cache:'no-store' });
  const body = await readJson(response);
  if (!response.ok) throw new Error(body.code || ('HTTP ' + response.status));
  return body.chat;
}

export async function postUserMessage(chatId, text) {
  const response = await fetch('/api/v1/chats/' + encodeURIComponent(chatId) + '/messages', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({text})
  });
  const body = await readJson(response);
  if (!response.ok) throw new Error(body.code || ('HTTP ' + response.status));
  return body.message;
}

export async function updateChat(chatId, patch) {
  const response = await fetch('/api/v1/chats/' + encodeURIComponent(chatId), {
    method:'PATCH',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(patch)
  });
  const body = await readJson(response);
  if (!response.ok) throw new Error(body.code || ('HTTP ' + response.status));
  return body.chat;
}

export async function deleteChat(chatId) {
  const response = await fetch('/api/v1/chats/' + encodeURIComponent(chatId), { method:'DELETE' });
  const body = await readJson(response);
  if (!response.ok) throw new Error(body.code || ('HTTP ' + response.status));
  return body;
}

export async function streamChatResponse(chatId, handlers = {}) {
  const response = await fetch('/api/v1/chats/' + encodeURIComponent(chatId) + '/responses', { method:'POST' });
  if (!response.ok) {
    const body = await readJson(response);
    throw new Error(body.message || body.code || ('HTTP ' + response.status));
  }
  if (!response.body) throw new Error('API não retornou stream.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const result = await reader.read();
    if (result.done) break;
    buffer += decoder.decode(result.value, { stream:true });
    let cut;
    while ((cut = buffer.indexOf('\n\n')) >= 0) {
      const block = buffer.slice(0, cut);
      buffer = buffer.slice(cut + 2);
      let event = 'message';
      let data = '';
      for (const line of block.split(/\r?\n/)) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        if (line.startsWith('data:')) data += line.slice(5).trim();
      }
      if (!data) continue;
      let payload;
      try { payload = JSON.parse(data); } catch { continue; }
      if (event === 'meta') handlers.onMeta?.(payload);
      else if (event === 'delta') handlers.onDelta?.(payload);
      else if (event === 'done') handlers.onDone?.(payload);
      else if (event === 'error') throw new Error(payload.message || payload.code || 'Erro do provider');
    }
  }
}


export async function connectDeviceSession(input = {}) {
  const response = await fetch('/api/v1/device/session', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(input)
  });
  const body = await readJson(response);
  if (!response.ok) throw new Error(body.code || ('HTTP ' + response.status));
  return body.session;
}

export async function heartbeatDeviceSession(sessionId) {
  const response = await fetch('/api/v1/device/session/' + encodeURIComponent(sessionId) + '/heartbeat', {
    method:'POST'
  });
  const body = await readJson(response);
  if (!response.ok) throw new Error(body.code || ('HTTP ' + response.status));
  return body.session;
}

export async function createAtomicChatSession(node, deviceSessionId) {
  const response = await fetch('/api/v1/chat-sessions', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      id:node.id,
      islandId:node.id,
      title:node.title,
      projectId:node.parentId || null,
      legacyMessages:node.messages || [],
      deviceSessionId,
      metadata:{tags:node.tags || []}
    })
  });
  const body = await readJson(response);
  if (!response.ok) throw new Error(body.code || ('HTTP ' + response.status));
  return body;
}

export async function getChatConnection(chatId) {
  const response = await fetch('/api/v1/chat-sessions/' + encodeURIComponent(chatId) + '/connection', {
    cache:'no-store'
  });
  const body = await readJson(response);
  if (!response.ok) throw new Error(body.code || ('HTTP ' + response.status));
  return body.connection;
}
