/**
 * 时间轴配装编辑器对轨道内嵌的武器、装备实例执行的不可变更新命令。
 * 本层只校验存档自身能够确定的数值形状；依赖具体定义词条的上限继续由定义校验负责。
 */
import type {
  OperatorInstanceDocument,
  ScenarioDocument,
  TrackIndex,
  WeaponInstanceDocument,
} from '../../../core/project/schema';
import type { TrackGearSlot } from '../interaction/timelineDocumentCommands';

export type OperatorInstanceChanges = Partial<
  Pick<
    OperatorInstanceDocument,
    'level' | 'promoted' | 'potential' | 'trustLevel' | 'skillLevels' | 'talentStates'
  >
>;

export type WeaponInstanceChanges = Partial<
  Pick<WeaponInstanceDocument, 'level' | 'tuned' | 'potential' | 'traitLevels'>
>;

function requireIntegerAtLeast(value: number, minimum: number, field: string): void {
  if (!Number.isInteger(value) || value < minimum) {
    throw new RangeError(`${field} must be an integer greater than or equal to ${minimum}`);
  }
}

function requireTrack(scenario: ScenarioDocument, trackIndex: TrackIndex) {
  const track = scenario.tracks[trackIndex];
  if (track === null) throw new Error(`track ${trackIndex} is empty`);
  return track;
}

/** 更新轨道干员实例的养成输入，不改变实例身份和干员定义身份。 */
export function updateTrackOperatorInstance(
  scenario: ScenarioDocument,
  trackIndex: TrackIndex,
  changes: OperatorInstanceChanges,
): ScenarioDocument {
  const track = requireTrack(scenario, trackIndex);
  const instance = track.operator;
  if (instance === null) throw new Error(`track ${trackIndex} has no operator instance`);
  if (changes.level !== undefined) requireIntegerAtLeast(changes.level, 1, 'operator level');
  if (changes.potential !== undefined) {
    requireIntegerAtLeast(changes.potential, 0, 'operator potential');
  }
  if (changes.trustLevel !== undefined) {
    requireIntegerAtLeast(changes.trustLevel, 0, 'operator trust level');
  }
  if (changes.skillLevels !== undefined) {
    Object.entries(changes.skillLevels).forEach(([key, level]) =>
      requireIntegerAtLeast(level, 1, `operator skill level '${key}'`),
    );
  }
  if (changes.talentStates !== undefined) {
    Object.entries(changes.talentStates).forEach(([key, state]) =>
      requireIntegerAtLeast(state, 0, `operator talent state '${key}'`),
    );
  }
  const updated = {
    ...instance,
    ...changes,
    ...(changes.skillLevels === undefined ? {} : { skillLevels: { ...changes.skillLevels } }),
    ...(changes.talentStates === undefined ? {} : { talentStates: { ...changes.talentStates } }),
  };
  const tracks = [...scenario.tracks] as ScenarioDocument['tracks'];
  tracks[trackIndex] = { ...track, operator: updated };
  return { ...scenario, tracks };
}

/** 更新轨道已装备武器的用户输入，不改变实例身份和武器定义身份。 */
export function updateTrackWeaponInstance(
  scenario: ScenarioDocument,
  trackIndex: TrackIndex,
  changes: WeaponInstanceChanges,
): ScenarioDocument {
  const track = requireTrack(scenario, trackIndex);
  const instance = track.weapon;
  if (instance === null) throw new Error(`track ${trackIndex} has no weapon instance`);
  if (changes.level !== undefined) requireIntegerAtLeast(changes.level, 1, 'weapon level');
  if (changes.potential !== undefined) {
    requireIntegerAtLeast(changes.potential, 0, 'weapon potential');
  }
  if (changes.traitLevels !== undefined) {
    changes.traitLevels.forEach((level, index) =>
      requireIntegerAtLeast(level, 1, `weapon trait level ${index}`),
    );
  }

  const tracks = [...scenario.tracks] as ScenarioDocument['tracks'];
  tracks[trackIndex] = { ...track, weapon: { ...instance, ...changes } };
  return { ...scenario, tracks };
}

/** 更新轨道某个装备槽实例的精锻档位，不改变实例和装备定义身份。 */
export function updateTrackGearInstance(
  scenario: ScenarioDocument,
  trackIndex: TrackIndex,
  slot: TrackGearSlot,
  artificingLevels: readonly number[],
): ScenarioDocument {
  const track = requireTrack(scenario, trackIndex);
  const instance = track.gears[slot];
  if (instance === null) throw new Error(`track ${trackIndex} has no gear instance in '${slot}'`);
  artificingLevels.forEach((level, index) =>
    requireIntegerAtLeast(level, 0, `gear artificing level ${index}`),
  );
  const tracks = [...scenario.tracks] as ScenarioDocument['tracks'];
  tracks[trackIndex] = {
    ...track,
    gears: {
      ...track.gears,
      [slot]: { ...instance, artificingLevels: [...artificingLevels] },
    },
  };
  return { ...scenario, tracks };
}
