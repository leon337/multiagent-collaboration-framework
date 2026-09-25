import { normalizeHttpUrl } from '../src/browser/portal-registry.mjs';

export function createBrowserController({ window, ipcMain, WebContentsView, toolbarHeight = 72, logger = console }) {
  let view = null;
  let currentUrl = null;

  const emitState = (extra = {}) => {
    const state = { open: !!view, url: currentUrl, ...extra };
    try { window.webContents?.send?.('mcf-browser:state', state); } catch {}
    return state;
  };

  const layout = (width, height) => {
    if (!view) return;
    const bounds = width == null || height == null ? window.getContentBounds() : { width, height };
    view.setBounds({ x: 0, y: toolbarHeight, width: Math.max(0, bounds.width), height: Math.max(0, bounds.height - toolbarHeight) });
  };

  const navigate = async (input) => {
    if (!view) throw new Error('Browser surface is not open');
    const url = normalizeHttpUrl(input);
    currentUrl = url;
    await view.webContents.loadURL(url);
    emitState();
    return url;
  };

  const open = async (input) => {
    const url = normalizeHttpUrl(input);
    if (!view) {
      view = new WebContentsView({ webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true } });
      window.contentView.addChildView(view);
      view.webContents.session?.setPermissionRequestHandler?.((_webContents, _permission, callback) => callback(false));
      view.webContents.setWindowOpenHandler(({ url: popupUrl }) => {
        queueMicrotask(() => navigate(popupUrl).catch(err => logger.warn?.('popup navigation blocked', err.message)));
        return { action: 'deny' };
      });
      view.webContents.on?.('did-navigate', (_event, nextUrl) => { currentUrl = nextUrl; emitState(); });
      view.webContents.on?.('did-fail-load', (_event, code, description, failedUrl) => emitState({ loadError: { code, description, url: failedUrl } }));
    }
    layout();
    const loaded = await navigate(url);
    logger.info?.(`MCF_BROWSER_OPENED url=${loaded}`);
    return loaded;
  };

  const close = () => {
    if (!view) return emitState();
    const old = view;
    view = null;
    currentUrl = null;
    try { window.contentView.removeChildView(old); } catch {}
    try { old.webContents.destroy(); } catch {}
    logger.info?.('MCF_BROWSER_CLOSED');
    return emitState();
  };

  const back = () => { if (view?.webContents.navigationHistory.canGoBack()) view.webContents.navigationHistory.goBack(); };
  const forward = () => { if (view?.webContents.navigationHistory.canGoForward()) view.webContents.navigationHistory.goForward(); };
  const reload = () => view?.webContents.reload();
  const isOpen = () => !!view;
  const state = () => ({ open: !!view, url: currentUrl });

  if (ipcMain?.handle) {
    const trusted = (event) => {
      if (event?.sender !== window.webContents) throw new Error('Untrusted IPC sender');
    };
    const handle = (channel, action) => ipcMain.handle(channel, (event, ...args) => {
      trusted(event);
      return action(...args);
    });
    handle('mcf-browser:open', url => open(url));
    handle('mcf-browser:close', () => close());
    handle('mcf-browser:navigate', url => navigate(url));
    handle('mcf-browser:back', () => back());
    handle('mcf-browser:forward', () => forward());
    handle('mcf-browser:reload', () => reload());
    handle('mcf-browser:state', () => state());
  }

  return { open, close, navigate, back, forward, reload, layout, isOpen, state };
}
