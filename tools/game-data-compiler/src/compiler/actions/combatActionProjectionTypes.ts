import type { ActionGraphReference } from '../../../../../packages/game-data-contract/src/actionGraph.ts';
import type {
  NativeSkillType,
  SkillCastResourceDefinition,
} from '../../../../../packages/game-data-contract/src/index.ts';
import type { AbilityEntityTargetQuery } from '../../../../../packages/game-data-contract/src/skills.ts';
import { COMPILED_BUFF_TARGET_KINDS } from '../buffs/compiledBuffMetadata.ts';
import type {
  ActionGraphResourceCall,
  ActionGraphResourceDefinition,
  ActionSwitchOptionDefinition,
  ActionValueOperand,
  CombatCondition,
  CombatEventResponseDefinition,
  CombatStepKind,
  CombatStepParameters,
  TimeScaleCurveDefinition,
} from '../intermediateDefinitions.ts';

/**
 * 公共动作投影的输出子集，不是第二套游戏 schema。
 * 字段来自独立契约；这里只声明已接入的种类、窄枚举和递归子树。
 * 扩大支持仍须修改来源解析及投影规则，不能只放宽类型。
 */
export type CompiledActionValueOperandSource = Readonly<ActionValueOperand>;

type Condition<K extends CombatCondition['kind']> = Readonly<Extract<CombatCondition, { kind: K }>>;
type Parameters<K extends CombatStepKind> = Readonly<CombatStepParameters[K]>;
type Step<K extends CombatStepKind, P extends CombatStepParameters[K] = CombatStepParameters[K]> = {
  readonly kind: K;
  readonly parameters: Readonly<P>;
};

// 下列目标限制分别对应当前已审计的查询、标记和技能事件，不互相替代。
type BuffQueryTarget =
  | 'caster'
  | 'enemy'
  | 'controlledOperator'
  | 'currentAbilityEntity'
  | 'eventTarget'
  | 'actionInputTarget'
  | 'buffOwner'
  | 'buffSource'
  | 'currentTarget';
type MarkerTarget =
  'caster' | 'enemy' | 'eventTarget' | 'buffOwner' | 'buffSource' | 'currentAbilityEntity';

