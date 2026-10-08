const NS = 'http://www.w3.org/2000/svg';

export const svgEl = (tag, attrs = {}) => {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
};

export function islandPath(r) {
  return `M0,-${r} C${r*.72},-${r*.93} ${r*1.05},-${r*.45} ${r},0 C${r*.95},${r*.65} ${r*.55},${r*.98} 0,${r} C-${r*.68},${r*.92} -${r*1.02},${r*.42} -${r},0 C-${r*.9},-${r*.63} -${r*.55},-${r*.96} 0,-${r}Z`;
}

export function worldBounds(nodes, pad = 160) {
  if (!nodes.length) return { minX: 0, minY: 0, maxX: 1600, maxY: 900, width: 1600, height: 900 };
  const xs = nodes.map(n => n.x), ys = nodes.map(n => n.y);
  const minX = Math.min(...xs) - pad, minY = Math.min(...ys) - pad;
  const maxX = Math.max(...xs) + pad, maxY = Math.max(...ys) + pad;
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

export function fitCamera(nodes, width, height) {
  const b = worldBounds(nodes, 120);
  const zoom = Math.max(.45, Math.min(1.35, Math.min(width / b.width, height / b.height)));
  return { x: width / 2 - (b.minX + b.width / 2) * zoom, y: height / 2 - (b.minY + b.height / 2) * zoom, zoom };
}
