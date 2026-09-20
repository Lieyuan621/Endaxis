import { describe, expect, it } from 'vitest';
import { projectTimelineRulerTicks } from './timelineRulerTicks';

describe('timeline ruler tick projection', () => {
  it('uses sparse five-second labels below 100 pixels per second', () => {
    const ticks = projectTimelineRulerTicks({
      prepFrames: 0,
      durationFrames: 300,
      pxPerFrame: 2,
      visibleLeftPx: 0,
      visibleWidthPx: 590,
      bufferPx: 0,
    });
    expect(ticks.filter(tick => tick.label !== '').map(tick => tick.label)).toEqual(['0s', '5s']);
    expect(ticks.find(tick => tick.key === 'time:30')?.type).toBe('majorDim');
  });

  it('adds half-seconds, tenths and true frame ticks at the legacy zoom thresholds', () => {
    const types = (pxPerFrame: number) =>
      projectTimelineRulerTicks({
        prepFrames: 0,
        durationFrames: 30,
        pxPerFrame,
        visibleLeftPx: 0,
        visibleWidthPx: 1000,
        bufferPx: 0,
      });
    expect(types(4).some(tick => tick.key === 'time:15' && tick.type === 'minor')).toBe(true);
    expect(types(7).some(tick => tick.key === 'time:3' && tick.type === 'minor')).toBe(true);
    expect(types(27).some(tick => tick.key === 'time:1' && tick.type === 'frame')).toBe(true);
    expect(types(27).find(tick => tick.key === 'time:5')?.label).toBe('5f');
  });

  it('virtualizes ticks to the visible window including the requested buffer', () => {
    const ticks = projectTimelineRulerTicks({
      prepFrames: 150,
      durationFrames: 18_000,
      pxPerFrame: 30,
      visibleLeftPx: 90_000,
      visibleWidthPx: 1200,
      bufferPx: 100,
    });
    expect(ticks.length).toBeLessThan(60);
    expect(ticks.every(tick => tick.left >= 89_900 && tick.left <= 91_300)).toBe(true);
  });

  it('keeps battle ticks at the normal scale after a collapsed prep inset', () => {
    const ticks = projectTimelineRulerTicks({
      prepFrames: 150,
      durationFrames: 300,
      pxPerFrame: 2,
      prepExpanded: false,
      visibleLeftPx: 0,
      visibleWidthPx: 618,
      bufferPx: 0,
    });
    expect(ticks.find(tick => tick.key === 'time:0')?.left).toBe(18);
    expect(ticks.find(tick => tick.key === 'time:150')?.left).toBe(318);
    expect(ticks.every(tick => tick.left >= 18)).toBe(true);
    expect(ticks.some(tick => tick.label.startsWith('-'))).toBe(false);
  });
});
