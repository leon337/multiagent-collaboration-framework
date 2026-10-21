// This function is self-contained: scripting.executeScript serializes it.
export function snapshot(maxChars = 4000, maxNodes = 2000) {
  const excluded = 'input,textarea,select,option,button,form,iframe,script,style,noscript,template,[hidden],[inert],[aria-hidden="true"],[data-sensitive],[data-private],[contenteditable],[autocomplete]';
  const clean = text => text.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]').replace(/\b(?:Bearer\s+)?[A-Za-z0-9_+/=-]{24,}\b/g, '[REDACTED_TOKEN]').replace(/\b\d[\d ()+.-]{7,}\d\b/g, '[REDACTED_NUMBER]').replace(/\s+/g, ' ').trim();
  if (!document.documentElement.hasAttribute('data-mcf-synthetic-fixture')) throw Error('FIXTURE_REQUIRED');
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let node, visited = 0, text = '', truncated = false;
  while ((node = walker.nextNode())) {
    if (++visited > maxNodes || text.length >= maxChars) { truncated = true; break; }
    if (node.nodeType !== 3) continue;
    const parent = node.parentElement;
    if (!parent || parent.closest(excluded)) continue;
    let visible = true;
    let depth = 0;
    for (let el = parent; el; el = el.parentElement) {
      if (++depth > 64) { visible = false; break; }
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility !== 'visible' || Number(s.opacity) === 0 || s.contentVisibility === 'hidden') { visible = false; break; }
    }
    if (!visible || !parent.getClientRects().length) continue;
    const part = clean(node.textContent.slice(0, maxChars + 1));
    if (text.length + part.length + 1 > maxChars) truncated = true;
    text = (text + ' ' + part).trim().slice(0, maxChars);
  }
  // Path, query and fragment never appear in evidence.
  return { title: clean(document.title).slice(0, 160), url: 'file:///[LOCAL_FIXTURE]', text, truncated, visited, untrusted: true };
}
