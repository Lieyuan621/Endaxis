import type {
  ComboSkillConditionDefinition,
  ComboSkillPriority,
  OperatorDefinition,
  SkillBuffSlotReplacement,
  SkillDefinition,
  SkillGroupDefinition,
  SkillLevelSource,
  SkillType,
  OperatorSkillSlotDefinition,
  OperatorPlayerActionRoutes,
  OperatorPlayerActionModeDefinition,
  NativeSkillType,
  SkillPresentationVariantDefinition,
} from '../../../../../packages/game-data-contract/src/index.ts';
import type { compileOperatorFoundationSource } from './sourceClosure.ts';
import { compileOperatorDefinitionHeaderSource } from './definitionHeader.ts';
import {
  compileOperatorTalentDefinition,
  compileOperatorPotentialDefinition,
} from './progressionDefinition.ts';
import type { CompiledOperatorActiveSkillRuntimeDefinitionSource } from './activeSkillRuntimeDefinition.ts';
import type { CompiledAbilityEntityTemplateCatalogSource } from '../../compiler/abilities/abilityEntityCatalog.ts';
import { compileAbilityEntityTemplateCatalogSource } from '../../compiler/abilities/abilityEntityCatalog.ts';
import { compileAbilityEntityDefinitionSource } from '../../compiler/abilities/abilityEntityDefinition.ts';
import { compileStandardStumpBuffClosure } from '../../compiler/buffs/standardStumpBuffClosure.ts';
import type { CompiledBuffDefinitionSource } from '../../compiler/buffs/buffProjectionTypes.ts';
import { assignGeneratedDamageStepKeys } from '../../compiler/publication/definitionStepKeys.ts';
import type { PassiveSkillCompilationBatchSource } from '../../compiler/skills/passiveSkillBatch.ts';
import type { PassiveSkillCompileRequestSource } from '../../compiler/skills/passiveSkillRequest.ts';
import { compileOperatorUpgradePassiveSkills } from './passiveSkillDefinition.ts';
import type { GameplayTagRegistry } from '../../source/nativeGameplayTags.ts';
import { buffShowsTimelineActions, type BuffRuntimeSource } from '../../source/buffRuntime.ts';
import type { CombatActionProjectionExtensionsSource } from '../../compiler/combatProjectionCommon.ts';
import {
  collectCompiledAbilityEntitySpawns,
  collectCompiledBuffApplications,
  collectCompiledBuffCapturedTargetGroups,
  collectCompiledDefaultKeywordCarrierIds,
  collectCompiledBuffIds,
  collectCompiledBuffIdentityReadIds,
} from '../../compiler/references/compiledReferences.ts';
import { collectCombatInvisibleBuffClosureIds } from '../../compiler/buffs/combatInvisibleBuffClosure.ts';
import { collectBuffRuntimeClosure } from '../../compiler/buffs/buffReferenceClosure.ts';
import { collectNativeActionNodes } from '../../source/controlFlow.ts';
import { parseGlobalBuffTemplateCatalogSource } from '../../source/globalBuffTemplate.ts';
import { createPhysicalInflictionDefinitionHydrator } from '../../compiler/actions/physicalInflictionHydration.ts';
import {
  compileTargetGroupAbilityEntityQuerySource,
  compileTargetReferenceAbilityEntityQuerySource,
} from '../../compiler/abilities/abilityEntityQuery.ts';
import {
  compileOperatorPassiveUiDefinition,
  compileOperatorProductPassiveUi,
} from './passiveUi.ts';

export interface OperatorDefinitionAssemblyInput {
  readonly productPassiveUi?: unknown;
  readonly foundation: ReturnType<typeof compileOperatorFoundationSource>;
  readonly activeSkills: readonly {
    readonly definition: CompiledOperatorActiveSkillRuntimeDefinitionSource;
    readonly runtimeBuffIds: readonly string[];
    readonly abilityEntitySpawns: readonly {
      readonly abilityEntityId: string;
      readonly skillId: string;
      readonly sourcePath: string;
    }[];
  }[];
  /** CharacterData.dodgeSkillId 指向的隐藏完美闪避技能；参与运行闭包但不进入技能库。 */
  readonly dodgeSkill?: {
    readonly definition: CompiledOperatorActiveSkillRuntimeDefinitionSource;
    readonly runtimeBuffIds: readonly string[];
    readonly abilityEntitySpawns: readonly {
      readonly abilityEntityId: string;
      readonly skillId: string;
      readonly sourcePath: string;
    }[];
  };
  readonly dashBuffs?: OperatorDefinition['dashBuffs'];
  readonly talentBindings: readonly { readonly index: number }[];
  readonly potentialBindings: readonly { readonly level: number }[];
  readonly entityCatalog: CompiledAbilityEntityTemplateCatalogSource;
  /** Buff 动作可能在主动技能规划之后才暴露实体；按发现的精确 ID 读取，不预载无关模板。 */
  readonly loadAbilityEntity?: (id: string) => unknown;
  readonly gameplayTagRegistry: GameplayTagRegistry;
  readonly loadSkill: (id: string) => unknown;
  readonly loadBuff: (id: string) => unknown;
  readonly globalBuffCatalog: unknown;
  readonly skillSettingCatalog: unknown;
  readonly passiveSkills: PassiveSkillCompilationBatchSource;
  /** 角色自身始终安装的隐藏被动请求；与养成解锁的请求分开。 */
  readonly basePassiveSkillRequests?: readonly PassiveSkillCompileRequestSource[];
  /** 角色模板原生常驻连携条件；已经过 RID 展开、黑板与事件投影。 */
  readonly comboSkillConditions?: readonly ComboSkillConditionDefinition[];
  readonly comboSkillPriority?: ComboSkillPriority;
  /** 角色 AbilitySystem 实体黑板的原生字面初值。 */
  readonly runtimeEntityBlackboard?: Readonly<Record<string, number | string>>;
  /** 隐藏注册技能：保留定义与冷却/内部 Cast 路由，不暴露为可直接放置的组技能。 */
  readonly runtimeReplacementSkillKeys?: readonly string[];
  /** 经原生 CharacterData/槽位动作取证后写入的独立战斗路由；不得从技能库分组推导。 */
  readonly skillSlots?: readonly OperatorSkillSlotDefinition[];
  readonly playerActionRoutes?: OperatorPlayerActionRoutes;
  readonly playerActionModes?: readonly OperatorPlayerActionModeDefinition[];
  /** 所有技能组共用的、由最终构筑属性决定的说明文本形态。 */
  readonly presentationVariants?: readonly SkillPresentationVariantDefinition[];
  /** `_InitSkills` 从 CharacterData 注册出的原生类型初值，以 skillId 为键。 */
  readonly nativeSkillTypeBySkillId?: Readonly<Record<string, NativeSkillType>>;
  readonly nativePlayerActionRouting?: {
    readonly slotBaseSkillKeys: Readonly<Record<'battleSkill' | 'comboSkill' | 'ultimate', string>>;
    readonly basicAttackSkillKeys: readonly string[];
    readonly normalAttackSkillKeys: readonly string[];
    readonly defaultBasicAttackSkillKey?: string;
    readonly playerActionModes: readonly OperatorPlayerActionModeDefinition[];
  };
  /** 输入包装器同步 Cast 另一技能组执行体的严格跨组换槽定义。 */
  readonly routedSkills?: readonly {
    readonly key: string;
    readonly targetSkillKey: string;
    readonly skillType: SkillType;
    readonly levelSource: SkillLevelSource;
    readonly executionSkillGroupKey: string;
    readonly costs: NonNullable<SkillDefinition['costs']>;
    readonly costFrame: number;
    readonly cooldownFrames: number;
  }[];
  /** 原生 BlackboardDouble.GetValue 已取证的精确缺键 0 回退；不允许广泛默认。 */
  readonly nativeMissingBlackboardZeroKeys?: ReadonlyMap<string, ReadonlySet<string>>;
  /** 角色实体板上的原生缺键 0 回退；仅接受已审计的 EntityBB_ 键。 */
  readonly nativeMissingEntityBlackboardZeroKeys?: ReadonlySet<string>;
  readonly createBuffProjectionExtensions?: (
    sources: ReadonlyMap<string, BuffRuntimeSource>,
    visualOnlyIds: ReadonlySet<string>,
  ) => CombatActionProjectionExtensionsSource;
  readonly createAbilityEntityProjectionExtensions?: (
    skillId: string,
    value: unknown,
    visualOnlyIds: ReadonlySet<string>,
  ) => CombatActionProjectionExtensionsSource;
}

