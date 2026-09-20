import type { CombatCondition, CombatTarget } from '../../game-data/operatorDefinition';
import type { AbilityPhysicalInflictionPayload } from './combatAbilityEvent';
/** 将主动技能动作产生的语义事实同步发布到同一战斗事件总线。 */
import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import type { CombatSemanticEventRuntime } from './combatSemanticEventRuntime';
import type { CombatClock } from '../time/combatClock';
import type { CombatReceiptSink } from '../receipt/combatReceipt';
import type { CombatOperationContext, CombatOperationExecutor } from '../skills/skillRuntime';
import { resolveActionValueOperand } from '../actions/actionBlackboard';

export interface CombatSemanticOutputOperationExecutorOptions {
  readonly sourceOperatorId: string;
  readonly resolveTargetId: (target: CombatTarget) => string;
  readonly semanticEvents: CombatSemanticEventRuntime;
  readonly emitPhysicalInfliction?: (payload: AbilityPhysicalInflictionPayload) => void;
  readonly clock: CombatClock;
  readonly receipt: CombatReceiptSink;
  readonly delegate: CombatOperationExecutor;
}

export class CombatSemanticOutputOperationExecutor implements CombatOperationExecutor {
  constructor(readonly options: CombatSemanticOutputOperationExecutorOptions) {}

  execute(step: ResolvedCombatOperationStep, context?: CombatOperationContext): boolean {
    if (step.kind === 'setCharacterPassiveUiValue') {
      if (context === undefined) {
        throw new Error('character passive UI value requires an action blackboard');
      }
      this.options.receipt.record({
        frame: this.options.clock.frame,
        time: this.options.clock.time,
        event: 'CharacterPassiveUiValueChanged',
        sourceId: this.options.sourceOperatorId,
        targetId: this.options.resolveTargetId(step.parameters.target),
        data: { value: resolveActionValueOperand(step.parameters.value, context.blackboard) },
      });
      return true;
    }
    if (step.kind !== 'outputAirborne' && step.kind !== 'outputKnockDown') {
      return context === undefined
        ? this.options.delegate.execute(step)
        : this.options.delegate.execute(step, context);
    }
    if (this.options.emitPhysicalInfliction === undefined)
      throw new Error('physical output requires an ability event publisher');
    const targetId = this.options.resolveTargetId(step.parameters.target);
    const isAirborne = step.kind === 'outputAirborne';
    this.options.receipt.record({
      frame: this.options.clock.frame,
      time: this.options.clock.time,
      event: isAirborne ? 'AirborneOutput' : 'KnockDownOutput',
      sourceId: this.options.sourceOperatorId,
      targetId,
    });
    this.options.semanticEvents.emit({
      kind: isAirborne ? 'airborneOutput' : 'knockDownOutput',
      sourceOperatorId: this.options.sourceOperatorId,
      targetId,
    });
    this.options.emitPhysicalInfliction({
      sourceId: this.options.sourceOperatorId,
      targetId,
      type: isAirborne ? 'airborne' : 'knockDown',
      ...(context?.skillCastInfo === undefined ? {} : { skillCastInfo: context.skillCastInfo }),
      ...(context?.attachBuffToCurrentSkill === undefined
        ? {}
        : { attachBuffToCurrentSkill: context.attachBuffToCurrentSkill }),
    });
    return true;
  }

  end(step: ResolvedCombatOperationStep, context?: CombatOperationContext): void {
    if (
      step.kind === 'outputAirborne' ||
      step.kind === 'outputKnockDown' ||
      step.kind === 'setCharacterPassiveUiValue'
    )
      return;
    this.options.delegate.end?.(step, context);
  }

  evaluate(condition: CombatCondition, context?: CombatOperationContext): boolean {
    return context === undefined
      ? this.options.delegate.evaluate(condition)
      : this.options.delegate.evaluate(condition, context);
  }
}
