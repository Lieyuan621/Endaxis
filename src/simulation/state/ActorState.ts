import type { ActorSnapshot } from "@/simulation/state/types.ts";
import type { BaseGameState } from "./BaseGameState";
import { EffectManager } from "./EffectManager";

export class ActorState implements BaseGameState<ActorSnapshot> {
  public effects: EffectManager;
  private gauge: number;
  private maxGauge: number;
  /** Accumulated runtime CD reduction per actionId (written by TriggerRegistry). */
  private cdReductions = new Map<string, number>();

  constructor(public readonly snapshotData: ActorSnapshot) {
    this.effects = new EffectManager();
    this.gauge = Number(snapshotData.resources?.gauge) || 0;
    this.maxGauge = Math.max(
      0,
      Number(snapshotData.resources?.maxGauge) || 0,
    );
  }

  get id() {
    return this.snapshotData.id;
  }

  advanceTime(_dt: number, _currentTime: number) {}

  getGauge() {
    return this.gauge;
  }

  getMaxGauge() {
    return this.maxGauge;
  }

  modifyGauge(amount: number) {
    if (!Number.isFinite(amount) || amount === 0) {
      return this.gauge;
    }

    const next = this.gauge + amount;
    this.gauge = Math.max(0, Math.min(next, this.maxGauge || next));
    return this.gauge;
  }

  recordCdReduction(actionId: string, amount: number) {
    const prev = this.cdReductions.get(actionId) ?? 0;
    this.cdReductions.set(actionId, prev + amount);
  }

  getCdReduction(actionId: string): number {
    return this.cdReductions.get(actionId) ?? 0;
  }

  snapshot(): ActorSnapshot {
    return {
      ...this.snapshotData,
      resources: {
        ...this.snapshotData.resources,
        gauge: this.gauge,
        maxGauge: this.maxGauge,
      },
    };
  }
}