export type CompiledBuffConditionSource =
  | Condition<'constant'>
  | Condition<'skillHasHit'>
  | Condition<'comboCameraAlphaSetting'>
  | Condition<'globalCooldownPresent'>
  | Condition<'casterComboPending'>
  | Condition<
      | 'casterControlled'
      | 'characterTypeIn'
      | 'operatorRoleIn'
      | 'currentBuffStackCompare'
      | 'deckAttributeCompare'
      | 'eventInflictionElementIn'
      | 'eventCustomAbilityNameMatch'
      | 'entityCountCompare'
      | 'contextTargetObjectTypeMatch'
      | 'actionInputTargetObjectTypeMatch'
      | 'actionInputTargetIdentityMatch'
      | 'contextTargetIdentityMatch'
      | 'contextTargetEntityTagMatch'
      | 'contextTargetBuffStackCompare'
      | 'contextTargetBuffIdStackCompare'
      | 'abilityEntityRemainingDurationCompare'
      | 'actionValueCompare'
      | 'stringEquals'
      | 'eventOverheal'
      | 'eventSkillCastMatchesBuffSource'
      | 'eventSkillIdIn'
      | 'eventBuffIdMatch'
      | 'eventSourceMatchesBuffSource'
      | 'eventSourceMatchesBuffSourceEntitySource'
      | 'buffSourceMatchesOwner'
      | 'ownerSpawnedAbilityEntityPresent'
      | 'eventPhysicalInflictionTypeIn'
      | 'eventDamageTypeIn'
      | 'eventTransferredPartTagsMatch'
      | 'eventHealTagsMatch'
      | 'eventConsumedBuffLayerCompare'
      | 'eventBuffEnhanceLayerCompare'
      | 'targetContains'
      | 'eventBuffTagsMatch'
      | 'eventTargetBuffCountCompare'
      | 'enemySuperArmorCompare'
      | 'twoDirectionAngleCompare'
      | 'targetFacingAngle'
      | 'targetDistance'
      | 'enemyRankIn'
      | 'targetStaggered'
      | 'probability'
      | 'abilityEntityTimedMarkerPresent'
      | 'eventProjectilePerfectDodgeCooldownEquals'
      | 'eventAbilityEntityFinishReasonIn'
      | 'eventProjectileIgnoreImmuneLevelCompare'
    >
  | (Condition<'healthCompare'> & {
      readonly target:
        | 'caster'
        | 'controlledOperator'
        | 'contextTarget'
        | 'currentTarget'
        | 'actionInputTarget'
        | 'enemy';
    })
  | Condition<'eventDamageTagsMatch' | 'eventDamageGameplayTagsMatch' | 'eventDamageFeaturesMatch'>
  | Condition<'eventSpGainMatch'>
  | Condition<'skillDamageTypeIn'>
  | Condition<'skillInterruptReasonIn'>
  | Condition<'eventSkillTypeIn'>
  | Condition<'currentSkillTypeIn'>
  | Condition<'originSkillTypeIn'>
  | (Condition<'timedMarkerPresent'> & { readonly target: MarkerTarget })
  | (Omit<Condition<'buffStackCompare'>, 'target'> & {
      readonly target: BuffQueryTarget;
    })
  | (Omit<Condition<'buffTagIdCountCompare'>, 'target'> & {
      readonly target: BuffQueryTarget;
    })
  | (Omit<Condition<'buffBlackboardValueCompare'>, 'target'> & {
      readonly target: BuffQueryTarget | 'eventSource';
    })
  | (Omit<Condition<'buffIdStackCompare'>, 'target' | 'value'> & {
      readonly target: BuffQueryTarget;
      readonly value: CompiledActionValueOperandSource;
    })
  | (Condition<'entityTagMatch'> & { readonly target: BuffQueryTarget })
  | Condition<'poiseCompare'>
  | (Pick<Condition<'all' | 'any'>, 'kind'> & {
      readonly conditions: readonly CompiledBuffConditionSource[];
    })
  | (Pick<Condition<'not'>, 'kind'> & {
      readonly condition: CompiledBuffConditionSource;
    });

type GlobalTimeDilation = Omit<
  Extract<Parameters<'startTimeDilation'>, { scope: 'global' }>,
  'influenceSkillCooldownSeconds' | 'curve' | 'ignoredTargets' | 'ignoredAbilityEntityTargets'
> & {
  readonly curve: TimeScaleCurveDefinition;
  readonly ignoredTargets: readonly ('controlled' | 'caster')[];
  readonly ignoredAbilityEntityTargets?: readonly [{ readonly kind: 'current' | 'ownerSpawned' }];
};
type EntityTimeDilation = Omit<
  Extract<Parameters<'startTimeDilation'>, { scope: 'entity' }>,
  'abilityEntityTargets' | 'ignoreSlotCheck' | 'curve' | 'targets'
> & {
  readonly curve: TimeScaleCurveDefinition;
  readonly targets: Extract<Parameters<'startTimeDilation'>, { scope: 'entity' }>['targets'];
  readonly abilityEntityTargets?: readonly AbilityEntityTargetQuery[];
};

type ContextTargetSource = Parameters<'mergeContextTargets'>['sources'][number];
type DamageParameters = Pick<
  Parameters<'dealDamage'>,
  | 'target'
  | 'damageType'
  | 'attackScale'
  | 'takeAttackSnapshot'
  | 'calculation'
  | 'calculationMultiplier'
  | 'calculationAttribute'
  | 'calculationAddition'
  | 'calculationValue'
  | 'calculationValueScale'
  | 'tags'
  | 'features'
  | 'stagger'
  | 'staggerMultiplier'
  | 'staggerOnlyWhenCasterControlled'
  | 'instantAttributeModifiers'
  | 'instantDamageScaleModifiers'
