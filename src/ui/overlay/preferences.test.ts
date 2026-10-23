import { afterEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick } from 'vue';
import {
  DEFAULT_OVERLAY_PREFERENCES,
  OVERLAY_PREFS_KEY,
  loadOverlayPreferences,
  normalizeOverlayPreferences,
  useOverlayPreferences,
} from './preferences';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('overlay start delay preferences', () => {
  it('keeps older saved settings and adds the two-second default without changing the key', () => {
    const previousSettings = {
      iconMode: 'portrait',
      secondsAhead: 12,
      scale: 1.3,
      offsetX: 100,
      offsetY: 60,
      showBasic: true,
      showResources: false,
      transparent: false,
      width: 1400,
      hudOpacity: 0.7,
      autoStart: true,
    };
    const getItem = vi.fn(() => JSON.stringify(previousSettings));
    vi.stubGlobal('localStorage', { getItem });

    expect(loadOverlayPreferences()).toEqual({ ...previousSettings, startDelaySeconds: 2 });
    expect(getItem).toHaveBeenCalledWith(OVERLAY_PREFS_KEY);
  });

  it.each([undefined, null, '', 'bad', false, {}, Number.NaN, Number.POSITIVE_INFINITY])(
    'uses the default for an invalid delay: %s',
    startDelaySeconds => {
      expect(normalizeOverlayPreferences({ startDelaySeconds }).startDelaySeconds).toBe(2);
    },
  );

  it.each([
    [-1, 0],
    [0, 0],
    [1.25, 1.25],
    [10, 10],
    [100, 10],
  ])('normalizes %s seconds to %s', (startDelaySeconds, expected) => {
    expect(normalizeOverlayPreferences({ startDelaySeconds }).startDelaySeconds).toBe(expected);
  });

  it('persists patched delays and resets to the default', async () => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    });
    const scope = effectScope();
    const preferences = scope.run(() => useOverlayPreferences())!;
    try {
      preferences.patch({ startDelaySeconds: 1.75 });
      await nextTick();
      expect(loadOverlayPreferences().startDelaySeconds).toBe(1.75);

      preferences.patch({ startDelaySeconds: -3 });
      await nextTick();
      expect(loadOverlayPreferences().startDelaySeconds).toBe(0);

      preferences.reset();
      await nextTick();
      expect(loadOverlayPreferences()).toEqual(DEFAULT_OVERLAY_PREFERENCES);
    } finally {
      scope.stop();
    }
  });
});
