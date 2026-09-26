import { effectScope, ref } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  useKeyboardInputRegion,
  useKeyboardShortcutScope,
} from '../keyboard/keyboardShortcutRouter';
import { createInteractionSession } from './interactionSession';
import { usePopoverInteractionBoundary } from './usePopoverInteractionBoundary';

describe('interactive popover ownership', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('gives a nested picker Escape before its dialog and resumes map commands after closing', () => {
    const target = new EventTarget();
    vi.stubGlobal('window', target);
    const scope = effectScope();
    const session = createInteractionSession();
    const open = ref(true);
    const map = vi.fn(() => true);
    scope.run(() => {
      useKeyboardShortcutScope({
        id: 'structure-map',
        priority: 200,
        active: () => true,
        handle: map,
        handleClipboard: map,
      });
      usePopoverInteractionBoundary(
        session,
        () => open.value,
        () => {
          open.value = false;
        },
      );
    });
    try {
      target.dispatchEvent(new Event('copy', { cancelable: true }));
      expect(map).not.toHaveBeenCalled();
      const escape = Object.assign(new Event('keydown', { cancelable: true }), { key: 'Escape' });
      target.dispatchEvent(escape);
      expect(escape.defaultPrevented).toBe(true);
      expect(open.value).toBe(false);
      expect(map).not.toHaveBeenCalled();
      target.dispatchEvent(new Event('paste', { cancelable: true }));
      expect(map).toHaveBeenCalledOnce();
    } finally {
      scope.stop();
    }
  });

  it('blocks modal graph Delete without requiring focus inside the lifecycle picker', () => {
    const target = new EventTarget();
    vi.stubGlobal('window', target);
    const scope = effectScope();
    const open = ref(true);
    const graphDelete = vi.fn(() => true);
    scope.run(() => {
      const region = useKeyboardInputRegion({
        label: 'buff-workspace',
        parent: null,
        modal: true,
        active: () => true,
      });
      useKeyboardShortcutScope({
        id: 'graph',
        region,
        priority: 200,
        active: () => true,
        handle: graphDelete,
      });
      // effectScope has no provide/inject; use an actual scope in the same modal region.
      useKeyboardShortcutScope({
        id: 'picker',
        region,
        priority: 400,
        active: () => open.value,
        blockLowerScopes: true,
        handle: event => {
          if (event.key !== 'Escape') return false;
          open.value = false;
          return true;
        },
      });
    });
    const key = (value: string) =>
      target.dispatchEvent(
        Object.assign(new Event('keydown', { cancelable: true }), { key: value }),
      );
    key('Delete');
    expect(graphDelete).not.toHaveBeenCalled();
    key('Escape');
    expect(open.value).toBe(false);
    key('Delete');
    expect(graphDelete).toHaveBeenCalledOnce();
    scope.stop();
  });

  it('blocks background keyboard, clipboard and gestures until Escape closes it', () => {
    const target = new EventTarget();
    vi.stubGlobal('window', target);
    const scope = effectScope();
    const open = ref(false);
    const session = createInteractionSession();
    const background = vi.fn(() => true);
    const cancel = vi.fn();
    scope.run(() => {
      useKeyboardShortcutScope({
        id: 'timeline',
        priority: 10,
        active: () => true,
        handle: background,
        handleClipboard: background,
      });
      usePopoverInteractionBoundary(
        session,
        () => open.value,
        () => {
          open.value = false;
        },
      );
    });
    try {
      session.tryStart('drag', cancel);
      open.value = true;
      expect(cancel).toHaveBeenCalledOnce();
      expect(session.tryStart('another-drag', cancel)).toBeNull();
      const key = (value: string) =>
        Object.assign(new Event('keydown', { cancelable: true }), { key: value });
      target.dispatchEvent(key('Delete'));
      const copy = new Event('copy', { cancelable: true });
      target.dispatchEvent(copy);
      expect(background).not.toHaveBeenCalled();
      expect(copy.defaultPrevented).toBe(false);
      target.dispatchEvent(key('Escape'));
      expect(open.value).toBe(false);
      expect(background).not.toHaveBeenCalled();
      expect(session.tryStart('next-drag', cancel)).not.toBeNull();
      target.dispatchEvent(key('Delete'));
      expect(background).toHaveBeenCalledOnce();
    } finally {
      scope.stop();
    }
  });

  it('releases an open boundary on unmount', () => {
    vi.stubGlobal('window', new EventTarget());
    const scope = effectScope();
    const session = createInteractionSession();
    scope.run(() => usePopoverInteractionBoundary(session, () => true, vi.fn()));
    expect(session.tryStart('drag', vi.fn())).toBeNull();
    scope.stop();
    expect(session.tryStart('drag', vi.fn())).not.toBeNull();
  });
});
