import { expect, it } from 'vitest';
import { compileActionSequenceProgram } from '../../src/compiler/actions/actionSequenceProgram.ts';
import { pruneKnownNativeBranches } from '../../src/compiler/optimization/nativeSequenceOptimization.ts';
import type { NativeActionNodeSource, NativeSequenceSource } from '../../src/source/controlFlow.ts';
import { parseNativeSequenceSource } from '../../src/source/controlFlow.ts';
import {
  createActionGraphBuilder,
  readActionGraphChain,
} from '../../src/compiler/actions/actionGraphBuilder.ts';
import type { ActionGraphReference } from '../../../../packages/game-data-contract/src/actionGraph.ts';

type Step =
  | { kind: 'leaf'; value: string }
  | { kind: 'checkCondition'; condition: string }
  | { kind: 'invertNextResult' }
  | { kind: 'anyCondition'; conditions: readonly ActionGraphReference[] }
  | {
      kind: 'ifElse';
      condition: ActionGraphReference;
      whenTrue: ActionGraphReference;
      whenFalse: ActionGraphReference;
      alwaysNext: boolean;
    };
const metadata = {
  nativeType: 'Game.TestAction',
  nativeName: 'TestAction',
  enabled: true,
  priorityLevel: 'Default',
  priorityOffset: 0,
  serverActionIndex: 0,
} as const;
const leaf = (value: string): NativeActionNodeSource<string> => ({
  metadata,
  sourcePath: value,
  body: { kind: 'leaf', value },
});
const sequence = (
  actions: readonly NativeActionNodeSource<string>[],
): NativeSequenceSource<string> => ({
  actions,
  onlyExecuteWhenSourceIsMainCharacter: false,
  onlyExecuteWhenSourceIsGuard: false,
});

it('已证明失败的同层检查截断后继，存在返回值反转时保持保守', () => {
  const source = sequence([leaf('?stop'), leaf('unsupported')]);
  const evaluate = (candidate: NativeSequenceSource<string>) =>
    candidate.actions[0]?.sourcePath === '?stop' ? false : undefined;
  const result = run(pruneKnownNativeBranches(source, evaluate), true);
  expect(result.read(result.entry)).toEqual([{ kind: 'checkCondition', condition: '?stop' }]);
  expect(() =>
    run(
      pruneKnownNativeBranches(
        sequence([
          { metadata, sourcePath: 'not', body: { kind: 'negateNextResult' } },
          ...source.actions,
        ]),
        evaluate,
      ),
    ),
  ).toThrow('unsupported action');
});

it('外层消费 IfElse 返回值时，alwaysNext 仍隔离正文尾部的无用检查', () => {
  const branch: NativeActionNodeSource<string> = {
    metadata,
    sourcePath: 'branch',
    body: {
      kind: 'ifElse',
      condition: sequence([leaf('?select')]),
      whenTrue: sequence([leaf('hit'), leaf('unused-condition')]),
      whenFalse: sequence([]),
      alwaysNext: true,
    },
  };
  const result = run(sequence([branch]), true);
  const action = result.read(result.entry)[0]!;
  if (action.kind !== 'ifElse') throw new Error('missing branch');
  expect(result.read(action.whenTrue)).toEqual([{ kind: 'leaf', value: 'hit[]' }]);
  if (branch.body.kind !== 'ifElse') throw new Error('missing source branch');
  const branchBody = branch.body;
  expect(() =>
    run(sequence([{ ...branch, body: { ...branchBody, alwaysNext: false } }]), true),
  ).toThrow('unsupported action');
});

