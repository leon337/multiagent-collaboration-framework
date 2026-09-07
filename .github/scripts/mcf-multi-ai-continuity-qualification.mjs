import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const protocolPath = 'docs/protocols/MCF-PROTOCOLO-CONTINUIDADE-MULTI-IA-V1.2.md';
const schemaPath = 'schemas/mcf-multi-ai-continuity-v1.schema.json';
const validFixturePath = 'schemas/fixtures/mcf-multi-ai-continuity.valid.json';
const invalidFixturePath = 'schemas/fixtures/mcf-multi-ai-continuity.invalid.json';

const GOVERNANCE_STATES = ['NOT_AUTHORIZED', 'AUTHORIZED', 'CANONICALIZATION_PENDING', 'CANONICAL'];
const EVIDENCE_STATES = ['UNVERIFIED', 'IN_PROGRESS', 'PASS', 'FAIL', 'STALE'];
const BOOTSTRAP_STEPS = ['identify project', 'locate registry', 'read project capsule', 'read canonical entrypoints', 'inspect open work', 're-observe live state when required', 'detect stale/conflict', 'open mission contract', 'continue from next executable gate'];
const CHECKPOINT_CLASSES = ['material decision', 'critical FAIL', 'direction change', 'gate', 'external dependency', 'conflict', 'mission close'];
const SOURCE_KINDS = ['remote-git', 'local-repository', 'runtime-probe', 'registry-document', 'open-work', 'remote-head'];

const failures = [];
const pass = (message) => console.log(`PASS ${message}`);
const fail = (message) => failures.push(message);

function readRequired(file) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) return fail(`missing required artifact: ${file}`), null;
  const value = fs.readFileSync(absolute, 'utf8');
  if (!value.trim()) return fail(`empty required artifact: ${file}`), null;
  pass(`artifact exists: ${file}`);
  return value;
}

function parseJson(file, text) {
  if (text == null) return null;
  try { const value = JSON.parse(text); pass(`valid JSON: ${file}`); return value; }
  catch (error) { fail(`invalid JSON ${file}: ${error.message}`); return null; }
}
function assertExactSet(label, actual, expected) {
  const a = [...actual].sort(), e = [...expected].sort();
  if (a.length !== e.length || a.some((v, i) => v !== e[i])) fail(`${label} exact set mismatch`); else pass(`${label} exact set`);
}

function normalizeRepositoryPath(value) {
  if (typeof value !== 'string' || !value || /[\u0000-\u001f\u007f]/u.test(value)) return null;
  const source = value.replaceAll('\\', '/');
  if (source.startsWith('/') || /^[A-Za-z]:/u.test(source) || /^[A-Za-z][A-Za-z0-9+.-]*:/u.test(source)) return null;
  const segments = [];
  for (const segment of source.split('/')) {
    if (!segment || segment === '.') continue;
    if (segment === '..') {
      if (!segments.length) return null;
      segments.pop();
    } else {
      segments.push(segment);
    }
  }
  return segments.length ? segments.join('/') : null;
}

function normalizedFileSetsOverlap(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right)) return false;
  const normalize = values => {
    const result = [];
    for (const value of values) {
      const normalized = normalizeRepositoryPath(value);
      if (normalized === null) return null;
      result.push(normalized);
    }
    return result;
  };
  const a = normalize(left), b = normalize(right);
  return Boolean(a && b && b.some(value => new Set(a).has(value)));
}

function normalizeDomainIdentifier(value) {
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
    try { value = new TextDecoder('utf-8', { fatal: true }).decode(value); }
    catch { return null; }
  }
  if (typeof value !== 'string' || /[\uD800-\uDFFF]/u.test(value)) return null;
  const normalized = value.trim();
  return normalized || null;
}

function normalizedDomainSetsOverlap(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right)) return false;
  const normalize = values => {
    const result = [];
    for (const value of values) {
      const normalized = normalizeDomainIdentifier(value);
      if (normalized === null) return null;
      result.push(normalized);
    }
    return result;
  };
  const a = normalize(left), b = normalize(right);
  return Boolean(a && b && b.some(value => new Set(a).has(value)));
}

