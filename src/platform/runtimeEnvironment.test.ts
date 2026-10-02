import { afterEach, describe, expect, it, vi } from 'vitest';
import { detectRuntimeEnvironment, readRuntimeEnvironment } from './runtimeEnvironment';

const desktopUA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140 Safari/537.36';

describe('runtime environment signals', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('keeps declared desktop identity independent of touch and client-hint platform', () => {
    for (const platform of ['Linux', 'Chrome OS', 'Android', undefined]) {
      const environment = detectRuntimeEnvironment({
        userAgent: desktopUA,
        userAgentData: { mobile: false, platform },
        platform: 'Linux armv8l',
        maxTouchPoints: 5,
        coarsePointer: true,
        width: 980,
        height: 740,
      });
      expect(environment).toEqual({
        host: 'browser',
        browser: { identity: 'desktop', platform: 'linux' },
        input: { touch: true, primaryPointer: 'coarse', hover: false },
        viewport: { width: 980, height: 740 },
      });
    }
  });

  it('keeps a native host marker separate from its browser identity', () => {
    const environment = detectRuntimeEnvironment({ userAgent: `${desktopUA} EndaxisApp/1.0` });
    expect(environment.host).toBe('endaxis-app');
    expect(environment.browser.identity).toBe('desktop');
    expect(detectRuntimeEnvironment({ userAgent: 'NotEndaxisApp/1.0' }).host).toBe('browser');
  });

  it('does not require a DOM or optional client hints and input APIs', () => {
    vi.stubGlobal('navigator', undefined);
    vi.stubGlobal('window', undefined);
    expect(readRuntimeEnvironment()).toEqual(detectRuntimeEnvironment({}));
    vi.stubGlobal('navigator', { userAgent: desktopUA });
    vi.stubGlobal('window', { innerWidth: 980, innerHeight: 740 });
    expect(readRuntimeEnvironment().browser.identity).toBe('desktop');
    expect(readRuntimeEnvironment().input.primaryPointer).toBe('none');
  });
});
