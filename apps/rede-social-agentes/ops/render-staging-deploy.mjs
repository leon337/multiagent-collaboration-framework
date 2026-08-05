/* global console, fetch, process, setTimeout */

import { pathToFileURL, URL } from 'node:url';

const commitPattern = /^[a-f0-9]{40}$/u;
const defaultTimeoutMs = 20 * 60 * 1000;
const defaultIntervalMs = 10 * 1000;

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function normalizedSha(value, name) {
  const normalized = value?.trim().toLowerCase() ?? '';
  if (!commitPattern.test(normalized)) {
    throw new Error(`${name} must be a 40-character Git commit SHA.`);
  }
  return normalized;
}

function positiveInteger(value, fallback, name) {
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return parsed;
}

function publicBaseUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.hash) {
    throw new Error('MCF_RUNTIME_URL must be a public HTTPS URL without credentials or fragments.');
  }
  url.pathname = url.pathname.replace(/\/$/u, '');
  url.search = '';
  return url;
}

export function deploymentHookForCommit(value, commitSha) {
  const hook = new URL(value);
  if (hook.protocol !== 'https:') {
    throw new Error('RENDER_DEPLOY_HOOK_URL must use HTTPS.');
  }
  hook.searchParams.set('ref', normalizedSha(commitSha, 'commitSha'));
  return hook;
}

async function readJson(response, context) {
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`${context} returned a non-JSON response with status ${response.status}.`);
  }
  return { data, textLength: text.length };
}

export async function observeRuntime(baseUrl, fetchImpl = fetch) {
  const versionResponse = await fetchImpl(new URL('/health/version', baseUrl), {
    headers: { accept: 'application/json' },
  });
  if (!versionResponse.ok) {
    throw new Error(`health/version returned HTTP ${versionResponse.status}.`);
  }
  const { data: version } = await readJson(versionResponse, 'health/version');
  const commitSha = normalizedSha(version.commitSha, 'health/version commitSha');

  const readyResponse = await fetchImpl(new URL('/health/ready', baseUrl), {
    headers: { accept: 'application/json' },
  });

  return {
    commitSha,
    ready: readyResponse.ok,
    readyStatus: readyResponse.status,
  };
}

export async function triggerDeploy({ hookUrl, commitSha, fetchImpl = fetch }) {
  const target = deploymentHookForCommit(hookUrl, commitSha);
  const response = await fetchImpl(target, {
    method: 'POST',
    headers: { accept: 'application/json' },
  });
  if (![200, 202].includes(response.status)) {
    throw new Error(`Render deploy hook returned HTTP ${response.status}.`);
  }
  const { data } = await readJson(response, 'Render deploy hook');
  return {
    accepted: true,
    deployId: typeof data.id === 'string' && data.id.length > 0 ? data.id : null,
    queued: response.status === 202,
  };
}

export async function waitForRuntimeCommit({
  baseUrl,
  expectedCommitSha,
  fetchImpl = fetch,
  timeoutMs = defaultTimeoutMs,
  intervalMs = defaultIntervalMs,
  sleepImpl = sleep,
}) {
  const expected = normalizedSha(expectedCommitSha, 'expectedCommitSha');
  const deadline = Date.now() + timeoutMs;
  let lastObservation = null;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      lastObservation = await observeRuntime(baseUrl, fetchImpl);
      lastError = null;
      if (lastObservation.commitSha === expected && lastObservation.ready) {
        return lastObservation;
      }
    } catch (error) {
      lastError = error;
    }
    await sleepImpl(intervalMs);
  }

  const observed = lastObservation?.commitSha ?? 'unavailable';
  const readyStatus = lastObservation?.readyStatus ?? 'unavailable';
  const cause = lastError instanceof Error ? lastError.message : 'no additional error';
  throw new Error(
    `Runtime did not converge to ${expected}; observed=${observed}; ready=${readyStatus}; cause=${cause}`,
  );
}

