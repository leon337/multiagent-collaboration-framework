function labelSprite(THREE, text) {
  const c=document.createElement('canvas'); c.width=512;c.height=128; const x=c.getContext('2d');
  x.fillStyle='rgba(6,20,30,.78)'; x.roundRect(8,12,496,100,24); x.fill(); x.strokeStyle='rgba(150,235,255,.55)'; x.lineWidth=3; x.stroke();
  x.fillStyle='#f2fbff'; x.font='700 38px system-ui'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(text,256,62);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace;
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false})); s.scale.set(4.4,1.1,1); return s;
}
export function createPortalMesh(THREE, portal, color=0x61e7ff) {
  const g=new THREE.Group(); g.position.set(portal.position.x,0,portal.position.z); g.userData.portal=portal;
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.25,.11,16,64),new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:1.7,metalness:.35,roughness:.28}));
  ring.position.y=1.75; ring.castShadow=true; g.add(ring);
  const inner=new THREE.Mesh(new THREE.CircleGeometry(1.08,48),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.13,side:THREE.DoubleSide,depthWrite:false})); inner.position.set(0,1.75,.02); g.add(inner);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(1.55,1.7,.25,32),new THREE.MeshStandardMaterial({color:0x24313a,roughness:.7,metalness:.35})); base.position.y=.13;base.castShadow=true;g.add(base);
  const label=labelSprite(THREE,portal.name); label.position.y=3.45; g.add(label);
  const light=new THREE.PointLight(color,2.5,7); light.position.y=1.8; g.add(light);
  g.userData.animate=(t)=>{ring.rotation.z=t*.25;inner.material.opacity=.11+Math.sin(t*2+portal.position.x)*.035;};
  return g;
}
