import type { CompiledCondition } from '../../compiler/compiledGraphData.ts';
import type { CombatTarget } from '../../game-data/operatorDefinition';
import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import type { CombatClock } from '../time/combatClock';
import type { CombatReceiptSink } from '../receipt/combatReceipt';
import type { CombatOperationContext, CombatOperationExecutor } from './skillRuntime';
import { resolveActionValueOperand } from '../actions/actionBlackboard';

export interface CharacterPassiveUiOperationExecutorOptions {
  readonly sourceOperatorId: string;
  readonly resolveTargetId: (target: CombatTarget) => string;
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
      this.options.receipt.record({
        frame: this.options.clock.frame,
        time: this.options.clock.time,
        event: 'CharacterPassiveUiValueChanged',
        sourceId: this.options.sourceOperatorId,
        targetId: this.options.resolveTargetId(step.parameters.target),
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
