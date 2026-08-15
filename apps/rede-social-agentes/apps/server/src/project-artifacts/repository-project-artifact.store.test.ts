import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type {
  IntentAlignmentReceiptV1,
  ProjectIntentPackageV1,
  ProjectRealityReportV1,
} from '@rsa/contracts';
import { afterEach, describe, expect, it } from 'vitest';

import {
  calculateProjectArtifactDigest,
  canonicalAlignmentReceiptPath,
  canonicalPipPath,
  canonicalPrrPath,
  RepositoryProjectArtifactStore,
  type CanonicalArtifactRef,
} from './repository-project-artifact.store.js';

const repository = 'leon337/multiagent-collaboration-framework';
const schemas = fileURLToPath(new URL('../../../../../../schemas/', import.meta.url));
const fixtures = fileURLToPath(
  new URL('../../../../../../schemas/fixtures/v1.1/', import.meta.url),
);
const temporaryRoots: string[] = [];

async function fixture<T>(filename: string): Promise<T> {
  return JSON.parse(await readFile(join(fixtures, filename), 'utf8')) as T;
}

async function createStore(
  atomicRename?: (source: string, destination: string) => Promise<void>,
): Promise<{ root: string; store: RepositoryProjectArtifactStore }> {
  const root = await mkdtemp(join(tmpdir(), 'mcf-project-artifacts-'));
  temporaryRoots.push(root);
  return {
    root,
    store: new RepositoryProjectArtifactStore({
      repositoryRoot: root,
      schemaDirectory: schemas,
      repository,
      atomicRename,
    }),
  };
}

