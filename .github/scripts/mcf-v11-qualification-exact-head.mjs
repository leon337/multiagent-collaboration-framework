const candidate = process.env.MCF_CANDIDATE_SHA?.trim();

if (!candidate) {
  throw new Error('MCF_CANDIDATE_SHA is required');
}

process.env.GITHUB_SHA = candidate;
await import('./mcf-v11-qualification.mjs');
