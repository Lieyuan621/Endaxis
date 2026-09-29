import type {
  ControlSwitchDocument,
  SkillCastDocument,
  TrackListDocument,
} from './schema';

const CONTROLLED_INPUT_GROUPS = new Set([
  'basicAttack',
  'enhancedBasicAttack',
  'plungingAttack',
  'finisher',
]);

export interface ControlledInputCast {
  readonly castId: string;
  readonly frame: number;
  readonly trackIndex: number;
  readonly order: number;
}
export function isControlledInputCast(cast: SkillCastDocument): boolean {
  return (
    cast.source?.kind === 'operatorSkill' && CONTROLLED_INPUT_GROUPS.has(cast.source.skillGroupKey)
  );
}

/** 显式切换先于同帧技能输入；候选输入只在主控确实变化时生成标记。 */
export function inferControlSwitches(
  tracks: TrackListDocument,
  explicitSwitches: readonly ControlSwitchDocument[],
  casts: readonly ControlledInputCast[],
  idForCast: (castId: string) => string,
): ControlSwitchDocument[] {
  const events = [
    ...explicitSwitches.map((marker, order) => ({
      kind: 'explicit' as const,
      frame: marker.frame,
      trackIndex: marker.trackIndex,
      order,
      castId: '',
    })),
    ...casts.map(cast => ({ kind: 'cast' as const, ...cast })),
  ];
  events.sort(
    (left, right) =>
      left.frame - right.frame ||
      (left.kind === right.kind ? left.order - right.order : left.kind === 'explicit' ? -1 : 1),
  );

  const firstOccupiedTrack = tracks.findIndex(track => track?.operator != null);
  let controlledTrackIndex = firstOccupiedTrack < 0 ? 0 : firstOccupiedTrack;
  const inferred: ControlSwitchDocument[] = [];
  for (const event of events) {
    if (event.kind === 'explicit') {
      controlledTrackIndex = event.trackIndex;
      continue;
    }
    if (event.trackIndex === controlledTrackIndex) continue;
    inferred.push({
      id: idForCast(event.castId),
      frame: event.frame,
      trackIndex: event.trackIndex as ControlSwitchDocument['trackIndex'],
    });
    controlledTrackIndex = event.trackIndex;
  }
  return inferred;
}


