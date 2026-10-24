const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('endaxisOverlayToolbar', {
  getState: () => ipcRenderer.invoke('endaxis:toolbar:state'),
  command: command => ipcRenderer.invoke('endaxis:toolbar:command', command),
  onState: callback => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on('endaxis:toolbar:state', listener);
    return () => ipcRenderer.removeListener('endaxis:toolbar:state', listener);
  },
});
