import WebSocket from 'ws';
import { randomUUID } from 'node:crypto';
import { normalizeJid } from './policy.mjs';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const debugOrigin = 'http://127.0.0.1:9227';

export function selfPhone(jid) {
  const value = normalizeJid(jid);
  if (!value.endsWith('@s.whatsapp.net')) throw Error('browser_self_jid_invalid');
  const digits = value.split('@')[0];
  if (!/^\d{10,15}$/.test(digits)) throw Error('browser_self_digits_invalid');
  return digits;
}

export function composerIsSelf(aria, digits) {
  if (!aria || !digits) return false;
  const found = aria.replace(/\D/g, '');
  return found.includes(digits) && !/\D/.test(digits);
}

export function validateOutbound(jid, ownJid, body, verifiedOwnAliases = []) {
  const digits = selfPhone(ownJid);
  // Linked devices may report the same owner's self-chat through a PN JID or LID.
  // These aliases must come ONLY from the authenticated socket's own identity;
  // never from message content, contact data, or an untrusted caller.
  const recipient = normalizeJid(jid);
  const trusted = [ownJid, ...verifiedOwnAliases].map(normalizeJid).filter(Boolean);
  if (!recipient || !trusted.includes(recipient)) throw Error('browser_target_not_self');
  if (typeof body !== 'string' || !body.startsWith('MESTRE: ') || !body.trim() || body.length > 2750) {
    throw Error('browser_reply_invalid');
  }
  return digits;
}

export async function openBrowserSession() {
  const response = await fetch(debugOrigin + '/json/list', { signal: AbortSignal.timeout(4000) });
  if (!response.ok) throw Error('brave_debug_http_unavailable');
  const targets = await response.json();
  const pages = targets.filter(x => x.type === 'page' && x.url?.startsWith('https://web.whatsapp.com/') && x.webSocketDebuggerUrl);
  if (pages.length !== 1) throw Error('brave_whatsapp_target_ambiguous');
  const target = pages[0];
  const ws = await new Promise((resolve, reject) => {
    const sock = new WebSocket(target.webSocketDebuggerUrl, { handshakeTimeout: 4000 });
    const timer = setTimeout(() => { sock.terminate(); reject(Error('brave_debug_open_timeout')); }, 4500);
    sock.once('open', () => { clearTimeout(timer); resolve(sock); });
    sock.once('error', e => { clearTimeout(timer); reject(Error('brave_debug_connection_failed')); });
  });
  const requests = new Map();
  let nextId = 0;
  ws.on('message', buffer => {
    let obj;
    try { obj = JSON.parse(buffer.toString('utf8')); } catch { return; }
    if (!obj?.id || !requests.has(obj.id)) return;
    const item = requests.get(obj.id);
    requests.delete(obj.id);
    clearTimeout(item.timer);
    if (obj.error || obj.result?.exceptionDetails) item.reject(Error('brave_cdp_execution_failed'));
    else item.resolve(obj.result);
  });
  const command = (method, params = {}, timeoutMs = 9000) => new Promise((resolve, reject) => {
    if (ws.readyState !== WebSocket.OPEN) return reject(Error('brave_debug_closed'));
    const id = ++nextId;
    const timer = setTimeout(() => {
      requests.delete(id);
      reject(Error('brave_cdp_timeout'));
    }, timeoutMs);
    requests.set(id, { resolve, reject, timer });
    ws.send(JSON.stringify({ id, method, params }), error => {
      if (error && requests.has(id)) {
        clearTimeout(timer);
        requests.delete(id);
        reject(Error('brave_debug_send_failed'));
      }
    });
  });
  const evaluate = async expression => {
    const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return result?.result?.value;
  };
  const close = () => {
    for (const entry of requests.values()) { clearTimeout(entry.timer); entry.reject(Error('brave_debug_closed')); }
    requests.clear();
    ws.close();
  };
  return { command, evaluate, close };
}

function composerProbe(digits) {
  return `(()=>{const c=document.querySelector('[contenteditable="true"][role="textbox"]');const a=c?.getAttribute('aria-label')||'';return {present:!!c,ownNumber:(a.replace(/\\D/g,'').includes(${JSON.stringify(digits)})),empty:!c?.innerText?.trim(),hasSelfTitle:document.body?.innerText?.includes('(você)')===true}})()`;
}

