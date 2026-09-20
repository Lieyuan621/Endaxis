/**
 * 完整帧边界上的战斗数据根。
 *
 * CombatStateGraph 把共享账本、外部输入、环境、事件目录、干员、敌人和动态实例组织成一份
 * 可复制的对象图。字段直接引用正式模拟使用的数据；程序、执行器和回调由恢复阶段重新绑定。
 */
import {
  type AbilitySystemState,
  type ComboSkillConditionState,
  type EquipmentEventState,
  type OperatorInitializationState,
  type OperatorUpgradeEventState,
  type OperatorCenterState,
  type PassiveAbilityEventState,
  type SkillCooldownState,
  type SkillRuntimeState,
} from './abilityState';
import {
  type CombatInputRuntimeState,
  type DodgeInputRuntimeState,
  type CombatSharedState,
  type CombatStatusState,
  type ExternalCombatEventRuntimeState,
  type StandardCombatEnvironmentState,
  type TimedMarkerState,
} from './environmentState';
import {
  type AbilityEventState,
  type ActionBlackboardState,
  type SkillSimulationInputs,
} from './foundationState';
import {
  type BuffContainerState,
  type GlobalBuffState,
  type LogicalAbilityEntityDirectoryState,
  type ProjectileLifecycleState,
} from './instanceState';

/** 单个干员已接入的全部可变数据。 */
export interface CombatOperatorState {
  readonly center: OperatorCenterState;
  readonly blackboard: ActionBlackboardState;
  readonly ability: AbilitySystemState;
  readonly skills: Map<string, SkillRuntimeState>;
  readonly passives: Map<string, PassiveAbilityEventState>;
  readonly equipment: EquipmentEventState | null;
  readonly initializations: Map<string, OperatorInitializationState>;
  readonly upgradeEvents: OperatorUpgradeEventState | null;
  readonly comboConditions: Map<string, ComboSkillConditionState>;
  readonly cooldowns: Map<string, SkillCooldownState>;
  readonly statuses: CombatStatusState | null;
  readonly timedMarkers: TimedMarkerState;
  readonly buffs: BuffContainerState | null;
}

/** 一场战斗在完整帧边界可保存和恢复的全部可变数据。 */
export interface CombatStateGraph {
  readonly shared: CombatSharedState;
  readonly inputs: {
    initialInputPending: boolean;
    readonly castParameters: Map<string, SkillSimulationInputs>;
    readonly control: Map<string, boolean>;
    readonly skills: CombatInputRuntimeState;
    readonly dodges: DodgeInputRuntimeState;
    readonly externalEvents: ExternalCombatEventRuntimeState;
  };
  readonly environment: StandardCombatEnvironmentState | null;
  readonly events: {
    readonly native: Map<string, AbilityEventState<string>> | null;
    readonly semantic: AbilityEventState<'airborneOutput' | 'knockDownOutput'>;
  };
  readonly operators: Map<string, CombatOperatorState>;
  readonly enemy: {
    readonly statuses: CombatStatusState | null;
    readonly timedMarkers: TimedMarkerState;
    readonly buffs: BuffContainerState | null;
  };
  readonly instances: {
    readonly abilityEntities: LogicalAbilityEntityDirectoryState;
    readonly projectiles: ProjectileLifecycleState;
    readonly globalBuffs: GlobalBuffState;
  };
}
