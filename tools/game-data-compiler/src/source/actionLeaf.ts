import {
  parseBlackboardCalculationActionSource,
  parseBlackboardMutationActionSource,
  parseAttributeSnapshotActionSource,
  parseEntityPropertySnapshotActionSource,
  parseRandomBlackboardActionSource,
  type BlackboardCalculationActionSource,
  type BlackboardMutationActionSource,
  type AttributeSnapshotActionSource,
  type EntityPropertySnapshotActionSource,
  type RandomBlackboardActionSource,
} from './blackboardActions.ts';
import {
  parseAdvancedBuffFinishActionSource,
  parseBuffApplicationActionSource,
  parseBuffIgniteActionSource,
  parseBuffHoldActionSource,
  parsePhysicalNoGuardStartedEventSource,
  type BuffIgniteActionSource,
  type BuffHoldActionSource,
  parseBuffInheritanceActionSource,
  parseLegacyBuffFinishActionSource,
  parseTaggedBuffFinishActionSource,
  type BuffApplicationActionSource,
  type BuffInheritanceActionSource,
  type BuffFinishActionSource,
} from './buffActions.ts';
import {
  parseBuffBlackboardReadActionSource,
  parseBuffLifeTimeReadActionSource,
  parseBuffDurationMutationActionSource,
  parseSimpleBuffStackReadActionSource,
  parseBuffStackReadActionSource,
  parseTaggedBuffStackReadActionSource,
  parseStoreBuffCountActionSource,
  type BuffBlackboardReadActionSource,
  type BuffLifeTimeReadActionSource,
  type BuffDurationMutationActionSource,
  type BuffStackReadActionSource,
} from './buffQueryActions.ts';
import {
  parseBuffTimePauseActionSource,
  type BuffTimePauseActionSource,
} from './buffTimeActions.ts';
import { parseConditionLeafSource, type NativeConditionSource } from './condition.ts';
import {
  parseCharacterTypeIdReadActionSource,
  type CharacterTypeIdReadActionSource,
} from './characterIdentityActions.ts';
import {
  collectNativeActionNodes,
  parseNativeSequenceSource,
  type NativeActionNodeSource,
  type NativeSequenceSource,
} from './controlFlow.ts';
import {
  parseChannelingCastingActionSource,
  type ChannelingCastingActionSource,
} from './castingControlActions.ts';
import {
  parseComboGlobalBuffActionSource,
  parseCreateGlobalBuffActionSource,
  parseFinishGlobalBuffActionSource,
  type GlobalBuffActionSource,
} from './globalBuffActions.ts';
import {
  parseSkillSettingReadActionSource,
  type SkillSettingReadActionSource,
} from './skillSettingActions.ts';
import { parseDamageActionSource, type DamageActionSource } from './damageActions.ts';
import {
  parseAirborneActionSource,
  parseKnockDownActionSource,
  parsePhysicalInflictionActionSource,
  type AirborneActionSource,
  type KnockDownActionSource,
  type PhysicalInflictionActionSource,
} from './physicalInflictionActions.ts';
import { parseHealActionSource, type HealActionSource } from './healActions.ts';
import {
  parseBreakInteractiveActionSource,
  type BreakInteractiveActionSource,
} from './environmentActions.ts';
import {
  parseElementalInflictionActionSource,
  parseCharacterSpellInflictionActionSource,
  parseForcedElementalStatusActionSource,
  parseSpellAbnormalLifecycleEventSource,
  parseSpellInflictionStartedEventSource,
  parseTriggerSpellBurstEventSource,
  parseForceTriggerWeaknessEventSource,
  type ElementalInflictionActionSource,
  type CharacterSpellInflictionActionSource,
  type ForcedElementalStatusActionSource,
  type SpellAbnormalLifecycleEventSource,
  type SpellInflictionStartedEventSource,
  type TriggerSpellBurstEventSource,
  type ForceTriggerWeaknessEventSource,
} from './elementalInflictionActions.ts';
import { parseFinishOwnerActionSource, type FinishOwnerActionSource } from './lifecycleActions.ts';
import {
  nativeActionName,
  requireArray,
  requireBoolean,
  requireExactFields,
  requireInteger,
  requireNonEmptyString,
  requireRecord,
} from './primitives.ts';
import {
  parseDebugPrintActionSource,
  parseCameraPresentationActionSource,
  parseInheritedCameraControlStateActionSource,
  parseCameraRotateActionSource,
  parseAnimatedCameraActionSource,
  parseHideUiActionSource,
  parseLockCameraAimActionSource,
  parseUltimateShowActionSource,
  parseWeaponVisibilityActionSource,
  parseWeaponAnimationActionSource,
  parseSetAnimatorParameterActionSource,
  parseIgniteBuffTextActionSource,
  parseImmuneTextActionSource,
  parseModifyWeaponMountPointActionSource,
  parseVoiceTriggerActionSource,
  parseVoiceInterruptActionSource,
  parseOverrideCameraFollowActionSource,
  parseTemporaryUnlockActionSource,
  parseIgnoreModelIntervalCheckActionSource,
  parseEffectActionSource,
  parseShowHideActorActionSource,
  parsePlayAnimationActionSource,
  parsePlayAnimationWithStepActionSource,
  parsePlaySoundActionSource,
  parseLiinoUiEventActionSource,
  parseNoopSpecificLayerChangeActionSource,
  parseForceTargetInFightActionSource,
  parseInterruptHenshinTagListenerActionSource,
  parseSetStrafeModeActionSource,
  parseBombClearActionSource,
  parseSkillTypeMutationSource,
  parseNotifyCharacterPassiveUiActionSource,
  parseAnimatorAimOffsetActionSource,
  parseTryToTeleportSquadActionSource,
  parsePlayPerfectDodgeAnimActionSource,
  parseSetFirstDashParamActionSource,
  parseTyphoeaHudHintActionSource,
  type DebugPrintActionSource,
  type CameraPresentationActionSource,
  type HideUiActionSource,
  type EffectActionSource,
  type PlayAnimationActionSource,
  type PlaySoundActionSource,
} from './presentationActions.ts';
import { parseInterruptActionSource, type InterruptActionSource } from './interruptAction.ts';
import { parseDispelActionSource, type DispelActionSource } from './dispelActions.ts';
import {
  parseNormalSkillUltimateEnergyActionSource,
  type NormalSkillUltimateEnergyActionSource,
} from './normalSkillUltimateEnergy.ts';
import {
  parseEnhancedActionSource,
  parseShelterActionSource,
  parseWeakActionSource,
  parseSlowActionSource,
  parseSpeedupActionSource,
  parseVulnerableActionSource,
  type KeywordBuffActionSource,
} from './keywordActions.ts';
import {
  parseEnemyHurtAnimationActionSource,
  parseBlowOffEnemyActionSource,
  parseBlowOffActionSource,
  parsePullActionSource,
  parsePushBackActionSource,
  parseTargetHitStopActionSource,
  parseTakeDownActionSource,
  parseLaunchUpwardActionSource,
  type StumpControlActionSource,
} from './stumpControlActions.ts';
import {
  parseAbilityEntitySpawnActionSource,
  parseAbilityEntityDurationMutationActionSource,
  parseAbilityEntityTargetMutationActionSource,
  parseProjectileLaunchActionSource,
  parseSkillCastActionSource,
  type AbilityEntitySpawnActionSource,
  type AbilityEntityDurationMutationActionSource,
  type AbilityEntityTargetMutationActionSource,
  type ProjectileLaunchActionSource,
  type SkillCastActionSource,
} from './referenceActions.ts';
import {
  parseGlobalCooldownApplicationSource,
  parseFinisherSpGainActionSource,
  parseResourceGainActionSource,
  parseDashEnergyRecoveryActionSource,
  parseBattleDetailRecordActionSource,
  parseTimedMarkerApplicationSource,
  parseSkillCooldownMutationActionSource,
  type GlobalCooldownApplicationSource,
  type FinisherSpGainActionSource,
  type ResourceGainActionSource,
  type DashEnergyRecoveryActionSource,
  type BattleDetailRecordActionSource,
  type TimedMarkerApplicationSource,
  type SkillCooldownMutationActionSource,
} from './resourceActions.ts';
import { parseScalarSource, type BlackboardLevelValues, type ScalarSource } from './scalar.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';
import { parseTagQuerySource, type TagQuerySource } from './tagQuery.ts';
import {
  parseDirectRangedAuraActionSource,
  parseAuraReferenceActionSource,
  parseGlobalPartyAuraActionSource,
  type AuraReferenceActionSource,
  type DirectRangedAuraActionSource,
  type GlobalPartyAuraActionSource,
} from './auraActions.ts';
import {
  parseTimeDilationActionSource,
  parseUltimateTimeActionSource,
  parseSetIgnoreGlobalTimeScaleActionSource,
  parseSealTimeDilationActionSource,
  type TimeDilationActionSource,
  type UltimateTimeActionSource,
  type SetIgnoreGlobalTimeScaleActionSource,
  type SealTimeDilationActionSource,
} from './timeDilationActions.ts';
import { parseTargetGroupActionSource, type TargetGroupActionSource } from './targetGroup.ts';
import {
  parseAllowNextSkillActionSource,
  parseAddEntityControlTagsActionSource,
  parseBlockMoveInterruptSkillActionSource,
  parseComboCacheActionSource,
  parseMarkCanInterruptActionSource,
  parseMarkCanDashActionSource,
  parseOverrideMultiDashLimitActionSource,
  parsePauseComboSkillTimeActionSource,
  type AllowNextSkillActionSource,
  type AddEntityControlTagsActionSource,
  type BlockMoveInterruptSkillActionSource,
  type ComboCacheActionSource,
  type MarkCanInterruptActionSource,
  type MarkCanDashActionSource,
  type OverrideMultiDashLimitActionSource,
  type PauseComboSkillTimeActionSource,
} from './inputControlActions.ts';
import {
  parseComboPendingActionSource,
  type ComboPendingActionSource,
} from './comboPendingActions.ts';
import {
  parseSetSuperArmorActionSource,
  type SetSuperArmorActionSource,
} from './selfDefenseActions.ts';
import {
  parseClearProjectileActionSource,
  type ClearProjectileActionSource,
} from './projectileControlActions.ts';
import {
  parseContinuousAnimationTimeScaleActionSource,
  type ContinuousAnimationTimeScaleActionSource,
} from './animationTimingActions.ts';
import {
  parseBattleLevelSignalActionSource,
  parseTrainingLevelEventActionSource,
  type BattleLevelSignalActionSource,
  type TrainingLevelEventActionSource,
} from './levelSignalActions.ts';
import {
  parseRayCastTargetGroupActionSource,
  type RayCastTargetGroupActionSource,
} from './rayCastActions.ts';
import {
  parseCurveEvaluateFloatActionSource,
  parseSaveCameraAngleActionSource,
  parseSaveMoveAxisAngleActionSource,
  parseSaveTwoDirectionAngleActionSource,
  type PresentationCalculationActionSource,
} from './presentationCalculationActions.ts';
import {
  parseAdditionalBattleShapeActionSource,
  parseDynamicBattleShapeActionSource,
  parseSelfRotateActionSource,
  parseTeleportActionSource,
  parseDisableRootMotionActionSource,
  parseTeleportPositionSelectionActionSource,
  parseReceiveMoveInputActionSource,
  parseMoveToActionSource,
  parseCustomRootMotionActionSource,
  parseBoneAttachActionSource,
  parseSnapToTargetWithRangeActionSource,
  parseSaveTargetDistanceActionSource,
  parseSkillAiMoveActionSource,
  type AdditionalBattleShapeActionSource,
  type DynamicBattleShapeActionSource,
  type CustomRootMotionActionSource,
  type BoneAttachActionSource,
  type DisableRootMotionActionSource,
  type SnapToTargetWithRangeActionSource,
  type TeleportPositionSelectionActionSource,
  type SaveTargetDistanceActionSource,
  type SkillAiMoveActionSource,
  type MoveToActionSource,
  type ReceiveMoveInputActionSource,
  type SelfRotateActionSource,
  type TeleportActionSource,
  parseEnableMoveColliderActionSource,
  type EnableMoveColliderActionSource,
} from './spatialActions.ts';
import {
  parseRefrainUltimateEnergyRecoveryActionSource,
  parseSwitchModeActionSource,
  type RefrainUltimateEnergyRecoveryActionSource,
  type SwitchModeActionSource,
} from './modeAndResourcePolicyActions.ts';
import {
  parseSkillSlotReplacementActionSource,
  type SkillSlotReplacementActionSource,
} from './skillSlotActions.ts';
import {
  parseInterruptCurrentSkillActionSource,
  parseStoreCurrentSkillExecuteFrameActionSource,
  type InterruptCurrentSkillActionSource,
  type StoreCurrentSkillExecuteFrameActionSource,
} from './timelineControlActions.ts';
import {
  parseTriggerCustomAbilityEventSource,
  type TriggerCustomAbilityEventSource,
} from './customAbilityEventActions.ts';
import { parseAiMarkerActionSource, type AiMarkerActionSource } from './aiMarkerActions.ts';
import {
  parseSaveAtbObtainValueActionSource,
  parseSaveHealValueActionSource,
  parseSaveShieldValueActionSource,
  type SaveAtbObtainValueActionSource,
  type SaveHealValueActionSource,
  type SaveShieldValueActionSource,
} from './eventPayloadActions.ts';
import {
  parseTyphoeaArcheryTargetSelectionActionSource,
  type TyphoeaArcheryTargetSelectionActionSource,
} from './typhoeaArcheryActions.ts';

