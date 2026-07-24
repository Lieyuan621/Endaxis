export const BOX_SELECT_SOURCE_TOOLBAR = 'toolbar';
export const BOX_SELECT_SOURCE_MODIFIER = 'modifier';

export type BoxSelectSource = typeof BOX_SELECT_SOURCE_TOOLBAR | typeof BOX_SELECT_SOURCE_MODIFIER;

export type MouseGestureLike =
  | {
      button?: number | null;
      ctrlKey?: boolean | null;
    }
  | null
  | undefined;

export function isTemporaryBoxSelectGesture(
  event: MouseGestureLike,
  isLibraryPlaceMode: boolean,
): boolean {
  return event?.button === 0 && Boolean(event.ctrlKey) && !isLibraryPlaceMode;
}

export function isClickOnlyBox(width: number, height: number, threshold: number): boolean {
  return Math.max(Math.abs(width), Math.abs(height)) <= threshold;
}

export function shouldShowBoxSelectionToast(source: BoxSelectSource): boolean {
  return source === BOX_SELECT_SOURCE_TOOLBAR;
}

export function shouldStartTimelinePan({
  button,
  isBlankTarget,
}: {
  button?: number | null;
  isBlankTarget?: boolean | null;
}): boolean {
  return button === 1 && Boolean(isBlankTarget);
}
