import { mkdtempSync, mkdirSync, writeFileSync, rmSync, chmodSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { LocalGeminiConversationTransport } from './gemini-conversation-local-transport.js';
import type { GeminiReadEnvelope } from './gemini-conversation-read.adapter.js';

const envelope: GeminiReadEnvelope = {
  mission_id: 'mission1',
  request_id: 'request1',
  correlation_id: 'corr1',
  idempotency_key: 'key1',
  policy_scope: 'approved-conversation',
  evidence_ref: 'ref1',
  operation: 'read-status',
};

function setup(t: { onTestFinished: (cb: () => void) => void }, source?: string) {
  const root = mkdtempSync(join(tmpdir(), 'mcf-gemini-read-test-'));
  const ledger = join(root, 'ledger');
  mkdirSync(ledger, { mode: 0o700 });
  const mod = join(root, 'conversation-broker.cjs');
  writeFileSync(
    mod,
    source ??
      `module.exports = { createBroker: () => ({
    status: async () => ({ ready:true, generating:false }),
    readReply: async id => ({ messageId:id, state:'REPLY_COMPLETE', reply:'SAFE_LAB_REPLY', truncated:false })
  }) };`,
    { mode: 0o600 },
  );
  t.onTestFinished(() => rmSync(root, { recursive: true, force: true }));
  return {
    root,
    ledger,
    mod,
    subject: new LocalGeminiConversationTransport(mod, ledger, {
      missionId: 'mission1',
      requestId: 'request1',
    }),
  };
}

describe('Private co-located Gemini broker read transport', () => {
  it('obtains authenticated status from trusted local broker without any send tool', async (t) => {
    const f = setup(t);
    const result = await f.subject.read(envelope, new AbortController().signal);
    expect(result).toMatchObject({
      mission_id: envelope.mission_id,
      request_id: envelope.request_id,
      correlation_id: envelope.correlation_id,
      idempotency_key: envelope.idempotency_key,
      operation: 'read-status',
      identity_verified: true,
      conversation_verified: true,
      status: 'complete',
    });
    expect(JSON.stringify(result)).not.toContain('SAFE_LAB_REPLY');
  });
  it('reads the response for exactly the requested message id', async (t) => {
    const f = setup(t);
    const result = await f.subject.read(
      { ...envelope, operation: 'read-reply' },
      new AbortController().signal,
    );
    expect(result).toMatchObject({
      request_id: 'request1',
      status: 'complete',
      reply: 'SAFE_LAB_REPLY',
    });
  });
  it('does not claim a complete reply if the broker reports a different message', async (t) => {
    const f = setup(
      t,
      `module.exports={createBroker:()=>({status:async()=>({ready:true,generating:false}),readReply:async()=>({messageId:'other',state:'REPLY_COMPLETE',reply:'WRONG',truncated:false})})}`,
    );
    await expect(
      f.subject.read({ ...envelope, operation: 'read-reply' }, new AbortController().signal),
    ).resolves.toMatchObject({
      identity_verified: false,
      conversation_verified: false,
      status: 'pending',
    });
  });
  it('rejects truncated content and reports pending without disclosing it', async (t) => {
    const f = setup(
      t,
      `module.exports={createBroker:()=>({status:async()=>({ready:true,generating:true}),readReply:async id=>({messageId:id,state:'REPLY_COMPLETE',reply:'PARTIAL_PRIVATE',truncated:true})})}`,
    );
    const status = await f.subject.read(envelope, new AbortController().signal);
    expect(status).toMatchObject({ status: 'pending' });
    const result = await f.subject.read(
      { ...envelope, operation: 'read-reply' },
      new AbortController().signal,
    );
    expect(result).toMatchObject({ status: 'pending', conversation_verified: false });
    expect(JSON.stringify(result)).not.toContain('PARTIAL_PRIVATE');
  });
  it('stops before loading an insecure broker directory', async (t) => {
    const f = setup(t);
    chmodSync(f.root, 0o777);
    await expect(f.subject.read(envelope, new AbortController().signal)).rejects.toThrow(
      'LOCAL_BROKER_NOT_PRIVATE',
    );
  });
  it('rejects a symlinked module before loading its code', async (t) => {
    const f = setup(t);
    const link = join(f.root, 'linked.cjs');
    symlinkSync(f.mod, link);
    const subject = new LocalGeminiConversationTransport(link, f.ledger, {
      missionId: 'mission1',
      requestId: 'request1',
    });
    await expect(subject.read(envelope, new AbortController().signal)).rejects.toThrow(
      'LOCAL_BROKER_CONFIG_INVALID',
    );
  });
  it('rejects another mission or message before contacting the broker', async (t) => {
    const f = setup(t);
    await expect(
      f.subject.read({ ...envelope, mission_id: 'otherMission' }, new AbortController().signal),
    ).rejects.toThrow('LOCAL_BROKER_SCOPE_DENIED');
    await expect(
      f.subject.read({ ...envelope, request_id: 'otherRequest' }, new AbortController().signal),
    ).rejects.toThrow('LOCAL_BROKER_SCOPE_DENIED');
  });
  it('respects abort without attempting to access the broker', async (t) => {
    const f = setup(t);
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(f.subject.read(envelope, ctrl.signal)).rejects.toThrow('READ_ABORTED');
  });
});
