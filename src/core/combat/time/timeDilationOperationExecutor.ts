import type { CombatCondition } from '../../game-data/operatorDefinition';
/**
 * 执行技能步骤中的普通时间膨胀动作，并按动作生命周期清理实例。
 * 曲线存储方式不决定作用范围；目标解析由整场战斗的装配根提供。
 */
import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import type {
  AbilityEntityTargetQuery,
  TimeDilationEntityTarget,
  TimeDilationIgnoreTarget,
} from '../../game-data/operatorDefinition';
import { resolveActionValueOperand } from '../actions/actionBlackboard';
import type { CombatOperationContext, CombatOperationExecutor } from '../skills/skillRuntime';
import { resolveTimeScaleCurve } from './timeScaleCurve';
import type { TimeDilationRuntime } from './timeDilationRuntime';
import { createTimeDilationActionState, type TimeDilationActionState } from '../state/actionState';
import { CombatOperationPrograms } from '../actions/combatOperationPrograms';
import { operationProducer } from '../receipt/combatObjectIdentity';

type RuntimeOperation = ResolvedCombatOperationStep;

export interface TimeDilationOperationDependencies {
  readonly runtime: TimeDilationRuntime;
  readonly resolveTargetIds: (target: TimeDilationIgnoreTarget) => readonly string[];
  readonly resolveAbilityEntityTargetIds?: (query: AbilityEntityTargetQuery) => readonly string[];
  readonly resolveContextAbilityEntityId?: (instanceId: number) => string | null;
  readonly sourceId: string;
  readonly sourceActionId: string;
  readonly delegate: CombatOperationExecutor;
}

export class TimeDilationOperationExecutor implements CombatOperationExecutor {
  readonly runtimeState: ReturnType<typeof createTimeDilationActionState>;
  readonly programs: CombatOperationPrograms;

  constructor(
    readonly dependencies: TimeDilationOperationDependencies,
    restored?: {
      readonly state: ReturnType<typeof createTimeDilationActionState>;
      readonly programs: CombatOperationPrograms;
    },
  ) {
    this.runtimeState = restored?.state ?? createTimeDilationActionState();
    this.programs = restored?.programs ?? new CombatOperationPrograms();
  }

