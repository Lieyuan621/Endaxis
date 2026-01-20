import type { BaseGameState } from "@/simulation/state/BaseGameState.ts";
import type { EnemySnapshot, EnemyConfig } from "@/simulation/state/types.ts";
import type { SimulationEngine } from "../engine/SimulationEngine";
import { EffectManager } from "./EffectManager";

export class EnemyState implements BaseGameState<EnemySnapshot> {
  private stagger: number = 0;

  private breakEndTime: number = 0;
  private lockEndTime: number = -1;

  nodeStep: number = 0;
  private currentTime: number = 0;

  // effectId -> type
  public effects: EffectManager;

  constructor(
    readonly config: EnemyConfig,
    private engine: SimulationEngine,
  ) {
    this.nodeStep = this.config.maxStagger / (this.config.staggerNodeCount + 1);
    this.effects = new EffectManager();
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

  private lock(untilTime: number) {
    this.lockEndTime = untilTime;
  }
}
