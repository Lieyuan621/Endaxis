import {
  createEnemyLifecycleState,
  type EnemyLifecycleState,
  type EnemyLifePhase,
} from '../state/enemyLifecycleState';

export interface EnemyPresenceChange {
  readonly frame: number;
  readonly present: boolean;
}

/** 时间均为方案帧，不受敌人局部时间缩放影响。 */
export interface EnemyLifecycleProgram {
  readonly spawnFrame: number;
  readonly presenceChanges: readonly EnemyPresenceChange[];
  /** 人为死亡时刻；与生命归零自动死亡同时生效，先发生者结束生命。 */
  readonly deathFrame: number | null;
}

export interface EnemyLifecycleTransition {
  readonly frame: number;
  readonly kind: 'spawn' | 'enter' | 'leave' | 'death';
  readonly previous: EnemyLifePhase;
  readonly current: EnemyLifePhase;
}

/**
 * 管理一个敌人的时间线，不持有生命账本，也不伪造伤害或击杀来源。
 * 死亡输入交给调用方完成生命归零及原生 HP-zero 流程，确认死亡后调用 die。
 */
export class EnemyLifecycle {
  constructor(
    readonly program: EnemyLifecycleProgram,
    readonly automaticDeath: boolean,
    readonly runtimeState: EnemyLifecycleState = createEnemyLifecycleState(),
  ) {}

  get alive(): boolean {
    return this.runtimeState.phase === 'present' || this.runtimeState.phase === 'absent';
  }

  get present(): boolean {
    return this.runtimeState.phase === 'present';
  }

  /** 关闭自动死亡时，仅存活且未到人为死亡时刻的敌人允许木桩生命判断。 */
  get usesDummyHealthChecks(): boolean {
    return !this.automaticDeath && this.alive;
  }

  /**
   * 时间推进在帧输入之前执行。手动死亡通过 requestDeath 进入与自动死亡同一入口；
   * 回调应同步完成原生处理并调用 die，而不是在本类生成一个额外的击杀事件。
   */
  advance(
    frame: number,
    transition: (event: EnemyLifecycleTransition) => void,
    requestDeath: (frame: number) => void,
  ): void {
    if (!Number.isSafeInteger(frame))
      throw new RangeError('enemy lifecycle frame must be an integer');
    const state = this.runtimeState;
    if (state.lastFrame !== null && frame < state.lastFrame)
      throw new RangeError('enemy lifecycle cannot move backwards without restoring state');
    state.lastFrame = frame;
    if (state.phase === 'dead' || frame < this.program.spawnFrame) return;
    if (state.phase === 'unspawned')
      this.#change('spawn', 'present', this.program.spawnFrame, transition);
    while (this.alive && state.nextPresenceChange < this.program.presenceChanges.length) {
      const change = this.program.presenceChanges[state.nextPresenceChange]!;
      if (change.frame > frame) break;
      // 同帧死亡优先于切入/切出；死者不能因同帧切入重新变为存活。
      if (this.#manualDeathDue(change.frame)) {
        requestDeath(this.program.deathFrame!);
        return;
      }
      state.nextPresenceChange++;
      const phase = change.present ? 'present' : 'absent';
      if (state.phase !== phase)
        this.#change(change.present ? 'enter' : 'leave', phase, change.frame, transition);
    }
    if (this.#manualDeathDue(frame)) requestDeath(this.program.deathFrame!);
  }

  /** 原生死亡处理确认后提交状态；重复通知不会重发死亡，离场中的敌人也可死亡。 */
  die(frame: number, transition: (event: EnemyLifecycleTransition) => void): boolean {
    if (!Number.isSafeInteger(frame) || frame < this.program.spawnFrame)
      throw new RangeError('enemy death frame must not precede its spawn');
    if (!this.alive) return false;
    this.runtimeState.deathFrame = frame;
    this.#change('death', 'dead', frame, transition);
    return true;
  }

  #manualDeathDue(frame: number): boolean {
    return this.alive && this.program.deathFrame !== null && this.program.deathFrame <= frame;
  }

  #change(
    kind: EnemyLifecycleTransition['kind'],
    current: EnemyLifePhase,
    frame: number,
    publish: (event: EnemyLifecycleTransition) => void,
  ): void {
    const previous = this.runtimeState.phase;
    this.runtimeState.phase = current;
    publish({ kind, frame, previous, current });
  }
}
