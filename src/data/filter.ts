/**
 * Filter collected effects by applicability to the simulation target.
 * Effects that don't apply are excluded entirely (not shown in UI).
 */
export function passesSkillFilter(filter: string | string[], skillId: string): boolean {
  const arr = Array.isArray(filter) ? filter : [filter];
  if (arr.includes(skillId)) return true;
  // basicAttack scope also matches finalStrike and dive
  if (arr.includes('basicAttack') && (skillId === 'finalStrike' || skillId === 'dive')) return true;
  return false;
}

/** dmgBonus-only scope: finishers receive damage bonuses scoped to basic attacks. */
export function passesDmgBonusSkillFilter(filter: string | string[], skillType: string): boolean {
  if (passesSkillFilter(filter, skillType)) return true;
  const arr = Array.isArray(filter) ? filter : [filter];
  return arr.includes('basicAttack') && skillType === 'finisher';
}