function validateAgainstDeliveredSchema(schema, instance) {
  const supported = new Set([
    '$schema', '$id', '$anchor', '$defs', '$ref', 'title', 'description', 'default', 'examples',
    'deprecated', 'readOnly', 'writeOnly', 'type', 'enum', 'const', 'required', 'properties',
    'patternProperties', 'additionalProperties', 'minProperties', 'maxProperties',
    'dependentRequired', 'items', 'prefixItems', 'minItems', 'maxItems', 'uniqueItems',
    'contains', 'minContains', 'maxContains', 'minLength', 'maxLength', 'pattern',
    'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf',
    'allOf', 'anyOf', 'oneOf', 'not', 'if', 'then', 'else'
  ]);
  const equal = (left, right) => {
    if (Object.is(left, right)) return true;
    if (!left || !right || typeof left !== 'object' || typeof right !== 'object' ||
        Array.isArray(left) !== Array.isArray(right)) return false;
    const keys = Object.keys(left);
    return keys.length === Object.keys(right).length &&
      keys.every(key => Object.hasOwn(right, key) && equal(left[key], right[key]));
  };
  const resolve = ref => {
    if (ref === '#') return schema;
    if (typeof ref !== 'string' || !ref.startsWith('#/')) return null;
    let node = schema;
    for (const raw of ref.slice(2).split('/')) {
      const key = raw.replaceAll('~1', '/').replaceAll('~0', '~');
      if (!node || typeof node !== 'object' || !Object.hasOwn(node, key)) return null;
      node = node[key];
    }
    return node;
  };
  const schemaValid = (node, ancestors = new Set()) => {
    if (typeof node === 'boolean') return true;
    if (!node || typeof node !== 'object' || Array.isArray(node) || ancestors.has(node)) return false;
    if (Object.keys(node).some(key => !supported.has(key))) return false;
    if (node.$ref !== undefined && resolve(node.$ref) === null) return false;
    const next = new Set(ancestors).add(node);
    for (const key of ['$defs', 'properties', 'patternProperties']) {
      if (node[key] !== undefined && (!node[key] || typeof node[key] !== 'object' ||
          Array.isArray(node[key]) || Object.values(node[key]).some(child => !schemaValid(child, next)))) return false;
    }
    for (const key of ['additionalProperties', 'items', 'contains', 'not', 'if', 'then', 'else'])
      if (node[key] !== undefined && !schemaValid(node[key], next)) return false;
    for (const key of ['prefixItems', 'allOf', 'anyOf', 'oneOf'])
      if (node[key] !== undefined && (!Array.isArray(node[key]) ||
          node[key].some(child => !schemaValid(child, next)))) return false;
    return node.required === undefined ||
      (Array.isArray(node.required) && node.required.every(value => typeof value === 'string'));
  };
  const validate = (node, value, active = new Set()) => {
    if (typeof node === 'boolean') return node;
    if (active.has(node)) return false;
    const next = new Set(active).add(node);
    if (node.$ref !== undefined && !validate(resolve(node.$ref), value, next)) return false;
    const types = node.type === undefined ? null : Array.isArray(node.type) ? node.type : [node.type];
    const hasType = type => type === 'null' ? value === null :
      type === 'array' ? Array.isArray(value) :
      type === 'object' ? value !== null && typeof value === 'object' && !Array.isArray(value) :
      type === 'integer' ? Number.isInteger(value) :
      type === 'number' ? typeof value === 'number' && Number.isFinite(value) :
      typeof value === type;
    if (types && (!types.length ||
        types.some(type => !['null', 'boolean', 'object', 'array', 'number', 'integer', 'string'].includes(type)) ||
        !types.some(hasType))) return false;
    if (node.const !== undefined && !equal(value, node.const)) return false;
    if (node.enum !== undefined && (!Array.isArray(node.enum) || !node.enum.some(item => equal(item, value)))) return false;
    if (typeof value === 'string') {
      const length = [...value].length;
      if ((node.minLength !== undefined && length < node.minLength) ||
          (node.maxLength !== undefined && length > node.maxLength)) return false;
      try { if (node.pattern !== undefined && !new RegExp(node.pattern, 'u').test(value)) return false; }
      catch { return false; }
    }
    if (typeof value === 'number' && (
      (node.minimum !== undefined && value < node.minimum) ||
      (node.maximum !== undefined && value > node.maximum) ||
      (node.exclusiveMinimum !== undefined && value <= node.exclusiveMinimum) ||
      (node.exclusiveMaximum !== undefined && value >= node.exclusiveMaximum) ||
      (node.multipleOf !== undefined && (!Number.isFinite(node.multipleOf) || node.multipleOf <= 0 ||
        Math.abs(value / node.multipleOf - Math.round(value / node.multipleOf)) > Number.EPSILON))
    )) return false;
    if (Array.isArray(value)) {
      if ((node.minItems !== undefined && value.length < node.minItems) ||
          (node.maxItems !== undefined && value.length > node.maxItems) ||
          (node.uniqueItems && value.some((item, index) => value.slice(0, index).some(other => equal(item, other))))) return false;
      if (node.prefixItems)
        for (let index = 0; index < Math.min(value.length, node.prefixItems.length); index++)
          if (!validate(node.prefixItems[index], value[index], next)) return false;
      if (node.items !== undefined) {
        const start = node.prefixItems?.length ?? 0;
        for (let index = start; index < value.length; index++)
          if (!validate(node.items, value[index], next)) return false;
      }
      if (node.contains !== undefined) {
        const count = value.filter(item => validate(node.contains, item, next)).length;
        if (count < (node.minContains ?? 1) || (node.maxContains !== undefined && count > node.maxContains)) return false;
      }
    }
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const keys = Object.keys(value);
      if ((node.minProperties !== undefined && keys.length < node.minProperties) ||
          (node.maxProperties !== undefined && keys.length > node.maxProperties) ||
          node.required?.some(key => !Object.hasOwn(value, key))) return false;
      for (const [key, child] of Object.entries(node.properties ?? {}))
        if (Object.hasOwn(value, key) && !validate(child, value[key], next)) return false;
      for (const [pattern, child] of Object.entries(node.patternProperties ?? {})) {
        let expression;
        try { expression = new RegExp(pattern, 'u'); } catch { return false; }
        for (const key of keys) if (expression.test(key) && !validate(child, value[key], next)) return false;
      }
      const covered = key => Object.hasOwn(node.properties ?? {}, key) ||
        Object.keys(node.patternProperties ?? {}).some(pattern => new RegExp(pattern, 'u').test(key));
      if (node.additionalProperties !== undefined)
        for (const key of keys) if (!covered(key) && !validate(node.additionalProperties, value[key], next)) return false;
      for (const [key, dependencies] of Object.entries(node.dependentRequired ?? {}))
        if (Object.hasOwn(value, key) &&
            (!Array.isArray(dependencies) || dependencies.some(required => !Object.hasOwn(value, required)))) return false;
    }
    if (node.allOf?.some(child => !validate(child, value, next))) return false;
    if (node.anyOf && !node.anyOf.some(child => validate(child, value, next))) return false;
    if (node.oneOf && node.oneOf.filter(child => validate(child, value, next)).length !== 1) return false;
    if (node.not !== undefined && validate(node.not, value, next)) return false;
    if (node.if !== undefined) {
      const branch = validate(node.if, value, next) ? node.then : node.else;
      if (branch !== undefined && !validate(branch, value, next)) return false;
    }
    return true;
  };
  const stateEnumsAgree = candidate => Object.entries(candidate?.properties ?? {}).every(([name, stateSchema]) => {
    if (!name.endsWith('_states')) return true;
    const enumValues = candidate?.$defs?.[`${name.slice(0, -7)}State`]?.enum;
    const prefixItems = stateSchema?.prefixItems;
    return Array.isArray(enumValues) && Array.isArray(prefixItems) &&
      enumValues.length === prefixItems.length &&
      prefixItems.every((item, index) => Object.hasOwn(item ?? {}, 'const') && item.const === enumValues[index]);
  });
  return schemaValid(schema) && stateEnumsAgree(schema) && validate(schema, instance);
}


