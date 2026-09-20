import { fixtureGameplayTagRegistry } from '../gameplayTagFixtures.ts';
import { describe, expect, it } from 'vitest';
import { parseComboSkillConditionsSource } from '../../src/source/comboSkillConditions.ts';
import {
  compilePendingComboConditionSource,
  compileComboSkillConditionDefinitionSource,
} from '../../src/compiler/conditions/comboSkillConditions.ts';
import { compileAbilitySystemBlackboardsSource } from '../../src/compiler/abilities/abilitySystemBlackboards.ts';
import { parseAbilitySystemBlackboardsSource } from '../../src/source/abilitySystemBlackboards.ts';
import { scalarFixture, targetFixture } from '../sourceFixtures.ts';

const context = {
  gameplayTagRegistry: fixtureGameplayTagRegistry,
  actionOwnerTarget: 'caster',
  actionSourceTarget: 'caster',
  actionTargetTarget: 'eventTarget',
} as const;
function record(event = 121) {
  return {
    comboSkillEvent: event,
    comboSkillConditionImmediately: false,
    comboSkillCheckAction: {
      onlyExecuteWhenSourceIsMainChar: false,
      onlyExecuteWhenSourceIsGuard: false,
      actionData: [] as unknown[],
    },
  };
}
function parse(value: unknown) {
  return parseComboSkillConditionsSource(value, 'bundle.comboSkillConditions', {});
}

