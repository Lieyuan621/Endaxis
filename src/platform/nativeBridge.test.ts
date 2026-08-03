import { afterEach, describe, expect, it, vi } from 'vitest';

describe('nativeBridge', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('detects the injected Android bridge', async () => {
    vi.stubGlobal('window', { EndaxisAndroid: {} });
    const { isNativeApp } = await import('./nativeBridge');

    expect(isNativeApp()).toBe(true);
  });

  it('dispatches native back events to the most recent handler first', async () => {
    vi.stubGlobal('window', {});
    const { registerBackHandler } = await import('./nativeBridge');
    const olderHandler = vi.fn(() => false);
    const newerHandler = vi.fn(() => true);

    registerBackHandler(olderHandler);
    const unregisterNewer = registerBackHandler(newerHandler);

    expect(window.EndaxisHandleBack?.()).toBe(true);
    expect(newerHandler).toHaveBeenCalledOnce();
    expect(olderHandler).not.toHaveBeenCalled();

    unregisterNewer();
    expect(window.EndaxisHandleBack?.()).toBe(false);
    expect(olderHandler).toHaveBeenCalledOnce();
  });
});