function protocolArtifactSemanticAgreement(text, schema) {
  const claims = ['chat memory is non-authoritative.', 'Human approval never implies evidence `PASS`.',
    '`CANONICAL` is allowed only after persistence and objective verification of that persisted state.',
    'A required dimension with zero applicable bindings cannot `PASS`;', 'all bindings current for the same evaluation',
    "Each publication attempt freshly acquires exactly one remote-head and one open-work observation and binds both exact IDs to that publication's `evaluation_id`.",
    'The delivered `publication` object MUST contain `prior_publication_history = { complete: true, observation_ids: [...] }`.',
    'If authoritative history is unavailable, omitted, unknown, or cannot establish `complete=true`, publication fails closed.',
    'Neither current remote-head nor open-work `observation_id` may appear in `prior_publication_history.observation_ids`, regardless of `reused`.',
    "Each current operand requires exactly `timing_policy='FRESH_ON_ATTEMPT'`, `fresh=true`, and `reused=false`.",
    'Timestamps and wall-clock age do not determine publication freshness.',
    'Remote-head publication qualification is `EQUAL` only:',
    'Publication fails closed on missing/incomplete operands, stale/reused remote-head or open-work observations, wrong operand IDs, cross-evaluation or mixed-evaluation operands, remote-head inequality, domain overlap, or normalized file overlap.'];
  if (typeof text !== 'string' || !claims.every(claim => text.includes(claim)) ||
      /chat memory is authoritative for current operational truth\./iu.test(text) ||
      /Remote-head publication qualification is not `EQUAL` only:/u.test(text)) return false;
  const p = schema?.properties ?? {}, d = schema?.$defs ?? {};
  const exactArray = (node, values) => node?.type === 'array' && node.minItems === values.length && node.maxItems === values.length && node.uniqueItems === true && node.items === false && node.prefixItems?.length === values.length && node.prefixItems.every((item, index) => item?.const === values[index]);
  const exactObject = (node, required) => node?.type === 'object' && node.additionalProperties === false && node.required?.length === required.length && required.every(key => node.required.includes(key));
  return schema?.$schema === 'https://json-schema.org/draft/2020-12/schema' && schema.$id === 'https://mcf.local/schemas/mcf-multi-ai-continuity-v1.schema.json' &&
    exactObject(schema, ['protocol','evaluation_id','governance_states','evidence_states','bootstrap','checkpoints','observations','result','evidence','publication']) &&
    p.protocol?.const === 'MCF-MULTI-AI-CONTINUITY-V1.2' && p.evaluation_id?.$ref === '#/$defs/evaluationId' && exactArray(p.governance_states, GOVERNANCE_STATES) && exactArray(p.evidence_states, EVIDENCE_STATES) && exactArray(p.bootstrap, BOOTSTRAP_STEPS) && exactArray(p.checkpoints, CHECKPOINT_CLASSES) &&
    p.observations?.type === 'array' && p.observations.minItems === 2 && p.observations.uniqueItems === true && p.observations.items?.$ref === '#/$defs/observation' && d.evaluationId?.type === 'string' && d.evaluationId.minLength === 1 && JSON.stringify(d.governanceState?.enum) === JSON.stringify(GOVERNANCE_STATES) && JSON.stringify(d.evidenceState?.enum) === JSON.stringify(EVIDENCE_STATES) &&
    exactObject(d.observation, ['observation_id','evaluation_id','source_kind','timing_policy','timestamp','fresh','reused']) &&
    d.observation.properties?.source_kind?.$ref === '#/$defs/sourceKind' &&
    d.sourceKind?.type === 'string' && JSON.stringify(d.sourceKind.enum) === JSON.stringify(SOURCE_KINDS) &&
    exactObject(d.derivedResult, ['evaluation_id','evaluator_version','operand_ids']) && d.derivedResult.properties?.operand_ids?.minItems === 1 && d.derivedResult.properties.operand_ids.uniqueItems === true &&
    exactObject(d.evidenceEvaluation, ['evaluation_id','required_dimensions','bindings','state']) && d.evidenceEvaluation.properties?.state?.$ref === '#/$defs/evidenceState' &&
    exactObject(d.evidenceBinding, ['dimension','applicable','current','evaluation_id','result']) &&
    exactObject(d.publication, ['evaluation_id','remote_head_observation_id','open_work_observation_id','relation','base','domain_scopes','file_scopes','prior_publication_history']) && d.publication.properties?.relation?.const === 'EQUAL' &&
    d.publication.properties?.domain_scopes?.$ref === '#/$defs/domainScopes' && d.publication.properties?.file_scopes?.$ref === '#/$defs/fileScopes' &&
    d.publication.properties?.prior_publication_history?.$ref === '#/$defs/priorPublicationHistory' &&
    exactObject(d.priorPublicationHistory, ['complete','observation_ids']) && d.priorPublicationHistory.properties?.complete?.const === true &&
    d.priorPublicationHistory.properties?.observation_ids?.type === 'array' && d.priorPublicationHistory.properties?.observation_ids?.uniqueItems === true &&
    d.priorPublicationHistory.properties?.observation_ids?.items?.$ref === '#/$defs/observationId' &&
    exactObject(d.domainScopes, ['candidate','concurrent']) && d.domainScopes.properties?.candidate?.$ref === '#/$defs/domainScope' && d.domainScopes.properties?.concurrent?.$ref === '#/$defs/domainScope' &&
    exactObject(d.fileScopes, ['candidate','concurrent']) && d.fileScopes.properties?.candidate?.$ref === '#/$defs/fileScope' && d.fileScopes.properties?.concurrent?.$ref === '#/$defs/fileScope' &&
    !Object.hasOwn(d, 'scopes');
}

const schemaSemanticAgreement = (schema, validFixture, invalidFixture, optionalSemanticNegative) => {
  const rawValid = fixture => validateAgainstDeliveredSchema(schema, fixture);
  const semanticValid = fixture => {
    const attempt = {
      ...(fixture.publication ?? {}),
      observations: fixture.observations,
      result: fixture.result
    };
    return rawValid(fixture) &&
      fixture.evaluation_id === fixture.result?.evaluation_id &&
      fixture.evaluation_id === fixture.evidence?.evaluation_id &&
      fixture.evaluation_id === fixture.publication?.evaluation_id &&
      derivedValid(fixture.result, fixture.observations) &&
      evidencePass(fixture.evidence, fixture.evaluation_id) &&
      publicationValid(attempt);
  };
  const fixtures = [validFixture, invalidFixture];
  if (optionalSemanticNegative !== undefined) fixtures.push(optionalSemanticNegative);
  return rawValid(validFixture) === true && semanticValid(validFixture) === true &&
    rawValid(invalidFixture) === false && semanticValid(invalidFixture) === false &&
    fixtures.every(fixture => rawValid(fixture) === semanticValid(fixture));
};

