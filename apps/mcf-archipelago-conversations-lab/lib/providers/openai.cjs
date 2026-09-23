function toOpenAIInput(messages) {
  return (Array.isArray(messages) ? messages : [])
    .filter(m => m && ['user','assistant'].includes(m.role) && typeof m.text === 'string' && m.text.trim())
    .slice(-40)
    .map(m => ({ role: m.role, content: m.text.slice(0, 12000) }));
}

function latestUserInput(messages) {
  const list = Array.isArray(messages) ? messages : [];
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const message = list[i];
    if (message?.role === 'user' && typeof message.text === 'string' && message.text.trim()) {
      return [{ role: 'user', content: message.text.slice(0, 12000) }];
    }
  }
  return [];
}

function openAIHeaders(apiKey) {
  return {
    'Authorization': 'Bearer ' + apiKey,
    'Content-Type': 'application/json'
  };
}

async function upstreamError(upstream, fallbackCode) {
  const detail = await upstream.text().catch(() => '');
  const error = new Error(detail.slice(0, 1600) || ('OpenAI HTTP ' + upstream.status));
  error.code = fallbackCode;
  error.status = upstream.status || 502;
  return error;
}

async function createOpenAIConversation({ apiKey, chatId, title, projectId }) {
  if (!apiKey) throw Object.assign(new Error('Provider OpenAI não configurado.'), { code: 'OPENAI_NOT_CONFIGURED', status: 503 });

  const metadata = {
    mcf_chat_id: String(chatId || '').slice(0, 512),
    mcf_title: String(title || 'Novo chat').slice(0, 512)
  };
  if (projectId) metadata.mcf_project_id = String(projectId).slice(0, 512);

  const upstream = await fetch('https://api.openai.com/v1/conversations', {
    method: 'POST',
    headers: openAIHeaders(apiKey),
    body: JSON.stringify({ metadata })
  });

  if (!upstream.ok) throw await upstreamError(upstream, 'OPENAI_CONVERSATION_CREATE_FAILED');
  const conversation = await upstream.json();
  if (!conversation?.id || !String(conversation.id).startsWith('conv_')) {
    throw Object.assign(new Error('OpenAI retornou uma Conversation sem ID válido.'), {
      code: 'OPENAI_CONVERSATION_INVALID',
      status: 502
    });
  }

  return {
    id: String(conversation.id),
    createdAt: Number.isFinite(conversation.created_at) ? conversation.created_at : null,
    metadata: conversation.metadata && typeof conversation.metadata === 'object' ? conversation.metadata : metadata
  };
}

async function streamOpenAIResponse({ apiKey, model, title, messages, conversationId, seedConversation = false, onDelta }) {
  if (!apiKey) throw Object.assign(new Error('Provider OpenAI não configurado.'), { code: 'OPENAI_NOT_CONFIGURED', status: 503 });

  const input = conversationId && !seedConversation
    ? latestUserInput(messages)
    : toOpenAIInput(messages);
  if (!input.length) throw Object.assign(new Error('O chat ainda não possui mensagens válidas.'), { code: 'EMPTY_CHAT', status: 400 });

  const selectedModel = model || 'gpt-5.6-luna';
  const requestBody = {
    model: selectedModel,
    stream: true,
    instructions: `Você é o assistente de uma conversa dentro do MCF Archipelago. Chat: ${String(title || 'Sem título').slice(0,120)}. Responda em português do Brasil por padrão. Use apenas o contexto fornecido. Não alegue executar ações externas sem evidência.`,
    input
  };

  if (conversationId) requestBody.conversation = conversationId;
  else requestBody.store = false;

  const upstream = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: openAIHeaders(apiKey),
    body: JSON.stringify(requestBody)
  });

  if (!upstream.ok || !upstream.body) {
    throw await upstreamError(upstream, 'OPENAI_UPSTREAM_ERROR');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';
  let responseId = null;
  let resolvedConversationId = conversationId || null;

  for await (const chunk of upstream.body) {
    buffer += decoder.decode(chunk, { stream: true });
    let cut;
    while ((cut = buffer.indexOf('\n\n')) >= 0) {
      const block = buffer.slice(0, cut);
      buffer = buffer.slice(cut + 2);
      const data = block
        .split(/\r?\n/)
        .filter(line => line.startsWith('data:'))
        .map(line => line.slice(5).trim())
        .join('');
      if (!data || data === '[DONE]') continue;
      let event;
      try { event = JSON.parse(data); } catch { continue; }
      if (event.type === 'response.output_text.delta' && event.delta) {
        text += event.delta;
        await onDelta?.(event.delta);
      }
      if (event.response?.id) responseId = event.response.id;
      if (event.response?.conversation?.id) resolvedConversationId = event.response.conversation.id;
      if (event.type === 'error') {
        const error = new Error(event.message || 'Erro do provider OpenAI.');
        error.code = 'OPENAI_STREAM_ERROR';
        error.status = 502;
        throw error;
      }
    }
  }

  return {
    text,
    provider: 'openai',
    model: selectedModel,
    responseId,
    conversationId: resolvedConversationId
  };
}

module.exports = {
  createOpenAIConversation,
  latestUserInput,
  streamOpenAIResponse,
  toOpenAIInput
};