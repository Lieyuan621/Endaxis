import type { JsonObject } from '../schema';

function record(value: unknown): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('expected version 3 object');
  return value as JsonObject;
}

function entries(value: unknown = []): JsonObject[] {
  if (!Array.isArray(value)) throw new Error('expected version 3 marker array');
  return value.map(record);
}

/** v3 使用轨道序号记录标记归属，并将消耗品使用记录保存在轨道上。 */
export function upgradeVersionThreeScenario(input: unknown): JsonObject {
  const scenario = record(input);
  const {
    cycleBoundaries,
    controlSwitches,
    dodgeMarkers,
    externalEventMarkers,
    enemyTargetSwitches,
    ...battle
  } = record(scenario.battle);
  if (
    'markers' in scenario ||
    !Array.isArray(scenario.tracks) ||
    !Array.isArray(cycleBoundaries) ||
    !Array.isArray(controlSwitches)
  )
    throw new Error('invalid version 3 scenario');
  const tracks = scenario.tracks;
  function owner(index: unknown): JsonObject {
    if (
      typeof index !== 'number' ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= tracks.length
    )
      throw new Error('invalid version 3 marker track');
    const track = tracks[index];
    return track === null
      ? { scope: 'emptySlot', trackIndex: index }
      : { scope: 'operator', trackId: record(track).id! };
  }
  const markers: JsonObject[] = [
    ...entries(cycleBoundaries).map(marker => ({ ...marker, kind: 'cycleBoundary' })),
    ...entries(controlSwitches).map(({ trackIndex, ...marker }) => ({
      ...marker,
      kind: 'controlSwitch',
      owner: owner(trackIndex),
    })),
    ...entries(dodgeMarkers).map(({ trackIndex, ...marker }) => ({
      ...marker,
      kind: 'dodge',
      owner: owner(trackIndex),
    })),
    ...entries(externalEventMarkers).map(({ target, event, ...marker }) => {
      const ref = record(target);
      if (ref.scope !== 'team' && ref.scope !== 'operator')
        throw new Error('invalid version 3 event target');
      const payload = record(event);
      const position = { ...marker, owner: ref.scope === 'team' ? ref : owner(ref.trackIndex) };
      switch (payload.kind) {
        case 'operatorHit':
          return { ...position, kind: payload.kind };
        case 'pickup':
          return { ...position, kind: payload.kind, group: payload.group! };
        case 'comboCooldownControl':
          return { ...position, kind: payload.kind, mode: payload.mode! };
        default:
          throw new Error('unknown version 3 event kind');
      }
    }),
  ];
  const upgradedTracks = tracks.map((track, index) => {
    if (track === null) return null;
    const { consumableUses, ...fields } = record(track);
    for (const marker of entries(consumableUses))
      markers.push({ ...marker, kind: 'consumableUse', owner: owner(index) });
    return fields;
  });
  for (const { targetId, ...marker } of entries(enemyTargetSwitches))
    markers.push({ ...marker, kind: 'enemyTargetSwitch', enemyId: targetId! });
  return { ...scenario, tracks: upgradedTracks, battle, markers };
}
