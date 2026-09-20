import type { EditableCombatStepKind } from '../skills/skillDefinitionEditorViewModel';

export type StepTypeGroupKey = 'time' | 'combat' | 'effects' | 'values' | 'flow';

export interface StepTypeGroup {
  readonly key: StepTypeGroupKey;
  readonly kinds: readonly EditableCombatStepKind[];
}

/**
 * 编辑器的信息架构分组。这里只整理步骤的编辑入口，不改变编译或运行时语义。
 * 测试会保证每个可编辑步骤恰好出现一次。
 */
export const STEP_TYPE_GROUPS: readonly StepTypeGroup[] = [
  {
    key: 'time',
    kinds: [
      'readAbilityEntityRemainingDuration',
      'setAbilityEntityRemainingDuration',
      'scheduleProjectileFinishCallback',
      'startTimeDilation',
      'startUltimateTimeDilation',
      'setIgnoreGlobalTimeScale',
      'createTimedMarker',
      'setGlobalCooldown',
      'createAbilityEntityTimedMarker',
    ],
  },
  {
    key: 'combat',
    kinds: [
      'finishCurrentAbilityEntity',
      'finishActionOwnerAbilityEntity',
      'finishCurrentAbilityEntityWhenSourceDies',
      'startCurrentAbilityEntityChildSkill',
      'startCurrentAbilityEntityChildSkillById',
      'createSpatialPointTargets',
      'dealDamage',
      'dealFixedDamage',
      'dealStagger',
      'heal',
      'applyElementalInfliction',
      'applyPhysicalInfliction',
      'applyKnockDown',
      'triggerSpellBurst',
      'triggerCustomAbilityEvent',
      'castSkillDuringAction',
      'inheritSkillCastInfoForBasicAttack',
      'applyElementalReaction',
      'consumeElementalReaction',
    ],
  },
  {
    key: 'effects',
    kinds: [
      'mergeContextTargets',
      'findCharacterTeamTargets',
      'findOwnerSpawnedAbilityEntities',
      'pickContextTarget',
      'forEachContextTarget',
      'jumpTimeline',
      'finishTimeline',
      'withActionBlackboardScope',
      'repeatByActionValue',
      'spawnAbilityEntity',
      'applyBuff',
      'readBuffBlackboard',
      'readBuffStackCount',
      'readEventBuffBlackboard',
      'readCurrentBuffRemainingDuration',
      'readBuffRemainingDuration',
      'setCurrentBuffRemainingDuration',
      'refreshCurrentBuffAttributeModifiers',
      'skillAffix',
      'finishCurrentBuff',
      'setCurrentBuffTimePaused',
      'createGlobalBuff',
      'finishParentGlobalBuff',
      'finishGlobalBuffsById',
      'finishBuffsByTag',
      'finishBuffsById',
      'holdBuffsById',
      'igniteBuffs',
      'inheritBuffById',
      'restrictUltimateEnergyRecovery',
      'adjustSkillCooldown',
      'applyStatus',
      'consumeStatus',
    ],
  },
  {
    key: 'values',
    kinds: [
      'modifyActionValue',
      'calculateActionValue',
      'readSkillSettingData',
      'storeSourceAttributeValue',
      'storeEntityPropertyValue',
      'setHealthFloor',
      'storeCurrentTimelineFrame',
      'storeEventSpGainAmount',
      'storeEventHealValues',
      'storeShieldValue',
      'changeResource',
      'changeResourceByActionValue',
      'gainSquadUltimateEnergyFromSkillCost',
      'gainFinisherSp',
      'setContextFlag',
      'setCharacterPassiveUiValue',
    ],
  },
  {
    key: 'flow',
    kinds: [
      'outputAirborne',
      'outputKnockDown',
      'openComboWindow',
      'changeSkillSlot',
      'overrideBasicAttackMapping',
      'changePlayerActionMode',
      'changeNativeSkillType',
      'listenForCombatEvents',
      'conditional',
      'switch',
      'once',
      'repeatEachTick',
    ],
  },
];
