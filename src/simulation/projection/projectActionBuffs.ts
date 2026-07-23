import { getEffectColor, getEffectName } from '@/data/effectPresets';
import type { Effect } from '@/data/types';
import { isEnemyStat } from '@/data/types';
import type { OperatorEffectApplyEvent, OperatorStateEvent } from '@/simulation/engine/types';

export type ActionBuffPlacement = 'upper' | 'lower';
export type ActionBuffSourceGroup = 'operator' | 'weapon' | 'gearSet';

export interface ActionBuffSegment {
  key: string;
  placement: ActionBuffPlacement;
  sourceGroup: ActionBuffSourceGroup;
  start: number;
  end: number;
  lane: number;
  icon: string | null;
  color: string;
  title: string;
  effect?: Effect;
  stacks: number;
  maxStacks: number;
  isConsumed: boolean;
  /** When false, timeline shows icon/stacks only (no duration bar). */
  showDurationBar?: boolean;
}

export interface ActionBuffLayout {
  upper: ActionBuffSegment[];
  lower: ActionBuffSegment[];
  upperLaneCount: number;
  lowerLaneCount: number;
}

type PendingActionBuffSegment = Omit<ActionBuffSegment, 'lane'>;

interface PendingActionBuffLayout {
  upper: PendingActionBuffSegment[];
  lower: PendingActionBuffSegment[];
}

interface ActionBuffApplyEvent {
  key: string;
  targetTrackId: string;
  time: number;
  expiresAt: number;
  sourceGroup: ActionBuffSourceGroup;
  placement: ActionBuffPlacement;
  icon: string | null;
  color: string;
  title: string;
  effect?: Effect;
  stacks: number;
  maxStacks: number;
  isContinuation?: boolean;
}

interface ActionBuffEndEvent {
  key: string;
  time: number;
  type: 'consumption' | 'expiration';
}

interface ActionBuffWindow {
  key: string;
  targetTrackId: string;
  sourceGroup: ActionBuffSourceGroup;
  placement: ActionBuffPlacement;
  start: number;
  end: number;
  icon: string | null;
  color: string;
  title: string;
  effect?: Effect;
  stacks: number;
  maxStacks: number;
  isConsumed: boolean;
  showDurationBar: boolean;
}

function looksInternalKey(value: unknown): boolean {
  const key = String(value || '').toLowerCase();
  if (!key) return false;
  return /(^|[-_])(tracker|internal|consume)([-_]|$)/.test(key);
}

function resolvePlacement(sourceGroup: unknown): ActionBuffPlacement {
  return sourceGroup === 'weapon' || sourceGroup === 'gearSet' ? 'lower' : 'upper';
}

function isVisibleFriendlyBuff(
  event: OperatorEffectApplyEvent,
  effect: Effect | undefined,
): boolean {
  if (!effect || (effect.kind !== 'status' && effect.kind !== 'oneTime')) return false;
  if (effect.hide === true || event.silent === true || (effect as any).silent === true)
    return false;

  const target = effect.target;
  const scope = typeof target === 'string' ? target : target?.scope;
  if (scope === 'enemy') return false;
  if (event.stat && isEnemyStat(event.stat)) return false;

  const statusKey = event.id || effect.id;
  if (looksInternalKey(statusKey) || looksInternalKey((effect as any).name)) return false;

  return true;
}

