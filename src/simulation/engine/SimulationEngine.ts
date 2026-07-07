import type { ActorSnapshot, EnemyConfig, TeamConfig } from '../state/types.ts';
import { PriorityQueue } from '@/simulation/engine/PriorityQueue.ts';
import type { EventHandler } from '@/simulation/events/EventHandler.ts';
import { GameState } from '@/simulation/state/GameState.ts';
import type { SimEvent, SimEventType, SimLogEntry } from '@/simulation/events/event.types.ts';
import type { EventHookContext, SimulationContext } from '@/simulation/engine/SimulationContext.ts';
import type { ResolvedTimeline } from '../compiler/types.ts';
import type { EnemyStateEvent, OperatorStateEvent } from '../engine/types.ts';
import type { BaseStatValues } from '@/data/stats/types';
import { createDefaultEnemyResistance } from '@/data/enemyResistance';
import type { ControlSegment } from '@/stores/timeline/controlledOperator';

type SimEventHook = (event: SimEvent, ctx: EventHookContext) => void;

type UltimateEnergyBlockWindow = {
  actorId: string;
  sourceId: string;
  start: number;
  end: number;
};

export class SimulationEngine {
  private queue = new PriorityQueue<SimEvent>();
  private handlers = new Map<SimEventType, EventHandler<SimEvent>>();
  private listeners = new Set<SimEventHook>();
  private state: GameState;
  private simLog = new PriorityQueue<SimLogEntry>();
  private enemyLogEntries: EnemyStateEvent[] = [];
  private operatorLogEntries: OperatorStateEvent[] = [];
  private ultimateEnergyBlockWindowsByActor?: Map<string, UltimateEnergyBlockWindow[]>;

  /** Status keys that need consumedStacks written at apply time (auto-inferred from readConsumedStacks). */
  consumedStacksWriteKeys = new Set<string>();
  /** Base stat values per track for damage calculation. */
  baseStatsByTrack = new Map<string, BaseStatValues>();
  /** Enemy defense value for damage calculation. */
  enemyDef = 100;
  /** Enemy per-element damage multiplier. 100 = neutral. */
  enemyResistance = createDefaultEnemyResistance();
  /** If set, simulation stops processing events beyond this time. */
  endlineTime?: number;
  /** LMDI attribution mode for reaction debuff contributions. */
  lmdiAttributionMode: 'stacks' | 'applier' = 'stacks';
  /** Controlled-operator timeline (time-ascending segments). Empty = nobody controlled. */
  controlledOperatorSegments: ControlSegment[] = [];
  private enemyDamageCapWindows = new Map<number, number>();

  /** Resolve the controlled operator (track id) at `time`: the last segment starting at or before it. */
  private getControlledOperatorAt(time: number): string | null {
    let current = this.controlledOperatorSegments[0]?.operatorId ?? null;
    for (const seg of this.controlledOperatorSegments) {
      if (seg.startTime <= time) current = seg.operatorId;
      else break;
    }
    return current;
  }

  private applyEnemyDamageCap(time: number, rawDamage: number) {
    const damage = Math.max(0, Math.floor(Number(rawDamage) || 0));
    const windowSeconds = Number(this.state.enemy.config.enemyDamageCapWindowSeconds) || 0;
    const ratio = Number(this.state.enemy.config.enemyDamageCapRatio) || 0;
    const enemyHp = Number(this.state.enemy.config.enemyHp) || 0;
    const cap = Math.floor(enemyHp * ratio);

    if (damage <= 0 || windowSeconds <= 0 || ratio <= 0 || cap <= 0) {
      return {
        damage,
        capped: false,
        cap: 0,
        usedBefore: 0,
        windowStart: time,
        windowEnd: time,
      };
    }

    const index = Math.floor((Math.max(0, Number(time) || 0) + 0.0000001) / windowSeconds);
    const usedBefore = Math.max(0, this.enemyDamageCapWindows.get(index) || 0);
    const allowed = Math.max(0, cap - usedBefore);
    const finalDamage = Math.min(damage, allowed);
    this.enemyDamageCapWindows.set(index, usedBefore + finalDamage);

    return {
      damage: finalDamage,
      capped: finalDamage < damage,
      cap,
      usedBefore,
      windowStart: index * windowSeconds,
      windowEnd: (index + 1) * windowSeconds,
    };
  }

