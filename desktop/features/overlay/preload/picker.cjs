/** 仅本地框选窗口可用，不暴露通用 IPC、文件或桌面访问。 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('endaxisRegionPicker', {
  initialize: () => ipcRenderer.invoke('endaxis:region-picker:init'),
  confirm: region =>
    ipcRenderer.send('endaxis:region-picker:select', {
      x: region?.x,
      y: region?.y,
      width: region?.width,
      height: region?.height,
    }),
  cancel: () => ipcRenderer.send('endaxis:region-picker:select', null),
});
