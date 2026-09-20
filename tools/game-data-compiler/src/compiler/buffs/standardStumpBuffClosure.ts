import type { GameplayTagRegistry } from '../../source/nativeGameplayTags.ts';
import { requireRecord } from '../../source/primitives.ts';
import { buffShowsTimelineActions, type BuffRuntimeSource } from '../../source/buffRuntime.ts';
import {
  collectBuffRuntimeClosure,
  collectBuffRuntimePresentationActionPaths,
  collectBuffRuntimeLevelEventActionPaths,
  collectBuffRuntimeCharacterStatusActionPaths,
  compileBuffRuntimeDefinitionSource,
  isAfterEnemyDefeatedOnlyBuffRuntime,
  isPresentationOnlyBuffStackEffect,
} from './buffRuntimeProjection.ts';
import type { CompiledBuffDefinitionSource } from './buffProjectionTypes.ts';
import { standardStumpBuffAbilityEventOmissionReason } from '../scenario/standardStumpScenarioPolicy.ts';
import {
  parseGlobalBuffTemplateCatalogSource,
  type GlobalBuffTemplateCatalogSource,
} from '../../source/globalBuffTemplate.ts';
import { createGlobalBuffProjectionExtensions } from './globalBuffProjection.ts';
import { parseSkillSettingCatalogSource } from '../../source/skillSettingCatalog.ts';
import { createSkillSettingProjectionExtensions } from '../skills/skillSettingProjection.ts';
import type { CombatActionProjectionContextSource } from '../combatProjectionCommon.ts';
import {
  isControlledOperatorInstantSearch,
  isPartyExceptOwnerInstantSearch,
  isPartyInstantSearch,
  isStaticExplicitBadFactionEnemyTargetGroup,
  isStaticSingleEnemyOwnerAllyTargetGroup,
  isStaticSingleEnemyTargetGroup,
  isUniqueEnemyMainTargetInstantSearch,
  isZeroSpaceSingleEnemySmartTargetGroup,
} from '../combatProjectionCommon.ts';
import { collectNativeActionNodes } from '../../source/controlFlow.ts';
import { collectCombatInvisibleBuffClosureIds } from './combatInvisibleBuffClosure.ts';
import { resolveProvenStringBlackboardCandidates } from './buffReferenceClosure.ts';
import type { CompiledBuffCapturedTargetGroupsSource } from './compiledBuffMetadata.ts';

export interface StandardStumpBuffClosureDiagnostic {
  readonly status: 'blocked' | 'scenario-omitted';
  readonly sourcePath: string;
  readonly reason: string;
}

export interface CompiledStandardStumpBuffClosure {
  readonly sources: ReadonlyMap<string, BuffRuntimeSource>;
  readonly definitions: Readonly<Record<string, CompiledBuffDefinitionSource>>;
  readonly omittedBuffIds: ReadonlySet<string>;
  readonly diagnostics: readonly StandardStumpBuffClosureDiagnostic[];
}

