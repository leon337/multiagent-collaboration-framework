import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';

const source = process.env.MCF_GOOGLE_DRIVE_SOURCE_OAUTH_CLIENT || path.join(homedir(), '.config', 'estudio-binaural', 'google-drive-oauth-client.json');
const targetDir = process.env.MCF_GOOGLE_DRIVE_CONFIG_DIR || path.join(homedir(), '.config', 'mcf-google-drive-agent');
const target = path.join(targetDir, 'oauth-client.json');

async function exists(file) { try { await access(file); return true; } catch { return false; } }
async function main() {
  if (await exists(target)) {
    process.stdout.write('OAuth client já configurado no cofre privado.\n');
    return;
  }
  const raw = await readFile(source, 'utf8');
  const parsed = JSON.parse(raw);
  const client = parsed.installed || parsed.web || parsed;
  if (!/^[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(client?.client_id || ''))
    throw Error('O cliente OAuth local é inválido.');
  await mkdir(targetDir, { recursive: true, mode: 0o700 });
  await writeFile(target, JSON.stringify(parsed, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  process.stdout.write('Cliente OAuth instalado no cofre privado; nenhum segredo foi exibido.\n');
}
main().catch(error => {
  process.stderr.write('OAUTH_CLIENT_SETUP_FAILED ' + (error.code || error.message) + '\n');
  process.exitCode = 1;
});