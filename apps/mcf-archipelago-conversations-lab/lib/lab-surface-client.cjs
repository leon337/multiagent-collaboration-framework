class LabSurfaceClient {
  constructor({ instanceId = 'conversations-lab' } = {}) {
    this.instanceId = instanceId;
    this.conversations = new Map();
  }

  publicStatus() {
    return {
      configured: false,
      instanceId: this.instanceId,
      transport: 'disabled-in-conversations-lab',
      mode: 'openai-conversations-only'
    };
  }

  async openConversation({ id, title }) {
    const previous = this.conversations.get(id) || {};
    const conversation = {
      id,
      title: String(title || previous.title || 'Novo chat').slice(0, 120),
      state: 'READY',
      chatgptUrl: null,
      chatgptConversationId: null,
      labSurface: true
    };
    this.conversations.set(id, conversation);
    return { ok: true, conversation };
  }

  async getConversation(id) {
    const conversation = this.conversations.get(id);
    if (!conversation) {
      const error = new Error('LAB_SURFACE_NOT_OPEN');
      error.code = 'LAB_SURFACE_NOT_OPEN';
      throw error;
    }
    return { ok: true, conversation };
  }

  async sendMessage() {
    const error = new Error('DUAL_BROWSER_DISABLED_IN_CONVERSATIONS_LAB');
    error.code = 'DUAL_BROWSER_DISABLED_IN_CONVERSATIONS_LAB';
    error.delivery = 'NOT_SENT';
    throw error;
  }

  async closeConversation(id) {
    const removed = this.conversations.delete(id);
    return { ok: removed };
  }

  async openChatSurface() {
    return { ok: true, url: null, labSurface: true };
  }

  async enqueueMestreMessage(input) {
    return {
      ok: true,
      deduplicated: false,
      item: {
        id: 'lab-relay-' + String(input?.messageId || Date.now()),
        state: 'LOCAL_ONLY',
        ...input
      }
    };
  }
}

module.exports = { LabSurfaceClient };
