import type { CombatFaction } from '../../../../packages/game-data-contract/src/primitives';

/** 原生 FactionCategories.GetAntiFaction 返回掩码，而不是简单的阵营不相等。 */
export function isAntiFaction(source: CombatFaction, target: CombatFaction): boolean {
  switch (source) {
    case 'good':
      return target === 'bad' || target === 'neutral';
    case 'bad':
      return target === 'good' || target === 'neutral';
    case 'neutral':
      return target === 'good' || target === 'bad';
    case 'invalid':
    case 'unknown':
      return target === 'invalid';
  }
}

/** AbilitySystemUtils.IsUnmarkable 的两个关系判断方向不同，不能按查询名称猜测。 */
export function isFactionTargetUnmarkable(
  source: CombatFaction,
  target: CombatFaction,
  matches: (name: 'IsUnMarkable' | 'IsUnMarkableAnti' | 'IsUnMarkableAlly') => boolean,
): boolean {
  return (
    matches('IsUnMarkable') ||
    (isAntiFaction(source, target) && matches('IsUnMarkableAnti')) ||
    (isAntiFaction(target, source) && matches('IsUnMarkableAlly'))
  );
}
