import { lstat, realpath } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { basename, dirname, isAbsolute } from 'node:path';

import type {
  GeminiConversationReadTransport,
  GeminiReadEnvelope,
} from './gemini-conversation-read.adapter.js';

interface AuthorizedBroker {
  status(): Promise<{ ready: boolean; generating: boolean }>;
  readReply(
    id: string,
  ): Promise<{ messageId: string; state: string; reply?: string; truncated?: boolean }>;
}

type BrokerFactory = (ledgerDirectory: string) => AuthorizedBroker;

/**
 * Opt-in, co-located laboratory transport. Never accepts file paths, chat IDs,
 * URLs or account identifiers from model inputs. The private broker owns the
 * authenticated thread and validates the conversation on each operation.
 */
export class LocalGeminiConversationTransport implements GeminiConversationReadTransport {
  private broker: AuthorizedBroker | null = null;

  constructor(
    private readonly modulePath: string,
    private readonly ledgerDirectory: string,
    private readonly approvedScope: { missionId: string; requestId: string },
  ) {}

  private async authorizedBroker(): Promise<AuthorizedBroker> {
    if (this.broker) return this.broker;
    if (
      !isAbsolute(this.modulePath) ||
      !isAbsolute(this.ledgerDirectory) ||
      basename(this.modulePath) !== 'conversation-broker.cjs'
    ) {
      throw new Error('LOCAL_BROKER_CONFIG_INVALID');
    }
    const file = await lstat(this.modulePath);
    const parent = await lstat(dirname(this.modulePath));
    const ledger = await lstat(this.ledgerDirectory);
    const uid = typeof process.getuid === 'function' ? process.getuid() : null;
    if (
      !file.isFile() ||
      file.isSymbolicLink() ||
      (file.mode & 0o002) !== 0 ||
      !parent.isDirectory() ||
      parent.isSymbolicLink() ||
      (parent.mode & 0o077) !== 0 ||
      !ledger.isDirectory() ||
      ledger.isSymbolicLink() ||
      (ledger.mode & 0o077) !== 0 ||
      (uid !== null && (file.uid !== uid || parent.uid !== uid || ledger.uid !== uid))
    ) {
      throw new Error('LOCAL_BROKER_NOT_PRIVATE');
    }
    const actualModule = await realpath(this.modulePath);
    const actualLedger = await realpath(this.ledgerDirectory);
    if (actualModule !== this.modulePath || actualLedger !== this.ledgerDirectory) {
      throw new Error('LOCAL_BROKER_SYMLINK_FORBIDDEN');
    }
    const require = createRequire(import.meta.url);
    const candidate = require(actualModule) as { createBroker?: BrokerFactory };
    if (typeof candidate.createBroker !== 'function')
      throw new Error('LOCAL_BROKER_INVALID_EXPORT');
    const instance = candidate.createBroker(actualLedger);
    if (typeof instance.status !== 'function' || typeof instance.readReply !== 'function') {
      throw new Error('LOCAL_BROKER_INVALID_INTERFACE');
    }
    this.broker = instance;
    return instance;
  }

  async read(envelope: GeminiReadEnvelope, signal: AbortSignal): Promise<unknown> {
    if (signal.aborted) throw new Error('READ_ABORTED');
    if (
      !this.approvedScope ||
      envelope.mission_id !== this.approvedScope.missionId ||
      envelope.request_id !== this.approvedScope.requestId
    ) {
      throw new Error('LOCAL_BROKER_SCOPE_DENIED');
    }
    const broker = await this.authorizedBroker();
    if (signal.aborted) throw new Error('READ_ABORTED');
    const fields = {
      mission_id: envelope.mission_id,
      request_id: envelope.request_id,
      correlation_id: envelope.correlation_id,
      idempotency_key: envelope.idempotency_key,
      operation: envelope.operation,
    };
    if (envelope.operation === 'read-status') {
      const result = await broker.status();
      if (signal.aborted) throw new Error('READ_ABORTED');
      if (typeof result.ready !== 'boolean' || typeof result.generating !== 'boolean') {
        throw new Error('LOCAL_BROKER_INVALID_STATUS');
      }
      return {
        ...fields,
        identity_verified: true,
        conversation_verified: true,
        status: result.ready && !result.generating ? 'complete' : 'pending',
      };
    }
    const result = await broker.readReply(envelope.request_id);
    if (signal.aborted) throw new Error('READ_ABORTED');
    if (
      result.messageId !== envelope.request_id ||
      result.state !== 'REPLY_COMPLETE' ||
      result.truncated !== false ||
      typeof result.reply !== 'string'
    ) {
      return {
        ...fields,
        identity_verified: false,
        conversation_verified: false,
        status: 'pending',
      };
    }
    return {
      ...fields,
      identity_verified: true,
      conversation_verified: true,
      status: 'complete',
      reply: result.reply,
    };
  }
}
