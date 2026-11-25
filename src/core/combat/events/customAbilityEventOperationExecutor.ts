import type { CompiledTargetQuery } from '../../compiler/compiledGraphData';
import type { CompiledCondition } from '../../compiler/compiledGraphData.ts';

import type { ResolvedCombatStepForKind } from '../../compiler/combatProgram';
import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import { logicalAbilityEntityRuntimeId } from '../../game-data/logicalAbilityEntity';
import { runtimeTargetEntityId } from '../../game-data/logicalAbilityEntity';
import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';

import type { CombatOperationContext, CombatOperationExecutor } from '../skills/skillRuntime';
import { resolveActionValueOperand } from '../actions/actionBlackboard';

type TriggerStep = ResolvedCombatStepForKind<'triggerCustomAbilityEvent'>;

export interface CustomAbilityEventOperationExecutorDependencies {
  readonly sourceId: string;
  readonly queryTargets?: (
    query: CompiledTargetQuery,
    context: CombatOperationContext,
  ) => readonly RuntimeTargetRef[];
  readonly emit: (
    ownerId: string,
    payload: {
      readonly sourceId: string;
      readonly targetId: string;
      readonly eventName: string;
      readonly eventParam: number;
    },
  ) => void;
  readonly delegate: CombatOperationExecutor;
}

/** 接收集合先解析，随后取得单个来源，并按目标顺序同步分发。 */
export class CustomAbilityEventOperationExecutor implements CombatOperationExecutor {
  constructor(readonly dependencies: CustomAbilityEventOperationExecutorDependencies) {}

  execute(step: ResolvedCombatOperationStep, context?: CombatOperationContext): boolean {
    if (step.kind !== 'triggerCustomAbilityEvent') {
      return this.dependencies.delegate.execute(step, context);
    }
    this.#trigger(step, context);
    return true;
  }

  end(step: ResolvedCombatOperationStep, context?: CombatOperationContext): void {
    if (step.kind === 'triggerCustomAbilityEvent') return;
    this.dependencies.delegate.end?.(step, context);
  }

  evaluate(condition: CompiledCondition, context?: CombatOperationContext): boolean {
    return this.dependencies.delegate.evaluate(condition, context);
  }

  #trigger(step: TriggerStep, context?: CombatOperationContext): void {
    const receivers =
      step.parameters.target === 'caster'
        ? [this.dependencies.sourceId]
        : this.#query(step.parameters.target, context)
            .map(runtimeTargetEntityId)
            .filter((id): id is string => id !== undefined);
    if (receivers.length === 0) return;
    const input = step.parameters.eventParam;
    if (typeof input !== 'number' && context === undefined)
      throw new Error('custom ability event parameter requires an action context');
    const eventParam =
      typeof input === 'number' ? input : resolveActionValueOperand(input, context!.blackboard);
    let eventSourceId = this.dependencies.sourceId;
    if (typeof step.parameters.source === 'object') {
      const source = this.#query(step.parameters.source, context)[0];
      const id = source && runtimeTargetEntityId(source);
      if (id === undefined) throw new Error('custom ability event requires an entity source');
      eventSourceId = id;
    } else if (step.parameters.source === 'currentAbilityEntity') {
      const entity = context?.actionOwnerAbilityEntity ?? context?.currentTarget;
      if (entity?.kind !== 'abilityEntity') {
        throw new Error(
          'AbilityEntity custom event requires an entity child-skill or Buff context',
        );
      }
      eventSourceId = logicalAbilityEntityRuntimeId(entity.instanceId);
    }
    for (const receiverId of receivers)
      this.dependencies.emit(receiverId, {
        sourceId: eventSourceId,
        targetId: receiverId,
        eventName: step.parameters.eventName,
        eventParam,
      });
  }

  #query(
    query: CompiledTargetQuery,
    context?: CombatOperationContext,
  ): readonly RuntimeTargetRef[] {
    if (!context || !this.dependencies.queryTargets) {
      throw new Error('custom ability event target query requires an action context and resolver');
    }
    return this.dependencies.queryTargets(query, context);
  }
}
