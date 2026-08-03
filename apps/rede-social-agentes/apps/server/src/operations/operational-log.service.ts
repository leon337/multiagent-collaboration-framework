import { Injectable } from '@nestjs/common';

export interface HttpCompletionLogInput {
  method: string;
  route: string;
  statusCode: number;
  durationMs: number;
  correlationId: string;
  outcome: 'SUCCESS' | 'ERROR';
}

export interface HttpCompletionLogEvent extends HttpCompletionLogInput {
  level: 'info' | 'warn';
  service: 'rede-social-agentes';
  component: 'server';
  event: 'http_request_completed';
}

export function createHttpCompletionLogEvent(
  input: HttpCompletionLogInput,
): HttpCompletionLogEvent {
  return {
    level: input.outcome === 'ERROR' ? 'warn' : 'info',
    service: 'rede-social-agentes',
    component: 'server',
    event: 'http_request_completed',
    method: input.method,
    route: input.route,
    statusCode: input.statusCode,
    durationMs: input.durationMs,
    correlationId: input.correlationId,
    outcome: input.outcome,
  };
}

@Injectable()
export class OperationalLogService {
  writeHttpCompletion(input: HttpCompletionLogInput): void {
    const event = createHttpCompletionLogEvent(input);
    const serialized = JSON.stringify(event);
    if (event.level === 'warn') {
      console.warn(serialized);
      return;
    }
    console.info(serialized);
  }
}
