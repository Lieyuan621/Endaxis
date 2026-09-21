export type WorkbenchBottomTool = 'global' | 'contract' | 'enemy';
export type WorkbenchRightTool = 'inspector' | 'performance' | 'battleLog';

export interface WorkbenchLayoutState {
  readonly leftCollapsed: boolean;
  readonly rightCollapsed: boolean;
  readonly bottomCollapsed: boolean;
  readonly leftWidth: number;
  readonly rightWidth: number;
  readonly bottomHeight: number;
  readonly bottomTool: WorkbenchBottomTool;
  readonly rightTool: WorkbenchRightTool;
}

function recordOf(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function booleanOf(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function numberOf(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/** 读取 main 分支的工作台布局格式。 */
export function parseWorkbenchLayoutState(value: unknown): Partial<WorkbenchLayoutState> {
  const source = recordOf(value);
  if (source === null) return {};

  const result: {
    leftCollapsed?: boolean;
    rightCollapsed?: boolean;
    bottomCollapsed?: boolean;
    leftWidth?: number;
    rightWidth?: number;
    bottomHeight?: number;
    bottomTool?: WorkbenchBottomTool;
    rightTool?: WorkbenchRightTool;
  } = {};
  const leftCollapsed = booleanOf(source.isLeftPanelCollapsed);
  const rightCollapsed = booleanOf(source.isRightPanelCollapsed);
  const bottomCollapsed = booleanOf(source.isBottomPanelCollapsed);
  const leftWidth = numberOf(source.leftPanelWidth);
  const rightWidth = numberOf(source.rightPanelWidth);
  const bottomHeight = numberOf(source.bottomPanelHeight);

  if (leftCollapsed !== undefined) result.leftCollapsed = leftCollapsed;
  if (rightCollapsed !== undefined) result.rightCollapsed = rightCollapsed;
  if (bottomCollapsed !== undefined) result.bottomCollapsed = bottomCollapsed;
  if (leftWidth !== undefined) result.leftWidth = leftWidth;
  if (rightWidth !== undefined) result.rightWidth = rightWidth;
  if (bottomHeight !== undefined) result.bottomHeight = bottomHeight;

  const bottomTool = source.leftBottomTool;
  if (bottomTool === 'global' || bottomTool === 'contract' || bottomTool === 'enemy') {
    result.bottomTool = bottomTool;
  }
  const rightTool = source.rightPanelTool;
  if (rightTool === 'inspector' || rightTool === 'performance' || rightTool === 'battleLog') {
    result.rightTool = rightTool;
  }
  return result;
}

/** 写回 main 分支的工作台布局格式。 */
export function serializeWorkbenchLayoutState(
  state: WorkbenchLayoutState,
): Record<string, unknown> {
  return {
    leftPanelWidth: Math.round(state.leftWidth),
    rightPanelWidth: Math.round(state.rightWidth),
    bottomPanelHeight: Math.round(state.bottomHeight),
    isLeftPanelCollapsed: state.leftCollapsed,
    isRightPanelCollapsed: state.rightCollapsed,
    isBottomPanelCollapsed: state.bottomCollapsed,
    leftBottomTool: state.bottomTool,
    rightPanelTool: state.rightTool,
  };
}
