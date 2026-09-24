import * as THREE from '../node_modules/three/build/three.module.js';
import { createEnvironment } from './world/environment.js';
import { createPet } from './player/pet.js';
import { createPortalMesh } from './world/portals.js';
import { movementStep, nearestPortal } from './player/controls.js';
import { PortalRegistry } from './browser/portal-registry.mjs';
import { createWorldState } from './state/world-state.mjs';
import { portalPositionAhead } from './browser/browser-flow.mjs';

const stage = document.getElementById('stage');
const promptEl = document.getElementById('prompt');
const fatalEl = document.getElementById('fatal');
const zoneStatus = document.getElementById('zoneStatus');
const hud = document.getElementById('hud');
const help = document.getElementById('help');
const crosshair = document.getElementById('crosshair');
const browserToolbar = document.getElementById('browserToolbar');
const address = document.getElementById('address');
const worldBack = document.getElementById('worldBack');
const navBack = document.getElementById('navBack');
const navForward = document.getElementById('navForward');
const navReload = document.getElementById('navReload');
const go = document.getElementById('go');
const createLocal = document.getElementById('createLocal');

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.domElement.tabIndex = 0;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
createEnvironment(THREE, scene);
const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 260);
const clock = new THREE.Clock();
const pet = createPet(THREE);
scene.add(pet.group);

const stateStore = createWorldState(window.localStorage);
const restored = stateStore.load();
let player = {
  x: Number(restored.player?.x ?? 0),
  z: Number(restored.player?.z ?? 0),
  heading: Number(restored.player?.heading ?? 0),
};
pet.group.position.set(player.x, 0, player.z);
pet.group.rotation.y = player.heading;

const initialPortals = restored.portals?.length ? restored.portals : [
  { id: 'openai', name: 'OpenAI', url: 'https://openai.com/', position: { x: 7, z: -9 }, createdAt: new Date(0).toISOString() },
  { id: 'github', name: 'GitHub', url: 'https://github.com/', position: { x: -9, z: -15 }, createdAt: new Date(0).toISOString() },
];
const registry = new PortalRegistry(initialPortals);
const portalMeshes = new Map();
function rebuildPortals() {
  for (const mesh of portalMeshes.values()) scene.remove(mesh);
  portalMeshes.clear();
  registry.list().forEach((portal, index) => {
    const mesh = createPortalMesh(THREE, portal, index % 2 ? 0xa783ff : 0x61e7ff);
    scene.add(mesh); portalMeshes.set(portal.id, mesh);
  });
}
rebuildPortals();

const keys = Object.create(null);
let paused = false;
let currentPortal = null;
let saveAccumulator = 0;
let browserState = { open: false, url: null };

const movementInput = () => ({
  forward: !!(keys.KeyW || keys.ArrowUp),
  backward: !!(keys.KeyS || keys.ArrowDown),
  left: !!(keys.KeyA || keys.ArrowLeft),
  right: !!(keys.KeyD || keys.ArrowRight),
  run: !!(keys.ShiftLeft || keys.ShiftRight),
});

function persist(browserUrl = browserState.url ?? null) {
  stateStore.save({
    ...restored,
    player: { x: player.x, y: 0, z: player.z, heading: player.heading },
    camera: { mode: 'third-person', distance: 7 },
    portals: registry.list(),
    activePortalId: currentPortal?.id ?? null,
    browserUrl,
  });
}

async function openFocusedPortal() {
  if (paused || !currentPortal || !window.mcfBrowser) return;
  paused = true;
  zoneStatus.textContent = `Abrindo ${currentPortal.name}…`;
  persist(currentPortal.url);
  try {
    await window.mcfBrowser.open(currentPortal.url);
  } catch (error) {
    paused = false;
    zoneStatus.textContent = `Falha ao abrir: ${error.message}`;
  }
}

document.addEventListener('keydown', (event) => {
  keys[event.code] = true;
  if (event.code === 'KeyE' && !event.repeat) openFocusedPortal();
});
document.addEventListener('keyup', (event) => { keys[event.code] = false; });

function setBrowserUi(state) {
  browserState = { open: !!state.open, url: state.url ?? null };
  paused = browserState.open;
  browserToolbar.hidden = !browserState.open;
  hud.hidden = browserState.open;
  help.hidden = browserState.open;
  crosshair.hidden = browserState.open;
  promptEl.hidden = true;
  if (browserState.open) {
    if (browserState.url) address.value = browserState.url;
    zoneStatus.textContent = browserState.url ? `Local Web: ${new URL(browserState.url).hostname}` : 'Local Web';
  } else {
    zoneStatus.textContent = 'Mundo';
    requestAnimationFrame(() => renderer.domElement.focus());
  }
}

window.mcfBrowser?.onState?.(setBrowserUi);
worldBack?.addEventListener('click', async () => { await window.mcfBrowser?.close?.(); });
navBack?.addEventListener('click', () => window.mcfBrowser?.back?.());
navForward?.addEventListener('click', () => window.mcfBrowser?.forward?.());
navReload?.addEventListener('click', () => window.mcfBrowser?.reload?.());
async function navigateAddress() {
  const value = address.value.trim();
  if (!value) return;
  try { await window.mcfBrowser?.navigate?.(value); }
  catch (error) { zoneStatus.textContent = `URL recusada: ${error.message}`; }
}
go?.addEventListener('click', navigateAddress);
address?.addEventListener('keydown', (event) => { if (event.key === 'Enter') navigateAddress(); });
createLocal?.addEventListener('click', () => {
  if (!browserState.url) return;
  const position = portalPositionAhead(player, 6);
  const name = new URL(browserState.url).hostname.replace(/^www\./, '') || 'Local Web';
  const portal = registry.add({ name, url: browserState.url, position });
  rebuildPortals();
  persist(browserState.url);
  zoneStatus.textContent = `Local criado: ${portal.name}`;
});

function updateCamera(dt) {
  const distance = 7;
  const desired = new THREE.Vector3(
    player.x + Math.sin(player.heading) * distance,
    4.6,
    player.z + Math.cos(player.heading) * distance,
  );
  const alpha = 1 - Math.exp(-6 * dt);
  camera.position.lerp(desired, alpha);
  const target = new THREE.Vector3(player.x, 1.05, player.z);
  camera.lookAt(target);
}

function updatePrompt() {
  currentPortal = nearestPortal(player, registry.list(), 3.2);
  if (currentPortal && !paused) {
    promptEl.hidden = false;
    promptEl.textContent = `E — entrar em ${currentPortal.name}`;
  } else {
    promptEl.hidden = true;
  }
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  const input = movementInput();
  const moving = !paused && (input.forward || input.backward || input.left || input.right);
  if (!paused) {
    player = movementStep(player, input, dt);
    player.x = Math.max(-105, Math.min(105, player.x));
    player.z = Math.max(-105, Math.min(105, player.z));
    pet.group.position.set(player.x, 0, player.z);
    pet.group.rotation.y = player.heading;
    updatePrompt();
    saveAccumulator += dt;
    if (saveAccumulator > 1.2) { saveAccumulator = 0; persist(null); }
  }
  pet.update(t, moving, input.run);
  for (const mesh of portalMeshes.values()) mesh.userData.animate?.(t);
  updateCamera(dt);
  renderer.render(scene, camera);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
addEventListener('beforeunload', () => persist());

try {
  updateCamera(1);
  updatePrompt();
  animate();
  window.mcfBrowser?.worldReady?.();
} catch (error) {
  console.error(error);
  fatalEl.hidden = false;
  fatalEl.textContent = `Não foi possível iniciar WebGL: ${error.message}`;
}
