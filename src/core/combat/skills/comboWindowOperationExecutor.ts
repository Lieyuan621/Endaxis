import type { CompiledCondition } from '../../compiler/compiledGraphData.ts';

import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
/** 把技能调度中的开启连携窗口步骤接到场景级连携账本。 */
import type { CombatOperationContext, CombatOperationExecutor } from './skillRuntime';
import type { ComboWindowRuntime } from './comboWindowRuntime';
import { resolveActionValueOperand } from '../actions/actionBlackboard';
export class ComboWindowOperationExecutor implements CombatOperationExecutor {
  constructor(
    readonly operatorId: string,
    readonly windows: ComboWindowRuntime,
    readonly delegate: CombatOperationExecutor,
    readonly resolveCurrentSkillKey: (
      skillSlotKey: 'comboSkill',
      operatorId: string,
    ) => string = () => {
      throw new Error('current combo skill slot resolver is unavailable');
    },
    readonly queryTargets: NonNullable<CombatOperationExecutor['queryTargets']> = () => {
      throw new Error('combo condition target query is unavailable');
    },
    readonly canTriggerComboSkill: (ownerId: string, skillKey: string) => boolean = () => {
      throw new Error('native combo pending eligibility is unavailable');
    },
  ) {}

  execute(step: ResolvedCombatOperationStep, context?: CombatOperationContext): boolean {
    if (step.kind === 'queueComboLock') {
      if (!context) throw new Error('combo lock requires action context');
      this.windows.queueLock(
        resolveActionValueOperand(step.parameters.durationSeconds, context.blackboard),
      );
      return true;
    }
    if (step.kind === 'openComboWindow') {
      if ('owner' in step.parameters && step.parameters.owner !== undefined) {
        if (!context) throw new Error('native combo pending requires an action context');
        const parameters = step.parameters;
        const owner = this.queryTargets(step.parameters.owner, context)[0];
        if (owner?.kind !== 'operator') return false;
        const skillKey = this.resolveCurrentSkillKey(
          parameters.nextSkillKeyFromSlot,
          owner.operatorId,
        );
        if (!this.canTriggerComboSkill(owner.operatorId, skillKey)) return false;
        if (parameters.target === undefined)
          throw new Error('native combo pending requires a target query');
        const targets = this.queryTargets(parameters.target, context);
        if (targets.length !== 1)
          throw new Error('native combo pending currently requires one input target');
        let triggerTarget: RuntimeTargetRef | null = null;
        if (parameters.trigger !== undefined) {
          const triggers = this.queryTargets(parameters.trigger, context);
          if (triggers.length !== 1)
            throw new Error('native combo pending currently requires one trigger target');
          triggerTarget = triggers[0]!;
        }
        this.windows.open(
          owner.operatorId,
          skillKey,
          {},
          {
            skillSlotKey: parameters.nextSkillKeyFromSlot,
            inputTarget: targets[0]!,
            triggerTarget,
            assignPairs: null,
          },
        );
        return true;
      }
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
    return context === undefined
      ? this.delegate.execute(step)
      : this.delegate.execute(step, context);
  }

  end(step: ResolvedCombatOperationStep, context?: CombatOperationContext): void {
    if (step.kind === 'openComboWindow' || step.kind === 'queueComboLock') return;
    if (context === undefined) this.delegate.end?.(step);
    else this.delegate.end?.(step, context);
  }

  evaluate(condition: CompiledCondition, context?: CombatOperationContext): boolean {
    if (condition.kind === 'comboSkillPending') {
      if (context === undefined)
        throw new Error('comboSkillPending requires a combat operation context');
      const target = this.queryTargets(condition.target, context)[0];
      return target?.kind === 'operator' && this.windows.hasPending(target.operatorId);
    }
    return context === undefined
      ? this.delegate.evaluate(condition)
      : this.delegate.evaluate(condition, context);
  }
}