export async function orchestrateStagingDeployment({
  runtimeUrl,
  deployHookUrl,
  releaseSha,
  fetchImpl = fetch,
  timeoutMs = defaultTimeoutMs,
  intervalMs = defaultIntervalMs,
  sleepImpl = sleep,
}) {
  const baseUrl = publicBaseUrl(runtimeUrl);
  const release = normalizedSha(releaseSha, 'RELEASE_SHA');
  const before = await observeRuntime(baseUrl, fetchImpl);

  if (!before.ready) {
    throw new Error(`Current runtime is not ready; HTTP ${before.readyStatus}.`);
  }

  if (before.commitSha === release) {
    return {
      status: 'NOOP',
      releaseSha: release,
      previousSha: before.commitSha,
      deployId: null,
      rollbackDeployId: null,
    };
  }

  let deployId = null;
  try {
    const deployment = await triggerDeploy({
      hookUrl: deployHookUrl,
      commitSha: release,
      fetchImpl,
    });
    deployId = deployment.deployId;
    await waitForRuntimeCommit({
      baseUrl,
      expectedCommitSha: release,
      fetchImpl,
      timeoutMs,
      intervalMs,
      sleepImpl,
    });
    return {
      status: 'DEPLOYED',
      releaseSha: release,
      previousSha: before.commitSha,
      deployId,
      rollbackDeployId: null,
    };
  } catch (deploymentError) {
    let rollbackDeployId = null;
    try {
      const rollback = await triggerDeploy({
        hookUrl: deployHookUrl,
        commitSha: before.commitSha,
        fetchImpl,
      });
      rollbackDeployId = rollback.deployId;
      await waitForRuntimeCommit({
        baseUrl,
        expectedCommitSha: before.commitSha,
        fetchImpl,
        timeoutMs,
        intervalMs,
        sleepImpl,
      });
    } catch (rollbackError) {
      const deploymentMessage =
        deploymentError instanceof Error ? deploymentError.message : 'unknown deployment error';
      const rollbackMessage =
        rollbackError instanceof Error ? rollbackError.message : 'unknown rollback error';
      throw new Error(
        `Deployment failed and recovery failed. deployment=${deploymentMessage}; recovery=${rollbackMessage}`,
      );
    }

    return {
      status: 'RECOVERED',
      releaseSha: release,
      previousSha: before.commitSha,
      deployId,
      rollbackDeployId,
      failure:
        deploymentError instanceof Error ? deploymentError.message : 'unknown deployment error',
    };
  }
}

function appendSummary(result) {
  const path = process.env.GITHUB_STEP_SUMMARY;
  if (!path) return;
  const lines = [
    '## MCF staging deployment',
    '',
    `- Status: \`${result.status}\``,
    `- Release SHA: \`${result.releaseSha}\``,
    `- Previous SHA: \`${result.previousSha}\``,
    `- Deploy ID: \`${result.deployId ?? 'not-returned'}\``,
    `- Recovery deploy ID: \`${result.rollbackDeployId ?? 'not-required'}\``,
    '',
  ];
  process.stdout.write(`::notice::${lines.join(' ')}\n`);
}

async function main() {
  const result = await orchestrateStagingDeployment({
    runtimeUrl: process.env.MCF_RUNTIME_URL ?? '',
    deployHookUrl: process.env.RENDER_DEPLOY_HOOK_URL ?? '',
    releaseSha: process.env.RELEASE_SHA ?? '',
    timeoutMs: positiveInteger(
      process.env.DEPLOY_TIMEOUT_MS,
      defaultTimeoutMs,
      'DEPLOY_TIMEOUT_MS',
    ),
    intervalMs: positiveInteger(
      process.env.DEPLOY_POLL_INTERVAL_MS,
      defaultIntervalMs,
      'DEPLOY_POLL_INTERVAL_MS',
    ),
  });

  console.info(
    JSON.stringify({
      event: 'mcf_staging_deployment_finished',
      status: result.status,
      releaseSha: result.releaseSha,
      previousSha: result.previousSha,
      deployId: result.deployId,
      rollbackDeployId: result.rollbackDeployId,
    }),
  );
  appendSummary(result);

  if (result.status === 'RECOVERED') {
    process.exitCode = 1;
  }
}

const invokedDirectly =
  typeof process.argv[1] === 'string' && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  await main();
}
