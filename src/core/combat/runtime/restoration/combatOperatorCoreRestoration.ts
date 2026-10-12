/**
 * 重建单个干员不含被动、装备和初始化来源的核心运行时。
 * 依赖顺序固定为实体外壳、共享冷却、技能宿主、能力系统；整个过程不执行开局或施放动作。
 */
import { ActionBlackboard } from '../../actions/actionBlackboard';
import type { BuffApplicationHandle } from '../../buffs/buffOperationExecutor';
import type { CombatReceiptSink } from '../../receipt/combatReceipt';
import type { CombatOperatorState } from '../../state/combatState';
import type { BuffReference } from '../../state/foundationState';
import {
  TimedMarkerContainer,
  type TimedMarkerContainerHooks,
  type TimedMarkerClock,
} from '../../status/timedMarkers';
import type { CombatClock } from '../../time/combatClock';
import type { CombatOperatorProgram } from '../combatRuntimeAssembly';
import type { RestoreCombatOperatorAbilitySystemOptions } from './combatOperatorAbilitySystemRestoration';
import { bindRestoredCombatOperatorAbilitySystem } from './combatOperatorAbilitySystemRestoration';
import type { RestoreCombatOperatorSkillsOptions } from './combatOperatorSkillRestoration';
import { bindRestoredCombatOperatorSkills } from './combatOperatorSkillRestoration';
import type { PreparedCombatSkillRestoreBinding } from './combatRuntimeRestorePreparation';
import { bindRestoredCombatSkillCooldowns } from './combatSkillCooldownRestoration';

export interface RestoreCombatOperatorCoreOptions {
  readonly operator: CombatOperatorProgram;
  readonly state: CombatOperatorState;
  readonly skills: readonly PreparedCombatSkillRestoreBinding[];
  readonly clock: CombatClock;
  readonly receipt: CombatReceiptSink;
  readonly timedMarkerHooks?: TimedMarkerContainerHooks;
  /** 恢复标记创建时使用的全局缩放时钟，不能临时改用未缩放时间。 */
  readonly globalScaledClock?: TimedMarkerClock;
  /** useTimeDilationDt 开启的标记采用所属实体时间。 */
  readonly entityClock?: TimedMarkerClock;
  readonly createSkillDependencies: (
    binding: PreparedCombatSkillRestoreBinding,
    context: {
      readonly blackboard: ActionBlackboard;
      readonly timedMarkers: TimedMarkerContainer;
    },
  ) => ReturnType<RestoreCombatOperatorSkillsOptions['createDependencies']>;
  readonly resolveAttachedBuff: (reference: BuffReference) => BuffApplicationHandle | undefined;
  readonly abilityRuntime: RestoreCombatOperatorAbilitySystemOptions['runtime'];
  readonly onCooldownReady?: (skillId: string) => void;
}

export interface RestoredCombatOperatorCore {
  readonly blackboard: ActionBlackboard;
  readonly timedMarkers: TimedMarkerContainer;
  readonly cooldowns: ReturnType<typeof bindRestoredCombatSkillCooldowns>;
  readonly skills: ReturnType<typeof bindRestoredCombatOperatorSkills>;
  readonly ability: ReturnType<typeof bindRestoredCombatOperatorAbilitySystem>;
}

export function bindRestoredCombatOperatorCore(
  options: RestoreCombatOperatorCoreOptions,
): RestoredCombatOperatorCore {
  const ownerId = options.operator.operatorId;
  const buffState = options.operator.buffRuntime?.runtimeState ?? null;
  if (buffState !== options.state.buffs) {
    throw new Error(`restored operator '${ownerId}' Buff target does not bind its saved state`);
  }
  const blackboard = ActionBlackboard.bindRuntimeState(options.state.blackboard);
  if (
    options.operator.buffRuntime?.entityBlackboard !== undefined &&
    options.operator.buffRuntime.entityBlackboard.runtimeState !== options.state.blackboard
  ) {
    throw new Error(`restored operator '${ownerId}' Buff target uses another blackboard`);
  }
  const timedMarkers = new TimedMarkerContainer(
    ownerId,
    options.entityClock ?? options.clock,
    options.timedMarkerHooks,
    options.state.timedMarkers,
    {
      globalScaled: options.globalScaledClock ?? options.clock,
    },
  );
  const cooldowns = bindRestoredCombatSkillCooldowns(options.operator, options.state.cooldowns);
  const context = { blackboard, timedMarkers };
  const skills = bindRestoredCombatOperatorSkills({
    operatorId: ownerId,
    skills: options.skills,
    cooldowns,
    createDependencies: binding => options.createSkillDependencies(binding, context),
    resolveAttachedBuff: options.resolveAttachedBuff,
  });
  const ability = bindRestoredCombatOperatorAbilitySystem({
    operator: options.operator,
    state: options.state.ability,
    skills,
    cooldowns,
    runtime: options.abilityRuntime,
    onCooldownReady: options.onCooldownReady,
  });
  return { blackboard, timedMarkers, cooldowns, skills, ability };
}
