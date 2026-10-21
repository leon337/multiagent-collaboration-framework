export const MAX_FRAME = 32768;
export function encode(value) {
  const body = Buffer.from(JSON.stringify(value));
  if (!body.length || body.length > MAX_FRAME) throw Error('FRAME_SIZE');
  const head = Buffer.alloc(4); head.writeUInt32LE(body.length);
  return Buffer.concat([head, body]);
}
export class FrameParser {
  constructor(onMessage) { this.onMessage = onMessage; this.buffer = Buffer.alloc(0); this.failed = false; }
  push(chunk) {
    if (this.failed) throw Error('PARSER_CLOSED');
    try {
      // Consume incrementally, never retain an unbounded input chunk.
      let offset = 0;
      while (offset < chunk.length) {
        const goal = this.buffer.length < 4 ? 4 : 4 + this.buffer.readUInt32LE(0);
        const count = Math.min(goal - this.buffer.length, chunk.length - offset);
        this.buffer = Buffer.concat([this.buffer, chunk.subarray(offset, offset + count)]); offset += count;
        if (this.buffer.length < 4) continue;
        const size = this.buffer.readUInt32LE(0);
        if (!size || size > MAX_FRAME) throw Error('FRAME_SIZE');
        if (this.buffer.length === size + 4) {
          const body = new TextDecoder('utf-8', { fatal: true }).decode(this.buffer.subarray(4));
          this.buffer = Buffer.alloc(0); this.onMessage(JSON.parse(body));
        }
      }
    } catch (e) { this.failed = true; this.buffer = Buffer.alloc(0); throw e; }
  }
  end() { if (this.buffer.length) { this.failed = true; throw Error('TRUNCATED_FRAME'); } }
}