const CONDITION_ACTION_NAMES = new Set([
  'ReturnFalseAction',
  'OrConditionAction',
  'CompareFloat',
  'CompareString',
  'CheckMainCharacterCondition',
  'CheckProfession',
  'CheckDistanceCondition',
  'CheckEntityNum',
  'CheckBuffStackNum',
  'CheckBuffStackNumAdvanced',
  'CheckBuffStackNumByTag',
  'CheckTagMatch',
  'CheckTimedMarkerCondition',
  'CheckHp',
  'Probablity',
  'CheckSkillType',
  'CheckSkillId',
  'CheckSkillInterruptReason',
  'CheckOriginSkillType',
  'CheckObtainAtbType',
  'CheckTargetsEqual',
  'CheckTargetContains',
  'CheckTargetInScreen',
  'CheckObjectTypeMatch',
  'CheckDamageType',
  'CheckDamageTypeMask',
  'CheckSpellInflictionType',
  'CheckPhysicalInflictionType',
  'CompareDeckAttr',
  'CheckAbilityEntityCurDuration',
  'CheckDamageDecorateMask',
  'CheckDamageTag',
  'CheckHealTag',
  'CheckOverHeal',
  'CheckBuffIdInContext',
  'CheckBuffIdInContextAdvanced',
  'CheckConsumeBuffLayer',
  'CheckGlobalCDTimerAction',
  'CheckComboSkillPending',
  'CheckSkillHasHit',
  'CheckSkillCastId',
  'CheckEnemyRank',
  'CheckSuperArmor',
  'CheckTwoDirectionAngle',
  'CheckTargetAngle',
  'CheckPoiseValue',
  'CheckSquadInFight',
  'CheckDungeonCategory',
  'CheckComboSkillCameraAlphaSetting',
  'CheckSkillCameraMotionFree',
  'CheckHasMoveInput',
  'CheckPerfectDodgeDirection',
  'CheckDamageIgnoreImmuneLevel',
  'CheckProjectileInPerfectDodgeCd',
  'CheckProjectileIgnoreImmuneLevel',
  'CheckCustomAbilityEvent',
]);

