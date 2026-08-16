import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const reportPath = resolve(
  root,
  'apps/rede-social-agentes/apps/server/test-results/vitest.json',
);
const ledgerPath = resolve(root, 'artifacts/mcf-v1.1-qualification/evidence-ledger.json');
const report = JSON.parse(readFileSync(reportPath, 'utf8'));
const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'));

const requiredDedicatedScenarios = new Map([
  ['QP-001', 'QP-001 NEW_PROJECT end-to-end controlled scenario'],
  ['QP-002', 'QP-002 ADOPT_EXISTING_PROJECT controlled incomplete repository scenario'],
  ['QP-003', 'QP-003 RESUME_MCF_PROJECT FAST_RESUME clean-room scenario'],
  ['QP-010', 'QP-010 pending HUMAN_GATE blocks only the affected action scenario'],
  ['QP-012', 'QP-012 v1.0 to v1.1 explicit safe-boundary upgrade scenario'],
  ['QP-013', 'QP-013 migration failure preserves original compatibility scenario'],
  ['QP-014', 'QP-014 source-authority precedence preserves canonical history and live volatile state'],
  ['QP-019', 'QP-019 local-only transfer negative clean-room scenario'],
]);

const assertions = [];
for (const suite of report.testResults || []) {
  for (const assertion of suite.assertionResults || []) {
    assertions.push({
      file: suite.name || '',
      title: assertion.title || '',
      fullName: assertion.fullName || '',
      status: String(assertion.status || '').toLowerCase(),
    });
  }
}

const missing = [];
for (const [scenarioId, title] of requiredDedicatedScenarios) {
  const assertion = assertions.find(
    (candidate) =>
      candidate.status.startsWith('pass') &&
      (candidate.title === title || candidate.fullName.includes(title)),
  );
  if (!assertion) {
    missing.push(`${scenarioId}:${title}`);
    continue;
  }
  const record = ledger.records.find((candidate) => candidate.TEST_CASE_ID === scenarioId);
  if (!record) {
    missing.push(`${scenarioId}:ledger-record-missing`);
    continue;
  }
  record.OBSERVED_RESULT = 'PASS; dedicated controlled scenario executed on exact candidate HEAD';
  record.EVIDENCE_REFERENCE = [
    'apps/rede-social-agentes/apps/server/test-results/vitest.json',
  ];
  record.MATCHED_ASSERTIONS = [
    `${assertion.file} :: ${assertion.fullName || assertion.title}`,
  ];
  record.PASS_OR_FAIL = 'PASS';
  record.TESTED_HEAD = ledger.candidateHead;
}

if (missing.length > 0) {
  console.error(JSON.stringify({ missingDedicatedScenarioEvidence: missing }, null, 2));
  process.exit(1);
}

ledger.dedicatedScenarioValidation = {
  required: [...requiredDedicatedScenarios.keys()],
  validated: [...requiredDedicatedScenarios.keys()],
  status: 'PASS',
};
ledger.blockingScenarioFailures = ledger.records
  .filter((record) => record.PASS_OR_FAIL !== 'PASS')
  .map((record) => record.TEST_CASE_ID);
if (ledger.blockingScenarioFailures.length > 0) {
  ledger.verdict = 'FAIL';
} else {
  ledger.verdict = 'AUTOMATED_EVIDENCE_PASS_PENDING_INDEPENDENT_REVIEW';
}
writeFileSync(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`, 'utf8');
console.log(
  JSON.stringify(
    {
      dedicatedScenarios: requiredDedicatedScenarios.size,
      missing: [],
      candidateHead: ledger.candidateHead,
      verdict: ledger.verdict,
    },
    null,
    2,
  ),
);
