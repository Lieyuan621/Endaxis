import { describe, expect, it } from 'vitest';

import { compileEquipmentSuitSourceClosure } from '../src/index.ts';

describe('装备套装来源闭包', () => {
  it('关闭三件套被动的 SkillData 与 BuffData 引用', () => {
    const result = compileEquipmentSuitSourceClosure(
      { suit_fixture: suitFixture(3) },
      { passive_fixture: passiveFixture('passive_fixture', 'buff_fixture') },
      {},
      { buff_fixture: buffFixture('buff_fixture') },
    );

    expect(result).toEqual({
      suits: [
        {
          suitId: 'suit_fixture',
          skillId: 'passive_fixture',
          skillLevel: 1,
          requiredCount: 3,
        },
      ],
      passiveSkillDefinitionCount: 1,
      buffDefinitionIds: ['buff_fixture'],
    });
  });

  it('拒绝非三件阈值与缺失的活动 Buff 定义', () => {
    expect(() =>
      compileEquipmentSuitSourceClosure(
        { suit_fixture: suitFixture(2) },
        { passive_fixture: passiveFixture('passive_fixture', 'buff_fixture') },
        {},
        { buff_fixture: buffFixture('buff_fixture') },
      ),
    ).toThrow('Next GearSetDefinition requires exactly 3 pieces');

    expect(() =>
      compileEquipmentSuitSourceClosure(
        { suit_fixture: suitFixture(3) },
        { passive_fixture: passiveFixture('passive_fixture', 'buff_missing') },
        {},
        {},
      ),
    ).toThrow('missing active buff definition "buff_missing"');
  });
});

function suitFixture(equipCnt: number): Record<string, unknown> {
  return {
    equipList: ['gear-a', 'gear-b', 'gear-c'],
    list: [
      {
        equipCnt,
        skillID: 'passive_fixture',
        skillLv: 1,
        suitID: 'suit_fixture',
        suitLogoName: 'icon_suit_fixture',
        suitName: { id: 1, text: '' },
      },
    ],
  };
}

function passiveFixture(skillId: string, buffId: string): Record<string, unknown> {
  return {
    actionGroupData: { timelineActions: [], passiveEventActions: [] },
    aiExclusiveFrame: 0,
    attackRangeType: 'Default',
    blackboard: [],
    buffs: [{ buffId, assignBlackboard: false, assignItems: [] }],
    canCastInAir: false,
    canDummyCast: false,
    canMove: false,
    cardAttributeModifier: { attributeModifiers: [], isConvertedAttribute: false },
    castData: {},
    castType: 'Passive',
    characterReturnToIdle: false,
    comboSkillUIBigSpriteName: '',
    comboSkillUISpriteName: '',
    dontInterruptCombo: false,
    dummyPositionOffset: {},
    durationFrame: 0,
    exclusiveFrame: 0,
    hittableAttackRange: 0,
    iconBgType: 'Default',
    iconId: '',
    level: 1,
    needEnemyOutOfScreenWarning: false,
    needEnemyOutOfScreenWarningOverrideValue: false,
    offsetRecordFrame: 0,
    overrideHittableObjAttackRange: false,
    overrideNeedEnemyOutOfScreenWarning: false,
    passiveSkillType: 'AddBuff',
    rootMotionCliffCheck: false,
    selectStrategy: {},
    showNotRecommendState: false,
    skillHighlightCondition: {},
    skillId,
    skillName: '',
    skillSpecification: 'Default',
    skillTags: { predefinedTag: [] },
    smartTargetBuffFindSettings: {},
    smartTargetBuffIds: [],
    smartTargetSelectStrategy: {},
    smartTargetTagQuery: {},
    switchToBuffConfig: {
      condition: {},
      buffs: [],
      buffSource: {},
      targets: {},
      asSkillCast: false,
    },
    switchToCenterBeforeCast: false,
    tagDuringAttach: {},
    toggleBuffs: [],
    uiRangeHints: [],
    useAIExclusiveFrame: false,
  };
}

function buffFixture(id: string): Record<string, unknown> {
  return {
    abilityEventAction: [],
    addingCooldown: {},
    applyTags: [],
    attributeModifier: {},
    blackboard: [],
    buffEventAction: [],
    damageModifier: [],
    dispelConfig: {},
    duration: {},
    finishOnRepatriate: false,
    globalModifier: [],
    hasAddingCooldown: false,
    hasIcon: false,
    healModifier: [],
    iconConfig: {},
    id,
    igniteEventAction: [],
    ignoreCooldownWhenAdding: false,
    ignoreTagImmune: false,
    lifeType: 'Infinity',
    maxTriggerCnt: {},
    onlyUseSelfTimeDilation: false,
    poiseModifier: [],
    shieldConfigs: [],
    stackingSettings: {},
    tagsAfterTriggerExtendBuffAction: [],
    timelineActions: [],
    triggerInterval: {},
    useTimeDilationDt: false,
    waitFirstTriggerInterval: true,
  };
}
