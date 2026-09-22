import { computed, nextTick, ref } from 'vue';
import { frameToTimelinePx, timelinePxToExactFrame } from '../timelineGeometry';
import {
  normalizeTimelineZoomPercent,
  resolveTimelineWheelIntent,
  timelinePxPerFrame,
  timelineWheelDeltaPx,
  wheelTimelineZoomPercent,
} from './timelineViewport';

/** 视口缩放属于编辑会话；锚点换算只读取当前准备区和滚动容器。 */
export function useTimelineZoom(options: {
  viewport(): HTMLElement | null;
  prepFrames(): number;
  prepEndFrame?(): number;
  prepExpanded(): boolean;
  trackHeaderWidth: number;
  verticalPanEnabled?(): boolean;
}) {
  const timelineZoomPercent = ref(100);
  const pxPerFrame = computed(() => timelinePxPerFrame(timelineZoomPercent.value));
  function setTimelineZoomPercent(percent: number) {
    timelineZoomPercent.value = normalizeTimelineZoomPercent(percent);
  }

  async function updateTimelineZoomPercent(percent: number, anchorClientX?: number): Promise<void> {
    const nextPercent = normalizeTimelineZoomPercent(percent);
    if (nextPercent === timelineZoomPercent.value) return;

    const viewport = options.viewport();
    const anchorOffset =
      viewport === null
        ? null
        : anchorClientX === undefined
          ? options.trackHeaderWidth + (viewport.clientWidth - options.trackHeaderWidth) / 2
          : anchorClientX - viewport.getBoundingClientRect().left;
    const anchorContentX =
      viewport === null || anchorOffset === null ? null : viewport.scrollLeft + anchorOffset;
    const anchorFrame =
      anchorContentX === null
        ? null
        : timelinePxToExactFrame(
            anchorContentX - options.trackHeaderWidth,
            options.prepFrames(),
            pxPerFrame.value,
            options.prepExpanded(),
            options.prepEndFrame?.(),
          );

    timelineZoomPercent.value = nextPercent;
    if (viewport === null || anchorFrame === null || anchorOffset === null) return;

    await nextTick();
    viewport.scrollLeft = Math.max(
      0,
      options.trackHeaderWidth +
        frameToTimelinePx(
          anchorFrame,
          options.prepFrames(),
          pxPerFrame.value,
          options.prepExpanded(),
          options.prepEndFrame?.(),
        ) -
        anchorOffset,
    );
  }

  function handleTimelineWheel(
    event: Pick<
      WheelEvent,
      'ctrlKey' | 'shiftKey' | 'deltaX' | 'deltaY' | 'deltaMode' | 'clientX' | 'preventDefault'
    >,
  ): void {
    const intent = resolveTimelineWheelIntent(event);
    event.preventDefault();
    if (intent.kind === 'verticalPan') {
      const viewport = options.viewport();
      if (viewport !== null) {
        if (options.verticalPanEnabled?.() === false) {
          viewport.scrollTop = 0;
          return;
        }
        viewport.scrollTop += timelineWheelDeltaPx(
          intent.deltaPx,
          event.deltaMode,
          viewport.clientHeight,
        );
      }
      return;
    }
    if (intent.kind === 'horizontalPan') {
      const viewport = options.viewport();
      if (viewport !== null) viewport.scrollLeft += intent.deltaPx;
      return;
    }
    void updateTimelineZoomPercent(
      wheelTimelineZoomPercent(timelineZoomPercent.value, intent.direction),
      event.clientX,
    );
  }

  return {
    timelineZoomPercent,
    pxPerFrame,
    setTimelineZoomPercent,
    updateTimelineZoomPercent,
    handleTimelineWheel,
  };
}
