import { describe, expect, it } from 'vitest';

import {
  compileAbilityEntityTemplateCatalogSource,
  compileOperatorDefinitionHeaderSource,
  compileOperatorSourceClosure,
  parseOperatorProductIdentitySource,
} from '../src/index.ts';
import { GameplayTagRegistry } from '../src/source/nativeGameplayTags.ts';
import {
  abilityEntityFixture,
  activeSkillWithOwnerSpawnedAbilityEntityQueryFixture,
} from './sourceFixtures.ts';

describe('Operator 来源闭包', () => {
  it('产品身份只能从显式 manifest 字段读取并严格校验', () => {
    expect(
      parseOperatorProductIdentitySource(
        {
          slug: 'last-rite',
          gameId: 'LASTRITE',
          exportName: 'lastRiteGeneratedSource',
          charId: 'chr_0026_lastrite',
          buffDisplayNameKeys: { 'buff:test': 'effects.name.test' },
        },
        'operators.json.operators[0]',
      ),
    ).toEqual({
      slug: 'last-rite',
      gameId: 'LASTRITE',
      exportName: 'lastRiteGeneratedSource',
      characterId: 'chr_0026_lastrite',
      buffDisplayNameKeys: { 'buff:test': 'effects.name.test' },
    });
    expect(() =>
      parseOperatorProductIdentitySource(
        {
          slug: 'Last Rite',
          gameId: 'LAST RITE',
          exportName: 'last-rite',
          charId: 'LASTRITE',
        },
        'operators.json.operators[0]',
      ),
    ).toThrow('expected a stable kebab-case product slug');
  });

  it('一次组装角色面板、主动技能等级组和天赋潜能入口', () => {
    const growth = growthTable();
    const result = compileOperatorSourceClosure({
      identity: {
        slug: 'fixture',
        gameId: 'FIXTURE',
        exportName: 'fixtureGeneratedSource',
        characterId: 'chr_test',
        buffDisplayNameKeys: { 'buff:test': 'effects.name.test' },
      },
      manifestSkills: [
        {
          skillType: 'basicAttack',
          levelSource: 'basicAttack',
          source: 'native_basic.json',
          compile: {},
        },
      ],
      manifestSkillGroups: [
        {
          key: 'basicAttack',
          skillType: 'basicAttack',
          levelSource: 'basicAttack',
          nativeGroupType: 0,
          skillKeys: ['native_basic'],
        },
      ],
      skillDataBySourceFile: {
        'native_basic.json': activeSkillWithOwnerSpawnedAbilityEntityQueryFixture('native_basic'),
      },
      skillDataById: {},
      buffDefinitionNodes: [],
      projectileDefinitionNodes: [],
      abilityEntityDefinitionNodes: [],
      abilityEntityQueryContext: {
        catalog: compileAbilityEntityTemplateCatalogSource({
          abilityentity_fixture: { ...abilityEntityFixture(), bornTagIds: [321] },
        }),
        registry: new GameplayTagRegistry([]),
      },
      skillPatchTable: {},
      characterTable: characterTable(),
      charGrowthTable: growth,
      characterPotentialTable: potentialTable(),
      potentialTalentEffectTable: effectTable(),
      skillConditionTable: {},
    });

    expect(result.character).toMatchObject({
      characterId: 'chr_test',
      characterTypeId: 'Pulse',
      profession: 'CASTER',
      rarity: 6,
      mainAttribute: 'intellect',
      weaponType: 'arts-unit',
      element: 'electric',
      role: 'caster',
      projectedRarity: 6,
    });
    expect(result.attributeGrowth).toMatchObject({
      intellect: [21, 51, 83, 114, 145, 161],
      baseAttack: [30, 88, 150, 211, 272, 303],
    });
    expect(result.skillLibrary.activeSkills.entries[0]).toMatchObject({
      key: 'native_basic',
    });
    expect(result.progression.potential.unlocks).toMatchObject([
      { level: 1, effectId: 'potential_effect' },
    ]);
    expect(result.progression.trustAttributeBonus).toBeNull();
    expect(result.passiveSkills).toEqual({ requests: [], definitions: [] });
    expect(result.definitionClosure).toMatchObject({ missing: [] });
    expect(result.activeSkillAbilityEntityQueries).toMatchObject([
      {
        skillKey: 'native_basic',
        skillId: 'native_basic',
        queries: [
          {
            targetGroupKey: 'entities',
            sourcePath:
              'SkillData.native_basic.actionGroupData.timelineActions[0]._sequenceActionData.actionData[0]',
            query: { candidateTemplateIds: ['abilityentity_fixture'] },
          },
        ],
      },
    ]);
    expect(compileOperatorDefinitionHeaderSource(result)).toEqual({
      slug: 'fixture',
      gameId: 'FIXTURE',
      sourceCharacterId: 'chr_test',
      buffDisplayNameKeys: { 'buff:test': 'effects.name.test' },
      rarity: 6,
      weaponType: 'arts-unit',
      element: 'electric',
      role: 'caster',
      mainAttribute: 'intellect',
      secondaryAttribute: 'will',
      attributes: result.attributeGrowth,
    });
  });
});

