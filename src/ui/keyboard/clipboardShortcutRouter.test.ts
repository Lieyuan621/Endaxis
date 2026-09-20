import { afterEach, describe, expect, it, vi } from 'vitest';
import { KeyboardShortcutRouter } from './keyboardShortcutRouter';
import routerSource from './keyboardShortcutRouter.ts?raw';
import mapSource from '../timeline/definitions/SkillStructureMindMap.vue?raw';

const clipboardEvent = (type: string) => new Event(type, { cancelable: true }) as ClipboardEvent;
afterEach(() => vi.unstubAllGlobals());

describe('native clipboard command ownership', () => {
  it.each(['copy', 'paste'])('dispatches %s without requiring or synthesizing a keydown', type => {
    const router = new KeyboardShortcutRouter();
    const handle = vi.fn(() => true);
    const handleClipboard = vi.fn(() => true);
    router.register({ id: 'editor', priority: 10, active: () => true, handle, handleClipboard });
    const event = clipboardEvent(type);
    expect(router.routeClipboard(event)).toBe(true);
    expect(event.defaultPrevented).toBe(true);
    expect(handle).not.toHaveBeenCalled();
    expect(handleClipboard).toHaveBeenCalledWith(event);
    expect(router.routeClipboard(event)).toBe(false);
    expect(handleClipboard).toHaveBeenCalledOnce();
  });

  it('a modal with no clipboard handler still blocks the background editor', () => {
    const router = new KeyboardShortcutRouter();
    const handleClipboard = vi.fn(() => true);
    router.register({
      id: 'editor',
      priority: 10,
      active: () => true,
      handle: () => false,
      handleClipboard,
    });
    const close = router.register({
      id: 'modal',
      priority: 100,
      active: () => true,
      handle: () => false,
      blockLowerScopes: true,
    });
    const event = clipboardEvent('paste');
    expect(router.routeClipboard(event)).toBe(false);
    expect(event.defaultPrevented).toBe(false);
    expect(handleClipboard).not.toHaveBeenCalled();
    close();
    expect(router.routeClipboard(event)).toBe(true);
  });

  it('does not fall through an active map into a timeline with a different clipboard', () => {
    const router = new KeyboardShortcutRouter();
    const background = vi.fn(() => true);
    router.register({
      id: 'timeline',
      priority: 10,
      active: () => true,
      handle: () => false,
      handleClipboard: background,
    });
    router.register({
      id: 'map',
      priority: 200,
      active: () => true,
      handle: () => false,
      handleClipboard: () => false,
      blockLowerScopes: true,
    });
    expect(router.routeClipboard(clipboardEvent('paste'))).toBe(false);
    expect(background).not.toHaveBeenCalled();
  });

  it('preserves native text editing even when an editor has a selected node', () => {
    class TextInput {
      isContentEditable = false;
      closest() {
        return this;
      }
    }
    vi.stubGlobal('HTMLElement', TextInput);
    const router = new KeyboardShortcutRouter();
    const handleClipboard = vi.fn(() => true);
    router.register({
      id: 'map',
      priority: 200,
      active: () => true,
      handle: () => false,
      handleClipboard,
    });
    const event = clipboardEvent('copy');
    Object.defineProperty(event, 'target', { value: new TextInput() });
    expect(router.routeClipboard(event)).toBe(false);
    expect(event.defaultPrevented).toBe(false);
    expect(handleClipboard).not.toHaveBeenCalled();
  });

  it('does not turn native cut into unsupported structural deletion', () => {
    const router = new KeyboardShortcutRouter();
    const handler = vi.fn(() => true);
    router.register({
      id: 'editor',
      priority: 10,
      active: () => true,
      handle: () => false,
      handleClipboard: handler,
    });
    expect(router.routeClipboard(clipboardEvent('cut'))).toBe(false);
    expect(handler).not.toHaveBeenCalled();
  });

  it('registers clipboard listeners with the page router lifetime and shares map commands', () => {
    for (const type of ['copy', 'paste']) {
      expect(routerSource).toContain(
        `window.addEventListener('${type}', routePageClipboardEvent, true)`,
      );
      expect(routerSource).toContain(
        `window.removeEventListener('${type}', routePageClipboardEvent, true)`,
      );
    }
    expect(mapSource).toContain("clipboardNodeAction(key === 'c' ? 'copy' : 'paste')");
    expect(mapSource).toContain('clipboardNodeAction(event.type)');
  });
});