/** 把任意领域给出的根 Buff 编译成同一份固定木桩运行闭包。 */
export function compileStandardStumpBuffClosure(
  rootBuffIds: readonly string[],
  buffDataValue: unknown,
  globalBuffCatalogValue?: unknown,
  skillSettingCatalogValue?: unknown,
  abilityEntityQueries?: CombatActionProjectionContextSource['abilityEntityQueries'],
  createAdditionalExtensions?: (
    sources: ReadonlyMap<string, BuffRuntimeSource>,
    visualOnlyIds: ReadonlySet<string>,
  ) => import('../combatProjectionCommon.ts').CombatActionProjectionExtensionsSource,
  rootBuffOwnerTargets: ReadonlyMap<
    string,
    'caster' | 'enemy' | 'currentAbilityEntity'
  > = new Map(),
  preserveBuffIds: ReadonlySet<string> = new Set(),
  gameplayTagRegistry?: GameplayTagRegistry,
  rootBuffSourceTargets: ReadonlyMap<
    string,
    'caster' | 'enemy' | 'currentAbilityEntity'
  > = new Map(),
  provenDefaultKeywordCarrierRootIds: ReadonlySet<string> = new Set(),
  rootBuffCapturedTargetGroups: ReadonlyMap<
    string,
    CompiledBuffCapturedTargetGroupsSource
  > = new Map(),
  rootBuffBlackboards: ReadonlyMap<string, Readonly<Record<string, number | string>>> = new Map(),
): CompiledStandardStumpBuffClosure {
  const buffData =
    typeof buffDataValue === 'function'
      ? (buffDataValue as (id: string) => unknown)
      : requireRecord(buffDataValue, 'BuffData');
  const globalBuffCatalog: GlobalBuffTemplateCatalogSource | undefined =
    globalBuffCatalogValue === undefined
      ? undefined
      : parseGlobalBuffTemplateCatalogSource(globalBuffCatalogValue);
  const sources = collectBuffRuntimeClosure(
    rootBuffIds,
    buffData,
    globalBuffCatalog,
    provenDefaultKeywordCarrierRootIds,
    rootBuffBlackboards,
  );
  const rootBuffIdSet = new Set(rootBuffIds);
  const {
    owners: buffOwnerTargets,
    sources: buffSourceTargets,
    capturedTargetGroups: buffCapturedTargetGroups,
  } = propagateBuffTargets(
    sources,
    rootBuffOwnerTargets,
    rootBuffSourceTargets,
    globalBuffCatalog,
    rootBuffCapturedTargetGroups,
  );
  const keywordOverrideChildIds = new Set(
    [...sources.values()].flatMap(source =>
      buffActionNodes(source).flatMap(node =>
        node.metadata.enabled &&
        node.body.kind === 'leaf' &&
        node.body.value.family === 'keywordBuff' &&
        node.body.value.action.overrideChildBuffId &&
        node.body.value.action.childBuffId.blackboardKey === null &&
        node.body.value.action.childBuffId.value.length > 0
          ? [node.body.value.action.childBuffId.value]
          : [],
      ),
    ),
  );
  const keywordEnhancementTriggerIds = new Set(
    [...sources.values()].flatMap(source =>
      buffActionNodes(source).flatMap(node =>
        node.metadata.enabled &&
        node.body.kind === 'leaf' &&
        node.body.value.family === 'keywordBuff'
          ? node.body.value.action.enhancements.flatMap(enhancement => enhancement.buffIds)
          : [],
      ),
    ),
  );
  const conditionObservedBuffIds = new Set(
    [...sources.values()].flatMap(source =>
      buffActionNodes(source).flatMap(node =>
        node.metadata.enabled && node.body.kind === 'leaf' && node.body.value.family === 'condition'
          ? collectConditionBuffIds(node.body.value.action)
          : node.metadata.enabled &&
              node.body.kind === 'leaf' &&
              node.body.value.family === 'buffQuery'
            ? collectConditionBuffIds(node.body.value.action)
            : [],
      ),
    ),
  );
  const skillSettingCatalog =
    skillSettingCatalogValue === undefined
      ? undefined
      : parseSkillSettingCatalogSource(skillSettingCatalogValue);
  const omittedBuffIds = new Set(
    [
      ...collectCombatInvisibleBuffClosureIds([...sources.keys()], id => {
        const value = typeof buffData === 'function' ? buffData(id) : buffData[id];
        if (value === undefined) throw new Error(`BuffData.${id}: missing definition`);
        return value;
      }),
    ].filter(
      id =>
        !preserveBuffIds.has(id) &&
        !conditionObservedBuffIds.has(id) &&
        !keywordOverrideChildIds.has(id) &&
        !keywordEnhancementTriggerIds.has(id) &&
        (!rootBuffIdSet.has(id) || isPresentationOnlyBuffStackEffect(sources.get(id)!)),
    ),
  );
  const diagnostics: StandardStumpBuffClosureDiagnostic[] = [];
  for (const id of omittedBuffIds) {
    diagnostics.push({
      status: 'scenario-omitted',
      sourcePath: `BuffData.${id}`,
      reason:
        'iconless presentation-only Buff closure has no combat identity consumer in this compiled program',
    });
  }
  for (const [buffId, source] of sources) {
    if (!omittedBuffIds.has(buffId) && isPresentationOnlyBuffStackEffect(source)) {
      diagnostics.push({
        status: 'scenario-omitted',
        sourcePath: `BuffData.${buffId}.stackingSettings.stackEffects`,
        reason:
          'particle-only stack effect does not affect the fixed-target damage simulation; Buff identity and stacking remain active',
      });
    } else if (isAfterEnemyDefeatedOnlyBuffRuntime(source)) {
      omittedBuffIds.add(buffId);
      diagnostics.push({
        status: 'scenario-omitted',
        sourcePath: `BuffData.${buffId}.abilityEventAction`,
        reason: 'enemy-defeated response occurs after the fixed single target simulation has ended',
      });
    }
  }
  const extensions = {
    ...(globalBuffCatalog === undefined
      ? {}
      : createGlobalBuffProjectionExtensions(globalBuffCatalog)),
    ...(skillSettingCatalog === undefined
      ? {}
      : createSkillSettingProjectionExtensions(skillSettingCatalog)),
    ...(createAdditionalExtensions?.(sources, omittedBuffIds) ?? {}),
  };
  const definitions: Record<string, CompiledBuffDefinitionSource> = {};
  for (const [buffId, source] of sources) {
    if (omittedBuffIds.has(buffId)) continue;
    for (const sourcePath of collectBuffRuntimePresentationActionPaths(source)) {
      diagnostics.push({
        status: 'scenario-omitted',
        sourcePath,
        reason:
          'strictly validated presentation action has no effect in the non-rendering combat backend',
      });
    }
    for (const sourcePath of collectBuffRuntimeLevelEventActionPaths(source)) {
      diagnostics.push({
        status: 'scenario-omitted',
        sourcePath,
        reason:
          'strictly validated GameLevelEvent/BattleRecorder publication has no registered production consumer in the fixed-target combat runtime',
      });
    }
    if (buffOwnerTargets.get(buffId) === 'caster') {
      for (const sourcePath of collectBuffRuntimeCharacterStatusActionPaths(source)) {
        diagnostics.push({
          status: 'scenario-omitted',
          sourcePath,
          reason:
            'strictly validated operator self-infliction only changes operator abnormal/control state, which cannot change fixed-stump damage under forced timeline execution',
        });
      }
    }
    const omittedEvents = new Set<string | number>();
    for (const event of source.graph.abilityEvents) {
      const reason = standardStumpBuffAbilityEventOmissionReason(
        event.event,
        buffOwnerTargets.get(buffId),
      );
      if (reason === null) continue;
      omittedEvents.add(event.event);
      diagnostics.push({
        status: 'scenario-omitted',
        sourcePath: `BuffData.${buffId}.abilityEventAction`,
        reason,
      });
    }
    try {
      const combatInvisibleDynamicBuffBlackboardKeys = new Set(
        source.graph.declaredBlackboard.flatMap(item => {
          const candidates = resolveProvenStringBlackboardCandidates(
            buffId,
            item.key,
            rootBuffIds,
            sources,
            rootBuffBlackboards,
          );
          return candidates !== null &&
            candidates.length > 0 &&
            candidates.every(candidate => omittedBuffIds.has(candidate))
            ? [item.key]
            : [];
        }),
      );
      definitions[buffId] = compileBuffRuntimeDefinitionSource(
        source,
        omittedBuffIds,
        omittedEvents,
        extensions,
        abilityEntityQueries,
        {
          gameplayTagRegistry: gameplayTagRegistry ?? abilityEntityQueries?.gameplayTagRegistry,
          ...(combatInvisibleDynamicBuffBlackboardKeys.size === 0
            ? {}
            : { combatInvisibleDynamicBuffBlackboardKeys }),
          ...(buffOwnerTargets.has(buffId)
            ? { fixedBuffOwnerTarget: buffOwnerTargets.get(buffId)! }
            : {}),
          ...(buffSourceTargets.has(buffId)
            ? { fixedBuffSourceTarget: buffSourceTargets.get(buffId)! }
            : {}),
          ...(buffCapturedTargetGroups.get(buffId)?.enemyKeys.length
            ? {
                staticEnemyTargetGroupKeys: new Set(
                  buffCapturedTargetGroups.get(buffId)!.enemyKeys,
                ),
              }
            : {}),
          ...(buffCapturedTargetGroups.get(buffId)?.zeroSpaceKeys.length
            ? {
                staticZeroSpaceTargetGroupKeys: new Set(
                  buffCapturedTargetGroups.get(buffId)!.zeroSpaceKeys,
                ),
              }
            : {}),
        },
      );
    } catch (error) {
      diagnostics.push({
        status: 'blocked',
        sourcePath: `BuffData.${buffId}`,
        reason:
          `${error instanceof Error ? error.message : String(error)}` +
          ` [fixedBuffOwner=${buffOwnerTargets.get(buffId) ?? 'unknown'}, fixedBuffSource=${buffSourceTargets.get(buffId) ?? 'unknown'}]`,
      });
    }
  }
  return {
    sources,
    definitions: Object.fromEntries(
      Object.entries(definitions).sort(([left], [right]) => left.localeCompare(right)),
    ),
    omittedBuffIds,
    diagnostics,
  };
}

