import { describe, expect, it } from 'vitest';
import {
  BOX_SELECT_SOURCE_MODIFIER,
  BOX_SELECT_SOURCE_TOOLBAR,
  isClickOnlyBox,
  isTemporaryBoxSelectGesture,
  shouldShowBoxSelectionToast,
  shouldStartTimelinePan,
} from './timelineSelectionGestures';

describe('timelineSelectionGestures', () => {
  it('starts temporary box selection only for Ctrl left-drag outside placement mode', () => {
    expect(isTemporaryBoxSelectGesture({ button: 0, ctrlKey: true }, false)).toBe(true);
    expect(isTemporaryBoxSelectGesture({ button: 0, ctrlKey: true }, true)).toBe(false);
    expect(isTemporaryBoxSelectGesture({ button: 0, ctrlKey: false }, false)).toBe(false);
    expect(isTemporaryBoxSelectGesture({ button: 1, ctrlKey: true }, false)).toBe(false);
  });

  it('ignores click-only temporary selection boxes by drag threshold', () => {
    expect(isClickOnlyBox(0, 0, 5)).toBe(true);
    expect(isClickOnlyBox(5, -3, 5)).toBe(true);
    expect(isClickOnlyBox(6, 0, 5)).toBe(false);
    expect(isClickOnlyBox(0, -6, 5)).toBe(false);
  });

  it('shows selected-count toast only for toolbar box selection', () => {
    expect(shouldShowBoxSelectionToast(BOX_SELECT_SOURCE_TOOLBAR)).toBe(true);
    expect(shouldShowBoxSelectionToast(BOX_SELECT_SOURCE_MODIFIER)).toBe(false);
  });

  it('starts timeline panning only from middle button on timeline blank area', () => {
    expect(shouldStartTimelinePan({ button: 1, isBlankTarget: true })).toBe(true);
    expect(shouldStartTimelinePan({ button: 1, isBlankTarget: false })).toBe(false);
    expect(shouldStartTimelinePan({ button: 0, isBlankTarget: true })).toBe(false);
  });
});
