/**
 * 复制、粘贴时间轴混合选区，使用一个时间原点。技能内部连线与接续关系随复制一起重建。
 * 剪贴板属于编辑器临时状态；粘贴为所有对象和连线重新分配文档 ID。
 */
import type {
  ConnectionDocument,
  ConnectionEndpoint,
  ScenarioDocument,
  SkillCastDocument,
  TrackIndex,
} from '../../../core/project/schema';
import type { TimelineDocumentIdAllocator } from './placeSkillGroup';
import { type TimelineItem, type TimelineItemRef, type TimelinePointCopy } from './timelineItems';

interface ClipboardCast {
  readonly trackIndex: TrackIndex;
  readonly cast: SkillCastDocument;
}

export interface TimelineActionClipboard {
  readonly originFrame: number;
  readonly casts: readonly ClipboardCast[];
  readonly connections: readonly ConnectionDocument[];
  readonly points?: readonly TimelinePointCopy[];
}

export interface PasteTimelineActionsResult {
  readonly scenario: ScenarioDocument;
  readonly skillCastIds: readonly string[];
  readonly itemRefs: readonly TimelineItemRef[];
}

/** 混合选区使用同一原点。技能内部连接仍由技能复制规则处理。 */
export function copyTimelineItems(
  scenario: ScenarioDocument,
  items: readonly TimelineItem[],
  starts: ReadonlyMap<string, number>,
): TimelineActionClipboard | null {
  if (!items.length || items.some(item => item.ref.kind !== 'skill' && !item.copy)) return null;
  const skills = copyTimelineActions(
    scenario,
    new Set(items.filter(item => item.ref.kind === 'skill').map(item => item.ref.id)),
    starts,
  );
  const points = items.flatMap(item => (item.copy ? [item.copy()] : []));
  return {
    casts: skills?.casts ?? [],
    connections: skills?.connections ?? [],
    points,
    originFrame: Math.min(skills?.originFrame ?? Infinity, ...points.map(point => point.frame)),
  };
}

function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) return value.map(cloneValue) as T;
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]),
    ) as T;
  }
  return value;
}

export function copyTimelineActions(
  scenario: ScenarioDocument,
  selectedIds: ReadonlySet<string>,
  resolvedStartFrames?: ReadonlyMap<string, number>,
): TimelineActionClipboard | null {
  const casts = scenario.tracks.flatMap((track, trackIndex) =>
    track === null
      ? []
      : track.skillCasts
          .filter(cast => selectedIds.has(cast.id))
          .map(cast => ({ trackIndex: trackIndex as TrackIndex, cast: cloneValue(cast) })),
  );
  if (casts.length === 0) return null;

  const copiedIds = new Set(casts.map(entry => entry.cast.id));
  for (const { cast } of casts) {
    const previous = cast.placement.afterCastId;
    if (previous === undefined || copiedIds.has(previous)) continue;
    const startFrame = resolvedStartFrames?.get(cast.id);
    if (startFrame === undefined || !Number.isInteger(startFrame))
      throw new Error(
        `resolved integer start frame is required to copy '${cast.id}' without its predecessor`,
      );
    // 只有显式复制的边界才物化；完整复制的链保持相对关系，也不修改原存档。
    cast.placement = { startFrame };
  }
  return {
    originFrame: Math.min(
      ...casts.flatMap(entry =>
        entry.cast.placement.startFrame === undefined ? [] : [entry.cast.placement.startFrame],
      ),
    ),
    casts,
    connections: scenario.connections
      .filter(
        connection =>
          copiedIds.has(connection.from.skillCastId) && copiedIds.has(connection.to.skillCastId),
      )
      .map(cloneValue),
  };
}

function remapEndpoint(
  endpoint: ConnectionEndpoint,
  castIds: ReadonlyMap<string, string>,
): ConnectionEndpoint | null {
  const skillCastId = castIds.get(endpoint.skillCastId);
  if (skillCastId === undefined) return null;
  return { ...endpoint, skillCastId };
}

export function pasteTimelineActions(
  scenario: ScenarioDocument,
  clipboard: TimelineActionClipboard,
  startFrame: number,
  ids: TimelineDocumentIdAllocator,
): PasteTimelineActionsResult {
  if (!Number.isInteger(startFrame) || startFrame < -scenario.battle.prepFrames) {
    throw new RangeError('startFrame must be an integer within the visible timeline');
  }
  if (clipboard.casts.length === 0 && !clipboard.points?.length)
    return { scenario, skillCastIds: [], itemRefs: [] };
  const minimum = Math.max(
    scenario.inheritance?.frame ?? -scenario.battle.prepFrames,
    ...(clipboard.points ?? []).map(
      point => point.minimumFrame - (point.frame - clipboard.originFrame),
    ),
  );
  const maximumOffset = Math.max(
    0,
    ...clipboard.casts.flatMap(entry =>
      entry.cast.placement.startFrame === undefined
        ? []
        : [entry.cast.placement.startFrame - clipboard.originFrame],
    ),
    ...(clipboard.points ?? []).map(point => point.frame - clipboard.originFrame),
  );
  const maximum = scenario.battle.durationFrames - maximumOffset;
  if (maximum < minimum) throw new RangeError('Clipboard selection does not fit the timeline');
  startFrame = Math.max(minimum, Math.min(maximum, startFrame));

  const castIds = new Map<string, string>();
  for (const entry of clipboard.casts) {
    castIds.set(entry.cast.id, ids.allocate('skillCast'));
  }

  const tracks = [...scenario.tracks] as ScenarioDocument['tracks'];
  const createdIds: string[] = [];
  for (const entry of clipboard.casts) {
    const track = tracks[entry.trackIndex];
    if (track === null) throw new Error(`track ${entry.trackIndex} is empty`);
    const skillCastId = castIds.get(entry.cast.id)!;
    let placement: SkillCastDocument['placement'];
    if (entry.cast.placement.afterCastId === undefined) {
      placement = {
        startFrame: startFrame + entry.cast.placement.startFrame - clipboard.originFrame,
      };
    } else {
      const previous = castIds.get(entry.cast.placement.afterCastId);
      if (previous === undefined)
        throw new Error('clipboard predecessor is outside the copied selection');
      placement = { afterCastId: previous };
    }
    const cast: SkillCastDocument = {
      ...cloneValue(entry.cast),
      id: skillCastId,
      placement,
    };
    tracks[entry.trackIndex] = { ...track, skillCasts: [...track.skillCasts, cast] };
    createdIds.push(skillCastId);
  }

  const connections = [...scenario.connections];
  for (const connection of clipboard.connections) {
    const from = remapEndpoint(connection.from, castIds);
    const to = remapEndpoint(connection.to, castIds);
    if (from === null || to === null) continue;
    connections.push({ ...connection, id: ids.allocate('connection'), from, to });
  }
  let next = { ...scenario, tracks, connections };
  const itemRefs: TimelineItemRef[] = createdIds.map(id => ({ kind: 'skill', id }));
  for (const point of clipboard.points ?? []) {
    const id = ids.allocate(point.kind);
    next = point.paste(next, id, startFrame + point.frame - clipboard.originFrame);
    itemRefs.push({ kind: point.kind, id });
  }
  return { scenario: next, skillCastIds: createdIds, itemRefs };
}
