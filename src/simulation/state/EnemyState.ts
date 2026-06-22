import type { BaseGameState } from '@/simulation/state/BaseGameState.ts';
import type { EnemySnapshot, EnemyConfig } from '@/simulation/state/types.ts';
import type {
  InflictionState,
  VulnerabilityState,
  SolidificationState,
  CombustionState,
  ElectrificationState,
  CorrosionState,
  BreachState,
  EnemyStatusSnapshot,
  EnemyStatusEntry,
} from '@/simulation/engine/types';
import type { SimulationEngine } from '../engine/SimulationEngine';

/**
 * Preserve enemy effects across a scenario boundary while starting a newly
 * selected enemy with a fresh stagger cycle.
 */
export function resetEnemyStaggerCarryover(snapshot: any, config: EnemyConfig) {
  if (!snapshot) return snapshot;

  return {
    ...snapshot,
    stagger: {
      ...(snapshot.stagger || {}),
      value: 0,
      maxStagger: config.maxStagger,
      breakRemaining: 0,
      lockRemaining: 0,
      staggerContributions: {},
      lastBreakContributions: {},
    },
  };
}

export class EnemyState implements BaseGameState<EnemySnapshot> {
  private stagger: number = 0;

  private breakEndTime: number = 0;
  private lockEndTime: number = -1;

  nodeStep: number = 0;
  private currentTime: number = 0;

  /** Per-operator stagger contributions for the current stagger cycle. */
  private staggerContributions: Record<string, number> = {};
  /** Frozen contributions from the most recent break (persists through stagger window). */
  private lastBreakContributions: Record<string, number> = {};

  // ─── Absorbed from EnemySimState ─────────────────────────────────────────
  infliction: InflictionState | null = null;
  vulnerability: VulnerabilityState | null = null;
  solidification: SolidificationState | null = null;
  combustion: CombustionState | null = null;
  electrification: ElectrificationState | null = null;
  corrosion: CorrosionState | null = null;
  breach: BreachState | null = null;
  /** Unified map of all enemy StatusEffect entries (both stat-bearing and pure state). */
  enemyStatusEffects = new Map<string, EnemyStatusEntry>();

  constructor(
    readonly config: EnemyConfig,
    private engine: SimulationEngine,
  ) {
    this.nodeStep = this.config.maxStagger / (this.config.staggerNodeCount + 1);
  }

  isLocked(currentTime: number): boolean {
    return currentTime < this.lockEndTime - 0.0001;
  }

  isBroken(currentTime: number): boolean {
    return currentTime < this.breakEndTime - 0.0001;
  }

  addStagger(
    amount: number,
    currentTime: number,
  ): {
    broken: boolean;
    breakEnd?: number;
    nodeReachedIndex?: number;
    nodeEndTime?: number;
  } {
    if (this.isBroken(currentTime)) {
      return { broken: true };
    }

    const oldStagger = this.stagger;
    this.stagger = Math.max(0, this.stagger + amount);

    if (this.isLocked(currentTime)) {
      return { broken: false };
    }

    const hasNodes = this.config.staggerNodeCount > 0;

    if (this.stagger >= this.config.maxStagger - 0.0001) {
      this.stagger = 0;
      this.lastBreakContributions = { ...this.staggerContributions };
      this.staggerContributions = {};
      const breakDuration = this.config.staggerBreakDuration;
      const breakEnd = this.engine.getShiftedTime(currentTime, breakDuration);
      this.breakEndTime = breakEnd;
      this.lock(breakEnd);
      return { broken: true, breakEnd };
    }

    if (hasNodes) {
      const prevNodeIdx = Math.floor(oldStagger / this.nodeStep + 0.0001);
      const currNodeIdx = Math.floor(this.stagger / this.nodeStep + 0.0001);

      if (currNodeIdx > prevNodeIdx) {
        const nodeDuration = this.config.staggerNodeDuration;
        const nodeEnd = this.engine.getShiftedTime(currentTime, nodeDuration);
        this.lock(nodeEnd);
        return {
          broken: false,
          nodeReachedIndex: currNodeIdx,
          nodeEndTime: nodeEnd,
        };
      }
    }

    return { broken: false };
  }

  getStagger() {
    return this.stagger;
  }

