import type { CompiledCondition } from '../../compiler/compiledGraphData.ts';
import { runtimeTargetEntityId } from '../../game-data/logicalAbilityEntity';

import type { ResolvedCombatStepForKind } from '../../compiler/combatProgram';
import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import type { HealCalculationAttribute } from '../../game-data/operatorDefinition';
import type { CombatReceiptSink } from '../receipt/combatReceipt';
import { resolveActionValueOperand } from '../actions/actionBlackboard';
import type { CombatClock } from '../time/combatClock';
import type { CombatVitals } from '../resources/combatVitals';
import type { CombatOperationContext, CombatOperationExecutor } from '../skills/skillRuntime';
import type { HealAbilityEvent } from '../events/combatAbilityEvent';
import { HealCalculationContext } from './healModifiers';
import {
  type HealModifierSide,
  type HealProcessTiming,
} from '../../../../packages/game-data-contract/src/modifiers';

type HealStep = ResolvedCombatStepForKind<'heal'>;

export interface ResolvedHealTarget {
  readonly entityId: string;
  readonly vitals: CombatVitals;
}

export interface HealOperationDependencies {
  readonly clock: CombatClock;
  readonly receipt: CombatReceiptSink;
  readonly resolveSourceAttribute: (
    healerId: string,
    attribute: HealCalculationAttribute,
  ) => number;
  readonly resolveTargetAttribute?: (
    targetId: string,
    attribute: HealCalculationAttribute,
  ) => number;
  readonly queryTargets: NonNullable<CombatOperationExecutor['queryTargets']>;
  /** 只按实例身份取得账本，不在此处重新选择目标。 */
  readonly resolveEntity: (entityId: string) => ResolvedHealTarget;
  readonly applyHealModifiers?: (
    timing: HealProcessTiming,
    side: HealModifierSide,
    context: HealCalculationContext,
  ) => void;
  readonly resolveHealingIncrease?: (side: HealModifierSide, operatorId: string) => number;
  /** 原生 Modifier 成功后固定先 output、再 receive；满血治疗也必须调用。 */
  readonly emitSuccessfulHeal?: (event: HealAbilityEvent) => void;
  readonly delegate: CombatOperationExecutor;
}

/** 按目标身份写入生命账本；目标选择和属性来源由场景环境提供。 */
export class HealOperationExecutor implements CombatOperationExecutor {
  constructor(readonly dependencies: HealOperationDependencies) {}

  prepare(step: ResolvedCombatOperationStep, context: CombatOperationContext): void {
    this.dependencies.delegate.prepare?.(step, context);
  }

  execute(step: ResolvedCombatOperationStep, context?: CombatOperationContext): boolean {
    if (step.kind !== 'heal') return this.dependencies.delegate.execute(step, context);
    if (context === undefined) throw new Error('heal requires an action context');
    let healedAny = false;
    for (const receiver of this.dependencies.queryTargets(step.parameters.target, context)) {
      const targetId = runtimeTargetEntityId(receiver);
      if (targetId === undefined) continue;
      const healer =
        step.parameters.healer.kind === 'currentTarget'
          ? receiver
          : this.dependencies.queryTargets(step.parameters.healer, context)[0];
      const sourceId = healer === undefined ? undefined : runtimeTargetEntityId(healer);
      if (sourceId === undefined) continue;
      this.#heal(step, context, sourceId, this.dependencies.resolveEntity(targetId));
      healedAny = true;
    }
    return step.parameters.alwaysNext === true || healedAny;
  }

