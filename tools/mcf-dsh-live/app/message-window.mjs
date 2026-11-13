/** Preserve the newest instructions in large CodeBuddy user messages.
 * Other role messages keep their leading context as before. */
export function clipMessage(role, text, limit = 6500) {
  const value = String(text ?? '');
  if (!Number.isInteger(limit) || limit < 1) throw new RangeError('Invalid message limit');
  if (value.length <= limit) return value;
  return role === 'user' ? value.slice(-limit) : value.slice(0, limit);
}
