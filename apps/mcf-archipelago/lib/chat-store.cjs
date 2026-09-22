const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

class ChatStore {
  constructor(rootDir) {
    this.dir = path.join(rootDir, '.archipelago-data');
    this.file = path.join(this.dir, 'chats.json');
    this.state = { version: 1, chats: [] };
    this.#load();
  }

  #load() {
    fs.mkdirSync(this.dir, { recursive: true, mode: 0o700 });
    if (!fs.existsSync(this.file)) {
      this.#save();
      return;
    }
    try {
      const parsed = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      if (parsed?.version === 1 && Array.isArray(parsed.chats)) this.state = parsed;
    } catch {
      const backup = this.file + '.corrupt-' + Date.now();
      try { fs.renameSync(this.file, backup); } catch {}
      this.state = { version: 1, chats: [] };
      this.#save();
    }
  }

  #save() {
    fs.mkdirSync(this.dir, { recursive: true, mode: 0o700 });
    const temp = this.file + '.tmp-' + process.pid + '-' + Date.now();
    fs.writeFileSync(temp, JSON.stringify(this.state, null, 2), { encoding: 'utf8', mode: 0o600 });
    fs.renameSync(temp, this.file);
  }

  list() {
    return this.state.chats.map(chat => this.#publicChat(chat, false));
  }

  get(id, includeMessages = true) {
    const chat = this.state.chats.find(c => c.id === id);
    return chat ? this.#publicChat(chat, includeMessages) : null;
  }

  create(input = {}) {
    const requestedId = String(input.id || '').trim();
    const id = requestedId || 'chat-' + randomUUID();
    if (!/^[A-Za-z0-9._:-]{1,160}$/u.test(id)) throw new Error('INVALID_CHAT_ID');

    const existing = this.state.chats.find(c => c.id === id);
    if (existing) {
      let changed = false;
      if (typeof input.title === 'string' && input.title.trim() && input.title.trim() !== existing.title) {
        existing.title = input.title.trim().slice(0, 120);
        changed = true;
      }
      if (input.projectId !== undefined && (input.projectId || null) !== existing.projectId) {
        existing.projectId = input.projectId || null;
        changed = true;
      }
      if (changed) {
        existing.updatedAt = new Date().toISOString();
        this.#save();
      }
      this.#importLegacy(existing, input.legacyMessages);
      return this.#publicChat(existing, true);
    }

    const now = new Date().toISOString();
    const chat = {
      id,
      islandId: String(input.islandId || id).slice(0, 160),
      title: String(input.title || 'Novo chat').trim().slice(0, 120) || 'Novo chat',
      projectId: input.projectId ? String(input.projectId).slice(0, 160) : null,
      metadata: input.metadata && typeof input.metadata === 'object' ? input.metadata : {},
      createdAt: now,
      updatedAt: now,
      messages: []
    };
    this.state.chats.push(chat);
    this.#importLegacy(chat, input.legacyMessages);
    this.#save();
    return this.#publicChat(chat, true);
  }

  update(id, patch = {}) {
    const chat = this.state.chats.find(c => c.id === id);
    if (!chat) return null;
    if (typeof patch.title === 'string' && patch.title.trim()) chat.title = patch.title.trim().slice(0, 120);
    if (patch.projectId !== undefined) chat.projectId = patch.projectId ? String(patch.projectId).slice(0, 160) : null;
    if (patch.metadata && typeof patch.metadata === 'object') chat.metadata = { ...chat.metadata, ...patch.metadata };
    chat.updatedAt = new Date().toISOString();
    this.#save();
    return this.#publicChat(chat, true);
  }

  remove(id) {
    const index = this.state.chats.findIndex(c => c.id === id);
    if (index < 0) return false;
    this.state.chats.splice(index, 1);
    this.#save();
    return true;
  }

  appendMessage(chatId, input = {}) {
    const chat = this.state.chats.find(c => c.id === chatId);
    if (!chat) throw new Error('CHAT_NOT_FOUND');
    const role = ['user', 'assistant', 'system'].includes(input.role) ? input.role : 'user';
    const text = String(input.text || '').trim();
    if (!text) throw new Error('EMPTY_MESSAGE');
    const now = new Date().toISOString();
    const message = {
      id: 'msg-' + randomUUID(),
      role,
      text: text.slice(0, 12000),
      provider: input.provider ? String(input.provider).slice(0, 80) : null,
      model: input.model ? String(input.model).slice(0, 120) : null,
      status: input.status === 'error' ? 'error' : 'done',
      createdAt: now
    };
    chat.messages.push(message);
    if (chat.messages.length > 500) chat.messages = chat.messages.slice(-500);
    chat.updatedAt = now;
    this.#save();
    return { ...message };
  }

  messages(chatId) {
    const chat = this.state.chats.find(c => c.id === chatId);
    return chat ? chat.messages.map(m => ({ ...m })) : null;
  }

  #importLegacy(chat, messages) {
    if (!Array.isArray(messages) || chat.messages.length) return;
    for (const raw of messages.slice(-200)) {
      const role = raw?.role === 'assistant' ? 'assistant' : raw?.role === 'system' ? 'system' : 'user';
      const text = typeof raw === 'string' ? raw : String(raw?.text || '');
      if (!text.trim()) continue;
      chat.messages.push({
        id: 'msg-' + randomUUID(),
        role,
        text: text.trim().slice(0, 12000),
        provider: null,
        model: null,
        status: 'done',
        createdAt: typeof raw?.at === 'string' ? raw.at : new Date().toISOString()
      });
    }
    chat.updatedAt = new Date().toISOString();
    this.#save();
  }

  #publicChat(chat, includeMessages) {
    const result = {
      id: chat.id,
      islandId: chat.islandId,
      title: chat.title,
      projectId: chat.projectId,
      metadata: { ...chat.metadata },
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      messageCount: chat.messages.length
    };
    if (includeMessages) result.messages = chat.messages.map(m => ({ ...m }));
    return result;
  }
}

module.exports = { ChatStore };
