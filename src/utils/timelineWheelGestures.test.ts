import { describe, expect, it, vi } from 'vitest';
import { createTimelineWheelHandler } from './timelineWheelGestures';

function createWheelEvent(overrides: Partial<WheelEvent> = {}) {
  return {
    ctrlKey: false,
    shiftKey: false,
    deltaX: 0,
    deltaY: 0,
    preventDefault: vi.fn(),
    ...overrides,
  } as unknown as WheelEvent;
}

describe('createTimelineWheelHandler', () => {
  it('keeps every Ctrl wheel event consumed while zoom updates are throttled', () => {
    const scheduledCallbacks: Array<() => void> = [];
    const onGesture = vi.fn();
    const handleWheel = createTimelineWheelHandler(
      callback => scheduledCallbacks.push(callback),
      onGesture,
    );
    const firstEvent = createWheelEvent({ ctrlKey: true, deltaY: -100 });
    const throttledEvent = createWheelEvent({ ctrlKey: true, deltaY: -100 });

    handleWheel(firstEvent);
    handleWheel(throttledEvent);

    expect(firstEvent.preventDefault).toHaveBeenCalledOnce();
    expect(throttledEvent.preventDefault).toHaveBeenCalledOnce();
    expect(onGesture).toHaveBeenCalledOnce();
    expect(onGesture).toHaveBeenCalledWith('zoom', firstEvent);

    scheduledCallbacks[0]?.();
    const nextFrameEvent = createWheelEvent({ ctrlKey: true, deltaY: 100 });
    handleWheel(nextFrameEvent);

    expect(nextFrameEvent.preventDefault).toHaveBeenCalledOnce();
    expect(onGesture).toHaveBeenCalledTimes(2);
  });

  it('leaves ordinary vertical scrolling to the browser', () => {
    const onGesture = vi.fn();
    const event = createWheelEvent({ deltaY: 100 });
    const handleWheel = createTimelineWheelHandler(vi.fn(), onGesture);

    handleWheel(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(onGesture).not.toHaveBeenCalled();
  });
});
