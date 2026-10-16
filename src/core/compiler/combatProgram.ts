import type { OperatorPassiveSkillDefinition } from '../../../packages/game-data-contract/src/operators';
import type {
  ComboSkillConditionDefinition,
  DamageElement,
  NativeSkillType,
  PlayerSkillInput,
  SkillDefinition,
} from '../game-data/operatorDefinition';
import type { CompiledActionGraph } from './compileActionGraph';
import type { CompiledInputs } from './compiledGraphData';
import type {
  CompiledCondition,
  CompiledStepParameters,
  CompiledValueInput,
} from './compiledGraphData.ts';
/**
 * 游戏数据与战斗运行时之间的解析后协议。这里的值已经确定等级和引用，
 * 运行时可以直接消费，但不得修改或重新解释原始干员配置。
 */
import type {
  ActionSwitchOptionDefinition,
  HealTargetBinding,
} from '../../../packages/game-data-contract/src/actions.ts';
import type { GameplayTag } from '../combat/tags/gameplayTags';
import type {
  AbilityEntityDefinition,
  CombatEventTrigger,
  CombatResource,
  CombatStepKind,
  DamageFeature,
  DamageTag,
  DamageType,
  ElementalReaction,
  HealCalculationAttribute,
  OperatorAttribute,
  SkillBuffAbilityEventResponse,
  SkillBuffDefinition,
  SkillBuffIgniteEventResponse,
  SkillBuffLifecycleSequences,
  SkillGlobalBuffDefinition,
  SkillType,
  StatusModifierDefinition,
  UpgradeEvent,
} from '../game-data/operatorDefinition';

/** 等级数值已经展开、可供运行时直接应用的状态修正。 */
export type ResolvedStatusModifier =
  | { kind: 'attackPercent'; value: number }
  | {
      kind: 'susceptibility';
      damageTypes: readonly DamageType[];
      value: number;
      attributeScaling?: { attribute: OperatorAttribute; coefficient: number };
      cap?: number;
    }
  | { kind: 'slowed' }
  | { kind: 'blockResourceGain'; resource: CombatResource }
  | { kind: 'resourceCostMultiplier'; resource: CombatResource; value: number }
  | { kind: 'skillCooldownMultiplier'; skillKey: string; value: number };

/** 每种步骤经编译后允许进入运行时的参数映射。 */
export type ResolvedSkillBuffLifecycleSequences = {
  readonly [K in keyof SkillBuffLifecycleSequences]?: readonly ResolvedActionSequence[];
};

export type ResolvedSkillBuffAbilityEventResponse = Omit<
  SkillBuffAbilityEventResponse,
  'sequence'
> & {
  readonly sequence: ResolvedActionSequence;
};

export type ResolvedSkillBuffIgniteEventResponse = Omit<
  SkillBuffIgniteEventResponse,
  'sequences'
> & {
  readonly sequences: readonly ResolvedActionSequence[];
};

/** 技能等级已经展开、可用于创建 Buff 实例的内联定义。 */
export type ResolvedSkillBuffDefinition = Omit<
  SkillBuffDefinition,
  | 'scheduledSequences'
  | 'lifecycleSequences'
  | 'abilityEventResponses'
  | 'igniteEventResponses'
  | 'damageModifiers'
  | 'healModifiers'
  | 'poiseModifiers'
  | 'actionGraph'
> & {
  readonly damageModifiers?: readonly (Omit<
    NonNullable<SkillBuffDefinition['damageModifiers']>[number],
    'condition'
  > & { readonly condition?: ResolvedActionSequence })[];
  readonly healModifiers?: readonly (Omit<
    NonNullable<SkillBuffDefinition['healModifiers']>[number],
    'condition'
  > & { readonly condition?: ResolvedActionSequence })[];
  readonly poiseModifiers?: readonly (Omit<
    NonNullable<SkillBuffDefinition['poiseModifiers']>[number],
    'condition'
  > & { readonly condition?: ResolvedActionSequence })[];
  readonly scheduledSequences?: readonly CompiledTimelineAction[];
  readonly lifecycleSequences?: ResolvedSkillBuffLifecycleSequences;
  readonly abilityEventResponses?: readonly ResolvedSkillBuffAbilityEventResponse[];
  readonly igniteEventResponses?: readonly ResolvedSkillBuffIgniteEventResponse[];
};

