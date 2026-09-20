import type {
  ResolvedCombatOperationStep,
  ResolvedCombatStepForKind,
  ResolvedSkillBuffDefinition,
} from '../../compiler/combatProgram';
import { logicalAbilityEntityRuntimeId } from '../../game-data/logicalAbilityEntity';
import type {
  BuffApplicationSource,
  CombatCondition,
  SkillGlobalBuffDefinition,
} from '../../game-data/operatorDefinition';
import { ActionBlackboard, resolveActionValueOperand } from '../actions/actionBlackboard';
import { CombatOperationPrograms } from '../actions/combatOperationPrograms';
import { abilityEventSourceId } from '../events/combatAbilityEvent';
import {
  createSharedSpGainModifier,
  createSharedSpRecoveryModifier,
  type SharedSpGainModifierSet,
  type SharedSpRecoveryModifierSet,
} from '../resources/sharedSpGainModifiers';
import type { CombatOperationContext, CombatOperationExecutor } from '../skills/skillRuntime';
import { createGlobalBuffActionState, type GlobalBuffActionState } from '../state/actionState';
import {
  type BuffReference,
  type GlobalBuffInstanceState,
  type SharedSpGainModifier,
  type SharedSpRecoveryModifier,
} from '../state/foundationState';
import { createGlobalBuffState, type GlobalBuffState } from '../state/instanceState';
import { COMBAT_FRAME_INTERVAL } from '../time/combatClock';
import type { BuffApplicationHandle, BuffOperationTarget } from './buffOperationExecutor';
import { buffReferenceKey } from './buffReference';
import { operationProducer } from '../receipt/combatObjectIdentity';

type CreateStep = ResolvedCombatStepForKind<'createGlobalBuff'>;

interface GlobalBuffInstance {
  readonly runtimeState: GlobalBuffInstanceState;
  readonly id: string;
  readonly definition: SkillGlobalBuffDefinition;
  readonly children: BuffApplicationHandle[];
  readonly sharedSpGainModifiers: readonly SharedSpGainModifier[];
  readonly sharedSpRecoveryModifiers: readonly SharedSpRecoveryModifier[];
  remainingDuration: number | null;
  finished: boolean;
  finish(reason: 'early' | 'other'): boolean;
}

/**
 * 单场战斗唯一的 GlobalBuff 实例目录。父实例保留精确身份，子 Buff 只负责把行为
 * 投影到队员 AbilitySystem；任何一个子节点消费父层时都清理同一父实例的全部镜像。
 */
export class GlobalBuffRuntime {
  readonly runtimeState: GlobalBuffState;
  readonly #bindings = new WeakMap<GlobalBuffInstanceState, GlobalBuffInstance>();