/**
 * 整名候选的唯一装配层：只组合公共编译结果，不从旧 Operator 拷贝任何缺失字段。
 * 共享 Buff 独立返回给只读目录，不能因为当前干员用到它就变成干员私有资产。
 */
export function assembleOperatorDefinition(input: OperatorDefinitionAssemblyInput) {
  const { foundation } = input;
  const { skillLibrary, progression } = foundation;
  const nativeTalentIndices = [
    ...new Set(
      progression.talentNodes.flatMap(node =>
        node.nodeType === 'passiveSkill' ? [node.passiveSkill.index] : [],
      ),
    ),
  ].sort();
  requireExactIdentities(
    nativeTalentIndices,
    input.talentBindings.map(item => item.index),
    'talents',
  );
  requireExactIdentities(
    progression.potential.unlocks.map(item => item.level),
    input.potentialBindings.map(item => item.level),
    'potentials',
  );
  const compiledDefinitions = new Map<string, CompiledOperatorActiveSkillRuntimeDefinitionSource>();
  for (const item of input.activeSkills) {
    if (compiledDefinitions.has(item.definition.key))
      throw new Error(`duplicate skill ${item.definition.key}`);
    const expected = skillLibrary.activeSkills.entries.find(
      entry => entry.key === item.definition.key,
    );
    if (!expected) throw new Error(`skill identity mismatch ${item.definition.key}`);
    compiledDefinitions.set(
      item.definition.key,
      assignGeneratedDamageStepKeys(item.definition, item.definition.key),
    );
  }
  requireExactIdentities(
    skillLibrary.activeSkills.entries.map(item => item.key),
    [...compiledDefinitions.keys()],
    'skills',
  );
  const combatSkills = [
    ...input.activeSkills,
    ...(input.dodgeSkill === undefined ? [] : [input.dodgeSkill]),
  ];
  selectBasicAttackTimelineBlockFrames(compiledDefinitions, skillLibrary.skillGroups);
  selectSingleSkillTimelineBlockFrames(
    compiledDefinitions,
    skillLibrary.skillGroups,
    new Set(input.runtimeReplacementSkillKeys ?? []),
  );
  const talentPassivePlans = input.talentBindings.map(binding => {
    const effectIds = progression.talentNodes
      .filter(node => node.nodeType === 'passiveSkill' && node.passiveSkill.index === binding.index)
      .sort((left, right) => left.passiveSkill.level - right.passiveSkill.level)
      .map(node => node.talentEffectId);
    return compileOperatorUpgradePassiveSkills(
      effectIds,
      progression.talentPassiveSkillRequests,
      input.passiveSkills.definitions,
      input.gameplayTagRegistry,
      input.loadBuff,
    );
  });
  const potentialPassivePlans = input.potentialBindings.map(binding => {
    const effectIds = progression.potential.unlocks
      .filter(unlock => unlock.level === binding.level)
      .map(unlock => unlock.effectId);
    return compileOperatorUpgradePassiveSkills(
      effectIds,
      progression.potentialPassiveSkillRequests,
      input.passiveSkills.definitions,
      input.gameplayTagRegistry,
      input.loadBuff,
    );
  });
  const basePassivePlans = (input.basePassiveSkillRequests ?? []).map(request =>
    compileOperatorUpgradePassiveSkills(
      [request.originId],
      [request],
      input.passiveSkills.definitions,
      input.gameplayTagRegistry,
      input.loadBuff,
    ),
  );
  const installedPassiveSkillSourcePaths = new Set([
    ...basePassivePlans.flatMap(plan => plan.handledSourcePaths),
    ...talentPassivePlans.flatMap(plan => plan.handledSourcePaths),
    ...potentialPassivePlans.flatMap(plan => plan.handledSourcePaths),
  ]);
  const passiveSkillKeys = new Set([
    ...basePassivePlans.flatMap(plan => plan.definitions.map(definition => definition.key)),
    ...talentPassivePlans.flatMap(plan => plan.definitions.map(definition => definition.key)),
    ...potentialPassivePlans.flatMap(plan => plan.definitions.map(definition => definition.key)),
    ...talentPassivePlans.flatMap(plan => plan.semanticPassiveKeys),
    ...potentialPassivePlans.flatMap(plan => plan.semanticPassiveKeys),
  ]);
  const reactionPassiveInputs = new Map(
    [...talentPassivePlans, ...potentialPassivePlans, ...basePassivePlans].flatMap(plan => [
      ...plan.reactionPassiveInputs,
    ]),
  );
  const runtimeReplacementSkillKeys = new Set(input.runtimeReplacementSkillKeys ?? []);
  const knownSkillKeys = new Set(skillLibrary.activeSkills.entries.map(skill => skill.key));
  for (const key of runtimeReplacementSkillKeys) {
    if (!knownSkillKeys.has(key)) throw new Error(`unknown runtime replacement skill '${key}'`);
  }
  const context = {
    skills: skillLibrary.activeSkills.entries,
    skillGroups: skillLibrary.skillGroups,
    runtimeReplacementSkillKeys,
    costResources: new Map(
      input.activeSkills.flatMap(item =>
        item.definition.costs?.length === 1
          ? [[item.definition.key, item.definition.costs[0]!.resource] as const]
          : [],
      ),
    ),
    installedPassiveSkillSourcePaths,
    passiveSkillKeys,
    reactionPassiveInputs,
  };
  const talents = input.talentBindings.map((binding, index) => {
    const definition = compileOperatorTalentDefinition(progression, binding, context);
    const plan = talentPassivePlans[index]!;
    const passiveSkills = plan.definitions;
    const modifiers = [...(definition.modifiers ?? []), ...plan.modifiers];
    return {
      ...definition,
      ...(modifiers.length ? { modifiers } : {}),
      ...(passiveSkills.length ? { passiveSkills } : {}),
    };
  });
  const potentials = input.potentialBindings.map((binding, index) => {
    const definition = compileOperatorPotentialDefinition(progression, binding, context);
    const plan = potentialPassivePlans[index]!;
    const passiveSkills = plan.definitions;
    const modifiers = [...(definition.modifiers ?? []), ...plan.modifiers];
    return {
      ...definition,
      ...(modifiers.length ? { modifiers } : {}),
      ...(passiveSkills.length ? { passiveSkills } : {}),
    };
  });
  const bindings = new Map<string, Set<string>>();
  const addEntityBinding = (spawn: {
    readonly abilityEntityId: string;
    readonly skillId: string;
    readonly sourcePath: string;
  }) => {
    const skillIds = bindings.get(spawn.abilityEntityId) ?? new Set<string>();
    const added = !skillIds.has(spawn.skillId);
    skillIds.add(spawn.skillId);
    bindings.set(spawn.abilityEntityId, skillIds);
    return added;
  };
  for (const spawn of combatSkills.flatMap(item => item.abilityEntitySpawns)) {
    addEntityBinding(spawn);
  }
  const baseRoots = [
    ...new Set([
      ...combatSkills.flatMap(item => item.runtimeBuffIds),
      ...(input.dashBuffs ?? []).map(item => item.buffId),
      ...progression.compiledEffectBundles.flatMap(bundle =>
        bundle.entries.flatMap(entry => (entry.kind === 'buff' ? [entry.buffId] : [])),
      ),
      ...talentPassivePlans.flatMap(plan => plan.buffIds),
      ...potentialPassivePlans.flatMap(plan => plan.buffIds),
      ...basePassivePlans.flatMap(plan => plan.buffIds),
      ...collectCompiledBuffIds(input.comboSkillConditions ?? []),
    ]),
  ];
  const globalBuffCatalog = parseGlobalBuffTemplateCatalogSource(input.globalBuffCatalog);
  let preliminaryAbilityEntityDefinitions: Readonly<
    Record<string, ReturnType<typeof compileAbilityEntityDefinitionSource>>
  > = {};
  let entityCatalog = input.entityCatalog;
  let roots = baseRoots;
  let changed = true;
  while (changed) {
    changed = false;
    if (input.loadAbilityEntity !== undefined) {
      entityCatalog = compileAbilityEntityTemplateCatalogSource(
        Object.fromEntries([...bindings.keys()].map(id => [id, input.loadAbilityEntity!(id)])),
      );
    }
    for (const [id, skillIds] of bindings) {
      const template = entityCatalog.byId.get(id);
      if (!template) throw new Error(`missing AbilityEntity ${id}`);
      for (const skillId of template.skillDataBundle?.allActiveSkillIds ?? []) {
        if (!skillIds.has(skillId)) {
          skillIds.add(skillId);
          changed = true;
        }
      }
    }
    preliminaryAbilityEntityDefinitions = Object.fromEntries(
      [...bindings].map(([id, skillIds]) => {
        const template = entityCatalog.byId.get(id);
        if (!template) throw new Error(`missing AbilityEntity ${id}`);
        return [
          id,
          compileAbilityEntityDefinitionSource(
            template,
            [...skillIds],
            input.loadSkill,
            new Set(),
            input.gameplayTagRegistry,
            skillId =>
              input.createAbilityEntityProjectionExtensions?.(
                skillId,
                input.loadSkill(skillId),
                new Set(),
              ) ?? {},
            { catalog: entityCatalog, gameplayTagRegistry: input.gameplayTagRegistry },
            skillId => input.nativeMissingBlackboardZeroKeys?.get(skillId) ?? new Set(),
          ),
        ];
      }),
    );
    for (const spawn of collectCompiledAbilityEntitySpawns(preliminaryAbilityEntityDefinitions)) {
      changed = addEntityBinding(spawn) || changed;
    }
    roots = [
      ...new Set([...baseRoots, ...collectCompiledBuffIds(preliminaryAbilityEntityDefinitions)]),
    ];
    const sources = collectBuffRuntimeClosure(
      roots,
      input.loadBuff,
      globalBuffCatalog,
      collectCompiledDefaultKeywordCarrierIds([
        ...combatSkills.map(item => item.definition),
        preliminaryAbilityEntityDefinitions,
      ]),
      new Map((input.dashBuffs ?? []).map(item => [item.buffId, item.blackboard] as const)),
    );
    for (const source of sources.values()) {
      const sequences = [
        ...(buffShowsTimelineActions(source)
          ? source.graph.timelineActions.map(item => item.sequence)
          : []),
        ...source.graph.buffEvents.flatMap(item => item.actions),
        ...source.graph.abilityEvents.flatMap(item => item.actions),
        ...source.graph.igniteEvents.flatMap(item => item.actions),
      ];
      for (const sequence of sequences) {
        const nodes = collectNativeActionNodes(sequence);
        const queriesByContextKey = Map.groupBy(
          nodes.flatMap(node => {
            if (
              !node.metadata.enabled ||
              node.body.kind !== 'leaf' ||
              node.body.value.family !== 'targetGroup' ||
              node.body.value.action.finderType !== 'OwnerSpawnedEntityFinder' ||
              node.body.value.action.finderSpawnedObjectType !== 'AbilityEntity'
            ) {
              return [];
            }
            return [
              {
                contextKey: node.body.value.action.targetGroupKey,
                query: compileTargetGroupAbilityEntityQuerySource(
                  node.body.value.action,
                  entityCatalog,
                  input.gameplayTagRegistry,
                  node.sourcePath,
                ),
              },
            ];
          }),
          item => item.contextKey,
        );
        for (const node of nodes) {
          if (
            node.metadata.enabled &&
            node.body.kind === 'forEach' &&
            node.body.target.targetSource === 'Context'
          ) {
            const queries = queriesByContextKey.get(node.body.target.targetGroupKey) ?? [];
            const childSkillIds = collectNativeActionNodes(node.body.action).flatMap(child =>
              child.metadata.enabled &&
              child.body.kind === 'leaf' &&
              child.body.value.family === 'skillCast' &&
              child.body.value.action.caster.targetSource === 'Target' &&
              child.body.value.action.skillId.blackboardKey === null &&
              child.body.value.action.skillId.value.length > 0
                ? [child.body.value.action.skillId.value]
                : [],
            );
            for (const { query } of queries) {
              if (
                query.objectFilter !== 'abilityEntity' ||
                query.owner.kind !== 'actionSource' ||
                query.postProcessors.length > 0 ||
                query.validators.some(
                  validator => validator.kind !== 'tag' && validator.kind !== 'sameSkillCast',
                )
              ) {
                continue;
              }
              for (const abilityEntityId of query.candidateTemplateIds) {
                for (const skillId of childSkillIds) {
                  changed =
                    addEntityBinding({ abilityEntityId, skillId, sourcePath: node.sourcePath }) ||
                    changed;
                }
              }
            }
          }
          if (
            node.metadata.enabled &&
            node.body.kind === 'forEach' &&
            node.body.target.targetSource === 'InstantSearch' &&
            node.body.target.finderType === 'OwnerSpawnedEntityFinder' &&
            node.body.target.finderSpawnedObjectType === 'AbilityEntity' &&
            node.body.target.postProcessorTypes.length === 0
          ) {
            const query = compileTargetReferenceAbilityEntityQuerySource(
              node.body.target,
              entityCatalog,
              input.gameplayTagRegistry,
              `${node.sourcePath}.target`,
            );
            if (
              query.objectFilter === 'abilityEntity' &&
              query.owner.kind === 'actionSource' &&
              query.postProcessors.length === 0 &&
              query.validators.every(
                validator => validator.kind === 'tag' || validator.kind === 'sameSkillCast',
              )
            ) {
              const childSkillIds = collectNativeActionNodes(node.body.action).flatMap(child =>
                child.metadata.enabled &&
                child.body.kind === 'leaf' &&
                child.body.value.family === 'skillCast' &&
                child.body.value.action.caster.targetSource === 'Target' &&
                child.body.value.action.skillId.blackboardKey === null &&
                child.body.value.action.skillId.value.length > 0
                  ? [child.body.value.action.skillId.value]
                  : [],
              );
              for (const abilityEntityId of query.candidateTemplateIds) {
                for (const skillId of childSkillIds) {
                  changed =
                    addEntityBinding({ abilityEntityId, skillId, sourcePath: node.sourcePath }) ||
                    changed;
                }
              }
            }
          }
          if (
            !node.metadata.enabled ||
            node.body.kind !== 'leaf' ||
            node.body.value.family !== 'abilityEntity' ||
            node.body.value.action.kind !== 'abilityEntitySpawn'
          )
            continue;
          changed =
            addEntityBinding({
              abilityEntityId: node.body.value.action.abilityEntityId,
              skillId: node.body.value.action.skillId,
              sourcePath: node.sourcePath,
            }) || changed;
        }
      }
    }
  }
  const preliminaryEntityBuffIds = collectCompiledBuffIds(preliminaryAbilityEntityDefinitions);
  const entityBuffIdentityReads = collectCompiledBuffIdentityReadIds(
    preliminaryAbilityEntityDefinitions,
  );
  const entityVisualOnlyBuffIds = new Set(
    collectCombatInvisibleBuffClosureIds(
      [...preliminaryEntityBuffIds],
      input.loadBuff,
      entityBuffIdentityReads,
    ),
  );
  const compiledAbilityEntityDefinitions = Object.fromEntries(
    [...bindings].map(([id, skillIds]) => {
      const template = entityCatalog.byId.get(id);
      if (!template) throw new Error(`missing AbilityEntity ${id}`);
      return [
        id,
        assignGeneratedDamageStepKeys(
          compileAbilityEntityDefinitionSource(
            template,
            [...skillIds],
            input.loadSkill,
            entityVisualOnlyBuffIds,
            input.gameplayTagRegistry,
            skillId =>
              input.createAbilityEntityProjectionExtensions?.(
                skillId,
                input.loadSkill(skillId),
                entityVisualOnlyBuffIds,
              ) ?? {},
            { catalog: entityCatalog, gameplayTagRegistry: input.gameplayTagRegistry },
            skillId => input.nativeMissingBlackboardZeroKeys?.get(skillId) ?? new Set(),
          ),
          `${id}:${[...skillIds].join('|')}`,
        ),
      ];
    }),
  );
  roots = [...new Set([...baseRoots, ...collectCompiledBuffIds(compiledAbilityEntityDefinitions)])];
  const provenDefaultKeywordCarrierRootIds = collectCompiledDefaultKeywordCarrierIds([
    ...combatSkills.map(item => item.definition),
    compiledAbilityEntityDefinitions,
  ]);
  type FixedBuffTarget = 'caster' | 'enemy' | 'currentAbilityEntity';
  const rootBuffOwnerTargets = new Map<string, 'caster' | 'enemy' | 'currentAbilityEntity'>();
  const rootBuffOwnerTargetConflicts = new Set<string>();
  const rootBuffSourceTargets = new Map<string, FixedBuffTarget>();
  const rootBuffSourceTargetConflicts = new Set<string>();
  const registerRootBuffTarget = (
    targets: Map<string, FixedBuffTarget>,
    conflicts: Set<string>,
    buffId: string,
    target: FixedBuffTarget,
  ) => {
    const previous = targets.get(buffId);
    if (previous === undefined && !conflicts.has(buffId)) targets.set(buffId, target);
    else if (previous !== undefined && previous !== target) {
      targets.delete(buffId);
      conflicts.add(buffId);
    }
  };
  const registerRootBuffOwner = (buffId: string, target: FixedBuffTarget) =>
    registerRootBuffTarget(rootBuffOwnerTargets, rootBuffOwnerTargetConflicts, buffId, target);
  const registerRootBuffSource = (buffId: string, target: FixedBuffTarget) =>
    registerRootBuffTarget(rootBuffSourceTargets, rootBuffSourceTargetConflicts, buffId, target);
  // 养成 AddBuff 与被动 SkillData 的 enableSequence 都明确安装到当前干员；它们不是
  // 主动技能动作树中的 applyBuff，因此必须在闭包入口单独提供宿主种类证据。
  for (const buffId of [
    ...progression.compiledEffectBundles.flatMap(bundle =>
      bundle.entries.flatMap(entry => (entry.kind === 'buff' ? [entry.buffId] : [])),
    ),
    ...talentPassivePlans.flatMap(plan => plan.buffIds),
    ...potentialPassivePlans.flatMap(plan => plan.buffIds),
    ...basePassivePlans.flatMap(plan => plan.buffIds),
  ]) {
    registerRootBuffOwner(buffId, 'caster');
    registerRootBuffSource(buffId, 'caster');
  }
  // Center Dash 状态安装到执行闪避的角色，来源也是该角色；它不属于敌方系统根。
  for (const application of input.dashBuffs ?? []) {
    registerRootBuffOwner(application.buffId, 'caster');
    registerRootBuffSource(application.buffId, 'caster');
  }
  for (const application of collectCompiledBuffApplications([
    ...combatSkills.map(item => item.definition),
    compiledAbilityEntityDefinitions,
    input.comboSkillConditions ?? [],
  ])) {
    // 编译后的 `caster` 在 Buff 生命周期中绑定实际 Buff 宿主。所有干员集合目标都会
    // 为每个命中的干员各建一份实例，因此其固定宿主种类同样是 operator/caster；
    // 这不表示原施法者独占该 Buff，也不会丢掉运行时逐实例 owner 身份。
    const target =
      application.target === 'enemy'
        ? ('enemy' as const)
        : application.target === 'currentAbilityEntity'
          ? ('currentAbilityEntity' as const)
          : application.target === 'caster' ||
              application.target === 'controlledOperator' ||
              application.target === 'party' ||
              application.target === 'partyExceptCaster' ||
              application.target === 'partyExceptCasterAndSameCharacterType' ||
              application.target === 'casterAndControlledOperator' ||
              application.target === 'casterAndLowestHealthRatioOperatorExceptCaster'
            ? ('caster' as const)
            : null;
    if (target === null) continue;
    registerRootBuffOwner(application.buffId, target);
    const source =
      application.source === 'enemy'
        ? ('enemy' as const)
        : application.source === 'currentAbilityEntity'
          ? ('currentAbilityEntity' as const)
          : application.source === undefined || application.source === 'caster'
            ? ('caster' as const)
            : null;
    if (source !== null) registerRootBuffSource(application.buffId, source);
  }
  const buffClosure = compileStandardStumpBuffClosure(
    roots,
    input.loadBuff,
    input.globalBuffCatalog,
    input.skillSettingCatalog,
    {
      catalog: entityCatalog,
      gameplayTagRegistry: input.gameplayTagRegistry,
    },
    input.createBuffProjectionExtensions,
    rootBuffOwnerTargets,
    new Set([
      ...entityBuffIdentityReads,
      ...collectCompiledBuffIdentityReadIds(combatSkills.map(item => item.definition)),
      ...collectCompiledBuffIdentityReadIds(input.comboSkillConditions ?? []),
    ]),
    input.gameplayTagRegistry,
    rootBuffSourceTargets,
    provenDefaultKeywordCarrierRootIds,
    collectCompiledBuffCapturedTargetGroups([
      ...combatSkills.map(item => item.definition),
      compiledAbilityEntityDefinitions,
      input.comboSkillConditions ?? [],
    ]),
    new Map((input.dashBuffs ?? []).map(item => [item.buffId, item.blackboard] as const)),
  );
  const blocked = buffClosure.diagnostics.filter(item => item.status === 'blocked');
  if (blocked.length) throw new Error(`operator Buff closure blocked: ${JSON.stringify(blocked)}`);
  const hydrate = createPhysicalInflictionDefinitionHydrator(buffClosure.definitions);
  const definitions = new Map<string, SkillDefinition>(
    [...compiledDefinitions].map(([key, definition]) => [
      key,
      hydrate(stripSkillGroupCompilationEvidence(definition)),
    ]),
  );
  const dodgeSkill =
    input.dodgeSkill === undefined
      ? undefined
      : {
          ...hydrate(stripSkillGroupCompilationEvidence(input.dodgeSkill.definition)),
          skillType: 'dodge' as const,
          nativeSkillType: 'dodge' as const,
        };
  const routedSkills = new Map((input.routedSkills ?? []).map(item => [item.key, item] as const));
  for (const routed of routedSkills.values()) {
    const wrapper = definitions.get(routed.key);
    const target = definitions.get(routed.targetSkillKey);
    if (wrapper === undefined || target === undefined) {
      throw new Error(`routed skill '${routed.key}' has an unknown wrapper or target`);
    }
    definitions.set(routed.key, {
      ...target,
      key: routed.key,
      costs: routed.costs,
      costFrame: routed.costFrame,
      cooldownFrames: routed.cooldownFrames,
    });
  }
  const activeSkillTypeByKey = new Map(
    skillLibrary.activeSkills.entries.map(entry => [entry.key, entry.skillType] as const),
  );
  const skillIdentityByKey = new Map<
    string,
    { readonly skillType: SkillType; readonly levelSource: SkillLevelSource }
  >();
  const registerSkillIdentity = (
    key: string,
    skillType: SkillType,
    levelSource: SkillLevelSource,
  ): void => {
    const previous = skillIdentityByKey.get(key);
    if (
      previous !== undefined &&
      (previous.skillType !== skillType || previous.levelSource !== levelSource)
    ) {
      throw new Error(`skill '${key}' has conflicting runtime identity`);
    }
    skillIdentityByKey.set(key, { skillType, levelSource });
  };
  for (const group of skillLibrary.skillGroups) {
    for (const key of group.skillKeys) {
      const routed = routedSkills.get(key);
      const entry = skillLibrary.activeSkills.entries.find(item => item.key === key)!;
      registerSkillIdentity(
        key,
        routed?.skillType ?? activeSkillTypeByKey.get(key)!,
        routed?.levelSource ?? entry.levelSource,
      );
    }
    for (const variant of group.variants) {
      for (const key of variant.skillKeys) {
        const entry = skillLibrary.activeSkills.entries.find(item => item.key === key)!;
        registerSkillIdentity(key, activeSkillTypeByKey.get(key)!, entry.levelSource);
      }
    }
  }
  for (const [key, definition] of definitions) {
    const identity = skillIdentityByKey.get(key);
    if (identity === undefined) throw new Error(`skill '${key}' has no runtime identity`);
    const executionSkillId = routedSkills.get(key)?.targetSkillKey ?? key;
    const nativeSkillType = input.nativeSkillTypeBySkillId?.[executionSkillId];
    if (input.nativeSkillTypeBySkillId !== undefined && nativeSkillType === undefined) {
      throw new Error(`skill '${key}' has no native SkillType initialization evidence`);
    }
    definitions.set(key, {
      ...definition,
      ...identity,
      ...(nativeSkillType === undefined ? {} : { nativeSkillType }),
    });
  }
  const abilityEntityDefinitions = hydrate(compiledAbilityEntityDefinitions);
  const assignedRuntimeReplacementSkillKeys = new Set<string>();
  const skillGroups = skillLibrary.skillGroups.map(group => {
    const visibleSkillKeys = group.skillKeys.filter(key => !runtimeReplacementSkillKeys.has(key));
    const replacementSkillKeys = group.skillKeys.filter(
      key => runtimeReplacementSkillKeys.has(key) && !routedSkills.has(key),
    );
    const routedSkillEntries = group.skillKeys.flatMap(key => {
      const routed = routedSkills.get(key);
      return routed === undefined ? [] : [routed];
    });
    const runtimeReplacementKeysInGroup = [
      ...replacementSkillKeys,
      ...routedSkillEntries.map(item => item.key),
    ];
    const declaredReplacementKeys = Object.keys(group.replacementPlacements);
    const missingReplacementPlacements = runtimeReplacementKeysInGroup.filter(
      key => group.replacementPlacements[key] === undefined,
    );
    const unknownReplacementPlacements = declaredReplacementKeys.filter(
      key => !runtimeReplacementKeysInGroup.includes(key),
    );
    const unknownReplacementNameQualifiers = Object.keys(group.replacementNameQualifiers).filter(
      key => !runtimeReplacementKeysInGroup.includes(key),
    );
    const hiddenReplacementNameQualifiers = Object.keys(group.replacementNameQualifiers).filter(
      key => group.replacementPlacements[key] !== 'standard',
    );
    if (missingReplacementPlacements.length > 0 || unknownReplacementPlacements.length > 0) {
      throw new Error(
        `skill group '${group.key}' replacement placement mismatch: missing ${JSON.stringify(missingReplacementPlacements)}, unknown ${JSON.stringify(unknownReplacementPlacements)}`,
      );
    }
    if (unknownReplacementNameQualifiers.length > 0) {
      throw new Error(
        `skill group '${group.key}' replacement name qualifier mismatch: unknown ${JSON.stringify(unknownReplacementNameQualifiers)}`,
      );
    }
    if (hiddenReplacementNameQualifiers.length > 0) {
      throw new Error(
        `skill group '${group.key}' replacement name qualifier requires standard placement: ${JSON.stringify(hiddenReplacementNameQualifiers)}`,
      );
    }
    const sequenceReplacementKeys = new Set(
      runtimeReplacementKeysInGroup.filter(key => group.replacementPlacements[key] === 'sequence'),
    );
    const placementSequenceSkillKeys = group.skillKeys.filter(
      key => visibleSkillKeys.includes(key) || sequenceReplacementKeys.has(key),
    );
    if (visibleSkillKeys.length === 0) {
      throw new Error(`skill group '${group.key}' has no visible skill after runtime replacements`);
    }
    replacementSkillKeys.forEach(key => assignedRuntimeReplacementSkillKeys.add(key));
    routedSkillEntries.forEach(item => assignedRuntimeReplacementSkillKeys.add(item.key));
    return {
      key: group.key,
      skillType: group.skillType,
      levelSource: group.levelSource,
      ...(group.placementPolicy === undefined ? {} : { placementPolicy: group.placementPolicy }),
      ...(group.libraryNameQualifier === undefined
        ? {}
        : { libraryNameQualifier: group.libraryNameQualifier }),
      skills:
        visibleSkillKeys.length === 1
          ? definitions.get(visibleSkillKeys[0]!)!
          : visibleSkillKeys.map(key => definitions.get(key)!),
      ...(sequenceReplacementKeys.size > 0 && placementSequenceSkillKeys.length > 1
        ? { placementSequenceSkillKeys }
        : {}),
      ...(replacementSkillKeys.length === 0
        ? {}
        : { replacementSkills: replacementSkillKeys.map(key => definitions.get(key)!) }),
      ...(runtimeReplacementKeysInGroup.every(
        key => group.replacementPlacements[key] === 'sequence',
      )
        ? {}
        : {
            replacementSkillPlacements: Object.fromEntries(
              runtimeReplacementKeysInGroup.flatMap(key => {
                const placement = group.replacementPlacements[key]!;
                return placement === 'sequence' ? [] : [[key, placement] as const];
              }),
            ),
            ...(Object.keys(group.replacementNameQualifiers).length === 0
              ? {}
              : { replacementSkillNameQualifiers: group.replacementNameQualifiers }),
          }),
      ...(routedSkillEntries.length === 0
        ? {}
        : {
            routedReplacementSkills: routedSkillEntries.map(routed => ({
              skill: definitions.get(routed.key)!,
              skillType: routed.skillType,
              levelSource: routed.levelSource,
              executionSkillGroupKey: routed.executionSkillGroupKey,
              executionSkillKey: routed.targetSkillKey,
            })),
          }),
      ...(group.variants.length === 0
        ? {}
        : {
            variants: group.variants.map(variant => ({
              key: variant.key,
              levelSource: variant.levelSource,
              ...(variant.placementPolicy === undefined
                ? {}
                : { placementPolicy: variant.placementPolicy }),
              ...(variant.libraryNameQualifier === undefined
                ? {}
                : { libraryNameQualifier: variant.libraryNameQualifier }),
              skills:
                variant.skillKeys.length === 1
                  ? definitions.get(variant.skillKeys[0]!)!
                  : variant.skillKeys.map(key => definitions.get(key)!),
            })),
          }),
      ...(input.presentationVariants === undefined
        ? {}
        : { presentationVariants: input.presentationVariants }),
    } satisfies SkillGroupDefinition;
  });
  const unassignedRuntimeReplacementSkillKeys = [...runtimeReplacementSkillKeys].filter(
    key => !assignedRuntimeReplacementSkillKeys.has(key),
  );
  if (unassignedRuntimeReplacementSkillKeys.length > 0) {
    throw new Error(
      `runtime replacement skills are not assigned to a group: ${JSON.stringify(unassignedRuntimeReplacementSkillKeys)}`,
    );
  }
  const privateBuffs: Record<string, CompiledBuffDefinitionSource> = {},
    commonBuffs: Record<string, CompiledBuffDefinitionSource> = {};
  const skillSlotReplacements = compileOperatorBuffSkillSlotReplacements(
    buffClosure.sources,
    input.activeSkills.map(item => item.definition),
    runtimeReplacementSkillKeys,
    input.nativePlayerActionRouting?.slotBaseSkillKeys,
  );
  const { sourceCharacterId, ...header } = compileOperatorDefinitionHeaderSource(foundation);
  const entityBlackboard = new Map<string, number | string>(
    [...(input.nativeMissingEntityBlackboardZeroKeys ?? [])].map(key => [key, 0]),
  );
  for (const [key, value] of Object.entries(input.runtimeEntityBlackboard ?? {})) {
    const existing = entityBlackboard.get(key);
    if (existing !== undefined && existing !== value) {
      throw new Error(`conflicting operator entity Blackboard value for ${JSON.stringify(key)}`);
    }
    entityBlackboard.set(key, value);
  }
  // 产品身份可与实际复用的角色资源身份不同（管理员统一使用女管理员动作数据）。
  // 只从本次完整主动技能库的原生 skillId 建立额外归属，不按 Buff 名称反猜角色。
  const privateBuffCharacterIds = new Set([sourceCharacterId]);
  for (const { definition } of combatSkills) {
    const match = /^(chr_\d+_[^_]+)_/.exec(definition.key);
    if (match !== null) privateBuffCharacterIds.add(match[1]!);
  }
  for (const [id, definition] of Object.entries(buffClosure.definitions)) {
    const replacements = skillSlotReplacements.get(id);
    const hydratedDefinition = assignGeneratedDamageStepKeys(
      hydrate(
        replacements === undefined
          ? definition
          : { ...definition, skillSlotReplacements: replacements },
      ),
      id,
    );
    if ([...privateBuffCharacterIds].some(characterId => id.startsWith(`buff_${characterId}_`)))
      privateBuffs[id] = hydratedDefinition;
    else if (id.startsWith('buff_chr_')) {
      throw new Error(`foreign operator Buff ownership is not established: ${id}`);
    } else {
      // 物理/元素反应等系统 Buff 不使用 buff_common_ 前缀，但与角色私有 Buff 一样
      // 由稳定身份决定归属；旧统一链接器也把所有非 buff_chr_* 定义放入共享目录。
      commonBuffs[id] = hydratedDefinition;
    }
  }
  const operator: OperatorDefinition = {
    ...header,
    ...(() => {
      const nativePassiveUi = compileOperatorPassiveUiDefinition(
        foundation.character.charPassiveUiPrefabName,
        `${foundation.character.sourcePath}.charPassiveUIPrefabName`,
      );
      const productPassiveUi = compileOperatorProductPassiveUi(
        input.productPassiveUi,
        abilityEntityDefinitions,
      );
      if (nativePassiveUi !== undefined && productPassiveUi !== undefined)
        throw new Error('passiveUi: product component conflicts with the native mounted component');
      const passiveUi = nativePassiveUi ?? productPassiveUi;
      return passiveUi === undefined ? {} : { passiveUi };
    })(),
    skillGroups,
    ...(dodgeSkill === undefined ? {} : { dodgeSkill }),
    ...(input.dashBuffs === undefined ? {} : { dashBuffs: input.dashBuffs }),
    ...compileOperatorPlayerActionRouting(input, definitions, skillSlotReplacements),
    ...(input.comboSkillConditions === undefined
      ? {}
      : { comboSkillConditions: input.comboSkillConditions }),
    ...(input.comboSkillPriority === undefined
      ? {}
      : { comboSkillPriority: input.comboSkillPriority }),
    talents,
    potentials,
    ...(entityBlackboard.size
      ? {
          entityBlackboard: Object.fromEntries(entityBlackboard),
        }
      : {}),
    ...(basePassivePlans.length === 0
      ? {}
      : { passiveSkills: basePassivePlans.flatMap(plan => plan.definitions) }),
    ...(basePassivePlans.flatMap(plan => plan.entityBlackboardInitializers).length === 0
      ? {}
      : {
          entityBlackboardInitializers: basePassivePlans.flatMap(
            plan => plan.entityBlackboardInitializers,
          ),
        }),
    buffDefinitions: privateBuffs,
    abilityEntityDefinitions,
  };
  for (const id of Object.keys(operator.buffDisplayNameKeys ?? {})) {
    if (privateBuffs[id] === undefined) {
      throw new Error(`operator '${operator.slug}' names unknown private Buff '${id}'`);
    }
  }
  for (const key of Object.keys(operator.skillDisplayNameKeys ?? {})) {
    if (!skillLibrary.activeSkills.entries.some(skill => skill.key === key)) {
      throw new Error(`operator '${operator.slug}' names unknown skill '${key}'`);
    }
  }
  return {
    operator,
    commonBuffDefinitions: commonBuffs,
    audit: {
      scope: 'operator-definition-candidate',
      rootBuffIds: roots,
      buffSourceCount: buffClosure.sources.size,
      omittedBuffIds: [...buffClosure.omittedBuffIds],
      entityBindings: [...bindings].flatMap(([id, skillIds]) =>
        [...skillIds].map(skillId => [id, skillId] as const),
      ),
      diagnostics: buffClosure.diagnostics,
      omittedEntityVisualOnlyBuffIds: [...entityVisualOnlyBuffIds],
    },
  };
}

