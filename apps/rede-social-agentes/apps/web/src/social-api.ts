import type {
  CommentListResponse,
  CommentResponse,
  CreateSessionResponse,
  FeedResponse,
  ReactionResponse,
  ReactionType,
} from '@rsa/contracts';

import { webRuntimeConfig } from './runtime-config';

interface ApiErrorBody {
  message?: string;
  code?: string;
  correlationId?: string;
}

export class SocialApiError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.name = 'SocialApiError';
    this.status = status;
    this.code = code;
  }
}

type FetchLike = typeof fetch;

export function createSocialApi(baseUrl: string, fetcher: FetchLike = fetch) {
  const normalizedBaseUrl = baseUrl.replace(/\/$/u, '');

  async function request<T>(
    path: string,
    options: {
      token?: string;
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: unknown;
    } = {},
  ): Promise<T> {
    const headers = new Headers({ accept: 'application/json' });
    if (options.body !== undefined) {
      headers.set('content-type', 'application/json');
    }
    if (options.token) {
      headers.set('authorization', `Bearer ${options.token}`);
    }

    let response: Response;
    try {
      const init: RequestInit = {
        method: options.method ?? 'GET',
        headers,
        cache: 'no-store',
      };
      if (options.body !== undefined) {
        init.body = JSON.stringify(options.body);
      }
      response = await fetcher(`${normalizedBaseUrl}${path}`, init);
    } catch {
      throw new SocialApiError(
        'Não foi possível conectar à API. Tente novamente em instantes.',
        0,
      );
    }

    if (!response.ok) {
      let errorBody: ApiErrorBody = {};
      try {
        errorBody = (await response.json()) as ApiErrorBody;
      } catch {
        // The API may return an empty or non-JSON error response.
      }
      throw new SocialApiError(
        errorBody.message ?? `A solicitação falhou (HTTP ${response.status}).`,
        response.status,
        errorBody.code ?? null,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }

  return {
    createSession(email: string, password: string) {
      return request<CreateSessionResponse>('/v1/sessions', {
        method: 'POST',
        body: { email, password },
      });
    },
    revokeSession(token: string) {
      return request<{ revoked: true }>('/v1/sessions/current', {
        method: 'DELETE',
        token,
      });
    },
    listFeed(token: string) {
      return request<FeedResponse>('/v1/feed?limit=20', { token });
    },
    listComments(token: string, contentId: string) {
      return request<CommentListResponse>(
        `/v1/content/${encodeURIComponent(contentId)}/comments?limit=20`,
        { token },
      );
    },
    createComment(token: string, contentId: string, body: string) {
      return request<CommentResponse>(
        `/v1/content/${encodeURIComponent(contentId)}/comments`,
        { method: 'POST', token, body: { body } },
      );
    },
    setReaction(token: string, contentId: string, reaction: ReactionType) {
      return request<ReactionResponse>(
        `/v1/content/${encodeURIComponent(contentId)}/reactions/${reaction}`,
        { method: 'PUT', token },
      );
    },
    removeReaction(token: string, contentId: string, reaction: ReactionType) {
      return request<ReactionResponse>(
        `/v1/content/${encodeURIComponent(contentId)}/reactions/${reaction}`,
        { method: 'DELETE', token },
      );
    },
  };
}

export const socialApi = createSocialApi(webRuntimeConfig.apiBaseUrl ?? '');
