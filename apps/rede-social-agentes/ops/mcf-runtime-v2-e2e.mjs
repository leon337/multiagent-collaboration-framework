/* global console, fetch */

import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import process from 'node:process';

const requiredEnvironment = [
  'MCF_RUNTIME_URL',
  'MCF_RUNTIME_TOKEN',
  'GITHUB_REPOSITORY',
  'GITHUB_RUN_ID',
  'GITHUB_RUN_ATTEMPT',
  'GITHUB_SHA',
  'GITHUB_WORKFLOW',
];

for (const name of requiredEnvironment) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

const baseUrl = process.env.MCF_RUNTIME_URL.replace(/\/$/u, '');
const repository = process.env.GITHUB_REPOSITORY;
const targetSha = process.env.GITHUB_SHA;
const summaryPath = process.env.GITHUB_STEP_SUMMARY;
let sessionToken = '';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function summarize(lines) {
  if (!summaryPath) return;
  appendFileSync(summaryPath, `${lines.join('\n')}\n`, 'utf8');
}

async function request(path, { method = 'GET', body, token = sessionToken, headers = {} } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  return { response, data, text };
}

async function requireSuccess(path, options = {}) {
  const result = await request(path, options);
  if (!result.response.ok) {
    throw new Error(
      `${options.method ?? 'GET'} ${path} failed (${result.response.status}): ${result.text}`,
    );
  }
  return result.data;
}

function assertPending(result, skillId) {
  assert(result.selectedSkill?.skillId === skillId, `${skillId}: wrong selected skill`);
  assert(result.evidenceStatus === 'PENDING', `${skillId}: expected PENDING evidence`);
  assert(result.phaseState === 'WAITING_EVIDENCE', `${skillId}: expected WAITING_EVIDENCE`);
  assert(result.mission?.state === 'WAITING_EXTERNAL', `${skillId}: expected WAITING_EXTERNAL`);
  assert(result.receipt === null, `${skillId}: external receipt must not be fabricated`);
  assert(result.handoffTo === null, `${skillId}: pending phase must not create a handoff`);
}

async function executePhase(missionId, version, payload) {
  return requireSuccess(`/v1/mcf/missions/${missionId}/phases/execute`, {
    method: 'POST',
    body: { ...payload, expectedMissionVersion: version },
  });
}

async function dispatchFullMission() {
  const requestedSkills = [
    'MCF-START-MISSION',
    'MCF-SELECT-AGENTS',
    'MCF-IMPLEMENT-CHANGE',
    'MCF-REVIEW-CODE',
    'MCF-RUN-TESTS',
    'MCF-GIT-PR-RELEASE',
    'MCF-DEPLOY-VALIDATE',
    'MCF-TRACE-MISSION',
  ];
  const dispatch = await requireSuccess('/v1/mcf/chat/dispatch', {
    method: 'POST',
    body: {
      objective:
        'Implementar, revisar, testar, integrar, validar deploy em staging e registrar o trace final.',
      expectedOutcome:
        'As oito skills são reconhecidas e o runtime preserva evidência, gates e conclusão causal.',
      repository,
      sourceOfTruth: [
        'skills/registry.yaml',
        'docs/decisions/MCF-DEC-057-EXPANSAO-DE-SKILLS-EXECUTAVEIS-E-RECIBOS-SEMANTICOS.md',
      ],
      requestedRiskClass: 'B',
      requestedSkills,
    },
  });

  assert(dispatch.humanActionRequired === false, 'Bridge requested routine human action');
  assert(dispatch.mission?.state === 'EXECUTING', 'Dispatch mission must be EXECUTING');
  assert(dispatch.internalExecutions?.length === 2, 'Expected two initial internal executions');
  assert(
    dispatch.internalExecutions.every((entry) => entry.evidenceStatus === 'VALID'),
    'Initial internal evidence must be valid',
  );
  assert(
    requestedSkills.every((skillId) => dispatch.mission.contract.selectedSkills.includes(skillId)),
    'Mission contract does not contain all eight executable skills',
  );
  assert(
    dispatch.plan.some(
      (step) => step.skillId === 'MCF-TRACE-MISSION' && step.state === 'PLANNED_INTERNAL',
    ),
    'Trace must remain planned after the initial internal block',
  );
  return dispatch;
}

