import type { TimelineSkillLibraryEntryViewModel } from './timelineEditorViewModel';

export interface TimelineSkillSegmentLabels {
  readonly heavyAttack: string;
  readonly battleSkill: string;
  readonly comboSkill: string;
}

/** 变体卡片的小字沿用同类型原始技能名；强化普攻也可能独立成组。 */
export function skillLibraryNameEntry(
  entry: TimelineSkillLibraryEntryViewModel,
  entries: readonly TimelineSkillLibraryEntryViewModel[],
): TimelineSkillLibraryEntryViewModel {
  if (
    entry.nameQualifier === undefined &&
    entry.variantKey === undefined &&
    entry.placementSkillKey === undefined
  ) {
    return entry;
  }
  const baseEntries = entries.filter(
    candidate =>
      candidate.skillType === entry.skillType &&
      candidate.nameQualifier === undefined &&
      candidate.variantKey === undefined &&
      candidate.placementSkillKey === undefined,
  );
  return (
    baseEntries.find(candidate => candidate.skillGroupKey === entry.skillGroupKey) ??
    baseEntries[0] ??
    entry
  );
}

function sequenceIndex(entry: TimelineSkillLibraryEntryViewModel, skillKey: string): number | null {
  if (entry.groupPlacementSkillKeys.length < 2) return null;
  const index = entry.groupPlacementSkillKeys.indexOf(skillKey);
  return index < 0 ? null : index;
}

/** 技能库使用操作键语言，让玩家能快速识别连续技能的第几段。 */
export function skillLibrarySegmentLabel(
  entry: TimelineSkillLibraryEntryViewModel,
  skillKey: string,
  labels: TimelineSkillSegmentLabels,
): string | null {
  const index = sequenceIndex(entry, skillKey);
  if (index === null) return null;
  if (entry.skillType === 'basicAttack') {
    return index === entry.groupPlacementSkillKeys.length - 1
      ? labels.heavyAttack
      : `A${index + 1}`;
  }
  if (entry.skillType === 'battleSkill') return `C${index + 1}`;
  if (entry.skillType === 'comboSkill') return `E${index + 1}`;
  return null;
}

/** 时间轴块使用技能语义，不把技能库的 C/E 操作简写带入战斗结果。 */
export function timelineSkillSegmentLabel(
  entry: TimelineSkillLibraryEntryViewModel,
  skillKey: string,
  labels: TimelineSkillSegmentLabels,
): string | null {
  const index = sequenceIndex(entry, skillKey);
  if (index === null) return null;
  if (entry.skillType === 'basicAttack') {
    return index === entry.groupPlacementSkillKeys.length - 1
      ? labels.heavyAttack
      : `A${index + 1}`;
  }
  if (entry.skillType === 'battleSkill') return `${labels.battleSkill} ${index + 1}`;
  if (entry.skillType === 'comboSkill') return `${labels.comboSkill} ${index + 1}`;
  return null;
}

/** 时间轴用星号区分强化技能，以及浮空普攻、浮空连携。 */
export function timelineSkillBlockLabel(
  entry: TimelineSkillLibraryEntryViewModel,
  skillKey: string,
  labels: TimelineSkillSegmentLabels,
  fallbackLabel: string,
): string {
  const label = timelineSkillSegmentLabel(entry, skillKey, labels) ?? fallbackLabel;
  const starred =
    entry.nameQualifier === 'enhanced' ||
    (entry.nameQualifier === 'floating' &&
      (entry.skillType === 'basicAttack' || entry.skillType === 'comboSkill'));
  return starred ? `${label}*` : label;
}

/** 路由实际触发的技能即使没有放在轴上，也按技能块规则命名；重名时不猜所属技能组。 */
export function timelineSkillBlockLabelForKey(
  entries: readonly TimelineSkillLibraryEntryViewModel[],
  skillKey: string,
  labels: TimelineSkillSegmentLabels,
  fallbackLabel: (entry: TimelineSkillLibraryEntryViewModel) => string,
): string | null {
  const matches = entries.filter(entry => entry.skills.some(skill => skill.skillKey === skillKey));
  if (matches.length !== 1) return null;
  const entry = matches[0]!;
  return timelineSkillBlockLabel(entry, skillKey, labels, fallbackLabel(entry));
}
