import type { McfSkillDefinition } from '@rsa/contracts';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { chmod, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { beforeEach, describe, expect, it } from 'vitest';

import {
  CodeBuddyExecutorAdapter,
  LocalCodeBuddyHost,
  probeCodeBuddyExecutorCapability,
} from './codebuddy-executor.adapter.js';
import { EvidenceValidator } from './evidence-validator.js';

const execFileAsync = promisify(execFile);
const repository = 'leon337/multiagent-collaboration-framework';
const model = 'cx/gpt-5.6-sol';

const skill: McfSkillDefinition = {
  skillId: 'MCF-IMPLEMENT-CHANGE',
  name: 'Implementar mudança autorizada',
  version: '1.0.0',
  purpose: 'Produzir alteração de código dentro do escopo aprovado.',
  ownerAgents: ['Rafael'],
  requiredInputs: ['approved_scope', 'acceptance_criteria', 'repository', 'allowed_paths'],
  allowedTools: ['CodeBuddy'],
  forbiddenTools: ['direct_main_write', 'public_release_without_gate'],
  permissionProfile: 'SCOPED_WRITE',
  executionSteps: ['implementar'],
  requiredEvidence: ['changed_files', 'diff_digest', 'test_results_or_handoff'],
  acceptanceCriteria: ['scope_respected'],
  failureModes: ['scope_creep'],
  fallback: 'Produzir patch.',
  handoffTo: 'Vinicius',
};
async function initRepo(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'mcf-codebuddy-hardening-'));
  await execFileAsync('git', ['init'], { cwd: dir });
  await execFileAsync('git', ['config', 'user.email', 'test@example.test'], { cwd: dir });
  await execFileAsync('git', ['config', 'user.name', 'MCF Test'], { cwd: dir });
  await writeFile(join(dir, 'fixture.txt'), 'BEFORE\n');
  await execFileAsync('git', ['add', 'fixture.txt'], { cwd: dir });
  await execFileAsync('git', ['commit', '-m', 'base'], { cwd: dir });
  await execFileAsync('git', ['remote', 'add', 'origin', `https://github.com/${repository}.git`], {
    cwd: dir,
  });
  return dir;
}