  /** Record a stagger contribution from a source. Caps total at maxStagger (excess discarded). */
  addStaggerContribution(sourceId: string, amount: number): void {
    const currentTotal = Object.values(this.staggerContributions).reduce((s, v) => s + v, 0);
    const cappedAmount = Math.min(amount, this.config.maxStagger - currentTotal);
    if (cappedAmount > 0) {
      this.staggerContributions[sourceId] =
        (this.staggerContributions[sourceId] ?? 0) + cappedAmount;
    }
  }

  /** Get stagger contribution fractions from the most recent break. Returns { sourceId: fraction }. */
  getStaggerContributionFractions(): Record<string, number> {
    const total = Object.values(this.lastBreakContributions).reduce((s, v) => s + v, 0);
    if (total <= 0) return {};
    const result: Record<string, number> = {};
    for (const [id, val] of Object.entries(this.lastBreakContributions)) {
      result[id] = val / total;
    }
    return result;
  }

  advanceTime(_dt: number, currentTime: number) {
    this.currentTime = currentTime;
  }

  snapshot(): EnemySnapshot {
    return {
      stagger: this.stagger,
      isBroken: this.isBroken(this.currentTime),
      isLocked: this.isLocked(this.currentTime),
      breakEndTime: this.breakEndTime,
      lockEndTime: this.lockEndTime,
    };
  }

  applyStatus(entry: EnemyStatusEntry): void {
    const existing = this.enemyStatusEffects.get(entry.id);
    const newStacks = Math.min((existing?.stacks ?? 0) + entry.stacks, entry.maxStacks);
    this.enemyStatusEffects.set(entry.id, { ...entry, stacks: newStacks });
  }

  expireStatus(id: string): void {
    this.enemyStatusEffects.delete(id);
  }

  hasStatus(id: string): boolean {
    return this.enemyStatusEffects.has(id);
  }

  getStatusStacks(id: string, currentTime: number): number {
    const e = this.enemyStatusEffects.get(id);
    if (!e || currentTime >= e.expiresAt) return 0;
    return e.stacks;
  }

  /**
   * True if a non-expired `inflictionBarrier` status (Effect Barrier criterion) covers `element`.
   * Used by EnemyEffectHandler to drop new infliction/vulnerability applications of that type.
   * An entry with no `elements` is treated as covering all types.
   */
  hasInflictionBarrier(element: string, currentTime: number): boolean {
    for (const e of this.enemyStatusEffects.values()) {
      if (currentTime >= e.expiresAt) continue;
      const stat = e.stat;
      if (!stat || stat.modifier !== 'inflictionBarrier') continue;
      const els = (stat as { elements?: string | string[] }).elements;
      if (els == null) return true;
      if (Array.isArray(els) ? els.includes(element) : els === element) return true;
    }
    return false;
  }

  /** Returns the consumedStacks snapshotted onto the entry, or undefined if absent.
   *  Handles @instanceKey suffix from scheduleDotTicks (falls back to base-id scan). */
  getStatusConsumedStacks(id: string, _currentTime: number): Record<string, number> | undefined {
    const exact = this.enemyStatusEffects.get(id);
    if (exact) return exact.consumedStacks;
    for (const [key, entry] of this.enemyStatusEffects) {
      if (!key) continue;
      if (key.split('@')[0] === id) return entry.consumedStacks;
    }
    return undefined;
  }

  /** Decrements stacks by n. Removes the entry if stacks reach 0. Returns entry metadata (with remaining stacks). */
  consumeStatusStacks(
    id: string,
    n: number,
    time: number,
  ): {
    remaining: number;
    maxStacks: number;
    expiresAt: number;
    sourceId: string;
    icon?: string;
  } | null {
    const entry = this.enemyStatusEffects.get(id);
    if (!entry || time >= entry.expiresAt) return null;
    const remaining = entry.stacks - n;
    if (remaining <= 0) {
      // Mark depleted but keep in map — caller is responsible for deletion
      // (deferred so onStatusConsumed triggers can still read the entry)
      entry.stacks = 0;
      return {
        remaining: 0,
        maxStacks: entry.maxStacks,
        expiresAt: entry.expiresAt,
        sourceId: entry.sourceId,
        icon: entry.icon,
      };
    }
    entry.stacks = remaining;
    return {
      remaining,
      maxStacks: entry.maxStacks,
      expiresAt: entry.expiresAt,
      sourceId: entry.sourceId,
      icon: entry.icon,
    };
  }

