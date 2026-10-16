import type { ActionTargetQuery } from '../../../../packages/game-data-contract/src/conditions';
import type { CompiledCondition } from '../../compiler/compiledGraphData.ts';
import type { OwnerSpawnedAbilityEntityQuery } from '../../game-data/logicalAbilityEntity';
import {
  sameRuntimeTarget as sameTarget,
  resolveOperationPartTransferInfo,
} from './runtimeTargetContext';

import type { CombatObjectType } from '../../../../packages/game-data-contract/src/primitives';
import type {
  ResolvedCombatOperationStep,
  ResolvedCombatStepForKind,
} from '../../compiler/combatProgram';
import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import {
  runtimeTargetEntityId,
  runtimeTargetFromEntityId,
} from '../../game-data/logicalAbilityEntity';
import { compareCombatNumbers } from '../../math/combatNumbers';
import { resolveActionValueOperand } from '../actions/actionBlackboard';
import { abilityEventSourceId, abilityEventTargetId } from '../events/combatAbilityEvent';
import type { CombatVitals } from '../resources/combatVitals';
import type { CombatOperationContext, CombatOperationExecutor } from '../skills/skillRuntime';
import type { SpatialPointIdentityState } from '../state/environmentState';
import { matchesCombatObjectType, resolveCombatObjectType } from './combatObjectType';

export interface CharacterTeamTargetQueryDependencies {
  readonly readSquadSlot?: (index: number) => string | undefined;
  readonly listOperatorIds: () => readonly string[];
  readonly isOperatorControlled: (operatorId: string) => boolean;
  readonly resolveVitals: (operatorId: string) => CombatVitals;
}

/** 直接引用只读取动作环境；返回 undefined 表示还需要实体目录或队伍查询。 */
export function resolveDirectActionTargets(
  query: ActionTargetQuery,
  context: CombatOperationContext,
  casterId?: string,
): readonly RuntimeTargetRef[] | undefined {
  if (query.kind === 'battleMainTarget') return [{ kind: 'enemy' }];
  if (query.kind === 'godEntity') return [{ kind: 'godEntity' }];
  if (query.kind === 'context') return context.targetContext?.getOptional(query.key) ?? [];
  if (query.kind === 'inputTarget')
    return context.actionInputTarget ? [context.actionInputTarget] : [];
  if (query.kind === 'owner' || query.kind === 'source') {
    const id = query.kind === 'owner' ? context.actionOwnerId : context.actionSourceId;
    return id === undefined ? [] : [runtimeTargetFromEntityId(id)];
  }
  if (query.kind === 'fixed') {
    if (query.target === 'enemy') return [{ kind: 'enemy' }];
    if (casterId === undefined) throw new Error('caster target requires an operator');
    return [{ kind: 'operator', operatorId: casterId }];
  }
  return undefined;
}

