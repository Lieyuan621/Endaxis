import type { Effect } from '@/data/types';
import {
  type ActivationWindow,
  windowsToOperatorSegments,
  buildApplyExpireWindows,
} from './projectTriggeredEffects';
import type {
  OperatorStateEvent,
  OperatorEffectApplyEvent,
  OperatorEffectExpireEvent,
} from '@/simulation/engine/types';

import { ROW_HEIGHT, buildByTypeKey, layoutEffects, type EffectLayout } from './effectLayout';
export { ROW_HEIGHT };

// ─── Types ──────────────────────────────────────────────────────────────────

export enum OperatorEffectGroup {
  OPERATOR = 0,
  WEAPON = 1,
  SET = 2,
}

export interface OperatorEffectSegment {
  typeKey: string;
  group: OperatorEffectGroup;
  start: number;
  end: number;
  stacks: number;
  maxStacks: number;
  showIcon: boolean;
  icon: string;
  color: string;
  effect: Effect;
  effectId: string;
  sourceActionId: string;
  isConsumed: boolean;
  extensionAmount: number;
}

interface OperatorEffectProjection {
  segments: OperatorEffectSegment[];
  byTypeKey: Map<string, OperatorEffectSegment[]>;
}

type OperatorEffectLayout = EffectLayout<OperatorEffectSegment>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Synthetic effect stub used when the log event doesn't carry the full Effect object. */
function syntheticStatusEffect(id: string): Effect {
  return { kind: 'status', id, target: { scope: 'self' } } as Effect;
}

/**
 * Build a unified map of all operator StatusEffect windows from the sim log.
 * Keyed by effect id. Works for both stat-bearing and pure state effects —
 * both produce identical OPERATOR_EFFECT_APPLY/EXPIRE events.
 */
export function buildWindowsFromLog(
  operatorLog: OperatorStateEvent[],
  trackId: string,
): Map<string, ActivationWindow[]> {
  // Back-fill effect for continuation events (INDEPENDENT expiry logs continuations
  // without the Effect object, causing synthetic effects with no name that break
  // compound-effect deduplication by typeKey).
  const effectByKey = new Map<string, Effect>();
  const applies = (
    operatorLog.filter(
      e => e.type === 'OPERATOR_EFFECT_APPLY' && e.targetTrackId === trackId,
    ) as OperatorEffectApplyEvent[]
  ).map(e => {
    if (e.effect) effectByKey.set(e.id, e.effect);
    return {
      key: e.id,
      time: e.time,
      stacks: e.cumulativeStacks ?? e.stacks,
      maxStacks: e.maxStacks,
      expiresAt: e.expiresAt,
      effect: e.effect ?? effectByKey.get(e.id) ?? syntheticStatusEffect(e.id),
      effectId: e.id,
      isContinuation: e.isContinuation,
    };
  });

  const expires = (
    operatorLog.filter(
      e => e.type === 'OPERATOR_EFFECT_EXPIRE' && e.targetTrackId === trackId,
    ) as OperatorEffectExpireEvent[]
  ).map(e => ({ key: e.id, time: e.time }));

  return buildApplyExpireWindows(applies, expires);
}

// ─── Project operator effects from simLog ───────────────────────────────────

/**
 * Operator effects are rendered exclusively from the sim log (ground truth).
 * Do NOT add a hitFires fallback — the simulation dispatches all operator effects
 * through OPERATOR_EFFECT_APPLY events, so the log is the single source of truth.
 */
export function projectOperatorEffects(
  trackId: string,
  operatorLog: OperatorStateEvent[],
): OperatorEffectProjection {
  // Build windows from OPERATOR_EFFECT_APPLY/EXPIRE pairs
  const logWindowsMap = buildWindowsFromLog(operatorLog, trackId);

  // Exclude hidden effects from rendering
  const visibleLogWindowsMap = new Map(
    [...logWindowsMap].filter(([key]) => {
      const firstApply = operatorLog.find(
        e =>
          e.type === 'OPERATOR_EFFECT_APPLY' &&
          (e as OperatorEffectApplyEvent).targetTrackId === trackId &&
          (e as OperatorEffectApplyEvent).id === key,
      ) as OperatorEffectApplyEvent | undefined;
      return !firstApply?.effect?.hide;
    }),
  );

  const segments = windowsToOperatorSegments([...visibleLogWindowsMap.values()].flat());
  segments.sort((a, b) => a.start - b.start);

  return { segments, byTypeKey: buildByTypeKey(segments) };
}

// ─── Layout (delegates to shared engine) ────────────────────────────────────

export function layoutOperatorEffects(projection: OperatorEffectProjection): OperatorEffectLayout {
  return layoutEffects(projection.byTypeKey, 3);
}
