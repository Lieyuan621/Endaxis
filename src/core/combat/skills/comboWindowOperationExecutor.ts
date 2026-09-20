import type { CombatCondition } from '../../game-data/operatorDefinition';
import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
/** 把技能调度中的开启连携窗口步骤接到场景级连携账本。 */
import type { CombatOperationContext, CombatOperationExecutor } from './skillRuntime';
import type { ComboWindowRuntime } from './comboWindowRuntime';
import { COMBAT_FRAMES_PER_SECOND } from '../time/combatClock';
import { resolveActionValueOperand } from '../actions/actionBlackboard';
import { CombatOperationPrograms } from '../actions/combatOperationPrograms';
import type { ComboWindowActionState } from '../state/actionState';

export class ComboWindowOperationExecutor implements CombatOperationExecutor {
  readonly runtimeState: ComboWindowActionState;
  readonly programs: CombatOperationPrograms;
  constructor(
    readonly operatorId: string,
    readonly windows: ComboWindowRuntime,
    readonly delegate: CombatOperationExecutor,
    readonly resolveCurrentSkillKey: (
      skillGroupKey: 'comboSkill',
      operatorId: string,
    ) => string = () => {
      throw new Error('current combo skill slot resolver is unavailable');
    },
    restored?: {
      readonly state: ComboWindowActionState;
      readonly programs: CombatOperationPrograms;
    },
  ) {
    this.runtimeState = restored?.state ?? { ringQteRegistrations: new Map() };
    this.programs = restored?.programs ?? new CombatOperationPrograms();
  }

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
    if (step.kind === 'showComboRingQte') {
      if (context === undefined) throw new Error('combo ring QTE requires an operation context');
      const earlyDurationSeconds = resolveActionValueOperand(
        step.parameters.earlyDurationSeconds,
        context.blackboard,
      );
      const activeDurationSeconds = resolveActionValueOperand(
        step.parameters.activeDurationSeconds,
        context.blackboard,
      );
      const slot = this.programs.slot(step);
      const registrations = this.runtimeState.ringQteRegistrations.get(slot) ?? new Map();
      registrations.set(
        context.blackboard.runtimeState,
        this.windows.registerRingQte(
          this.operatorId,
          Math.fround(earlyDurationSeconds) * COMBAT_FRAMES_PER_SECOND,
          Math.fround(activeDurationSeconds) * COMBAT_FRAMES_PER_SECOND,
        ),
      );
      this.runtimeState.ringQteRegistrations.set(slot, registrations);
      return true;
    }
    return context === undefined
      ? this.delegate.execute(step)
      : this.delegate.execute(step, context);
  }

  end(step: ResolvedCombatOperationStep, context?: CombatOperationContext): void {
    if (step.kind === 'openComboWindow') return;
    if (step.kind === 'showComboRingQte') {
      if (context === undefined) return;
      const slot = this.programs.slot(step);
      const registrations = this.runtimeState.ringQteRegistrations.get(slot);
      const registration = registrations?.get(context.blackboard.runtimeState);
      if (registration !== undefined) this.windows.unregisterRingQte(registration);
      registrations?.delete(context.blackboard.runtimeState);
      if (registrations?.size === 0) this.runtimeState.ringQteRegistrations.delete(slot);
      return;
    }
    if (context === undefined) this.delegate.end?.(step);
    else this.delegate.end?.(step, context);
  }

  evaluate(condition: CombatCondition, context?: CombatOperationContext): boolean {
    if (condition.kind === 'casterComboPending') return this.windows.hasPending(this.operatorId);
    if (condition.kind === 'eventComboRingQteSucceeded') {
      const skillCastId = context?.eventSkillCastInfo?.skillCastId;
      if (skillCastId === undefined)
        throw new Error('combo ring QTE success requires a skill cast event context');
      return this.windows.wasRingQteSuccessful(skillCastId);
    }
    return context === undefined
      ? this.delegate.evaluate(condition)
      : this.delegate.evaluate(condition, context);
  }
}
