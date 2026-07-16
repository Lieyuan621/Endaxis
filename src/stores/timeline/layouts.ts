// ─── Timeline layout composable ─────────────────────────────────────────────
// Node rect computations, effect-layout map, and coordinate-space conversion
// helpers. Pure geometry derived from the compiled timeline and the measured
// viewport rects — holds no state of its own beyond its computeds.

import { computed } from 'vue';
import type { Ref, ComputedRef } from 'vue';
import type { TimelineRect } from './types';

// ─── Dependencies ────────────────────────────────────────────────────────────

interface LayoutsDeps {
  timelineRect: Ref<TimelineRect>;
  timelineShift: Ref<number>;
  timelineScrollTop: Ref<number>;
  trackLaneRects: Ref<Record<string, unknown>>;
  compiledTimeline: ComputedRef<any>;
  timeToPx: (time: number) => number;
  getResolvedActionVisualEndTime: (
    resolvedAction: Record<string, any> | null | undefined,
  ) => number | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * For a set of timeline items on shared tracks, compute each item's "visible"
 * end time — clamped so overlapping items on the same track don't extend past
 * the next item's start.
 */
function buildVisibleEndMap(
  items: any[],
  {
    getId,
    getTrackIndex,
    getStart,
    getEnd,
    isVisible = () => true,
  }: {
    getId: (item: any) => string;
    getTrackIndex: (item: any) => number;
    getStart: (item: any) => number;
    getEnd: (item: any) => number;
    isVisible?: (item: any) => boolean;
  },
): Map<string, number> {
  const trackBuckets = new Map<
    number,
    { item: any; originalIndex: number; start: number; end: number }[]
  >();
  items.forEach((item, originalIndex) => {
    if (!item || !isVisible(item)) return;
    const trackIndex = Number(getTrackIndex(item));
    if (!Number.isFinite(trackIndex)) return;
    const start = Number(getStart(item)) || 0;
    const end = Number(getEnd(item)) || start;
    const normalizedEnd = end < start ? start : end;
    if (!trackBuckets.has(trackIndex)) trackBuckets.set(trackIndex, []);
    trackBuckets.get(trackIndex)!.push({
      item,
      originalIndex,
      start,
      end: normalizedEnd,
    });
  });

  const visibleEndMap = new Map<string, number>();
  trackBuckets.forEach(bucket => {
    bucket.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return a.originalIndex - b.originalIndex;
    });

    bucket.forEach((entry, idx) => {
      const nextEntry = bucket[idx + 1];
      const nextStart = nextEntry ? nextEntry.start : Infinity;
      const visibleEnd = Math.min(entry.end, nextStart);
      visibleEndMap.set(getId(entry.item), visibleEnd < entry.start ? entry.start : visibleEnd);
    });
  });

  return visibleEndMap;
}

// ─── Composable ──────────────────────────────────────────────────────────────

