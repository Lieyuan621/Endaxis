import { OperatorPlanningSources } from './operatorPlanningSources.ts';
import path from 'node:path';
import { format, resolveConfig } from 'prettier';
import { compileOperatorFoundationSource } from '../src/domains/operator/sourceClosure.ts';
import { parseOperatorProductIdentitySource } from '../src/domains/operator/productIdentity.ts';
import { parseOperatorSkillGroupValidationOptions } from '../src/domains/operator/skillGroups.ts';
import {
  parseOperatorActiveSkillEntries,
  type OperatorActiveSkillEntrySource,
} from '../src/domains/operator/activeSkills.ts';
import { assembleOperatorDefinition } from '../src/domains/operator/definition.ts';
import { renderOperatorDefinitionSource } from '../src/domains/operator/definitionSourceRenderer.ts';
import { optimizeOperatorDefinitionPrograms } from '../src/compiler/optimization/definitionProgramOptimization.ts';
import type { DefinitionOptimizationMode } from '../src/compiler/optimization/definitionOptimization.ts';
import { compileAbilityEntityTemplateCatalogSource } from '../src/compiler/abilities/abilityEntityCatalog.ts';
import {
  requireArray,
  requireExactFields,
  requireNonEmptyString,
  requireNonNegativeInteger,
  requireNumber,
  requireRecord,
} from '../src/source/primitives.ts';
import {
  planOperatorActiveSkillRuntime,
  prepareProjectileProjection,
  type OperatorActiveSkillRuntimeArguments,
  type PlannedOperatorActiveSkillRuntime,
} from './generateOperatorActiveSkillRuntime.ts';
import { compilePassiveSkillRequestBatch } from '../src/compiler/skills/passiveSkillBatch.ts';
import { compilePassiveSkillSource } from '../src/compiler/skills/passiveSkillDefinition.ts';
import { GameplayTagRegistry } from '../src/source/nativeGameplayTags.ts';
import { collectNativeActionNodes } from '../src/source/controlFlow.ts';
import { prepareSkillDefinitionInputSource } from '../src/compiler/skills/skillDefinitionInput.ts';
import { parseKnownSkillActionGraphSource } from '../src/source/skillActionGraph.ts';
import type { NativeConditionSource } from '../src/source/condition.ts';
import type { SkillSlotReplacementActionSource } from '../src/source/skillSlotActions.ts';
import { parseOperatorRuntimeTemplateSource } from '../src/source/operatorRuntimeTemplate.ts';
import { compileAbilitySystemBlackboardsSource } from '../src/compiler/abilities/abilitySystemBlackboards.ts';
import {
  compileComboSkillConditionDefinitionSource,
  createOperatorComboActionProjectionContext,
} from '../src/compiler/conditions/comboSkillConditions.ts';
import type {
  OperatorPlayerActionRoutes,
  OperatorSkillSlotDefinition,
  PlayerActionRouteDefinition,
  PlayerSkillInput,
  OperatorDefinition,
  SkillPresentationVariantDefinition,
} from '../../../packages/game-data-contract/src/index.ts';

/**
 * 整名候选规划：只读原始资源，不写正式目录、不载入旧生成 Operator。
 * 沿用主动批量入口的资源参数；tableRoot 指包含五张角色/养成表的目录。
 * 此阶段用于对象差分和正式模拟门禁，不提供绕过门禁的零散写文件 CLI。
 */
