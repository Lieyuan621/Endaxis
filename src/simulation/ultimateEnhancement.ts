import type { ResolvedAction, ResolvedTimeline } from './compiler/types';
import type { OperatorStateEvent } from './engine/types';
import { buildWindowsFromLog } from './projection/projectOperatorEffects';
import { snapMs } from '@/utils/precision';

export interface UltimateEnhancementMetrics {
  enhStart: number;
  baseDuration: number;
  finalEnd: number;
  extensionAmount: number;
}

const EPSILON = 0.0001;
// Compiled timelines are replaced on edits. Share derived numeric windows
// between the editor and engine without persisting them in authored actions.
const numericCache = new WeakMap<
  ResolvedTimeline,
  ReadonlyMap<string, UltimateEnhancementMetrics>
>();

export function getUltimateEnhancementStart(timeline: ResolvedTimeline, action: ResolvedAction) {
  const animation = Math.max(
    0,
    Number(action.node.animationTime) || Number(action.freezeDuration) || 0,
  );
  return timeline.timeContext.getShiftedEndTime(action.realStartTime, animation, action.id);
}

export function getNumericUltimateEnhancements(
  timeline: ResolvedTimeline,
): ReadonlyMap<string, UltimateEnhancementMetrics> {
  const cached = numericCache.get(timeline);
  if (cached) return cached;
  const result = new Map<string, UltimateEnhancementMetrics>();
  const tracks = new Map<string, ResolvedAction[]>();
  for (const action of timeline.actions) {
    const track = tracks.get(action.trackId) ?? [];
    track.push(action);
    tracks.set(action.trackId, track);
  }
  for (const track of tracks.values()) {
    track.sort((a, b) => a.realStartTime - b.realStartTime);
    for (const ultimate of track) {
      if (ultimate.node.type !== 'ultimate' || ultimate.node.isDisabled) continue;
      const baseDuration = Math.max(0, Number(ultimate.node.enhancementTime) || 0);
      if (!baseDuration) continue;
      const enhStart = getUltimateEnhancementStart(timeline, ultimate);
      const endAt = (extra: number) =>
        timeline.timeContext.getShiftedEndTime(enhStart, baseDuration + extra, ultimate.id);
      let extra = 0;
      let finalEnd = endAt(0);
      const rule = ultimate.node.enhancementExtension;
      if (rule) {
        // Positive extensions only move the end forward, so chronological
        // traversal covers chained extensions in one pass, with no rescans.
        for (const action of track) {
          if (action.realStartTime >= finalEnd - EPSILON) break;
          if (action.realStartTime + EPSILON < enhStart || action.id === ultimate.id) continue;
          if (action.node.isDisabled || (action.node.triggerWindow || 0) < 0) continue;
          if (!rule.skillTypes.some(type => type === action.node.type)) continue;
          // Preserve existing semantics: configured duration, not interrupted
          // or freeze-extended real duration. Global freezes are applied by endAt.
          const delta = Math.max(0, Number(action.node.duration) || 0);
          if (!delta) continue;
          extra += delta;
          finalEnd = endAt(extra);
        }
      }
      result.set(ultimate.id, {
        enhStart,
        baseDuration,
        finalEnd,
        extensionAmount: Math.max(0, snapMs(finalEnd - enhStart - baseDuration)),
      });
    }
  }
  numericCache.set(timeline, result);
  return result;
}

/** Status-bound windows remain runtime-derived; do not cache live status logs. */
export function getUltimateEnhancementMetricsMap(
  timeline: ResolvedTimeline,
  operatorLog: OperatorStateEvent[],
): ReadonlyMap<string, UltimateEnhancementMetrics> {
  const result = new Map(getNumericUltimateEnhancements(timeline));
  const statusWindows = new Map<string, ReturnType<typeof buildWindowsFromLog>>();
  for (const action of timeline.actions) {
    const status = action.node.enhancementTime;
    if (
      action.node.type !== 'ultimate' ||
      action.node.isDisabled ||
      typeof status !== 'string' ||
      !status
    )
      continue;
    let windows = statusWindows.get(action.trackId);
    if (!windows) {
      windows = buildWindowsFromLog(operatorLog, action.trackId);
      statusWindows.set(action.trackId, windows);
    }
    const enhStart = getUltimateEnhancementStart(timeline, action);
    const nextUltStart = timeline.actions
      .filter(
        a =>
          a.trackId === action.trackId &&
          a.node.type === 'ultimate' &&
          a.realStartTime > action.realStartTime + EPSILON,
      )
      .reduce((min, a) => Math.min(min, a.realStartTime), Infinity);
    const spans: { start: number; end: number }[] = [];
    for (const w of (windows.get(status) ?? []).toSorted((a, b) => a.start - b.start)) {
      const last = spans.at(-1);
      if (last && w.start <= last.end + EPSILON) last.end = Math.max(last.end, w.end);
      else spans.push({ start: w.start, end: w.end });
    }
    const span = spans.find(
      s => s.start >= action.realStartTime - EPSILON && s.start < nextUltStart - EPSILON,
    );
    if (span && span.end > enhStart)
      result.set(action.id, {
        enhStart,
        baseDuration: span.end - enhStart,
        finalEnd: span.end,
        extensionAmount: 0,
      });
  }
  return result;
}

/** Runtime cooldown attribution differs from the merged display bar: use this
 * cast's own status application and actual expiry, as before. */
export function getStatusBoundUltimateCooldownStart(
  action: ResolvedAction,
  log: readonly OperatorStateEvent[],
) {
  const status = action.node.enhancementTime;
  if (typeof status !== 'string' || !status) return undefined;
  const apply = log.findLast(
    entry =>
      entry.type === 'OPERATOR_EFFECT_APPLY' &&
      entry.id === status &&
      entry.targetTrackId === action.trackId &&
      entry.actionId === action.id,
  );
  if (apply?.type !== 'OPERATOR_EFFECT_APPLY') return undefined;
  const expiry = log.find(
    entry =>
      entry.type === 'OPERATOR_EFFECT_EXPIRE' &&
      entry.id === status &&
      entry.targetTrackId === action.trackId &&
      entry.time >= apply.time - 1e-6 &&
      entry.time <= apply.expiresAt + 1e-6,
  );
  return expiry?.time ?? apply.expiresAt;
}
