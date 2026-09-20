import { requireRecord } from '../../source/primitives.ts';
import { parseSkillPatchSource, type SkillPatchSource } from '../../source/skillPatch.ts';

export interface SkillDefinitionCompileRequestIdentitySource {
  readonly sourcePath: string;
  readonly skillId: string;
}

export interface CompiledSkillDefinitionIdentitySource<TDefinition> {
  readonly skillId: string;
  readonly sourcePath: string;
  readonly definition: TDefinition;
}

/**
 * SkillData 的领域请求保留重复安装，定义则按原生 ID 首次出现顺序去重编译。
 * 主动、被动及后续子技能入口共用同一套缺失引用、Patch 查找和内嵌 ID 校验。
 */
export function compileSkillDefinitionBatchSource<
  TRequest extends SkillDefinitionCompileRequestIdentitySource,
  TDefinition extends { readonly skill: { readonly skillId: string } },
>(
  requests: readonly TRequest[],
  skillDataValue: unknown,
  skillPatchValue: unknown,
  compileDefinition: (
    value: unknown,
    sourcePath: string,
    patch: SkillPatchSource | null,
  ) => TDefinition,
  skillDataSourceName = 'SkillData',
): {
  readonly requests: readonly TRequest[];
  readonly definitions: readonly CompiledSkillDefinitionIdentitySource<TDefinition>[];
} {
  const skillDataTable = requireRecord(skillDataValue, skillDataSourceName);
  const skillPatchTable = requireRecord(skillPatchValue, 'SkillPatchTable');
  const definitions: CompiledSkillDefinitionIdentitySource<TDefinition>[] = [];
  const compiledIds = new Set<string>();

  for (const request of requests) {
    if (compiledIds.has(request.skillId)) continue;
    const sourcePath = `${skillDataSourceName}.${request.skillId}`;
    if (!(request.skillId in skillDataTable)) {
      throw new Error(`${sourcePath}: missing definition requested by ${request.sourcePath}`);
    }
    const patch =
      request.skillId in skillPatchTable
        ? parseSkillPatchSource(skillPatchTable[request.skillId], request.skillId)
        : null;
    const definition = compileDefinition(skillDataTable[request.skillId], sourcePath, patch);
    if (definition.skill.skillId !== request.skillId) {
      throw new Error(
        `${sourcePath}.skillId: expected ${JSON.stringify(request.skillId)}, found ${JSON.stringify(definition.skill.skillId)}`,
      );
    }
    compiledIds.add(request.skillId);
    definitions.push({ skillId: request.skillId, sourcePath, definition });
  }
  return { requests: [...requests], definitions };
}
