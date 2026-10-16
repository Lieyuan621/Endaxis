import { describe, expect, it } from 'vitest';
import { compileAbilityEntityDefinitionSource } from '../../src/compiler/abilities/abilityEntityDefinition.ts';
import { parseNativeAbilityEntityTemplateSource } from '../../src/source/abilityEntity.ts';
import { abilityEntityFixture } from '../sourceFixtures.ts';

describe('能力实体模板定义投影', () => {
  it('未登记子技能不加载资源，已登记但资源缺失仍报错', () => {
    const template = {
      ...parseNativeAbilityEntityTemplateSource(abilityEntityFixture(), 'fixture'),
      bornTagIds: [],
      activeSkillTypes: {},
    };
    const loadSkill = () => {
      throw new Error('missing resource');
    };
    expect(
      compileAbilityEntityDefinitionSource(template, 'obsolete', loadSkill).childSkill,
    ).toBeUndefined();
    expect(() =>
      compileAbilityEntityDefinitionSource(
        { ...template, activeSkillTypes: { registered: 'extraActiveSkill' } },
        'registered',
        loadSkill,
      ),
    ).toThrow('missing resource');
  });
  it('灵体初始化不能静默忽略禁用状态或部位属性覆盖', () => {
    for (const [fields, expected] of [
      [{ defaultEnabled: false, partAttributes: [] }, 'disabled soul initialization'],
      [{ defaultEnabled: true, partAttributes: [{}] }, 'soul attribute overrides'],
    ] as const) {
      expect(() =>
        parseNativeAbilityEntityTemplateSource(
          {
            ...abilityEntityFixture(),
            skillRegistration: {
              allActiveSkillId: [],
              normalSkillId: '',
              ultimateSkillId: '',
              comboSkillId: '',
              dodgeSkillId: '',
              activeSkillTypeOverrides: { keys: [], values: [] },
            },
            nativeData: {
              decodeStatus: 'complete',
              template: { componentList: ['soul'] },
              components: {
                soul: {
                  type: 'Beyond.Gameplay.Core.AbilitySystemForSoulData',
                  data: fields,
                },
              },
            },
          },
          'fixture',
        ),
      ).toThrow(expected);
    }
  });
  it('灵体不能静默生成普通能力实体，即使没有子技能', () => {
    const template = parseNativeAbilityEntityTemplateSource(
      { ...abilityEntityFixture(), abilitySystemType: 'AbilitySystemForSoulData' },
      'fixture',
    );
    expect(() => compileAbilityEntityDefinitionSource(template, [], () => ({}))).toThrow(
      'native part/soul damage routing is required',
    );
  });
  it('保留已由控制器死亡计时器证明的非零回收延迟', () => {
    const template = parseNativeAbilityEntityTemplateSource(
      {
        ...abilityEntityFixture(),
        bornTagIds: [],
        durationBlackboard: { useBlackboardKey: false, value: 0, blackboardKey: '' },
        maxDurationForServerSeconds: 0,
        maxStackingCount: -1,
        maxStackingCountBlackboard: { useBlackboardKey: false, value: 0, blackboardKey: '' },
        delayToRecycleSeconds: 0.1,
      },
      'fixture',
    );

    expect(compileAbilityEntityDefinitionSource(template, '', () => ({}))).toEqual({
      faction: 'good',
      lifetime: { kind: 'limited', durationSeconds: 45 },
      deathReleaseDelaySeconds: 0.1,
    });
  });

  it('拒绝原生特殊的 300 秒以上回收分支', () => {
    const template = parseNativeAbilityEntityTemplateSource(
      {
        ...abilityEntityFixture(),
        bornTagIds: [],
        durationBlackboard: { useBlackboardKey: false, value: 0, blackboardKey: '' },
        maxDurationForServerSeconds: 0,
        maxStackingCount: -1,
        maxStackingCountBlackboard: { useBlackboardKey: false, value: 0, blackboardKey: '' },
        delayToRecycleSeconds: 300,
      },
      'fixture',
    );

    expect(() => compileAbilityEntityDefinitionSource(template, '', () => ({}))).toThrow(
      'unsupported AbilityEntity lifetime/stacking projection',
    );
  });

  it('保留生成时从实体黑板覆盖的寿命与堆叠上限，并忽略服务端寿命上限', () => {
    const template = parseNativeAbilityEntityTemplateSource(
      {
        ...abilityEntityFixture(),
        bornTagIds: [],
        durationBlackboard: {
          useBlackboardKey: true,
          value: 45,
          blackboardKey: 'EntityBB_duration',
        },
        maxDurationForServerSeconds: 60,
        maxStackingCount: 5,
        maxStackingCountBlackboard: {
          useBlackboardKey: true,
          value: 18,
          blackboardKey: 'EntityBB_limit',
        },
      },
      'fixture',
    );

    expect(compileAbilityEntityDefinitionSource(template, '', () => ({}))).toEqual({
      faction: 'good',
      lifetime: {
        kind: 'limited',
        durationSeconds: { blackboardKey: 'EntityBB_duration', fallback: 45 },
      },
      maxStackingCount: { blackboardKey: 'EntityBB_limit', fallback: 5 },
    });
  });

  it('优先使用原生 BlackboardDouble 中启用的直接寿命值', () => {
    const template = parseNativeAbilityEntityTemplateSource(
      {
        ...abilityEntityFixture(),
        bornTagIds: [],
        durationSeconds: 1,
        durationBlackboard: { useBlackboardKey: false, value: 3, blackboardKey: '' },
        maxStackingCount: -1,
        maxStackingCountBlackboard: { useBlackboardKey: false, value: 0, blackboardKey: '' },
      },
      'fixture',
    );

    expect(compileAbilityEntityDefinitionSource(template, '', () => ({}))).toEqual({
      faction: 'good',
      lifetime: { kind: 'limited', durationSeconds: 3 },
    });
  });

  it('使用原生 BlackboardDouble 的直接值作为动态寿命回退值', () => {
    const template = parseNativeAbilityEntityTemplateSource(
      {
        ...abilityEntityFixture(),
        bornTagIds: [],
        durationSeconds: 1,
        durationBlackboard: {
          useBlackboardKey: true,
          value: 3,
          blackboardKey: 'EntityBB_duration',
        },
        maxStackingCount: -1,
        maxStackingCountBlackboard: { useBlackboardKey: false, value: 0, blackboardKey: '' },
      },
      'fixture',
    );

    expect(compileAbilityEntityDefinitionSource(template, '', () => ({}))).toEqual({
      faction: 'good',
      lifetime: {
        kind: 'limited',
        durationSeconds: { blackboardKey: 'EntityBB_duration', fallback: 3 },
      },
    });
  });
});