function schemaMutationRegressions(schema, validFixture) {
  const defs = schema?.$defs ?? {};
  const exactObject = (node, required) => node?.type === 'object' && node.additionalProperties === false && node.required?.length === required.length && required.every(key => node.required.includes(key));
  if (defs.observation?.type !== 'object' || defs.observation.additionalProperties !== false ||
      !defs.observation.required?.includes('source_kind') || defs.observation.properties?.source_kind?.$ref !== '#/$defs/sourceKind' ||
      defs.sourceKind?.type !== 'string' || JSON.stringify(defs.sourceKind.enum) !== JSON.stringify(SOURCE_KINDS) ||
      defs.publication?.properties?.relation?.const !== 'EQUAL' ||
      defs.publication?.properties?.domain_scopes?.$ref !== '#/$defs/domainScopes' || defs.publication?.properties?.file_scopes?.$ref !== '#/$defs/fileScopes' ||
      defs.publication?.properties?.prior_publication_history?.$ref !== '#/$defs/priorPublicationHistory' ||
      !exactObject(defs.priorPublicationHistory, ['complete','observation_ids']) || defs.priorPublicationHistory.properties?.complete?.const !== true ||
      defs.priorPublicationHistory.properties?.observation_ids?.type !== 'array' || defs.priorPublicationHistory.properties?.observation_ids?.uniqueItems !== true ||
      defs.priorPublicationHistory.properties?.observation_ids?.items?.$ref !== '#/$defs/observationId' ||
      !exactObject(defs.domainScopes, ['candidate','concurrent']) || defs.domainScopes.properties?.candidate?.$ref !== '#/$defs/domainScope' || defs.domainScopes.properties?.concurrent?.$ref !== '#/$defs/domainScope' ||
      !exactObject(defs.fileScopes, ['candidate','concurrent']) || defs.fileScopes.properties?.candidate?.$ref !== '#/$defs/fileScope' || defs.fileScopes.properties?.concurrent?.$ref !== '#/$defs/fileScope' || Object.hasOwn(defs, 'scopes') ||
      JSON.stringify(defs.governanceState?.enum) !== JSON.stringify(GOVERNANCE_STATES) ||
      defs.evaluationId?.type !== 'string' || defs.evaluationId.minLength !== 1 ||
      schema.properties?.observations?.minItems !== 2 ||
      defs.derivedResult?.properties?.operand_ids?.uniqueItems !== true) return false;
  if (!validateAgainstDeliveredSchema(schema, validFixture)) return false;
  const clone = value => structuredClone(value);
  const mutations = [];
  const resolveRef = ref => {
    if (typeof ref !== 'string' || !ref.startsWith('#/$defs/')) return null;
    return ref.slice(2).split('/').reduce((node, token) =>
      node?.[token.replace(/~1/g, '/').replace(/~0/g, '~')], schema);
  };
  const seen = new WeakMap();
  const visit = (node, value, trail = []) => {
    if (!node || typeof node !== 'object' || Array.isArray(node) || value === null || typeof value !== 'object') return;
    let nodes = seen.get(value);
    if (!nodes) seen.set(value, nodes = new WeakSet());
    if (nodes.has(node)) return;
    nodes.add(node);

    const referenced = resolveRef(node.$ref);
    if (referenced) visit(referenced, value, trail);
    for (const keyword of ['allOf', 'anyOf', 'oneOf'])
      for (const branch of node[keyword] ?? []) visit(branch, value, trail);

    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index++) {
        const child = node.prefixItems?.[index] ?? node.items;
        if (child && child !== true) visit(child, value[index], [...trail, index]);
      }
      return;
    }

    for (const [key, child] of Object.entries(node.properties ?? {})) {
      if (!Object.hasOwn(value, key)) continue;
      if (node.required?.includes(key)) {
        const mutation = clone(validFixture);
        let target = mutation;
        for (const part of trail) target = target[part];
        delete target[key];
        mutations.push(mutation);
      }
      visit(child, value[key], [...trail, key]);
    }
  };
  visit(schema, validFixture);
  const protocolMutation = clone(validFixture);
  if (Object.hasOwn(protocolMutation, 'protocol')) {
    protocolMutation.protocol = '__INVALID_PROTOCOL__';
    mutations.push(protocolMutation);
  }
  return mutations.length > 0 && mutations.every(mutation => !validateAgainstDeliveredSchema(schema, mutation));
}

const nonEmpty = value => typeof value === 'string' && value.length > 0;
const immutableIdentity = (before, after) => nonEmpty(before) && before === after;
const observationValid = (observation, original = observation) =>
  immutableIdentity(original.observation_id, observation.observation_id) &&
  immutableIdentity(original.evaluation_id, observation.evaluation_id) &&
  nonEmpty(observation.source_kind) && nonEmpty(observation.timing_policy);

function derivedValid(result, observations, original = result) {
  if (!nonEmpty(result.evaluation_id) ||
      !immutableIdentity(original?.evaluator_version, result.evaluator_version) ||
      !Array.isArray(result.operand_ids) || !result.operand_ids.length) return false;
  const expected = observations.map(o => o.observation_id);
  return observations.every(o => observationValid(o) && o.evaluation_id === result.evaluation_id) &&
    new Set(expected).size === expected.length &&
    new Set(result.operand_ids).size === result.operand_ids.length &&
    result.operand_ids.length === expected.length && expected.every(id => result.operand_ids.includes(id));
}

function evidencePass(evaluation, enclosingEvaluationId = evaluation?.evaluation_id) {
  const dimensions = evaluation?.required_dimensions;
  const bindings = evaluation?.bindings;
  if (!nonEmpty(enclosingEvaluationId) || evaluation?.state !== 'PASS' ||
      evaluation?.evaluation_id !== enclosingEvaluationId || !Array.isArray(dimensions) ||
      !dimensions.length || new Set(dimensions).size !== dimensions.length ||
      !Array.isArray(bindings) || !bindings.length) return false;
  if (bindings.some(binding => binding?.current !== true || binding?.evaluation_id !== enclosingEvaluationId)) return false;
  return dimensions.every(dimension => {
    const applicable = bindings.filter(binding => binding?.dimension === dimension && binding?.applicable === true);
    return applicable.length > 0 && applicable.every(binding => binding.result === 'MATCH');
  });
}

const canonicalState = ({ approved, persisted, verified, evidence }) =>
  approved && persisted && verified && evidencePass(evidence) ? { governance: 'CANONICAL', evidence: 'PASS' } :
    { governance: approved ? 'CANONICALIZATION_PENDING' : 'NOT_AUTHORIZED', evidence: 'UNVERIFIED' };

