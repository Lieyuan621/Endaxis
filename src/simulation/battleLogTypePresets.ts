/** Built-in type-filter presets for the battle log panel. */

export type BattleLogTypePresetId = 'all' | 'damage' | 'status';

const DAMAGE_TYPES = Object.freeze([
  'DAMAGE_HIT',
  'STAGGER',
  'SP_CHANGE',
  'SP_REGEN_PAUSE',
  'ULT_ENERGY_CHANGE',
  'CD_REDUCTION',
  'ACTION_START',
  'ACTION_REQUISITE_FAILED',
  'ACTION_END',
]);

const STATUS_TYPES = Object.freeze([
  'INFLICTION_APPLY',
  'INFLICTION_CONSUMED',
  'ARTS_BURST',
  'REACTION_TRIGGER',
  'PHYSICAL_STATUS',
  'VULNERABILITY_APPLY',
  'VULNERABILITY_CHANGE',
  'VULNERABILITY_CONSUMED',
  'DEBUFF_APPLY',
  'ENEMY_STATUS_APPLY',
  'ENEMY_EFFECT_EXPIRE',
  'OPERATOR_EFFECT_APPLY',
  'OPERATOR_EFFECT_EXPIRE',
]);

export const BATTLE_LOG_TYPE_PRESETS = Object.freeze([
  { id: 'all' as const, i18nKey: 'battleLog.presets.all' },
  { id: 'damage' as const, i18nKey: 'battleLog.presets.damage' },
  { id: 'status' as const, i18nKey: 'battleLog.presets.status' },
]);

export function resolveBattleLogTypePreset(
  presetId: BattleLogTypePresetId,
  availableTypes: readonly string[],
): string[] {
  const available = new Set(availableTypes);
  const pick = (types: readonly string[]) => types.filter(type => available.has(type));

  switch (presetId) {
    case 'damage':
      return pick(DAMAGE_TYPES);
    case 'status':
      return pick(STATUS_TYPES);
    case 'all':
    default:
      return [...availableTypes];
  }
}

export function matchBattleLogTypePreset(
  selectedTypes: ReadonlySet<string>,
  availableTypes: readonly string[],
): BattleLogTypePresetId | null {
  if (availableTypes.length === 0) return null;
  const selected = [...selectedTypes].sort().join('\0');
  for (const preset of BATTLE_LOG_TYPE_PRESETS) {
    const resolved = resolveBattleLogTypePreset(preset.id, availableTypes).sort().join('\0');
    if (selected === resolved) return preset.id;
  }
  return null;
}
