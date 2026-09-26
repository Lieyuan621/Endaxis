/** 所有不携带子程序的动作共用编译规则；正式图编译都调用此入口。 */
import type { CombatStepForKind } from '../../../packages/game-data-contract/src/actions';
import type { ActionGraphStep } from '../../../packages/game-data-contract/src/actionGraph';
import type { ResolvedCombatStepForKind } from './combatProgram';
import {
  resolveLevelValue,
  resolveLevelValueOrActionOperand,
  resolveStatusModifier,
} from './compileActionValues';

const LEAF_ACTION_KINDS = [
  'mergeContextTargets',
  'findCharacterTeamTargets',
  'findUnfinishedProjectileTargets',
  'createSpatialPointTargets',
  'findOwnerSpawnedAbilityEntities',
  'pickContextTarget',
  'readAbilityEntityRemainingDuration',
  'setAbilityEntityRemainingDuration',
  'finishCurrentAbilityEntity',
  'finishActionOwnerAbilityEntity',
  'finishCurrentAbilityEntityWhenSourceDies',
  'startCurrentAbilityEntityChildSkillById',
  'jumpTimeline',
  'finishTimeline',
  'reachSkillOperableBoundary',
  'markCurrentSkillCanDash',
  'markCurrentSkillCanInterrupt',
  'dealDamage',
  'dealFixedDamage',
  'dealStagger',
  'heal',
  'changeResource',
  'restrictUltimateEnergyRecovery',
  'applyStatus',
  'readBuffBlackboard',
  'readEventBuffBlackboard',
  'readCurrentBuffRemainingDuration',
  'readBuffRemainingDuration',
  'setCurrentBuffRemainingDuration',
  'refreshCurrentBuffAttributeModifiers',
  'skillAffix',
  'readBuffStackCount',
  'finishBuffsByTag',
  'finishBuffsById',
  'finishCurrentBuff',
  'setCurrentBuffTimePaused',
  'igniteBuffs',
  'holdBuffsById',
  'inheritBuffById',
  'createTimedMarker',
  'setGlobalCooldown',
  'createAbilityEntityTimedMarker',
  'startTimeDilation',
  'startUltimateTimeDilation',
  'hideUi',
  'setIgnoreGlobalTimeScale',
  'storeCurrentTimelineFrame',
  'storeEventSpGainAmount',
  'storeEventHealValues',
  'storeShieldValue',
  'modifyActionValue',
  'calculateActionValue',
  'storeSourceAttributeValue',
  'storeEntityPropertyValue',
  'setHealthFloor',
  'changeResourceByActionValue',
  'recoverDashEnergy',
  'recordPerfectDodge',
  'gainSquadUltimateEnergyFromSkillCost',
  'createGlobalBuff',
  'finishParentGlobalBuff',
  'finishGlobalBuffsById',
  'readSkillSettingData',
  'applyElementalInfliction',
  'applyKnockDown',
  'triggerSpellBurst',
  'triggerCustomAbilityEvent',
  'castSkillDuringAction',
  'consumeElementalReaction',
  'outputAirborne',
  'outputKnockDown',
  'gainFinisherSp',
  'consumeStatus',
  'setContextFlag',
  'openComboWindow',
  'showComboRingQte',
  'changeSkillSlot',
  'overrideBasicAttackMapping',
  'overrideMultiDashLimit',
  'changePlayerActionMode',
  'changeNativeSkillType',
  'setCharacterPassiveUiValue',
  'inheritSkillCastInfoForBasicAttack',
  'adjustSkillCooldown',
  'applyElementalReaction',
] as const;
type LeafAction = CombatStepForKind<(typeof LEAF_ACTION_KINDS)[number]>;
export type ResolvedLeafAction = ResolvedCombatStepForKind<(typeof LEAF_ACTION_KINDS)[number]>;
const leafKinds: ReadonlySet<string> = new Set(LEAF_ACTION_KINDS);
export function isLeafCombatStep(step: ActionGraphStep): step is LeafAction {
  return leafKinds.has(step.kind);
}
export function compileLeafAction(
  step: LeafAction,
  skillLevel: number,
  path: string,
): ResolvedLeafAction {
  const keyed = step.key === undefined ? {} : { key: step.key };
  switch (step.kind) {
    case 'mergeContextTargets':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'findCharacterTeamTargets':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'findUnfinishedProjectileTargets':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'createSpatialPointTargets':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'findOwnerSpawnedAbilityEntities':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'pickContextTarget':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'readAbilityEntityRemainingDuration':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'setAbilityEntityRemainingDuration':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'finishCurrentAbilityEntity':
    case 'finishActionOwnerAbilityEntity':
    case 'finishCurrentAbilityEntityWhenSourceDies':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'startCurrentAbilityEntityChildSkillById':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'jumpTimeline':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'finishTimeline':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'reachSkillOperableBoundary':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'markCurrentSkillCanDash':
    case 'markCurrentSkillCanInterrupt':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'dealDamage':
      return {
        ...keyed,
        kind: step.kind,
        parameters: {
          damageType: step.parameters.damageType,
          ...(step.parameters.calculation === undefined
            ? {}
            : { calculation: step.parameters.calculation }),
          attackScale: resolveLevelValueOrActionOperand(
            step.parameters.attackScale,
            skillLevel,
            `${path}.parameters.attackScale`,
          ),
          ...(step.parameters.takeAttackSnapshot ? { takeAttackSnapshot: true } : {}),
          ...(step.parameters.calculationMultiplier === undefined
            ? {}
            : {
                calculationMultiplier: resolveLevelValue(
                  step.parameters.calculationMultiplier,
                  skillLevel,
                  `${path}.parameters.calculationMultiplier`,
                ),
              }),
          ...(step.parameters.calculationAttribute === undefined
            ? {}
            : { calculationAttribute: step.parameters.calculationAttribute }),
          ...(step.parameters.calculationAddition === undefined
            ? {}
            : {
                calculationAddition: resolveLevelValueOrActionOperand(
                  step.parameters.calculationAddition,
                  skillLevel,
                  `${path}.parameters.calculationAddition`,
                ),
              }),
          tags: step.parameters.tags,
          ...(step.parameters.gameplayTags === undefined
            ? {}
            : { gameplayTags: step.parameters.gameplayTags }),
          ...(step.parameters.features === undefined ? {} : { features: step.parameters.features }),
          ...(step.parameters.instantAttributeModifiers === undefined
            ? {}
            : { instantAttributeModifiers: step.parameters.instantAttributeModifiers }),
          ...(step.parameters.instantDamageScaleModifiers === undefined
            ? {}
            : { instantDamageScaleModifiers: step.parameters.instantDamageScaleModifiers }),
          ...(step.parameters.stagger === undefined
            ? {}
            : {
                stagger: resolveLevelValueOrActionOperand(
                  step.parameters.stagger,
                  skillLevel,
                  `${path}.parameters.stagger`,
                ),
              }),
          ...(step.parameters.staggerMultiplier === undefined
            ? {}
            : {
                staggerMultiplier: resolveLevelValueOrActionOperand(
                  step.parameters.staggerMultiplier,
                  skillLevel,
                  `${path}.parameters.staggerMultiplier`,
                ),
              }),
          ...(step.parameters.staggerOnlyWhenCasterControlled
            ? { staggerOnlyWhenCasterControlled: true }
            : {}),
          ...(step.parameters.attackScalePerStatusStack === undefined
            ? {}
            : {
                attackScalePerStatusStack: {
                  ...step.parameters.attackScalePerStatusStack,
                  coefficient: resolveLevelValue(
                    step.parameters.attackScalePerStatusStack.coefficient,
                    skillLevel,
                    `${path}.parameters.attackScalePerStatusStack.coefficient`,
                  ),
                },
              }),
        },
      };
    case 'dealFixedDamage':
      return {
        ...keyed,
        kind: step.kind,
        parameters: {
          damageType: step.parameters.damageType,
          value: resolveLevelValueOrActionOperand(
            step.parameters.value,
            skillLevel,
            `${path}.parameters.value`,
          ),
          tags: step.parameters.tags,
          ...(step.parameters.features === undefined ? {} : { features: step.parameters.features }),
          ...(step.parameters.stagger === undefined
            ? {}
            : {
                stagger: resolveLevelValueOrActionOperand(
                  step.parameters.stagger,
                  skillLevel,
                  `${path}.parameters.stagger`,
                ),
              }),
          ...(step.parameters.staggerMultiplier === undefined
            ? {}
            : {
                staggerMultiplier: resolveLevelValueOrActionOperand(
                  step.parameters.staggerMultiplier,
                  skillLevel,
                  `${path}.parameters.staggerMultiplier`,
                ),
              }),
          ...(step.parameters.staggerOnlyWhenCasterControlled
            ? { staggerOnlyWhenCasterControlled: true }
            : {}),
        },
      };
    case 'dealStagger':
      return {
        ...keyed,
        kind: step.kind,
        parameters: {
          value: resolveLevelValueOrActionOperand(
            step.parameters.value,
            skillLevel,
            `${path}.parameters.value`,
          ),
          ...(step.parameters.valueMultiplier === undefined
            ? {}
            : {
                valueMultiplier: resolveLevelValueOrActionOperand(
                  step.parameters.valueMultiplier,
                  skillLevel,
                  `${path}.parameters.valueMultiplier`,
                ),
              }),
          ...(step.parameters.features === undefined ? {} : { features: step.parameters.features }),
        },
      };
    case 'heal': {
      const targetParameters =
        step.parameters.target === 'contextTarget'
          ? {
              target: step.parameters.target,
              contextKey: step.parameters.contextKey,
            }
          : { target: step.parameters.target };
      return {
        ...keyed,
        kind: step.kind,
        parameters:
          step.parameters.amount === undefined
            ? {
                ...targetParameters,
                ...(step.parameters.alwaysNext === undefined
                  ? {}
                  : { alwaysNext: step.parameters.alwaysNext }),
                ...(step.parameters.source === undefined ? {} : { source: step.parameters.source }),
                attribute: step.parameters.attribute,
                ...(step.parameters.attributeSource === undefined
                  ? {}
                  : { attributeSource: step.parameters.attributeSource }),
                multiplier: resolveLevelValueOrActionOperand(
                  step.parameters.multiplier,
                  skillLevel,
                  `${path}.parameters.multiplier`,
                ),
                addition: resolveLevelValueOrActionOperand(
                  step.parameters.addition,
                  skillLevel,
                  `${path}.parameters.addition`,
                ),
                tags: step.parameters.tags,
              }
            : {
                ...targetParameters,
                ...(step.parameters.alwaysNext === undefined
                  ? {}
                  : { alwaysNext: step.parameters.alwaysNext }),
                ...(step.parameters.source === undefined ? {} : { source: step.parameters.source }),
                amount: resolveLevelValueOrActionOperand(
                  step.parameters.amount,
                  skillLevel,
                  `${path}.parameters.amount`,
                ),
                tags: step.parameters.tags,
              },
      };
    }
    case 'changeResource':
      return {
        ...keyed,
        kind: step.kind,
        parameters: {
          resource: step.parameters.resource,
          amount: resolveLevelValue(
            step.parameters.amount,
            skillLevel,
            `${path}.parameters.amount`,
          ),
          ...(step.parameters.coefficient === undefined
            ? {}
            : {
                coefficient: resolveLevelValue(
                  step.parameters.coefficient,
                  skillLevel,
                  `${path}.parameters.coefficient`,
                ),
              }),
          recipient: step.parameters.recipient,
          ...(step.parameters.spGainKind === undefined
            ? {}
            : { spGainKind: step.parameters.spGainKind }),
          ...(step.parameters.spGainSource === undefined
            ? {}
            : { spGainSource: step.parameters.spGainSource }),
          ...(step.parameters.isPercentValue === undefined
            ? {}
            : { isPercentValue: step.parameters.isPercentValue }),
          ...(step.parameters.ultimateRecoveryTag === undefined
            ? {}
            : {
                ultimateRecoveryTag: step.parameters.ultimateRecoveryTag,
              }),
          ...(step.parameters.ignoreUltimateEnergyGainMultiplier === undefined
            ? {}
            : {
                ignoreUltimateEnergyGainMultiplier:
                  step.parameters.ignoreUltimateEnergyGainMultiplier,
              }),
        },
      };
    case 'restrictUltimateEnergyRecovery':
      return {
        ...keyed,
        kind: step.kind,
        parameters: {
          ...step.parameters,
          allowedRecoveryTags: step.parameters.allowedRecoveryTags,
        },
      };
    case 'applyStatus':
      return {
        ...keyed,
        kind: step.kind,
        parameters: {
          statusKey: step.parameters.statusKey,
          target: step.parameters.target,
          ...(step.parameters.stacks === undefined ? {} : { stacks: step.parameters.stacks }),
          ...(step.parameters.maxStacks === undefined
            ? {}
            : { maxStacks: step.parameters.maxStacks }),
          ...(step.parameters.durationFrames === undefined
            ? {}
            : {
                durationFrames: resolveLevelValue(
                  step.parameters.durationFrames,
                  skillLevel,
                  `${path}.parameters.durationFrames`,
                ),
              }),
          ...(step.parameters.modifiers === undefined
            ? {}
            : {
                modifiers: step.parameters.modifiers.map((modifier, index) =>
                  resolveStatusModifier(
                    modifier,
                    skillLevel,
                    `${path}.parameters.modifiers[${index}]`,
                  ),
                ),
              }),
        },
      };
    case 'readBuffBlackboard':
      return {
        ...keyed,
        kind: step.kind,
        parameters: {
          ...step.parameters,
          query:
            step.parameters.query.kind === 'tag'
              ? {
                  ...step.parameters.query,
                  buffTags: step.parameters.query.buffTags,
                }
              : step.parameters.query,
        },
      };
    case 'readEventBuffBlackboard':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'readCurrentBuffRemainingDuration':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'readBuffRemainingDuration':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'setCurrentBuffRemainingDuration':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'refreshCurrentBuffAttributeModifiers':
    case 'skillAffix':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'readBuffStackCount':
      return {
        ...keyed,
        kind: step.kind,
        parameters: {
          ...step.parameters,
          query:
            step.parameters.query.kind === 'tag'
              ? {
                  ...step.parameters.query,
                  buffTags: step.parameters.query.buffTags,
                }
              : step.parameters.query,
        },
      };
    case 'finishBuffsByTag':
      return {
        ...keyed,
        kind: step.kind,
        parameters: {
          ...step.parameters,
          buffTags: step.parameters.buffTags,
        },
      };
    case 'finishBuffsById':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'finishCurrentBuff':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'setCurrentBuffTimePaused':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'igniteBuffs':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'holdBuffsById':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'inheritBuffById':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'createTimedMarker':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'setGlobalCooldown':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'createAbilityEntityTimedMarker':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'startTimeDilation':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'startUltimateTimeDilation':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'hideUi':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'setIgnoreGlobalTimeScale':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'storeCurrentTimelineFrame':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'storeEventSpGainAmount':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'storeEventHealValues':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'storeShieldValue':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'modifyActionValue':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'calculateActionValue':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'storeSourceAttributeValue':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'storeEntityPropertyValue':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'setHealthFloor':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'changeResourceByActionValue': {
      const { coefficient, ultimateRecoveryTag, ...parameters } = step.parameters;
      return {
        ...keyed,
        kind: step.kind,
        parameters: {
          ...parameters,
          ...(ultimateRecoveryTag === undefined
            ? {}
            : { ultimateRecoveryTag: ultimateRecoveryTag }),
          ...(coefficient === undefined
            ? {}
            : {
                coefficient: resolveLevelValueOrActionOperand(
                  coefficient,
                  skillLevel,
                  `${path}.parameters.coefficient`,
                ),
              }),
        },
      };
    }
    case 'recoverDashEnergy':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'recordPerfectDodge':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'gainSquadUltimateEnergyFromSkillCost':
      return {
        ...keyed,
        kind: step.kind,
        parameters: {
          coefficient: resolveLevelValue(
            step.parameters.coefficient,
            skillLevel,
            `${path}.parameters.coefficient`,
          ),
        },
      };
    case 'createGlobalBuff':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'finishParentGlobalBuff':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'finishGlobalBuffsById':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'readSkillSettingData':
      return { ...keyed, kind: step.kind, parameters: step.parameters };
    case 'applyElementalInfliction':
    case 'applyKnockDown':
    case 'triggerSpellBurst':
    case 'triggerCustomAbilityEvent':
    case 'castSkillDuringAction':
    case 'consumeElementalReaction':
    case 'outputAirborne':
    case 'outputKnockDown':
    case 'gainFinisherSp':
    case 'consumeStatus':
    case 'setContextFlag':
    case 'openComboWindow':
    case 'showComboRingQte':
    case 'changeSkillSlot':
    case 'overrideBasicAttackMapping':
    case 'overrideMultiDashLimit':
    case 'changePlayerActionMode':
    case 'changeNativeSkillType':
    case 'setCharacterPassiveUiValue':
    case 'inheritSkillCastInfoForBasicAttack':
    case 'adjustSkillCooldown':
      return { ...keyed, kind: step.kind, parameters: step.parameters } as ResolvedLeafAction;
    case 'applyElementalReaction':
      return {
        ...keyed,
        kind: step.kind,
        parameters: {
          ...step.parameters,
          durationSeconds: resolveLevelValueOrActionOperand(
            step.parameters.durationSeconds,
            skillLevel,
            `${path}.parameters.durationSeconds`,
          ),
        },
      };
  }
}
