export const CHATGPT_SHARE_PARSER_VERSION = '1.0.0';

export interface ChatGptShareMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export interface ChatGptShareRecoveryResult {
  shareId: string;
  sourceUrl: string;
  title: string | null;
  model: string | null;
  currentNode: string | null;
  isPublic: boolean | null;
  isReadOnly: boolean | null;
  nodeCount: number;
  textNodeCount: number;
  technicalNodeCount: number;
  messages: ChatGptShareMessage[];
  parserVersion: string;
  warnings: string[];
}

export class ChatGptShareParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChatGptShareParseError';
  }
}

export function validateChatGptShareUrl(value: string): { canonicalUrl: string; shareId: string } {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ChatGptShareParseError('ChatGPT share URL is invalid');
  }
  if (url.protocol !== 'https:') {
    throw new ChatGptShareParseError('ChatGPT share URL must use HTTPS');
  }
  if (url.hostname !== 'chatgpt.com' || url.username || url.password || url.port) {
    throw new ChatGptShareParseError('ChatGPT share URL must target chatgpt.com');
  }
  if (url.search || url.hash) {
    throw new ChatGptShareParseError('ChatGPT share URL must not contain query or fragment data');
  }
  const match = /^\/share\/([A-Za-z0-9-]{16,128})\/?$/u.exec(url.pathname);
  if (!match?.[1]) {
    throw new ChatGptShareParseError('ChatGPT share URL must use /share/<id>');
  }
  return {
    canonicalUrl: `https://chatgpt.com/share/${match[1]}`,
    shareId: match[1],
  };
}

type SerializedRecord = Record<string, unknown>;

function isRecord(value: unknown): value is SerializedRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function dereference(table: unknown[], value: unknown): unknown {
  if (typeof value !== 'number' || !Number.isInteger(value)) return value;
  if (value < 0 || value >= table.length) return null;
  return table[value];
}

function decodedKey(table: unknown[], rawKey: string): string | null {
  const match = /^_(\d+)$/u.exec(rawKey);
  if (!match?.[1]) return rawKey;
  const index = Number.parseInt(match[1], 10);
  const value = table[index];
  return typeof value === 'string' ? value : null;
}

function getProperty(table: unknown[], record: SerializedRecord, key: string): unknown {
  for (const [rawKey, rawValue] of Object.entries(record)) {
    if (decodedKey(table, rawKey) === key) return dereference(table, rawValue);
  }
  return undefined;
}

function findRecordWithProperty(table: unknown[], key: string): SerializedRecord | null {
  for (const candidate of table) {
    if (!isRecord(candidate)) continue;
    if (getProperty(table, candidate, key) !== undefined) return candidate;
  }
  return null;
}

function asString(table: unknown[], value: unknown): string | null {
  const resolved = dereference(table, value);
  return typeof resolved === 'string' ? resolved : null;
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function decodeHtmlText(value: string): string {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .trim();
}

function documentTitle(html: string): string | null {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/iu.exec(html);
  if (!match?.[1]) return null;
  const decoded = decodeHtmlText(match[1]);
  return decoded.startsWith('ChatGPT - ') ? decoded.slice('ChatGPT - '.length).trim() : decoded;
}

function serializedTables(html: string): unknown[][] {
  const tables: unknown[][] = [];
  const scriptPattern = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/giu;
  for (const match of html.matchAll(scriptPattern)) {
    const script = match[1] ?? '';
    if (!script.includes('enqueue(')) continue;
    const start = script.lastIndexOf('enqueue(');
    const end = script.lastIndexOf(');');
    if (start < 0 || end <= start) continue;
    try {
      const outer: unknown = JSON.parse(script.slice(start + 'enqueue('.length, end));
      const decoded: unknown = typeof outer === 'string' ? JSON.parse(outer) : outer;
      if (Array.isArray(decoded)) tables.push(decoded);
    } catch {
      continue;
    }
  }
  return tables;
}

function extractPartText(table: unknown[], part: unknown): string | null {
  const resolved = dereference(table, part);
  if (typeof resolved === 'string') return resolved;
  if (!isRecord(resolved)) return null;
  for (const key of ['text', 'content', 'result']) {
    const candidate = getProperty(table, resolved, key);
    const text = asString(table, candidate);
    if (text) return text;
  }
  return null;
}

function messageText(table: unknown[], content: unknown): string {
  if (!isRecord(content)) return '';
  const parts = getProperty(table, content, 'parts');
  const texts: string[] = [];
  if (Array.isArray(parts)) {
    for (const part of parts) {
      const text = extractPartText(table, part);
      if (text?.trim()) texts.push(text);
    }
  }
  if (texts.length === 0) {
    const direct = asString(table, getProperty(table, content, 'text'));
    if (direct?.trim()) texts.push(direct);
  }
  return texts.join('\n').trim();
}

function parseTable(
  table: unknown[],
  sourceUrl: string,
  title: string | null,
): ChatGptShareRecoveryResult | null {
  const metadata = findRecordWithProperty(table, 'linear_conversation');
  if (!metadata) return null;
  const linear = getProperty(table, metadata, 'linear_conversation');
  if (!Array.isArray(linear)) return null;

  const messages: ChatGptShareMessage[] = [];
  let textNodeCount = 0;
  for (const nodeRef of linear) {
    const node = dereference(table, nodeRef);
    if (!isRecord(node)) continue;
    const message = getProperty(table, node, 'message');
    if (!isRecord(message)) continue;
    const author = getProperty(table, message, 'author');
    const role = isRecord(author) ? asString(table, getProperty(table, author, 'role')) : null;
    const text = messageText(table, getProperty(table, message, 'content'));
    if (!text) continue;
    textNodeCount += 1;
    if (role !== 'user' && role !== 'assistant') continue;
    const id = asString(table, getProperty(table, node, 'id'));
    if (!id) continue;
    messages.push({ id, role, text });
  }

  if (messages.length === 0) {
    throw new ChatGptShareParseError(
      'serialized conversation payload contains no visible messages',
    );
  }
  const { canonicalUrl, shareId } = validateChatGptShareUrl(sourceUrl);
  const warnings: string[] = [];
  const isPublic = asBoolean(getProperty(table, metadata, 'is_public'));
  const isReadOnly = asBoolean(getProperty(table, metadata, 'is_read_only'));
  if (isPublic === null) warnings.push('public flag was not present in the serialized payload');
  if (isReadOnly === null)
    warnings.push('read-only flag was not present in the serialized payload');

  return {
    shareId,
    sourceUrl: canonicalUrl,
    title,
    model: asString(table, getProperty(table, metadata, 'default_model_slug')),
    currentNode: asString(table, getProperty(table, metadata, 'current_node')),
    isPublic,
    isReadOnly,
    nodeCount: linear.length,
    textNodeCount,
    technicalNodeCount: Math.max(0, linear.length - messages.length),
    messages,
    parserVersion: CHATGPT_SHARE_PARSER_VERSION,
    warnings,
  };
}

export function parseChatGptShareDocument(
  html: string,
  sourceUrl: string,
): ChatGptShareRecoveryResult {
  validateChatGptShareUrl(sourceUrl);
  const title = documentTitle(html);
  for (const table of serializedTables(html)) {
    const parsed = parseTable(table, sourceUrl, title);
    if (parsed) return parsed;
  }
  throw new ChatGptShareParseError('serialized conversation payload was not found');
}
