import { nextTick, onScopeDispose, shallowRef, type Ref } from 'vue';
import type { ScenarioDocument } from '../../../core/project/schema';
import type { InteractionSession } from '../../interaction/interactionSession';
import type { TimelineActionSelection } from './timelineActionSelection';
import {
  moveTimelineItems,
  planTimelineItemMove,
  type TimelineItem,
  type TimelineMovePlan,
} from './timelineItems';
import { passedTimelineDragThreshold } from './timelineDragThreshold';
import { projectTimelineEdgeAutoScrollDelta } from './timelineEdgeAutoScroll';
import { snapTimelineFrame } from './timelineSnap';

interface MoveGesture {
  readonly pointerId: number;
  readonly pointerKey: string;
  readonly baseScenario: ScenarioDocument;
  readonly plan: TimelineMovePlan;
  readonly grabOffset: number;
  readonly anchorFrame: number;
  readonly initialX: number;
  readonly initialY: number;
  latestX: number;
  latestY: number;
  readonly delta: number;
  readonly dragStarted: boolean;
  readonly committed: boolean;
}
interface Options {
  readonly scenario: Ref<ScenarioDocument>;
  readonly items: Readonly<Ref<ReadonlyMap<string, TimelineItem>>>;
  readonly selection: Readonly<Ref<TimelineActionSelection>>;
  readonly applySelection: (selection: TimelineActionSelection) => void;
  readonly interactionSession: InteractionSession;
  readonly viewport: Ref<HTMLElement | null>;
  readonly pointerFrame: (x: number, y: number) => number;
  readonly snapFrames: Readonly<Ref<number>>;
  readonly headerWidth: number;
  readonly rulerHeight: number;
  readonly verticalAutoScroll: () => boolean;
  readonly simulationService: { beginInteractiveSession(): void; endInteractiveSession(): void };
  readonly commit: (name: string, command: (s: ScenarioDocument) => ScenarioDocument) => boolean;
  readonly simulate: () => Promise<boolean>;
  readonly blocked: () => void;
  readonly dropped?: (event: PointerEvent, items: readonly TimelineItem[]) => void;
}

