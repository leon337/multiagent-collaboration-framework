import { openBrowserSession, selectOwnChat, selfPhone } from './browser-sender.mjs';

const POLL_INTERVAL_MS = 2500;
const MAX_AGE_MS = 90000;

export function parseWebTimestamp(plainText) {
  if (typeof plainText !== 'string') return null;
  const m = plainText.match(/^\[(\d{1,2}):(\d{2}),\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\]/);
  if (!m) return null;
  const [,h,min,d,mon,y]=m.map(Number);
  const dt=new Date(y,mon-1,d,h,min,0);
  if(dt.getFullYear()!==y||dt.getMonth()!==mon-1||dt.getDate()!==d||dt.getHours()!==h||dt.getMinutes()!==min) return null;
  return dt.getTime();
}

export function inspectWebItem(item, now=Date.now()) {
  if(!item || typeof item.id!=='string' || !/^[\w.-]{5,180}$/.test(item.id)) return null;
  const text=String(item.content||'').trim();
  if(!text || text.length>950 || /^MESTRE:/i.test(text)) return null;
  const ts=parseWebTimestamp(item.pre);
  if(!ts || ts < now-MAX_AGE_MS || ts > now+60000) return null;
  return { id:item.id, text, ts };
}

export class BraveSelfChatInbox {
  constructor({ getOwnJid, onEvent, log=()=>{}, sessionFactory=openBrowserSession, intervalMs=POLL_INTERVAL_MS }) {
    if(typeof getOwnJid!=='function'||typeof onEvent!=='function')throw Error('browser_inbox_configuration_invalid');
    this.getOwnJid=getOwnJid;
    this.onEvent=onEvent;
    this.log=log;
    this.sessionFactory=sessionFactory;
    this.intervalMs=intervalMs;
    this.seen=new Set();
    this.primed=false;
    this.running=false;
    this.timer=null;
    this.closed=false;
    this.lastErrorCode=null;
    this.lastErrorLoggedAt=0;
  }

  async poll() {
    if(this.running||this.closed)return;
    this.running=true;
    let session;
    try {
      const jid=this.getOwnJid();
      const digits=selfPhone(jid);
      session=await this.sessionFactory();
      await selectOwnChat(session,digits);
      const items=await session.evaluate(`(()=>{const c=document.querySelector('[contenteditable="true"][role="textbox"]');const own=(c?.getAttribute('aria-label')||'').replace(/\\D/g,'').includes(${JSON.stringify(digits)})&&document.body?.innerText?.includes('(você)');if(!own)return null;return [...document.querySelectorAll('[data-id]')].map(e=>({id:e.getAttribute('data-id'),content:e.querySelector('.selectable-text')?.innerText||'',pre:e.querySelector('[data-pre-plain-text]')?.getAttribute('data-pre-plain-text')||''})).filter(x=>x.id&&x.content)})()`);
      if(!Array.isArray(items)) throw Error('browser_self_chat_not_verified');
      if(this.lastErrorCode) this.log('browser_inbox_recovered');
      this.lastErrorCode=null;
      if(!this.primed) {
        for(const item of items) this.seen.add(item.id);
        this.primed=true;
        this.log('browser_inbox_primed');
        return;
      }
      const now=Date.now();
      for(const item of items) {
        if(this.seen.has(item.id))continue;
        this.seen.add(item.id);
        const msg=inspectWebItem(item,now);
        if(!msg)continue;
        const event={type:'notify',messages:[{
          key:{fromMe:true,remoteJid:jid,id:msg.id},
          // DOM timestamp has minute resolution; record the actual observed time after the freshness check.
          messageTimestamp:Math.floor(Date.now()/1000),
          message:{conversation:msg.text}
        }]};
        await this.onEvent(event);
        this.log('browser_inbox_forwarded');
      }
      if(this.seen.size>750)this.seen=new Set([...this.seen].slice(-500));
    } catch(error) {
      const code=String(error?.message||'unknown').replace(/[^a-zA-Z0-9_:-]/g,'').slice(0,60);
      const now=Date.now();
      if(code!==this.lastErrorCode || now-this.lastErrorLoggedAt>60000) {
        this.log('browser_inbox_poll_error_'+code);
        this.lastErrorLoggedAt=now;
        this.lastErrorCode=code;
      }
    } finally {
      if(session)session.close();
      this.running=false;
    }
  }

  start() {
    if(this.timer)return;
    this.timer=setInterval(()=>{void this.poll();},this.intervalMs);
    void this.poll();
  }

  stop() {
    this.closed=true;
    if(this.timer)clearInterval(this.timer);
    this.timer=null;
  }
}