async function proveExternalWaitingStates(dispatch) {
  const missionId = dispatch.mission.id;
  let version = dispatch.mission.version;
  const phases = {};

  const cases = [
    {
      skillId: 'MCF-IMPLEMENT-CHANGE',
      agentId: 'Rafael',
      inputs: {
        approved_scope: ['staging-e2e'],
        acceptance_criteria: ['runtime preserves pending evidence state'],
        repository,
        authorizedScope: true,
      },
      tool: { provider: 'github', operation: 'code-change', resource: repository },
    },
    {
      skillId: 'MCF-REVIEW-CODE',
      agentId: 'Vinicius',
      inputs: { diff_or_commit: targetSha },
      tool: { provider: 'github', operation: 'inspect-code', resource: repository },
    },
    {
      skillId: 'MCF-RUN-TESTS',
      agentId: 'Renato',
      inputs: {
        acceptance_criteria: ['pnpm verify passes'],
        test_target: `main@${targetSha}`,
        authorizedScope: true,
      },
      tool: { provider: 'github-actions', operation: 'workflow-result', resource: repository },
    },
    {
      skillId: 'MCF-GIT-PR-RELEASE',
      agentId: 'Gabriel',
      inputs: {
        repository,
        branch: 'main',
        acceptance_state: 'ci-green-gate-required',
        authorizedScope: true,
      },
      tool: { provider: 'github', operation: 'pull-request', resource: repository },
    },
    {
      skillId: 'MCF-DEPLOY-VALIDATE',
      agentId: 'Bruno',
      inputs: {
        artifact_or_commit: targetSha,
        target_environment: 'staging',
        authorizedScope: true,
      },
      tool: {
        provider: 'render',
        operation: 'deploy-validate',
        resource: 'mcf-runtime-staging-api',
      },
    },
  ];

  for (const testCase of cases) {
    const result = await executePhase(missionId, version, testCase);
    assertPending(result, testCase.skillId);
    phases[testCase.skillId] = result.phaseId;
    version = result.mission.version;
  }

  const blockedProduction = await request(`/v1/mcf/missions/${missionId}/phases/execute`, {
    method: 'POST',
    body: {
      skillId: 'MCF-DEPLOY-VALIDATE',
      agentId: 'Bruno',
      inputs: {
        artifact_or_commit: targetSha,
        target_environment: 'production',
        authorizedScope: true,
      },
      tool: {
        provider: 'render',
        operation: 'deploy-validate',
        resource: 'mcf-runtime-production-api',
      },
      expectedMissionVersion: version,
    },
  });
  assert(
    blockedProduction.response.status === 403,
    'Production deploy without gate must return 403',
  );
  assert(
    blockedProduction.data?.code === 'MCF_PERMISSION_DENIED',
    'Production deploy returned an unexpected error code',
  );

  return { missionId, version, phases };
}

function runFoundationVerification() {
  const verification = spawnSync('pnpm', ['verify'], {
    cwd: 'apps/rede-social-agentes',
    env: process.env,
    stdio: 'inherit',
  });
  return verification.status === 0;
}

async function completeRunTestsPhase(state, verifySucceeded) {
  const completedAt = new Date().toISOString();
  const callbackPayload = {
    missionId: state.missionId,
    phaseId: state.phases['MCF-RUN-TESTS'],
    workflowName: process.env.GITHUB_WORKFLOW,
    workflowRunId: process.env.GITHUB_RUN_ID,
    repository,
    commitSha: targetSha,
    conclusion: verifySucceeded ? 'success' : 'failure',
    completedAt,
  };
  const headers = {
    'x-mcf-runtime-token': process.env.MCF_RUNTIME_TOKEN,
    'x-correlation-id': `mcf-runtime-v2-${process.env.GITHUB_RUN_ID}`,
  };

  const primary = await requireSuccess('/v1/mcf/callbacks/github-actions', {
    method: 'POST',
    body: callbackPayload,
    token: '',
    headers,
  });
  assert(primary.duplicate === false, 'Primary callback must not be duplicate');
  if (verifySucceeded) {
    assert(primary.evidenceStatus === 'VALID', 'Successful callback evidence must be VALID');
    assert(primary.missionState === 'EXECUTING', 'CI callback must not complete the mission');
  }

  const duplicate = await requireSuccess('/v1/mcf/callbacks/github-actions', {
    method: 'POST',
    body: callbackPayload,
    token: '',
    headers,
  });
  assert(duplicate.duplicate === true, 'Repeated callback must be duplicate');
  if (verifySucceeded) {
    assert(duplicate.missionState === 'EXECUTING', 'Duplicate callback changed mission lifecycle');
  }

  assert(verifySucceeded, 'pnpm verify failed; failure callback was recorded');
}

