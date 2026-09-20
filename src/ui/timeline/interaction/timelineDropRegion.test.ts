import { describe, expect, it } from 'vitest';
import { isInsideTimelineDropRegion } from './timelineDropRegion';

const region = {
  lane: { left: 200, top: 80, right: 1600, bottom: 300 },
  viewport: { left: 0, top: 0, right: 1000, bottom: 700 },
  headerWidth: 200,
  rulerHeight: 80,
};

describe('visible timeline library drop region', () => {
  it.each([
    [200, 80],
    [500, 200],
    [999, 299],
  ])('accepts visible lane point %s,%s', (x, y) => {
    expect(isInsideTimelineDropRegion({ ...region, x, y })).toBe(true);
  });

  it.each([
    [199, 150],
    [500, 79],
    [1000, 200],
    [500, 300],
    [500, 700],
  ])('rejects headers, ruler, scrollbars and adjacent tracks at %s,%s', (x, y) => {
    expect(isInsideTimelineDropRegion({ ...region, x, y })).toBe(false);
  });

  it('clips a horizontally and vertically scrolled lane behind fixed controls', () => {
    const scrolled = { ...region, lane: { left: -300, top: -100, right: 1100, bottom: 120 } };
    expect(isInsideTimelineDropRegion({ ...scrolled, x: 100, y: 100 })).toBe(false);
    expect(isInsideTimelineDropRegion({ ...scrolled, x: 300, y: 50 })).toBe(false);
    expect(isInsideTimelineDropRegion({ ...scrolled, x: 300, y: 100 })).toBe(true);
  });

  it('rejects fully clipped lanes and empty lane areas beyond their width', () => {
    expect(
      isInsideTimelineDropRegion({
        ...region,
        lane: { ...region.lane, bottom: 70 },
        x: 300,
        y: 90,
      }),
    ).toBe(false);
    expect(
      isInsideTimelineDropRegion({
        ...region,
        lane: { ...region.lane, right: 500 },
        x: 600,
        y: 90,
      }),
    ).toBe(false);
  });

  it('uses viewport-relative clipping when the editor is offset in the page', () => {
    expect(
      isInsideTimelineDropRegion({
        ...region,
        viewport: { left: 100, top: 200, right: 1100, bottom: 900 },
        lane: { left: 100, top: 200, right: 1100, bottom: 500 },
        x: 299,
        y: 300,
      }),
    ).toBe(false);
  });
});
