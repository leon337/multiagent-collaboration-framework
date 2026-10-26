import { join } from 'node:path';
import { homedir } from 'node:os';
import { mkdir, chmod, appendFile } from 'node:fs/promises';
import makeWASocket, { Browsers, DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import qrcode from 'qrcode';
import pino from 'pino';
import { PrivateState } from './state.mjs';
import { GuardedConversation } from './conversation.mjs';
import { loadAdminToken, makePortal } from './portal.mjs';
import { invokeDeepSeek } from '../../mcf-whatsapp-dsh/src/dsh-runner.mjs';

process.umask(0o077);
const root = join(homedir(), '.local/share/mcf-wa-local');
const privateCfg = join(homedir(), '.config/mcf-wa-local');
const authDir = join(root, 'auth');
await mkdir(authDir,{recursive:true,mode:0o700});
await chmod(authDir,0o700);
const state = new PrivateState(join(root,'state.json'));
await state.load();
const adminToken = await loadAdminToken(privateCfg);
const config = {
  command: join(homedir(),'Aplicativos/dsh/node_modules/.bin/dsh'),
  profile: 'mcf-whatsapp-dsh',
  cwd: join(homedir(),'Projetos/mcf-whatsapp-dsh-20261025/apps/mcf-whatsapp-dsh/workspace'),
  timeoutMs: 240000
};
const runtime = { phase:'starting', qr:null, qrPNG:null, connected:false, socket:null, startedAt:Date.now(), retries:0, shuttingDown:false };
const safeLog = tag => {
  const event = String(tag).replace(/[^a-zA-Z0-9_:.-]/g, '').slice(0, 110);
  // Keep only allowlisted event names; never persist Baileys/Signal debug objects.
  void appendFile(join(root, 'events.log'), new Date().toISOString() + ' ' + event + '\n', {mode:0o600}).catch(() => {});
};
const conversation = new GuardedConversation({
  state,
  invoke: (text,sessionId) => invokeDeepSeek(text,sessionId,config),
  send: async (jid,text) => {
    if (!runtime.connected || !runtime.socket) throw Error('not_connected');
    return runtime.socket.sendMessage(jid,{ text });
  },
  getIdentity: () => {
    const sock=runtime.socket;
    return [sock?.user?.id,sock?.user?.lid,sock?.authState?.creds?.me?.id,sock?.authState?.creds?.me?.lid].filter(Boolean);
  },
  getConnectedAt: () => runtime.startedAt,
  log: safeLog
});
const portal = makePortal({
  token:adminToken,
  getStatus:() => ({
    phase:runtime.phase,connected:runtime.connected,qrAvailable:!!runtime.qrPNG,
    armed:state.data.armed,processed:state.data.processed,failed:state.data.failed,
    processing:conversation.current
  }),
  getQr:()=>runtime.qrPNG,
  setArmed: async enabled => { if(!enabled)conversation.generation++; await state.arm(enabled);safeLog(enabled?'enabled_from_portal':'paused_from_portal'); }
});
const port=38766;
portal.listen(port,'127.0.0.1',()=>safeLog('local_pairing_portal_ready_127.0.0.1_38766'));

let reconnectTimer=null;
async function connect() {
  if (runtime.shuttingDown) return;
  runtime.phase='connecting';
  runtime.connected=false;
  runtime.qr=null;runtime.qrPNG=null;
  try {
    const { state:auth, saveCreds }=await useMultiFileAuthState(authDir);
    const sock=makeWASocket({
      auth,
      logger:pino({level:'silent'}),
      browser:Browsers.ubuntu('MCF DSH'),
      syncFullHistory:false,
      markOnlineOnConnect:false,
      emitOwnEvents:true,
      connectTimeoutMs:45000,
      defaultQueryTimeoutMs:45000,
      keepAliveIntervalMs:25000,
      generateHighQualityLinkPreview:false
    });
    runtime.socket=sock;
    sock.ev.on('creds.update',()=>{saveCreds().catch(()=>safeLog('credential_save_failure'));});
    sock.ev.on('connection.update',async update=>{
      if(runtime.socket!==sock || runtime.shuttingDown) return;
      if(update.qr){
        runtime.qr=update.qr;
        try {runtime.qrPNG=(await qrcode.toBuffer(update.qr,{errorCorrectionLevel:'M',margin:2,width:300})).toString('base64');}
        catch{runtime.qrPNG=null;safeLog('qr_render_failure');}
        runtime.phase='pairing';
        safeLog('qr_ready');
      }
      if(update.connection==='open'){
        runtime.connected=true;
        runtime.phase='connected';
        runtime.qr=null;runtime.qrPNG=null;
        runtime.retries=0;
        runtime.startedAt=Date.now();
        safeLog('whatsapp_linked');
      }
      if(update.connection==='close'){
        runtime.connected=false;
        runtime.qr=null;runtime.qrPNG=null;
        const code=update.lastDisconnect?.error?.output?.statusCode;
        if(code===DisconnectReason.loggedOut || code===401){
          runtime.phase='logged_out';
          safeLog('session_revoked');
          return;
        }
        runtime.retries+=1;
        const ms=Math.min(30000,1500*Math.pow(2,Math.min(runtime.retries,5)));
        runtime.phase='reconnecting';
        safeLog('wa_reconnecting_'+String(code??'unknown'));
        clearTimeout(reconnectTimer);
        reconnectTimer=setTimeout(()=>{void connect();},ms);
      }
    });
    sock.ev.on('messages.upsert',evt=>{
      if(!runtime.connected || runtime.socket!==sock) return;
      void conversation.receive(evt).catch(()=>safeLog('message_handler_failure'));
    });
  } catch(err) {
    runtime.phase='error';
    safeLog('bridge_connect_error_'+String(err?.message??'unknown').slice(0,35));
    if (!runtime.shuttingDown) reconnectTimer=setTimeout(()=>{void connect();},30000);
  }
}
await connect();
async function shutdown() {
  runtime.shuttingDown=true;
  clearTimeout(reconnectTimer);
  runtime.connected=false;runtime.qr=null;runtime.qrPNG=null;
  try {runtime.socket?.ws?.close();}catch{}
  portal.close();
  safeLog('shutdown');
}
process.on('SIGTERM',()=>{void shutdown();});
process.on('SIGINT',()=>{void shutdown();});
