/**
 * 管理时间轴框选手势与 DOM 几何采集。
 *
 * 选择语义仍由 `timelineMarqueeSelection` 决定；本模块只负责把浏览器指针事件转换为
 * 同一屏幕坐标系中的矩形，并确保全局监听器随组件作用域释放。
 */
import { computed, onScopeDispose, ref, type Ref } from 'vue';
import {
  applyTimelineMarqueeSelection,
  type TimelineActionRectangle,
  type TimelineMarqueeRectangle,
} from './timelineMarqueeSelection';
import type { TimelineActionSelection } from './timelineActionSelection';
import type { InteractionSession } from '../../interaction/interactionSession';

const MARQUEE_DRAG_THRESHOLD_PX = 4;

interface TimelineMarqueeGesture {
  readonly pointerId: number;
  readonly startX: number;
  readonly startY: number;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  currentX: number;
  currentY: number;
}

export interface UseTimelineMarqueeGestureOptions {
  readonly interactionSession: InteractionSession;
  readonly surface: Ref<HTMLElement | null>;
  readonly getSelection: () => TimelineActionSelection;
  readonly applySelection: (selection: TimelineActionSelection) => void;
}

function isMarqueeDrag(gesture: TimelineMarqueeGesture): boolean {
  return (
    Math.abs(gesture.currentX - gesture.startX) >= MARQUEE_DRAG_THRESHOLD_PX ||
    Math.abs(gesture.currentY - gesture.startY) >= MARQUEE_DRAG_THRESHOLD_PX
  );
}

function collectActionRectangles(surface: HTMLElement): readonly TimelineActionRectangle[] {
  return Array.from(surface.querySelectorAll<HTMLElement>('[data-timeline-action-id]')).map(
    element => {
      const bounds = element.getBoundingClientRect();
      return {
        id: element.dataset.timelineActionId ?? '',
        x: bounds.left,
        y: bounds.top,
        width: bounds.width,
        height: bounds.height,
      };
    },
  );
}

export function useTimelineMarqueeGesture(options: UseTimelineMarqueeGestureOptions) {
  const gesture = ref<TimelineMarqueeGesture | null>(null);
  let suppressNextLaneClick = false;
  let clearLaneClickSuppression: ReturnType<typeof setTimeout> | null = null;
  let stopGesture: (() => void) | null = null;

  const marqueeStyle = computed(() => {
    const current = gesture.value;
    if (current === null) return null;
    return {
      left: `${Math.min(current.startX, current.currentX)}px`,
      top: `${Math.min(current.startY, current.currentY)}px`,
      width: `${Math.abs(current.currentX - current.startX)}px`,
      height: `${Math.abs(current.currentY - current.startY)}px`,
    };
  });

  function stop(): void {
    stopGesture?.();
  }

  function finish(event: PointerEvent): void {
    const current = gesture.value;
    if (current === null || current.pointerId !== event.pointerId) return;
    current.currentX = event.clientX;
    current.currentY = event.clientY;
    if (isMarqueeDrag(current)) {
      const rectangle: TimelineMarqueeRectangle = {
        startX: current.startX,
        startY: current.startY,
        endX: current.currentX,
        endY: current.currentY,
      };
      options.applySelection(
        applyTimelineMarqueeSelection(
          options.getSelection(),
          rectangle,
          options.surface.value === null ? [] : collectActionRectangles(options.surface.value),
          { ctrlKey: current.ctrlKey, metaKey: current.metaKey },
        ),
      );
      suppressNextLaneClick = true;
      if (clearLaneClickSuppression !== null) clearTimeout(clearLaneClickSuppression);
      clearLaneClickSuppression = setTimeout(() => {
        suppressNextLaneClick = false;
        clearLaneClickSuppression = null;
      }, 0);
    }
    stop();
  }

  function begin(event: PointerEvent, toggleSelection = event.ctrlKey || event.metaKey): void {
    const target = event.target;
    if (
      event.button !== 0 ||
      (target instanceof Element && target.closest('[data-timeline-action-id]') !== null)
    ) {
      return;
    }
    const lease = options.interactionSession.tryStart('marquee', stop);
    if (lease === null) return;
    gesture.value = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      currentX: event.clientX,
      currentY: event.clientY,
      ctrlKey: toggleSelection,
      metaKey: false,
    };
    const onMove = (moveEvent: PointerEvent) => {
      const current = gesture.value;
      if (current === null || current.pointerId !== moveEvent.pointerId) return;
      current.currentX = moveEvent.clientX;
      current.currentY = moveEvent.clientY;
    };
    const onFinish = (finishEvent: PointerEvent) => finish(finishEvent);
    const onCancel = (cancelEvent: PointerEvent) => {
      if (cancelEvent.pointerId === event.pointerId) stop();
    };
    stopGesture = () => {
      lease.release();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onFinish);
      window.removeEventListener('pointercancel', onCancel);
      gesture.value = null;
      stopGesture = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onFinish);
    window.addEventListener('pointercancel', onCancel);
  }

  function consumeLaneClickSuppression(): boolean {
    if (!suppressNextLaneClick) return false;
    suppressNextLaneClick = false;
    if (clearLaneClickSuppression !== null) {
      clearTimeout(clearLaneClickSuppression);
      clearLaneClickSuppression = null;
    }
    return true;
  }

  onScopeDispose(() => {
    if (clearLaneClickSuppression !== null) clearTimeout(clearLaneClickSuppression);
    stop();
  });

  return {
    marqueeStyle,
    beginMarqueeGesture: begin,
    consumeLaneClickSuppression,
  };
}