  #requireInstance(state: GlobalBuffInstanceState): GlobalBuffInstance {
    const instance = this.#bindings.get(state);
    if (instance === undefined) throw new Error('global Buff instance binding is missing');
    return instance;
  }

  /** 当前绑定层按实例数据定位，不能退化成按同名 Buff 结束整组。 */
  finishInstance(state: GlobalBuffInstanceState, reason: 'early' | 'other'): boolean {
    return this.#requireInstance(state).finish(reason);
  }

  constructor(
    readonly resolvePartyTargets: () => readonly BuffOperationTarget[],
    readonly resolveBuffDefinition: (
      sourceOperatorId: string,
      buffId: string,
    ) => ResolvedSkillBuffDefinition | undefined,
    readonly sharedSpGainModifierSet: SharedSpGainModifierSet | null = null,
    readonly sharedSpRecoveryModifierSet: SharedSpRecoveryModifierSet | null = null,
    restoredState?: GlobalBuffState,
    readonly onCreated?: (
      state: GlobalBuffInstanceState,
      producedBy?: import('../receipt/combatReceipt').CombatObjectRef,
    ) => void,
  ) {
    this.runtimeState = restoredState ?? createGlobalBuffState();
  }

  /**
   * 在所有目标 Buff 容器恢复完成后，为父实例接回定义、子 Buff 和共享技力修正。
   * 此阶段只建立对象外壳，不重新施加子 Buff，也不重新注册修正。
   */
  bindRestoredInstances(options: {
    readonly resolveDefinition: (
      sourceId: string,
      id: string,
      sourceActionOwnerId: string | undefined,
      sourceActionId: string | undefined,
      definitionProgramId: number | null,
    ) => SkillGlobalBuffDefinition | undefined;
    readonly resolveChild: (
      reference: import('../state/foundationState').BuffReference,
    ) => BuffApplicationHandle | undefined;
  }): void {
    for (const group of this.runtimeState.groups.values()) {
      for (const state of group) {
        if (this.#bindings.has(state)) {
          throw new Error(`global Buff ${state.instanceId} is bound twice`);
        }
        const definition = options.resolveDefinition(
          state.sourceId,
          state.id,
          state.sourceActionOwnerId,
          state.sourceActionId,
          state.definitionProgramId,
        );
        if (definition === undefined) {
          throw new Error(`global Buff '${state.id}' definition is missing during restoration`);
        }
        const childBindings = new Map(
          state.children.map(reference => {
            const child = options.resolveChild(reference);
            if (child === undefined) {
              throw new Error(
                `global Buff ${state.instanceId} child '${buffReferenceKey(reference)}' is missing`,
              );
            }
            return [buffReferenceKey(reference), child] as const;
          }),
        );
        this.#bindInstance(state, definition, childBindings);
      }
    }
  }

  add(input: {
    readonly producedBy?: import('../receipt/combatReceipt').CombatObjectRef;
    readonly id: string;
    readonly definition: SkillGlobalBuffDefinition;
    readonly definitionProgramId?: number;
    readonly sourceId: string;
    /** 执行 CreateGlobalBuff 的 AbilitySystem；battle 归因本身不是动作/定义所有者。 */
    readonly sourceActionOwnerId?: string;
    readonly sourceActionId?: string;
    readonly blackboardValues: Readonly<Record<string, number>>;
  }): GlobalBuffInstance {
    const { id, definition, sourceId, sourceActionId, sourceActionOwnerId, blackboardValues } =
      input;
    if (definition.children.length === 0) {
      throw new Error(`global buff '${id}' requires at least one child Buff`);
    }
    const group = this.runtimeState.groups.get(id) ?? [];
    const active = group.filter(instance => !instance.finished);
    if (definition.stackingType === 'stack') {
      const maximum = definition.maxStackCount;
      if (maximum === undefined || !Number.isInteger(maximum) || maximum <= 0) {
        throw new Error(`global buff '${id}' stack requires a positive integer maximum`);
      }
      if (active.length >= maximum) this.#requireInstance(active[0]!).finish('other');
    } else if (definition.stackingType !== 'unlimited') {
      throw new Error(`global buff '${id}' stacking '${definition.stackingType}' is unsupported`);
    }
    const blackboard = new ActionBlackboard(definition.blackboard);
    blackboard.assign(blackboardValues);
    const duration = resolveGlobalDuration(id, definition, blackboard);
    const gainModifiers: SharedSpGainModifier[] = [];
    const recoveryModifiers: SharedSpRecoveryModifier[] = [];
    for (const modifier of definition.sharedSpModifiers ?? []) {
      const value = resolveActionValueOperand(modifier.value, blackboard);
      if (modifier.attribute === 'spRecovery') {
        if (this.sharedSpRecoveryModifierSet === null) {
          throw new Error(`global buff '${id}' requires the shared SP recovery modifier system`);
        }
        recoveryModifiers.push(createSharedSpRecoveryModifier(modifier.operation, value));
      } else {
        if (this.sharedSpGainModifierSet === null) {
          throw new Error(`global buff '${id}' requires the shared SP gain modifier system`);
        }
        gainModifiers.push(
          createSharedSpGainModifier(
            modifier.attribute,
            modifier.operation,
            value,
            modifier.applyToReturnSpGain,
          ),
        );
      }
    }
    gainModifiers.forEach(modifier => this.sharedSpGainModifierSet!.add(modifier));
    recoveryModifiers.forEach(modifier => this.sharedSpRecoveryModifierSet!.add(modifier));
    const state: GlobalBuffInstanceState = {
      id,
      instanceId: this.runtimeState.nextInstanceId++,
      definitionProgramId: input.definitionProgramId ?? null,
      sourceId,
      sourceActionOwnerId,
      sourceActionId,
      blackboard: blackboard.runtimeState,
      children: [],
      sharedSpGainModifiers: gainModifiers,
      sharedSpRecoveryModifiers: recoveryModifiers,
      remainingDuration: duration,
      finished: false,
    };
    const childBindings = new Map<string, BuffApplicationHandle>();
    const instance = this.#bindInstance(state, definition, childBindings);
    group.push(state);
    this.runtimeState.groups.set(id, group);
    this.onCreated?.(state, input.producedBy);
    try {
      for (const target of this.resolvePartyTargets()) {
        if (target.applyScoped === undefined) {
          throw new Error(`global buff child target '${target.ownerId}' is not scoped`);
        }
        for (const child of definition.children) {
          const childDefinition = this.resolveBuffDefinition(sourceId, child.buffId);
          if (childDefinition === undefined) {
            throw new Error(`global buff '${id}' child definition '${child.buffId}' is missing`);
          }
          const handle = target.applyScoped({
            producedBy: { kind: 'globalBuff', instanceId: state.instanceId },
            buffId: child.buffId,
            definition: childDefinition,
            sourceId,
            ...(sourceActionOwnerId === undefined
              ? {}
              : { definitionOwnerId: sourceActionOwnerId }),
            ...(sourceActionId === undefined ? {} : { sourceActionId }),
            blackboardValues: Object.fromEntries(
              Object.entries(child.blackboardAssignments).map(([key, value]) => [
                key,
                resolveActionValueOperand(value, blackboard),
              ]),
            ),
            finishParentGlobalBuff: reason => instance.finish(reason),
          });
          if (handle !== null) {
            childBindings.set(buffReferenceKey(handle.reference), handle);
            state.children.push(handle.reference);
          }
        }
      }
    } catch (error) {
      instance.finish('other');
      throw error;
    }
    return instance;
  }

  #bindInstance(
    state: GlobalBuffInstanceState,
    definition: SkillGlobalBuffDefinition,
    childBindings: Map<string, BuffApplicationHandle>,
  ): GlobalBuffInstance {
    if (!state.finished) {
      for (const modifier of state.sharedSpGainModifiers) {
        if (!this.sharedSpGainModifierSet?.runtimeState.modifiers.includes(modifier)) {
          throw new Error(`global Buff ${state.instanceId} shared SP gain modifier is missing`);
        }
      }
      for (const modifier of state.sharedSpRecoveryModifiers) {
        if (!this.sharedSpRecoveryModifierSet?.runtimeState.modifiers.includes(modifier)) {
          throw new Error(`global Buff ${state.instanceId} shared SP recovery modifier is missing`);
        }
      }
    }
    const gainSet = this.sharedSpGainModifierSet;
    const recoverySet = this.sharedSpRecoveryModifierSet;
    const resolveChild = (reference: import('../state/foundationState').BuffReference) => {
      const child = childBindings.get(buffReferenceKey(reference));
      if (child === undefined) throw new Error('global Buff child binding is missing');
      return child;
    };
    const instance: GlobalBuffInstance = {
      runtimeState: state,
      id: state.id,
      definition,
      get children() {
        return state.children.map(resolveChild);
      },
      sharedSpGainModifiers: state.sharedSpGainModifiers,
      sharedSpRecoveryModifiers: state.sharedSpRecoveryModifiers,
      get remainingDuration() {
        return state.remainingDuration;
      },
      set remainingDuration(value) {
        state.remainingDuration = value;
      },
      get finished() {
        return state.finished;
      },
      set finished(value) {
        state.finished = value;
      },
      finish(_reason) {
        const finished = finishGlobalBuffInstance(state, {
          removeGain: modifier => {
            gainSet?.remove(modifier);
          },
          removeRecovery: modifier => {
            recoverySet?.remove(modifier);
          },
          resolveChild,
        });
        if (finished) childBindings.clear();
        return finished;
      },
    };
    this.#bindings.set(state, instance);
    return instance;
  }

  advanceFrame(): void {
    for (const group of this.runtimeState.groups.values()) {
      for (const instance of group) {
        if (instance.finished || instance.remainingDuration === null) continue;
        instance.remainingDuration -= COMBAT_FRAME_INTERVAL;
        if (instance.remainingDuration <= 1e-8) this.#requireInstance(instance).finish('other');
      }
    }
  }

  /** 原生 FinishGlobalBuff(finishAll=true) 按稳定 ID 清理全部同名父实例。 */
  finishAllByIds(ids: readonly string[], reason: 'early' | 'other'): boolean {
    let finished = false;
    for (const id of ids) {
      for (const instance of this.runtimeState.groups.get(id) ?? []) {
        finished = this.#requireInstance(instance).finish(reason) || finished;
      }
    }
    return finished;
  }
}