function characterTable() {
  const panels = [
    [1, 0, 9, 9, 21, 13, 30, 500],
    [20, 0, 26, 27, 51, 34, 88, 1566],
    [40, 1, 45, 46, 83, 57, 150, 2689],
    [60, 2, 64, 65, 114, 79, 211, 3811],
    [80, 3, 82, 84, 145, 102, 272, 4934],
    [90, 4, 91, 93, 161, 113, 303, 5495],
  ];
  return {
    chr_test: {
      charId: 'chr_test',
      charTypeId: 'Pulse',
      profession: 5,
      rarity: 6,
      mainAttrType: 41,
      subAttrType: 42,
      defaultWeaponId: 'wpn_test',
      weaponType: 2,
      charPassiveUIPrefabName: '',
      attributes: panels.map(
        ([level, breakStage, strength, agility, intellect, will, attack, health]) => ({
          Attribute: {
            attrs: [
              { attrType: 0, attrValue: level },
              { attrType: 39, attrValue: strength },
              { attrType: 40, attrValue: agility },
              { attrType: 41, attrValue: intellect },
              { attrType: 42, attrValue: will },
              { attrType: 2, attrValue: attack },
              { attrType: 1, attrValue: health },
            ],
          },
          breakStage,
        }),
      ),
    },
  };
}

function growthTable() {
  const talentNodeMap: Record<string, unknown> = {};
  [10, 15, 15, 20].forEach((value, index) => {
    talentNodeMap[`attr_${index + 1}`] = talentNode(index + 1, value);
  });
  return {
    chr_test: {
      skillGroupMap: { normal: nativeGroup() },
      talentNodeMap,
    },
  };
}

function talentNode(breakStage: number, value: number) {
  const nodeId = `attr_${breakStage}`;
  return {
    attributeNodeInfo: {
      attributeModifiers: [
        { attrType: 41, attrValue: value, modifierType: 5, modifyAttributeType: 0 },
      ],
      breakStage,
      customIcon: '',
      desc: { id: 0, text: '' },
      favorability: 0,
      title: { id: 0, text: '' },
    },
    factorySkillNodeInfo: {},
    nodeId,
    nodeType: 3,
    passiveSkillNodeInfo: {
      breakStage: 0,
      iconId: '',
      index: 0,
      level: 0,
      name: { id: 0, text: '' },
      talentEffectId: '',
    },
    requiredItem: [],
  };
}

function nativeGroup() {
  return {
    conditionDesc1: {},
    conditionDesc2: {},
    conditionDescInactive1: {},
    conditionDescInactive2: {},
    conditionIcon1: '',
    conditionIcon2: '',
    conditionId1: '',
    conditionId2: '',
    conditionName1: {},
    conditionName2: {},
    conditionPostDesc1: {},
    conditionPostDesc2: {},
    desc: {},
    icon: '',
    name: {},
    skillGroupId: 'normal',
    skillGroupType: 0,
    skillIdList: ['native_basic'],
  };
}

function potentialTable() {
  return {
    chr_test: {
      firstItemId: '',
      potentialUnlockBundle: [
        {
          itemCnts: [],
          itemIds: [],
          level: 1,
          name: { id: 0, text: '' },
          potentialEffectId: 'potential_effect',
          unlockCardTopicItem: '',
          unlockCharPictureItemList: [],
        },
      ],
    },
  };
}

function effectTable() {
  return {
    potential_effect: {
      id: 'potential_effect',
      desc: { id: 0, text: '' },
      dataList: [
        {
          activeCondition: [],
          attachBuff: { blackboard: [], buffId: '' },
          attachSkill: { blackboard: [], skillId: '', skillPath: '' },
          attrModifier: { attrType: 0, attrValue: 0, modifierType: 0, modifyAttributeType: 0 },
          modifyType: 0,
          skillBbModifier: {
            bbKey: '',
            floatValue: 0,
            modifyType: 0,
            skillId: '',
            stringValue: '',
          },
          skillParamModifier: { modifyType: 0, paramType: 0, paramValue: 0, skillId: '' },
        },
      ],
    },
  };
}
