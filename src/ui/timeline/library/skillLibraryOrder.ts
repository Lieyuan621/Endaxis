import type { SkillType } from '../../../core/game-data/operatorDefinition';

interface TimelineSkillLibraryOrderEntry {
  readonly skillType: SkillType;
  readonly enhanced: boolean;
}

/**
 * 技能库的排序只表达玩家识别动作的顺序，不参与技能路由、等级来源或模拟。
 * 同一语义槽内保持定义声明顺序，避免 UI 为技能建立第二套身份。
 */
export function orderTimelineSkillLibrary<T extends TimelineSkillLibraryOrderEntry>(
  entries: readonly T[],
): readonly T[] {
  const rank = (entry: TimelineSkillLibraryOrderEntry): number => {
    if (entry.skillType === 'basicAttack') return entry.enhanced ? 1 : 0;
    if (entry.skillType === 'plungingAttack') return 2;
    if (entry.skillType === 'finisher') return 3;
    if (entry.skillType === 'battleSkill') return entry.enhanced ? 5 : 4;
    if (entry.skillType === 'comboSkill') return entry.enhanced ? 7 : 6;
    return entry.enhanced ? 9 : 8;
  };

  return entries
    .map((entry, sourceIndex) => ({ entry, sourceIndex }))
    .sort(
      (left, right) => rank(left.entry) - rank(right.entry) || left.sourceIndex - right.sourceIndex,
    )
    .map(value => value.entry);
}
