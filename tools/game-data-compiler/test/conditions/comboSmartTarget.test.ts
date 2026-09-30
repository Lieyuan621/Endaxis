import { describe, expect, it } from 'vitest';
import { parseSkillTargetSelectionHeaderSource } from '../../src/source/skillTargetSelection.ts';
import { compileSkillSmartTargetSource } from '../../src/compiler/conditions/comboSmartTarget.ts';

const source = (selectStrategy = 4, smartTargetSelectStrategy = 1) =>
  parseSkillTargetSelectionHeaderSource(
    {
      selectStrategy,
      smartTargetSelectStrategy,
      canDummyCast: true,
      dummyPositionOffset: { x: 0, y: 0, z: 6 },
    },
    'skill',
  );

describe('木桩技能智能目标投影', () => {
  it.each([
    [0, 'input'],
    [1, 'trigger'],
  ] as const)('原生策略 %s 投影为 %s，保留原始几何来源', (strategy, expected) => {
    const input = source(4, strategy);
    const result = compileSkillSmartTargetSource(input);
    expect(result.definition).toEqual({ smartTarget: expected });
  });
  it('评分策略经唯一主目标回退投影为敌人', () => {
    expect(compileSkillSmartTargetSource(source(4, 4)).definition).toEqual({
      smartTarget: 'enemy',
    });
  });
  it('非智能主策略不执行 StoreSmartTarget', () => {
    expect(compileSkillSmartTargetSource(source(0, 4)).definition).toEqual({});
  });
});
