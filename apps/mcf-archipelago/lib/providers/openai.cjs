function toOpenAIInput(messages) {
  return (Array.isArray(messages) ? messages : [])
    .filter(m => m && ['user','assistant'].includes(m.role) && typeof m.text === 'string' && m.text.trim())
    .slice(-40)
    .map(m => ({ role: m.role, content: m.text.slice(0, 12000) }));
}

async function streamOpenAIResponse({ apiKey, model, title, messages, onDelta }) {
  if (!apiKey) throw Object.assign(new Error('Provider OpenAI não configurado.'), { code: 'OPENAI_NOT_CONFIGURED', status: 503 });
  const input = toOpenAIInput(messages);
  if (!input.length) throw Object.assign(new Error('O chat ainda não possui mensagens válidas.'), { code: 'EMPTY_CHAT', status: 400 });

  const selectedModel = model || 'gpt-5.6-luna';
  const upstream = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: selectedModel,
      store: false,
      stream: true,
      instructions: `Você é o assistente de uma conversa dentro do MCF Archipelago. Chat: ${String(title || 'Sem título').slice(0,120)}. Responda em português do Brasil por padrão. Use apenas o contexto fornecido. Não alegue executar ações externas sem evidência.`,
      input
    })
  });

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '');
    const error = new Error(detail.slice(0, 1600) || ('OpenAI HTTP ' + upstream.status));
    error.code = 'OPENAI_UPSTREAM_ERROR';
    error.status = upstream.status || 502;
    throw error;
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';

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
      if (event.type === 'error') {
        const error = new Error(event.message || 'Erro do provider OpenAI.');
        error.code = 'OPENAI_STREAM_ERROR';
        error.status = 502;
        throw error;
      }
    }
  }

  return { text, provider: 'openai', model: selectedModel };
}

module.exports = { streamOpenAIResponse, toOpenAIInput };
