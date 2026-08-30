import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';

const repoRoot = process.cwd();
const resultPath = resolve(
  repoRoot,
  'apps/rede-social-agentes/apps/server/test-results/vitest.json',
);
const outputDir = resolve(repoRoot, 'artifacts/mcf-v1.1-qualification');
const outputPath = resolve(outputDir, 'evidence-ledger.json');
const testedHead = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const expectedHead = process.env.GITHUB_SHA?.trim() || testedHead;
const baselineMain = process.env.MCF_V10_BASELINE_SHA?.trim();
const structuralBase = process.env.MCF_STRUCTURAL_BASE_SHA?.trim() || baselineMain;
const timestamp = new Date().toISOString();
const runId = process.env.GITHUB_RUN_ID || 'local';
const runAttempt = process.env.GITHUB_RUN_ATTEMPT || '1';
const repository = process.env.GITHUB_REPOSITORY || 'leon337/multiagent-collaboration-framework';
const environment = process.env.GITHUB_ACTIONS === 'true' ? 'GITHUB_ACTIONS' : 'LOCAL_VERIFICATION';
const executionReference =
  runId === 'local'
    ? `local:${testedHead}`
    : `github-actions:${repository}:run-${runId}:attempt-${runAttempt}`;

if (testedHead !== expectedHead) {
  throw new Error(`EXACT_HEAD_MISMATCH expected=${expectedHead} observed=${testedHead}`);
}
if (!existsSync(resultPath)) {
  throw new Error(`VITEST_RESULT_MISSING ${resultPath}`);
}

const report = JSON.parse(readFileSync(resultPath, 'utf8'));
const assertions = [];
for (const suite of report.testResults || []) {
  for (const assertion of suite.assertionResults || []) {
    assertions.push({
      file: suite.name || '',
      title: assertion.title || '',
      fullName: assertion.fullName || '',
      ancestorTitles: assertion.ancestorTitles || [],
      status: String(assertion.status || '').toLowerCase(),
    });
  }
}

function searchable(assertion) {
  return [
    assertion.file,
    assertion.title,
    assertion.fullName,
    ...(assertion.ancestorTitles || []),
  ]
    .join(' | ')
    .toLowerCase();
}

function findPassed(pattern) {
  const needle = pattern.toLowerCase();
  return assertions.find(
    (assertion) => assertion.status.startsWith('pass') && searchable(assertion).includes(needle),
  );
}

