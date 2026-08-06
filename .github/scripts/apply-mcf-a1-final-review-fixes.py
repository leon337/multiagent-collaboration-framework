from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    (ROOT / path).write_text(content, encoding="utf-8")


def replace_once(path: str, old: str, new: str) -> None:
    content = read(path)
    count = content.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one occurrence, found {count}: {old[:120]!r}")
    write(path, content.replace(old, new, 1))


CONTRACTS = "apps/rede-social-agentes/apps/server/src/mcf-runtime/external-action.contracts.ts"
replace_once(
    CONTRACTS,
    "  | 'NETWORK_FAILURE'\n  | 'INVALID_CONTEXT'",
    "  | 'NETWORK_FAILURE'\n  | 'ADAPTER_TIMEOUT'\n  | 'INVALID_CONTEXT'",
)

ADAPTER = "apps/rede-social-agentes/apps/server/src/mcf-runtime/github-code-review.adapter.ts"
replace_once(
    ADAPTER,
    "import { canonicalizeProvider, canonicalizeToolValue } from './permission-engine.js';\n",
    "import { EXTERNAL_ACTION_LEASE_MS } from './external-action-reservation.js';\nimport { canonicalizeProvider, canonicalizeToolValue } from './permission-engine.js';\n",
)
replace_once(
    ADAPTER,
    "type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;\n",
    "type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;\n\nexport const GITHUB_CODE_REVIEW_TIMEOUT_MS = 5 * 60_000;\n\nif (GITHUB_CODE_REVIEW_TIMEOUT_MS >= EXTERNAL_ACTION_LEASE_MS) {\n  throw new Error('GitHub code review timeout must remain shorter than the external action lease');\n}\n",
)
replace_once(
    ADAPTER,
    '''  const repositoryInput = request.inputs.repository;
  const repository = repositoryFromValue(
    typeof repositoryInput === 'string' ? repositoryInput : request.tool.resource,
  );
  if (!repository) {
    throw new ExternalActionAdapterError(
      'UNSUPPORTED_TARGET',
      'GitHub code review requires repository in owner/name format',
      false,
    );
  }
''',
    '''  const declaredRepository = repositoryFromValue(request.tool.resource);
  if (!declaredRepository) {
    throw new ExternalActionAdapterError(
      'UNSUPPORTED_TARGET',
      'GitHub code review requires tool.resource in owner/name format',
      false,
    );
  }

  const repositoryInput = request.inputs.repository;
  if (repositoryInput !== undefined) {
    if (typeof repositoryInput !== 'string') {
      throw new ExternalActionAdapterError(
        'INVALID_CONTEXT',
        'GitHub repository input must be a string when provided',
        false,
      );
    }
    const inputRepository = repositoryFromValue(repositoryInput);
    if (!inputRepository) {
      throw new ExternalActionAdapterError(
        'UNSUPPORTED_TARGET',
        'GitHub code review requires repository in owner/name format',
        false,
      );
    }
    if (inputRepository.toLowerCase() !== declaredRepository.toLowerCase()) {
      throw new ExternalActionAdapterError(
        'INVALID_CONTEXT',
        'GitHub repository input must match the declared tool resource',
        false,
      );
    }
  }
  const repository = declaredRepository;
''',
)
old_method = '''  async getJson<T>(path: string): Promise<T> {
    let response: Response;
    try {
      response = await this.fetcher(`https://api.github.com${path}`, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'mcf-runtime-code-review-adapter',
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
      });
    } catch (error) {
      throw new ExternalActionAdapterError(
        'NETWORK_FAILURE',
        error instanceof Error ? error.message : 'GitHub network request failed',
        true,
      );
    }

    if (!response.ok) {
      const remaining = response.headers.get('x-ratelimit-remaining');
      if (response.status === 429 || (response.status === 403 && remaining === '0')) {
        throw new ExternalActionAdapterError(
          'RATE_LIMITED',
          'GitHub API rate limit was reached',
          true,
          response.status,
        );
      }
      if (response.status === 401 || response.status === 403) {
        throw new ExternalActionAdapterError(
          'AUTHENTICATION_REQUIRED',
          'GitHub authentication or repository permission is required',
          false,
          response.status,
        );
      }
      if (response.status === 404) {
        throw new ExternalActionAdapterError(
          'TARGET_NOT_FOUND',
          'GitHub review target was not found',
          false,
          response.status,
        );
      }
      throw new ExternalActionAdapterError(
        'INVALID_RESPONSE',
        `GitHub API returned HTTP ${response.status}`,
        response.status >= 500,
        response.status,
      );
    }

    try {
      return (await response.json()) as T;
    } catch {
      throw new ExternalActionAdapterError(
        'INVALID_RESPONSE',
        'GitHub API returned invalid JSON',
        false,
        response.status,
      );
    }
  }
'''
new_method = '''  async getJson<T>(
    path: string,
    deadlineAt: number = Date.now() + GITHUB_CODE_REVIEW_TIMEOUT_MS,
  ): Promise<T> {
    const remainingMilliseconds = deadlineAt - Date.now();
    if (remainingMilliseconds <= 0) {
      throw new ExternalActionAdapterError(
        'ADAPTER_TIMEOUT',
        'GitHub code review exceeded its execution deadline',
        true,
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), remainingMilliseconds);
    try {
      let response: Response;
      try {
        response = await this.fetcher(`https://api.github.com${path}`, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'mcf-runtime-code-review-adapter',
            ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
          },
        });
      } catch (error) {
        if (controller.signal.aborted) {
          throw new ExternalActionAdapterError(
            'ADAPTER_TIMEOUT',
            'GitHub code review exceeded its execution deadline',
            true,
          );
        }
        throw new ExternalActionAdapterError(
          'NETWORK_FAILURE',
          error instanceof Error ? error.message : 'GitHub network request failed',
          true,
        );
      }

      if (!response.ok) {
        const remaining = response.headers.get('x-ratelimit-remaining');
        if (response.status === 429 || (response.status === 403 && remaining === '0')) {
          throw new ExternalActionAdapterError(
            'RATE_LIMITED',
            'GitHub API rate limit was reached',
            true,
            response.status,
          );
        }
        if (response.status === 401 || response.status === 403) {
          throw new ExternalActionAdapterError(
            'AUTHENTICATION_REQUIRED',
            'GitHub authentication or repository permission is required',
            false,
            response.status,
          );
        }
        if (response.status === 404) {
          throw new ExternalActionAdapterError(
            'TARGET_NOT_FOUND',
            'GitHub review target was not found',
            false,
            response.status,
          );
        }
        throw new ExternalActionAdapterError(
          'INVALID_RESPONSE',
          `GitHub API returned HTTP ${response.status}`,
          response.status >= 500,
          response.status,
        );
      }

      try {
        return (await response.json()) as T;
      } catch {
        if (controller.signal.aborted) {
          throw new ExternalActionAdapterError(
            'ADAPTER_TIMEOUT',
            'GitHub code review exceeded its execution deadline',
            true,
          );
        }
        throw new ExternalActionAdapterError(
          'INVALID_RESPONSE',
          'GitHub API returned invalid JSON',
          false,
          response.status,
        );
      }
    } finally {
      clearTimeout(timeout);
    }
  }
'''
replace_once(ADAPTER, old_method, new_method)
replace_once(
    ADAPTER,
    '''  async execute(request: ExternalActionRequest): Promise<McfToolReceipt> {
    const target = resolveTarget(request);
''',
    '''  async execute(request: ExternalActionRequest): Promise<McfToolReceipt> {
    const deadlineAt = Date.now() + GITHUB_CODE_REVIEW_TIMEOUT_MS;
    const target = resolveTarget(request);
''',
)
for old, new in [
    (
        '''      const pull = await this.client.getJson<GitHubPullResponse>(
        `/repos/${target.repository}/pulls/${pullNumber}`,
      );''',
        '''      const pull = await this.client.getJson<GitHubPullResponse>(
        `/repos/${target.repository}/pulls/${pullNumber}`,
        deadlineAt,
      );''',
    ),
    (
        '''        const batch = await this.client.getJson<GitHubChangedFile[]>(
          `/repos/${target.repository}/pulls/${pullNumber}/files?per_page=100&page=${page}`,
        );''',
        '''        const batch = await this.client.getJson<GitHubChangedFile[]>(
          `/repos/${target.repository}/pulls/${pullNumber}/files?per_page=100&page=${page}`,
          deadlineAt,
        );''',
    ),
    (
        '''        const observedPull = await this.client.getJson<GitHubPullResponse>(
          `/repos/${target.repository}/pulls/${pullNumber}`,
        );''',
        '''        const observedPull = await this.client.getJson<GitHubPullResponse>(
          `/repos/${target.repository}/pulls/${pullNumber}`,
          deadlineAt,
        );''',
    ),
    (
        '''        const pageResult = await this.client.getJson<GitHubCommitResponse>(
          `/repos/${target.repository}/commits/${target.value}?per_page=100&page=${page}`,
        );''',
        '''        const pageResult = await this.client.getJson<GitHubCommitResponse>(
          `/repos/${target.repository}/commits/${target.value}?per_page=100&page=${page}`,
          deadlineAt,
        );''',
    ),
]:
    replace_once(ADAPTER, old, new)

