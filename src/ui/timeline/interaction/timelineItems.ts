import type { ScenarioDocument, TrackIndex } from '../../../core/project/schema';
import { getSkillCastPlacementChains } from '../../../core/project/skillCastPlacement';
import { assertScenarioEditAllowed } from '../../../application/editor/scenarioEditConstraints';
import {
  removeSkillCasts,
  clearSimulationRangeBoundary,
  setSimulationRangeBoundary,
} from './timelineDocumentCommands';

export type TimelineMarkerKind =
  | 'cycleBoundary'
  | 'controlSwitch'
  | 'externalEvent'
  | 'dodge'
  | 'simulationStart'
  | 'simulationEnd';
export type TimelineItemKind = 'skill' | 'consumableUse' | TimelineMarkerKind;
export type TimelinePointKind = Exclude<
  TimelineItemKind,
  'skill' | 'simulationStart' | 'simulationEnd'
>;
export interface TimelineItemRef {
  readonly kind: TimelineItemKind;
  readonly id: string;
}
export const timelineItemKey = (ref: TimelineItemRef): string => JSON.stringify([ref.kind, ref.id]);

/** 编辑对象只描述作者输入。自动切人、hit 等模拟投影不注册为可编辑对象。 */
export interface TimelineItem {
  readonly ref: TimelineItemRef;
  readonly key: string;
  readonly trackIndex?: TrackIndex;
  readonly frame: number | undefined;
  readonly multiple: boolean;
  readonly minimumFrame: number;
  readonly maximumFrame: number;
  readonly blocked: boolean;
  /** 接续成员与组首共用移动锚点，不把接续位置物化为绝对帧。 */
  readonly moveAnchor: string;
  readonly move: (scenario: ScenarioDocument, frame: number) => ScenarioDocument;
  readonly remove: (scenario: ScenarioDocument) => ScenarioDocument;
  readonly copy?: () => TimelinePointCopy;
}

/** 剪贴板保留独立的数据副本；恢复函数只捕获该副本，不捕获源方案。 */
export interface TimelinePointCopy {
  readonly kind: TimelinePointKind;
  readonly frame: number;
  readonly minimumFrame: number;
  readonly paste: (scenario: ScenarioDocument, id: string, frame: number) => ScenarioDocument;
}

interface Timed {
  id: string;
  frame: number;
}
interface Located<T> {
  readonly value: T;
  readonly trackIndex?: TrackIndex;
}
interface PointAdapter<T extends Timed> {
  readonly kind: TimelinePointKind;
  readonly preparation?: boolean;
  readonly input?: boolean;
  readonly list: (scenario: ScenarioDocument) => readonly Located<T>[];
  readonly write: (
    scenario: ScenarioDocument,
    id: string,
    value: T | null,
    trackIndex?: TrackIndex,
  ) => ScenarioDocument;
}
function replaceEntry<T extends Timed>(entries: readonly T[], id: string, value: T | null): T[] {
  if (value === null) return entries.filter(entry => entry.id !== id);
  return entries.some(entry => entry.id === id)
    ? entries.map(entry => (entry.id === id ? value : entry))
    : [...entries, value];
}
function pointItems<T extends Timed>(
  adapter: PointAdapter<T>,
  scenario: ScenarioDocument,
): TimelineItem[] {
  return adapter.list(scenario).map(({ value, trackIndex }) => {
    const ref = { kind: adapter.kind, id: value.id };
    const key = timelineItemKey(ref);
    const minimumFrame = Math.max(
      adapter.preparation ? -scenario.battle.prepFrames : 0,
      adapter.input ? (scenario.inheritance?.frame ?? -Infinity) : -Infinity,
    );
    return {
      ref,
      key,
      trackIndex,
      frame: value.frame,
      multiple: true,
      minimumFrame,
      maximumFrame: scenario.battle.durationFrames,
      blocked: !!adapter.input && value.frame < (scenario.inheritance?.frame ?? -Infinity),
      moveAnchor: key,
      move: (current, frame) => adapter.write(current, value.id, { ...value, frame }, trackIndex),
      remove: current => adapter.write(current, value.id, null, trackIndex),
      copy: () => {
        const snapshot = structuredClone(value);
        return {
          kind: adapter.kind,
          frame: value.frame,
          minimumFrame: adapter.preparation ? -Infinity : 0,
          paste: (current, id, frame) => {
            if (trackIndex !== undefined && current.tracks[trackIndex] === null)
              throw new Error('Cannot paste input onto an empty track');
            return adapter.write(
              current,
              id,
              { ...structuredClone(snapshot), id, frame },
              trackIndex,
            );
          },
        };
      },
    };
  });
}

