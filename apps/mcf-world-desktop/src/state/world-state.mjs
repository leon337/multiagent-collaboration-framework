const KEY = 'mcf-world-3d:v1';

export function createWorldState(storage = globalThis.localStorage) {
  const defaults = () => ({
    player: { x: 0, y: 0, z: 0, heading: 0 },
    camera: { mode: 'third-person', distance: 7 },
    portals: [],
    activePortalId: null,
    browserUrl: null,
  });
  return {
    load() {
      try {
        const raw = storage?.getItem?.(KEY);
        if (!raw) return defaults();
        return { ...defaults(), ...JSON.parse(raw) };
      } catch { return defaults(); }
    },
    save(value) {
      const next = { ...defaults(), ...value };
      storage?.setItem?.(KEY, JSON.stringify(next));
      return next;
    },
    key: KEY,
  };
}
