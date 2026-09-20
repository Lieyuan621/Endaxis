import type { CombatCondition } from '../../game-data/operatorDefinition';
import type { CombatOperationContext } from './skillRuntime';
/** 切换稳定技能组后续释放形态；当前释放已经持有的 SkillRuntime 引用不会改变。 */
import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import type { CombatOperationExecutor } from './skillRuntime';
import type { NativeSkillType } from '../../game-data/operatorDefinition';
import { resolveActionValueOperand } from '../actions/actionBlackboard';

export interface SkillSlotOperationExecutorOptions {
  readonly changeSkillSlot: (
    skillGroupKey: string,
    targetSkillKey: string,
    inheritOriginSkillCooldownProgress: boolean,
  ) => void;
  readonly replaceSkillSlot?: (parameters: {
    readonly skillGroupKey: string;
    readonly targetSkillKey: string;
    readonly revertedSkillKey?: string;
    readonly inheritOriginSkillCooldownProgress: boolean;
  }) => number;
  readonly finishSkillSlotReplacement?: (skillGroupKey: string, registrationId: number) => void;
  readonly activatePlayerActionMode?: (modeId: string) => number;
  readonly finishPlayerActionMode?: (registrationId: number) => void;
  readonly overrideBasicAttackMapping?: (skillId: string) => number;
  readonly finishBasicAttackMapping?: (registrationId: number) => void;
  readonly setMultiDashLimit?: (limit: number | null) => void;
  readonly changeNativeSkillType?: (skillKey: string, nativeSkillType: NativeSkillType) => void;
  readonly delegate: CombatOperationExecutor;
}

export class SkillSlotOperationExecutor implements CombatOperationExecutor {
  constructor(readonly options: SkillSlotOperationExecutorOptions) {}

  execute(step: ResolvedCombatOperationStep, context?: CombatOperationContext): boolean {
    if (step.kind === 'overrideBasicAttackMapping') {
      const register = this.options.overrideBasicAttackMapping;
      const finish = this.options.finishBasicAttackMapping;
      const state = context?.actionRegistrationState;
      if (register === undefined || finish === undefined || state === undefined)
        throw new Error('basic-attack mapping requires action state and lifecycle ports');
      if (state.registrationId !== null) finish(state.registrationId);
      state.registrationId = register(step.parameters.skillId);
      return true;
    }
    if (step.kind === 'changePlayerActionMode') {
      const activate = this.options.activatePlayerActionMode;
      const finish = this.options.finishPlayerActionMode;
      const state = context?.actionRegistrationState;
      if (activate === undefined || finish === undefined || state === undefined)
        throw new Error('native player-action mode requires action state and lifecycle ports');
      if (state.registrationId !== null) finish(state.registrationId);
      state.registrationId = activate(step.parameters.modeId);
      return true;
    }
    if (step.kind === 'overrideMultiDashLimit') {
      const setLimit = this.options.setMultiDashLimit;
      const state = context?.actionRegistrationState;
      if (setLimit === undefined || context === undefined || state === undefined)
        throw new Error('multi-dash limit requires action state and lifecycle ports');
      const raw = resolveActionValueOperand(step.parameters.dashCount, context.blackboard);
      const nativeLimit = Math.trunc(raw);
      setLimit(nativeLimit < 0 ? 0x7fffffff : nativeLimit);
      state.registrationId = 0;
      return true;
    }
    if (step.kind === 'changeNativeSkillType') {
      const change = this.options.changeNativeSkillType;
      if (change === undefined) throw new Error('native SkillType mutation is unavailable');
      change(step.parameters.targetSkillKey, step.parameters.nativeSkillType);
      return true;
    }
    if (step.kind !== 'changeSkillSlot') {
      return context === undefined
        ? this.options.delegate.execute(step)
        : this.options.delegate.execute(step, context);
    }
    if (step.parameters.lifetime !== undefined) {
      const replace = this.options.replaceSkillSlot;
      const finish = this.options.finishSkillSlotReplacement;
      const state = context?.actionRegistrationState;
      if (replace === undefined || finish === undefined || state === undefined)
        throw new Error('skill-slot replacement requires action state and lifecycle ports');
      if (state.registrationId !== null)
        finish(step.parameters.skillGroupKey, state.registrationId);
      state.registrationId = replace({
        skillGroupKey: step.parameters.skillGroupKey,
        targetSkillKey: step.parameters.targetSkillKey,
        ...(step.parameters.revertedSkillKey === undefined
          ? {}
          : { revertedSkillKey: step.parameters.revertedSkillKey }),
        inheritOriginSkillCooldownProgress:
          step.parameters.inheritOriginSkillCooldownProgress ?? false,
      });
    } else {
      this.options.changeSkillSlot(
        step.parameters.skillGroupKey,
        step.parameters.targetSkillKey,
        step.parameters.inheritOriginSkillCooldownProgress ?? false,
      );
    }
    return true;
  }

  end(step: ResolvedCombatOperationStep, context?: CombatOperationContext): void {
    if (step.kind === 'overrideBasicAttackMapping') {
      const state = context?.actionRegistrationState;
      const finish = this.options.finishBasicAttackMapping;
      if (state === undefined || finish === undefined)
        throw new Error('basic-attack mapping requires action state and lifecycle ports');
      if (state.registrationId !== null) finish(state.registrationId);
      state.registrationId = null;
      return;
    }
    if (step.kind === 'changeSkillSlot') {
      if (step.parameters.lifetime === 'finishByAction') {
        const state = context?.actionRegistrationState;
        const finish = this.options.finishSkillSlotReplacement;
        if (state === undefined || finish === undefined)
          throw new Error('skill-slot replacement requires action state and lifecycle ports');
        if (state.registrationId !== null)
          finish(step.parameters.skillGroupKey, state.registrationId);
        state.registrationId = null;
      }
      return;
    }
    if (step.kind === 'changePlayerActionMode') {
      const state = context?.actionRegistrationState;
      const finish = this.options.finishPlayerActionMode;
      if (state === undefined || finish === undefined)
        throw new Error('native player-action mode requires action state and lifecycle ports');
      if (state.registrationId !== null) finish(state.registrationId);
      state.registrationId = null;
      return;
    }
    if (step.kind === 'overrideMultiDashLimit') {
      const state = context?.actionRegistrationState;
      const setLimit = this.options.setMultiDashLimit;
      if (state === undefined || setLimit === undefined)
        throw new Error('multi-dash limit requires action state and lifecycle ports');
      if (state.registrationId !== null) setLimit(null);
      state.registrationId = null;
      return;
    }
    this.options.delegate.end?.(step, context);
  }

  evaluate(condition: CombatCondition, context?: CombatOperationContext): boolean {
    return context === undefined
      ? this.options.delegate.evaluate(condition)
      : this.options.delegate.evaluate(condition, context);
  }
}