/** 显式块宽参照优先；否则非普攻技能按默认接续窗口或结束点生成预览。 */
export function selectSingleSkillTimelineBlockFrames(
  definitions: Map<string, CompiledOperatorActiveSkillRuntimeDefinitionSource>,
  groups: readonly {
    readonly skillType: SkillType;
    readonly skillKeys: readonly string[];
    readonly replacementPlacements: Readonly<Record<string, 'sequence' | 'standard' | 'internal'>>;
  }[],
  runtimeReplacementSkillKeys: ReadonlySet<string>,
): void {
  const routableSkillIds = new Set(
    groups.flatMap(group =>
      group.skillKeys
        .filter(
          key =>
            !runtimeReplacementSkillKeys.has(key) ||
            group.replacementPlacements[key] !== 'internal',
        )
        .map(key => definitions.get(key)?.key)
        .filter((id): id is string => id !== undefined),
    ),
  );
  const basicAttackSkillIds = new Set(
    groups
      .filter(group => group.skillType === 'basicAttack')
      .flatMap(group => group.skillKeys.map(key => definitions.get(key)?.key)),
  );
  for (const [key, definition] of definitions) {
    const followUp = definition.timelineBlockFollowUpSkillId;
    if (
      followUp !== undefined &&
      (!routableSkillIds.has(followUp) ||
        !definition.allowNextSkillTransitions.some(transition =>
          transition.skillIds.includes(followUp),
        ))
    ) {
      throw new Error(
        `skill '${key}' timeline block follow-up '${followUp}' requires a routable native continuation window`,
      );
    }
  }
  for (const group of groups) {
    const visibleKeys = group.skillKeys.filter(key => !runtimeReplacementSkillKeys.has(key));
    const placementKeys = [
      ...group.skillKeys.filter(
        key => definitions.get(key)?.timelineBlockFollowUpSkillId !== undefined,
      ),
      ...(visibleKeys.length === 1 ? visibleKeys : []),
      ...group.skillKeys.filter(
        key =>
          runtimeReplacementSkillKeys.has(key) && group.replacementPlacements[key] !== 'internal',
      ),
    ];
    for (const key of placementKeys) {
      const definition = definitions.get(key);
      if (definition === undefined) continue;
      const followUp = definition.timelineBlockFollowUpSkillId;
      if (group.skillType === 'basicAttack' && followUp === undefined) continue;
      const firstInputFrame = Math.min(
        ...definition.allowNextSkillTransitions
          .filter(
            transition =>
              transition.direct &&
              transition.startFrame > 0 &&
              transition.skillIds.some(
                id =>
                  routableSkillIds.has(id) &&
                  (followUp !== undefined
                    ? id === followUp
                    : !['battleSkill', 'comboSkill', 'ultimate'].includes(group.skillType) ||
                      basicAttackSkillIds.has(id)),
              ),
          )
          .map(transition => transition.startFrame),
      );
      const firstUnconditionalBoundaryFrame = Math.min(
        ...definition.scheduledSequences
          .filter(scheduled =>
            scheduled.sequence.steps.some(
              step =>
                step.kind === 'finishTimeline' || step.kind === 'markCurrentSkillCanInterrupt',
            ),
          )
          .map(scheduled => scheduled.startFrame),
      );
      const frame = Math.min(firstInputFrame, firstUnconditionalBoundaryFrame);
      if (
        followUp !== undefined ||
        (Number.isFinite(frame) && frame < definition.timelineBlockFrames)
      ) {
        definitions.set(key, {
          ...definition,
          timelineBlockFrames: Math.min(
            frame,
            followUp === undefined ? definition.timelineBlockFrames : definition.exclusiveFrame + 1,
          ),
        });
      }
    }
  }
}