export function planOperatorDefinition(
  input: Omit<
    OperatorActiveSkillRuntimeArguments,
    'key' | 'skillType' | 'sourceFile' | 'supplementalBuffIds' | 'check'
  > & {
    readonly manifest: string;
    readonly tableRoot: string;
    readonly globalBuffCatalog: string;
    readonly skillSettingCatalog: string;
    /** 默认应用已验证的优化；report 仅报告候选，off 用于生成对照。 */
    readonly optimization?: DefinitionOptimizationMode;
  },
) {
  const args = { ...input, sources: input.sources ?? new OperatorPlanningSources(input) };
  const read = args.sources.readJson;
  const manifest = requireRecord(read(args.manifest), args.manifest);
  const matches = requireArray(manifest.operators, 'manifest.operators')
    .map(value => requireRecord(value, 'operator'))
    .filter(value => value.slug === args.slug);
  if (matches.length !== 1) throw new Error(`expected one operator ${args.slug}`);
  const row = matches[0]!;
  const entries = parseOperatorActiveSkillEntries(row.skills, `${args.slug}.skills`);
  const skillGroupValidationOptions = parseOperatorSkillGroupValidationOptions(row, args.slug);
  const basePassiveSkillIds = skillGroupValidationOptions.basePassiveSkillIds ?? [];
  const runtimeReplacementSkillKeys = skillGroupValidationOptions.runtimeReplacementSkillKeys ?? [];
  const playerActionRouting = parsePlayerActionRouting(
    row.skillSlots,
    row.playerActionRoutes,
    `${args.slug}.playerActionRouting`,
    new Set(entries.map(entry => entry.key)),
  );
  const skills = Object.fromEntries(
    entries.map(entry => [
      entry.sourceFile,
      read(path.join(args.sourceRoot, 'SkillData', entry.sourceFile)),
    ]),
  );
  const foundation = compileOperatorFoundationSource({
    identity: parseOperatorProductIdentitySource(row, args.slug),
    manifestSkills: row.skills,
    manifestSkillGroups: row.skillGroups,
    skillDataBySourceFile: skills,
    skillPatchTable: read(args.skillPatchTable),
    characterTable: read(path.join(args.tableRoot, 'CharacterTable.json')),
    charGrowthTable: read(path.join(args.tableRoot, 'CharGrowthTable.json')),
    characterPotentialTable: read(path.join(args.tableRoot, 'CharacterPotentialTable.json')),
    potentialTalentEffectTable: read(path.join(args.tableRoot, 'PotentialTalentEffectTable.json')),
    skillConditionTable: read(path.join(args.tableRoot, 'SkillConditionTable.json')),
    skillGroupValidationOptions,
  });
  const presentationVariants = parsePresentationVariants(
    row.presentationVariants,
    foundation.progression.compiledSkillConditions,
    `${args.slug}.presentationVariants`,
  );
  const compileSkillSlotReplacement = createActiveSkillSlotReplacementProjection(
    foundation.skillLibrary.activeSkills.entries,
  );
  const compileSkillTypeMutation = createActiveSkillTypeMutationProjection(
    foundation.skillLibrary.activeSkills.entries,
  );
  const basePassiveSkillRequests = basePassiveSkillIds.map(id => ({
    originKind: 'operatorProgression' as const,
    originId: id,
    sourcePath: `${args.slug}.basePassiveSkillIds`,
    skillId: id,
    levelSource: resolveBasePassiveLevelSource(foundation.skillLibrary, id),
    inputBlackboard: {},
  }));
  const passiveRequests = [
    ...basePassiveSkillRequests,
    ...foundation.progression.talentPassiveSkillRequests,
    ...foundation.progression.potentialPassiveSkillRequests,
  ];
  const passiveSkills = compilePassiveSkillRequestBatch(
    passiveRequests,
    Object.fromEntries(
      [...new Set(passiveRequests.map(request => request.skillId))].map(id => [
        id,
        read(path.join(args.sourceRoot, 'SkillData', `${id}.json`)),
      ]),
    ),
    read(args.skillPatchTable),
  );
  const preliminaryActiveSkills = entries.map(entry =>
    planOperatorActiveSkillRuntime({
      ...args,
      key: entry.key,
      skillType: entry.skillType,
      sourceFile: entry.sourceFile,
      supplementalBuffIds: [],
      allowMissingSkillPatch: runtimeReplacementSkillKeys.includes(entry.key),
      compileSkillSlotReplacement,
      compileSkillTypeMutation,
    }),
  );
  const spawned = [
    ...new Set(
      preliminaryActiveSkills.flatMap(skill =>
        skill.abilityEntitySpawns.map(spawn => spawn.abilityEntityId),
      ),
    ),
  ];
  const entityCatalog = compileAbilityEntityTemplateCatalogSource(
    Object.fromEntries(
      spawned.map(id => [id, read(path.join(args.sourceRoot, 'AbilityEntityData', `${id}.json`))]),
    ),
  );
  const entityPassiveSkills = [...entityCatalog.byId.values()].flatMap(template =>
    (template.skillDataBundle?.enabledPassiveSkillIds ?? []).map(skillId =>
      compilePassiveSkillSource(
        read(path.join(args.sourceRoot, 'SkillData', `${skillId}.json`)),
        `SkillData.${skillId}`,
        null,
      ),
    ),
  );
  const crossSkillObservedBuffIds = [
    ...new Set([
      ...preliminaryActiveSkills.flatMap(skill => skill.abilityEntityObservedBuffIds),
      ...passiveSkills.definitions.flatMap(definition =>
        collectObservedBuffIdsFromPassiveSkill(definition.definition.skill.actionGraph),
      ),
      ...entityPassiveSkills.flatMap(definition =>
        collectObservedBuffIdsFromPassiveSkill(definition.skill.actionGraph),
      ),
    ]),
  ];
  const activeSkills = entries.map(entry => {
    const planned = planOperatorActiveSkillRuntime({
      ...args,
      key: entry.key,
      skillType: entry.skillType,
      sourceFile: entry.sourceFile,
      supplementalBuffIds: [],
      preserveBuffIds: crossSkillObservedBuffIds,
      allowMissingSkillPatch: runtimeReplacementSkillKeys.includes(entry.key),
      compileSkillSlotReplacement,
      compileSkillTypeMutation,
    });
    return {
      ...planned,
      definition: {
        ...planned.definition,
        ...(entry.enhancementStateBuffId === undefined
          ? {}
          : { enhancementStateBuffId: entry.enhancementStateBuffId }),
        ...(entry.timelineBlockFollowUpSkillId === undefined
          ? {}
          : { timelineBlockFollowUpSkillId: entry.timelineBlockFollowUpSkillId }),
      },
    };
  });
  const routedSkills = planRoutedSkills(
    row,
    entries,
    activeSkills,
    foundation.skillLibrary.skillGroups,
    skills,
    args.slug,
  );
  const timeDilationPriorities = args.sources.timeDilationPriorities(args.timeDilationCatalog);
  const gameplayTagRegistry = new GameplayTagRegistry(
    args.sources.gameplayTags(args.gameplayTagCatalog),
  );
  const runtimeTemplate = planOperatorRuntimeTemplate(
    row.runtimeTemplate,
    args.slug,
    args.sourceRoot,
    row.charId,
    activeSkills,
    foundation.skillLibrary.skillGroups.map(group => ({
      key: group.key,
      skillType: group.skillType,
      skillKeys: group.skillKeys,
    })),
    gameplayTagRegistry,
    args.sources,
  );
  const dodgeSkill =
    runtimeTemplate === undefined
      ? undefined
      : planOperatorActiveSkillRuntime({
          ...args,
          key: runtimeTemplate.playerActionSource.dodgeSkillId,
          skillType: 'dodge',
          sourceFile: `${runtimeTemplate.playerActionSource.dodgeSkillId}.json`,
          supplementalBuffIds: [],
          preserveBuffIds: crossSkillObservedBuffIds,
          allowMissingSkillPatch: true,
          compileSkillSlotReplacement,
          compileSkillTypeMutation,
        });
  const nativePlayerActionRouting =
    runtimeTemplate === undefined
      ? undefined
      : compileNativePlayerActionRouting(runtimeTemplate.playerActionSource, activeSkills);
  // CharacterData.dashBuff 为空时，原生 Center Dash 状态仍安装公共 Dash Buff，
  // 并把该角色的隐藏 Dodge 技能 ID 写入监听链；角色显式配置仍优先。
  const dashBuffs =
    runtimeTemplate === undefined
      ? undefined
      : (runtimeTemplate.dashBuffs ?? [
          {
            buffId: 'buff_common_dash',
            blackboard: { dodgeSkillId: runtimeTemplate.playerActionSource.dodgeSkillId },
          },
        ]);
  const candidate = assembleOperatorDefinition({
    foundation,
    productPassiveUi: row.passiveUi,
    activeSkills,
    ...(dodgeSkill === undefined ? {} : { dodgeSkill }),
    ...(dashBuffs === undefined ? {} : { dashBuffs }),
    ...(presentationVariants.length === 0 ? {} : { presentationVariants }),
    runtimeReplacementSkillKeys,
    ...(playerActionRouting === undefined ? {} : playerActionRouting),
    routedSkills,
    nativeMissingBlackboardZeroKeys: parseNativeMissingBlackboardZeroKeys(
      row.nativeMissingBlackboardZeroKeys,
      `${args.slug}.nativeMissingBlackboardZeroKeys`,
    ),
    nativeMissingEntityBlackboardZeroKeys: parseNativeMissingEntityBlackboardZeroKeys(
      row.nativeMissingEntityBlackboardZeroKeys,
      `${args.slug}.nativeMissingEntityBlackboardZeroKeys`,
    ),
    entityCatalog,
    loadAbilityEntity: id => read(path.join(args.sourceRoot, 'AbilityEntityData', `${id}.json`)),
    gameplayTagRegistry,
    talentBindings: requireArray(row.talents, 'talents').map(value => {
      const binding = requireRecord(value, 'talent');
      return {
        index: requireNonNegativeInteger(binding.index, 'talent.index'),
      };
    }),
    // 固定槽位顺序绑定原生潜能等级，无额外展示身份。
    potentialBindings: requireArray(row.potentials, 'potentials').map((_, index) => ({
      level: index + 1,
    })),
    loadSkill: id => read(path.join(args.sourceRoot, 'SkillData', `${id}.json`)),
    loadBuff: id => read(path.join(args.buffDataRoot, `${id}.json`)),
    globalBuffCatalog: read(args.globalBuffCatalog),
    skillSettingCatalog: read(args.skillSettingCatalog),
    passiveSkills,
    basePassiveSkillRequests,
    ...(runtimeTemplate === undefined
      ? {}
      : {
          runtimeEntityBlackboard: runtimeTemplate.entityBlackboard,
          ...(runtimeTemplate.comboSkillConditions === undefined
            ? {}
            : {
                comboSkillConditions: runtimeTemplate.comboSkillConditions,
                comboSkillPriority: runtimeTemplate.comboSkillPriority,
              }),
          nativeSkillTypeBySkillId: runtimeTemplate.playerActionSource.initialNativeSkillTypeById,
          nativePlayerActionRouting,
        }),
    createBuffProjectionExtensions: (sources, visualOnlyIds) => {
      const resolveTimeDilationPriority = (tagId: number, sourcePath: string) => {
        const value = timeDilationPriorities.get(tagId);
        if (value === undefined)
          throw new Error(`${sourcePath}: unknown time-dilation priority ${tagId}`);
        return value;
      };
      const launches = [...sources.values()].flatMap(source =>
        [
          ...source.graph.timelineActions.map(item => item.sequence),
          ...source.graph.buffEvents.flatMap(item => item.actions),
          ...source.graph.abilityEvents.flatMap(item => item.actions),
          ...source.graph.igniteEvents.flatMap(item => item.actions),
        ].flatMap(sequence =>
          collectNativeActionNodes(sequence).flatMap(node =>
            node.metadata.enabled &&
            node.body.kind === 'leaf' &&
            node.body.value.family === 'projectile'
              ? [node.body.value.action]
              : [],
          ),
        ),
      );
      if (launches.length === 0) return { resolveTimeDilationPriority, compileSkillTypeMutation };
      const prepared = prepareProjectileProjection(args, launches, visualOnlyIds, {
        gameplayTagRegistry,
        actionOwnerTarget: 'unavailable',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'enemy',
        fixedHittableTargetCount: 0,
      });
      return {
        compileProjectileLaunch: prepared.compileProjectileLaunch,
        resolveTimeDilationPriority,
        compileSkillTypeMutation,
      };
    },
    createAbilityEntityProjectionExtensions: (skillId, value, visualOnlyIds) => {
      const resolveTimeDilationPriority = (tagId: number, sourcePath: string) => {
        const priority = timeDilationPriorities.get(tagId);
        if (priority === undefined)
          throw new Error(`${sourcePath}: unknown time-dilation priority ${tagId}`);
        return priority;
      };
      const preparedInput = prepareSkillDefinitionInputSource(value, skillId, null);
      const graph = parseKnownSkillActionGraphSource(
        value,
        `SkillData.${skillId}`,
        preparedInput.blackboard.values,
      );
      const launches = graph.actionGroup.timelineActions.flatMap(timeline =>
        collectNativeActionNodes(timeline.sequence).flatMap(node =>
          node.metadata.enabled &&
          node.body.kind === 'leaf' &&
          node.body.value.family === 'projectile'
            ? [node.body.value.action]
            : [],
        ),
      );
      if (launches.length === 0) return { resolveTimeDilationPriority };
      const projectile = prepareProjectileProjection(args, launches, visualOnlyIds, {
        gameplayTagRegistry,
        actionOwnerTarget: 'unavailable',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'enemy',
        fixedHittableTargetCount: 0,
      });
      return {
        compileProjectileLaunch: projectile.compileProjectileLaunch,
        resolveTimeDilationPriority,
      };
    },
  });
  const optimized = optimizeOperatorDefinitionPrograms(
    candidate.operator,
    args.optimization ?? 'apply',
  );
  return {
    ...candidate,
    operator: optimized.operator,
    audit: { ...candidate.audit, optimization: optimized.report },
    activeSkills,
  };
}

