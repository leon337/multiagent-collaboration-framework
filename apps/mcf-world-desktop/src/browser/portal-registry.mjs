export function normalizeHttpUrl(input) {
  const raw = String(input ?? '').trim();
  if (!raw || /\s/.test(raw)) throw new Error('Invalid URL');
  const hasScheme = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(raw);
  const candidate = hasScheme ? raw : `https://${raw}`;
  let parsed;
  try { parsed = new URL(candidate); } catch { throw new Error('Invalid URL'); }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('Only http(s) URLs are allowed');
  return parsed.href;
}

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `portal-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export class PortalRegistry {
  constructor(initial = []) { this.items = initial.map(p => ({ ...p, position: { ...p.position } })); }
  list() { return this.items.map(p => ({ ...p, position: { ...p.position } })); }
  add({ name, url, position }) {
    const normalized = normalizeHttpUrl(url);
    const pos = { x: Number(position?.x ?? 0), z: Number(position?.z ?? 0) };
    const existing = this.items.find(p => p.url === normalized && p.position.x === pos.x && p.position.z === pos.z);
    if (existing) return { ...existing, position: { ...existing.position } };
    const portal = { id: makeId(), name: String(name || new URL(normalized).hostname), url: normalized, position: pos, createdAt: new Date().toISOString() };
    this.items.push(portal);
    return { ...portal, position: { ...portal.position } };
  }
  remove(id) { this.items = this.items.filter(p => p.id !== id); }
}