function pushMergedApply(
  applyMap: Map<string, ActionBuffApplyEvent>,
  event: OperatorEffectApplyEvent,
  effect: Effect,
) {
  const sourceGroup = ((effect as any)?.sourceGroup ?? 'operator') as ActionBuffSourceGroup;
  const effectKey = String(event.id || effect?.id || 'status');
  const time = event.time;
  const targetTrackId = event.targetTrackId;
  const dedupeKey = `${targetTrackId}::${effectKey}::${time}`;

  const nextEvent: ActionBuffApplyEvent = {
    key: `${targetTrackId}::${effectKey}`,
    targetTrackId,
    time,
    expiresAt: event.expiresAt,
    sourceGroup,
    placement: resolvePlacement(sourceGroup),
    icon: ((effect as any)?.icon as string | null | undefined) ?? null,
    color: effect ? getEffectColor(effect) : '#5dade2',
    title: effect ? getEffectName(effect) : effectKey,
    effect,
    stacks: Math.max(1, Number(event.cumulativeStacks ?? event.stacks) || 1),
    maxStacks: Math.max(1, Number(event.maxStacks) || 1),
    isContinuation: event.isContinuation,
  };

  const existing = applyMap.get(dedupeKey);
  if (!existing) {
    applyMap.set(dedupeKey, nextEvent);
    return;
  }

  if (nextEvent.stacks > existing.stacks) existing.stacks = nextEvent.stacks;
  if (nextEvent.maxStacks > existing.maxStacks) existing.maxStacks = nextEvent.maxStacks;
  if (nextEvent.expiresAt > existing.expiresAt) existing.expiresAt = nextEvent.expiresAt;
  if (!existing.icon && nextEvent.icon) existing.icon = nextEvent.icon;
  if (!existing.effect && nextEvent.effect) existing.effect = nextEvent.effect;
}

function pushMergedEnd(
  endMap: Map<string, ActionBuffEndEvent>,
  targetTrackId: string,
  effectId: string,
  time: number,
  type: 'consumption' | 'expiration',
) {
  const dedupeKey = `${targetTrackId}::${effectId}::${time}`;
  const existing = endMap.get(dedupeKey);
  if (!existing) {
    endMap.set(dedupeKey, {
      key: `${targetTrackId}::${effectId}`,
      time,
      type,
    });
    return;
  }

  if (type === 'consumption') {
    existing.type = 'consumption';
  }
}

function assignLanes(segments: PendingActionBuffSegment[]): ActionBuffSegment[] {
  const laneEnds: number[] = [];
  return segments
    .toSorted((left, right) => {
      if (left.start !== right.start) return left.start - right.start;
      return right.end - left.end;
    })
    .map(segment => {
      let lane = laneEnds.findIndex(end => end <= segment.start);
      if (lane < 0) {
        lane = laneEnds.length;
        laneEnds.push(segment.end);
      } else {
        laneEnds[lane] = segment.end;
      }
      return { ...segment, lane };
    });
}

function applySort(left: ActionBuffApplyEvent, right: ActionBuffApplyEvent): number {
  if (left.time !== right.time) return left.time - right.time;
  if (left.isContinuation !== right.isContinuation) return left.isContinuation ? 1 : -1;
  return right.stacks - left.stacks;
}

function endSort(left: ActionBuffEndEvent, right: ActionBuffEndEvent): number {
  if (left.time !== right.time) return left.time - right.time;
  if (left.type === right.type) return 0;
  return left.type === 'consumption' ? -1 : 1;
}

