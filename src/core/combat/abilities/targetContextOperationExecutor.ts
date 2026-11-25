import type { GameplayTag, GameplayTagQueryType } from '../tags/gameplayTags';
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
  firstRuntimeEntityTarget,
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
  if (query.kind === 'godEntity') return [{ kind: 'godEntity' }];
  if (query.kind === 'context') return context.targetContext?.getOptional(query.key) ?? [];
  if (query.kind === 'inputTarget') return context.actionInputTargets ?? [];
  if (query.kind === 'owner' || query.kind === 'source') {
    const id = query.kind === 'owner' ? context.actionOwnerId : context.actionSourceId;
    return id === undefined ? [] : [runtimeTargetFromEntityId(id)];
  }
  if (query.kind === 'fixed') {
    if (query.target === 'enemy') return undefined;
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
        query: Pick<Extract<CompiledTargetQuery, { kind: 'tagFilter' }>, 'tags' | 'tagQueryType'>,
      ): boolean | undefined;
      /** 实体当前的离地高度；无法提供高度的目标返回 undefined。 */
      height?(target: RuntimeTargetRef): number | undefined;
      /** 查询句柄能否解析位置；与目标生命值或是否位于可命中区无关。 */
      hasPosition?(target: RuntimeTargetRef): boolean;
      /** 已通过类型筛选的目标是否进入原生 Pull 处理路径，不代表位移成功。 */
      processPullTarget?(target: RuntimeTargetRef): boolean;
      mainBody?(target: RuntimeTargetRef): RuntimeTargetRef;
      exclusionTarget?(target: RuntimeTargetRef): RuntimeTargetRef;
      factionHitBox?(
        owner: RuntimeTargetRef,
        query: Extract<CompiledTargetQuery, { kind: 'factionHitBox' }>,
        context: CombatOperationContext,
      ): readonly RuntimeTargetRef[];
      abilityEntityTarget?(owner: RuntimeTargetRef): readonly RuntimeTargetRef[];
      ownerSoul?(owner: RuntimeTargetRef): RuntimeTargetRef | undefined;
      partBuffSource?(target: RuntimeTargetRef): RuntimeTargetRef;
      enemiesByTags?(
        query: Extract<CompiledTargetQuery, { kind: 'enemyByTags' }>,
      ): readonly RuntimeTargetRef[];
      hasMatchingBuff?(target: RuntimeTargetRef, query: BuffLookupQuery): boolean | undefined;
      entityLifeState?(target: RuntimeTargetRef): 'alive' | 'dead' | 'unknown' | undefined;
      typhoeaArcherySelected?(): readonly RuntimeTargetRef[];
      mainTarget(): RuntimeTargetRef | undefined;
      ownerSpawned(query: OwnerSpawnedAbilityEntityQuery): readonly RuntimeTargetRef[];
      ownerSpawnedProjectiles?(ownerId: string): readonly RuntimeTargetRef[];
    },
    readonly runtimeState: SpatialPointIdentityState = { nextSpatialPointId: 1 },
  ) {}

  execute(step: ResolvedCombatOperationStep, context?: CombatOperationContext): boolean {
    if (step.kind === 'blowOffEnemy') {
      if (!context || !this.targetQueries?.entityLifeState)
        throw new Error('blowOffEnemy requires action context and entity life-state queries');
      const source = this.queryTargets(step.parameters.source, context).find(
        target => target.kind !== 'spatialPoint',
      );
      if (!source || this.targetQueries.entityLifeState(source) !== 'alive') return false;
      // 当前模型没有独立 hit-reaction 通道。OnlyDead 原生不处理实体，
      // 非空普通目标表仍返回成功，不能按过滤后的死亡目标数量判断。
      return this.queryTargets(step.parameters.targets, context).length > 0;
    }
    if (step.kind === 'pushBack') {
      if (!context || !this.targetQueries?.entityLifeState)
        throw new Error('pushBack requires action context and entity life-state queries');
      // 原生 firstTarget 跳过位置包装，但不跳过失效的首个实体。
      const source = this.queryTargets(step.parameters.source, context).find(
        target => target.kind !== 'spatialPoint',
      );
      if (!source || this.targetQueries.entityLifeState(source) !== 'alive') return false;
      if (this.queryTargets(step.parameters.targets, context).length === 0) return false;
      // 来源点查询在非空候选表之后执行；是否能移动不影响动作返回值。
      this.queryTargets(step.parameters.sourcePoint, context);
      return true;
    }
    if (step.kind === 'pull') {
      const { hasPosition, processPullTarget } = this.targetQueries ?? {};
      if (!context || !hasPosition || !processPullTarget)
        throw new Error('pull requires action context, position and component queries');
      // 原生先获取候选快照，再查询目的地；后者不得改变本次候选。
      const targets = [...this.queryTargets(step.parameters.targets, context)];
      const destination = this.queryTargets(step.parameters.destination, context);
      // 仅复刻是否找到位置；不移动目标，故无需选取或计算具体坐标。
      if (!destination.some(hasPosition)) return step.parameters.alwaysNext;
      let result = step.parameters.alwaysNext;
      for (const target of targets) {
        if (!hasPosition(target)) continue;
        const type = resolveCombatObjectType(target, this.resolveAbilityEntityObjectType);
        if (
          step.parameters.targetType === 'Enemy'
            ? type !== 'enemy' && type !== 'enemyPart'
            : type !== 'character'
        )
          continue;
        // 不短路：即使已有一项成功，仍处理其余候选。
        if (processPullTarget(target)) result = true;
      }
      return result;
    }
    if (step.kind === 'saveTargetDistance') {
      if (context === undefined) throw new Error('saveTargetDistance requires an action context');
      const source = firstRuntimeEntityTarget(this.queryTargets(step.parameters.source, context));
      const target = firstRuntimeEntityTarget(this.queryTargets(step.parameters.target, context));
      // 原生解析失败保持成功且不覆盖黑板；零空间只替代距离，不替代目标存在性。
      if (source !== undefined && target !== undefined)
        context.blackboard.assignDynamicUnconditionally(step.parameters.outputKey, 0);
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
      const source = firstRuntimeEntityTarget(this.queryTargets(step.parameters.source, context));
      const height = source && this.targetQueries.height(source);
      const distance =
        height === undefined ? undefined : height + step.parameters.startHeightOffset;
      const hit =
        distance !== undefined && distance >= 0 && distance <= step.parameters.maxDistance;
      // 命中点拥有独立身份，不能用 enemy 身份代替。
      context.targetContext.set(
        step.parameters.saveToContextKey,
        hit
          ? [
              {
                kind: 'spatialPoint',
                pointId: this.runtimeState.nextSpatialPointId++,
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
      const source = firstRuntimeEntityTarget(this.queryTargets(step.parameters.source, context));
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
      const owner = firstRuntimeEntityTarget(this.queryTargets(step.parameters.owner, context));
      if (!owner) return false;
      if (
        step.parameters.center !== undefined &&
        this.queryTargets(step.parameters.center, context).length === 0
      )
        return false;
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
      if (replace) targets = targets.map(target => this.targetQueries!.mainBody!(target));
      if (step.parameters.convertEntitiesToPositions)
        targets = targets.map(target =>
          target.kind === 'spatialPoint'
            ? target
            : {
                kind: 'spatialPoint',
                pointId: this.runtimeState.nextSpatialPointId++,
              },
        );
      context.targetContext.set(step.parameters.saveToContextKey, targets);
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
      if (!Number.isFinite(count) || !Number.isSafeInteger(Math.ceil(count)))
        throw new RangeError('spatial point count must be finite and safely representable');
      const origins =
        step.parameters.origin === undefined
          ? undefined
          : this.queryTargets(step.parameters.origin, context);
      if (origins !== undefined && origins.length > 1)
        throw new Error('spatial point origin must resolve to at most one target');
      const origin = origins?.[0];
      context.targetContext.set(
        step.parameters.saveToContextKey,
        Array.from(
          { length: origins !== undefined && origin === undefined ? 0 : Math.ceil(count) },
          () => ({
            kind: 'spatialPoint' as const,
            pointId: this.runtimeState.nextSpatialPointId++,
          }),
        ),
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

  filterTargetsByTags(
    targets: readonly RuntimeTargetRef[],
    filters: readonly {
      tags: readonly GameplayTag[];
      queryType: GameplayTagQueryType;
    }[],
  ): readonly RuntimeTargetRef[] {
    if (!this.targetQueries?.matchesTags) throw new Error('TagValidator requires entity tags');
    return targets.filter(target =>
      filters.every(
        filter =>
          target.kind === 'spatialPoint' ||
          this.targetQueries!.matchesTags!(target, {
            tags: filter.tags,
            tagQueryType: filter.queryType,
          }) !== false,
      ),
    );
  }

  queryTargets(
    query: CompiledTargetQuery,
    context: CombatOperationContext,
  ): readonly RuntimeTargetRef[] {
    if (query.kind === 'typhoeaArcherySelected') {
      if (!this.targetQueries?.typhoeaArcherySelected)
        throw new Error('archery selected target directory is unavailable');
      return [...this.targetQueries.typhoeaArcherySelected()];
    }
    if (query.kind === 'battleMainTarget' || (query.kind === 'fixed' && query.target === 'enemy')) {
      if (!this.targetQueries) throw new Error('main target requires an entity directory');
      const target = this.targetQueries.mainTarget();
      return target === undefined ? [] : [target];
    }
    const direct = resolveDirectActionTargets(query, context, this.operatorId);
    if (direct !== undefined) return direct;
    if (query.kind === 'distanceFilter') {
      const targets = this.queryTargets(query.targets, context);
      const center = this.queryTargets(query.center, context)[0];
      if (!center) return [];
      const threshold = resolveActionValueOperand(query.threshold, context.blackboard);
      // 范围筛选保留既有近似，不随投射物飞行距离改变。
      return compareCombatNumbers(0, Math.fround(threshold), query.operator)
        ? targets
        : targets.filter(target => target.kind === 'spatialPoint');
    }
    if (query.kind === 'tagFilter') {
      return this.filterTargetsByTags(this.queryTargets(query.targets, context), [
        { tags: query.tags, queryType: query.tagQueryType },
      ]);
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
      const owner = firstRuntimeEntityTarget(this.queryTargets(query.owner, context));
      const id = owner === undefined ? undefined : runtimeTargetEntityId(owner);
      if (id === undefined) return [];
      if (!this.findAbilitySystemSource)
        throw new Error('SourceFinder requires a single-level AbilitySystem source query');
      return [this.findAbilitySystemSource(id)];
    }
    if (query.kind === 'factionHitBox') {
      const owner = firstRuntimeEntityTarget(this.queryTargets(query.owner, context));
      if (!owner) return [];
      if (!this.targetQueries?.factionHitBox)
        throw new Error('ally hit-box query requires scene targets');
      return this.targetQueries.factionHitBox(owner, query, context);
    }
    if (query.kind === 'partBuffSource') {
      const resolve = this.targetQueries?.partBuffSource;
      if (!resolve) throw new Error('part Buff source query requires an entity directory');
      return this.queryTargets(query.targets, context).map(resolve);
    }
    if (query.kind === 'ownerSoul') {
      const owner = firstRuntimeEntityTarget(this.queryTargets(query.owner, context));
      if (!owner) return [];
      if (!this.targetQueries?.ownerSoul)
        throw new Error('owner soul query requires an entity directory');
      const target = this.targetQueries.ownerSoul(owner);
      return target === undefined ? [] : [target];
    }
    if (query.kind === 'abilityEntityTarget') {
      if (!this.targetQueries?.abilityEntityTarget)
        throw new Error('ability entity target query requires an entity directory');
      const owner = firstRuntimeEntityTarget(this.queryTargets(query.owner, context));
      if (owner?.kind !== 'abilityEntity') return [];
      return this.targetQueries.abilityEntityTarget(owner).map(target => ({ ...target }));
    }
    if (query.kind === 'limit') {
      if (!Number.isSafeInteger(query.count) || query.count < 0)
        throw new Error('target limit must be a non-negative safe integer');
      return this.queryTargets(query.targets, context).slice(0, query.count);
    }
    if (query.kind === 'exclude') {
      const targets = this.queryTargets(query.targets, context);
      const excluded = this.queryTargets(query.excludeTargets, context);
      return this.#excludeTargets(targets, excluded);
    }
    if (query.kind === 'intersection') {
      const targets = this.queryTargets(query.targets, context);
      const parents = this.queryTargets(query.parentTargets, context);
      const normalize = this.targetQueries?.partBuffSource;
      if (!normalize) throw new Error('target containment requires the ability entity directory');
      const normalizedParents = parents.map(normalize);
      return targets.filter(target =>
        normalizedParents.some(parent => sameTarget(parent, normalize(target))),
      );
    }
    if (query.kind === 'smartTargetByBuff') {
      const queries = this.targetQueries;
      if (!queries?.enemiesByTags || !queries.hasMatchingBuff)
        throw new Error('smart Buff query requires enemy and Buff readers');
      const owner = firstRuntimeEntityTarget(this.queryTargets(query.owner, context));
      if (owner === undefined) return [];
      const candidates = queries.enemiesByTags({
        kind: 'enemyByTags',
        tags: [],
        tagQueryType: 'hasAll',
      });
      const target =
        candidates.find(candidate =>
          queries.hasMatchingBuff!(candidate, { kind: 'id', buffIds: query.buffIds }),
        ) ?? queries.mainTarget();
      return target === undefined ? [] : [target];
    }
    if (query.kind === 'smartTargetByTag') {
      if (!this.targetQueries?.enemiesByTags)
        throw new Error('smart target query requires enemy tags');
      const owner = firstRuntimeEntityTarget(this.queryTargets(query.owner, context));
      if (owner === undefined) return [];
      const target =
        this.targetQueries.enemiesByTags({
          kind: 'enemyByTags',
          tagQueryType: query.tagQueryType,
          tags: query.tags,
        })[0] ?? this.targetQueries.mainTarget();
      return target === undefined ? [] : [target];
    }
    if (query.kind === 'enemyByTags') {
      if (!this.targetQueries?.enemiesByTags)
        throw new Error('enemy tag query requires a target tag reader');
      return this.targetQueries.enemiesByTags(query);
    }
    if (query.kind === 'unfinishedProjectiles') {
      if (!this.listUnfinishedProjectiles) throw new Error('projectile query requires a directory');
      return this.listUnfinishedProjectiles();
    }
    if (query.kind === 'characterTeam') {
      if (!this.characterTeam) throw new Error('team query requires a character team');
      const selectedOwner = query.excludeOwner
        ? firstRuntimeEntityTarget(this.queryTargets(query.owner ?? { kind: 'owner' }, context))
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
      const owner = firstRuntimeEntityTarget(this.queryTargets(query.owner, context));
      if (!owner) return [];
      this.queryTargets(query.directionTarget, context);
      this.queryTargets(query.center, context);
      // 零空间模型保留一个位置目标及其身份，不执行几何偏移。
      return [{ kind: 'spatialPoint', pointId: this.runtimeState.nextSpatialPointId++ }];
    }
    if (query.kind === 'mainTarget' || query.kind === 'ownerSpawned') {
      if (!this.targetQueries) throw new Error('target query requires an entity directory');
      const owner = firstRuntimeEntityTarget(this.queryTargets(query.owner, context));
      if (!owner) return [];
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
