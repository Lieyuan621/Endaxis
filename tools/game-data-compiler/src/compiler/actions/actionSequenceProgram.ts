import type {
  NativeActionBodySourceMap,
  NativeActionNodeSource,
  NativeSequenceSource,
} from '../../source/controlFlow.ts';

export interface CompiledActionSequenceProgram<TStep> {
  readonly steps: readonly TStep[];
}

export interface CompiledActionNodeProgram<TStep, TState> {
  readonly steps: readonly TStep[];
  /** 叶子可更新后续兄弟节点使用的编译期上下文，例如已保存的目标组。 */
  readonly state: TState;
}

export interface CompileActionSequenceProgramOptions<TLeaf, TCondition, TStep, TState> {
  readonly initialState: () => TState;
  /** 先投影回调，再决定持有动作是否仍有效；不默认回调发生，也不泄漏其局部编译状态。 */
  readonly compileActionWithCallback?: (
    node: NativeActionNodeSource<TLeaf> & {
      readonly body: NativeActionBodySourceMap<TLeaf>['actionWithCallback'];
    },
    state: TState,
  ) => CompiledActionNodeProgram<TStep, TState>;
  readonly compileCondition: (
    node: NativeActionNodeSource<TLeaf>,
    state: TState,
  ) => TCondition | null;
  /** 多个原生条件动作共同表达一次带读取副作用的条件时，由领域整体投影。 */
  readonly compileConditionSequence?: (
    sequence: NativeSequenceSource<TLeaf>,
    state: TState,
  ) => TCondition | null;
  /** 只有已证明无副作用且结果不被消费的尾条件才可删；缺省保留求值。 */
  readonly canOmitTerminalCondition?: (condition: TCondition) => boolean;
  /** 来源已证明纯读取时，先投影其控制的末端；末端为空就无需建立条件的运行模型。 */
  readonly canOmitUnusedCondition?: (node: NativeActionNodeSource<TLeaf>) => boolean;
  /** 投影后已成为无副作用常量的守卫可直接选择可达末端；返回 undefined 表示仍需运行时求值。 */
  readonly evaluateCondition?: (condition: TCondition) => boolean | undefined;
  /** 返回值被 Switch/资格判断等外层消费；统一禁止删除决定该结果的尾守卫。 */
  readonly resultIsConsumed?: boolean;
  readonly combineConditions: (conditions: readonly TCondition[]) => TCondition;
  readonly negateCondition: (condition: TCondition) => TCondition;
  readonly compileLeaf: (
    node: NativeActionNodeSource<TLeaf>,
    state: TState,
  ) => CompiledActionNodeProgram<TStep, TState>;
  /**
   * 领域可把由多个相邻原生节点共同表达的语义整体降级；返回值必须明确消费至少一个节点。
   * 这用于保存临时值后立刻消费的循环等结构，避免把中间黑板写入伪装成独立运行行为。
   */
  readonly compileNodePrefix?: (
    nodes: readonly NativeActionNodeSource<TLeaf>[],
    state: TState,
  ) => (CompiledActionNodeProgram<TStep, TState> & { readonly consumedNodeCount: number }) | null;
  /** 条件成立/失败可为对应分支增加编译期事实；分支写入仍不会反向污染外层。 */
  readonly refineIfElseBranchState?: (
    node: NativeActionNodeSource<TLeaf> & {
      readonly body: NativeActionBodySourceMap<TLeaf>['ifElse'];
    },
    state: TState,
    branch: 'whenTrue' | 'whenFalse',
  ) => TState;
  /** 领域可在语义等价时把原生逐目标循环折叠为集合操作；未提供或拒绝时严格失败。 */
  readonly compileForEach?: (
    node: NativeActionNodeSource<TLeaf> & {
      readonly body: NativeActionBodySourceMap<TLeaf>['forEach'];
    },
    state: TState,
  ) => CompiledActionNodeProgram<TStep, TState> | null;
  /** 物理查询只有在宿主证明其全部输出不可见时才可省略；否则必须保持严格阻断。 */
  readonly compilePhysicsCast?: (
    node: NativeActionNodeSource<TLeaf> & {
      readonly body: NativeActionBodySourceMap<TLeaf>['physicsCast'];
    },
    state: TState,
  ) => CompiledActionNodeProgram<TStep, TState> | null;
  /** 领域可在固定目标模型下把有界 Channeling 精确折叠为等价次数的子序列。 */
  readonly compileChanneling?: (
    node: NativeActionNodeSource<TLeaf> & {
      readonly body: NativeActionBodySourceMap<TLeaf>['channeling'];
    },
    state: TState,
  ) => CompiledActionNodeProgram<TStep, TState> | null;
  /** 宿主须证明执行一次的状态寿命及子序列生命周期可表示；未接入的调用方保持阻断。 */
  readonly compileOnce?: (
    node: NativeActionNodeSource<TLeaf> & {
      readonly body: NativeActionBodySourceMap<TLeaf>['once'];
    },
    state: TState,
  ) => CompiledActionNodeProgram<TStep, TState> | null;
  /** 领域可在宿主调度区间内保留旧版 TickIntervalAction 的原生周期语义。 */
  readonly compileTickInterval?: (
    node: NativeActionNodeSource<TLeaf> & {
      readonly body: NativeActionBodySourceMap<TLeaf>['tickInterval'];
    },
    state: TState,
  ) => CompiledActionNodeProgram<TStep, TState> | null;
  /** 多分支保留有序标签、独立实例和返回值；由公共领域投影决定正式表示。 */
  readonly compileSwitch?: (
    node: NativeActionNodeSource<TLeaf> & {
      readonly body: NativeActionBodySourceMap<TLeaf>['switch'];
    },
    state: TState,
  ) => CompiledActionNodeProgram<TStep, TState> | null;
  /** 领域已证明整个条件节点及两分支都不可见时，可整体省略，避免为纯表现控制流伪造输入。 */
  readonly canOmitIfElse?: (
    node: NativeActionNodeSource<TLeaf> & {
      readonly body: NativeActionBodySourceMap<TLeaf>['ifElse'];
    },
  ) => boolean;
  /** 固定场景已证明分支真值时，只编译可达分支；未证明必须返回 undefined。 */
  readonly selectIfElseBranch?: (
    node: NativeActionNodeSource<TLeaf> & {
      readonly body: NativeActionBodySourceMap<TLeaf>['ifElse'];
    },
    state: TState,
  ) => boolean | undefined;
  /** 两分支投影完全等价且条件纯读取时，可直接保留任一分支，不必为不可见输入建立运行模型。 */
  readonly areEquivalentIfElseBranches?: (
    whenTrue: CompiledActionSequenceProgram<TStep>,
    whenFalse: CompiledActionSequenceProgram<TStep>,
  ) => boolean;
  /** 领域证明条件与子动作均不进入其可见模型时，允许省略整个原生动态开关。 */
  readonly canOmitTogglable?: (
    node: NativeActionNodeSource<TLeaf> & {
      readonly body: NativeActionBodySourceMap<TLeaf>['togglable'];
    },
  ) => boolean;
  readonly createConditionalStep: (input: {
    readonly condition: TCondition;
    readonly whenTrue: CompiledActionSequenceProgram<TStep>;
    readonly whenFalse?: CompiledActionSequenceProgram<TStep>;
    readonly alwaysNext: boolean;
  }) => TStep;
  readonly rootFilterError: string;
  readonly unsupportedNodeError: (node: NativeActionNodeSource<TLeaf>) => string;
}

