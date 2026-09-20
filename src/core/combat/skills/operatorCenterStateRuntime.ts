import type { NativeSkillType } from '../../game-data/operatorDefinition';
import type { CombatReceiptSink } from '../receipt/combatReceipt';
import type { OperatorCenterState } from '../state/abilityState';
import { COMBAT_FRAMES_PER_SECOND, type CombatClock } from '../time/combatClock';
import { recordDodgeReceipt } from './dodgeInputRuntime';

/** 中心状态只消费攻击输入、攻击接续和再次 Dash 的窗口。 */
export interface CenterDashTiming {
  readonly blockAttackFramesInDash: number;
  readonly allowAttackAfterFramesInDash: number;
  readonly blockAttackFramesInPerfectDodge: number;
  readonly allowAttackAfterFramesInPerfectDodge: number;
  readonly blockDashAfterPerfectDodgeFrames: number;
}

/** 应用层一次装配的原生输入规则，各算法只消费自己负责的字段。 */
export interface DashTimingProgram extends CenterDashTiming {
  /** ComboController 的 Dash offset 缓存；不参与中心状态计时。 */
  readonly dashOffsetFrames: number;
  readonly dashInputCooldownFrames: number;
  readonly dashSecondDashIntervalFrames: number;
}

export interface DashInput {
  readonly dashId: string;
  readonly operatorId: string;
  readonly direction: 'forward' | 'backward';
}

/** 原生 _DashToFree 从移动层读取的事实；模拟器未接入移动系统时不得自行伪造这些值。 */
export interface DashToFreeFacts {
  readonly hasMoveCommand: boolean;
  readonly sharedExitCondition: boolean;
  readonly movementModeIsDash: boolean;
  readonly movementBlocksFreeTransition: boolean;
}

export interface DashInterruptionFact {
  readonly skillId: string;
  readonly castId?: string;
  readonly nativeSkillType: NativeSkillType;
  readonly timelineFrame: number | undefined;
  readonly canInterrupt: boolean | undefined;
  readonly canDash: boolean | undefined;
}

export interface OperatorCenterStateRuntimeOptions {
  readonly operatorId: string;
  readonly clock: Pick<CombatClock, 'frame' | 'time'>;
  /** 缺少原生配置证据时留空；运行时仍执行可确定的状态转换。 */
  readonly timing?: CenterDashTiming;
  readonly receipt: CombatReceiptSink;
  readonly interruptCurrentSkillForDash: () => DashInterruptionFact | null;
  readonly addDashBuffs: (
    dashId: string,
  ) => readonly import('../state/foundationState').BuffReference[];
  readonly clearDashBuffs: (
    references: readonly import('../state/foundationState').BuffReference[],
    dashId: string,
  ) => void;
}

