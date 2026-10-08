const { contextBridge, ipcRenderer } = require('electron');
const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args);
contextBridge.exposeInMainWorld('mcfBrowser', Object.freeze({
  open: url => invoke('mcf-browser:open', url),
  close: () => invoke('mcf-browser:close'),
  navigate: url => invoke('mcf-browser:navigate', url),
  back: () => invoke('mcf-browser:back'),
  forward: () => invoke('mcf-browser:forward'),
  reload: () => invoke('mcf-browser:reload'),
  state: () => invoke('mcf-browser:state'),
  worldReady: () => ipcRenderer.send('mcf-world:ready'),
  onState: callback => {
    const handler = (_event, state) => callback(state);
    ipcRenderer.on('mcf-browser:state', handler);
    return () => ipcRenderer.removeListener('mcf-browser:state', handler);
  },
}));
