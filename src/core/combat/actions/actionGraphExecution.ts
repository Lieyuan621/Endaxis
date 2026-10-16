import type { ActionTargetQuery } from '../../../../packages/game-data-contract/src/conditions';
import type { ResolvedCombatStepParameters } from '../../compiler/combatProgram';
import type {
  CompiledCondition,
  CompiledGraphStepForKind,
  CompiledValueInput,
} from '../../compiler/compiledGraphData.ts';
import {
  conditionInputExpression,
  conditionInvokesAction,
} from '../../compiler/compiledGraphData.ts';
import type { AuraInfluenceState } from '../state/actionState';
import type { BuffReference } from '../state/foundationState';
import type { ExecutionTracePhase } from './actionExecutionTrace';
import { endChanneling, tickChanneling } from './channelingActionExecution';
/** 图程序保持共享；控制节点的子调用仅在执行、重置或恢复时绑定。 */
import type { ActionGraphReference } from '../../../../packages/game-data-contract/src/actionGraph';
import type { ResolvedCombatStepForKind } from '../../compiler/combatProgram';
import type {
  CompiledActionGraph,
  CompiledGraphOperation,
} from '../../compiler/compileActionGraph';
import type { RuntimeTargetGroup, RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import { sameRuntimeTarget } from '../abilities/runtimeTargetContext';
import {
  STEP_RESULT_MODE,
  type CombatEventListenerState,
  type SequenceExecutionState,
} from '../state/actionState';
import { deriveAnonymousDamageStepKey } from '../timeline/deriveHitId';
import type { EventResponseExecution } from './combatActionEventListener';
import { CombatActionTagQueryListener } from './combatActionEventListener';

export type CombatActionExecution = ActionGraphExecution;

import {
  COMBAT_STEP_STATE,
  createBranchActionState,
  createChannelingActionState,
  createRepeatedActionState,
  createTimelineJumpState,
  type ActionGraphExecutionState,
  type ActionGraphNodeData,
  type ActionStepState,
  type GraphLeafStepData,
} from '../state/actionState';
import {
  endActionSequence,
  executeActionSequence,
  resetActionSequence,
  tickActionSequence,
  type ActionSequenceExecutionHost,
} from './actionSequenceExecution';
import {
  endBranchAction,
  executeConditionalAction,
  executeSwitchAction,
  resetConditionalAction,
  resetSwitchAction,
  tickBranchAction,
  type BranchActionHost,
} from './branchActionExecution';
import { CombatStep, type CombatExecutionContext } from './combatStep';
import {
  executeRepeatedAction,
  resetRepeatedAction,
  tickRepeatedAction,
} from './repeatedActionExecution';
import { executeTimelineJump, resetTimelineJump, tickTimelineJump } from './sequenceControl';

export interface ActionGraphExecutionHost {
  observeOwnerTags?(changed: () => void): () => void;
  ownerTagsMatch?(parameters: CompiledGraphStepForKind<'listenForTagQuery'>['parameters']): boolean;
  /** 只观察已经取得的结果，不参与求值或执行策略。 */
  readonly observeCondition?: (input: CompiledCondition, result: boolean) => void;
  readonly comboQte?: {
    register(earlySeconds: number, activeSeconds: number): number;
    bind(registration: number, triggered: () => void): void;
    end(registration: number): void;
  };
  readonly frame?: () => number;
  readonly inputTarget?: RuntimeTargetRef;
  selectTargets?(selection: ActionTargetQuery, input: RuntimeTargetRef | null): RuntimeTargetGroup;
  readonly requestTimelineJump: ((frame: number) => void) | undefined;
  readonly executionPolicy: SequenceExecutionState;
  readonly trace?: <T>(
    program: CompiledActionGraph,
    nodeId: string,
    invocation: string,
    phase: ExecutionTracePhase,
    execute: () => T,
  ) => T;
  listener(
    responses: CompiledGraphStepForKind<'listenForCombatEvents'>['parameters']['responses'],
    state: CombatEventListenerState<ActionGraphExecutionState>,
    create: (
      reference: ActionGraphReference,
      index: number,
      host: ActionGraphExecutionHost,
      saved?: ActionGraphExecutionState,
    ) => EventResponseExecution<ActionGraphExecutionState>,
  ): { execute(): void; end(): void; reset(): void };
  targets(
    parameters: ResolvedCombatStepForKind<'forEachContextTarget'>['parameters'],
  ): RuntimeTargetGroup;
  withTarget(target: RuntimeTargetRef, asInput?: boolean): ActionGraphExecutionHost;
  withSavedInput(target: RuntimeTargetRef | null): ActionGraphExecutionHost;
  aura?(parameters: ResolvedCombatStepParameters['aura']): {
    targets(): readonly RuntimeTargetRef[];
    apply(target: RuntimeTargetRef): BuffReference[];
    finish(references: readonly BuffReference[]): void;
  };
  bindOperation(
    action: CompiledGraphOperation,
  ): CombatStep & { readonly executionData: GraphLeafStepData };
  canExecute(): boolean;
  evaluate(condition: CompiledCondition): boolean;
  value(operand: CompiledValueInput): number;
}

interface GraphNodeBinding {
  readonly data: ActionGraphNodeData;
  execute(context: CombatExecutionContext): boolean;
  reset(context: CombatExecutionContext): void;
  tick(delta: number, context: CombatExecutionContext): void;
  end(context: CombatExecutionContext): void;
  /** 内部动作在父序列里按原顺序枚举，不创造额外生命周期门禁。 */
  inline?(create: boolean): ActionGraphExecution | undefined;
  /** 自动提取的中间段不增加包装动作，只保存可恢复的子执行状态。 */
  readonly inlineOnly?: boolean;
}

/**
 * 宏调用包装宿主：把宏体内的 parameter 操作数代入为调用点实参。
 * 代入的是操作数本身，常量、黑板引用仍由执行器在消费点解析，不做调用时快照；
 * 同一输入对象经 WeakMap 记忆化，保证同一输入返回同一输出对象。
 */
function wrapMacroHost(
  host: ActionGraphExecutionHost,
  args: Readonly<Record<string, CompiledValueInput>>,
): ActionGraphExecutionHost {
  const memo = new WeakMap<object, unknown>();
  const substitute = <T>(value: T): T => {
    if (!value || typeof value !== 'object') return value;
    // 独立资源及其编译入口属于另一个参数作用域，不替换内部节点。
    if ('actionGraph' in value || ('graph' in value && 'entry' in value && 'callSite' in value))
      return value;
    const cached = memo.get(value);
    if (cached !== undefined) return cached as T;
    if (Array.isArray(value)) {
      const items = value.map(item => substitute(item));
      const result = items.some((item, index) => item !== value[index]) ? items : value;
      memo.set(value, result);
      return result as T;
    }
    const record = value as Record<string, unknown>;
    if (record.kind === 'parameter') {
      const name = record.parameter;
      if (typeof name !== 'string' || !Object.hasOwn(args, name))
        throw new Error(`macro parameter '${String(name)}' has no argument at this call site`);
      return args[name] as T;
    }
    const entries = Object.entries(record).map(([key, item]) => [key, substitute(item)] as const);
    const result = entries.some(([key, item]) => item !== record[key])
      ? Object.fromEntries(entries)
      : value;
    memo.set(value, result);
    return result as T;
  };
  return {
    frame: host.frame,
    comboQte: host.comboQte,
    observeOwnerTags: host.observeOwnerTags,
    ownerTagsMatch: host.ownerTagsMatch,
    withSavedInput: target => wrapMacroHost(host.withSavedInput(target), args),
    get inputTarget() {
      return host.inputTarget;
    },
    selectTargets: host.selectTargets,
    executionPolicy: host.executionPolicy,
    requestTimelineJump: host.requestTimelineJump,
    ...(host.trace === undefined ? {} : { trace: host.trace }),
    ...(host.observeCondition === undefined ? {} : { observeCondition: host.observeCondition }),
    listener: (responses, state, create) =>
      host.listener(substitute(responses), state, (reference, index, inner, saved) =>
        create(reference, index, wrapMacroHost(inner, args), saved),
      ),
    targets: parameters => host.targets(substitute(parameters)),
    withTarget: (target, asInput) => wrapMacroHost(host.withTarget(target, asInput), args),
    ...(host.aura === undefined
      ? {}
      : {
          aura: (parameters: ResolvedCombatStepParameters['aura']) =>
            host.aura!(substitute(parameters)),
        }),
    bindOperation: action => host.bindOperation(substitute(action)),
    canExecute: () => host.canExecute(),
    evaluate: condition => host.evaluate(substitute(condition)),
    value: operand => host.value(substitute(operand)),
  };
}

export class ActionGraphExecution
  extends CombatStep
  implements ActionSequenceExecutionHost<GraphNodeBinding>
{
  readonly runtimeState: ActionGraphExecutionState;
  // 生命周期对象随实例保持稳定，枚举时复用绑定与状态的配对，不逐帧分配包装。
  readonly #bindings = new Map<string, [GraphNodeBinding, ActionStepState]>();
  readonly #evaluations = new Map<string, ActionGraphExecution>();

  constructor(
    readonly program: CompiledActionGraph,
    entry: string | null,
    invocation: string,
    readonly host: ActionGraphExecutionHost,
    state?: ActionGraphExecutionState,
    callSite: string = invocation,
    readonly nodeBindings?: Readonly<Record<string, string>>,
  ) {
    super();
    if (!invocation) throw new Error('graph execution requires a call-site identity');
    if (entry !== null && !program.nodes.has(entry))
      throw new Error(`missing graph entry: ${entry}`);
    if (
      state &&
      (state.revision !== program.revision ||
        state.entry !== entry ||
        state.invocation !== invocation ||
        state.callSite !== callSite)
    )
      throw new Error('graph checkpoint does not match program or call site');
    this.runtimeState = state ?? {
      revision: program.revision,
      entry,
      invocation,
      callSite,
      closed: false,
      nodes: new Map(),
    };
    if (state) {
      const reachable = new Set<string>();
      for (let id = entry; id !== null; id = program.nodes.get(id)!.next) reachable.add(id);
      for (const [id, saved] of state.nodes) {
        if (!reachable.has(id)) throw new Error(`checkpoint node is outside entry: ${id}`);
        if (!Object.values(COMBAT_STEP_STATE).includes(saved.lifecycle.state))
          throw new Error(`invalid checkpoint node lifecycle: ${id}`);
      }
      for (const id of state.nodes.keys()) this.#binding(id);
    }
  }

  get isEmpty(): boolean {
    return this.runtimeState.entry === null;
  }
  override get executionData() {
    return { kind: 'graph' as const, graph: this.runtimeState };
  }
  override createRuntimeInstance(): ActionGraphExecution {
    return new ActionGraphExecution(
      this.program,
      this.runtimeState.entry,
      this.runtimeState.invocation,
      this.host,
      undefined,
      this.runtimeState.callSite,
      this.nodeBindings,
    );
  }

  #child(
    id: string,
    port: number,
    entry: string | null,
    state?: ActionGraphExecutionState,
    host: ActionGraphExecutionHost = this.host,
    dynamicId?: number,
    program = this.program,
  ): ActionGraphExecution {
    return new ActionGraphExecution(
      program,
      entry,
      `${this.runtimeState.invocation}/${encodeURIComponent(this.#identity(id))}:${port}${dynamicId === undefined ? '' : `@${dynamicId}`}`,
      host,
      state,
      `${this.runtimeState.callSite}/${encodeURIComponent(this.#identity(id))}:${port}`,
      program === this.program ? this.nodeBindings : undefined,
    );
  }

  #identity(id: string): string {
    return this.nodeBindings?.[id] ?? id;
  }

  #evaluation(input: CompiledCondition, consumer: string, inputPath: string): ActionGraphExecution {
    const expression = conditionInputExpression(input);
    if (expression.kind !== 'checkActionResult' || input.kind !== 'conditionNode')
      throw new Error('checkActionResult requires a data node identity');
    const key = JSON.stringify([this.#identity(consumer), inputPath, input.nodeId]);
    let execution = this.#evaluations.get(key);
    if (!execution) {
      const states = (this.runtimeState.evaluations ??= new Map());
      execution = this.#child(key, 0, expression.action.$sequence, states.get(key));
      states.set(key, execution.runtimeState);
      this.#evaluations.set(key, execution);
    }
    return execution;
  }

  #resetEvaluation(
    input: CompiledCondition,
    consumer: string,
    context: CombatExecutionContext,
    inputPath = 'condition',
  ): void {
    if (!conditionInvokesAction(input)) return;
    const expression = conditionInputExpression(input);
    if (expression.kind === 'checkActionResult')
      this.#evaluation(input, consumer, inputPath).reset(context);
    else if (expression.kind === 'all' || expression.kind === 'any')
      expression.conditions.forEach((condition, index) =>
        this.#resetEvaluation(condition, consumer, context, `${inputPath}/${index}`),
      );
    else if (expression.kind === 'not')
      this.#resetEvaluation(expression.condition, consumer, context, `${inputPath}/not`);
  }

  #evaluate(
    input: CompiledCondition,
    consumer: string,
    context: CombatExecutionContext,
    inputPath = 'condition',
  ): boolean {
    const result = this.#evaluateInput(input, consumer, context, inputPath);
    this.host.observeCondition?.(input, result);
    return result;
  }

  #evaluateInput(
    input: CompiledCondition,
    consumer: string,
    context: CombatExecutionContext,
    inputPath: string,
  ): boolean {
    if (!conditionInvokesAction(input)) return this.host.evaluate(input);
    const expression = conditionInputExpression(input);
    if (expression.kind === 'checkActionResult')
      return this.#evaluation(input, consumer, inputPath).executeInstant(context);
    // 顺序求值且短路，不能先把所有输入替换为常量：输入可能会执行行为。
    if (expression.kind === 'all')
      return expression.conditions.every((condition, index) =>
        this.#evaluate(condition, consumer, context, `${inputPath}/${index}`),
      );
    if (expression.kind === 'any')
      return expression.conditions.some((condition, index) =>
        this.#evaluate(condition, consumer, context, `${inputPath}/${index}`),
      );
    if (expression.kind === 'not')
      return !this.#evaluate(expression.condition, consumer, context, `${inputPath}/not`);
    return this.host.evaluate(input);
  }

  #evaluateBranchCondition(
    input: CompiledCondition,
    consumer: string,
    context: CombatExecutionContext,
    inputPath = 'condition',
  ): boolean {
    if (conditionInvokesAction(input)) return this.#evaluate(input, consumer, context, inputPath);
    // 原生控制节点的条件是即时执行的动作。去掉单个纯判断的 checkCondition 包装后，
    // 仍在此消费一次执行门禁与 NotNext；转接序列已经处理过，不能再反转一次。
    const mode = context.sequence?.resultMode;
    const result = this.host.canExecute() && this.#evaluate(input, consumer, context);
    if (mode === STEP_RESULT_MODE.invertNextResult) {
      context.sequence!.resultMode = STEP_RESULT_MODE.normal;
      return !result;
    }
    return result;
  }

  #binding(id: string): [GraphNodeBinding, ActionStepState] {
    const existing = this.#bindings.get(id);
    if (existing) return existing;
    const action = this.program.nodes.get(id)!.action;
    const saved = this.runtimeState.nodes.get(id)?.data;
    let binding: GraphNodeBinding;
    if (action.kind === 'callMacro' || action.kind === 'callResource') {
      if (saved && saved.kind !== 'graphMacro') throw new Error(`expected macro state: ${id}`);
      const data = saved ?? { kind: 'graphMacro' as const, body: null };
      // 实参来自编译节点定义，不进入运行状态；恢复走同一 binding 创建逻辑，自然带参数。
      const macroHost =
        action.kind === 'callMacro' && action.arguments
          ? wrapMacroHost(this.host, action.arguments)
          : this.host;
      const entry = action.kind === 'callResource' ? action.entry.entry : action.entry;
      const program = action.kind === 'callResource' ? action.entry.graph : this.program;
      const identities = action.kind === 'callMacro' ? action.nodeBindings : undefined;
      const createBody = (state?: ActionGraphExecutionState) =>
        identities === undefined
          ? this.#child(id, 0, entry, state, macroHost, undefined, program)
          : new ActionGraphExecution(
              program,
              entry,
              this.runtimeState.invocation,
              macroHost,
              state,
              this.runtimeState.callSite,
              Object.fromEntries(
                Object.entries(identities).map(([node, identity]) => [
                  node,
                  this.#identity(identity),
                ]),
              ),
            );
      let body = data.body === null ? undefined : createBody(data.body);
      const getBody = () => {
        if (!body) {
          body = createBody();
          data.body = body.runtimeState;
        }
        return body;
      };
      binding =
        identities === undefined
          ? {
              data,
              execute: context => getBody().tryExecute(context),
              reset: context => getBody().reset(context),
              tick: (delta, context) => body?.tick(delta, context),
              end: context => body?.end(context),
            }
          : {
              data,
              execute: () => true,
              reset() {},
              tick() {},
              end() {},
              inlineOnly: true,
              inline: create => (create ? getBody() : body),
            };
    } else if (action.kind === 'anyCondition') {
      if (saved && saved.kind !== 'stateless') throw new Error(`expected condition state: ${id}`);
      binding = {
        data: saved ?? { kind: 'stateless' },
        execute: context =>
          action.conditions.some((input, index) =>
            this.#evaluateBranchCondition(input, id, context, `conditions/${index}`),
          ),
        reset: context =>
          action.conditions.forEach((input, index) =>
            this.#resetEvaluation(input, id, context, `conditions/${index}`),
          ),
        tick() {},
        end() {},
      };
    } else if (action.kind === 'checkCondition' || action.kind === 'invertNextResult') {
      if (saved && saved.kind !== 'stateless') throw new Error(`expected check state: ${id}`);
      binding = {
        data: saved ?? { kind: 'stateless' },
        execute: context => {
          if (action.kind === 'checkCondition')
            return this.#evaluate(action.parameters.condition, id, context);
          if (!context.sequence) throw new Error('NotNext requires a sequence execution context');
          context.sequence.resultMode = STEP_RESULT_MODE.invertNextResult;
          return true;
        },
        reset: context => {
          if (action.kind === 'checkCondition')
            this.#resetEvaluation(action.parameters.condition, id, context);
        },
        tick() {},
        end() {},
      };
    } else if (
      action.kind === 'conditional' &&
      action.whenFalse === undefined &&
      action.parameters.alwaysNext !== true
    ) {
      if (saved && saved.kind !== 'graphGuard') throw new Error(`expected guard state: ${id}`);
      const data = saved ?? { kind: 'graphGuard' as const, body: null };
      let body =
        data.body === null ? undefined : this.#child(id, 0, action.whenTrue.$sequence, data.body);
      binding = {
        data,
        execute: context => this.#evaluate(action.parameters.condition, id, context),
        reset: context => this.#resetEvaluation(action.parameters.condition, id, context),
        tick() {},
        end() {},
        inline: create => {
          if (!body && create) {
            body = this.#child(id, 0, action.whenTrue.$sequence);
            data.body = body.runtimeState;
          }
          return body;
        },
      };
    } else if (
      action.kind === 'conditional' ||
      action.kind === 'switch' ||
      action.kind === 'ifElse'
    ) {
      if (saved && saved.kind !== 'graphBranch') throw new Error(`expected branch state: ${id}`);
      const data = saved ?? {
        kind: 'graphBranch' as const,
        selection: createBranchActionState(),
        branches: new Map<number, ActionGraphExecutionState>(),
      };
      const entries =
        action.kind === 'switch'
          ? action.options.map(option => option.sequence.$sequence)
          : [
              action.whenTrue.$sequence,
              ...(action.whenFalse === undefined ? [] : [action.whenFalse.$sequence]),
            ];
      const bindings = new Map<number, ActionGraphExecution>();
      const branch = (index: number) => {
        let child = bindings.get(index);
        if (!child) {
          if (index < 0 || index >= entries.length || !Number.isInteger(index))
            throw new Error(`invalid graph branch: ${id}/${index}`);
          child = this.#child(id, index, entries[index]!, data.branches.get(index));
          bindings.set(index, child);
          data.branches.set(index, child.runtimeState);
        }
        return child;
      };
      for (const index of data.branches.keys()) branch(index);
      const selected = data.selection.activeBranch;
      if (selected !== null && (!data.branches.has(selected) || !Number.isInteger(selected)))
        throw new Error(`missing selected graph branch: ${id}`);
      const branchHost: BranchActionHost = {
        execute: (index, context) => branch(index).tryExecute(context),
        tick: (index, delta, context) => branch(index).tick(delta, context),
        end: (index, context) => branch(index).end(context),
        reset: (index, context) => branch(index).reset(context),
      };
      let execute: GraphNodeBinding['execute'];
      if (action.kind === 'switch') {
        const switchHost = {
          ...branchHost,
          choice: () => this.host.value(action.parameters.choice),
          value: (index: number) => this.host.value(action.options[index]!.value),
        };
        execute = context =>
          executeSwitchAction(
            data.selection,
            entries.length,
            action.parameters.alwaysNext,
            switchHost,
            context,
          );
      } else {
        const conditionalHost = {
          ...branchHost,
          evaluate: (context: CombatExecutionContext) =>
            action.kind === 'ifElse'
              ? this.#evaluateBranchCondition(action.condition, id, context)
              : this.#evaluate(action.parameters.condition, id, context),
        };
        execute = context =>
          executeConditionalAction(
            data.selection,
            action.whenFalse !== undefined,
            action.parameters.alwaysNext === true,
            conditionalHost,
            context,
          );
      }
      binding = {
        data,
        execute,
        reset: context => {
          if (action.kind === 'ifElse') this.#resetEvaluation(action.condition, id, context);
          if (action.kind === 'conditional')
            this.#resetEvaluation(action.parameters.condition, id, context);
          return action.kind === 'switch'
            ? resetSwitchAction(entries.length, branchHost, context)
            : resetConditionalAction(
                data.selection,
                action.whenFalse !== undefined,
                branchHost,
                context,
              );
        },
        tick: (delta, context) => {
          if (action.kind === 'ifElse') {
            branch(0).tick(delta, context);
            branch(1).tick(delta, context);
          } else tickBranchAction(data.selection, delta, branchHost, context);
        },
        end: context => {
          if (action.kind === 'ifElse') {
            branch(0).end(context);
            branch(1).end(context);
          } else endBranchAction(data.selection, branchHost, context);
        },
      };
    } else if (action.kind === 'listenForTagQuery') {
      if (saved && saved.kind !== 'graphTagListener')
        throw new Error(`expected tag listener state: ${id}`);
      const data = saved ?? {
        kind: 'graphTagListener' as const,
        target: this.host.inputTarget ?? null,
        listener: { active: false, matched: false, body: null },
      };
      const host = this.host;
      if (!host.observeOwnerTags || !host.ownerTagsMatch)
        throw new Error('tag query listener requires an owner tag container');
      const listener = new CombatActionTagQueryListener(
        data.listener,
        action.parameters.executeOnMatch,
        () => host.ownerTagsMatch!(action.parameters),
        changed => host.observeOwnerTags!(changed),
        state =>
          this.#child(
            id,
            0,
            action.parameters.sequence.$sequence,
            state,
            host.withSavedInput(data.target),
          ),
      );
      binding = {
        data,
        execute: () => {
          listener.execute();
          return true;
        },
        end: () => listener.end(),
        reset: () => listener.reset(),
        tick() {},
      };
    } else if (action.kind === 'listenForCombatEvents') {
      if (saved && saved.kind !== 'graphListener')
        throw new Error(`expected graph listener state: ${id}`);
      const data = saved ?? { kind: 'graphListener' as const, listener: { responses: [] } };
      const listener = this.host.listener(
        action.parameters.responses,
        data.listener,
        (reference, index, host, state) => this.#child(id, index, reference.$sequence, state, host),
      );
      binding = {
        data,
        execute: () => {
          listener.execute();
          return true;
        },
        end: () => listener.end(),
        reset: () => listener.reset(),
        tick() {},
      };
    } else if (action.kind === 'playAnimation') {
      if (saved && saved.kind !== 'graphAnimation')
        throw new Error(`expected animation state: ${id}`);
      const data = saved ?? {
        kind: 'graphAnimation' as const,
        active: false,
        remainingSeconds: 0,
        target: null,
        body: null,
      };
      let child: ActionGraphExecution | undefined;
      const body = () => {
        if (!child) {
          child = this.#child(
            id,
            0,
            action.onEnd.$sequence,
            data.body ?? undefined,
            this.host.withSavedInput(data.target),
          );
          data.body = child.runtimeState;
        }
        return child;
      };
      if (data.body !== null) body();
      const finish = () => {
        if (!data.active) return;
        data.active = false;
        if (data.remainingSeconds <= 0 || !action.parameters.executeOnNormalEndOnly)
          body().executeInstant({});
        data.target = null;
      };
      binding = {
        data,
        execute: () => {
          data.active = true;
          data.remainingSeconds = Math.fround(
            Math.fround(action.parameters.durationSeconds) -
              Math.fround(action.parameters.blendOutSeconds),
          );
          data.target = this.host.inputTarget === undefined ? null : { ...this.host.inputTarget };
          child = undefined;
          return true;
        },
        tick: delta => {
          if (!data.active) return;
          data.remainingSeconds = Math.fround(data.remainingSeconds - Math.fround(delta));
          if (data.remainingSeconds <= 0) finish();
        },
        end: finish,
        reset: context => body().reset(context),
      };
    } else if (action.kind === 'showComboRingQte') {
      if (saved && saved.kind !== 'graphComboQte') throw new Error(`expected QTE state: ${id}`);
      const data = saved ?? {
        kind: 'graphComboQte' as const,
        registration: null,
        target: null,
        body: null,
      };
      const qte = this.host.comboQte;
      if (!qte) throw new Error('QTE runtime is not configured');
      let child: ActionGraphExecution | undefined;
      const body = () => {
        if (!child) {
          child = this.#child(
            id,
            0,
            action.triggeredAction.$sequence,
            data.body ?? undefined,
            this.host.withSavedInput(data.target),
          );
          data.body = child.runtimeState;
        }
        return child;
      };
      const bind = () => {
        if (data.registration !== null)
          qte.bind(data.registration, () => body().executeInstant({}));
      };
      if (data.body !== null) body();
      bind();
      binding = {
        data,
        execute: () => {
          if (data.registration !== null) qte.end(data.registration);
          data.target = this.host.inputTarget === undefined ? null : { ...this.host.inputTarget };
          child = undefined;
          data.registration = qte.register(
            this.host.value(action.parameters.earlyDurationSeconds),
            this.host.value(action.parameters.activeDurationSeconds),
          );
          bind();
          return true;
        },
        tick() {},
        reset: context => body().reset(context),
        end: context => {
          if (data.registration !== null) qte.end(data.registration);
          data.registration = null;
          body().end(context);
          data.target = null;
        },
      };
    } else if (action.kind === 'aura') {
      if (saved && saved.kind !== 'graphAura') throw new Error(`expected Aura state: ${id}`);
      const data = saved ?? { kind: 'graphAura' as const, active: false, influences: [] };
      const influence = this.host.aura?.(action.parameters);
      if (!influence) throw new Error('Aura runtime is not configured');
      const callbacks = new Map<
        number,
        { enter?: ActionGraphExecution; exit?: ActionGraphExecution }
      >();
      const bind = (index: number) => {
        // 空回调没有返回值消费者，也没有生命周期行为，无需创建子实例和目标宿主。
        if (action.onEnter.$sequence === null && action.onExit.$sequence === null) return;
        let pair = callbacks.get(index);
        if (pair) return pair;
        const item = data.influences[index]!;
        const host = this.host.withTarget(item.target, true);
        pair = {
          ...(action.onEnter.$sequence === null
            ? {}
            : {
                enter: this.#child(
                  id,
                  0,
                  action.onEnter.$sequence,
                  item.enter ?? undefined,
                  host,
                  index,
                ),
              }),
          ...(action.onExit.$sequence === null
            ? {}
            : {
                exit: this.#child(
                  id,
                  1,
                  action.onExit.$sequence,
                  item.exit ?? undefined,
                  host,
                  index,
                ),
              }),
        };
        item.enter = pair.enter?.runtimeState ?? null;
        item.exit = pair.exit?.runtimeState ?? null;
        callbacks.set(index, pair);
        return pair;
      };
      // 恢复只重新绑定已有程序和状态，不执行进入、退出或重新施加。
      data.influences.forEach((_item, index) => bind(index));
      const leave = (index: number, context: CombatExecutionContext) => {
        const item = data.influences[index]!;
        if (!item.active) return;
        item.active = false;
        influence.finish(item.buffs);
        item.buffs.length = 0;
        bind(index)?.exit?.tryExecute(context, true);
      };
      const synchronize = (context: CombatExecutionContext) => {
        if (!data.active) return;
        const targets = influence.targets();
        for (let index = data.influences.length - 1; index >= 0; index--)
          if (
            data.influences[index]!.active &&
            !targets.some(target => sameRuntimeTarget(target, data.influences[index]!.target))
          )
            leave(index, context);
        for (const target of targets) {
          if (!data.active) break;
          if (data.influences.some(item => item.active && sameRuntimeTarget(item.target, target)))
            continue;
          const index = data.influences.length;
          const item: AuraInfluenceState = {
            target: { ...target },
            buffs: [],
            active: true,
            enter: null,
            exit: null,
          };
          data.influences.push(item);
          const references = influence.apply(target);
          if (!data.active || !item.active) {
            influence.finish(references);
            continue;
          }
          item.buffs.push(...references);
          bind(index)?.enter?.tryExecute(context, true);
        }
      };
      binding = {
        data,
        execute: context => {
          data.active = true;
          synchronize(context);
          return true;
        },
        tick: (_delta, context) => synchronize(context),
        end: context => {
          data.active = false;
          for (let index = data.influences.length - 1; index >= 0; index--) leave(index, context);
          for (const pair of callbacks.values()) {
            pair.enter?.end(context);
            pair.exit?.end(context);
          }
        },
        reset: context => {
          data.active = false;
          for (const pair of callbacks.values()) {
            pair.enter?.reset(context);
            pair.exit?.reset(context);
          }
          callbacks.clear();
          data.influences.length = 0;
        },
      };
    } else if (action.kind === 'jumpTimeline') {
      if (saved && saved.kind !== 'graphJump') throw new Error(`expected jump state: ${id}`);
      const data = saved ?? {
        kind: 'graphJump' as const,
        jump: createTimelineJumpState(),
      };
      const jumpHost = (context: CombatExecutionContext) => ({
        evaluate: () => this.#evaluateBranchCondition(action.condition, id, context),
        resolveRequest: () => {
          const request = this.host.requestTimelineJump;
          if (!request) throw new Error('jumpTimeline requires a timeline host');
          return () => request(action.parameters.destinationFrame);
        },
      });
      binding = {
        data,
        execute: context => {
          executeTimelineJump(data.jump, jumpHost(context));
          return true;
        },
        tick: (_delta, context) => tickTimelineJump(data.jump, jumpHost(context)),
        // 条件每次求值均即时 End，父动作结束时没有存活的条件动作。
        end() {},
        reset: context => {
          resetTimelineJump(data.jump);
          this.#resetEvaluation(action.condition, id, context);
        },
      };
    } else if (action.kind === 'forEachContextTarget') {
      if (saved && saved.kind !== 'graphTargets')
        throw new Error(`expected target loop state: ${id}`);
      const data = saved ?? { kind: 'graphTargets' as const, body: null };
      const body = (host = this.host) => {
        const child = this.#child(id, 0, action.body.$sequence, data.body ?? undefined, host);
        data.body = child.runtimeState;
        return child;
      };
      binding = {
        data,
        execute: context => {
          // 原生先复制目标列表，循环体复用同一实例和变量环境。
          const targets = this.host.targets(action.parameters).map(target => ({ ...target }));
          for (const target of targets)
            body(this.host.withTarget(target, true)).executeInstant(context);
          return true;
        },
        tick: () => {},
        end: context => {
          if (data.body) body().end(context);
        },
        reset: context => {
          if (data.body) body().reset(context);
        },
      };
    } else if (
      action.kind === 'repeatEachTick' &&
      action.parameters.nativeChanneling !== undefined
    ) {
      if (saved && saved.kind !== 'channeling') throw new Error(`expected channeling state: ${id}`);
      const data = saved ?? {
        kind: 'channeling' as const,
        channeling: createChannelingActionState(),
      };
      const state = data.channeling;
      const parameters = action.parameters.nativeChanneling;
      const body = (host = this.host) => {
        const child = this.#child(id, 0, action.body.$sequence, state.body ?? undefined, host);
        state.body = child.runtimeState;
        return child;
      };
      const tick = (delta: number, context: CombatExecutionContext) => {
        if (!this.host.frame || !this.host.selectTargets)
          throw new Error('Channeling requires a frame clock and target resolver');
        tickChanneling(
          state,
          parameters,
          this.host.frame(),
          delta,
          () => this.host.selectTargets!(parameters.target, state.inputTarget),
          target => body(this.host.withTarget(target, true)).executeInstant(context),
        );
      };
      binding = {
        data,
        execute: context => {
          endChanneling(state);
          state.inputTarget = this.host.inputTarget == null ? null : { ...this.host.inputTarget };
          state.checkFrame = -1;
          tick(0, context);
          return true;
        },
        tick,
        end: context => {
          body().end(context);
          endChanneling(state);
        },
        reset: context => body().reset(context),
      };
    } else if (action.kind === 'once' || action.kind === 'repeatEachTick') {
      if (action.kind === 'once') {
        if (saved && saved.kind !== 'graphOnce') throw new Error(`expected once state: ${id}`);
        const data = saved ?? { kind: 'graphOnce' as const, executed: false, body: null };
        const body = this.#child(id, 0, action.body.$sequence, data.body ?? undefined);
        data.body = body.runtimeState;
        binding = {
          data,
          execute: context => {
            if (!data.executed) {
              body.executeInstant(context);
              data.executed = true;
            }
            return true;
          },
          reset: context => {
            if (context.resetReason !== 'afterInstant') data.executed = false;
            body.reset(context);
          },
          tick() {},
          end: context => body.end(context),
        };
      } else {
        if (saved && saved.kind !== 'repeat') throw new Error(`expected repeat state: ${id}`);
        const data = saved ?? { kind: 'repeat' as const, repetition: createRepeatedActionState() };
        // 周期之间复用子动作实例；恢复不重放已执行的动作。
        let persistentBody: ActionGraphExecution | null = null;
        if (data.repetition.body !== null)
          persistentBody = this.#child(id, 0, action.body.$sequence, data.repetition.body);
        const run = (context: CombatExecutionContext) => {
          const existingBody = persistentBody;
          if (persistentBody === null) {
            persistentBody = this.#child(id, 0, action.body.$sequence);
            data.repetition.body = persistentBody.runtimeState;
          }
          if (action.parameters.nativeExecuteInterval !== undefined) {
            existingBody?.end(context);
            persistentBody.reset(context);
            persistentBody.tryExecute(context);
            return;
          }
          if (
            !persistentBody.executeInstant(context) &&
            action.parameters.nativeTickInterval === undefined
          )
            throw new Error(
              'repeatEachTick body returned false; repeated short-circuit is not modeled',
            );
        };
        binding = {
          data,
          execute: context => {
            executeRepeatedAction(data.repetition, action.parameters, () => run(context));
            return true;
          },
          tick: (delta, context) =>
            tickRepeatedAction(data.repetition, action.parameters, delta, () => run(context)),
          reset: context => {
            persistentBody?.reset(context);
            resetRepeatedAction(data.repetition);
          },
          end: context => persistentBody?.end(context),
        };
      }
    } else {
      if (
        saved?.kind === 'graphAura' ||
        saved?.kind === 'graphAnimation' ||
        saved?.kind === 'graphComboQte' ||
        saved?.kind === 'graphBranch' ||
        saved?.kind === 'graphMacro' ||
        saved?.kind === 'graphGuard' ||
        saved?.kind === 'graphOnce' ||
        saved?.kind === 'channeling' ||
        saved?.kind === 'graphJump' ||
        saved?.kind === 'graphTargets' ||
        saved?.kind === 'graphListener' ||
        saved?.kind === 'graphTagListener'
      )
        throw new Error(`expected operation state: ${id}`);
      // 程序节点可以共享，句柄目录中的操作身份不能跨调用位置共享；恢复复用同一身份。
      const bindingKey = JSON.stringify([this.runtimeState.callSite, this.runtimeState.invocation]);
      const identity = this.#identity(id);
      let callBindings = this.program.operationBindings.get(bindingKey);
      if (saved && !callBindings?.has(identity)) {
        throw new Error(`graph operation binding is missing during restore: ${id}`);
      }
      if (!callBindings) {
        callBindings = new Map();
        this.program.operationBindings.set(bindingKey, callBindings);
      }
      let keyed = callBindings.get(identity);
      if (!keyed) {
        keyed = {
          ...action,
          ...(action.key === undefined && action.kind === 'dealDamage'
            ? {
                // 与命中预览共享的身份规则；不能包含 invocation 等运行时计数器，
                // 否则静态预览无法归因模拟后的 DamageApplied 回执。
                key: deriveAnonymousDamageStepKey(this.runtimeState.callSite, identity),
              }
            : {}),
        };
        callBindings.set(identity, keyed);
      }
      const operation = this.host.bindOperation(keyed);
      if (saved) operation.bindExecutionData(saved);
      const data = operation.executionData;
      if (data === null) throw new Error(`graph operation does not support checkpoints: ${id}`);
      binding = {
        data,
        execute: context => operation.tryExecute(context),
        reset: context => operation.reset(context),
        tick: (delta, context) => operation.tick(delta, context),
        end: context => operation.end(context),
      };
    }
    if (this.host.trace) {
      const original = binding;
      const trace = this.host.trace;
      binding = {
        ...original,
        execute: context =>
          trace(this.program, id, this.runtimeState.invocation, 'execute', () =>
            original.execute(context),
          ),
        tick: (delta, context) =>
          trace(this.program, id, this.runtimeState.invocation, 'tick', () =>
            original.tick(delta, context),
          ),
        reset: context =>
          trace(this.program, id, this.runtimeState.invocation, 'reset', () =>
            original.reset(context),
          ),
        end: context =>
          trace(this.program, id, this.runtimeState.invocation, 'end', () => original.end(context)),
      };
    }
    if (!saved)
      this.runtimeState.nodes.set(id, {
        lifecycle: { state: 'pending', executeResult: false, executionPermitted: false },
        data: binding.data,
      });
    const slot: [GraphNodeBinding, ActionStepState] = [
      binding,
      this.runtimeState.nodes.get(id)!.lifecycle,
    ];
    this.#bindings.set(id, slot);
    return slot;
  }

  *#entries(
    create: boolean,
    stopWhenClosed: boolean,
  ): IterableIterator<[GraphNodeBinding, ActionStepState]> {
    for (let id = this.runtimeState.entry; id !== null; id = this.program.nodes.get(id)!.next) {
      if (stopWhenClosed && this.runtimeState.closed) break;
      // 恢复时已重建所有保存的绑定；热路径只查现有配对，缺失时才按需创建。
      const slot = this.#bindings.get(id) ?? (create ? this.#binding(id) : undefined);
      if (!slot) continue;
      const binding = slot[0];
      if (!binding.inlineOnly) yield slot;
      if (stopWhenClosed && this.runtimeState.closed) break;
      const body = binding.inline?.(create);
      if (body) {
        for (const slot of body.#entries(create, stopWhenClosed)) {
          if (stopWhenClosed && this.runtimeState.closed) break;
          yield slot;
        }
      }
    }
  }

  #executionContext(context: CombatExecutionContext): CombatExecutionContext {
    return context.sequence === this.host.executionPolicy
      ? context
      : { ...context, sequence: this.host.executionPolicy };
  }

  canExecute(): boolean {
    return this.host.canExecute();
  }

  executeStep(binding: GraphNodeBinding, context: CombatExecutionContext): boolean {
    return binding.execute(context);
  }

  resetStep(
    binding: GraphNodeBinding,
    context: CombatExecutionContext,
    reason?: 'normal' | 'afterInstant',
  ): void {
    binding.reset(reason === undefined ? context : { ...context, resetReason: reason });
  }

  tickStep(binding: GraphNodeBinding, deltaTime: number, context: CombatExecutionContext): void {
    binding.tick(deltaTime, context);
  }

  endStep(binding: GraphNodeBinding, context: CombatExecutionContext): void {
    binding.end(context);
  }

  tryExecute(context: CombatExecutionContext, resetAfterExecute = false): boolean {
    context = this.#executionContext(context);
    return executeActionSequence(this.#entries(true, true), context, this, resetAfterExecute);
  }

  executeInstant(context: CombatExecutionContext): boolean {
    return this.tryExecute(context, true);
  }
  execute(context: CombatExecutionContext): void {
    this.tryExecute(context);
  }
  reset(context: CombatExecutionContext): void {
    context = this.#executionContext(context);
    this.runtimeState.closed = false;
    resetActionSequence(this.#entries(true, false), context, this);
    this.runtimeState.closed = false;
  }
  tick(deltaTime: number, context: CombatExecutionContext): void {
    context = this.#executionContext(context);
    tickActionSequence(this.#entries(false, false), deltaTime, context, this);
  }
  end(context: CombatExecutionContext): void {
    context = this.#executionContext(context);
    this.runtimeState.closed = true;
    endActionSequence(this.#entries(false, false), context, this);
  }
}
