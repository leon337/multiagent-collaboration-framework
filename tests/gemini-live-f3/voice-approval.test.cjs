'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {normalize,parsePhrase,authorize,challenge}=require('../../apps/gemini-live-studio/public/voice-approval.js');
test('normalizes Brazilian Portuguese accents',()=>{
 assert.equal(normalize('  NÃO, AUTORIZO! '),'nao autorizo');
 assert.deepEqual(parsePhrase('Autorizo 1 2 3 4'),{decision:'CODE',code:'1234'});
});
test('accepts strict, one-time spoken four-digit approval phrase',()=>{
 assert.equal(authorize('Autorizo um dois três quatro','1234'),true);
 assert.equal(authorize('AUTORIZO 1 2 3 4','1234'),true);
 assert.equal(authorize('autorizo navegar 1 2 3 4','1234'),true);
 assert.equal(authorize('autorizo 1234','1234'),true);
 assert.equal(authorize('Autorizo abrir site 1234','1234'),false);
});
test('never accepts model narration, incidental yes, substring or ambiguous transcript',()=>{
 for(const s of ['sim','claro','okay autorizo 1 2 3 4',
 'o agente disse autorizo 1 2 3 4','vou autorizar','autorizo tudo',
 'autorizo 1 2 3','autorizo 1 2 3 4 5','autorizo 1 2 3 4 e navegue',
 'não autorizo 1 2 3 4','autorizo 9 9 9 9'])
  assert.equal(authorize(s,'1234'),false,s);
});
test('denial is separate and never interpreted as grant',()=>{
 for(const s of ['Recuso','Não autorizo','cancelar','negar']){
  assert.equal(parsePhrase(s).decision,'DENY');
  assert.equal(authorize(s,'1234'),false);
 }
});
test('nonce comes from crypto.getRandomValues, never Math.random',()=>{
 const seq=[1,2,3,4];
 const code=challenge({getRandomValues(out){for(let i=0;i<out.length;i++)out[i]=seq[i];return out;}});
 assert.equal(code,'1234');
 assert.match(code,/^[0-9]{4}$/);
 assert.throws(()=>challenge(),/Randomness unavailable/);
});
test('malformed nonce must be rejected, even if spoken',()=>{
 assert.equal(authorize('autorizo 1 2 3 4',''),false);
 assert.equal(authorize('autorizo 1 2 3 4','12345'),false);
 assert.equal(authorize('autorizo 1 2 3 4',1234),false);
});