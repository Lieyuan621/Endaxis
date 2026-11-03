import type { CompiledCondition } from '../../compiler/compiledGraphData';
import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import type { CombatOperationContext, CombatOperationExecutor } from './skillRuntime';
import type { CombatClock } from '../time/combatClock';
import type { CombatReceiptSink } from '../receipt/combatReceipt';
import { runtimeTargetEntityId } from '../../game-data/logicalAbilityEntity';
import { resolveActionValueOperand } from '../actions/actionBlackboard';

/** 次数盾 UI 只发布显示事实；免伤和计数仍由原生 Buff 图执行。 */
export class CountShieldUiOperationExecutor implements CombatOperationExecutor {
  constructor(
    readonly clock: CombatClock,
    readonly receipt: CombatReceiptSink,
    readonly queryTargets: CombatOperationExecutor['queryTargets'],
    readonly delegate: CombatOperationExecutor,
  ) {}
  execute(step: ResolvedCombatOperationStep, context?: CombatOperationContext): boolean {
    if (step.kind !== 'setCountShieldUi') return this.delegate.execute(step, context);
    if (!context || !this.queryTargets) throw new Error('count shield UI requires target context');
    const maximum = Math.max(
      0,
      Math.trunc(resolveActionValueOperand(step.parameters.maximum, context.blackboard)),
    );
    const current = Math.max(
      0,
      Math.min(
        maximum,
        Math.trunc(resolveActionValueOperand(step.parameters.current, context.blackboard)),
      ),
    );
    for (const target of this.queryTargets(step.parameters.target, context)) {
      const targetId = runtimeTargetEntityId(target);
      if (targetId === undefined) continue;
      this.receipt.record({
        frame: this.clock.frame,
        time: this.clock.time,
        event: 'CountShieldUiChanged',
        targetId,
        data: { maximum, current: step.parameters.remove ? 0 : current },
      });
    }
    return true;
  }
  end(step: ResolvedCombatOperationStep, context?: CombatOperationContext): void {
    if (step.kind !== 'setCountShieldUi') this.delegate.end?.(step, context);
  }
  evaluate(condition: CompiledCondition, context?: CombatOperationContext): boolean {
    return this.delegate.evaluate(condition, context);
  }
}
