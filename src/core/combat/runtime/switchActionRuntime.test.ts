import { describe, expect, it, vi } from 'vitest';
import type { ResolvedCombatStep, ResolvedCombatStepForKind } from '../../compiler/combatProgram';
import type { ActionValueOperand } from '../../game-data/operatorDefinition';
import { CombatActionSequenceRuntime } from '../actions/combatActionSequenceRuntime';
import { ActionBlackboard } from '../actions/actionBlackboard';
import type { CombatOperationExecutor } from '../skills/skillRuntime';

const constant = (value: number): ActionValueOperand => ({ kind: 'constant', value });
const effect = (key: string): ResolvedCombatStep => ({
  kind: 'setContextFlag',
  key,
  parameters: { flag: key, target: 'caster', value: true },
});
const select = (
  choice: ActionValueOperand,
  values: readonly ActionValueOperand[],
  alwaysNext = false,
): ResolvedCombatStepForKind<'switch'> => ({
  kind: 'switch',
  parameters: { choice, alwaysNext },
  options: values.map((value, index) => ({ value, sequence: { steps: [effect(String(index))] } })),
});
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
    const action = select(constant(7), [
      constant(20),
      constant(7),
      constant(7),
      { kind: 'blackboard', key: 'missing' },
    ]);
    expect(f.runtime.createSequence({ steps: [action] }).executeInstant({})).toBe(true);
    expect(f.execute).toHaveBeenCalledOnce();
    expect(f.execute).toHaveBeenCalledWith(action.options[1]!.sequence.steps[0], expect.anything());
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
    expect(
      f.runtime
        .createSequence({ steps: [select(constant(choice), [constant(value)])] })
        .executeInstant({}),
    ).toBe(expected);
    expect(f.execute).toHaveBeenCalledTimes(expected ? 1 : 0);
  });

  it('choice 每次只读一次，候选动态读取按配置顺序，缺键明确失败', () => {
    const blackboard = new ActionBlackboard({ choice: 4, first: 2, second: 4 });
    const reads = vi.spyOn(blackboard, 'getNumber');
    const f = fixture(blackboard);
    const action = select(
      { kind: 'blackboard', key: 'choice' },
      ['first', 'second'].map(key => ({ kind: 'blackboard', key })),
    );
    const sequence = f.runtime.createSequence({ steps: [action] });
    sequence.executeInstant({});
    expect(reads.mock.calls.map(([key]) => key)).toEqual(['choice', 'first', 'second']);
    reads.mockClear();
    blackboard.assignDynamic('choice', 2);
    sequence.executeInstant({});
    expect(reads.mock.calls.map(([key]) => key)).toEqual(['choice', 'first']);
    expect(f.execute.mock.calls.map(([step]) => step.key)).toEqual(['1', '0']);
    expect(() =>
      f.runtime
        .createSequence({ steps: [select({ kind: 'blackboard', key: 'absent' }, [])] })
        .executeInstant({}),
    ).toThrow('absent');
    expect(() =>
      f.runtime
        .createSequence({ steps: [select(constant(1), [{ kind: 'blackboard', key: 'absent' }])] })
        .executeInstant({}),
    ).toThrow('absent');
  });

  it.each([false, true])('alwaysNext=%s 只控制外层后继，不绕过选中分支的短路', alwaysNext => {
    const f = fixture();
    f.execute.mockReturnValueOnce(false);
    const action = select(constant(1), [constant(1)], alwaysNext);
    const sequence = f.runtime.createSequence({
      steps: [
        {
          ...action,
          options: [
            { ...action.options[0]!, sequence: { steps: [effect('fail'), effect('skipped')] } },
          ],
        },
        effect('outer'),
      ],
    });
    expect(sequence.executeInstant({})).toBe(alwaysNext);
    expect(f.execute.mock.calls.map(([step]) => step.key)).toEqual(
      alwaysNext ? ['fail', 'outer'] : ['fail'],
    );
    f.execute.mockClear();
    expect(
      f.runtime
        .createSequence({ steps: [select(constant(8), [], alwaysNext), effect('after')] })
        .executeInstant({}),
    ).toBe(alwaysNext);
    expect(f.execute).toHaveBeenCalledTimes(alwaysNext ? 1 : 0);
  });

  it('Reset 预备全部分支（包括未选的嵌套 IfElse）；End 只结束选中分支', () => {
    const f = fixture(new ActionBlackboard({ choice: 0 }));
    const action = select({ kind: 'blackboard', key: 'choice' }, [constant(0), constant(1)]);
    const conditional: ResolvedCombatStep = {
      kind: 'conditional',
      parameters: { condition: { kind: 'combatActive' } },
      whenTrue: { steps: [effect('true')] },
      whenFalse: { steps: [effect('false')] },
    };
    const sequence = f.runtime.createSequence({
      steps: [
        {
          ...action,
          options: [action.options[0]!, { value: constant(1), sequence: { steps: [conditional] } }],
        },
      ],
    });
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
    const action = select({ kind: 'blackboard', key: 'choice' }, [constant(0), constant(1)], true);
    const sequence = f.runtime.createSequence({
      steps: [
        {
          ...action,
          options: action.options.map(option => ({
            ...option,
            sequence: {
              steps: [{ kind: 'repeatEachTick', parameters: {}, body: option.sequence }],
            },
          })),
        },
      ],
    });
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