function publicationValid(attempt) {
  const operands = attempt.observations;
  const history = attempt.prior_publication_history;
  const previouslyUsedObservationIds = history?.observation_ids;
  if (!Array.isArray(operands) || operands.length !== 2 ||
      history?.complete !== true ||
      !Array.isArray(previouslyUsedObservationIds) ||
      previouslyUsedObservationIds.some(id => !nonEmpty(id)) ||
      new Set(previouslyUsedObservationIds).size !== previouslyUsedObservationIds.length ||
      operands.some(observation => previouslyUsedObservationIds.includes(observation.observation_id)) ||
      !derivedValid(attempt.result, operands)) return false;
  const byKind = kind => operands.filter(o => o.source_kind === kind);
  if (byKind('remote-head').length !== 1 || byKind('open-work').length !== 1) return false;
  if (operands.some(o => o.timing_policy !== 'FRESH_ON_ATTEMPT' || o.fresh !== true || o.reused !== false || o.evaluation_id !== attempt.evaluation_id)) return false;
  const remote = byKind('remote-head')[0], open = byKind('open-work')[0];
  const scopesValid = (scopes, normalize) =>
    scopes !== null && typeof scopes === 'object' && !Array.isArray(scopes) &&
    Array.isArray(scopes.candidate) && Array.isArray(scopes.concurrent) &&
    [...scopes.candidate, ...scopes.concurrent].every(value => normalize(value) !== null);
  if (!scopesValid(attempt.domain_scopes, normalizeDomainIdentifier) ||
      !scopesValid(attempt.file_scopes, normalizeRepositoryPath) ||
      normalizedDomainSetsOverlap(attempt.domain_scopes.candidate, attempt.domain_scopes.concurrent) ||
      normalizedFileSetsOverlap(attempt.file_scopes.candidate, attempt.file_scopes.concurrent)) return false;
  if (attempt.remote_head_observation_id !== remote.observation_id ||
      attempt.open_work_observation_id !== open.observation_id) return false;
  if (attempt.persisted_observations !== undefined) {
    const persisted = attempt.persisted_observations;
    if (!Array.isArray(persisted) || persisted.length !== operands.length ||
        persisted.some((observation, index) =>
          observation?.source_kind !== operands[index].source_kind ||
          !observationValid(operands[index], observation))) return false;
  }
  return attempt.result.evaluation_id === attempt.evaluation_id && attempt.relation === 'EQUAL' &&
    nonEmpty(remote.head) && remote.head === attempt.base;
}

