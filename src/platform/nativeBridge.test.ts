import { afterEach, describe, expect, it, vi } from 'vitest';

describe('nativeBridge', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('detects the Endaxis Android user agent marker', async () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 EndaxisApp/1.0' });
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

  it('notifies the Android host once when the app shell is ready', async () => {
    const appReady = vi.fn();
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 EndaxisApp/1.0' });
    vi.stubGlobal('window', { EndaxisNative: { appReady } });
    const { notifyNativeAppReady } = await import('./nativeBridge');

    expect(notifyNativeAppReady()).toBe(true);
    expect(notifyNativeAppReady()).toBe(false);
    expect(appReady).toHaveBeenCalledOnce();
  });

  it('does not notify a native bridge from a regular browser', async () => {
    const appReady = vi.fn();
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 Chrome/140.0' });
    vi.stubGlobal('window', { EndaxisNative: { appReady } });
    const { notifyNativeAppReady } = await import('./nativeBridge');

    expect(notifyNativeAppReady()).toBe(false);
    expect(appReady).not.toHaveBeenCalled();
  });
});
