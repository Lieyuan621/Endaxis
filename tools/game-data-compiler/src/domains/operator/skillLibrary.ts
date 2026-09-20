import {
  compileOperatorActiveSkills,
  type OperatorActiveSkillCompilationSource,
} from './activeSkills.ts';
import {
  parseNativeOperatorSkillGroupSources,
  parseOperatorSkillGroupSources,
  validateOperatorSkillGroups,
  type NativeOperatorSkillGroupSource,
  type OperatorSkillGroupSource,
  type OperatorSkillGroupValidationOptions,
} from './skillGroups.ts';

export interface OperatorSkillLibraryInputSource {
  readonly characterId: string;
  readonly manifestSkills: unknown;
  readonly manifestSkillGroups: unknown;
  readonly skillDataBySourceFile: unknown;
  readonly skillPatchTable: unknown;
  readonly charGrowthTable: unknown;
  readonly validationOptions?: OperatorSkillGroupValidationOptions;
  readonly sourcePath: string;
}

/** Operator 主动技能定义与原生等级组已经同时闭合的领域切片。 */
export interface OperatorSkillLibrarySource {
  readonly activeSkills: OperatorActiveSkillCompilationSource;
  readonly skillGroups: readonly OperatorSkillGroupSource[];
  readonly nativeSkillGroups: readonly NativeOperatorSkillGroupSource[];
}

/**
 * 先绑定每个编辑器技能 key 的原生 SkillData 身份，再验证所有技能恰好落入原生等级组。
 * 只有通过这道门禁的结果才能进入后续 OperatorDefinition 组装。
 */
export function compileOperatorSkillLibrarySource(
  input: OperatorSkillLibraryInputSource,
): OperatorSkillLibrarySource {
  const activeSkills = compileOperatorActiveSkills(
    input.manifestSkills,
    input.skillDataBySourceFile,
    input.skillPatchTable,
    `${input.sourcePath}.skills`,
  );
  const skillGroups = parseOperatorSkillGroupSources(
    input.manifestSkillGroups,
    `${input.sourcePath}.skillGroups`,
  );
  const nativeSkillGroups = parseNativeOperatorSkillGroupSources(
    input.charGrowthTable,
    input.characterId,
  );
  validateOperatorSkillGroups(
    skillGroups,
    activeSkills.entries,
    nativeSkillGroups,
    input.validationOptions,
  );
  return { activeSkills, skillGroups, nativeSkillGroups };
}
