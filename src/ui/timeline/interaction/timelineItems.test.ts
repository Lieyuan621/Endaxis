import {
  operatorOwner,
  controlSwitchInputs,
  dodgeInputs,
  consumableInputs,
} from '../../../core/project/scenarioMarkers';
import { describe, expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { createScenarioEditorSession } from '../../../test/scenarioEditorSession';
import {
  collectTimelineItems,
  moveTimelineItems,
  planTimelineItemMove,
  removeTimelineItems,
  timelineItemKey,
} from './timelineItems';
import {
  createTimelineEditorSelection,
  selectTimelineItem,
  selectTimelineItemRange,
  selectedTimelineSkills,
} from './timelineEditorSelection';
import { copyTimelineItems, pasteTimelineActions } from './timelineClipboard';

function fixture() {
  const s = createEmptyScenario('mixed', 'mixed');
  s.battle.prepFrames = 30;
  s.battle.durationFrames = 300;
  s.editor.prepExpanded = true;
  s.tracks[0] = {
    id: 'track',
    operator: null,
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [
      {
        id: 'head',
        source: { kind: 'custom', name: 'A1', actionType: 'custom' },
        placement: { startFrame: 30 },
      },
      {
        id: 'tail',
        source: { kind: 'custom', name: 'A2', actionType: 'custom' },
        placement: { afterCastId: 'head' },
      },
    ],
  };
  s.markers.push({
    kind: 'consumableUse',
    owner: { scope: 'operator', trackId: 'track' },
    id: 'item',
    frame: 25,
    consumableId: 'medicine',
  });
  s.markers = [
    ...s.markers.filter(marker => marker.kind !== 'controlSwitch'),
    { kind: 'controlSwitch' as const, id: 'same-id', frame: 20, owner: operatorOwner(s, 0) },
  ];
  s.markers = [
    ...s.markers.filter(marker => marker.kind !== 'dodge'),
    {
      kind: 'dodge' as const,
      id: 'same-id',
      frame: 40,
      owner: operatorOwner(s, 0),
      direction: 'forward',
      mode: { kind: 'perfectDodge', successDelayFrames: 8 },
    },
  ];
  return s;
}
const key = (kind: Parameters<typeof timelineItemKey>[0]['kind'], id: string) =>
  timelineItemKey({ kind, id });

describe('mixed timeline objects', () => {
  it('同 ID 的受击与拾取独立移动和删除', () => {
    const scenario = fixture();
    const owner = operatorOwner(scenario, 0);
    scenario.markers = [
      { kind: 'operatorHit', id: 'same', frame: 20, owner },
      { kind: 'pickup', id: 'same', frame: 20, owner, group: 'food' },
    ];
    const items = collectTimelineItems(scenario);
    const pickup = items.get(key('pickup', 'same'))!;
    const moved = pickup.move(scenario, 30);
    expect(moved.markers.map(marker => marker.frame)).toEqual([20, 30]);
    expect(pickup.remove(moved).markers).toEqual([scenario.markers[0]]);
  });
  it('keeps dragged inputs out of a collapsed preparation area and allows them when expanded', () => {
    const scenario = fixture();
    const inputs = [
      key('skill', 'head'),
      key('controlSwitch', 'same-id'),
      key('dodge', 'same-id'),
      key('consumableUse', 'item'),
    ];
    scenario.editor.prepExpanded = false;
    const collapsedItems = collectTimelineItems(scenario);
    for (const input of inputs) {
      const item = collapsedItems.get(input)!;
      expect(item.minimumFrame).toBe(0);
      const plan = planTimelineItemMove(collapsedItems, new Set([input]))!;
      const result = moveTimelineItems(scenario, plan, -100);
      expect(result.delta).toBe(-item.frame!);
    }
    scenario.editor.prepExpanded = true;
    const expandedItems = collectTimelineItems(scenario);
    for (const input of inputs) expect(expandedItems.get(input)!.minimumFrame).toBe(-30);
    scenario.inheritance = { sourceScenarioId: 'original', frame: -10 };
    scenario.editor.prepExpanded = false;
    expect(collectTimelineItems(scenario).get(key('skill', 'head'))!.minimumFrame).toBe(0);
  });
  it('expands selection from a chain to a track and all tracks without global markers', () => {
    const scenario = fixture();
    scenario.tracks[1] = {
      ...scenario.tracks[0]!,
      id: 'other',
      skillCasts: [{ ...scenario.tracks[0]!.skillCasts[0]!, id: 'other-skill' }],
    };
    const items = collectTimelineItems(scenario);
    const anchor = items.get(key('skill', 'tail'))!;
    expect([...selectTimelineItemRange(items, 'group', anchor).selectedIds]).toEqual([
      key('skill', 'head'),
      key('skill', 'tail'),
    ]);
    const track = selectTimelineItemRange(items, 'track', anchor).selectedIds;
    expect(track.has(key('dodge', 'same-id'))).toBe(true);
    expect(track.has(key('controlSwitch', 'same-id'))).toBe(true);
    expect(track.has(key('skill', 'other-skill'))).toBe(false);
    expect(selectTimelineItemRange(items, 'all').selectedIds.size).toBe(track.size + 1);
  });
  it('shares selection across types without colliding IDs, and right-click preserves the set', () => {
    const items = collectTimelineItems(fixture());
    let selection = createTimelineEditorSelection(0);
    for (const id of [
      key('skill', 'tail'),
      key('dodge', 'same-id'),
      key('controlSwitch', 'same-id'),
    ])
      selection = selectTimelineItem(selection, items.get(id)!, true);
    selection = selectTimelineItem(selection, items.get(key('dodge', 'same-id'))!, false, true);
    expect(selection.items.selectedIds.size).toBe(3);
    expect(selectedTimelineSkills(selection.items, items).selectedIds).toEqual(new Set(['tail']));
    expect(selectedTimelineSkills(selection.items, items).primaryId).toBeNull();
  });
  it('clamps the entire selection once, moves each chain anchor once, preserves dodge delay, and undoes atomically', () => {
    const s = fixture(),
      items = collectTimelineItems(s);
    const keys = new Set([
      key('skill', 'head'),
      key('skill', 'tail'),
      key('dodge', 'same-id'),
      key('controlSwitch', 'same-id'),
      key('consumableUse', 'item'),
    ]);
    const plan = planTimelineItemMove(items, keys)!;
    const session = createScenarioEditorSession(s);
    session.commit('moveTimelineItems', current => moveTimelineItems(current, plan, -100).scenario);
    const next = session.snapshot.scenario;
    expect(next.tracks[0]!.skillCasts.map(c => c.placement)).toEqual([
      { startFrame: -20 },
      { afterCastId: 'head' },
    ]);
    expect(controlSwitchInputs(next)[0]!.frame).toBe(-30);
    expect(dodgeInputs(next)![0]).toMatchObject({
      frame: -10,
      mode: { successDelayFrames: 8 },
    });
    expect(consumableInputs(next, next.tracks[0]?.id)![0]!.frame).toBe(-25);
    expect(session.snapshot.revision).toBe(1);
    session.undo();
    expect(session.snapshot.scenario).toBe(s);
  });
  it('blocks the whole chain for locked members and preserves the inheritance boundary for every input', () => {
    const s = fixture();
    s.inheritance = { sourceScenarioId: 'original', frame: 15 };
    let items = collectTimelineItems(s);
    const keys = new Set([key('skill', 'tail'), key('controlSwitch', 'same-id')]);
    const next = moveTimelineItems(s, planTimelineItemMove(items, keys)!, -100).scenario;
    expect(controlSwitchInputs(next)[0]!.frame).toBe(15);
    expect(next.tracks[0]!.skillCasts[0]!.placement).toEqual({ startFrame: 25 });
    s.tracks[0]!.skillCasts[1]!.presentation = { locked: true };
    items = collectTimelineItems(s);
    expect(planTimelineItemMove(items, keys)).toBeNull();
    expect(planTimelineItemMove(items, new Set([key('skill', 'head')]))).toBeNull();
  });
  it('copies and deletes a mixed selection without materializing internal links or losing marker payloads', () => {
    const s = fixture(),
      items = [...collectTimelineItems(s).values()];
    const clipboard = copyTimelineItems(s, items, new Map([['tail', 60]]))!;
    let counter = 0;
    const pasted = pasteTimelineActions(s, structuredClone(clipboard), 100, {
      allocate: kind => `${kind}:${++counter}`,
    });
    const skillRefs = pasted.itemRefs.filter(ref => ref.kind === 'skill');
    expect(pasted.scenario.tracks[0]!.skillCasts.at(-1)!.placement).toEqual({
      afterCastId: skillRefs[0]!.id,
    });
    expect(dodgeInputs(pasted.scenario)!.at(-1)).toMatchObject({
      frame: 120,
      mode: { kind: 'perfectDodge', successDelayFrames: 8 },
    });
    const session = createScenarioEditorSession(s);
    session.commit('removeTimelineItems', current => removeTimelineItems(current, items));
    expect(session.snapshot.scenario.tracks[0]!.skillCasts).toHaveLength(0);
    expect(dodgeInputs(session.snapshot.scenario)).toHaveLength(0);
    expect(controlSwitchInputs(session.snapshot.scenario)).toHaveLength(0);
    expect(
      consumableInputs(session.snapshot.scenario, session.snapshot.scenario.tracks[0]?.id),
    ).toHaveLength(0);
    session.undo();
    expect(session.snapshot.scenario).toBe(s);
  });
  it('excludes result projections and prevents simulation endpoints from joining bulk moves', () => {
    const s = fixture();
    s.battle.automaticControlSwitches = true;
    s.battle.simulationRange = { startFrame: 5, endFrame: 200 };
    const items = collectTimelineItems(s);
    expect([...items.values()].filter(item => item.ref.kind === 'controlSwitch')).toHaveLength(1);
    expect(
      planTimelineItemMove(
        items,
        new Set([key('simulationStart', 'simulationStart'), key('skill', 'head')]),
      ),
    ).toBeNull();
  });
});
