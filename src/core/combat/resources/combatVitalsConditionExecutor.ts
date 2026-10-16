import type { CompiledCondition } from '../../compiler/compiledGraphData.ts';
import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
/**
 * 求值依赖实体生命账本的战斗条件，并把其他操作交给执行器链。
 * 调用方必须按目标身份提供同一场模拟中的 `CombatVitals`，不得用面板快照代替运行时生命。
 */

import { resolveActionValueOperand } from '../actions/actionBlackboard';
import type { CombatOperationContext, CombatOperationExecutor } from '../skills/skillRuntime';
import type { CombatVitals } from './combatVitals';
import { compareCombatNumbers } from '../../math/combatNumbers.ts';

export interface CombatVitalsConditionDependencies {
  readonly resolveTarget: (
    target: Exclude<
      Extract<
        CompiledCondition,
        { kind: 'healthCompare' | 'poiseCompare' | 'targetStaggered' }
      >['target'],
      'actionInputTarget'
    >,
    buffSourceId?: string,
  ) => CombatVitals;
  /** Context 查询中的干员实例直接按身份读取；条件不得重新运行选择器。 */
  readonly resolveContextTarget?: (operatorId: string) => CombatVitals;
  readonly delegate: CombatOperationExecutor;
}

/** 处理由同一实体生命账本持有的生命与失衡比较。 */
export class CombatVitalsConditionExecutor implements CombatOperationExecutor {
  constructor(readonly dependencies: CombatVitalsConditionDependencies) {}

  execute(step: ResolvedCombatOperationStep, context?: CombatOperationContext): boolean {
    return context === undefined
      ? this.dependencies.delegate.execute(step)
      : this.dependencies.delegate.execute(step, context);
  }

  end(step: ResolvedCombatOperationStep, context?: CombatOperationContext): void {
    this.dependencies.delegate.end?.(step, context);
  }

  evaluate(condition: CompiledCondition, context?: CombatOperationContext): boolean {
    if (
      condition.kind !== 'healthCompare' &&
      condition.kind !== 'poiseCompare' &&
      condition.kind !== 'targetStaggered'
    ) {
      return context === undefined
        ? this.dependencies.delegate.evaluate(condition)
        : this.dependencies.delegate.evaluate(condition, context);
    }
    if (context === undefined)
      throw new Error(`${condition.kind} requires a combat operation context`);
    if (condition.kind === 'healthCompare') {
      const vitals =
        condition.target === 'contextTarget'
          ? this.#resolveContextTarget(condition.contextKey, context)
          : condition.target === 'currentTarget'
            ? this.#resolveCurrentTarget(context)
            : condition.target === 'actionInputTarget'
              ? this.#resolveInputTarget(context)
              : this.dependencies.resolveTarget(condition.target, context.buffSourceId);
      const threshold = resolveActionValueOperand(condition.value, context.blackboard);
      // 木桩模拟允许血量耗尽后继续执行：已有目标的「生命值 > 0」存活门禁始终放行。
      // 不修改生命账本、不放行空目标，也不改变其他阈值或比较方式。
      if (vitals !== undefined && condition.operator === 'greater' && threshold === 0) return true;
      // 原生取首个目标；没有目标时生命和最大生命均为零，比例保持 0/0。
      const health = vitals?.health ?? 0;
      const current = condition.valueType === 'ratio' ? health / (vitals?.maxHealth ?? 0) : health;
      return compareCombatNumbers(current, threshold, condition.operator);
    }
    const vitals =
      condition.target === 'currentTarget'
        ? this.#resolveCurrentTarget(context)
        : condition.target === 'actionInputTarget'
          ? this.#resolveInputTarget(context)
          : this.dependencies.resolveTarget(condition.target, context.buffSourceId);
    if (condition.kind === 'targetStaggered') return vitals?.hasPoiseBrokenTag ?? false;
    if (vitals !== undefined && !vitals.hasPoise) return condition.returnValueIfMissing;
    return compareCombatNumbers(
      vitals?.poise ?? 0,
      resolveActionValueOperand(condition.value, context.blackboard),
      condition.operator,
    );
  }

  #resolveContextTarget(
    contextKey: string | undefined,
    context: CombatOperationContext,
  ): CombatVitals | undefined {
    if (context.targetContext === undefined || contextKey === undefined) {
      throw new Error("healthCompare target 'contextTarget' requires a combat target context key");
    }
    const targets = context.targetContext.get(contextKey);
    const target = targets[0];
    if (target === undefined) return undefined;
    if (target.kind === 'enemy') {
      return this.dependencies.resolveTarget('enemy', context.buffSourceId);
    }
    if (target.kind !== 'operator') {
      throw new Error(
        `healthCompare context target '${contextKey}' does not support '${target.kind}' vitals`,
      );
    }
    const resolve = this.dependencies.resolveContextTarget;
    if (resolve === undefined) throw new Error('context health target resolver is not configured');
    return resolve(target.operatorId);
  }

  #resolveCurrentTarget(context: CombatOperationContext): CombatVitals {
    if (context.currentTarget?.kind === 'enemy')
      return this.dependencies.resolveTarget('enemy', context.buffSourceId);
    if (context.currentTarget?.kind !== 'operator') {
      throw new Error('currentTarget requires an enemy or operator');
    }
    const resolve = this.dependencies.resolveContextTarget;
    if (resolve === undefined) throw new Error('current health target resolver is not configured');
    return resolve(context.currentTarget.operatorId);
  }

  #resolveInputTarget(context: CombatOperationContext): CombatVitals | undefined {
    const target = context.actionInputTarget;
    if (target === undefined) return undefined;
    if (target.kind === 'enemy')
      return this.dependencies.resolveTarget('enemy', context.buffSourceId);
    if (target.kind !== 'operator') throw new Error(`unsupported poise target '${target.kind}'`);
    const resolve = this.dependencies.resolveContextTarget;
    if (resolve === undefined) throw new Error('input target vitals resolver is not configured');
    return resolve(target.operatorId);
  }
}