function regressions() {
  const check = (label, condition) => condition ? pass(`regression: ${label}`) : fail(`regression failed: ${label}`);
  const exactOrder = (actual, expected) => Array.isArray(actual) && actual.length === expected.length && actual.every((value, index) => value === expected[index]);
  const exactSet = (actual, expected) => Array.isArray(actual) && actual.length === expected.length && new Set(actual).size === actual.length && expected.every(value => actual.includes(value));
  const mutations = (values, substitute) => [
    values.slice(0, -1),
    [...values, 'EXTRA'],
    [...values.slice(0, -1), values[0]],
    [...values.slice(0, -1), substitute]
  ];

  const bootstrapSwaps = [];
  for (let left = 0; left < BOOTSTRAP_STEPS.length; left++) {
    for (let right = left + 1; right < BOOTSTRAP_STEPS.length; right++) {
      const swapped = [...BOOTSTRAP_STEPS];
      [swapped[left], swapped[right]] = [swapped[right], swapped[left]];
      bootstrapSwaps.push(swapped);
    }
  }
  check('bootstrap accepts exact canonical order', exactOrder(BOOTSTRAP_STEPS, ['identify project', 'locate registry', 'read project capsule', 'read canonical entrypoints', 'inspect open work', 're-observe live state when required', 'detect stale/conflict', 'open mission contract', 'continue from next executable gate']));
  check('bootstrap rejects all 36 pairwise swaps', bootstrapSwaps.length === 36 && bootstrapSwaps.every(candidate => !exactOrder(candidate, BOOTSTRAP_STEPS)));
  check('bootstrap rejects missing, extra, duplicate, and substituted steps', mutations(BOOTSTRAP_STEPS, 'read chat memory').every(candidate => !exactOrder(candidate, BOOTSTRAP_STEPS)));

  const stateSetRegressions = (label, actual, expected) => {
    check(`${label} accepts each required value and exact set`, expected.every(value => actual.includes(value)) && exactSet(actual, expected));
    check(`${label} rejects missing, extra, duplicate, and substituted values`, mutations(expected, 'SUBSTITUTED').every(candidate => !exactSet(candidate, expected)));
  };
  stateSetRegressions('governance states', GOVERNANCE_STATES, ['NOT_AUTHORIZED', 'AUTHORIZED', 'CANONICALIZATION_PENDING', 'CANONICAL']);
  stateSetRegressions('evidence states', EVIDENCE_STATES, ['UNVERIFIED', 'IN_PROGRESS', 'PASS', 'FAIL', 'STALE']);
  check('checkpoint classes accept exact set', exactSet(CHECKPOINT_CLASSES, ['material decision', 'critical FAIL', 'direction change', 'gate', 'external dependency', 'conflict', 'mission close']));
  check('checkpoint classes reject missing, extra, substituted, and per-click classes', [
    CHECKPOINT_CLASSES.slice(0, -1),
    [...CHECKPOINT_CLASSES, 'EXTRA'],
    [...CHECKPOINT_CLASSES.slice(0, -1), 'SUBSTITUTED'],
    [...CHECKPOINT_CLASSES, 'per-click']
  ].every(candidate => !exactSet(candidate, CHECKPOINT_CLASSES)));

  const deliveredValidator = typeof validateAgainstDeliveredSchema === 'function' ? validateAgainstDeliveredSchema : null;
  const semanticAgreement = typeof schemaSemanticAgreement === 'function' ? schemaSemanticAgreement : null;
  const mutationRegressions = typeof schemaMutationRegressions === 'function' ? schemaMutationRegressions : null;
  check('delivered schema qualification interfaces exist', Boolean(deliveredValidator && semanticAgreement && mutationRegressions));

  const normalizePath = typeof normalizeRepositoryPath === 'function' ? normalizeRepositoryPath : null;
  const pathOverlap = typeof normalizedFileSetsOverlap === 'function' ? normalizedFileSetsOverlap : null;
  const normalizeDomain = typeof normalizeDomainIdentifier === 'function' ? normalizeDomainIdentifier : null;
  const domainOverlap = typeof normalizedDomainSetsOverlap === 'function' ? normalizedDomainSetsOverlap : null;
  check('normalization contract interfaces exist', normalizePath !== null && pathOverlap !== null && normalizeDomain !== null && domainOverlap !== null);
  if (normalizePath && pathOverlap && normalizeDomain && domainOverlap) {
    const rejectedPaths = [
      '/a/b', 'C:\\a', 'C:/a', '\\\\server\\share', '//server/share',
      'https://host/a', 'file:a', 'a\u0000b', 'a\u001fb',
      '../a', 'a/../../b', '', '.', 'a/..'
    ];
    check('path normalization rejects absolute, rooted, URI, control, root-escape, and empty vectors', rejectedPaths.every(value => normalizePath(value) === null));
    check('path normalization collapses repeated separators', normalizePath('a//b') === 'a/b');
    check('path normalization removes dot segments', normalizePath('a/./b') === 'a/b');
    check('path normalization resolves dot-dot segments', normalizePath('a/x/../b') === 'a/b');
    check('path normalization preserves case', normalizePath('A/b') === 'A/b' && normalizePath('A/b') !== normalizePath('a/b'));
    check('path normalization converts backslashes', normalizePath('a\\b') === 'a/b');
    check('file overlap uses exact canonical identity', pathOverlap(['a//b'], ['a/b']) === true);
    check('file overlap does not infer directory-prefix overlap', pathOverlap(['a'], ['a/b']) === false);

    check('domain normalization trims surrounding whitespace', normalizeDomain(' domain ') === 'domain');
    check('domain normalization rejects empty input', normalizeDomain('') === null);
    check('domain normalization rejects whitespace-only input', normalizeDomain(' \t\r\n ') === null);
    check('domain normalization rejects invalid UTF-8', normalizeDomain(Buffer.from([0xc3, 0x28])) === null);
    check('domain normalization is case-sensitive exact UTF-8', normalizeDomain('Domain') === 'Domain' && normalizeDomain('Domain') !== normalizeDomain('domain'));
    check('domain normalization performs no Unicode normalization', normalizeDomain('\u00e9') === '\u00e9' && normalizeDomain('e\u0301') === 'e\u0301' && normalizeDomain('\u00e9') !== normalizeDomain('e\u0301'));
    check('domain overlap uses exact normalized identity', domainOverlap([' domain '], ['domain']) === true && domainOverlap(['Domain'], ['domain']) === false && domainOverlap(['\u00e9'], ['e\u0301']) === false);
  }

  const obs = (id, kind, extra = {}) => ({ observation_id: id, evaluation_id: 'E1', timestamp: 'same', source_kind: kind, timing_policy: 'FRESH_ON_ATTEMPT', fresh: true, reused: false, ...extra });
  const remote = obs('R1', 'remote-head', { head: 'abc' }), open = obs('O1', 'open-work');
  const result = { evaluation_id: 'E1', evaluator_version: 'v1', operand_ids: ['R1', 'O1'] };
  const attempt = {
    evaluation_id: 'E1',
    observations: [remote, open],
    result,
    relation: 'EQUAL',
    base: 'abc',
    remote_head_observation_id: 'R1',
    open_work_observation_id: 'O1',
    domain_scopes: { candidate: ['continuity'], concurrent: ['project-technical-truth'] },
    file_scopes: { candidate: ['schemas/continuity.json'], concurrent: ['docs/project.md'] },
    prior_publication_history: { complete: true, observation_ids: [] }
  };
  check('immutable non-empty identities', observationValid(remote) && !observationValid({ ...remote, observation_id: 'R2' }, remote) && !observationValid({ ...remote, evaluation_id: 'E2' }, remote) && !observationValid({ ...remote, observation_id: '' }));
  check('timestamps are not identity', !derivedValid({ ...result, operand_ids: ['same', 'same'] }, [remote, open]));
  check('source kind independent from timing policy', observationValid({ ...remote, source_kind: 'runtime-probe', timing_policy: 'durable' }) && observationValid({ ...remote, source_kind: 'remote-head', timing_policy: 'live' }));
  check('derived result exact operands and evaluator', derivedValid(result, [remote, open]) && !derivedValid({ ...result, operand_ids: ['R1'] }, [remote, open]) && !derivedValid({ ...result, operand_ids: ['R1', 'BAD'] }, [remote, open]) && !derivedValid({ ...result, evaluator_version: '' }, [remote, open]) && !derivedValid(result, [remote, { ...open, evaluation_id: 'E2' }]));
  check('reviewer F: evaluator version is immutable against original result',
    !derivedValid({ ...result, evaluator_version: 'v2' }, [remote, open], result));
  const duplicateRemote = { ...remote, observation_id: 'D1' };
  const duplicateOpen = { ...open, observation_id: 'D1' };
  const duplicateUnrelatedResult = { ...result, operand_ids: ['D1', 'UNRELATED'] };
  const duplicateDeduplicatedResult = { ...result, operand_ids: ['D1'] };
  check('review3: duplicate observation identities cannot admit unrelated operand IDs',
    !derivedValid(duplicateUnrelatedResult, [duplicateRemote, duplicateOpen]));
  check('review3: duplicate observation identities cannot satisfy deduplicated exact operand set',
    !derivedValid(duplicateDeduplicatedResult, [duplicateRemote, duplicateOpen]));
  const evidence = { evaluation_id: 'E1', required_dimensions: ['truth', 'scope'], bindings: ['truth', 'scope'].map(d => ({ dimension: d, applicable: true, current: true, evaluation_id: 'E1', result: 'MATCH' })), state: 'PASS' };
  check('required current MATCH evidence', evidencePass(evidence) && !evidencePass({ ...evidence, required_dimensions: [] }) && !evidencePass({ ...evidence, bindings: evidence.bindings.slice(0, 1) }) && !evidencePass({ ...evidence, bindings: evidence.bindings.map(b => ({ ...b, applicable: false })) }));
  check('review1: every applicable required evidence binding must agree', !evidencePass({
    ...evidence,
    bindings: [
      ...evidence.bindings,
      { dimension: 'truth', applicable: true, current: false, evaluation_id: 'OTHER', result: 'MISMATCH' }
    ]
  }));
  check('review2: evidence state must agree with computed PASS',
    !evidencePass({ ...evidence, state: 'FAIL' }, 'E1') &&
    !evidencePass({ ...evidence, state: 'STALE' }, 'E1'));
  check('review2: evidence identity must equal enclosing evaluation',
    !evidencePass({
      ...evidence,
      evaluation_id: 'E2',
      bindings: evidence.bindings.map(binding => ({ ...binding, evaluation_id: 'E2' }))
    }, 'E1'));
  check('approval pending until persisted and verified', canonicalState({ approved: true, persisted: false, verified: false, evidence }).governance === 'CANONICALIZATION_PENDING' && canonicalState({ approved: true, persisted: false, verified: false, evidence }).evidence !== 'PASS');
  check('complete evidence passes', canonicalState({ approved: true, persisted: true, verified: true, evidence }).evidence === 'PASS');
  check('valid publication', publicationValid(attempt));
  const sequentialAttempt = structuredClone(attempt);
  check('reviewer F: sequential publication rejects previously used remote-head ID despite reused=false',
    !publicationValid({ ...sequentialAttempt, prior_publication_history: { complete: true, observation_ids: [remote.observation_id] } }));
  check('reviewer F: sequential publication rejects previously used open-work ID despite reused=false',
    !publicationValid({ ...sequentialAttempt, prior_publication_history: { complete: true, observation_ids: [open.observation_id] } }));
  check('reviewer F: unrelated prior observation IDs do not block fresh publication',
    publicationValid({ ...sequentialAttempt, prior_publication_history: { complete: true, observation_ids: ['PRIOR-UNRELATED'] } }));
  check('reviewer F: publication history is mandatory and complete',
    !publicationValid({ ...attempt, prior_publication_history: undefined }) &&
    !publicationValid({ ...attempt, prior_publication_history: { complete: false, observation_ids: [] } }) &&
    !publicationValid({ ...attempt, prior_publication_history: { complete: true, observation_ids: [''] } }) &&
    !publicationValid({ ...attempt, prior_publication_history: { complete: true, observation_ids: ['P1', 'P1'] } }));
  check('valid publication ignores arbitrary identical timestamps', publicationValid({
    ...attempt,
    observations: [{ ...remote, timestamp: 'arbitrary' }, { ...open, timestamp: 'arbitrary' }]
  }));
  check('publication remote-head requires exact FRESH_ON_ATTEMPT timing policy',
    !publicationValid({ ...attempt, observations: [{ ...remote, timing_policy: 'LIVE' }, open] }));
  check('publication open-work requires exact FRESH_ON_ATTEMPT timing policy',
    !publicationValid({ ...attempt, observations: [remote, { ...open, timing_policy: 'LIVE' }] }));
  check('publication rejects lowercase timing-policy alias',
    !publicationValid({ ...attempt, observations: [{ ...remote, timing_policy: 'fresh-on-attempt' }, open] }));
  check('review1: publication derives normalized overlap despite absent or false flags', !publicationValid({
    ...attempt,
    domain_scopes: { candidate: [' continuity '], concurrent: ['continuity'] },
    file_scopes: { candidate: ['left.txt'], concurrent: ['right.txt'] }
  }) && !publicationValid({
    ...attempt,
    domain_scopes: { candidate: ['left'], concurrent: ['right'] },
    file_scopes: { candidate: ['schemas//continuity.json'], concurrent: ['schemas/continuity.json'] }
  }));
  check('review1: publication fails closed when overlap operands are missing', !publicationValid({
    ...attempt,
    domain_scopes: undefined,
    file_scopes: undefined
  }));
  const referencedAttempt = { ...attempt };
  check('review1: publication binds exact observation IDs',
    !publicationValid({ ...referencedAttempt, remote_head_observation_id: 'BAD' }) &&
    !publicationValid({ ...referencedAttempt, open_work_observation_id: 'BAD' }) &&
    !publicationValid({ ...referencedAttempt, remote_head_observation_id: undefined }));
  check('review1: publication rejects invalid normalized scope operands',
    !publicationValid({ ...attempt, domain_scopes: { candidate: [' '], concurrent: ['right'] }, file_scopes: { candidate: ['left.txt'], concurrent: ['right.txt'] } }) &&
    !publicationValid({ ...attempt, domain_scopes: { candidate: ['left'], concurrent: ['right'] }, file_scopes: { candidate: ['../escape'], concurrent: ['right.txt'] } }));
  check('review1: persisted observation identity mutation fails through qualification path', !publicationValid({
    ...attempt,
    persisted_observations: structuredClone(attempt.observations),
    observations: [{ ...remote, observation_id: 'R2' }, open],
    result: { ...result, operand_ids: ['R2', 'O1'] }
  }));
  for (const relation of [undefined, 'ANCESTOR', 'DESCENDANT', 'DIVERGED', 'UNKNOWN']) check(`publication rejects relation ${String(relation)}`, !publicationValid({ ...attempt, relation }));
  const bad = [
    ['stale remote', [{ ...remote, fresh: false }, open]], ['reused remote', [{ ...remote, reused: true }, open]],
    ['stale open work', [remote, { ...open, fresh: false }]], ['reused open work', [remote, { ...open, reused: true }]],
    ['missing operand', [remote]], ['mixed evaluation', [remote, { ...open, evaluation_id: 'E2' }]]
  ];
  for (const [label, observations] of bad) check(`publication rejects ${label}`, !publicationValid({ ...attempt, observations }));
  check('publication rejects cross evaluation', !publicationValid({ ...attempt, evaluation_id: 'E2' }));
  check('publication rejects wrong/incomplete IDs', !publicationValid({ ...attempt, result: { ...result, operand_ids: ['R1', 'BAD'] } }));
  check('publication rejects head inequality', !publicationValid({ ...attempt, base: 'def' }));
  check('publication rejects overlaps', !publicationValid({
    ...attempt,
    domain_overlap: false,
    domain_scopes: { candidate: [' continuity '], concurrent: ['continuity'] }
  }) && !publicationValid({
    ...attempt,
    file_overlap: false,
    file_scopes: { candidate: ['schemas//continuity.json'], concurrent: ['schemas/continuity.json'] }
  }));
}