> & {
  readonly attackScale: CompiledActionValueOperandSource;
  readonly calculation?: 'breakingAttack' | 'attribute' | 'definite';
  readonly calculationMultiplier?: number;
  readonly calculationAttribute?: string;
  readonly calculationAddition?: CompiledActionValueOperandSource;
  readonly calculationValue?: CompiledActionValueOperandSource;
  readonly calculationValueScale?: CompiledActionValueOperandSource;
  readonly tags: readonly (
    | 'normalAttack'
    | 'normalAttackLastCombo'
    | 'powerAttack'
    | 'plungingAttack'
    | 'dashAttack'
    | 'normalSkill'
    | 'ultimateSkill'
    | 'comboSkill'
    | 'fireBurst'
    | 'electricBurst'
    | 'cryoBurst'
    | 'natureBurst'
    | 'fireAbnormal'
    | 'cryoAbnormal'
  )[];
  readonly gameplayTags?: Parameters<'dealDamage'>['gameplayTags'];
  readonly features?: readonly (
    | 'canBreakWeakness'
    | 'dot'
    | 'remainArea'
    | 'talentDamage'
    | 'knockDown'
    | 'physicalInfliction'
    | 'shatter'
  )[];
  readonly stagger?: CompiledActionValueOperandSource;
  readonly staggerMultiplier?: CompiledActionValueOperandSource;
};
export type CompiledSimpleDamageOperationSource = Step<'dealDamage', DamageParameters>;
export type CompiledSimplePoiseOperationSource = Step<'dealStagger'>;

type HealParameters = (
  | {
      readonly target: 'contextTarget';
      readonly contextKey: string;
    }
  | {
      readonly target:
        | 'enemy'
        | 'caster'
        | 'buffOwner'
        | 'controlledOperator'
        | 'currentTarget'
        | 'actionInputTarget';
      readonly contextKey?: never;
    }
) & {
  readonly source?: 'buffOwner';
  readonly alwaysNext?: boolean;
  readonly tags: Parameters<'heal'>['tags'];
} & (
    | {
        readonly amount: CompiledActionValueOperandSource;
        readonly attribute?: never;
        readonly multiplier?: never;
        readonly addition?: never;
      }
    | {
        readonly amount?: never;
        readonly attribute: 'strength' | 'agility' | 'intellect' | 'will' | 'maxHealth';
        readonly attributeSource?: 'target';
        readonly multiplier: CompiledActionValueOperandSource;
        readonly addition: CompiledActionValueOperandSource;
      }
  );

