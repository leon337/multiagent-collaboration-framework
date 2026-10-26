import { mkdir, readFile, rename, writeFile, chmod } from 'node:fs/promises';
import { dirname } from 'node:path';

export class PrivateState {
  constructor(path) {
    this.path = path;
    this.data = { version: 1, armed: true, naturalMode: false, seen: [], sessionId: null, processed: 0, failed: 0 };
    this.pendingWrite = Promise.resolve();
  }
  async load() {
    await mkdir(dirname(this.path), {recursive:true, mode:0o700});
    try {
      const stored = JSON.parse(await readFile(this.path, 'utf8'));
      if (stored?.version !== 1 || !Array.isArray(stored.seen)) throw Error('bad_state');
      this.data = { ...this.data, ...stored, seen: stored.seen.slice(-500) };
      // Previous successful /mestre dialogue is explicit opt-in to this self-chat.
      if (!Object.hasOwn(stored, 'naturalMode') && stored.sessionId && stored.processed > 0) {
        this.data.naturalMode = true;
        await this.save();
      }
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    return this.data;
  }
  save() {
    this.pendingWrite = this.pendingWrite.then(async () => {
      const temp = this.path + '.tmp';
      await writeFile(temp, JSON.stringify(this.data), { mode:0o600 });
      await rename(temp, this.path);
      await chmod(this.path, 0o600);
    });
    return this.pendingWrite;
  }
  async record(id) {
    if (this.data.seen.includes(id)) return false;
    this.data.seen.push(id);
    this.data.seen = this.data.seen.slice(-500);
    await this.save();
    return true;
  }
  async arm(value) {
    this.data.armed = Boolean(value);
    await this.save();
  }
  async setNaturalMode(value) {
    this.data.naturalMode = Boolean(value);
    await this.save();
  }
  async complete(sessionId) {
    if (sessionId) this.data.sessionId = sessionId;
    this.data.processed++;
    await this.save();
  }
  async failure() { this.data.failed++; await this.save(); }
}
