import { describe, expect, it } from 'vitest';

import { parseNativeAbilityEntityTemplateSource } from '../src/index.ts';
import { abilityEntityFixture } from './sourceFixtures.ts';

describe('AbilityEntityTemplateData 来源', () => {
  it('新版模板名可与 ID 不同，不进入运行投影或改变身份', () => {
    const raw = abilityEntityFixture();
    expect(
      parseNativeAbilityEntityTemplateSource({ ...raw, name: 'shared-template-label' }, 'entity'),
    ).toEqual(parseNativeAbilityEntityTemplateSource(raw, 'entity'));
  });

  it.each([null, undefined, 1, {}])('拒绝非法模板名 %j', name => {
    expect(() =>
      parseNativeAbilityEntityTemplateSource({ ...abilityEntityFixture(), name }, 'entity'),
    ).toThrow('entity.name');
  });

  it('完整保留静态身份、标签、动态寿命与动态叠层来源', () => {
    expect(
      parseNativeAbilityEntityTemplateSource(abilityEntityFixture(), 'AbilityEntityData.fixture'),
    ).toMatchObject({
      gameId: 'abilityentity_fixture',
      factionNativeValue: 2,
      bornTagIds: [-1, 2],
      lifeTypeNativeValue: 0,
      durationSeconds: 45,
      durationBlackboard: {
        value: 0,
        blackboardKey: 'EntityBB_duration',
        levelValues: null,
      },
      maxStackingCount: 5,
      maxStackingCountBlackboard: {
        value: 18,
        blackboardKey: 'EntityBB_limit',
      },
      componentCount: 4,
      managedReferenceCount: 6,
    });
  });

  it('保留能力系统声明的活动技能和已启用被动技能', () => {
    const parsed = parseNativeAbilityEntityTemplateSource(
      {
        ...abilityEntityFixture(),
        skillDataBundle: {
          allActiveSkillIds: ['active_a', 'active_b'],
          allPassiveSkillIds: ['passive_a'],
          enabledPassiveSkillIds: ['passive_a'],
        },
      },
      'AbilityEntityData.fixture',
    );
    expect(parsed.skillDataBundle).toEqual({
      allActiveSkillIds: ['active_a', 'active_b'],
      allPassiveSkillIds: ['passive_a'],
      enabledPassiveSkillIds: ['passive_a'],
    });
  });

  it('保留能力系统实体黑板的数值、字符串和动态声明', () => {
    const parsed = parseNativeAbilityEntityTemplateSource(
      {
        ...abilityEntityFixture(),
        entityBlackboard: [
          { key: 'EntityBB_damage', valueDouble: 5.5, valueStr: '', isDynamic: true },
          { key: 'EntityBB_label', valueDouble: 0, valueStr: 'bat', isDynamic: false },
        ],
      },
      'AbilityEntityData.fixture',
    );
    expect(parsed.entityBlackboard).toEqual([
      { key: 'EntityBB_damage', value: 5.5, isDynamic: true },
      { key: 'EntityBB_label', value: 'bat', isDynamic: false },
    ]);
  });

  it('拒绝启用未在全部被动列表中声明的技能', () => {
    expect(() =>
      parseNativeAbilityEntityTemplateSource(
        {
          ...abilityEntityFixture(),
          skillDataBundle: {
            allActiveSkillIds: [],
            allPassiveSkillIds: [],
            enabledPassiveSkillIds: ['passive_a'],
          },
        },
        'AbilityEntityData.fixture',
      ),
    ).toThrow(/is not declared/);
  });

  it('新增模板字段会失败关闭，避免旧来源层静默丢行为', () => {
    expect(() =>
      parseNativeAbilityEntityTemplateSource(
        { ...abilityEntityFixture(), unknownComponentFact: true },
        'AbilityEntityData.fixture',
      ),
    ).toThrow(/unexpected fields/);
  });

  it('拒绝超出原生 int32 位模式的 born tag', () => {
    expect(() =>
      parseNativeAbilityEntityTemplateSource(
        { ...abilityEntityFixture(), bornTagIds: [0x80000000] },
        'AbilityEntityData.fixture',
      ),
    ).toThrow(/signed 32-bit GameplayTag ID/);
  });
});