/** 引用闭包需要严格读取的动作身份；集合与分派实现同属公共来源层，调用方不再复制 switch。 */
const REFERENCE_CLOSURE_ACTION_NAMES = new Set([
  'VulnerableAction',
  'WeakAction',
  'EnhancedAction',
  'ShelterAction',
  'SlowAction',
  'SpeedupAction',
  'ObtainUspInNormalSkill',
  'CreateBuffAction',
  'CreateBuffAttachingSkill',
  'InheritBuffAction',
  'CreateGlobalBuffAction',
  'FinishGlobalBuffAction',
  'ReadSkillSettingData',
  'AuraAction',
  'FinishBuffAction',
  'FinishBuffAdvanced',
  'LaunchProjectile',
  'SpawnAbilityEntity',
  'CastSkill',
  'ForceSpellStatusAction',
  'AirborneAction',
  'KnockDownAction',
  'LaunchUpwardAction',
  'FractureAction',
  'CrushAction',
]);

export type KnownNativeActionParseScope = 'all' | 'referenceClosure';

export interface HealthFloorActionSource {
  readonly useRatio: boolean;
  readonly floorValue: ScalarSource;
  readonly floorRatio: ScalarSource;
  readonly actionAfterSet: NativeSequenceSource<KnownNativeActionLeafSource>;
}

/** 已迁移到公共来源 IR 的 Action 叶子；领域适配器只能消费该公共并集。 */
export type KnownNativeActionLeafSource =
  | { readonly family: 'condition'; readonly action: NativeConditionSource }
  | { readonly family: 'blackboardCalculation'; readonly action: BlackboardCalculationActionSource }
  | { readonly family: 'blackboardMutation'; readonly action: BlackboardMutationActionSource }
  | { readonly family: 'randomBlackboard'; readonly action: RandomBlackboardActionSource }
  | { readonly family: 'attributeSnapshot'; readonly action: AttributeSnapshotActionSource }
  | {
      readonly family: 'entityPropertySnapshot';
      readonly action: EntityPropertySnapshotActionSource;
    }
  | { readonly family: 'healthFloor'; readonly action: HealthFloorActionSource }
  | { readonly family: 'characterIdentity'; readonly action: CharacterTypeIdReadActionSource }
  | { readonly family: 'targetGroup'; readonly action: TargetGroupActionSource }
  | { readonly family: 'rayCastTargetGroup'; readonly action: RayCastTargetGroupActionSource }
  | {
      readonly family: 'presentationCalculation';
      readonly action: PresentationCalculationActionSource;
    }
  | {
      readonly family: 'spatial';
      readonly action:
        | AdditionalBattleShapeActionSource
        | DynamicBattleShapeActionSource
        | EnableMoveColliderActionSource
        | SelfRotateActionSource
        | TeleportActionSource
        | ReceiveMoveInputActionSource
        | MoveToActionSource
        | DisableRootMotionActionSource
        | TeleportPositionSelectionActionSource
        | CustomRootMotionActionSource
        | BoneAttachActionSource
        | SnapToTargetWithRangeActionSource
        | SkillAiMoveActionSource;
    }
  | { readonly family: 'spatialMeasurement'; readonly action: SaveTargetDistanceActionSource }
  | { readonly family: 'resource'; readonly action: ResourceGainActionSource }
  | { readonly family: 'dashEnergyRecovery'; readonly action: DashEnergyRecoveryActionSource }
  | { readonly family: 'battleDetailRecord'; readonly action: BattleDetailRecordActionSource }
  | { readonly family: 'finisherSpGain'; readonly action: FinisherSpGainActionSource }
  | {
      readonly family: 'inputControl';
      readonly action:
        | ComboCacheActionSource
        | AllowNextSkillActionSource
        | MarkCanInterruptActionSource
        | MarkCanDashActionSource
        | OverrideMultiDashLimitActionSource
        | BlockMoveInterruptSkillActionSource
        | PauseComboSkillTimeActionSource
        | AddEntityControlTagsActionSource;
    }
  | { readonly family: 'comboPending'; readonly action: ComboPendingActionSource }
  | {
      readonly family: 'comboQte';
      readonly action: {
        readonly kind: 'comboQte';
        readonly earlyDuration: ScalarSource;
        readonly activeDuration: ScalarSource;
        readonly triggeredAction: NativeSequenceSource<KnownNativeActionLeafSource>;
      };
    }
  | { readonly family: 'castingControl'; readonly action: ChannelingCastingActionSource }
  | { readonly family: 'timelineControl'; readonly action: InterruptCurrentSkillActionSource }
  | { readonly family: 'timelineRead'; readonly action: StoreCurrentSkillExecuteFrameActionSource }
  | {
      readonly family: 'eventPayload';
      readonly action:
        SaveAtbObtainValueActionSource | SaveHealValueActionSource | SaveShieldValueActionSource;
    }
  | { readonly family: 'globalBuff'; readonly action: GlobalBuffActionSource }
  | { readonly family: 'skillSetting'; readonly action: SkillSettingReadActionSource }
  | { readonly family: 'selfDefense'; readonly action: SetSuperArmorActionSource }
  | { readonly family: 'projectileControl'; readonly action: ClearProjectileActionSource }
  | {
      readonly family: 'animationTiming';
      readonly action: ContinuousAnimationTimeScaleActionSource;
    }
  | { readonly family: 'timedMarker'; readonly action: TimedMarkerApplicationSource }
  | { readonly family: 'globalCooldown'; readonly action: GlobalCooldownApplicationSource }
  | { readonly family: 'skillCooldownMutation'; readonly action: SkillCooldownMutationActionSource }
  | { readonly family: 'skillSlotReplacement'; readonly action: SkillSlotReplacementActionSource }
  | {
      readonly family: 'skillCastInheritance';
      readonly action: { readonly kind: 'inheritSkillCastInfoForBasicAttack' };
    }
  | {
      readonly family: 'typhoeaArcherySelection';
      readonly action: TyphoeaArcheryTargetSelectionActionSource;
    }
  | {
      readonly family: 'incomingDamageDefense';
      readonly action: {
        readonly kind: 'damageTagImmunity';
        readonly target: TargetReferenceSource;
        readonly query: TagQuerySource;
      };
    }
  | { readonly family: 'buffApplication'; readonly action: BuffApplicationActionSource }
  | { readonly family: 'buffInheritance'; readonly action: BuffInheritanceActionSource }
  | {
      readonly family: 'aura';
      readonly action:
        | GlobalPartyAuraActionSource
        | AuraReferenceActionSource
        | DirectRangedAuraActionSource<KnownNativeActionLeafSource>;
    }
  | { readonly family: 'skillAffix'; readonly action: { readonly kind: 'skillAffix' } }
  | { readonly family: 'buffFinish'; readonly action: BuffFinishActionSource }
  | { readonly family: 'buffHold'; readonly action: BuffHoldActionSource }
  | { readonly family: 'dispel'; readonly action: DispelActionSource }
  | {
      readonly family: 'normalSkillUltimateEnergy';
      readonly action: NormalSkillUltimateEnergyActionSource;
    }
  | { readonly family: 'buffQuery'; readonly action: BuffStackReadActionSource }
  | { readonly family: 'buffBlackboardRead'; readonly action: BuffBlackboardReadActionSource }
  | { readonly family: 'buffLifeTimeRead'; readonly action: BuffLifeTimeReadActionSource }
  | { readonly family: 'buffDurationMutation'; readonly action: BuffDurationMutationActionSource }
  | { readonly family: 'buffTimePause'; readonly action: BuffTimePauseActionSource }
  | {
      readonly family: 'buffModifierRefresh';
      readonly action: { readonly kind: 'buffModifierRefresh' };
    }
  | { readonly family: 'heal'; readonly action: HealActionSource }
  | { readonly family: 'environment'; readonly action: BreakInteractiveActionSource }
  | { readonly family: 'elementalInfliction'; readonly action: ElementalInflictionActionSource }
  | {
      readonly family: 'characterSpellInfliction';
      readonly action: CharacterSpellInflictionActionSource;
    }
  | { readonly family: 'buffIgnite'; readonly action: BuffIgniteActionSource }
  | { readonly family: 'forcedElementalStatus'; readonly action: ForcedElementalStatusActionSource }
  | {
      readonly family: 'physicalInfliction';
      readonly action:
        AirborneActionSource | KnockDownActionSource | PhysicalInflictionActionSource;
    }
  | { readonly family: 'spellBurstEvent'; readonly action: TriggerSpellBurstEventSource }
  | { readonly family: 'customAbilityEvent'; readonly action: TriggerCustomAbilityEventSource }
  | { readonly family: 'aiMarker'; readonly action: AiMarkerActionSource }
  | {
      readonly family: 'levelEvent';
      readonly action:
        | SpellAbnormalLifecycleEventSource
        | ReturnType<typeof parsePhysicalNoGuardStartedEventSource>
        | SpellInflictionStartedEventSource
        | ForceTriggerWeaknessEventSource
        | BattleLevelSignalActionSource
        | TrainingLevelEventActionSource;
    }
  | { readonly family: 'keywordBuff'; readonly action: KeywordBuffActionSource }
  | { readonly family: 'lifecycle'; readonly action: FinishOwnerActionSource }
  | {
      readonly family: 'timeDilation';
      readonly action:
        | TimeDilationActionSource
        | UltimateTimeActionSource
        | SetIgnoreGlobalTimeScaleActionSource
        | SealTimeDilationActionSource;
    }
  | {
      readonly family: 'uiVisibility';
      readonly action: HideUiActionSource;
    }
  | { readonly family: 'damage'; readonly action: DamageActionSource }
  | {
      readonly family: 'presentation';
      readonly action:
        | PlaySoundActionSource
        | DebugPrintActionSource
        | EffectActionSource
        | PlayAnimationActionSource
        | CameraPresentationActionSource
        | {
            readonly kind: 'presentationInputListener';
            readonly onlyWhenOwnerIsMainCharacter: boolean;
            readonly actionOnClick: NativeSequenceSource<KnownNativeActionLeafSource>;
          };
    }
  | { readonly family: 'interrupt'; readonly action: InterruptActionSource }
  | { readonly family: 'stumpControl'; readonly action: StumpControlActionSource }
  | { readonly family: 'projectile'; readonly action: ProjectileLaunchActionSource }
  | { readonly family: 'abilityEntity'; readonly action: AbilityEntitySpawnActionSource }
  | {
      readonly family: 'abilityEntityDuration';
      readonly action: AbilityEntityDurationMutationActionSource;
    }
  | {
      readonly family: 'abilityEntityTarget';
      readonly action: AbilityEntityTargetMutationActionSource;
    }
  | { readonly family: 'skillCast'; readonly action: SkillCastActionSource }
  | {
      readonly family: 'modeAndResourcePolicy';
      readonly action: SwitchModeActionSource | RefrainUltimateEnergyRecoveryActionSource;
    }
  | {
      readonly family: 'eventListener';
      readonly action: {
        readonly kind: 'eventListener';
        readonly events: readonly {
          readonly abilityEvent: string | number;
          readonly actions: readonly NativeSequenceSource<KnownNativeActionLeafSource>[];
        }[];
      };
    }
  | {
      readonly family: 'animationEventListener';
      readonly action: {
        readonly kind: 'animationEventListener';
        readonly eventId: string;
        readonly eventParameterBlackboardKey: string;
        readonly actionOnEvent: NativeSequenceSource<KnownNativeActionLeafSource>;
      };
    };

