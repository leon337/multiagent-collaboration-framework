import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';

import { webRuntimeConfig } from './runtime-config';
import './MissionChat.css';

type ChatKind = 'MESSAGE' | 'TASK' | 'RESULT' | 'BLOCKER' | 'HANDOFF' | 'APPROVAL_REQUEST';

interface Room {
  id: string;
  title: string;
  state: string;
  type: string;
}

interface ChatMessage {
  sequence: string;
  id: string;
  roomId: string;
  actorKind: 'HUMAN' | 'AGENT_REPORTED';
  actorId: string;
  actorLabel: string;
  kind: ChatKind;
  content: string;
  trustLabel: 'AUTHENTICATED_HUMAN' | 'RUNTIME_REPORTED';
  createdAt: string;
}

const kinds: Array<{ value: ChatKind; label: string }> = [
  { value: 'MESSAGE', label: 'Mensagem' },
  { value: 'TASK', label: 'Tarefa' },
  { value: 'RESULT', label: 'Resultado' },
  { value: 'BLOCKER', label: 'Bloqueio' },
  { value: 'HANDOFF', label: 'Handoff (informativo)' },
  { value: 'APPROVAL_REQUEST', label: 'Pedido de aprovação' },
];

const apiBase = webRuntimeConfig.apiBaseUrl;

function mergeMessages(previous: ChatMessage[], received: ChatMessage[]): ChatMessage[] {
  const messages = new Map(previous.map((message) => [message.id, message]));
  for (const message of received) messages.set(message.id, message);
  return [...messages.values()]
    .sort((left, right) => Number(BigInt(left.sequence) - BigInt(right.sequence)))
    .slice(-200);
}

function formatTime(timestamp: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit',
  }).format(new Date(timestamp));
}

