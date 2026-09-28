import { describe, expect, it } from 'vitest';
import { resolveBasePassiveLevelSource } from '../src/domains/operator/skillLevels.ts';

const group = (nativeGroupType: number) => ({
  sourcePath: 'CharGrowthTable.fixture.skillGroupMap.group',
  skillGroupId: 'group',
  nativeGroupType,
  skillIds: ['passive'],
});

describe('基础被动原生等级来源', () => {
  it.each([
    [0, 'basicAttack'],
    [1, 'battleSkill'],
    [2, 'ultimate'],
    [3, 'comboSkill'],
  ])('仅有被动的原生组 %i 也能解析等级来源 %s', (type, levelSource) => {
    expect(resolveBasePassiveLevelSource([group(Number(type))], 'passive')).toEqual({
      kind: 'operatorSkillGroup',
      levelSource,
    });
  });
  it('不属于原生组时使用原生缺省等级', () => {
    expect(resolveBasePassiveLevelSource([group(2)], 'other')).toEqual({ kind: 'nativeDefault' });
  });
  it('拒绝未知类型和歧义归属', () => {
    expect(() => resolveBasePassiveLevelSource([group(9)], 'passive')).toThrow(
      'unsupported native',
    );
    expect(() => resolveBasePassiveLevelSource([group(1), group(2)], 'passive')).toThrow(
      'multiple native',
    );
  });
});
