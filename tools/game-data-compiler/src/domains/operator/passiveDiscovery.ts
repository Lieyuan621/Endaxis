import type { PassiveSkillCompileRequestSource } from '../../compiler/skills/passiveSkillRequest.ts';
import {
  parseOperatorProgressionEffectBundles,
  type OperatorProgressionEffectBundleSource,
} from '../../source/operatorProgressionEffects.ts';

/**
 * 从公共来源 IR 中发现天赋/潜能 AddPassiveSkill 创建请求。
 * 这里不再解释 PotentialTalentEffectTable 的联合载荷。
 */
export function discoverOperatorPassiveSkillRequests(
  value: unknown,
  effectIds: readonly string[],
  sourceName = 'PotentialTalentEffectTable',
): PassiveSkillCompileRequestSource[] {
  return discoverOperatorPassiveSkillRequestsFromBundles(
    parseOperatorProgressionEffectBundles(value, effectIds, sourceName),
  );
}

/** 已有来源 IR 时直接发现创建请求，避免领域组装重复读取同一效果表。 */
export function discoverOperatorPassiveSkillRequestsFromBundles(
  bundles: readonly OperatorProgressionEffectBundleSource[],
): PassiveSkillCompileRequestSource[] {
  const output: PassiveSkillCompileRequestSource[] = [];
  for (const bundle of bundles) {
    for (const entry of bundle.entries) {
      if (entry.modifyType !== 'addPassiveSkill') continue;
      const activeConditionIds = entry.activeConditions.filter(condition => condition.length > 0);
      output.push({
        originKind: 'operatorProgression',
        originId: bundle.effectId,
        sourcePath: entry.sourcePath,
        skillId: entry.attachedSkill.skillId,
        // CreateCardSkill 未指定等级：先查 1 级补丁，不查询角色技能组等级。
        levelSource: { kind: 'nativeDefault' },
        inputBlackboard: entry.attachedSkill.blackboard,
        ...(activeConditionIds.length === 0 ? {} : { activeConditionIds }),
      });
    }
  }
  return output;
}
