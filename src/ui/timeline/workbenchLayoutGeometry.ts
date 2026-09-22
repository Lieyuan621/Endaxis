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
 * Mirrors the legacy workbench's observable sizing rule: preserve the timeline minimum first,
 * then let the bottom panel shrink below its normal 240px minimum when the viewport is short.
 */
export function resolveWorkbenchBottomHeightBounds(
  workbenchHeight: number,
  fallbackHeight: number,
  collapsedSectionCount = 0,
): WorkbenchBottomHeightBounds {
  const maximum =
    workbenchHeight > 0
      ? Math.max(
          0,
          workbenchHeight -
            WORKBENCH_HEADER_HEIGHT -
            WORKBENCH_TIMELINE_MIN_HEIGHT -
            WORKBENCH_BOTTOM_RESIZER_HEIGHT,
        )
      : Math.max(0, fallbackHeight);
  return {
    minimum: Math.min(
      WORKBENCH_BOTTOM_DEFAULT_HEIGHT *
        (1 - Math.min(2, Math.max(0, collapsedSectionCount)) * 0.25),
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