function parsePresentationVariants(
  value: unknown,
  conditions: ReadonlyMap<string, SkillPresentationVariantDefinition['condition']>,
  sourcePath: string,
): SkillPresentationVariantDefinition[] {
  if (value === undefined) return [];
  const keys = new Set<string>();
  return requireArray(value, sourcePath).map((raw, index) => {
    const path = `${sourcePath}[${index}]`;
    const row = requireRecord(raw, path);
    requireExactFields(row, new Set(['key', 'conditionId']), path);
    const key = requireNonEmptyString(row.key, `${path}.key`);
    if (keys.has(key)) throw new Error(`${sourcePath}: duplicate key '${key}'`);
    keys.add(key);
    const conditionId = requireNonEmptyString(row.conditionId, `${path}.conditionId`);
    const compiled = conditions.get(conditionId);
    if (compiled === undefined) throw new Error(`${path}: unknown condition '${conditionId}'`);
    return { key, condition: compiled };
  });
}

const RUNTIME_TEMPLATE_FIELDS = new Set([
  'sourceFile',
  'sourceSha256',
  'sourceCharacterId',
  'comboSkillGroupKey',
]);

function planOperatorRuntimeTemplate(
  value: unknown,
  slug: string,
  sourceRoot: string,
  charIdValue: unknown,
  activeSkills: readonly PlannedOperatorActiveSkillRuntime[],
  skillGroups: readonly {
    readonly key: string;
    readonly skillType: string;
    readonly skillKeys: readonly string[];
  }[],
  gameplayTagRegistry: GameplayTagRegistry,
  sources: OperatorPlanningSources,
) {
  if (value === undefined) return undefined;
  const sourcePath = `${slug}.runtimeTemplate`;
  const config = requireRecord(value, sourcePath);
  requireExactFields(config, RUNTIME_TEMPLATE_FIELDS, sourcePath);
  const sourceFile = requireNonEmptyString(config.sourceFile, `${sourcePath}.sourceFile`);
  if (
    path.isAbsolute(sourceFile) ||
    sourceFile.split(/[\\/]/u).some(segment => segment === '..' || segment.length === 0)
  ) {
    throw new Error(`${sourcePath}.sourceFile: expected a safe source-root relative path`);
  }
  const expectedSourceSha256 = requireNonEmptyString(
    config.sourceSha256,
    `${sourcePath}.sourceSha256`,
  );
  if (!/^[0-9a-f]{64}$/iu.test(expectedSourceSha256)) {
    throw new Error(`${sourcePath}.sourceSha256: expected SHA256`);
  }
  const sourceCharacterId = requireNonEmptyString(
    config.sourceCharacterId,
    `${sourcePath}.sourceCharacterId`,
  );
  const skillGroupKey =
    config.comboSkillGroupKey === null
      ? undefined
      : requireNonEmptyString(config.comboSkillGroupKey, `${sourcePath}.comboSkillGroupKey`);
  const skillGroup =
    skillGroupKey === undefined
      ? undefined
      : skillGroups.find(group => group.key === skillGroupKey);
  if (
    skillGroupKey !== undefined &&
    (skillGroup === undefined || skillGroup.skillType !== 'comboSkill')
  )
    throw new Error(`${sourcePath}.comboSkillGroupKey: expected a combo skill group`);
  const artifactPath = path.resolve(sourceRoot, sourceFile);
  const template = parseOperatorRuntimeTemplateSource(
    sources.readJson(artifactPath),
    artifactPath,
    {
      parseComboConditions: skillGroupKey !== undefined,
    },
  );
  if (template.sourceSha256.toLowerCase() !== expectedSourceSha256.toLowerCase()) {
    throw new Error(`${sourcePath}.sourceSha256: runtime template source identity changed`);
  }
  requireNonEmptyString(charIdValue, `${slug}.charId`);
  if (template.characterId !== sourceCharacterId) {
    throw new Error(
      `${sourcePath}: expected source character ${JSON.stringify(sourceCharacterId)}`,
    );
  }
  let comboSkill: PlannedOperatorActiveSkillRuntime | undefined;
  if (skillGroup !== undefined) {
    const comboSkills = activeSkills.filter(
      skill =>
        skill.definition.key === template.comboSkillId &&
        skillGroup.skillKeys.includes(skill.definition.key),
    );
    if (comboSkills.length !== 1) {
      throw new Error(
        `${sourcePath}: runtime template combo skill identity does not match manifest`,
      );
    }
    comboSkill = comboSkills[0]!;
  }
  const blackboards = compileAbilitySystemBlackboardsSource(template.blackboards);
  return {
    entityBlackboard: blackboards.entityInitialValues,
    comboSkillConditions: template.conditions?.conditions.map(
      (condition, index) =>
        compileComboSkillConditionDefinitionSource(
          condition,
          blackboards,
          { key: `native-combo:${index}`, skillKey: comboSkill!.definition.key },
          createOperatorComboActionProjectionContext(gameplayTagRegistry),
        ).definition,
    ),
    comboSkillPriority: template.comboSkillPriority,
    playerActionSource: template.playerActionSource,
    dashBuffs: template.dashBuffs,
  };
}

