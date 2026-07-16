const CANONICAL_INFLICTION_KEYS = Object.freeze([
  'heat_infliction',
  'cryo_infliction',
  'electric_infliction',
  'nature_infliction',
]);

const CANONICAL_BURST_KEYS = Object.freeze([
  'heat_burst',
  'cryo_burst',
  'electric_burst',
  'nature_burst',
]);

const REACTION_KEYS = Object.freeze([
  'combustion',
  'electrification',
  'solidification',
  'corrosion',
]);

const PHYSICAL_STATUS_KEYS = Object.freeze(['breach', 'crush', 'lift', 'knockdown']);

const OTHER_STATUS_DISPLAY_KEYS = Object.freeze([
  'dmgBonus:physical',
  'dmgBonus:arts',
  'ampBonus:arts',
  'susceptibility:physical',
  'susceptibility:arts',
  'increasedDmgTaken:physical',
  'increasedDmgTaken:arts',
  'resistanceShred:physical',
  'resistanceShred:arts',
  'resistanceIgnore:physical',
  'resistanceIgnore:arts',
  'linkStacks',
  'slowed',
  'link',
  'protection',
  'scorchingFangs',
  'prepIngredients',
  'meltingFlame',
  'auxiliaryCrystal',
  'ferventMorale',
  'steelOath',
  'focus',
  'yinglungsEdge',
  'bonekrushingSmash',
  'loneAndDistantSail',
  'hypothermicPerfusion',
  'improvisedExplosive',
  'thunderlance',
  'thunderlanceEx',
  'wolvenBlood',
  'whirlpools',
  'waterspouts',
  'oldenStare',
  'perfectTiming',
  'razorClawmark',
  'sunderblades',
]);

const DIRECT_RUNTIME_KIND_KEYS = Object.freeze([
  'damageHit',
  'damageOverTime',
  'spRecovery',
  'spReturn',
  'ultEnergyGain',
  'consume',
  'oneTime',
  'cooldownReductionFlat',
  'cooldownReductionPercent',
]);

const ROUTED_KIND_KEYS: Record<string, readonly string[]> = {
  status: OTHER_STATUS_DISPLAY_KEYS,
  infliction: CANONICAL_INFLICTION_KEYS,
  burst: CANONICAL_BURST_KEYS,
  reaction: REACTION_KEYS,
  physicalStatus: PHYSICAL_STATUS_KEYS,
};

const ROUTED_EFFECT_KINDS = new Set(['status', ...Object.keys(ROUTED_KIND_KEYS)]);

function allowedKeysForKind(kind: string): Set<string> | null {
  if (ROUTED_KIND_KEYS[kind]) return new Set(ROUTED_KIND_KEYS[kind]);
  if (DIRECT_RUNTIME_KIND_KEYS.includes(kind)) return new Set([kind]);
  return null;
}

export function shouldRetypeEffectForDisplayKind(kind: string): boolean {
  return ROUTED_EFFECT_KINDS.has(kind);
}

export interface EffectOption {
  value?: string;
  [key: string]: unknown;
}

export interface EffectOptionGroup {
  options?: EffectOption[];
  [key: string]: unknown;
}

/** An option that survived filtering always has a concrete display key. */
export interface FilteredEffectOption {
  value: string;
  [key: string]: unknown;
}

export interface FilteredEffectOptionGroup {
  options: FilteredEffectOption[];
  [key: string]: unknown;
}

export function filterEffectOptionGroups(
  groups: EffectOptionGroup[] = [],
  kind = 'status',
  currentValue = '',
): FilteredEffectOptionGroup[] {
  const allowed = allowedKeysForKind(kind);
  const allowedOrder = allowed
    ? new Map([...allowed].map((key, index): [string, number] => [key, index]))
    : null;
  const currentKey = String(currentValue || '').trim();
  const seen = new Set<string>();

  return groups
    .map(group => {
      // The filter guarantees every surviving option has a truthy string value.
      const options = (group.options || []).filter(option => {
        const value = option?.value;
        if (!value || seen.has(value)) return false;
        const keep = allowed
          ? allowed.has(value) || (currentKey && currentKey !== 'default' && value === currentKey)
          : true;
        if (keep) seen.add(value);
        return keep;
      }) as FilteredEffectOption[];
      if (allowedOrder) {
        options.sort(
          (a, b) =>
            (allowedOrder.get(a.value) ?? Number.MAX_SAFE_INTEGER) -
            (allowedOrder.get(b.value) ?? Number.MAX_SAFE_INTEGER),
        );
      }
      return { ...group, options };
    })
    .filter(group => group.options.length > 0);
}
