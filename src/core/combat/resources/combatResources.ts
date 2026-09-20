import {
  type NormalSkillUltimateEnergySettings,
  type OperatorResourceSnapshot,
} from '../state/environmentState';
/**
 * 一次战斗中技力与队伍终结技能量的唯一状态账本。
 * 技能费用和回复都应通过这里结算，投影层不得另算一份资源曲线作为合法性依据。
 */
import type { CompiledSkillCost } from '../../compiler/combatProgram';
import type { SpGainKind } from '../../game-data/operatorDefinition';
import type { CombatResourceState } from '../state/environmentState';
import type { GameplayTag } from '../tags/gameplayTags';
import { createCombatResourceState } from './combatResourceInitialization';
import {
  SharedSpGainModifierSet,
  SharedSpRecoveryModifierSet,
  type SharedSpGainSettings,
} from './sharedSpGainModifiers';

import {
  advanceInCombatSpRecovery,
  canPay,
  changeUltimateEnergy,
  gainSp,
  gainSquadUltimateEnergyFromSkillCost,
  getMaxUltimateEnergy,
  getUltimateEnergy,
  pay,
  requestUltimateEnergyRecoveryRestriction,
  revertUltimateEnergyRecoveryRestriction,
} from './combatResourceExecution';

/** 战斗内共享技力自然恢复所需的有效参数与初始计时状态。 */
export interface SpRecoverySnapshot {
  readonly valuePerSecond: number;
  readonly pauseDuration: number;
  readonly pauseRemaining: number;
}

/** 创建一次战斗资源账本所需的完整初始状态。 */
export interface CombatResourceSnapshot {
  /** 账号侧闪避体力；省略时只追踪相对消耗，不据此拒绝闪避输入。 */
  readonly dashEnergy?: {
    readonly spent: number;
    readonly capacity: number | null;
    readonly inOverdraft: boolean;
  };
  readonly sp: number;
  readonly maxSp: number;
  readonly returnedSp: number;
  /** 原生 SkillSetting 提供的共享 SP 获取基础效率。 */
  readonly sharedSpGain: SharedSpGainSettings;
  readonly spRecovery: SpRecoverySnapshot;
  readonly ultimateEnergySystemUnlocked: boolean;
  readonly squad: readonly OperatorResourceSnapshot[];
  readonly normalSkillUltimateEnergy: NormalSkillUltimateEnergySettings;
}

/** 技能费用尝试的结果；普通失败时不改变资源账本，时间轴强制支付可按展示模型透支。 */
export interface SkillPaymentResult {
  readonly paid: boolean;
  readonly nonReturnedSpCost: number;
  /** 支付成功时按费用配置顺序产生的实际账本变化。 */
  readonly changes: readonly SkillPaymentChange[];
}

/** 技能支付直接产生的资源变化；运行时凭它记录事实，不再次读取或计算账本。 */
export type SkillPaymentChange =
  | {
      readonly resource: 'sp';
      readonly baseValue: number;
      readonly requestedValue: number;
      readonly actualValue: number;
      readonly previousValue: number;
      readonly currentValue: number;
    }
  | ({ readonly resource: 'ultimateEnergy' } & UltimateEnergyChange);

/** 一次共享技力增加的请求值、实际值与前后账本状态。 */
export interface SpChange {
  readonly baseValue: number;
  readonly requestedValue: number;
  readonly actualValue: number;
  readonly previousValue: number;
  readonly currentValue: number;
  readonly gainKind: SpGainKind;
}

/** 干员终结技能量变化。 */
export interface UltimateEnergyChange {
  readonly operatorId: string;
  readonly baseValue: number;
  readonly requestedValue: number;
  readonly applied: boolean;
  readonly actualValue: number;
  readonly previousValue: number;
  readonly currentValue: number;
}

/** 一次终结技能量变化在原生倍率链与恢复许可中的可选语义。 */
export interface UltimateEnergyChangeOptions {
  readonly coefficient?: number;
  readonly isPercentValue?: boolean;
  readonly recoveryTag?: GameplayTag;
  readonly ignoreGainMultiplier?: boolean;
}

export interface DashEnergyChange {
  readonly requestedValue: number;
  readonly actualValue: number;
  readonly previousSpent: number;
  readonly currentSpent: number;
  readonly capacity: number | null;
  readonly wasInOverdraft: boolean;
  readonly isInOverdraft: boolean;
}

export interface CombatResourceRuntimeResolvers {
  /** 原生每次正向回能时读取目标当前 UltimateSpGainScalar。 */
  readonly ultimateEnergyGainMultiplier?: (operatorId: string) => number;
}

/** 原生共享技力与按队伍顺序保存的终结技能量状态。 */
export class CombatResources {
  readonly runtimeState: CombatResourceState;
  readonly sharedSpGainModifiers: SharedSpGainModifierSet;
  readonly sharedSpRecoveryModifiers: SharedSpRecoveryModifierSet;

