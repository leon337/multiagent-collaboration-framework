import type {
  McfCapabilityGapReport,
  McfProjectBootstrapPlan,
  McfProjectBootstrapRequest,
  McfProjectBootstrapTask,
} from '@rsa/contracts';

function task(
  id: string,
  phase: McfProjectBootstrapTask['phase'],
  skillId: string,
  dependsOn: string[],
  status: McfProjectBootstrapTask['status'],
  gate: string | null,
  exitCriteria: string[],
  rationale: string,
): McfProjectBootstrapTask {
  return {
    id,
    phase,
    skill_id: skillId,
    depends_on: dependsOn,
    status,
    gate,
    exit_criteria: exitCriteria,
    rationale,
  };
}

export class McfProjectBootstrapPlanner {
  plan(
    request: McfProjectBootstrapRequest,
    capabilityGaps: McfCapabilityGapReport,
    now: string = new Date().toISOString(),
  ): McfProjectBootstrapPlan {
    if (capabilityGaps.project_id !== request.project_id) {
      throw new Error('PROJECT_BOOTSTRAP_CAPABILITY_SCOPE_MISMATCH');
    }
    const generatedAt = new Date(now);
    if (!Number.isFinite(generatedAt.getTime())) {
      throw new Error('PROJECT_BOOTSTRAP_CLOCK_INVALID');
    }

    const provisionRequirement = capabilityGaps.requirements.find(
      (item) => item.capability_id === 'mcf.google.cloud.provision',
    );
    const provisionCapabilityReady = provisionRequirement?.status === 'READY';
    const provisionRequired = request.requirements.some(
      (item) => item.capability_id === 'mcf.google.cloud.provision',
    );
    const hasBlockingGaps = capabilityGaps.requirements.some(
      (item) => item.status === 'MISSING' || item.status === 'BLOCKED',
    );
    const hasVerificationGaps = capabilityGaps.requirements.some(
      (item) => item.status === 'NEEDS_VERIFICATION',
    );

    let provisioningStatus: McfProjectBootstrapTask['status'] = provisionRequired ? 'READY' : 'SKIPPED';
    let provisioningGate: string | null = null;
    let provisioningRationale = provisionRequired
      ? 'Provision only the explicitly requested and allowlisted provider resources.'
      : 'No Google Cloud provisioning requirement was declared; do not create cloud resources.';
    if (provisionRequired && request.external_actions_authorized !== true) {
      provisioningStatus = 'BLOCKED';
      provisioningGate = 'EXTERNAL_ACTION_AUTHORIZATION';
      provisioningRationale = 'External provisioning requires explicit mission-scoped authorization.';
    } else if (provisionRequired && request.paid_services_required === true && request.allow_paid_services !== true) {
      provisioningStatus = 'BLOCKED';
      provisioningGate = 'BILLING_APPROVAL_REQUIRED';
      provisioningRationale = 'The project requires paid services, but billing was not explicitly authorized.';
    } else if (provisionRequired && !provisionCapabilityReady) {
      provisioningStatus = 'BLOCKED';
      provisioningGate = 'GOOGLE_CLOUD_PROVISION_CAPABILITY_NOT_READY';
      provisioningRationale = 'The required Google Cloud provisioning capability is missing, blocked or not live-verified.';
    }

    const implementationStatus: McfProjectBootstrapTask['status'] = 'READY';
    const localValidationStatus: McfProjectBootstrapTask['status'] = 'READY';
    const e2eStatus: McfProjectBootstrapTask['status'] =
      provisioningStatus === 'BLOCKED' || hasBlockingGaps || hasVerificationGaps
        ? 'BLOCKED'
        : 'READY';
    const e2eGate =
      e2eStatus === 'BLOCKED'
        ? provisioningGate ?? (hasBlockingGaps ? 'CAPABILITY_GAP_RESOLUTION' : 'LIVE_PROVIDER_VERIFICATION')
        : null;

    const releaseStatus: McfProjectBootstrapTask['status'] = e2eStatus === 'READY' ? 'READY' : 'BLOCKED';
    const deploymentStatus: McfProjectBootstrapTask['status'] =
      request.production_requested !== true
        ? 'SKIPPED'
        : request.production_authorized === true && releaseStatus === 'READY'
          ? 'READY'
          : 'BLOCKED';
    const deploymentGate =
      deploymentStatus === 'BLOCKED'
        ? request.production_authorized === true ? 'RELEASE_VALIDATION_REQUIRED' : 'PRODUCTION_AUTHORIZATION'
        : null;
    const closeoutStatus: McfProjectBootstrapTask['status'] =
      releaseStatus === 'READY' && deploymentStatus !== 'BLOCKED' ? 'READY' : 'BLOCKED';

    const tasks: McfProjectBootstrapTask[] = [
      task(
        'bootstrap-01-context',
        'DISCOVERY',
        'MCF-RECOVER-CONTEXT',
        [],
        'READY',
        null,
        ['canonical_project_identity_verified', 'current_state_and_blockers_reconciled'],
        'Recover authoritative project context before making design or infrastructure decisions.',
      ),
      task(
        'bootstrap-02-product',
        'DISCOVERY',
        'MCF-DEFINE-PRODUCT',
        ['bootstrap-01-context'],
        'READY',
        null,
        ['problem_and_users_defined', 'acceptance_criteria_recorded', 'non_goals_recorded'],
        'Turn the project request into a bounded product brief and measurable outcomes.',
      ),
      task(
        'bootstrap-03-capability-gaps',
        'GAP_ANALYSIS',
        'MCF-CAPABILITY-GAP-ANALYSIS',
        ['bootstrap-01-context', 'bootstrap-02-product'],
        'READY',
        null,
        ['required_capabilities_mapped', 'missing_connections_and_gates_identified'],
        'Compare project requirements with registered capabilities, scope, authorization and live evidence.',
      ),
      task(
        'bootstrap-04-architecture',
        'DESIGN',
        'MCF-DESIGN-ARCHITECTURE',
        ['bootstrap-02-product', 'bootstrap-03-capability-gaps'],
        'READY',
        null,
        ['architecture_decisions_recorded', 'threat_model_and_data_flows_reviewed'],
        'Choose the smallest architecture that closes the capability gaps without duplicating MCF runtime primitives.',
      ),
      task(
        'bootstrap-05-provisioning',
        'PROVISIONING',
        'MCF-GOOGLE-CLOUD-PROVISION',
        ['bootstrap-03-capability-gaps', 'bootstrap-04-architecture'],
        provisioningStatus,
        provisioningGate,
        ['resources_match_approved_scope', 'billing_state_verified_unlinked', 'secrets_stored_owner_only'],
        provisioningRationale,
      ),
      task(
        'bootstrap-06-implementation',
        'IMPLEMENTATION',
        'MCF-IMPLEMENT-CHANGE',
        ['bootstrap-04-architecture'],
        implementationStatus,
        null,
        ['implementation_matches_acceptance_criteria', 'changes_are_committed_and_traceable'],
        'Implement the product independently of external provisioning so local work can continue safely.',
      ),
      task(
        'bootstrap-07-local-validation',
        'VALIDATION',
        'MCF-RUN-TESTS',
        ['bootstrap-06-implementation'],
        localValidationStatus,
        null,
        ['unit_and_integration_tests_pass', 'build_and_typecheck_pass'],
        'Prove local correctness before attempting external end-to-end validation.',
      ),
      task(
        'bootstrap-08-security-review',
        'VALIDATION',
        'MCF-SECURITY-REVIEW',
        ['bootstrap-04-architecture', 'bootstrap-06-implementation'],
        'READY',
        null,
        ['secrets_and_permissions_reviewed', 'threats_and_residual_risks_documented'],
        'Review identity, least privilege, secret handling, external actions and failure recovery.',
      ),
      task(
        'bootstrap-09-end-to-end',
        'VALIDATION',
        'MCF-RUN-TESTS',
        ['bootstrap-05-provisioning', 'bootstrap-07-local-validation', 'bootstrap-08-security-review'],
        e2eStatus,
        e2eGate,
        ['provider_calls_verified', 'ambiguous_outcomes_reconciled', 'business_state_reaches_acceptance_target'],
        'Run real-provider E2E only after provisioning and live capability evidence are ready.',
      ),
      task(
        'bootstrap-10-release',
        'RELEASE',
        'MCF-GIT-PR-RELEASE',
        ['bootstrap-07-local-validation', 'bootstrap-08-security-review', 'bootstrap-09-end-to-end'],
        releaseStatus,
        releaseStatus === 'READY' ? null : e2eGate ?? 'END_TO_END_VALIDATION_REQUIRED',
        ['reviewed_pull_request', 'ci_green', 'release_evidence_recorded'],
        'Create a reviewable release candidate; merge and deploy remain separate authorization boundaries.',
      ),
      task(
        'bootstrap-11-deployment',
        'DEPLOYMENT',
        'MCF-DEPLOY-VALIDATE',
        ['bootstrap-10-release'],
        deploymentStatus,
        deploymentGate,
        ['production_authorization_bound_to_exact_sha', 'health_and_readiness_verified'],
        request.production_requested === true
          ? 'Production is requested and must be authorized independently for the exact SHA.'
          : 'Production deployment is intentionally skipped; a validated staging/dev deliverable is the target.',
      ),
      task(
        'bootstrap-12-closeout',
        'CLOSEOUT',
        'MCF-CLOSE-PHASE',
        ['bootstrap-10-release', 'bootstrap-11-deployment'],
        closeoutStatus,
        closeoutStatus === 'READY' ? null : 'OPEN_BLOCKERS_MUST_BE_EVIDENCED_OR_ASSIGNED',
        ['all_requirements_have_evidence_or_named_blocker', 'no_orphaned_tasks', 'handoff_and_runbook_complete'],
        'Close only after every requirement is evidenced or has an explicit owner and unblock condition.',
      ),
    ];

    return {
      schema_version: 1,
      generated_at: generatedAt.toISOString(),
      project_id: request.project_id,
      project_name: request.project_name,
      objective: request.objective,
      environment: request.environment,
      read_only: true,
      evidence_only: true,
      execution_started: false,
      summary: {
        total_tasks: tasks.length,
        ready: tasks.filter((item) => item.status === 'READY').length,
        blocked: tasks.filter((item) => item.status === 'BLOCKED').length,
        skipped: tasks.filter((item) => item.status === 'SKIPPED').length,
        requires_human_gates: tasks.filter((item) => item.gate !== null).length,
      },
      capability_gaps: capabilityGaps,
      tasks,
    };
  }
}
