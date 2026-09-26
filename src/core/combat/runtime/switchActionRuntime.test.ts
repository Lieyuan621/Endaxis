import { describe, expect, it, vi } from 'vitest';
import type { ResolvedActionSequence } from '../../compiler/combatProgram';
import { createActionGraphCompilation } from '../../compiler/compileActionGraph';
import type {
  ActionGraphNode,
  ActionGraphStep,
} from '../../../../packages/game-data-contract/src/actionGraph';
import type { ActionValueOperand } from '../../game-data/operatorDefinition';
import { CombatActionSequenceRuntime } from '../actions/combatActionSequenceRuntime';
import { ActionBlackboard } from '../actions/actionBlackboard';
import type { CombatOperationExecutor } from '../skills/skillRuntime';

const constant = (value: number): ActionValueOperand => ({ kind: 'constant', value });
const effect = (key: string): ActionGraphStep => ({
  kind: 'setContextFlag',
  key,
  parameters: { flag: key, target: 'caster', value: true },
});

const compileGraphEntry = (
  revision: string,
  entry: string | null,
  nodes: Record<string, ActionGraphNode>,
): ResolvedActionSequence => ({
  graph: createActionGraphCompilation({ nodes }, 1, revision).compileAll(),
  entry,
  callSite: revision,
});

/** 每个选项一个单步节点；节点名按选项序号派生。 */
const selectNodes = (
  choice: ActionValueOperand,
  values: readonly ActionValueOperand[],
  alwaysNext = false,
): Record<string, ActionGraphNode> => {
  const nodes: Record<string, ActionGraphNode> = {};
  nodes.select = {
    action: {
      kind: 'switch',
      parameters: { choice, alwaysNext },
      options: values.map((value, index) => ({
        value,
        sequence: { $sequence: `option-${index}` },
      })),
    },
    next: null,
  };
  values.forEach((_value, index) => {
    nodes[`option-${index}`] = { action: effect(String(index)), next: null };
  });
  return nodes;
};

function fixture(blackboard = new ActionBlackboard()) {
  const execute = vi.fn<CombatOperationExecutor['execute']>(() => true);
  const prepare = vi.fn<NonNullable<CombatOperationExecutor['prepare']>>();
  const end = vi.fn<NonNullable<CombatOperationExecutor['end']>>();
  const operations: CombatOperationExecutor = { execute, prepare, end, evaluate: () => false };
  return {
    runtime: new CombatActionSequenceRuntime(operations, { blackboard }),
    execute,
    prepare,
    end,
  };
}

