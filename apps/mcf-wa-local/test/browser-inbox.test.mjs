import test from 'node:test';
import assert from 'node:assert/strict';
import { BraveSelfChatInbox, inspectWebItem, parseWebTimestamp } from '../src/browser-inbox.mjs';

function stamp(time=new Date()) {
  const x=n=>String(n).padStart(2,'0');
  return '['+x(time.getHours())+':'+x(time.getMinutes())+', '+x(time.getDate())+'/'+x(time.getMonth()+1)+'/'+time.getFullYear()+'] Owner:';
}

test('WhatsApp Web date parser checks calendar/time validity',()=>{
 const good=stamp();
 assert.equal(typeof parseWebTimestamp(good),'number');
 assert.equal(parseWebTimestamp('[24:77, 31/02/2026] A:'),null);
 assert.equal(parseWebTimestamp('garbled'),null);
});
test('only recent own-chat text and not MESTRE output accepted',()=>{
 const now=Date.now();
 const item={id:'ABC123456',content:'Oi mestre',pre:stamp()};
 assert.equal(inspectWebItem(item,now)?.text,'Oi mestre');
 assert.equal(inspectWebItem({...item,content:'MESTRE: resposta'},now),null);
 assert.equal(inspectWebItem({...item,id:'!'},now),null);
 assert.equal(inspectWebItem({...item,content:'a'.repeat(951)},now),null);
 const old=new Date(now-86400000);
 assert.equal(inspectWebItem({...item,pre:stamp(old)},now),null);
});
test('browser inbox primes without replay and processes new own messages once',async()=>{
 const me='5511999999999@s.whatsapp.net';
 const items=[{id:'ABC123456',content:'Já estava na conversa',pre:stamp()}];
 const forwarded=[];
 const sessionFactory=async()=>({
   evaluate:async exp=>exp.includes('hasSelfTitle')?{present:true,ownNumber:true,hasSelfTitle:true}:[...items],
   close:()=>{},
   command:async()=>({})
 });
 const scan=new BraveSelfChatInbox({
   getOwnJid:()=>me,
   onEvent:async e=>forwarded.push(e),
   sessionFactory,
   intervalMs:60000
 });
 await scan.poll();
 assert.equal(scan.primed,true);
 assert.equal(forwarded.length,0);
 items.push({id:'DEF123456',content:'Olá, tudo certo?',pre:stamp()});
 await scan.poll();await scan.poll();
 assert.equal(forwarded.length,1);
 assert.equal(forwarded[0].messages[0].key.remoteJid,me);
 assert.equal(forwarded[0].messages[0].message.conversation,'Olá, tudo certo?');
 items.push({id:'GHI123456',content:'MESTRE: nunca devolver ao modelo',pre:stamp()});
 await scan.poll();
 assert.equal(forwarded.length,1);
 scan.stop();
});
