/**
 * 管理时间轴视口的中键拖拽平移。
 *
 * 本模块只修改滚动容器，不修改场景文档；调用方应仅从轨道空白区域启动它，避免与动作块
 * 的原生拖拽语义冲突。
 */
import { onScopeDispose, ref, type Ref } from 'vue';
import type { InteractionSession } from '../../interaction/interactionSession';
import { resolveTimelineViewportPan, type TimelineViewportPanOrigin } from './timelineViewport';

export interface UseTimelineViewportPanOptions {
  readonly interactionSession: InteractionSession;
  readonly viewport: Ref<HTMLElement | null>;
  readonly verticalPanEnabled?: () => boolean;
}

const INTERACTIVE_PAN_EXCLUSION_SELECTOR = [
  '[data-timeline-action-id]',
  '[data-timeline-interactive]',
  'button',
  'input',
  'select',
  'textarea',
  'a[href]',
  '[contenteditable="true"]',
  '[role="button"]',
  '[draggable="true"]',
].join(',');

/** Middle-button panning belongs to lane blank space, never to nested controls. */
export function isTimelineViewportPanExcludedTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE_PAN_EXCLUSION_SELECTOR) !== null;
}

export function useTimelineViewportPan(options: UseTimelineViewportPanOptions) {
  const isPanning = ref(false);
  let stopGesture: (() => void) | null = null;

  function stop(): void {
    stopGesture?.();
  }

  function begin(event: PointerEvent): boolean {
    const viewport = options.viewport.value;
    const target = event.target;
    if (viewport === null || event.button !== 1 || isTimelineViewportPanExcludedTarget(target)) {
      return false;
    }
    event.preventDefault();
    const lease = options.interactionSession.tryStart('viewport-pan', stop);
    if (lease === null) return false;
    const pointerId = event.pointerId;
    const origin: TimelineViewportPanOrigin = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
    };
    isPanning.value = true;
    const onMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      const position = resolveTimelineViewportPan(origin, moveEvent.clientX, moveEvent.clientY);
      viewport.scrollLeft = position.left;
      viewport.scrollTop = options.verticalPanEnabled?.() === false ? 0 : position.top;
    };
    const finish = (finishEvent: PointerEvent) => {
      if (finishEvent.pointerId === pointerId) stop();
    };
    stopGesture = () => {
      lease.release();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      isPanning.value = false;
      stopGesture = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    return true;
  }

  onScopeDispose(stop);

  return { isPanning, beginViewportPan: begin };
}
