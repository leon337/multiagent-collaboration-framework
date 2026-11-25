import test from 'node:test';
import assert from 'node:assert/strict';
import { selfPhone, composerIsSelf, validateOutbound } from '../src/browser-sender.mjs';

const me='5511999999999@s.whatsapp.net';
test('browser sending allows only owned device JID',()=>{
  assert.equal(selfPhone(me),'5511999999999');
  assert.equal(validateOutbound(me,me,'MESTRE: ok'),'5511999999999');
  for(const other of ['5521999999999@s.whatsapp.net','12345@g.us','status@broadcast','12345@lid']){
    assert.throws(()=>validateOutbound(other,me,'MESTRE: ok'));
  }
});
test('browser sender refuses empty, unmarked or oversized text',()=>{
  assert.throws(()=>validateOutbound(me,me,'Olá'));
  assert.throws(()=>validateOutbound(me,me,'MESTRE: '+ 'A'.repeat(2750)));
  assert.throws(()=>validateOutbound(me,me,''));
  assert.throws(()=>validateOutbound(me,me,null));
  assert.equal(validateOutbound(me,me,'MESTRE: ok'),'5511999999999');
});
test('composer recipient guard rejects mismatched or unverified chat',()=>{
  assert.equal(composerIsSelf('Digite uma mensagem para +55 11 99999-9999','5511999999999'),true);
  assert.equal(composerIsSelf('Digite uma mensagem para +55 21 99999-9999','5511999999999'),false);
  assert.equal(composerIsSelf('Digite uma mensagem','5511999999999'),false);
  assert.equal(composerIsSelf(null,'5511999999999'),false);
});
test('legacy self JID is never accepted as send destination',()=>{
  assert.throws(()=>selfPhone('123456789012@lid'));
  assert.throws(()=>selfPhone('123456@g.us'));
});

test('authenticated owner LID and PN device aliases can reply to self safely',()=>{
  const alias='123456789012345@lid';
  const meDevice='5511999999999:2@s.whatsapp.net';
  assert.equal(validateOutbound(alias,me,'MESTRE: resposta',[alias]),'5511999999999');
  assert.equal(validateOutbound(meDevice,me,'MESTRE: resposta',[]),'5511999999999');
  assert.throws(()=>validateOutbound(alias,me,'MESTRE: resposta',[]),/browser_target_not_self/);
});
test('a sender never accepts arbitrary aliases or external group/contacts',()=>{
  const trusted=['123456789012345@lid','5511999999999@s.whatsapp.net'];
  assert.throws(()=>validateOutbound('123456789012346@lid',me,'MESTRE: resposta',trusted),/browser_target_not_self/);
  assert.throws(()=>validateOutbound('5511888888888@s.whatsapp.net',me,'MESTRE: resposta',trusted),/browser_target_not_self/);
  assert.throws(()=>validateOutbound('123456789012345@g.us',me,'MESTRE: resposta',trusted),/browser_target_not_self/);
  assert.throws(()=>validateOutbound('not-a-jid',me,'MESTRE: resposta',trusted),/browser_target_not_self/);
});
