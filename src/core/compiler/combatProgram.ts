/**
 * 游戏数据与战斗运行时之间的解析后协议。这里的值已经确定等级和引用，
 * 运行时可以直接消费，但不得修改或重新解释原始干员配置。
 */
import type {
  ActionValueOperand,
  AbilityEntityDefinition,
  CombatCondition,
  CombatEventTrigger,
  CombatResource,
  CombatStepKind,
  CombatStepParameters,
  DamageFeature,
  DamageTag,
  DamageType,
  ElementalReaction,
  HealCalculationAttribute,
  OperatorAttribute,
  ResourceRecipient,
  SkillBuffDefinition,
  SkillBuffLifecycleSequences,
  SkillBuffAbilityEventResponse,
  SkillBuffIgniteEventResponse,
  SkillGlobalBuffDefinition,
  SpGainKind,
  SpGainSource,
  SkillType,
  StatusModifierDefinition,
  UpgradeEvent,
} from '../game-data/operatorDefinition';
import type {
  ActionSwitchOptionDefinition,
  HealTargetBinding,
} from '../../../packages/game-data-contract/src/actions.ts';
import type { GameplayTag } from '../combat/tags/gameplayTags';

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
  | { kind: 'skillCooldownMultiplier'; skillGroupKey: string; value: number };

/** 每种步骤经编译后允许进入运行时的参数映射。 */
export type ResolvedSkillBuffLifecycleSequences = {
  readonly [K in keyof SkillBuffLifecycleSequences]?: ResolvedActionSequence;
};

export type ResolvedSkillBuffAbilityEventResponse = Omit<
  SkillBuffAbilityEventResponse,
  'sequence'
> & {
  readonly sequence: ResolvedActionSequence;
};

export type ResolvedSkillBuffIgniteEventResponse = Omit<
  SkillBuffIgniteEventResponse,
  'sequence'
> & {
  readonly sequence: ResolvedActionSequence;
};

/** 技能等级已经展开、可用于创建 Buff 实例的内联定义。 */
export type ResolvedSkillBuffDefinition = Omit<
  SkillBuffDefinition,
  | 'scheduledSequences'
  | 'lifecycleSequences'
  | 'abilityEventResponses'
  | 'igniteEventResponses'
  | 'damageModifiers'
> & {
  readonly damageModifiers?: readonly (Omit<
    NonNullable<SkillBuffDefinition['damageModifiers']>[number],
    'conditionProgram'
  > & { readonly conditionProgram?: ResolvedActionSequence })[];
  readonly scheduledSequences?: readonly CompiledTimelineAction[];
  readonly lifecycleSequences?: ResolvedSkillBuffLifecycleSequences;
  readonly abilityEventResponses?: readonly ResolvedSkillBuffAbilityEventResponse[];
  readonly igniteEventResponses?: readonly ResolvedSkillBuffIgniteEventResponse[];
};

/** 各宿主共用、等级已经展开的动作数据，不附带施法或对象身份。 */
export interface CompiledSkillActionProgram {
  readonly initialBlackboard: Readonly<Record<string, number>>;
  readonly timelineActions: readonly CompiledTimelineAction[];
}

export interface CompiledProjectileCallbackSkillProgram extends CompiledAbilityEntityChildSkillProgram {}

