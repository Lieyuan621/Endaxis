import { describe, expect, it } from 'vitest';
import { createEmptyProject } from '../../core/project/createProject';
import { ActiveScenarioEditorSession, ProjectEditorSession } from './projectEditorSession';

describe('ProjectEditorSession', () => {
  it('keeps project templates and active scenario edits in one undo history', () => {
    const initial = createEmptyProject({
      createdWith: 'test',
    });
    const projectSession = new ProjectEditorSession(initial);
    const scenarioSession = new ActiveScenarioEditorSession(projectSession);

    projectSession.commit('addTemplate', project => ({
      ...project,
      definitionLibrary: {
        operators: {},
        weapons: {},
        gears: {},
        gearSets: {},
      },
    }));
    scenarioSession.commit('renameScenario', scenario => ({ ...scenario, name: 'Changed' }));

    expect(scenarioSession.snapshot.scenario.name).toBe('Changed');
    expect(scenarioSession.undo()).toBe(true);
    expect(scenarioSession.snapshot.scenario.name).toBe('Scenario 1');
    expect(scenarioSession.undo()).toBe(true);
    expect(projectSession.snapshot.project).toBe(initial);
  });

  it('replaces an opened project and clears history from the previous document', () => {
    const initial = createEmptyProject({
      createdWith: 'test',
    });
    const opened = createEmptyProject({
      projectId: 'opened-project',
      createdWith: 'test',
    });
    const projectSession = new ProjectEditorSession(initial);

    projectSession.commit('rename', project => ({
      ...project,
      scenarios: project.scenarios.map(scenario => ({ ...scenario, name: 'Changed' })),
    }));
    expect(projectSession.canUndo).toBe(true);
    projectSession.replaceProject(opened);

    expect(projectSession.snapshot.project).toBe(opened);
    expect(projectSession.snapshot.lastCommand).toBe('openProject');
    expect(projectSession.canUndo).toBe(false);
    expect(projectSession.canRedo).toBe(false);
  });
});
