import type { CompiledCondition } from '../../compiler/compiledGraphData.ts';
import type { ActionTargetQuery } from '../../../../packages/game-data-contract/src/conditions';
import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import type { CombatOperationContext, CombatOperationExecutor } from './skillRuntime';

/**
 * 求值依赖场景主控身份的技能条件，并把其余战斗操作继续交给执行器链。
 * 调用方必须提供当前帧查询函数；本层不读取存档，也不假定初始主控轨道。
 */

interface OperatorControlConditionExecutorDependencies {
  readonly isOperatorControlled: (operatorId: string) => boolean;
  readonly queryTargets: (
    query: ActionTargetQuery,
    context: CombatOperationContext,
  ) => readonly RuntimeTargetRef[];
  readonly delegate: CombatOperationExecutor;
}

export class OperatorControlConditionExecutor implements CombatOperationExecutor {
  constructor(readonly dependencies: OperatorControlConditionExecutorDependencies) {}

  execute(step: ResolvedCombatOperationStep, context?: CombatOperationContext): boolean {
    return context === undefined
      ? this.dependencies.delegate.execute(step)
      : this.dependencies.delegate.execute(step, context);
  }

  end(step: ResolvedCombatOperationStep, context?: CombatOperationContext): void {
    this.dependencies.delegate.end?.(step, context);
  }

  evaluate(condition: CompiledCondition, context?: CombatOperationContext): boolean {
    if (condition.kind === 'checkMainCharacter') {
      if (context === undefined) throw new Error('checkMainCharacter requires an action context');
      const target = this.dependencies.queryTargets(condition.target, context)[0];
      return (
        target?.kind === 'operator' && this.dependencies.isOperatorControlled(target.operatorId)
      );
    }
    return context === undefined
      ? this.dependencies.delegate.evaluate(condition)
      : this.dependencies.delegate.evaluate(condition, context);
  }
}