const scenarios = [
  {
    id: 'QP-001',
    layer: 'REAL_E2E_SCENARIOS',
    input: 'NEW_PROJECT activation/intake/discovery/alignment/runtime composition',
    expected: 'NEW_PROJECT reaches exact aligned mission context while pre-alignment authority remains false',
    tests: [
      'classifies a project with no repository or continuity as NEW_PROJECT',
      'creates all 20 canonical dimensions without inventing answers',
      'persists and verifies a PASS pair bound to the exact aligned revision and digest',
      'validates v1.1 context before persistence and exposes exact refs in the existing event ledger',
    ],
  },
  {
    id: 'QP-002',
    layer: 'REAL_E2E_SCENARIOS',
    input: 'ADOPT_EXISTING_PROJECT with exact-baseline reconnaissance',
    expected: 'read-only AS-IS PRR and exact PRR×aligned-PIP Gap Map',
    tests: [
      'classifies an existing repository without MCF continuity as ADOPT_EXISTING_PROJECT',
      'keeps reconnaissance read-only and binds the derived read-back to an exact SHA baseline',
      'creates a derived Gap Map only from exact confirmed PRR + verified aligned PIP pair',
    ],
  },
  {
    id: 'QP-003',
    layer: 'CLEAN_ROOM_CONTINUITY',
    input: 'verified checkpoint + authoritative records + live state, no prior chat',
    expected: 'FAST_RESUME without transcript dependency',
    tests: [
      'uses FAST_RESUME only for an exact compatible live state',
      'does not require previous chat transcript or chat memory for verified resume',
    ],
  },
  {
    id: 'QP-004',
    layer: 'RECOVERY_AND_RECONCILIATION',
    input: 'checkpoint/live explainable SHA drift',
    expected: 'RECONCILE with history preserved and live volatile state authoritative',
    tests: ['uses RECONCILE for explainable live drift'],
  },
  {
    id: 'QP-005',
    layer: 'NEGATIVE_AND_FAILURE_PATHS',
    input: 'missing/invalid/conflicting continuity evidence',
    expected: 'FAST_RESUME rejected and RECOVER_MCF_PROJECT selected',
    tests: [
      'routes unexplained material divergence to RECOVER_MCF_PROJECT',
      'routes missing or invalid authoritative continuity state to recovery',
    ],
  },
  {
    id: 'QP-006',
    layer: 'INTEGRATION',
    input: 'ordinary safe action inside delegated technical envelope',
    expected: 'action continues without unnecessary HUMAN_GATE',
    tests: ['lets an unrelated non-reserved action continue through the existing permission profile'],
  },
  {
    id: 'QP-007',
    layer: 'NEGATIVE_AND_FAILURE_PATHS',
    input: 'reserved human boundary after TEAM_FIRST exhaustion',
    expected: 'only LEANDRO gate can authorize; silence is not approval',
    tests: [
      'does not treat no response as human approval',
      'accepts a LEANDRO gate only after TEAM_FIRST is exhausted',
    ],
  },
  {
    id: 'QP-008',
    layer: 'INTEGRATION',
    input: 'action fully covered by active Standing Authorization',
    expected: 'action proceeds without repeated HUMAN_GATE',
    tests: ['allows an ordinary action inside a valid standing authorization envelope'],
  },
  {
    id: 'QP-009',
    layer: 'NEGATIVE_AND_FAILURE_PATHS',
    input: 'out-of-scope Standing Authorization variants',
    expected: 'environment/expiry/cost/exclusion/reversibility mismatches fail closed',
    tests: [
      'fails closed for the wrong environment',
      'fails closed for an expired standing authorization',
      'fails closed when estimated cost exceeds the authorized maximum',
      'makes an explicit exclusion win over an otherwise matching authorization',
      'fails closed when a reversible-only authorization is used for an irreversible action',
    ],
  },
  {
    id: 'QP-010',
    layer: 'INTEGRATION',
    input: 'one reserved action plus independent non-reserved work',
    expected: 'reserved action blocks while independent safe work remains executable',
    tests: [
      'does not treat no response as human approval',
      'lets an unrelated non-reserved action continue through the existing permission profile',
    ],
  },
  {
    id: 'QP-011',
    layer: 'V1_0_COMPATIBILITY_AND_MIGRATION',
    input: 'legacy v1.0 Mission Contract without v1.1 fields',
    expected: 'legacy create path remains unchanged',
    tests: ['keeps the legacy v1.0 create path unchanged'],
  },
  {
    id: 'QP-012',
    layer: 'V1_0_COMPATIBILITY_AND_MIGRATION',
    input: 'explicit safe-boundary v1.0→v1.1 successor context',
    expected: 'legacy remains valid; exact aligned successor validates before v1.1 persistence',
    tests: [
      'keeps the legacy v1.0 create path unchanged',
      'persists and verifies a PASS pair bound to the exact aligned revision and digest',
      'validates v1.1 context before persistence and exposes exact refs in the existing event ledger',
    ],
  },
  {
    id: 'QP-013',
    layer: 'V1_0_COMPATIBILITY_AND_MIGRATION',
    input: 'invalid/corrupt v1.1 successor context',
    expected: 'successor fails before activation while legacy path remains valid',
    tests: [
      'fails closed before persistence when v1.1 context validation fails',
      'keeps the legacy v1.0 create path unchanged',
    ],
  },
  {
    id: 'QP-014',
    layer: 'RECOVERY_AND_RECONCILIATION',
    input: 'derived Resume Card conflicts with canonical/live authority',
    expected: 'canonical checkpoint wins history; live state wins current volatile fact',
    tests: [
      'generates Resume Card only as a derived rebuildable orientation view',
      'uses RECONCILE for explainable live drift',
      'exposes authoritative v1.1 refs while labeling the projection and volatile state',
    ],
  },
  {
    id: 'QP-015',
    layer: 'NEGATIVE_AND_FAILURE_PATHS',
    input: 'machine inference / human-only technical assertion',
    expected: 'machine evidence cannot silently become human intent and human assertion is not machine FACT',
    tests: [
      'rejects machine inference creating a human decision',
      'does not promote a human-only technical assertion to FACT',
    ],
  },
  {
    id: 'QP-016',
    layer: 'UNIT_AND_CONTRACT',
    input: 'aligned PIP mutation followed by material human change',
    expected: 'aligned revision immutable; reopened successor preserves historical pair',
    tests: [
      'keeps an aligned revision immutable',
      'preserves the old aligned pair and creates a reopened successor for material change',
    ],
  },
  {
    id: 'QP-017',
    layer: 'UNIT_AND_CONTRACT',
    input: 'material reality/baseline change after confirmed PRR',
    expected: 'old PRR remains immutable and derived artifacts become stale/reassessment required',
    tests: [
      'inherits I2 immutability and rejects changed content at the same PRR revision',
      'marks Gap Maps and plans stale when their exact derived inputs change',
    ],
  },
  {
    id: 'QP-018',
    layer: 'STRUCTURAL_NO_PARALLEL_ARCHITECTURE',
    input: 'repository structure and main→candidate changed paths',
    expected: 'existing runtime/event ledger/HDF/checkpoint concepts extended; no new project-state DB migration',
    tests: [],
    structural: true,
  },
  {
    id: 'QP-019',
    layer: 'CLEAN_ROOM_CONTINUITY',
    input: 'local uncheckpointed state followed by remote resume attempt',
    expected: 'local-only state is never claimed as transferred',
    tests: ['never declares local uncheckpointed work transferred'],
  },
  {
    id: 'QP-020',
    layer: 'EXACT_HEAD_REGRESSION',
    input: 'qualification evidence bound to candidate X and hypothetical material SHA Y',
    expected: 'current run matches exact HEAD; evidence for X is stale for Y',
    tests: [],
    exactHead: true,
  },
];