function compileNativePlayerActionRouting(
  source: ReturnType<typeof parseOperatorRuntimeTemplateSource>['playerActionSource'],
  activeSkills: readonly PlannedOperatorActiveSkillRuntime[],
) {
  const availableSkillIds = new Set(activeSkills.map(skill => skill.definition.key));
  const requireSkillKey = (skillId: string, path: string) => {
    if (!availableSkillIds.has(skillId))
      throw new Error(`${path}: native skill '${skillId}' is not converted`);
    return skillId;
  };
  const slotBaseSkillKeys = {
    battleSkill: requireSkillKey(source.slotSkillIds.battleSkill, 'CharacterData.normalSkillId'),
    comboSkill: requireSkillKey(source.slotSkillIds.comboSkill, 'CharacterData.comboSkillId'),
    ultimate: requireSkillKey(source.slotSkillIds.ultimate, 'CharacterData.ultimateSkillId'),
  };
  for (const input of ['battleSkill', 'comboSkill', 'ultimate'] as const) {
    const mapped = source.defaultCommandSkillIds[input];
    if (mapped !== undefined && mapped !== source.slotSkillIds[input]) {
      throw new Error(`CharacterData.defaultCmdMapping.${input}: does not match its base slot`);
    }
  }
  const basicAttackSkillKeys = [
    ...new Set([
      ...source.allNormalAttackIds,
      ...source.modes.flatMap(mode => mode.normalAttackSkillIds ?? []),
      ...source.modes.flatMap(mode => {
        const skillId = mode.commandSkillIds?.basicAttack;
        return skillId === undefined ? [] : [skillId];
      }),
    ]),
  ].flatMap(skillId => {
    return availableSkillIds.has(skillId) ? [skillId] : [];
  });
  const normalAttackSkillKeys = source.normalAttackSkillIds.map(skillId =>
    requireSkillKey(skillId, 'CharacterData.normalAttackList'),
  );
  const defaultBasicAttackSkillId = source.defaultCommandSkillIds.basicAttack;
  const defaultBasicAttackSkillKey =
    defaultBasicAttackSkillId === undefined
      ? undefined
      : requireSkillKey(defaultBasicAttackSkillId, 'CharacterData.defaultCmdMapping.basicAttack');
  const playerActionModes = source.modes.flatMap(mode => {
    if (mode.normalAttackSkillIds === undefined && mode.commandSkillIds === undefined) return [];
    const commandMappings = Object.fromEntries(
      Object.entries(mode.commandSkillIds ?? {}).map(([input, skillId]) => [input, { skillId }]),
    );
    return [
      {
        modeId: mode.modeId,
        modeLayer: mode.modeLayer,
        defaultEnabled: mode.defaultEnabled,
        ...(mode.normalAttackSkillIds === undefined
          ? {}
          : {
              normalAttackSkillKeys: mode.normalAttackSkillIds.map(skillId =>
                requireSkillKey(skillId, `CharacterData.mode.${mode.modeId}.normalAttackSkillIds`),
              ),
            }),
        ...(Object.keys(commandMappings).length === 0 ? {} : { commandMappings }),
      },
    ];
  });
  return {
    slotBaseSkillKeys,
    basicAttackSkillKeys,
    normalAttackSkillKeys,
    ...(defaultBasicAttackSkillKey === undefined ? {} : { defaultBasicAttackSkillKey }),
    playerActionModes,
  };
}

