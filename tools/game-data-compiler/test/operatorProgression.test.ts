import { describe, expect, it } from 'vitest';

import { parseOperatorProgressionSource } from '../src/index.ts';

describe('干员天赋与潜能组装', () => {
  it('效果包只读取一次，同时分别保留天赋和潜能的创建顺序', () => {
    const result = parseOperatorProgressionSource(
      { characterId: 'chr_test', mainAttribute: 'intellect' },
      growthTable(),
      potentialTable(),
      effectTable(),
      conditionTable(),
    );

    expect(result.effectBundles.map(value => value.effectId)).toEqual([
      'talent_effect',
      'shared_effect',
      'potential_effect',
    ]);
    expect(result.talentPassiveSkillRequests.map(value => value.skillId)).toEqual([
      'skill_talent',
      'skill_shared',
    ]);
    expect(result.potentialPassiveSkillRequests.map(value => value.skillId)).toEqual([
      'skill_shared',
      'skill_potential',
    ]);
    expect(result.potential.unlocks.map(value => value.level)).toEqual([1, 2]);
    expect(
      result.compiledEffectBundles.flatMap(bundle => bundle.entries).map(entry => entry.kind),
    ).toEqual(['passiveSkill', 'passiveSkill', 'passiveSkill']);
    expect(result.trustAttributeBonus).toBeNull();
    expect(result.skillConditions.map(value => value.conditionId)).toEqual(['lizhiyan_wisd']);
    expect(result.compiledEffectBundles[0]!.entries[0]!.activeCondition).toEqual({
      kind: 'all',
      conditions: [
        {
          kind: 'deckAttributeCompare',
          left: 'intellect',
          operator: 'greaterOrEqual',
          right: 'will',
        },
      ],
    });
  });
});

function growthTable() {
  const talentNodeMap: Record<string, unknown> = {};
  [10, 15, 15, 20].forEach((value, index) => {
    const id = `attr_${index + 1}`;
    talentNodeMap[id] = talentNode(id, 3, index + 1, value, '');
  });
  talentNodeMap.talent_1 = talentNode('talent_1', 4, 0, 0, 'talent_effect');
  talentNodeMap.talent_2 = talentNode('talent_2', 4, 0, 0, 'shared_effect');
  return { chr_test: { talentNodeMap } };
}

function talentNode(
  nodeId: string,
  nodeType: number,
  breakStage: number,
  value: number,
  talentEffectId: string,
) {
  return {
    attributeNodeInfo: {
      attributeModifiers:
        nodeType === 3
          ? [{ attrType: 41, attrValue: value, modifierType: 5, modifyAttributeType: 0 }]
          : [],
      breakStage,
      customIcon: '',
      desc: { id: 0, text: '' },
      favorability: 0,
      title: { id: 0, text: '' },
    },
    factorySkillNodeInfo: {},
    nodeId,
    nodeType,
    passiveSkillNodeInfo: {
      breakStage: 0,
      iconId: '',
      index: 0,
      level: 0,
      name: { id: 0, text: '' },
      talentEffectId,
    },
    requiredItem: [],
  };
}

function potentialTable() {
  return {
    chr_test: {
      firstItemId: '',
      potentialUnlockBundle: [
        potentialUnlock(1, 'shared_effect'),
        potentialUnlock(2, 'potential_effect'),
      ],
    },
  };
}

function potentialUnlock(level: number, potentialEffectId: string) {
  return {
    itemCnts: [],
    itemIds: [],
    level,
    name: { id: 0, text: '' },
    potentialEffectId,
    unlockCardTopicItem: '',
    unlockCharPictureItemList: [],
  };
}

function effectTable() {
  return {
    talent_effect: effect('talent_effect', 'skill_talent', ['', 'lizhiyan_wisd']),
    shared_effect: effect('shared_effect', 'skill_shared'),
    potential_effect: effect('potential_effect', 'skill_potential'),
  };
}

function effect(id: string, skillId: string, activeCondition: string[] = []) {
  return {
    id,
    desc: { id: 0, text: '' },
    dataList: [
      {
        activeCondition,
        attachBuff: { blackboard: [], buffId: '' },
        attachSkill: { blackboard: [], skillId, skillPath: '' },
        attrModifier: { attrType: 0, attrValue: 0, modifierType: 0, modifyAttributeType: 0 },
        modifyType: 1,
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
  };
}

function conditionTable() {
  return {
    lizhiyan_wisd: {
      compareOp: 3,
      condId: 'lizhiyan_wisd',
      condType: 14010,
      leftAttrType: 41,
      rightAttrType: 42,
      toastText: { id: 0, text: '' },
    },
  };
}
