import type { ScenarioDocument, TrackIndex } from './schema';

type OperatorMarkerOwner =
  { scope: 'operator'; trackId: string } | { scope: 'emptySlot'; trackIndex: TrackIndex };

type MarkerPosition = { id: string; frame: number };
export type ScenarioMarkerDocument = MarkerPosition &
  (
    | { kind: 'cycleBoundary' }
    | { kind: 'controlSwitch'; owner: OperatorMarkerOwner }
    | {
        kind: 'dodge';
        owner: OperatorMarkerOwner;
        direction: 'forward' | 'backward';
        mode: { kind: 'dodge' } | { kind: 'perfectDodge'; successDelayFrames: number };
      }
    | { kind: 'pickup'; group: string; owner: OperatorMarkerOwner }
    | { kind: 'operatorHit'; owner: OperatorMarkerOwner }
    | { kind: 'comboCooldownControl'; mode: 'ready' | 'cooldown'; owner: { scope: 'team' } }
    | { kind: 'consumableUse'; owner: OperatorMarkerOwner; consumableId: string }
    | { kind: 'enemyTargetSwitch'; enemyId: string }
  );

export function markerSupportsPreparation(kind: unknown): boolean {
  return (
    kind === 'controlSwitch' ||
    kind === 'dodge' ||
    kind === 'consumableUse' ||
    kind === 'enemyTargetSwitch'
  );
}

export function appendScenarioMarker(
  scenario: ScenarioDocument,
  marker: ScenarioMarkerDocument,
): ScenarioDocument {
  if (
    !marker.id ||
    scenario.markers.some(existing => existing.kind === marker.kind && existing.id === marker.id)
  )
    throw new Error(`invalid or duplicate ${marker.kind} marker id '${marker.id}'`);
  return { ...scenario, markers: [...scenario.markers, marker] };
}

export function hasOperatorOwner(
  marker: ScenarioMarkerDocument,
): marker is Extract<ScenarioMarkerDocument, { owner: OperatorMarkerOwner }> {
  return 'owner' in marker && marker.owner.scope !== 'team';
}

/** 有干员的轨道按 ID 定位，空槽位按序号定位。 */
export function operatorOwner(
  scenario: ScenarioDocument,
  trackIndex: TrackIndex,
): OperatorMarkerOwner {
  const track = scenario.tracks[trackIndex];
  return track ? { scope: 'operator', trackId: track.id } : { scope: 'emptySlot', trackIndex };
}

/** 按当前轨序解析归属。找不到指定轨道时拒绝恢复，避免把输入投给其他干员。 */
export function resolveScenarioMarkerTrack(
  tracks: readonly ({ id: string } | null)[],
  owner: OperatorMarkerOwner,
): TrackIndex {
  if (owner.scope === 'emptySlot') {
    if (!Number.isInteger(owner.trackIndex) || tracks[owner.trackIndex] !== null)
      throw new Error(`invalid empty marker slot ${owner.trackIndex}`);
    return owner.trackIndex;
  }
  if (owner.scope !== 'operator' || typeof owner.trackId !== 'string' || !owner.trackId)
    throw new Error('expected an operator marker owner');
  const index = tracks.findIndex(track => track?.id === owner.trackId);
  if (index < 0 || index > 3) throw new Error(`unknown marker track '${owner.trackId}'`);
  return index as TrackIndex;
}

export function markersOfKind<K extends ScenarioMarkerDocument['kind']>(
  scenario: ScenarioDocument,
  kind: K,
) {
  return scenario.markers.filter(
    (marker): marker is Extract<ScenarioMarkerDocument, { kind: K }> => marker.kind === kind,
  );
}

export function controlSwitchInputs(scenario: ScenarioDocument) {
  return markersOfKind(scenario, 'controlSwitch').map(({ id, frame, owner }) => ({
    id,
    frame,
    trackIndex: resolveScenarioMarkerTrack(scenario.tracks, owner),
  }));
}
export function dodgeInputs(scenario: ScenarioDocument) {
  return markersOfKind(scenario, 'dodge').map(({ id, frame, direction, mode, owner }) => ({
    id,
    frame,
    direction,
    mode,
    trackIndex: resolveScenarioMarkerTrack(scenario.tracks, owner),
  }));
}
export type InteractionMarker = Extract<
  ScenarioMarkerDocument,
  { kind: 'pickup' | 'operatorHit' | 'comboCooldownControl' }
>;
export function isInteractionKind(kind: string): kind is InteractionMarker['kind'] {
  return kind === 'pickup' || kind === 'operatorHit' || kind === 'comboCooldownControl';
}
export function interactionMarkers(scenario: ScenarioDocument) {
  return scenario.markers.filter((marker): marker is InteractionMarker =>
    isInteractionKind(marker.kind),
  );
}
export function enemyTargetInputs(scenario: ScenarioDocument) {
  return markersOfKind(scenario, 'enemyTargetSwitch').map(({ id, frame, enemyId }) => ({
    id,
    frame,
    targetId: enemyId,
  }));
}
export function consumableInputs(scenario: ScenarioDocument, trackId: string | undefined) {
  return markersOfKind(scenario, 'consumableUse').filter(
    marker => marker.owner.scope === 'operator' && marker.owner.trackId === trackId,
  );
}

export type ControlSwitchInput = ReturnType<typeof controlSwitchInputs>[number];
export type TrackDodgeInput = ReturnType<typeof dodgeInputs>[number];

/** 截取已经发生的闪避事实；保留 Dash，但不把尚未发生的成功声明带入历史。 */
export function markerHistory(scenario: ScenarioDocument, boundary: number) {
  return scenario.markers
    .filter(marker => marker.frame < boundary)
    .map(marker =>
      marker.kind === 'dodge' && resolveDodgeMarkerLastInputFrame(marker) >= boundary
        ? { ...marker, mode: { kind: 'dodge' as const } }
        : marker,
    );
}

/** 闪避标签所代表的最后一个输入帧；普通闪避只有 Dash，极限闪避还包含成功事实。 */
export function resolveDodgeMarkerLastInputFrame(
  marker: Pick<TrackDodgeInput, 'frame' | 'mode' | 'id'>,
): number {
  const frame =
    marker.mode.kind === 'perfectDodge'
      ? marker.frame + marker.mode.successDelayFrames
      : marker.frame;
  if (!Number.isSafeInteger(frame)) {
    throw new RangeError(`dodge marker '${marker.id}' last input frame must be a safe integer`);
  }
  return frame;
}