  constructor(
    private timeline: ResolvedTimeline,
    teamConfig: TeamConfig,
    enemyConfig: EnemyConfig,
    private actors: ActorSnapshot[],
  ) {
    this.state = new GameState(teamConfig, enemyConfig, this);

    this.actors.forEach(actor => {
      this.state.setActor(actor);
    });
  }

  getState() {
    return this.state;
  }

  registerHandler<E extends SimEvent>(type: E['type'], handler: EventHandler<E>) {
    this.handlers.set(type, handler);
  }

  subscribe(listener: SimEventHook): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  enqueue(event: SimEvent, priority: number = 0) {
    this.queue.enqueue(event, priority);
  }

  getAction(id: string) {
    return this.timeline.actionMap.get(id);
  }

  getSimLog(): SimLogEntry[] {
    return this.simLog.toArray();
  }

  logSimEntry(entry: SimLogEntry) {
    this.simLog.enqueue(entry);
  }

  getEnemyLog(): EnemyStateEvent[] {
    return this.enemyLogEntries;
  }

  logEnemyEvent(event: EnemyStateEvent) {
    this.enemyLogEntries.push(event);
  }

  logOperatorEvent(event: OperatorStateEvent) {
    this.operatorLogEntries.push(event);
  }

  getOperatorLog(): OperatorStateEvent[] {
    return this.operatorLogEntries;
  }

  getShiftedTime(startTime: number, duration: number) {
    return this.timeline.timeContext.getShiftedEndTime(startTime, duration);
  }

  private getUltimateEnergyBlockWindowsByActor() {
    if (this.ultimateEnergyBlockWindowsByActor) {
      return this.ultimateEnergyBlockWindowsByActor;
    }

    const windows = new Map<string, UltimateEnergyBlockWindow[]>();

    const addWindow = (window: UltimateEnergyBlockWindow) => {
      if (!(window.end > window.start)) return;
      const list = windows.get(window.actorId) ?? [];
      list.push(window);
      windows.set(window.actorId, list);
    };

    for (const action of this.timeline.actions) {
      if (action.node.type !== 'ultimate' || action.node.isDisabled) continue;

      const enhancementTime = Math.max(0, Number(action.node.enhancementTime) || 0);
      if (enhancementTime <= 0) continue;

      const start = Number(action.realStartTime) || 0;

      const animationTime = Math.max(
          0,
          Number(action.node.animationTime) || Number(action.freezeDuration) || 0,
      );

      const enhancementStart = this.timeline.timeContext.getShiftedEndTime(
          start,
          animationTime,
          action.id,
      );

      const extraDuration = this.getUltimateEnhancementExtraDuration(
          action,
          enhancementStart,
          enhancementTime,
      );

      const end = this.timeline.timeContext.getShiftedEndTime(
          enhancementStart,
          enhancementTime + extraDuration,
          action.id,
      );

      addWindow({
        actorId: action.trackId,
        sourceId: action.id,
        start: enhancementStart,
        end,
      });
    }

    for (const list of windows.values()) {
      list.sort((a, b) => a.start - b.start);
    }

    this.ultimateEnergyBlockWindowsByActor = windows;
    return windows;
  }

  private getUltimateEnhancementExtraDuration(
      ultimateAction: ResolvedTimeline['actions'][number],
      enhancementStart: number,
      baseDuration: number,
  ) {
    if (ultimateAction.trackId !== 'laevatain') return 0;

    const epsilon = 0.0001;
    const processed = new Set<string>();
    let extraDuration = 0;
    let guard = 0;

    while (guard++ < 200) {
      const currentEnd = this.timeline.timeContext.getShiftedEndTime(
          enhancementStart,
          baseDuration + extraDuration,
          ultimateAction.id,
      );

      let foundAny = false;

      for (const action of this.timeline.actions) {
        if (action.trackId !== ultimateAction.trackId) continue;
        if (action.id === ultimateAction.id) continue;
        if (action.node.isDisabled || (action.node.triggerWindow || 0) < 0) continue;
        if (action.node.type !== 'battleSkill' && action.node.type !== 'comboSkill') continue;
        if (processed.has(action.id)) continue;

        const t = Number(action.realStartTime) || 0;
        if (t + epsilon < enhancementStart) continue;
        if (t >= currentEnd - epsilon) continue;

        let delta = Number(action.node.duration) || 0;

        processed.add(action.id);

        if (delta <= 0) continue;

        extraDuration += delta;
        foundAny = true;
      }

      if (!foundAny) break;
    }

    return extraDuration;
  }

