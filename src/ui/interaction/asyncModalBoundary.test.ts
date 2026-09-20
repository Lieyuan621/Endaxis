import { describe, expect, it, vi } from 'vitest';
import { createAsyncModalBoundary } from './asyncModalBoundary';
import { createInteractionSession } from './interactionSession';
import { KeyboardShortcutRouter } from '../keyboard/keyboardShortcutRouter';
import editor from '../timeline/TimelineEditor.vue?raw';
import hook from './useAsyncModalBoundary.ts?raw';
import map from '../timeline/definitions/SkillStructureMindMap.vue?raw';

function deferred() {
  let resolve!: (value: string) => void;
  const promise = new Promise<string>(done => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('service modal input lifetime', () => {
  it('keeps nested service isolation when separate owners settle out of order', async () => {
    const router = new KeyboardShortcutRouter();
    const root = router.regions.create('root');
    router.regions.activate(root);
    const session = createInteractionSession();
    const acquire = () => router.acquireModalBoundary(root);
    const outer = createAsyncModalBoundary(session, acquire);
    const inner = createAsyncModalBoundary(session, acquire);
    const first = deferred();
    const second = deferred();
    const one = outer.run(() => first.promise);
    const parent = router.regions.path()[0]!;
    const two = inner.run(() => second.promise);
    const child = router.regions.path()[0]!;
    first.resolve('outer');
    await one;
    expect(router.regions.path()).toEqual([child]);
    expect(router.regions.contains(parent)).toBe(true);
    second.resolve('inner');
    await two;
    expect(router.regions.path()).toEqual([root]);
    expect(router.regions.contains(parent)).toBe(false);
    expect(router.regions.contains(child)).toBe(false);
  });

  it('isolates the active editor branch before gesture cancellation and restores it last', async () => {
    const router = new KeyboardShortcutRouter();
    const root = router.regions.create('workbench');
    const editorRegion = router.regions.create('definition', root, true);
    router.regions.activate(root);
    router.regions.activate(editorRegion);
    const command = vi.fn(() => true);
    router.register({
      id: 'editor',
      region: editorRegion,
      priority: 9999,
      active: () => true,
      handle: command,
      handleClipboard: command,
    });
    const session = createInteractionSession();
    const boundary = createAsyncModalBoundary(session, () => router.acquireModalBoundary(root));
    const verifyIsolation = () => {
      const event = Object.assign(new Event('keydown', { cancelable: true }), { key: 'Escape' });
      expect(router.route(event as KeyboardEvent)).toBe(false);
      expect(event.defaultPrevented).toBe(false);
      router.routeClipboard(new Event('copy', { cancelable: true }) as ClipboardEvent);
      expect(command).not.toHaveBeenCalled();
    };
    session.tryStart('drag', verifyIsolation);
    const first = deferred();
    const second = deferred();
    const one = boundary.run(() => first.promise);
    const two = boundary.run(() => second.promise);
    first.resolve('first');
    await one;
    verifyIsolation();
    second.resolve('second');
    await two;
    expect(router.regions.path()).toEqual([editorRegion]);
    router.route(Object.assign(new Event('keydown'), { key: 'Delete' }) as KeyboardEvent);
    expect(command).toHaveBeenCalledOnce();
  });

  it('refuses a different workbench owner without opening or leaking isolation', async () => {
    const router = new KeyboardShortcutRouter();
    const owner = router.regions.create('owner');
    const other = router.regions.create('other');
    router.regions.activate(other);
    const boundary = createAsyncModalBoundary(createInteractionSession(), () =>
      router.acquireModalBoundary(owner),
    );
    const open = vi.fn();
    await expect(boundary.run(open)).rejects.toThrow('active input branch');
    expect(open).not.toHaveBeenCalled();
    expect(boundary.active).toBe(false);
    expect(router.regions.path()).toEqual([other]);
  });

  it('blocks input before opening and releases after confirmation', async () => {
    const session = createInteractionSession();
    const boundary = createAsyncModalBoundary(session);
    const cancelled = vi.fn(() => expect(boundary.active).toBe(true));
    session.tryStart('cast-move', cancelled);
    const result = boundary.run(() => {
      expect(cancelled).toHaveBeenCalledOnce();
      expect(session.tryStart('library-drag', vi.fn())).toBeNull();
      return 'confirm';
    });
    expect(boundary.active).toBe(true);
    await expect(result).resolves.toBe('confirm');
    expect(boundary.active).toBe(false);
    expect(session.tryStart('cast-move', vi.fn())).not.toBeNull();
  });

  it('one settled modal cannot release another pending modal', async () => {
    const session = createInteractionSession();
    const boundary = createAsyncModalBoundary(session);
    const first = deferred();
    const second = deferred();
    const one = boundary.run(() => first.promise);
    const two = boundary.run(() => second.promise);
    first.resolve('one');
    await one;
    expect(boundary.active).toBe(true);
    expect(session.tryStart('cast-move', vi.fn())).toBeNull();
    second.resolve('two');
    await two;
    expect(boundary.active).toBe(false);
  });

  it.each(['throw', 'reject'])('releases after modal %s', async mode => {
    const session = createInteractionSession();
    const boundary = createAsyncModalBoundary(session);
    await expect(
      boundary.run(() => {
        if (mode === 'throw') throw new Error('cancel');
        return Promise.reject(new Error('cancel'));
      }),
    ).rejects.toThrow('cancel');
    expect(boundary.active).toBe(false);
    expect(session.tryStart('cast-move', vi.fn())).not.toBeNull();
  });

  it('disposal releases barriers and prevents a late confirmation being applied', async () => {
    const session = createInteractionSession();
    const boundary = createAsyncModalBoundary(session);
    const pending = deferred();
    const result = boundary.run(() => pending.promise);
    boundary.dispose();
    expect(boundary.active).toBe(false);
    const successor = session.tryStart('cast-move', vi.fn())!;
    pending.resolve('confirm');
    await expect(result).rejects.toThrow('disposed');
    expect(successor.isCurrent()).toBe(true);
    const open = vi.fn();
    await expect(boundary.run(open)).rejects.toThrow('disposed');
    expect(open).not.toHaveBeenCalled();
  });

  it('does not leave a barrier behind when cancelling the old gesture throws', async () => {
    const session = createInteractionSession();
    const boundary = createAsyncModalBoundary(session);
    session.tryStart('broken', () => {
      throw new Error('broken cleanup');
    });
    const open = vi.fn();
    await expect(boundary.run(open)).rejects.toThrow('broken cleanup');
    expect(open).not.toHaveBeenCalled();
    expect(boundary.active).toBe(false);
    expect(session.tryStart('cast-move', vi.fn())).not.toBeNull();
  });

  it('blocks background shortcuts but leaves modal-native key handling intact', async () => {
    const boundary = createAsyncModalBoundary(createInteractionSession());
    const router = new KeyboardShortcutRouter();
    const background = vi.fn(() => true);
    router.register({ id: 'map-menu', priority: 300, active: () => true, handle: background });
    router.register({
      id: 'service-modal',
      priority: 2000,
      active: () => boundary.active,
      blockLowerScopes: true,
      handle: () => false,
    });
    const pending = deferred();
    const result = boundary.run(() => pending.promise);
    const event = {
      key: 'Escape',
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as KeyboardEvent;
    expect(router.route(event)).toBe(false);
    expect(background).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
    pending.resolve('cancel');
    await result;
    router.route(event);
    expect(background).toHaveBeenCalledOnce();
  });

  it('covers both imperative confirmations and excludes inactive map menus', () => {
    expect(editor.match(/serviceModalBoundary\.run\(/g)).toHaveLength(3);
    expect(hook).toContain('onScopeDispose(() => boundary.dispose())');
    expect(map).toContain('active: () => active.value && contextMenu.value !== undefined');
  });
});
