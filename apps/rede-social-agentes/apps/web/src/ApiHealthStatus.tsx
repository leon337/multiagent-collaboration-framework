import { useEffect, useState } from 'react';

import { webRuntimeConfig } from './runtime-config';

type ApiState = 'UNCONFIGURED' | 'CHECKING' | 'READY' | 'WARMING';

const statusCopy: Record<ApiState, { label: string; detail: string }> = {
  UNCONFIGURED: {
    label: 'API ainda não conectada',
    detail: 'A interface está pronta, mas a URL gratuita do servidor ainda não foi configurada.',
  },
  CHECKING: {
    label: 'Verificando a API',
    detail: 'O serviço gratuito pode levar até um minuto para despertar após ficar ocioso.',
  },
  READY: {
    label: 'API disponível',
    detail: 'O servidor respondeu ao teste de prontidão.',
  },
  WARMING: {
    label: 'API inicializando',
    detail:
      'Aguarde alguns instantes e atualize a página. O plano gratuito hiberna por inatividade.',
  },
};

export function ApiHealthStatus() {
  const [state, setState] = useState<ApiState>(
    webRuntimeConfig.apiBaseUrl ? 'CHECKING' : 'UNCONFIGURED',
  );

  useEffect(() => {
    if (!webRuntimeConfig.apiBaseUrl) {
      return undefined;
    }

    const controller = new AbortController();
    const checkReadiness = async () => {
      try {
        const response = await fetch(`${webRuntimeConfig.apiBaseUrl}/health/ready`, {
          cache: 'no-store',
          headers: { accept: 'application/json' },
          signal: controller.signal,
        });
        setState(response.ok ? 'READY' : 'WARMING');
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setState('WARMING');
        }
      }
    };

    void checkReadiness();
    return () => controller.abort();
  }, []);

  const copy = statusCopy[state];
  return (
    <div className={`api-state api-state--${state.toLowerCase()}`} role="status" aria-live="polite">
      <span className="api-state__dot" aria-hidden="true" />
      <span>
        <strong>{copy.label}</strong>
        <small>{copy.detail}</small>
      </span>
    </div>
  );
}
