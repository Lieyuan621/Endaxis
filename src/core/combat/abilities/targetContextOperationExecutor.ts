import type { CombatCondition } from '../../game-data/operatorDefinition';
import type { ResolvedCombatStepForKind } from '../../compiler/combatProgram';
import { abilityEventSourceId, abilityEventTargetId } from '../events/combatAbilityEvent';
import { runtimeTargetFromEntityId } from '../../game-data/logicalAbilityEntity';
import type { CombatObjectType } from '../../../../packages/game-data-contract/src/primitives';
import { matchesCombatObjectType, resolveCombatObjectType } from './combatObjectType';
import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import type { CombatOperationContext, CombatOperationExecutor } from '../skills/skillRuntime';
import type { CombatVitals } from '../resources/combatVitals';
import { resolveActionValueOperand } from '../actions/actionBlackboard';

export interface CharacterTeamTargetQueryDependencies {
  readonly listOperatorIds: () => readonly string[];
  readonly isOperatorControlled: (operatorId: string) => boolean;
  readonly resolveVitals: (operatorId: string) => CombatVitals;
}

/** 执行不依赖空间的通用 Context 目标组集合操作。 */
export class TargetContextOperationExecutor implements CombatOperationExecutor {
  #nextSpatialPointId = 1;
  constructor(
    readonly operatorId: string,
    readonly delegate: CombatOperationExecutor,
    readonly resolveAbilitySystemSourceId: (id: string) => string = id => id,
    readonly characterTeam?: CharacterTeamTargetQueryDependencies,
    /** 单层原生来源查询，不能传入递归追溯到干员的旧解析端口。 */
    readonly findAbilitySystemSource?: (ownerId: string) => RuntimeTargetRef,
    /** 共用实体句柄不代表共用原生类型；正式装配从实例目录查询。 */
    readonly resolveAbilityEntityObjectType?: (instanceId: number) => CombatObjectType,
    readonly listUnfinishedProjectiles?: () => readonly RuntimeTargetRef[],
  ) {}