/** 各宿主共用、等级已经展开的动作数据，不附带施法或对象身份。 */
export interface CompiledSkillActionProgram {
  readonly element?: DamageElement;
  readonly initialBlackboard: Readonly<Record<string, number>>;
  readonly timelineActions: readonly CompiledTimelineAction[];
}

/** 按引用等级编译的实体技能，包括施放设置与动作程序。 */
export interface CompiledAbilityEntityChildSkillProgram extends CompiledSkillActionProgram {
  readonly skillId: string;
  readonly skillLevel?: number;
  readonly nativeSkillType: NativeSkillType;
  readonly normalSkillSubType?: SkillDefinition['normalSkillSubType'];
  readonly naturalDurationFrames: number;
  readonly castResource: {
    readonly costFrame: number;
    readonly cooldownSeconds: number;
    readonly maxChargeTime: number;
    readonly cost: CompiledSkillCost & { readonly availabilityThreshold: number };
  };
}

/** 已按引用技能等级展开、可供逻辑能力实体运行时创建实例的蓝图。 */
export interface ResolvedAbilityEntityDefinition {
  readonly faction?: AbilityEntityDefinition['faction'];
  readonly soul?: AbilityEntityDefinition['soul'];
  readonly bornTags?: AbilityEntityDefinition['bornTags'];
  readonly blackboard?: AbilityEntityDefinition['blackboard'];
  readonly lifetime: AbilityEntityDefinition['lifetime'];
  readonly deathReleaseDelaySeconds?: number;
  readonly maxStackingCount?: AbilityEntityDefinition['maxStackingCount'];
  readonly childSkill?: CompiledAbilityEntityChildSkillProgram;
  /** 同一实体模板由不同 Spawn 动作选择的具名子技能。 */
  readonly childSkills?: Readonly<Record<string, CompiledAbilityEntityChildSkillProgram>>;
  readonly passiveSkills?: readonly CompiledOperatorPassiveProgram[];
}

