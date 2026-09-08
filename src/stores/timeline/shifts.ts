// ─── Timeline shifts composable ─────────────────────────────────────────────
// Time-domain manipulation of placed actions: the physical "stop" shifting that
// derives real start times from logical ones, ultimate-enhancement window
// metrics, subsequent-action push/pull, and game/real time conversions. All
// mutate or read the shared `tracks` ref; the time-warp math delegates to the
// compiled timeline's timeContext.

import { computed } from 'vue';
import type { Ref, ComputedRef } from 'vue';
import { snapTimeToFrame } from '@/utils/time';
import type { Track, TimelineAction } from './types';
import {
  getUltimateEnhancementMetricsMap,
  type UltimateEnhancementMetrics,
} from '@/simulation/ultimateEnhancement';
import { calculateTimelineShifts } from '@/simulation/compiler/compileTimeline';
import type { ActionNode } from '@/simulation/compiler/types';
import type { FreezeOptions } from '@/simulation/compiler/conditionalFreeze';

// ─── Dependencies ────────────────────────────────────────────────────────────

interface ShiftsDeps {
  tracks: Ref<Track[]>;
  timeContext: ComputedRef<any>;
  compiledTimeline: ComputedRef<any>;
  simulation: ComputedRef<any>;
  isComboLikeAction: (action: { type?: string } | null | undefined) => boolean;
  isUltimateLikeAction: (action: { type?: string } | null | undefined) => boolean;
  getFreezeOptions: () => FreezeOptions;
}

// ─── Composable ──────────────────────────────────────────────────────────────

export function useShifts(deps: ShiftsDeps) {
  const {
    tracks,
    timeContext,
    compiledTimeline,
    simulation,
    isComboLikeAction,
    isUltimateLikeAction,
    getFreezeOptions,
  } = deps;

  function getLogicalTiming() {
    // Shallow timing views only: hits and effects remain shared, read-only data.
    const actions = tracks.value.flatMap((track, trackIndex) =>
      track.actions.map(action => ({
        type: 'action',
        id: action.instanceId,
        trackId: track.id,
        trackIndex,
        node: { ...action, startTime: action.logicalStartTime ?? action.startTime },
      })),
    ) as ActionNode[];
    return calculateTimelineShifts(actions, getFreezeOptions());
  }

  function getActionFreezeDurations(actions: readonly TimelineAction[]) {
    const amounts = new Map<string, number>();
    let timing: ReturnType<typeof getLogicalTiming> | undefined;
    for (const action of actions) {
      if (!action.instanceId) continue;
      if (isComboLikeAction(action)) amounts.set(action.instanceId, 0.5);
      else if (isUltimateLikeAction(action))
        amounts.set(action.instanceId, Number(action.animationTime) || 1.5);
      else if (action.conditionalFreeze) {
        timing ??= getLogicalTiming();
        // Placement/deletion moves authored positions by the nominal freeze,
        // just as ordinary combos do. Compression is derived after that move.
        amounts.set(
          action.instanceId,
          timing.sourceShiftMap.has(action.instanceId) ? action.conditionalFreeze.duration : 0,
        );
      }
    }
    return amounts;
  }

  function refreshAllActionShifts(excludeIds: string | (string | undefined)[] = []) {
    const excludeSet = new Set(Array.isArray(excludeIds) ? excludeIds : [excludeIds]);
    const timing = getLogicalTiming();
    for (const track of tracks.value) {
      for (const action of track.actions) {
        if (!action.instanceId || excludeSet.has(action.instanceId)) continue;
        const start = snapTimeToFrame(timing.actionStartTimes.get(action.instanceId)!);
        if (action.startTime !== start) action.startTime = start;
      }
      track.actions.sort((a, b) => a.startTime - b.startTime);
    }
  }

  function getShiftedEndTime(
    startTime: number,
    duration: number,
    excludeActionId: string | null | undefined = null,
  ): number {
    return timeContext.value
      ? timeContext.value.getShiftedEndTime(startTime, duration, excludeActionId)
      : startTime + duration;
  }

  const ultimateEnhancementMetricsMap = computed(() => {
    const timeline = compiledTimeline.value;
    return timeline
      ? getUltimateEnhancementMetricsMap(timeline, simulation.value?.operatorLog ?? [])
      : new Map<string, UltimateEnhancementMetrics>();
  });

  function getUltimateEnhancementMetrics(actionInstanceId: string) {
    return ultimateEnhancementMetricsMap.value.get(actionInstanceId) || null;
  }

  function toGameTime(realTimeS: number) {
    return timeContext.value ? timeContext.value.toGameTime(realTimeS) : realTimeS;
  }

  function toRealTime(gameTimeS: number) {
    return timeContext.value ? timeContext.value.toRealTime(gameTimeS) : gameTimeS;
  }

  function pushSubsequentActions(
    triggerTime: number,
    amount: number,
    excludeIds: string | (string | undefined)[] = [],
  ) {
    const excludeSet = new Set(Array.isArray(excludeIds) ? excludeIds : [excludeIds]);
    tracks.value.forEach(track => {
      track.actions.forEach(action => {
        if (!excludeSet.has(action.instanceId) && action.startTime >= triggerTime) {
          action.startTime += amount;
          if (action.logicalStartTime !== undefined) {
            action.logicalStartTime += amount;
          } else {
            action.logicalStartTime = action.startTime;
          }
        }
      });
      track.actions.sort((a, b) => a.startTime - b.startTime);
    });
  }

  function pullSubsequentActions(
    triggerTime: number,
    amount: number,
    excludeIds: string | (string | undefined)[] = [],
  ) {
    if (amount <= 0) return;
    const excludeSet = new Set(Array.isArray(excludeIds) ? excludeIds : [excludeIds]);
    tracks.value.forEach(track => {
      track.actions.forEach(action => {
        if (!excludeSet.has(action.instanceId) && action.startTime >= triggerTime) {
          action.startTime = Math.max(0, action.startTime - amount);
          if (action.logicalStartTime !== undefined) {
            action.logicalStartTime = Math.max(0, action.logicalStartTime - amount);
          } else {
            action.logicalStartTime = action.startTime;
          }
        }
      });
      track.actions.sort((a, b) => a.startTime - b.startTime);
    });
  }

  return {
    getActionFreezeDurations,
    refreshAllActionShifts,
    getShiftedEndTime,
    getUltimateEnhancementMetrics,
    toGameTime,
    toRealTime,
    pushSubsequentActions,
    pullSubsequentActions,
  };
}
