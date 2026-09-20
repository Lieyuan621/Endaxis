import type { CombatCondition } from '../../game-data/operatorDefinition';
import type { CombatOperationContext } from '../skills/skillRuntime';
import { healAbilityEvent } from '../events/combatAbilityEvent';
/**
 * 执行定时标记的创建、条件查询与动作结束清理。
 * 目标到实体容器的映射由装配层提供；动态时长只读取当前技能实例黑板。
 */
import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import type { CombatTarget, TimedMarkerTarget } from '../../game-data/operatorDefinition';
import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import type { GlobalCooldownTarget } from '../../game-data/operatorDefinition';
import type { GlobalCooldowns } from '../skills/globalCooldowns';
import { resolveActionValueOperand } from '../actions/actionBlackboard';
import type { CombatOperationExecutor } from '../skills/skillRuntime';
import type { TimedMarkerClock, TimedMarkerContainer } from './timedMarkers';
import { CombatOperationPrograms } from '../actions/combatOperationPrograms';
import type { TimedMarkerActionState } from '../state/actionState';

type RuntimeOperation = ResolvedCombatOperationStep;

export interface TimedMarkerOperationDependencies {
  readonly resolveTarget: (target: CombatTarget) => TimedMarkerContainer;
  readonly resolveEventTarget?: (targetId: string) => TimedMarkerContainer;
  readonly resolveAbilityEntityTarget?: (target: RuntimeTargetRef) => TimedMarkerContainer;
  readonly globalClock?: TimedMarkerClock;
  readonly globalScaledClock?: TimedMarkerClock;
  readonly globalCooldowns?: GlobalCooldowns;
  readonly resolveCooldownCharacter?: (
    target: GlobalCooldownTarget,
    context: CombatOperationContext | undefined,
  ) => string;
  readonly delegate: CombatOperationExecutor;
}

export class TimedMarkerOperationExecutor implements CombatOperationExecutor {
  readonly runtimeState: TimedMarkerActionState;
  readonly programs: CombatOperationPrograms;
  /** 新建标记的当前分支对象缓存；恢复项必须通过 ownerId 从装配根解析。 */
  readonly #ownerBindings = new Map<string, TimedMarkerContainer>();

  constructor(
    readonly dependencies: TimedMarkerOperationDependencies,
    restored?: {
      readonly state: TimedMarkerActionState;
      readonly programs: CombatOperationPrograms;
    },
  ) {
    this.runtimeState = restored?.state ?? { markers: new Map() };
    this.programs = restored?.programs ?? new CombatOperationPrograms();
  }

  execute(step: RuntimeOperation, context?: CombatOperationContext): boolean {
    if (step.kind === 'setGlobalCooldown') {
      if (context === undefined)
        throw new Error('setGlobalCooldown requires a combat operation context');
      const { cooldowns, characterId } = this.#resolveCooldown(step.parameters.target, context);
      cooldowns.set(
        characterId,
        step.parameters.markerId,
        resolveActionValueOperand(step.parameters.durationSeconds, context.blackboard),
      );
      return true;
    }
    if (step.kind !== 'createTimedMarker' && step.kind !== 'createAbilityEntityTimedMarker') {
      return context === undefined
        ? this.dependencies.delegate.execute(step)
        : this.dependencies.delegate.execute(step, context);
    }
    if (context === undefined) {
      throw new Error('createTimedMarker requires a combat operation context');
    }
    const duration = resolveActionValueOperand(step.parameters.durationSeconds, context.blackboard);
    const target =
      step.kind === 'createTimedMarker'
        ? this.#resolveTarget(step.parameters.target, context)
        : this.#resolveCurrentAbilityEntity(context.currentTarget);
    const markerClock =
      step.kind === 'createAbilityEntityTimedMarker' && step.parameters.timeDomain === 'global'
        ? this.#requireGlobalClock()
        : step.kind === 'createTimedMarker' && step.parameters.timeDomain === 'globalScaled'
          ? this.#requireGlobalScaledClock()
          : undefined;
    const markerClockDomain =
      step.kind === 'createAbilityEntityTimedMarker' && step.parameters.timeDomain === 'global'
        ? 'global'
        : step.kind === 'createTimedMarker' && step.parameters.timeDomain === 'globalScaled'
          ? 'globalScaled'
          : 'default';
    const handle = target.add(
      resolveMarkerId(step.parameters.markerId, context),
      duration,
      markerClock,
      markerClockDomain,
    );
    if (step.parameters.autoFinishByAction) {
      const slot = this.programs.slot(step);
      this.runtimeState.markers.set(slot, [
        ...(this.runtimeState.markers.get(slot) ?? []),
        { ownerId: target.ownerId, sourceTargetId: handle.sourceTargetId },
      ]);
      this.#ownerBindings.set(handle.sourceTargetId, target);
    }
    return true;
  }

