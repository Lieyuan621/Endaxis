import { describe, expect, it } from 'vitest';

import { compileTrustAttributeBonusSource, parseOperatorTalentNodeSources } from '../src/index.ts';

describe('干员天赋属性节点', () => {
  it('默认主属性好感加成省略', () => {
    const table = growthTable([10, 15, 15, 20], [41]);
    const nodes = parseOperatorTalentNodeSources(table, 'chr_test');
    const result = compileTrustAttributeBonusSource(nodes, 'intellect');
    expect(result).toBeNull();
  });

  it('数值等于默认但属性不同，不能误删信赖奖励', () => {
    const nodes = parseOperatorTalentNodeSources(growthTable([10, 15, 15, 20], [42]), 'chr_test');
    expect(compileTrustAttributeBonusSource(nodes, 'intellect')).toEqual({
      values: [10, 15, 15, 20],
      attributes: ['will'],
    });
  });

  it('保留双属性例外', () => {
    const table = growthTable([8, 10, 10, 15], [41, 42]);
    const nodes = parseOperatorTalentNodeSources(table, 'chr_test');
    const result = compileTrustAttributeBonusSource(nodes, 'intellect');
    expect(result).toEqual({
      values: [8, 10, 10, 15],
      attributes: ['intellect', 'will'],
    });
  });

  it('拒绝节点身份漂移、重复阶段和非基础加法模式', () => {
    const mismatched = growthTable([10, 15, 15, 20], [41]);
    mismatched.chr_test.talentNodeMap.node1!.nodeId = 'wrong';
    expect(() => parseOperatorTalentNodeSources(mismatched, 'chr_test')).toThrow(
      'does not match map key',
    );

    const duplicate = growthTable([10, 15, 15, 20], [41]);
    duplicate.chr_test.talentNodeMap.node2!.attributeNodeInfo.breakStage = 1;
    const duplicateNodes = parseOperatorTalentNodeSources(duplicate, 'chr_test');
    expect(() => compileTrustAttributeBonusSource(duplicateNodes, 'intellect')).toThrow(
      'duplicate trust break stage 1',
    );

    const wrongSlot = growthTable([10, 15, 15, 20], [41]);
    wrongSlot.chr_test.talentNodeMap.node1!.attributeNodeInfo.attributeModifiers[0]!.modifierType = 0;
    const wrongSlotNodes = parseOperatorTalentNodeSources(wrongSlot, 'chr_test');
    expect(() => compileTrustAttributeBonusSource(wrongSlotNodes, 'intellect')).toThrow(
      'unsupported trust attribute modifier mode',
    );
  });
});

interface TalentNodeFixture {
  attributeNodeInfo: {
    attributeModifiers: Array<{
      attrType: number;
      attrValue: number;
      modifierType: number;
      modifyAttributeType: number;
    }>;
    breakStage: number;
    customIcon: string;
    desc: Record<string, unknown>;
    favorability: number;
    title: Record<string, unknown>;
  };
  factorySkillNodeInfo: Record<string, unknown>;
  nodeId: string;
  nodeType: number;
  passiveSkillNodeInfo: {
    breakStage: number;
    iconId: string;
    index: number;
    level: number;
    name: Record<string, unknown>;
    talentEffectId: string;
  };
  requiredItem: unknown[];
}

function growthTable(values: readonly number[], attributeTypes: readonly number[]) {
  const talentNodeMap: Record<string, TalentNodeFixture> = {};
  values.forEach((value, index) => {
    const nodeId = `node${index + 1}`;
    talentNodeMap[nodeId] = {
      attributeNodeInfo: {
        attributeModifiers: attributeTypes.map(attrType => ({
          attrType,
          attrValue: value,
          modifierType: 5,
          modifyAttributeType: 0,
        })),
        breakStage: index + 1,
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
  });
  return { chr_test: { talentNodeMap } };
}