function buildBuffWindows(operatorLog: OperatorStateEvent[], maxTime: number): ActionBuffWindow[] {
  const applyMap = new Map<string, ActionBuffApplyEvent>();
  const endMap = new Map<string, ActionBuffEndEvent>();
  const effectByKey = new Map<string, Effect>();

  operatorLog.forEach(entry => {
    if (entry.type === 'OPERATOR_EFFECT_APPLY') {
      if (!entry.targetTrackId) return;
      const effectKey = String(entry.id || entry.effect?.id || 'status');
      const cacheKey = `${entry.targetTrackId}::${effectKey}`;
      if (entry.effect) effectByKey.set(cacheKey, entry.effect);
      const effect = entry.effect ?? effectByKey.get(cacheKey);
      if (!isVisibleFriendlyBuff(entry, effect)) return;
      if (!effect) return;
      pushMergedApply(applyMap, entry, effect);
      return;
    }

    if (entry.type === 'OPERATOR_EFFECT_EXPIRE') {
      if (!entry.targetTrackId || !entry.id) return;
      pushMergedEnd(
        endMap,
        entry.targetTrackId,
        entry.id,
        entry.time,
        entry.consumed ? 'consumption' : 'expiration',
      );
    }
  });

  const appliesByKey = new Map<string, ActionBuffApplyEvent[]>();
  applyMap.forEach(apply => {
    const list = appliesByKey.get(apply.key) ?? [];
    list.push(apply);
    appliesByKey.set(apply.key, list);
  });

  const endsByKey = new Map<string, ActionBuffEndEvent[]>();
  endMap.forEach(end => {
    const list = endsByKey.get(end.key) ?? [];
    list.push(end);
    endsByKey.set(end.key, list);
  });

  const windows: ActionBuffWindow[] = [];

  appliesByKey.forEach((applies, key) => {
    const ends = (endsByKey.get(key) ?? []).toSorted(endSort);
    const sortedApplies = applies.toSorted(applySort);

    sortedApplies.forEach((apply, index) => {
      const nextApplyTime = sortedApplies[index + 1]?.time ?? Number.POSITIVE_INFINITY;
      const endEvent =
        apply.isContinuation && apply.stacks > 0
          ? (ends.find(candidate => candidate.time > apply.time) ?? null)
          : (ends.find(candidate => candidate.time >= apply.time) ?? null);
      const unclampedEnd = Math.min(nextApplyTime, endEvent?.time ?? apply.expiresAt);
      const endTime = Math.min(unclampedEnd, maxTime);
      if (endTime <= apply.time) return;

      windows.push({
        key: `${key}::${apply.time}`,
        targetTrackId: apply.targetTrackId,
        sourceGroup: apply.sourceGroup,
        placement: apply.placement,
        start: apply.time,
        end: endTime,
        icon: apply.icon,
        color: apply.color,
        title: apply.title,
        effect: apply.effect,
        stacks: apply.stacks,
        maxStacks: apply.maxStacks,
        isConsumed: endEvent?.type === 'consumption',
        // oneTime lasts until the next matching action — icon+stacks only, no duration bar.
        showDurationBar: apply.effect?.kind !== 'oneTime',
      });
    });
  });

  return windows;
}

export function projectActionBuffs(
  operatorLog: OperatorStateEvent[],
  maxTime: number,
): Map<string, ActionBuffLayout> {
  if (!operatorLog.length || maxTime <= 0) return new Map();

  const windows = buildBuffWindows(operatorLog, maxTime);
  if (!windows.length) return new Map();

  const pendingLayouts = new Map<string, PendingActionBuffLayout>();

  windows.forEach(window => {
    const start = Math.max(0, window.start);
    const end = Math.min(window.end, maxTime);
    if (end <= start) return;

    const layout =
      pendingLayouts.get(window.targetTrackId) ??
      ({
        upper: [] as PendingActionBuffSegment[],
        lower: [] as PendingActionBuffSegment[],
      } satisfies PendingActionBuffLayout);

    const segment: PendingActionBuffSegment = {
      key: window.key,
      placement: window.placement,
      sourceGroup: window.sourceGroup,
      start,
      end,
      icon: window.icon,
      color: window.color,
      title: window.title,
      effect: window.effect,
      stacks: window.stacks,
      maxStacks: window.maxStacks,
      isConsumed: window.isConsumed,
      showDurationBar: window.showDurationBar,
    };

    if (window.placement === 'upper') {
      layout.upper.push(segment);
    } else {
      layout.lower.push(segment);
    }

    pendingLayouts.set(window.targetTrackId, layout);
  });

  const trackMap = new Map<string, ActionBuffLayout>();

  pendingLayouts.forEach((layout, trackId) => {
    const upper = assignLanes(layout.upper);
    const lower = assignLanes(layout.lower);
    trackMap.set(trackId, {
      upper,
      lower,
      upperLaneCount: upper.reduce((max, item) => Math.max(max, item.lane + 1), 0),
      lowerLaneCount: lower.reduce((max, item) => Math.max(max, item.lane + 1), 0),
    });
  });

  return trackMap;
}
