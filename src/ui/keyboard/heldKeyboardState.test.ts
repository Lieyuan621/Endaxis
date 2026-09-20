import { effectScope, ref } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KeyboardShortcutRouter, useKeyboardShortcutScope } from './keyboardShortcutRouter';

describe('passive held keyboard state', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('observes without consuming commands and clears when covered or inactive', () => {
    const router = new KeyboardShortcutRouter();
    const observe = vi.fn();
    let visible = true;
    let covered = false;
    router.register({
      id: 'preview',
      priority: 1500,
      active: () => visible,
      blockLowerScopes: true,
      handle: () => false,
      observeKeyboardState: observe,
    });
    router.register({
      id: 'modal',
      priority: 2000,
      active: () => covered,
      blockLowerScopes: true,
      handle: () => false,
    });
    const event = Object.assign(new Event('keydown', { cancelable: true }), {
      key: 'Control',
      ctrlKey: true,
    }) as KeyboardEvent;
    expect(router.route(event)).toBe(false);
    expect(observe).toHaveBeenLastCalledWith(event);
    expect(event.defaultPrevented).toBe(false);
    covered = true;
    router.revokeInactiveKeyboardState();
    expect(observe).toHaveBeenLastCalledWith(null);
    covered = false;
    visible = false;
    router.updateKeyboardState(event);
    expect(observe).toHaveBeenLastCalledWith(null);
  });

  it('reacts to close/coverage without a new key event and releases on keyup, blur and dispose', () => {
    const target = new EventTarget();
    vi.stubGlobal('window', target);
    const scope = effectScope();
    const visible = ref(true);
    const covered = ref(false);
    const held = ref(false);
    const dispatch = (type: string, ctrlKey: boolean) =>
      target.dispatchEvent(
        Object.assign(new Event(type, { cancelable: true }), { key: 'Control', ctrlKey }),
      );
    scope.run(() => {
      useKeyboardShortcutScope({
        id: 'preview',
        priority: 1500,
        active: () => visible.value,
        blockLowerScopes: true,
        handle: () => false,
        observeKeyboardState: event => {
          held.value = event?.ctrlKey ?? false;
        },
      });
      useKeyboardShortcutScope({
        id: 'cover',
        priority: 2000,
        active: () => covered.value,
        blockLowerScopes: true,
        handle: () => false,
      });
    });
    try {
      dispatch('keydown', true);
      expect(held.value).toBe(true);
      dispatch('keyup', false);
      expect(held.value).toBe(false);
      dispatch('keydown', true);
      target.dispatchEvent(new Event('blur'));
      expect(held.value).toBe(false);
      dispatch('keydown', true);
      covered.value = true;
      expect(held.value).toBe(false);
      covered.value = false;
      expect(held.value).toBe(false);
      dispatch('keydown', true);
      visible.value = false;
      expect(held.value).toBe(false);
      visible.value = true;
      expect(held.value).toBe(false);
      dispatch('keydown', true);
    } finally {
      scope.stop();
    }
    expect(held.value).toBe(false);
    dispatch('keydown', true);
    expect(held.value).toBe(false);
  });
});
