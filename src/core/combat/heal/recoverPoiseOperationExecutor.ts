import type { CompiledCondition } from '../../compiler/compiledGraphData.ts';
import {
  firstRuntimeEntityTarget,
  runtimeTargetEntityId,
} from '../../game-data/logicalAbilityEntity';

import type { ResolvedCombatStepForKind } from '../../compiler/combatProgram';
import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import type { MultiplyAttributeCalculationAttribute } from '../../game-data/operatorDefinition';
import type { CombatReceiptSink } from '../receipt/combatReceipt';
import { resolveActionValueOperand } from '../actions/actionBlackboard';
import type { CombatClock } from '../time/combatClock';
import type { CombatVitals } from '../resources/combatVitals';
import type { CombatOperationContext, CombatOperationExecutor } from '../skills/skillRuntime';
type RecoverPoiseStep = ResolvedCombatStepForKind<'recoverPoise'>;

export interface PoiseRecoveryTarget {
  readonly entityId: string;
  readonly vitals: CombatVitals;
}

interface RecoverPoiseDependencies {
  readonly clock: CombatClock;
  readonly receipt: CombatReceiptSink;
  readonly resolveSourceAttribute: (
    sourceId: string,
    attribute: MultiplyAttributeCalculationAttribute,
  ) => number;
  readonly resolveTargetAttribute?: (
    targetId: string,
    attribute: MultiplyAttributeCalculationAttribute,
  ) => number;
  readonly queryTargets: NonNullable<CombatOperationExecutor['queryTargets']>;
  readonly isTargetAlive: (entityId: string) => boolean;
  readonly resolveEntity: (entityId: string) => {
    readonly entityId: string;
    readonly vitals: CombatVitals;
  };
  readonly delegate: CombatOperationExecutor;
}

/** 按目标身份恢复失衡值，不发布治疗事件。 */
export class RecoverPoiseOperationExecutor implements CombatOperationExecutor {
  constructor(readonly dependencies: RecoverPoiseDependencies) {}

  prepare(step: ResolvedCombatOperationStep, context: CombatOperationContext): void {
    this.dependencies.delegate.prepare?.(step, context);
  }

  execute(step: ResolvedCombatOperationStep, context?: CombatOperationContext): boolean {
    if (step.kind !== 'recoverPoise') return this.dependencies.delegate.execute(step, context);
    if (context === undefined) throw new Error('recoverPoise requires an action context');
    let recoveredAny = false;
    for (const receiver of this.dependencies.queryTargets(step.parameters.target, context)) {
      const targetId = runtimeTargetEntityId(receiver);
      if (targetId === undefined) continue;
      if (!this.dependencies.isTargetAlive(targetId)) continue;
      const healer =
        step.parameters.healer.kind === 'currentTarget'
          ? receiver
          : firstRuntimeEntityTarget(
              this.dependencies.queryTargets(step.parameters.healer, context),
            );
      const sourceId = healer === undefined ? undefined : runtimeTargetEntityId(healer);
      if (sourceId === undefined) continue;
      this.#recover(step, context, sourceId, this.dependencies.resolveEntity(targetId));
      recoveredAny = true;
    }
    return step.parameters.alwaysNext === true || recoveredAny;
  }

  #recover(
    step: RecoverPoiseStep,
    context: CombatOperationContext,
    healerId: string,
    target: PoiseRecoveryTarget,
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
    {
      const value = Math.max(0, Math.fround(Math.fround(attributeValue * multiplier) + addition));
      const previousPoise = target.vitals.poise;
      const actualDelta = target.vitals.applyPoiseDelta(value);
      this.dependencies.receipt.record({
        frame: this.dependencies.clock.frame,
        time: this.dependencies.clock.time,
        event: 'PoiseApplied',
        sourceId: healerId,
        targetId: target.entityId,
        data: {
          calculationValue: value,
          calculatedDamage: 0,
          cancelled: false,
          cancelledByImmunity: false,
          poiseImmune: target.vitals.poiseImmune,
          ignorePoiseImmune: true,
          brokePoise: false,
          requestedDelta: value,
          actualDelta,
          previousPoise,
          currentPoise: target.vitals.poise,
          inPoiseRecovery: target.vitals.inPoiseRecovery,
          hasPoiseBrokenTag: target.vitals.hasPoiseBrokenTag,
        },
      });
      return;
    }
  }

  end(step: ResolvedCombatOperationStep, context?: CombatOperationContext): void {
    this.dependencies.delegate.end?.(step, context);
  }

  evaluate(condition: CompiledCondition, context?: CombatOperationContext): boolean {
    return this.dependencies.delegate.evaluate(condition, context);
  }

  #resolveValue(
    value: NonNullable<RecoverPoiseStep['parameters']['multiplier']>,
    context: CombatOperationContext | undefined,
    step: RecoverPoiseStep,
  ): number {
    if (typeof value === 'number') return value;
    if (context === undefined) {
      throw new Error(`recoverPoise '${step.parameters.target}' requires an action blackboard`);
    }
    return resolveActionValueOperand(value, context.blackboard);
  }

  #resolveTargetAttribute(targetId: string, attribute: MultiplyAttributeCalculationAttribute): number {
    const resolve = this.dependencies.resolveTargetAttribute;
    if (resolve === undefined) {
      throw new Error(`recoverPoise target attribute '${attribute}' resolver is not configured`);
    }
    return resolve(targetId, attribute);
  }
}