  end(step: RuntimeOperation, context?: CombatOperationContext): void {
    if (step.kind === 'setGlobalCooldown') return;
    if (step.kind === 'createTimedMarker' || step.kind === 'createAbilityEntityTimedMarker') {
      const slot = this.programs.slot(step);
      for (const marker of this.runtimeState.markers.get(slot) ?? []) {
        (
          this.#ownerBindings.get(marker.sourceTargetId) ?? this.#resolveOwner(marker.ownerId)
        ).remove(marker.sourceTargetId);
        this.#ownerBindings.delete(marker.sourceTargetId);
      }
      this.runtimeState.markers.delete(slot);
      return;
    }
    this.dependencies.delegate.end?.(step, context);
  }

  evaluate(condition: CombatCondition, context?: CombatOperationContext): boolean {
    if (condition.kind === 'globalCooldownPresent') {
      const { cooldowns, characterId } = this.#resolveCooldown(condition.target, context);
      return cooldowns.has(characterId, condition.markerId);
    }
    if (condition.kind === 'timedMarkerPresent') {
      return this.#resolveTarget(condition.target, context).has(
        resolveMarkerId(condition.markerId, context),
      );
    }
    if (condition.kind === 'abilityEntityTimedMarkerPresent') {
      if (context === undefined) {
        throw new Error('abilityEntityTimedMarkerPresent requires a combat operation context');
      }
      if (condition.contextKey !== undefined) {
        if (context.targetContext === undefined) {
          throw new Error('context ability entity timed marker requires a target context');
        }
        return context.targetContext
          .get(condition.contextKey)
          .some(target =>
            this.#resolveCurrentAbilityEntity(target).has(
              resolveMarkerId(condition.markerId, context),
            ),
          );
      }
      return this.#resolveCurrentAbilityEntity(context.currentTarget).has(
        resolveMarkerId(condition.markerId, context),
      );
    }
    return context === undefined
      ? this.dependencies.delegate.evaluate(condition)
      : this.dependencies.delegate.evaluate(condition, context);
  }

  #resolveCooldown(target: GlobalCooldownTarget, context: CombatOperationContext | undefined) {
    const cooldowns = this.dependencies.globalCooldowns;
    const resolve = this.dependencies.resolveCooldownCharacter;
    if (cooldowns === undefined || resolve === undefined)
      throw new Error('global cooldown runtime is not configured');
    return { cooldowns, characterId: resolve(target, context) };
  }

  #resolveCurrentAbilityEntity(target: RuntimeTargetRef | undefined): TimedMarkerContainer {
    if (target?.kind !== 'abilityEntity') {
      throw new Error('ability entity timed marker requires a current AbilityEntity target');
    }
    const resolve = this.dependencies.resolveAbilityEntityTarget;
    if (resolve === undefined) {
      throw new Error('ability entity timed marker runtime is not configured');
    }
    return resolve(target);
  }

  #resolveOwner(ownerId: string): TimedMarkerContainer {
    const resolve = this.dependencies.resolveEventTarget;
    if (resolve === undefined) {
      throw new Error(`timed marker owner '${ownerId}' requires an entity resolver`);
    }
    return resolve(ownerId);
  }

  #resolveTarget(
    target: TimedMarkerTarget,
    context: CombatOperationContext | undefined,
  ): TimedMarkerContainer {
    if (target === 'buffOwner' || target === 'buffSource') {
      const id = target === 'buffOwner' ? context?.buffOwnerId : context?.buffSourceId;
      if (id === undefined || this.dependencies.resolveEventTarget === undefined) {
        throw new Error(`${target} timed marker requires a Buff identity and entity resolver`);
      }
      return this.dependencies.resolveEventTarget(id);
    }
    if (target !== 'eventTarget') return this.dependencies.resolveTarget(target);
    if (context === undefined) {
      throw new Error('eventTarget timed marker requires a combat operation context');
    }
    const event = context.event;
    const targetId = event === undefined ? undefined : healAbilityEvent(event)?.payload.targetId;
    if (targetId === undefined) {
      throw new Error('eventTarget timed marker requires a healing event target');
    }
    const resolve = this.dependencies.resolveEventTarget;
    if (resolve === undefined) {
      throw new Error('eventTarget timed marker runtime is not configured');
    }
    return resolve(targetId);
  }

  #requireGlobalClock(): TimedMarkerClock {
    if (this.dependencies.globalClock === undefined) {
      throw new Error('global-clock ability entity timed marker runtime is not configured');
    }
    return this.dependencies.globalClock;
  }

  #requireGlobalScaledClock(): TimedMarkerClock {
    if (this.dependencies.globalScaledClock === undefined) {
      throw new Error('global-scaled timed marker clock is not configured');
    }
    return this.dependencies.globalScaledClock;
  }
}

function resolveMarkerId(
  operand: string | { readonly blackboardKey: string },
  context: CombatOperationContext | undefined,
): string {
  if (typeof operand === 'string') return operand;
  const value = context?.blackboard.getString(operand.blackboardKey);
  if (value === undefined || value.length === 0) {
    throw new Error(`marker id blackboard '${operand.blackboardKey}' is missing`);
  }
  return value;
}