function collectConditionBuffIds(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(collectConditionBuffIds);
  if (value === null || typeof value !== 'object') return [];
  const record = value as Readonly<Record<string, unknown>>;
  if (
    record.kind === 'constant' &&
    typeof record.value === 'string' &&
    record.value.startsWith('buff_')
  ) {
    return [record.value];
  }
  return Object.entries(record).flatMap(([key, child]) =>
    (key === 'buffId' && typeof child === 'string') || (key === 'buffIds' && Array.isArray(child))
      ? typeof child === 'string'
        ? [child]
        : child.flatMap(item => (typeof item === 'string' ? [item] : collectConditionBuffIds(item)))
      : collectConditionBuffIds(child),
  );
}

function buffActionNodes(source: BuffRuntimeSource) {
  return [
    ...(buffShowsTimelineActions(source)
      ? source.graph.timelineActions.map(item => item.sequence)
      : []),
    ...source.graph.buffEvents.flatMap(item => item.actions),
    ...source.graph.abilityEvents.flatMap(item => item.actions),
    ...source.graph.igniteEvents.flatMap(item => item.actions),
    ...source.damageModifiers.map(item => item.condition),
    ...source.healModifiers.map(item => item.condition),
    ...source.poiseModifiers.map(item => item.condition),
  ].flatMap(sequence => collectNativeActionNodes(sequence));
}

