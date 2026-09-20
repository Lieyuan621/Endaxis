import { computed, ref, shallowRef } from 'vue';
import { expect, it, vi } from 'vitest';
import { createEmptyProject } from '../../../core/project/createProject';
import { ProjectEditorSession } from '../../../application/editor/projectEditorSession';
import type { TrackIndex } from '../../../core/project/schema';
import {
  createProjectGameDataRepository,
  getProjectDefinitionLibrary,
} from '../../../core/project/projectDefinitionLibrary';
import { createGameDataRepository } from '../../../data/gameDataRepository';
import { perlica } from '../../../data/operators/perlica.generated';
import { projectTrackLoadoutBuilds } from '../library/loadoutBuildViewModel';
import { useProjectDefinitionWorkspaces } from './useProjectDefinitionWorkspaces';

it('derives, saves and resets an operator workspace through project transactions', () => {
  const initial = createEmptyProject({ createdWith: 'test' });
  initial.scenarios[0]!.tracks[0] = {
    id: 'track',
    operator: {
      operatorSlug: perlica.slug,
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 4,
      skillLevels: { basicAttack: 1, battleSkill: 1, comboSkill: 1, ultimate: 1 },
      talentStates: {},
    },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [],
  };
  const session = new ProjectEditorSession(initial);
  const snapshot = shallowRef(session.snapshot);
  const unsubscribe = session.subscribe(value => {
    snapshot.value = value;
  });
  const scenario = computed(() => snapshot.value.project.scenarios[0]!);
  const library = computed(() => getProjectDefinitionLibrary(snapshot.value.project));
  const base = createGameDataRepository({ revision: 'test', operators: [perlica] });
  const loadout = computed(() =>
    projectTrackLoadoutBuilds(
      scenario.value,
      0,
      createProjectGameDataRepository(base, library.value),
    ),
  );
  const refresh = vi.fn();
  const beforeOpen = vi.fn();
  const workspace = useProjectDefinitionWorkspaces({
    projectSession: session,
    gameDataRepository: base,
    scenario,
    selectedTrack: ref<TrackIndex>(0),
    selectedLoadoutModel: loadout,
    projectDefinitionLibrary: library,
    names: {
      operator: slug => slug,
      weapon: slug => slug,
      gear: slug => slug,
      gearSet: slug => slug,
    },
    beforeOpen,
    onDefinitionChange: refresh,
    ensureGameData: async () => {},
    reportError: vi.fn(),
  });
  try {
    workspace.openOperatorDefinitionWorkspace();
    expect(beforeOpen).toHaveBeenCalledWith('operator');
    expect(workspace.showOperatorDefinitionWorkspace.value).toBe(true);
    const custom = workspace.selectedOperatorCustomDefinition.value!;
    expect(custom.slug).not.toBe(perlica.slug);
    expect(initial.scenarios[0]!.tracks[0]!.operator!.operatorSlug).toBe(perlica.slug);
    const revision = session.snapshot.revision;
    workspace.openOperatorDefinitionWorkspace();
    expect(session.snapshot.revision).toBe(revision);
    workspace.saveOperatorDefinition({
      ...custom,
      buffDefinitions: {
        ...custom.buffDefinitions,
        workspaceTest: { stackingType: 'refresh', durationSeconds: 1 },
      },
    });
    expect(
      workspace.selectedOperatorCustomDefinition.value?.buffDefinitions?.workspaceTest,
    ).toBeDefined();
    workspace.resetOperatorDefinition();
    expect(workspace.showOperatorDefinitionWorkspace.value).toBe(false);
    expect(workspace.selectedOperatorCustomDefinition.value?.buffDefinitions).toEqual(
      perlica.buffDefinitions,
    );
    expect(refresh).toHaveBeenCalledTimes(3);
    session.undo();
    expect(
      workspace.selectedOperatorCustomDefinition.value?.buffDefinitions?.workspaceTest,
    ).toBeDefined();
  } finally {
    unsubscribe();
  }
});
