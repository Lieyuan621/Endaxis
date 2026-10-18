/** 编辑器只获得显示现有 HUD 的能力，不能调用窗口控制 IPC。 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('endaxisDesktopEditor', {
  showOverlay: () => ipcRenderer.invoke('endaxis:show-overlay'),
});