/** 按引用等级编译的实体技能，包括施放设置与动作程序。 */
export interface CompiledAbilityEntityChildSkillProgram extends CompiledSkillActionProgram {
  readonly skillId: string;
  readonly nativeSkillType: import('../game-data/operatorDefinition').NativeSkillType;
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
  mergeContextTargets: CombatStepParameters['mergeContextTargets'];
  findCharacterTeamTargets: CombatStepParameters['findCharacterTeamTargets'];
  findUnfinishedProjectileTargets: CombatStepParameters['findUnfinishedProjectileTargets'];
  createSpatialPointTargets: CombatStepParameters['createSpatialPointTargets'];
  findOwnerSpawnedAbilityEntities: CombatStepParameters['findOwnerSpawnedAbilityEntities'];
  pickContextTarget: CombatStepParameters['pickContextTarget'];
  forEachContextTarget: CombatStepParameters['forEachContextTarget'];
  repeatByActionValue: CombatStepParameters['repeatByActionValue'];
  readAbilityEntityRemainingDuration: CombatStepParameters['readAbilityEntityRemainingDuration'];
  setAbilityEntityRemainingDuration: CombatStepParameters['setAbilityEntityRemainingDuration'];
  finishCurrentAbilityEntity: CombatStepParameters['finishCurrentAbilityEntity'];
  finishActionOwnerAbilityEntity: CombatStepParameters['finishActionOwnerAbilityEntity'];
  finishCurrentAbilityEntityWhenSourceDies: CombatStepParameters['finishCurrentAbilityEntityWhenSourceDies'];
  startCurrentAbilityEntityChildSkill: {
    readonly childSkill: CompiledAbilityEntityChildSkillProgram;
  };
  startCurrentAbilityEntityChildSkillById: CombatStepParameters['startCurrentAbilityEntityChildSkillById'];
  spawnAbilityEntity: Omit<CombatStepParameters['spawnAbilityEntity'], 'definition'> & {
    readonly definition?: ResolvedAbilityEntityDefinition;
  };
  applyElementalInfliction: CombatStepParameters['applyElementalInfliction'];
  applyKnockDown: CombatStepParameters['applyKnockDown'];
  triggerSpellBurst: CombatStepParameters['triggerSpellBurst'];
  triggerCustomAbilityEvent: CombatStepParameters['triggerCustomAbilityEvent'];
  applyPhysicalInfliction:
    | (Omit<
        Extract<CombatStepParameters['applyPhysicalInfliction'], { type: 'fracture' }>,
        'noGuardDefinition' | 'fractureDefinition'
      > & {
        readonly noGuardDefinition: ResolvedSkillBuffDefinition;
        readonly fractureDefinition: ResolvedSkillBuffDefinition;
      })
    | (Omit<
        Extract<CombatStepParameters['applyPhysicalInfliction'], { type: 'crush' }>,
        'noGuardDefinition' | 'crushedDefinition'
      > & {
        readonly noGuardDefinition: ResolvedSkillBuffDefinition;
        readonly crushedDefinition: ResolvedSkillBuffDefinition;
      })
    | (Omit<
        Extract<CombatStepParameters['applyPhysicalInfliction'], { type: 'airborne' }>,
        'noGuardDefinition' | 'airborneDefinition'
      > & {
        readonly noGuardDefinition: ResolvedSkillBuffDefinition;
        readonly airborneDefinition: ResolvedSkillBuffDefinition;
      });
  applyElementalReaction: CombatStepParameters['applyElementalReaction'];
  consumeElementalReaction: CombatStepParameters['consumeElementalReaction'];
  outputAirborne: CombatStepParameters['outputAirborne'];
  outputKnockDown: CombatStepParameters['outputKnockDown'];
  dealDamage: {
    damageType: DamageType;
    calculation?: 'standard' | 'breakingAttack' | 'attribute';
    attackScale: number | ActionValueOperand;
    takeAttackSnapshot?: boolean;
    calculationMultiplier?: number;
    calculationAttribute?: string;
    calculationAddition?: number | ActionValueOperand;
    tags: readonly DamageTag[];
    gameplayTags?: readonly GameplayTag[];
    features?: readonly DamageFeature[];
    stagger?: number | ActionValueOperand;
    staggerMultiplier?: number | ActionValueOperand;
    staggerOnlyWhenCasterControlled?: boolean;
    attackScalePerStatusStack?: {
      statusKey: string;
      target: 'caster' | 'enemy';
      coefficient: number;
    };
    instantAttributeModifiers?: CombatStepParameters['dealDamage']['instantAttributeModifiers'];
    instantDamageScaleModifiers?: CombatStepParameters['dealDamage']['instantDamageScaleModifiers'];
  };
  dealFixedDamage: {
    damageType: DamageType;
    value: number | ActionValueOperand;
    tags: readonly DamageTag[];
    features?: readonly DamageFeature[];
    stagger?: number | ActionValueOperand;
    staggerMultiplier?: number | ActionValueOperand;
    staggerOnlyWhenCasterControlled?: boolean;
  };
  dealStagger: {
    value: number | ActionValueOperand;
    valueMultiplier?: number | ActionValueOperand;
    features?: readonly DamageFeature[];
  };
  heal: HealTargetBinding & {
    source?: CombatStepParameters['heal']['source'];
    alwaysNext?: boolean;
    tags: readonly GameplayTag[];
  } & (
      | {
          attribute: HealCalculationAttribute;
          attributeSource?: 'target';
          multiplier: number | ActionValueOperand;
          addition: number | ActionValueOperand;
          amount?: never;
        }
      | {
          amount: number | ActionValueOperand;
          attribute?: never;
          multiplier?: never;
          addition?: never;
        }
    );
  applyBuff: Omit<CombatStepParameters['applyBuff'], 'definition' | 'blackboardAssignments'> & {
    readonly definition?: ResolvedSkillBuffDefinition;
    readonly blackboardAssignments?: Readonly<Record<string, ActionValueOperand>>;
  };
  createGlobalBuff: Omit<CombatStepParameters['createGlobalBuff'], 'definition'> & {
    readonly definition: SkillGlobalBuffDefinition;
  };
  finishParentGlobalBuff: CombatStepParameters['finishParentGlobalBuff'];
  finishGlobalBuffsById: CombatStepParameters['finishGlobalBuffsById'];
  readSkillSettingData: CombatStepParameters['readSkillSettingData'];
  readBuffBlackboard: CombatStepParameters['readBuffBlackboard'];
  readEventBuffBlackboard: CombatStepParameters['readEventBuffBlackboard'];
  readCurrentBuffRemainingDuration: CombatStepParameters['readCurrentBuffRemainingDuration'];
  readBuffRemainingDuration: CombatStepParameters['readBuffRemainingDuration'];
  setCurrentBuffRemainingDuration: CombatStepParameters['setCurrentBuffRemainingDuration'];
  refreshCurrentBuffAttributeModifiers: CombatStepParameters['refreshCurrentBuffAttributeModifiers'];
  readBuffStackCount: CombatStepParameters['readBuffStackCount'];
  finishBuffsByTag: CombatStepParameters['finishBuffsByTag'];
  finishBuffsById: CombatStepParameters['finishBuffsById'];
  finishCurrentBuff: CombatStepParameters['finishCurrentBuff'];
  skillAffix: CombatStepParameters['skillAffix'];
  setCurrentBuffTimePaused: CombatStepParameters['setCurrentBuffTimePaused'];
  igniteBuffs: CombatStepParameters['igniteBuffs'];
  adjustSkillCooldown: CombatStepParameters['adjustSkillCooldown'];
  holdBuffsById: CombatStepParameters['holdBuffsById'];
  inheritBuffById: CombatStepParameters['inheritBuffById'];
  createTimedMarker: CombatStepParameters['createTimedMarker'];
  setGlobalCooldown: CombatStepParameters['setGlobalCooldown'];
  createAbilityEntityTimedMarker: CombatStepParameters['createAbilityEntityTimedMarker'];
  startTimeDilation: CombatStepParameters['startTimeDilation'];
  startUltimateTimeDilation: CombatStepParameters['startUltimateTimeDilation'];
  hideUi: CombatStepParameters['hideUi'];
  setIgnoreGlobalTimeScale: CombatStepParameters['setIgnoreGlobalTimeScale'];
  storeCurrentTimelineFrame: CombatStepParameters['storeCurrentTimelineFrame'];
  storeEventSpGainAmount: CombatStepParameters['storeEventSpGainAmount'];
  storeEventHealValues: CombatStepParameters['storeEventHealValues'];
  storeShieldValue: CombatStepParameters['storeShieldValue'];
  modifyActionValue: CombatStepParameters['modifyActionValue'];
  calculateActionValue: CombatStepParameters['calculateActionValue'];
  storeSourceAttributeValue: CombatStepParameters['storeSourceAttributeValue'];
  storeEntityPropertyValue: CombatStepParameters['storeEntityPropertyValue'];
  setHealthFloor: CombatStepParameters['setHealthFloor'];
  changeResource: {
    resource: CombatResource;
    amount: number;
    coefficient?: number;
    recipient: ResourceRecipient;
    spGainKind?: SpGainKind;
    spGainSource?: SpGainSource;
    isPercentValue?: boolean;
    ultimateRecoveryTag?: GameplayTag;
    ignoreUltimateEnergyGainMultiplier?: boolean;
  };
  changeResourceByActionValue: Omit<
    CombatStepParameters['changeResourceByActionValue'],
    'coefficient' | 'ultimateRecoveryTag'
  > & {
    coefficient?: number | ActionValueOperand;
    ultimateRecoveryTag?: GameplayTag;
  };
  recoverDashEnergy: CombatStepParameters['recoverDashEnergy'];
  recordPerfectDodge: CombatStepParameters['recordPerfectDodge'];
  gainSquadUltimateEnergyFromSkillCost: { coefficient: number };
  gainFinisherSp: CombatStepParameters['gainFinisherSp'];
  restrictUltimateEnergyRecovery: Omit<
    CombatStepParameters['restrictUltimateEnergyRecovery'],
    'allowedRecoveryTags'
  > & { readonly allowedRecoveryTags: readonly GameplayTag[] };
  applyStatus: {
    statusKey: string;
    target: 'caster' | 'enemy';
    durationFrames?: number;
    stacks?: number;
    maxStacks?: number;
    modifiers?: readonly ResolvedStatusModifier[];
  };
  consumeStatus: CombatStepParameters['consumeStatus'];
  jumpTimeline: CombatStepParameters['jumpTimeline'];
  finishTimeline: CombatStepParameters['finishTimeline'];
  reachSkillOperableBoundary: CombatStepParameters['reachSkillOperableBoundary'];
  markCurrentSkillCanDash: CombatStepParameters['markCurrentSkillCanDash'];
  markCurrentSkillCanInterrupt: CombatStepParameters['markCurrentSkillCanInterrupt'];
  conditional: CombatStepParameters['conditional'];
  switch: CombatStepParameters['switch'];
  once: CombatStepParameters['once'];
  repeatEachTick: CombatStepParameters['repeatEachTick'];
  launchProjectile: CombatStepParameters['launchProjectile'];
  setContextFlag: CombatStepParameters['setContextFlag'];
  openComboWindow: CombatStepParameters['openComboWindow'];
  showComboRingQte: CombatStepParameters['showComboRingQte'];
  changeSkillSlot: CombatStepParameters['changeSkillSlot'];
  overrideBasicAttackMapping: CombatStepParameters['overrideBasicAttackMapping'];
  overrideMultiDashLimit: CombatStepParameters['overrideMultiDashLimit'];
  changePlayerActionMode: CombatStepParameters['changePlayerActionMode'];
  changeNativeSkillType: CombatStepParameters['changeNativeSkillType'];
  setCharacterPassiveUiValue: CombatStepParameters['setCharacterPassiveUiValue'];
  inheritSkillCastInfoForBasicAttack: CombatStepParameters['inheritSkillCastInfoForBasicAttack'];
  castSkillDuringAction: CombatStepParameters['castSkillDuringAction'];
  withActionBlackboardScope: {
    scopeKey: string;
    lifetime?: 'parent' | 'execution';
    alwaysNext?: boolean;
    shareParentBlackboard?: boolean;
    initialValues: Readonly<Record<string, number>>;
    inheritParent: boolean;
    entityInitialValues?: Readonly<Record<string, number>>;
    entityAssignments?: Readonly<Record<string, ActionValueOperand>>;
  };
  listenForCombatEvents: {
    responses: readonly {
      readonly key: string;
      readonly event: CombatEventTrigger;
      readonly phase?: 'dataAction' | 'skill';
      readonly priority?: number;
      readonly condition?: CombatCondition;
      readonly sequence: ResolvedActionSequence;
    }[];
  };
}

