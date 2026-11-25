import { createHash, randomUUID } from 'node:crypto';
import { chmod, lstat, mkdir, open, readFile, rename, unlink } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';

export const CLOUD_PROVISIONING_OPERATIONS = Object.freeze([
  'google.cloud.projects.create',
  'google.cloud.services.enableMaps',
  'google.cloud.apiKeys.createMaps',
  'google.cloud.apiKeys.inspectMaps',
]);

export const MAPS_SERVICES = Object.freeze([
  'geocoding-backend.googleapis.com',
  'routes.googleapis.com',
  'apikeys.googleapis.com',
]);

const PROJECT_ID_RE = /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/u;
const MISSION_ID_RE = /^[a-z][a-z0-9-]{2,39}$/u;
const KEY_ID = 'mcf-obras-maps-v1';
const SECRET_ALIAS = 'agente-logistica-obras/google_maps_api_key';

function assertProjectId(value, BridgeError) {
  if (typeof value !== 'string' || !PROJECT_ID_RE.test(value)) {
    throw new BridgeError('INVALID_PROJECT_ID');
  }
  return value;
}
function assertMissionId(value, BridgeError) {
  if (typeof value !== 'string' || !MISSION_ID_RE.test(value)) {
    throw new BridgeError('INVALID_MISSION_ID');
  }
  return value;
}
function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isNotFound(error) {
  return error?.code === 'GOOGLE_HTTP_404';
}
function isAlreadyExists(error) {
  return error?.code === 'GOOGLE_HTTP_409';
}
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function pollOperation(googleRequest, host, version, operationName, BridgeError) {
  if (
    typeof operationName !== 'string' ||
    !/^[A-Za-z0-9/_-]{5,300}$/u.test(operationName) ||
    operationName.includes('..')
  ) {
    throw new BridgeError('INVALID_OPERATION_NAME', 502);
  }
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const operation = await googleRequest(
      `https://${host}/${version}/${operationName}`,
      'cloud-write',
    );
    if (operation.done === true) {
      if (operation.error) throw new BridgeError('GOOGLE_OPERATION_FAILED', 502);
      return operation.response ?? {};
    }
    await delay(500);
  }
  return null;
}
async function getProject(googleRequest, projectId, BridgeError) {
  try {
    const project = await googleRequest(
      `https://cloudresourcemanager.googleapis.com/v3/projects/${encodeURIComponent(projectId)}`,
      'cloud-write',
    );
    if (!isRecord(project) || project.projectId !== projectId || !project.projectNumber) {
      throw new BridgeError('INVALID_PROJECT_RESPONSE', 502);
    }
    return project;
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}
async function billingStatus(googleRequest, projectId, BridgeError) {
  let info;
  try {
    info = await googleRequest(
      `https://cloudbilling.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/billingInfo`,
      'cloud-write',
    );
  } catch {
    return { status: 'UNVERIFIED', reason: 'BILLING_STATUS_UNVERIFIED' };
  }
  if (info?.projectId !== projectId || typeof info.billingEnabled !== 'boolean') {
    return { status: 'UNVERIFIED', reason: 'BILLING_STATUS_UNVERIFIED' };
  }
  const billingLinked =
    typeof info.billingAccountName === 'string' && info.billingAccountName.trim().length > 0;
  if (info.billingEnabled || billingLinked) {
    return {
      status: 'BLOCKED',
      reason: 'BILLING_LINK_PRESENT',
      billingEnabled: info.billingEnabled,
      billingLinked,
    };
  }
  return { status: 'VERIFIED', billingEnabled: false, billingLinked: false };
}
function verifyManagedProject(project, missionId, BridgeError) {
  if (
    project.labels?.mcf_managed !== 'true' ||
    project.labels?.mcf_mission !== missionId
  ) {
    throw new BridgeError('PROJECT_ID_CONFLICT', 409);
  }
}
async function createProject(googleRequest, args, BridgeError) {
  const projectId = assertProjectId(args.projectId, BridgeError);
  const missionId = assertMissionId(args.missionId, BridgeError);
  const displayName = args.displayName;
  if (typeof displayName !== 'string' || displayName.length < 4 || displayName.length > 30) {
    throw new BridgeError('INVALID_DISPLAY_NAME');
  }
  const existing = await getProject(googleRequest, projectId, BridgeError);
  if (existing) {
    verifyManagedProject(existing, missionId, BridgeError);
    const billing = await billingStatus(googleRequest, projectId, BridgeError);
    if (billing.status !== 'VERIFIED') {
      return {
        status: billing.status === 'BLOCKED' ? 'BLOCKED' : 'PENDING',
        projectId,
        projectNumber: String(existing.projectNumber),
        reason: billing.reason,
        ...(billing.billingEnabled === undefined ? {} : { billingEnabled: billing.billingEnabled }),
        ...(billing.billingLinked === undefined ? {} : { billingLinked: billing.billingLinked }),
      };
    }
    if (existing.state !== 'ACTIVE') {
      return { status: 'PENDING', projectId, projectNumber: String(existing.projectNumber), reason: 'PROJECT_NOT_ACTIVE' };
    }
    return {
      status: 'SUCCEEDED',
      projectId,
      projectNumber: String(existing.projectNumber),
      displayName: existing.displayName,
      state: existing.state,
      reused: true,
      billingEnabled: false,
      billingLinked: false,
    };
  }

  let operation;
  try {
    operation = await googleRequest('https://cloudresourcemanager.googleapis.com/v3/projects', 'cloud-write', {
      method: 'POST',
      body: JSON.stringify({
        projectId,
        displayName,
        labels: { mcf_managed: 'true', mcf_mission: missionId },
      }),
    });
  } catch (error) {
    if (!isAlreadyExists(error)) throw error;
    const raced = await getProject(googleRequest, projectId, BridgeError);
    if (!raced) return { status: 'PENDING', projectId, reason: 'CREATE_CONFLICT_RECONCILIATION_REQUIRED' };
    verifyManagedProject(raced, missionId, BridgeError);
    const billing = await billingStatus(googleRequest, projectId, BridgeError);
    if (billing.status !== 'VERIFIED') {
      return {
        status: billing.status === 'BLOCKED' ? 'BLOCKED' : 'PENDING',
        projectId,
        projectNumber: String(raced.projectNumber),
        reason: billing.reason,
        ...(billing.billingEnabled === undefined ? {} : { billingEnabled: billing.billingEnabled }),
        ...(billing.billingLinked === undefined ? {} : { billingLinked: billing.billingLinked }),
      };
    }
    if (raced.state !== 'ACTIVE') {
      return { status: 'PENDING', projectId, projectNumber: String(raced.projectNumber), reason: 'PROJECT_NOT_ACTIVE' };
    }
    return {
      status: 'SUCCEEDED',
      projectId,
      projectNumber: String(raced.projectNumber),
      displayName: raced.displayName,
      state: raced.state,
      reused: true,
      billingEnabled: false,
      billingLinked: false,
    };
  }

  if (!isRecord(operation) || typeof operation.name !== 'string') {
    throw new BridgeError('INVALID_PROJECT_OPERATION', 502);
  }
  const result = await pollOperation(
    googleRequest,
    'cloudresourcemanager.googleapis.com',
    'v3',
    operation.name,
    BridgeError,
  );
  if (!result) {
    return { status: 'PENDING', projectId, operationName: operation.name };
  }
  const project = await getProject(googleRequest, projectId, BridgeError);
  if (!project) return { status: 'PENDING', projectId, operationName: operation.name };
  verifyManagedProject(project, missionId, BridgeError);
  const billing = await billingStatus(googleRequest, projectId, BridgeError);
  if (billing.status !== 'VERIFIED') {
    return {
      status: billing.status === 'BLOCKED' ? 'BLOCKED' : 'PENDING',
      projectId,
      projectNumber: String(project.projectNumber),
      reason: billing.reason,
      ...(billing.billingEnabled === undefined ? {} : { billingEnabled: billing.billingEnabled }),
      ...(billing.billingLinked === undefined ? {} : { billingLinked: billing.billingLinked }),
    };
  }
  if (project.state !== 'ACTIVE') {
    return { status: 'PENDING', projectId, projectNumber: String(project.projectNumber), reason: 'PROJECT_NOT_ACTIVE' };
  }
  return {
    status: 'SUCCEEDED',
    projectId,
    projectNumber: String(project.projectNumber),
    displayName: project.displayName,
    state: project.state,
    reused: false,
    billingEnabled: false,
    billingLinked: false,
  };
}
async function getService(googleRequest, projectNumber, service, BridgeError) {
  try {
    return await googleRequest(
      `https://serviceusage.googleapis.com/v1/projects/${projectNumber}/services/${service}`,
      'cloud-write',
    );
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}
async function enableMapsApis(googleRequest, args, BridgeError) {
  const projectId = assertProjectId(args.projectId, BridgeError);
  const missionId = assertMissionId(args.missionId, BridgeError);
  const project = await getProject(googleRequest, projectId, BridgeError);
  if (!project) throw new BridgeError('PROJECT_NOT_FOUND', 404);
  verifyManagedProject(project, missionId, BridgeError);
  const billing = await billingStatus(googleRequest, projectId, BridgeError);
  if (billing.status !== 'VERIFIED') {
    return {
      status: billing.status === 'BLOCKED' ? 'BLOCKED' : 'PENDING',
      projectId,
      reason: billing.reason,
      ...(billing.billingEnabled === undefined ? {} : { billingEnabled: billing.billingEnabled }),
      ...(billing.billingLinked === undefined ? {} : { billingLinked: billing.billingLinked }),
      services: [],
    };
  }
  const results = [];
  for (const service of MAPS_SERVICES) {
    const current = await getService(googleRequest, project.projectNumber, service, BridgeError);
    if (current?.state === 'ENABLED') {
      results.push({ service, state: 'ENABLED', reused: true });
      continue;
    }
    let operation;
    try {
      operation = await googleRequest(
        `https://serviceusage.googleapis.com/v1/projects/${project.projectNumber}/services/${service}:enable`,
        'cloud-write',
        { method: 'POST', body: '{}' },
      );
    } catch (error) {
      if (!isAlreadyExists(error)) throw error;
      const afterConflict = await getService(googleRequest, project.projectNumber, service, BridgeError);
      if (afterConflict?.state === 'ENABLED') {
        results.push({ service, state: 'ENABLED', reused: true });
        continue;
      }
      results.push({ service, state: 'PENDING', reused: false });
      continue;
    }
    if (!isRecord(operation) || typeof operation.name !== 'string') {
      throw new BridgeError('INVALID_SERVICE_OPERATION', 502);
    }
    const completed = await pollOperation(
      googleRequest,
      'serviceusage.googleapis.com',
      'v1',
      operation.name,
      BridgeError,
    );
    const after = await getService(googleRequest, project.projectNumber, service, BridgeError);
    results.push({
      service,
      state: after?.state === 'ENABLED' ? 'ENABLED' : completed ? 'PENDING' : 'PENDING',
      reused: false,
    });
  }
  return {
    status: results.every((item) => item.state === 'ENABLED') ? 'SUCCEEDED' : 'PENDING',
    projectId,
    billingEnabled: false,
    billingLinked: false,
    services: results,
  };
}
function hasExactApiRestrictions(key) {
  const actual = (key?.restrictions?.apiTargets ?? [])
    .map((item) => item?.service)
    .filter((item) => typeof item === 'string')
    .sort();
  const expected = ['geocoding-backend.googleapis.com', 'routes.googleapis.com'].sort();
  return actual.length === expected.length && actual.every((item, index) => item === expected[index]);
}
async function getKey(googleRequest, projectNumber, BridgeError) {
  const name = `projects/${projectNumber}/locations/global/keys/${KEY_ID}`;
  try {
    const key = await googleRequest(`https://apikeys.googleapis.com/v2/${name}`, 'cloud-write');
    return { name, key };
  } catch (error) {
    if (isNotFound(error)) return { name, key: null };
    throw error;
  }
}
async function getKeyString(googleRequest, name, BridgeError) {
  const result = await googleRequest(`https://apikeys.googleapis.com/v2/${name}/keyString`, 'cloud-write');
  if (!isRecord(result) || typeof result.keyString !== 'string' || result.keyString.length < 20) {
    throw new BridgeError('INVALID_KEY_STRING_RESPONSE', 502);
  }
  return result.keyString;
}
async function storeMapsKey(keyString, BridgeError) {
  const directory = path.join(homedir(), '.config', 'agente-logistica-obras');
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const directoryInfo = await lstat(directory);
  if (!directoryInfo.isDirectory() || directoryInfo.isSymbolicLink()) {
    throw new BridgeError('INSECURE_SECRET_DIRECTORY', 500);
  }
  await chmod(directory, 0o700);
  const target = path.join(directory, 'google_maps_api_key');
  const fingerprint = createHash('sha256').update(keyString).digest('hex');
  try {
    const metadata = await lstat(target);
    if (
      !metadata.isFile() ||
      metadata.isSymbolicLink() ||
      metadata.uid !== process.getuid?.() ||
      (metadata.mode & 0o077) !== 0 ||
      metadata.size < 1 || metadata.size > 16384
    ) {
      throw new BridgeError('INSECURE_SECRET_FILE', 500);
    }
    const existing = (await readFile(target, 'utf8')).trim();
    if (existing !== keyString) throw new BridgeError('SECRET_ALREADY_PRESENT', 409);
    return { secretAlias: SECRET_ALIAS, secretFingerprint: fingerprint, reused: true };
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }

  const temporary = path.join(directory, `.google-maps-key-${randomUUID()}.tmp`);
  let handle;
  try {
    handle = await open(temporary, 'wx', 0o600);
    await handle.writeFile(keyString + '\n', 'utf8');
    await handle.sync();
    await handle.close();
    handle = undefined;
    await rename(temporary, target);
    await chmod(target, 0o600);
  } catch (error) {
    await handle?.close().catch(() => undefined);
    throw new BridgeError('SECRET_PERSIST_FAILED', 500);
  } finally {
    await unlink(temporary).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
    });
  }
  return { secretAlias: SECRET_ALIAS, secretFingerprint: fingerprint, reused: false };
}
async function createMapsKey(googleRequest, args, BridgeError) {
  const projectId = assertProjectId(args.projectId, BridgeError);
  const missionId = assertMissionId(args.missionId, BridgeError);
  const project = await getProject(googleRequest, projectId, BridgeError);
  if (!project) throw new BridgeError('PROJECT_NOT_FOUND', 404);
  verifyManagedProject(project, missionId, BridgeError);

  const services = await enableMapsApis(googleRequest, { projectId, missionId }, BridgeError);
  if (services.status !== 'SUCCEEDED') {
    return { status: 'PENDING', projectId, reason: 'MAPS_APIS_NOT_READY', services: services.services };
  }

  const current = await getKey(googleRequest, project.projectNumber, BridgeError);
  let key = current.key;
  if (key && !hasExactApiRestrictions(key)) {
    throw new BridgeError('EXISTING_KEY_RESTRICTIONS_MISMATCH', 409);
  }
  if (!key) {
    let operation;
    try {
      const url = new URL(
        `https://apikeys.googleapis.com/v2/projects/${project.projectNumber}/locations/global/keys`,
      );
      url.searchParams.set('keyId', KEY_ID);
      operation = await googleRequest(url.toString(), 'cloud-write', {
        method: 'POST',
        body: JSON.stringify({
          displayName: 'MCF Agente Logistica Obras V1 - Maps server',
          restrictions: {
            apiTargets: [
              { service: 'geocoding-backend.googleapis.com' },
              { service: 'routes.googleapis.com' },
            ],
          },
        }),
      });
    } catch (error) {
      if (!isAlreadyExists(error)) throw error;
      const raced = await getKey(googleRequest, project.projectNumber, BridgeError);
      if (!raced.key) return { status: 'PENDING', projectId, reason: 'KEY_CREATE_RECONCILIATION_REQUIRED' };
      key = raced.key;
      if (!hasExactApiRestrictions(key)) {
        throw new BridgeError('EXISTING_KEY_RESTRICTIONS_MISMATCH', 409);
      }
    }
    if (!key) {
      if (!isRecord(operation) || typeof operation.name !== 'string') {
        throw new BridgeError('INVALID_KEY_OPERATION', 502);
      }
      const completed = await pollOperation(
        googleRequest,
        'apikeys.googleapis.com',
        'v2',
        operation.name,
        BridgeError,
      );
      if (!completed) {
        return { status: 'PENDING', projectId, keyId: KEY_ID, operationName: operation.name };
      }
      key = completed;
      if (!hasExactApiRestrictions(key)) {
        throw new BridgeError('CREATED_KEY_RESTRICTIONS_MISMATCH', 502);
      }
    }
  }

  const keyString = typeof key.keyString === 'string'
    ? key.keyString
    : await getKeyString(googleRequest, current.name, BridgeError);
  const stored = await storeMapsKey(keyString, BridgeError);
  return {
    status: 'SUCCEEDED',
    projectId,
    projectNumber: String(project.projectNumber),
    keyResourceName: current.name,
    keyId: KEY_ID,
    apiRestrictions: ['geocoding-backend.googleapis.com', 'routes.googleapis.com'],
    billingEnabled: false,
    billingLinked: false,
    ...stored,
  };
}
async function mapsKeyStored(BridgeError) {
  const directory = path.join(homedir(), '.config', 'agente-logistica-obras');
  const target = path.join(directory, 'google_maps_api_key');
  try {
    const directoryInfo = await lstat(directory);
    const metadata = await lstat(target);
    if (
      !directoryInfo.isDirectory() ||
      directoryInfo.isSymbolicLink() ||
      directoryInfo.uid !== process.getuid?.() ||
      (directoryInfo.mode & 0o077) !== 0 ||
      !metadata.isFile() ||
      metadata.isSymbolicLink() ||
      metadata.uid !== process.getuid?.() ||
      (metadata.mode & 0o077) !== 0 ||
      metadata.size < 1 || metadata.size > 16384
    ) {
      throw new BridgeError('INSECURE_SECRET_FILE', 500);
    }
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}
async function inspectMapsKey(googleRequest, args, BridgeError) {
  const projectId = assertProjectId(args.projectId, BridgeError);
  const missionId = assertMissionId(args.missionId, BridgeError);
  const project = await getProject(googleRequest, projectId, BridgeError);
  if (!project) throw new BridgeError('PROJECT_NOT_FOUND', 404);
  verifyManagedProject(project, missionId, BridgeError);
  const billing = await billingStatus(googleRequest, projectId, BridgeError);
  if (billing.status !== 'VERIFIED') {
    return {
      status: billing.status === 'BLOCKED' ? 'BLOCKED' : 'PENDING',
      projectId,
      reason: billing.reason,
      ...(billing.billingEnabled === undefined ? {} : { billingEnabled: billing.billingEnabled }),
      ...(billing.billingLinked === undefined ? {} : { billingLinked: billing.billingLinked }),
    };
  }
  const current = await getKey(googleRequest, project.projectNumber, BridgeError);
  if (!current.key) return { status: 'NOT_FOUND', projectId, keyId: KEY_ID };
  return {
    status: 'SUCCEEDED',
    projectId,
    projectNumber: String(project.projectNumber),
    keyResourceName: current.name,
    keyId: KEY_ID,
    billingEnabled: false,
    billingLinked: false,
    displayName: current.key.displayName,
    apiRestrictions: (current.key.restrictions?.apiTargets ?? []).map((item) => item.service),
    restrictionsValid: hasExactApiRestrictions(current.key),
    secretStored: await mapsKeyStored(BridgeError),
  };
}

export async function dispatchCloudProvisioning(op, args, dependencies) {
  const { googleRequest, BridgeError } = dependencies;
  if (!CLOUD_PROVISIONING_OPERATIONS.includes(op)) throw new BridgeError('UNSUPPORTED_OPERATION', 404);
  if (op === 'google.cloud.projects.create') return createProject(googleRequest, args, BridgeError);
  if (op === 'google.cloud.services.enableMaps') return enableMapsApis(googleRequest, args, BridgeError);
  if (op === 'google.cloud.apiKeys.createMaps') return createMapsKey(googleRequest, args, BridgeError);
  if (op === 'google.cloud.apiKeys.inspectMaps') return inspectMapsKey(googleRequest, args, BridgeError);
  throw new BridgeError('UNSUPPORTED_OPERATION', 404);
}
