import { app, BrowserWindow, WebContentsView, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createBrowserController } from './browser-controller.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let mainWindow;
let browserController;
const projectRoot = path.join(__dirname, '..');
const runtimeDir = path.join(projectRoot, '.runtime');
const runtimeLogPath = path.join(runtimeDir, 'mcf-world.log');
function runtimeLog(message) {
  fs.mkdirSync(runtimeDir, { recursive: true });
  const line = `${new Date().toISOString()} ${message}`;
  fs.appendFileSync(runtimeLogPath, `${line}\n`);
  console.log(message);
}
const logger = { info: runtimeLog, warn: (...parts) => runtimeLog(`WARN ${parts.join(' ')}`) };
let smokeBrowserExercised = false;
ipcMain.on('mcf-world:ready', async () => {
  runtimeLog('MCF_WORLD_READY');
  if (process.env.MCF_WORLD_SMOKE_BROWSER !== '1' || smokeBrowserExercised) return;
  smokeBrowserExercised = true;
  try {
    await browserController.open('https://example.com');
    setTimeout(() => {
      browserController.close();
      runtimeLog('MCF_SMOKE_BROWSER_DONE');
    }, 1600);
  } catch (error) {
    runtimeLog(`MCF_SMOKE_BROWSER_FAILED ${error.message}`);
  }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 620,
    title: 'MCF World 3D',
    backgroundColor: '#06110b',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  browserController = createBrowserController({ window: mainWindow, ipcMain, WebContentsView, logger });
  mainWindow.on('resize', () => browserController.layout());
  mainWindow.on('closed', () => { browserController?.close(); mainWindow = null; });
  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
