import type { OperatorStatusEntry } from '../engine/types';
import type { OperatorStat, SkillType } from '@/data/types';
import type { ConsumedStatEffect } from '@/simulation/compiler/types';
import { passesSkillFilter } from '@/data/filter';
import { pushSourceQueue } from './sourceQueue';

interface OneTimeEntry {
  id: string;
  stat: OperatorStat;
  value: number;
  stacks: number;
  maxStacks: number;
  skillTypes?: SkillType | SkillType[];
  skillId?: string | string[];
  expiresAt: number;
  sourceId: string;
  effect?: OperatorStatusEntry['effect'];
}

interface IndependentSlot {
  expiresAt: number;
  count: number;
}

interface IndependentEffectData {
  slots: IndependentSlot[];
  maxStacks: number;
  stat?: OperatorStatusEntry['stat'];
  value: number;
  sourceId: string;
  effect?: OperatorStatusEntry['effect'];
}

export class OperatorEffectState {
  readonly trackId: string;

  private effects = new Map<string, OperatorStatusEntry>();
  private independentEffects = new Map<string, IndependentEffectData>();
  private oneTimeEffects = new Map<string, OneTimeEntry>();

  constructor(trackId: string) {
    this.trackId = trackId;
  }

  apply(entry: OperatorStatusEntry): void {
    if (entry.stackStrategy === 'INDEPENDENT') {
      const existing = this.independentEffects.get(entry.id);
      const slots: IndependentSlot[] = existing?.slots ?? [];
      if (entry.stacks > 0) {
        slots.push({ expiresAt: entry.expiresAt, count: entry.stacks });
      }
      // Cap total at maxStacks, trimming oldest slots first
      let total = slots.reduce((sum, s) => sum + s.count, 0);
      while (total > entry.maxStacks && slots.length > 0) {
        const oldest = slots[0];
        if (!oldest) break;
        const excess = total - entry.maxStacks;
        if (oldest.count <= excess) {
          total -= oldest.count;
          slots.shift();
        } else {
          oldest.count -= excess;
          total = entry.maxStacks;
        }
      }
      this.independentEffects.set(entry.id, {
        slots,
        maxStacks: Math.max(existing?.maxStacks ?? 0, entry.maxStacks),
        stat: entry.stat,
        value: entry.value,
        sourceId: entry.sourceId,
        effect: entry.effect ?? existing?.effect,
      });
      return;
    }
    if (entry.stackStrategy === 'REPLACE') {
      this.effects.set(entry.id, { ...entry });
      return;
    }
    const existing = this.effects.get(entry.id);
    // Pooled resources (link) keep a per-source FIFO queue so consumption can attribute
    // stacks back to each applier. The queue total is the authoritative stack count, and
    // the new entry's expiresAt refreshes the shared duration on every grant.
    if (entry.stat?.modifier === 'link') {
      const queue = existing?.sourceQueue ? existing.sourceQueue.map(s => ({ ...s })) : [];
      pushSourceQueue(queue, entry.sourceId, entry.stacks, entry.maxStacks);
      const total = queue.reduce((s, slot) => s + slot.count, 0);
      this.effects.set(entry.id, { ...entry, stacks: total, sourceQueue: queue });
      return;
    }
    const newStacks = Math.min((existing?.stacks ?? 0) + entry.stacks, entry.maxStacks);
    this.effects.set(entry.id, { ...entry, stacks: newStacks });
  }

  /** Removes a regular effect entry. Returns the stacks it held, or 0 if absent. */
  expire(id: string): number {
    const entry = this.effects.get(id);
    if (!entry) return 0;
    const stacks = entry.stacks;
    this.effects.delete(id);
    return stacks;
  }

