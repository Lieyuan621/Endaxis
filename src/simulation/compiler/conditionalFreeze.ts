import type { EffectCondition } from '@/data/types';
import { resolveEffectLifecycle } from '@/data/effectPresets';
import type { InitialEffect } from '@/simulation/simulator';
import type { ActionNode, CompiledEffect, Hit } from './types';
import type { TimeContext } from './timeContext';

export interface FreezeOptions {
  initialEffects?: readonly InitialEffect[];
  prepDuration?: number;
}

export interface FreezeTiming {
  actionStartTimes: Map<string, number>;
  timeContext: TimeContext;
  effectiveDurations: Map<string, number>;
}

// Only the bound self-status is needed here. Unknown combat conditions must not
// become true under negation: this is deliberately not a second combat simulator.
function matchesStatusCondition(
  condition: EffectCondition | EffectCondition[] | undefined,
  status: string,
  active: boolean,
): boolean | undefined {
  if (!condition) return true;
  if (Array.isArray(condition)) {
    const values = condition.map(c => matchesStatusCondition(c, status, active));
    return values.includes(false) ? false : values.includes(undefined) ? undefined : true;
  }
  if (condition.kind === 'not') {
    const value = matchesStatusCondition(condition.condition, status, active);
    return value === undefined ? undefined : !value;
  }
  if (condition.kind === 'or') {
    const values = condition.conditions.map(c => matchesStatusCondition(c, status, active));
    return values.includes(true) ? true : values.includes(undefined) ? undefined : false;
  }
  if (
    condition.kind === 'operatorStatus' &&
    condition.status === status &&
    !condition.stacks &&
    !condition.consumeTarget &&
    !condition.consumeScope &&
    (!condition.target || condition.target === 'self')
  )
    return active;
  return undefined;
}

function isSelfStatus(effect: CompiledEffect, status: string) {
  return (
    effect.kind === 'status' &&
    effect.id === status &&
    (effect.target === 'self' ||
      (typeof effect.target === 'object' && effect.target.scope === 'self'))
  );
}

function consumesSelfStatus(effect: CompiledEffect, status: string) {
  return (
    effect.kind === 'consume' &&
    effect.operatorStatus === status &&
    !effect.consumeTarget &&
    !effect.consumeScope
  );
}

/** Reconcile status eligibility with compressed timing using only relevant hit
 * effects. No damage simulation, resolved-hit cloning, or authored-state writes. */
