import { describe, expect, it } from 'vitest';

import { parseNativeAbilityEntityTemplateSource } from '../src/index.ts';
import { abilityEntityFixture } from './sourceFixtures.ts';
import { parseAbilityEntityBlackboardReceiverSource } from '../src/source/abilityEntity.ts';

describe('AbilityEntityTemplateData 来源', () => {
  const bundle = (ids: string[] = []) => ({
    allNormalAttackId: [],
    allActiveSkillId: ids,
    allPassiveSkillId: [],
    normalAttackList: [],
    enabledBreakingNormalAttacks: [],
    enabledPassiveSkills: [],
    normalSkillId: '',
    ultimateSkillId: '',
    plungingAttackStartId: '',
    plungingAttackEndId: '',
    dodgeSkillId: '',
    comboSkillId: '',
    comboSkillConditions: [] as unknown[],
    activeSkillTypeOverrides: { keys: [] as string[], values: [] as number[] },
  });
  const completeEntity = () => ({
    ...abilityEntityFixture(),
    nativeData: {
      decodeStatus: 'complete',
      id: 'abilityentity_fixture',
      template: {
        id: 'abilityentity_fixture',
        componentList: ['3010137844548109172'],
        skillDataBundle: bundle(['root_skill']),
      },
      components: {
        '3010137844548109172': {
          type: 'Beyond.Gameplay.Core.AbilitySystemData',
          data: {
            skillDataBundle: bundle(['component_skill']),
            modeConfig: { modes: [] as unknown[] },
            dashBuff: [{ buffId: 'buff_a' }],
            buffDuringPoiseExist: [],
            buffDuringZeroPoise: [],
            maxPotentialEffectBuffId: '',
          },
        },
      },
    },
  });

  it('完整模板同时追踪根技能包、组件技能包和 Buff，保留原始字段供黑板扫描', () => {
    const raw = completeEntity();
    const receiver = parseAbilityEntityBlackboardReceiverSource(raw, 'entity');
    expect(receiver.complete).toBe(true);
    expect(receiver.value).toBe(raw);
    expect(receiver.references.map(item => item.id)).toEqual([
      'root_skill',
      'component_skill',
      'buff_a',
    ]);
  });

  it('实体技能类型来自本实体注册表，明确类型优先于通用覆盖', () => {
    const raw = completeEntity();
    const root = raw.nativeData.template.skillDataBundle;
    root.comboSkillId = 'root_skill';
    root.activeSkillTypeOverrides = { keys: ['root_skill'], values: [7] };
    const component = raw.nativeData.components['3010137844548109172'].data.skillDataBundle;
    component.activeSkillTypeOverrides = { keys: ['component_skill'], values: [8] };
    expect(parseNativeAbilityEntityTemplateSource(raw, 'entity').activeSkillTypes).toEqual({
      root_skill: 'comboSkill',
      component_skill: 'extraActiveSkill',
    });
  });

  it('同实体重复注册的技能类型冲突不能静默覆盖', () => {
    const raw = completeEntity();
    const component = raw.nativeData.components['3010137844548109172'].data.skillDataBundle;
    component.allActiveSkillId = ['root_skill'];
    component.activeSkillTypeOverrides = { keys: ['root_skill'], values: [7] };
    expect(() => parseNativeAbilityEntityTemplateSource(raw, 'entity')).toThrow(
      'conflicting native type for skill root_skill',
    );
  });

  it('模板其他部分未解码时，独立技能注册表仍提供明确类型', () => {
    const raw = {
      ...abilityEntityFixture(),
      nativeData: { decodeStatus: 'partial', reason: 'mount points' },
      skillRegistration: { ...bundle(['skill']), ultimateSkillId: 'skill' },
    };
    expect(parseNativeAbilityEntityTemplateSource(raw, 'entity').activeSkillTypes).toEqual({
      skill: 'ultimateSkill',
    });
  });

  it('技能注册资源路径和纯 ID 使用同一身份', () => {
    const raw = {
      ...abilityEntityFixture(),
      nativeData: { decodeStatus: 'partial', reason: 'mount points' },
      skillRegistration: {
        ...bundle(['SkillData/Character/example/skill.json']),
        ultimateSkillId: 'skill',
      },
    };
    expect(parseNativeAbilityEntityTemplateSource(raw, 'entity').activeSkillTypes).toEqual({
      skill: 'ultimateSkill',
    });
  });

  it.each(['condition', 'mode', 'component'])('未支持的 %s 不会被完整解码标记掩盖', kind => {
    const raw = completeEntity();
    if (kind === 'condition') raw.nativeData.template.skillDataBundle.comboSkillConditions.push({});
    if (kind === 'mode')
      raw.nativeData.components['3010137844548109172'].data.modeConfig.modes.push({});
    if (kind === 'component') raw.nativeData.components['3010137844548109172'].type = 'Unknown';
    expect(parseAbilityEntityBlackboardReceiverSource(raw, 'entity').complete).toBe(false);
  });

  it('完整模板缺少根组件引用或身份不一致时拒绝', () => {
    const raw = completeEntity();
    raw.nativeData.template.componentList.push('missing');
    expect(() => parseAbilityEntityBlackboardReceiverSource(raw, 'entity')).toThrow(
      'missing component',
    );
    raw.nativeData.id = 'wrong';
    expect(() => parseAbilityEntityBlackboardReceiverSource(raw, 'entity')).toThrow('ID mismatch');
  });

  it('黑板检查收集全部已登记技能，但逻辑前缀始终不代表完整组件', () => {
    const raw = {
      ...abilityEntityFixture(),
      skillDataBundle: {
        allActiveSkillIds: ['active'],
        allPassiveSkillIds: ['passive', 'disabled'],
        enabledPassiveSkillIds: ['passive'],
      },
    };
    const receiver = parseAbilityEntityBlackboardReceiverSource(raw, 'entity');
    expect(receiver.complete).toBe(false);
    expect(receiver.value).toBe(raw);
    expect(receiver.references.map(reference => reference.id)).toEqual([
      'active',
      'passive',
      'disabled',
      'passive',
    ]);
    expect(
      parseAbilityEntityBlackboardReceiverSource(abilityEntityFixture(), 'entity'),
    ).toMatchObject({ complete: false, references: [] });
  });
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