  /**
   * Expires independent slots at or before `time`. Returns remaining stacks and next expiry
   * for the continuation log, or null if nothing expired or no slots remain.
   */
  expireIndependentSlot(
    id: string,
    time: number,
  ): { remaining: number; maxStacks: number; nextExpiresAt: number; sourceId: string } | null {
    const data = this.independentEffects.get(id);
    if (!data) return null;
    const before = data.slots.reduce((sum, s) => sum + s.count, 0);
    data.slots = data.slots.filter(s => s.expiresAt > time);
    const remaining = data.slots.reduce((sum, s) => sum + s.count, 0);
    if (before === remaining) return null; // nothing expired
    if (remaining === 0) {
      this.independentEffects.delete(id);
    }
    return {
      remaining,
      maxStacks: data.maxStacks,
      nextExpiresAt: data.slots[0]?.expiresAt ?? time,
      sourceId: data.sourceId,
    };
  }

  isIndependent(id: string): boolean {
    return this.independentEffects.has(id);
  }

  /** Decrements stacks by n. Removes the entry if stacks reach 0. Returns entry metadata (with remaining stacks). */
  consumeStacks(
    id: string,
    n: number,
    time: number,
  ): { remaining: number; maxStacks: number; expiresAt: number; sourceId: string } | null {
    // Independent: consume from oldest slots first
    const indep = this.independentEffects.get(id);
    if (indep) {
      indep.slots = indep.slots.filter(s => s.expiresAt > time);
      let toConsume = n;
      while (toConsume > 0 && indep.slots.length > 0) {
        const oldest = indep.slots[0];
        if (!oldest) break;
        if (oldest.count <= toConsume) {
          toConsume -= oldest.count;
          indep.slots.shift();
        } else {
          oldest.count -= toConsume;
          toConsume = 0;
        }
      }
      const remaining = indep.slots.reduce((sum, s) => sum + s.count, 0);
      if (remaining === 0) this.independentEffects.delete(id);
      return {
        remaining,
        maxStacks: indep.maxStacks,
        expiresAt: indep.slots[0]?.expiresAt ?? time,
        sourceId: indep.sourceId,
      };
    }
    const entry = this.effects.get(id);
    if (!entry || time >= entry.expiresAt) return null;
    const remaining = entry.stacks - n;
    if (remaining <= 0) {
      this.effects.delete(id);
      return {
        remaining: 0,
        maxStacks: entry.maxStacks,
        expiresAt: entry.expiresAt,
        sourceId: entry.sourceId,
      };
    }
    entry.stacks = remaining;
    return {
      remaining,
      maxStacks: entry.maxStacks,
      expiresAt: entry.expiresAt,
      sourceId: entry.sourceId,
    };
  }

  /** Returns current cumulative stacks for an effect (0 if absent or expired). */
  getStacks(id: string, currentTime: number): number {
    const indep = this.independentEffects.get(id);
    if (indep) {
      return indep.slots
        .filter(s => s.expiresAt > currentTime)
        .reduce((sum, s) => sum + s.count, 0);
    }
    const e = this.effects.get(id);
    if (!e || currentTime >= e.expiresAt) return 0;
    return e.stacks;
  }

  /** Snapshot all current stack counts (no time/expiry filter). Used for pre-consume snapshots
   *  so triggered effects can read stacks before the entry is deleted. */
  snapshotStacks(): Map<string, number> {
    const map = new Map<string, number>();
    for (const [id, entry] of this.effects) {
      map.set(id, entry.stacks);
    }
    for (const [id, data] of this.independentEffects) {
      map.set(
        id,
        data.slots.reduce((sum, s) => sum + s.count, 0),
      );
    }
    return map;
  }

  /** Returns the stat descriptor for a tracked effect, regardless of whether it is currently active. */
  getStat(id: string): OperatorStatusEntry['stat'] | undefined {
    return this.effects.get(id)?.stat ?? this.independentEffects.get(id)?.stat;
  }

  /** Returns the consumedStacks snapshotted onto the entry, or undefined if absent/expired. */
  getConsumedStacks(id: string, currentTime: number): Record<string, number> | undefined {
    const e = this.effects.get(id);
    if (!e || currentTime >= e.expiresAt) return undefined;
    return e.consumedStacks;
  }

