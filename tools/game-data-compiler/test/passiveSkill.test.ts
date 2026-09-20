import { describe, expect, it } from 'vitest';

import {
  compilePassiveSkillSource,
  parseNativePassiveSkillSource,
  resolveSkillBlackboardSource,
  selectSkillBlackboardLevel,
  type SkillPatchSource,
} from '../src/index.ts';
import { scalarFixture } from './sourceFixtures.ts';

describe('领域无关的被动 SkillData', () => {
  it.each([
    [0, 'AddBuff'],
    [1, 'ToggleBuff'],
  ] as const)('整数被动类型 %s 与 %s 的完整结果一致，包括死引用过滤', (number, name) => {
    const source = passiveFixture();
    const blackboard = { hp_ratio: [0.5], damage_up: [0.2] };
    expect(
      parseNativePassiveSkillSource(
        { ...source, castType: 1, passiveSkillType: number },
        'fixture',
        blackboard,
      ),
    ).toEqual(
      parseNativePassiveSkillSource({ ...source, passiveSkillType: name }, 'fixture', blackboard),
    );
  });

  it('ToggleBuff 只保留条件 Buff、赋值和事件动作容器', () => {
    const parsed = parseNativePassiveSkillSource(passiveFixture(), 'passive_fixture.json', {
      hp_ratio: [0.5],
      damage_up: [0.2],
    });
    expect(parsed).toMatchObject({
      skillId: 'passive_fixture',
      passiveType: 'ToggleBuff',
      skillSpecification: 'Default',
      skillTagIds: [-123],
      cardAttributeModifiers: {
        isConvertedAttribute: false,
        modifiers: [],
      },
      startupBuffs: [],
      toggleBuffs: [
        {
          conditions: [
            {
              kind: 'currentHpRatio',
              comparison: 'GE',
              value: { blackboardKey: 'hp_ratio', levelValues: [0.5] },
            },
          ],
          buffs: [{ buffId: 'buff_toggle' }],
        },
      ],
      actionGraph: { actionGroup: { passiveEvents: [{ abilityEvent: 'OnBuffStart' }] } },
    });
    expect(parsed.references.filter(item => item.kind === 'buff')).toMatchObject([
      { usage: 'toggle', id: 'buff_toggle' },
    ]);
  });

  it('拒绝主动 SkillData 进入被动入口', () => {
    expect(() =>
      parseNativePassiveSkillSource(
        { ...passiveFixture(), castType: 'Active' },
        'active_fixture.json',
        {},
      ),
    ).toThrow('active_fixture.json.castType: expected "Passive"');
  });

  it('AddBuff 被动忽略未被原生子类读取的 toggleBuffs 序列化残留', () => {
    const source = passiveFixture();
    source.passiveSkillType = 'AddBuff';
    const parsed = parseNativePassiveSkillSource(source, 'passive_fixture.json', {
      hp_ratio: [0.5],
      damage_up: [0.2],
    });
    expect(parsed.toggleBuffs).toEqual([]);
    expect(parsed.references.filter(item => item.kind === 'buff')).toMatchObject([
      { usage: 'attached', id: 'buff_startup' },
    ]);
  });

  it('保留 CardSkill 属性修正及其逐等级黑板来源', () => {
    const source = passiveFixture();
    source.cardAttributeModifier = {
      isConvertedAttribute: false,
      attributeModifiers: [
        {
          modifyAttributeType: 'Specific',
          attributeType: 'Atk',
          formulaItem: 'BaseAddition',
          param: scalarFixture(0, 'damage_up'),
        },
      ],
    };
    expect(
      parseNativePassiveSkillSource(source, 'passive_fixture.json', {
        damage_up: [0.1, 0.2],
      }).cardAttributeModifiers,
    ).toEqual({
      isConvertedAttribute: false,
      modifiers: [
        {
          modifyAttributeType: 'Specific',
          attributeType: 'Atk',
          formulaItem: 'BaseAddition',
          parameter: {
            value: 0,
            blackboardKey: 'damage_up',
            levelValues: [0.1, 0.2],
          },
        },
      ],
    });
  });

  it('用同一规则合并静态声明和逐等级 Patch，并排除动态默认值', () => {
    const patch: SkillPatchSource = {
      levels: [1, 2],
      blackboard: { damage_up: [0.2, 0.3], patch_only: [1, 2] },
      cooldownSeconds: [0, 0],
      costTypes: [0, 0],
      costValues: [0, 0],
    };
    expect(
      resolveSkillBlackboardSource(
        [
          { key: 'duration', value: 5, isDynamic: false },
          { key: 'damage_up', value: 0.1, isDynamic: false },
          { key: 'runtime', value: 9, isDynamic: true },
          { key: 'identity', value: 'child_skill', isDynamic: false },
        ],
        1,
        patch,
      ),
    ).toEqual({
      definitionLevel: 1,
      declaredDefaults: { duration: 5, damage_up: 0.1 },
      levels: [1, 2],
      values: { duration: 5, damage_up: [0.2, 0.3], patch_only: [1, 2] },
    });
  });

  it('只在请求等级精确命中时应用补丁，未指定或缺失等级保留定义默认值', () => {
    const resolved = resolveSkillBlackboardSource(
      [
        { key: 'damage_up', value: 0.1, isDynamic: false },
        { key: 'runtime', value: 9, isDynamic: true },
      ],
      1,
      {
        levels: [2],
        blackboard: { damage_up: [0.3], patch_only: [4] },
        cooldownSeconds: [0],
        costTypes: [0],
        costValues: [0],
      },
    );
    expect(selectSkillBlackboardLevel(resolved, null)).toEqual({
      level: 1,
      patchApplied: false,
      values: { damage_up: 0.1 },
    });
    expect(selectSkillBlackboardLevel(resolved, 99)).toEqual({
      level: 1,
      patchApplied: false,
      values: { damage_up: 0.1 },
    });
    expect(selectSkillBlackboardLevel(resolved, 2)).toEqual({
      level: 2,
      patchApplied: true,
      values: { damage_up: 0.3, patch_only: 4 },
    });
  });

  it('公共编译入口先合并 Patch，再把逐等级值注入条件与动作来源', () => {
    const source = passiveFixture();
    source.blackboard = [{ key: 'hp_ratio', valueDouble: 0, valueStr: '', isDynamic: false }];
    const patch: SkillPatchSource = {
      levels: [1, 2],
      blackboard: { hp_ratio: [0.5, 0.8] },
      cooldownSeconds: [0, 0],
      costTypes: [0, 0],
      costValues: [0, 0],
    };
    const compiled = compilePassiveSkillSource(source, 'passive_fixture.json', patch);
    expect(compiled.blackboard).toEqual({
      definitionLevel: 1,
      declaredDefaults: { hp_ratio: 0 },
      levels: [1, 2],
      values: { hp_ratio: [0.5, 0.8] },
    });
    expect(compiled.skill.toggleBuffs[0]?.conditions[0]).toMatchObject({
      kind: 'currentHpRatio',
      value: { levelValues: [0.5, 0.8] },
    });
  });
});