export function resolveConditionalFreezeTiming<T extends FreezeTiming>(
  actions: ActionNode[],
  getTiming: (durations: Map<string, number>, nonCompressing: ReadonlySet<string>) => T,
  options: FreezeOptions,
): T {
  const candidates = actions.filter(
    a =>
      !a.node.isDisabled &&
      (a.node.triggerWindow || 0) >= 0 &&
      a.node.type !== 'ultimate' &&
      a.node.type !== 'comboSkill' &&
      Number(a.node.conditionalFreeze?.duration) > 0,
  );
  const nonCompressing = new Set<string>();
  if (!candidates.length) return getTiming(new Map(), nonCompressing);

  // Index the relevant track/status hit effects once, not the whole skill tree
  // for every candidate. Other operators and damage/trigger effects are ignored.
  const tracks = new Map<string, ActionNode[]>();
  for (const action of actions) {
    if (action.node.isDisabled) continue;
    const bucket = tracks.get(action.trackId) ?? [];
    bucket.push(action);
    tracks.set(action.trackId, bucket);
  }
  const hitCache = new Map<string, { action: ActionNode; hit: Hit; effects: CompiledEffect[] }[]>();
  let cachedTiming: T | undefined;
  const trackCutoffs = new Map<string, Map<string, number>>();
  function hasStatusAtStart(candidate: ActionNode, timing: T, timingInputs?: number[]): boolean {
    const rule = candidate.node.conditionalFreeze!;
    const trackActions = tracks.get(candidate.trackId) ?? [];
    const key = JSON.stringify([candidate.trackId, rule.operatorStatus]);
    let relevantHits = hitCache.get(key);
    if (!relevantHits) {
      relevantHits = trackActions.flatMap(action =>
        (action.node.hits ?? []).flatMap(hit => {
          const effects = (hit.effects ?? []).filter(
            effect =>
              isSelfStatus(effect, rule.operatorStatus) ||
              consumesSelfStatus(effect, rule.operatorStatus),
          );
          return effects.length ? [{ action, hit, effects }] : [];
        }),
      );
      hitCache.set(key, relevantHits);
    }
    const start = timing.actionStartTimes.get(candidate.id)!;
    timingInputs?.push(start);
    if (cachedTiming !== timing) {
      cachedTiming = timing;
      trackCutoffs.clear();
    }
    let cutoffs = trackCutoffs.get(candidate.trackId);
    if (!cutoffs) {
      const orderedTrack = trackActions.toSorted(
        (a, b) =>
          timing.actionStartTimes.get(a.id)! - timing.actionStartTimes.get(b.id)! ||
          a.id.localeCompare(b.id),
      );
      cutoffs = new Map<string, number>();
      orderedTrack.forEach((action, index) => {
        const next = orderedTrack[index + 1];
        if (!next) return;
        const end = timing.timeContext.getShiftedEndTime(
          timing.actionStartTimes.get(action.id)!,
          timing.effectiveDurations.get(action.id)!,
          action.id,
        );
        const nextStart = timing.actionStartTimes.get(next.id)!;
        // Mirror compileTimeline's interruption boundary, including its epsilon.
        if (nextStart < end - 0.0001) cutoffs!.set(action.id, nextStart - 0.0001);
      });
      trackCutoffs.set(candidate.trackId, cutoffs);
    }

    type Event = { time: number; expiresAt?: number; hit?: Hit; effects?: CompiledEffect[] };
    const events: Event[] = [];
    for (const initial of options.initialEffects ?? []) {
      if (initial.targetTrackId !== candidate.trackId || initial.id !== rule.operatorStatus)
        continue;
      const remaining = Number(initial.remainingDuration);
      const explicit = Number(initial.expiresAt);
      const finite = Number.isFinite(remaining) || Number.isFinite(explicit);
      const duration = Number.isFinite(remaining)
        ? remaining
        : Number.isFinite(explicit)
          ? explicit
          : Infinity;
      const time = finite ? Math.max(0, Number(options.prepDuration) || 0) : 0;
      // Initial effects use real remaining time in simulate(), not shifted time.
      if (duration > 0 && time <= start) events.push({ time, expiresAt: time + duration });
    }
    for (const entry of relevantHits) {
      const time = timing.timeContext.getShiftedEndTime(
        timing.actionStartTimes.get(entry.action.id)!,
        Number(entry.hit.offset) || 0,
        entry.action.id,
      );
      // ACTION_START precedes the dynamically queued hit grants/consumption at
      // the same instant. Initial effects, in contrast, are seeded before it.
      if (time >= start || time >= (cutoffs.get(entry.action.id) ?? Infinity)) continue;
      timingInputs?.push(time, Math.min(start, cutoffs.get(entry.action.id) ?? Infinity));
      events.push({ time, hit: entry.hit, effects: entry.effects });
    }
    events.sort((a, b) => a.time - b.time);
    let expiresAt = -Infinity;
    for (let index = 0; index < events.length;) {
      const time = events[index]!.time;
      const batch: Event[] = [];
      while (events[index]?.time === time) batch.push(events[index++]!);
      for (const event of batch) {
        if (event.expiresAt !== undefined) expiresAt = event.expiresAt;
      }
      const active = time < expiresAt;
      let consumed = false;
      for (const event of batch) {
        if (matchesStatusCondition(event.hit?._condition, rule.operatorStatus, active) !== true)
          continue;
        for (const effect of event.effects ?? []) {
          if (matchesStatusCondition(effect.condition, rule.operatorStatus, active) !== true)
            continue;
          if (isSelfStatus(effect, rule.operatorStatus)) {
            const duration = resolveEffectLifecycle(effect).duration;
            if (duration > 0)
              expiresAt = effect.ignoreTimeShift
                ? time + duration
                : timing.timeContext.getShiftedEndTime(time, duration);
          } else if (active) {
            consumed = true;
          }
        }
      }
      // Status consumption has a lower queue priority than same-time grants.
      if (consumed) expiresAt = -Infinity;
      timingInputs?.push(Math.min(start, expiresAt));
    }
    return start < expiresAt;
  }

  const allDurations = new Map(candidates.map(a => [a.id, a.node.conditionalFreeze!.duration]));
  // Only intrinsically cyclic boundaries use the existing causal tie-break.
  // Keep their decision for this compilation so unrelated candidates can settle.
  const causalEligibility = new Map<string, boolean>();
  const signature = (durations: Map<string, number>) =>
    candidates.map(a => (durations.has(a.id) ? '1' : '0')).join('');
  // Start optimistically: an uncompressed preceding combo can delay a valid
  // cast past status expiry. Testing only that delayed schedule would miss it.
  let durations = allDurations;
  let timing = getTiming(durations, nonCompressing);
  let seen = new Set([signature(durations)]);
  let passes = 0;
  for (;;) {
    const next = new Map(
      candidates
        .filter(a => causalEligibility.get(a.id) ?? hasStatusAtStart(a, timing))
        .map(a => [a.id, a.node.conditionalFreeze!.duration]),
    );
    const nextSignature = signature(next);
    if (nextSignature === signature(durations)) return timing;

    if (seen.has(nextSignature) || ++passes > candidates.length + 1) {
      // A boundary can have no consistent compressed solution (e.g. compression
      // moves the cast before the initial status is granted, but removing the
      // freeze delays it until after the grant). Protect only the oscillating
      // conditional sources; ordinary, unrelated compression remains enabled.
      let protectedSource = false;
      for (const candidate of candidates) {
        if (
          durations.has(candidate.id) !== next.has(candidate.id) &&
          candidate.node.conditionalFreeze?.compression === 'comboSkill' &&
          !nonCompressing.has(candidate.id)
        ) {
          nonCompressing.add(candidate.id);
          protectedSource = true;
        }
      }
      if (!protectedSource) {
        // A fixed source can oscillate because a nearby source compresses its
        // predecessor. Probe only on this exceptional path, and isolate one
        // source that actually changes the boundary's timing inputs. Checking
        // both schedules also covers a source absent in the current schedule.
        const fluctuating = candidates.filter(a => durations.has(a.id) !== next.has(a.id));
        const inputs = (value: T) => {
          const result: number[] = [];
          for (const candidate of fluctuating) hasStatusAtStart(candidate, value, result);
          return result;
        };
        const schedules = [durations, next];
        const baseline = [inputs(timing), inputs(getTiming(next, nonCompressing))];
        for (const candidate of candidates) {
          if (
            candidate.node.conditionalFreeze?.compression === 'comboSkill' &&
            !nonCompressing.has(candidate.id)
          ) {
            const isolated = new Set(nonCompressing).add(candidate.id);
            const changesBoundary = schedules.some((schedule, index) => {
              const trial = inputs(getTiming(schedule, isolated));
              const original = baseline[index]!;
              return trial.length !== original.length || trial.some((v, i) => v !== original[i]);
            });
            if (changesBoundary) {
              nonCompressing.add(candidate.id);
              protectedSource = true;
              break;
            }
          }
        }
      }
      if (!protectedSource) {
        // With fixed sources even the same-time ordering can be cyclic. Apply
        // the causal tie-break only at those authored boundaries, not globally:
        // an unrelated candidate may require compressed timing to beat expiry.
        const fluctuating = new Set(
          candidates.filter(a => durations.has(a.id) !== next.has(a.id)).map(a => a.id),
        );
        const boundaryTimes = new Set(
          candidates.filter(a => fluctuating.has(a.id)).map(a => a.node.startTime),
        );
        const boundaryCandidates = candidates.filter(a => boundaryTimes.has(a.node.startTime));
        durations = new Map(durations);
        for (const candidate of boundaryCandidates) durations.delete(candidate.id);
        timing = getTiming(durations, nonCompressing);
        for (const candidate of boundaryCandidates) {
          const enabled =
            causalEligibility.get(candidate.id) ?? hasStatusAtStart(candidate, timing);
          if (fluctuating.has(candidate.id)) causalEligibility.set(candidate.id, enabled);
          if (enabled) {
            durations.set(candidate.id, candidate.node.conditionalFreeze!.duration);
            timing = getTiming(durations, nonCompressing);
          }
        }
        seen = new Set([signature(durations)]);
        passes = 0;
        continue;
      }
      durations = new Map([...allDurations].filter(([id]) => causalEligibility.get(id) !== false));
      seen = new Set([signature(durations)]);
      passes = 0;
    } else {
      durations = next;
      seen.add(nextSignature);
    }
    timing = getTiming(durations, nonCompressing);
  }
}
