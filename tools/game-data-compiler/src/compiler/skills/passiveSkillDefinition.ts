import {
  parseNativePassiveSkillSource,
  type NativePassiveSkillSource,
} from '../../source/passiveSkill.ts';
import type { SkillPatchSource } from '../../source/skillPatch.ts';
import type { ResolvedSkillBlackboardSource } from './skillBlackboard.ts';
import { prepareSkillDefinitionInputSource } from './skillDefinitionInput.ts';

/** 供所有领域适配器消费的被动定义输入；尚未执行 Endaxis 场景投影。 */
export interface CompiledPassiveSkillSource {
  readonly skill: NativePassiveSkillSource;
  readonly blackboard: ResolvedSkillBlackboardSource;
  /** 领域层只消费这个公共判定，不直接读取 CardSkill 属性参数结构。 */
  readonly hasCardAttributeModifiers: boolean;
}

/**
 * 公共被动定义的唯一入口。先解析声明并合并 SkillPatch，再用逐等级值读取动作、条件和 Buff 赋值；
 * 调用方只负责提供原生 SkillData 与其确切 Patch，不得按领域复制这段流程。
 */
export function compilePassiveSkillSource(
  value: unknown,
  sourcePath: string,
  patch: SkillPatchSource | null,
): CompiledPassiveSkillSource {
  const prepared = prepareSkillDefinitionInputSource(value, sourcePath, patch);
  const skill = parseNativePassiveSkillSource(value, sourcePath, prepared.blackboard.values);
  return {
    skill,
    blackboard: prepared.blackboard,
    hasCardAttributeModifiers: skill.cardAttributeModifiers.modifiers.length > 0,
  };
}
