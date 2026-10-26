import { inspectMessage, enforceRate, safeResponse } from './policy.mjs';

export class GuardedConversation {
  constructor({ state, invoke, send, getIdentity, getConnectedAt, log = () => {}, ackDelayMs = 12000 }) {
    this.state = state;
    this.invoke = invoke;
    this.send = send;
    this.getIdentity = getIdentity;
    this.getConnectedAt = getConnectedAt;
    this.log = log;
    this.ackDelayMs = ackDelayMs;
    this.current = false;
    this.generation = 0;
    this.times = [];
    this.sentIds = new Set();
  }
  async reply(jid, text) {
    const message = await this.send(jid, safeResponse(text));
    if (message?.key?.id) {
      this.sentIds.add(message.key.id);
      if (this.sentIds.size > 60) this.sentIds.delete(this.sentIds.values().next().value);
    }
  }
  async receive(event) {
    if (event?.type !== 'notify' || !Array.isArray(event.messages)) return;
    for (const msg of event.messages) {
      const data = inspectMessage(msg, {
        identities: this.getIdentity(),
        connectedAt: this.getConnectedAt(),
        sentIds: this.sentIds,
        naturalMode: this.state.data.naturalMode
      });
      if (data.kind === 'ignore') continue;
      if (!await this.state.record(data.id)) continue;
      this.log('accepted_' + data.kind);
      const jid = msg.key.remoteJid;
      if (data.kind === 'stop') {
        this.generation++;
        await this.state.arm(false);
        await this.reply(jid, 'Pausado. Para retomar, envie /mestre iniciar.');
        this.log('stopped');
        continue;
      }
      if (data.kind === 'start') {
        await this.state.arm(true);
        await this.state.setNaturalMode(true);
        await this.reply(jid, 'Ativo. Pode conversar normalmente aqui. Para pausar: /mestre parar. Para conferir: /mestre status.');
        this.log('started');
        continue;
      }
      if (data.kind === 'status') {
        await this.reply(jid, this.state.data.armed ? 'Ativo, conversa pessoal restrita.' : 'Pausado. Digite /mestre iniciar.');
        continue;
      }
      if (!this.state.data.armed) continue;
      if (data.explicit && !this.state.data.naturalMode) await this.state.setNaturalMode(true);
      if (this.current) {
        await this.reply(jid, 'Já estou processando uma mensagem. Repita seu comando depois da resposta.');
        continue;
      }
      const rate = enforceRate(this.times, Date.now());
      this.times = rate.times;
      if (!rate.allowed) {
        await this.reply(jid, 'Limite de teste: até 3 solicitações por minuto.');
        continue;
      }
      this.current = true;
      const generation = this.generation;
      const prompt = data.text;
      void this.runPrompt(prompt, jid, generation).catch(() => {});
    }
  }
  async runPrompt(text, jid, generation) {
    const ack = setTimeout(() => {
      if (this.state.data.armed && generation === this.generation && this.current) {
        void this.reply(jid, 'Recebi seu comando. O Step 5 está processando; esta etapa pode demorar alguns minutos.').catch(() => {});
      }
    }, this.ackDelayMs);
    try {
      const result = await this.invoke(text, this.state.data.sessionId);
      if (!this.state.data.armed || generation !== this.generation) return;
      await this.reply(jid, result.answer);
      await this.state.complete(result.sessionId);
      this.log('reply_success');
    } catch (error) {
      await this.state.failure();
      this.log('reply_failed:' + String(error?.message || 'unknown').replace(/[^a-zA-Z0-9_:-]/g, '').slice(0,60));
      if (this.state.data.armed && generation === this.generation) {
        try { await this.reply(jid, 'O Step 5 não concluiu dentro do limite de execução. Sua conexão WhatsApp continua ativa; você pode tentar novamente.'); } catch {}
      }
    } finally {
      clearTimeout(ack);
      this.current = false;
    }
  }
}