/** 所有可编辑对象共用一次指针会话、整体预览和一次历史提交。 */
export function useTimelineItemMove(options: Options) {
  const gesture = shallowRef<MoveGesture | null>(null);
  let cleanup: (() => void) | null = null;
  let animation: number | null = null;
  let suppressedClick: string | null = null;

  function cancel() {
    const current = gesture.value;
    gesture.value = null;
    cleanup?.();
    if (current && !current.committed) options.scenario.value = current.baseScenario;
  }
  function discard() {
    gesture.value = null;
    cleanup?.();
    suppressedClick = null;
  }
  function update(x: number, y: number) {
    const current = gesture.value;
    if (!current || current.committed) return;
    current.latestX = x;
    current.latestY = y;
    if (
      !current.dragStarted &&
      !passedTimelineDragThreshold(current.initialX, current.initialY, x, y)
    )
      return;
    const frame = snapTimelineFrame(
      options.pointerFrame(x, y) - current.grabOffset,
      options.snapFrames.value,
      current.anchorFrame + current.plan.maximumDelta,
      current.anchorFrame + current.plan.minimumDelta,
    );
    const result = moveTimelineItems(
      current.baseScenario,
      current.plan,
      frame - current.anchorFrame,
    );
    gesture.value = { ...current, delta: result.delta, dragStarted: true };
    if (result.delta !== current.delta) options.scenario.value = result.scenario;
  }
  function scroll() {
    animation = null;
    const current = gesture.value,
      viewport = options.viewport.value;
    if (!current?.dragStarted || current.committed || !viewport) return;
    const rect = viewport.getBoundingClientRect();
    const delta = projectTimelineEdgeAutoScrollDelta({
      pointerX: current.latestX,
      pointerY: current.latestY,
      left: rect.left + options.headerWidth,
      right: rect.right,
      top: rect.top + options.rulerHeight,
      bottom: rect.bottom,
    });
    const left = viewport.scrollLeft,
      top = viewport.scrollTop;
    viewport.scrollLeft += delta.x;
    if (options.verticalAutoScroll()) viewport.scrollTop += delta.y;
    if (viewport.scrollLeft !== left || viewport.scrollTop !== top) {
      try {
        update(current.latestX, current.latestY);
      } catch (error) {
        cancel();
        throw error;
      }
    }
    if (delta.x || delta.y) animation = requestAnimationFrame(scroll);
  }
  async function finish(event: PointerEvent) {
    if (gesture.value?.pointerId !== event.pointerId) return;
    update(event.clientX, event.clientY);
    const current = gesture.value!;
    const final = options.scenario.value;
    cleanup?.();
    if (!current.dragStarted) {
      gesture.value = null;
      return;
    }
    suppressedClick = current.pointerKey;
    setTimeout(() => {
      if (suppressedClick === current.pointerKey) suppressedClick = null;
    }, 0);
    const settling = { ...current, committed: true };
    gesture.value = settling;
    try {
      // 编辑会话持有原文档，提交最终预览无需先广播原位置；失败才回滚。
      let committed: boolean;
      try {
        committed = options.commit('moveTimelineItems', () => final);
      } catch (error) {
        options.scenario.value = current.baseScenario;
        throw error;
      }
      if (committed) options.dropped?.(event, current.plan.items);
      else options.scenario.value = current.baseScenario;
      await nextTick();
      await options.simulate();
    } finally {
      if (gesture.value === settling) gesture.value = null;
    }
  }
  function begin(event: PointerEvent, key: string) {
    if (event.button !== 0 || options.interactionSession.current !== null) return;
    const item = options.items.value.get(key);
    if (!item) return;
    event.preventDefault();
    event.stopPropagation();
    // 修饰键点击只切换选择，不在按下时抢先改变选区。
    if (event.ctrlKey || event.metaKey) return;
    const selected = options.selection.value.selectedIds;
    const keys = selected.has(key) ? selected : new Set([key]);
    options.applySelection({ selectedIds: keys, primaryId: key });
    const plan = planTimelineItemMove(options.items.value, keys);
    if (!plan) {
      options.blocked();
      return;
    }
    const anchor = options.items.value.get(item.moveAnchor)!;
    const lease = options.interactionSession.tryStart('timeline-item-move', cancel);
    if (!lease) return;
    const viewport = options.viewport.value;
    gesture.value = {
      pointerId: event.pointerId,
      pointerKey: key,
      baseScenario: options.scenario.value,
      plan,
      anchorFrame: anchor.frame!,
      grabOffset: options.pointerFrame(event.clientX, event.clientY) - anchor.frame!,
      initialX: event.clientX,
      initialY: event.clientY,
      latestX: event.clientX,
      latestY: event.clientY,
      delta: 0,
      dragStarted: false,
      committed: false,
    };
    options.simulationService.beginInteractiveSession();
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== event.pointerId) return;
      if ((e.buttons & 1) === 0) {
        cancel();
        return;
      }
      try {
        update(e.clientX, e.clientY);
        if (gesture.value?.dragStarted) {
          if (!viewport?.hasPointerCapture(event.pointerId))
            viewport?.setPointerCapture(event.pointerId);
          if (animation === null) animation = requestAnimationFrame(scroll);
        }
      } catch (error) {
        cancel();
        throw error;
      }
    };
    const onFinish = (e: PointerEvent) => {
      if (e.pointerId !== event.pointerId) return;
      const ending = gesture.value;
      void finish(e).catch(error => {
        if (gesture.value === ending) cancel();
        console.error(error);
      });
    };
    const onCancel = (e: PointerEvent) => {
      if (e.pointerId === event.pointerId) cancel();
    };
    cleanup = () => {
      cleanup = null;
      options.simulationService.endInteractiveSession();
      lease.release();
      window.removeEventListener('pointermove', onMove, true);
      window.removeEventListener('pointerup', onFinish, true);
      window.removeEventListener('pointercancel', onCancel, true);
      window.removeEventListener('blur', cancel);
      viewport?.removeEventListener('lostpointercapture', onCancel);
      if (viewport?.hasPointerCapture(event.pointerId))
        viewport.releasePointerCapture(event.pointerId);
      if (animation !== null) cancelAnimationFrame(animation);
      animation = null;
    };
    window.addEventListener('pointermove', onMove, true);
    window.addEventListener('pointerup', onFinish, true);
    window.addEventListener('pointercancel', onCancel, true);
    window.addEventListener('blur', cancel);
    viewport?.addEventListener('lostpointercapture', onCancel);
  }
  function consumeClick(key: string) {
    if (suppressedClick !== key) return false;
    suppressedClick = null;
    return true;
  }
  onScopeDispose(cancel);
  return { gesture, begin, cancel, discard, consumeClick };
}