function aligned(pip: ProjectIntentPackageV1): ProjectIntentPackageV1 {
  const copy = structuredClone(pip);
  copy.lifecycle = 'ALIGNED';
  copy.alignment = {
    status: 'ALIGNED',
    receiptRef: canonicalAlignmentReceiptPath('alignment-001'),
    alignedAt: '2026-08-15T13:00:00Z',
  };
  return copy;
}

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe('repository-backed canonical project artifact store', () => {
  it('constructs only canonical, traversal-safe paths', () => {
    expect(canonicalPipPath('pip-001')).toBe('.mcf/intent/pip-pip-001.json');
    expect(canonicalPrrPath('prr-001')).toBe('.mcf/reality/prr-prr-001.json');
    expect(canonicalAlignmentReceiptPath('alignment-001')).toBe(
      '.mcf/receipts/intent-alignment-alignment-001.json',
    );
    expect(() => canonicalPipPath('../escape')).toThrowError(
      expect.objectContaining({ code: 'INVALID_ARTIFACT_ID' }),
    );
  });

  it('calculates a deterministic digest independent of key order and root digest value', async () => {
    const pip = await fixture<ProjectIntentPackageV1>('project-intent-package.valid.json');
    const reversed = Object.fromEntries(
      Object.entries(pip).reverse(),
    ) as unknown as ProjectIntentPackageV1;
    reversed.contentDigest = `sha256:${'f'.repeat(64)}`;

    expect(calculateProjectArtifactDigest(reversed)).toBe(calculateProjectArtifactDigest(pip));
  });

  it('round-trips an exact PIP as local and uncheckpointed', async () => {
    const { store } = await createStore();
    const written = await store.writePip(
      await fixture<ProjectIntentPackageV1>('project-intent-package.valid.json'),
    );
    const loaded = await store.loadLocal(written.reference);

    expect(written.checkpointState).toBe('LOCAL_UNCHECKPOINTED');
    expect(written.reference.commitSha).toBeNull();
    expect(written.reference.path).toBe(canonicalPipPath(written.artifact.revisionId));
    expect(loaded).toEqual(written);
  });

  it('round-trips a PRR and rejects mutation of its persisted revision', async () => {
    const { store } = await createStore();
    const prr = await fixture<ProjectRealityReportV1>('project-reality-report.valid.json');
    const written = await store.writePrr(prr);

    expect(await store.loadLocal(written.reference)).toEqual(written);

    const mutation = structuredClone(prr);
    mutation.observations[0]!.statement = 'Mutated reality under the same revision.';
    await expect(store.writePrr(mutation)).rejects.toMatchObject({
      code: 'PRR_REVISION_IMMUTABLE',
    });
  });

  it('rejects mutation after a PIP revision is aligned', async () => {
    const { store } = await createStore();
    const draft = await fixture<ProjectIntentPackageV1>('project-intent-package.valid.json');
    await store.writePip(draft);
    const pip = aligned(draft);
    await store.writePip(pip);

    const mutation = structuredClone(pip);
    mutation.originalIntent.text = 'A changed intent needs a successor revision.';
    await expect(store.writePip(mutation)).rejects.toMatchObject({
      code: 'ALIGNED_PIP_IMMUTABLE',
    });
  });

  it('round-trips an exact alignment receipt and rejects replacement of its identity', async () => {
    const { store } = await createStore();
    const persistedPip = await store.writePip(
      aligned(await fixture<ProjectIntentPackageV1>('project-intent-package.valid.json')),
    );
    const receipt = await fixture<IntentAlignmentReceiptV1>('intent-alignment-receipt.valid.json');
    receipt.pipRef = persistedPip.reference;
    const written = await store.writeAlignmentReceipt(receipt, persistedPip);

    expect(await store.loadLocal(written.reference)).toEqual(written);

    const mutation = structuredClone(receipt);
    mutation.confirmationSourceRef = 'human-gate:replacement';
    await expect(store.writeAlignmentReceipt(mutation, persistedPip)).rejects.toMatchObject({
      code: 'ALIGNMENT_RECEIPT_IMMUTABLE',
    });
  });

  it('rejects an alignment receipt that is not bound to the exact resolved PIP', async () => {
    const { store } = await createStore();
    const persistedPip = await store.writePip(
      aligned(await fixture<ProjectIntentPackageV1>('project-intent-package.valid.json')),
    );
    const receipt = await fixture<IntentAlignmentReceiptV1>('intent-alignment-receipt.valid.json');
    receipt.pipRef = {
      ...persistedPip.reference,
      contentDigest: `sha256:${'0'.repeat(64)}`,
    };

    await expect(store.writeAlignmentReceipt(receipt, persistedPip)).rejects.toMatchObject({
      code: 'ALIGNMENT_BINDING_INVALID',
    });
  });

  it('rejects content tampering when loading by exact digest', async () => {
    const { root, store } = await createStore();
    const written = await store.writePip(
      await fixture<ProjectIntentPackageV1>('project-intent-package.valid.json'),
    );
    const absolutePath = join(root, written.reference.path);
    const tampered = JSON.parse(await readFile(absolutePath, 'utf8')) as ProjectIntentPackageV1;
    tampered.originalIntent.text = 'Tampered without updating the digest.';
    await writeFile(absolutePath, JSON.stringify(tampered), 'utf8');

    await expect(store.loadLocal(written.reference)).rejects.toMatchObject({
      code: 'DIGEST_MISMATCH',
    });
  });

  it('rejects a schema-invalid artifact before writing it', async () => {
    const { root, store } = await createStore();
    const invalid = await fixture<ProjectIntentPackageV1>('project-intent-package.valid.json');
    invalid.dimensions.PROBLEM.provenance = [];

    await expect(store.writePip(invalid)).rejects.toMatchObject({ code: 'SCHEMA_INVALID' });
    await expect(
      readFile(join(root, canonicalPipPath(invalid.revisionId)), 'utf8'),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('cannot report local content as remote and verifies exact remote resolution metadata', async () => {
    const { root, store } = await createStore();
    const local = await store.writePip(
      await fixture<ProjectIntentPackageV1>('project-intent-package.valid.json'),
    );
    const remoteReference = {
      ...local.reference,
      commitSha: 'a'.repeat(40),
    } satisfies CanonicalArtifactRef<'PROJECT_INTENT_PACKAGE'>;

    await expect(store.loadLocal(remoteReference)).rejects.toMatchObject({
      code: 'LOCAL_REFERENCE_REQUIRED',
    });
    await expect(
      store.loadRemoteVerified(local.reference, {
        readAtExactCommit: async (request) => ({
          ...request,
          content: await readFile(join(root, request.path), 'utf8'),
        }),
      }),
    ).rejects.toMatchObject({ code: 'REMOTE_REFERENCE_REQUIRED' });
    await expect(
      store.loadRemoteVerified(remoteReference, {
        readAtExactCommit: async (request) => ({
          ...request,
          commitSha: 'b'.repeat(40),
          content: await readFile(join(root, request.path), 'utf8'),
        }),
      }),
    ).rejects.toMatchObject({ code: 'REMOTE_RESOLUTION_MISMATCH' });

    const verified = await store.loadRemoteVerified(remoteReference, {
      readAtExactCommit: async (request) => ({
        ...request,
        content: await readFile(join(root, request.path), 'utf8'),
      }),
    });
    expect(verified.checkpointState).toBe('REMOTE_VERIFIED');
    expect(verified.reference.commitSha).toBe('a'.repeat(40));
  });

  it('preserves the prior file and cleans temporary state when atomic rename fails', async () => {
    const { root, store } = await createStore();
    const original = await store.writePip(
      await fixture<ProjectIntentPackageV1>('project-intent-package.valid.json'),
    );
    const failingStore = new RepositoryProjectArtifactStore({
      repositoryRoot: root,
      schemaDirectory: schemas,
      repository,
      atomicRename: async () => {
        throw new Error('injected rename failure');
      },
    });
    const mutation = structuredClone(original.artifact);
    mutation.originalIntent.text = 'Allowed pre-alignment update that must fail atomically.';

    await expect(failingStore.writePip(mutation)).rejects.toThrow('injected rename failure');
    expect(await store.loadLocal(original.reference)).toEqual(original);
    expect(await readdir(join(root, '.mcf/intent'))).toEqual([
      `pip-${original.artifact.revisionId}.json`,
    ]);
  });

  it('rejects a non-canonical path even when the remaining reference fields are exact', async () => {
    const { store } = await createStore();
    const written = await store.writePrr(
      await fixture<ProjectRealityReportV1>('project-reality-report.valid.json'),
    );
    const wrongPath = { ...written.reference, path: '.mcf/reality/other.json' };

    await expect(store.loadLocal(wrongPath)).rejects.toMatchObject({
      code: 'REFERENCE_MISMATCH',
    });
  });
});
