export type TimelineBattleLogPresetId = 'all' | 'damage' | 'status';

export const TIMELINE_BATTLE_LOG_PRESETS = [
  { id: 'all', i18nKey: 'battleLog.presets.all' },
  { id: 'damage', i18nKey: 'battleLog.presets.damage' },
  { id: 'status', i18nKey: 'battleLog.presets.status' },
] as const;

function isDamageWorkflowEvent(event: string): boolean {
  return (
    event.startsWith('Skill') ||
    event.includes('Damage') ||
    event.includes('Poise') ||
    event.includes('Healing') ||
    event === 'SpChanged' ||
    event === 'UltimateEnergyChanged'
  );
}

function isStatusWorkflowEvent(event: string): boolean {
  return (
    event.startsWith('Buff') ||
    event.startsWith('Status') ||
    event.startsWith('Elemental') ||
    event.startsWith('SpellBurst') ||
    event.startsWith('AbilityEntity') ||
    event.startsWith('TimeDilation') ||
    event.startsWith('ComboWindow')
  );
}

/** 仅对回执事件名做显示筛选，不推导或改变任何战斗事实。 */
export function resolveTimelineBattleLogPreset(
  presetId: TimelineBattleLogPresetId,
  availableEvents: readonly string[],
): readonly string[] {
  if (presetId === 'all') return [...availableEvents];
  return availableEvents.filter(event =>
    presetId === 'damage' ? isDamageWorkflowEvent(event) : isStatusWorkflowEvent(event),
  );
}

export function matchTimelineBattleLogPreset(
  selectedEvents: ReadonlySet<string>,
  availableEvents: readonly string[],
): TimelineBattleLogPresetId | null {
  const selected = [...selectedEvents].sort().join('\0');
  for (const preset of TIMELINE_BATTLE_LOG_PRESETS) {
    if (
      [...resolveTimelineBattleLogPreset(preset.id, availableEvents)].sort().join('\0') === selected
    ) {
      return preset.id;
    }
  }
  return null;
}
