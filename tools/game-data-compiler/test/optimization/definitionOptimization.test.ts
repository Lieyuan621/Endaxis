/**
 * 树序列优化器 optimizeActionSequenceDefinition 与树用途分析 analyzeSequenceUsage 已随树桥接删除；
 * 只测它们的用例随之删除，图侧等价覆盖见 optimization/graphSequenceOptimization.test.ts 与
 * optimization/definitionUsageAnalysis.test.ts。本文件保留仍存在的公共条件简化与条件用途分析覆盖。
 */
import { describe, expect, it } from 'vitest';
import type { CombatCondition } from '../../../../packages/game-data-contract/src/conditions.ts';
import { simplifyDefinitionCondition } from '../../src/compiler/optimization/definitionOptimization.ts';
import { analyzeConditionUsage } from '../../src/compiler/optimization/definitionUsageAnalysis.ts';

const literal = (value: number) => ({ kind: 'constant' as const, value });
const constant = (value: boolean): CombatCondition => ({ kind: 'constant', value });

describe('定义优化的条件简化', () => {
  it('字面量比较保留运行时容差，全连接短路到首个恒假', () => {
    expect(
      simplifyDefinitionCondition({
        kind: 'all',
        conditions: [
          { kind: 'probability', probability: literal(1) },
          constant(false),
          {
            kind: 'actionValueCompare',
            left: { kind: 'blackboard', key: 'missing' },
            operator: 'equal',
            right: literal(0),
          },
        ],
      }),
    ).toEqual({
      kind: 'all',
      conditions: [{ kind: 'probability', probability: literal(1) }, constant(false)],
    });
  });

  it('any 和 not 简化时不丢弃停止值前的带写入条件', () => {
    const condition: CombatCondition = {
      kind: 'any',
      conditions: [
        constant(false),
        { kind: 'eventOverheal', realHealKey: 'heal' },
        { kind: 'not', condition: constant(false) },
        { kind: 'probability', probability: literal(1) },
      ],
    };
    expect(simplifyDefinitionCondition(condition)).toEqual({
      kind: 'any',
      conditions: [{ kind: 'eventOverheal', realHealKey: 'heal' }, constant(true)],
    });
    expect(analyzeConditionUsage(simplifyDefinitionCondition(condition)).writes).toEqual(
      new Set(['heal']),
    );
  });
});
