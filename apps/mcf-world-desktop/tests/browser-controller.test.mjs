import test from 'node:test';
import assert from 'node:assert/strict';
import { createBrowserController } from '../electron/browser-controller.mjs';

class FakeView {
  constructor(options) {
    this.options = options;
    this.bounds = null;
    this.handler = null;
    const history = { back:0, forward:0 };
    this.webContents = {
      urls: [],
      navigationHistory: {
        canGoBack: () => true,
        canGoForward: () => true,
        goBack: () => history.back++,
        goForward: () => history.forward++,
      },
      loadURL: async url => { this.webContents.urls.push(url); },
      reload: () => { this.reloaded = true; },
      setWindowOpenHandler: fn => { this.handler = fn; },
      session: {
        setPermissionRequestHandler: fn => { this.permissionHandler = fn; },
      },
      on: () => {},
      destroy: () => { this.destroyed = true; },
    };
    this.history = history;
  }
  setBounds(bounds) { this.bounds = bounds; }
}

function harness() {
  const window = {
    webContents: { send() {} },
    contentView: {
      children: [],
      addChildView(v) { this.children.push(v); },
      removeChildView(v) { this.children = this.children.filter(x => x !== v); },
    },
    getContentBounds() { return { width:1200, height:800 }; },
  };
  const ipcMain = { handlers:new Map(), handle(name,fn){this.handlers.set(name,fn);} };
  const controller = createBrowserController({ window, ipcMain, WebContentsView:FakeView, toolbarHeight:72 });
  return { window, ipcMain, controller };
}

test('open attaches secure WebContentsView and lays it below toolbar', async () => {
  const { window, controller } = harness();
  await controller.open('example.com');
  assert.equal(window.contentView.children.length, 1);
  const view = window.contentView.children[0];
  assert.equal(view.options.webPreferences.nodeIntegration, false);
  assert.equal(view.options.webPreferences.contextIsolation, true);
  assert.deepEqual(view.bounds, { x:0, y:72, width:1200, height:728 });
  assert.equal(view.webContents.urls[0], 'https://example.com/');
});

test('navigate rejects privileged protocols and popup is denied while same url loads internally', async () => {
  const { window, controller } = harness();
  await controller.open('https://example.com');
  await assert.rejects(() => controller.navigate('file:///etc/passwd'));
  const view = window.contentView.children[0];
  const decision = view.handler({ url:'https://openai.com/' });
  assert.deepEqual(decision, { action:'deny' });
  await new Promise(r => setImmediate(r));
  assert.equal(view.webContents.urls.at(-1), 'https://openai.com/');
});

test('close detaches and destroys remote view without destroying shell', async () => {
  const { window, controller } = harness();
  await controller.open('https://example.com');
  const view = window.contentView.children[0];
  controller.close();
  assert.equal(window.contentView.children.length, 0);
  assert.equal(view.destroyed, true);
  assert.equal(controller.isOpen(), false);
});


test('open denies remote permission requests by default', async () => {
  const { window, controller } = harness();
  await controller.open('https://example.com');
  const view = window.contentView.children[0];
  assert.equal(typeof view.permissionHandler, 'function');
  let decision = null;
  view.permissionHandler(view.webContents, 'camera', allowed => { decision = allowed; });
  assert.equal(decision, false);
});


test('IPC handlers reject any sender other than the trusted world renderer', () => {
  const { window, ipcMain } = harness();
  const stateHandler = ipcMain.handlers.get('mcf-browser:state');
  assert.equal(typeof stateHandler, 'function');
  assert.throws(() => stateHandler({ sender: {} }), /Untrusted IPC sender/);
  assert.deepEqual(stateHandler({ sender: window.webContents }), { open: false, url: null });
});
