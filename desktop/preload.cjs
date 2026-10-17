/**
 * 悬浮窗的 preload：只向页面暴露少量桌面能力。
 * 页面通过 `window.endaxisDesktop` 判断自己是否运行在桌面外壳里。
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('endaxisDesktop', {
  isDesktop: true,
  /** 切换鼠标穿透，返回新状态。 */
  toggleClickThrough: () => ipcRenderer.invoke('endaxis:toggle-click-through'),
  setClickThrough: value => ipcRenderer.invoke('endaxis:set-click-through', Boolean(value)),
  /** 当前穿透状态与窗口信息。 */
  info: () => ipcRenderer.invoke('endaxis:desktop-info'),
  /** 调整窗口尺寸（页面按 HUD 宽高与设置面板开合调用）。 */
  resize: size => ipcRenderer.invoke('endaxis:resize', size),
  quit: () => ipcRenderer.invoke('endaxis:quit'),
  /** 订阅穿透状态变化；返回取消订阅函数。 */
  onClickThrough: callback => {
    const listener = (_event, value) => callback(Boolean(value));
    ipcRenderer.on('endaxis:click-through', listener);
    return () => ipcRenderer.removeListener('endaxis:click-through', listener);
  },
});
