import test from 'node:test';
import assert from 'node:assert/strict';
import provider from '../lib/providers/openai.cjs';

const {
  createOpenAIConversation,
  latestUserInput,
  streamOpenAIResponse
} = provider;

function sseResponse(events) {
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    start(controller) {
      for (const event of events) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      }
      controller.close();
    }
  });
  return new Response(body, {
    status: 200,
    headers: { 'content-type':'text/event-stream' }
  });
}

test('createOpenAIConversation cria conv_* com metadados do chat', async () => {
  const originalFetch = globalThis.fetch;
  let request = null;
  globalThis.fetch = async (url, init) => {
    request = { url, init };
    return new Response(JSON.stringify({
      id:'conv_test_123',
      object:'conversation',
      created_at:1790100000,
      metadata:{ mcf_chat_id:'chat-123' }
    }), {
      status:200,
      headers:{'content-type':'application/json'}
    });
  };

  try {
    const conversation = await createOpenAIConversation({
      apiKey:'sk-test',
      chatId:'chat-123',
      title:'Arquitetura do MCF',
      projectId:'projeto-zero'
    });

    assert.equal(request.url, 'https://api.openai.com/v1/conversations');
    assert.equal(request.init.method, 'POST');
    const body = JSON.parse(request.init.body);
    assert.equal(body.metadata.mcf_chat_id, 'chat-123');
    assert.equal(body.metadata.mcf_title, 'Arquitetura do MCF');
    assert.equal(body.metadata.mcf_project_id, 'projeto-zero');
    assert.equal(conversation.id, 'conv_test_123');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('latestUserInput seleciona somente a mensagem humana mais recente', () => {
  assert.deepEqual(latestUserInput([
    {role:'user', text:'Primeira pergunta'},
    {role:'assistant', text:'Primeira resposta'},
    {role:'user', text:'Segunda pergunta'}
  ]), [
    {role:'user', content:'Segunda pergunta'}
  ]);
});

test('turno persistente usa conversation e envia apenas a nova mensagem', async () => {
  const originalFetch = globalThis.fetch;
  let requestBody = null;
  const deltas = [];
  globalThis.fetch = async (_url, init) => {
    requestBody = JSON.parse(init.body);
    return sseResponse([
      {type:'response.output_text.delta', delta:'Olá'},
      {type:'response.output_text.delta', delta:' LEANDRO'},
      {type:'response.completed', response:{id:'resp_123', conversation:{id:'conv_123'}}}
    ]);
  };

  try {
    const result = await streamOpenAIResponse({
      apiKey:'sk-test',
      model:'gpt-5.6-luna',
      title:'Arquitetura do MCF',
      conversationId:'conv_123',
      messages:[
        {role:'user', text:'Primeira pergunta'},
        {role:'assistant', text:'Primeira resposta'},
        {role:'user', text:'Segunda pergunta'}
      ],
      onDelta: delta => deltas.push(delta)
    });

    assert.equal(requestBody.conversation, 'conv_123');
    assert.equal('store' in requestBody, false);
    assert.deepEqual(requestBody.input, [{role:'user', content:'Segunda pergunta'}]);
    assert.deepEqual(deltas, ['Olá', ' LEANDRO']);
    assert.equal(result.text, 'Olá LEANDRO');
    assert.equal(result.responseId, 'resp_123');
    assert.equal(result.conversationId, 'conv_123');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('migração inicial semeia o histórico local uma única vez', async () => {
  const originalFetch = globalThis.fetch;
  let requestBody = null;
  globalThis.fetch = async (_url, init) => {
    requestBody = JSON.parse(init.body);
    return sseResponse([
      {type:'response.output_text.delta', delta:'Contexto recebido'},
      {type:'response.completed', response:{id:'resp_seed', conversation:{id:'conv_seed'}}}
    ]);
  };

  try {
    await streamOpenAIResponse({
      apiKey:'sk-test',
      model:'gpt-5.6-luna',
      title:'Chat legado',
      conversationId:'conv_seed',
      seedConversation:true,
      messages:[
        {role:'user', text:'Pergunta antiga'},
        {role:'assistant', text:'Resposta antiga'},
        {role:'user', text:'Pergunta atual'}
      ]
    });

    assert.equal(requestBody.conversation, 'conv_seed');
    assert.deepEqual(requestBody.input, [
      {role:'user', content:'Pergunta antiga'},
      {role:'assistant', content:'Resposta antiga'},
      {role:'user', content:'Pergunta atual'}
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});