export interface ResolvedCombatStepParameters {
  copyContextTargets: CompiledStepParameters['copyContextTargets'];
  findTargets: CompiledStepParameters['findTargets'];
  mergeContextTargets: CompiledStepParameters['mergeContextTargets'];
  findCharacterTeamTargets: CompiledStepParameters['findCharacterTeamTargets'];
  createSpatialPointTargets: CompiledStepParameters['createSpatialPointTargets'];
  findOwnerSpawnedAbilityEntities: CompiledStepParameters['findOwnerSpawnedAbilityEntities'];
  pickContextTarget: CompiledStepParameters['pickContextTarget'];
  saveTransferredSource: CompiledStepParameters['saveTransferredSource'];
  forEachContextTarget: CompiledStepParameters['forEachContextTarget'];
  setAbilityEntityRemainingDuration: CompiledStepParameters['setAbilityEntityRemainingDuration'];
  finishOwner: CompiledStepParameters['finishOwner'];
  interruptCurrentSkill: CompiledStepParameters['interruptCurrentSkill'];
  startCurrentAbilityEntityChildSkillById: CompiledStepParameters['startCurrentAbilityEntityChildSkillById'];
  spawnAbilityEntity: Omit<CompiledStepParameters['spawnAbilityEntity'], 'definition'> & {
    readonly definition?: ResolvedAbilityEntityDefinition;
  };
  triggerCharacterInflictionEvent: CompiledStepParameters['triggerCharacterInflictionEvent'];
  applyCharacterInfliction: CompiledStepParameters['applyCharacterInfliction'];
  applyElementalInfliction: CompiledStepParameters['applyElementalInfliction'];
  triggerSpellBurst: CompiledStepParameters['triggerSpellBurst'];
  triggerCustomAbilityEvent: CompiledStepParameters['triggerCustomAbilityEvent'];
  applyPhysicalInfliction: CompiledStepParameters['applyPhysicalInfliction'];
  forceSpellStatus: CompiledStepParameters['forceSpellStatus'];
  dealDamage: {
    target?: CompiledStepParameters['dealDamage']['target'];
    damageType: DamageType;
    calculation?: CompiledStepParameters['dealDamage']['calculation'];
    attackScale: number | CompiledValueInput;
    takeAttackSnapshot?: boolean;
    calculationMultiplier?: number;
    calculationAttribute?: string;
    calculationAddition?: number | CompiledValueInput;
    calculationValue?: number | CompiledValueInput;
    calculationValueScale?: number | CompiledValueInput;
    tags: readonly DamageTag[];
    gameplayTags?: readonly GameplayTag[];
    features?: readonly DamageFeature[];
    stagger?: number | CompiledValueInput;
    staggerMultiplier?: number | CompiledValueInput;
    staggerOnlyWhenCasterControlled?: boolean;
    instantAttributeModifiers?: CompiledStepParameters['dealDamage']['instantAttributeModifiers'];
    instantDamageScaleModifiers?: CompiledStepParameters['dealDamage']['instantDamageScaleModifiers'];
  };
  dealStagger: {
    target?: CompiledStepParameters['dealStagger']['target'];
    value: number | CompiledValueInput;
    valueMultiplier?: number | CompiledValueInput;
    features?: readonly DamageFeature[];
  };
  heal: HealTargetBinding & {
    source?: CompiledStepParameters['heal']['source'];
    alwaysNext?: boolean;
    tags: readonly GameplayTag[];
  } & (
      | {
          attribute: HealCalculationAttribute;
          attributeSource?: 'target';
          multiplier: number | CompiledValueInput;
          addition: number | CompiledValueInput;
          amount?: never;
        }
      | {
          amount: number | CompiledValueInput;
          attribute?: never;
          multiplier?: never;
          addition?: never;
        }
    );
  aura: Omit<CompiledStepParameters['aura'], 'buffs'> & {
    readonly buffs: ResolvedCombatStepParameters['applyBuff']['buffs'];
  };
  applyBuff: Omit<CompiledStepParameters['applyBuff'], 'buffs'> & {
    readonly buffs: readonly (Omit<
      CompiledStepParameters['applyBuff']['buffs'][number],
      'blackboardAssignments'
    > & {
      readonly blackboardAssignments?: Readonly<Record<string, CompiledValueInput>>;
    })[];
  };
  createGlobalBuff: Omit<CompiledStepParameters['createGlobalBuff'], 'definition'> & {
    readonly definition: CompiledGlobalBuffDefinition;
  };
  finishParentGlobalBuff: CompiledStepParameters['finishParentGlobalBuff'];
  finishGlobalBuffsById: CompiledStepParameters['finishGlobalBuffsById'];
  readSkillSettingData: CompiledStepParameters['readSkillSettingData'];
  readBuffBlackboard: CompiledStepParameters['readBuffBlackboard'];
  readEventBuffBlackboard: CompiledStepParameters['readEventBuffBlackboard'];
  readBuffRemainingDuration: CompiledStepParameters['readBuffRemainingDuration'];
  setBuffRemainingDuration: CompiledStepParameters['setBuffRemainingDuration'];
  setCurrentBuffRemainingDuration: CompiledStepParameters['setCurrentBuffRemainingDuration'];
  refreshCurrentBuffAttributeModifiers: CompiledStepParameters['refreshCurrentBuffAttributeModifiers'];
  readBuffStackCount: CompiledStepParameters['readBuffStackCount'];
  dispelBuffs: CompiledStepParameters['dispelBuffs'];
  finishBuffsByTag: CompiledStepParameters['finishBuffsByTag'];
  finishBuffsById: CompiledStepParameters['finishBuffsById'];
  finishCurrentBuff: CompiledStepParameters['finishCurrentBuff'];
  skillAffix: CompiledStepParameters['skillAffix'];
  setCurrentBuffTimePaused: CompiledStepParameters['setCurrentBuffTimePaused'];
  igniteBuffs: CompiledStepParameters['igniteBuffs'];
  adjustSkillCooldown: CompiledStepParameters['adjustSkillCooldown'];
  holdBuffsById: CompiledStepParameters['holdBuffsById'];
  inheritBuffById: CompiledStepParameters['inheritBuffById'];
  createTimedMarker: CompiledStepParameters['createTimedMarker'];
  setGlobalCooldown: CompiledStepParameters['setGlobalCooldown'];
  startTimeDilation: CompiledStepParameters['startTimeDilation'];
  startUltimateTimeDilation: CompiledStepParameters['startUltimateTimeDilation'];
  hideUi: CompiledStepParameters['hideUi'];
  setIgnoreGlobalTimeScale: CompiledStepParameters['setIgnoreGlobalTimeScale'];
  storeCharacterTypeId: CompiledStepParameters['storeCharacterTypeId'];
  findCharacterBySquadSlot: CompiledStepParameters['findCharacterBySquadSlot'];
  storeCharacterTypeBySquadSlot: CompiledStepParameters['storeCharacterTypeBySquadSlot'];
  storeCurrentTimelineFrame: CompiledStepParameters['storeCurrentTimelineFrame'];
  storeEventSpGainAmount: CompiledStepParameters['storeEventSpGainAmount'];
  storeEventHealValues: CompiledStepParameters['storeEventHealValues'];
  storeEventDamageValue: CompiledStepParameters['storeEventDamageValue'];
  storeShieldValue: CompiledStepParameters['storeShieldValue'];
  modifyActionValue: CompiledStepParameters['modifyActionValue'];
  storeRandomInteger: CompiledStepParameters['storeRandomInteger'];
  calculateActionValue: CompiledStepParameters['calculateActionValue'];
  storeSourceAttributeValue: CompiledStepParameters['storeSourceAttributeValue'];
  storeEntityPropertyValue: CompiledStepParameters['storeEntityPropertyValue'];
  setHealthFloor: CompiledStepParameters['setHealthFloor'];
  changeResource: Omit<CompiledStepParameters['changeResource'], 'amount' | 'coefficient'> & {
    amount: number | CompiledValueInput;
    coefficient?: number | CompiledValueInput;
  };
  recoverDashEnergy: CompiledStepParameters['recoverDashEnergy'];
  recordPerfectDodge: CompiledStepParameters['recordPerfectDodge'];
  gainSquadUltimateEnergyFromSkillCost: { coefficient: number };
  gainFinisherSp: CompiledStepParameters['gainFinisherSp'];
  restrictUltimateEnergyRecovery: Omit<
    CompiledStepParameters['restrictUltimateEnergyRecovery'],
    'allowedRecoveryTags'
  > & { readonly allowedRecoveryTags: readonly GameplayTag[] };
  jumpTimeline: CompiledStepParameters['jumpTimeline'];
  reachSkillOperableBoundary: CompiledStepParameters['reachSkillOperableBoundary'];
  markCurrentSkillCanDash: CompiledStepParameters['markCurrentSkillCanDash'];
  markCurrentSkillCanInterrupt: CompiledStepParameters['markCurrentSkillCanInterrupt'];
  conditional: CompiledStepParameters['conditional'];
  checkCondition: CompiledStepParameters['checkCondition'];
  invertNextResult: CompiledStepParameters['invertNextResult'];
  ifElse: CompiledStepParameters['ifElse'];
  anyCondition: CompiledStepParameters['anyCondition'];
  switch: CompiledStepParameters['switch'];
  once: CompiledStepParameters['once'];
  repeatEachTick: CompiledStepParameters['repeatEachTick'];
  launchProjectile: CompiledStepParameters['launchProjectile'];
  openComboWindow: CompiledStepParameters['openComboWindow'];
  playAnimation: CompiledStepParameters['playAnimation'];
  showComboRingQte: CompiledStepParameters['showComboRingQte'];
  changeSkillSlot: CompiledStepParameters['changeSkillSlot'];
  overrideBasicAttackMapping: CompiledStepParameters['overrideBasicAttackMapping'];
  overrideMultiDashLimit: CompiledStepParameters['overrideMultiDashLimit'];
  changePlayerActionMode: CompiledStepParameters['changePlayerActionMode'];
  changeNativeSkillType: CompiledStepParameters['changeNativeSkillType'];
  setCharacterPassiveUiValue: CompiledStepParameters['setCharacterPassiveUiValue'];
  inheritSkillCastInfoForBasicAttack: CompiledStepParameters['inheritSkillCastInfoForBasicAttack'];
  castSkillDuringAction: CompiledStepParameters['castSkillDuringAction'];
  listenForCombatEvents: {
    responses: readonly {
      readonly key: string;
      readonly event: CombatEventTrigger;
      readonly phase?: 'dataAction' | 'skill';
      readonly priority?: number;
      readonly condition?: CompiledCondition;
      readonly sequence: ResolvedActionSequence;
    }[];
  };
  listenForTagQuery: Omit<CompiledStepParameters['listenForTagQuery'], 'sequence'> & {
    sequence: ResolvedActionSequence;
  };
}

