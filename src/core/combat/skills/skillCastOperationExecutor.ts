import type {
  ResolvedCombatOperationStep,
  ResolvedCombatStepForKind,
} from '../../compiler/combatProgram';
import type { CombatCondition } from '../../game-data/operatorDefinition';
import type { CombatSkillCastInfo } from '../state/foundationState';
import type { CombatOperationContext, CombatOperationExecutor } from './skillRuntime';
import { operationProducer } from '../receipt/combatObjectIdentity';
import type { CombatObjectRef } from '../receipt/combatReceipt';

type CastStep = ResolvedCombatStepForKind<'castSkillDuringAction'>;

export interface SkillCastOperationExecutorDependencies {
  readonly request: (request: {
    readonly nativeSkillId: string;
    readonly skipApplyCost: boolean;
    readonly inheritedSkillCastInfo?: CombatSkillCastInfo;
    readonly interruptCurrentSkillOnlyWhenTargetCastable?: boolean;
    readonly producedBy?: CombatObjectRef;
  }) => void;
  readonly delegate: CombatOperationExecutor;
}

/** 对应 AbilitySystem.m_postSkillTryCastRequest：同步动作只覆盖写单槽请求。 */
export class SkillCastOperationExecutor implements CombatOperationExecutor {
  constructor(readonly dependencies: SkillCastOperationExecutorDependencies) {}

  execute(step: ResolvedCombatOperationStep, context?: CombatOperationContext): boolean {
    if (step.kind !== 'castSkillDuringAction') {
      return this.dependencies.delegate.execute(step, context);
    }
    this.#request(step, context);
    return true;
  }

  end(step: ResolvedCombatOperationStep, context?: CombatOperationContext): void {
    if (step.kind === 'castSkillDuringAction') return;
    this.dependencies.delegate.end?.(step, context);
  }

  evaluate(condition: CombatCondition, context?: CombatOperationContext): boolean {
    return this.dependencies.delegate.evaluate(condition, context);
  }

  #request(step: CastStep, context: CombatOperationContext | undefined): void {
    if (step.parameters.target !== 'enemy' && step.parameters.target !== 'caster') {
      throw new Error(`unsupported deferred skill cast target '${step.parameters.target}'`);
    }
    const inherited = step.parameters.inheritSourceSkillCastInfo
      ? context?.skillCastInfo
      : undefined;
    if (step.parameters.inheritSourceSkillCastInfo && inherited === undefined) {
      throw new Error('deferred skill cast requires source SkillCastInfo');
    }
    const nativeSkillId = resolveNativeSkillId(step.parameters.skillId, context);
    this.dependencies.request({
      nativeSkillId,
      skipApplyCost: step.parameters.skipApplyCost,
      producedBy: operationProducer(context),
      ...(step.parameters.interruptCurrentSkillOnlyWhenTargetCastable
        ? { interruptCurrentSkillOnlyWhenTargetCastable: true }
        : {}),
      ...(inherited === undefined ? {} : { inheritedSkillCastInfo: inherited }),
    });
  }
}

function resolveNativeSkillId(
  operand: string | { readonly blackboardKey: string },
  context: CombatOperationContext | undefined,
): string {
  if (typeof operand === 'string') return operand;
  const value = context?.blackboard.getString(operand.blackboardKey);
  if (value === undefined || value.length === 0) {
    throw new Error(`deferred skill id blackboard '${operand.blackboardKey}' is missing`);
  }
  return value;
}
