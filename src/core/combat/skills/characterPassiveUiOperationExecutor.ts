import type { CompiledCondition, CompiledTargetQuery } from '../../compiler/compiledGraphData.ts';
import { runtimeTargetEntityId, type RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import type { CombatClock } from '../time/combatClock';
import type { CombatReceiptSink } from '../receipt/combatReceipt';
import type { CombatOperationContext, CombatOperationExecutor } from './skillRuntime';
import { resolveActionValueOperand } from '../actions/actionBlackboard';

export interface CharacterPassiveUiOperationExecutorOptions {
  readonly sourceOperatorId: string;
  readonly queryTargets: (
    target: CompiledTargetQuery,
    context: CombatOperationContext,
  ) => readonly RuntimeTargetRef[];
  readonly clock: CombatClock;
  readonly receipt: CombatReceiptSink;
  readonly delegate: CombatOperationExecutor;
}

export class CharacterPassiveUiOperationExecutor implements CombatOperationExecutor {
  constructor(readonly options: CharacterPassiveUiOperationExecutorOptions) {}

  execute(step: ResolvedCombatOperationStep, context?: CombatOperationContext): boolean {
    if (step.kind === 'setCharacterPassiveUiValue') {
      if (context === undefined) {
        throw new Error('character passive UI value requires an action blackboard');
      }
      const targetId = this.options
        .queryTargets(step.parameters.target, context)
        .map(runtimeTargetEntityId)
        .find(id => id !== undefined);
      if (targetId === undefined) return true;
      this.options.receipt.record({
        frame: this.options.clock.frame,
        time: this.options.clock.time,
        event: 'CharacterPassiveUiValueChanged',
        sourceId: this.options.sourceOperatorId,
        targetId,
        data: { value: resolveActionValueOperand(step.parameters.value, context.blackboard) },
      });
      return true;
    }
    return context === undefined
      ? this.options.delegate.execute(step)
      : this.options.delegate.execute(step, context);
  }

  end(step: ResolvedCombatOperationStep, context?: CombatOperationContext): void {
    if (step.kind === 'setCharacterPassiveUiValue') return;
    this.options.delegate.end?.(step, context);
  }

  evaluate(condition: CompiledCondition, context?: CombatOperationContext): boolean {
    return context === undefined
      ? this.options.delegate.evaluate(condition)
      : this.options.delegate.evaluate(condition, context);
  }
}