function resolveGlobalDuration(
  id: string,
  definition: SkillGlobalBuffDefinition,
  blackboard: ActionBlackboard,
): number | null {
  const duration = definition.durationSeconds;
  if (duration === undefined) return null;
  const value =
    typeof duration === 'number' ? duration : blackboard.getNumber(duration.blackboardKey);
  if (value === undefined || !Number.isFinite(value) || value < 0) {
    throw new Error(`global buff '${id}' duration is missing or invalid`);
  }
  return value;
}

export interface GlobalBuffOperationDependencies {
  readonly sourceId: string;
  readonly sourceActionId?: string;
  readonly runtime: GlobalBuffRuntime;
  readonly delegate: CombatOperationExecutor;
}

export class GlobalBuffOperationExecutor implements CombatOperationExecutor {
  readonly runtimeState: ReturnType<typeof createGlobalBuffActionState>;
  readonly programs: CombatOperationPrograms;

  #slot(step: CreateStep): number {
    return this.programs.slot(step);
  }

  constructor(
    readonly dependencies: GlobalBuffOperationDependencies,
    restored?: {
      readonly state: ReturnType<typeof createGlobalBuffActionState>;
      readonly programs: CombatOperationPrograms;
    },
  ) {
    this.runtimeState = restored?.state ?? createGlobalBuffActionState();
    this.programs = restored?.programs ?? new CombatOperationPrograms();
  }

  execute(step: ResolvedCombatOperationStep, context?: CombatOperationContext): boolean {
    if (step.kind === 'finishParentGlobalBuff') {
      if (context?.finishParentGlobalBuff === undefined) {
        throw new Error('finishParentGlobalBuff requires a GlobalBuff child lifecycle context');
      }
      return context.finishParentGlobalBuff(step.parameters.reason);
    }
    if (step.kind === 'finishGlobalBuffsById') {
      return this.dependencies.runtime.finishAllByIds(
        step.parameters.globalBuffIds,
        step.parameters.reason,
      );
    }
    if (step.kind !== 'createGlobalBuff') return this.dependencies.delegate.execute(step, context);
    if (context === undefined) throw new Error('createGlobalBuff requires an action blackboard');
    const definitionProgramId = this.#slot(step);
    if (step.parameters.finishByAction && this.runtimeState.active.has(definitionProgramId)) {
      throw new Error('action-duration createGlobalBuff step is already active');
    }
    const count =
      step.parameters.count === undefined
        ? 1
        : resolveActionValueOperand(step.parameters.count, context.blackboard);
    if (!Number.isFinite(count)) throw new RangeError('createGlobalBuff count must be finite');
    const sourceId =
      step.parameters.source === 'battle'
        ? 'battle'
        : step.parameters.source === undefined
          ? this.dependencies.sourceId
          : resolveGlobalBuffSource(step.parameters.source, this.dependencies.sourceId, context);
    const created: GlobalBuffInstance[] = [];
    for (let index = 0; index < count; index += 1) {
      created.push(
        this.dependencies.runtime.add({
          producedBy: operationProducer(context, {
            ownerId: this.dependencies.sourceId,
            actionId: this.dependencies.sourceActionId,
          }),
          id: step.parameters.globalBuffId,
          definition: step.parameters.definition,
          definitionProgramId,
          sourceId,
          sourceActionOwnerId: this.dependencies.sourceId,
          sourceActionId: this.dependencies.sourceActionId,
          blackboardValues: Object.fromEntries(
            Object.entries(step.parameters.blackboardAssignments ?? {}).map(([key, value]) => [
              key,
              resolveActionValueOperand(value, context.blackboard),
            ]),
          ),
        }),
      );
    }
    if (step.parameters.finishByAction)
      this.runtimeState.active.set(
        definitionProgramId,
        created.map(instance => instance.runtimeState),
      );
    return true;
  }

  end(step: ResolvedCombatOperationStep, context?: CombatOperationContext): void {
    if (step.kind === 'createGlobalBuff' && step.parameters.finishByAction) {
      finishGlobalBuffAction(this.runtimeState, this.#slot(step), instance => {
        this.dependencies.runtime.finishInstance(instance, 'other');
      });
      return;
    }
    this.dependencies.delegate.end?.(step, context);
  }

  evaluate(condition: CombatCondition, context?: CombatOperationContext): boolean {
    return this.dependencies.delegate.evaluate(condition, context);
  }
}

