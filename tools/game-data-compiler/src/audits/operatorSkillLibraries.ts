import { requireArray, requireNonEmptyString, requireRecord } from '../source/primitives.ts';
import { compileOperatorSkillLibrarySource } from '../domains/operator/skillLibrary.ts';
import { parseOperatorSkillGroupValidationOptions } from '../domains/operator/skillGroups.ts';
import { compileOperatorSourceClosure } from '../domains/operator/sourceClosure.ts';
import { resolveOperatorSourceClosure } from '../domains/operator/sourceClosure.ts';
import { parseOperatorProductIdentitySource } from '../domains/operator/productIdentity.ts';
import {
  createAbilityEntityDefinitionReferenceNodes,
  parseBuffDefinitionReferenceNodes,
  parseProjectileDefinitionReferenceNodes,
} from '../compiler/references/referenceDefinitions.ts';
import { compileAbilityEntityTemplateCatalogSource } from '../compiler/abilities/abilityEntityCatalog.ts';
import { GameplayTagRegistry } from '../source/nativeGameplayTags.ts';

export interface OperatorSkillLibraryAuditEntrySource {
  readonly slug: string;
  readonly characterId: string;
  readonly status: 'supported' | 'blocked';
  readonly skillCount: number;
  readonly definitionCount: number;
  readonly groupCount: number;
  readonly error?: string;
}

export interface OperatorSkillLibraryAuditSource {
  readonly operatorCount: number;
  readonly supportedCount: number;
  readonly blockedCount: number;
  readonly skillCount: number;
  readonly entries: readonly OperatorSkillLibraryAuditEntrySource[];
}

export interface OperatorSourceClosureAuditEntrySource {
  readonly slug: string;
  readonly characterId: string;
  readonly status: 'supported' | 'blocked';
  readonly activeSkillCount: number;
  readonly passiveSkillRequestCount: number;
  readonly passiveSkillDefinitionCount: number;
  readonly talentNodeCount: number;
  readonly potentialUnlockCount: number;
  readonly error?: string;
}

export interface OperatorSourceClosureAuditSource {
  readonly operatorCount: number;
  readonly supportedCount: number;
  readonly blockedCount: number;
  readonly activeSkillCount: number;
  readonly passiveSkillRequestCount: number;
  readonly passiveSkillDefinitionCount: number;
  readonly entries: readonly OperatorSourceClosureAuditEntrySource[];
}

export interface OperatorSourceClosureAuditInput {
  readonly manifest: unknown;
  readonly skillDataBySourceFile: unknown;
  readonly skillDataById: unknown;
  readonly buffDataById: unknown;
  readonly projectileDataById: unknown;
  readonly abilityEntityDataById: unknown;
  readonly gameplayTagPaths: readonly string[];
  readonly skillPatchTable: unknown;
  readonly characterTable: unknown;
  readonly charGrowthTable: unknown;
  readonly characterPotentialTable: unknown;
  readonly potentialTalentEffectTable: unknown;
  readonly skillConditionTable: unknown;
}

export type OperatorUnityTemplateReferencePlanInput = Omit<
  OperatorSourceClosureAuditInput,
  'projectileDataById' | 'abilityEntityDataById' | 'gameplayTagPaths'
>;

export interface OperatorUnityTemplateReferencePlanEntrySource {
  readonly id: string;
  readonly referencedBy: readonly {
    readonly operatorSlug: string;
    readonly sourcePath: string;
  }[];
}

export interface OperatorUnityTemplateReferencePlanSource {
  readonly operatorCount: number;
  readonly complete: boolean;
  readonly unresolvedDefinitions: readonly {
    readonly kind: 'skill' | 'buff';
    readonly id: string;
    readonly operatorSlug: string;
    readonly sourcePath: string;
  }[];
  readonly projectiles: readonly OperatorUnityTemplateReferencePlanEntrySource[];
  readonly abilityEntities: readonly OperatorUnityTemplateReferencePlanEntrySource[];
}

