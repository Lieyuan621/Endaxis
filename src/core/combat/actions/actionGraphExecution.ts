/** 图程序保持共享；控制节点的子调用仅在执行、重置或恢复时绑定。 */
import type { CompiledActionGraph } from '../../compiler/compileActionGraph';
import { deriveAnonymousDamageStepKey } from '../timeline/deriveHitId';

export type CombatActionExecution = ActionGraphExecution;
import type { CompiledGraphOperation } from '../../compiler/compileActionGraph';
import type { ResolvedCombatStepForKind } from '../../compiler/combatProgram';
import type { ActionBlackboardState } from '../state/foundationState';
import type { RuntimeTargetRef, RuntimeTargetGroup } from '../../game-data/logicalAbilityEntity';
import type {
  ActionGraphReference,
  ActionGraphStepForKind,
} from '../../../../packages/game-data-contract/src/actionGraph';
import type { CombatEventListenerState } from '../state/actionState';
import type { EventResponseExecution } from './combatActionEventListener';
import type { CombatCondition, ActionValueOperand } from '../../game-data/operatorDefinition';
import {
  type ActionGraphExecutionState,
  type ActionGraphNodeData,
  type GraphLeafStepData,
  type ActionStepState,
  COMBAT_STEP_STATE,
  createBranchActionState,
  createRepeatedActionState,
  createTargetLoopState,
} from '../state/actionState';
import {
  executeActionSequence,
  resetActionSequence,
  tickActionSequence,
  endActionSequence,
  type ActionSequenceExecutionHost,
} from './actionSequenceExecution';
import {
  executeConditionalAction,
  executeSwitchAction,
  tickBranchAction,
  endBranchAction,
  resetConditionalAction,
  resetSwitchAction,
  type BranchActionHost,
} from './branchActionExecution';
import { CombatStep, type CombatExecutionContext } from './combatStep';
import {
  executeCountedAction,
  executeTargetLoop,
  tickTargetLoop,
  endTargetLoop,
  resetTargetLoop,
  type TargetLoopHost,
} from './sequenceControl';
import {
  executeRepeatedAction,
  tickRepeatedAction,
  resetRepeatedAction,
} from './repeatedActionExecution';