type ResolvedCombatStepNode<K extends CombatStepKind> = {
  readonly key?: string;
  /** 存档中的命中身份（放置时分配）；伤害回执凭它把伤害对应到具体命中点。 */
  readonly hitId?: string;
  readonly kind: K;
  readonly parameters: Readonly<ResolvedCombatStepParameters[K]>;
} & (K extends 'playAnimation'
  ? { readonly onEnd: ResolvedActionSequence }
  : K extends 'showComboRingQte'
    ? { readonly triggeredAction: ResolvedActionSequence }
    : K extends 'aura'
      ? { readonly onEnter: ResolvedActionSequence; readonly onExit: ResolvedActionSequence }
      : K extends 'jumpTimeline'
        ? { readonly condition: CompiledCondition }
        : K extends 'anyCondition'
          ? { readonly conditions: readonly CompiledCondition[] }
          : K extends 'ifElse'
            ? {
                readonly condition: CompiledCondition;
                readonly whenTrue: ResolvedActionSequence;
                readonly whenFalse: ResolvedActionSequence;
              }
            : K extends 'conditional'
              ? {
                  readonly whenTrue: ResolvedActionSequence;
                  readonly whenFalse?: ResolvedActionSequence;
                }
              : K extends 'once'
                ? { readonly body: ResolvedActionSequence }
                : K extends 'switch'
                  ? {
                      readonly options: readonly (Omit<ActionSwitchOptionDefinition, 'sequence'> & {
                        readonly sequence: ResolvedActionSequence;
                      })[];
                    }
                  : K extends 'repeatEachTick'
                    ? { readonly body: ResolvedActionSequence }
                    : K extends 'launchProjectile'
                      ? {
                          readonly callbacks: readonly {
                            readonly event: 'launch' | 'hit' | 'block' | 'reach' | 'finish';
                            readonly skill: CompiledAbilityEntityChildSkillProgram;
                          }[];
                        }
                      : K extends 'forEachContextTarget'
                        ? { readonly body: ResolvedActionSequence }
                        : {});

