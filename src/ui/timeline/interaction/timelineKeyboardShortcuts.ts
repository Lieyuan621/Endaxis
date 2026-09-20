/**
 * 将时间轴编辑器支持的按键组合映射为命令，不读取项目、选择或 DOM 状态。
 * 焦点和浮层作用域由外层快捷键路由器判断；这里仅保证组合键语义可独立测试和扩展。
 */
export interface TimelineKeyboardCommands {
  readonly undo: () => boolean;
  readonly redo: () => boolean;
  readonly copy: () => boolean;
  readonly paste: () => boolean;
  readonly delete: () => boolean;
  readonly nudgeLeft: () => boolean;
  readonly nudgeRight: () => boolean;
  readonly toggleSnapPrecision: () => boolean;
  readonly toggleCursorGuide: () => boolean;
  readonly toggleBoxSelect: () => boolean;
  readonly toggleConnectionTool: () => boolean;
  readonly cycleTrack: (direction: -1 | 1) => boolean;
  readonly selectTrack: (trackIndex: 0 | 1 | 2 | 3) => boolean;
  readonly placeSkill: (slot: 1 | 2 | 3 | 4 | 5 | 6) => boolean;
  readonly cancelPlacement: () => boolean;
}

export function handleTimelineEditorShortcut(
  event: KeyboardEvent,
  commands: TimelineKeyboardCommands,
): boolean {
  const key = event.key.toLowerCase();
  if (!event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && key === 'escape') {
    return commands.cancelPlacement();
  }
  if (!event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
    const functionKey = /^f([1-4])$/.exec(key);
    if (functionKey !== null) {
      return commands.selectTrack((Number(functionKey[1]) - 1) as 0 | 1 | 2 | 3);
    }
    if (/^[1-6]$/.test(key)) return commands.placeSkill(Number(key) as 1 | 2 | 3 | 4 | 5 | 6);
  }
  if (!event.altKey && !event.metaKey && event.ctrlKey && !event.shiftKey && key === 'g') {
    return commands.toggleCursorGuide();
  }
  if (!event.altKey && !event.metaKey && event.ctrlKey && !event.shiftKey && key === 'b') {
    return commands.toggleBoxSelect();
  }
  if (!event.altKey && !event.ctrlKey && !event.metaKey && key === 'tab') {
    return commands.cycleTrack(event.shiftKey ? -1 : 1);
  }
  if (event.altKey) {
    if (!event.ctrlKey && !event.metaKey && !event.shiftKey && key === 'l') {
      return commands.toggleConnectionTool();
    }
    if (!event.ctrlKey && !event.metaKey && !event.shiftKey && key === 's') {
      return commands.toggleSnapPrecision();
    }
    return false;
  }
  if (event.ctrlKey || event.metaKey) {
    if (key === 'z') return event.shiftKey ? commands.redo() : commands.undo();
    if (key === 'y' && !event.shiftKey) return commands.redo();
    if (!event.shiftKey && key === 'c') return commands.copy();
    if (!event.shiftKey && key === 'v') return commands.paste();
    return false;
  }
  if (event.shiftKey) return false;
  if (key === 'delete' || key === 'backspace') return commands.delete();
  if (key === 'arrowleft' || key === 'a') return commands.nudgeLeft();
  if (key === 'arrowright' || key === 'd') return commands.nudgeRight();
  return false;
}
