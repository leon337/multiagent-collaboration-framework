export function movementStep(state, input = {}, dt = 0) {
  const next = { x: Number(state.x || 0), z: Number(state.z || 0), heading: Number(state.heading || 0) };
  const turnSpeed = 2.4;
  const moveSpeed = input.run ? 9 : 5;
  const delta = Math.max(0, Number(dt) || 0);
  if (input.left) next.heading += turnSpeed * delta;
  if (input.right) next.heading -= turnSpeed * delta;
  const axis = (input.forward ? 1 : 0) - (input.backward ? 1 : 0);
  if (axis) {
    next.x += -Math.sin(next.heading) * moveSpeed * delta * axis;
    next.z += -Math.cos(next.heading) * moveSpeed * delta * axis;
  }
  return next;
}

export function nearestPortal(player, portals, maxDistance = 3.2) {
  let best = null;
  let bestDistance = Number(maxDistance);
  for (const portal of portals || []) {
    const dx = Number(portal.position?.x || 0) - Number(player.x || 0);
    const dz = Number(portal.position?.z || 0) - Number(player.z || 0);
    const distance = Math.hypot(dx, dz);
    if (distance <= bestDistance) {
      best = portal;
      bestDistance = distance;
    }
  }
  return best;
}