describe('公共连携条件来源与 Pending 编译', () => {
  it.each(['Owner', 'Source'])('待释放连携检查复用公共条件解析：%s', targetSource => {
    const entry = record();
    entry.comboSkillCheckAction.actionData = [
      {
        $type: 'Beyond.Gameplay.Core.CheckComboSkillPending+Data, Gameplay.Beyond',
        isEnable: true,
        priorityLevel: 'Default',
        priorityOffset: 0,
        serverActionIndex: 1004,
        owner: targetFixture(targetSource),
      },
    ];
    const source = parse([entry])[0]!;
    expect(compilePendingComboConditionSource(source, context).sequence.steps[0]).toMatchObject({
      parameters: { condition: { kind: 'casterComboPending' } },
    });
    expect(() =>
      compilePendingComboConditionSource(source, {
        ...context,
        actionOwnerTarget: 'buffOwner',
        actionSourceTarget: 'buffSource',
      }),
    ).toThrow('proven plain caster target');
    entry.comboSkillCheckAction.actionData = [
      {
        ...(entry.comboSkillCheckAction.actionData[0] as object),
        owner: targetFixture('Context', undefined, 'trigger'),
      },
    ];
    expect(() => compilePendingComboConditionSource(parse([entry])[0]!, context)).toThrow(
      'proven plain caster target',
    );
  });
  it.each([true, false])('定义投影从已审计初值安装局部板（启用=%s），来源单独保留', enabled => {
    const pair = (key: string, valueDouble: number) => ({
      key,
      valueDouble,
      valueStr: '',
      isDynamic: true,
    });
    const blackboards = compileAbilitySystemBlackboardsSource(
      parseAbilitySystemBlackboardsSource(
        {
          entityBlackboard: [pair('EntityBB_value', 7)],
          skillDataBundle: {
            enableComboSkillBlackboard: enabled,
            comboSkillBlackboard: [pair('local', 3)],
          },
        },
        'character',
      ),
    );
    const source = parse([record()])[0]!;
    const result = compileComboSkillConditionDefinitionSource(
      source,
      blackboards,
      { key: 'check', skillKey: 'combo' },
      context,
    );
    expect(result.definition).toEqual({
      key: 'check',
      skillKey: 'combo',
      event: 'beforeTakeInfliction',
      immediately: false,
      initialValues: enabled ? { local: 3 } : null,
      sequence: { steps: [] },
    });
    expect(result.source.condition).toBe(source);
    expect(result.source.blackboards).toBe(blackboards.source);
    expect(result.definition).not.toHaveProperty('source');
    if (enabled)
      expect(result.definition.initialValues).not.toBe(blackboards.comboConditionInitialValues);
  });
  it('绑定必须明确提供身份，不能从游戏 ID 拼写猜技能组', () => {
    const blackboards = compileAbilitySystemBlackboardsSource(
      parseAbilitySystemBlackboardsSource(
        {
          entityBlackboard: [],
          skillDataBundle: { enableComboSkillBlackboard: true, comboSkillBlackboard: [] },
        },
        'character',
      ),
    );
    for (const binding of [
      { key: '', skillKey: 'combo' },
      { key: 'check', skillKey: '' },
    ])
      expect(() =>
        compileComboSkillConditionDefinitionSource(
          parse([record()])[0]!,
          blackboards,
          binding,
          context,
        ),
      ).toThrow('binding');
    expect(
      compileComboSkillConditionDefinitionSource(
        parse([{ ...record(), comboSkillConditionImmediately: true }])[0]!,
        blackboards,
        { key: 'check', skillKey: 'combo' },
        context,
      ).definition.immediately,
    ).toBe(true);
  });
  it('依赖 InputTarget 的条件按事件方向投影为独立动作输入目标', () => {
    const value = record();
    value.comboSkillCheckAction.actionData = [
      {
        $type: 'Beyond.Gameplay.Core.Conditions.CheckObjectTypeMatch+Data, Gameplay.Beyond',
        isEnable: true,
        priorityLevel: 'Default',
        priorityOffset: 0,
        serverActionIndex: 1,
        target: targetFixture('Target'),
        objectTypeMask: 16,
      },
    ];
    const source = parse([value])[0]!;
    expect(compilePendingComboConditionSource(source, context)).toMatchObject({
      event: 'beforeTakeInfliction',
      sequence: {
        steps: [
          {
            parameters: {
              condition: { kind: 'actionInputTargetObjectTypeMatch', objectTypes: ['enemy'] },
            },
          },
        ],
      },
    });
  });
  it('Context.trigger 的生命条件保留为运行时命名目标查询', () => {
    const value = record(12);
    value.comboSkillCheckAction.actionData = [
      {
        $type: 'Beyond.Gameplay.Core.Conditions.CheckHp+Data, Gameplay.Beyond',
        isEnable: true,
        priorityLevel: 'Default',
        priorityOffset: 0,
        serverActionIndex: 1001,
        hpOwner: targetFixture('Context', undefined, 'trigger'),
        compare: 'LT',
        isRatio: true,
        value: scalarFixture(0.4),
      },
    ];
    expect(compilePendingComboConditionSource(parse([value])[0]!, context)).toMatchObject({
      sequence: {
        steps: [
          {
            parameters: {
              condition: {
                kind: 'healthCompare',
                target: 'contextTarget',
                contextKey: 'trigger',
                valueType: 'ratio',
                operator: 'less',
                value: { kind: 'constant', value: 0.4 },
              },
            },
          },
        ],
      },
    });
  });
  it('Context.trigger 的简单 Buff ID 层数条件复用公共命名目标协议', () => {
    const value = record(12);
    value.comboSkillCheckAction.actionData = [
      {
        $type: 'Beyond.Gameplay.Core.Conditions.CheckBuffStackNum+Data, Gameplay.Beyond',
        isEnable: true,
        priorityLevel: 'Default',
        priorityOffset: 0,
        serverActionIndex: 1002,
        checkTarget: targetFixture('Context', undefined, 'trigger'),
        buffId: { buffId: 'buff_physical_no_guard' },
        compareType: 'GE',
        value: scalarFixture(3),
      },
    ];
    expect(compilePendingComboConditionSource(parse([value])[0]!, context)).toMatchObject({
      sequence: {
        steps: [
          {
            parameters: {
              condition: {
                kind: 'contextTargetBuffIdStackCompare',
                contextKey: 'trigger',
                buffIds: ['buff_physical_no_guard'],
                operator: 'greaterOrEqual',
                value: { kind: 'constant', value: 3 },
              },
            },
          },
        ],
      },
    });
  });
  it.each([
    [9, 'addedBuff'],
    [102, 'outputBuff'],
    [101, 'beforeTakeDamage'],
    [302, 'beforeOutputDamage'],
    [12, 'takeDamage'],
    [13, 'outputDamage'],
    [126, 'beforeOutputInfliction'],
    [121, 'beforeTakeInfliction'],
    [129, 'afterOutputInfliction'],
    [130, 'afterTakeInfliction'],
    [204, 'buffEndsEarly'],
    [208, 'buffConsumed'],
    [211, 'buffAbsorbed'],
    [21, 'poiseZero'],
    [241, 'poiseKnotBreak'],
  ] as const)('原生事件 %s → %s', (id, event) => {
    const source = parse([record(id)])[0]!;
    const result = compilePendingComboConditionSource(source, context);
    expect(result).toEqual({ source, event, sequence: { steps: [] } });
    expect(result.source.sourcePath).toBe('bundle.comboSkillConditions[0]');
  });
  it('OnTakeDamage 的 Burst 掩码由公共伤害条件投影为四种可读标签', () => {
    const value = record(12);
    value.comboSkillCheckAction.actionData = [
      {
        $type: 'Beyond.Gameplay.Core.Conditions.CheckDamageDecorateMask+Data, Gameplay.Beyond',
        isEnable: true,
        priorityLevel: 'Default',
        priorityOffset: 0,
        serverActionIndex: 1001,
        checkType: 'HasAny',
        mask: 62914560,
      },
    ];
    expect(compilePendingComboConditionSource(parse([value])[0]!, context)).toMatchObject({
      event: 'takeDamage',
      sequence: {
        steps: [
          {
            parameters: {
              condition: {
                kind: 'eventDamageTagsMatch',
                match: 'hasAny',
                tags: ['fireBurst', 'cryoBurst', 'electricBurst', 'natureBurst'],
              },
            },
          },
        ],
      },
    });
  });
  it('按来源保留多条注册，不合并相同事件或空序列', () => {
    const source = parse([record(), record()]);
    expect(source).toHaveLength(2);
    expect(source[0]).not.toBe(source[1]);
    expect(parse([])).toEqual([]);
  });
  it.each([0, 125, 999])('公共词汇尚不认识的事件 %s 不能冒充支持', id => {
    expect(() => compilePendingComboConditionSource(parse([record(id)])[0]!, context)).toThrow(
      `unsupported ability event ${id}`,
    );
  });
  it('来源与编译结果都保留立即施放事实，不在转换器偷换成开窗口', () => {
    const value = record();
    value.comboSkillConditionImmediately = true;
    const source = parse([value])[0]!;
    expect(source.immediately).toBe(true);
    expect(compilePendingComboConditionSource(source, context).source.immediately).toBe(true);
  });
  it('ReturnFalseAction 作为公共常量条件保留原生序列返回值', () => {
    const value = record(12);
    value.comboSkillCheckAction.actionData = [
      {
        $type: 'Beyond.Gameplay.Core.ReturnFalseAction+Data, Gameplay.Beyond',
        isEnable: true,
        priorityLevel: 'Default',
        priorityOffset: 0,
        serverActionIndex: 1000,
      },
    ];
    expect(compilePendingComboConditionSource(parse([value])[0]!, context)).toMatchObject({
      sequence: {
        steps: [
          {
            kind: 'conditional',
            parameters: { condition: { kind: 'constant', value: false } },
            whenTrue: { steps: [] },
          },
        ],
      },
    });
  });
  it.each(['onlyExecuteWhenSourceIsMainChar', 'onlyExecuteWhenSourceIsGuard'] as const)(
    '尚未接通 %s 时严格失败',
    flag => {
      const value = record();
      value.comboSkillCheckAction[flag] = true;
      expect(() => compilePendingComboConditionSource(parse([value])[0]!, context)).toThrow();
    },
  );
  it.each([
    null,
    {},
    [null],
    [{ ...record(), extraField: 1 }],
    [{ ...record(), comboSkillEvent: '121' }],
  ])('严格拒绝损坏形状 %j', value => {
    expect(() => parse(value)).toThrow('bundle.comboSkillConditions');
  });
  it('未展开 RID 不能当作空/无条件序列', () => {
    const value = record();
    value.comboSkillCheckAction.actionData = ['2708501211437859835'];
    expect(() => parse([value])).toThrow('comboSkillCheckAction');
  });
});