async function proveIncompleteMissionCannotClose(state) {
  const current = await requireSuccess(`/v1/mcf/missions/${state.missionId}`);
  assert(current.state === 'EXECUTING', 'Mission must be EXECUTING after successful CI callback');

  const trace = await executePhase(state.missionId, current.version, {
    skillId: 'MCF-TRACE-MISSION',
    agentId: 'Augusto',
    inputs: {
      mission_execution: { missionId: state.missionId, checkpoint: 'post-ci' },
      final_checkpoint: true,
    },
    tool: {
      provider: 'internal',
      operation: 'inspect-mission',
      resource: state.missionId,
    },
  });
  assert(trace.evidenceStatus === 'VALID', 'Trace evidence must be valid');
  assert(trace.phaseState === 'COMPLETED', 'Trace phase must complete');
  assert(
    trace.mission.state === 'EXECUTING',
    'Mission with incomplete external skills must not become COMPLETED',
  );

  const timeline = await requireSuccess(`/v1/mcf/missions/${state.missionId}/timeline`);
  const completedSkills = new Set(
    timeline.events
      .filter((event) => event.eventType === 'PHASE_COMPLETED')
      .map((event) => event.payload?.skillId)
      .filter((skillId) => typeof skillId === 'string'),
  );
  assert(completedSkills.has('MCF-START-MISSION'), 'Start phase completion missing');
  assert(completedSkills.has('MCF-SELECT-AGENTS'), 'Selection phase completion missing');
  assert(completedSkills.has('MCF-RUN-TESTS'), 'Run-tests phase completion missing');
  assert(completedSkills.has('MCF-TRACE-MISSION'), 'Trace phase completion missing');
  assert(
    !completedSkills.has('MCF-IMPLEMENT-CHANGE'),
    'Pending implementation was marked complete',
  );
  assert(!completedSkills.has('MCF-REVIEW-CODE'), 'Pending review was marked complete');
  assert(!completedSkills.has('MCF-GIT-PR-RELEASE'), 'Pending PR was marked complete');
  assert(!completedSkills.has('MCF-DEPLOY-VALIDATE'), 'Pending deploy was marked complete');

  return { traceMission: trace.mission, timeline, completedSkills };
}

async function proveInternalOnlyMissionCanClose() {
  const dispatch = await requireSuccess('/v1/mcf/chat/dispatch', {
    method: 'POST',
    body: {
      objective: 'Planejar e registrar um checkpoint interno verificável.',
      expectedOutcome: 'Missão interna concluída pelo trace final do próprio bridge.',
      requestedRiskClass: 'A',
      requestedSkills: ['MCF-START-MISSION', 'MCF-SELECT-AGENTS', 'MCF-TRACE-MISSION'],
    },
  });

  assert(dispatch.internalExecutions.length === 3, 'Expected three internal executions');
  assert(
    dispatch.internalExecutions.every((entry) => entry.evidenceStatus === 'VALID'),
    'Internal-only mission contains invalid evidence',
  );
  assert(
    dispatch.internalExecutions.map((entry) => entry.skillId).join(',') ===
      'MCF-START-MISSION,MCF-SELECT-AGENTS,MCF-TRACE-MISSION',
    'Internal-only mission executed an unexpected skill order',
  );
  assert(
    dispatch.mission.state === 'COMPLETED',
    'Internal-only mission did not complete in the bridge final trace',
  );
  return dispatch.mission;
}

async function main() {
  const email = `mcf-v2-e2e-${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT}@example.test`;
  const password = `${randomBytes(36).toString('base64url')}Aa1!`;

  await requireSuccess('/v1/accounts', {
    method: 'POST',
    token: '',
    body: { email, password, displayName: 'MCF Runtime V2 E2E' },
  });
  const session = await requireSuccess('/v1/sessions', {
    method: 'POST',
    token: '',
    body: { email, password },
  });
  assert(typeof session.token === 'string' && session.token.length > 0, 'Session token missing');
  sessionToken = session.token;
  console.log(`::add-mask::${sessionToken}`);

  let executionError = null;
  try {
    const dispatch = await dispatchFullMission();
    const pendingState = await proveExternalWaitingStates(dispatch);
    const verifySucceeded = runFoundationVerification();
    await completeRunTestsPhase(pendingState, verifySucceeded);
    const incompleteProof = await proveIncompleteMissionCannotClose(pendingState);
    const completedInternalMission = await proveInternalOnlyMissionCanClose();

    summarize([
      '## MCF Runtime 004 — eight-skill staging E2E',
      '',
      `- Full mission: \`${pendingState.missionId}\``,
      `- Full mission state after final trace: \`${incompleteProof.traceMission.state}\``,
      '- Executable skills recognized: `8`',
      '- Initial internal executions: `2`',
      '- External skills left pending without fabricated receipts: `4`',
      '- CI callback completed only `MCF-RUN-TESTS`: `PASS`',
      '- Duplicate callback idempotency: `PASS`',
      '- Production deployment without material gate: `BLOCKED`',
      `- Internal-only mission: \`${completedInternalMission.id}\``,
      `- Internal-only final state: \`${completedInternalMission.state}\``,
      '- Technical session revoked: pending finalizer',
      '- Verdict: `PASS`',
      '',
    ]);
  } catch (error) {
    executionError = error;
  }

  let revocationError = null;
  if (sessionToken) {
    const revoked = await request('/v1/sessions/current', { method: 'DELETE' });
    if (!revoked.response.ok) {
      revocationError = new Error(
        `Session revocation failed (${revoked.response.status}): ${revoked.text}`,
      );
    } else {
      summarize(['- Technical session revoked: `PASS`', '']);
    }
  }

  if (executionError) throw executionError;
  if (revocationError) throw revocationError;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