/** 每种文档对象只在这里声明存储位置与特有约束，手势和菜单不遍历类型分支。 */
const pointSources = [
  (s: ScenarioDocument) =>
    pointItems(
      {
        kind: 'controlSwitch',
        preparation: true,
        input: true,
        list: s => s.battle.controlSwitches.map(value => ({ value, trackIndex: value.trackIndex })),
        write: (s, id, value) => ({
          ...s,
          battle: {
            ...s.battle,
            controlSwitches: replaceEntry(s.battle.controlSwitches, id, value),
          },
        }),
      },
      s,
    ),
  (s: ScenarioDocument) =>
    pointItems(
      {
        kind: 'dodge',
        preparation: true,
        input: true,
        list: s =>
          (s.battle.dodgeMarkers ?? []).map(value => ({ value, trackIndex: value.trackIndex })),
        write: (s, id, value) => ({
          ...s,
          battle: {
            ...s.battle,
            dodgeMarkers: replaceEntry(s.battle.dodgeMarkers ?? [], id, value),
          },
        }),
      },
      s,
    ),
  (s: ScenarioDocument) =>
    pointItems(
      {
        kind: 'externalEvent',
        input: true,
        list: s =>
          (s.battle.externalEventMarkers ?? []).map(value => ({
            value,
            trackIndex: value.target.scope === 'operator' ? value.target.trackIndex : undefined,
          })),
        write: (s, id, value) => ({
          ...s,
          battle: {
            ...s.battle,
            externalEventMarkers: replaceEntry(s.battle.externalEventMarkers ?? [], id, value),
          },
        }),
      },
      s,
    ),
  (s: ScenarioDocument) =>
    pointItems(
      {
        kind: 'cycleBoundary',
        list: s => s.battle.cycleBoundaries.map(value => ({ value })),
        write: (s, id, value) => ({
          ...s,
          battle: {
            ...s.battle,
            cycleBoundaries: replaceEntry(s.battle.cycleBoundaries, id, value),
          },
        }),
      },
      s,
    ),
  (s: ScenarioDocument) =>
    pointItems(
      {
        kind: 'consumableUse',
        preparation: true,
        input: true,
        list: s =>
          s.tracks.flatMap((track, index) =>
            (track?.consumableUses ?? []).map(value => ({
              value,
              trackIndex: index as TrackIndex,
            })),
          ),
        write: (s, id, value, trackIndex) => {
          if (trackIndex === undefined || s.tracks[trackIndex] === null)
            throw new Error('Missing consumable track');
          const tracks = [...s.tracks] as ScenarioDocument['tracks'];
          const track = tracks[trackIndex]!;
          tracks[trackIndex] = {
            ...track,
            consumableUses: replaceEntry(track.consumableUses ?? [], id, value),
          };
          return { ...s, tracks };
        },
      },
      s,
    ),
];

