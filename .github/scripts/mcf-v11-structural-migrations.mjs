import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// QP-018 forbids a second project-state DB. This exact migration is a
// read-only observational runtime table, not an alternative PIP/project store.
// All other DB migrations, including modified bytes here, remain blocked.
export const OBSERVATIONAL_RUNTIME_MIGRATION =
  "apps/rede-social-agentes/packages/database/migrations/0032_mcf_autonomy_continuations.sql";
export const OBSERVATIONAL_RUNTIME_MIGRATION_SHA256 =
  "45744040e3100a922107ca478d766eaa89e408beb26d6327c3fe9f94bdcc6a71";

export function classifyStructuralDatabaseChanges(
  changed,
  repoRoot,
  read = readFileSync,
) {
  const dbPaths = changed.filter((path) =>
    /apps\/rede-social-agentes\/packages\/database\/.*(?:migration|migrations|schema)/iu.test(
      path,
    ),
  );
  const exemptedRuntimeObservations = [];
  const forbiddenDatabaseStateChanges = [];
  for (const path of dbPaths) {
    if (path === OBSERVATIONAL_RUNTIME_MIGRATION) {
      let content = null;
      try {
        content = read(resolve(repoRoot, path));
      } catch {
        // Cannot verify the pinned bytes: fail closed.
      }
      const digest = content
        ? createHash("sha256").update(content).digest("hex")
        : null;
      if (digest === OBSERVATIONAL_RUNTIME_MIGRATION_SHA256) {
        exemptedRuntimeObservations.push(path);
        continue;
      }
    }
    forbiddenDatabaseStateChanges.push(path);
  }
  return { exemptedRuntimeObservations, forbiddenDatabaseStateChanges };
}