  private cloneSourceQueue(queue: any[] | undefined) {
    return Array.isArray(queue)
        ? queue.map(slot => ({
          sourceId: slot.sourceId,
          count: Number(slot.count) || 0,
        }))
        : [];
  }

  private cloneStatusEntry(entry: EnemyStatusEntry): EnemyStatusEntry {
    return {
      ...entry,
      stat: entry.stat ? { ...(entry.stat as any) } : undefined,
      effect: entry.effect ? ({ ...(entry.effect as any) } as any) : undefined,
      consumedStacks: entry.consumedStacks ? { ...entry.consumedStacks } : undefined,
      sourceBreakdown: entry.sourceBreakdown ? { ...entry.sourceBreakdown } : undefined,
    };
  }

  private getRemaining(expiresAt: number, time: number) {
    return Math.max(0, Number(expiresAt) - Number(time));
  }

  private getNextOneSecondTickDelay(startedAt: number, time: number) {
    const elapsed = Math.max(0, Number(time) - Number(startedAt));
    const nextTickIndex = Math.floor(elapsed + 0.0001) + 1;
    return Math.max(0, nextTickIndex - elapsed);
  }

  exportCarryoverSnapshot(time = this.currentTime) {
    const activeStatuses = [...this.enemyStatusEffects.values()]
        .filter(entry => time < entry.expiresAt)
        .map(entry => ({
          ...this.cloneStatusEntry(entry),
          remainingDuration: this.getRemaining(entry.expiresAt, time),
        }));

    const infliction =
        this.infliction && time < this.infliction.expiresAt
            ? {
              ...this.infliction,
              sourceQueue: this.cloneSourceQueue(this.infliction.sourceQueue),
              remainingDuration: this.getRemaining(this.infliction.expiresAt, time),
            }
            : null;

    const vulnerability =
        this.vulnerability && time < this.vulnerability.expiresAt
            ? {
              ...this.vulnerability,
              sourceQueue: this.cloneSourceQueue(this.vulnerability.sourceQueue),
              remainingDuration: this.getRemaining(this.vulnerability.expiresAt, time),
            }
            : null;

    const solidification =
        this.solidification && time < this.solidification.expiresAt
            ? {
              ...this.solidification,
              remainingDuration: this.getRemaining(this.solidification.expiresAt, time),
            }
            : null;

    const combustion =
        this.combustion && time < this.combustion.expiresAt
            ? {
              ...this.combustion,
              remainingDuration: this.getRemaining(this.combustion.expiresAt, time),
              nextTickDelay: this.getNextOneSecondTickDelay(this.combustion.startedAt, time),
            }
            : null;

    const electrification =
        this.electrification && time < this.electrification.expiresAt
            ? {
              ...this.electrification,
              remainingDuration: this.getRemaining(this.electrification.expiresAt, time),
            }
            : null;

    const corrosion =
        this.corrosion && time < this.corrosion.expiresAt
            ? {
              ...this.corrosion,
              remainingDuration: this.getRemaining(this.corrosion.expiresAt, time),
              nextTickDelay: this.getNextOneSecondTickDelay(this.corrosion.startedAt, time),
            }
            : null;

    const breach =
        this.breach && time < this.breach.expiresAt
            ? {
              ...this.breach,
              remainingDuration: this.getRemaining(this.breach.expiresAt, time),
            }
            : null;

    return {
      time,
      stagger: {
        value: this.stagger,
        maxStagger: this.config.maxStagger,
        breakRemaining: this.isBroken(time) ? Math.max(0, this.breakEndTime - time) : 0,
        lockRemaining: this.isLocked(time) ? Math.max(0, this.lockEndTime - time) : 0,
        staggerContributions: { ...this.staggerContributions },
        lastBreakContributions: { ...this.lastBreakContributions },
      },
      infliction,
      vulnerability,
      debuffs: {
        solidification,
        combustion,
        electrification,
        corrosion,
        breach,
      },
      statuses: activeStatuses,
    };
  }