export function MissionChat() {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomId, setRoomId] = useState('geral');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [kind, setKind] = useState<ChatKind>('MESSAGE');
  const [notice, setNotice] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [sending, setSending] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'connecting' | 'live' | 'polling'>('connecting');
  const lastMessageRef = useRef<HTMLDivElement>(null);

  const getJson = useCallback(async <T,>(
    path: string, token: string, options?: RequestInit,
  ): Promise<T> => {
    if (!apiBase) throw new Error('API não configurada.');
    const response = await fetch(apiBase + path, {
      ...options,
      headers: {
        authorization: `Bearer ${token}`,
        ...(options?.body ? { 'content-type': 'application/json' } : {}),
      },
    });
    if (!response.ok) throw new Error(`A API retornou HTTP ${response.status}.`);
    return (await response.json()) as T;
  }, []);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!apiBase) return;
    setConnecting(true);
    setNotice('');
    try {
      const response = await fetch(apiBase + '/v1/sessions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) throw new Error('Não foi possível autenticar. Verifique as credenciais.');
      const session = (await response.json()) as { token: string };
      const roomList = await getJson<Room[]>('/v1/mcf/mission-chat/rooms', session.token);
      setSessionToken(session.token);
      setRooms(roomList);
      setRoomId(roomList[0]?.id ?? 'geral');
      setPassword('');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Não foi possível entrar.');
    } finally {
      setConnecting(false);
    }
  }

  async function signOut() {
    const token = sessionToken;
    setSessionToken(null);
    setMessages([]);
    setRooms([]);
    setDraft('');
    setSyncStatus('connecting');
    if (token && apiBase) {
      try {
        await fetch(apiBase + '/v1/sessions/current', {
          method: 'DELETE', headers: { authorization: `Bearer ${token}` },
        });
      } catch {
        // The local token has already been discarded.
      }
    }
  }

  useEffect(() => {
    if (!sessionToken || !apiBase) return;
    const token = sessionToken;
    const controller = new AbortController();
    let cursor = '0';
    let fallbackTimer: ReturnType<typeof setInterval> | undefined;
    setMessages([]);
    setNotice('');
    setSyncStatus('connecting');

    const receive = (incoming: ChatMessage[]) => {
      if (controller.signal.aborted) return;
      if (incoming.length) {
        cursor = incoming[incoming.length - 1]!.sequence;
        setMessages((current) => mergeMessages(current, incoming));
      }
    };

    async function poll() {
      try {
        const response = await getJson<{ messages: ChatMessage[] }>(
          `/v1/mcf/mission-chat/rooms/${encodeURIComponent(roomId)}/messages?after=${cursor}`,
          token,
        );
        receive(response.messages);
      } catch {
        if (!controller.signal.aborted) setNotice('Não foi possível atualizar as mensagens.');
      }
    }

    async function listen() {
      try {
        await poll();
        if (controller.signal.aborted) return;
        const response = await fetch(
          apiBase + `/v1/mcf/mission-chat/rooms/${encodeURIComponent(roomId)}/stream?after=${cursor}`,
          { headers: { authorization: `Bearer ${token}` }, signal: controller.signal },
        );
        if (!response.ok || !response.body) throw new Error('Stream indisponível');
        setSyncStatus('live');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (!controller.signal.aborted) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true }).replace(/\r/gu, '');
          const frames = buffer.split('\n\n');
          buffer = frames.pop() ?? '';
          for (const frame of frames) {
            const line = frame.split('\n').find((part) => part.startsWith('data:'));
            if (!line) continue;
            const data = JSON.parse(line.slice(5).trim()) as { messages?: ChatMessage[] };
            if (data.messages) receive(data.messages);
          }
        }
      } catch {
        // HTTP streaming is optional in restrictive browsers; polling is a read-only fallback.
      }
      if (!controller.signal.aborted) {
        setSyncStatus('polling');
        fallbackTimer = setInterval(() => { void poll(); }, 2_500);
      }
    }

    void listen();
    return () => {
      controller.abort();
      if (fallbackTimer) clearInterval(fallbackTimer);
    };
  }, [sessionToken, roomId, getJson]);

  useEffect(() => {
    lastMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionToken || !draft.trim() || sending) return;
    setSending(true);
    setNotice('');
    try {
      const newMessage = await getJson<ChatMessage>(
        `/v1/mcf/mission-chat/rooms/${encodeURIComponent(roomId)}/messages`,
        sessionToken,
        { method: 'POST', body: JSON.stringify({ kind, content: draft.trim() }) },
      );
      setMessages((current) => mergeMessages(current, [newMessage]));
      setDraft('');
    } catch {
      setNotice('Falha ao enviar a mensagem. Nenhum reenvio automático foi realizado.');
    } finally {
      setSending(false);
    }
  }

  const selectedRoom = rooms.find((room) => room.id === roomId);

  return (
    <main className="chat-layout">
      <header className="chat-topbar">
        <div>
          <a className="chat-back" href="/">← Voltar ao piloto</a>
          <h1>Sala de Missão <span>MCF</span></h1>
          <p>Conversa operacional com histórico persistente e identidade explícita.</p>
        </div>
        {sessionToken ? <button className="chat-signout" onClick={() => { void signOut(); }}>Sair</button> : null}
      </header>

      {!apiBase ? (
        <section className="chat-signin"><p>Defina <code>VITE_API_BASE_URL</code> para habilitar esta interface.</p></section>
      ) : !sessionToken ? (
        <section className="chat-signin">
          <h2>Entrar na sala</h2>
          <p>Use uma conta humana autorizada do MCF. O token da sessão permanece apenas na memória desta aba.</p>
          <form onSubmit={(event) => { void signIn(event); }}>
            <label>E-mail<input required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <label>Senha<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
            <button disabled={connecting} type="submit">{connecting ? 'Autenticando…' : 'Entrar'}</button>
          </form>
          {notice ? <p role="alert" className="chat-error">{notice}</p> : null}
        </section>
      ) : (
        <div className="chat-workspace">
          <aside className="chat-rooms" aria-label="Salas">
            <h2>Salas</h2>
            {rooms.map((room) => (
              <button key={room.id} className={room.id === roomId ? 'chat-room chat-room--active' : 'chat-room'} onClick={() => setRoomId(room.id)}>
                <strong>{room.title}</strong>
                <small>{room.type === 'MISSION' ? `Missão · ${room.state}` : 'Conversa geral'}</small>
              </button>
            ))}
          </aside>
          <section className="chat-panel" aria-label="Conversa">
            <div className="chat-room-heading">
              <div><h2>{selectedRoom?.title ?? 'Carregando sala…'}</h2><p>Mensagens informativas não alteram gates, handoffs nem estado do runtime.</p></div>
              <span className="chat-live-state">{syncStatus === 'live' ? '● Tempo real' : syncStatus === 'polling' ? '◌ Sincronizando' : '◌ Conectando'}</span>
            </div>
            <div className="chat-messages" aria-live="polite" aria-relevant="additions">
              {messages.length === 0 ? <p className="chat-empty">Nenhuma mensagem nesta sala. Inicie a conversa.</p> : null}
              {messages.map((message) => (
                <article className={message.actorKind === 'HUMAN' ? 'chat-message chat-message--human' : 'chat-message'} key={message.id}>
                  <div className="chat-message-meta">
                    <strong>{message.actorLabel}</strong>
                    <span>{message.actorKind === 'HUMAN' ? 'Humano autenticado' : 'Agente reportado pelo runtime · identidade não comprovada'}</span>
                    <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
                  </div>
                  <span className="chat-kind">{kinds.find((item) => item.value === message.kind)?.label ?? message.kind}</span>
                  <p>{message.content}</p>
                </article>
              ))}
              <div ref={lastMessageRef} />
            </div>
            <form className="chat-composer" onSubmit={(event) => { void send(event); }}>
              {notice ? <p role="alert" className="chat-error">{notice}</p> : null}
              <div className="chat-compose-controls">
                <label htmlFor="chat-kind">Tipo</label>
                <select id="chat-kind" value={kind} onChange={(event) => setKind(event.target.value as ChatKind)}>
                  {kinds.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
              <label htmlFor="chat-draft" className="chat-sr-only">Mensagem</label>
              <textarea id="chat-draft" maxLength={4000} rows={3} placeholder="Escreva uma mensagem ou mencione @agente (menções ainda não despacham tarefas)." value={draft} onChange={(event) => setDraft(event.target.value)} />
              <div className="chat-composer-footer">
                <small>{draft.length}/4000 · Sem execução automática de ações</small>
                <button type="submit" disabled={sending || !draft.trim()}>{sending ? 'Enviando…' : 'Enviar mensagem'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
