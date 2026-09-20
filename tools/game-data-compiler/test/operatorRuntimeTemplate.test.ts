import { describe, expect, it } from 'vitest';

import { parseOperatorRuntimeTemplateSource } from '../src/source/operatorRuntimeTemplate.ts';
import { unityComboConditionFixture } from './unityComboConditionFixture.ts';
import { auditOperatorTemplateRefresh } from '../src/audits/operatorTemplateRefresh.ts';
import { GAMEPLAY_TAG_PATHS } from '../../../src/data/combat/gameplayTagCatalog.generated.ts';

const sourceSha256 = '33934515ea8b90efdf35f3fae4901124ed54fc16c087a9755574d8db58dca0bc';
const pair = (key: string, valueDouble = 0) => ({
  key,
  valueDouble,
  valueStr: '',
  isDynamic: true,
});

function runtimeTemplate() {
  const combo = unityComboConditionFixture();
  return {
    format: 'character-template-prefix-v1',
    decodeStatus: 'partial',
    sourceSha256,
    root: {
      class: 'CharacterTemplateData',
      namespace: 'Beyond.Gameplay',
      assembly: 'Gameplay.Beyond',
    },
    abilitySystemEntry: {
      class: 'AbilitySystemData',
      namespace: 'Beyond.Gameplay.Core',
      assembly: 'Gameplay.Beyond',
    },
    data: {
      id: 'chr_0032_lizhiyan',
      dashBuff: [
        {
          buffId: 'buff_common_dash',
          assignBlackboard: true,
          assignItems: [
            {
              targetKey: 'dodgeSkillId',
              inputValueKey: '',
              useDirectValue: true,
              directValueType: 1,
              numericValue: 0,
              stringValue: 'dodge_skill',
            },
          ],
        },
      ],
    },
    abilitySystem: {
      modeConfig: {
        modes: [
          {
            modeId: 'default',
            modeLayer: 'default',
            defaultEnable: true,
            overrideNormalAttackList: false,
            normalAttackList: [],
            overrideCmdMapping: false,
            cmdMapping: { keys: [], values: [] },
          },
          {
            modeId: 'ult',
            modeLayer: 'ultimate',
            defaultEnable: false,
            overrideNormalAttackList: true,
            normalAttackList: ['attack_ult_1'],
            overrideCmdMapping: true,
            cmdMapping: { keys: [0], values: ['attack_ult_1'] },
          },
        ],
      },
      entityBlackboard: [
        pair('EntityBB_consumed_type'),
        pair('EntityBB_consumed_layer'),
        pair('EntityBB_ult_hit'),
        pair('EntityBB_wisd_greater_will', 1),
      ],
      skillDataBundle: {
        allNormalAttackId: ['attack_1', 'breaking_attack'],
        allActiveSkillId: [
          'normal_skill',
          'chr_0032_lizhiyan_combo_skill',
          'ultimate_skill',
          'dodge_skill',
          'extra_skill',
        ],
        allPassiveSkillId: ['passive_skill'],
        normalAttackList: ['attack_1'],
        enabledBreakingNormalAttacks: ['breaking_attack'],
        normalSkillId: 'normal_skill',
        comboSkillId: 'chr_0032_lizhiyan_combo_skill',
        comboSkillPriorityType: 2,
        ultimateSkillId: 'ultimate_skill',
        plungingAttackStartId: 'plunge_start',
        plungingAttackEndId: 'plunge_end',
        dodgeSkillId: 'dodge_skill',
        defaultCmdMapping: {
          keys: [0, 3, 4, 5],
          values: ['attack_1', 'normal_skill', 'chr_0032_lizhiyan_combo_skill', 'ultimate_skill'],
        },
        activeSkillTypeOverrides: { keys: ['extra_skill'], values: [8] },
        enableComboSkillBlackboard: true,
        comboSkillBlackboard: [pair('consumed_layer'), pair('consumed_type')],
        comboSkillConditions: combo.conditions,
      },
    },
    conditionReferences: combo.references,
  };
}

