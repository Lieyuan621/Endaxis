import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import { firstRuntimeEntityTarget } from '../../game-data/logicalAbilityEntity';
import type { CompiledCondition } from '../../compiler/compiledGraphData.ts';
import type { CombatOperationContext } from '../skills/skillRuntime';

import type { EnemyRank } from '../../game-data/enemyRank';
import type { CombatOperationExecutor } from '../skills/skillRuntime';
import { resolveActionValueOperand } from '../actions/actionBlackboard';
import { compareCombatNumbers } from '../../math/combatNumbers.ts';

/** 读取场景敌人实例捕获的原生 rank；展示 tier 不参与条件求值。 */
export class EnemyRankConditionExecutor implements CombatOperationExecutor {
  constructor(
    private readonly readRank: (target: RuntimeTargetRef) => EnemyRank | undefined,
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
      const target = firstRuntimeEntityTarget(this.queryTargets(condition.target, context));
      if (target?.kind !== 'enemy') return false;
      const rank = this.readRank(target);
      return rank !== undefined && condition.ranks.includes(rank);
    }
    return this.delegate.evaluate(condition, context);
  }
}

/** 对查询目标的超级护甲值执行原生浮点容差比较。 */
export class EnemySuperArmorConditionExecutor implements CombatOperationExecutor {
  constructor(
    private readonly readSuperArmor: (target: RuntimeTargetRef) => number | undefined,
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
    const target = firstRuntimeEntityTarget(this.queryTargets(condition.target, context));
    if (target === undefined) return false;
    if (target.kind !== 'enemy')
      throw new Error(`super armor attribute is not modeled for '${target.kind}'`);
    const superArmor = this.readSuperArmor(target);
    if (superArmor === undefined) return false;
    return compareCombatNumbers(
      superArmor,
      resolveActionValueOperand(condition.value, context.blackboard),
      condition.operator,
    );
  }
}
