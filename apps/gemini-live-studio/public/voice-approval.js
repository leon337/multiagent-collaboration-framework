'use strict';
// F3 voice-consent helpers: exact-match confirmation; never accept an AI
// tool result, transcript from Gemini, substring match or "yes" as consent.
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.MCFVoiceApproval=api;
})(typeof window!=='undefined'?window:null,function(){
 const WORDS=['zero','um','dois','tres','quatro','cinco','seis','sete','oito','nove'];
 const MAP=Object.fromEntries(WORDS.map((x,i)=>[x,String(i)]));
 MAP['uma']='1';MAP['duas']='2';MAP['meia']='6';
 function normalize(text){
  return String(text||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
   .replace(/[^\da-z\s]/g,' ').replace(/\s+/g,' ').trim();
 }
 function parsePhrase(text){
  const s=normalize(text);
  if(s==='recuso'||s==='nao autorizo'||s==='cancelar'||s==='nego'||s==='negar')return {decision:'DENY'};
  const words=s.split(' ');
  if(words[0]!=='autorizo')return {decision:'UNKNOWN'};
  const parts=words.slice(1);
  if(parts[0]==='navegar'||parts[0]==='abrir')parts.shift();
  const digits=[];
  for(const w of parts){
   if(/^[0-9]{1,4}$/.test(w))digits.push(...w.split(''));
   else if(MAP[w]!==undefined)digits.push(MAP[w]);
   else return {decision:'UNKNOWN'};
  }
  return {decision:'CODE',code:digits.join('')};
 }
 function authorize(phrase,expected){
  if(typeof expected!=='string'||!/^[0-9]{4}$/.test(expected))return false;
  const p=parsePhrase(phrase);
  return p.decision==='CODE'&&p.code===expected;
 }
 function challenge(cryptoSource){
  if(!cryptoSource||typeof cryptoSource.getRandomValues!=='function')throw Error('Randomness unavailable');
  const bytes=new Uint8Array(4);cryptoSource.getRandomValues(bytes);
  return Array.from(bytes,x=>String(x%10)).join('');
 }
 return Object.freeze({normalize,parsePhrase,authorize,challenge});
});