  importCarryoverSnapshot(snapshot: any, applyTime: number) {
    if (!snapshot) return;

    const toExpiresAt = (entry: any) => {
      const remaining = Number(entry?.remainingDuration);
      if (Number.isFinite(remaining)) {
        return applyTime + Math.max(0, remaining);
      }

      const expiresAt = Number(entry?.expiresAt);
      if (Number.isFinite(expiresAt)) {
        return expiresAt;
      }

      return applyTime;
    };

    const stagger = snapshot.stagger || {};
    this.stagger = Math.max(
        0,
        Math.min(Number(stagger.value) || 0, this.config.maxStagger),
    );

    this.breakEndTime = applyTime + Math.max(0, Number(stagger.breakRemaining) || 0);
    this.lockEndTime = applyTime + Math.max(0, Number(stagger.lockRemaining) || 0);
    this.staggerContributions = { ...(stagger.staggerContributions || {}) };
    this.lastBreakContributions = { ...(stagger.lastBreakContributions || {}) };

    const infliction = snapshot.infliction;
    this.infliction = infliction
        ? {
          element: infliction.element,
          stacks: Math.max(1, Math.min(4, Number(infliction.stacks) || 1)),
          appliedAt: applyTime,
          expiresAt: toExpiresAt(infliction),
          sourceQueue: this.cloneSourceQueue(infliction.sourceQueue),
        }
        : null;

    const vulnerability = snapshot.vulnerability;
    this.vulnerability = vulnerability
        ? {
          stacks: Math.max(1, Math.min(4, Number(vulnerability.stacks) || 1)),
          appliedAt: applyTime,
          expiresAt: toExpiresAt(vulnerability),
          sourceQueue: this.cloneSourceQueue(vulnerability.sourceQueue),
        }
        : null;

    const debuffs = snapshot.debuffs || {};

    const solidification = debuffs.solidification;
    this.solidification = solidification
        ? {
          level: Math.max(1, Math.min(4, Number(solidification.level) || 1)),
          expiresAt: toExpiresAt(solidification),
          consumedStackSources: solidification.consumedStackSources
              ? { ...solidification.consumedStackSources }
              : undefined,
          sourceId: solidification.sourceId,
        }
        : null;

    const combustion = debuffs.combustion;
    this.combustion = combustion
        ? {
          level: Math.max(1, Math.min(4, Number(combustion.level) || 1)),
          startedAt: applyTime,
          expiresAt: toExpiresAt(combustion),
          sourceId: combustion.sourceId,
          effectiveness: combustion.effectiveness,
          consumedStackSources: combustion.consumedStackSources
              ? { ...combustion.consumedStackSources }
              : undefined,
          actionId: combustion.actionId,
        }
        : null;

    const electrification = debuffs.electrification;
    this.electrification = electrification
        ? {
          level: Math.max(1, Math.min(4, Number(electrification.level) || 1)),
          expiresAt: toExpiresAt(electrification),
          operatorSlot: Number(electrification.operatorSlot) || 0,
          sourceId: electrification.sourceId,
        }
        : null;

    const corrosion = debuffs.corrosion;
    this.corrosion = corrosion
        ? {
          level: Math.max(1, Math.min(4, Number(corrosion.level) || 1)),
          startedAt: applyTime,
          expiresAt: toExpiresAt(corrosion),
          operatorSlot: Number(corrosion.operatorSlot) || 0,
          currentResShred: Number(corrosion.currentResShred) || 0,
          perSecond: Number(corrosion.perSecond) || 0,
          maxShred: Number(corrosion.maxShred) || 0,
          sourceId: corrosion.sourceId || '',
        }
        : null;

    const breach = debuffs.breach;
    this.breach = breach
        ? {
          level: Math.max(1, Math.min(4, Number(breach.level) || 1)),
          expiresAt: toExpiresAt(breach),
          operatorSlot: Number(breach.operatorSlot) || 0,
          sourceId: breach.sourceId,
        }
        : null;

    this.enemyStatusEffects.clear();

    for (const raw of snapshot.statuses || []) {
      const expiresAt = toExpiresAt(raw);
      if (!(expiresAt > applyTime)) continue;

      const entry = this.cloneStatusEntry({
        ...raw,
        expiresAt,
      });

      this.enemyStatusEffects.set(entry.id, entry);
    }
  }

  /** Snapshot of all enemy status fields for hit-condition evaluation. */
  statusSnapshot(): EnemyStatusSnapshot {
    return {
      infliction: this.infliction,
      vulnerability: this.vulnerability,
      solidification: this.solidification,
      combustion: this.combustion,
      electrification: this.electrification,
      corrosion: this.corrosion,
      breach: this.breach,
      enemyStatusEffects: new Map(this.enemyStatusEffects),
    };
  }

  private lock(untilTime: number) {
    this.lockEndTime = untilTime;
  }
}
