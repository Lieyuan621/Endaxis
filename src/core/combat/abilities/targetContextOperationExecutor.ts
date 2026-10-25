import { sampleRandomPointPositions } from './randomPointPositions';
import { offsetSpatialPoint, spatialPointDirection } from './spatialPointPosition';
import type { CompiledTargetQuery } from '../../compiler/compiledGraphData';
import type { BuffLookupQuery } from '../../../../packages/game-data-contract/src/conditions';
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
import type { CombatVitals } from '../resources/combatVitals';
import type { CombatOperationContext, CombatOperationExecutor } from '../skills/skillRuntime';
import type { SpatialPointIdentityState } from '../state/environmentState';
import { matchesCombatObjectType, resolveCombatObjectType } from './combatObjectType';

export interface CharacterTeamTargetQueryDependencies {
  readonly squadSlotCount?: number;
  readonly readSquadSlot?: (index: number) => string | undefined;
  readonly listOperatorIds: () => readonly string[];
  readonly isOperatorControlled: (operatorId: string) => boolean;
  readonly resolveVitals: (operatorId: string) => CombatVitals;
}

/** 直接引用只读取动作环境；返回 undefined 表示还需要实体目录或队伍查询。 */
export function resolveDirectActionTargets(
  query: CompiledTargetQuery,
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
    readonly characterTeam?: CharacterTeamTargetQueryDependencies,
    /** 单层原生来源查询，不能传入递归追溯到干员的旧解析端口。 */
    readonly findAbilitySystemSource?: (ownerId: string) => RuntimeTargetRef,
    /** 共用实体句柄不代表共用原生类型；正式装配从实例目录查询。 */
    readonly resolveAbilityEntityObjectType?: (instanceId: number) => CombatObjectType,
    readonly listUnfinishedProjectiles?: () => readonly RuntimeTargetRef[],
    readonly targetQueries?: {
      matchesTags?(
        target: RuntimeTargetRef,
        query: Extract<CompiledTargetQuery, { kind: 'tagFilter' }>,
      ): boolean | undefined;
      sampleRange?(minimum: number, maximum: number, castId?: string): number;
      position?(target: RuntimeTargetRef): readonly [number, number, number] | undefined;
      /** 固定地面模型中实体当前的离地高度；没有坐标的句柄返回 undefined。 */
      height?(target: RuntimeTargetRef): number | undefined;
      mainBody?(target: RuntimeTargetRef): RuntimeTargetRef;
      exclusionTarget?(target: RuntimeTargetRef): RuntimeTargetRef;
      factionHitBox?(
        owner: RuntimeTargetRef,
        query: Extract<CompiledTargetQuery, { kind: 'factionHitBox' }>,
      ): readonly RuntimeTargetRef[];
      abilityEntityTarget?(owner: RuntimeTargetRef): RuntimeTargetRef | undefined;
      ownerSoul?(owner: RuntimeTargetRef): RuntimeTargetRef | undefined;
      enemyMatchesTags?(query: Extract<CompiledTargetQuery, { kind: 'enemyByTags' }>): boolean;
      hasMatchingBuff?(target: RuntimeTargetRef, query: BuffLookupQuery): boolean | undefined;
      entityLifeState?(target: RuntimeTargetRef): 'alive' | 'dead' | 'unknown' | undefined;
      mainTarget(): RuntimeTargetRef | undefined;
      ownerSpawned(query: OwnerSpawnedAbilityEntityQuery): readonly RuntimeTargetRef[];
      ownerSpawnedProjectiles?(ownerId: string): readonly RuntimeTargetRef[];
    },
    readonly runtimeState: SpatialPointIdentityState = { nextSpatialPointId: 1 },
  ) {}

  execute(step: ResolvedCombatOperationStep, context?: CombatOperationContext): boolean {
    if (step.kind === 'saveTargetDistance') {
      if (!context) throw new Error('saveTargetDistance requires an action context');
      const source = this.queryTargets(step.parameters.source, context)[0];
      const target = this.queryTargets(step.parameters.target, context)[0];
      if (!source || !target) return true;
      context.blackboard.assignDynamic(step.parameters.outputKey, this.#distance(source, target));
      return true;
    }
    if (step.kind === 'pickContextTarget') {
      if (context?.targetContext === undefined) {
        throw new Error('Context target selection requires a combat target context');
      }
      const index = resolveActionValueOperand(step.parameters.index, context.blackboard);
      if (!Number.isInteger(index) || index < 0) {
        throw new RangeError('Context target index must be a non-negative integer');
      }
      const target = context.targetContext.getOptional(step.parameters.sourceContextKey)?.[index];
      if (target === undefined) return false;
      context.targetContext.setSingle(step.parameters.saveToContextKey, target);
      return true;
    }
    if (step.kind === 'physicsCast') {
      if (!context?.targetContext || !this.targetQueries?.height)
        throw new Error('physicsCast requires target context and ground height query');
      const source = this.queryTargets(step.parameters.source, context)[0];
      const height = source && this.targetQueries.height(source);
      const distance =
        height === undefined ? undefined : height + step.parameters.startHeightOffset;
      const hit =
        distance !== undefined && distance >= 0 && distance <= step.parameters.maxDistance;
      const position = source && this.targetQueries.position?.(source);
      // 命中位置拥有空间点身份，不能放入 enemy 身份作为代替。
      context.targetContext.set(
        step.parameters.saveToContextKey,
        hit
          ? [
              {
                kind: 'spatialPoint',
                pointId: this.runtimeState.nextSpatialPointId++,
                // 垂直地面探测沿用固定地面高度，保留来源的水平位置。
                ...(position ? { position: [position[0], 0, position[2]] as const } : {}),
              },
            ]
          : [],
      );
      return hit;
    }
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
    if (step.kind === 'findNextAliveCharacterBySquadSlot') {
      if (!context?.targetContext || !step.parameters.saveToContextKey) return false;
      const team = this.characterTeam;
      const count = team?.squadSlotCount;
      const readSlot = team?.readSquadSlot;
      const lifeState = this.targetQueries?.entityLifeState;
      if (count === undefined || !Number.isInteger(count) || count < 0 || !readSlot || !lifeState)
        throw new Error(
          'next alive squad member requires complete squad slots and entity life states',
        );
      const start = Math.trunc(
        resolveActionValueOperand(step.parameters.slotIndex, context.blackboard),
      );
      for (let offset = 1; offset <= count; offset++) {
        const operatorId = readSlot(((start + offset) | 0) % count);
        if (operatorId === undefined) continue;
        const target = { kind: 'operator' as const, operatorId };
        const state = lifeState(target);
        if (state === undefined || state === 'unknown')
          throw new Error(`squad member '${operatorId}' has no known life state`);
        if (state !== 'alive') continue;
        context.targetContext.set(step.parameters.saveToContextKey, [target]);
        return true;
      }
      // 原生失败不调用UpdateTargetGroup，保留此前命名组。
      return false;
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
        targets = this.#excludeTargets(
          targets,
          this.queryTargets(step.parameters.excludeTargets, context),
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
      if (
        step.parameters.randomDistribution === undefined &&
        (!Number.isInteger(count) || count < 0)
      ) {
        throw new RangeError('spatial point count must be a non-negative integer');
      }
      const origins =
        step.parameters.origin === undefined
          ? undefined
          : this.queryTargets(step.parameters.origin, context);
      if (origins !== undefined && origins.length > 1)
        throw new Error('spatial point origin must resolve to at most one target');
      const origin = origins?.[0];
      let position = origin === undefined ? undefined : this.targetQueries?.position?.(origin);
      if (position && step.parameters.offset) {
        const offset = step.parameters.offset;
        position = offsetSpatialPoint(
          position,
          offset.local.map(value => resolveActionValueOperand(value, context.blackboard)),
          offset,
          spatialPointDirection(offset.facing, query => {
            const target = this.queryTargets(query, context)[0];
            const value = target && this.targetQueries?.position?.(target);
            if (!value) throw new Error('spatial point direction requires a known position');
            return value;
          }),
        );
      }
      const distribution = step.parameters.randomDistribution;
      if (distribution !== undefined) {
        if (origins !== undefined && origin === undefined) {
          context.targetContext.set(step.parameters.saveToContextKey, []);
          return true;
        }
        if (!position) throw new Error('random projectile point requires a known center position');
        const sample = this.targetQueries?.sampleRange;
        if (!sample) throw new Error('random projectile point requires a range sample source');
        const value = (input: typeof distribution.radius) =>
          resolveActionValueOperand(input, context.blackboard);
        const points = sampleRandomPointPositions(
          count,
          [position[0], distribution.centerOnGround ? 0 : position[1], position[2]],
          distribution.shape,
          value(distribution.minimumRadius),
          value(distribution.radius),
          value(distribution.angleDegrees),
          [
            value(distribution.localPlaneRotation[0]),
            value(distribution.localPlaneRotation[1]),
            value(distribution.localPlaneRotation[2]),
          ],
          (minimum, maximum) => sample(minimum, maximum, context.skillCastInfo?.originCastId),
        );
        context.targetContext.set(
          step.parameters.saveToContextKey,
          points.map(position => ({
            kind: 'spatialPoint',
            pointId: this.runtimeState.nextSpatialPointId++,
            position,
          })),
        );
        return true;
      }
      context.targetContext.set(
        step.parameters.saveToContextKey,
        Array.from({ length: origins !== undefined && origin === undefined ? 0 : count }, () => ({
          kind: 'spatialPoint' as const,
          pointId: this.runtimeState.nextSpatialPointId++,
          ...(position === undefined
            ? {}
            : { position: [...position] as [number, number, number] }),
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
      const additions = this.queryTargets(source, context);
      for (const target of additions) {
        if (!targets.some(existing => sameTarget(existing, target))) targets.push(target);
      }
    }
    context.targetContext.set(step.parameters.saveToContextKey, targets);
    return true;
  }

  #distance(source: RuntimeTargetRef, target: RuntimeTargetRef): number {
    if (!this.targetQueries?.position) throw new Error('target distance requires position queries');
    const from = this.targetQueries.position(source);
    const to = this.targetQueries.position(target);
    if (!from || !to) throw new Error('target distance requires known endpoint positions');
    return Math.fround(Math.hypot(from[0] - to[0], from[1] - to[1], from[2] - to[2]));
  }

  #excludeTargets(
    targets: readonly RuntimeTargetRef[],
    excludedTargets: readonly RuntimeTargetRef[],
  ): RuntimeTargetRef[] {
    const normalize = this.targetQueries?.exclusionTarget;
    if (!normalize) throw new Error('target exclusion requires the ability entity directory');
    const excluded = excludedTargets.map(normalize);
    return targets.filter(target => !excluded.some(other => sameTarget(normalize(target), other)));
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
      // 固定距离只用于投射物；技能范围仍采用双方处于有效范围内的零距离近似。
      const distance = 0;
      return condition.lessThan
        ? distance <= Math.fround(condition.distance)
        : distance > Math.fround(condition.distance);
    }
    if (condition.kind === 'targetObjectTypeMatch') {
      if (!context) throw new Error('object type check requires an action context');
      return this.queryTargets(condition.target, context).some(target => {
        return matchesCombatObjectType(
          condition.objectTypes,
          resolveCombatObjectType(target, this.resolveAbilityEntityObjectType),
        );
      });
    }
    if (condition.kind === 'targetsEqual') {
      if (!context) throw new Error('targetsEqual requires an action context');
      const first = this.queryTargets(condition.first, context);
      const second = this.queryTargets(condition.second, context);
      return (
        first.every(target => second.some(other => sameTarget(target, other))) &&
        second.every(target => first.some(other => sameTarget(target, other)))
      );
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

  queryTargets(
    query: CompiledTargetQuery,
    context: CombatOperationContext,
  ): readonly RuntimeTargetRef[] {
    const direct = resolveDirectActionTargets(query, context, this.operatorId);
    if (direct !== undefined) return direct;
    if (query.kind === 'distanceFilter') {
      const targets = this.queryTargets(query.targets, context);
      const center = this.queryTargets(query.center, context)[0];
      if (!center) return [];
      const threshold = resolveActionValueOperand(query.threshold, context.blackboard);
      // 范围筛选保留既有近似，不随投射物飞行距离改变。
      return compareCombatNumbers(0, Math.fround(threshold), query.operator) ? targets : [];
    }
    if (query.kind === 'tagFilter') {
      if (!this.targetQueries?.matchesTags) throw new Error('TagValidator requires entity tags');
      return this.queryTargets(query.targets, context).filter(
        target =>
          target.kind === 'spatialPoint' ||
          this.targetQueries!.matchesTags!(target, query) !== false,
      );
    }
    if (query.kind === 'buffFilter') {
      if (!this.targetQueries?.hasMatchingBuff)
        throw new Error('BuffValidator requires a target Buff query');
      return this.queryTargets(query.targets, context).filter(target => {
        // 原生仅验证能 Lock 为 AbilitySystem 的句柄，空间点等目标保持原样。
        if (target.kind === 'spatialPoint') return true;
        const hasBuff = this.targetQueries!.hasMatchingBuff!(target, query.query);
        return hasBuff === undefined || hasBuff === query.requireBuff;
      });
    }
    if (query.kind === 'abilitySystemSource') {
      const owner = this.queryTargets(query.owner, context)[0];
      const id = owner === undefined ? undefined : runtimeTargetEntityId(owner);
      if (id === undefined) return [];
      if (!this.findAbilitySystemSource)
        throw new Error('SourceFinder requires a single-level AbilitySystem source query');
      return [this.findAbilitySystemSource(id)];
    }
    if (query.kind === 'factionHitBox') {
      const owner = this.queryTargets(query.owner, context)[0];
      if (!owner || owner.kind === 'spatialPoint') return [];
      if (!this.targetQueries?.factionHitBox)
        throw new Error('ally hit-box query requires scene targets');
      return this.targetQueries.factionHitBox(owner, query);
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
    if (query.kind === 'exclude') {
      const targets = this.queryTargets(query.targets, context);
      const excluded = this.queryTargets(query.excludeTargets, context);
      return this.#excludeTargets(targets, excluded);
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
