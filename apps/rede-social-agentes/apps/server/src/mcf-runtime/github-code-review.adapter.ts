import type { McfToolReceipt } from '@rsa/contracts';

import type { EvidenceValidator } from './evidence-validator.js';
import {
  ExternalActionAdapterError,
  type ExternalActionAdapter,
  type ExternalActionRequest,
} from './external-action.contracts.js';

interface GitHubPullResponse {
  number: number;
  html_url: string;
  head: { sha: string };
}

interface GitHubCommitResponse {
  sha: string;
  html_url: string;
  files?: GitHubChangedFile[] | undefined;
}

interface GitHubChangedFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string | undefined;
}

type ReviewSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

interface ReviewFinding {
  severity: ReviewSeverity;
  file: string;
  line: number | null;
  rule: string;
  message: string;
  recommendation: string;
}

interface ReviewTarget {
  repository: string;
  kind: 'pull_request' | 'commit';
  value: number | string;
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

function normalizeProvider(value: string): string {
  return value.trim().toLowerCase().replaceAll('_', '-').replaceAll(' ', '-');
}

function repositoryFromValue(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  let path = trimmed;
  if (/^https?:\/\//u.test(trimmed)) {
    try {
      path = new URL(trimmed).pathname;
    } catch {
      return null;
    }
  }

  const parts = path
    .replace(/^github:/u, '')
    .replace(/^\/+|\/+$/gu, '')
    .split('/');
  if (parts.length < 2) return null;
  const owner = parts[0];
  const repository = parts[1]?.replace(/\.git$/u, '');
  if (
    !owner ||
    !repository ||
    !/^[A-Za-z0-9_.-]+$/u.test(owner) ||
    !/^[A-Za-z0-9_.-]+$/u.test(repository)
  ) {
    return null;
  }
  return `${owner}/${repository}`;
}

function resolveTarget(request: ExternalActionRequest): ReviewTarget {
  const repositoryInput = request.inputs.repository;
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

  const target = request.inputs.diff_or_commit;
  if (typeof target === 'number' && Number.isInteger(target) && target > 0) {
    return { repository, kind: 'pull_request', value: target };
  }
  if (typeof target !== 'string' || target.trim().length === 0) {
    throw new ExternalActionAdapterError(
      'UNSUPPORTED_TARGET',
      'GitHub code review requires diff_or_commit as pull request or commit SHA',
      false,
    );
  }

  const normalized = target.trim();
  const pullMatch = /(?:pull\/|pr[:#\s-]*|^#?)(\d+)$/iu.exec(normalized);
  if (pullMatch?.[1]) {
    return { repository, kind: 'pull_request', value: Number(pullMatch[1]) };
  }

  const commitMatch = /(?:commit\/)?([a-f0-9]{7,64})$/iu.exec(normalized);
  if (commitMatch?.[1]) {
    return { repository, kind: 'commit', value: commitMatch[1].toLowerCase() };
  }

  throw new ExternalActionAdapterError(
    'UNSUPPORTED_TARGET',
    'diff_or_commit must identify a GitHub pull request or commit SHA',
    false,
  );
}

function addedLines(patch: string | undefined): Array<{ line: number; content: string }> {
  if (!patch) return [];
  const lines: Array<{ line: number; content: string }> = [];
  let newLine = 0;

  for (const patchLine of patch.split('\n')) {
    const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/u.exec(patchLine);
    if (hunk?.[1]) {
      newLine = Number(hunk[1]);
      continue;
    }
    if (patchLine.startsWith('+++') || patchLine.startsWith('---')) continue;
    if (patchLine.startsWith('+')) {
      lines.push({ line: newLine, content: patchLine.slice(1) });
      newLine += 1;
      continue;
    }
    if (!patchLine.startsWith('-') && !patchLine.startsWith('\\')) {
      newLine += 1;
    }
  }
  return lines;
}

function findingsForFile(file: GitHubChangedFile): ReviewFinding[] {
  const findings: ReviewFinding[] = [];
  for (const added of addedLines(file.patch)) {
    if (/(?:password|api[_-]?key|secret|token)\s*[:=]\s*['"`][^'"`]{8,}/iu.test(added.content)) {
      findings.push({
        severity: 'HIGH',
        file: file.filename,
        line: added.line,
        rule: 'hardcoded-secret',
        message: 'Possible hardcoded credential or secret was added.',
        recommendation: 'Remove the literal and load the value from an approved secret store.',
      });
    }
    if (/\b(?:eval|Function)\s*\(/u.test(added.content)) {
      findings.push({
        severity: 'HIGH',
        file: file.filename,
        line: added.line,
        rule: 'dynamic-code-execution',
        message: 'Dynamic code execution was added.',
        recommendation:
          'Replace dynamic evaluation with explicit parsing or a constrained dispatch table.',
      });
    }
    if (/dangerouslySetInnerHTML|\.innerHTML\s*=/u.test(added.content)) {
      findings.push({
        severity: 'MEDIUM',
        file: file.filename,
        line: added.line,
        rule: 'unsafe-html-sink',
        message: 'An HTML injection sink was added.',
        recommendation: 'Avoid raw HTML or sanitize input with an approved, tested sanitizer.',
      });
    }
    if (/\b(?:TODO|FIXME)\b/u.test(added.content)) {
      findings.push({
        severity: 'LOW',
        file: file.filename,
        line: added.line,
        rule: 'unfinished-change',
        message: 'The changed line contains an unfinished-work marker.',
        recommendation: 'Resolve the marker or link it to a tracked issue with bounded follow-up.',
      });
    }
  }

  if (file.changes > 800) {
    findings.push({
      severity: 'LOW',
      file: file.filename,
      line: null,
      rule: 'large-change-surface',
      message: `The file changes ${file.changes} lines, increasing review risk.`,
      recommendation:
        'Split the change or document why the large atomic modification is necessary.',
    });
  }

  return findings;
}

function buildReview(files: GitHubChangedFile[]): {
  findings: ReviewFinding[];
  verdict: 'PASS' | 'PASS_WITH_FINDINGS' | 'BLOCK';
} {
  const findings = files.flatMap(findingsForFile);
  const sourceFiles = files.filter((file) =>
    /\.(?:[cm]?[jt]sx?|py|go|java|rs|rb|php)$/u.test(file.filename),
  );
  const testFiles = files.filter((file) =>
    /(?:^|\/)(?:test|tests|__tests__)(?:\/|$)|\.(?:test|spec)\.[^.]+$/u.test(file.filename),
  );
  if (sourceFiles.length > 0 && testFiles.length === 0) {
    findings.push({
      severity: 'MEDIUM',
      file: sourceFiles[0]?.filename ?? files[0]?.filename ?? 'unknown',
      line: null,
      rule: 'missing-test-change',
      message: 'Source code changed without a corresponding test file in the reviewed change.',
      recommendation: 'Add or update tests, or document verified coverage from existing tests.',
    });
  }

  const verdict = findings.some((finding) => finding.severity === 'HIGH')
    ? 'BLOCK'
    : findings.length > 0
      ? 'PASS_WITH_FINDINGS'
      : 'PASS';
  return { findings, verdict };
}

export class GitHubReadClient {
  constructor(
    private readonly fetcher: FetchLike = globalThis.fetch,
    private readonly token: string | undefined = process.env.MCF_GITHUB_TOKEN ??
      process.env.GITHUB_TOKEN,
  ) {}

  async getJson<T>(path: string): Promise<T> {
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
}

export class GitHubCodeReviewAdapter implements ExternalActionAdapter {
  readonly adapterId = 'github-code-review-read-only-v1';

  constructor(
    private readonly evidence: EvidenceValidator,
    private readonly client: GitHubReadClient = new GitHubReadClient(),
  ) {}

  supports(request: ExternalActionRequest): boolean {
    return (
      request.skill.skillId === 'MCF-REVIEW-CODE' &&
      normalizeProvider(request.tool.provider) === 'github' &&
      normalizeProvider(request.tool.operation) === 'inspect-code'
    );
  }

  async execute(request: ExternalActionRequest): Promise<McfToolReceipt> {
    const target = resolveTarget(request);
    let commitSha: string;
    let externalId: string;
    let targetUrl: string;
    let files: GitHubChangedFile[];

    if (target.kind === 'pull_request') {
      const pullNumber = target.value as number;
      const pull = await this.client.getJson<GitHubPullResponse>(
        `/repos/${target.repository}/pulls/${pullNumber}`,
      );
      const changedFiles: GitHubChangedFile[] = [];
      for (let page = 1; page <= 10; page += 1) {
        const batch = await this.client.getJson<GitHubChangedFile[]>(
          `/repos/${target.repository}/pulls/${pullNumber}/files?per_page=100&page=${page}`,
        );
        changedFiles.push(...batch);
        if (batch.length < 100) break;
      }
      commitSha = pull.head?.sha;
      externalId = String(pull.number);
      targetUrl = pull.html_url;
      files = changedFiles;
    } else {
      const commit = await this.client.getJson<GitHubCommitResponse>(
        `/repos/${target.repository}/commits/${target.value}?per_page=100`,
      );
      commitSha = commit.sha;
      externalId = commit.sha;
      targetUrl = commit.html_url;
      files = commit.files ?? [];
    }

    if (!/^[a-f0-9]{7,64}$/u.test(commitSha) || files.length === 0) {
      throw new ExternalActionAdapterError(
        'INVALID_RESPONSE',
        'GitHub response did not include a reviewed commit SHA and changed files',
        false,
      );
    }

    const reviewedFiles = files.map((file) => file.filename);
    if (reviewedFiles.some((file) => typeof file !== 'string' || file.length === 0)) {
      throw new ExternalActionAdapterError(
        'INVALID_RESPONSE',
        'GitHub response contained an invalid changed file entry',
        false,
      );
    }

    const review = buildReview(files);
    const metadata = {
      adapterId: this.adapterId,
      targetType: target.kind,
      targetUrl,
      repository: target.repository,
      reviewedFiles,
      findingsCount: review.findings.length,
      findings: review.findings,
      verdict: review.verdict,
      readOnly: true,
      fileCount: files.length,
      additions: files.reduce((total, file) => total + file.additions, 0),
      deletions: files.reduce((total, file) => total + file.deletions, 0),
    };

    return this.evidence.createTrustedReceipt({
      provider: request.tool.provider,
      operation: request.tool.operation,
      resource: request.tool.resource,
      externalId,
      commitSha,
      status: 'SUCCEEDED',
      observedAt: new Date().toISOString(),
      metadata,
    });
  }
}
