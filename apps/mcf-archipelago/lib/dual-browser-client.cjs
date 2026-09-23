const fs = require('fs');
const path = require('path');

class DualBrowserClient {
  constructor({ instanceId = 'archipelago', descriptorPath = null } = {}) {
    this.instanceId = String(instanceId || 'archipelago').slice(0, 120);
    this.descriptorPath = descriptorPath || this.defaultDescriptorPath();
  }

  defaultDescriptorPath() {
    if (process.env.APPDATA) {
      return path.join(
        process.env.APPDATA,
        'mcf-dual-browser-cockpit',
        'instances',
        this.instanceId,
        'agent-bridge.json'
      );
    }
    const home = process.env.HOME || process.env.USERPROFILE || '.';
    return path.join(home, '.config', 'mcf-dual-browser-cockpit', 'instances', this.instanceId, 'agent-bridge.json');
  }

  publicStatus() {
    try {
      const d = this.#descriptor();
      return {
        configured: true,
        instanceId: d.instanceId,
        enabled: true
      };
    } catch {
      return {
        configured: false,
        instanceId: this.instanceId,
        enabled: false
      };
    }
  }

  async openConversation({ id, title, url = null }) {
    return this.#request('POST', '/v1/chatgpt/conversation/open', { id, title, url }, 45000);
  }

  async getConversation(id) {
    return this.#request('GET', '/v1/chatgpt/conversation/' + encodeURIComponent(id), null, 10000);
  }

  async sendMessage(id, text) {
    return this.#request(
      'POST',
      '/v1/chatgpt/conversation/' + encodeURIComponent(id) + '/send',
      { text },
      175000
    );
  }

  async openChatSurface(url) {
    return this.#request(
      'POST',
      '/v1/chat-surface/open',
      { url },
      30000
    );
  }

  async enqueueMestreMessage({ messageId, from, fromChatId, text }) {
    return this.#request(
      'POST',
      '/v1/mestre/inbox',
      { messageId, from, fromChatId, text },
      15000
    );
  }

  async closeConversation(id) {
    try {
      return await this.#request(
        'POST',
        '/v1/chatgpt/conversation/' + encodeURIComponent(id) + '/close',
        {},
        15000
      );
    } catch (error) {
      if (error.status === 404) return { ok: false, error: 'conversation_not_found' };
      throw error;
    }
  }

  async #request(method, route, body, timeoutMs) {
    const d = this.#descriptor();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch('http://127.0.0.1:' + d.port + route, {
        method,
        headers: {
          'Authorization': 'Bearer ' + d.token,
          'X-MCF-Instance': d.instanceId,
          ...(body === null ? {} : {'Content-Type':'application/json'})
        },
        ...(body === null ? {} : { body: JSON.stringify(body) }),
        signal: controller.signal
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(payload.error || payload.code || ('DUAL_BROWSER_HTTP_' + response.status));
        error.status = response.status;
        error.code = payload.error || payload.code || 'DUAL_BROWSER_ERROR';
        error.payload = payload;
        throw error;
      }
      return payload;
    } catch (error) {
      if (error.name === 'AbortError') {
        const timeout = new Error('DUAL_BROWSER_TIMEOUT');
        timeout.status = 504;
        timeout.code = 'DUAL_BROWSER_TIMEOUT';
        throw timeout;
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  #descriptor() {
    if (!fs.existsSync(this.descriptorPath)) {
      const error = new Error('DUAL_BROWSER_DESCRIPTOR_NOT_FOUND');
      error.status = 503;
      throw error;
    }
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(this.descriptorPath, 'utf8'));
    } catch {
      const error = new Error('DUAL_BROWSER_DESCRIPTOR_INVALID');
      error.status = 503;
      throw error;
    }
    if (
      parsed?.enabled !== true ||
      parsed?.instanceId !== this.instanceId ||
      !Number.isInteger(parsed?.port) ||
      parsed.port < 1 ||
      parsed.port > 65535 ||
      typeof parsed?.token !== 'string' ||
      parsed.token.length < 16
    ) {
      const error = new Error('DUAL_BROWSER_BRIDGE_NOT_READY');
      error.status = 503;
      throw error;
    }
    return {
      instanceId: parsed.instanceId,
      port: parsed.port,
      token: parsed.token
    };
  }
}

module.exports = { DualBrowserClient };