  #heal(
    step: HealStep,
    context: CombatOperationContext,
    healerId: string,
    target: ResolvedHealTarget,
  ): void {
    const definiteAmount = step.parameters.amount;
    const attribute = definiteAmount === undefined ? step.parameters.attribute : undefined;
    const attributeSource =
      definiteAmount === undefined ? step.parameters.attributeSource : undefined;
    const multiplier =
      definiteAmount === undefined
        ? this.#resolveValue(step.parameters.multiplier, context, step)
        : 0;
    const addition =
      definiteAmount === undefined
        ? this.#resolveValue(step.parameters.addition, context, step)
        : this.#resolveValue(definiteAmount, context, step);
    const attributeValue =
      attribute === undefined
        ? 0
        : attributeSource === 'target'
          ? this.#resolveTargetAttribute(target.entityId, attribute)
          : this.dependencies.resolveSourceAttribute(healerId, attribute);
    const calculation = new HealCalculationContext(
      healerId,
      target.entityId,
      target.vitals,
      Math.fround(Math.fround(attributeValue * multiplier) + addition),
      step.parameters.tags,
      this.dependencies.resolveHealingIncrease?.('healer', healerId) ?? 0,
      this.dependencies.resolveHealingIncrease?.('receiver', target.entityId) ?? 0,
    );
    this.dependencies.applyHealModifiers?.('beforeCalculation', 'healer', calculation);
    this.dependencies.applyHealModifiers?.('beforeCalculation', 'receiver', calculation);
    this.dependencies.applyHealModifiers?.('afterCalculation', 'healer', calculation);
    this.dependencies.applyHealModifiers?.('afterCalculation', 'receiver', calculation);
    // BattleFormula.CalculateHeal：普通治疗在 AfterCalculation 修正之后，
    // 乘创建 HealPack 时双方属性快照的 1 + output + taken。
    calculation.value *= 1 + calculation.healerOutputIncrease + calculation.receiverTakenIncrease;
    const requested = Math.max(0, calculation.value);
    const result = target.vitals.heal(requested);
    this.dependencies.receipt.record({
      frame: this.dependencies.clock.frame,
      time: this.dependencies.clock.time,
      event: 'HealingApplied',
      sourceId: healerId,
      targetId: target.entityId,
      data: {
        attribute: attribute ?? 'definite',
        attributeValue,
        multiplier,
        addition,
        tags: JSON.stringify(step.parameters.tags),
        requestedHealing: result.requestedHealing,
        actualHealing: result.actualHealing,
        overhealing: result.overhealing,
        previousHealth: result.previousHealth,
        currentHealth: result.currentHealth,
      },
    });
    const eventBase = {
      sourceId: healerId,
      targetId: target.entityId,
      requestedHealing: result.requestedHealing,
      actualHealing: result.actualHealing,
      overhealing: result.overhealing,
      tags: step.parameters.tags,
    };
    // 原生分别构造两侧 HealContext；每次通知内部原样传递，不共用可被监听器修改的载荷对象。
    this.dependencies.emitSuccessfulHeal?.({ payload: { ...eventBase }, event: 'outputHeal' });
    this.dependencies.emitSuccessfulHeal?.({ payload: { ...eventBase }, event: 'receiveHeal' });
  }

  end(step: ResolvedCombatOperationStep, context?: CombatOperationContext): void {
    this.dependencies.delegate.end?.(step, context);
  }

  evaluate(condition: CompiledCondition, context?: CombatOperationContext): boolean {
    return this.dependencies.delegate.evaluate(condition, context);
  }

  #resolveValue(
    value: NonNullable<HealStep['parameters']['multiplier']>,
    context: CombatOperationContext | undefined,
    step: HealStep,
  ): number {
    if (typeof value === 'number') return value;
    if (context === undefined) {
      throw new Error(`heal '${step.parameters.target}' requires an action blackboard`);
    }
    return resolveActionValueOperand(value, context.blackboard);
  }

  #resolveTargetAttribute(targetId: string, attribute: HealCalculationAttribute): number {
    const resolve = this.dependencies.resolveTargetAttribute;
    if (resolve === undefined) {
      throw new Error(`heal target attribute '${attribute}' resolver is not configured`);
    }
    return resolve(targetId, attribute);
  }
}
