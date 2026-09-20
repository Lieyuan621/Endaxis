import { describe, expect, it } from 'vitest';

import {
  compileBuildConditionGroupSource,
  compileBuildConditionIndexSource,
  compileBuildConditionSource,
  parseSkillConditionSources,
  projectSingleBuildConditionSource,
} from '../src/index.ts';

describe('构筑属性条件', () => {
  it('严格读取 CompareCharDeckAttr 并投影四维比较', () => {
    const [source] = parseSkillConditionSources(table(), ['lizhiyan_wisd']);
    expect(source).toMatchObject({
      conditionId: 'lizhiyan_wisd',
      conditionType: 14010,
      operator: 'greaterOrEqual',
      leftAttribute: 'Wisd',
      rightAttribute: 'Will',
    });
    expect(compileBuildConditionSource(source!)).toEqual({
      kind: 'deckAttributeCompare',
      left: 'intellect',
      operator: 'greaterOrEqual',
      right: 'will',
    });
  });

  it('拒绝身份漂移、未知比较和未取证条件类型', () => {
    const mismatched = table();
    mismatched.lizhiyan_wisd.condId = 'other';
    expect(() => parseSkillConditionSources(mismatched)).toThrow('expected "lizhiyan_wisd"');

    const unknownCompare = table();
    unknownCompare.lizhiyan_wisd.compareOp = 6;
    expect(() => parseSkillConditionSources(unknownCompare)).toThrow('unknown CompareOperator 6');

    const unsupportedType = parseSkillConditionSources(table())[0]!;
    expect(() => compileBuildConditionSource({ ...unsupportedType, conditionType: 1 })).toThrow(
      'unsupported condition type 1',
    );
  });

  it('跳过空 ID，并将多个条件完整保留为短路 AND 组', () => {
    const sourceTable = table();
    sourceTable.lizhiyan_will = {
      ...sourceTable.lizhiyan_wisd,
      condId: 'lizhiyan_will',
      leftAttrType: 42,
      rightAttrType: 41,
    };
    const sources = parseSkillConditionSources(sourceTable, ['lizhiyan_wisd', 'lizhiyan_will']);
    const result = compileBuildConditionGroupSource(
      ['', 'lizhiyan_wisd', 'lizhiyan_will'],
      compileBuildConditionIndexSource(sources),
      'effect.activeCondition',
    );
    expect(result).toEqual({
      kind: 'all',
      conditions: [
        {
          kind: 'deckAttributeCompare',
          left: 'intellect',
          operator: 'greaterOrEqual',
          right: 'will',
        },
        {
          kind: 'deckAttributeCompare',
          left: 'will',
          operator: 'greaterOrEqual',
          right: 'intellect',
        },
      ],
    });
    expect(() => projectSingleBuildConditionSource(result, 'effect.activeCondition')).toThrow(
      'cannot represent native AND group with 2 conditions',
    );
  });
});

function table(): Record<
  string,
  {
    compareOp: number;
    condId: string;
    condType: number;
    leftAttrType: number;
    rightAttrType: number;
    toastText: { id: number; text: string };
  }
> {
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