/** 按成员逐一构造，联合kind仍保留parameters与子序列字段的判别关联。 */
export type ResolvedCombatStepForKind<K extends CombatStepKind> = {
  [Kind in K]: ResolvedCombatStepNode<Kind>;
}[K];

/** 运行时可直接执行、按 kind 区分类型的单个步骤。 */
export type ResolvedCombatStep = ResolvedCombatStepForKind<CombatStepKind>;

/** 每种节点必须明确执行归属；新增 kind 不得自动落入操作链。 */
export const COMBAT_STEP_EXECUTION_ROUTES = {
  copyContextTargets: 'operation',
  findTargets: 'operation',
  mergeContextTargets: 'operation',
  findCharacterTeamTargets: 'operation',
  createSpatialPointTargets: 'operation',
  findOwnerSpawnedAbilityEntities: 'operation',
  pickContextTarget: 'operation',
  saveTransferredSource: 'operation',
  forEachContextTarget: 'sequence',
  setAbilityEntityRemainingDuration: 'operation',
  finishOwner: 'operation',
  interruptCurrentSkill: 'operation',
  startCurrentAbilityEntityChildSkillById: 'operation',
  spawnAbilityEntity: 'operation',
  triggerCharacterInflictionEvent: 'operation',
  applyCharacterInfliction: 'operation',
  applyElementalInfliction: 'operation',
  triggerSpellBurst: 'operation',
  triggerCustomAbilityEvent: 'operation',
  castSkillDuringAction: 'operation',
  applyPhysicalInfliction: 'operation',
  forceSpellStatus: 'operation',
  dealDamage: 'operation',
  dealStagger: 'operation',
  heal: 'operation',
  aura: 'sequence',
  applyBuff: 'operation',
  createGlobalBuff: 'operation',
  finishParentGlobalBuff: 'operation',
  finishGlobalBuffsById: 'operation',
  readSkillSettingData: 'operation',
  readBuffBlackboard: 'operation',
  readEventBuffBlackboard: 'operation',
  readBuffRemainingDuration: 'operation',
  setBuffRemainingDuration: 'operation',
  setCurrentBuffRemainingDuration: 'operation',
  refreshCurrentBuffAttributeModifiers: 'operation',
  skillAffix: 'operation',
  readBuffStackCount: 'operation',
  dispelBuffs: 'operation',
  finishBuffsByTag: 'operation',
  finishBuffsById: 'operation',
  finishCurrentBuff: 'operation',
  setCurrentBuffTimePaused: 'operation',
  igniteBuffs: 'operation',
  adjustSkillCooldown: 'operation',
  holdBuffsById: 'operation',
  inheritBuffById: 'operation',
  restrictUltimateEnergyRecovery: 'operation',
  createTimedMarker: 'operation',
  setGlobalCooldown: 'operation',
  startTimeDilation: 'operation',
  startUltimateTimeDilation: 'operation',
  hideUi: 'operation',
  setIgnoreGlobalTimeScale: 'operation',
  storeCharacterTypeId: 'operation',
  findCharacterBySquadSlot: 'operation',
  storeCharacterTypeBySquadSlot: 'operation',
  storeCurrentTimelineFrame: 'operation',
  storeEventSpGainAmount: 'operation',
  storeEventHealValues: 'operation',
  storeEventDamageValue: 'operation',
  storeShieldValue: 'operation',
  modifyActionValue: 'operation',
  storeRandomInteger: 'operation',
  calculateActionValue: 'operation',
  storeSourceAttributeValue: 'operation',
  storeEntityPropertyValue: 'operation',
  setHealthFloor: 'operation',
  changeResource: 'operation',
  recoverDashEnergy: 'operation',
  recordPerfectDodge: 'operation',
  gainSquadUltimateEnergyFromSkillCost: 'operation',
  gainFinisherSp: 'operation',
  jumpTimeline: 'sequence',
  reachSkillOperableBoundary: 'sequence',
  markCurrentSkillCanDash: 'sequence',
  markCurrentSkillCanInterrupt: 'sequence',
  conditional: 'sequence',
  checkCondition: 'sequence',
  invertNextResult: 'sequence',
  ifElse: 'sequence',
  anyCondition: 'sequence',
  switch: 'sequence',
  once: 'sequence',
  repeatEachTick: 'sequence',
  launchProjectile: 'sequence',
  openComboWindow: 'operation',
  playAnimation: 'sequence',
  showComboRingQte: 'sequence',
  changeSkillSlot: 'operation',
  overrideBasicAttackMapping: 'operation',
  overrideMultiDashLimit: 'operation',
  changePlayerActionMode: 'operation',
  changeNativeSkillType: 'operation',
  setCharacterPassiveUiValue: 'operation',
  inheritSkillCastInfoForBasicAttack: 'operation',
  listenForCombatEvents: 'sequence',
  listenForTagQuery: 'sequence',
} as const satisfies Record<CombatStepKind, 'sequence' | 'operation'>;

