import { describe, expect, it } from 'vitest';
import type { ActionGraphDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import { validateActionGraph } from '../action-graph/actionGraphValidation';

describe('公共图结构校验', () => {
  it('沿消费方向检查跨数据和行为的调用，并将间接行为纳入编译依赖', () => {
    const expression = { kind: 'checkActionResult' as const, action: { $sequence: 'end' } };
    const graph: ActionGraphDefinition = {
      nodes: {
        start: {
          action: {
            kind: 'checkCondition',
            parameters: { condition: { kind: 'conditionNode', nodeId: 'result' } },
          },
          next: null,
        },
        end: { action: { kind: 'markCurrentSkillCanInterrupt', parameters: {} }, next: null },
      },
      dataNodes: { result: { type: 'boolean', expression } },
    };
    expect(validateActionGraph(graph).get('start')).toContain('end');
    expression.action.$sequence = 'start';
    expect(() => validateActionGraph(graph)).toThrow('recursive action graph');
    expression.action.$sequence = 'missing';
    expect(() => validateActionGraph(graph)).toThrow('missing action graph node: missing');
  });

  it('允许共享尾部、空入口以及显式循环体', () => {
    const graph: ActionGraphDefinition = {
      nodes: {
        loop: {
          action: { kind: 'repeatEachTick', parameters: {}, body: { $sequence: 'end' } },
          next: 'end',
        },
        end: { action: { kind: 'markCurrentSkillCanInterrupt', parameters: {} }, next: null },
      },
    };
    expect(() =>
      validateActionGraph(graph, [{ $sequence: null }, { $sequence: 'loop' }]),
    ).not.toThrow();
  });

  it('拒绝动作内嵌 Buff 定义', () => {
    const parameters = {
      buffs: [{ buffId: 'test' }],
      targets: { kind: 'fixed', target: 'caster' } as const,
      definition: { stackingType: 'refresh' },
    };
    const graph: ActionGraphDefinition = {
      nodes: {
        apply: { action: { kind: 'applyBuff', parameters }, next: null },
      },
    };
    expect(() => validateActionGraph(graph)).toThrow(
      'applyBuff must reference an owner Buff definition',
    );
  });

  it('验证未使用节点和外部入口，不只验证已知执行分支', () => {
    const graph: ActionGraphDefinition = {
      nodes: {
        orphan: {
          action: { kind: 'markCurrentSkillCanInterrupt', parameters: {} },
          next: 'orphan',
        },
      },
    };
    expect(() => validateActionGraph(graph)).toThrow('recursive action graph: orphan');
    expect(() => validateActionGraph({ nodes: {} }, [{ $sequence: 'missing' }])).toThrow(
      'entries[0]',
    );
  });

  it('长顺序链校验不占用递归调用栈', () => {
    const graph: ActionGraphDefinition = {
      nodes: Object.fromEntries(
        Array.from({ length: 20000 }, (_, index) => [
          String(index),
          {
            action: { kind: 'markCurrentSkillCanInterrupt', parameters: {} },
            next: index === 19999 ? null : String(index + 1),
          },
        ]),
      ),
    };
    expect(() => validateActionGraph(graph)).not.toThrow();
  });
});
