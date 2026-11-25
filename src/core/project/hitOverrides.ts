import { mapHitIdentity, type IdentityMapping } from '../derivedObjectIdentity';
import { levelEnemies } from './level';
import type { BattleDocument, ScenarioDocument } from './schema';

export const HIT_OVERRIDE_FIELDS = ['hitCriticalOverrides', 'hitWeaknessBreaks'] as const;
export type HitOverrideField = (typeof HIT_OVERRIDE_FIELDS)[number];
export type HitOverrideValue = NonNullable<BattleDocument[HitOverrideField]>[string];

/** 条件未触发或暂时切出时保留标记，仅在删除其引用的文档对象时清理。 */
export function pruneHitOverrides(
  previous: ScenarioDocument,
  next: ScenarioDocument,
): ScenarioDocument {
  if (previous === next || !HIT_OVERRIDE_FIELDS.some(field => next.battle[field])) return next;
  const casts = new Map(
    next.tracks.flatMap(track => track?.skillCasts.map(cast => [cast.id, track.id] as const) ?? []),
  );
  const entities = new Set([
    ...next.tracks.flatMap(track => (track ? [track.id] : [])),
    ...levelEnemies(next.level).map(e => e.id),
  ]);
  const removedCasts = new Map(
    previous.tracks.flatMap(
      track =>
        track?.skillCasts
          .filter(cast => casts.get(cast.id) !== track.id)
          .map(cast => [cast.id, track.id] as const) ?? [],
    ),
  );
  const removedEntities = new Set(
    [
      ...previous.tracks.flatMap(track => (track ? [track.id] : [])),
      ...levelEnemies(previous.level).map(e => e.id),
    ].filter(id => !entities.has(id)),
  );
  if (!removedCasts.size && !removedEntities.size) return next;
  const mapping: IdentityMapping = {
    entity: id => (removedEntities.has(id) ? undefined : id),
    action: (id, owner) => (removedCasts.get(id) === owner ? undefined : id),
  };
  let battle = next.battle;
  for (const field of HIT_OVERRIDE_FIELDS) {
    const overrides = battle[field];
    if (!overrides) continue;
    const entries = Object.entries(overrides).filter(
      ([key]) => mapHitIdentity(key, mapping) !== undefined,
    );
    if (entries.length === Object.keys(overrides).length) continue;
    battle = { ...battle, [field]: Object.fromEntries(entries) };
    if (!entries.length) delete battle[field];
  }
  return battle === next.battle ? next : { ...next, battle };
}
