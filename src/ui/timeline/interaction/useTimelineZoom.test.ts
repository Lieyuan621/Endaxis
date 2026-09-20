import { nextTick } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { useTimelineZoom } from './useTimelineZoom';

function fixture() {
  const viewport = {
    scrollLeft: 100,
    scrollTop: 100,
    clientWidth: 1000,
    clientHeight: 600,
    getBoundingClientRect: () => ({ left: 20 }),
  } as HTMLElement;
  const zoom = useTimelineZoom({
    viewport: () => viewport,
    prepFrames: () => 30,
    prepExpanded: () => true,
    trackHeaderWidth: 180,
  });
  return { viewport, zoom };
}

describe('timeline viewport zoom session', () => {
  it('keeps the frame under the pointer fixed after layout updates', async () => {
    const { viewport, zoom } = fixture();
    await zoom.updateTimelineZoomPercent(200, 220);
    expect(zoom.timelineZoomPercent.value).toBe(200);
    expect(viewport.scrollLeft).toBeCloseTo(220);
  });

  it('anchors toolbar zoom to the visible timeline center', async () => {
    const { viewport, zoom } = fixture();
    await zoom.updateTimelineZoomPercent(200);
    expect(viewport.scrollLeft).toBeCloseTo(610);
    zoom.setTimelineZoomPercent(100);
    expect(viewport.scrollLeft).toBeCloseTo(610);
  });

  it('moves vertically without native easing and keeps modified scrolling', async () => {
    const { viewport, zoom } = fixture();
    const preventDefault = vi.fn();
    const event = {
      ctrlKey: false,
      shiftKey: false,
      deltaX: 0,
      deltaY: 40,
      deltaMode: 0,
      clientX: 220,
      preventDefault,
    };
    zoom.handleTimelineWheel(event);
    expect(viewport.scrollTop).toBe(140);
    expect(preventDefault).toHaveBeenCalledTimes(1);
    zoom.handleTimelineWheel({ ...event, shiftKey: true });
    expect(viewport.scrollLeft).toBe(140);
    zoom.handleTimelineWheel({ ...event, ctrlKey: true, deltaY: -40 });
    await nextTick();
    expect(zoom.timelineZoomPercent.value).toBeGreaterThan(100);
    expect(preventDefault).toHaveBeenCalledTimes(3);
  });

  it('supports initialization without a mounted viewport', async () => {
    const zoom = useTimelineZoom({
      viewport: () => null,
      prepFrames: () => 0,
      prepExpanded: () => false,
      trackHeaderWidth: 180,
    });
    await zoom.updateTimelineZoomPercent(0);
    expect(zoom.timelineZoomPercent.value).toBe(30);
  });
});