function passiveFixture(): Record<string, unknown> {
  return {
    actionGroupData: {
      timelineActions: [],
      passiveEventActions: [{ abilityEvent: 'OnBuffStart', actions: [sequence([])] }],
    },
    aiExclusiveFrame: 0,
    attackRangeType: 'Default',
    blackboard: [],
    buffs: [buffInstall('buff_startup', true)],
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
    passiveSkillType: 'ToggleBuff',
    rootMotionCliffCheck: false,
    selectStrategy: {},
    showNotRecommendState: false,
    skillHighlightCondition: {},
    skillId: 'passive_fixture',
    skillName: '',
    skillSpecification: 'Default',
    skillTags: { predefinedTag: [{ tagId: -123 }] },
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
    toggleBuffs: [
      {
        conditions: [
          {
            $type: 'Beyond.Gameplay.Core.Abilities.Condition.CheckCurHpRatio, Gameplay.Beyond',
            compareType: 'GE',
            value: scalarFixture(0, 'hp_ratio'),
          },
        ],
        buffs: [buffInstall('buff_toggle', false)],
      },
    ],
    uiRangeHints: [],
    useAIExclusiveFrame: false,
  };
}

function buffInstall(buffId: string, assignBlackboard: boolean): Record<string, unknown> {
  return {
    buffId,
    assignBlackboard,
    assignItems: assignBlackboard
      ? [
          {
            targetKey: 'damage_up',
            inputValueKey: 'damage_up',
            useDirectValue: false,
            directValueType: 'Numeric',
            numericValue: 0,
            stringValue: '',
          },
        ]
      : [],
  };
}

function sequence(actionData: unknown[]): Record<string, unknown> {
  return {
    actionData,
    onlyExecuteWhenSourceIsMainChar: false,
    onlyExecuteWhenSourceIsGuard: false,
  };
}