function createActiveSkillSlotReplacementProjection(skills: readonly { readonly key: string }[]) {
  const availableSkillIds = new Set(skills.map(skill => skill.key));
  return (action: SkillSlotReplacementActionSource, sourcePath: string) => {
    if (
      !['Owner', 'Source'].includes(action.skillSource.targetSource) ||
      action.skillSource.targetGroupKey !== '' ||
      action.skillSource.selectorOwner !== 'ActionOwner' ||
      action.skillSource.finderType !== null ||
      action.skillSource.validatorTypes.length !== 0 ||
      action.skillSource.postProcessorTypes.length !== 0
    ) {
      throw new Error(`${sourcePath}: active skill replacement must target its plain Owner/Source`);
    }
    if (action.overrideCacheTime) {
      throw new Error(
        `${sourcePath}: active skill replacement input-cache override is unsupported`,
      );
    }
    if (action.lifetime === 'SpecificTime') {
      throw new Error(`${sourcePath}: timed active skill replacement is unsupported`);
    }
    if (!availableSkillIds.has(action.targetSkillId)) {
      throw new Error(`${sourcePath}: unknown replacement target skill '${action.targetSkillId}'`);
    }
    const targetSkillKey = action.targetSkillId;
    const skillSlotKey =
      action.skillSlot === 'NormalSkill'
        ? 'battleSkill'
        : action.skillSlot === 'ComboSkill'
          ? 'comboSkill'
          : 'ultimate';
    const mappedRevertedSkillKey = action.specificRevertedSkillId
      ? availableSkillIds.has(action.revertedSkillId)
        ? action.revertedSkillId
        : undefined
      : undefined;
    return [
      {
        kind: 'changeSkillSlot' as const,
        parameters: {
          skillGroupKey: skillSlotKey,
          targetSkillKey,
          inheritOriginSkillCooldownProgress: action.inheritOriginSkillCooldownProgress,
          lifetime:
            action.lifetime === 'Infinite' ? ('infinite' as const) : ('finishByAction' as const),
          ...(mappedRevertedSkillKey === undefined
            ? {}
            : { revertedSkillKey: mappedRevertedSkillKey }),
        },
      },
    ];
  };
}

function createActiveSkillTypeMutationProjection(skills: readonly { readonly key: string }[]) {
  const availableSkillIds = new Set(skills.map(skill => skill.key));
  return (
    action: import('../src/source/presentationActions.ts').SkillTypeMutationActionSource,
    sourcePath: string,
    context: import('../src/compiler/combatProjectionCommon.ts').CombatActionProjectionContextSource,
  ) => {
    if (
      context.actionOwnerTarget !== 'caster' &&
      !(context.actionOwnerTarget === 'buffOwner' && context.fixedBuffOwnerTarget === 'caster')
    ) {
      throw new Error(`${sourcePath}: ChangeSkillType owner is not the compiled operator`);
    }
    if (!availableSkillIds.has(action.skillId)) {
      throw new Error(`${sourcePath}: unknown SkillType mutation target '${action.skillId}'`);
    }
    return [
      {
        kind: 'changeNativeSkillType' as const,
        parameters: { targetSkillKey: action.skillId, nativeSkillType: action.nativeSkillType },
      },
    ];
  };
}

