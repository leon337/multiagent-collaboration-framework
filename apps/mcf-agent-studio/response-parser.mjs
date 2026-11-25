/**
 * Read 9Router/OpenAI-compatible chat completions returned as JSON or SSE.
 * Never execute returned content or expose credentials.
 */
export function parseChatCompletion(raw, contentType = '') {
  const input = String(raw ?? '').trim();
  if (!input) throw new Error('9Router retornou corpo vazio');
  const plain = input.startsWith('{') || input.startsWith('[');
  let frames = [];
  if (plain) {
    try { frames = [JSON.parse(input)]; }
    catch {
      throw new Error('O 9Router retornou JSON inválido.');
    }
  } else {
    // OpenAI-style server-sent events, even if client did not set stream:true.
    // Events are separated by blank lines and may include event:/id:/retry: fields.
    const lines = input.split(/\r?\n/);
    let current = [];
    const flush = () => {
      if (!current.length) return;
      const payload = current.join('\n').trim();
      current = [];
      if (!payload || payload === '[DONE]') return;
      try { frames.push(JSON.parse(payload)); }
      catch { throw new Error('9Router enviou um evento SSE com JSON inválido.'); }
    };
    let recognized = false;
    for (const line of lines) {
      if (line.startsWith('data:')) {
        recognized = true;
        current.push(line.slice(5).trimStart());
      } else if (!line.trim()) flush();
    }
    flush();
    if (!recognized || !frames.length) throw new Error('9Router retornou um formato incompatível com JSON/SSE.');
  }
  let merged = '';
  let finalText = '';
  for (const frame of frames) {
    if (!frame || typeof frame !== 'object') continue;
    if (frame.error) throw new Error('9Router retornou erro do provedor durante a geração.');
    const choice = frame.choices?.[0];
    if (!choice) continue;
    const part = choice.delta?.content ?? choice.text;
    if (typeof part === 'string') merged += part;
    else if (Array.isArray(part)) merged += part.filter(item => item?.type === 'text').map(item => item.text || '').join('');
    const complete = choice.message?.content;
    if (typeof complete === 'string') finalText = complete;
    else if (Array.isArray(complete)) finalText = complete.filter(item => item?.type === 'text').map(item => item.text || '').join('');
  }
  const output = merged.trim() || finalText.trim();
  if (!output) throw new Error('9Router não retornou texto de resposta (verifique o modelo selecionado).');
  return output;
}
