import { compileGearSetContribution } from '../../../src/core/compiler/compileEquipment.ts';
import { ActionGraphDefinitionRepository } from '../../../src/core/compiler/actionGraphDefinitionRepository.ts';
import { describe, expect, it } from 'vitest';

import { compileEquipmentSuitStaticDefinitionBatchSource } from '../src/index.ts';

describe('装备套装静态定义', () => {
  it('保留原生元素、失衡和连携冷却乘区，并单列未闭合运行时依赖', () => {
    const result = compileEquipmentSuitStaticDefinitionBatchSource(
      { suit_fixture: suitFixture() },
      { passive_fixture: passiveFixture() },
      {},
    );

    expect(result.definitions).toEqual([
      {
        slug: 'suit_fixture',
        modifiers: [
          { kind: 'damageScale', target: 'ether', slot: 'baseAddition', value: 0.2 },
          { kind: 'panelStat', stat: 'staggerDamagePercent', value: 0.2 },
          {
            kind: 'skillCooldownMultiplier',
            skillTypes: 'comboSkill',
            value: 0.85,
          },
        ],
      },
    ]);
    const definition = result.definitions[0]!;
    const attributes = { main: 'will', secondary: 'agility' } as const;
    expect(
      compileGearSetContribution(definition, attributes, new ActionGraphDefinitionRepository()),
    ).toEqual(
      compileGearSetContribution(
        {
          ...definition,
          modifiers: definition.modifiers.map(modifier => ({
            ...modifier,
            value: typeof modifier.value === 'number' ? [modifier.value] : modifier.value,
          })),
        },
        attributes,
        new ActionGraphDefinitionRepository(),
      ),
    );
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        status: 'scenario-omitted',
        reason: 'playerDamageTakenRequiresEnemyActiveDamage',
      }),
    ]);
    expect(result.runtimeDependencies).toEqual([
      {
        suitId: 'suit_fixture',
        skillId: 'passive_fixture',
        startupBuffIds: ['buff_fixture'],
        startupBuffs: [{ buffId: 'buff_fixture', blackboardAssignments: {} }],
        toggleBuffIds: [],
        toggleBuffs: [],
        referencedBuffIds: ['buff_fixture'],
      },
    ]);
  });

  it('把只存在于服务端被动技能实例的 Buff 参数留到运行时判定', () => {
    const passive = passiveFixture();
    passive.buffs = [
      {
        buffId: 'buff_fixture',
        assignBlackboard: true,
        assignItems: [
          {
            targetKey: 'agi',
            inputValueKey: 'agi',
            useDirectValue: false,
            directValueType: 'Numeric',
            numericValue: 0,
            stringValue: '',
          },
        ],
      },
    ];

    const result = compileEquipmentSuitStaticDefinitionBatchSource(
      { suit_fixture: suitFixture() },
      { passive_fixture: passive },
      {},
    );

    expect(result.runtimeDependencies[0]?.startupBuffs).toEqual([
      {
        buffId: 'buff_fixture',
        blackboardAssignments: {
          agi: { kind: 'unresolvedSkillBlackboard', key: 'agi' },
        },
      },
    ]);
  });

  it('物化装备 ToggleBuff 的生命比例条件和参数', () => {
    const passive = passiveFixture();
    passive.passiveSkillType = 'ToggleBuff';
    passive.blackboard = [
      { key: 'hp_ratio', valueDouble: 0.8, valueStr: '', isDynamic: false },
      { key: 'damage_up', valueDouble: 0.2, valueStr: '', isDynamic: false },
    ];
    passive.toggleBuffs = [
      {
        conditions: [
          {
            $type: 'Beyond.Gameplay.Core.Abilities.Condition.CheckCurHpRatio, Gameplay.Beyond',
            compareType: 'GE',
            value: { useBlackboardKey: true, value: 0, blackboardKey: 'hp_ratio' },
          },
        ],
        buffs: [
          {
            buffId: 'buff_toggle',
            assignBlackboard: true,
            assignItems: [
              {
                targetKey: 'damage_up',
                inputValueKey: 'damage_up',
                useDirectValue: false,
                directValueType: 'Numeric',
                numericValue: 0,
                stringValue: '',
              },
            ],
          },
        ],
      },
    ];

    const result = compileEquipmentSuitStaticDefinitionBatchSource(
      { suit_fixture: suitFixture() },
      { passive_fixture: passive },
      {},
    );

    expect(result.runtimeDependencies[0]?.toggleBuffs).toEqual([
      {
        conditions: [{ kind: 'currentHpRatio', comparison: 'GE', value: 0.8 }],
        buffs: [{ buffId: 'buff_toggle', blackboardAssignments: { damage_up: 0.2 } }],
      },
    ]);
  });
});

function suitFixture() {
  return {
    equipList: ['gear-a', 'gear-b', 'gear-c'],
    list: [
      {
        equipCnt: 3,
        skillID: 'passive_fixture',
        skillLv: 1,
        suitID: 'suit_fixture',
        suitLogoName: 'icon_suit_fixture',
        suitName: { id: 1, text: '' },
      },
    ],
  };
}

function modifier(attributeType: string, formulaItem: string, value: number) {
  return {
    modifyAttributeType: 'Specific',
    attributeType,
    formulaItem,
    param: { value, useBlackboardKey: false, blackboardKey: '' },
  };
}

function passiveFixture(): Record<string, unknown> {
  return {
    actionGroupData: { timelineActions: [], passiveEventActions: [] },
    aiExclusiveFrame: 0,
    attackRangeType: 'Default',
    blackboard: [],
    buffs: [{ buffId: 'buff_fixture', assignBlackboard: false, assignItems: [] }],
    canCastInAir: false,
    canDummyCast: false,
    canMove: false,
    cardAttributeModifier: {
      attributeModifiers: [
        modifier('EtherDamageIncrease', 'BaseAddition', 0.2),
        modifier('PoiseDamageOutputScalar', 'BaseAddition', 0.2),
        modifier('ComboSkillCooldownScalar', 'BaseFinalMultiplier', 0.85),
        modifier('FireDamageTakenScalar', 'BaseFinalMultiplier', 0.9),
      ],
      isConvertedAttribute: false,
    },
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
    skillId: 'passive_fixture',
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