  applyOneTime(entry: OneTimeEntry): number {
    const existing = this.oneTimeEffects.get(entry.id);
    const newStacks = Math.min((existing?.stacks ?? 0) + entry.stacks, entry.maxStacks);

    this.oneTimeEffects.set(entry.id, {
      ...entry,
      stacks: newStacks,
      expiresAt: Math.max(Number(existing?.expiresAt) || 0, Number(entry.expiresAt) || Infinity),
      sourceId: entry.sourceId || existing?.sourceId || this.trackId,
      effect: entry.effect ?? existing?.effect,
    });

    return newStacks;
  }

  /** Consume all one-time effects matching the action. `type` scope matches `entry.skillTypes`;
   *  `skillId` scope matches `entry.skillId`. Returns consumed stat contributions with their ids. */
  consumeOneTime(
    type: string | undefined,
    skillId: string | undefined,
    time = 0,
  ): (ConsumedStatEffect & { id: string })[] {
    const consumed: (ConsumedStatEffect & { id: string })[] = [];
    for (const [key, entry] of this.oneTimeEffects) {
      if (Number.isFinite(entry.expiresAt) && time >= entry.expiresAt) {
        this.oneTimeEffects.delete(key);
        continue;
      }
      if (entry.skillTypes && (!type || !passesSkillFilter(entry.skillTypes, type))) continue;
      if (entry.skillId && (!skillId || !passesSkillFilter(entry.skillId, skillId))) continue;
      const effectName =
        entry.effect && typeof (entry.effect as { name?: unknown }).name === 'string'
          ? String((entry.effect as { name: string }).name).trim()
          : '';
      consumed.push({
        id: key,
        sourceLabel: effectName || key,
        stat: entry.stat,
        value: entry.value * entry.stacks,
      });
      this.oneTimeEffects.delete(key);
    }
    return consumed;
  }

  /** Returns all entries that are still active at currentTime. */
  getActiveEntries(currentTime: number): OperatorStatusEntry[] {
    const regular = [...this.effects.values()].filter(e => currentTime < e.expiresAt);
    const independent: OperatorStatusEntry[] = [];
    for (const [id, data] of this.independentEffects) {
      const stacks = data.slots
        .filter(s => s.expiresAt > currentTime)
        .reduce((sum, s) => sum + s.count, 0);
      if (stacks === 0) continue;
      independent.push({
        id,
        stat: data.stat,
        value: data.value,
        stacks,
        maxStacks: data.maxStacks,
        expiresAt: data.slots.find(s => s.expiresAt > currentTime)?.expiresAt ?? currentTime,
        sourceId: data.sourceId,
        stackStrategy: 'INDEPENDENT',
        effect: data.effect,
      });
    }
    return [...regular, ...independent];
  }

  exportCarryoverEntries(currentTime: number): OperatorStatusEntry[] {
    const regular = [...this.effects.values()]
      .filter(entry => currentTime < entry.expiresAt)
      .map(entry => ({ ...entry }));

    const independent: OperatorStatusEntry[] = [];

    for (const [id, data] of this.independentEffects) {
      for (const slot of data.slots) {
        if (slot.expiresAt <= currentTime || slot.count <= 0) continue;

        independent.push({
          id,
          stat: data.stat,
          value: data.value,
          stacks: slot.count,
          maxStacks: data.maxStacks,
          expiresAt: slot.expiresAt,
          sourceId: data.sourceId,
          stackStrategy: 'INDEPENDENT',
          effect: data.effect,
        });
      }
    }

    return [...regular, ...independent];
  }

  exportCarryoverOneTimeEntries(currentTime: number) {
    const out: Array<OneTimeEntry & { kind: 'oneTime' }> = [];

    for (const entry of this.oneTimeEffects.values()) {
      if (Number.isFinite(entry.expiresAt) && currentTime >= entry.expiresAt) continue;

      out.push({
        ...entry,
        kind: 'oneTime',
      });
    }

    return out;
  }
}