describe('角色运行模板来源', () => {
  it('原生固定技能身份优先于 activeSkillTypeOverrides，额外技能仍使用覆盖', () => {
    const source = runtimeTemplate();
    source.abilitySystem.skillDataBundle.activeSkillTypeOverrides = {
      keys: [
        'normal_skill',
        'ultimate_skill',
        'chr_0032_lizhiyan_combo_skill',
        'dodge_skill',
        'extra_skill',
      ],
      values: [8, 8, 8, 8, 8],
    };
    expect(
      parseOperatorRuntimeTemplateSource(source, 'fixture').playerActionSource
        .initialNativeSkillTypeById,
    ).toMatchObject({
      normal_skill: 'normalSkill',
      ultimate_skill: 'ultimateSkill',
      chr_0032_lizhiyan_combo_skill: 'comboSkill',
      dodge_skill: 'dodge',
      extra_skill: 'extraActiveSkill',
    });
  });

  it('刷新尝试所有当前模板；变化 pin、未配置身份及单项失败独立列出且不改配置', () => {
    const existing = runtimeTemplate();
    const fresh = runtimeTemplate();
    fresh.data.id = 'chr_new';
    const manifest = {
      operators: [
        {
          slug: 'known',
          runtimeTemplate: {
            sourceFile: 'CharacterData/known.json',
            sourceCharacterId: existing.data.id,
            sourceSha256: 'f'.repeat(64),
          },
        },
      ],
    };
    const before = structuredClone(manifest);
    const templates = {
      'CharacterData/known.json': existing,
      'CharacterData/new.json': fresh,
      'CharacterData/broken.json': {},
    };
    const report = auditOperatorTemplateRefresh(manifest, templates, GAMEPLAY_TAG_PATHS);
    expect(report).toMatchObject({
      sourceCount: 3,
      configuredCount: 1,
      compiledPrefixCount: 2,
      blockedCount: 1,
      changedPinCount: 1,
      unconfiguredSourceFiles: ['CharacterData/broken.json', 'CharacterData/new.json'],
    });
    expect(manifest).toEqual(before);
    const ignored = auditOperatorTemplateRefresh(
      { ...manifest, ignoredRuntimeTemplateSourceFiles: ['CharacterData/new.json'] },
      templates,
      GAMEPLAY_TAG_PATHS,
    );
    expect(ignored).toMatchObject({
      ignoredSourceFiles: ['CharacterData/new.json'],
      unconfiguredSourceFiles: ['CharacterData/broken.json'],
    });
    expect(() =>
      auditOperatorTemplateRefresh(
        { ...manifest, ignoredRuntimeTemplateSourceFiles: ['CharacterData/missing.json'] },
        templates,
        GAMEPLAY_TAG_PATHS,
      ),
    ).toThrow('ignored runtime template source does not exist');
    const missing = auditOperatorTemplateRefresh(manifest, {}, GAMEPLAY_TAG_PATHS);
    expect(missing).toMatchObject({ sourceCount: 0, blockedCount: 1 });
    expect(missing.entries[0]).toMatchObject({ configuredSlugs: ['known'], status: 'blocked' });
    const brokenCondition = runtimeTemplate();
    brokenCondition.conditionReferences = {};
    expect(
      auditOperatorTemplateRefresh(
        manifest,
        { 'CharacterData/known.json': brokenCondition },
        GAMEPLAY_TAG_PATHS,
      ),
    ).toMatchObject({ changedPinCount: 1, blockedCount: 1 });
    fresh.data.id = 'wrong_identity';
    expect(
      auditOperatorTemplateRefresh(
        manifest,
        { 'CharacterData/known.json': fresh },
        GAMEPLAY_TAG_PATHS,
      ).entries[0],
    ).toMatchObject({ status: 'blocked', error: expect.stringContaining('identity mismatch') });
  });
  it('从同一固定来源组合角色身份、两层黑板与五条 RID 连携条件', () => {
    const parsed = parseOperatorRuntimeTemplateSource(runtimeTemplate(), 'CharacterData.arcane');

    expect(parsed).toMatchObject({
      sourceSha256,
      decodeStatus: 'partial',
      characterId: 'chr_0032_lizhiyan',
      comboSkillId: 'chr_0032_lizhiyan_combo_skill',
      comboSkillPriority: 'enemyRank',
    });
    expect(parsed.blackboards.entity.initialValues).toHaveLength(4);
    expect(parsed.blackboards.comboCondition.initialValues).toHaveLength(2);
    expect(parsed.conditions?.conditions).toHaveLength(5);
    expect(parsed.conditions?.referenceSources).toHaveLength(14);
    expect(parsed.playerActionSource).toMatchObject({
      dodgeSkillId: 'dodge_skill',
      slotSkillIds: {
        battleSkill: 'normal_skill',
        comboSkill: 'chr_0032_lizhiyan_combo_skill',
        ultimate: 'ultimate_skill',
      },
      defaultCommandSkillIds: {
        basicAttack: 'attack_1',
        battleSkill: 'normal_skill',
        comboSkill: 'chr_0032_lizhiyan_combo_skill',
        ultimate: 'ultimate_skill',
      },
      initialNativeSkillTypeById: {
        attack_1: 'attack',
        breaking_attack: 'breakingAttack',
        normal_skill: 'normalSkill',
        chr_0032_lizhiyan_combo_skill: 'comboSkill',
        ultimate_skill: 'ultimateSkill',
        dodge_skill: 'dodge',
        extra_skill: 'extraActiveSkill',
        passive_skill: 'passiveSkill',
      },
      modes: [
        { modeId: 'default', modeLayer: 'default', defaultEnabled: true },
        {
          modeId: 'ult',
          modeLayer: 'ultimate',
          defaultEnabled: false,
          normalAttackSkillIds: ['attack_ult_1'],
          commandSkillIds: { basicAttack: 'attack_ult_1' },
        },
      ],
    });
    expect(parsed.dashBuffs).toEqual([
      { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'dodge_skill' } },
    ]);
  });

  it('来源哈希和原生类型不完整时失败，不把别的角色模板当作 Arcane', () => {
    const missingHash = runtimeTemplate() as Record<string, unknown>;
    missingHash.sourceSha256 = 'not-a-sha';
    expect(() => parseOperatorRuntimeTemplateSource(missingHash, 'CharacterData.arcane')).toThrow(
      'expected SHA256',
    );

    const wrongType = runtimeTemplate();
    wrongType.abilitySystemEntry.class = 'OtherData';
    expect(() => parseOperatorRuntimeTemplateSource(wrongType, 'CharacterData.arcane')).toThrow(
      'unexpected native type',
    );
  });
});