type CombatOperationKind = {
  [K in CombatStepKind]: (typeof COMBAT_STEP_EXECUTION_ROUTES)[K] extends 'operation' ? K : never;
}[CombatStepKind];

/** 仅交给操作链的节点；监听器与控制流程由序列运行时持有生命周期。 */
export type ResolvedCombatOperationStep = {
  [K in CombatOperationKind]: ResolvedCombatStepForKind<K>;
}[CombatOperationKind];

export function isCombatOperationStep(
  step: ResolvedCombatStep,
): step is ResolvedCombatOperationStep {
  return COMBAT_STEP_EXECUTION_ROUTES[step.kind] === 'operation';
}

/** 图入口与只读程序共享；宿主保存引用，不能在此展开或复制节点。 */
export interface CompiledGraphEntry {
  readonly graph: CompiledActionGraph;
  readonly entry: string | null;
  readonly callSite: string;
}

export type ResolvedActionSequence = CompiledGraphEntry;

/** 构筑编译出的常驻被动程序；由战斗装配层启用，不进入时间轴技能集合。 */
export interface CompiledOperatorPassiveProgram {
  readonly key: string;
  readonly initialBlackboard: Readonly<Record<string, number>>;
  readonly enableSequence: ResolvedActionSequence;
  readonly abilityEventResponses?: readonly (Omit<
    NonNullable<OperatorPassiveSkillDefinition['abilityEventResponses']>[number],
    'sequence'
  > & { readonly sequence: ResolvedActionSequence })[];
}

