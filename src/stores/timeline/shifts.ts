// ─── Timeline shifts composable ─────────────────────────────────────────────
// Time-domain manipulation of placed actions: the physical "stop" shifting that
// derives real start times from logical ones, ultimate-enhancement window
// metrics, subsequent-action push/pull, and game/real time conversions. All
// mutate or read the shared `tracks` ref; the time-warp math delegates to the
// compiled timeline's timeContext.

import { computed } from 'vue';
import type { Ref, ComputedRef } from 'vue';
import { snapTimeToFrame } from '@/utils/time';
import { snapMs } from '@/utils/precision';
import type { Track, TimelineAction, UltEnhancer } from './types';

// ─── Dependencies ────────────────────────────────────────────────────────────

interface ShiftsDeps {
  tracks: Ref<Track[]>;
  timeContext: ComputedRef<any>;
  compiledTimeline: ComputedRef<any>;
  isComboLikeAction: (action: { type?: string } | null | undefined) => boolean;
  isUltimateLikeAction: (action: { type?: string } | null | undefined) => boolean;
  getUltimateEnhancementExtender: (trackId: string | null | undefined) => UltEnhancer | null;
}

// ─── Composable ──────────────────────────────────────────────────────────────

export function useShifts(deps: ShiftsDeps) {
  const {
    tracks,
    timeContext,
    compiledTimeline,
    isComboLikeAction,
    isUltimateLikeAction,
    getUltimateEnhancementExtender,
  } = deps;

  function refreshAllActionShifts(excludeIds: string | (string | undefined)[] = []) {
    const excludeSet = new Set(Array.isArray(excludeIds) ? excludeIds : [excludeIds]);

    const allActions = tracks.value
      .flatMap(t => t.actions)
      .sort((a, b) => (a.logicalStartTime ?? a.startTime) - (b.logicalStartTime ?? b.startTime));

    const stopSources = allActions.filter(
      a =>
        (isComboLikeAction(a) || isUltimateLikeAction(a)) &&
        !a.isDisabled &&
        (a.triggerWindow || 0) >= 0,
    );

    let lastPhysicalEnd = 0;
    const sourceShiftMap = new Map();

    stopSources.forEach((source, index) => {
      const nextSource = stopSources[index + 1];

      const physicalStart = Math.max(source.logicalStartTime!, lastPhysicalEnd);

      let amount = 0;
      if (isUltimateLikeAction(source)) {
        amount = Number(source.animationTime) || 1.5;
      } else {
        if (nextSource) {
          const gap = nextSource.logicalStartTime! - source.logicalStartTime!;
          amount = Math.min(0.5, Math.max(0.1, snapTimeToFrame(gap)));
        } else {
          amount = 0.5;
        }
      }

      const shift = physicalStart - source.logicalStartTime!;
      sourceShiftMap.set(source.instanceId, {
        shift,
        amount,
        physicalStart,
        physicalEnd: physicalStart + amount,
      });

      lastPhysicalEnd = physicalStart + amount;
    });

    allActions.forEach(a => {
      if (excludeSet.has(a.instanceId)) return;

      const activeSource = [...stopSources]
        .reverse()
        .find(s => s.logicalStartTime! <= a.logicalStartTime!);

      if (activeSource) {
        const ctx = sourceShiftMap.get(activeSource.instanceId);

        if (a.instanceId === activeSource.instanceId) {
          a.startTime = snapTimeToFrame(ctx.physicalStart);
        } else {
          const normalShiftedTime = a.logicalStartTime! + ctx.shift;
          a.startTime = snapTimeToFrame(Math.max(normalShiftedTime, ctx.physicalEnd));
        }
      } else {
        a.startTime = a.logicalStartTime!;
      }
    });

    tracks.value.forEach(t => t.actions.sort((a, b) => a.startTime - b.startTime));
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
    const map = new Map();

    const getMetrics = (
      trackId: string | null | undefined,
      action: TimelineAction | null | undefined,
    ) => {
      if (!action || !isUltimateLikeAction(action)) return null;
      const baseDuration = Number(action.enhancementTime) || 0;
      if (baseDuration <= 0) return null;

      const resolvedAction = compiledTimeline.value?.actionMap?.get(action.instanceId ?? '');
      const start = Number(resolvedAction?.realStartTime ?? action.startTime) || 0;
      const freezeDuration = Number(action.animationTime || action.duration) || 0;
      const enhStart = getShiftedEndTime(start, freezeDuration, action.instanceId);

      let extraDuration = 0;

      const extender = getUltimateEnhancementExtender(trackId);
      if (typeof extender === 'function') {
        const track = tracks.value.find(t => t.id === trackId);
        if (track) {
          extraDuration = extender({
            track,
            enhStart,
            baseDuration,
            ultimateAction: action,
            getShiftedEndTime,
          });
        }
      }

      const finalEnd = getShiftedEndTime(enhStart, baseDuration + extraDuration, action.instanceId);
      const shiftedEnhDuration = finalEnd - enhStart;
      const extensionAmount = snapMs(shiftedEnhDuration - baseDuration);

      return {
        enhStart,
        baseDuration,
        finalEnd,
        extensionAmount: Math.max(0, extensionAmount),
      };
    };

    for (const track of tracks.value) {
      if (!track?.id || !Array.isArray(track.actions)) continue;
      for (const action of track.actions) {
        const metrics = getMetrics(track.id, action);
        if (!metrics) continue;
        map.set(action.instanceId, metrics);
      }
    }

    return map;
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
    refreshAllActionShifts,
    getShiftedEndTime,
    getUltimateEnhancementMetrics,
    toGameTime,
    toRealTime,
    pushSubsequentActions,
    pullSubsequentActions,
  };
}
