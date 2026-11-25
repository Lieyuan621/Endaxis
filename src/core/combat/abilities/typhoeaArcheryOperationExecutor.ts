import type { CompiledCondition } from '../../compiler/compiledGraphData';
import type {
  ResolvedCombatOperationStep,
  ResolvedCombatStepForKind,
} from '../../compiler/combatProgram';
import type { CombatOperationContext, CombatOperationExecutor } from '../skills/skillRuntime';
import { resolveActionValueOperand } from '../actions/actionBlackboard';

type Parameters = ResolvedCombatStepForKind<'startTyphoeaArchery'>['parameters'];
export interface TyphoeaArcheryRegistrationRequest extends Omit<Parameters, 'targetCount'> {
  readonly targetCount: number;
}

/** 注册句柄随每次动作调用恢复；不会通过重新执行动作来重建瞄准系统。 */
export class TyphoeaArcheryOperationExecutor implements CombatOperationExecutor {
  constructor(
    readonly delegate: CombatOperationExecutor,
    readonly register: (
      request: TyphoeaArcheryRegistrationRequest,
      context: CombatOperationContext,
    ) => number,
    readonly unregister: (id: number) => void,
  ) {}

  execute(step: ResolvedCombatOperationStep, context?: CombatOperationContext): boolean {
    if (step.kind !== 'startTyphoeaArchery') return this.delegate.execute(step, context);
    if (!context) throw new Error('archery registration requires an action context');
    const state = context.actionRegistrationState;
    if (!state) throw new Error('archery registration requires activation state');
    if (state.registrationIds.length > 0) return true;
    const targetCount = resolveActionValueOperand(step.parameters.targetCount, context.blackboard);
    if (!Number.isSafeInteger(targetCount) || targetCount < 0)
      throw new Error(`invalid archery target count ${targetCount}`);
    const id = this.register({ ...step.parameters, targetCount }, context);
    state.registrationIds.push(id);
    return true;
  }

  end(step: ResolvedCombatOperationStep, context?: CombatOperationContext): void {
    if (step.kind !== 'startTyphoeaArchery') {
      this.delegate.end?.(step, context);
      return;
    }
    const state = context?.actionRegistrationState;
    if (!state) throw new Error('archery registration requires activation state');
    const ids = state.registrationIds.splice(0);
    for (const id of ids) this.unregister(id);
  }

  evaluate(condition: CompiledCondition, context?: CombatOperationContext): boolean {
    return this.delegate.evaluate(condition, context);
  }
}
