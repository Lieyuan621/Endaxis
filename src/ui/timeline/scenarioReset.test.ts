import { describe, expect, it } from 'vitest';
import { createEmptyProject, createEmptyScenario } from '../../core/project/createProject';
import { ProjectEditorSession } from '../../application/editor/projectEditorSession';
import { resetProjectScenarios } from './scenarioProjectCommands';

describe('scenario reset', () => {
  it('clears battle state without changing inherited copies and supports undo', () => {
    const project = createEmptyProject({ createdWith: 'test' });
    const current = project.scenarios[0]!;
    current.battle.cycleBoundaries = [{ id: 'boundary', frame: 30 }];
    current.tracks[0] = {
      id: 'track',
      operator: null,
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 50 },
      skillCasts: [],
    };
    const dependent = createEmptyScenario('dependent', 'Dependent');
    dependent.inheritance = { sourceScenarioId: current.id, frame: 30 };
    project.scenarios.push(dependent);
    const session = new ProjectEditorSession(project);
    session.commit('reset', value => resetProjectScenarios(value, 'currentKeepLoadout'));
    const reset = session.snapshot.project;
    expect(reset.scenarios[0]!.tracks[0]!.id).toBe('track');
    expect(reset.scenarios[0]!.tracks[0]!.initialState.ultimateEnergy).toBe(0);
    expect(reset.scenarios[0]!.battle.cycleBoundaries).toEqual([]);
    expect(reset.scenarios[0]!.editor.prepExpanded).toBe(false);
    expect(reset.scenarios[1]).toBe(dependent);
    expect(reset.scenarios[1]!.inheritance).toEqual({ sourceScenarioId: current.id, frame: 30 });
    expect(current.battle.cycleBoundaries).toHaveLength(1);
    session.undo();
    expect(session.snapshot.project).toBe(project);
    session.redo();
    expect(session.snapshot.project).toBe(reset);
  });

  it('keeps inherited history when resetting only the future of an inherited scenario', () => {
    const project = createEmptyProject({ createdWith: 'test' });
    const inherited = createEmptyScenario('inherited', 'Inherited');
    inherited.inheritance = { sourceScenarioId: project.scenarios[0]!.id, frame: 30 };
    inherited.battle.simulationRange = { startFrame: 30, endFrame: 1800 };
    inherited.tracks[0] = {
      id: 'track',
      operator: null,
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 50 },
      skillCasts: [
        {
          id: 'history',
          source: { kind: 'custom', actionType: 'test', name: 'History' },
          placement: { startFrame: 10 },
        },
        {
          id: 'future',
          source: { kind: 'custom', actionType: 'test', name: 'Future' },
          placement: { startFrame: 40 },
        },
      ],
      consumableUses: [
        { id: 'history-item', frame: 12, consumableId: 'drug' },
        { id: 'future-item', frame: 42, consumableId: 'drug' },
      ],
    };
    inherited.battle.controlSwitches = [
      { id: 'history-switch', frame: 10, trackIndex: 0 },
      { id: 'future-switch', frame: 40, trackIndex: 0 },
    ];
    inherited.battle.dodgeMarkers = [
      {
        id: 'crossing-dodge',
        frame: 20,
        trackIndex: 0,
        direction: 'forward',
        mode: { kind: 'perfectDodge', successDelayFrames: 20 },
      },
      {
        id: 'future-dodge',
        frame: 40,
        trackIndex: 0,
        direction: 'forward',
        mode: { kind: 'dodge' },
      },
    ];
    project.scenarios.push(inherited);
    project.activeScenarioId = inherited.id;
    const session = new ProjectEditorSession(project);

    expect(
      session.commit('reset', value => resetProjectScenarios(value, 'currentKeepLoadout')),
    ).toBe(true);
    const reset = session.snapshot.project.scenarios[1]!;
    expect(reset.inheritance).toEqual(inherited.inheritance);
    expect(reset.battle.simulationRange).toEqual(inherited.battle.simulationRange);
    expect(reset.tracks[0]!.initialState).toEqual({ ultimateEnergy: 50 });
    expect(reset.tracks[0]!.skillCasts.map(cast => cast.id)).toEqual(['history']);
    expect(reset.tracks[0]!.consumableUses?.map(use => use.id)).toEqual(['history-item']);
    expect(reset.battle.controlSwitches.map(marker => marker.id)).toEqual(['history-switch']);
    expect(reset.battle.dodgeMarkers).toEqual([
      {
        id: 'crossing-dodge',
        frame: 20,
        trackIndex: 0,
        direction: 'forward',
        mode: { kind: 'dodge' },
      },
    ]);
    session.undo();
    expect(session.snapshot.project.scenarios[1]).toBe(inherited);
    session.redo();
    expect(session.snapshot.project.scenarios[1]).toBe(reset);
  });

  it('resets an inherited scenario as a whole only when inheritance is not kept', () => {
    for (const mode of ['current', 'all'] as const) {
      const project = createEmptyProject({ createdWith: 'test' });
      const source = project.scenarios[0]!;
      const inherited = createEmptyScenario('inherited', 'Inherited');
      inherited.inheritance = { sourceScenarioId: source.id, frame: 30 };
      inherited.battle.simulationRange = { startFrame: 30, endFrame: 1800 };
      project.scenarios.push(inherited);
      project.activeScenarioId = inherited.id;
      const session = new ProjectEditorSession(project);

      expect(() => session.commit('edit', value => resetProjectScenarios(value, mode))).toThrow(
        'fixed-inheritance-boundary',
      );
      expect(
        session.commitScenarioReplacement('reset', value => resetProjectScenarios(value, mode)),
      ).toBe(true);
      const reset = session.snapshot.project;
      expect(
        reset.scenarios.find(scenario => scenario.id === inherited.id)?.inheritance,
      ).toBeUndefined();
      expect(
        reset.scenarios.find(scenario => scenario.id === inherited.id)?.battle.simulationRange,
      ).toBeUndefined();
      session.undo();
      expect(
        session.snapshot.project.scenarios.find(scenario => scenario.id === inherited.id)
          ?.inheritance,
      ).toEqual(inherited.inheritance);
      session.redo();
      expect(session.snapshot.project).toBe(reset);
    }
  });

  it('resets all scenarios without deleting the project template library', () => {
    const project = createEmptyProject({ createdWith: 'test' });
    project.scenarios.push(createEmptyScenario('second', 'Second'));
    project.activeScenarioId = 'second';
    const reset = resetProjectScenarios(project, 'all', '方案1');
    expect(reset.scenarios).toHaveLength(1);
    expect(reset.scenarios[0]!.name).toBe('方案1');
    expect(reset.scenarios[0]!.tracks).toEqual([null, null, null, null]);
    expect(reset.scenarios[0]!.battle.resourceRules.spRecoveryPerSecond).toBe(8);
    expect(reset.definitionLibrary).toBe(project.definitionLibrary);
    expect(reset.activeScenarioId).toBe(project.activeScenarioId);
    expect(project.scenarios).toHaveLength(2);
  });
});
