import type {
  ResolvedCombatOperationStep,
  ResolvedCombatStepForKind,
} from '../../compiler/combatProgram';
import type { CombatCondition } from '../../game-data/operatorDefinition';
import type { CombatSkillCastInfo } from '../state/foundationState';
import type { CombatOperationContext, CombatOperationExecutor } from './skillRuntime';
import { operationProducer } from '../receipt/combatObjectIdentity';
import type { CombatObjectRef } from '../receipt/combatReceipt';
import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';

type CastStep = ResolvedCombatStepForKind<'castSkillDuringAction'>;

export interface SkillCastOperationExecutorDependencies {
  readonly casterId: string;
  readonly request: (request: {
    readonly nativeSkillId: string;
    readonly inputTarget: RuntimeTargetRef | null;
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
    let contextTarget: RuntimeTargetRef | null = null;
    if (step.parameters.target === 'context') {
      const key = step.parameters.targetContextKey;
      if (!key || context?.targetContext === undefined)
        throw new Error('deferred skill cast requires its named target context');
      const targets = context.targetContext.get(key);
      if (targets.length > 1)
        throw new Error('deferred skill cast does not yet support a multi-entity input target');
      contextTarget = targets[0] ?? null;
    }
    const inputTarget =
      step.parameters.target === 'context'
        ? contextTarget
        : step.parameters.target === 'actionInputTarget'
          ? (context?.actionInputTarget ?? null)
          : step.parameters.target === 'enemy'
            ? { kind: 'enemy' as const }
            : { kind: 'operator' as const, operatorId: this.dependencies.casterId };
    const inherited = step.parameters.inheritSourceSkillCastInfo
      ? context?.skillCastInfo
      : undefined;
    if (step.parameters.inheritSourceSkillCastInfo && inherited === undefined) {
      throw new Error('deferred skill cast requires source SkillCastInfo');
    }
    const nativeSkillId = resolveNativeSkillId(step.parameters.skillId, context);
    this.dependencies.request({
      nativeSkillId,
      inputTarget: inputTarget === null ? null : { ...inputTarget },
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
