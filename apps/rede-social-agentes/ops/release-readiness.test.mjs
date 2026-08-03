import assert from 'node:assert/strict';
import test from 'node:test';

import { validateReleaseEnvironment } from './release-readiness.mjs';

const validEnvironment = {
  RSA_SERVER_IMAGE:
    'ghcr.io/leon337/rsa-server@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  RSA_WEB_IMAGE:
    'ghcr.io/leon337/rsa-web@sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  DATABASE_URL: 'postgresql://rsa:secret@db.example.net:5432/rsa?sslmode=require',
  RATE_LIMIT_KEY_SECRET: 'a-strong-production-secret-with-40-characters',
  PUBLIC_BASE_URL: 'https://agents.example.net',
  BACKUP_EXTERNAL_LOCATION: 's3://rsa-backups/production',
  ALERT_CHANNEL_ID: 'ops-critical',
  RESTORE_TEST_EVIDENCE: 'restore-2026-08-01-pass',
  RESTORE_TEST_AT: '2026-08-01T12:00:00.000Z',
  CANARY_PERCENT: '5',
  RELEASE_SHA: '1234567890abcdef1234567890abcdef12345678',
  ROLLBACK_RELEASE_SHA: 'abcdef1234567890abcdef1234567890abcdef12',
  ROLLOUT_CONFIRMATION: 'CANARY_ONLY',
  ROLLBACK_PLAN_REFERENCE: 'docs/runbooks/RSA-ROLLBACK.md',
};

test('accepts a complete immutable canary configuration', () => {
  const result = validateReleaseEnvironment(validEnvironment, new Date('2026-08-03T12:00:00.000Z'));

  assert.deepEqual(result, {
    ready: true,
    errors: [],
    canaryPercent: 5,
    releaseSha: '1234567890abcdef1234567890abcdef12345678',
  });
});

test('rejects mutable images, weak infrastructure and an oversized rollout', () => {
  const result = validateReleaseEnvironment(
    {
      ...validEnvironment,
      RSA_SERVER_IMAGE: 'ghcr.io/leon337/rsa-server:latest',
      DATABASE_URL: 'postgresql://rsa:secret@localhost:5432/rsa?sslmode=disable',
      RATE_LIMIT_KEY_SECRET: 'change-me',
      PUBLIC_BASE_URL: 'http://agents.example.net',
      BACKUP_EXTERNAL_LOCATION: './var/backups',
      RESTORE_TEST_AT: '2026-07-01T00:00:00.000Z',
      CANARY_PERCENT: '50',
      ROLLOUT_CONFIRMATION: 'FULL_ROLLOUT',
    },
    new Date('2026-08-03T12:00:00.000Z'),
  );

  assert.equal(result.ready, false);
  assert.deepEqual(result.errors, [
    'SERVER_IMAGE_NOT_IMMUTABLE',
    'DATABASE_TLS_NOT_READY',
    'RATE_LIMIT_SECRET_NOT_READY',
    'PUBLIC_HTTPS_NOT_READY',
    'EXTERNAL_BACKUP_NOT_READY',
    'RESTORE_TEST_EXPIRED',
    'CANARY_PERCENT_INVALID',
    'CANARY_CONFIRMATION_MISSING',
  ]);
});

test('does not expose secret values in gate errors', () => {
  const secret = 'extremely-sensitive-value-that-must-not-leak';
  const result = validateReleaseEnvironment(
    {
      ...validEnvironment,
      RATE_LIMIT_KEY_SECRET: secret,
      ALERT_CHANNEL_ID: '',
    },
    new Date('2026-08-03T12:00:00.000Z'),
  );

  assert.equal(JSON.stringify(result).includes(secret), false);
  assert.deepEqual(result.errors, ['ALERT_CHANNEL_NOT_READY']);
});
