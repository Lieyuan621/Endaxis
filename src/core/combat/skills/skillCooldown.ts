/**
 * 共享冷却账本的现有对象绑定。固定配置和计时数据分离，执行时才读取动态倍率。
 */
import { COMBAT_FRAMES_PER_SECOND } from '../time/combatClock';
import { isPeriodicTimerReady } from '../time/periodicTimerExecution';
import type {
  SkillCooldownState,
  SkillCooldownProgram,
  SkillCooldownSnapshot,
} from '../state/abilityState';
import {
  compileSkillCooldown,
  prepareReadySkillCooldownSet,
  createSkillCooldownState,
  readSkillCooldown,
  reserveSkillCooldown,
  advanceSkillCooldown,
  reduceSkillCooldownByRatio,
  reduceSkillCooldownByFrames,
  setSkillCooldownByRatio,
  setSkillCooldownProgress,
  overrideSkillCooldown,
  setSkillCooldownFrames,
  finishSkillCooldownCast,
} from './skillCooldownExecution';

export class SkillCooldown {
  readonly #program: SkillCooldownProgram;
  readonly #state: SkillCooldownState;
  readonly #resolvePeriodFrames?: (baseFrames: number) => number;
  constructor(
    periodFrames?: number,
    commitFrame?: number,
    resolvePeriodFrames?: (baseFrames: number) => number,
    state?: SkillCooldownState,
  ) {
    this.#program = compileSkillCooldown(periodFrames, commitFrame);
    this.#state = state ?? createSkillCooldownState(this.#program);
    this.#resolvePeriodFrames = periodFrames === undefined ? undefined : resolvePeriodFrames;
  }
  get snapshot(): SkillCooldownSnapshot {
    return readSkillCooldown(this.#state);
  }
  /** 就绪冷却无需推进，也不需要读取动态恢复倍率。 */
  get ready(): boolean {
    return this.#state.timer === undefined || isPeriodicTimerReady(this.#state.timer);
  }

  /** 多个技能宿主必须引用同一份账本数据，不能各自复制。 */
  get runtimeState(): SkillCooldownState {
    return this.#state;
  }
  get comboConditionSnapshot(): {
    readonly oneReady: boolean;
    readonly maxPassedTime: number;
    readonly startCdFrame: number;
  } | null {
    if (this.#state.timer === undefined || this.#program.commitFrame === undefined) return null;
    return {
      oneReady: isPeriodicTimerReady(this.#state.timer),
      maxPassedTime: this.#state.timer.passed / COMBAT_FRAMES_PER_SECOND,
      startCdFrame: this.#program.commitFrame,
    };
  }
  tryReserve(): boolean {
    return reserveSkillCooldown(
      this.#state,
      this.#program,
      baseFrames => this.#resolvePeriodFrames?.(baseFrames) ?? baseFrames,
    );
  }
  advanceFrame(): boolean {
    return this.advance(1);
  }
  advance(deltaFrames = 1): boolean {
    return advanceSkillCooldown(this.#state, deltaFrames);
  }
  reduceByPeriodRatio(ratio: number): boolean {
    return reduceSkillCooldownByRatio(this.#state, ratio);
  }
  reduceByFrames(frames: number): boolean {
    return reduceSkillCooldownByFrames(this.#state, frames);
  }
  setByPeriodRatio(ratio: number): boolean {
    this.#prepareSet();
    return setSkillCooldownByRatio(this.#state, ratio);
  }
  setProgress(progress: number): boolean {
    this.#prepareSet();
    return setSkillCooldownProgress(this.#state, progress);
  }
  overrideByTimeline(ready: boolean): boolean {
    return overrideSkillCooldown(this.#state, this.#program, ready);
  }
  setRemainingFrames(frames: number): boolean {
    this.#prepareSet();
    return setSkillCooldownFrames(this.#state, frames);
  }
  #prepareSet(): void {
    if (this.#state.timer !== undefined && this.ready)
      prepareReadySkillCooldownSet(
        this.#state,
        this.#resolvePeriodFrames?.(this.#program.periodFrames) ?? this.#program.periodFrames,
      );
  }
  finishCast(): boolean {
    return finishSkillCooldownCast(this.#state, this.#program);
  }
}