/** 批量审计所有 Operator 主动 SkillData 与原生等级组闭包；单项失败不会吞掉其余结果。 */
export function auditOperatorSkillLibraries(
  manifestValue: unknown,
  skillDataBySourceFile: unknown,
  skillPatchTable: unknown,
  charGrowthTable: unknown,
): OperatorSkillLibraryAuditSource {
  const manifest = requireRecord(manifestValue, 'operators.json');
  const entries = requireArray(manifest.operators, 'operators.json.operators').map(
    (rawOperator, index): OperatorSkillLibraryAuditEntrySource => {
      const path = `operators.json.operators[${index}]`;
      const operator = requireRecord(rawOperator, path);
      const slug = requireNonEmptyString(operator.slug, `${path}.slug`);
      const characterId = requireNonEmptyString(operator.charId, `${path}.charId`);
      try {
        const result = compileOperatorSkillLibrarySource({
          characterId,
          sourcePath: slug,
          manifestSkills: operator.skills,
          manifestSkillGroups: operator.skillGroups,
          skillDataBySourceFile,
          skillPatchTable,
          charGrowthTable,
          validationOptions: parseOperatorSkillGroupValidationOptions(operator, path),
        });
        return {
          slug,
          characterId,
          status: 'supported',
          skillCount: result.activeSkills.entries.length,
          definitionCount: result.activeSkills.definitions.length,
          groupCount: result.skillGroups.length,
        };
      } catch (error) {
        return {
          slug,
          characterId,
          status: 'blocked',
          skillCount: Array.isArray(operator.skills) ? operator.skills.length : 0,
          definitionCount: 0,
          groupCount: Array.isArray(operator.skillGroups) ? operator.skillGroups.length : 0,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  );
  return {
    operatorCount: entries.length,
    supportedCount: entries.filter(entry => entry.status === 'supported').length,
    blockedCount: entries.filter(entry => entry.status === 'blocked').length,
    skillCount: entries.reduce((sum, entry) => sum + entry.skillCount, 0),
    entries,
  };
}

/** 批量审计 Operator 在行为投影前的完整来源闭包，包括养成引用的公共被动 SkillData。 */
export function auditOperatorSourceClosures(
  input: OperatorSourceClosureAuditInput,
): OperatorSourceClosureAuditSource {
  const manifest = requireRecord(input.manifest, 'operators.json');
  const buffDefinitionNodes = parseBuffDefinitionReferenceNodes(input.buffDataById);
  const projectileDefinitionNodes = parseProjectileDefinitionReferenceNodes(
    input.projectileDataById,
  );
  const abilityEntityCatalog = compileAbilityEntityTemplateCatalogSource(
    input.abilityEntityDataById,
  );
  const abilityEntityDefinitionNodes =
    createAbilityEntityDefinitionReferenceNodes(abilityEntityCatalog);
  const abilityEntityQueryContext = {
    catalog: abilityEntityCatalog,
    registry: new GameplayTagRegistry(input.gameplayTagPaths),
  };
  const entries = requireArray(manifest.operators, 'operators.json.operators').map(
    (rawOperator, index): OperatorSourceClosureAuditEntrySource => {
      const path = `operators.json.operators[${index}]`;
      const operator = requireRecord(rawOperator, path);
      const identity = parseOperatorProductIdentitySource(operator, path);
      const { slug, characterId } = identity;
      try {
        const result = compileOperatorSourceClosure({
          identity,
          manifestSkills: operator.skills,
          manifestSkillGroups: operator.skillGroups,
          skillDataBySourceFile: input.skillDataBySourceFile,
          skillDataById: input.skillDataById,
          buffDefinitionNodes,
          projectileDefinitionNodes,
          abilityEntityDefinitionNodes,
          abilityEntityQueryContext,
          skillPatchTable: input.skillPatchTable,
          characterTable: input.characterTable,
          charGrowthTable: input.charGrowthTable,
          characterPotentialTable: input.characterPotentialTable,
          potentialTalentEffectTable: input.potentialTalentEffectTable,
          skillConditionTable: input.skillConditionTable,
          skillGroupValidationOptions: parseOperatorSkillGroupValidationOptions(operator, path),
        });
        return {
          slug,
          characterId,
          status: 'supported',
          activeSkillCount: result.skillLibrary.activeSkills.entries.length,
          passiveSkillRequestCount: result.passiveSkills.requests.length,
          passiveSkillDefinitionCount: result.passiveSkills.definitions.length,
          talentNodeCount: result.progression.talentNodes.length,
          potentialUnlockCount: result.progression.potential.unlocks.length,
        };
      } catch (error) {
        return {
          slug,
          characterId,
          status: 'blocked',
          activeSkillCount: Array.isArray(operator.skills) ? operator.skills.length : 0,
          passiveSkillRequestCount: 0,
          passiveSkillDefinitionCount: 0,
          talentNodeCount: 0,
          potentialUnlockCount: 0,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  );
  return {
    operatorCount: entries.length,
    supportedCount: entries.filter(entry => entry.status === 'supported').length,
    blockedCount: entries.filter(entry => entry.status === 'blocked').length,
    activeSkillCount: entries.reduce((sum, entry) => sum + entry.activeSkillCount, 0),
    passiveSkillRequestCount: entries.reduce(
      (sum, entry) => sum + entry.passiveSkillRequestCount,
      0,
    ),
    passiveSkillDefinitionCount: entries.reduce(
      (sum, entry) => sum + entry.passiveSkillDefinitionCount,
      0,
    ),
    entries,
  };
}

/**
 * 从 Operator 的真实 Skill/Buff/养成根建立定义图，只把尚未提供的 Unity 模板边输出为下载计划。
 * 其他定义类型缺失仍立即失败，避免把损坏的 Skill/Buff 图伪装成模板下载需求。
 */
export function planOperatorUnityTemplateReferences(
  input: OperatorUnityTemplateReferencePlanInput,
): OperatorUnityTemplateReferencePlanSource {
  const manifest = requireRecord(input.manifest, 'operators.json');
  const buffDefinitionNodes = parseBuffDefinitionReferenceNodes(input.buffDataById);
  const rawOperators = requireArray(manifest.operators, 'operators.json.operators');
  const references = {
    projectile: new Map<string, Array<{ operatorSlug: string; sourcePath: string }>>(),
    abilityEntity: new Map<string, Array<{ operatorSlug: string; sourcePath: string }>>(),
  };
  const unresolvedDefinitions: Array<{
    kind: 'skill' | 'buff';
    id: string;
    operatorSlug: string;
    sourcePath: string;
  }> = [];
  rawOperators.forEach((rawOperator, index) => {
    const operatorPath = `operators.json.operators[${index}]`;
    const operator = requireRecord(rawOperator, operatorPath);
    const identity = parseOperatorProductIdentitySource(operator, operatorPath);
    const { slug } = identity;
    const result = resolveOperatorSourceClosure({
      identity,
      manifestSkills: operator.skills,
      manifestSkillGroups: operator.skillGroups,
      skillDataBySourceFile: input.skillDataBySourceFile,
      skillDataById: input.skillDataById,
      buffDefinitionNodes,
      projectileDefinitionNodes: [],
      abilityEntityDefinitionNodes: [],
      skillPatchTable: input.skillPatchTable,
      characterTable: input.characterTable,
      charGrowthTable: input.charGrowthTable,
      characterPotentialTable: input.characterPotentialTable,
      potentialTalentEffectTable: input.potentialTalentEffectTable,
      skillConditionTable: input.skillConditionTable,
      skillGroupValidationOptions: parseOperatorSkillGroupValidationOptions(operator, operatorPath),
    });
    for (const missing of result.definitionClosure.missing) {
      const kind = missing.reference.kind;
      const id = missing.reference.id;
      if (missing.reference.state !== 'active' || !id) continue;
      if (kind !== 'projectile' && kind !== 'abilityEntity') {
        if (kind === 'skill' || kind === 'buff') {
          if (
            !unresolvedDefinitions.some(
              entry =>
                entry.kind === kind &&
                entry.id === id &&
                entry.operatorSlug === slug &&
                entry.sourcePath === missing.reference.sourcePath,
            )
          ) {
            unresolvedDefinitions.push({
              kind,
              id,
              operatorSlug: slug,
              sourcePath: missing.reference.sourcePath,
            });
          }
          continue;
        }
        throw new Error(`${missing.reference.sourcePath}: unsupported definition kind ${kind}`);
      }
      const bucket = references[kind].get(id) ?? [];
      if (
        !bucket.some(
          entry => entry.operatorSlug === slug && entry.sourcePath === missing.reference.sourcePath,
        )
      ) {
        bucket.push({ operatorSlug: slug, sourcePath: missing.reference.sourcePath });
      }
      references[kind].set(id, bucket);
    }
  });
  const materialize = (
    values: ReadonlyMap<string, Array<{ operatorSlug: string; sourcePath: string }>>,
  ): OperatorUnityTemplateReferencePlanEntrySource[] =>
    [...values.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([id, referencedBy]) => ({
        id,
        referencedBy: [...referencedBy].sort(
          (left, right) =>
            left.operatorSlug.localeCompare(right.operatorSlug) ||
            left.sourcePath.localeCompare(right.sourcePath),
        ),
      }));
  return {
    operatorCount: rawOperators.length,
    complete: unresolvedDefinitions.length === 0,
    unresolvedDefinitions: unresolvedDefinitions.sort(
      (left, right) =>
        left.kind.localeCompare(right.kind) ||
        left.id.localeCompare(right.id) ||
        left.operatorSlug.localeCompare(right.operatorSlug) ||
        left.sourcePath.localeCompare(right.sourcePath),
    ),
    projectiles: materialize(references.projectile),
    abilityEntities: materialize(references.abilityEntity),
  };
}
