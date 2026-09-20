import { describe, expect, it } from 'vitest';
import {
  ActiveScenarioEditorSession,
  ProjectEditorSession,
} from '../../../application/editor/projectEditorSession';
import { createEmptyProject } from '../../../core/project/createProject';
import { moveSkillCasts } from './timelineDocumentCommands';
import {
  ABILITY_ENTITY_SAMPLE_CAST_ID,
  ABILITY_ENTITY_SAMPLE_TRACK_INDEX,
  createTimelineSampleScenario,
} from '../timelineSampleScenario';

function createSession() {
  const scenario = createTimelineSampleScenario();
  const project = createEmptyProject({
    projectId: 'cast-move-history',
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

function movePreview(startFrame: number) {
  return (scenario: ReturnType<typeof createTimelineSampleScenario>) =>
    moveSkillCasts(
      scenario,
      new Set([ABILITY_ENTITY_SAMPLE_CAST_ID]),
      ABILITY_ENTITY_SAMPLE_TRACK_INDEX,
      ABILITY_ENTITY_SAMPLE_CAST_ID,
      startFrame,
    );
}

function castStartFrame(session: ActiveScenarioEditorSession): number {
  return session.snapshot.scenario.tracks[ABILITY_ENTITY_SAMPLE_TRACK_INDEX]!.skillCasts.find(
    cast => cast.id === ABILITY_ENTITY_SAMPLE_CAST_ID,
  )!.placement.startFrame!;
}

describe('timeline cast move history boundary', () => {
  it('keeps repeated previews outside history and commits only the released position', () => {
    const { projectSession, scenarioSession } = createSession();
    const base = scenarioSession.snapshot.scenario;
    const firstPreview = movePreview(60)(base);
    const finalPreview = movePreview(90)(base);

    expect(firstPreview).not.toBe(base);
    expect(finalPreview).not.toBe(firstPreview);
    expect(projectSession.snapshot.revision).toBe(0);
    expect(castStartFrame(scenarioSession)).toBe(30);

    expect(scenarioSession.commit('moveSkillCasts', () => finalPreview)).toBe(true);
    expect(projectSession.snapshot.revision).toBe(1);
    expect(castStartFrame(scenarioSession)).toBe(90);

    expect(scenarioSession.undo()).toBe(true);
    expect(castStartFrame(scenarioSession)).toBe(30);
    expect(scenarioSession.canUndo).toBe(false);
  });

  it('cancels by discarding the preview without creating history', () => {
    const { projectSession, scenarioSession } = createSession();
    const base = scenarioSession.snapshot.scenario;
    const preview = movePreview(120)(base);

    expect(preview).not.toBe(base);
    expect(castStartFrame(scenarioSession)).toBe(30);
    expect(projectSession.snapshot.revision).toBe(0);
    expect(scenarioSession.canUndo).toBe(false);
  });

  it('does not create history when a threshold-crossing gesture returns to its origin', () => {
    const { projectSession, scenarioSession } = createSession();
    const base = scenarioSession.snapshot.scenario;
    const away = movePreview(60)(base);
    const returned = movePreview(30)(base);

    expect(away).not.toBe(base);
    expect(returned).toBe(base);
    expect(scenarioSession.commit('moveSkillCasts', () => returned)).toBe(false);
    expect(projectSession.snapshot.revision).toBe(0);
    expect(scenarioSession.canUndo).toBe(false);
  });
});
