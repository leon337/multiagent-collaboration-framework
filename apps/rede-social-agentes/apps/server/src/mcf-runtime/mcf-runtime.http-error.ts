import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';

import {
  McfEvidenceRejectedError,
  McfMissionNotFoundError,
  McfMissionVersionConflictError,
  McfPermissionDeniedError,
  McfPhaseNotFoundError,
  McfSkillInputError,
  McfSkillNotExecutableError,
  McfSkillNotFoundError,
} from './mcf-runtime.errors.js';
import { MissionV11ContextError } from './mission-v11-context.guard.js';

// Keep HTTP error classification identical for the mission and chat entrypoints.
// Never send the internal exception message, paths, or infrastructure context code.
export function rethrowRuntimeError(error: unknown, correlationId: string): never {
  if (error instanceof MissionV11ContextError) {
    if (error.code === 'PROJECT_ARTIFACT_ROOT_UNAVAILABLE') {
      throw new ServiceUnavailableException({
        code: 'MCF_V11_CONTEXT_UNAVAILABLE',
        message: 'Artefatos de contexto do servidor indisponíveis.',
        correlationId,
      });
    }
    throw new UnprocessableEntityException({
      code: 'MCF_V11_CONTEXT_REJECTED',
      contextCode: error.code,
      message: 'A missão v1.1 exige contexto de projeto e alinhamento de intenção verificados.',
      correlationId,
    });
  }

  if (error instanceof McfMissionNotFoundError || error instanceof McfPhaseNotFoundError) {
    throw new NotFoundException({
      code: 'MCF_RESOURCE_NOT_FOUND',
      message: 'Recurso da missão não encontrado.',
      correlationId,
    });
  }

  if (error instanceof McfMissionVersionConflictError) {
    throw new ConflictException({
      code: 'MCF_VERSION_CONFLICT',
      message: 'Conflito de versão da missão.',
      correlationId,
    });
  }

  if (error instanceof McfPermissionDeniedError) {
    throw new ForbiddenException({
      code: 'MCF_PERMISSION_DENIED',
      message: 'Operação não autorizada.',
      correlationId,
    });
  }

  if (
    error instanceof McfSkillInputError ||
    error instanceof McfSkillNotFoundError ||
    error instanceof McfSkillNotExecutableError ||
    error instanceof McfEvidenceRejectedError
  ) {
    throw new UnprocessableEntityException({
      code: 'MCF_EXECUTION_REJECTED',
      message: 'Execução rejeitada pelas validações do MCF.',
      correlationId,
    });
  }

  throw error;
}