/** AbilityEntity 创建动作保存的 Context 在该序列后只可能引用刚创建的实体实例。 */
export function collectBuffSpawnedAbilityEntityContextKeys(
  source: BuffRuntimeSource,
): ReadonlySet<string> {
  return new Set(
    buffActionNodes(source).flatMap(node =>
      node.metadata.enabled &&
      node.body.kind === 'leaf' &&
      node.body.value.family === 'abilityEntity' &&
      node.body.value.action.saveToContext &&
      node.body.value.action.contextKey !== ''
        ? [node.body.value.action.contextKey]
        : [],
    ),
  );
}

function propagateBuffTargets(
  sources: ReadonlyMap<string, BuffRuntimeSource>,
  ownerSeeds: ReadonlyMap<string, 'caster' | 'enemy' | 'currentAbilityEntity'>,
  sourceSeeds: ReadonlyMap<string, 'caster' | 'enemy' | 'currentAbilityEntity'>,
  globalBuffCatalog?: GlobalBuffTemplateCatalogSource,
  capturedTargetGroupSeeds: ReadonlyMap<string, CompiledBuffCapturedTargetGroupsSource> = new Map(),
) {
  type Target = 'caster' | 'enemy' | 'currentAbilityEntity';
  const owners = new Map(ownerSeeds);
  const sourceTargets = new Map(sourceSeeds);
  const ownerConflicts = new Set<string>();
  const sourceConflicts = new Set<string>();
  const capturedTargetGroups = new Map(
    [...capturedTargetGroupSeeds].map(
      ([id, groups]) =>
        [
          id,
          {
            enemyKeys: [...new Set(groups.enemyKeys)].sort(),
            zeroSpaceKeys: [...new Set(groups.zeroSpaceKeys)]
              .filter(key => !groups.enemyKeys.includes(key))
              .sort(),
          },
        ] as const,
    ),
  );
  const register = (
    map: Map<string, Target>,
    conflicts: Set<string>,
    id: string,
    value?: Target,
  ) => {
    if (value === undefined) return false;
    const previous = map.get(id);
    if (previous !== undefined && previous !== value) {
      map.delete(id);
      conflicts.add(id);
      return false;
    }
    if (previous === undefined && !conflicts.has(id)) {
      map.set(id, value);
      return true;
    }
    return false;
  };
  const registerCapturedTargetGroups = (
    id: string,
    value: CompiledBuffCapturedTargetGroupsSource,
  ) => {
    const normalized = {
      enemyKeys: [...new Set(value.enemyKeys)].sort(),
      zeroSpaceKeys: [...new Set(value.zeroSpaceKeys)]
        .filter(key => !value.enemyKeys.includes(key))
        .sort(),
    };
    const previous = capturedTargetGroups.get(id);
    if (previous === undefined) {
      capturedTargetGroups.set(id, normalized);
      return true;
    }
    // A shared Buff definition may have several producers. Retain only keys
    // whose identity is proven on every producer path.
    const next = {
      enemyKeys: previous.enemyKeys.filter(key => normalized.enemyKeys.includes(key)),
      zeroSpaceKeys: previous.zeroSpaceKeys.filter(key => normalized.zeroSpaceKeys.includes(key)),
    };
    if (
      next.enemyKeys.length === previous.enemyKeys.length &&
      next.zeroSpaceKeys.length === previous.zeroSpaceKeys.length
    )
      return false;
    capturedTargetGroups.set(id, next);
    return true;
  };
  let changed = true;
  while (changed) {
    changed = false;
    for (const [globalBuffId, template] of globalBuffCatalog?.byId ?? []) {
      const owner = owners.get(globalBuffId);
      const source = sourceTargets.get(globalBuffId) ?? owner;
      if (owner === undefined) continue;
      for (const child of template.children) {
        // GlobalBuff 把同一子定义投影到固定队伍成员；在单个干员运行闭包中该成员就是 caster。
        changed = register(owners, ownerConflicts, child.buffId, 'caster') || changed;
        changed = register(sourceTargets, sourceConflicts, child.buffId, source) || changed;
      }
    }
    for (const [id, source] of sources) {
      const owner = owners.get(id);
      const sourceTarget = sourceTargets.get(id);
      if (owner === undefined && sourceTarget === undefined) continue;
      const nodes = buffActionNodes(source);
      const lifecycleNodes = new Set(
        [
          ...(buffShowsTimelineActions(source)
            ? source.graph.timelineActions.map(item => item.sequence)
            : []),
          ...source.graph.buffEvents.flatMap(item => item.actions),
        ].flatMap(sequence => collectNativeActionNodes(sequence)),
      );
      const staticEnemyTargetGroupKeys = new Set([
        ...(capturedTargetGroups.get(id)?.enemyKeys ?? []),
        ...nodes.flatMap(node =>
          node.metadata.enabled &&
          node.body.kind === 'leaf' &&
          node.body.value.family === 'targetGroup' &&
          (isStaticSingleEnemyTargetGroup(node.body.value.action) ||
            isStaticExplicitBadFactionEnemyTargetGroup(node.body.value.action) ||
            (owner === 'enemy' &&
              isStaticSingleEnemyOwnerAllyTargetGroup(node.body.value.action)) ||
            isZeroSpaceSingleEnemySmartTargetGroup(node.body.value.action)) &&
          (owner === 'caster' || owner === 'currentAbilityEntity')
            ? [node.body.value.action.targetGroupKey]
            : [],
        ),
      ]);
      const staticZeroSpaceTargetGroupKeys = new Set([
        ...staticEnemyTargetGroupKeys,
        ...(capturedTargetGroups.get(id)?.zeroSpaceKeys ?? []),
      ]);
      const abilityEntityTargetGroupKeys = new Set([
        ...collectBuffSpawnedAbilityEntityContextKeys(source),
        ...nodes.flatMap(node =>
          node.metadata.enabled &&
          node.body.kind === 'leaf' &&
          node.body.value.family === 'targetGroup' &&
          node.body.value.action.producerType === 'FindTargetAction' &&
          node.body.value.action.finderType === 'OwnerSpawnedEntityFinder' &&
          node.body.value.action.finderSpawnedObjectType === 'AbilityEntity'
            ? [node.body.value.action.targetGroupKey]
            : [],
        ),
      ]);
      // PickTarget 不改变目标身份；把 OwnerSpawned AbilityEntity 查询的别名继续传播，
      // 后续施加到单个 Context 实例的 Buff 才能获得 currentAbilityEntity owner 证据。
      let targetGroupChanged = true;
      while (targetGroupChanged) {
        targetGroupChanged = false;
        for (const node of nodes) {
          if (
            !node.metadata.enabled ||
            node.body.kind !== 'leaf' ||
            node.body.value.family !== 'targetGroup' ||
            node.body.value.action.producerType !== 'PickTargetAction' ||
            !node.body.value.action.inputTargets.some(
              target =>
                target.targetSource === 'Context' &&
                abilityEntityTargetGroupKeys.has(target.targetGroupKey),
            ) ||
            abilityEntityTargetGroupKeys.has(node.body.value.action.targetGroupKey)
          ) {
            continue;
          }
          abilityEntityTargetGroupKeys.add(node.body.value.action.targetGroupKey);
          targetGroupChanged = true;
        }
      }
      for (const node of nodes) {
        if (!node.metadata.enabled || node.body.kind !== 'leaf') continue;
        if (
          node.body.value.family === 'aura' &&
          node.body.value.action.kind === 'globalPartyAura'
        ) {
          const action = node.body.value.action;
          const childOwner: Target = action.target === 'enemy' ? 'enemy' : 'caster';
          const childSource = action.buffSource === 'ActionOwner' ? owner : sourceTarget;
          for (const entry of [...action.buffs, ...action.exitBuffs]) {
            changed = register(owners, ownerConflicts, entry.buffId, childOwner) || changed;
            changed =
              register(sourceTargets, sourceConflicts, entry.buffId, childSource) || changed;
          }
          continue;
        }
        if (
          node.body.value.family === 'globalBuff' &&
          node.body.value.action.kind === 'createGlobalBuff'
        ) {
          const action = node.body.value.action;
          const globalSource =
            action.source.targetSource === 'Owner'
              ? owner
              : action.source.targetSource === 'Source'
                ? sourceTarget
                : undefined;
          for (const entry of action.globalBuffs) {
            changed = register(owners, ownerConflicts, entry.globalBuffId, 'caster') || changed;
            changed =
              register(sourceTargets, sourceConflicts, entry.globalBuffId, globalSource) || changed;
            const template = globalBuffCatalog?.byId.get(entry.globalBuffId);
            for (const child of template?.children ?? []) {
              changed = register(owners, ownerConflicts, child.buffId, 'caster') || changed;
              changed =
                register(sourceTargets, sourceConflicts, child.buffId, globalSource) || changed;
            }
          }
          continue;
        }
        if (node.body.value.family === 'keywordBuff') {
          const action = node.body.value.action;
          const childOwner = action.target.targetSource === 'Owner' ? owner : sourceTarget;
          const childSource = action.source.targetSource === 'Owner' ? owner : sourceTarget;
          changed = register(owners, ownerConflicts, action.carrierBuffId, childOwner) || changed;
          changed =
            register(sourceTargets, sourceConflicts, action.carrierBuffId, childSource) || changed;
          continue;
        }
        if (node.body.value.family === 'forcedElementalStatus') {
          const childId = {
            Fire: 'buff_common_fire_fire_burning_triggered',
            Pulse: 'buff_common_pulse_pulse_conduct_triggered',
            Cryst: 'buff_common_cryst_cryst_frozen_triggered',
            Natural: 'buff_common_natural_natural_corrupt_triggered',
          }[node.body.value.action.statusElement];
          changed = register(owners, ownerConflicts, childId, 'enemy') || changed;
          changed = register(sourceTargets, sourceConflicts, childId, sourceTarget) || changed;
          continue;
        }
        if (node.body.value.family !== 'buffApplication') continue;
        const action = node.body.value.action;
        const childOwner =
          // 原生 Owner/Source 分支直接解析实体；序列化残留的 targetGroupKey 不参与寻址。
          action.target.targetSource === 'Owner'
            ? owner
            : action.target.targetSource === 'Source'
              ? sourceTarget
              : action.target.targetSource === 'Target' && lifecycleNodes.has(node)
                ? owner
                : sourceTarget === 'caster' &&
                    (isControlledOperatorInstantSearch(action.target) ||
                      isPartyExceptOwnerInstantSearch(action.target) ||
                      isPartyInstantSearch(action.target))
                  ? ('caster' as const)
                  : isUniqueEnemyMainTargetInstantSearch(action.target)
                    ? ('enemy' as const)
                    : (action.target.targetSource === 'Context' ||
                          action.target.targetSource === 'Target') &&
                        staticEnemyTargetGroupKeys.has(action.target.targetGroupKey)
                      ? ('enemy' as const)
                      : action.target.targetSource === 'Context' &&
                          abilityEntityTargetGroupKeys.has(action.target.targetGroupKey)
                        ? ('currentAbilityEntity' as const)
                        : undefined;
        if (childOwner === undefined) continue;
        const childSource =
          action.buffSource === 'ActionOwner'
            ? owner
            : action.buffSource === 'ActionSource'
              ? sourceTarget
              : action.buffSource === 'InputTarget' || action.buffSource === 'ContextTarget'
                ? childOwner
                : undefined;
        for (const entry of action.buffs) {
          if (entry.readIdFromBlackboard || entry.buffId === '') continue;
          changed = register(owners, ownerConflicts, entry.buffId, childOwner) || changed;
          changed = register(sourceTargets, sourceConflicts, entry.buffId, childSource) || changed;
          if (action.passTargetGroupsToBuff) {
            changed =
              registerCapturedTargetGroups(entry.buffId, {
                enemyKeys: [...staticEnemyTargetGroupKeys],
                zeroSpaceKeys: [...staticZeroSpaceTargetGroupKeys].filter(
                  key => !staticEnemyTargetGroupKeys.has(key),
                ),
              }) || changed;
          }
        }
      }
    }
  }
  return { owners, sources: sourceTargets, capturedTargetGroups };
}
