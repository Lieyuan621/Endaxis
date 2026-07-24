import { describe, expect, it } from 'vitest';
import {
  hasAnyTimelineGridDialogState,
  hasVisibleElementPlusDialog,
  isEditableShortcutTarget,
  isTimelineShortcutScopeBlocked,
} from './shortcutScope';

describe('shortcutScope', () => {
  it('blocks timeline shortcuts from editable targets', () => {
    expect(isEditableShortcutTarget({ tagName: 'input' })).toBe(true);
    expect(isEditableShortcutTarget({ tagName: 'TEXTAREA' })).toBe(true);
    expect(isEditableShortcutTarget({ tagName: 'select' })).toBe(true);
    expect(isEditableShortcutTarget({ tagName: 'div', isContentEditable: true })).toBe(true);
  });

  it('allows timeline shortcuts from non-editable targets', () => {
    expect(isEditableShortcutTarget(null)).toBe(false);
    expect(isEditableShortcutTarget({ tagName: 'button' })).toBe(false);
    expect(isEditableShortcutTarget({ tagName: 'div' })).toBe(false);
  });

  it('blocks timeline shortcuts while any modal scope is active', () => {
    expect(isTimelineShortcutScopeBlocked()).toBe(false);
    expect(isTimelineShortcutScopeBlocked({ hasOpenDialog: true })).toBe(true);
    expect(isTimelineShortcutScopeBlocked({ hasOpenElementPlusDialog: true })).toBe(true);
    expect(isTimelineShortcutScopeBlocked({ hasTimelineGridDialog: true })).toBe(true);
  });

  it('treats any timeline-grid editor dialog as an active shortcut scope', () => {
    expect(hasAnyTimelineGridDialogState({})).toBe(false);
    expect(hasAnyTimelineGridDialogState({ operator: true })).toBe(true);
    expect(hasAnyTimelineGridDialogState({ weapon: true })).toBe(true);
    expect(hasAnyTimelineGridDialogState({ equipment: true })).toBe(true);
    expect(hasAnyTimelineGridDialogState({ statDetail: true })).toBe(true);
    expect(hasAnyTimelineGridDialogState({ hitDetail: true })).toBe(true);
  });

  it('ignores Element Plus dialog DOM after it is hidden', () => {
    const hiddenOverlay = fakeElement({ display: 'none', width: 800, height: 600 });
    hiddenOverlay.querySelector = () => fakeElement({ width: 400, height: 300 });

    expect(hasVisibleElementPlusDialog(fakeDialogRoot([hiddenOverlay]))).toBe(false);
  });

  it('detects visible Element Plus dialogs as an active shortcut scope', () => {
    const visibleOverlay = fakeElement({ width: 800, height: 600 });
    visibleOverlay.querySelector = () => fakeElement({ width: 400, height: 300 });

    expect(hasVisibleElementPlusDialog(fakeDialogRoot([visibleOverlay]))).toBe(true);
  });
});

function fakeDialogRoot(overlays: any[]) {
  return {
    querySelectorAll: (selector: string) => (selector === '.el-overlay' ? overlays : []),
  };
}

function fakeElement({
  display = 'block',
  visibility = 'visible',
  width = 1,
  height = 1,
  ariaHidden = null,
}: {
  display?: string;
  visibility?: string;
  width?: number;
  height?: number;
  ariaHidden?: string | null;
}) {
  const element: any = {
    getAttribute: (name: string) => (name === 'aria-hidden' ? ariaHidden : null),
    getBoundingClientRect: () => ({ width, height }),
  };
  element.ownerDocument = {
    defaultView: {
      getComputedStyle: () => ({ display, visibility }),
    },
  };
  return element;
}
