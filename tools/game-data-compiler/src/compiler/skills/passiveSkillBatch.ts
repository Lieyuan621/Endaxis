import type { PassiveSkillCompileRequestSource } from './passiveSkillRequest.ts';
import {
  compilePassiveSkillSource,
  type CompiledPassiveSkillSource,
} from './passiveSkillDefinition.ts';
import {
  compileSkillDefinitionBatchSource,
  type CompiledSkillDefinitionIdentitySource,
} from './skillDefinitionBatch.ts';

export type CompiledPassiveSkillDefinitionSource =
  CompiledSkillDefinitionIdentitySource<CompiledPassiveSkillSource>;

export interface PassiveSkillCompilationBatchSource {
  /** 原始领域请求保持顺序和重复项；装备槽位与多个养成来源不能被定义去重吞掉。 */
  readonly requests: readonly PassiveSkillCompileRequestSource[];
  /** 相同 SkillData 只编译一次，首次请求的顺序决定稳定输出顺序。 */
  readonly definitions: readonly CompiledPassiveSkillDefinitionSource[];
}

/**
 * 把所有领域发现结果批量汇入公共被动编译器。
 * 等级来源和运行时输入仍属于请求；共享定义保留完整 SkillPatch，不在这里替领域选择等级。
 */
export function compilePassiveSkillRequestBatch(
  requests: readonly PassiveSkillCompileRequestSource[],
  skillDataValue: unknown,
  skillPatchValue: unknown,
  skillDataSourceName = 'SkillData',
): PassiveSkillCompilationBatchSource {
  return compileSkillDefinitionBatchSource(
    requests,
    skillDataValue,
    skillPatchValue,
    compilePassiveSkillSource,
    skillDataSourceName,
  );
}
