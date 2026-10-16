import type { CompiledCondition } from '../../compiler/compiledGraphData.ts';
/** 单敌人属性及本次输入提供的目标条件。 */
import type { CombatOperationContext } from '../skills/skillRuntime';

import type { EnemyRank } from '../../game-data/enemyRank';
import type { CombatOperationExecutor } from '../skills/skillRuntime';
import { resolveActionValueOperand } from '../actions/actionBlackboard';
import { compareCombatNumbers } from '../../math/combatNumbers.ts';

/** 读取场景敌人实例捕获的原生 rank；展示 tier 不参与条件求值。 */
export class EnemyRankConditionExecutor implements CombatOperationExecutor {
  constructor(
    private readonly rank: EnemyRank,
    private readonly delegate: CombatOperationExecutor,
    readonly queryTargets: NonNullable<CombatOperationExecutor['queryTargets']>,
  ) {}

  execute: CombatOperationExecutor['execute'] = (step, context) =>
    this.delegate.execute(step, context);

  end: NonNullable<CombatOperationExecutor['end']> = (step, context) =>
    this.delegate.end?.(step, context);

  evaluate(condition: CompiledCondition, context?: CombatOperationContext): boolean {
    if (condition.kind === 'enemyRankIn') {
      if (context === undefined) throw new Error('enemyRankIn requires a combat operation context');
      const target = this.queryTargets(condition.target, context)[0];
      return target?.kind === 'enemy' && condition.ranks.includes(this.rank);
    }
    return this.delegate.evaluate(condition, context);
  }
}

/** 对运行时捕获的单敌人超级护甲值执行原生浮点容差比较。 */
export class EnemySuperArmorConditionExecutor implements CombatOperationExecutor {
  constructor(
    private readonly superArmor: number,
    private readonly delegate: CombatOperationExecutor,
    readonly queryTargets: NonNullable<CombatOperationExecutor['queryTargets']>,
  ) {}

  execute: CombatOperationExecutor['execute'] = (step, context) =>
    this.delegate.execute(step, context);

  end: NonNullable<CombatOperationExecutor['end']> = (step, context) =>
    this.delegate.end?.(step, context);

  evaluate(condition: CompiledCondition, context?: CombatOperationContext): boolean {
    if (condition.kind !== 'enemySuperArmorCompare') {
      return this.delegate.evaluate(condition, context);
    }
    if (context === undefined) {
      throw new Error('enemySuperArmorCompare requires a combat operation context');
    }
    const target = this.queryTargets(condition.target, context)[0];
    if (target === undefined) return false;
    if (target.kind !== 'enemy')
      throw new Error(`super armor attribute is not modeled for '${target.kind}'`);
    return compareCombatNumbers(
      this.superArmor,
      resolveActionValueOperand(condition.value, context.blackboard),
      condition.operator,
    );
  }
}
