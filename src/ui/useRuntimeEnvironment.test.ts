import { computed, effectScope } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useRuntimeEnvironment } from './useRuntimeEnvironment';
import { resolveTimelineLayout } from './timeline/timelineLayoutPolicy';

function browser() {
  const queries = new Map<string, EventTarget & { matches: boolean }>();
  const target = Object.assign(new EventTarget(), {
    innerWidth: 980,
    innerHeight: 740,
    matchMedia(query: string) {
      let result = queries.get(query);
      if (!result) {
        result = Object.assign(new EventTarget(), { matches: query === '(pointer: coarse)' });
        queries.set(query, result);
      }
      return result;
    },
  });
  vi.stubGlobal('window', target);
  vi.stubGlobal('navigator', {
    userAgent: 'Mozilla/5.0 (Linux; Android 10; K)',
    maxTouchPoints: 5,
  });
  return target;
}

describe('reactive runtime environment lifecycle', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('updates layout after resize/orientation and releases listeners across repeated scopes', () => {
    const target = browser();
    for (let i = 0; i < 2; i++) {
      const scope = effectScope();
      const environment = scope.run(useRuntimeEnvironment)!;
      const layout = computed(() => resolveTimelineLayout(environment.value));
      expect(layout.value).toBe('mobile');
      target.innerWidth = 1400;
      target.dispatchEvent(new Event('resize'));
      expect(layout.value).toBe('desktop');
      target.innerWidth = 980;
      target.innerHeight = 600;
      target.dispatchEvent(new Event('orientationchange'));
      expect(layout.value).toBe('mobile');
      expect(environment.value.viewport.height).toBe(600);
      scope.stop();
      const before = environment.value;
      target.dispatchEvent(new Event('resize'));
      target.dispatchEvent(new Event('orientationchange'));
      target.matchMedia('(pointer: coarse)').dispatchEvent(new Event('change'));
      expect(environment.value).toBe(before);
    }
  });

  it('responds to input changes without treating touch as a desktop-site preference', () => {
    const target = browser();
    vi.stubGlobal('navigator', { userAgent: '', maxTouchPoints: 5 });
    const scope = effectScope();
    try {
      const environment = scope.run(useRuntimeEnvironment)!;
      const layout = computed(() => resolveTimelineLayout(environment.value));
      const coarse = target.matchMedia('(pointer: coarse)');
      expect(layout.value).toBe('mobile');
      coarse.matches = false;
      coarse.dispatchEvent(new Event('change'));
      expect(layout.value).toBe('desktop');
      expect(environment.value.input.touch).toBe(true);
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
        maxTouchPoints: 5,
      });
      coarse.matches = true;
      coarse.dispatchEvent(new Event('change'));
      expect(layout.value).toBe('desktop');
      const hover = target.matchMedia('(hover: hover)');
      hover.matches = true;
      hover.dispatchEvent(new Event('change'));
      expect(environment.value.input.hover).toBe(true);
    } finally {
      scope.stop();
    }
  });
});