/**
 * 单一公共分派入口。遇到尚未迁移的原生 Action 必须携带路径失败，不能由领域层各自猜测。
 */
export function parseKnownNativeActionLeafSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): KnownNativeActionLeafSource {
  const result = tryParseKnownNativeActionLeafSource(value, path, inheritedBlackboard);
  if (result) return result;
  const action = requireRecord(value, path);
  const name = nativeActionName(requireNonEmptyString(action.$type, `${path}.$type`));
  throw new Error(`${path}.$type: unsupported native action ${JSON.stringify(name)}`);
}

/**
 * 引用闭包等宽读取器使用的公共尝试入口。只有类型不属于已迁移集合时返回 null；
 * 已知类型的字段漂移仍由对应严格 parser 抛错，不能伪装成未跟踪动作。
 */
export function tryParseKnownNativeActionLeafSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
  scope: KnownNativeActionParseScope = 'all',
): KnownNativeActionLeafSource | null {
  const action = requireRecord(value, path);
  const typeName = requireNonEmptyString(action.$type, `${path}.$type`);
  const name = nativeActionName(typeName);
  if (scope === 'referenceClosure' && !REFERENCE_CLOSURE_ACTION_NAMES.has(name)) return null;
  if (CONDITION_ACTION_NAMES.has(name)) {
    return {
      family: 'condition',
      action: parseConditionLeafSource(value, path, inheritedBlackboard),
    };
  }
  switch (name) {
    case 'TyphoeaArcheryTargetSelect':
      return {
        family: 'typhoeaArcherySelection',
        action: parseTyphoeaArcheryTargetSelectionActionSource(value, path, inheritedBlackboard),
      };
    case 'MarkInheritSkillCastIdOnNormalAttack':
      requireExactFields(
        action,
        new Set(['$type', 'isEnable', 'priorityLevel', 'priorityOffset', 'serverActionIndex']),
        path,
      );
      return {
        family: 'skillCastInheritance',
        action: { kind: 'inheritSkillCastInfoForBasicAttack' },
      };
    case 'SetDamageTagImmuneRule':
      requireExactFields(
        action,
        new Set([
          '$type',
          'isEnable',
          'priorityLevel',
          'priorityOffset',
          'serverActionIndex',
          'target',
          'immuneQuery',
        ]),
        path,
      );
      return {
        family: 'incomingDamageDefense',
        action: {
          kind: 'damageTagImmunity',
          target: parseTargetReferenceSource(action.target, `${path}.target`),
          query: parseTagQuerySource(action.immuneQuery, `${path}.immuneQuery`),
        },
      };
    case 'TriggerCustomAbilityEvent':
      return {
        family: 'customAbilityEvent',
        action: parseTriggerCustomAbilityEventSource(value, path, inheritedBlackboard),
      };
    case 'AddAIMarkerAction':
      return {
        family: 'aiMarker',
        action: parseAiMarkerActionSource(value, path, inheritedBlackboard),
      };
    case 'TriggerComboSkillAction':
      return {
        family: 'comboPending',
        action: parseComboPendingActionSource(value, path),
      };
    case 'ShowComboRingQte': {
      requireExactFields(
        action,
        new Set([
          '$type',
          'isEnable',
          'priorityLevel',
          'priorityOffset',
          'serverActionIndex',
          'owner',
          'earlyDuration',
          'activeDuration',
          'triggeredAction',
        ]),
        path,
      );
      const owner = parseTargetReferenceSource(action.owner, `${path}.owner`);
      if (!isPlainTargetReference(owner, 'Source')) {
        throw new Error(`${path}.owner: expected plain Source target`);
      }
      const triggeredAction = parseNativeSequenceSource(
        action.triggeredAction,
        `${path}.triggeredAction`,
        inheritedBlackboard,
        (leaf, leafPath) => parseKnownNativeActionLeafSource(leaf, leafPath, inheritedBlackboard),
      );
      const triggerMutations = collectNativeActionNodes(triggeredAction).filter(
        node =>
          node.metadata.enabled &&
          node.body.kind === 'leaf' &&
          node.body.value.family === 'blackboardMutation',
      ) as NativeActionNodeSource<KnownNativeActionLeafSource>[];
      if (triggerMutations.length !== 1) {
        throw new Error(
          `${path}.triggeredAction: expected exactly one enabled ModifyDynamicBlackboard`,
        );
      }
      const triggerMutation = triggerMutations[0]!;
      if (
        triggerMutation.body.kind !== 'leaf' ||
        triggerMutation.body.value.family !== 'blackboardMutation' ||
        !isPlainTargetReference(triggerMutation.body.value.action.calculationTarget, 'Owner')
      ) {
        throw new Error(`${path}.triggeredAction: expected a plain Owner blackboard mutation`);
      }
      return {
        family: 'comboQte',
        action: {
          kind: 'comboQte',
          earlyDuration: parseScalarSource(
            action.earlyDuration,
            `${path}.earlyDuration`,
            inheritedBlackboard,
          ),
          activeDuration: parseScalarSource(
            action.activeDuration,
            `${path}.activeDuration`,
            inheritedBlackboard,
          ),
          triggeredAction,
        },
      };
    }
    case 'VulnerableAction':
      return {
        family: 'keywordBuff',
        action: parseVulnerableActionSource(value, path, inheritedBlackboard),
      };
    case 'WeakAction':
      return {
        family: 'keywordBuff',
        action: parseWeakActionSource(value, path, inheritedBlackboard),
      };
    case 'ShelterAction':
      return {
        family: 'keywordBuff',
        action: parseShelterActionSource(value, path, inheritedBlackboard),
      };
    case 'SlowAction':
      return {
        family: 'keywordBuff',
        action: parseSlowActionSource(value, path, inheritedBlackboard),
      };
    case 'SpeedupAction':
      return {
        family: 'keywordBuff',
        action: parseSpeedupActionSource(value, path, inheritedBlackboard),
      };
    case 'EnhancedAction':
      return {
        family: 'keywordBuff',
        action: parseEnhancedActionSource(value, path, inheritedBlackboard),
      };
    case 'PlayAnimationAction':
      return {
        family: 'presentation',
        action: parsePlayAnimationActionSource(value, path, inheritedBlackboard),
      };
    case 'ShowHideActorAction':
      return {
        family: 'presentation',
        action: parseShowHideActorActionSource(value, path),
      };
    case 'BreakInteractiveAction':
      return {
        family: 'environment',
        action: parseBreakInteractiveActionSource(value, path, inheritedBlackboard),
      };
    case 'InverseSpellInfliction':
      // 原生 InverseSpellInfliction 与 SpellInfliction 载荷相同，只交换复合状态的选表顺序。
      return {
        family: 'elementalInfliction',
        action: { ...parseElementalInflictionActionSource(value, path), inverseReaction: true },
      };
    case 'SpellInfliction':
      return {
        family: 'elementalInfliction',
        action: parseElementalInflictionActionSource(value, path),
      };
    case 'SpellInflictionOnChar':
      return {
        family: 'characterSpellInfliction',
        action: parseCharacterSpellInflictionActionSource(value, path),
      };
    case 'IgniteAction':
      return { family: 'buffIgnite', action: parseBuffIgniteActionSource(value, path) };
    case 'OnPhysicalNoGuardStart':
      return { family: 'levelEvent', action: parsePhysicalNoGuardStartedEventSource(value, path) };
    case 'SendBattleSignalToLevel':
      return {
        family: 'levelEvent',
        action: parseBattleLevelSignalActionSource(value, path, inheritedBlackboard),
      };
    case 'RaiseTrainLevelEvent':
      return {
        family: 'levelEvent',
        action: parseTrainingLevelEventActionSource(value, path, inheritedBlackboard),
      };
    case 'ForceSpellStatusAction':
      return {
        family: 'forcedElementalStatus',
        action: parseForcedElementalStatusActionSource(value, path, inheritedBlackboard),
      };
    case 'TriggerSpellBurstEventAction':
      return {
        family: 'spellBurstEvent',
        action: parseTriggerSpellBurstEventSource(value, path),
      };
    case 'OnSpellAbnormalStartFinish':
      return {
        family: 'levelEvent',
        action: parseSpellAbnormalLifecycleEventSource(value, path),
      };
    case 'OnSpellInflictionStart':
      return {
        family: 'levelEvent',
        action: parseSpellInflictionStartedEventSource(value, path),
      };
    case 'ForceTriggerWeakness':
      return {
        family: 'levelEvent',
        action: parseForceTriggerWeaknessEventSource(value, path),
      };
    case 'PlayAnimationWithStep':
      return {
        family: 'presentation',
        action: parsePlayAnimationWithStepActionSource(value, path, inheritedBlackboard),
      };
    case 'SelfRotateAction':
      return {
        family: 'spatial',
        action: parseSelfRotateActionSource(value, path),
      };
    case 'EnableMoveColliderAction':
      return { family: 'spatial', action: parseEnableMoveColliderActionSource(value, path) };
    case 'CreateAdditionalBattleShape':
      return {
        family: 'spatial',
        action: parseAdditionalBattleShapeActionSource(value, path),
      };
    case 'CreateDynamicBattleShape':
      return {
        family: 'spatial',
        action: parseDynamicBattleShapeActionSource(value, path),
      };
    case 'TeleportAction':
      return {
        family: 'spatial',
        action: parseTeleportActionSource(value, path, inheritedBlackboard),
      };
    case 'DisableRootMotionAction':
      return {
        family: 'spatial',
        action: parseDisableRootMotionActionSource(value, path),
      };
    case 'TeleportPosSelectAction':
      return {
        family: 'spatial',
        action: parseTeleportPositionSelectionActionSource(value, path, inheritedBlackboard),
      };
    case 'ReceiveMoveInputAction':
      return {
        family: 'spatial',
        action: parseReceiveMoveInputActionSource(value, path, inheritedBlackboard),
      };
    case 'MoveToAction':
      return {
        family: 'spatial',
        action: parseMoveToActionSource(value, path, inheritedBlackboard),
      };
    case 'CustomRootMotionAction':
      return {
        family: 'spatial',
        action: parseCustomRootMotionActionSource(value, path, inheritedBlackboard),
      };
    case 'BoneAttachAction':
      return {
        family: 'spatial',
        action: parseBoneAttachActionSource(value, path),
      };
    case 'SnapToTargetWithRangeAction':
      return {
        family: 'spatial',
        action: parseSnapToTargetWithRangeActionSource(value, path, inheritedBlackboard),
      };
    case 'SaveTargetDistanceAction':
      return {
        family: 'spatialMeasurement',
        action: parseSaveTargetDistanceActionSource(value, path),
      };
    case 'SkillAIMoveAction':
      return {
        family: 'spatial',
        action: parseSkillAiMoveActionSource(value, path),
      };
    case 'SetSuperArmorAction':
      return {
        family: 'selfDefense',
        action: parseSetSuperArmorActionSource(value, path),
      };
    case 'ClearProjectileAction':
      return {
        family: 'projectileControl',
        action: parseClearProjectileActionSource(value, path),
      };
    case 'ComboCacheAction':
      return {
        family: 'inputControl',
        action: parseComboCacheActionSource(value, path, inheritedBlackboard),
      };
    case 'AllowNextSkillAction':
      return {
        family: 'inputControl',
        action: parseAllowNextSkillActionSource(value, path),
      };
    case 'MarkCanInterrupt':
      return {
        family: 'inputControl',
        action: parseMarkCanInterruptActionSource(value, path),
      };
    case 'BlockMoveInterruptSkill':
      return {
        family: 'inputControl',
        action: parseBlockMoveInterruptSkillActionSource(value, path),
      };
    case 'PauseComboSkillTime':
      return {
        family: 'inputControl',
        action: parsePauseComboSkillTimeActionSource(value, path),
      };
    case 'AddTagAction':
    case 'AddTagToEntities':
      return {
        family: 'inputControl',
        action: parseAddEntityControlTagsActionSource(value, path),
      };
    case 'CharWeaponVisibleAction':
      return {
        family: 'presentation',
        action: parseWeaponVisibilityActionSource(value, path),
      };
    case 'CharWeaponAnimationAction':
      return {
        family: 'presentation',
        action: parseWeaponAnimationActionSource(value, path),
      };
    case 'SetAnimatorParamAction':
      return {
        family: 'presentation',
        action: parseSetAnimatorParameterActionSource(value, path),
      };
    case 'ChangeSpecificLayerAction':
      return {
        family: 'presentation',
        action: parseNoopSpecificLayerChangeActionSource(value, path),
      };
    case 'ForceTargetInFightAction':
      return {
        family: 'presentation',
        action: parseForceTargetInFightActionSource(value, path),
      };
    case 'TagQueryListenerAction':
      return {
        family: 'presentation',
        action: parseInterruptHenshinTagListenerActionSource(value, path, inheritedBlackboard),
      };
    case 'SetStrafeModeAction':
      return {
        family: 'presentation',
        action: parseSetStrafeModeActionSource(value, path),
      };
    case 'OverrideMultiDashLimit':
      return {
        family: 'inputControl',
        action: parseOverrideMultiDashLimitActionSource(value, path, inheritedBlackboard),
      };
    case 'BombClearAction':
      return {
        family: 'presentation',
        action: parseBombClearActionSource(value, path),
      };
    case 'ChangeSkillType':
      return {
        family: 'presentation',
        action: parseSkillTypeMutationSource(value, path),
      };
    case 'NotifyCharPassiveUIAction':
      return {
        family: 'presentation',
        action: parseNotifyCharacterPassiveUiActionSource(value, path, inheritedBlackboard),
      };
    case 'AnimatorAimOffsetAction':
      return {
        family: 'presentation',
        action: parseAnimatorAimOffsetActionSource(value, path),
      };
    case 'TryToTeleportSquadAction':
      return {
        family: 'presentation',
        action: parseTryToTeleportSquadActionSource(value, path),
      };
    case 'MarkCanDash':
      return {
        family: 'inputControl',
        action: parseMarkCanDashActionSource(value, path),
      };
    case 'PlayPerfectDodgeAnim':
      return {
        family: 'presentation',
        action: parsePlayPerfectDodgeAnimActionSource(value, path),
      };
    case 'SetFirstDashParam':
      return {
        family: 'presentation',
        action: parseSetFirstDashParamActionSource(value, path),
      };
    case 'IgniteBuffTextAction':
      return {
        family: 'presentation',
        action: parseIgniteBuffTextActionSource(value, path),
      };
    case 'ImmuneTextAction':
      return {
        family: 'presentation',
        action: parseImmuneTextActionSource(value, path),
      };
    case 'ModifyWeaponMountPoint':
      return {
        family: 'presentation',
        action: parseModifyWeaponMountPointActionSource(value, path),
      };
    case 'VoiceTriggerAction':
      return {
        family: 'presentation',
        action: parseVoiceTriggerActionSource(value, path),
      };
    case 'VoiceInterruptAction':
      return {
        family: 'presentation',
        action: parseVoiceInterruptActionSource(value, path),
      };
    case 'ShowTyphoeaHudHint':
      return {
        family: 'presentation',
        action: parseTyphoeaHudHintActionSource(value, path),
      };
    case 'SaveTwoDirectionAngle':
      return {
        family: 'presentationCalculation',
        action: parseSaveTwoDirectionAngleActionSource(value, path),
      };
    case 'SaveMoveAxisAngle':
      return {
        family: 'presentationCalculation',
        action: parseSaveMoveAxisAngleActionSource(value, path),
      };
    case 'SaveCameraAngle':
      return {
        family: 'presentationCalculation',
        action: parseSaveCameraAngleActionSource(value, path),
      };
    case 'CurveEvaluateFloat':
      return {
        family: 'presentationCalculation',
        action: parseCurveEvaluateFloatActionSource(value, path, inheritedBlackboard),
      };
    case 'CameraRotateAction':
      return {
        family: 'presentation',
        action: parseCameraRotateActionSource(value, path, inheritedBlackboard),
      };
    case 'AnimatedCameraAction':
      return {
        family: 'presentation',
        action: parseAnimatedCameraActionSource(value, path),
      };
    case 'HideUIAction':
      return {
        family: 'uiVisibility',
        action: parseHideUiActionSource(value, path),
      };
    case 'UltimateShowAction':
      return {
        family: 'presentation',
        action: parseUltimateShowActionSource(value, path),
      };
    case 'IgnoreModelIntervalCheck':
      return {
        family: 'presentation',
        action: parseIgnoreModelIntervalCheckActionSource(value, path),
      };
    case 'LockCameraAimAction':
      return {
        family: 'presentation',
        action: parseLockCameraAimActionSource(value, path, inheritedBlackboard),
      };
    case 'SimpleCalcBBAction':
      return {
        family: 'blackboardCalculation',
        action: parseBlackboardCalculationActionSource(value, path, inheritedBlackboard),
      };
    case 'ModifyDynamicBlackboard':
      return {
        family: 'blackboardMutation',
        action: parseBlackboardMutationActionSource(value, path, inheritedBlackboard),
      };
    case 'SaveAtbObtainValue':
      return {
        family: 'eventPayload',
        action: parseSaveAtbObtainValueActionSource(value, path),
      };
    case 'SaveHealValue':
      return {
        family: 'eventPayload',
        action: parseSaveHealValueActionSource(value, path),
      };
    case 'SaveShieldValueToBB':
      return {
        family: 'eventPayload',
        action: parseSaveShieldValueActionSource(value, path),
      };
    case 'RandomAction':
      return {
        family: 'randomBlackboard',
        action: parseRandomBlackboardActionSource(value, path, inheritedBlackboard),
      };
    case 'StoreAttributeValue':
      return {
        family: 'attributeSnapshot',
        action: parseAttributeSnapshotActionSource(value, path, inheritedBlackboard),
      };
    case 'StoreEntityProperty':
      return {
        family: 'entityPropertySnapshot',
        action: parseEntityPropertySnapshotActionSource(value, path, inheritedBlackboard),
      };
    case 'SetHpFloor': {
      requireExactFields(
        action,
        new Set([
          '$type',
          'isEnable',
          'priorityLevel',
          'priorityOffset',
          'serverActionIndex',
          'useRatio',
          'floorValue',
          'floorRatio',
          'actionAfterSet',
        ]),
        path,
      );
      return {
        family: 'healthFloor',
        action: {
          useRatio: requireBoolean(action.useRatio, `${path}.useRatio`),
          floorValue: parseScalarSource(
            action.floorValue,
            `${path}.floorValue`,
            inheritedBlackboard,
          ),
          floorRatio: parseScalarSource(
            action.floorRatio,
            `${path}.floorRatio`,
            inheritedBlackboard,
          ),
          actionAfterSet: parseNativeSequenceSource(
            action.actionAfterSet,
            `${path}.actionAfterSet`,
            inheritedBlackboard,
            (leaf, leafPath) =>
              parseKnownNativeActionLeafSource(leaf, leafPath, inheritedBlackboard),
          ),
        },
      };
    }
    case 'SaveCharTypeId':
      return {
        family: 'characterIdentity',
        action: parseCharacterTypeIdReadActionSource(value, path),
      };
    case 'FindTargetAction':
    case 'ContinuousFindTargetAction':
    case 'MergeTargetAction':
    case 'PickTargetAction':
    case 'ConvertToTargetContext': {
      const targetGroup = parseTargetGroupActionSource(value, path, inheritedBlackboard);
      if (!targetGroup) throw new Error(`${path}: failed to parse target group action ${name}`);
      return { family: 'targetGroup', action: targetGroup };
    }
    case 'TargetPostProcessorAction': {
      const targetGroup = parseTargetGroupActionSource(value, path, inheritedBlackboard);
      if (!targetGroup) throw new Error(`${path}: failed to parse target group action ${name}`);
      return { family: 'targetGroup', action: targetGroup };
    }
    case 'RayCastEffectAction':
      return {
        family: 'rayCastTargetGroup',
        action: parseRayCastTargetGroupActionSource(value, path),
      };
    case 'ObtainCostAction':
      return {
        family: 'resource',
        action: parseResourceGainActionSource(value, path, inheritedBlackboard),
      };
    case 'RecoverDashEnergy':
      return {
        family: 'dashEnergyRecovery',
        action: parseDashEnergyRecoveryActionSource(value, path, inheritedBlackboard),
      };
    case 'RecordBattleDetails':
      return {
        family: 'battleDetailRecord',
        action: parseBattleDetailRecordActionSource(value, path),
      };
    case 'SwitchModeAction':
      return {
        family: 'modeAndResourcePolicy',
        action: parseSwitchModeActionSource(value, path),
      };
    case 'RefrainObtainUsp':
      return {
        family: 'modeAndResourcePolicy',
        action: parseRefrainUltimateEnergyRecoveryActionSource(value, path),
      };
    case 'RefreshBuffAttrModifierValue':
      requireExactFields(
        action,
        new Set(['$type', 'isEnable', 'priorityLevel', 'priorityOffset', 'serverActionIndex']),
        path,
      );
      return { family: 'buffModifierRefresh', action: { kind: 'buffModifierRefresh' } };
    case 'EventListenerAction': {
      requireExactFields(
        action,
        new Set([
          '$type',
          'isEnable',
          'priorityLevel',
          'priorityOffset',
          'serverActionIndex',
          'abilityActionMap',
        ]),
        path,
      );
      const events = requireArray(action.abilityActionMap, `${path}.abilityActionMap`).map(
        (rawEvent, eventIndex) => {
          const eventPath = `${path}.abilityActionMap[${eventIndex}]`;
          const event = requireRecord(rawEvent, eventPath);
          requireExactFields(event, new Set(['abilityEvent', 'actions']), eventPath);
          const abilityEvent =
            typeof event.abilityEvent === 'string'
              ? requireNonEmptyString(event.abilityEvent, `${eventPath}.abilityEvent`)
              : requireInteger(event.abilityEvent, `${eventPath}.abilityEvent`);
          return {
            abilityEvent,
            actions: requireArray(event.actions, `${eventPath}.actions`).map(
              (sequence, sequenceIndex) =>
                parseNativeSequenceSource(
                  sequence,
                  `${eventPath}.actions[${sequenceIndex}]`,
                  inheritedBlackboard,
                  (leaf, leafPath) =>
                    parseKnownNativeActionLeafSource(leaf, leafPath, inheritedBlackboard),
                ),
            ),
          };
        },
      );
      return { family: 'eventListener', action: { kind: 'eventListener', events } };
    }
    case 'AnimEventReceiver': {
      requireExactFields(
        action,
        new Set([
          '$type',
          'isEnable',
          'priorityLevel',
          'priorityOffset',
          'serverActionIndex',
          'eventId',
          'blackboardKey',
          'actionOnEvent',
        ]),
        path,
      );
      return {
        family: 'animationEventListener',
        action: {
          kind: 'animationEventListener',
          eventId: requireNonEmptyString(action.eventId, `${path}.eventId`),
          eventParameterBlackboardKey: requireNonEmptyString(
            action.blackboardKey,
            `${path}.blackboardKey`,
          ),
          actionOnEvent: parseNativeSequenceSource(
            action.actionOnEvent,
            `${path}.actionOnEvent`,
            inheritedBlackboard,
            (leaf, leafPath) =>
              parseKnownNativeActionLeafSource(leaf, leafPath, inheritedBlackboard),
          ),
        },
      };
    }
    case 'ContinuousSetAnimTimeScale':
      return {
        family: 'animationTiming',
        action: parseContinuousAnimationTimeScaleActionSource(value, path, inheritedBlackboard),
      };
    case 'GainBreakingAttackAtb':
      return {
        family: 'finisherSpGain',
        action: parseFinisherSpGainActionSource(value, path, inheritedBlackboard),
      };
    case 'CreateTimedMarker':
      return {
        family: 'timedMarker',
        action: parseTimedMarkerApplicationSource(value, path, inheritedBlackboard),
      };
    case 'AddGlobalCDTimer':
      return {
        family: 'globalCooldown',
        action: parseGlobalCooldownApplicationSource(value, path, inheritedBlackboard),
      };
    case 'SetSkillCdAtOnce':
      return {
        family: 'skillCooldownMutation',
        action: parseSkillCooldownMutationActionSource(value, path, inheritedBlackboard),
      };
    case 'ChangeSkillAction':
      return {
        family: 'skillSlotReplacement',
        action: parseSkillSlotReplacementActionSource(value, path, inheritedBlackboard),
      };
    case 'CreateBuffAction':
      return {
        family: 'buffApplication',
        action: parseBuffApplicationActionSource(value, path, inheritedBlackboard),
      };
    case 'CreateBuffAttachingSkill':
      return {
        family: 'buffApplication',
        action: parseBuffApplicationActionSource(
          value,
          path,
          inheritedBlackboard,
          'currentCastSkill',
        ),
      };
    case 'InheritBuffAction':
      return {
        family: 'buffInheritance',
        action: parseBuffInheritanceActionSource(value, path),
      };
    case 'AuraAction':
      return {
        family: 'aura',
        action:
          scope === 'referenceClosure'
            ? parseAuraReferenceActionSource(value, path)
            : requireRecord(value, path).auraType === 'RangedAura'
              ? parseDirectRangedAuraActionSource(value, path, (sequence, sequencePath) =>
                  parseKnownNativeActionSequenceSource(sequence, sequencePath, inheritedBlackboard),
                )
              : parseGlobalPartyAuraActionSource(value, path),
      };
    case 'SkillAffixAction':
      requireExactFields(
        action,
        new Set(['$type', 'isEnable', 'priorityLevel', 'priorityOffset', 'serverActionIndex']),
        path,
      );
      return { family: 'skillAffix', action: { kind: 'skillAffix' } };
    case 'FinishBuffAction':
      return {
        family: 'buffFinish',
        action: parseLegacyBuffFinishActionSource(value, path, inheritedBlackboard),
      };
    case 'FinishBuffAdvanced':
      return {
        family: 'buffFinish',
        action: parseAdvancedBuffFinishActionSource(value, path, inheritedBlackboard),
      };
    case 'FinishBuffByTag':
      return {
        family: 'buffFinish',
        action: parseTaggedBuffFinishActionSource(value, path, inheritedBlackboard),
      };
    case 'ExtendBuffAction':
      return {
        family: 'buffHold',
        action: parseBuffHoldActionSource(value, path),
      };
    case 'DispelAction':
      return { family: 'dispel', action: parseDispelActionSource(value, path) };
    case 'ObtainUspInNormalSkill':
      return {
        family: 'normalSkillUltimateEnergy',
        action: parseNormalSkillUltimateEnergyActionSource(value, path, inheritedBlackboard),
      };
    case 'SaveBuffStackNumAdvanced':
      return {
        family: 'buffQuery',
        action: parseBuffStackReadActionSource(value, path),
      };
    case 'SaveBuffStackNum':
      return {
        family: 'buffQuery',
        action: parseSimpleBuffStackReadActionSource(value, path),
      };
    case 'SaveBuffStackNumByTag':
      return {
        family: 'buffQuery',
        action: parseTaggedBuffStackReadActionSource(value, path),
      };
    case 'StoreBuffCount':
      return {
        family: 'buffQuery',
        action: parseStoreBuffCountActionSource(value, path),
      };
    case 'GetTargetBuffBBAction':
    case 'GetTargetBuffBBAdvanced':
      return {
        family: 'buffBlackboardRead',
        action: parseBuffBlackboardReadActionSource(value, path),
      };
    case 'SaveBuffLifeTime':
      return {
        family: 'buffLifeTimeRead',
        action: parseBuffLifeTimeReadActionSource(value, path),
      };
    case 'SetBuffDurationAction':
      return {
        family: 'buffDurationMutation',
        action: parseBuffDurationMutationActionSource(value, path, inheritedBlackboard),
      };
    case 'PauseBuffTime':
      return {
        family: 'buffTimePause',
        action: parseBuffTimePauseActionSource(value, path),
      };
    case 'HealAction':
      return { family: 'heal', action: parseHealActionSource(value, path, inheritedBlackboard) };
    case 'FinishOwnerAction':
      return { family: 'lifecycle', action: parseFinishOwnerActionSource(value, path) };
    case 'TimeDilationAction':
      return {
        family: 'timeDilation',
        action: parseTimeDilationActionSource(value, path, inheritedBlackboard),
      };
    case 'UltimateTimeAction':
      return { family: 'timeDilation', action: parseUltimateTimeActionSource(value, path) };
    case 'SetIgnoreGlobalTimeScaleAction':
      return {
        family: 'timeDilation',
        action: parseSetIgnoreGlobalTimeScaleActionSource(value, path),
      };
    case 'SealAction':
      return {
        family: 'timeDilation',
        action: parseSealTimeDilationActionSource(value, path, inheritedBlackboard),
      };
    case 'DamageAction':
      return {
        family: 'damage',
        action: parseDamageActionSource(value, path, inheritedBlackboard),
      };
    case 'PlaySoundAction':
      return { family: 'presentation', action: parsePlaySoundActionSource(value, path) };
    case 'DebugPrintAction':
      return { family: 'presentation', action: parseDebugPrintActionSource(value, path) };
    case 'EffectAction':
      return { family: 'presentation', action: parseEffectActionSource(value, path) };
    case 'TriggerLiinoUIEvent':
      return {
        family: 'presentation',
        action: parseLiinoUiEventActionSource(value, path, inheritedBlackboard),
      };
    case 'ComboAction':
      return {
        family: 'globalBuff',
        action: parseComboGlobalBuffActionSource(value, path, inheritedBlackboard),
      };
    case 'AttackClickListenerAction': {
      requireExactFields(
        action,
        new Set([
          '$type',
          'isEnable',
          'priorityLevel',
          'priorityOffset',
          'serverActionIndex',
          'onlyWhenOwnerIsMainChar',
          'actionOnClick',
        ]),
        path,
      );
      return {
        family: 'presentation',
        action: {
          kind: 'presentationInputListener',
          onlyWhenOwnerIsMainCharacter: requireBoolean(
            action.onlyWhenOwnerIsMainChar,
            `${path}.onlyWhenOwnerIsMainChar`,
          ),
          actionOnClick: parseNativeSequenceSource(
            action.actionOnClick,
            `${path}.actionOnClick`,
            inheritedBlackboard,
            (leaf, leafPath) =>
              parseKnownNativeActionLeafSource(leaf, leafPath, inheritedBlackboard),
          ),
        },
      };
    }
    case 'InterruptAction':
      return { family: 'interrupt', action: parseInterruptActionSource(value, path) };
    case 'EnemyHurtAnimAction':
      return { family: 'stumpControl', action: parseEnemyHurtAnimationActionSource(value, path) };
    case 'PullAction':
      return { family: 'stumpControl', action: parsePullActionSource(value, path) };
    case 'HitStopAction':
      return { family: 'stumpControl', action: parseTargetHitStopActionSource(value, path) };
    case 'CameraImpulseAction':
      return {
        family: 'presentation',
        action: parseCameraPresentationActionSource(value, path, 'cameraImpulse'),
      };
    case 'TakeDownAction':
      return {
        family: 'stumpControl',
        action: parseTakeDownActionSource(value, path, inheritedBlackboard),
      };
    case 'LaunchUpwardAction':
      return {
        family: 'stumpControl',
        action: parseLaunchUpwardActionSource(value, path, inheritedBlackboard),
      };
    case 'PushBackAction':
      return {
        family: 'stumpControl',
        action: parsePushBackActionSource(value, path, inheritedBlackboard),
      };
    case 'KnockDownAction':
      return {
        family: 'physicalInfliction',
        action: parseKnockDownActionSource(value, path, inheritedBlackboard),
      };
    case 'AirborneAction':
      return {
        family: 'physicalInfliction',
        action: parseAirborneActionSource(value, path, inheritedBlackboard),
      };
    case 'FractureAction':
      return {
        family: 'physicalInfliction',
        action: parsePhysicalInflictionActionSource(value, path, inheritedBlackboard, 'fracture'),
      };
    case 'CrushAction':
      return {
        family: 'physicalInfliction',
        action: parsePhysicalInflictionActionSource(value, path, inheritedBlackboard, 'crush'),
      };
    case 'BlowOffEnemyAction':
      return {
        family: 'stumpControl',
        action: parseBlowOffEnemyActionSource(value, path, inheritedBlackboard),
      };
    case 'BlowOffAction':
      return {
        family: 'stumpControl',
        action: parseBlowOffActionSource(value, path, inheritedBlackboard),
      };
    case 'ChannelingCastingAction':
      return {
        family: 'castingControl',
        action: parseChannelingCastingActionSource(value, path, inheritedBlackboard),
      };
    case 'InterruptCurSkillAction':
      return {
        family: 'timelineControl',
        action: parseInterruptCurrentSkillActionSource(value, path),
      };
    case 'StoreCurSkillExecuteFrame':
      return {
        family: 'timelineRead',
        action: parseStoreCurrentSkillExecuteFrameActionSource(value, path),
      };
    case 'CreateGlobalBuffAction':
      return {
        family: 'globalBuff',
        action: parseCreateGlobalBuffActionSource(value, path, inheritedBlackboard),
      };
    case 'FinishGlobalBuffAction':
      return {
        family: 'globalBuff',
        action: parseFinishGlobalBuffActionSource(value, path, inheritedBlackboard),
      };
    case 'ReadSkillSettingData':
      return {
        family: 'skillSetting',
        action: parseSkillSettingReadActionSource(value, path, inheritedBlackboard),
      };
    case 'AddCameraControlStateAction':
      return {
        family: 'presentation',
        action: parseCameraPresentationActionSource(value, path, 'cameraControlState'),
      };
    case 'InheritCCSAction':
      return {
        family: 'presentation',
        action: parseInheritedCameraControlStateActionSource(value, path),
      };
    case 'AddDynamicCcsAction':
      return {
        family: 'presentation',
        action: parseCameraPresentationActionSource(value, path, 'dynamicCameraControlState'),
      };
    case 'OverrideCameraFollowAction':
      return {
        family: 'presentation',
        action: parseOverrideCameraFollowActionSource(value, path, inheritedBlackboard),
      };
    case 'TemporaryUnlockAction':
      return {
        family: 'presentation',
        action: parseTemporaryUnlockActionSource(value, path),
      };
    case 'LaunchProjectile':
      return { family: 'projectile', action: parseProjectileLaunchActionSource(value, path) };
    case 'SpawnAbilityEntity':
      return {
        family: 'abilityEntity',
        action: parseAbilityEntitySpawnActionSource(value, path, inheritedBlackboard),
      };
    case 'SetAbilityEntityDuration':
      return {
        family: 'abilityEntityDuration',
        action: parseAbilityEntityDurationMutationActionSource(value, path, inheritedBlackboard),
      };
    case 'SetAbilityEntityTarget':
      return {
        family: 'abilityEntityTarget',
        action: parseAbilityEntityTargetMutationActionSource(value, path),
      };
    case 'CastSkill':
      return { family: 'skillCast', action: parseSkillCastActionSource(value, path) };
    default:
      return null;
  }
}

function isPlainTargetReference(
  target: TargetReferenceSource,
  source: 'Owner' | 'Source',
): boolean {
  return (
    target.targetSource === source &&
    target.targetGroupKey === '' &&
    target.finderType === null &&
    target.validatorTypes.length === 0 &&
    target.postProcessorTypes.length === 0 &&
    target.priorityFilters.length === 0 &&
    target.shuffleTargets.length === 0 &&
    target.distanceValidators.length === 0 &&
    target.finderSpawnedObjectType === null &&
    target.validatorTagQueries.length === 0
  );
}

export function parseKnownNativeActionSequenceSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): NativeSequenceSource<KnownNativeActionLeafSource> {
  return parseNativeSequenceSource(value, path, inheritedBlackboard, (leaf, leafPath) =>
    parseKnownNativeActionLeafSource(leaf, leafPath, inheritedBlackboard),
  );
}
