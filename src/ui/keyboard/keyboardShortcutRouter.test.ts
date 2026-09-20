import { describe, expect, it, vi } from 'vitest';
import { KeyboardShortcutRouter } from './keyboardShortcutRouter';

function keyEvent(key: string): KeyboardEvent {
  const event = {
    key,
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
    stopPropagation() {},
  };
  return event as KeyboardEvent;
}

describe('KeyboardShortcutRouter', () => {
  it('keeps same-labelled component instances independent and restores the previous owner', () => {
    const router = new KeyboardShortcutRouter();
    const first = vi.fn(() => true);
    const second = vi.fn(() => true);
    const removeFirst = router.register({
      id: 'menu',
      priority: 300,
      active: () => true,
      handle: first,
    });
    const removeSecond = router.register({
      id: 'menu',
      priority: 300,
      active: () => true,
      handle: second,
    });
    router.route(keyEvent('Escape'));
    expect(second).toHaveBeenCalledOnce();
    expect(first).not.toHaveBeenCalled();
    removeSecond();
    removeSecond();
    router.route(keyEvent('Escape'));
    expect(first).toHaveBeenCalledOnce();
    removeFirst();
    expect(router.route(keyEvent('Escape'))).toBe(false);
  });

  it.each([{ defaultPrevented: true }, { isComposing: true }, { keyCode: 229 }])(
    'does not dispatch an already-owned or composing event: %o',
    state => {
      const router = new KeyboardShortcutRouter();
      const handle = vi.fn(() => true);
      router.register({ id: 'editor', priority: 10, active: () => true, handle });
      expect(router.route(Object.assign(keyEvent('Escape'), state))).toBe(false);
      expect(handle).not.toHaveBeenCalled();
    },
  );

  it('does not route the closing Escape again after a menu deactivates synchronously', () => {
    const router = new KeyboardShortcutRouter();
    let visible = true;
    const editor = vi.fn(() => true);
    router.register({ id: 'editor', priority: 10, active: () => true, handle: editor });
    router.register({
      id: 'menu',
      priority: 300,
      active: () => visible,
      blockLowerScopes: true,
      handle: () => {
        visible = false;
        return true;
      },
    });
    const event = keyEvent('Escape');
    expect(router.route(event)).toBe(true);
    expect(router.route(event)).toBe(false);
    expect(editor).not.toHaveBeenCalled();
  });
  it('routes a shortcut to the highest-priority active scope only', () => {
    const router = new KeyboardShortcutRouter();
    const editor = vi.fn(() => true);
    const dialog = vi.fn(() => true);
    router.register({ id: 'editor', priority: 10, active: () => true, handle: editor });
    router.register({ id: 'dialog', priority: 100, active: () => true, handle: dialog });

    expect(router.route(keyEvent('c'))).toBe(true);
    expect(dialog).toHaveBeenCalledOnce();
    expect(editor).not.toHaveBeenCalled();
  });

  it('skips inactive scopes and allows unhandled keys to continue', () => {
    const router = new KeyboardShortcutRouter();
    const editor = vi.fn(() => false);
    router.register({ id: 'dialog', priority: 100, active: () => false, handle: vi.fn() });
    router.register({ id: 'editor', priority: 10, active: () => true, handle: editor });

    expect(router.route(keyEvent('x'))).toBe(false);
    expect(editor).toHaveBeenCalledOnce();
  });

  it('lets a focused panel block lower scopes without swallowing native input behavior', () => {
    const router = new KeyboardShortcutRouter();
    const editor = vi.fn(() => true);
    router.register({ id: 'editor', priority: 10, active: () => true, handle: editor });
    router.register({
      id: 'dialog',
      priority: 100,
      active: () => true,
      handle: () => false,
      blockLowerScopes: true,
    });

    const event = keyEvent('c');
    expect(router.route(event)).toBe(false);
    expect(event.defaultPrevented).toBe(false);
    expect(editor).not.toHaveBeenCalled();
  });
});