/**
 * 原生 SequenceAction 的公共控制流投影。
 *
 * 条件叶子守卫其后的全部兄弟节点；NotNextCheckAction 只反转紧随其后的条件；IfElse 的两个分支
 * 各自从新的局部编译上下文开始。领域适配器只负责条件和动作叶子的语义。
 */
export function compileActionSequenceProgram<TLeaf, TCondition, TStep, TState>(
  source: NativeSequenceSource<TLeaf>,
  options: CompileActionSequenceProgramOptions<TLeaf, TCondition, TStep, TState>,
): CompiledActionSequenceProgram<TStep> {
  return compileActionSequenceProgramFromState(source, options, options.initialState());
}

/** 嵌套控制流继承父序列在分支入口已经建立的编译期事实，但分支写入仍不反向污染父级。 */
function compileActionSequenceProgramFromState<TLeaf, TCondition, TStep, TState>(
  source: NativeSequenceSource<TLeaf>,
  options: CompileActionSequenceProgramOptions<TLeaf, TCondition, TStep, TState>,
  state: TState,
): CompiledActionSequenceProgram<TStep> {
  const steps = compileActionNodePrograms(
    source.actions.filter(node => node.metadata.enabled),
    options,
    state,
  );
  // 根守卫是纯准入条件；先看末端是否还有行为，不能让空子树要求额外运行模型。
  // 若外层消费返回值，即使没有副作用也必须保留此支持边界。
  if (
    (source.onlyExecuteWhenSourceIsMainCharacter || source.onlyExecuteWhenSourceIsGuard) &&
    (steps.length > 0 || options.resultIsConsumed)
  ) {
    throw new Error(options.rootFilterError);
  }
  return { steps };
}

