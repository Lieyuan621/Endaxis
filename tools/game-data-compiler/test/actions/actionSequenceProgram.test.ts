import { describe, expect, it } from 'vitest';
import {
  compileActionSequenceProgram,
  type CompileActionSequenceProgramOptions,
} from '../../src/compiler/actions/actionSequenceProgram.ts';
import type { NativeActionNodeSource, NativeSequenceSource } from '../../src/source/controlFlow.ts';
import {
  createActionGraphBuilder,
  readActionGraphChain,
} from '../../src/compiler/actions/actionGraphBuilder.ts';
import type { ActionGraphReference } from '../../../../packages/game-data-contract/src/actionGraph.ts';

type Condition = { readonly kind: 'condition' | 'not' | 'all'; readonly value: string };
type Step =
  | { readonly kind: 'leaf'; readonly value: string }
  | {
      readonly kind: 'conditional';
      readonly condition: Condition;
      readonly whenTrue: ActionGraphReference;
      readonly whenFalse?: ActionGraphReference;
      readonly alwaysNext: boolean;
    };

const metadata = {
  nativeType: 'Game.TestAction',
  nativeName: 'TestAction',
  enabled: true,
  priorityLevel: 'Default',
  priorityOffset: 0,
  serverActionIndex: 0,
} as const;

function leaf(value: string): NativeActionNodeSource<string> {
  return { metadata, sourcePath: value, body: { kind: 'leaf', value } };
}

function sequence(
  actions: readonly NativeActionNodeSource<string>[],
): NativeSequenceSource<string> {
  return {
    onlyExecuteWhenSourceIsMainCharacter: false,
    onlyExecuteWhenSourceIsGuard: false,
    actions,
  };
}

function options(
  builder: ReturnType<typeof createActionGraphBuilder<Step>>,
): CompileActionSequenceProgramOptions<string, Condition, Step, readonly string[]> {
  return {
    sequence: builder.sequence,
    initialState: () => [],
    canOmitTerminalCondition: () => true,
    compileCondition: node =>
      node.body.kind === 'leaf' && node.body.value.startsWith('?')
        ? { kind: 'condition', value: node.body.value }
        : null,
    combineConditions: conditions =>
      conditions.length === 1
        ? conditions[0]!
        : { kind: 'all', value: conditions.map(item => item.value).join('&') },
    negateCondition: condition => ({ kind: 'not', value: condition.value }),
    compileLeaf: (node, state) => {
      if (node.body.kind !== 'leaf') throw new Error('expected leaf');
      if (node.body.value.startsWith('save:')) {
        return { steps: [], state: [...state, node.body.value.slice(5)] };
      }
      return {
        steps: [{ kind: 'leaf', value: `${node.body.value}[${state.join(',')}]` }],
        state,
      };
    },
    createConditionalStep: input => ({
      kind: 'conditional',
      condition: input.condition,
      whenTrue: input.whenTrue,
      ...(input.whenFalse === undefined ? {} : { whenFalse: input.whenFalse }),
      alwaysNext: input.alwaysNext,
    }),
    rootFilterError: 'root filter unsupported',
    unsupportedNodeError: node => `${node.sourcePath}: unsupported node`,
  };
}

/** 图编译执行：entry 是入口引用，read 按引用读取同层动作。 */
function run(
  source: NativeSequenceSource<string>,
  customize: (
    base: CompileActionSequenceProgramOptions<string, Condition, Step, readonly string[]>,
  ) => Partial<
    CompileActionSequenceProgramOptions<string, Condition, Step, readonly string[]>
  > = () => ({}),
) {
  const builder = createActionGraphBuilder<Step>();
  const base = options(builder);
  const entry = compileActionSequenceProgram(source, { ...base, ...customize(base) });
  return {
    entry,
    read: (reference: ActionGraphReference) =>
      readActionGraphChain(builder.finish(), reference) as readonly Step[],
  };
}