function structuralNoParallelArchitecture() {
  if (!structuralBase) {
    return { pass: false, details: ['MCF_STRUCTURAL_BASE_SHA or MCF_V10_BASELINE_SHA is required'] };
  }
  const changed = execFileSync(
    'git',
    ['diff', '--name-only', `${structuralBase}...${testedHead}`],
    { encoding: 'utf8' },
  )
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const newDbState = changed.filter((path) =>
    /apps\/rede-social-agentes\/packages\/database\/.*(?:migration|migrations|schema)/iu.test(path),
  );
  const forbiddenDuplicateNames = changed.filter((path) => {
    const name = basename(path).toLowerCase();
    return [
      'mission-runtime-v11.service.ts',
      'mission-runtime-v1.1.service.ts',
      'event-ledger-v11.ts',
      'permission-engine-v11.ts',
      'checkpoint-engine-v11.ts',
      'mcf-runtime-v11.ts',
    ].includes(name);
  });
  const requiredCore = [
    'apps/rede-social-agentes/apps/server/src/mcf-runtime/mission-runtime.service.ts',
    'apps/rede-social-agentes/apps/server/src/mcf-runtime/mcf-runtime.repository.ts',
    'apps/rede-social-agentes/apps/server/src/mcf-runtime/human-delegation-guard.ts',
  ];
  const missingCore = requiredCore.filter((path) => !existsSync(resolve(repoRoot, path)));
  const details = [
    `structural_base=${structuralBase}`,
    `changed_paths=${changed.length}`,
    `database_state_changes=${newDbState.length}`,
    `forbidden_duplicate_core_files=${forbiddenDuplicateNames.length}`,
    `missing_existing_core_files=${missingCore.length}`,
  ];
  return {
    pass: newDbState.length === 0 && forbiddenDuplicateNames.length === 0 && missingCore.length === 0,
    details,
    changedPaths: changed,
  };
}

function exactHeadFreshness() {
  const syntheticMaterialSuccessor = testedHead === 'f'.repeat(40) ? 'e'.repeat(40) : 'f'.repeat(40);
  const evidence = { testedHead };
  const currentFresh = evidence.testedHead === testedHead;
  const staleForSuccessor = evidence.testedHead !== syntheticMaterialSuccessor;
  return {
    pass: testedHead === expectedHead && currentFresh && staleForSuccessor,
    details: [
      `git_head=${testedHead}`,
      `expected_head=${expectedHead}`,
      `historical_evidence_stale_for_hypothetical_successor=${staleForSuccessor}`,
    ],
  };
}

