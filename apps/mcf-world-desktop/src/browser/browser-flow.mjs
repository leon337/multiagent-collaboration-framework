export function browserTransition(state = { open: false, url: null }, event = {}) {
  if (event.type === 'open') return { open: true, url: String(event.url || '') || null };
  if (event.type === 'navigate') {
    if (!state.open) throw new Error('Browser is not open');
    return { open: true, url: String(event.url || '') || state.url || null };
  }
  if (event.type === 'close') return { open: false, url: null };
  return { open: !!state.open, url: state.url ?? null };
}

export function portalPositionAhead(player, distance = 6) {
  const d = Number(distance) || 6;
  const heading = Number(player?.heading || 0);
  return {
    x: Number(player?.x || 0) - Math.sin(heading) * d,
    z: Number(player?.z || 0) - Math.cos(heading) * d,
  };
}
