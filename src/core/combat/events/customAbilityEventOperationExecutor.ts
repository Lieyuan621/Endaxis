import type { CombatCondition } from '../../game-data/operatorDefinition';
import type { ResolvedCombatStepForKind } from '../../compiler/combatProgram';
import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import { logicalAbilityEntityRuntimeId } from '../../game-data/logicalAbilityEntity';
import type { CombatOperationContext, CombatOperationExecutor } from '../skills/skillRuntime';

type TriggerStep = ResolvedCombatStepForKind<'triggerCustomAbilityEvent'>;

export interface CustomAbilityEventOperationExecutorDependencies {
  readonly sourceId: string;
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

/** 固定木桩子集只开放已证明的 caster→caster 同步自定义事件。 */
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

  evaluate(condition: CombatCondition, context?: CombatOperationContext): boolean {
    return this.dependencies.delegate.evaluate(condition, context);
  }

  #trigger(step: TriggerStep, context?: CombatOperationContext): void {
    if (step.parameters.target !== 'caster') {
      throw new Error(`unsupported custom ability event target '${step.parameters.target}'`);
    }
    let eventSourceId = this.dependencies.sourceId;
    if (step.parameters.source === 'currentAbilityEntity') {
      const entity = context?.actionOwnerAbilityEntity ?? context?.currentTarget;
      if (entity?.kind !== 'abilityEntity') {
        throw new Error(
          'AbilityEntity custom event requires an entity child-skill or Buff context',
        );
      }
      eventSourceId = logicalAbilityEntityRuntimeId(entity.instanceId);
    }
    this.dependencies.emit(this.dependencies.sourceId, {
      sourceId: eventSourceId,
      targetId: this.dependencies.sourceId,
      eventName: step.parameters.eventName,
      eventParam: step.parameters.eventParam,
    });
  }
}
