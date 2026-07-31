/**
 * Shared utilities for projecting effect activation windows.
 * Trigger computation was moved to TriggerRegistry (simulation layer).
 * This file retains window-building utilities for hit effects and rendering.
 */
import type { Effect } from '@/data/types';
import {
  resolveEffectDefaults,
  getEffectIcon,
  resolveEffectLifecycle,
} from '@/data/effectPresets';
import { OperatorEffectGroup, type OperatorEffectSegment } from './projectOperatorEffects';
import { resolveDurationBarColor, type DurationBarColorOptions } from '@/simulation/projection/sourceGroupBarColors';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ActivationWindow {
  effect: Effect;
  effectId: string;
  start: number;
  end: number;
  stacks: number;
  maxStacks?: number;
  isContinuation?: boolean;
  sourceId?: string;
  carryoverKey?: string;
  disabled?: boolean;
}

// ─── Convert to OperatorEffectSegment ────────────────────────────────────────

function getGroupFromEffect(effect: Effect): OperatorEffectGroup {
  if (effect.sourceGroup === 'weapon') return OperatorEffectGroup.WEAPON;
  if (effect.sourceGroup === 'gearSet') return OperatorEffectGroup.SET;
  return OperatorEffectGroup.OPERATOR;
}

export function windowsToOperatorSegments(
  windows: ActivationWindow[],
  options?: DurationBarColorOptions,
): OperatorEffectSegment[] {
  const colorOpts: DurationBarColorOptions = {
    enabled: options?.enabled === true,
    saturation: options?.saturation,
    lightness: options?.lightness,
    sources: options?.sources,
  };
  return windows.map(w => {
    const resolved = resolveEffectDefaults(w.effect);
    return {
      typeKey: w.effect.name || w.effectId,
      group: getGroupFromEffect(w.effect),
      start: w.start,
      end: w.end,
      stacks: w.stacks,
      maxStacks: w.maxStacks ?? resolveEffectLifecycle(w.effect).maxStacks,
      showIcon: !w.isContinuation,
      icon: getEffectIcon(resolved, w.stacks),
      color: resolveDurationBarColor({
        sourceGroup: w.effect.sourceGroup,
        effect: resolved,
        ...colorOpts,
      }),
      effect: w.effect,
      effectId: w.effectId,
      sourceActionId: '',
      isConsumed: false,
      extensionAmount: 0,
    };
  });
}

// ─── Shared apply/expire window builder ────────────────────────────────────

interface ApplyEvent {
  key: string;
  time: number;
  stacks: number;
  maxStacks: number;
  expiresAt: number;
  effect: Effect;
  effectId: string;
  isContinuation?: boolean;
  sourceId?: string;
  carryoverKey?: string;
  disabled?: boolean;
}

interface ExpireEvent {
  key: string;
  time: number;
}

/**
 * Build activation windows from apply/expire event pairs, grouped by key.
 * Each window spans [apply.time, min(nextApply.time, closestExpire)].
 * Used by both operator and enemy stat/state projection for sim-accurate windows.
 */
export function buildApplyExpireWindows(
  applies: ApplyEvent[],
  expires: ExpireEvent[],
): Map<string, ActivationWindow[]> {
  const applyByKey = new Map<string, ApplyEvent[]>();
  for (const e of applies) {
    const list = applyByKey.get(e.key) ?? [];
    list.push(e);
    applyByKey.set(e.key, list);
  }

  const expireByKey = new Map<string, number[]>();
  for (const e of expires) {
    const list = expireByKey.get(e.key) ?? [];
    list.push(e.time);
    expireByKey.set(e.key, list);
  }

  const result = new Map<string, ActivationWindow[]>();
  for (const [key, keyApplies] of applyByKey) {
    keyApplies.sort((a, b) => a.time - b.time);
    const expTimes = (expireByKey.get(key) ?? []).slice().sort((a, b) => a - b);
    const windows: ActivationWindow[] = [];
    // Each expire closes at most one apply so same-timestamp expire→re-apply
    // (e.g. Antal P5) keeps the boosted window instead of a zero-length drop.
    let expIdx = 0;

    for (let i = 0; i < keyApplies.length; i++) {
      const a = keyApplies[i];
      if (!a) continue;
      const nextApplyTime = keyApplies[i + 1]?.time ?? Infinity;

      while (expIdx < expTimes.length && (expTimes[expIdx] as number) < a.time) expIdx++;

      let nextExpire: number;
      if (a.isContinuation && a.stacks > 0) {
        // Remaining-stacks continuations: ignore same-time expires.
        nextExpire = expTimes.slice(expIdx).find(t => t > a.time) ?? a.expiresAt;
      } else if (expIdx < expTimes.length && (expTimes[expIdx] as number) >= a.time) {
        const candidateExpire = expTimes[expIdx] as number;
        nextExpire = candidateExpire;
        // Only consume this expire when it actually closes the window. If a later
        // apply cuts first (stack refresh), keep the expire for that later apply
        // (e.g. Tangtang whirlpools: 2 applies + 1 consume must cut the last segment).
        if (candidateExpire <= nextApplyTime) {
          expIdx++;
        }
      } else {
        nextExpire = a.expiresAt;
      }

      const end = Math.min(nextApplyTime, nextExpire);
      if (end > a.time) {
        windows.push({
          effect: a.effect,
          effectId: a.effectId,
          start: a.time,
          end,
          stacks: a.stacks,
          maxStacks: a.maxStacks,
          isContinuation: a.isContinuation,
          sourceId: a.sourceId,
          carryoverKey: a.carryoverKey,
          disabled: a.disabled,
        });
      }
    }

    result.set(key, windows);
  }

  return result;
}
