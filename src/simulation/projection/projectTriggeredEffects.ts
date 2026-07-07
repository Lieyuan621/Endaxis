/**
 * Shared utilities for projecting effect activation windows.
 * Trigger computation was moved to TriggerRegistry (simulation layer).
 * This file retains window-building utilities for hit effects and rendering.
 */
import type { Effect } from '@/data/types';
import {
  resolveEffectDefaults,
  getEffectIcon,
  getEffectColor,
  resolveEffectLifecycle,
} from '@/data/effectPresets';
import { OperatorEffectGroup, type OperatorEffectSegment } from './projectOperatorEffects';

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

export function windowsToOperatorSegments(windows: ActivationWindow[]): OperatorEffectSegment[] {
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
      color: getEffectColor(resolved),
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

    for (let i = 0; i < keyApplies.length; i++) {
      const a = keyApplies[i];
      if (!a) continue;
      const nextApplyTime = keyApplies[i + 1]?.time ?? Infinity;
      // Continuations with remaining stacks (partial consume) use strict > so same-time
      // expires don't close the window. All others use >= so full consumes close immediately.
      const nextExpire =
        a.isContinuation && a.stacks > 0
          ? (expTimes.find(t => t > a.time) ?? a.expiresAt)
          : (expTimes.find(t => t >= a.time) ?? a.expiresAt);
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