  constructor(
    snapshot: CombatResourceSnapshot,
    readonly resolvers: CombatResourceRuntimeResolvers = {},
    restoredState?: CombatResourceState,
  ) {
    this.runtimeState = restoredState ?? createCombatResourceState(snapshot);
    validateRestoredResourceState(snapshot, this.runtimeState);
    this.sharedSpGainModifiers = new SharedSpGainModifierSet(
      { ...snapshot.sharedSpGain },
      this.runtimeState.sharedSpGainModifiers,
    );
    this.sharedSpRecoveryModifiers = new SharedSpRecoveryModifierSet(
      this.runtimeState.sharedSpRecoveryModifiers,
    );
  }

  get sp(): number {
    return this.runtimeState.sp;
  }

  get returnedSp(): number {
    return this.runtimeState.returnedSp;
  }

  get spRecoveryPauseRemaining(): number {
    return this.runtimeState.spRecoveryPauseRemaining;
  }

  /** 导出当前余额及聚合许可，供初始化和展示使用；不包含动态注册项，不能用于切面恢复。 */
  snapshot(): CombatResourceSnapshot {
    return {
      dashEnergy: { ...this.runtimeState.dashEnergy },
      sp: this.runtimeState.sp,
      maxSp: this.runtimeState.maxSp,
      returnedSp: this.runtimeState.returnedSp,
      sharedSpGain: { ...this.sharedSpGainModifiers.settings },
      spRecovery: {
        valuePerSecond: this.runtimeState.spRecoveryPerSecond,
        pauseDuration: this.runtimeState.spRecoveryPauseDuration,
        pauseRemaining: this.runtimeState.spRecoveryPauseRemaining,
      },
      ultimateEnergySystemUnlocked: this.runtimeState.ultimateEnergySystemUnlocked,
      squad: this.runtimeState.squad.map(member => ({
        operatorId: member.operatorId,
        ultimateEnergy: member.ultimateEnergy,
        maxUltimateEnergy: member.maxUltimateEnergy,
        ultimateEnergyGainMultiplier: member.ultimateEnergyGainMultiplier,
        allowedUltimateEnergyRecoveryTags:
          member.allowedUltimateEnergyRecoveryTags === null
            ? null
            : new Set(member.allowedUltimateEnergyRecoveryTags),
      })),
      normalSkillUltimateEnergy: { ...this.runtimeState.normalSkillUltimateEnergy },
    };
  }

  /**
   * 普通闪避扣除 1 份共享体力。上限未知时只记录相对消耗，合法性返回未知。
   * 上限已知时，原生允许最后一次输入进入透支，之后才拒绝新的 Dash。
   */
  consumeDashEnergy(): { readonly accepted: boolean; readonly legalityKnown: boolean } {
    const state = this.runtimeState.dashEnergy;
    if (state.inOverdraft) return { accepted: false, legalityKnown: state.capacity !== null };
    state.spent = Math.fround(state.spent + 1);
    if (state.capacity !== null && state.spent > state.capacity) {
      state.spent = state.capacity;
      state.inOverdraft = true;
    }
    return { accepted: true, legalityKnown: state.capacity !== null };
  }

  /** 按 RecoverDashEnergy 语义返还共享闪避体力，并在配置允许时解除透支。 */
  recoverDashEnergy(amount: number, canRecoverWhenOverdraft: boolean): DashEnergyChange {
    if (!Number.isFinite(amount) || amount < 0)
      throw new RangeError('dash energy recovery must be a non-negative finite number');
    const state = this.runtimeState.dashEnergy;
    const previousSpent = state.spent;
    const wasInOverdraft = state.inOverdraft;
    if (state.inOverdraft && !canRecoverWhenOverdraft) {
      return {
        requestedValue: amount,
        actualValue: 0,
        previousSpent,
        currentSpent: state.spent,
        capacity: state.capacity,
        wasInOverdraft,
        isInOverdraft: state.inOverdraft,
      };
    }
    if (canRecoverWhenOverdraft) state.inOverdraft = false;
    state.spent = Math.fround(Math.max(0, state.spent - amount));
    return {
      requestedValue: amount,
      actualValue: Math.fround(previousSpent - state.spent),
      previousSpent,
      currentSpent: state.spent,
      capacity: state.capacity,
      wasInOverdraft,
      isInOverdraft: state.inOverdraft,
    };
  }

  gainSp(
    value: number,
    gainKind: SpGainKind = 'gain',
    source?: Parameters<SharedSpGainModifierSet['resolve']>[0],
  ): SpChange {
    return gainSp(this.runtimeState, this.sharedSpGainModifiers.settings, value, gainKind, source);
  }

