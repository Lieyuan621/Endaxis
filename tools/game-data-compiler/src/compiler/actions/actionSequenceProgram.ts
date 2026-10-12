import type { ActionGraphReference } from '../../../../../packages/game-data-contract/src/actionGraph.ts';
import type {
  NativeActionBodySourceMap,
  NativeActionNodeSource,
  NativeSequenceSource,
} from '../../source/controlFlow.ts';

export type CompiledActionSequenceProgram = ActionGraphReference;

export interface CompiledActionNodeProgram<TStep, TState> {
  readonly steps: readonly TStep[];
  /** 叶子可更新后续兄弟节点使用的编译期上下文，例如已保存的目标组。 */
  readonly state: TState;
}

export interface CompileActionSequenceProgramOptions<TLeaf, TCondition, TStep, TState> {
  /** 所有分支写入调用方所属资源的同一个图构建器。 */
  readonly sequence: (actions: readonly TStep[]) => ActionGraphReference;
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
  /** 返回值被 Switch/资格判断等外层消费；统一禁止删除决定该结果的尾守卫。 */
  readonly resultIsConsumed?: boolean;
  /** 输出已证明不可见的纯查询；仅在后继也为空且返回值未使用时删除。 */
  readonly canDiscardUnusedLeaf?: (node: NativeActionNodeSource<TLeaf>) => boolean;
  /** 分支已无有效行为时，证明条件没有仍需保留的副作用。 */
  readonly canDiscardCondition?: (node: NativeActionNodeSource<TLeaf>) => boolean;
  readonly createConditionCheckStep: (condition: TCondition) => TStep;
  readonly createInvertNextResultStep: () => TStep;
  readonly createAnyConditionStep: (conditions: readonly ActionGraphReference[]) => TStep;
  readonly createIfElseStep: (input: {
    readonly condition: ActionGraphReference;
    readonly whenTrue: ActionGraphReference;
    readonly whenFalse: ActionGraphReference;
    readonly alwaysNext: boolean;
  }) => TStep;
  readonly compileLeaf: (
    node: NativeActionNodeSource<TLeaf>,
    state: TState,
  ) => CompiledActionNodeProgram<TStep, TState>;
  /** 时间轴控制只接收当前原生动作，不能消费或合并相邻动作。 */
  readonly compileTimelineControl?: (
    node: NativeActionNodeSource<TLeaf>,
    state: TState,
  ) => CompiledActionNodeProgram<TStep, TState> | null;
  /** 条件成立/失败可为对应分支增加编译期事实；分支写入仍不会反向污染外层。 */
  readonly refineIfElseBranch?: (
    node: NativeActionNodeSource<TLeaf> & {
      readonly body: NativeActionBodySourceMap<TLeaf>['ifElse'];
    },
    state: TState,
    branch: 'whenTrue' | 'whenFalse',
  ) => CompileActionSequenceProgramOptions<TLeaf, TCondition, TStep, TState> | undefined;
  /** 保留原生逐目标调用及子序列结果隔离；不展开为外层兄弟动作。 */
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
  /** 保留一个 Channeling 调用及其 tick 子序列，次数由原生计时规则决定。 */
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
  /** 领域证明条件与子动作均不进入其可见模型时，允许省略整个原生动态开关。 */
  readonly canOmitTogglable?: (
    node: NativeActionNodeSource<TLeaf> & {
      readonly body: NativeActionBodySourceMap<TLeaf>['togglable'];
    },
  ) => boolean;
  readonly rootFilterError: string;
  readonly unsupportedNodeError: (node: NativeActionNodeSource<TLeaf>) => string;
}

/**
 * 原生 SequenceAction 的公共控制流投影。
 *
 * 条件叶子保留独立调用；NotNextCheckAction 反转下一个动作的返回值；IfElse 的两个分支
 * 各自从新的局部编译上下文开始。领域适配器只负责条件和动作叶子的语义。
 */
export function compileActionSequenceProgram<TLeaf, TCondition, TStep, TState>(
  source: NativeSequenceSource<TLeaf>,
  options: CompileActionSequenceProgramOptions<TLeaf, TCondition, TStep, TState>,
): ActionGraphReference {
  return options.sequence(
    compileActionSequenceProgramFromState(source, options, options.initialState()),
  );
}

/** 嵌套控制流继承父序列在分支入口已经建立的编译期事实，但分支写入仍不反向污染父级。 */
function compileActionSequenceProgramFromState<TLeaf, TCondition, TStep, TState>(
  source: NativeSequenceSource<TLeaf>,
  options: CompileActionSequenceProgramOptions<TLeaf, TCondition, TStep, TState>,
  state: TState,
): TStep[] {
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
  return steps;
}

