/**
 * Well-known status keys used by conditions / stack scaling / consume reads.
 * Domain sheets use camelCase ids (e.g. `cryoInfliction`); UI labels resolve via `effects.name`.
 *
 * Operator-authored statuses often use a runtime `id` (e.g. `tangtang-whirlpools`) plus a short
 * `name` locale key (`whirlpools` → 涡流). Label resolution must prefer that `name` map.
 */

import type { OperatorSheet } from '@/data/types';

export const KNOWN_ENEMY_STATUS_KEYS = Object.freeze([
  'vulnerability',
  'breach',
  'crush',
  'lift',
  'knockdown',
  'heatInfliction',
  'cryoInfliction',
  'electricInfliction',
  'natureInfliction',
  'combustion',
  'electrification',
  'solidification',
  'corrosion',
  'shatter',
  'originiumCrystals',
  'heatBurst',
  'cryoBurst',
  'electricBurst',
  'natureBurst',
] as const);

/** Map runtime status ids / engine tags to `effects.name` locale keys when they differ. */
export const STATUS_NAME_ALIASES = Object.freeze({
  // Domain camelCase → snake_case locale keys
  heatInfliction: 'heat_infliction',
  cryoInfliction: 'cryo_infliction',
  electricInfliction: 'electric_infliction',
  natureInfliction: 'nature_infliction',
  heatBurst: 'heat_burst',
  cryoBurst: 'cryo_burst',
  electricBurst: 'electric_burst',
  natureBurst: 'nature_burst',
  // Simulator / battle-log engine tags
  ELEMENT_HEAT: 'heat_infliction',
  ELEMENT_CRYO: 'cryo_infliction',
  ELEMENT_ELECTRIC: 'electric_infliction',
  ELEMENT_NATURE: 'nature_infliction',
  ELEMENT_COMBUSTION: 'combustion',
  ELEMENT_ELECTRIFICATION: 'electrification',
  ELEMENT_SOLIDIFICATION: 'solidification',
  ELEMENT_CORROSION: 'corrosion',
  ELEMENT_HEAT_BURST: 'heat_burst',
  ELEMENT_CRYO_BURST: 'cryo_burst',
  ELEMENT_ELECTRIC_BURST: 'electric_burst',
  ELEMENT_NATURE_BURST: 'nature_burst',
  PHYSICAL_VULNERABLE: 'vulnerability',
  PHYSICAL_KNOCK_DOWN: 'knockdown',
  PHYSICAL_LIFT: 'lift',
  PHYSICAL_CRUSH: 'crush',
  PHYSICAL_BREACH: 'breach',
} as const);

export type StatusNameSource = {
  id?: string | null;
  name?: string | null;
};

export function resolveStatusLocaleKey(statusKey: string): string {
  return STATUS_NAME_ALIASES[statusKey as keyof typeof STATUS_NAME_ALIASES] || statusKey;
}

/** Prefer operator effect `name` (id → name map), then static aliases. */
export function resolveStatusNameKey(
  statusKey: string,
  nameById?: Readonly<Record<string, string>> | ReadonlyMap<string, string> | null,
): string {
  const key = String(statusKey || '').trim();
  if (!key) return key;
  let mapped: string | undefined;
  if (nameById instanceof Map) mapped = nameById.get(key);
  else if (nameById) mapped = nameById[key];
  if (mapped) return resolveStatusLocaleKey(mapped);
  return resolveStatusLocaleKey(key);
}

/** Resolve a status/reaction/physical key to `effects.name.*` (single SSOT for UI labels). */
export function effectNameMessageKey(
  statusKey: string,
  nameById?: Readonly<Record<string, string>> | ReadonlyMap<string, string> | null,
): string {
  const resolved = resolveStatusNameKey(statusKey, nameById);
  return resolved ? `effects.name.${resolved}` : '';
}

export function translateEffectName(
  t: (key: string) => string,
  te: (key: string) => boolean,
  statusKey: string,
  nameById?: Readonly<Record<string, string>> | ReadonlyMap<string, string> | null,
): string {
  const key = String(statusKey || '').trim();
  if (!key) return '';
  const localeKey = effectNameMessageKey(key, nameById);
  if (localeKey && te(localeKey)) return t(localeKey);
  return key;
}

export function collectStatusOptions(
  preferred: readonly string[],
  extras: Iterable<string | null | undefined> = [],
  current?: string | null,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (value: string | null | undefined) => {
    const key = String(value || '').trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push(key);
  };
  for (const key of preferred) push(key);
  for (const key of extras) push(key);
  push(current);
  return out;
}

export function registerStatusName(
  nameById: Map<string, string>,
  source: StatusNameSource | null | undefined,
): void {
  const id = String(source?.id || '').trim();
  if (!id || id === 'default') return;
  const name = String(source?.name || '').trim();
  if (!name) return;
  if (!nameById.has(id)) nameById.set(id, name);
}

export function mergeStatusNameSources(
  ...sources: Iterable<StatusNameSource | null | undefined>[]
): Record<string, string> {
  const map = new Map<string, string>();
  for (const list of sources) {
    for (const source of list) registerStatusName(map, source);
  }
  return Object.fromEntries(map);
}

