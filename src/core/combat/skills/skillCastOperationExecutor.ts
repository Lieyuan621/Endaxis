import type { CompiledTargetQuery } from '../../compiler/compiledGraphData';

import { stringInputExpression } from '../../compiler/compiledGraphData';
import type { CompiledStringInput, CompiledCondition } from '../../compiler/compiledGraphData.ts';

import type {
  ResolvedCombatOperationStep,
  ResolvedCombatStepForKind,
} from '../../compiler/combatProgram';

import type { CombatSkillCastInfo } from '../state/foundationState';
import type { CombatOperationContext, CombatOperationExecutor } from './skillRuntime';
import { operationProducer } from '../receipt/combatObjectIdentity';
import type { CombatObjectRef } from '../receipt/combatReceipt';
import {
  firstRuntimeEntityTarget,
  type RuntimeTargetRef,
} from '../../game-data/logicalAbilityEntity';

type CastStep = ResolvedCombatStepForKind<'castSkillDuringAction'>;

export interface SkillCastOperationExecutorDependencies {
  readonly casterId: string;
  readonly queryTargets?: (
    query: CompiledTargetQuery,
    context: CombatOperationContext,
  ) => readonly RuntimeTargetRef[];
  readonly interruptCurrentSkill?: (target: RuntimeTargetRef) => void;
  readonly request: (
    request: {
      readonly nativeSkillId: string;
      readonly inputTarget: RuntimeTargetRef | null;
      readonly skipApplyCost: boolean;
      readonly inheritedSkillCastInfo?: CombatSkillCastInfo;
      readonly interruptCurrentSkillOnlyWhenTargetCastable?: boolean;
      readonly producedBy?: CombatObjectRef;
    },
    caster?: RuntimeTargetRef,
    context?: CombatOperationContext,
  ) => void;
  readonly delegate: CombatOperationExecutor;
}

/** 对应 AbilitySystem.m_postSkillTryCastRequest：同步动作只覆盖写单槽请求。 */
export class SkillCastOperationExecutor implements CombatOperationExecutor {
  constructor(readonly dependencies: SkillCastOperationExecutorDependencies) {}

  execute(step: ResolvedCombatOperationStep, context?: CombatOperationContext): boolean {
    if (step.kind === 'interruptCurrentSkill') {
      const { queryTargets, interruptCurrentSkill } = this.dependencies;
      if (!queryTargets || !interruptCurrentSkill || !context)
        throw new Error('skill interruption requires target bindings');
      const target = firstRuntimeEntityTarget(queryTargets(step.parameters.targets, context));
      if (target !== undefined) interruptCurrentSkill(target);
      return true;
    }
    if (step.kind !== 'castSkillDuringAction') {
      return this.dependencies.delegate.execute(step, context);
    }
    return this.#request(step, context);
  }

  end(step: ResolvedCombatOperationStep, context?: CombatOperationContext): void {
    if (step.kind === 'castSkillDuringAction' || step.kind === 'interruptCurrentSkill') return;
    this.dependencies.delegate.end?.(step, context);
  }

  evaluate(condition: CompiledCondition, context?: CombatOperationContext): boolean {
    return this.dependencies.delegate.evaluate(condition, context);
  }

  #request(step: CastStep, context: CombatOperationContext | undefined): boolean {
    let caster: RuntimeTargetRef | undefined;
    if (step.parameters.caster !== undefined) {
      if (!context || !this.dependencies.queryTargets)
        throw new Error('deferred skill caster requires target bindings');
      // 原生 GetFirstTarget 读取首个实体；位置包装不占用施法者槽位。
      caster = firstRuntimeEntityTarget(
        this.dependencies.queryTargets(step.parameters.caster, context),
      );
      if (caster === undefined) return false;
      if (caster.kind !== 'operator' && caster.kind !== 'abilityEntity')
        throw new Error('deferred skill caster requires a skill host');
    }
    let contextTarget: RuntimeTargetRef | null = null;
    if (typeof step.parameters.target === 'object' || step.parameters.target === 'enemy') {
      if (!context || !this.dependencies.queryTargets)
        throw new Error('deferred skill target requires target bindings');
      const targets = this.dependencies.queryTargets(
        step.parameters.target === 'enemy'
          ? { kind: 'fixed', target: 'enemy' }
          : step.parameters.target,
        context,
      );
      // 普通延迟施法没有开启 AllowMultiInputTarget，Skill.SaveTarget 保存首项。
      contextTarget = targets[0] ?? null;
    } else if (step.parameters.target === 'context') {
      const key = step.parameters.targetContextKey;
      if (!key || context?.targetContext === undefined)
        throw new Error('deferred skill cast requires its named target context');
      const targets = context.targetContext.get(key);
      contextTarget = targets[0] ?? null;
    }
    const inputTarget =
      step.parameters.target === 'context' ||
      step.parameters.target === 'enemy' ||
      typeof step.parameters.target === 'object'
        ? contextTarget
        : step.parameters.target === 'actionInputTarget'
          ? (context?.actionInputTargets?.[0] ?? null)
          : { kind: 'operator' as const, operatorId: this.dependencies.casterId };
    const inherited = step.parameters.inheritSourceSkillCastInfo
      ? context?.skillCastInfo
      : undefined;
    if (step.parameters.inheritSourceSkillCastInfo && inherited === undefined) {
      throw new Error('deferred skill cast requires source SkillCastInfo');
    }
    const nativeSkillId = resolveNativeSkillId(step.parameters.skillId, context);
    const request = {
      nativeSkillId,
      inputTarget: inputTarget === null ? null : { ...inputTarget },
      skipApplyCost: step.parameters.skipApplyCost,
      producedBy: operationProducer(context),
      ...(step.parameters.interruptCurrentSkillOnlyWhenTargetCastable
        ? { interruptCurrentSkillOnlyWhenTargetCastable: true }
        : {}),
      ...(inherited === undefined ? {} : { inheritedSkillCastInfo: inherited }),
    };
    if (caster === undefined) this.dependencies.request(request);
    else this.dependencies.request(request, caster, context);
    return true;
  }
}

function resolveNativeSkillId(
  operand: CompiledStringInput,
  context: CombatOperationContext | undefined,
): string {
  const expression = stringInputExpression(operand);
  if (typeof expression === 'string') return expression;
  const value = context?.blackboard.getString(expression.blackboardKey);
  if (value === undefined || value.length === 0) {
    throw new Error(`deferred skill id blackboard '${expression.blackboardKey}' is missing`);
  }
  return value;
}