function resolveBasePassiveLevelSource(
  skillLibrary: ReturnType<typeof compileOperatorFoundationSource>['skillLibrary'],
  passiveSkillId: string,
) {
  const nativeGroups = skillLibrary.nativeSkillGroups.filter(group =>
    group.skillIds.includes(passiveSkillId),
  );
  if (nativeGroups.length > 1) {
    throw new Error(
      `base passive ${JSON.stringify(passiveSkillId)} belongs to multiple native skill groups`,
    );
  }
  if (nativeGroups.length === 0) return { kind: 'nativeDefault' as const };
  const nativeGroup = nativeGroups[0]!;
  const projectedSources = [
    ...skillLibrary.skillGroups
      .filter(group => group.nativeGroupType === nativeGroup.nativeGroupType)
      .map(group => group.levelSource),
    ...skillLibrary.skillGroups.flatMap(group =>
      group.variants
        .filter(variant => variant.nativeGroupType === nativeGroup.nativeGroupType)
        .map(variant => variant.levelSource),
    ),
  ];
  const levelSources = [...new Set(projectedSources)];
  if (levelSources.length !== 1) {
    throw new Error(
      `${nativeGroup.sourcePath}: base passive ${JSON.stringify(passiveSkillId)} must resolve to exactly one project skill level source`,
    );
  }
  return { kind: 'operatorSkillGroup' as const, levelSource: levelSources[0]! };
}

function parsePlayerActionRouting(
  slotsValue: unknown,
  routesValue: unknown,
  path: string,
  knownSkillKeys: ReadonlySet<string>,
):
  | {
      readonly skillSlots: readonly OperatorSkillSlotDefinition[];
      readonly playerActionRoutes: OperatorPlayerActionRoutes;
    }
  | undefined {
  if (slotsValue === undefined && routesValue === undefined) return undefined;
  if (slotsValue === undefined || routesValue === undefined) {
    throw new Error(`${path}: skillSlots and playerActionRoutes must be provided together`);
  }
  const skillSlots = requireArray(slotsValue, `${path}.skillSlots`).map((value, index) => {
    const slotPath = `${path}.skillSlots[${index}]`;
    const slot = requireRecord(value, slotPath);
    const expected = new Set(['key', 'baseSkillKey', 'replacementSkillKeys']);
    if (slot.stableSkillKeys !== undefined) expected.add('stableSkillKeys');
    requireExactFields(slot, expected, slotPath);
    const baseSkillKey = requireNonEmptyString(slot.baseSkillKey, `${slotPath}.baseSkillKey`);
    const stableSkillKeys = optionalStrings(
      slot.stableSkillKeys,
      `${slotPath}.stableSkillKeys`,
    ) ?? [baseSkillKey];
    const replacementSkillKeys =
      optionalStrings(slot.replacementSkillKeys, `${slotPath}.replacementSkillKeys`) ?? [];
    if (!stableSkillKeys.includes(baseSkillKey)) {
      throw new Error(`${slotPath}.stableSkillKeys: must include baseSkillKey`);
    }
    const allKeys = [...stableSkillKeys, ...replacementSkillKeys];
    if (new Set(allKeys).size !== allKeys.length) {
      throw new Error(`${slotPath}: duplicate skill identity`);
    }
    for (const key of allKeys) {
      if (!knownSkillKeys.has(key)) throw new Error(`${slotPath}: unknown skill '${key}'`);
    }
    return {
      key: requireNonEmptyString(slot.key, `${slotPath}.key`),
      baseSkillKey,
      ...(slot.stableSkillKeys === undefined ? {} : { stableSkillKeys }),
      replacementSkillKeys,
    } satisfies OperatorSkillSlotDefinition;
  });
  const slotByKey = new Map(skillSlots.map(slot => [slot.key, slot] as const));
  if (slotByKey.size !== skillSlots.length) throw new Error(`${path}.skillSlots: duplicate key`);

  const routesRecord = requireRecord(routesValue, `${path}.playerActionRoutes`);
  const inputs = ['basicAttack', 'battleSkill', 'comboSkill', 'ultimate'] as const;
  requireExactFields(routesRecord, new Set(inputs), `${path}.playerActionRoutes`);
  const playerActionRoutes: Partial<Record<PlayerSkillInput, PlayerActionRouteDefinition>> = {};
  for (const input of inputs) {
    const routePath = `${path}.playerActionRoutes.${input}`;
    const route = requireRecord(routesRecord[input], routePath);
    const kind = requireNonEmptyString(route.kind, `${routePath}.kind`);
    if (kind === 'basicAttack') {
      const expected = new Set(['kind', 'skillKeys']);
      if (route.normalAttackSkillKeys !== undefined) expected.add('normalAttackSkillKeys');
      if (route.defaultSkillKey !== undefined) expected.add('defaultSkillKey');
      requireExactFields(route, expected, routePath);
      const skillKeys = optionalStrings(route.skillKeys, `${routePath}.skillKeys`) ?? [];
      if (skillKeys.length === 0) throw new Error(`${routePath}.skillKeys: expected entries`);
      for (const key of skillKeys) {
        if (!knownSkillKeys.has(key)) throw new Error(`${routePath}: unknown skill '${key}'`);
      }
      const defaultSkillKey =
        route.defaultSkillKey === undefined
          ? undefined
          : requireNonEmptyString(route.defaultSkillKey, `${routePath}.defaultSkillKey`);
      if (defaultSkillKey !== undefined && !skillKeys.includes(defaultSkillKey)) {
        throw new Error(`${routePath}.defaultSkillKey: must be included in skillKeys`);
      }
      const normalAttackSkillKeys =
        optionalStrings(route.normalAttackSkillKeys, `${routePath}.normalAttackSkillKeys`) ?? [];
      for (const key of normalAttackSkillKeys) {
        if (!skillKeys.includes(key)) {
          throw new Error(`${routePath}.normalAttackSkillKeys: '${key}' is not in skillKeys`);
        }
      }
      playerActionRoutes[input] = {
        kind: 'basicAttack',
        skillKeys,
        ...(normalAttackSkillKeys.length === 0 ? {} : { normalAttackSkillKeys }),
        ...(defaultSkillKey === undefined ? {} : { defaultSkillKey }),
      };
      continue;
    }
    if (kind !== 'skillSlot') throw new Error(`${routePath}.kind: unsupported '${kind}'`);
    requireExactFields(route, new Set(['kind', 'skillSlotKey']), routePath);
    const skillSlotKey = requireNonEmptyString(route.skillSlotKey, `${routePath}.skillSlotKey`);
    if (!slotByKey.has(skillSlotKey)) {
      throw new Error(`${routePath}.skillSlotKey: unknown slot '${skillSlotKey}'`);
    }
    playerActionRoutes[input] = { kind: 'skillSlot', skillSlotKey };
  }
  const referencedSlots = Object.values(playerActionRoutes).flatMap(route =>
    route?.kind === 'skillSlot' ? [route.skillSlotKey] : [],
  );
  if (new Set(referencedSlots).size !== referencedSlots.length) {
    throw new Error(`${path}.playerActionRoutes: a skill slot is used by multiple actions`);
  }
  if (referencedSlots.length !== skillSlots.length) {
    throw new Error(`${path}.skillSlots: every slot must be referenced exactly once`);
  }
  return { skillSlots, playerActionRoutes };
}