function main() {
  const protocolText = readRequired(protocolPath);
  const schemaText = readRequired(schemaPath);
  const validText = readRequired(validFixturePath);
  const invalidText = readRequired(invalidFixturePath);

  if (protocolText) {
    for (const token of [...GOVERNANCE_STATES, ...EVIDENCE_STATES, ...BOOTSTRAP_STEPS, ...CHECKPOINT_CLASSES]) if (!protocolText.includes(token)) fail(`protocol missing token: ${token}`);
    pass('protocol token coverage checked');
  }

  const schema = parseJson(schemaPath, schemaText);
  const validFixture = parseJson(validFixturePath, validText);
  const invalidFixture = parseJson(invalidFixturePath, invalidText);

  if (protocolText && schema) {
    const protocolAgreement = typeof protocolArtifactSemanticAgreement === 'function' ? protocolArtifactSemanticAgreement : null;
    const requireProtocolResult = (label, text, candidateSchema, expected) => {
      if (!protocolAgreement) return fail(`${label}: interface absent`);
      try {
        if (protocolAgreement(text, candidateSchema) === expected) pass(label); else fail(label);
      } catch (error) {
        fail(`${label}: ${error.message}`);
      }
    };
    requireProtocolResult('review2: delivered protocol and schema semantically agree', protocolText, schema, true);
    requireProtocolResult('review2: negated protocol assertion is rejected',
      protocolText.replace('Remote-head publication qualification is `EQUAL` only:', 'Remote-head publication qualification is not `EQUAL` only:'), schema, false);
    requireProtocolResult('review2: contradictory protocol assertion is rejected',
      `${protocolText}\n\nChat memory is authoritative for current operational truth.\n`, schema, false);
    const driftedSchema = structuredClone(schema);
    driftedSchema.$defs.publication.properties.relation.const = 'ANCESTOR';
    delete driftedSchema.$defs.observation.properties.timing_policy;
    requireProtocolResult('review2: broader delivered schema structure drift is rejected', protocolText, driftedSchema, false);
  }

  if (schema && validFixture && invalidFixture) {
    const deliveredValidator = typeof validateAgainstDeliveredSchema === 'function' ? validateAgainstDeliveredSchema : null;
    const semanticAgreement = typeof schemaSemanticAgreement === 'function' ? schemaSemanticAgreement : null;
    const mutationRegressions = typeof schemaMutationRegressions === 'function' ? schemaMutationRegressions : null;
    const requireResult = (label, operation, expected = true) => {
      if (!operation) return fail(`${label}: interface absent`);
      try {
        if (operation() === expected) pass(label); else fail(label);
      } catch (error) {
        fail(`${label}: ${error.message}`);
      }
    };

    requireResult('valid fixture accepted by delivered schema',
      deliveredValidator && (() => deliveredValidator(schema, validFixture)));
    requireResult('invalid fixture rejected by delivered schema',
      deliveredValidator && (() => deliveredValidator(schema, invalidFixture)), false);
    requireResult('schema and semantic decisions agree',
      semanticAgreement && (() => semanticAgreement(schema, validFixture, invalidFixture)));
    requireResult('schema-targeted mutation regressions pass',
      mutationRegressions && (() => mutationRegressions(schema, validFixture)));
    requireResult('reviewer F: delivered schema requires authoritative complete publication history',
      deliveredValidator && (() => {
        const missing = structuredClone(validFixture);
        delete missing.publication.prior_publication_history;
        const incomplete = structuredClone(validFixture);
        incomplete.publication.prior_publication_history.complete = false;
        return !deliveredValidator(schema, missing) && !deliveredValidator(schema, incomplete);
      }));

    requireResult('review1: nested local-$ref required mutation coverage',
      mutationRegressions && (() => {
        const weakenedSchema = structuredClone(schema);
        weakenedSchema.$defs.observation.required =
          weakenedSchema.$defs.observation.required.filter(key => key !== 'source_kind');
        return !mutationRegressions(weakenedSchema, validFixture);
      }));

    requireResult('review2: local-$ref mutations exercise non-required constraints',
      mutationRegressions && (() => {
        const weakenings = [
          candidate => { delete candidate.$defs.sourceKind.enum; },
          candidate => { delete candidate.$defs.publication.properties.relation.const; },
          candidate => { delete candidate.$defs.evaluationId.minLength; },
          candidate => { delete candidate.properties.observations.minItems; },
          candidate => { delete candidate.$defs.derivedResult.properties.operand_ids.uniqueItems; },
          candidate => { delete candidate.$defs.priorPublicationHistory.properties.complete.const; },
          candidate => { delete candidate.$defs.priorPublicationHistory.properties.observation_ids.uniqueItems; },
          candidate => { candidate.$defs.observation.additionalProperties = true; }
        ];
        return weakenings.every(weaken => {
          const weakenedSchema = structuredClone(schema);
          weaken(weakenedSchema);
          return !mutationRegressions(weakenedSchema, validFixture);
        });
      }));

    requireResult('review1: schema-valid semantic-invalid attempt makes semantic agreement false',
      deliveredValidator && semanticAgreement && (() => {
        const semanticInvalid = structuredClone(validFixture);
        semanticInvalid.evidence.bindings[0].current = false;
        return deliveredValidator(schema, semanticInvalid) &&
          !semanticAgreement(schema, validFixture, invalidFixture, semanticInvalid);
      }));

    requireResult('review2: semantic agreement preserves delivered publication evaluation_id',
      deliveredValidator && semanticAgreement && (() => {
        const semanticInvalid = structuredClone(validFixture);
        semanticInvalid.publication.evaluation_id = 'E2';
        return deliveredValidator(schema, semanticInvalid) &&
          !semanticAgreement(schema, validFixture, invalidFixture, semanticInvalid);
      }));

    requireResult('review2: schema-valid semantic-negative vectors are detected',
      deliveredValidator && semanticAgreement && (() => {
        const mutate = operation => {
          const fixture = structuredClone(validFixture);
          operation(fixture);
          return fixture;
        };
        const semanticNegatives = [
          mutate(fixture => { fixture.evidence.state = 'STALE'; }),
          mutate(fixture => {
            fixture.evidence.evaluation_id = 'E2';
            fixture.evidence.bindings.forEach(binding => { binding.evaluation_id = 'E2'; });
          }),
          mutate(fixture => { fixture.publication.evaluation_id = 'E2'; }),
          mutate(fixture => { fixture.publication.remote_head_observation_id = 'BAD'; }),
          mutate(fixture => { fixture.publication.domain_scopes.concurrent.push(' continuity '); }),
          mutate(fixture => { fixture.publication.prior_publication_history.observation_ids.push('R1'); }),
          mutate(fixture => { fixture.evidence.bindings[0].applicable = false; })
        ];
        return semanticNegatives.every(fixture => deliveredValidator(schema, fixture) &&
          !semanticAgreement(schema, validFixture, invalidFixture, fixture));
      }));

    requireResult('review1: delivered schema enum drift is detected from in-memory artifact',
      deliveredValidator && (() => {
        const driftedSchema = structuredClone(schema);
        driftedSchema.$defs.governanceState.enum[0] = 'AUTHORIZED';
        return !deliveredValidator(driftedSchema, validFixture);
      }));
  }

  if (schema) {
    if (schema.$id !== 'https://mcf.local/schemas/mcf-multi-ai-continuity-v1.schema.json') fail('schema $id mismatch'); else pass('schema $id');
    assertExactSet('governance states', schema?.$defs?.governanceState?.enum ?? [], GOVERNANCE_STATES);
    assertExactSet('evidence states', schema?.$defs?.evidenceState?.enum ?? [], EVIDENCE_STATES);
    assertExactSet('bootstrap steps', schema?.$defs?.bootstrapStep?.enum ?? [], BOOTSTRAP_STEPS);
    assertExactSet('checkpoint classes', schema?.$defs?.checkpointClass?.enum ?? [], CHECKPOINT_CLASSES);
  }

  if (validFixture) {
    if (validFixture?.protocol !== 'MCF-MULTI-AI-CONTINUITY-V1.2') fail('valid fixture protocol mismatch'); else pass('valid fixture protocol');
  }
  if (invalidFixture) {
    if (invalidFixture?.protocol === 'MCF-MULTI-AI-CONTINUITY-V1.2') fail('invalid fixture unexpectedly valid'); else pass('invalid fixture rejected');
  }

  regressions();

  // RED expansion follows before GREEN production artifacts.
  if (failures.length) { console.error('MCF multi-ai continuity qualification: FAIL'); for (const item of failures) console.error(`- ${item}`); process.exit(1); }
  console.log('MCF multi-ai continuity qualification: PASS');
}

main();