/**
 * 基础攻击组中的数组表示有序连段，而 AllowNextSkillAction 还可能同时包含跳段、退出强化
 * 状态等其他输入路由。只有指向明确下一段的窗口才能决定时间轴技能块宽度。
 *
 * 同一目标有多个窗口时，优先顶层直连动作，再取最早的正数开启帧。0 帧通常表示状态
 * 退出或初始化路由；只在没有正数窗口时才采用。重复动作可能为不同姿态、移动状态或多轮
 * 攻击分别声明后续输入窗口，技能块应在第一次可输入时结束，不能延长到最后一次窗口。
 */
export function selectBasicAttackTimelineBlockFrames(
  definitions: Map<string, CompiledOperatorActiveSkillRuntimeDefinitionSource>,
  groups: readonly {
    readonly skillType: SkillType;
    readonly skillKeys: readonly string[];
    readonly variants: readonly { readonly skillKeys: readonly string[] }[];
  }[],
): void {
  const selectedFrames = new Map<string, number>();
  const selectedTargets = new Map<string, string>();
  const selectedWindows = new Map<
    string,
    readonly { readonly startFrame: number; readonly endFrame: number }[]
  >();
  const selectRoute = (skillKeys: readonly string[]): void => {
    if (skillKeys.length < 2) return;
    for (let index = 0; index < skillKeys.length; index += 1) {
      const key = skillKeys[index]!;
      const nextKey = skillKeys[(index + 1) % skillKeys.length]!;
      const definition = definitions.get(key);
      const nextDefinition = definitions.get(nextKey);
      if (definition === undefined || nextDefinition === undefined) continue;
      const matching = definition.allowNextSkillTransitions.filter(item =>
        item.skillIds.includes(nextDefinition.key),
      );
      if (matching.length === 0) continue;
      const direct = matching.filter(item => item.direct);
      const candidates = direct.length > 0 ? direct : matching;
      const positiveStartFrames = candidates
        .map(item => item.startFrame)
        .filter(startFrame => startFrame > 0);
      const frame = Math.min(
        definition.exclusiveFrame + 1,
        positiveStartFrames.length > 0
          ? Math.min(...positiveStartFrames)
          : Math.min(...candidates.map(item => item.startFrame)),
      );
      const previous = selectedFrames.get(key);
      if (previous !== undefined && previous !== frame) {
        throw new Error(
          `basic attack '${key}' has conflicting ordered continuation windows ${previous} and ${frame}`,
        );
      }
      selectedFrames.set(key, frame);
      const previousTarget = selectedTargets.get(key);
      if (previousTarget !== undefined && previousTarget !== nextDefinition.key) {
        throw new Error(
          `basic attack '${key}' has conflicting ordered continuations '${previousTarget}' and '${nextDefinition.key}'`,
        );
      }
      selectedTargets.set(key, nextDefinition.key);
      selectedWindows.set(
        key,
        candidates
          .map(item => ({ startFrame: item.startFrame, endFrame: item.endFrame }))
          .filter(
            (item, itemIndex, items) =>
              items.findIndex(
                candidate =>
                  candidate.startFrame === item.startFrame && candidate.endFrame === item.endFrame,
              ) === itemIndex,
          )
          .sort(
            (left, right) => left.startFrame - right.startFrame || left.endFrame - right.endFrame,
          ),
      );
    }
  };
  for (const group of groups) {
    if (group.skillType !== 'basicAttack') continue;
    selectRoute(group.skillKeys);
    group.variants.forEach(variant => selectRoute(variant.skillKeys));
  }
  for (const [key, frame] of selectedFrames) {
    const definition = definitions.get(key)!;
    const continuationSkillId = selectedTargets.get(key)!;
    const recoveredAllowedNextSkills = (selectedWindows.get(key) ?? []).map(window => ({
      ...window,
      skillIds: [continuationSkillId],
    }));
    const existingAllowedNextSkills = definition.inputWindows?.allowedNextSkills ?? [];
    definitions.set(key, {
      ...definition,
      timelineBlockFrames: frame,
      timelineContinuationSkillId: continuationSkillId,
      inputWindows: {
        ...definition.inputWindows,
        allowedNextSkills: [...existingAllowedNextSkills, ...recoveredAllowedNextSkills].filter(
          (window, windowIndex, windows) =>
            windows.findIndex(
              candidate =>
                candidate.startFrame === window.startFrame &&
                candidate.endFrame === window.endFrame &&
                candidate.skillIds.length === window.skillIds.length &&
                candidate.skillIds.every((id, idIndex) => id === window.skillIds[idIndex]),
            ) === windowIndex,
        ),
      },
    });
  }
}

