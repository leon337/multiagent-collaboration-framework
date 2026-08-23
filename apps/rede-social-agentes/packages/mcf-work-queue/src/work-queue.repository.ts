import type {
  McfClaimedWorkJob,
  McfWorkFailure,
  McfWorkGateDecision,
  McfWorkGateResponse,
  McfWorkJobListFilter,
  McfWorkJobResponse,
  McfWorkJobSpec,
  McfWorkRecoverySummary,
  McfWorkResult,
} from '@rsa/contracts';

export interface McfWorkQueueRepository {
  enqueue(spec: McfWorkJobSpec, now?: Date): Promise<McfWorkJobResponse>;
  get(jobId: string): Promise<McfWorkJobResponse | null>;
  list(filter?: McfWorkJobListFilter): Promise<McfWorkJobResponse[]>;
  getGate(jobId: string): Promise<McfWorkGateResponse | null>;
  decideGate(jobId: string, decision: McfWorkGateDecision, now?: Date): Promise<McfWorkJobResponse>;
  claimNext(workerId: string, leaseDurationMs: number, now?: Date): Promise<McfClaimedWorkJob | null>;
  heartbeat(jobId: string, leaseToken: string, leaseDurationMs: number, now?: Date): Promise<McfWorkJobResponse>;
  complete(jobId: string, leaseToken: string, result: McfWorkResult, now?: Date): Promise<McfWorkJobResponse>;
  fail(jobId: string, leaseToken: string, failure: McfWorkFailure, now?: Date): Promise<McfWorkJobResponse>;
  blockAuth(jobId: string, leaseToken: string, failure: McfWorkFailure, now?: Date): Promise<McfWorkJobResponse>;
  recover(now?: Date): Promise<McfWorkRecoverySummary>;
  resumeBlockedAuth(now?: Date): Promise<number>;
  cancel(jobId: string, actor: string, reason: string, now?: Date): Promise<McfWorkJobResponse>;
}
