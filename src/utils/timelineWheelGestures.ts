export type TimelineWheelGesture = 'zoom' | 'pan';

type TimelineWheelEvent = Pick<
  WheelEvent,
  'ctrlKey' | 'shiftKey' | 'deltaX' | 'deltaY' | 'preventDefault'
>;

type ScheduleFrame = (callback: () => void) => unknown;
type HandleGesture = (gesture: TimelineWheelGesture, event: TimelineWheelEvent) => void;

export function createTimelineWheelHandler(
  scheduleFrame: ScheduleFrame,
  handleGesture: HandleGesture,
) {
  let updateScheduled = false;

  return (event: TimelineWheelEvent) => {
    const gesture: TimelineWheelGesture | null = event.ctrlKey
      ? 'zoom'
      : Math.abs(event.deltaX) > 0 || event.shiftKey
        ? 'pan'
        : null;

    if (gesture === null) return;

    event.preventDefault();
    if (updateScheduled) return;

    updateScheduled = true;
    scheduleFrame(() => {
      updateScheduled = false;
    });
    handleGesture(gesture, event);
  };
}