  isUltimateEnergyBlocked(actorId: string, time: number) {
    const t = Number(time) || 0;
    const epsilon = 0.0001;
    const windows = this.getUltimateEnergyBlockWindowsByActor().get(actorId) ?? [];

    return windows.some((window) =>
        t > window.start + epsilon &&
        t < window.end - epsilon
    );
  }

  run() {
    const actionEndTimes = new Map<string, number>();
    for (const action of this.timeline.actions) {
      const totalExtension = action.resolvedHits.reduce(
        (sum, h) => sum + (h.durationExtension ?? 0),
        0,
      );
      actionEndTimes.set(action.id, action.realStartTime + action.realDuration + totalExtension);
    }

    const ctx: SimulationContext = {
      state: this.state,
      queue: {
        enqueue: (event: SimEvent, priority = 0) => this.enqueue(event, priority),
        cancel: predicate => this.queue.cancel(predicate),
        collect: predicate => this.queue.collect(predicate),
      },
      actionEndTimes,
      simLog: (entry: SimLogEntry) => {
        this.simLog.enqueue(entry);
      },
      getAction: this.getAction.bind(this),
      enemyLog: (event: EnemyStateEvent) => {
        this.enemyLogEntries.push(event);
      },
      operatorLog: (event: OperatorStateEvent) => {
        this.operatorLogEntries.push(event);
      },
      getOperatorEffects: (trackId: string) => this.state.getOperatorEffects(trackId),
      getActorMeta: (trackId: string) => {
        const actor = this.actors.find(a => a.id === trackId);
        return {
          acceptTeamUltEnergy: actor?.acceptTeamUltEnergy ?? true,
          acceptSelfSpCostUltEnergy: actor?.acceptSelfSpCostUltEnergy ?? true,
          ultimateEnergyCostOverride: actor?.ultimateEnergyCostOverride,
        };
      },
      allTrackIds: this.actors.map(a => a.id),
      elementByTrackId: new Map(this.actors.map(a => [a.id, a.element])),
      consumedStacksWriteKeys: this.consumedStacksWriteKeys,
      getShiftedTime: this.getShiftedTime.bind(this),
      isUltimateEnergyBlocked: this.isUltimateEnergyBlocked.bind(this),
      getAllActions: () => this.timeline.actions,
      getBaseStats: (trackId: string) => this.baseStatsByTrack.get(trackId),
      enemyDef: this.enemyDef,
      enemyResistance: this.enemyResistance,
      applyEnemyDamageCap: this.applyEnemyDamageCap.bind(this),
      lmdiAttributionMode: this.lmdiAttributionMode,
      getControlledOperatorAt: (time: number) => this.getControlledOperatorAt(time),
    };

    while (!this.queue.isEmpty()) {
      const event = this.queue.dequeue()!;

      if (this.endlineTime !== undefined && event.time > this.endlineTime) break;

      if (event.time > this.state.getCurrentTime()) {
        const dt = event.time - this.state.getCurrentTime();
        this.state.advanceTime(dt);
      }

      const handler = this.handlers.get(event.type);
      if (handler) {
        handler.handle(event, ctx);
      } else {
        throw new Error(`No handler for event type: ${event.type}`);
      }
    }
    if (
        this.endlineTime !== undefined &&
        this.endlineTime > this.state.getCurrentTime()
    ) {
      this.state.advanceTime(this.endlineTime - this.state.getCurrentTime());
    }

    return { state: this.state, actionEndTimes };
  }
}