/** 构筑启用的养成初始化程序；由战斗装配层执行一次，不伪装成被动技能。 */
export interface CompiledOperatorInitializationProgram {
  readonly key: string;
  /** 本干员 equipmentContributions 内的实例索引（同定义装备也隔离）；直接养成初始化无此所有者。 */
  readonly equipmentContributionIndex?: number;
  /** 配装能力启用前程序；与 sequence 共用同一能力黑板，中间开放事件响应。 */
  readonly enableSequence?: ResolvedActionSequence;
  readonly initialBlackboard?: Readonly<Record<string, number>>;
  readonly sequence: ResolvedActionSequence;
}

/** 技能释放时刻相对帧上的一个已编译调度项。 */
export interface CompiledTimelineAction {
  readonly startFrame: number;
  readonly endFrame?: number;
  readonly sequence: ResolvedActionSequence;
}

/** 等级已经展开的一项技能资源费用。 */
export interface CompiledSkillCost {
  readonly resource: CombatResource;
  readonly value: number;
}

/** 构筑启用后注册到整场战斗语义事件中心的养成事件程序。 */
export interface CompiledOperatorUpgradeEventProgram {
  readonly key: string;
  readonly event: UpgradeEvent;
  readonly initialBlackboard: Readonly<Record<string, number>>;
  readonly sequence: ResolvedActionSequence;
}

/** 只在当前技能程序及其派生操作链中参与伤害快照的构筑期属性修正。 */
export interface CompiledSkillStatModifiers {
  readonly criticalRate?: number;
  readonly damageToStaggeredEnemyIncrease?: number;
}

/** 已解析等级的执行程序；非时间轴宿主不需要伪造分组、养成等级或块宽。 */
export interface CompiledSkillExecutionProgram extends CompiledSkillActionProgram {
  readonly operatorId: string;
  readonly skillId: string;
  readonly skillLevel?: number;
  /** 路由包装器的行为养成补丁按真实执行体身份匹配；费用和冷却仍使用槽位身份。 */