/** 注销技力修正后固定子引用并依次结束。 */
export function finishGlobalBuffInstance(
  state: GlobalBuffInstanceState,
  host: {
    removeGain(modifier: SharedSpGainModifier): void;
    removeRecovery(modifier: SharedSpRecoveryModifier): void;
    resolveChild(reference: BuffReference): { finish(reason: 'other', source: null): boolean };
  },
): boolean {
  if (state.finished) return false;
  state.finished = true;
  for (const modifier of state.sharedSpGainModifiers) host.removeGain(modifier);
  for (const modifier of state.sharedSpRecoveryModifiers) host.removeRecovery(modifier);
  const children = state.children.map(reference => host.resolveChild(reference));
  for (const child of children) child.finish('other', null);
  state.children.length = 0;
  return true;
}

/** 所有子实例结束成功后才移除记录；抛错时保留关系。 */
function finishGlobalBuffAction(
  state: GlobalBuffActionState,
  slot: number,
  finish: (instance: GlobalBuffInstanceState) => void,
): void {
  for (const instance of state.active.get(slot) ?? []) finish(instance);
  state.active.delete(slot);
}

function resolveGlobalBuffSource(
  source: BuffApplicationSource,
  operatorId: string,
  context?: CombatOperationContext,
): string {
  if (source === 'caster') return operatorId;
  if (source === 'enemy') return 'enemy';
  if (source === 'buffOwner') {
    if (context?.buffOwnerId === undefined)
      throw new Error('buffOwner GlobalBuff source requires a Buff lifecycle context');
    return context.buffOwnerId;
  }
  if (source === 'buffSource') {
    if (context?.buffSourceId === undefined)
      throw new Error('buffSource GlobalBuff source requires a Buff lifecycle context');
    return context.buffSourceId;
  }
  if (source === 'eventSource') {
    if (context?.event === undefined)
      throw new Error('eventSource GlobalBuff source requires an event context');
    if ('payload' in context.event) return abilityEventSourceId(context.event);
    if ('sourceId' in context.event && typeof context.event.sourceId === 'string') {
      return context.event.sourceId;
    }
    if ('sourceOperatorId' in context.event && typeof context.event.sourceOperatorId === 'string') {
      return context.event.sourceOperatorId;
    }
    throw new Error('active event does not expose a GlobalBuff source identity');
  }
  if (source === 'currentAbilityEntity') {
    const target = context?.currentTarget;
    if (target?.kind !== 'abilityEntity') {
      throw new Error('currentAbilityEntity GlobalBuff source requires an active entity target');
    }
    return logicalAbilityEntityRuntimeId(target.instanceId);
  }
  throw new Error(`unsupported GlobalBuff source '${source}'`);
}
