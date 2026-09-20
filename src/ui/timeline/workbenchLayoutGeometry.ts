/** 顶栏 50px 内容加 1px 下边框。 */
export const WORKBENCH_HEADER_HEIGHT = 51;
export const WORKBENCH_BOTTOM_RESIZER_HEIGHT = 1;
export const WORKBENCH_TIMELINE_MIN_HEIGHT = 600;
export const WORKBENCH_BOTTOM_DEFAULT_HEIGHT = 240;

export interface WorkbenchBottomHeightBounds {
  readonly minimum: number;
  readonly maximum: number;
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
