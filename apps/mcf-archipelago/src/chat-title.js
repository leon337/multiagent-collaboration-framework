export function deriveChatTitle(input, maxLength = 52) {
  const text = String(input || '')
    .replace(/[
	]+/g, ' ')
    .replace(/s+/g, ' ')
    .trim();
  if (!text) return 'Novo chat';

  const cleaned = text
    .replace(/^[-#>*d.)s]+/, '')
    .replace(/^[“"'‘’]+|[”"'‘’]+$/g, '')
    .trim();

  const firstSentence = cleaned.split(/(?<=[.!?])s+/)[0] || cleaned;
  if (firstSentence.length <= maxLength) return firstSentence.replace(/[.!?]+$/g, '').trim() || 'Novo chat';

  const words = firstSentence.split(' ');
  let title = '';
  for (const word of words) {
    const next = title ? title + ' ' + word : word;
    if (next.length > maxLength) break;
    title = next;
  }
  return (title || firstSentence.slice(0, maxLength)).replace(/[,:;.!?]+$/g, '').trim() || 'Novo chat';
}
