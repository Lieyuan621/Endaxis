import type { CombatCondition } from '../../game-data/operatorDefinition';
import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import type { CombatOperationContext, CombatOperationExecutor } from './skillRuntime';
import type { UltimatePresentationRuntime } from './ultimatePresentationRuntime';

export class HideUiOperationExecutor implements CombatOperationExecutor {
  constructor(
    readonly runtime: UltimatePresentationRuntime,
    readonly sourceId: string,
    readonly sourceActionId: string,
    readonly delegate: CombatOperationExecutor,
  ) {}

  prepare(step: ResolvedCombatOperationStep, context: CombatOperationContext): void {
    if (step.kind !== 'hideUi') this.delegate.prepare?.(step, context);
  }

  execute(step: ResolvedCombatOperationStep, context?: CombatOperationContext): boolean {
    if (step.kind !== 'hideUi') return this.delegate.execute(step, context);
    this.#set(step.parameters.onlyBlockInput, true);
    return true;
  }

  end(step: ResolvedCombatOperationStep, context?: CombatOperationContext): void {
    if (step.kind !== 'hideUi') {
      this.delegate.end?.(step, context);
      return;
    }
    this.#set(step.parameters.onlyBlockInput, false);
  }

  evaluate(condition: CombatCondition, context?: CombatOperationContext): boolean {
    return this.delegate.evaluate(condition, context);
  }

  #set(onlyBlockInput: boolean, active: boolean): void {
    if (onlyBlockInput)
      throw new Error('HideUIAction.onlyBlockInput requires the CommonMask input protocol');
    this.runtime.setActive(active, this.sourceId, this.sourceActionId);
  }
}