export function useTimelineLayouts(deps: LayoutsDeps) {
  const {
    timelineRect,
    timelineShift,
    timelineScrollTop,
    trackLaneRects,
    compiledTimeline,
    timeToPx,
    getResolvedActionVisualEndTime,
  } = deps;

  const nodeRects = computed(() => {
    return newNodeRects.value;
  });

  const newNodeRects = computed(() => {
    const rects: Record<string, unknown> = {};
    const ACTION_BORDER = 2;
    const LINE_GAP = 6;
    const LINE_HEIGHT = 2;
    const visibleEndMap = buildVisibleEndMap(compiledTimeline.value?.actions || [], {
      getId: action => action.id,
      getTrackIndex: action => action.trackIndex,
      getStart: action => action.realStartTime,
      getEnd: action => getResolvedActionVisualEndTime(action) ?? 0,
    });

    const actions = compiledTimeline.value?.actions || [];

    actions.forEach((resAction: any) => {
      const left = timeToPx(resAction.realStartTime);
      const visibleEnd =
        visibleEndMap.get(resAction.id) ?? getResolvedActionVisualEndTime(resAction) ?? 0;
      const width = timeToPx(visibleEnd) - timeToPx(resAction.realStartTime);
      const finalWidth = width < 2 ? 2 : width;
      const trackRect = trackLaneRects.value[resAction.trackIndex] as
        { top?: number; height?: number } | undefined;

      let y = 0;
      if (trackRect) {
        y = trackRect.top ?? 0;
      }

      const rect = {
        left,
        width: finalWidth,
        right: left + finalWidth,
        height: trackRect?.height ?? 0,
        top: y - timelineRect.value.top,
      };

      const barYRelative = ACTION_BORDER + LINE_GAP - LINE_HEIGHT / 2;
      const leftEdge = -ACTION_BORDER;
      const rightEdge = leftEdge + finalWidth + ACTION_BORDER;
      const barY = rect.top + rect.height + barYRelative - ACTION_BORDER;

      rects[resAction.id] = {
        rect,
        bar: {
          top: barY,
          relativeY: barYRelative,
          leftEdge,
          rightEdge,
        },
        triggerWindow: undefined,
      };
    });
    return rects;
  });

  const effectLayouts = computed(() => {
    return newEffectLayouts.value;
  });

  const newEffectLayouts = computed(() => {
    const layoutMap = new Map();
    const ICON_SIZE = 20;
    const BAR_MARGIN = 2;
    const VERTICAL_GAP = 3;
    const ACTION_BORDER = 2;

    const actions = compiledTimeline.value?.actions || [];

    actions.forEach((resAction: any) => {
      const actionRect = (nodeRects.value[resAction.id] as { rect?: any } | undefined)?.rect;
      if (!actionRect) return;

      resAction.effects.forEach((effect: any) => {
        const effectId = effect.id;

        const effectLeft = timeToPx(effect.realStartTime);

        const relativeX = effectLeft - actionRect.left;
        const relativeY =
          effect.hitIndex * (VERTICAL_GAP + ICON_SIZE) + VERTICAL_GAP + ACTION_BORDER;
        const localTransform = `translate(${relativeX}px, ${-relativeY}px)`;

        const absoluteTop = actionRect.top - relativeY - ICON_SIZE + ACTION_BORDER;
        const absoluteLeft = effectLeft + 1;

        const iconRect = {
          left: absoluteLeft,
          width: ICON_SIZE,
          right: absoluteLeft + ICON_SIZE,
          height: ICON_SIZE,
          top: absoluteTop,
        };

        const displayDuration = effect.displayDuration;

        let finalBarWidth =
          displayDuration > 0
            ? timeToPx(effect.realStartTime + displayDuration) - timeToPx(effect.realStartTime)
            : 0;
        if (finalBarWidth > 0) {
          finalBarWidth = Math.max(0, finalBarWidth - ICON_SIZE - BAR_MARGIN);
        }

        layoutMap.set(effectId, {
          rect: iconRect,
          startTime: effect.realStartTime,
          localTransform,
          barData: {
            width: finalBarWidth,
            isConsumed: effect.isConsumed,
            displayDuration,
            extensionAmount: effect.extensionAmount,
          },
          data: effect.node,
          actionId: resAction.id,
          flatIndex: effect.flatIndex,
        });

        if (effect.isConsumed) {
          const barLeft = absoluteLeft + ICON_SIZE + BAR_MARGIN;
          const barRight = barLeft + finalBarWidth;

          const transferRect = {
            left: barRight,
            width: 0,
            right: barRight,
            height: ICON_SIZE,
            top: absoluteTop,
          };
          layoutMap.set(`${effectId}_transfer`, { rect: transferRect });
        }
      });
    });

    return layoutMap;
  });

  function getNodeRect(id: string) {
    if (nodeRects.value[id]) return nodeRects.value[id];
    const effectLayout = effectLayouts.value.get(id);
    if (effectLayout) return effectLayout.rect;
    return null;
  }

  function toTimelineSpace(viewX: number, viewY: number) {
    return {
      x: viewX - timelineRect.value.left + timelineShift.value,
      y: viewY - timelineRect.value.top + timelineScrollTop.value,
    };
  }

  function toViewportSpace(timelineX: number, timelineY: number) {
    return {
      x: timelineX - timelineShift.value + timelineRect.value.left,
      y: timelineY - timelineScrollTop.value + timelineRect.value.top,
    };
  }

  return {
    nodeRects,
    effectLayouts,
    getNodeRect,
    toTimelineSpace,
    toViewportSpace,
  };
}
