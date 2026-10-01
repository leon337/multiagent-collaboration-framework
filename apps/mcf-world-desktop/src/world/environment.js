export function createEnvironment(THREE, scene) {
  scene.background = new THREE.Color(0x8bc9ee);
  scene.fog = new THREE.Fog(0x9fd2ec, 45, 150);
  scene.add(new THREE.HemisphereLight(0xccecff, 0x486632, 2.0));
  const sunLight = new THREE.DirectionalLight(0xfff1c9, 3.2);
  sunLight.position.set(-35, 55, -20); sunLight.castShadow=true;
  sunLight.shadow.mapSize.set(2048,2048); sunLight.shadow.camera.left=-55; sunLight.shadow.camera.right=55; sunLight.shadow.camera.top=55; sunLight.shadow.camera.bottom=-55;
  scene.add(sunLight);
  const sun = new THREE.Mesh(new THREE.SphereGeometry(3.4,24,16), new THREE.MeshBasicMaterial({color:0xffd76a}));
  sun.position.set(-52,50,-85); scene.add(sun);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(260,260), new THREE.MeshStandardMaterial({color:0x4f8b3c,roughness:1}));
  ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);

  const bladeGeo = new THREE.PlaneGeometry(.055,.46);
  bladeGeo.translate(0,.23,0);
  const grass = new THREE.InstancedMesh(bladeGeo,new THREE.MeshLambertMaterial({color:0x5fa348,side:THREE.DoubleSide}),3200);
  const dummy=new THREE.Object3D();
  for(let i=0;i<3200;i++){
    const r=4+Math.random()*112, a=Math.random()*Math.PI*2;
    dummy.position.set(Math.cos(a)*r,0,Math.sin(a)*r); dummy.rotation.set(0,Math.random()*Math.PI,0); const s=.7+Math.random()*.8; dummy.scale.set(s,s,s); dummy.updateMatrix(); grass.setMatrixAt(i,dummy.matrix);
  }
  grass.instanceMatrix.needsUpdate=true; scene.add(grass);

  const hillMat=new THREE.MeshStandardMaterial({color:0x416c3b,roughness:1});
  for(let i=0;i<18;i++){ const h=new THREE.Mesh(new THREE.ConeGeometry(13+Math.random()*12,16+Math.random()*14,12),hillMat); const a=i/18*Math.PI*2; h.position.set(Math.cos(a)*112,-2,Math.sin(a)*112); scene.add(h); }
  return { ground, sunLight };
}
