const fs = require('fs');
const path = require('path');
const os = require('os');

function defaultDescriptorPath() {
  if (process.env.MCF_DUAL_BROWSER_DESCRIPTOR) return path.resolve(process.env.MCF_DUAL_BROWSER_DESCRIPTOR);
  if (process.platform === 'win32' && process.env.APPDATA) {
    return path.join(process.env.APPDATA, 'mcf-dual-browser-cockpit', 'instances', 'archipelago', 'agent-bridge.json');
  }
  return path.join(os.homedir(), '.config', 'mcf-dual-browser-cockpit', 'instances', 'archipelago', 'agent-bridge.json');
}

class DualBrowserChatGPTAdapter {
  constructor({ descriptorPath = defaultDescriptorPath(), instanceId = 'archipelago' } = {}) {
    this.descriptorPath = descriptorPath;
    this.instanceId = instanceId;
  }

  descriptor() {
    try {
      const raw = JSON.parse(fs.readFileSync(this.descriptorPath, 'utf8'));
      if (!raw?.enabled || raw.instanceId !== this.instanceId || !raw.port || !raw.token) return null;
      return {
        host: '127.0.0.1',
        port: Number(raw.port),
        token: String(raw.token),
        instanceId: String(raw.instanceId)
      };
    } catch {
      return null;
    }
  }

  isConfigured() {
    return Boolean(this.descriptor());
  }

  async #request(route, { method = 'GET', body = undefined, timeoutMs = 135000 } = {}) {
    const descriptor = this.descriptor();
    if (!descriptor) {
      const error = new Error('CHATGPT_BRIDGE_UNAVAILABLE');
      error.code = 'CHATGPT_BRIDGE_UNAVAILABLE';
      error.status = 503;
      throw error;
    }

    const response = await fetch(`http://127.0.0.1:${descriptor.port}${route}`, {
      method,
      headers: {
        'Authorization': `Bearer ${descriptor.token}`,
        'X-MCF-Instance': descriptor.instanceId,
        ...(body === undefined ? {} : {'Content-Type':'application/json'})
      },
      ...(body === undefined ? {} : {body:JSON.stringify(body)}),
      signal: AbortSignal.timeout(timeoutMs)
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(result.error || ('DUAL_BROWSER_HTTP_' + response.status));
      error.code = result.error || 'DUAL_BROWSER_ERROR';
      error.status = response.status;
      throw error;
    }
    return result;
  }

  async status() {
    const descriptor = this.descriptor();
    if (!descriptor) return { configured:false, connected:false, instanceId:this.instanceId };
    try {
      const response = await fetch(`http://127.0.0.1:${descriptor.port}/health`, {
        signal: AbortSignal.timeout(2500)
      });
      return {
        configured:true,
        connected:response.ok,
        instanceId:this.instanceId
      };
    } catch {
      return { configured:true, connected:false, instanceId:this.instanceId };
    }
  }

  async openConversation({ id, title, url = null }) {
    const result = await this.#request('/v1/chatgpt/conversation/open', {
      method:'POST',
      body:{id,title,url}
    });
    return result.conversation;
  }

  async getConversation(id) {
    try {
      const result = await this.#request('/v1/chatgpt/conversation/' + encodeURIComponent(id));
      return result.conversation;
    } catch (error) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  async sendMessage(id, text) {
    const result = await this.#request('/v1/chatgpt/conversation/' + encodeURIComponent(id) + '/send', {
      method:'POST',
      body:{text}
    });
    return result;
  }

  async closeConversation(id) {
    try {
      await this.#request('/v1/chatgpt/conversation/' + encodeURIComponent(id) + '/close', {
        method:'POST',
        body:{}
      });
      return true;
    } catch (error) {
      if (error.status === 404) return false;
      throw error;
    }
  }
}

module.exports = { DualBrowserChatGPTAdapter, defaultDescriptorPath };