function stripSkillGroupCompilationEvidence(
  definition: CompiledOperatorActiveSkillRuntimeDefinitionSource,
): SkillDefinition {
  const { allowNextSkillTransitions: _allowNextSkillTransitions, ...runtimeDefinition } =
    definition;
  return runtimeDefinition;
}

function compileOperatorPlayerActionRouting(
  input: OperatorDefinitionAssemblyInput,
  definitions: ReadonlyMap<string, SkillDefinition>,
  buffReplacements: ReadonlyMap<string, readonly SkillBuffSlotReplacement[]>,
): Pick<OperatorDefinition, 'skillSlots' | 'playerActionRoutes' | 'playerActionModes'> {
  const native = input.nativePlayerActionRouting;
  if (native === undefined) {
    return {
      ...(input.skillSlots === undefined ? {} : { skillSlots: input.skillSlots }),
      ...(input.playerActionRoutes === undefined
        ? {}
        : { playerActionRoutes: input.playerActionRoutes }),
      ...(input.playerActionModes === undefined
        ? {}
        : { playerActionModes: input.playerActionModes }),
    };
  }
  if (input.skillSlots !== undefined || input.playerActionRoutes !== undefined) {
    throw new Error('CharacterData routing cannot be combined with manual player-action routing');
  }
  const replacementKeysBySlot = new Map<string, Set<string>>(
    (['battleSkill', 'comboSkill', 'ultimate'] as const).map(key => [key, new Set<string>()]),
  );
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    if (typeof value !== 'object' || value === null) return;
    if ('kind' in value && value.kind === 'changeSkillSlot') {
      const parameters = 'parameters' in value ? value.parameters : undefined;
      if (typeof parameters !== 'object' || parameters === null) {
        throw new Error('compiled ChangeSkillAction has no parameters');
      }
      const slot = 'skillGroupKey' in parameters ? parameters.skillGroupKey : undefined;
      const target = 'targetSkillKey' in parameters ? parameters.targetSkillKey : undefined;
      const set = typeof slot === 'string' ? replacementKeysBySlot.get(slot) : undefined;
      if (set === undefined || typeof target !== 'string') {
        throw new Error('compiled ChangeSkillAction does not reference a native skill slot');
      }
      set.add(target);
    }
    for (const item of Object.values(value)) visit(item);
  };
  for (const definition of definitions.values()) visit(definition);
  for (const replacements of buffReplacements.values()) {
    for (const replacement of replacements) {
      const set = replacementKeysBySlot.get(replacement.skillGroupKey);
      if (set === undefined) throw new Error('Buff replacement references an unknown native slot');
      set.add(replacement.targetSkillKey);
    }
  }
  const skillSlots = (['battleSkill', 'comboSkill', 'ultimate'] as const).map(key => ({
    key,
    baseSkillKey: native.slotBaseSkillKeys[key],
    replacementSkillKeys: [...replacementKeysBySlot.get(key)!].filter(
      skillKey => skillKey !== native.slotBaseSkillKeys[key],
    ),
  }));
  const playerActionRoutes: OperatorPlayerActionRoutes = {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: native.basicAttackSkillKeys,
      normalAttackSkillKeys: native.normalAttackSkillKeys,
      ...(native.defaultBasicAttackSkillKey === undefined
        ? {}
        : { defaultSkillKey: native.defaultBasicAttackSkillKey }),
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  };
  return {
    skillSlots,
    playerActionRoutes,
    ...(native.playerActionModes.length === 0
      ? {}
      : { playerActionModes: native.playerActionModes }),
  };
}

