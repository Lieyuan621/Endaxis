const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('endaxisDesktopEditor', {
  updateState: () => ipcRenderer.invoke('endaxis:update-state'),
  restartUpdate: () => ipcRenderer.invoke('endaxis:restart-update'),
  retryUpdate: () => ipcRenderer.invoke('endaxis:retry-update'),
  onUpdateProgress: callback => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on('endaxis:update-progress', listener);
    return () => ipcRenderer.removeListener('endaxis:update-progress', listener);
  },
  showOverlay: () => ipcRenderer.invoke('endaxis:show-overlay'),
});