describe('Switch 原生选择和生命周期', () => {
  it('标签不是索引，重复标签只执行第一项；命中后不读取后面的缺键', () => {
    const f = fixture();
    const nodes = selectNodes(constant(7), [
      constant(20),
      constant(7),
      constant(7),
      { kind: 'blackboard', key: 'missing' },
    ]);
    expect(
      f.runtime
        .createSequence(compileGraphEntry('switch-duplicate', 'select', nodes))
        .executeInstant({}),
    ).toBe(true);
    expect(f.execute).toHaveBeenCalledOnce();
    expect(f.execute).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'setContextFlag', key: '1' }),
      expect.anything(),
    );
  });

  it.each([
    [16777216, 16777217, true], // float32 收窄后相等，double 不相等。
    [0, 1.00000001e-5, true], // float32 容差边界，double 差值已大于 1e-5。
    [0, 1.000001e-5, false],
    [NaN, 0, false],
    [0, NaN, false],
    [Infinity, Infinity, false],
  ])('单精度匹配 choice=%s option=%s → %s', (choice, value, expected) => {
    const f = fixture();
    const nodes = selectNodes(constant(choice), [constant(value)]);
    expect(
      f.runtime
        .createSequence(compileGraphEntry('switch-float32', 'select', nodes))
        .executeInstant({}),
    ).toBe(expected);
    expect(f.execute).toHaveBeenCalledTimes(expected ? 1 : 0);
  });

  it('choice 每次只读一次，候选动态读取按配置顺序，缺键明确失败', () => {
    const blackboard = new ActionBlackboard({ choice: 4, first: 2, second: 4 });
    const reads = vi.spyOn(blackboard, 'getNumber');
    const f = fixture(blackboard);
    const nodes = selectNodes({ kind: 'blackboard', key: 'choice' }, [
      { kind: 'blackboard', key: 'first' },
      { kind: 'blackboard', key: 'second' },
    ]);
    const sequence = f.runtime.createSequence(compileGraphEntry('switch-reads', 'select', nodes));
    sequence.executeInstant({});
    expect(reads.mock.calls.map(([key]) => key)).toEqual(['choice', 'first', 'second']);
    reads.mockClear();
    blackboard.assignDynamic('choice', 2);
    sequence.executeInstant({});
    expect(reads.mock.calls.map(([key]) => key)).toEqual(['choice', 'first']);
    expect(f.execute.mock.calls.map(([step]) => step.key)).toEqual(['1', '0']);
    expect(() =>
      f.runtime
        .createSequence(
          compileGraphEntry(
            'switch-absent-choice',
            'select',
            selectNodes({ kind: 'blackboard', key: 'absent' }, []),
          ),
        )
        .executeInstant({}),
    ).toThrow('absent');
    expect(() =>
      f.runtime
        .createSequence(
          compileGraphEntry(
            'switch-absent-option',
            'select',
            selectNodes(constant(1), [{ kind: 'blackboard', key: 'absent' }]),
          ),
        )
        .executeInstant({}),
    ).toThrow('absent');
  });

  it.each([false, true])('alwaysNext=%s 只控制外层后继，不绕过选中分支的短路', alwaysNext => {
    const f = fixture();
    f.execute.mockReturnValueOnce(false);
    const nodes = selectNodes(constant(1), [constant(1)], alwaysNext);
    nodes['option-0'] = { action: effect('fail'), next: 'option-0-skipped' };
    nodes['option-0-skipped'] = { action: effect('skipped'), next: null };
    nodes.select = { ...nodes.select!, next: 'outer' };
    nodes.outer = { action: effect('outer'), next: null };
    const sequence = f.runtime.createSequence(
      compileGraphEntry(`switch-always-next-${alwaysNext}`, 'select', nodes),
    );
    expect(sequence.executeInstant({})).toBe(alwaysNext);
    expect(f.execute.mock.calls.map(([step]) => step.key)).toEqual(
      alwaysNext ? ['fail', 'outer'] : ['fail'],
    );
    f.execute.mockClear();
    const empty = selectNodes(constant(8), [], alwaysNext);
    empty.select = { ...empty.select!, next: 'after' };
    empty.after = { action: effect('after'), next: null };
    expect(
      f.runtime
        .createSequence(compileGraphEntry(`switch-empty-${alwaysNext}`, 'select', empty))
        .executeInstant({}),
    ).toBe(alwaysNext);
    expect(f.execute).toHaveBeenCalledTimes(alwaysNext ? 1 : 0);
  });

  it('Reset 预备全部分支（包括未选的嵌套 IfElse）；End 只结束选中分支', () => {
    const f = fixture(new ActionBlackboard({ choice: 0 }));
    const nodes: Record<string, ActionGraphNode> = {
      select: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'blackboard', key: 'choice' }, alwaysNext: false },
          options: [
            { value: constant(0), sequence: { $sequence: 'option-0' } },
            { value: constant(1), sequence: { $sequence: 'option-1' } },
          ],
        },
        next: null,
      },
      'option-0': { action: effect('0'), next: null },
      'option-1': {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'combatActive' } },
          whenTrue: { $sequence: 'true' },
          whenFalse: { $sequence: 'false' },
        },
        next: null,
      },
      true: { action: effect('true'), next: null },
      false: { action: effect('false'), next: null },
    };
    const sequence = f.runtime.createSequence(
      compileGraphEntry('switch-reset-prepare', 'select', nodes),
    );
    sequence.reset({});
    expect(f.prepare.mock.calls.map(([step]) => step.key)).toEqual(['0', 'true', 'false']);
    sequence.tryExecute({});
    sequence.end({});
    expect(f.end.mock.calls.map(([step]) => step.key)).toEqual(['0']);
    sequence.reset({});
    f.runtime.context.blackboard.assignDynamic('choice', 1);
    sequence.tryExecute({});
    sequence.end({});
    expect(f.execute.mock.calls.map(([step]) => step.key)).toEqual(['0', 'false']);
    expect(f.end.mock.calls.map(([step]) => step.key)).toEqual(['0', 'false']);
  });

  it('Tick 只推进当前选中分支，下次无匹配时不残留上次分支', () => {
    const blackboard = new ActionBlackboard({ choice: 0 });
    const f = fixture(blackboard);
    const nodes: Record<string, ActionGraphNode> = {
      select: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'blackboard', key: 'choice' }, alwaysNext: true },
          options: [
            { value: constant(0), sequence: { $sequence: 'tick-0' } },
            { value: constant(1), sequence: { $sequence: 'tick-1' } },
          ],
        },
        next: null,
      },
      'tick-0': {
        action: { kind: 'repeatEachTick', parameters: {}, body: { $sequence: 'option-0' } },
        next: null,
      },
      'tick-1': {
        action: { kind: 'repeatEachTick', parameters: {}, body: { $sequence: 'option-1' } },
        next: null,
      },
      'option-0': { action: effect('0'), next: null },
      'option-1': { action: effect('1'), next: null },
    };
    const sequence = f.runtime.createSequence(compileGraphEntry('switch-tick', 'select', nodes));
    sequence.tryExecute({});
    sequence.tick(1 / 60, {});
    sequence.tick(1 / 60, {});
    expect(f.execute.mock.calls.map(([step]) => step.key)).toEqual(['0', '0']);
    sequence.end({});
    sequence.reset({});
    blackboard.assignDynamic('choice', 9);
    sequence.tryExecute({});
    sequence.tick(1 / 60, {});
    sequence.tick(1 / 60, {});
    expect(f.execute).toHaveBeenCalledTimes(2);
  });
});