describe('公共 Action 序列控制流投影', () => {
  it('根守卫在空子树投影后消去，但被外层消费的返回值不消去', () => {
    const source = { ...sequence([]), onlyExecuteWhenSourceIsGuard: true };
    const empty = run(source);
    expect(empty.read(empty.entry)).toEqual([]);
    expect(() => run(source, () => ({ resultIsConsumed: true }))).toThrow(
      'root filter unsupported',
    );
    expect(() => run({ ...source, actions: [leaf('visible')] })).toThrow('root filter unsupported');
  });

  const branch = (
    children: readonly NativeActionNodeSource<string>[],
    alwaysNext = true,
  ): NativeActionNodeSource<string> => ({
    metadata,
    sourcePath: 'unmodeled-branch',
    body: {
      kind: 'ifElse',
      condition: sequence([leaf('?unmodeled')]),
      whenTrue: sequence(children),
      whenFalse: sequence([leaf('visual')]),
      alwaysNext,
    },
  });
  const bottomUp = (
    base: CompileActionSequenceProgramOptions<string, Condition, Step, readonly string[]>,
  ) => ({
    canOmitUnusedCondition: (node: NativeActionNodeSource<string>) =>
      node.body.kind === 'leaf' && node.body.value === '?unmodeled',
    compileCondition: (node: NativeActionNodeSource<string>, state: readonly string[]) => {
      if (node.body.kind === 'leaf' && node.body.value === '?unmodeled')
        throw new Error('条件未建模');
      return base.compileCondition(node, state);
    },
    compileLeaf: (node: NativeActionNodeSource<string>, state: readonly string[]) =>
      node.body.kind === 'leaf' && node.body.value === 'visual'
        ? { steps: [], state }
        : base.compileLeaf(node, state),
  });
  it('嵌套分支自叶子向根清空后，不编译未建模的纯条件，保留后续伤害', () => {
    const result = run(sequence([branch([branch([leaf('visual')])]), leaf('damage')]), bottomUp);
    expect(result.read(result.entry)).toEqual([{ kind: 'leaf', value: 'damage[]' }]);
  });
  it('守卫末端已空时不编译纯条件；有末端行为时仍要求模型', () => {
    const cleared = run(sequence([leaf('?unmodeled'), leaf('visual')]), bottomUp);
    expect(cleared.read(cleared.entry)).toEqual([]);
    expect(() => run(sequence([leaf('?unmodeled'), leaf('damage')]), bottomUp)).toThrow(
      '条件未建模',
    );
    expect(() => run(sequence([branch([leaf('damage')])]), bottomUp)).toThrow('条件未建模');
  });
  it('未知副作用和影响外部返回值的分支不因末端空而省略', () => {
    expect(() =>
      run(sequence([branch([leaf('visual')])]), base => ({
        ...bottomUp(base),
        canOmitUnusedCondition: () => false,
      })),
    ).toThrow('条件未建模');
    expect(() => run(sequence([branch([leaf('visual')], false)]), bottomUp)).toThrow(
      'stopping IfElse',
    );
  });
  it('没有纯条件证明时保留尾部求值；显式允许才可省略', () => {
    const source = sequence([leaf('?last')]);
    const proven = run(source);
    expect(proven.read(proven.entry)).toEqual([]);
    const unproven = run(source, () => ({ canOmitTerminalCondition: undefined }));
    expect(unproven.read(unproven.entry)).toHaveLength(1);
  });
  it('已经建模的纯条件也不留下空壳分支；副作用条件仍保留', () => {
    const value = branch([leaf('visual')]);
    if (value.body.kind !== 'ifElse') throw new Error('invalid fixture');
    const source = sequence([
      { ...value, body: { ...value.body, condition: sequence([leaf('?modeled')]) } },
    ]);
    const cleared = run(source, bottomUp);
    expect(cleared.read(cleared.entry)).toEqual([]);
    const kept = run(source, base => ({
      ...bottomUp(base),
      canOmitTerminalCondition: () => false,
    }));
    expect(kept.read(kept.entry)[0]?.kind).toBe('conditional');
  });

  it('纯读取条件的两分支投影等价时不要求建立条件模型', () => {
    const value = branch([leaf('same')]);
    if (value.body.kind !== 'ifElse') throw new Error('invalid fixture');
    const source = sequence([
      { ...value, body: { ...value.body, whenFalse: sequence([leaf('same')]) } },
      leaf('after'),
    ]);
    const result = run(source, base => ({
      ...bottomUp(base),
      areEquivalentIfElseBranches: (whenTrue, whenFalse) =>
        JSON.stringify(whenTrue) === JSON.stringify(whenFalse),
    }));
    expect(result.read(result.entry)).toEqual([
      { kind: 'leaf', value: 'same[]' },
      { kind: 'leaf', value: 'after[]' },
    ]);
  });

  it('静态预选失败后先投影末端，只有纯读取空分支可消去', () => {
    const failure = new Error('静态预选未支持');
    const configured = (
      base: CompileActionSequenceProgramOptions<string, Condition, Step, readonly string[]>,
    ) => ({
      ...bottomUp(base),
      selectIfElseBranch: (): boolean | undefined => {
        throw failure;
      },
    });
    const cleared = run(sequence([branch([leaf('visual')])]), configured);
    expect(cleared.read(cleared.entry)).toEqual([]);
    expect(() => run(sequence([branch([leaf('damage')])]), configured)).toThrow(failure);
    expect(() =>
      run(sequence([branch([leaf('visual')])]), base => ({
        ...configured(base),
        canOmitUnusedCondition: () => false,
      })),
    ).toThrow(failure);
    expect(() => run(sequence([branch([leaf('visual')], false)]), configured)).toThrow(
      'stopping IfElse',
    );
  });

  it('固定模型证明 IfElse 真值时只编译可达分支并继续后续兄弟', () => {
    const result = run(sequence([branch([leaf('reachable')]), leaf('after')]), () => ({
      selectIfElseBranch: () => true,
    }));
    expect(result.read(result.entry)).toEqual([
      { kind: 'leaf', value: 'reachable[]' },
      { kind: 'leaf', value: 'after[]' },
    ]);
    expect(() =>
      run(sequence([branch([leaf('reachable')], false)]), () => ({
        selectIfElseBranch: () => true,
      })),
    ).toThrow('statically selected stopping IfElse');
  });

  it('条件叶子守卫全部剩余兄弟步骤', () => {
    const result = run(sequence([leaf('?ready'), leaf('a'), leaf('b')]));
    const [guard] = result.read(result.entry);
    if (guard?.kind !== 'conditional') throw new Error('expected conditional');
    expect(guard.condition).toEqual({ kind: 'condition', value: '?ready' });
    expect(guard.alwaysNext).toBe(false);
    expect(result.read(guard.whenTrue)).toEqual([
      { kind: 'leaf', value: 'a[]' },
      { kind: 'leaf', value: 'b[]' },
    ]);
  });

  it('NotNextCheckAction 只反转下一条件并保持后续短路体', () => {
    const negate: NativeActionNodeSource<string> = {
      metadata,
      sourcePath: 'not',
      body: { kind: 'negateNextResult' },
    };
    const result = run(sequence([negate, leaf('?ready'), leaf('a')]));
    const [guard] = result.read(result.entry);
    if (guard?.kind !== 'conditional') throw new Error('expected conditional');
    expect(guard.condition).toEqual({ kind: 'not', value: '?ready' });
    expect(result.read(guard.whenTrue)).toEqual([{ kind: 'leaf', value: 'a[]' }]);
  });

  it('IfElse 分支继承入口状态，分支写入彼此隔离且不污染后续兄弟', () => {
    const branch: NativeActionNodeSource<string> = {
      metadata,
      sourcePath: 'branch',
      body: {
        kind: 'ifElse',
        condition: sequence([leaf('?branch')]),
        whenTrue: sequence([leaf('save:true'), leaf('inside')]),
        whenFalse: sequence([leaf('outside')]),
        alwaysNext: true,
      },
    };
    const result = run(sequence([leaf('save:outer'), branch, leaf('after')]));
    const steps = result.read(result.entry);
    const [guard, after] = steps;
    if (guard?.kind !== 'conditional') throw new Error('expected conditional');
    expect(guard.condition).toEqual({ kind: 'condition', value: '?branch' });
    expect(guard.alwaysNext).toBe(true);
    expect(result.read(guard.whenTrue)).toEqual([{ kind: 'leaf', value: 'inside[outer,true]' }]);
    expect(result.read(guard.whenFalse!)).toEqual([{ kind: 'leaf', value: 'outside[outer]' }]);
    expect(after).toEqual({ kind: 'leaf', value: 'after[outer]' });
  });

  it('IfElse 条件序列中的 NotNextCheckAction 只反转紧随条件', () => {
    const negate: NativeActionNodeSource<string> = {
      metadata,
      sourcePath: 'not',
      body: { kind: 'negateNextResult' },
    };
    const branch: NativeActionNodeSource<string> = {
      metadata,
      sourcePath: 'branch',
      body: {
        kind: 'ifElse',
        condition: sequence([leaf('?has-target'), negate, leaf('?already-added')]),
        whenTrue: sequence([leaf('gain')]),
        whenFalse: sequence([]),
        alwaysNext: true,
      },
    };

    const result = run(sequence([branch]), () => ({
      negateCondition: condition => ({ kind: 'not' as const, value: `!${condition.value}` }),
    }));
    const [guard] = result.read(result.entry);
    if (guard?.kind !== 'conditional') throw new Error('expected conditional');
    expect(guard.condition).toEqual({ kind: 'all', value: '?has-target&!?already-added' });
    expect(result.read(guard.whenTrue)).toEqual([{ kind: 'leaf', value: 'gain[]' }]);
  });

  it('允许领域把已证明等价的 ForEach 折叠为集合步骤并继续编译兄弟节点', () => {
    const loop: NativeActionNodeSource<string> = {
      metadata,
      sourcePath: 'loop',
      body: {
        kind: 'forEach',
        target: {} as never,
        action: sequence([leaf('inside')]),
      },
    };
    const result = run(sequence([loop, leaf('after')]), () => ({
      compileForEach: (node, state) => ({
        steps: [{ kind: 'leaf' as const, value: `folded:${node.body.action.actions.length}` }],
        state: [...state, 'loop'],
      }),
    }));

    expect(result.read(result.entry)).toEqual([
      { kind: 'leaf', value: 'folded:1' },
      { kind: 'leaf', value: 'after[loop]' },
    ]);
  });

  it('静态假守卫不会编译不可达的后继动作', () => {
    const result = run(
      sequence([leaf('?stationary-move-input'), leaf('unsupported-direction-write')]),
      base => ({
        canOmitUnusedCondition: node =>
          node.body.kind === 'leaf' && node.body.value.startsWith('?'),
        evaluateCondition: condition =>
          condition.value === '?stationary-move-input' ? false : undefined,
        compileLeaf: (node, state) => {
          if (node.body.kind !== 'leaf') throw new Error('expected leaf');
          if (node.body.value === 'unsupported-direction-write') {
            throw new Error('unreachable direction write was compiled');
          }
          return base.compileLeaf(node, state);
        },
      }),
    );

    expect(result.read(result.entry)).toEqual([]);
  });
});