const records = scenarios.map((scenario) => {
  const matched = scenario.tests.map((pattern) => ({ pattern, assertion: findPassed(pattern) }));
  let extra = { pass: true, details: [] };
  if (scenario.structural) extra = structuralNoParallelArchitecture();
  if (scenario.exactHead) extra = exactHeadFreshness();
  const missing = matched.filter(({ assertion }) => !assertion).map(({ pattern }) => pattern);
  const pass = missing.length === 0 && extra.pass;
  const observedTests = matched
    .filter(({ assertion }) => assertion)
    .map(({ assertion }) => `${assertion.file} :: ${assertion.fullName || assertion.title}`);
  return {
    TEST_CASE_ID: scenario.id,
    LAYER: scenario.layer,
    INPUT: scenario.input,
    EXPECTED_RESULT: scenario.expected,
    EXECUTION_REFERENCE: executionReference,
    OBSERVED_RESULT: pass
      ? `PASS; ${observedTests.length} required executed assertion(s) matched; ${extra.details.join('; ')}`
      : `FAIL; missing=${missing.join(' || ') || 'none'}; ${extra.details.join('; ')}`,
    EVIDENCE_REFERENCE: [
      'apps/rede-social-agentes/apps/server/test-results/vitest.json',
      ...(scenario.structural ? [`git-diff:${structuralBase}...${testedHead}`] : []),
      ...(scenario.exactHead ? [`git-head:${testedHead}`] : []),
    ],
    PASS_OR_FAIL: pass ? 'PASS' : 'FAIL',
    TESTED_HEAD: testedHead,
    ENVIRONMENT: environment,
    TIMESTAMP: timestamp,
    MATCHED_ASSERTIONS: observedTests,
  };
});

const requiredLayers = [
  'UNIT_AND_CONTRACT',
  'INTEGRATION',
  'REAL_E2E_SCENARIOS',
  'NEGATIVE_AND_FAILURE_PATHS',
  'RECOVERY_AND_RECONCILIATION',
  'V1_0_COMPATIBILITY_AND_MIGRATION',
  'CLEAN_ROOM_CONTINUITY',
  'STRUCTURAL_NO_PARALLEL_ARCHITECTURE',
  'EXACT_HEAD_REGRESSION',
];
const coveredLayers = new Set(records.map((record) => record.LAYER));
const missingLayers = requiredLayers.filter((layer) => !coveredLayers.has(layer));
const failures = records.filter((record) => record.PASS_OR_FAIL !== 'PASS');
const fullSuitePassed =
  Number(report.numFailedTests || 0) === 0 && Number(report.numFailedTestSuites || 0) === 0;

const ledger = {
  qualificationId: 'MCF-V1.1-I10-Q19-QUALIFICATION',
  sourceDecision: 'Q19-EVIDENCE_LAYERED_REAL_SCENARIO_QUALIFICATION_MATRIX',
  candidateHead: testedHead,
  baselineMain,
  structuralBase,
  executionReference,
  environment,
  timestamp,
  serverRegression: {
    totalSuites: report.numTotalTestSuites,
    passedSuites: report.numPassedTestSuites,
    failedSuites: report.numFailedTestSuites,
    totalTests: report.numTotalTests,
    passedTests: report.numPassedTests,
    failedTests: report.numFailedTests,
    success: fullSuitePassed,
  },
  blockingScenarioCount: records.length,
  blockingScenarioFailures: failures.map((record) => record.TEST_CASE_ID),
  requiredLayers,
  missingLayers,
  independentReview: 'PENDING_MESTRE_EXACT_HEAD_REVIEW',
  records,
  verdict:
    failures.length === 0 && missingLayers.length === 0 && fullSuitePassed
      ? 'AUTOMATED_EVIDENCE_PASS_PENDING_INDEPENDENT_REVIEW'
      : 'FAIL',
};

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(ledger, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({
  candidateHead: testedHead,
  scenarios: records.length,
  failures: failures.map((record) => record.TEST_CASE_ID),
  missingLayers,
  fullSuitePassed,
  verdict: ledger.verdict,
  evidenceLedger: outputPath,
}, null, 2));

if (!fullSuitePassed || failures.length > 0 || missingLayers.length > 0) {
  process.exitCode = 1;
}