function requireFrames(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be non-negative`);
}

/** 原生中心状态中与 Dash 相关的最小状态机；数据保存在 OperatorCenterState 中。 */
export class OperatorCenterStateRuntime {
  readonly #operatorId: string;
  readonly #clock: OperatorCenterStateRuntimeOptions['clock'];
  readonly #timing: CenterDashTiming | undefined;
  readonly #receipt: CombatReceiptSink;
  readonly #interruptCurrentSkillForDash: OperatorCenterStateRuntimeOptions['interruptCurrentSkillForDash'];
  readonly #addDashBuffs: OperatorCenterStateRuntimeOptions['addDashBuffs'];
  readonly #clearDashBuffs: OperatorCenterStateRuntimeOptions['clearDashBuffs'];

  constructor(options: OperatorCenterStateRuntimeOptions) {
    this.#operatorId = options.operatorId;
    this.#clock = options.clock;
    this.#timing = options.timing;
    this.#receipt = options.receipt;
    this.#interruptCurrentSkillForDash = options.interruptCurrentSkillForDash;
    this.#addDashBuffs = options.addDashBuffs;
    this.#clearDashBuffs = options.clearDashBuffs;
    if (this.#timing !== undefined) {
      requireFrames(this.#timing.blockAttackFramesInDash, 'blockAttackFramesInDash');
      requireFrames(this.#timing.allowAttackAfterFramesInDash, 'allowAttackAfterFramesInDash');
      requireFrames(
        this.#timing.blockAttackFramesInPerfectDodge,
        'blockAttackFramesInPerfectDodge',
      );
      requireFrames(
        this.#timing.allowAttackAfterFramesInPerfectDodge,
        'allowAttackAfterFramesInPerfectDodge',
      );
      requireFrames(
        this.#timing.blockDashAfterPerfectDodgeFrames,
        'blockDashAfterPerfectDodgeFrames',
      );
    }
  }

  enterDash(state: OperatorCenterState, input: DashInput): DashInterruptionFact | null {
    if (input.operatorId !== this.#operatorId)
      throw new Error(`dash '${input.dashId}' targets another operator`);
    this.leaveDash(state);
    const interrupted = this.#interruptCurrentSkillForDash();
    state.state = 'dash';
    state.dashId = input.dashId;
    state.direction = input.direction;
    state.dashTimingKnown = this.#timing !== undefined;
    state.attackBlockRemainingFrames = this.#timing?.blockAttackFramesInDash ?? 0;
    state.attackAllowRemainingFrames = this.#timing?.allowAttackAfterFramesInDash ?? 0;
    state.perfectDodgeActive = false;
    state.perfectDodgeConsumed = false;
    state.dashBuffReferences.push(...this.#addDashBuffs(input.dashId));
    recordDodgeReceipt(this.#receipt, this.#clock, this.#operatorId, input.dashId, {
      event: 'DashInputExecuted',
      data: {
        direction: input.direction,
        timingKnown: state.dashTimingKnown,
        ...(interrupted === null
          ? {}
          : {
              interruptedSkillId: interrupted.skillId,
              ...(interrupted.castId === undefined
                ? {}
                : { interruptedCastId: interrupted.castId }),
              interruptedNativeSkillType: interrupted.nativeSkillType,
            }),
      },
    });
    return interrupted;
  }

  enterPerfectDodgeSkill(state: OperatorCenterState, dashId: string): boolean {
    if (
      state.pendingPerfectDodgeId !== dashId &&
      (state.state !== 'dash' || state.dashId !== dashId)
    )
      return false;
    this.leaveDash(state);
    state.pendingPerfectDodgeId = null;
    state.dashId = dashId;
    state.state = 'skill';
    state.perfectDodgeActive = true;
    state.perfectDodgeConsumed = true;
    state.attackBlockRemainingFrames = this.#timing?.blockAttackFramesInPerfectDodge ?? 0;
    state.attackAllowRemainingFrames = this.#timing?.allowAttackAfterFramesInPerfectDodge ?? 0;
    state.perfectDodgeDashBlockRemainingFrames =
      this.#timing?.blockDashAfterPerfectDodgeFrames ?? 0;
    recordDodgeReceipt(this.#receipt, this.#clock, this.#operatorId, dashId, {
      event: 'PerfectDodgeSkillStarted',
      data: {},
    });
    return true;
  }

  /** 只检查用户声明的成功是否仍属于当前这次 Dash；不提前改变状态。 */
  canDeclarePerfectDodgeSuccess(state: OperatorCenterState, dashId: string): boolean {
    return state.state === 'dash' && state.dashId === dashId && !state.perfectDodgeConsumed;
  }

  /** 原生监听器真正发起 Dodge 技能时才完成 Dash→Skill 转换。 */
  enterPerfectDodgeSkillFromNativeCast(state: OperatorCenterState): boolean {
    const dashId = state.pendingPerfectDodgeId ?? state.dashId;
    return dashId !== null && this.enterPerfectDodgeSkill(state, dashId);
  }

  leaveDash(
    state: OperatorCenterState,
    nextState: Exclude<OperatorCenterState['state'], 'dash'> = 'free',
  ): void {
    if (state.state !== 'dash') return;
    if (state.dashId !== null) this.#clearDashBuffs(state.dashBuffReferences, state.dashId);
    state.dashBuffReferences.length = 0;
    state.state = nextState;
    state.dashId = null;
  }

  /** 由能力系统在技能实际开始/结束时调用；不从下一帧轮询推测当前技能。 */
  onSkillChanged(state: OperatorCenterState, type: NativeSkillType | null): void {
    if (type === null) {
      if (state.state === 'dash') return;
      state.state = 'free';
      state.perfectDodgeActive = false;
      state.dashId = null;
      return;
    }
    if (type === 'dodge' && this.enterPerfectDodgeSkillFromNativeCast(state)) return;
    this.leaveDash(state);
    state.state = type === 'attack' ? 'attack' : 'skill';
    state.perfectDodgeActive = false;
    state.dashId = null;
  }

  /** 复现原生分支顺序；攻击窗口和 Dash Buff 寿命都不参与 Dash→Free。 */
  shouldLeaveDashForFree(state: OperatorCenterState, facts: DashToFreeFacts): boolean {
    if (state.state !== 'dash') return false;
    if (facts.hasMoveCommand || facts.sharedExitCondition) return true;
    if (facts.movementModeIsDash) return false;
    return !facts.movementBlocksFreeTransition;
  }

  finishPerfectDodgeSkill(state: OperatorCenterState): void {
    if (!state.perfectDodgeActive) return;
    this.onSkillChanged(state, null);
  }

  /** 原生 CenterBlackboard.Tick 接收角色缩放后的 deltaTime；这里用 30Hz 帧数表示同一增量。 */
  advanceFrame(state: OperatorCenterState, deltaFrames: number): void {
    requireFrames(deltaFrames, 'center deltaFrames');
    state.attackBlockRemainingFrames = Math.max(0, state.attackBlockRemainingFrames - deltaFrames);
    state.attackAllowRemainingFrames = Math.max(0, state.attackAllowRemainingFrames - deltaFrames);
    state.perfectDodgeDashBlockRemainingFrames = Math.max(
      0,
      state.perfectDodgeDashBlockRemainingFrames - deltaFrames,
    );
  }

  /** 供诊断与候选查询读取；输入缓存和实际技能路由仍由能力系统负责。 */
  inspect(state: Readonly<OperatorCenterState>) {
    const attackWindowActive =
      state.state === 'dash' || (state.state === 'skill' && state.perfectDodgeActive);
    return {
      canConsumeAttack:
        !state.dashTimingKnown || !attackWindowActive
          ? null
          : state.attackBlockRemainingFrames === 0,
      canLeaveForAttack:
        !state.dashTimingKnown || !attackWindowActive
          ? null
          : state.attackAllowRemainingFrames === 0,
      perfectDodgeDashAvailable: !state.dashTimingKnown
        ? null
        : state.perfectDodgeDashBlockRemainingFrames === 0,
      secondsPerFrame: 1 / COMBAT_FRAMES_PER_SECOND,
    } as const;
  }
}
