import type { TimelineSkillLibraryEntryViewModel } from './timelineEditorViewModel';

export interface TimelineSkillSegmentLabels {
  readonly heavyAttack: string;
  readonly battleSkill: string;
  readonly comboSkill: string;
  readonly ultimate: string;
  readonly formatName: (nameKey: string | undefined, baseName: string, short: boolean) => string;
}

/** 变体卡片的小字沿用同类型原始技能名；强化普攻也可能独立成组。 */
export function skillLibraryNameEntry(
  entry: TimelineSkillLibraryEntryViewModel,
  entries: readonly TimelineSkillLibraryEntryViewModel[],
): TimelineSkillLibraryEntryViewModel {
  if (entry.nameKey === undefined && entry.variantKey === undefined) {
    return entry;
  }
  const baseEntries = entries.filter(
    candidate =>
      candidate.operationType === entry.operationType &&
      candidate.nameKey === undefined &&
      candidate.variantKey === undefined,
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
  if (entry.operationType === 'basicAttack') {
    return index === entry.groupPlacementSkillKeys.length - 1
      ? labels.heavyAttack
      : `A${index + 1}`;
  }
  if (entry.operationType === 'battleSkill') return `C${index + 1}`;
  if (entry.operationType === 'comboSkill') return `E${index + 1}`;
  if (entry.operationType === 'ultimate') return `U${index + 1}`;
  return null;
}

/** 时间轴实例按所属操作段显示名称；段号不代表执行技能类别。 */
export function timelineSkillSegmentLabel(
  entry: TimelineSkillLibraryEntryViewModel,
  skillKey: string,
  labels: TimelineSkillSegmentLabels,
): string | null {
  const index = sequenceIndex(entry, skillKey);
  if (index === null) return null;
  if (entry.operationType === 'basicAttack') {
    return index === entry.groupPlacementSkillKeys.length - 1
      ? labels.heavyAttack
      : `A${index + 1}`;
  }
  if (entry.operationType === 'battleSkill') return `${labels.battleSkill} ${index + 1}`;
  if (entry.operationType === 'comboSkill') return `${labels.comboSkill} ${index + 1}`;
  if (entry.operationType === 'ultimate') return `${labels.ultimate} ${index + 1}`;
  return null;
}

/** 段号先由操作序列确定，再套用入口的短名称模板。 */
export function timelineSkillBlockLabel(
  entry: TimelineSkillLibraryEntryViewModel,
  skillKey: string,
  labels: TimelineSkillSegmentLabels,
  fallbackLabel: string,
): string {
  const label = timelineSkillSegmentLabel(entry, skillKey, labels) ?? fallbackLabel;
  return labels.formatName(entry.nameKey, label, true);
}

/** 仅内存的显示反查：由已配置、可见的操作段构建，不能用于运行时路由。 */
export function indexSkillLibrarySegments(
  entries: readonly TimelineSkillLibraryEntryViewModel[],
): ReadonlyMap<string, readonly TimelineSkillLibraryEntryViewModel[]> {
  const index = new Map<string, TimelineSkillLibraryEntryViewModel[]>();
  for (const entry of entries) {
    for (const { skillKey } of entry.skills) {
      const matches = index.get(skillKey) ?? [];
      if (!matches.includes(entry)) matches.push(entry);
      index.set(skillKey, matches);
    }
  }
  return index;
}