it.each([true, false])('已证明条件为 %s 时不编译不可达动作，保留分支返回边界', known => {
  const source = sequence([
    {
      metadata,
      sourcePath: 'branch',
      body: {
        kind: 'ifElse',
        condition: sequence([leaf('?known')]),
        whenTrue: sequence([leaf(known ? 'hit' : 'unsupported')]),
        whenFalse: sequence([leaf(known ? 'unsupported' : 'hit')]),
        alwaysNext: false,
      },
    },
  ]);
  const compiled = run(pruneKnownNativeBranches(source, () => known));
  const branch = compiled.read(compiled.entry)[0]!;
  expect(branch.kind).toBe('ifElse');
  if (branch.kind !== 'ifElse') throw new Error('missing branch');
  expect(branch.alwaysNext).toBe(false);
  expect(compiled.read(branch.condition)).toEqual([]);
  expect(compiled.read(branch.whenTrue)).toEqual([{ kind: 'leaf', value: 'hit[]' }]);
  expect(() => run(pruneKnownNativeBranches(source, () => undefined))).toThrow(
    'unsupported action',
  );
});
function run(source: NativeSequenceSource<string>, resultIsConsumed = false) {
  const builder = createActionGraphBuilder<Step>();
  const entry = compileActionSequenceProgram<string, string, Step, readonly string[]>(source, {
    sequence: builder.sequence,
    resultIsConsumed,
    canDiscardUnusedLeaf: node => node.body.kind === 'leaf' && node.body.value === 'unused-query',
    canDiscardCondition: node =>
      node.body.kind === 'leaf' && node.body.value === 'unused-condition',
    initialState: () => [],
    compileCondition: node =>
      node.body.kind === 'leaf' && node.body.value.startsWith('?') ? node.body.value : null,
    createConditionCheckStep: condition => ({ kind: 'checkCondition', condition }),
    createInvertNextResultStep: () => ({ kind: 'invertNextResult' }),
    createAnyConditionStep: conditions => ({ kind: 'anyCondition', conditions }),
    createIfElseStep: input => ({ kind: 'ifElse', ...input }),
    compileLeaf: (node, state) => {
      if (node.body.kind !== 'leaf') throw new Error('unexpected control');
      const value = node.body.value;
      if (value === 'unsupported' || value === 'unused-condition')
        throw new Error('unsupported action');
      return {
        steps: [{ kind: 'leaf', value: `${value}[${state.join(',')}]` }],
        state: value.startsWith('save:') ? [...state, value.slice(5)] : state,
      };
    },
    rootFilterError: 'root filter unsupported',
    unsupportedNodeError: node => `${node.sourcePath}: unsupported control`,
  });
  const graph = builder.finish();
  return {
    entry,
    read: (reference: ActionGraphReference) => readActionGraphChain(graph, reference),
  };
}

it('检查、NotNext 和普通动作保留同层顺序；尾部检查不删除', () => {
  const result = run(
    sequence([
      leaf('?ready'),
      { metadata, sourcePath: 'not', body: { kind: 'negateNextResult' } },
      leaf('a'),
      leaf('?last'),
    ]),
  );
  expect(result.read(result.entry)).toEqual([
    { kind: 'checkCondition', condition: '?ready' },
    { kind: 'invertNextResult' },
    { kind: 'leaf', value: 'a[]' },
    { kind: 'checkCondition', condition: '?last' },
  ]);
});

it.each([false, true])('IfElse 保留条件中的写入和三个独立入口，alwaysNext=%s', alwaysNext => {
  const result = run(
    sequence([
      leaf('save:parent'),
      {
        metadata,
        sourcePath: 'branch',
        body: {
          kind: 'ifElse',
          alwaysNext,
          condition: sequence([leaf('condition-write'), leaf('?condition')]),
          whenTrue: sequence([leaf('save:true'), leaf('inside')]),
          whenFalse: sequence([leaf('other')]),
        },
      },
      leaf('after'),
    ]),
  );
  const steps = result.read(result.entry);
  const branch = steps[1];
  if (branch?.kind !== 'ifElse') throw new Error('missing IfElse');
  expect(branch.alwaysNext).toBe(alwaysNext);
  expect(result.read(branch.condition)).toEqual([
    { kind: 'leaf', value: 'condition-write[parent]' },
    { kind: 'checkCondition', condition: '?condition' },
  ]);
  expect(result.read(branch.whenTrue)).toEqual([
    { kind: 'leaf', value: 'save:true[parent]' },
    { kind: 'leaf', value: 'inside[parent,true]' },
  ]);
  expect(result.read(branch.whenFalse)).toEqual([{ kind: 'leaf', value: 'other[parent]' }]);
  expect(steps[2]).toEqual({ kind: 'leaf', value: 'after[parent]' });
});

it('空条件和空分支保留原生 IfElse 调用，不能当成无行为删除', () => {
  const result = run(
    sequence([
      {
        metadata,
        sourcePath: 'empty',
        body: {
          kind: 'ifElse',
          alwaysNext: false,
          condition: sequence([]),
          whenTrue: sequence([]),
          whenFalse: sequence([]),
        },
      },
    ]),
  );
  expect(result.read(result.entry)).toEqual([
    {
      kind: 'ifElse',
      alwaysNext: false,
      condition: { $sequence: null },
      whenTrue: { $sequence: null },
      whenFalse: { $sequence: null },
    },
  ]);
});