TEST = "apps/rede-social-agentes/apps/server/src/mcf-runtime/github-code-review.adapter.test.ts"
replace_once(
    TEST,
    "import { GitHubCodeReviewAdapter, GitHubReadClient } from './github-code-review.adapter.js';\n",
    "import {\n  GITHUB_CODE_REVIEW_TIMEOUT_MS,\n  GitHubCodeReviewAdapter,\n  GitHubReadClient,\n} from './github-code-review.adapter.js';\n",
)
test = read(TEST)
extra = r'''

  it('rejects a repository input that differs from the declared tool resource before fetching', async () => {
    const fetcher = vi.fn(async () => new Response('{}', { status: 500 }));
    const adapter = new GitHubCodeReviewAdapter(
      new EvidenceValidator(),
      new GitHubReadClient(fetcher, undefined),
    );

    await expect(
      adapter.execute({
        skill,
        agentId: 'Vinicius',
        inputs: {
          repository: 'leon337/other-private-repository',
          diff_or_commit: 'PR #70',
        },
        tool: {
          provider: 'github',
          operation: 'inspect-code',
          resource: 'leon337/multiagent-collaboration-framework',
        },
      }),
    ).rejects.toMatchObject({ code: 'INVALID_CONTEXT', retryable: false });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('aborts a review at the global deadline before the external action lease can expire', async () => {
    vi.useFakeTimers();
    try {
      const fetcher = vi.fn(
        async (_url: string, init?: RequestInit) =>
          await new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener(
              'abort',
              () => reject(new DOMException('Aborted', 'AbortError')),
              { once: true },
            );
          }),
      );
      const adapter = new GitHubCodeReviewAdapter(
        new EvidenceValidator(),
        new GitHubReadClient(fetcher, undefined),
      );
      const rejection = expect(
        adapter.execute({
          skill,
          agentId: 'Vinicius',
          inputs: {
            repository: 'leon337/multiagent-collaboration-framework',
            diff_or_commit: 'PR #70',
          },
          tool: {
            provider: 'github',
            operation: 'inspect-code',
            resource: 'leon337/multiagent-collaboration-framework',
          },
        }),
      ).rejects.toMatchObject({ code: 'ADAPTER_TIMEOUT', retryable: true });

      await vi.advanceTimersByTimeAsync(GITHUB_CODE_REVIEW_TIMEOUT_MS);
      await rejection;
      expect(fetcher).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
'''
if not test.endswith("});\n"):
    raise RuntimeError("adapter test file has unexpected ending")
test = test[:-4] + extra + "});\n"
write(TEST, test)
