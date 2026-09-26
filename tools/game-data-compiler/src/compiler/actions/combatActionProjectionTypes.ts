import type {
  CombatStepKind,
  CombatStepParameters,
  ActionSwitchOptionDefinition,
  CombatEventResponseDefinition,
} from '../../../../../packages/game-data-contract/src/actions.ts';
import type {
  ActionValueOperand,
  CombatCondition,
  TimeScaleCurveDefinition,
} from '../../../../../packages/game-data-contract/src/conditions.ts';
import type { AbilityEntityTargetQuery } from '../../../../../packages/game-data-contract/src/skills.ts';

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
  | Condition<'globalCooldownPresent'>
  | Condition<'casterComboPending'>
  | Condition<'eventComboRingQteSucceeded'>
  | Condition<
      | 'casterControlled'
      | 'characterTypeIn'
      | 'operatorRoleIn'
      | 'currentBuffStackCompare'
      | 'deckAttributeCompare'
      | 'eventInflictionElementIn'
      | 'eventCustomAbilityNameMatch'
      | 'contextTargetCountCompare'
      | 'contextTargetObjectTypeMatch'
      | 'actionInputTargetObjectTypeMatch'
      | 'actionInputTargetIdentityMatch'
      | 'contextTargetIdentityMatch'
      | 'contextTargetEntityTagMatch'
      | 'contextTargetBuffStackCompare'
      | 'contextTargetBuffIdStackCompare'
      | 'abilityEntityRemainingDurationCompare'
      | 'actionValueCompare'
      | 'eventOverheal'
      | 'eventSkillCastMatchesBuffSource'
      | 'eventSkillIdIn'
      | 'eventBuffIdMatch'
      | 'eventSourceTargetMatch'
      | 'eventSourceMatchesBuffSource'
      | 'eventSourceControlled'
      | 'buffSourceMatchesOwner'
      | 'ownerSpawnedAbilityEntityPresent'
      | 'eventActionOwnerTargetMatch'
      | 'eventPhysicalInflictionTypeIn'
      | 'eventDamageTypeIn'
      | 'eventHealTagsMatch'
      | 'eventConsumedBuffLayerCompare'
      | 'contextTargetContains'
      | 'eventBuffTagsMatch'
      | 'eventTargetBuffCountCompare'
      | 'enemySuperArmorCompare'
      | 'enemyRankIn'
      | 'targetStaggered'
      | 'probability'
      | 'abilityEntityTimedMarkerPresent'
      | 'eventProjectilePerfectDodgeCooldownEquals'
      | 'eventProjectileIgnoreImmuneLevelCompare'
    >
  | (Condition<'healthCompare'> & {
      readonly target:
        'caster' | 'controlledOperator' | 'contextTarget' | 'currentTarget' | 'enemy';
    })
  | Condition<'eventDamageTagsMatch' | 'eventDamageGameplayTagsMatch' | 'eventDamageFeaturesMatch'>
  | Condition<'eventSpGainMatch'>
  | (Condition<'eventSkillTypeIn'> & {
      readonly skillTypes: readonly (
        'basicAttack' | 'plungingAttack' | 'battleSkill' | 'comboSkill' | 'ultimate'
      )[];
    })
  | (Condition<'currentSkillTypeIn'> & {
      readonly target: 'caster' | 'buffOwner';
      readonly skillTypes: readonly (
        'basicAttack' | 'plungingAttack' | 'battleSkill' | 'comboSkill' | 'ultimate'
      )[];
    })
  | (Condition<'originSkillTypeIn'> & {
      readonly skillTypes: readonly (
        'basicAttack' | 'plungingAttack' | 'battleSkill' | 'comboSkill' | 'ultimate'
      )[];
    })
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
  | (Condition<'poiseCompare'> & { readonly target: 'enemy' })
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
  readonly targets: readonly ('enemy' | 'caster' | 'controlled')[];
  readonly abilityEntityTargets?: readonly AbilityEntityTargetQuery[];
};

type ContextTargetSource = Parameters<'mergeContextTargets'>['sources'][number];
type BuffApplicationParameters = Omit<
  Parameters<'applyBuff'>,
  'definition' | 'durationSeconds' | 'effectiveness' | 'target' | 'source'
> & {
  readonly target:
    | 'caster'
    | 'actionInputTarget'
    | 'enemy'
    | 'currentAbilityEntity'
    | 'eventTarget'
    | 'eventSource'
    | 'buffOwner'
    | 'buffSource'
    | 'controlledOperator'
    | 'party'
    | 'partyExceptCaster'
    | 'partyExceptCasterAndSameCharacterType'
    | 'casterAndControlledOperator'
    | 'casterAndLowestHealthRatioOperatorExceptCaster'
    | 'currentTarget';
  readonly source?: 'enemy' | 'eventSource' | 'buffSource' | 'buffOwner' | 'currentAbilityEntity';
};

type DamageParameters = Pick<
  Parameters<'dealDamage'>,
  | 'damageType'
  | 'attackScale'
  | 'takeAttackSnapshot'
  | 'calculation'
  | 'calculationMultiplier'
  | 'calculationAttribute'
  | 'calculationAddition'
  | 'tags'
  | 'features'
  | 'stagger'
  | 'staggerMultiplier'
  | 'staggerOnlyWhenCasterControlled'
  | 'instantAttributeModifiers'
  | 'instantDamageScaleModifiers'