it('条件不能掩盖未支持的后继动作，未接入的根守卫仍明确失败', () => {
  expect(() => run(sequence([leaf('?false'), leaf('unsupported')]))).toThrow('unsupported action');
  expect(() => run({ ...sequence([leaf('a')]), onlyExecuteWhenSourceIsGuard: true })).toThrow(
    'root filter unsupported',
  );
});

it('原生 OR 的空组不参与执行，非空组保留普通动作和 NotNext', () => {
  const native = (name: string, fields = {}) => ({
    $type: `Beyond.Gameplay.Core.${name}+Data, Gameplay.Beyond`,
    isEnable: true,
    priorityLevel: 'Default',
    priorityOffset: 0,
    serverActionIndex: 0,
    ...fields,
  });
  const group = (actionData: unknown[]) => ({
    actionData,
    onlyExecuteWhenSourceIsMainChar: false,
    onlyExecuteWhenSourceIsGuard: false,
  });
  const source = parseNativeSequenceSource(
    group([
      native('OrConditionAction', {
        conditionList: [
          group([]),
          group([native('NotNextCheckAction'), native('WriteVariable')]),
          group([native('ReturnFalseAction')]),
        ],
      }),
    ]),
    'or',
    {},
    value => ((value as { $type: string }).$type.includes('ReturnFalse') ? '?false' : 'write'),
  );
  const result = run(source);
  const action = result.read(result.entry)[0];
  if (action?.kind !== 'anyCondition') throw new Error('missing OR action');
  expect(action.conditions.map(result.read)).toEqual([
    [{ kind: 'invertNextResult' }, { kind: 'leaf', value: 'write[]' }],
    [{ kind: 'checkCondition', condition: '?false' }],
  ]);
});

it('外层不消费返回值时，分支选择仍消费空条件序列的准入结果', () => {
  const guarded = {
    ...sequence([]),
    onlyExecuteWhenSourceIsMainCharacter: true,
  };
  expect(() =>
    run(
      sequence([
        {
          metadata,
          sourcePath: 'branch',
          body: {
            kind: 'ifElse',
            condition: guarded,
            whenTrue: sequence([leaf('hit')]),
            whenFalse: sequence([]),
            alwaysNext: true,
          },
        },
      ]),
    ),
  ).toThrow('root filter unsupported');
});

it('两支裁空后不要求无副作用条件的运行支持，但反转其返回值时不能删除', () => {
  const branch: NativeActionNodeSource<string> = {
    metadata,
    sourcePath: 'discarded',
    body: {
      kind: 'ifElse',
      condition: sequence([leaf('unused-condition')]),
      whenTrue: sequence([]),
      whenFalse: sequence([]),
      alwaysNext: true,
    },
  };
  const result = run(sequence([branch, leaf('hit')]));
  expect(result.read(result.entry)).toEqual([{ kind: 'leaf', value: 'hit[]' }]);
  expect(() =>
    run(
      sequence([
        { metadata, sourcePath: 'not', body: { kind: 'negateNextResult' } },
        branch,
        leaf('hit'),
      ]),
    ),
  ).toThrow('unsupported action');
  expect(() =>
    run(
      sequence([
        {
          ...branch,
          body: {
            ...(branch.body as Extract<typeof branch.body, { kind: 'ifElse' }>),
            whenTrue: sequence([leaf('hit')]),
          },
        },
      ]),
    ),
  ).toThrow('unsupported action');
});

it('无读取查询只在没有有效后继且返回值不被使用时删除', () => {
  const source = sequence([leaf('unused-query'), leaf('unused-query')]);
  const discarded = run(source);
  expect(discarded.read(discarded.entry)).toEqual([]);
  const consumed = run(source, true);
  expect(consumed.read(consumed.entry)).toHaveLength(2);
  const followed = run(sequence([leaf('unused-query'), leaf('damage')]));
  expect(followed.read(followed.entry)).toEqual([
    { kind: 'leaf', value: 'unused-query[]' },
    { kind: 'leaf', value: 'damage[]' },
  ]);
  const inverted = run(
    sequence([
      { metadata, sourcePath: 'not', body: { kind: 'negateNextResult' } },
      leaf('unused-query'),
    ]),
  );
  expect(inverted.read(inverted.entry)).toHaveLength(2);
});
