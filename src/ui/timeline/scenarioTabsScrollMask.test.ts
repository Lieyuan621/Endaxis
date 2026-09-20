import { describe, expect, it } from 'vitest';
import { resolveScenarioTabsScrollMask } from './scenarioTabsScrollMask';

describe('resolveScenarioTabsScrollMask', () => {
  it('does not mask a tab strip that fits in its viewport', () => {
    expect(
      resolveScenarioTabsScrollMask({ scrollLeft: 0, clientWidth: 240, scrollWidth: 240 }),
    ).toEqual({ maskImage: 'none', WebkitMaskImage: 'none' });
  });

  it('fades only the hidden end while scrolled to the start', () => {
    expect(
      resolveScenarioTabsScrollMask({ scrollLeft: 0, clientWidth: 200, scrollWidth: 400 })
        .maskImage,
    ).toBe('linear-gradient(to right, black 0%, black calc(100% - 20px), transparent 100%)');
  });

  it('fades both hidden sides in the middle', () => {
    expect(
      resolveScenarioTabsScrollMask({ scrollLeft: 100, clientWidth: 200, scrollWidth: 400 })
        .maskImage,
    ).toBe(
      'linear-gradient(to right, transparent 0px, black 20px, black calc(100% - 20px), transparent 100%)',
    );
  });

  it('fades only the hidden start at the end and tolerates subpixel rounding', () => {
    expect(
      resolveScenarioTabsScrollMask({ scrollLeft: 198.5, clientWidth: 200, scrollWidth: 400 })
        .maskImage,
    ).toBe('linear-gradient(to right, transparent 0px, black 20px, black 100%)');
  });
});
