import type { OperatorDefinition, PlayerSkillInput } from './operatorDefinition';

/**
 * 从显式原生路由恢复一个技能唯一可由哪类玩家操作请求。
 * 只用于新块默认值与旧项目迁移；模拟会保留存档中的 action 并独立校验实际解析结果。
 */
export function resolveUniquePlayerActionForSkill(
  operator: OperatorDefinition,
  skillKey: string,
): PlayerSkillInput | undefined {
  const matches = Object.entries(operator.playerActionRoutes ?? {}).flatMap(([input, route]) => {
    if (route === undefined) return [];
    if (route.kind === 'basicAttack') return route.skillKeys.includes(skillKey) ? [input] : [];
    const slot = operator.skillSlots?.find(candidate => candidate.key === route.skillSlotKey);
    if (slot === undefined) return [];
    const keys = [...(slot.stableSkillKeys ?? [slot.baseSkillKey]), ...slot.replacementSkillKeys];
    return keys.includes(skillKey) ? [input] : [];
  }) as PlayerSkillInput[];
  if (matches.length > 1) {
    throw new Error(
      `operator '${operator.slug}' skill '${skillKey}' is reachable from multiple player actions`,
    );
  }
  return matches[0];
}