function optionalStrings(value: unknown, sourcePath: string): string[] | undefined {
  if (value === undefined) return undefined;
  return requireArray(value, sourcePath).map((item, index) =>
    requireNonEmptyString(item, `${sourcePath}[${index}]`),
  );
}

function parseNativeMissingBlackboardZeroKeys(
  value: unknown,
  sourcePath: string,
): ReadonlyMap<string, ReadonlySet<string>> {
  if (value === undefined) return new Map();
  const record = requireRecord(value, sourcePath);
  return new Map(
    Object.entries(record).map(([skillId, keys]) => [
      requireNonEmptyString(skillId, `${sourcePath} skillId`),
      new Set(
        requireArray(keys, `${sourcePath}.${skillId}`).map((key, index) =>
          requireNonEmptyString(key, `${sourcePath}.${skillId}[${index}]`),
        ),
      ),
    ]),
  );
}

function parseNativeMissingEntityBlackboardZeroKeys(
  value: unknown,
  sourcePath: string,
): ReadonlySet<string> {
  if (value === undefined) return new Set();
  return new Set(
    requireArray(value, sourcePath).map((rawKey, index) => {
      const key = requireNonEmptyString(rawKey, `${sourcePath}[${index}]`);
      if (!key.startsWith('EntityBB_') || key.length === 'EntityBB_'.length) {
        throw new Error(`${sourcePath}[${index}]: expected a non-empty EntityBB_ key`);
      }
      return key;
    }),
  );
}

/**
 * 空 Buff 也可能是已安装被动监听的事件协议。主动技能的纯表现闭包必须在裁剪前看见
 * 这些跨 SkillData 的身份读取，否则会删掉唯一负责发布事件的 applyBuff。
 */
function collectObservedBuffIdsFromPassiveSkill(
  graph: ReturnType<typeof parseKnownSkillActionGraphSource>,
): string[] {
  const collectCondition = (condition: NativeConditionSource): string[] => {
    if (condition.kind === 'buffStack') return [...condition.buffIds];
    if (condition.kind === 'contextBuff' && condition.matcher.kind === 'id') {
      return condition.matcher.buffIds.flatMap(id =>
        id.kind === 'constant' && id.value.length > 0 ? [id.value] : [],
      );
    }
    if (condition.kind === 'any') {
      return condition.groups.flatMap(group => group.conditions.flatMap(collectCondition));
    }
    return [];
  };
  return [
    ...graph.actionGroup.timelineActions.map(item => item.sequence),
    ...graph.actionGroup.passiveEvents.flatMap(item => item.actions),
  ].flatMap(sequence =>
    collectNativeActionNodes(sequence).flatMap(node =>
      node.metadata.enabled && node.body.kind === 'leaf' && node.body.value.family === 'condition'
        ? collectCondition(node.body.value.action)
        : [],
    ),
  );
}

const ROUTED_SKILL_CONFIG_FIELDS = new Set([
  'kind',
  'targetSkillKey',
  'executionSkillType',
  'executionLevelSource',
  'activationBuffId',
  'routingBuffId',
  'costResource',
]);

