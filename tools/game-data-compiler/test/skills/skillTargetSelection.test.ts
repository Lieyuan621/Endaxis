import { describe, expect, it } from 'vitest';
import { parseSkillTargetSelectionHeaderSource } from '../../src/source/skillTargetSelection.ts';
import { compileSkillTargetSelection } from '../../src/compiler/skills/skillTargetSelection.ts';

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
    const result = compileSkillTargetSelection(input);
    expect(result.definition).toEqual({ smartTarget: expected });
  });
  it('评分策略经唯一主目标回退投影为敌人', () => {
    expect(compileSkillTargetSelection(source(4, 4)).definition).toEqual({
      smartTarget: 'enemy',
    });
  });
  it.each([
    [0, 'enemy'],
    [1, 'enemy'],
    [2, 'owner'],
    [3, 'enemy'],
  ] as const)('普通策略 %s 的默认施放目标为 %s，不执行 StoreSmartTarget', (strategy, target) => {
    expect(compileSkillTargetSelection(source(strategy, 4)).definition).toEqual({
      defaultTarget: target,
    });
  });
});