type ResolvedCombatStepNode<K extends CombatStepKind> = {
  readonly key?: string;
  /** 存档中的命中身份（放置时分配）；伤害回执凭它把伤害对应到具体命中点。 */
  readonly hitId?: string;
  readonly kind: K;
  readonly parameters: Readonly<ResolvedCombatStepParameters[K]>;
} & (K extends 'conditional'
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
      : K extends 'withActionBlackboardScope'
        ? { readonly body: ResolvedActionSequence }
        : K extends 'repeatEachTick'
          ? { readonly body: ResolvedActionSequence }
          : K extends 'repeatByActionValue'
            ? { readonly body: ResolvedActionSequence }
            : K extends 'launchProjectile'
              ? {
                  readonly callbacks: readonly {
                    readonly event: 'hit' | 'block' | 'reach' | 'finish';
                    readonly skill: CompiledProjectileCallbackSkillProgram;
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
  mergeContextTargets: 'operation',
  findCharacterTeamTargets: 'operation',
  findUnfinishedProjectileTargets: 'operation',
  createSpatialPointTargets: 'operation',
  findOwnerSpawnedAbilityEntities: 'operation',
  pickContextTarget: 'operation',
  forEachContextTarget: 'sequence',
  readAbilityEntityRemainingDuration: 'operation',
  setAbilityEntityRemainingDuration: 'operation',
  finishCurrentAbilityEntity: 'operation',
  finishActionOwnerAbilityEntity: 'operation',
  finishCurrentAbilityEntityWhenSourceDies: 'operation',
  startCurrentAbilityEntityChildSkill: 'operation',
  startCurrentAbilityEntityChildSkillById: 'operation',
  spawnAbilityEntity: 'operation',
  applyElementalInfliction: 'operation',
  triggerSpellBurst: 'operation',
  triggerCustomAbilityEvent: 'operation',
  castSkillDuringAction: 'operation',
  applyPhysicalInfliction: 'operation',
  applyKnockDown: 'operation',
  applyElementalReaction: 'operation',
  consumeElementalReaction: 'operation',
  outputAirborne: 'operation',
  outputKnockDown: 'operation',
  dealDamage: 'operation',
  dealFixedDamage: 'operation',
  dealStagger: 'operation',
  heal: 'operation',
  applyBuff: 'operation',
  createGlobalBuff: 'operation',
  finishParentGlobalBuff: 'operation',
  finishGlobalBuffsById: 'operation',
  readSkillSettingData: 'operation',
  readBuffBlackboard: 'operation',
  readEventBuffBlackboard: 'operation',
  readCurrentBuffRemainingDuration: 'operation',
  readBuffRemainingDuration: 'operation',
  setCurrentBuffRemainingDuration: 'operation',
  refreshCurrentBuffAttributeModifiers: 'operation',
  skillAffix: 'operation',
  readBuffStackCount: 'operation',
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
  createAbilityEntityTimedMarker: 'operation',
  startTimeDilation: 'operation',
  startUltimateTimeDilation: 'operation',
  hideUi: 'operation',
  setIgnoreGlobalTimeScale: 'operation',
  storeCurrentTimelineFrame: 'operation',
  storeEventSpGainAmount: 'operation',
  storeEventHealValues: 'operation',
  storeShieldValue: 'operation',
  modifyActionValue: 'operation',
  calculateActionValue: 'operation',
  storeSourceAttributeValue: 'operation',
  storeEntityPropertyValue: 'operation',
  setHealthFloor: 'operation',
  changeResource: 'operation',
  changeResourceByActionValue: 'operation',
  recoverDashEnergy: 'operation',
  recordPerfectDodge: 'operation',
  gainSquadUltimateEnergyFromSkillCost: 'operation',
  gainFinisherSp: 'operation',
  applyStatus: 'operation',
  consumeStatus: 'operation',
  jumpTimeline: 'sequence',
  finishTimeline: 'sequence',
  reachSkillOperableBoundary: 'sequence',
  markCurrentSkillCanDash: 'sequence',
  markCurrentSkillCanInterrupt: 'sequence',
  conditional: 'sequence',
  switch: 'sequence',
  once: 'sequence',
  withActionBlackboardScope: 'sequence',
  repeatEachTick: 'sequence',
  repeatByActionValue: 'sequence',
  launchProjectile: 'sequence',
  setContextFlag: 'operation',
  openComboWindow: 'operation',
  showComboRingQte: 'operation',
  changeSkillSlot: 'operation',
  overrideBasicAttackMapping: 'operation',
  overrideMultiDashLimit: 'operation',
  changePlayerActionMode: 'operation',
  changeNativeSkillType: 'operation',
  setCharacterPassiveUiValue: 'operation',
  inheritSkillCastInfoForBasicAttack: 'operation',
  listenForCombatEvents: 'sequence',
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

/** 已解析且严格保持声明顺序的同步操作序列。 */
export interface ResolvedActionSequence {
  readonly steps: readonly ResolvedCombatStep[];
}

/** 构筑编译出的常驻被动程序；由战斗装配层启用，不进入时间轴技能集合。 */
export interface CompiledOperatorPassiveProgram {
  readonly key: string;
  readonly initialBlackboard: Readonly<Record<string, number>>;
  readonly enableSequence: ResolvedActionSequence;
  readonly abilityEventResponses?: readonly (Omit<
    NonNullable<
      import('../../../packages/game-data-contract/src/operators').OperatorPassiveSkillDefinition['abilityEventResponses']
    >[number],
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
  /** 路由包装器的行为养成补丁按真实执行体身份匹配；费用和冷却仍使用槽位身份。 */
  readonly executionSkillGroupKey?: string;
  readonly executionSkillId?: string;
  /** 只有玩家操作、伤害分类或对应事件确实需要时才存在；原生实体技能不得伪造。 */
  readonly skillType?: SkillType;
  /** 原生技能实例的初始可变分类；不同于伤害/养成使用的 Endaxis skillType。 */
  readonly nativeSkillType?: import('../game-data/operatorDefinition').NativeSkillType;
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
  readonly inputWindows?: import('../game-data/operatorDefinition').SkillDefinition['inputWindows'];
  readonly cooldownFrames?: number;
  readonly costFrame?: number;
  readonly costs: readonly CompiledSkillCost[];
  readonly switchToBuffCast?: {
    readonly currentSkillTypes?: readonly SkillType[];
    readonly requiresCurrentSkillNotInterruptible?: boolean;
    readonly condition?: CombatCondition;
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
  | 'skillType'
  | 'inputWindows'
  | 'cooldownFrames'
  | 'costFrame'
>;

/** 一个稳定技能组可在释放之间切换的已编译技能身份。 */
export interface CompiledSkillSlotGroup {
  readonly skillGroupKey: string;
  readonly input?: import('../game-data/operatorDefinition').PlayerSkillInput;
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
  /** 由具体技能身份反查得到，仅用于把候选窗口投影回稳定输入槽。 */
  readonly skillGroupKey: string;
  /** 角色模板注册条件时绑定的具体技能；不随槽位替换状态漂移。 */
  readonly skillKey: string;
  readonly event: import('../game-data/operatorDefinition').ComboSkillConditionDefinition['event'];
  readonly immediately: boolean;
  /** null 为禁用，{} 为启用空板；字符串/空值不降格成数值。 */
  readonly initialValues: Readonly<Record<string, number | string | null>> | null;
  readonly sequence: ResolvedActionSequence;
}

export type { ElementalReaction, StatusModifierDefinition };
