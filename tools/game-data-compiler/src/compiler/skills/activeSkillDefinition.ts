import {
  parseNativeActiveSkillSource,
  type NativeActiveSkillSource,
} from '../../source/activeSkill.ts';
import type { SkillPatchSource } from '../../source/skillPatch.ts';
import type { ResolvedSkillBlackboardSource } from './skillBlackboard.ts';
import { prepareSkillDefinitionInputSource } from './skillDefinitionInput.ts';
import { collectTargetGroupWrites, type TargetGroupWriteSource } from '../../source/targetGroup.ts';

/** 主动 SkillData 的公共编译输入；尚未执行 Endaxis 时间轴场景投影。 */
export interface CompiledActiveSkillSource {
  readonly skill: NativeActiveSkillSource;
  readonly blackboard: ResolvedSkillBlackboardSource;
  /** 从同一动作图按时间轴路径收集的数据流写入；后续公共投影不得重新遍历原始 JSON。 */
  readonly targetGroupWrites: readonly TargetGroupWriteSource[];
}

export function compileActiveSkillSource(
  value: unknown,
  sourcePath: string,
  patch: SkillPatchSource | null,
): CompiledActiveSkillSource {
  const prepared = prepareSkillDefinitionInputSource(value, sourcePath, patch);
  return {
    skill: parseNativeActiveSkillSource(value, sourcePath, prepared.blackboard.values),
    blackboard: prepared.blackboard,
    targetGroupWrites: collectTargetGroupWrites(value, sourcePath),
  };
}
