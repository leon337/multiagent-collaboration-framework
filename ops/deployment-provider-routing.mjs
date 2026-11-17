// MCF: pure decision support; NEVER executes a deployment or grants authorization.
// Used by documentation CI and MESTRE runbooks, not the MissionRuntime permission engine.
export const PRIMARY_DEPLOYMENT_SURFACES = Object.freeze({
  sourceOfTruth: 'github/main',
  publicKnowledge: 'github/main',
  api: 'render/rsa-api-free',
  web: 'render/rsa-web-free',
  database: 'verify-runtime-database-url-neon-candidate',
  optionalWeb: 'vercel',
});

const SHA40 = /^[a-f0-9]{40}$/;
const RUNTIME_PREFIXES = [
  'apps/rede-social-agentes/',
  'skills/registry.yaml',
  'skills/backup/MCF-PROJECT-DRIVE-BACKUP.yaml',
  '.github/workflows/mcf-runtime-',
  'render.yaml',
];
const RUNTIME_SKILL_CONTRACT = /^skills\/.*\.ya?ml$/;

export function requiresGovernedRuntimePromotion(changedFiles) {
  if (!Array.isArray(changedFiles) || changedFiles.some((p) => typeof p !== 'string')) {
    throw new TypeError('changedFiles must be an array of repository-relative paths');
  }
  return changedFiles.some(
    (path) => RUNTIME_PREFIXES.some((prefix) => path.startsWith(prefix)) ||
      RUNTIME_SKILL_CONTRACT.test(path),
  );
}

/**
 * Decision only. The result is NOT authorization, provider invocation, or a
 * verified deployment. Never bypass HDF/PermissionEngine based on this result.
 */
export function resolveProviderRoute({
  changedFiles = [],
  exactSha,
  vercelBuildLimited = false,
  renderVerified = false,
  persistedHumanAuthorization = false,
  persistedLeoOperationalGate = false,
} = {}) {
  const runtimeChange = requiresGovernedRuntimePromotion(changedFiles);
  const vercel = vercelBuildLimited ? 'DEGRADED_OPTIONAL_NOT_A_RENDER_GATE' : 'OPTIONAL';
  const shaValid = typeof exactSha === 'string' && SHA40.test(exactSha);
  let runtimePromotion = 'NOT_NEEDED_FOR_DOCUMENT_ONLY_CHANGE';
  if (runtimeChange) {
    runtimePromotion = !shaValid
      ? 'BLOCKED_INVALID_RELEASE_SHA'
      : !renderVerified
        ? 'BLOCKED_RENDER_NOT_VERIFIED'
        : !persistedHumanAuthorization || !persistedLeoOperationalGate
          ? 'BLOCKED_GOVERNED_AUTHORIZATION_REQUIRED'
          : 'ELIGIBLE_FOR_GOVERNED_WORKFLOW_ONLY';
  }
  return {
    knowledgePublication: 'GITHUB_MAIN_AFTER_VERIFIED_MERGE',
    apiProvider: PRIMARY_DEPLOYMENT_SURFACES.api,
    webProvider: PRIMARY_DEPLOYMENT_SURFACES.web,
    databaseRole: 'PERSISTENCE_ONLY_VERIFY_NEON_BINDING',
    vercel,
    runtimePromotion,
    providerMutationExecuted: false,
    productionDeploymentVerified: false,
  };
}
