import { describe, expect, it } from 'vitest';
import {
  ActiveScenarioEditorSession,
  ProjectEditorSession,
} from '../../../application/editor/projectEditorSession';
import { createEmptyProject, createEmptyScenario } from '../../../core/project/createProject';
import type { ScenarioDocument } from '../../../core/project/schema';
import {
  moveControlSwitch,
  moveCycleBoundary,
  moveExternalEventMarker,
  setSimulationRangeBoundary,
} from './timelineDocumentCommands';

function createSession() {
  const scenario = createEmptyScenario('marker-history', 'marker history');
  scenario.battle.cycleBoundaries = [{ id: 'cycle:1', frame: 30 }];
  scenario.battle.controlSwitches = [{ id: 'switch:1', frame: 45, trackIndex: 0 }];
  scenario.battle.externalEventMarkers = [
    {
      id: 'external:1',
      frame: 60,
      target: { scope: 'team' },
      event: { kind: 'comboCooldownControl', mode: 'cooldown' },
    },
  ];
  scenario.battle.simulationRange = { startFrame: 15, endFrame: 300 };
  const project = createEmptyProject({
    projectId: 'marker-history',
    createdWith: 'test',
  });
  project.activeScenarioId = scenario.id;
  project.scenarios = [scenario];
  const projectSession = new ProjectEditorSession(project);
  return {
    projectSession,
    scenarioSession: new ActiveScenarioEditorSession(projectSession),
  };
}

function markerFrame(scenario: ScenarioDocument, kind: string): number | undefined {
  if (kind === 'cycle') return scenario.battle.cycleBoundaries[0]?.frame;
  if (kind === 'switch') return scenario.battle.controlSwitches[0]?.frame;
  if (kind === 'external') return scenario.battle.externalEventMarkers?.[0]?.frame;
  return scenario.battle.simulationRange?.startFrame;
}

describe('timeline marker move history boundary', () => {
  it.each([
    ['cycle', 30, (scenario: ScenarioDocument) => moveCycleBoundary(scenario, 'cycle:1', 90)],
    ['switch', 45, (scenario: ScenarioDocument) => moveControlSwitch(scenario, 'switch:1', 90)],
    [
      'external',
      60,
      (scenario: ScenarioDocument) => moveExternalEventMarker(scenario, 'external:1', 90),
    ],
    [
      'range',
      15,
      (scenario: ScenarioDocument) => setSimulationRangeBoundary(scenario, 'start', 90),
    ],
  ] as const)(
    'commits one released %s marker position and undoes it in one step',
    (kind, initial, move) => {
      const { projectSession, scenarioSession } = createSession();
      const base = scenarioSession.snapshot.scenario;
      const preview = move(base);

      expect(markerFrame(base, kind)).toBe(initial);
      expect(markerFrame(preview, kind)).toBe(90);
      expect(projectSession.snapshot.revision).toBe(0);

      expect(scenarioSession.commit('moveTimelineMarker', () => preview)).toBe(true);
      expect(projectSession.snapshot.revision).toBe(1);
      expect(markerFrame(scenarioSession.snapshot.scenario, kind)).toBe(90);

      expect(scenarioSession.undo()).toBe(true);
      expect(markerFrame(scenarioSession.snapshot.scenario, kind)).toBe(initial);
      expect(scenarioSession.canUndo).toBe(false);
    },
  );

  it('does not create history for a cancelled or origin-returned preview', () => {
    const { projectSession, scenarioSession } = createSession();
    const base = scenarioSession.snapshot.scenario;
    const away = moveCycleBoundary(base, 'cycle:1', 90);

    expect(away).not.toBe(base);
    expect(projectSession.snapshot.revision).toBe(0);
    expect(markerFrame(scenarioSession.snapshot.scenario, 'cycle')).toBe(30);
    expect(scenarioSession.commit('moveTimelineMarker', () => base)).toBe(false);
    expect(projectSession.snapshot.revision).toBe(0);
  });
});