export interface ActionGraphExecutionHost {
  listener(
    responses: ActionGraphStepForKind<'listenForCombatEvents'>['parameters']['responses'],
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
  withTarget(target: RuntimeTargetRef): ActionGraphExecutionHost;
  bindOperation(
    action: CompiledGraphOperation,
  ): CombatStep & { readonly executionData: GraphLeafStepData };
  canExecute(): boolean;
  evaluate(condition: CombatCondition): boolean;
  value(operand: ActionValueOperand): number;
  once(key: string, execute: () => void): boolean;
  scope(
    parameters: ResolvedCombatStepForKind<'withActionBlackboardScope'>['parameters'],
    saved?: ActionBlackboardState,
  ): {
    readonly host: ActionGraphExecutionHost;
    readonly blackboard: ActionBlackboardState;
  };
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
interface GraphSlot {
  readonly owner: ActionGraphExecution;
  readonly id: string;
}

/**
 * 宏调用包装宿主：把宏体内的 parameter 操作数代入为调用点实参。
 * 代入的是操作数本身，常量、黑板引用仍由执行器在消费点解析，不做调用时快照；
 * 同一输入对象经 WeakMap 记忆化，保证同一输入返回同一输出对象。
 */
function wrapMacroHost(
  host: ActionGraphExecutionHost,
  args: Readonly<Record<string, ActionValueOperand>>,
): ActionGraphExecutionHost {
  const memo = new WeakMap<object, unknown>();
  const substitute = <T>(value: T): T => {
    if (!value || typeof value !== 'object') return value;
    if (Array.isArray(value)) {
      const cached = memo.get(value);
      if (cached !== undefined) return cached as T;
      const copy: unknown[] = value.map(item => substitute(item));
      memo.set(value, copy);
      return copy as T;
    }
    const record = value as Record<string, unknown>;
    if (record.kind === 'parameter') {
      const name = record.parameter;
      if (typeof name !== 'string' || !Object.hasOwn(args, name))
        throw new Error(`macro parameter '${String(name)}' has no argument at this call site`);
      return args[name] as T;
    }
    const cached = memo.get(value);
    if (cached !== undefined) return cached as T;
    const copy = Object.fromEntries(
      Object.entries(record).map(([key, item]) => [key, substitute(item)]),
    );
    memo.set(value, copy);
    return copy as T;
  };
  return {
    listener: (responses, state, create) =>
      host.listener(substitute(responses), state, (reference, index, inner, saved) =>
        create(reference, index, wrapMacroHost(inner, args), saved),
      ),
    targets: parameters => host.targets(substitute(parameters)),
    withTarget: target => wrapMacroHost(host.withTarget(target), args),
    bindOperation: action => host.bindOperation(substitute(action)),
    canExecute: () => host.canExecute(),
    evaluate: condition => host.evaluate(substitute(condition)),
    value: operand => host.value(substitute(operand)),
    once: (key, execute) => host.once(key, execute),
    scope: (parameters, saved) => {
      const scoped = host.scope(substitute(parameters), saved);
      return { blackboard: scoped.blackboard, host: wrapMacroHost(scoped.host, args) };
    },
  };
}

export class ActionGraphExecution extends CombatStep {
  readonly runtimeState: ActionGraphExecutionState;
  readonly #bindings = new Map<string, GraphNodeBinding>();

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

  #binding(id: string): GraphNodeBinding {
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
        execute: () => this.host.evaluate(action.parameters.condition),
        reset() {},
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
    } else if (action.kind === 'conditional' || action.kind === 'switch') {
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
      const branchHost = (context: CombatExecutionContext): BranchActionHost => ({
        execute: index => branch(index).tryExecute(context),
        tick: (index, delta) => branch(index).tick(delta, context),
        end: index => branch(index).end(context),
        reset: index => branch(index).reset(context),
      });
      binding = {
        data,
        execute: context =>
          action.kind === 'switch'
            ? executeSwitchAction(data.selection, entries.length, action.parameters.alwaysNext, {
                ...branchHost(context),
                choice: () => this.host.value(action.parameters.choice),
                value: index => this.host.value(action.options[index]!.value),
              })
            : executeConditionalAction(
                data.selection,
                action.whenFalse !== undefined,
                action.parameters.alwaysNext === true,
                {
                  ...branchHost(context),
                  evaluate: () => this.host.evaluate(action.parameters.condition),
                },
              ),
        reset: context =>
          action.kind === 'switch'
            ? resetSwitchAction(entries.length, branchHost(context))
            : resetConditionalAction(
                data.selection,
                action.whenFalse !== undefined,
                branchHost(context),
              ),
        tick: (delta, context) => tickBranchAction(data.selection, delta, branchHost(context)),
        end: context => endBranchAction(data.selection, branchHost(context)),
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
    } else if (action.kind === 'forEachContextTarget') {
      if (saved && saved.kind !== 'graphTargets')
        throw new Error(`expected target loop state: ${id}`);
      const data = saved ?? {
        kind: 'graphTargets' as const,
        loop: createTargetLoopState<ActionGraphExecutionState>(),
      };
      const children = new Map<number, ActionGraphExecution>();
      for (const [instance, body] of data.loop.bodies) {
        children.set(
          instance,
          this.#child(
            id,
            0,
            action.body.$sequence,
            body.sequence,
            this.host.withTarget(body.target),
            instance,
          ),
        );
      }
      const child = (instance: number) => {
        const body = children.get(instance);
        if (!body) throw new Error(`target loop body ${instance} is missing`);
        return body;
      };
      for (const instance of data.loop.activeBodies) child(instance);
      const loopHost = (context: CombatExecutionContext): TargetLoopHost => ({
        start: target => {
          const instance = data.loop.nextBodyId++;
          const body = this.#child(
            id,
            0,
            action.body.$sequence,
            undefined,
            this.host.withTarget(target),
            instance,
          );
          body.reset(context);
          body.tryExecute(context);
          children.set(instance, body);
          data.loop.bodies.set(instance, { target: { ...target }, sequence: body.runtimeState });
          return instance;
        },
        tick: (instance, delta) => child(instance).tick(delta, context),
        end: instance => child(instance).end(context),
      });
      binding = {
        data,
        execute: context => {
          executeTargetLoop(data.loop, this.host.targets(action.parameters), loopHost(context));
          return true;
        },
        tick: (delta, context) => tickTargetLoop(data.loop, delta, loopHost(context)),
        end: context => {
          endTargetLoop(data.loop, loopHost(context));
          children.clear();
        },
        reset: () => {
          resetTargetLoop(data.loop);
          children.clear();
        },
      };
    } else if (action.kind === 'withActionBlackboardScope') {
      if (saved && saved.kind !== 'graphScope') throw new Error(`expected scope state: ${id}`);
      const data = saved ?? { kind: 'graphScope' as const, body: null };
      const parameters = {
        ...action.parameters,
        scopeKey:
          action.parameters.scopeKey ??
          JSON.stringify([this.runtimeState.callSite, this.#identity(id)]),
      };
      let body: ActionGraphExecution | undefined;
      if (data.body) {
        const scope = this.host.scope(parameters, data.body.blackboard);
        body = this.#child(id, 0, action.body.$sequence, data.body.execution, scope.host);
      }
      const getBody = () => {
        if (!body) {
          const scope = this.host.scope(parameters);
          body = this.#child(id, 0, action.body.$sequence, undefined, scope.host);
          data.body = { blackboard: scope.blackboard, execution: body.runtimeState };
          body.reset({});
        }
        return body;
      };
      binding = {
        data,
        execute: context => {
          if (parameters.lifetime === 'execution') {
            body = undefined;
            data.body = null;
          }
          const result = getBody().tryExecute(context);
          return parameters.alwaysNext === true || result;
        },
        tick: (delta, context) => getBody().tick(delta, context),
        end: context => body?.end(context),
        reset: context => {
          body?.reset(context);
          body = undefined;
          data.body = null;
        },
      };
    } else if (
      action.kind === 'once' ||
      action.kind === 'repeatEachTick' ||
      action.kind === 'repeatByActionValue'
    ) {
      const instant = (context: CombatExecutionContext) => {
        const body = this.#child(id, 0, action.body.$sequence);
        body.reset(context);
        const result = body.tryExecute(context);
        body.end(context);
        body.reset(context);
        return result;
      };
      if (action.kind === 'repeatByActionValue') {
        if (saved && saved.kind !== 'stateless')
          throw new Error(`expected counted repeat state: ${id}`);
        binding = {
          data: saved ?? { kind: 'stateless' },
          execute: context =>
            executeCountedAction(this.host.value(action.parameters.count), () => {
              instant(context);
            }),
          reset() {},
          tick() {},
          end() {},
        };
      } else if (action.kind === 'once') {
        if (saved && saved.kind !== 'stateless') throw new Error(`expected once state: ${id}`);
        binding = {
          data: saved ?? { kind: 'stateless' },
          execute: context =>
            this.host.once(
              action.parameters.scopeKey ??
                JSON.stringify([this.runtimeState.callSite, this.#identity(id)]),
              () => {
                instant(context);
              },
            ),
          reset() {},
          tick() {},
          end() {},
        };
      } else {
        if (saved && saved.kind !== 'repeat') throw new Error(`expected repeat state: ${id}`);
        const data = saved ?? { kind: 'repeat' as const, repetition: createRepeatedActionState() };
        // ExecuteInterval 保留子动作到下一周期；恢复只重建执行器，不重放开始动作。
        let persistentBody: ActionGraphExecution | null = null;
        if (data.repetition.body !== null)
          persistentBody = this.#child(id, 0, action.body.$sequence, data.repetition.body);
        const run = (context: CombatExecutionContext) => {
          if (action.parameters.nativeExecuteInterval !== undefined) {
            if (persistentBody === null) {
              persistentBody = this.#child(id, 0, action.body.$sequence);
              data.repetition.body = persistentBody.runtimeState;
            } else {
              persistentBody.end(context);
            }
            persistentBody.reset(context);
            persistentBody.tryExecute(context);
            return;
          }
          if (
            !instant(context) &&
            action.parameters.nativeTickInterval === undefined &&
            action.parameters.nativeChanneling === undefined
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
        saved?.kind === 'graphBranch' ||
        saved?.kind === 'graphMacro' ||
        saved?.kind === 'graphGuard' ||
        saved?.kind === 'graphTargets' ||
        saved?.kind === 'graphListener' ||
        saved?.kind === 'graphScope'
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
          ...(action.key === undefined &&
          (action.kind === 'dealDamage' || action.kind === 'dealFixedDamage')
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
    if (!saved)
      this.runtimeState.nodes.set(id, {
        lifecycle: { state: 'pending', executeResult: false, executionPermitted: false },
        data: binding.data,
      });
    this.#bindings.set(id, binding);
    return binding;
  }

  *#entries(
    create: boolean,
    stopWhenClosed: boolean,
  ): IterableIterator<[GraphSlot, ActionStepState]> {
    for (let id = this.runtimeState.entry; id !== null; id = this.program.nodes.get(id)!.next) {
      if (stopWhenClosed && this.runtimeState.closed) break;
      if (!create && !this.runtimeState.nodes.has(id)) continue;
      const binding = this.#binding(id);
      if (!binding.inlineOnly)
        yield [{ owner: this, id }, this.runtimeState.nodes.get(id)!.lifecycle];
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

  #executionHost(context: CombatExecutionContext): ActionSequenceExecutionHost<GraphSlot> {
    return {
      canExecute: () => this.host.canExecute(),
      execute: slot => slot.owner.#binding(slot.id).execute(context),
      reset: slot => slot.owner.#binding(slot.id).reset(context),
      tick: (slot, dt) => slot.owner.#binding(slot.id).tick(dt, context),
      end: slot => slot.owner.#binding(slot.id).end(context),
    };
  }

  tryExecute(context: CombatExecutionContext): boolean {
    return executeActionSequence(
      { entries: { entries: () => this.#entries(true, true) } },
      context,
      this.#executionHost(context),
    );
  }

  executeInstant(context: CombatExecutionContext): boolean {
    const result = this.tryExecute(context);
    this.end(context);
    this.reset(context);
    return result;
  }
  execute(context: CombatExecutionContext): void {
    this.tryExecute(context);
  }
  reset(context: CombatExecutionContext): void {
    this.runtimeState.closed = false;
    resetActionSequence(
      { entries: { entries: () => this.#entries(true, false) } },
      this.#executionHost(context),
    );
    this.runtimeState.closed = false;
  }
  tick(deltaTime: number, context: CombatExecutionContext): void {
    tickActionSequence(
      { entries: { entries: () => this.#entries(false, false) } },
      deltaTime,
      this.#executionHost(context),
    );
  }
  end(context: CombatExecutionContext): void {
    this.runtimeState.closed = true;
    endActionSequence(
      { entries: { entries: () => this.#entries(false, false) } },
      this.#executionHost(context),
    );
  }
}
