import { describe, expect, it } from 'vitest';
import { ScenarioEditorSession } from '../../../application/editor/scenarioEditorSession';
import { createEmptyScenario } from '../../../core/project/createProject';
import type { SkillCastDocument } from '../../../core/project/schema';
import {
  createEmptyTimelineActionSelection,
  deleteSelectedTimelineActions,
  reconcileTimelineActionSelection,
  selectTimelineAction,
} from './timelineActionSelection';

function cast(id: string): SkillCastDocument {
  return {
    id,
    source: { kind: 'custom', name: id, actionType: 'custom' },
    placement: { startFrame: 0 },
  };
}

function sessionWithCasts(): ScenarioEditorSession {
  const scenario = createEmptyScenario('scenario:selection', '选择样本');
  scenario.tracks[0] = {
    id: 'track:0',
    operator: null,
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [cast('cast:1'), cast('cast:2')],
  };
  return new ScenarioEditorSession(scenario);
}

describe('timelineActionSelection', () => {
  it('replaces selection without a modifier and toggles it with Ctrl or Meta semantics', () => {
    const first = selectTimelineAction(createEmptyTimelineActionSelection(), 'cast:1', false);
    const added = selectTimelineAction(first, 'cast:2', true);
    const removed = selectTimelineAction(added, 'cast:1', true);

    expect([...first.selectedIds]).toEqual(['cast:1']);
    expect([...added.selectedIds]).toEqual(['cast:1', 'cast:2']);
    expect([...removed.selectedIds]).toEqual(['cast:2']);
    expect(removed.primaryId).toBe('cast:2');
  });

  it('removes stale identities after the scenario changes', () => {
    const session = sessionWithCasts();
    const selection = {
      selectedIds: new Set(['cast:1', 'missing']),
      primaryId: 'missing',
    };

    const reconciled = reconcileTimelineActionSelection(selection, session.snapshot.scenario);

    expect([...reconciled.selectedIds]).toEqual(['cast:1']);
    expect(reconciled.primaryId).toBe('cast:1');
  });

  it('deletes all selected actions in one undoable revision', () => {
    const session = sessionWithCasts();
    const selection = {
      selectedIds: new Set(['cast:1', 'cast:2']),
      primaryId: 'cast:2',
    };

    expect(deleteSelectedTimelineActions(session, selection)).toBe(true);
    expect(session.snapshot.revision).toBe(1);
    expect(session.snapshot.scenario.tracks[0]!.skillCasts).toEqual([]);
    expect(session.undo()).toBe(true);
    expect(session.snapshot.scenario.tracks[0]!.skillCasts.map(value => value.id)).toEqual([
      'cast:1',
      'cast:2',
    ]);
  });

  it('does not create a revision for an empty or stale selection', () => {
    const session = sessionWithCasts();
    expect(deleteSelectedTimelineActions(session, createEmptyTimelineActionSelection())).toBe(
      false,
    );
    expect(
      deleteSelectedTimelineActions(session, {
        selectedIds: new Set(['missing']),
        primaryId: 'missing',
      }),
    ).toBe(false);
    expect(session.snapshot.revision).toBe(0);
  });
});