  /** 过渡期的程序节点绑定；动作关系本身存入可复制状态。 */
  #slot(step: RuntimeOperation): number {
    return this.programs.slot(step);
  }

  execute(step: RuntimeOperation, context?: CombatOperationContext): boolean {
    if (
      step.kind !== 'startTimeDilation' &&
      step.kind !== 'startUltimateTimeDilation' &&
      step.kind !== 'setIgnoreGlobalTimeScale'
    ) {
      return context === undefined
        ? this.dependencies.delegate.execute(step)
        : this.dependencies.delegate.execute(step, context);
    }
    if (context === undefined) throw new Error(`${step.kind} requires an operation context`);
    if (step.kind === 'setIgnoreGlobalTimeScale') {
      const entityIds = this.#resolveAbilityEntityTargetIds(
        step.parameters.abilityEntityTargets,
        context,
      );
      for (const entityId of entityIds) {
        this.dependencies.runtime.setIgnoreGlobalTimeScale(entityId, step.parameters.ignore);
      }
      if (step.parameters.revertOnEnd)
        this.runtimeState.ignoredEntityIds.set(this.#slot(step), entityIds);
      return true;
    }
    const source = {
      sourceId: this.dependencies.sourceId,
      sourceActionId: this.dependencies.sourceActionId,
      producedBy: operationProducer(context),
      ...(context.skillCastInfo?.originCastId === undefined
        ? {}
        : { sourceCastId: context.skillCastInfo.originCastId }),
    };
    if (step.kind === 'startUltimateTimeDilation') {
      const id = this.dependencies.runtime.startUltimate(
        step.parameters.priority,
        resolveActionValueOperand(step.parameters.targetScale, context.blackboard),
        [
          ...this.dependencies.resolveTargetIds('caster'),
          ...step.parameters.ignoredTargets.flatMap(this.dependencies.resolveTargetIds),
          ...this.#resolveAbilityEntityTargetIds(
            step.parameters.ignoredAbilityEntityTargets ?? [],
            context,
            true,
          ),
        ],
        source,
      );
      this.runtimeState.instanceIds.set(this.#slot(step), [id]);
      return true;
    }
    const parameters = step.parameters;
    const durationSeconds = resolveActionValueOperand(
      parameters.durationSeconds,
      context.blackboard,
    );
    const curve = resolveTimeScaleCurve(parameters.curve, this.dependencies.runtime);
    const ids =
      parameters.scope === 'global'
        ? [
            this.dependencies.runtime.startGlobal({
              durationSeconds,
              slot: parameters.slot,
              priority: parameters.priority,
              curve,
              ignoredOperatorIds: parameters.ignoredTargets
                .flatMap(this.dependencies.resolveTargetIds)
                .concat(
                  this.#resolveAbilityEntityTargetIds(
                    parameters.ignoredAbilityEntityTargets ?? [],
                    context,
                    true,
                  ),
                ),
              source,
              ...(parameters.influenceSkillCooldownSeconds === undefined
                ? {}
                : {
                    influenceSkillCooldownSeconds: resolveActionValueOperand(
                      parameters.influenceSkillCooldownSeconds,
                      context.blackboard,
                    ),
                  }),
            }),
          ]
        : [
            ...parameters.targets.map(target =>
              resolveSingleTargetId(this.dependencies, target, context),
            ),
            ...this.#resolveAbilityEntityTargetIds(parameters.abilityEntityTargets ?? [], context),
          ].map(entityId =>
            this.dependencies.runtime.startEntity({
              entityId,
              durationSeconds,
              slot: parameters.slot,
              priority: parameters.priority,
              curve,
              source,
              ...(parameters.ignoreSlotCheck === undefined
                ? {}
                : { ignoreSlotCheck: parameters.ignoreSlotCheck }),
            }),
          );
    if (parameters.finishByAction) {
      const slot = this.#slot(step);
      this.runtimeState.instanceIds.set(slot, [
        ...(this.runtimeState.instanceIds.get(slot) ?? []),
        ...ids,
      ]);
    }
    return true;
  }

  #resolveAbilityEntityTargetIds(
    queries: readonly AbilityEntityTargetQuery[],
    context: CombatOperationContext,
    allowMissingContext = false,
  ): readonly string[] {
    if (queries.length === 0) return [];
    const result: string[] = [];
    for (const query of queries) {
      if (query.kind === 'current') {
        if (context.currentTarget?.kind !== 'abilityEntity') {
          throw new Error('current ability-entity query requires an AbilityEntity target');
        }
        const resolve = this.dependencies.resolveContextAbilityEntityId;
        if (resolve === undefined) {
          throw new Error('current ability-entity target requires a stable entity resolver');
        }
        const entityId = resolve(context.currentTarget.instanceId);
        if (entityId !== null) result.push(entityId);
        continue;
      }
      if (query.kind === 'context') {
        if (context.targetContext === undefined) {
          throw new Error('ability-entity Context query requires a combat target context');
        }
        const targets = allowMissingContext
          ? (context.targetContext.getOptional(query.contextKey) ?? [])
          : context.targetContext.get(query.contextKey);
        for (const target of targets) {
          if (target.kind !== 'abilityEntity') {
            throw new Error(
              `time-dilation Context '${query.contextKey}' contains a non-AbilityEntity target`,
            );
          }
          const resolve = this.dependencies.resolveContextAbilityEntityId;
          if (resolve === undefined) {
            throw new Error('ability-entity Context targets require a stable entity resolver');
          }
          const entityId = resolve(target.instanceId);
          if (entityId !== null) result.push(entityId);
        }
        continue;
      }
      const resolve = this.dependencies.resolveAbilityEntityTargetIds;
      if (resolve === undefined) {
        throw new Error('ability-entity time-dilation targets require a logical entity resolver');
      }
      result.push(...resolve(query));
    }
    return result;
  }

  end(step: RuntimeOperation, context?: CombatOperationContext): void {
    if (step.kind === 'setIgnoreGlobalTimeScale') {
      revertTimeDilationIgnoreAction(
        this.runtimeState,
        this.#slot(step),
        step.parameters.ignore,
        (entityId, ignore) => this.dependencies.runtime.setIgnoreGlobalTimeScale(entityId, ignore),
      );
      return;
    }
    if (step.kind === 'startTimeDilation' || step.kind === 'startUltimateTimeDilation') {
      finishTimeDilationAction(this.runtimeState, this.#slot(step), id =>
        this.dependencies.runtime.stop(id),
      );
      return;
    }
    this.dependencies.delegate.end?.(step, context);
  }

  evaluate(condition: CombatCondition, context?: CombatOperationContext): boolean {
    return context === undefined
      ? this.dependencies.delegate.evaluate(condition)
      : this.dependencies.delegate.evaluate(condition, context);
  }
}

function resolveSingleTargetId(
  dependencies: TimeDilationOperationDependencies,
  target: TimeDilationEntityTarget,
  context: CombatOperationContext,
): string {
  if (target === 'buffOwner') {
    if (context.buffOwnerId === undefined) {
      throw new Error("time-dilation entity target 'buffOwner' requires a Buff lifecycle owner");
    }
    return context.buffOwnerId;
  }
  const ids = dependencies.resolveTargetIds(target);
  if (ids.length !== 1) {
    throw new Error(`time-dilation entity target '${target}' must resolve to exactly one entity`);
  }
  return ids[0]!;
}

/** 动作结束时清理它登记的膨胀和忽略设置；实际运行时操作由当前分支提供。 */

/** 保留注册顺序，全部停止成功后才删除动作关系。 */
export function finishTimeDilationAction(
  state: TimeDilationActionState,
  slot: number,
  stop: (instanceId: number) => void,
): void {
  for (const id of state.instanceIds.get(slot) ?? []) stop(id);
  state.instanceIds.delete(slot);
}

/** 按原动作设置的反值恢复；不把它改成引用计数或推断此前状态。 */
export function revertTimeDilationIgnoreAction(
  state: TimeDilationActionState,
  slot: number,
  ignore: boolean,
  setIgnore: (entityId: string, ignore: boolean) => void,
): void {
  for (const entityId of state.ignoredEntityIds.get(slot) ?? []) setIgnore(entityId, !ignore);
  state.ignoredEntityIds.delete(slot);
}
