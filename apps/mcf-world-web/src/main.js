import { createBrowserSurface } from './browser-surface.js';
import {
  createLocalAhead,
  isWithinDistance,
  movementVector,
} from './world-domain.js';
import { createWorldScene } from './three-scene.js';

const canvas = document.querySelector('#world-canvas');
const hud = document.querySelector('#hud');
const status = document.querySelector('#world-status');
const openLocalButton = document.querySelector('#open-local');
const webglError = document.querySelector('#webgl-error');
const browserSurfaceElement = document.querySelector('#browser-surface');
const browserFrame = document.querySelector('#browser-frame');
const browserUrl = document.querySelector('#browser-url');
const openExternalButton = document.querySelector('#open-external');
const returnToWorldButton = document.querySelector('#return-to-world');

const pressedKeys = new Set();
let browserOpen = false;

const browserSurface = createBrowserSurface({
  surface: browserSurfaceElement,
  frame: browserFrame,
  urlLabel: browserUrl,
  openExternalButton,
  returnButton: returnToWorldButton,
  onOpen() {
    browserOpen = true;
    pressedKeys.clear();
  },
  onClose() {
    browserOpen = false;
    canvas.focus();
  },
});

const world = createWorldScene({
  canvas,
  onWebglError(error) {
    console.error('MCF World WebGL initialization failed', error);
    webglError.hidden = false;
    hud.hidden = true;
  },
});

if (world) {
  startWorld(world);
}

function startWorld(worldScene) {
  const interactionRadius = 2.5;
  const speed = 5;
  const demoLocal = createLocalAhead({
    id: 'local-example',
    petPosition: { x: 0, y: 0, z: 0 },
    forward: { x: 0, z: -1 },
    distance: 8,
    url: 'example.com',
  });

  worldScene.localMarker.position.set(
    demoLocal.position.x,
    demoLocal.position.y,
    demoLocal.position.z,
  );

  const movementCodes = new Set([
    'KeyW',
    'KeyA',
    'KeyS',
    'KeyD',
    'ArrowUp',
    'ArrowLeft',
    'ArrowDown',
    'ArrowRight',
  ]);

  window.addEventListener('keydown', (event) => {
    if (browserOpen || !movementCodes.has(event.code)) {
      return;
    }

    event.preventDefault();
    pressedKeys.add(event.code);
  });

  window.addEventListener('keyup', (event) => {
    if (!movementCodes.has(event.code)) {
      return;
    }

    event.preventDefault();
    pressedKeys.delete(event.code);
  });

  window.addEventListener('blur', () => pressedKeys.clear());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pressedKeys.clear();
    }
  });

  openLocalButton.addEventListener('click', () => {
    if (!openLocalButton.disabled) {
      browserSurface.open(demoLocal.url);
    }
  });

  function axis(positiveCodes, negativeCodes) {
    const positive = positiveCodes.some((code) => pressedKeys.has(code)) ? 1 : 0;
    const negative = negativeCodes.some((code) => pressedKeys.has(code)) ? 1 : 0;
    return positive - negative;
  }

  function animate() {
    requestAnimationFrame(animate);

    const delta = worldScene.frameDelta();
    const forward = browserOpen
      ? 0
      : axis(['KeyW', 'ArrowUp'], ['KeyS', 'ArrowDown']);
    const right = browserOpen
      ? 0
      : axis(['KeyD', 'ArrowRight'], ['KeyA', 'ArrowLeft']);
    const movement = movementVector({ forward, right });

    if (movement.x !== 0 || movement.z !== 0) {
      worldScene.pet.position.x += movement.x * speed * delta;
      worldScene.pet.position.z += movement.z * speed * delta;
      worldScene.pet.rotation.y = Math.atan2(-movement.x, -movement.z);
    }

    const petPosition = worldScene.pet.position;
    const nearLocal = isWithinDistance(
      { x: petPosition.x, z: petPosition.z },
      demoLocal.position,
      interactionRadius,
    );

    openLocalButton.disabled = !nearLocal || browserOpen;
    status.textContent = nearLocal
      ? 'Local encontrado. Abra para visitar o endereço sem perder o mundo.'
      : 'Use WASD ou as setas para caminhar até o anel luminoso.';

    worldScene.localMarker.rotation.y += delta * 0.35;

    const desiredCameraX = petPosition.x;
    const desiredCameraY = petPosition.y + 4.2;
    const desiredCameraZ = petPosition.z + 7.5;
    const smoothing = 1 - Math.exp(-7 * delta);

    worldScene.camera.position.x +=
      (desiredCameraX - worldScene.camera.position.x) * smoothing;
    worldScene.camera.position.y +=
      (desiredCameraY - worldScene.camera.position.y) * smoothing;
    worldScene.camera.position.z +=
      (desiredCameraZ - worldScene.camera.position.z) * smoothing;
    worldScene.camera.lookAt(petPosition.x, petPosition.y + 0.8, petPosition.z);

    worldScene.render();
  }

  animate();
}
