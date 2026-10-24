const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('endaxisOverlaySettings', {
  getState: () => ipcRenderer.invoke('endaxis:overlay-settings:get-state'),
  command: command => ipcRenderer.invoke('endaxis:overlay-settings:command', command),
  close: () => ipcRenderer.invoke('endaxis:overlay-settings:close'),
  onState: callback => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on('endaxis:overlay-settings:state', listener);
    return () => ipcRenderer.removeListener('endaxis:overlay-settings:state', listener);
  },
});