function compileOperatorBuffSkillSlotReplacements(
  sources: ReadonlyMap<string, BuffRuntimeSource>,
  skills: readonly CompiledOperatorActiveSkillRuntimeDefinitionSource[],
  runtimeReplacementSkillKeys: ReadonlySet<string>,
  baseSkillKeyBySlot?: Readonly<Record<'battleSkill' | 'comboSkill' | 'ultimate', string>>,
): ReadonlyMap<string, readonly SkillBuffSlotReplacement[]> {
  const knownSkillIds = new Set(skills.map(skill => skill.key));
  const result = new Map<string, readonly SkillBuffSlotReplacement[]>();
  for (const [buffId, source] of sources) {
    const replacements: SkillBuffSlotReplacement[] = [];
    for (const event of source.graph.buffEvents) {
      for (const sequence of event.actions) {
        const directNodes = new Set(sequence.actions);
        for (const node of collectNativeActionNodes(sequence)) {
          if (node.body.kind !== 'leaf' || node.body.value.family !== 'skillSlotReplacement') {
            continue;
          }
          // Disabled 原生动作已经由来源 parser 完整校验，但不会进入 SequenceAction 运行时；
          // 不得把其配置的生命周期或目标技能当成实际替换关系。
          if (!node.metadata.enabled) continue;
          const action = node.body.value.action;
          const restoredSkillKey = knownSkillIds.has(action.targetSkillId)
            ? action.targetSkillId
            : undefined;
          const isDirectComboRestore =
            event.event === 'OnBuffFinish' &&
            directNodes.has(node) &&
            isPlainBuffSkillSlotTarget(action.skillSource) &&
            action.skillSlot === 'ComboSkill' &&
            action.lifetime === 'Infinite' &&
            !action.overrideCacheTime &&
            !action.inheritOriginSkillCooldownProgress &&
            !action.specificRevertedSkillId &&
            action.revertedSkillId === '' &&
            restoredSkillKey !== undefined &&
            restoredSkillKey === baseSkillKeyBySlot?.comboSkill;
          if (isDirectComboRestore) {
            // 原生在窗口 Buff 结束时把后续连携写回槽位；Endaxis 的现实时间轴由用户
            // 直接放置后续技能，因此只保留技能身份/冷却逻辑，不驱动自动替换或摆放。
            continue;
          }
          if (event.event !== 'DuringBuffEnable' || !directNodes.has(node)) {
            throw new Error(
              `${node.sourcePath}: skill-slot replacement must be a direct DuringBuffEnable action`,
            );
          }
          if (
            !isPlainBuffSkillSlotTarget(action.skillSource) ||
            action.lifetime !== 'FinishByAction'
          ) {
            throw new Error(`${node.sourcePath}: unsupported skill-slot replacement lifecycle`);
          }
          if (
            action.overrideCacheTime &&
            (action.cacheTime.blackboardKey !== null || action.cacheTime.value < 0)
          ) {
            throw new Error(
              `${node.sourcePath}: skill-slot input cache override must be a non-negative literal`,
            );
          }
          const targetSkillKey = knownSkillIds.has(action.targetSkillId)
            ? action.targetSkillId
            : undefined;
          if (targetSkillKey === undefined || !runtimeReplacementSkillKeys.has(targetSkillKey)) {
            throw new Error(
              `${node.sourcePath}: target skill is not an audited runtime replacement`,
            );
          }
          const skillSlotKey =
            action.skillSlot === 'NormalSkill'
              ? 'battleSkill'
              : action.skillSlot === 'ComboSkill'
                ? 'comboSkill'
                : 'ultimate';
          let revertedSkillKey: string;
          if (action.specificRevertedSkillId) {
            if (!knownSkillIds.has(action.revertedSkillId)) {
              throw new Error(`${node.sourcePath}: unknown specific reverted skill`);
            }
            revertedSkillKey = action.revertedSkillId;
          } else {
            if (action.revertedSkillId !== '') {
              throw new Error(`${node.sourcePath}: unexpected reverted skill ID`);
            }
            const baseSkillKey = baseSkillKeyBySlot?.[skillSlotKey];
            if (baseSkillKey === undefined) {
              throw new Error(`${node.sourcePath}: CharacterData base skill slot is unavailable`);
            }
            revertedSkillKey = baseSkillKey;
          }
          replacements.push({
            skillGroupKey: skillSlotKey,
            targetSkillKey,
            revertedSkillKey,
            inheritOriginSkillCooldownProgress: action.inheritOriginSkillCooldownProgress,
          });
        }
      }
    }
    if (replacements.length > 0) result.set(buffId, replacements);
  }
  return result;
}

function isPlainBuffSkillSlotTarget(
  target: import('../../source/target.ts').TargetReferenceSource,
): boolean {
  return (
    // ChangeSkillAction resolves its first target.  Buff-owned replacements execute against the
    // Buff carrier in Endaxis; native data uses Owner for that carrier, while older self-applied
    // samples use Source.  Do not admit selectors or context/group indirection here.
    (target.targetSource === 'Owner' || target.targetSource === 'Source') &&
    target.targetGroupKey === '' &&
    target.selectorOwner === 'ActionOwner' &&
    target.ownerContextKey === '' &&
    target.centerType === 'ActionSource' &&
    target.centerContextKey === '' &&
    !target.centerToGround &&
    target.target === 'ActionSource' &&
    target.targetContextKey === '' &&
    target.finderType === null &&
    target.validatorTypes.length === 0 &&
    target.postProcessorTypes.length === 0
  );
}

function requireExactIdentities(
  expected: readonly (string | number)[],
  actual: readonly (string | number)[],
  label: string,
) {
  if (
    new Set(actual).size !== actual.length ||
    JSON.stringify([...expected].sort()) !== JSON.stringify([...actual].sort())
  )
    throw new Error(`${label}: complete unique bindings are required`);
}
