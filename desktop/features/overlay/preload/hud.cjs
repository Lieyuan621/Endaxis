/** 仅 HUD 加载此 preload；普通编辑器没有桌面权限。 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('endaxisDesktop', {
  isDesktop: true,
  inputFeedback: {
    setEnabled: enabled => ipcRenderer.invoke('endaxis:input-feedback:enable', enabled),
    onInput: callback => {
      const listener = (_event, value) => callback(value);
      ipcRenderer.on('endaxis:input-feedback:event', listener);
      return () => ipcRenderer.removeListener('endaxis:input-feedback:event', listener);
    },
    onStatus: callback => {
      const listener = (_event, value) => callback(value);
      ipcRenderer.on('endaxis:input-feedback:status', listener);
      return () => ipcRenderer.removeListener('endaxis:input-feedback:status', listener);
    },
  },
  countdownTrigger: {
    info: () => ipcRenderer.invoke('endaxis:countdown-info'),
    selectRegion: () => ipcRenderer.invoke('endaxis:countdown-select'),
    arm: () => ipcRenderer.invoke('endaxis:countdown-arm'),
    disarm: () => ipcRenderer.invoke('endaxis:countdown-disarm'),
    clear: () => ipcRenderer.invoke('endaxis:countdown-clear'),
    onStatus: callback => {
      const listener = (_event, status) => callback(status);
      ipcRenderer.on('endaxis:countdown-status', listener);
      return () => ipcRenderer.removeListener('endaxis:countdown-status', listener);
    },
    onTrigger: callback => {
      const listener = (_event, value) => {
        if (Number.isFinite(value?.elapsedSeconds) && value.elapsedSeconds >= 0)
          callback({ elapsedSeconds: value.elapsedSeconds });
      };
      ipcRenderer.on('endaxis:countdown-trigger', listener);
      return () => ipcRenderer.removeListener('endaxis:countdown-trigger', listener);
    },
  },
  toggleClickThrough: () => ipcRenderer.invoke('endaxis:toggle-click-through'),
  setClickThrough: value => ipcRenderer.invoke('endaxis:set-click-through', value),
  info: () => ipcRenderer.invoke('endaxis:desktop-info'),
  openEditor: () => ipcRenderer.invoke('endaxis:open-editor'),
  quit: () => ipcRenderer.invoke('endaxis:quit'),
  closeOverlay: () => ipcRenderer.invoke('endaxis:close-overlay'),
  openSettings: () => ipcRenderer.invoke('endaxis:overlay-settings:open'),
  publishSettings: state => ipcRenderer.invoke('endaxis:overlay-settings:publish', state),
  onSettingsCommand: callback => {
    const listener = (_event, command) => callback(command);
    ipcRenderer.on('endaxis:overlay-settings:command', listener);
    return () => ipcRenderer.removeListener('endaxis:overlay-settings:command', listener);
  },
  onPlaybackCommand: callback => {
    const listener = (_event, command) => {
      if (['toggle', 'restart', 'backward', 'forward'].includes(command)) callback(command);
    };
    ipcRenderer.on('endaxis:playback-command', listener);
    return () => ipcRenderer.removeListener('endaxis:playback-command', listener);
  },
  onClickThrough: callback => {
    const listener = (_event, value) => callback(Boolean(value));
    ipcRenderer.on('endaxis:click-through', listener);
    return () => ipcRenderer.removeListener('endaxis:click-through', listener);
  },
});
