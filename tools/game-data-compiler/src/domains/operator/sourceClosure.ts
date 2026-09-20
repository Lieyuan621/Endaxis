import {
  STANDARD_OPERATOR_PANEL_MILESTONES,
  compileOperatorAttributeGrowthSource,
  parseOperatorCharacterTableSource,
  type CompiledOperatorAttributeGrowthSource,
  type OperatorCharacterTableSource,
} from './characterTable.ts';
import { parseOperatorProgressionSource, type OperatorProgressionSource } from './progression.ts';
import {
  compileOperatorSkillLibrarySource,
  type OperatorSkillLibrarySource,
} from './skillLibrary.ts';
import type { OperatorSkillGroupValidationOptions } from './skillGroups.ts';
import {
  compilePassiveSkillRequestBatch,
  type PassiveSkillCompilationBatchSource,
} from '../../compiler/skills/passiveSkillBatch.ts';
import {
  compileReferencedSkillDefinitionNode,
  createSkillDefinitionReferenceNode,
} from '../../compiler/references/referenceDefinitions.ts';
import {
  resolveDefinitionReferenceClosure,
  type DefinitionReferenceClosureSource,
  type DefinitionReferenceNodeSource,
} from '../../compiler/references/referenceClosure.ts';
import {
  compileActiveSkillAbilityEntityQueriesSource,
  type CompiledActiveSkillAbilityEntityQuerySource,
} from '../../compiler/abilities/activeSkillAbilityEntityQueries.ts';
import type { CompiledAbilityEntityTemplateCatalogSource } from '../../compiler/abilities/abilityEntityCatalog.ts';
import type { GameplayTagRegistry } from '../../source/nativeGameplayTags.ts';
import type { OperatorProductIdentitySource } from './productIdentity.ts';

export interface OperatorAbilityEntityQueryContext {
  readonly catalog: CompiledAbilityEntityTemplateCatalogSource;
  readonly registry: GameplayTagRegistry;
}

export interface OperatorActiveSkillAbilityEntityQueriesSource {
  readonly skillKey: string;
  readonly skillId: string;
  readonly queries: readonly CompiledActiveSkillAbilityEntityQuerySource[];
}

export interface OperatorSourceClosureInput {
  readonly identity: OperatorProductIdentitySource;
  readonly manifestSkills: unknown;
  readonly manifestSkillGroups: unknown;
  readonly skillDataBySourceFile: unknown;
  readonly skillDataById: unknown;
  readonly buffDefinitionNodes: readonly DefinitionReferenceNodeSource[];
  readonly projectileDefinitionNodes: readonly DefinitionReferenceNodeSource[];
  readonly abilityEntityDefinitionNodes: readonly DefinitionReferenceNodeSource[];
  /** 下载计划阶段模板尚未到位时为空；正式编译遇到相关查询时必须提供。 */
  readonly abilityEntityQueryContext?: OperatorAbilityEntityQueryContext;
  readonly skillPatchTable: unknown;
  readonly characterTable: unknown;
  readonly charGrowthTable: unknown;
  readonly characterPotentialTable: unknown;
  readonly potentialTalentEffectTable: unknown;
  readonly skillConditionTable: unknown;
  readonly skillGroupValidationOptions?: OperatorSkillGroupValidationOptions;
}

/** 时间轴行为投影之前，Operator 所有私有入口与公共 SkillData 身份均已闭合的领域结果。 */
export interface OperatorSourceClosure {
  readonly identity: OperatorProductIdentitySource;
  readonly character: OperatorCharacterTableSource;
  readonly attributeGrowth: CompiledOperatorAttributeGrowthSource;
  readonly skillLibrary: OperatorSkillLibrarySource;
  readonly progression: OperatorProgressionSource;
  readonly passiveSkills: PassiveSkillCompilationBatchSource;
  readonly definitionClosure: DefinitionReferenceClosureSource;
  readonly activeSkillAbilityEntityQueries: readonly OperatorActiveSkillAbilityEntityQueriesSource[];
}

export function compileOperatorSourceClosure(
  input: OperatorSourceClosureInput,
): OperatorSourceClosure {
  const result = resolveOperatorSourceClosure(input);
  if (result.definitionClosure.missing.length > 0) {
    const first = result.definitionClosure.missing[0]!;
    throw new Error(
      `${first.reference.sourcePath}: missing active ${first.reference.kind} definition ${JSON.stringify(first.reference.id)}`,
    );
  }
  const unresolvedQuery = result.skillLibrary.activeSkills.entries.find(entry =>
    entry.definition.definition.targetGroupWrites.some(
      write => write.finderType === 'OwnerSpawnedEntityFinder',
    ),
  );
  if (unresolvedQuery && !input.abilityEntityQueryContext) {
    throw new Error(
      `${unresolvedQuery.sourcePath}: owner-spawned AbilityEntity query requires a versioned template catalog and GameplayTag registry`,
    );
  }
  return result;
}