/** 已完成事件专用前缀解析时，从剩余节点继续使用同一公共控制流。 */
export function compileActionNodePrograms<TLeaf, TCondition, TStep, TState>(
  nodes: readonly NativeActionNodeSource<TLeaf>[],
  options: CompileActionSequenceProgramOptions<TLeaf, TCondition, TStep, TState>,
  state: TState,
): TStep[] {
  if (nodes.length === 0) return [];
  const [first, ...rest] = nodes;
  const timelineControl = options.compileTimelineControl?.(first!, state);
  if (timelineControl != null) {
    return [
      ...timelineControl.steps,
      ...compileActionNodePrograms(rest, options, timelineControl.state),
    ];
  }
  if (first!.body.kind === 'anyCondition') {
    // 原生创建时跳过没有启用动作的序列；全部为空时 OR 返回 false。
    const conditions = first!.body.conditions
      .filter(sequence => sequence.actions.some(action => action.metadata.enabled))
      .map(sequence =>
        options.sequence(
          compileActionSequenceProgramFromState(
            sequence,
            { ...options, resultIsConsumed: true },
            state,
          ),
        ),
      );
    return [
      options.createAnyConditionStep(conditions),
      ...compileActionNodePrograms(rest, options, state),
    ];
  }
  if (first!.body.kind === 'negateNextResult') {
    return [
      options.createInvertNextResultStep(),
      ...compileActionNodePrograms(rest, { ...options, resultIsConsumed: true }, state),
    ];
  }
  // 无可见写入的检查或查询，在后继为空且返回值无人使用时无需执行。
  const unusedTail =
    !options.resultIsConsumed &&
    first!.body.kind === 'leaf' &&
    (options.canDiscardCondition?.(first!) === true ||
      options.canDiscardUnusedLeaf?.(first!) === true)
      ? compileActionNodePrograms(rest, options, state)
      : null;
  if (unusedTail?.length === 0) return [];
  if (
    !options.resultIsConsumed &&
    first!.body.kind === 'ifElse' &&
    first!.body.alwaysNext &&
    first!.body.whenTrue.actions.every(node => !node.metadata.enabled) &&
    first!.body.whenFalse.actions.every(node => !node.metadata.enabled) &&
    first!.body.condition.actions.every(
      node => !node.metadata.enabled || options.canDiscardCondition?.(node) === true,
    )
  )
    return compileActionNodePrograms(rest, options, state);
  const condition = options.compileCondition(first!, state);
  if (condition !== null) {
    return [
      options.createConditionCheckStep(condition),
      ...(unusedTail ?? compileActionNodePrograms(rest, options, state)),
    ];
  }
  if (first!.body.kind === 'ifElse') {
    const branchNode = first as NativeActionNodeSource<TLeaf> & {
      readonly body: NativeActionBodySourceMap<TLeaf>['ifElse'];
    };

    const compileBranch = (branch: 'whenTrue' | 'whenFalse') => {
      const refined = options.refineIfElseBranch?.(branchNode, state, branch);
      return compileActionSequenceProgramFromState(
        branchNode.body[branch],
        {
          ...(refined ?? options),
          // alwaysNext 覆盖正文返回值；外层消费的是 IfElse 的结果，不是正文结果。
          resultIsConsumed: !branchNode.body.alwaysNext,
        },
        refined ? refined.initialState() : state,
      );
    };
    const whenTrue = compileBranch('whenTrue');
    const whenFalse = compileBranch('whenFalse');
    if (
      whenTrue.length === 0 &&
      whenFalse.length === 0 &&
      first!.body.alwaysNext &&
      !options.resultIsConsumed &&
      first!.body.condition.actions.every(
        node => !node.metadata.enabled || options.canDiscardCondition?.(node) === true,
      )
    ) {
      return compileActionNodePrograms(rest, options, state);
    }
    // 先投影分支；条件结果决定分支，不能继承外层“结果未使用”的标记。
    const condition = compileActionSequenceProgramFromState(
      first!.body.condition,
      { ...options, resultIsConsumed: true },
      state,
    );
    return [
      options.createIfElseStep({
        condition: options.sequence(condition),
        whenTrue: options.sequence(whenTrue),
        whenFalse: options.sequence(whenFalse),
        alwaysNext: first!.body.alwaysNext,
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