/** 把旧 Python 已取证的跨组路由语义收进 TS 整名主干；这里只接受完全同构的包装器。 */
export function planRoutedSkills(
  row: Record<string, unknown>,
  entries: readonly OperatorActiveSkillEntrySource[],
  activeSkills: readonly Pick<PlannedOperatorActiveSkillRuntime, 'definition'>[],
  skillGroups: readonly { readonly key: string; readonly skillKeys: readonly string[] }[],
  skillDataBySourceFile: Readonly<Record<string, unknown>>,
  slug: string,
) {
  const routedKeys = optionalStrings(row.routedSkillKeys, `${slug}.routedSkillKeys`) ?? [];
  const entryByKey = new Map(entries.map(entry => [entry.key, entry] as const));
  const plannedByKey = new Map(activeSkills.map(item => [item.definition.key, item] as const));
  return routedKeys.map(key => {
    const entry = entryByKey.get(key);
    const wrapper = plannedByKey.get(key)?.definition;
    if (entry === undefined || wrapper === undefined || entry.projectionConfig === null) {
      throw new Error(
        `${slug}.routedSkillKeys: unknown or unconfigured key ${JSON.stringify(key)}`,
      );
    }
    const path = `${entry.sourcePath}.compile`;
    const config = entry.projectionConfig;
    requireExactFields(
      config,
      new Set([
        'kind',
        'targetSkillKey',
        ...[...ROUTED_SKILL_CONFIG_FIELDS].filter(field => config[field] !== undefined),
      ]),
      path,
    );
    if (config.kind !== 'routedSkill') throw new Error(`${path}.kind: expected routedSkill`);
    const targetSkillKey = requireNonEmptyString(config.targetSkillKey, `${path}.targetSkillKey`);
    const targetEntry = entryByKey.get(targetSkillKey);
    const target = plannedByKey.get(targetSkillKey)?.definition;
    if (targetEntry === undefined || target === undefined) {
      throw new Error(`${path}.targetSkillKey: unknown skill ${JSON.stringify(targetSkillKey)}`);
    }
    const executionSkillType = requireNonEmptyString(
      config.executionSkillType === undefined ? targetEntry.skillType : config.executionSkillType,
      `${path}.executionSkillType`,
    );
    if (executionSkillType !== targetEntry.skillType) {
      throw new Error(`${path}.executionSkillType: expected ${targetEntry.skillType}`);
    }
    const executionLevelSource = requireNonEmptyString(
      config.executionLevelSource === undefined
        ? targetEntry.levelSource
        : config.executionLevelSource,
      `${path}.executionLevelSource`,
    );
    const targetGroups = skillGroups.filter(group => group.skillKeys.includes(targetSkillKey));
    if (targetGroups.length !== 1 || targetEntry.levelSource !== executionLevelSource) {
      throw new Error(`${path}: target placement group or per-skill level source does not match`);
    }
    const route = wrapper.switchToBuffCast;
    const condition = route?.condition;
    const routeStep = route?.sequence.steps[0];
    const activationBuffId = requireNonEmptyString(
      config.activationBuffId === undefined
        ? condition?.kind === 'buffIdStackCompare'
          ? condition.buffIds[0]
          : undefined
        : config.activationBuffId,
      `${path}.activationBuffId`,
    );
    const routingBuffId = requireNonEmptyString(
      config.routingBuffId === undefined
        ? routeStep?.kind === 'applyBuff'
          ? routeStep.parameters.buffId
          : undefined
        : config.routingBuffId,
      `${path}.routingBuffId`,
    );
    if (config.costResource !== undefined && config.costResource !== 'sp')
      throw new Error(`${path}.costResource: expected sp`);
    if (
      route?.asSkillCast !== false ||
      route.sequence.steps.length !== 1 ||
      condition?.kind !== 'buffIdStackCompare' ||
      condition.target !== 'caster' ||
      condition.operator !== 'greaterOrEqual' ||
      condition.buffIds.length !== 1 ||
      condition.buffIds[0] !== activationBuffId ||
      (typeof condition.value === 'number'
        ? condition.value !== 1
        : condition.value.kind !== 'constant' || condition.value.value !== 1) ||
      routeStep?.kind !== 'applyBuff' ||
      routeStep.parameters.buffId !== routingBuffId ||
      routeStep.parameters.target !== 'caster' ||
      routeStep.parameters.inheritSourceSkillCastInfo !== true ||
      wrapper.scheduledSequences.length !== 0
    ) {
      throw new Error(`${path}: SwitchToAddBuff wrapper does not match routed-skill evidence`);
    }
    const source = requireRecord(skillDataBySourceFile[entry.sourceFile], entry.sourceFile);
    const cast = requireRecord(source.castData, `${entry.sourceFile}.castData`);
    const cost = requireRecord(cast.costData, `${entry.sourceFile}.castData.costData`);
    const cooldownSeconds = requireNumber(
      cast.cooldownTime,
      `${entry.sourceFile}.castData.cooldownTime`,
    );
    const costValue = requireNumber(
      cost.costValue,
      `${entry.sourceFile}.castData.costData.costValue`,
    );
    const cooldownFrames = cooldownSeconds * 30;
    if (
      cast.startCdFrame !== wrapper.costFrame ||
      cost.costType !== 'Atb' ||
      costValue <= 0 ||
      cooldownSeconds <= 0 ||
      !Number.isInteger(cooldownFrames)
    ) {
      throw new Error(`${path}: routed wrapper CastData cost/cooldown is unsupported`);
    }
    return {
      key,
      targetSkillKey,
      skillType: targetEntry.skillType,
      levelSource: targetEntry.levelSource,
      executionSkillGroupKey: targetGroups[0]!.key,
      costs: [{ resource: 'sp' as const, value: costValue }],
      costFrame: wrapper.costFrame,
      cooldownFrames,
    };
  });
}

/**
 * 单名诊断用的保守渲染，不写文件，也不假定已收齐其他干员与装备的消费者。
 * 正式单名生成与整批重建共用 renderOperatorDefinitionBatch，不能用这里的文本复验正式库。
 */
export async function renderOperatorDefinition(args: Parameters<typeof planOperatorDefinition>[0]) {
  const plan = planOperatorDefinition(args);
  return { plan, ...(await renderOperatorDefinitionFiles(args.slug, plan.operator, plan.audit)) };
}

/** 从已规划并优化的纯数据渲染文件；整批入口可先收齐跨干员用途，再进入此步骤。 */
export async function renderOperatorDefinitionFiles(
  slug: string,
  operator: OperatorDefinition,
  audit: unknown,
) {
  const prettierConfig = (await resolveConfig(path.resolve('.prettierrc.json'))) ?? {};
  const content = await format(
    renderOperatorDefinitionSource({
      operator: {
        ...operator,
        conversionSupport: { completeness: 'complete', missingCapabilities: [] },
      },
    }),
    { ...prettierConfig, parser: 'typescript' },
  );
  const file = {
    relativePath: `${slug}.generated.ts`,
    content,
  };
  return {
    file,
    auditFile: {
      relativePath: 'operator.audit.json',
      content: JSON.stringify(audit, null, 2) + '\n',
    },
  };
}