export function mergeStatusNameRecords(
  ...records: (Readonly<Record<string, string>> | null | undefined)[]
): Record<string, string> {
  const map = new Map<string, string>();
  for (const record of records) {
    if (!record) continue;
    for (const [id, name] of Object.entries(record)) {
      registerStatusName(map, { id, name });
    }
  }
  return Object.fromEntries(map);
}

function visitEffect(
  effect: unknown,
  nameById: Map<string, string>,
  ids: Set<string>,
): void {
  if (!effect || typeof effect !== 'object') return;
  const record = effect as StatusNameSource & {
    kind?: string;
    hit?: { effects?: unknown[] };
    effects?: unknown[];
  };
  // Stack / operatorStatus selectors only care about stackable status entries,
  // not DoTs or other named effects that share display names (e.g. two waterspouts).
  if (record.kind === 'status') {
    const id = String(record.id || '').trim();
    if (id && id !== 'default') {
      ids.add(id);
      registerStatusName(nameById, record);
    }
  }
  if (Array.isArray(record.hit?.effects)) {
    for (const nested of record.hit.effects) visitEffect(nested, nameById, ids);
  }
  if (Array.isArray(record.effects)) {
    for (const nested of record.effects) visitEffect(nested, nameById, ids);
  }
}

function visitTrigger(
  trigger: unknown,
  nameById: Map<string, string>,
  ids: Set<string>,
): void {
  if (!trigger || typeof trigger !== 'object') return;
  const effects = (trigger as { effects?: unknown[] }).effects;
  if (!Array.isArray(effects)) return;
  for (const effect of effects) visitEffect(effect, nameById, ids);
}

function visitPatch(
  patch: unknown,
  nameById: Map<string, string>,
  ids: Set<string>,
): void {
  if (!patch || typeof patch !== 'object') return;
  const record = patch as { kind?: string; effect?: unknown; hit?: { effects?: unknown[] } };
  if (record.kind === 'appendEffect' || record.kind === 'patchEffect') {
    visitEffect(record.effect, nameById, ids);
  }
  if (record.kind === 'patchHit' && Array.isArray(record.hit?.effects)) {
    for (const effect of record.hit.effects) visitEffect(effect, nameById, ids);
  }
}

function visitTalentLike(
  entry: unknown,
  nameById: Map<string, string>,
  ids: Set<string>,
): void {
  if (!entry || typeof entry !== 'object') return;
  const record = entry as {
    effects?: unknown[];
    triggers?: unknown[];
    patches?: unknown[];
  };
  if (Array.isArray(record.effects)) {
    for (const effect of record.effects) visitEffect(effect, nameById, ids);
  }
  if (Array.isArray(record.triggers)) {
    for (const trigger of record.triggers) visitTrigger(trigger, nameById, ids);
  }
  if (Array.isArray(record.patches)) {
    for (const patch of record.patches) visitPatch(patch, nameById, ids);
  }
}

function visitSkill(
  skill: unknown,
  nameById: Map<string, string>,
  ids: Set<string>,
): void {
  if (!skill || typeof skill !== 'object') return;
  const record = skill as {
    effects?: unknown[];
    triggers?: unknown[];
    segments?: unknown[];
    subSkills?: unknown[];
  };
  if (Array.isArray(record.effects)) {
    for (const effect of record.effects) visitEffect(effect, nameById, ids);
  }
  if (Array.isArray(record.triggers)) {
    for (const trigger of record.triggers) visitTrigger(trigger, nameById, ids);
  }
  if (Array.isArray(record.segments)) {
    for (const segment of record.segments) {
      if (!segment || typeof segment !== 'object') continue;
      const groups = (segment as { damageGroups?: unknown[] }).damageGroups;
      if (!Array.isArray(groups)) continue;
      for (const group of groups) {
        if (!group || typeof group !== 'object') continue;
        const hits = (group as { hits?: unknown[] }).hits;
        if (!Array.isArray(hits)) continue;
        for (const hit of hits) {
          if (!hit || typeof hit !== 'object') continue;
          const effects = (hit as { effects?: unknown[] }).effects;
          if (!Array.isArray(effects)) continue;
          for (const effect of effects) visitEffect(effect, nameById, ids);
        }
      }
    }
  }
  if (Array.isArray(record.subSkills)) {
    for (const sub of record.subSkills) visitSkill(sub, nameById, ids);
  }
}

export type OperatorStatusCatalog = {
  ids: string[];
  nameById: Record<string, string>;
};

/** Walk an operator sheet for stackable `status` effects only. */
export function collectOperatorStatusCatalog(
  sheet: OperatorSheet | null | undefined,
): OperatorStatusCatalog {
  const nameById = new Map<string, string>();
  const ids = new Set<string>();
  if (!sheet) return { ids: [], nameById: {} };
  for (const entry of sheet.talents || []) visitTalentLike(entry, nameById, ids);
  for (const entry of sheet.potentials || []) visitTalentLike(entry, nameById, ids);
  for (const skill of Object.values(sheet.combatSkills || {})) visitSkill(skill, nameById, ids);
  return { ids: [...ids], nameById: Object.fromEntries(nameById) };
}

/** @deprecated Prefer collectOperatorStatusCatalog — kept for callers that only need labels. */
export function collectOperatorStatusNameMap(
  sheet: OperatorSheet | null | undefined,
): Record<string, string> {
  return collectOperatorStatusCatalog(sheet).nameById;
}
