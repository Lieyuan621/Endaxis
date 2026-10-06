/** 图编辑器与资产工作区共用的侧栏范围；窄窗口优先保留侧栏最小可读宽度。 */
export function editorPanelWidth(
  requested: number,
  containerWidth: number,
  otherWidth: number,
): number {
  return Math.max(160, Math.min(360, containerWidth - otherWidth - 360, requested));
}
