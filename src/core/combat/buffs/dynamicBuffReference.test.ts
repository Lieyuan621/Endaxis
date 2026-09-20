import { describe, expect, it, vi } from 'vitest';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { BuffOperationExecutor, type BuffApplicationRequest } from './buffOperationExecutor';
import { CombatBuffContainer } from './combatBuffs';
import { CombatAttributeSet } from '../attributes/combatAttributes';
import { validateActionSequenceDefinition } from '../../game-data/validation/actionPrograms';

const step = {
  kind: 'applyBuff',
  parameters: {
    buffId: { blackboardKey: 'child' },
    target: 'enemy',
  },
} as const;

function fixture(blackboard: ActionBlackboard) {
  const container = new CombatBuffContainer<string>('enemy', new CombatAttributeSet<string>());
  const requests: BuffApplicationRequest[] = [];
  const definition = { stackingType: 'unlimited' } as const;
  const delegate = { execute: vi.fn(() => false), evaluate: () => false };
  const lookup = vi.fn((id: string) => (['first', 'second'].includes(id) ? definition : undefined));
  const target = Object.assign(container, {
    apply: (request: BuffApplicationRequest) => {
      requests.push(request);
      blackboard.assign({ child: 'second', rate: 2 });
      return true;
    },
  });
  return {
    requests,
    lookup,
    delegate,
    executor: new BuffOperationExecutor({
      sourceId: 'caster',
      resolveTarget: () => target,
      resolveBuffDefinition: lookup,
      delegate,
    }),
  };
}

describe('动态 Buff 引用复用公共施加管线', () => {
  it('每次施加重新读取身份和参数，不冻结首个 ID，不修改已创建请求', () => {
    const blackboard = new ActionBlackboard({ child: 'first', rate: 1 });
    const { executor, requests, lookup } = fixture(blackboard);
    executor.execute(
      {
        ...step,
        parameters: {
          ...step.parameters,
          count: { kind: 'constant', value: 2 },
          blackboardAssignments: { rate: { kind: 'blackboard', key: 'rate' } },
        },
      },
      { blackboard },
    );
    expect(requests.map(request => [request.buffId, request.blackboardValues.rate])).toEqual([
      ['first', 1],
      ['second', 2],
    ]);
    expect(lookup.mock.calls).toEqual([['first'], ['second']]);
  });

  it.each([undefined, null, 1, '', '   ', 'missing-definition'])(
    '缺失、类型错误、空值或目录缺失 %s 时不调用施加或旧执行器',
    value => {
      const blackboard = new ActionBlackboard(value === undefined ? {} : { child: value });
      const { executor, requests, delegate } = fixture(blackboard);
      expect(() => executor.execute(step, { blackboard })).toThrow(/Buff ID/);
      expect(requests).toEqual([]);
      expect(delegate.execute).not.toHaveBeenCalled();
    },
  );

  it('读取已有实体层字符串，但不为零次施加提前读取缺失身份', () => {
    const blackboard = new ActionBlackboard({}, new ActionBlackboard({ child: 'first' }));
    const { executor, requests } = fixture(blackboard);
    executor.execute(step, { blackboard });
    expect(requests[0]?.buffId).toBe('first');
    executor.execute(
      { ...step, parameters: { ...step.parameters, count: { kind: 'constant', value: 0 } } },
      { blackboard: new ActionBlackboard() },
    );
    expect(requests).toHaveLength(1);
  });

  it('正式协议只允许键引用，不接受回退字面值或内联定义', () => {
    expect(validateActionSequenceDefinition({ steps: [step] })).toEqual([]);
    for (const parameters of [
      { ...step.parameters, buffId: { blackboardKey: '' } },
      { ...step.parameters, buffId: { blackboardKey: 'child', value: 'stale' } },
      { ...step.parameters, definition: { stackingType: 'unlimited' } },
      { ...step.parameters, durationSeconds: 1 },
    ])
      expect(validateActionSequenceDefinition({ steps: [{ ...step, parameters }] })).not.toEqual(
        [],
      );
  });

  it('运行端同样拒绝内联定义、缺少上下文和未装配的施加端口', () => {
    const blackboard = new ActionBlackboard({ child: 'first' });
    const { executor, requests } = fixture(blackboard);
    expect(() => executor.execute(step)).toThrow(/Buff ID/);
    expect(() =>
      executor.execute(
        { ...step, parameters: { ...step.parameters, definition: { stackingType: 'unlimited' } } },
        { blackboard },
      ),
    ).toThrow(/内联定义/);
    const withoutPort = new BuffOperationExecutor({
      sourceId: 'caster',
      resolveTarget: () =>
        new CombatBuffContainer<string>('enemy', new CombatAttributeSet<string>()),
      resolveBuffDefinition: () => ({ stackingType: 'unlimited' }),
      delegate: {
        execute: () => {
          throw new Error('不应回退');
        },
        evaluate: () => false,
      },
    });
    expect(() => withoutPort.execute(step, { blackboard })).toThrow(/目标端口/);
    expect(requests).toEqual([]);
  });
});