async function fakeBinary(_dir: string, body: string): Promise<string> {
  const binary = join(
    tmpdir(),
    `fake-codebuddy-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );
  await writeFile(binary, `#!/bin/sh\nset -eu\n${body}\nprintf '%s' '{"result":"ok"}'\n`);
  await chmod(binary, 0o700);
  return binary;
}

function request(workspace: string, allowedPaths = ['fixture.txt']) {
  return {
    skill,
    agentId: 'Rafael',
    inputs: {
      approved_scope: 'Apply only the requested fixture change.',
      acceptance_criteria: ['requested change is present'],
      repository,
      workspace,
      allowed_paths: allowedPaths,
      authorizedScope: true,
    },
    tool: { provider: 'codebuddy', operation: 'implement-change', resource: repository },
  };
}
function subject(workspaceRoot: string, binary: string) {
  return new CodeBuddyExecutorAdapter(new EvidenceValidator(), {
    enabled: true,
    binary,
    workspaceRoot,
    model,
    timeoutMs: 5000,
  });
}

beforeEach(() => {
  process.env.DATABASE_URL = 'postgresql://localhost/rsa';
  process.env.MCF_RECEIPT_SECRET = 'test-only-mcf-receipt-secret-0000000001';
});

describe('CodeBuddy disposable-worktree hardening', () => {
  it('executes CodeBuddy outside the authorized workspace and publishes only the validated patch', async () => {
    const dir = await initRepo();
    const binary = await fakeBinary(dir, `printf 'CWD=%s\nAFTER\n' "$PWD" > fixture.txt`);
    try {
      const receipt = await subject(dir, binary).execute(request(dir));
      const published = await readFile(join(dir, 'fixture.txt'), 'utf8');
      expect(published).toBe('CWD=/workspace\nAFTER\n');
      expect(published).not.toContain(dir);
      expect(receipt.metadata.changedFiles).toEqual(['fixture.txt']);
    } finally {
      await rm(binary, { force: true });
      await rm(dir, { recursive: true, force: true });
    }
  });
  it('rejects ignored out-of-scope side effects without contaminating the authorized workspace', async () => {
    const dir = await initRepo();
    await writeFile(join(dir, '.gitignore'), '.hidden\n');
    await execFileAsync('git', ['add', '.gitignore'], { cwd: dir });
    await execFileAsync('git', ['commit', '-m', 'ignore hidden'], { cwd: dir });
    const binary = await fakeBinary(
      dir,
      `printf 'AFTER\\n' > fixture.txt\nprintf 'SECRET\\n' > .hidden`,
    );
    try {
      await expect(subject(dir, binary).execute(request(dir))).rejects.toMatchObject({
        code: 'INVALID_RESPONSE',
      });
      expect(await readFile(join(dir, 'fixture.txt'), 'utf8')).toBe('BEFORE\n');
      await expect(readFile(join(dir, '.hidden'), 'utf8')).rejects.toMatchObject({
        code: 'ENOENT',
      });
    } finally {
      await rm(binary, { force: true });
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('rejects a symlink-mediated allowed path before invoking CodeBuddy', async () => {
    const dir = await initRepo();
    const external = await mkdtemp(join(tmpdir(), 'mcf-codebuddy-external-'));
    const report = join(tmpdir(), `mcf-codebuddy-invoked-${Date.now()}`);
    await writeFile(join(external, 'victim.txt'), 'BEFORE\n');
    await symlink(external, join(dir, 'allowed-link'));
    await execFileAsync('git', ['add', 'allowed-link'], { cwd: dir });
    await execFileAsync('git', ['commit', '-m', 'tracked symlink'], { cwd: dir });
    const binary = await fakeBinary(
      dir,
      `touch '${report}'\nprintf 'AFTER\\n' > allowed-link/victim.txt`,
    );
    try {
      await expect(
        subject(dir, binary).execute(request(dir, ['allowed-link/victim.txt'])),
      ).rejects.toMatchObject({
        code: 'INVALID_CONTEXT',
      });
      expect(await readFile(join(external, 'victim.txt'), 'utf8')).toBe('BEFORE\n');
    } finally {
      await rm(binary, { force: true });
      await rm(external, { recursive: true, force: true });
      await rm(dir, { recursive: true, force: true });
    }
  });
  it('rejects a rename that crosses allowed_paths without touching the authorized workspace', async () => {
    const dir = await initRepo();
    const binary = await fakeBinary(dir, `mv fixture.txt outside.txt`);
    try {
      await expect(subject(dir, binary).execute(request(dir))).rejects.toMatchObject({
        code: 'INVALID_RESPONSE',
      });
      expect(await readFile(join(dir, 'fixture.txt'), 'utf8')).toBe('BEFORE\n');
      await expect(readFile(join(dir, 'outside.txt'), 'utf8')).rejects.toMatchObject({
        code: 'ENOENT',
      });
    } finally {
      await rm(binary, { force: true });
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('resolves a CodeBuddy executable supplied by PATH during capability probing', async () => {
    const dir = await initRepo();
    const binDir = await mkdtemp(join(tmpdir(), 'mcf-codebuddy-path-'));
    const binary = join(binDir, 'codebuddy-path-probe');
    await writeFile(binary, "#!/bin/sh\nprintf '%s\n' '--agent --model'\n");
    await chmod(binary, 0o700);
    const previousPath = process.env.PATH;
    try {
      process.env.PATH = `${binDir}:${previousPath ?? ''}`;
      expect(
        probeCodeBuddyExecutorCapability({
          enabled: true,
          binary: 'codebuddy-path-probe',
          workspaceRoot: dir,
          model,
          timeoutMs: 5000,
        }),
      ).toBe(true);
    } finally {
      process.env.PATH = previousPath;
      await rm(binDir, { recursive: true, force: true });
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('hides host paths outside the execution workspace and replaces HOME/XDG/TMP', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mcf-codebuddy-sandbox-'));
    const canary = join(tmpdir(), `mcf-codebuddy-host-canary-${Date.now()}.txt`);
    await writeFile(canary, 'HOST-CANARY\n');
    const binary = await fakeBinary(
      dir,
      `test ! -e '${canary}'\ntest "$HOME" = '/home/mcf'\ntest "$CODEBUDDY_CONFIG_DIR" = '/mcf/config'\ntest "$TMPDIR" = '/tmp'`,
    );
    try {
      const result = await new LocalCodeBuddyHost().execute({
        binary,
        cwd: dir,
        model,
        prompt: 'sandbox smoke',
        timeoutMs: 3000,
        tools: ['Read'],
      });
      expect(result.exitCode).toBe(0);
    } finally {
      await rm(canary, { force: true });
      await rm(binary, { force: true });
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('provides only a synthetic passwd identity for runtimes that resolve the current user', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mcf-codebuddy-passwd-'));
    const binary = await fakeBinary(
      dir,
      `/usr/bin/python3 -c "import os,pwd; u=pwd.getpwuid(os.getuid()); assert u.pw_name == 'mcf' and u.pw_dir == '/home/mcf'"`,
    );
    try {
      const result = await new LocalCodeBuddyHost().execute({
        binary,
        cwd: dir,
        model,
        prompt: 'identity smoke',
        timeoutMs: 3000,
        tools: ['Read'],
      });
      expect(result.exitCode).toBe(0);
    } finally {
      await rm(binary, { force: true });
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('bounds captured stdout and stderr even when the child floods output', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mcf-codebuddy-output-'));
    const binary = await fakeBinary(dir, `yes X | head -c 2097152`);
    try {
      const result = await new LocalCodeBuddyHost().execute({
        binary,
        cwd: dir,
        model,
        prompt: 'output smoke',
        timeoutMs: 3000,
        tools: ['Read'],
      });
      expect(
        Buffer.byteLength(result.stdout) + Buffer.byteLength(result.stderr),
      ).toBeLessThanOrEqual(1024 * 1024);
      expect(result.exitCode).not.toBe(0);
    } finally {
      await rm(binary, { force: true });
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('kills descendant processes on timeout before they can perform delayed writes', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mcf-codebuddy-timeout-'));
    const binary = await fakeBinary(
      dir,
      `/usr/bin/setsid /bin/sh -c 'sleep 0.6; printf "LATE\\n" > escaped.txt' >/dev/null 2>&1 &\nsleep 5`,
    );
    try {
      const result = await new LocalCodeBuddyHost().execute({
        binary,
        cwd: dir,
        model,
        prompt: 'timeout smoke',
        timeoutMs: 100,
        tools: ['Read'],
      });
      expect(result.timedOut).toBe(true);
      await new Promise((resolve) => setTimeout(resolve, 850));
      await expect(readFile(join(dir, 'escaped.txt'), 'utf8')).rejects.toMatchObject({
        code: 'ENOENT',
      });
    } finally {
      await rm(binary, { force: true });
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('rolls back only the published transaction and preserves concurrent unrelated work', async () => {
    const dir = await initRepo();
    await writeFile(join(dir, 'unrelated.txt'), 'BASE\n');
    await execFileAsync('git', ['add', 'unrelated.txt'], { cwd: dir });
    await execFileAsync('git', ['commit', '-m', 'add unrelated'], { cwd: dir });
    const baseSha = (await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: dir })).stdout.trim();
    const host = new LocalCodeBuddyHost();
    const execution = await host.createExecutionWorkspace(dir, baseSha);
    try {
      await writeFile(join(execution.realPath, 'fixture.txt'), 'AFTER\n');
      const changes = await host.collectChanges(execution.realPath, baseSha);
      await host.publishChanges(execution.realPath, dir, baseSha, changes);
      await writeFile(join(dir, 'unrelated.txt'), 'CONCURRENT\n');

      await host.restoreWorkspace(dir, baseSha, changes);

      const head = (await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: dir })).stdout.trim();
      expect(head).toBe(baseSha);
      expect(await readFile(join(dir, 'fixture.txt'), 'utf8')).toBe('BEFORE\n');
      expect(await readFile(join(dir, 'unrelated.txt'), 'utf8')).toBe('CONCURRENT\n');
    } finally {
      await host.removeExecutionWorkspace(dir, execution);
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('binds diffDigest to immutable diff bytes carried by the signed receipt', async () => {
    const dir = await initRepo();
    const binary = await fakeBinary(dir, `printf 'AFTER\\n' > fixture.txt`);
    try {
      const receipt = await subject(dir, binary).execute(request(dir));
      const artifact = receipt.metadata.diffArtifact as
        { encoding?: unknown; data?: unknown; byteLength?: unknown } | undefined;
      expect(artifact?.encoding).toBe('base64');
      expect(typeof artifact?.data).toBe('string');
      const bytes = Buffer.from(String(artifact?.data), 'base64');
      expect(bytes.byteLength).toBe(artifact?.byteLength);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(receipt.metadata.diffDigest);
      expect(bytes.toString('utf8')).toContain('AFTER');
    } finally {
      await rm(binary, { force: true });
      await rm(dir, { recursive: true, force: true });
    }
  });
});
