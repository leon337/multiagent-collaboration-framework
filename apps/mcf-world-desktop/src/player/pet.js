export function createPet(THREE) {
  const root = new THREE.Group();
  const brown = new THREE.MeshStandardMaterial({ color: 0x8a552f, roughness: 0.88 });
  const cream = new THREE.MeshStandardMaterial({ color: 0xd9b58d, roughness: 0.95 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x17120f, roughness: 0.8 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.62, 1.15, 5, 12), brown);
  body.rotation.z = Math.PI / 2; body.position.y = 1.0; body.castShadow = true; root.add(body);
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.48, 18, 12), cream);
  chest.scale.set(0.55, 1, 0.7); chest.position.set(0, 1.02, -0.52); chest.castShadow = true; root.add(chest);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.48, 20, 14), brown);
  head.position.set(0, 1.48, -0.82); head.castShadow = true; root.add(head);
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.27, 16, 12), cream);
  muzzle.scale.z = 0.75; muzzle.position.set(0, 1.39, -1.18); root.add(muzzle);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.105, 12, 8), dark);
  nose.position.set(0, 1.43, -1.39); root.add(nose);
  for (const x of [-0.17,0.17]) { const eye=new THREE.Mesh(new THREE.SphereGeometry(0.055,10,8),dark); eye.position.set(x,1.57,-1.22); root.add(eye); }
  for (const x of [-0.34,0.34]) { const ear=new THREE.Mesh(new THREE.ConeGeometry(0.16,0.42,8),brown); ear.position.set(x,1.72,-0.77); ear.rotation.z = x<0 ? 0.35 : -0.35; root.add(ear); }

  const legs=[];
  for (const [x,z] of [[-.38,-.52],[.38,-.52],[-.38,.5],[.38,.5]]) {
    const leg = new THREE.Group(); leg.position.set(x,.78,z);
    const upper=new THREE.Mesh(new THREE.CapsuleGeometry(.11,.42,4,8),brown); upper.position.y=-.26; upper.castShadow=true; leg.add(upper);
    const paw=new THREE.Mesh(new THREE.SphereGeometry(.16,12,8),cream); paw.scale.set(1,.55,1.35); paw.position.set(0,-.56,-.04); paw.castShadow=true; leg.add(paw);
    root.add(leg); legs.push(leg);
  }
  const tailPivot=new THREE.Group(); tailPivot.position.set(0,1.12,.92); root.add(tailPivot);
  const tail=new THREE.Mesh(new THREE.CapsuleGeometry(.09,.72,4,8),brown); tail.position.y=.38; tail.rotation.z=-.45; tailPivot.add(tail);

  root.scale.setScalar(1.05);
  function update(time, moving, running) {
    const pace = running ? 13 : 8;
    const amp = moving ? (running ? .75 : .5) : .05;
    legs.forEach((leg,i)=>{ leg.rotation.x = Math.sin(time*pace + (i%2?Math.PI:0))*amp; });
    tailPivot.rotation.y = Math.sin(time*5)*.55;
    head.rotation.y = moving ? Math.sin(time*2.3)*.04 : Math.sin(time*1.1)*.09;
    body.position.y = 1 + (moving ? Math.abs(Math.sin(time*pace))*0.045 : Math.sin(time*1.5)*.015);
  }
  return { group:root, update };
}
