import { BadRequestException } from '@nestjs/common';
import type { ZodType } from 'zod';

export function parseBody<TValue>(
  schema: ZodType<TValue>,
  body: unknown,
  correlationId: string,
): TValue {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new BadRequestException({
      code: 'INVALID_REQUEST',
      message: 'The request body is invalid.',
      correlationId,
      details: result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }
  return result.data;
}