export function collectTimelineItems(
  scenario: ScenarioDocument,
  starts: ReadonlyMap<string, number> = new Map(),
): ReadonlyMap<string, TimelineItem> {
  const items: TimelineItem[] = pointSources.flatMap(source => source(scenario));
  scenario.tracks.forEach((track, index) => {
    if (track === null) return;
    for (const chain of getSkillCastPlacementChains(track.skillCasts)) {
      const anchorFrame = chain.anchor.placement.startFrame!;
      const moveAnchor = timelineItemKey({ kind: 'skill', id: chain.anchor.id });
      for (const cast of chain.casts) {
        const ref = { kind: 'skill', id: cast.id } as const;
        items.push({
          ref,
          key: timelineItemKey(ref),
          trackIndex: index as TrackIndex,
          frame: cast.placement.startFrame ?? starts.get(cast.id),
          multiple: true,
          minimumFrame: scenario.inheritance?.frame ?? -scenario.battle.prepFrames,
          maximumFrame: scenario.battle.durationFrames,
          blocked:
            !!cast.presentation?.locked || anchorFrame < (scenario.inheritance?.frame ?? -Infinity),
          moveAnchor,
          move: (s, frame) => ({
            ...s,
            tracks: s.tracks.map((t, i) =>
              i !== index || t === null
                ? t
                : {
                    ...t,
                    skillCasts: t.skillCasts.map(c =>
                      c.id === chain.anchor.id ? { ...c, placement: { startFrame: frame } } : c,
                    ),
                  },
            ) as ScenarioDocument['tracks'],
          }),
          remove: s => removeSkillCasts(s, new Set([cast.id])),
        });
      }
    }
  });
  for (const boundary of ['start', 'end'] as const) {
    const frame = scenario.battle.simulationRange?.[`${boundary}Frame`];
    if (frame === undefined) continue;
    const kind = boundary === 'start' ? 'simulationStart' : 'simulationEnd';
    const ref = { kind, id: kind } as const;
    const key = timelineItemKey(ref);
    items.push({
      ref,
      key,
      frame,
      multiple: false,
      minimumFrame: boundary === 'end' ? (scenario.battle.simulationRange?.startFrame ?? 0) : 0,
      maximumFrame:
        boundary === 'start'
          ? (scenario.battle.simulationRange?.endFrame ?? scenario.battle.durationFrames)
          : scenario.battle.durationFrames,
      blocked: boundary === 'start' && scenario.inheritance !== undefined,
      moveAnchor: key,
      move: (s, frame) => setSimulationRangeBoundary(s, boundary, frame),
      remove: s => clearSimulationRangeBoundary(s, boundary),
    });
  }
  return new Map(items.map(item => [item.key, item]));
}

export interface TimelineMovePlan {
  readonly items: readonly TimelineItem[];
  readonly anchors: readonly TimelineItem[];
  readonly minimumDelta: number;
  readonly maximumDelta: number;
}
export function planTimelineItemMove(
  items: ReadonlyMap<string, TimelineItem>,
  keys: ReadonlySet<string>,
): TimelineMovePlan | null {
  const selected = [...keys].map(key => items.get(key));
  if (!selected.length || selected.some(item => !item)) return null;
  const anchorKeys = new Set(selected.map(item => item!.moveAnchor));
  const affected = [...items.values()].filter(item => anchorKeys.has(item.moveAnchor));
  const anchors = [...anchorKeys].map(key => items.get(key)!);
  if (
    affected.some(item => item.blocked) ||
    anchors.some(item => item.frame === undefined) ||
    (keys.size > 1 && selected.some(item => !item!.multiple))
  )
    return null;
  const minimumDelta = Math.max(...anchors.map(item => item.minimumFrame - item.frame!));
  const maximumDelta = Math.min(...anchors.map(item => item.maximumFrame - item.frame!));
  if (minimumDelta > maximumDelta) return null;
  return { items: affected, anchors, minimumDelta, maximumDelta };
}
export function moveTimelineItems(
  scenario: ScenarioDocument,
  plan: TimelineMovePlan,
  requestedDelta: number,
): { scenario: ScenarioDocument; delta: number } {
  if (!Number.isInteger(requestedDelta))
    throw new Error('Timeline movement requires integer frames');
  const delta = Math.max(plan.minimumDelta, Math.min(plan.maximumDelta, requestedDelta));
  if (!delta) return { scenario, delta };
  const next = plan.anchors.reduce(
    (current, item) => item.move(current, item.frame! + delta),
    scenario,
  );
  assertScenarioEditAllowed(scenario, next, {});
  return { scenario: next, delta };
}
export function removeTimelineItems(
  scenario: ScenarioDocument,
  items: readonly TimelineItem[],
): ScenarioDocument {
  if (!items.length || items.some(item => item.blocked)) return scenario;
  // 一次删除整个技能集合，避免逐段重接连续组造成不同结果。
  const skills = new Set(items.filter(item => item.ref.kind === 'skill').map(item => item.ref.id));
  const next = items
    .filter(item => item.ref.kind !== 'skill')
    .reduce((s, item) => item.remove(s), removeSkillCasts(scenario, skills));
  assertScenarioEditAllowed(scenario, next, {});
  return next;
}