  execute(step: ResolvedCombatOperationStep, context?: CombatOperationContext): boolean {
    if (step.kind === 'findUnfinishedProjectileTargets') {
      if (context?.targetContext === undefined || this.listUnfinishedProjectiles === undefined)
        throw new Error('projectile query requires a target context and projectile directory');
      context.targetContext.set(step.parameters.saveToContextKey, this.listUnfinishedProjectiles());
      return true;
    }
    if (step.kind === 'findCharacterTeamTargets') {
      this.#findCharacterTeamTargets(step, context);
      return true;
    }
    if (step.kind === 'createSpatialPointTargets') {
      if (context?.targetContext === undefined) {
        throw new Error('createSpatialPointTargets requires a combat target context');
      }
      const count = resolveActionValueOperand(step.parameters.count, context.blackboard);
      if (!Number.isInteger(count) || count < 0) {
        throw new RangeError('spatial point count must be a non-negative integer');
      }
      context.targetContext.set(
        step.parameters.saveToContextKey,
        Array.from({ length: count }, () => ({
          kind: 'spatialPoint' as const,
          pointId: this.#nextSpatialPointId++,
        })),
      );
      return true;
    }
    if (step.kind !== 'mergeContextTargets') {
      return context === undefined
        ? this.delegate.execute(step)
        : this.delegate.execute(step, context);
    }
    if (context?.targetContext === undefined) {
      throw new Error('mergeContextTargets requires a combat target context');
    }
    const targets: RuntimeTargetRef[] = [];
    for (const source of step.parameters.sources) {
      const additions =
        source.kind === 'context'
          ? context.targetContext.get(source.contextKey)
          : source.kind === 'abilitySystemSource'
            ? [this.#findAbilitySystemSource(source.owner, context)]
            : [this.#resolveTarget(source.target, context)];
      for (const target of additions) {
        if (!targets.some(existing => sameTarget(existing, target))) targets.push(target);
      }
    }
    context.targetContext.set(step.parameters.saveToContextKey, targets);
    return true;
  }

  #findAbilitySystemSource(
    owner: 'actionOwner' | 'actionSource',
    context: CombatOperationContext,
  ): RuntimeTargetRef {
    if (this.findAbilitySystemSource === undefined) {
      throw new Error('SourceFinder requires a single-level AbilitySystem source query');
    }
    const ownerId =
      owner === 'actionOwner'
        ? (context.actionOwnerId ?? context.buffOwnerId)
        : (context.actionSourceId ?? context.buffSourceId);
    // 本轮只接入带明确身份的 Buff/动作回调；定义所属干员不等于实体子技能的动作宿主。
    if (ownerId === undefined) throw new Error(`SourceFinder ${owner} identity is unavailable`);
    return this.findAbilitySystemSource(ownerId);
  }

  #findCharacterTeamTargets(
    step: ResolvedCombatStepForKind<'findCharacterTeamTargets'>,
    context: CombatOperationContext | undefined,
  ): void {
    if (context?.targetContext === undefined) {
      throw new Error('findCharacterTeamTargets requires a combat target context');
    }
    const query = this.characterTeam;
    if (query === undefined) {
      throw new Error('findCharacterTeamTargets requires a character-team query runtime');
    }
    const selection = step.parameters.selection;
    let operatorIds = [...new Set(query.listOperatorIds())];
    if (selection.kind === 'allOperators') {
      // Keep the stable party order supplied by the scenario runtime.
    } else if (selection.kind === 'controlledOperator') {
      operatorIds = operatorIds.filter(query.isOperatorControlled);
    } else {
      if (selection.excludeCaster === true) {
        operatorIds = operatorIds.filter(operatorId => operatorId !== this.operatorId);
      }
      if (selection.excludeCurrentTarget === true) {
        const current = context.currentTarget;
        if (current?.kind !== 'operator') {
          throw new Error('excludeCurrentTarget requires a current operator target');
        }
        operatorIds = operatorIds.filter(operatorId => operatorId !== current.operatorId);
      }
      if (selection.excludedContextKey !== undefined) {
        const excludedIds = new Set(
          context.targetContext
            .get(selection.excludedContextKey)
            .filter(target => target.kind === 'operator')
            .map(target => target.operatorId),
        );
        operatorIds = operatorIds.filter(operatorId => !excludedIds.has(operatorId));
      }
      operatorIds = this.#selectLowestHealthRatio(operatorIds, query);
    }
    context.targetContext.set(
      step.parameters.saveToContextKey,
      operatorIds.map(operatorId => ({ kind: 'operator', operatorId })),
    );
  }