> & {
  readonly attackScale: CompiledActionValueOperandSource;
  readonly calculation?: 'breakingAttack' | 'attribute';
  readonly calculationMultiplier?: number;
  readonly calculationAttribute?: string;
  readonly calculationAddition?: CompiledActionValueOperandSource;
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
  | import('../../../../../packages/game-data-contract/src/actionGraph.ts').ActionGraphResourceCall
  | Step<'applyKnockDown'>
  | Step<'applyPhysicalInfliction'>
  | Step<'findCharacterTeamTargets'>
  | Step<'findUnfinishedProjectileTargets'>
  | Step<'createSpatialPointTargets'>
  | Step<'pickContextTarget'>
  | Step<'igniteBuffs'>
  | Step<'triggerSpellBurst'>
  | Step<'triggerCustomAbilityEvent'>
  | Step<'openComboWindow'>
  | Step<'showComboRingQte'>
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
  | (Step<
      'withActionBlackboardScope',
      Pick<
        Parameters<'withActionBlackboardScope'>,
        'scopeKey' | 'alwaysNext' | 'inheritParent' | 'shareParentBlackboard'
      > & {
        readonly lifetime: 'execution';
        readonly initialValues: Readonly<Record<string, number>>;
        readonly entityInitialValues?: Readonly<Record<string, number>>;
        readonly entityAssignments?: Readonly<Record<string, CompiledActionValueOperandSource>>;
      }
    > & { readonly body: CompiledBuffSequenceSource })
  | Step<
      'findOwnerSpawnedAbilityEntities',
      Pick<
        Parameters<'findOwnerSpawnedAbilityEntities'>,
        'saveToContextKey' | 'sameSourceSkillCast' | 'maxTargets' | 'abilityEntityIds'
      >
    >
  | Step<
      'spawnAbilityEntity',
      Required<Pick<Parameters<'spawnAbilityEntity'>, 'abilityEntityId' | 'dieWhenSourceDies'>> &
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
  | Step<'finishCurrentAbilityEntity'>
  | Step<'finishActionOwnerAbilityEntity'>
  | Step<
      'jumpTimeline',
      Pick<Parameters<'jumpTimeline'>, 'destinationFrame'> & {
        readonly condition?: CompiledBuffConditionSource;
      }
    >
  | Step<'finishTimeline'>
  | Step<'reachSkillOperableBoundary'>
  | Step<'markCurrentSkillCanDash'>
  | Step<'markCurrentSkillCanInterrupt'>
  | Step<'storeCurrentTimelineFrame'>
  | Step<'storeEventSpGainAmount'>
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
  | (Step<'repeatByActionValue'> & { readonly body: CompiledBuffSequenceSource })
  | (Step<'launchProjectile'> & {
      readonly callbacks: readonly {
        readonly event: 'hit' | 'block' | 'reach' | 'finish';
        readonly skill: {
          readonly actionGraph: import('../../../../../packages/game-data-contract/src/actionGraph.ts').ActionGraphResourceDefinition;
          readonly skillId: string;
          readonly nativeSkillType: import('../../../../../packages/game-data-contract/src/index.ts').NativeSkillType;
          readonly naturalDurationFrames: number;
          readonly castResource: import('../../../../../packages/game-data-contract/src/index.ts').SkillCastResourceDefinition;
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
  | Step<
      'mergeContextTargets',
      Pick<Parameters<'mergeContextTargets'>, 'saveToContextKey'> & {
        readonly sources: readonly ContextTargetSource[];
      }
    >
  | Step<'applyBuff', BuffApplicationParameters>
  | Step<'createGlobalBuff'>
  | Step<'finishParentGlobalBuff'>
  | Step<'finishGlobalBuffsById'>
  | Step<'readSkillSettingData'>
  | Step<'applyElementalInfliction'>
  | Step<
      'applyElementalReaction',
      Omit<Parameters<'applyElementalReaction'>, 'durationSeconds'> & {
        readonly durationSeconds: CompiledActionValueOperandSource;
      }
    >
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
  | Step<'storeShieldValue'>
  | Step<'calculateActionValue'>
  | Step<'readCurrentBuffRemainingDuration'>
  | Step<'readBuffRemainingDuration'>
  | Step<'setCurrentBuffRemainingDuration'>
  | Step<'refreshCurrentBuffAttributeModifiers'>
  | Step<
      'changeResourceByActionValue',
      Parameters<'changeResourceByActionValue'> & {
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
  | Step<
      'finishBuffsById',
      Parameters<'finishBuffsById'> & {
        readonly target:
          | 'buffOwner'
          | 'buffSource'
          | 'caster'
          | 'enemy'
          | 'currentAbilityEntity'
          | 'currentTarget'
          | 'party'
          | 'partyExceptCaster';
        readonly reason: 'early' | 'absorbed' | 'other';
      }
    >
  | Step<'finishBuffsByTag'>
  | Step<'createTimedMarker', Parameters<'createTimedMarker'> & { readonly target: MarkerTarget }>
  | Step<'setGlobalCooldown'>
  | Step<'createAbilityEntityTimedMarker'>
  | Step<'finishCurrentBuff'>
  | Step<'skillAffix'>
  | Step<'setCurrentBuffTimePaused'>;

export type CompiledBuffSequenceSource =
  import('../../../../../packages/game-data-contract/src/actionGraph.ts').ActionGraphReference;