  readonly executionSkillId?: string;
  /** 只有玩家操作、伤害分类或对应事件确实需要时才存在；原生实体技能不得伪造。 */
  readonly skillType?: SkillType;
  /** 原生技能实例的初始可变分类；不同于伤害/养成使用的 Endaxis skillType。 */
  readonly nativeSkillType?: NativeSkillType;
  readonly normalSkillSubType?: SkillDefinition['normalSkillSubType'];
  /** 默认施放的目标；省略时由调用方提供，不能回退到敌人。 */
  readonly defaultTarget?: 'enemy' | 'owner';
  readonly smartTarget?: 'enemy' | 'input' | 'trigger';
  /** 时间轴投影使用的技能块宽度，不参与技能生命周期和中断判断。 */
  readonly timelineBlockFrames?: number;
  /** 有序连段下一技能身份；也标记程序已保留 AllowNext 动作，但不预选正式边界目标。 */
  readonly timelineContinuationSkillId?: string;
  readonly timelineBlockFollowUpSkillId?: string;
  /** 原生技能实例的自然结束周期；与块宽、可中断边界彼此独立。 */
  readonly naturalDurationFrames?: number;
  readonly exclusiveFrame?: number;
  /** 原生普攻连段身份提交点；到达后下一次 Dash 可保存该目标。 */
  readonly offsetRecordFrame?: number;
  /** 原生技能局部输入映射与接续窗口；已无等级值，运行时只读。 */
  readonly inputWindows?: SkillDefinition['inputWindows'];
  readonly cooldownFrames?: number;
  readonly costFrame?: number;
  readonly costs: readonly CompiledSkillCost[];
  readonly switchToBuffCast?: {
    readonly currentSkillTypes?: readonly SkillType[];
    readonly requiresCurrentSkillNotInterruptible?: boolean;
    readonly condition?: CompiledCondition;
    readonly asSkillCast: boolean;
    readonly sequence: ResolvedActionSequence;
  };
  readonly statModifiers?: CompiledSkillStatModifiers;
  /** 当前技能等级下实际引用到的能力实体闭包；支持子技能递归生成同一蓝图。 */
  readonly abilityEntityDefinitions?: Readonly<Record<string, ResolvedAbilityEntityDefinition>>;
}

/** 时间轴编译产物保留完整编辑身份；运行实例仅消费其执行程序部分。 */
export interface CompiledSkillProgram extends CompiledSkillExecutionProgram {
  readonly skillGroupKey: string;
  readonly skillLevel: number;
  readonly skillType: SkillType;
  readonly timelineBlockFrames: number;
}

/** 与放置实例无关的单等级冷却配置；不携带动作、命中或施放身份。 */
export type CompiledSkillCooldownProgram = Pick<
  CompiledSkillProgram,
  | 'operatorId'
  | 'skillGroupKey'
  | 'skillId'
  | 'executionSkillId'
  | 'nativeSkillType'
  | 'normalSkillSubType'
  | 'skillType'
  | 'inputWindows'
  | 'cooldownFrames'
  | 'costFrame'
>;

/** 原生技能槽及成员关系，不是技能库展示组。换槽只影响后续输入选择。 */
export interface CompiledSkillSlotGroup {
  readonly skillSlotKey: string;
  readonly input?: PlayerSkillInput;
  /** 处决和下落同属普攻操作，但不是无条件默认映射。 */
  readonly defaultForInput?: boolean;
  /** 未发生槽位覆盖时保持各自时间轴存档身份的可放置入口；省略表示只有 baseSkillKey。 */
  readonly stableInputSkillKeys?: readonly string[];
  readonly baseSkillKey: string;
  readonly replacementSkillKeys: readonly string[];
}

/** 原生附着事件的常驻条件环境；不与旧语义事件连携规则混用。 */
export interface CompiledComboSkillConditionProgram {
  readonly key: string;
  /** 从原生 skillSlots 成员关系取得，与展示分组无关。 */
  readonly skillSlotKey: string;
  /** 角色模板注册条件时绑定的具体技能；不随槽位替换状态漂移。 */
  readonly skillKey: string;
  readonly event: ComboSkillConditionDefinition['event'];
  readonly immediately: boolean;
  /** null 为禁用，{} 为启用空板；字符串/空值不降格成数值。 */
  readonly initialValues: Readonly<Record<string, number | string | null>> | null;
  readonly sequence: ResolvedActionSequence;
}

export type { ElementalReaction, StatusModifierDefinition };

export type CompiledGlobalBuffDefinition = CompiledInputs<SkillGlobalBuffDefinition>;