export async function selectOwnChat(cdp, digits) {
  let check = await cdp.evaluate(composerProbe(digits));
  if (check?.present && check.ownNumber && check.hasSelfTitle) return;
  const foundSearch = await cdp.evaluate(`(()=>{const el=document.querySelector('input[aria-label="Pesquisar ou começar uma nova conversa"]');if(!el)return false;el.focus();return true})()`);
  if (!foundSearch) throw Error('brave_search_unavailable');

  // Search for the owner's own number only. The selection must be labeled "(você)".
  await cdp.command('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65, modifiers: 2 });
  await cdp.command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65, modifiers: 2 });
  await cdp.command('Input.insertText', { text: digits });
  await sleep(900);

  const rect = await cdp.evaluate(`(()=>{const digits=${JSON.stringify(digits)};const tree=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;const hits=[];while((n=tree.nextNode())){if(!n.textContent?.includes('(você)'))continue;const cell=n.parentElement?.closest('[role="gridcell"]');if(!cell)continue;const text=cell.textContent||'';if(!text.replace(/\\D/g,'').includes(digits))continue;const r=cell.getBoundingClientRect();if(r.width>20&&r.height>10)hits.push({x:r.x+r.width/2,y:r.y+r.height/2});}return hits.length===1?hits[0]:null})()`);
  if (!rect) throw Error('brave_self_chat_not_found');
  for (const type of ['mousePressed', 'mouseReleased']) {
    await cdp.command('Input.dispatchMouseEvent', { type, x: rect.x, y: rect.y, button: 'left', clickCount: 1 });
  }
  await sleep(650);
  check = await cdp.evaluate(composerProbe(digits));
  if (!check?.present || !check.ownNumber || !check.hasSelfTitle) throw Error('brave_self_chat_guard_failed');
}

export class BraveSelfChatSender {
  constructor({ getOwnJid, getOwnAliases = () => [], sessionFactory = openBrowserSession }) {
    if (typeof getOwnJid !== 'function' || typeof getOwnAliases !== 'function') throw Error('browser_own_identity_required');
    this.getOwnJid = getOwnJid;
    this.getOwnAliases = getOwnAliases;
    this.sessionFactory = sessionFactory;
    this.queue = Promise.resolve();
  }

  async send(jid, text) {
    const job = async () => {
      const digits = validateOutbound(jid, this.getOwnJid(), text, this.getOwnAliases());
      const cdp = await this.sessionFactory();
      try {
        await selectOwnChat(cdp, digits);
        const ready = await cdp.evaluate(composerProbe(digits));
        if (!ready?.present || !ready.ownNumber || !ready.hasSelfTitle || !ready.empty) {
          throw Error('brave_composer_not_safe');
        }
        const focused = await cdp.evaluate(`(()=>{const e=document.querySelector('[contenteditable="true"][role="textbox"]');if(!e)return false;e.focus();return true})()`);
        if (!focused) throw Error('brave_composer_not_found');
        await cdp.command('Input.insertText', { text });
        const typed = await cdp.evaluate(`document.querySelector('[contenteditable="true"][role="textbox"]')?.innerText`);
        if (typed !== text) throw Error('brave_composer_text_mismatch');

        // No automatic retry after Enter: prevents duplicates on uncertain acknowledgments.
        for (const type of ['rawKeyDown', 'char', 'keyUp']) {
          const payload = { type, key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 };
          if (type === 'char') payload.text = '\r';
          await cdp.command('Input.dispatchKeyEvent', payload);
        }
        await sleep(900);
        const state = await cdp.evaluate(`(()=>{const e=document.querySelector('[contenteditable="true"][role="textbox"]');return {empty:!e?.innerText?.trim(),own:(e?.getAttribute('aria-label')||'').replace(/\\D/g,'').includes(${JSON.stringify(digits)}),visible:document.body?.innerText?.includes(${JSON.stringify(text)})===true}})()`);
        if (!state?.empty || !state?.own || !state?.visible) throw Error('brave_delivery_not_verified_in_web');
        return { key: { id: 'brave_' + randomUUID() }, browserVisible: true };
      } finally { cdp.close(); }
    };
    const work = this.queue.then(job);
    this.queue = work.catch(() => {});
    return work;
  }
}
