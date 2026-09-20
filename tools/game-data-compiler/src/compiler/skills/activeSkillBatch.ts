import {
  compileActiveSkillSource,
  type CompiledActiveSkillSource,
} from './activeSkillDefinition.ts';
import {
  compileSkillDefinitionBatchSource,
  type CompiledSkillDefinitionIdentitySource,
  type SkillDefinitionCompileRequestIdentitySource,
} from './skillDefinitionBatch.ts';

export type ActiveSkillCompileRequestSource = SkillDefinitionCompileRequestIdentitySource;
export type CompiledActiveSkillDefinitionSource =
  CompiledSkillDefinitionIdentitySource<CompiledActiveSkillSource>;

export interface ActiveSkillCompilationBatchSource {
  readonly requests: readonly ActiveSkillCompileRequestSource[];
  readonly definitions: readonly CompiledActiveSkillDefinitionSource[];
}

export function compileActiveSkillRequestBatch(
  requests: readonly ActiveSkillCompileRequestSource[],
  skillDataValue: unknown,
  skillPatchValue: unknown,
  skillDataSourceName = 'SkillData',
): ActiveSkillCompilationBatchSource {
  return compileSkillDefinitionBatchSource(
    requests,
    skillDataValue,
    skillPatchValue,
    compileActiveSkillSource,
    skillDataSourceName,
  );
}
