import type { CompiledCondition } from '../../compiler/compiledGraphData.ts';

import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
/** 把技能调度中的开启连携窗口步骤接到场景级连携账本。 */
import type { CombatOperationContext, CombatOperationExecutor } from './skillRuntime';
import type { ComboWindowRuntime } from './comboWindowRuntime';
export class ComboWindowOperationExecutor implements CombatOperationExecutor {
  constructor(
    readonly operatorId: string,
    readonly windows: ComboWindowRuntime,
    readonly delegate: CombatOperationExecutor,
    readonly resolveCurrentSkillKey: (
      skillSlotKey: 'comboSkill',
      operatorId: string,
    ) => string = () => {
      throw new Error('current combo skill slot resolver is unavailable');
    },
    readonly queryTargets: NonNullable<CombatOperationExecutor['queryTargets']> = () => {
      throw new Error('combo condition target query is unavailable');
    },
  ) {}

  execute(step: ResolvedCombatOperationStep, context?: CombatOperationContext): boolean {
    if (step.kind === 'openComboWindow') {
      let ownerId = this.operatorId;
      if ('ownerContextKey' in step.parameters && step.parameters.ownerContextKey !== undefined) {
        if (context?.targetContext === undefined)
          throw new Error('combo window owner requires target context');
        const owner = context.targetContext.get(step.parameters.ownerContextKey)[0];
        // 原生只取首个 owner，并要求角色；不能回退到触发者或改找组内其他角色。
        if (owner?.kind !== 'operator') return true;
        ownerId = owner.operatorId;
      }
      this.windows.open(
        ownerId,
        'nextSkillKey' in step.parameters
          ? step.parameters.nextSkillKey
          : this.resolveCurrentSkillKey(step.parameters.nextSkillKeyFromSlot, ownerId),
      );
      return true;
    }
    return context === undefined
      ? this.delegate.execute(step)
      : this.delegate.execute(step, context);
  }

  end(step: ResolvedCombatOperationStep, context?: CombatOperationContext): void {
    if (step.kind === 'openComboWindow') return;
    if (context === undefined) this.delegate.end?.(step);
    else this.delegate.end?.(step, context);
  }

  evaluate(condition: CompiledCondition, context?: CombatOperationContext): boolean {
    if (condition.kind === 'comboSkillPending') {
      if (context === undefined) throw new Error('comboSkillPending requires a combat operation context');
      const target = this.queryTargets(condition.target, context)[0];
      return target?.kind === 'operator' && this.windows.hasPending(target.operatorId);
    }
    return context === undefined
      ? this.delegate.evaluate(condition)
      : this.delegate.evaluate(condition, context);
  }
}
