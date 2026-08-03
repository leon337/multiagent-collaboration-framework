/* global console, process */

import { pathToFileURL } from 'node:url';

const immutableImagePattern = /^[a-z0-9][a-z0-9._/:@-]*@sha256:[a-f0-9]{64}$/u;
const commitPattern = /^[a-f0-9]{40}$/u;
const externalBackupPattern = /^(?:s3|gs|az|https):\/\//u;
const forbiddenSecretFragments = [
  'change-me',
  'example',
  'placeholder',
  'smoke-only',
  'local-only',
];
const maximumRestoreAgeMs = 8 * 24 * 60 * 60 * 1000;

function addError(errors, code, condition) {
  if (condition) {
    errors.push(code);
  }
}

function validDatabaseUrl(value) {
  try {
    const url = new URL(value);
    const protocolIsValid = url.protocol === 'postgres:' || url.protocol === 'postgresql:';
    const database = url.pathname.replace(/^\//u, '');
    const sslMode = url.searchParams.get('sslmode');
    return (
      protocolIsValid &&
      Boolean(url.hostname && url.username && database) &&
      ['require', 'verify-ca', 'verify-full'].includes(sslMode ?? '')
    );
  } catch {
    return false;
  }
}

function validPublicUrl(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password &&
      !url.hash
    );
  } catch {
    return false;
  }
}

function validSecret(value) {
  const normalized = value.toLowerCase();
  return (
    value.length >= 32 &&
    !forbiddenSecretFragments.some((fragment) => normalized.includes(fragment))
  );
}

function validRecentRestore(value, now) {
  const restoredAt = new Date(value);
  const timestamp = restoredAt.getTime();
  if (!Number.isFinite(timestamp)) {
    return false;
  }
  const age = now.getTime() - timestamp;
  return age >= 0 && age <= maximumRestoreAgeMs;
}

export function validateReleaseEnvironment(env, now = new Date()) {
  const errors = [];
  const serverImage = env.RSA_SERVER_IMAGE ?? '';
  const webImage = env.RSA_WEB_IMAGE ?? '';
  const releaseSha = env.RELEASE_SHA ?? '';
  const rollbackReleaseSha = env.ROLLBACK_RELEASE_SHA ?? '';
  const canaryPercent = Number(env.CANARY_PERCENT);

  addError(errors, 'SERVER_IMAGE_NOT_IMMUTABLE', !immutableImagePattern.test(serverImage));
  addError(errors, 'WEB_IMAGE_NOT_IMMUTABLE', !immutableImagePattern.test(webImage));
  addError(errors, 'DATABASE_TLS_NOT_READY', !validDatabaseUrl(env.DATABASE_URL ?? ''));
  addError(errors, 'RATE_LIMIT_SECRET_NOT_READY', !validSecret(env.RATE_LIMIT_KEY_SECRET ?? ''));
  addError(errors, 'PUBLIC_HTTPS_NOT_READY', !validPublicUrl(env.PUBLIC_BASE_URL ?? ''));
  addError(
    errors,
    'EXTERNAL_BACKUP_NOT_READY',
    !externalBackupPattern.test(env.BACKUP_EXTERNAL_LOCATION ?? ''),
  );
  addError(errors, 'ALERT_CHANNEL_NOT_READY', (env.ALERT_CHANNEL_ID ?? '').trim().length < 3);
  addError(
    errors,
    'RESTORE_EVIDENCE_NOT_READY',
    (env.RESTORE_TEST_EVIDENCE ?? '').trim().length < 8,
  );
  addError(errors, 'RESTORE_TEST_EXPIRED', !validRecentRestore(env.RESTORE_TEST_AT ?? '', now));
  addError(
    errors,
    'CANARY_PERCENT_INVALID',
    !Number.isInteger(canaryPercent) || canaryPercent < 1 || canaryPercent > 10,
  );
  addError(errors, 'RELEASE_SHA_INVALID', !commitPattern.test(releaseSha));
  addError(
    errors,
    'ROLLBACK_RELEASE_SHA_INVALID',
    !commitPattern.test(rollbackReleaseSha) || rollbackReleaseSha === releaseSha,
  );
  addError(errors, 'CANARY_CONFIRMATION_MISSING', env.ROLLOUT_CONFIRMATION !== 'CANARY_ONLY');
  addError(errors, 'ROLLBACK_PLAN_MISSING', (env.ROLLBACK_PLAN_REFERENCE ?? '').trim().length < 8);

  return {
    ready: errors.length === 0,
    errors,
    canaryPercent: Number.isInteger(canaryPercent) ? canaryPercent : null,
    releaseSha: commitPattern.test(releaseSha) ? releaseSha : null,
  };
}

async function main() {
  const result = validateReleaseEnvironment(process.env);
  console.info(
    JSON.stringify({
      event: 'release_readiness_evaluated',
      ready: result.ready,
      errors: result.errors,
      canaryPercent: result.canaryPercent,
      releaseSha: result.releaseSha,
    }),
  );
  if (!result.ready) {
    process.exitCode = 1;
  }
}

const invokedDirectly =
  typeof process.argv[1] === 'string' && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  await main();
}
