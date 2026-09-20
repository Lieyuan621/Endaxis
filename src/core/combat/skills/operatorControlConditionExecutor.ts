import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
/**
 * 求值依赖场景主控身份的技能条件，并把其余战斗操作继续交给执行器链。
 * 调用方必须提供当前帧查询函数；本层不读取存档，也不假定初始主控轨道。
 */
import type { CombatCondition } from '../../game-data/operatorDefinition';
import type { CombatOperationContext, CombatOperationExecutor } from './skillRuntime';

interface OperatorControlConditionExecutorDependencies {
  readonly isCasterControlled: () => boolean;
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

  evaluate(condition: CombatCondition, context?: CombatOperationContext): boolean {
    if (condition.kind === 'casterControlled') {
      return this.dependencies.isCasterControlled();
    }
    return context === undefined
      ? this.dependencies.delegate.evaluate(condition)
      : this.dependencies.delegate.evaluate(condition, context);
  }
}