/**
 * 来源下载闭包与最终定义装配共享的角色基础：只包含已严格校验的面板、技能库与养成。
 * 它自身不声明动作依赖已闭合；调用方必须继续完成来源闭包或最终运行定义闭包。
 */
export function compileOperatorFoundationSource(
  input: Pick<
    OperatorSourceClosureInput,
    | 'identity'
    | 'characterTable'
    | 'manifestSkills'
    | 'manifestSkillGroups'
    | 'skillDataBySourceFile'
    | 'skillPatchTable'
    | 'charGrowthTable'
    | 'characterPotentialTable'
    | 'potentialTalentEffectTable'
    | 'skillConditionTable'
    | 'skillGroupValidationOptions'
  >,
): Pick<
  OperatorSourceClosure,
  'identity' | 'character' | 'attributeGrowth' | 'skillLibrary' | 'progression'
> {
  const character = parseOperatorCharacterTableSource(
    input.characterTable,
    input.identity.characterId,
  );
  const skillLibrary = compileOperatorSkillLibrarySource({
    characterId: input.identity.characterId,
    sourcePath: input.identity.slug,
    manifestSkills: input.manifestSkills,
    manifestSkillGroups: input.manifestSkillGroups,
    skillDataBySourceFile: input.skillDataBySourceFile,
    skillPatchTable: input.skillPatchTable,
    charGrowthTable: input.charGrowthTable,
    validationOptions: input.skillGroupValidationOptions,
  });
  const progression = parseOperatorProgressionSource(
    character,
    input.charGrowthTable,
    input.characterPotentialTable,
    input.potentialTalentEffectTable,
    input.skillConditionTable,
  );
  return {
    identity: input.identity,
    character,
    skillLibrary,
    progression,
    attributeGrowth: compileOperatorAttributeGrowthSource(
      character,
      STANDARD_OPERATOR_PANEL_MILESTONES,
    ),
  };
}

/** 来源下载闭包与正式对象装配共享上面的头部/技能库/养成编译，不能各自重新解释原始表。 */
export function resolveOperatorSourceClosure(
  input: OperatorSourceClosureInput,
): OperatorSourceClosure {
  const foundation = compileOperatorFoundationSource(input);
  const { skillLibrary, progression } = foundation;
  const passiveSkills = compilePassiveSkillRequestBatch(
    [...progression.talentPassiveSkillRequests, ...progression.potentialPassiveSkillRequests],
    input.skillDataById,
    input.skillPatchTable,
  );
  const skillNodes = [
    ...skillLibrary.activeSkills.definitions.map(definition =>
      createSkillDefinitionReferenceNode(definition.definition.skill, definition.sourcePath),
    ),
    ...passiveSkills.definitions.map(definition =>
      createSkillDefinitionReferenceNode(definition.definition.skill, definition.sourcePath),
    ),
  ];
  const roots = [
    ...skillNodes.map(node => [node.kind, node.id] as const),
    ...progression.compiledEffectBundles.flatMap(bundle =>
      bundle.entries
        .filter(entry => entry.kind === 'buff')
        .map(entry => ['buff', entry.buffId] as const),
    ),
  ];
  const definitionNodes = [
    ...skillNodes,
    ...input.buffDefinitionNodes,
    ...input.projectileDefinitionNodes,
    ...input.abilityEntityDefinitionNodes,
  ];
  const knownSkills = new Set(skillNodes.map(node => node.id));
  let definitionClosure = resolveDefinitionReferenceClosure(roots, definitionNodes);
  while (true) {
    const missingSkillIds = [
      ...new Set(
        definitionClosure.missing
          .filter(missing => missing.reference.kind === 'skill')
          .map(missing => missing.reference.id)
          .filter((id): id is string => Boolean(id) && !knownSkills.has(id!)),
      ),
    ];
    if (missingSkillIds.length === 0) break;
    for (const skillId of missingSkillIds) {
      definitionNodes.push(
        compileReferencedSkillDefinitionNode(skillId, input.skillDataById, input.skillPatchTable),
      );
      knownSkills.add(skillId);
    }
    definitionClosure = resolveDefinitionReferenceClosure(roots, definitionNodes);
  }
  const queryContext = input.abilityEntityQueryContext;
  const activeSkillAbilityEntityQueries = queryContext
    ? skillLibrary.activeSkills.entries
        .map(entry => ({
          skillKey: entry.key,
          skillId: entry.key,
          queries: compileActiveSkillAbilityEntityQueriesSource(
            entry.definition.definition,
            queryContext.catalog,
            queryContext.registry,
          ),
        }))
        .filter(entry => entry.queries.length > 0)
    : [];
  return {
    ...foundation,
    passiveSkills,
    definitionClosure,
    activeSkillAbilityEntityQueries,
  };
}
