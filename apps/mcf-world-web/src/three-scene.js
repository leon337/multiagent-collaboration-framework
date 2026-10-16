import * as THREE from 'three';

export function createWorldScene({ canvas, onWebglError }) {
  let renderer;

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
  } catch (error) {
    onWebglError?.(error);
    return null;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9bc8e8);
  scene.fog = new THREE.Fog(0x9bc8e8, 28, 92);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 180);
  camera.position.set(0, 4.2, 7.5);

  const hemisphere = new THREE.HemisphereLight(0xdcefff, 0x36502f, 2.1);
  scene.add(hemisphere);

  const sun = new THREE.DirectionalLight(0xfff1c8, 3.2);
  sun.position.set(-16, 22, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -28;
  sun.shadow.camera.right = 28;
  sun.shadow.camera.top = 28;
  sun.shadow.camera.bottom = -28;
  scene.add(sun);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(160, 160, 1, 1),
    new THREE.MeshStandardMaterial({
      color: 0x4f8f48,
      roughness: 0.96,
      metalness: 0,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const grid = new THREE.GridHelper(160, 80, 0x6fa066, 0x5a9452);
  grid.position.y = 0.015;
  grid.material.transparent = true;
  grid.material.opacity = 0.2;
  scene.add(grid);

  const pet = createPet();
  scene.add(pet);

  const localMarker = createLocalMarker();
  scene.add(localMarker);

  const clock = new THREE.Clock();

  function resize() {
    const width = Math.max(canvas.clientWidth, 1);
    const height = Math.max(canvas.clientHeight, 1);
    const pixelRatio = renderer.getPixelRatio();
    const targetWidth = Math.floor(width * pixelRatio);
    const targetHeight = Math.floor(height * pixelRatio);

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  }

  function frameDelta() {
    return Math.min(clock.getDelta(), 0.05);
  }

  function render() {
    resize();
    renderer.render(scene, camera);
  }

  function dispose() {
    renderer.dispose();
  }

  return {
    scene,
    camera,
    renderer,
    pet,
    localMarker,
    frameDelta,
    render,
    resize,
    dispose,
  };
}

function createPet() {
  const pet = new THREE.Group();
  pet.name = 'PET';

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0xf1c879,
    roughness: 0.72,
  });
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: 0x49372b,
    roughness: 0.8,
  });

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.45, 0.75, 6, 12),
    bodyMaterial,
  );
  body.rotation.z = Math.PI / 2;
  body.position.y = 0.72;
  body.castShadow = true;
  pet.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 18, 14),
    bodyMaterial,
  );
  head.position.set(0, 1.05, -0.55);
  head.castShadow = true;
  pet.add(head);

  const snout = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 14, 10),
    accentMaterial,
  );
  snout.scale.set(1.05, 0.7, 1.25);
  snout.position.set(0, 0.96, -0.9);
  snout.castShadow = true;
  pet.add(snout);

  for (const x of [-0.27, 0.27]) {
    for (const z of [-0.32, 0.32]) {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.1, 0.48, 10),
        accentMaterial,
      );
      leg.position.set(x, 0.32, z);
      leg.castShadow = true;
      pet.add(leg);
    }
  }

  pet.position.set(0, 0, 0);
  return pet;
}

function createLocalMarker() {
  const group = new THREE.Group();
  group.name = 'Local';

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.9, 0.08, 14, 48),
    new THREE.MeshStandardMaterial({
      color: 0xcdf7dc,
      emissive: 0x2a7a4c,
      emissiveIntensity: 1.2,
      roughness: 0.35,
    }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.08;
  ring.castShadow = true;
  group.add(ring);

  const beacon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.12, 2.4, 12),
    new THREE.MeshStandardMaterial({
      color: 0xe6fff0,
      emissive: 0x46b774,
      emissiveIntensity: 1.8,
      transparent: true,
      opacity: 0.78,
    }),
  );
  beacon.position.y = 1.2;
  group.add(beacon);

  return group;
}
