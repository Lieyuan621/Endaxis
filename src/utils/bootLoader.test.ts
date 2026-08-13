import { beforeEach, describe, expect, it, vi } from 'vitest';

function installBootLoaderDom() {
  const message = { textContent: '正在加载...' };
  const loader = {
    remove: vi.fn(),
    setAttribute: vi.fn(),
    classList: { add: vi.fn() },
    querySelector: vi.fn(() => message),
  };
  vi.stubGlobal('document', {
    getElementById: vi.fn(() => loader),
  });
  vi.stubGlobal('window', {
    requestAnimationFrame: vi.fn(callback => {
      callback(0);
      return 1;
    }),
  });
  return { loader, message };
}

describe('boot loader readiness', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('dismisses only after both data and the initial view are ready', async () => {
    const { loader } = installBootLoaderDom();
    const { markBootReady } = await import('./bootLoader');

    markBootReady('view');
    expect(loader.remove).not.toHaveBeenCalled();

    markBootReady('data');
    expect(loader.remove).toHaveBeenCalledOnce();
  });

  it('notifies native readiness after both startup phases', async () => {
    installBootLoaderDom();
    const { markBootReady, onBootReady } = await import('./bootLoader');
    const listener = vi.fn();

    onBootReady(listener);
    markBootReady('data');
    expect(listener).not.toHaveBeenCalled();
    markBootReady('view');
    expect(listener).toHaveBeenCalledOnce();
  });

  it('keeps the loader visible and reports chunk failures', async () => {
    const { loader, message } = installBootLoaderDom();
    const { reportBootLoadFailure } = await import('./bootLoader');

    reportBootLoadFailure();

    expect(loader.remove).not.toHaveBeenCalled();
    expect(loader.setAttribute).toHaveBeenCalledWith('aria-busy', 'false');
    expect(loader.classList.add).toHaveBeenCalledWith('is-error');
    expect(message.textContent).toBe('加载失败，请刷新后重试');
  });
});
