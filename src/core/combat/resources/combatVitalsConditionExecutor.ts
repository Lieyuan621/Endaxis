import type { CompiledCondition } from '../../compiler/compiledGraphData';
import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import type { CombatTarget } from '../../../../packages/game-data-contract/src/primitives';
import { resolveActionValueOperand } from '../actions/actionBlackboard';
import type { CombatOperationContext, CombatOperationExecutor } from '../skills/skillRuntime';
import type { CombatVitals } from './combatVitals';
import { compareCombatNumbers } from '../../math/combatNumbers';

export interface CombatVitalsConditionDependencies {
  readonly resolveTarget: (target: CombatTarget, buffSourceId?: string) => CombatVitals;
  readonly queryTargets: NonNullable<CombatOperationExecutor['queryTargets']>;
  readonly resolveVitals: (target: RuntimeTargetRef, property: 'currentHealth' | 'currentPoise') => CombatVitals | undefined;
  readonly delegate: CombatOperationExecutor;
}

/** 原生生命、失衡条件先通过公共查询取得首目标，再按各自的缺失目标规则比较。 */
export class CombatVitalsConditionExecutor implements CombatOperationExecutor {
  constructor(readonly dependencies: CombatVitalsConditionDependencies) {}

  execute(step: ResolvedCombatOperationStep, context?: CombatOperationContext): boolean {
    return this.dependencies.delegate.execute(step, context);
  }

  end(step: ResolvedCombatOperationStep, context?: CombatOperationContext): void {
    this.dependencies.delegate.end?.(step, context);
  }

  evaluate(condition: CompiledCondition, context?: CombatOperationContext): boolean {
    if (condition.kind === 'targetStaggered') {
      return this.dependencies.resolveTarget(condition.target, context?.buffSourceId).hasPoiseBrokenTag;
    }
    if (condition.kind !== 'healthCompare' && condition.kind !== 'poiseCompare')
      return this.dependencies.delegate.evaluate(condition, context);
    if (!context) throw new Error(`${condition.kind} requires a combat operation context`);
    const target = this.dependencies.queryTargets(condition.target, context)[0];
    const vitals = target === undefined ? undefined : this.dependencies.resolveVitals(
      target, condition.kind === 'healthCompare' ? 'currentHealth' : 'currentPoise',
    );
    if (condition.kind === 'healthCompare') {
      const threshold = resolveActionValueOperand(condition.value, context.blackboard);
      // 木桩既有存活门禁简化保持不变；空目标不放行，其他比较照常读取真实账本。
      if (vitals !== undefined && condition.operator === 'greater' && threshold === 0) return true;
      const health = vitals?.health ?? 0;
      const current = condition.valueType === 'ratio' ? health / (vitals?.maxHealth ?? 0) : health;
      return compareCombatNumbers(current, threshold, condition.operator);
    }
    // 无目标比较零；有目标但没有失衡系统时返回配置值，且不求值阈值。
    if (target !== undefined && (vitals === undefined || !vitals.hasPoise))
      return condition.returnValueIfMissing;
    return compareCombatNumbers(
      vitals?.poise ?? 0,
      resolveActionValueOperand(condition.value, context.blackboard),
      condition.operator,
    );
  }
}
