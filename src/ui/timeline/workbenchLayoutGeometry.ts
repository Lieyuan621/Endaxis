import { monitorMinimumContentHeight } from './results/monitorSectionMinimums';

/** 与 main 分支一致：50px 已包含顶栏下边框。 */
export const WORKBENCH_HEADER_HEIGHT = 50;
export const WORKBENCH_ACTIVITY_BAR_WIDTH = 48;
export const WORKBENCH_PANEL_MAX_WIDTH = 480;
export const WORKBENCH_LEFT_PANEL_MIN_WIDTH = 200;
export const WORKBENCH_RIGHT_PANEL_MIN_WIDTH = 260;
export const WORKBENCH_TIMELINE_MIN_WIDTH = 540;
export const WORKBENCH_BOTTOM_RESIZER_HEIGHT = 1;
/** 与 main 分支的工作台契约一致，保留足够的底部监视区可用高度。 */
export const WORKBENCH_TIMELINE_MIN_HEIGHT = 520;
export const WORKBENCH_BOTTOM_DEFAULT_HEIGHT = 240;

export interface WorkbenchBottomHeightBounds {
  readonly minimum: number;
  readonly maximum: number;
}

export function resolveWorkbenchSidePanelMaximumWidth(
  workbenchWidth: number,
  minimumWidth: number,
): number {
  if (!(workbenchWidth > 0)) return WORKBENCH_PANEL_MAX_WIDTH;
  const availableWidth = workbenchWidth - WORKBENCH_TIMELINE_MIN_WIDTH;
  return Math.min(
    WORKBENCH_PANEL_MAX_WIDTH,
    Math.max(minimumWidth, Math.floor(availableWidth / 2)),
  );
}

/**
 * 优先保留时间轴高度，短窗口允许底栏缩小至监视器最小内容高度。再小则由工作台滚动，
 * 避免展开的监视区变为零高度；拖动边界与实际展示使用同一规则。
 */
export function resolveWorkbenchBottomHeightBounds(
  workbenchHeight: number,
  fallbackHeight: number,
  collapsedSectionCount = 0,
): WorkbenchBottomHeightBounds {
  const monitorMinimum = monitorMinimumContentHeight(collapsedSectionCount);
  const maximum =
    workbenchHeight > 0
      ? Math.max(
          monitorMinimum,
          workbenchHeight -
            WORKBENCH_HEADER_HEIGHT -
            WORKBENCH_TIMELINE_MIN_HEIGHT -
            WORKBENCH_BOTTOM_RESIZER_HEIGHT,
        )
      : Math.max(0, fallbackHeight);
  return {
    minimum: Math.min(
      Math.max(
        monitorMinimum,
        WORKBENCH_BOTTOM_DEFAULT_HEIGHT *
          (1 - Math.min(2, Math.max(0, collapsedSectionCount)) * 0.25),
      ),
      maximum,
    ),
    maximum,
  };
}

export function resolveWorkbenchBottomHeight(
  workbenchHeight: number,
  requestedHeight: number,
  collapsed: boolean,
  collapsedSectionCount = 0,
): number {
  if (collapsed) return 0;
  const bounds = resolveWorkbenchBottomHeightBounds(
    workbenchHeight,
    requestedHeight,
    collapsedSectionCount,
  );
  return Math.round(
    Math.min(bounds.maximum, Math.max(bounds.minimum, Math.max(0, requestedHeight))),
  );
}
