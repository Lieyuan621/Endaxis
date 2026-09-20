import { describe, expect, it, vi } from 'vitest';
import { InputRegions } from './inputRegions';
import { KeyboardShortcutRouter } from './keyboardShortcutRouter';

describe('logical input regions', () => {
  it('restores parents, isolates modal branches and ignores stale release', () => {
    const regions = new InputRegions();
    const root = regions.create('editor');
    const dialog = regions.create('dialog', root, true);
    const picker = regions.create('picker', dialog);
    regions.activate(root);
    const releaseDialog = regions.activate(dialog);
    expect(() => regions.activate(root)).toThrow('modal boundary');
    const releasePicker = regions.activate(picker);
    expect(regions.path()).toEqual([picker, dialog]);
    releasePicker();
    expect(regions.path()).toEqual([dialog]);
    releasePicker();
    expect(regions.path()).toEqual([dialog]);
    releaseDialog();
    expect(regions.path()).toEqual([root]);
  });

  it('disposing a parent invalidates its teleported descendants', () => {
    const regions = new InputRegions();
    const root = regions.create('editor');
    const dialog = regions.create('dialog', root, true);
    const child = regions.create('child', dialog);
    regions.activate(root);
    regions.activate(dialog);
    regions.activate(child);
    regions.dispose(dialog);
    expect(regions.path()).toEqual([root]);
    expect(() => regions.activate(child)).toThrow('not live');
  });

  it('shares region filtering across commands, clipboard and held state regardless of priority', () => {
    const router = new KeyboardShortcutRouter();
    const root = router.regions.create('editor');
    const sibling = router.regions.create('other editor');
    const child = router.regions.create('picker', root, true);
    const background = vi.fn(() => true);
    const foreground = vi.fn(() => true);
    const observed = vi.fn();
    for (const region of [undefined, root, sibling])
      router.register({
        id: 'background',
        region,
        priority: 10000,
        active: () => true,
        handle: background,
        handleClipboard: background,
        observeKeyboardState: observed,
      });
    router.register({
      id: 'picker',
      region: child,
      priority: 0,
      active: () => true,
      handle: foreground,
      handleClipboard: foreground,
    });
    router.regions.activate(root);
    router.regions.activate(child);
    expect(observed).toHaveBeenLastCalledWith(null);
    const key = Object.assign(new Event('keydown', { cancelable: true }), {
      key: 'Delete',
    }) as KeyboardEvent;
    router.route(key);
    router.routeClipboard(new Event('copy', { cancelable: true }) as ClipboardEvent);
    expect(foreground).toHaveBeenCalledTimes(2);
    expect(background).not.toHaveBeenCalled();
    expect(observed).toHaveBeenLastCalledWith(null);
  });

  it('orders a child before its parent and allows explicit nonmodal fallback', () => {
    const router = new KeyboardShortcutRouter();
    const root = router.regions.create('root');
    const child = router.regions.create('child', root);
    const calls: string[] = [];
    router.register({
      id: 'root',
      region: root,
      priority: 1000,
      active: () => true,
      handle: () => {
        calls.push('root');
        return true;
      },
    });
    router.register({
      id: 'child',
      region: child,
      priority: 0,
      active: () => true,
      handle: () => {
        calls.push('child');
        return false;
      },
    });
    router.regions.activate(child);
    router.route(new Event('keydown') as KeyboardEvent);
    expect(calls).toEqual(['child', 'root']);
  });
});