  /**
   * 推进战斗内自然恢复。暂停在本帧开始时仍有效时，整帧都不会恢复技力。
   */
  advanceInCombatSpRecovery(deltaSeconds: number): SpChange {
    return advanceInCombatSpRecovery(
      this.runtimeState,
      this.sharedSpGainModifiers.settings,
      deltaSeconds,
    );
  }

  getUltimateEnergy(operatorId: string): number {
    return getUltimateEnergy(this.runtimeState, operatorId);
  }

  /** 读取指定队员本场构筑结算后的终结技能量上限。 */
  getMaxUltimateEnergy(operatorId: string): number {
    return getMaxUltimateEnergy(this.runtimeState, operatorId);
  }

  /**
   * 应用一次以基础值表达的个人终结技能量变化。
   * 严格按“回能效率 -> 百分比最大值 -> 系数 -> 回复标签许可”的原生顺序结算。
   */
  changeUltimateEnergy(
    operatorId: string,
    baseValue: number,
    options: UltimateEnergyChangeOptions = {},
  ): UltimateEnergyChange {
    return changeUltimateEnergy(this.runtimeState, this.resolvers, operatorId, baseValue, options);
  }

  canPay(operatorId: string, costs: readonly CompiledSkillCost[]): boolean {
    return canPay(this.runtimeState, operatorId, costs);
  }

  pay(
    operatorId: string,
    costs: readonly CompiledSkillCost[],
    options: { readonly forceTimelinePayment?: boolean } = {},
  ): SkillPaymentResult {
    return pay(this.runtimeState, operatorId, costs, options);
  }

  gainSquadUltimateEnergyFromSkillCost(
    sourceOperatorId: string,
    nonReturnedSpCost: number,
    coefficient: number,
  ): readonly UltimateEnergyChange[] {
    return gainSquadUltimateEnergyFromSkillCost(
      this.runtimeState,
      this.resolvers,
      sourceOperatorId,
      nonReturnedSpCost,
      coefficient,
    );
  }

  requestUltimateEnergyRecoveryRestriction(
    operatorId: string,
    allowedRecoveryTags: ReadonlySet<GameplayTag>,
  ): number {
    return requestUltimateEnergyRecoveryRestriction(
      this.runtimeState,
      operatorId,
      allowedRecoveryTags,
    );
  }

  revertUltimateEnergyRecoveryRestriction(
    handle: number,
    clearUltimateEnergyOnEnd: boolean,
  ): UltimateEnergyChange | null {
    return revertUltimateEnergyRecoveryRestriction(
      this.runtimeState,
      this.resolvers,
      handle,
      clearUltimateEnergyOnEnd,
    );
  }
}

/**
 * 恢复只绑定可变账本；队伍身份、上限和基础回能参数仍须与本次装配的固定场景程序一致。
 * 动态限制句柄和修正项属于切面数据，因此不在这里重新注册或改写。
 */
function validateRestoredResourceState(
  snapshot: CombatResourceSnapshot,
  state: CombatResourceState,
): void {
  if (state.maxSp !== snapshot.maxSp) throw new Error('restored max SP does not match scenario');
  if (state.dashEnergy.capacity !== (snapshot.dashEnergy?.capacity ?? null))
    throw new Error('restored Dash energy capacity does not match scenario');
  if (state.spRecoveryPerSecond !== snapshot.spRecovery.valuePerSecond) {
    throw new Error('restored SP recovery does not match scenario');
  }
  if (state.spRecoveryPauseDuration !== snapshot.spRecovery.pauseDuration) {
    throw new Error('restored SP recovery pause does not match scenario');
  }
  if (state.ultimateEnergySystemUnlocked !== snapshot.ultimateEnergySystemUnlocked) {
    throw new Error('restored ultimate energy system does not match scenario');
  }
  if (
    state.normalSkillUltimateEnergy.selfGainPerSp !==
      snapshot.normalSkillUltimateEnergy.selfGainPerSp ||
    state.normalSkillUltimateEnergy.otherGainPerSp !==
      snapshot.normalSkillUltimateEnergy.otherGainPerSp
  ) {
    throw new Error('restored normal-skill ultimate energy settings do not match scenario');
  }
  if (state.squad.length !== snapshot.squad.length) {
    throw new Error('restored resource squad does not match scenario');
  }
  snapshot.squad.forEach((member, index) => {
    const restored = state.squad[index];
    if (
      restored?.operatorId !== member.operatorId ||
      restored.maxUltimateEnergy !== member.maxUltimateEnergy
    ) {
      throw new Error(`restored resource squad member ${index} does not match scenario`);
    }
    if (state.operators.get(member.operatorId) !== restored) {
      throw new Error(`restored operator resource index '${member.operatorId}' is inconsistent`);
    }
  });
}
