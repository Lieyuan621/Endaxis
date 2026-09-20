import { fixtureGameplayTagRegistry } from './gameplayTagFixtures.ts';
import { describe, expect, it } from 'vitest';
import { parseBuffRuntimeSource, compileBuffRuntimeDefinitionSource } from '../src/index.ts';
import { scalarFixture, targetFixture, buffFixture, iconFixture } from './sourceFixtures.ts';

describe('Buff 运行时公共来源', () => {
  it.each(['OnBeforeOutputDamage', 'OnBeforeDamageAction', 'OnOutputDamage'])(
    '干员输出事件 %s 的血量守卫读取敌人，不读取 Buff 持有者',
    abilityEvent => {
      const meta = {
        isEnable: true,
        priorityLevel: 'Default',
        priorityOffset: 0,
        serverActionIndex: 0,
      };
      const source = parseBuffRuntimeSource(
        buffFixture({
          abilityEventAction: [
            {
              abilityEvent,
              actions: [
                sequence([
                  {
                    ...meta,
                    $type: 'Beyond.Gameplay.Core.Conditions.CheckHp+Data, Gameplay.Beyond',
                    hpOwner: targetFixture('Target'),
                    compare: 'GT',
                    isRatio: false,
                    value: scalarFixture(0),
                  },
                  {
                    ...meta,
                    $type: 'Beyond.Gameplay.Core.SimpleCalcBBAction+Data, Gameplay.Beyond',
                    key: 'observed',
                    operation: 'Add',
                    value1: scalarFixture(1),
                    value2: scalarFixture(2),
                  },
                ]),
              ],
            },
          ],
        }),
        'BuffData.health_output',
      );
      const compile = (fixedBuffOwnerTarget: 'caster' | 'enemy') =>
        compileBuffRuntimeDefinitionSource(source, undefined, undefined, undefined, undefined, {
          gameplayTagRegistry: fixtureGameplayTagRegistry,
          fixedBuffOwnerTarget,
          fixedBuffSourceTarget: 'caster',
        });
      expect(compile('caster').abilityEventResponses?.[0]?.sequence.steps[0]).toMatchObject({
        kind: 'conditional',
        parameters: {
          condition: {
            kind: 'healthCompare',
            target: 'enemy',
            valueType: 'current',
            operator: 'greater',
            value: { kind: 'constant', value: 0 },
          },
        },
        whenTrue: { steps: [{ kind: 'calculateActionValue' }] },
      });
      expect(() => compile('enemy')).toThrow('unsupported health condition target');
    },
  );

  it('新版关闭直接头顶显示时不改变图标、显示资格或生命周期', () => {
    const old = buffFixture({ hasIcon: true, lifeType: 'Limited', duration: scalarFixture(15) });
    const current = { ...old, iconConfig: { ...iconFixture(), showDirectlyInHeadBuff: false } };
    expect(parseBuffRuntimeSource(current, 'buff')).toEqual(parseBuffRuntimeSource(old, 'buff'));
  });

  it('新增直接显示资格不能当作普通渲染参数省略', () => {
    expect(() =>
      parseBuffRuntimeSource(
        buffFixture({
          iconConfig: { ...iconFixture(), showDirectlyInHeadBuff: true },
        }),
        'buff',
      ),
    ).toThrow('direct head buff display requires native routing projection');
  });

  it.each([null, undefined, 0, 'false', {}])(
    '直接显示开关严格校验显式值 %j',
    showDirectlyInHeadBuff => {
      expect(() =>
        parseBuffRuntimeSource(
          buffFixture({
            iconConfig: { ...iconFixture(), showDirectlyInHeadBuff },
          }),
          'buff',
        ),
      ).toThrow('buff.iconConfig.showDirectlyInHeadBuff');
    },
  );

  it('保留生命周期、图标、属性修正和可执行技能类型条件', () => {
    const parsed = parseBuffRuntimeSource(
      buffFixture({
        hasIcon: true,
        blackboard: [
          { key: 'atk_up', valueDouble: 0.05, valueStr: '', isDynamic: false },
          { key: 'duration', valueDouble: 15, valueStr: '', isDynamic: false },
        ],
        duration: scalarFixture(0, 'duration'),
        lifeType: 'Limited',
        attributeModifier: {
          isConvertedAttribute: false,
          attributeModifiers: [
            {
              modifyAttributeType: 'Specific',
              attributeType: 'Atk',
              formulaItem: 'BaseMultiplier',
              param: scalarFixture(0, 'atk_up'),
            },
          ],
        },
        abilityEventAction: [
          {
            abilityEvent: 'OnBeforeCastSkill',
            actions: [sequence([checkSkillType('NormalSkill')])],
          },
          {
            abilityEvent: 'OnBeforeCastSkill',
            actions: [sequence([checkOriginSkillType('NormalSkill')])],
          },
        ],
      }),
      'BuffData.buff_fixture',
    );

    expect(parsed.presentation).toMatchObject({
      hasIcon: true,
      spritePath: 'icon_battle_buff_atk_up',
      showInSquadIcon: true,
    });
    expect(parsed.lifecycle).toMatchObject({
      lifeType: 'Limited',
      stackingType: 'Refresh',
      stackEffectCount: 0,
    });
    expect(parsed.lifecycle.duration).toEqual({
      value: 0,
      blackboardKey: 'duration',
      levelValues: 15,
    });
    expect(parsed.applyTagIds).toEqual([-1757502026]);
    expect(parsed.attributeModifiers.modifiers[0]?.parameter).toEqual({
      value: 0,
      blackboardKey: 'atk_up',
      levelValues: 0.05,
    });
    expect(parsed.graph.abilityEvents[0]?.actions[0]?.actions[0]?.body).toMatchObject({
      kind: 'leaf',
      value: { family: 'condition', action: { kind: 'skillType', skillTypes: ['NormalSkill'] } },
    });
    expect(parsed.graph.abilityEvents[1]?.actions[0]?.actions[0]?.body).toMatchObject({
      kind: 'leaf',
      value: {
        family: 'condition',
        action: {
          kind: 'originSkillType',
          skillTypes: ['NormalSkill'],
          attackTypeMask: 'All',
        },
      },
    });
    expect(parsed.unsupportedPayloads).toEqual([]);
  });

  it('保留序列化为负整数的攻击类型位掩码', () => {
    const raw = buffFixture({
      abilityEventAction: [
        {
          abilityEvent: 'OnBeforeDamageAction',
          actions: [sequence([{ ...checkOriginSkillType('Attack'), attackTypeMask: -4 }])],
        },
      ],
    });
    expect(
      parseBuffRuntimeSource(raw, 'BuffData.buff_negative_attack_mask').graph.abilityEvents[0]
        ?.actions[0]?.actions[0]?.body,
    ).toMatchObject({
      kind: 'leaf',
      value: {
        family: 'condition',
        action: { kind: 'originSkillType', skillTypes: ['Attack'], attackTypeMask: -4 },
      },
    });
  });

  it('动态默认值保持单值，但生命周期编译仍保留按黑板键求值', () => {
    const source = parseBuffRuntimeSource(
      buffFixture({
        lifeType: 'Limited',
        blackboard: [{ key: 'duration', valueDouble: 5, valueStr: '', isDynamic: true }],
        duration: scalarFixture(0, 'duration'),
      }),
      'BuffData.buff_fixture',
      { duration: [20, 30] },
    );
    // Buff 局部声明覆盖继承上下文；这里是初值，不代表安装覆盖后只能取 5。
    expect(source.lifecycle.duration).toEqual({
      value: 0,
      blackboardKey: 'duration',
      levelValues: 5,
    });
    const compiled = compileBuffRuntimeDefinitionSource(
      source,
      undefined,
      undefined,
      undefined,
      undefined,
      { gameplayTagRegistry: fixtureGameplayTagRegistry, ...{} },
    );
    expect(compiled.blackboard).toEqual({ duration: 5 });
    expect(compiled.durationSeconds).toEqual({ blackboardKey: 'duration' });
  });

  it('does not silently discard unsupported modifier payloads', () => {
    const parsed = parseBuffRuntimeSource(
      buffFixture({
        globalModifier: [{}],
      }),
      'BuffData.buff_fixture',
    );
    expect(parsed.unsupportedPayloads).toEqual([{ field: 'globalModifier', entryCount: 1 }]);
  });

  it('结构化读取普攻末段主控条件的即时失衡属性修正', () => {
    const parsed = parseBuffRuntimeSource(
      buffFixture({
        blackboard: [{ key: 'poise_up', valueDouble: 0.3, valueStr: '', isDynamic: false }],
        poiseModifier: [
          {
            enableSide: 'Attacker',
            condition: sequence([
              {
                $type:
                  'Beyond.Gameplay.Core.Conditions.CheckDamageDecorateMask+Data, Gameplay.Beyond',
                isEnable: true,
                priorityLevel: 'Default',
                priorityOffset: 0,
                serverActionIndex: 0,
                checkType: 'HasAll',
                mask: 2097152,
              },
              {
                $type:
                  'Beyond.Gameplay.Core.Conditions.CheckMainCharacterCondition+Data, Gameplay.Beyond',
                isEnable: true,
                priorityLevel: 'Default',
                priorityOffset: 0,
                serverActionIndex: 1,
                checkTarget: targetFixture('Source'),
              },
            ]),
            poiseProcessors: [
              {
                $type: 'Beyond.Gameplay.Core.InstantModifyAttributeForPoise, Gameplay.Beyond',
                modifyTargetSide: 'Attacker',
                modifier: {
                  modifyAttributeType: 'Specific',
                  attributeType: 'PoiseDamageOutputScalar',
                  formulaItem: 'BaseAddition',
                  param: scalarFixture(0, 'poise_up'),
                },
              },
            ],
          },
        ],
      }),
      'BuffData.buff_fixture',
    );

    expect(parsed.poiseModifiers).toMatchObject([
      {
        enabledSide: 'Attacker',
        condition: {
          actions: [
            { body: { value: { action: { kind: 'damageDecorateMask', mask: 2097152 } } } },
            { body: { value: { action: { kind: 'mainOperator', targetSource: 'Source' } } } },
          ],
        },
        processors: [
          {
            kind: 'instantAttribute',
            modifyTargetSide: 'Attacker',
            modifier: {
              attributeType: 'PoiseDamageOutputScalar',
              formulaItem: 'BaseAddition',
              parameter: { blackboardKey: 'poise_up', levelValues: 0.3 },
            },
          },
        ],
      },
    ]);
  });

  it('结构化读取 DefiniteValueCalculation 护盾', () => {
    const parsed = parseBuffRuntimeSource(
      buffFixture({
        blackboard: [{ key: 'shield_valid', valueDouble: 500, valueStr: '', isDynamic: false }],
        shieldConfigs: [
          {
            infinityValue: false,
            valueCalculation: {
              $type: 'Beyond.Gameplay.Core.DefiniteValueCalculation, Gameplay.Beyond',
              value: scalarFixture(0, 'shield_valid'),
              applyScale: false,
              valueScale: scalarFixture(0),
            },
            damageAbsorptions: [],
            absorbCnt: scalarFixture(-1),
            absorbAllDmgWhenConsume: false,
            removeBuffWhenConsume: true,
            priority: 'Normal',
            replaceHitEffect: true,
            hitEffect: {},
          },
        ],
      }),
      'BuffData.buff_fixture',
    );

    expect(parsed.shields).toMatchObject([
      {
        infinityValue: false,
        value: {
          kind: 'definite',
          value: { value: 0, blackboardKey: 'shield_valid', levelValues: 500 },
          applyScale: false,
          valueScale: { value: 0, blackboardKey: null, levelValues: null },
        },
        damageAbsorptions: [],
        absorbCount: { value: -1 },
        removeBuffWhenConsumed: true,
        priority: 'Normal',
      },
    ]);
  });

  it('结构化读取带治疗 Tag 条件的即时治疗属性修正', () => {
    const parsed = parseBuffRuntimeSource(
      buffFixture({
        blackboard: [{ key: 'heal_up', valueDouble: 0.2, valueStr: '', isDynamic: false }],
        healModifier: [
          {
            enableSide: 'Healer',
            condition: sequence([
              {
                $type: 'Beyond.Gameplay.Core.Conditions.CheckHealTag+Data, Gameplay.Beyond',
                isEnable: true,
                priorityLevel: 'Default',
                priorityOffset: 0,
                serverActionIndex: 0,
                query: { queryType: 'HasAny', tags: [{ tagId: -1517158118 }] },
              },
            ]),
            healProcessors: [
              {
                $type: 'Beyond.Gameplay.Core.InstantModifyAttributeForHeal, Gameplay.Beyond',
                modifyTargetSide: 'Attacker',
                modifier: {
                  modifyAttributeType: 'Specific',
                  attributeType: 'HealOutputIncrease',
                  formulaItem: 'BaseAddition',
                  param: scalarFixture(0, 'heal_up'),
                },
              },
            ],
          },
        ],
      }),
      'BuffData.buff_fixture',
    );

    expect(parsed.healModifiers).toMatchObject([
      {
        enabledSide: 'Healer',
        condition: { actions: [{ body: { value: { action: { kind: 'healTag' } } } }] },
        processors: [
          {
            kind: 'instantAttribute',
            modifyTargetSide: 'Attacker',
            modifier: {
              attributeType: 'HealOutputIncrease',
              formulaItem: 'BaseAddition',
              parameter: { blackboardKey: 'heal_up', levelValues: 0.2 },
            },
          },
        ],
      },
    ]);
  });
});

function sequence(actionData: unknown[]): Record<string, unknown> {
  return {
    actionData,
    onlyExecuteWhenSourceIsMainChar: false,
    onlyExecuteWhenSourceIsGuard: false,
  };
}

function checkSkillType(skillType: string): Record<string, unknown> {
  return {
    $type: 'Beyond.Gameplay.Core.Conditions.CheckSkillType+Data, Gameplay.Beyond',
    isEnable: true,
    priorityLevel: 'Default',
    priorityOffset: 0,
    serverActionIndex: 0,
    checkTargetCurSkill: false,
    skillOwner: targetFixture('Target'),
    mustBeforeExclusiveTime: false,
    skillTypeList: [skillType],
    attackTypeMask: 'All',
  };
}

function checkOriginSkillType(skillType: string): Record<string, unknown> {
  return {
    $type: 'Beyond.Gameplay.Core.CheckOriginSkillType+Data, Gameplay.Beyond',
    isEnable: true,
    priorityLevel: 'Default',
    priorityOffset: 0,
    serverActionIndex: 0,
    skillTypeList: [skillType],
    attackTypeMask: 'All',
  };
}