  #selectLowestHealthRatio(
    operatorIds: readonly string[],
    query: CharacterTeamTargetQueryDependencies,
  ): string[] {
    const candidates = operatorIds.map(operatorId => {
      const vitals = query.resolveVitals(operatorId);
      return { operatorId, ratio: vitals.health / vitals.maxHealth };
    });
    if (candidates.length === 0) return [];
    const minimumRatio = Math.min(...candidates.map(candidate => candidate.ratio));
    // 原生把 0.001 内视为同优先级，再用运行时对象哈希打破平局。对象哈希无法跨
    // 数据导出稳定复现；产品模型明确投影为稳定实例 ID 顺序，同时保留原生容差边界。
    const selected = candidates
      .filter(candidate => candidate.ratio - minimumRatio < 0.001)
      .sort((left, right) =>
        left.operatorId < right.operatorId ? -1 : left.operatorId > right.operatorId ? 1 : 0,
      )[0]!;
    return [selected.operatorId];
  }

  end(step: ResolvedCombatOperationStep, context?: CombatOperationContext): void {
    this.delegate.end?.(step, context);
  }

  evaluate(condition: CombatCondition, context?: CombatOperationContext): boolean {
    if (condition.kind === 'contextTargetObjectTypeMatch') {
      if (context?.targetContext === undefined)
        throw new Error('object type check requires a combat target context');
      return (context.targetContext.getOptional(condition.contextKey) ?? []).some(target => {
        return matchesCombatObjectType(
          condition.objectTypes,
          resolveCombatObjectType(target, this.resolveAbilityEntityObjectType),
        );
      });
    }
    if (condition.kind === 'contextTargetIdentityMatch') {
      if (context?.targetContext === undefined) {
        throw new Error('context target identity check requires a combat target context');
      }
      const target = context.targetContext.getOptional(condition.contextKey)?.[0];
      const matches =
        target !== undefined &&
        (condition.other === 'controlledOperator'
          ? target.kind === 'operator' &&
            this.characterTeam !== undefined &&
            this.characterTeam.isOperatorControlled(target.operatorId)
          : targetId(target) ===
            (condition.other === 'actionSource' ? context.actionSourceId : context.actionOwnerId));
      return condition.operator === 'equal' ? matches : !matches;
    }
    if (condition.kind !== 'contextTargetContains') {
      return context === undefined
        ? this.delegate.evaluate(condition)
        : this.delegate.evaluate(condition, context);
    }
    if (context?.targetContext === undefined) {
      throw new Error('contextTargetContains requires a combat target context');
    }
    const child = this.#resolveTarget(condition.child, context);
    return context.targetContext
      .get(condition.parentContextKey)
      .some(target => sameTarget(target, child));
  }

  #resolveTarget(
    target: 'caster' | 'enemy' | 'eventTarget' | 'eventSource' | 'buffSource' | 'currentTarget',
    context: CombatOperationContext,
  ): RuntimeTargetRef {
    if (target === 'caster') return { kind: 'operator', operatorId: this.operatorId };
    if (target === 'enemy') return { kind: 'enemy' };
    if (target === 'eventSource') {
      const event = context.event;
      const sourceId =
        event === undefined
          ? undefined
          : 'payload' in event
            ? abilityEventSourceId(event)
            : 'sourceId' in event
              ? event.sourceId
              : 'sourceOperatorId' in event
                ? event.sourceOperatorId
                : undefined;
      if (typeof sourceId !== 'string')
        throw new Error('eventSource requires a combat event with source identity');
      return runtimeTargetFromEntityId(sourceId);
    }
    if (target === 'buffSource') {
      if (context.buffSourceId === undefined) {
        throw new Error('buffSource requires a Buff lifecycle context');
      }
      const sourceId = this.resolveAbilitySystemSourceId(context.buffSourceId);
      return sourceId === 'enemy' ? { kind: 'enemy' } : { kind: 'operator', operatorId: sourceId };
    }
    if (target === 'currentTarget') {
      if (context.currentTarget === undefined) {
        throw new Error('currentTarget requires a forEach combat target');
      }
      return context.currentTarget;
    }
    const targetId = eventTargetId(context);
    return targetId === 'enemy' ? { kind: 'enemy' } : { kind: 'operator', operatorId: targetId };
  }
}

function targetId(target: RuntimeTargetRef): string | undefined {
  if (target.kind === 'enemy') return 'enemy';
  if (target.kind === 'operator') return target.operatorId;
  if (target.kind === 'abilityEntity') return `abilityEntity:${target.instanceId}`;
  return undefined;
}

function eventTargetId(context: CombatOperationContext): string {
  const event = context.event;
  if (event !== undefined && 'payload' in event) {
    const target = abilityEventTargetId(event);
    if (target === undefined)
      throw new Error('eventTarget requires a combat event with target identity');
    return target;
  }
  if (event === undefined || !('targetId' in event)) {
    throw new Error('eventTarget requires a combat event with target identity');
  }
  return event.targetId;
}

function sameTarget(left: RuntimeTargetRef, right: RuntimeTargetRef): boolean {
  if (left.kind !== right.kind) return false;
  if (left.kind === 'enemy') return true;
  if (left.kind === 'operator' && right.kind === 'operator') {
    return left.operatorId === right.operatorId;
  }
  if (left.kind === 'spatialPoint' && right.kind === 'spatialPoint') {
    return left.pointId === right.pointId;
  }
  return (
    left.kind === 'abilityEntity' &&
    right.kind === 'abilityEntity' &&
    left.instanceId === right.instanceId
  );
}
