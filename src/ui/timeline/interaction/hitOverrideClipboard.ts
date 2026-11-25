import { mapHitIdentity, rootAction } from '../../../core/derivedObjectIdentity';
import { levelEnemies } from '../../../core/project/level';
import {
  HIT_OVERRIDE_FIELDS,
  type HitOverrideField,
  type HitOverrideValue,
} from '../../../core/project/hitOverrides';
import type { BattleDocument, ScenarioDocument, TrackIndex } from '../../../core/project/schema';

export interface ClipboardSource {
  readonly scenarioId: string;
  readonly enemyIds: readonly string[];
  readonly tracks: readonly { id: string; index: TrackIndex; operatorSlug?: string }[];
}

export function clipboardSource(scenario: ScenarioDocument): ClipboardSource {
  return {
    scenarioId: scenario.id,
    enemyIds: levelEnemies(scenario.level).map(enemy => enemy.id),
    tracks: scenario.tracks.flatMap((track, index) =>
      track
        ? [{ id: track.id, index: index as TrackIndex, operatorSlug: track.operator?.operatorSlug }]
        : [],
    ),
  };
}

export function clipboardTrackDestinations(scenario: ScenarioDocument, source: ClipboardSource) {
  const destinations = new Map<TrackIndex, TrackIndex>();
  for (const track of source.tracks) {
    const matches = scenario.tracks.flatMap((target, index) => {
      const match =
        scenario.id === source.scenarioId
          ? target?.id === track.id && target.operator?.operatorSlug === track.operatorSlug
          : !!track.operatorSlug && target?.operator?.operatorSlug === track.operatorSlug;
      return match ? [index as TrackIndex] : [];
    });
    if (
      matches.length === 1 &&
      (scenario.id === source.scenarioId ||
        source.tracks.filter(other => other.operatorSlug === track.operatorSlug).length === 1)
    )
      destinations.set(track.index, matches[0]!);
  }
  return destinations;
}

interface ClipboardOverrides {
  readonly fields: Pick<BattleDocument, HitOverrideField>;
  /** 仅记录标记实际引用的技能块。其他 action 根属于构筑或机制入口。 */
  readonly castOwners: Readonly<Record<string, string>>;
}

function documentCastOwners(scenario: ScenarioDocument): Map<string, string> {
  return new Map(
    scenario.tracks.flatMap(
      track => track?.skillCasts.map(cast => [cast.id, track.id] as const) ?? [],
    ),
  );
}

/** 复制以所选技能为创建根的标记，构筑效果的独立创建链留在方案中。 */
export function copyHitOverrides(
  scenario: ScenarioDocument,
  casts: ReadonlySet<string>,
): ClipboardOverrides | undefined {
  if (!HIT_OVERRIDE_FIELDS.some(field => scenario.battle[field])) return undefined;
  const sourceCasts = documentCastOwners(scenario);
  const referencedCasts = new Map<string, string>();
  let fields: ClipboardOverrides['fields'] = {};
  const mapping = {
    entity: (id: string) => id,
    action: (id: string, owner: string) => {
      if (sourceCasts.get(id) === owner) referencedCasts.set(id, owner);
      return id;
    },
  };
  for (const field of HIT_OVERRIDE_FIELDS) {
    const entries = Object.entries(scenario.battle[field] ?? {}).filter(([key]) => {
      const root = rootAction(key);
      if (!root || !casts.has(root.actionId) || sourceCasts.get(root.actionId) !== root.ownerId)
        return false;
      return mapHitIdentity(key, mapping) !== undefined;
    });
    if (entries.length) fields = { ...fields, [field]: Object.fromEntries(entries) };
  }
  return Object.keys(fields).length
    ? { fields, castOwners: Object.fromEntries(referencedCasts) }
    : undefined;
}

export function pasteHitOverrides(
  scenario: ScenarioDocument,
  source: ClipboardSource,
  records: ClipboardOverrides,
  casts: ReadonlyMap<string, string>,
  destinations: ReadonlyMap<TrackIndex, TrackIndex>,
) {
  const owners = new Map<string, string>();
  const enemies = levelEnemies(scenario.level);
  const sameScenario = source.scenarioId === scenario.id;
  for (const track of source.tracks) {
    const index = destinations.get(track.index);
    if (index !== undefined) owners.set(track.id, scenario.tracks[index]!.id);
  }
  if (sameScenario) {
    for (const id of source.enemyIds)
      if (enemies.some(enemy => enemy.id === id)) owners.set(id, id);
  } else if (source.enemyIds.length === 1 && enemies.length === 1) {
    owners.set(source.enemyIds[0]!, enemies[0]!.id);
  }
  const currentCasts = documentCastOwners(scenario);
  const supported = sameScenario || (source.enemyIds.length === 1 && enemies.length === 1);
  const mapping = {
    entity: (id: string) =>
      owners.get(id) ?? (id === 'god-entity' || id === 'battle' ? id : undefined),
    action: (id: string, owner: string) => {
      if (records.castOwners[id] !== owner) return sameScenario ? id : undefined;
      const copied = casts.get(id);
      if (copied !== undefined) return copied;
      return sameScenario && currentCasts.get(id) === owner ? id : undefined;
    },
  };
  let battle = scenario.battle;
  let skipped = 0;
  for (const field of HIT_OVERRIDE_FIELDS) {
    const mapped: Record<string, HitOverrideValue> = {};
    for (const [key, value] of Object.entries(records.fields[field] ?? {})) {
      const next = supported ? mapHitIdentity(key, mapping) : undefined;
      if (next === undefined) skipped++;
      else mapped[next] = value;
    }
    if (Object.keys(mapped).length)
      battle = { ...battle, [field]: { ...battle[field], ...mapped } };
  }
  return { scenario: battle === scenario.battle ? scenario : { ...scenario, battle }, skipped };
}