export type CompiledBuffStepSource =
  | Step<'checkCondition'>
  | Step<'invertNextResult'>
  | (Step<'anyCondition'> & { readonly conditions: readonly CombatCondition[] })
  | (Step<'ifElse'> & {
      readonly condition: CombatCondition;
      readonly whenTrue: CompiledBuffSequenceSource;
      readonly whenFalse: CompiledBuffSequenceSource;
    })
  | ActionGraphResourceCall
  | Step<'applyPhysicalInfliction'>
  | Step<'findCharacterTeamTargets'>
  | Step<'createSpatialPointTargets'>
  | Step<'pickContextTarget'>
  | Step<'saveTransferredSource'>
  | Step<'igniteBuffs'>
  | Step<'triggerSpellBurst'>
  | Step<'triggerCustomAbilityEvent'>
  | Step<'openComboWindow'>
  | (Step<'playAnimation'> & { readonly onEnd: CompiledBuffSequenceSource })
  | (Step<'showComboRingQte'> & { readonly triggeredAction: CompiledBuffSequenceSource })
  | Step<'castSkillDuringAction'>
  | Step<'changeSkillSlot'>
  | Step<'overrideBasicAttackMapping'>
  | Step<'overrideMultiDashLimit'>
  | Step<'changePlayerActionMode'>
  | Step<'changeNativeSkillType'>
  | Step<'setCharacterPassiveUiValue'>
  | Step<'inheritSkillCastInfoForBasicAttack'>
  | Step<'startCurrentAbilityEntityChildSkillById'>
  | Step<'startTimeDilation', GlobalTimeDilation | EntityTimeDilation>
  | Step<'setIgnoreGlobalTimeScale'>
  | Step<'hideUi'>
  | Step<
      'startUltimateTimeDilation',
      Pick<Parameters<'startUltimateTimeDilation'>, 'priority' | 'targetScale'> & {
        readonly ignoredTargets: readonly [];
      }
    >
  | Step<'findOwnerSpawnedAbilityEntities', Parameters<'findOwnerSpawnedAbilityEntities'>>
  | Step<
      'spawnAbilityEntity',
      Required<
        Pick<Parameters<'spawnAbilityEntity'>, 'abilityEntityId' | 'dieWhenSourceDies' | 'bornAt'>
      > &
        Pick<
          Parameters<'spawnAbilityEntity'>,
          | 'childSkillId'
          | 'inheritActionBlackboard'
          | 'inheritSourceSkillCastInfo'
          | 'target'
          | 'overrideDurationSeconds'
          | 'saveToContextKey'
          | 'blackboardAssignments'
          | 'stringBlackboardAssignments'
        >
    >
  | Step<'setAbilityEntityRemainingDuration'>
  | Step<'finishOwner'>
  | Step<'interruptCurrentSkill'>
  | (Step<'jumpTimeline'> & { readonly condition: CombatCondition })
  | Step<'reachSkillOperableBoundary'>
  | Step<'markCurrentSkillCanDash'>
  | Step<'markCurrentSkillCanInterrupt'>
  | Step<'storeCharacterTypeId'>
  | Step<'findCharacterBySquadSlot'>
  | Step<'storeCharacterTypeBySquadSlot'>
  | Step<'storeCurrentTimelineFrame'>
  | Step<'storeEventSpGainAmount'>
  | Step<'listenForTagQuery'>
  | Step<
      'listenForCombatEvents',
      {
        readonly responses: readonly (Omit<
          CombatEventResponseDefinition,
          'sequence' | 'condition'
        > & {
          readonly condition?: CompiledBuffConditionSource;
          readonly sequence: CompiledBuffSequenceSource;
        })[];
      }
    >
  | (Step<'forEachContextTarget'> & { readonly body: CompiledBuffSequenceSource })
  | (Step<'repeatEachTick'> & { readonly body: CompiledBuffSequenceSource })
  | (Step<'launchProjectile'> & {
      readonly callbacks: readonly {
        readonly event: 'launch' | 'hit' | 'block' | 'reach' | 'finish';
        readonly skill: {
          readonly actionGraph: ActionGraphResourceDefinition;
          readonly skillId: string;
          readonly nativeSkillType: NativeSkillType;
          readonly normalSkillSubType?: 'normal' | 'additionalNormalSkill';
          readonly naturalDurationFrames: number;
          readonly castResource: SkillCastResourceDefinition;
          readonly blackboard: Readonly<Record<string, number>>;
          readonly scheduledSequences: readonly {
            readonly startFrame: number;
            readonly endFrame: number;
            readonly sequence: CompiledBuffSequenceSource;
          }[];
        };
      }[];
    })
  | (Step<'once'> & { readonly body: CompiledBuffSequenceSource })
  | (Step<'switch'> & {
      readonly options: readonly (Omit<ActionSwitchOptionDefinition, 'sequence'> & {
        readonly sequence: CompiledBuffSequenceSource;
      })[];
    })
  | Step<'saveTwoDirectionAngle'>
  | Step<'copyContextTargets'>
  | Step<'findTargets'>
  | Step<
      'mergeContextTargets',
      Pick<Parameters<'mergeContextTargets'>, 'saveToContextKey'> & {
        readonly sources: readonly ContextTargetSource[];
      }
    >
  | (Step<
      'aura',
      Parameters<'aura'> & {
        readonly [COMPILED_BUFF_TARGET_KINDS]?: {
          readonly target: string;
          readonly source?: string;
        };
      }
    > & {
      readonly onEnter: CompiledBuffSequenceSource;
      readonly onExit: CompiledBuffSequenceSource;
    })
  | Step<
      'applyBuff',
      Parameters<'applyBuff'> & {
        readonly [COMPILED_BUFF_TARGET_KINDS]?: {
          readonly target: string;
          readonly source?: string;
        };
      }
    >
  | Step<'createGlobalBuff'>
  | Step<'finishParentGlobalBuff'>
  | Step<'finishGlobalBuffsById'>
  | Step<'readSkillSettingData'>
  | Step<'triggerCharacterInflictionEvent'>
  | Step<'applyCharacterInfliction'>
  | Step<'applyElementalInfliction'>
  | Step<'forceSpellStatus'>
  | (Step<
      'conditional',
      Pick<Parameters<'conditional'>, 'alwaysNext'> & {
        readonly condition: CompiledBuffConditionSource;
      }
    > & {
      readonly whenTrue: CompiledBuffSequenceSource;
      readonly whenFalse?: CompiledBuffSequenceSource;
    })
  | Step<
      'readBuffStackCount',
      Pick<Parameters<'readBuffStackCount'>, 'outputKey'> & {
        readonly target: MarkerTarget | 'enemy';
        readonly countType?: 'instance';
        readonly query: Parameters<'readBuffStackCount'>['query'];
      }
    >
  | Step<'readEventBuffBlackboard'>
  | Step<'readBuffBlackboard'>
  | Step<
      'modifyActionValue',
      Parameters<'modifyActionValue'> & {
        readonly operation:
          'assign' | 'add' | 'multiply' | 'divide' | 'floor' | 'ceil' | 'roundToInt';
      }
    >
  | Step<'storeSourceAttributeValue'>
  | Step<'storeEntityPropertyValue'>
  | Step<'setHealthFloor'>
  | Step<'storeEventHealValues'>
  | Step<'storeEventDamageValue'>
  | Step<'storeShieldValue'>
  | Step<'calculateActionValue'>
  | Step<'storeRandomInteger'>
  | Step<'readBuffRemainingDuration'>
  | Step<'setBuffRemainingDuration'>
  | Step<'setCurrentBuffRemainingDuration'>
  | Step<'refreshCurrentBuffAttributeModifiers'>
  | Step<
      'changeResource',
      Parameters<'changeResource'> & {
        readonly coefficient: CompiledActionValueOperandSource;
      }
    >
  | Step<'recoverDashEnergy'>
  | Step<'recordPerfectDodge'>
  | Step<
      'gainSquadUltimateEnergyFromSkillCost',
      Omit<Parameters<'gainSquadUltimateEnergyFromSkillCost'>, 'coefficient'> & {
        readonly coefficient: number;
      }
    >
  | Step<'gainFinisherSp'>
  | Step<'restrictUltimateEnergyRecovery'>
  | Step<'adjustSkillCooldown'>
  | Step<'holdBuffsById'>
  | Step<'inheritBuffById'>
  | CompiledSimpleDamageOperationSource
  | CompiledSimplePoiseOperationSource
  | Step<'heal', HealParameters>
  | Step<'finishBuffsById'>
  | Step<'dispelBuffs'>
  | Step<'finishBuffsByTag'>
  | Step<'createTimedMarker'>
  | Step<'setGlobalCooldown'>
  | Step<'finishCurrentBuff'>
  | Step<'skillAffix'>
  | Step<'setCurrentBuffTimePaused'>;

export type CompiledBuffSequenceSource = ActionGraphReference;