/** 已完成事件专用前缀解析时，从剩余节点继续使用同一公共控制流。 */
export function compileActionNodePrograms<TLeaf, TCondition, TStep, TState>(
  nodes: readonly NativeActionNodeSource<TLeaf>[],
  options: CompileActionSequenceProgramOptions<TLeaf, TCondition, TStep, TState>,
  state: TState,
): TStep[] {
  if (nodes.length === 0) return [];
  const prefix = options.compileNodePrefix?.(nodes, state) ?? null;
  if (prefix !== null) {
    if (prefix.consumedNodeCount <= 0 || prefix.consumedNodeCount > nodes.length) {
      throw new Error('compileNodePrefix returned an invalid consumedNodeCount');
    }
    return [
      ...prefix.steps,
      ...compileActionNodePrograms(nodes.slice(prefix.consumedNodeCount), options, prefix.state),
    ];
  }
  const [first, ...rest] = nodes;
  if (first!.body.kind === 'negateNextResult') {
    const [next, ...bodyNodes] = rest;
    if (next === undefined) throw new Error(`${first!.sourcePath}: dangling NotNextCheckAction`);
    const body = compileActionNodePrograms(bodyNodes, options, state);
    if (
      !options.resultIsConsumed &&
      body.length === 0 &&
      options.canOmitUnusedCondition?.(next) === true
    )
      return [];
    const condition = options.compileCondition(next, state);
    if (condition === null) {
      throw new Error(`${first!.sourcePath}: NotNextCheckAction must precede a condition`);
    }
    const staticValue = options.evaluateCondition?.(condition);
    if (!options.resultIsConsumed && staticValue !== undefined) return staticValue ? [] : body;
    return !options.resultIsConsumed &&
      body.length === 0 &&
      options.canOmitTerminalCondition?.(condition) === true
      ? []
      : [
          options.createConditionalStep({
            condition: options.negateCondition(condition),
            whenTrue: { steps: body },
            alwaysNext: false,
          }),
        ];
  }
  // 对已证明纯读取的静态守卫，先求值再编译不可达末端。来源 parser 仍会严格读取整棵树；
  // 这里只避免让“静止输入”等固定场景假分支要求本不可能执行的动作运行模型。
  if (options.canOmitUnusedCondition?.(first!) === true) {
    try {
      const staticCondition = options.compileCondition(first!, state);
      if (staticCondition !== null) {
        const staticValue = options.evaluateCondition?.(staticCondition);
        if (!options.resultIsConsumed && staticValue !== undefined) {
          return staticValue ? compileActionNodePrograms(rest, options, state) : [];
        }
      }
    } catch {
      // 保持原有“先看末端是否仍可见”的诊断顺序；末端有效时下方会重新抛出条件错误。
    }
  }
  // 纯守卫不写编译期状态，故其后续动作可以先投影；不能对普通写入动作倒序执行。
  const guardedBody =
    options.canOmitUnusedCondition?.(first!) === true
      ? compileActionNodePrograms(rest, options, state)
      : undefined;
  if (!options.resultIsConsumed && guardedBody?.length === 0) return [];
  const condition = options.compileCondition(first!, state);
  if (condition !== null) {
    const body = guardedBody ?? compileActionNodePrograms(rest, options, state);
    const staticValue = options.evaluateCondition?.(condition);
    if (!options.resultIsConsumed && staticValue !== undefined) return staticValue ? body : [];
    return !options.resultIsConsumed &&
      body.length === 0 &&
      options.canOmitTerminalCondition?.(condition) === true
      ? []
      : [
          options.createConditionalStep({
            condition,
            whenTrue: { steps: body },
            alwaysNext: false,
          }),
        ];
  }
  if (first!.body.kind === 'ifElse') {
    const branchNode = first as NativeActionNodeSource<TLeaf> & {
      readonly body: NativeActionBodySourceMap<TLeaf>['ifElse'];
    };
    if (options.canOmitIfElse?.(branchNode) === true) {
      return compileActionNodePrograms(rest, options, state);
    }
    let selectedBranch: boolean | undefined;
    let selectionFailure: { readonly error: unknown } | undefined;
    try {
      selectedBranch = options.selectIfElseBranch?.(branchNode, state);
    } catch (error) {
      // 静态预选只是优化探测，不得抢在末端投影之前要求空间等条件模型。
      // 仅在下方证明条件是纯读取且两侧等价/为空时才能舍弃失败；否则原样重新抛出。
      // 不直接把未知条件判为 true，也不吞掉来源读取或有效子树的错误。
      selectionFailure = { error };
    }
    if (selectedBranch !== undefined) {
      if (!first!.body.alwaysNext) {
        throw new Error(`${first!.sourcePath}: statically selected stopping IfElse is unsupported`);
      }
      const selected = compileActionSequenceProgramFromState(
        selectedBranch ? first!.body.whenTrue : first!.body.whenFalse,
        options,
        options.refineIfElseBranchState?.(
          branchNode,
          state,
          selectedBranch ? 'whenTrue' : 'whenFalse',
        ) ?? state,
      );
      return [...selected.steps, ...compileActionNodePrograms(rest, options, state)];
    }
    if (!first!.body.alwaysNext) {
      throw new Error(`${first!.sourcePath}: stopping IfElse is unsupported`);
    }
    const whenTrue = compileActionSequenceProgramFromState(
      first!.body.whenTrue,
      options,
      options.refineIfElseBranchState?.(branchNode, state, 'whenTrue') ?? state,
    );
    const whenFalse = compileActionSequenceProgramFromState(
      first!.body.whenFalse,
      options,
      options.refineIfElseBranchState?.(branchNode, state, 'whenFalse') ?? state,
    );
    const conditionNodes = first!.body.condition.actions.filter(node => node.metadata.enabled);
    const conditionsArePureReads = conditionNodes.every((child, index) =>
      child.body.kind === 'negateNextResult'
        ? conditionNodes[index + 1] !== undefined &&
          options.canOmitUnusedCondition?.(conditionNodes[index + 1]!) === true
        : options.canOmitUnusedCondition?.(child) === true,
    );
    if (
      conditionsArePureReads &&
      options.areEquivalentIfElseBranches?.(whenTrue, whenFalse) === true
    ) {
      return [...whenTrue.steps, ...compileActionNodePrograms(rest, options, state)];
    }
    if (whenTrue.steps.length === 0 && whenFalse.steps.length === 0 && conditionsArePureReads) {
      return compileActionNodePrograms(rest, options, state);
    }
    if (selectionFailure !== undefined) throw selectionFailure.error;
    const combinedCondition = options.compileConditionSequence?.(first!.body.condition, state);
    const branchConditions: TCondition[] =
      combinedCondition === undefined || combinedCondition === null ? [] : [combinedCondition];
    for (
      let index = 0;
      (combinedCondition === undefined || combinedCondition === null) &&
      index < conditionNodes.length;
      index += 1
    ) {
      const child = conditionNodes[index]!;
      if (child.body.kind === 'negateNextResult') {
        const next = conditionNodes[index + 1];
        if (next === undefined)
          throw new Error(`${child.sourcePath}: dangling NotNextCheckAction in IfElse condition`);
        const condition = options.compileCondition(next, state);
        if (condition === null)
          throw new Error(`${child.sourcePath}: NotNextCheckAction must precede a condition`);
        branchConditions.push(options.negateCondition(condition));
        index += 1;
        continue;
      }
      const condition = options.compileCondition(child, state);
      if (condition === null)
        throw new Error(`${child.sourcePath}: expected a condition-only sequence`);
      branchConditions.push(condition);
    }
    if (branchConditions.length === 0) {
      throw new Error(`${first!.sourcePath}: empty condition sequence`);
    }
    // 已支持条件也不能留下空壳 branch；没有来源级证明时，用投影后的副作用信息补判。
    if (
      whenTrue.steps.length === 0 &&
      whenFalse.steps.length === 0 &&
      branchConditions.every(condition => options.canOmitTerminalCondition?.(condition) === true)
    ) {
      return compileActionNodePrograms(rest, options, state);
    }
    return [
      options.createConditionalStep({
        condition: options.combineConditions(branchConditions),
        whenTrue,
        ...(whenFalse.steps.length === 0 ? {} : { whenFalse }),
        alwaysNext: true,
      }),
      ...compileActionNodePrograms(rest, options, state),
    ];
  }
  if (first!.body.kind === 'forEach' && options.compileForEach !== undefined) {
    const compiled = options.compileForEach(
      first as NativeActionNodeSource<TLeaf> & {
        readonly body: NativeActionBodySourceMap<TLeaf>['forEach'];
      },
      state,
    );
    if (compiled !== null) {
      return [...compiled.steps, ...compileActionNodePrograms(rest, options, compiled.state)];
    }
  }
  if (first!.body.kind === 'physicsCast' && options.compilePhysicsCast !== undefined) {
    const compiled = options.compilePhysicsCast(
      first as NativeActionNodeSource<TLeaf> & {
        readonly body: NativeActionBodySourceMap<TLeaf>['physicsCast'];
      },
      state,
    );
    if (compiled !== null) {
      return [...compiled.steps, ...compileActionNodePrograms(rest, options, compiled.state)];
    }
  }
  if (first!.body.kind === 'channeling' && options.compileChanneling !== undefined) {
    const compiled = options.compileChanneling(
      first as NativeActionNodeSource<TLeaf> & {
        readonly body: NativeActionBodySourceMap<TLeaf>['channeling'];
      },
      state,
    );
    if (compiled !== null) {
      return [...compiled.steps, ...compileActionNodePrograms(rest, options, compiled.state)];
    }
  }
  if (first!.body.kind === 'once' && options.compileOnce !== undefined) {
    const compiled = options.compileOnce(
      first as NativeActionNodeSource<TLeaf> & {
        readonly body: NativeActionBodySourceMap<TLeaf>['once'];
      },
      state,
    );
    if (compiled !== null) {
      return [...compiled.steps, ...compileActionNodePrograms(rest, options, compiled.state)];
    }
  }
  if (first!.body.kind === 'tickInterval' && options.compileTickInterval !== undefined) {
    const compiled = options.compileTickInterval(
      first as NativeActionNodeSource<TLeaf> & {
        readonly body: NativeActionBodySourceMap<TLeaf>['tickInterval'];
      },
      state,
    );
    if (compiled !== null) {
      return [...compiled.steps, ...compileActionNodePrograms(rest, options, compiled.state)];
    }
  }
  if (first!.body.kind === 'switch' && options.compileSwitch !== undefined) {
    const compiled = options.compileSwitch(
      first as NativeActionNodeSource<TLeaf> & {
        readonly body: NativeActionBodySourceMap<TLeaf>['switch'];
      },
      state,
    );
    if (compiled !== null) {
      return [...compiled.steps, ...compileActionNodePrograms(rest, options, compiled.state)];
    }
  }
  if (first!.body.kind === 'togglable') {
    const togglable = first as NativeActionNodeSource<TLeaf> & {
      readonly body: NativeActionBodySourceMap<TLeaf>['togglable'];
    };
    if (options.canOmitTogglable?.(togglable) === true) {
      return compileActionNodePrograms(rest, options, state);
    }
  }
  if (first!.body.kind === 'actionWithCallback' && options.compileActionWithCallback) {
    const compiled = options.compileActionWithCallback(
      first as NativeActionNodeSource<TLeaf> & {
        readonly body: NativeActionBodySourceMap<TLeaf>['actionWithCallback'];
      },
      state,
    );
    return [...compiled.steps, ...compileActionNodePrograms(rest, options, compiled.state)];
  }
  if (first!.body.kind !== 'leaf') {
    throw new Error(options.unsupportedNodeError(first!));
  }
  const compiled = options.compileLeaf(first!, state);
  return [...compiled.steps, ...compileActionNodePrograms(rest, options, compiled.state)];
}
