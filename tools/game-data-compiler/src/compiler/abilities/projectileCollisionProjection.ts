import type { ProjectileRuntimeSource } from '../../source/projectileRuntime.ts';
export function isEmptyProjectileCollisionPopulation(
  filter: ProjectileRuntimeSource['targetFilter'],
): boolean {
  return !filter.autoSetTargetFaction && filter.targetFactionType === 0;
}

export function isSupportedSingleEnemyOrGoodCharacterTargetFilter(
  filter: ProjectileRuntimeSource['targetFilter'],
): boolean {
  if (filter.factionTarget !== 1) return false;
  if (filter.autoSetTargetFaction) return !filter.filterObjectType;
  return isFixedGoodCharacterTargetFilter(filter);
}

export function isFixedGoodCharacterTargetFilter(
  filter: ProjectileRuntimeSource['targetFilter'],
): boolean {
  // FactionType.Good(4) + ObjectType.Character(8): Liino's expanding sound wave
  // invokes its hit callback once for every party operator in the all-range model.
  // Keep the masks exact so a different manual population cannot enter this fold.
  return (
    !filter.autoSetTargetFaction &&
    filter.targetFactionType === 4 &&
    filter.filterObjectType &&
    filter.objectType === 8
  );
}