/** 执行不依赖空间的通用 Context 目标组集合操作。 */
export class TargetContextOperationExecutor implements CombatOperationExecutor {
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
    readonly targetQueries?: {
      mainBody?(target: RuntimeTargetRef): RuntimeTargetRef;
      exclusionTarget?(target: RuntimeTargetRef): RuntimeTargetRef;
      allyHitBox?(
        owner: RuntimeTargetRef,
        query: Extract<ActionTargetQuery, { kind: 'allyHitBox' }>,
      ): readonly RuntimeTargetRef[];
      abilityEntityTarget?(owner: RuntimeTargetRef): RuntimeTargetRef | undefined;
      ownerSoul?(owner: RuntimeTargetRef): RuntimeTargetRef | undefined;
      enemyMatchesTags?(query: Extract<ActionTargetQuery, { kind: 'enemyByTags' }>): boolean;
      entityLifeState?(target: RuntimeTargetRef): 'alive' | 'dead' | 'unknown' | undefined;
      mainTarget(): RuntimeTargetRef | undefined;
      ownerSpawned(query: OwnerSpawnedAbilityEntityQuery): readonly RuntimeTargetRef[];
      ownerSpawnedProjectiles?(ownerId: string): readonly RuntimeTargetRef[];
    },
    readonly runtimeState: SpatialPointIdentityState = { nextSpatialPointId: 1 },
  ) {}

  execute(step: ResolvedCombatOperationStep, context?: CombatOperationContext): boolean {
    if (step.kind === 'saveTransferredSource') {
      if (step.parameters.saveToContextKey === '') return true;
      if (!context?.targetContext)
        throw new Error('saveTransferredSource requires a target context');
      const source = this.queryTargets(step.parameters.source, context)[0];
      const sourceId = source && runtimeTargetEntityId(source);
      const partId =
        sourceId === undefined
          ? undefined
          : resolveOperationPartTransferInfo(context)?.mainBodyToPart.get(sourceId);
      context.targetContext.set(
        step.parameters.saveToContextKey,
        partId !== undefined ? [runtimeTargetFromEntityId(partId)] : source ? [source] : [],
      );
      return true;
    }
    if (step.kind === 'findCharacterBySquadSlot') {
      if (!context?.targetContext || !step.parameters.saveToContextKey) return false;
      const index = Math.trunc(
        resolveActionValueOperand(step.parameters.slotIndex, context.blackboard),
      );
      const operatorId = this.characterTeam?.readSquadSlot?.(index);
      if (operatorId === undefined) return false;
      context.targetContext.set(step.parameters.saveToContextKey, [
        { kind: 'operator', operatorId },
      ]);
      return true;
    }
    if (step.kind === 'findTargets') {
      if (!context?.targetContext) throw new Error('findTargets requires a target context');
      const owner = this.queryTargets(step.parameters.owner, context)[0];
      if (!owner || owner.kind === 'spatialPoint') return false;
      context.targetContext.set(
        step.parameters.saveToContextKey,
        this.queryTargets(step.parameters.query, context),
      );
      return true;
    }
    if (step.kind === 'copyContextTargets') {
      if (!context?.targetContext) throw new Error('copyContextTargets requires a target context');
      let targets = this.queryTargets(step.parameters.source, context);
      if (step.parameters.excludeTargets !== undefined) {
        const normalize = this.targetQueries?.exclusionTarget;
        if (!normalize) throw new Error('target exclusion requires the ability entity directory');
        const excluded = this.queryTargets(step.parameters.excludeTargets, context).map(normalize);
        targets = targets.filter(
          target => !excluded.some(other => sameTarget(normalize(target), other)),
        );
      }
      const replace = step.parameters.replacePartsWithMainBodies;
      if (replace && this.targetQueries?.mainBody === undefined)
        throw new Error('part replacement requires the ability entity directory');
      context.targetContext.set(
        step.parameters.saveToContextKey,
        replace ? targets.map(target => this.targetQueries!.mainBody!(target)) : targets,
      );
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
          pointId: this.runtimeState.nextSpatialPointId++,
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

  evaluate(condition: CompiledCondition, context?: CombatOperationContext): boolean {
    if (condition.kind === 'entityCountCompare') {
      if (!context) throw new Error('entity count requires an action context');
      const lifeState = this.targetQueries?.entityLifeState;
      if (!lifeState) throw new Error('entity count requires an entity directory');
      let count = 0;
      for (const target of this.queryTargets(condition.target, context)) {
        if (target.kind === 'spatialPoint') continue;
        const state = lifeState(target);
        if (state === undefined) continue;
        if (condition.excludeDeadEntity) {
          if (state === 'unknown') throw new Error('entity count cannot resolve target life state');
          if (state === 'dead') continue;
        }
        count++;
      }
      // 当前场景没有独立 IHittableObject 集合，不能把空间点或实体重复充当受击对象。
      if (!compareCombatNumbers(count, condition.value, condition.operator)) return false;
      if (condition.outputKey !== undefined) {
        const old = context.blackboard.getNumber(condition.outputKey);
        if (old === undefined)
          throw new Error(`action blackboard value '${condition.outputKey}' is missing`);
        if (Math.abs(Math.fround(Math.fround(old) - Math.fround(count))) > Math.fround(0.00001))
          context.blackboard.assignDynamicUnconditionally(condition.outputKey, count);
      }
      return true;
    }
    if (condition.kind === 'targetDistance') {
      if (!context) throw new Error('targetDistance requires an action context');
      const source = this.queryTargets(condition.source, context)[0];
      const target = this.queryTargets(condition.target, context)[0];
      if (!source || !target) return false;
      // 场景没有位置和碰撞体积，实体与空间点的位置、半径均按0处理。
      // 目标解析仍执行，不能把缺失目标也当成距离0。
      const distance = 0;
      return condition.lessThan
        ? distance <= Math.fround(condition.distance)
        : distance > Math.fround(condition.distance);
    }
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
      const targets = context.targetContext.getOptional(condition.contextKey) ?? [];
      let others: readonly RuntimeTargetRef[];
      if (condition.other === 'actionInputTarget') {
        others = context.actionInputTarget ? [context.actionInputTarget] : [];
      } else if (condition.other === 'controlledOperator') {
        const team = this.characterTeam;
        if (team === undefined)
          throw new Error('context target identity check requires character team');
        others = team
          .listOperatorIds()
          .filter(id => team.isOperatorControlled(id))
          .map(operatorId => ({ kind: 'operator', operatorId }));
      } else {
        const id =
          condition.other === 'actionSource' ? context.actionSourceId : context.actionOwnerId;
        others = id === undefined ? [] : [runtimeTargetFromEntityId(id)];
      }
      // 主控检查取首目标；CheckTargetsEqual 则要求两组互相包含。
      const matches =
        condition.selection === 'first'
          ? targets[0] !== undefined && others[0] !== undefined && sameTarget(targets[0], others[0])
          : targets.every(target => others.some(other => sameTarget(target, other))) &&
            others.every(other => targets.some(target => sameTarget(target, other)));
      return condition.operator === 'equal' ? matches : !matches;
    }
    if (condition.kind !== 'targetContains') {
      return context === undefined
        ? this.delegate.evaluate(condition)
        : this.delegate.evaluate(condition, context);
    }
    if (!context) throw new Error('targetContains requires an action context');
    const parents = this.queryTargets(condition.parent, context);
    const children = this.queryTargets(condition.child, context);
    return children.every(child => parents.some(parent => sameTarget(parent, child)));
  }

  #resolveTarget(
    target: 'caster' | 'enemy' | 'eventTarget' | 'eventSource' | 'buffSource' | 'currentTarget',
    context: CombatOperationContext,
  ): RuntimeTargetRef {
    if (target === 'caster') return { kind: 'operator', operatorId: this.operatorId };
    if (target === 'enemy') return { kind: 'enemy' };
    if (target === 'eventSource') {
      const event = context.event;
      const sourceId = event === undefined ? undefined : abilityEventSourceId(event);
      if (typeof sourceId !== 'string')
        throw new Error('eventSource requires a combat event with source identity');
      return runtimeTargetFromEntityId(sourceId);
    }
    if (target === 'buffSource') {
      if (context.buffSourceId === undefined) {
        throw new Error('buffSource requires a Buff lifecycle context');
      }
      const sourceId = this.resolveAbilitySystemSourceId(context.buffSourceId);
      return runtimeTargetFromEntityId(sourceId);
    }
    if (target === 'currentTarget') {
      if (context.currentTarget === undefined) {
        throw new Error('currentTarget requires a forEach combat target');
      }
      return context.currentTarget;
    }
    const targetId = eventTargetId(context);
    return runtimeTargetFromEntityId(targetId);
  }

  queryTargets(
    query: ActionTargetQuery,
    context: CombatOperationContext,
  ): readonly RuntimeTargetRef[] {
    const direct = resolveDirectActionTargets(query, context, this.operatorId);
    if (direct !== undefined) return direct;
    if (query.kind === 'allyHitBox') {
      const owner = this.queryTargets(query.owner, context)[0];
      if (!owner || owner.kind === 'spatialPoint') return [];
      if (!this.targetQueries?.allyHitBox)
        throw new Error('ally hit-box query requires scene targets');
      return this.targetQueries.allyHitBox(owner, query);
    }
    if (query.kind === 'ownerSoul') {
      const owner = this.queryTargets(query.owner, context)[0];
      if (!owner || owner.kind === 'spatialPoint') return [];
      if (!this.targetQueries?.ownerSoul)
        throw new Error('owner soul query requires an entity directory');
      const target = this.targetQueries.ownerSoul(owner);
      return target === undefined ? [] : [target];
    }
    if (query.kind === 'abilityEntityTarget') {
      if (!this.targetQueries?.abilityEntityTarget)
        throw new Error('ability entity target query requires an entity directory');
      const owner = this.queryTargets(query.owner, context)[0];
      if (owner?.kind !== 'abilityEntity') return [];
      const target = this.targetQueries.abilityEntityTarget(owner);
      return target === undefined ? [] : [target];
    }
    if (query.kind === 'enemyByTags') {
      if (!this.targetQueries?.enemyMatchesTags)
        throw new Error('enemy tag query requires a target tag reader');
      const matches = this.targetQueries.enemyMatchesTags(query);
      return matches ? [{ kind: 'enemy' }] : [];
    }
    if (query.kind === 'unfinishedProjectiles') {
      if (!this.listUnfinishedProjectiles) throw new Error('projectile query requires a directory');
      return this.listUnfinishedProjectiles();
    }
    if (query.kind === 'characterTeam') {
      if (!this.characterTeam) throw new Error('team query requires a character team');
      const selectedOwner = query.excludeOwner
        ? this.queryTargets(query.owner ?? { kind: 'owner' }, context)[0]
        : undefined;
      const owner = selectedOwner === undefined ? undefined : runtimeTargetEntityId(selectedOwner);
      return [...this.characterTeam.listOperatorIds()]
        .reverse()
        .filter(id => !query.excludeOwner || id !== owner)
        .map(operatorId => ({ kind: 'operator', operatorId }));
    }
    if (query.kind === 'mainCharacter') {
      if (!this.characterTeam) throw new Error('main-character query requires a character team');
      const id = this.characterTeam.listOperatorIds().find(this.characterTeam.isOperatorControlled);
      return id === undefined ? [] : [{ kind: 'operator', operatorId: id }];
    }
    if (query.kind === 'fixedPoint') {
      const owner = this.queryTargets(query.owner, context)[0];
      if (!owner || owner.kind === 'spatialPoint') return [];
      this.queryTargets(query.directionTarget, context);
      this.queryTargets(query.center, context);
      // 零空间模型保留一个位置目标及其身份，不执行几何偏移。
      return [{ kind: 'spatialPoint', pointId: this.runtimeState.nextSpatialPointId++ }];
    }
    if (query.kind === 'mainTarget' || query.kind === 'ownerSpawned') {
      if (!this.targetQueries) throw new Error('target query requires an entity directory');
      const owner = this.queryTargets(query.owner, context)[0];
      if (!owner || owner.kind === 'spatialPoint') return [];
      if (query.kind === 'mainTarget') {
        const target = this.targetQueries.mainTarget();
        return target === undefined ? [] : [target];
      }
      const ownerId = runtimeTargetEntityId(owner)!;
      const sourceSkillCastId = query.sameSourceSkillCast
        ? context.skillCastInfo?.skillCastId
        : undefined;
      if (query.sameSourceSkillCast && sourceSkillCastId === undefined)
        throw new Error('same-cast target query requires SkillCastInfo');
      const entities = this.targetQueries.ownerSpawned({
        ownerId,
        abilityEntityIds: query.abilityEntityIds,
        ...(sourceSkillCastId === undefined ? {} : { sourceSkillCastId }),
      });
      if (query.objectType === 'abilityEntity') return entities;
      if (!this.targetQueries.ownerSpawnedProjectiles)
        throw new Error('all owner-spawned targets require a projectile directory');
      return [...entities, ...this.targetQueries.ownerSpawnedProjectiles(ownerId)].sort((a, b) =>
        a.kind === 'abilityEntity' && b.kind === 'abilityEntity' ? a.instanceId - b.instanceId : 0,
      );
    }
    throw new Error('unsupported action target query');
  }
}

function eventTargetId(context: CombatOperationContext): string {
  const event = context.event;
  if (event !== undefined && 'payload' in event) {
    const target = abilityEventTargetId(event);
    if (target === undefined)
      throw new Error('eventTarget requires a combat event with target identity');
    return target;
  }
  throw new Error('eventTarget requires a combat event with target identity');
}
