import { computed, ref, type Ref } from 'vue';
import type { ProjectEditorSession } from '../../../application/editor/projectEditorSession';
import type { GameDataRepository } from '../../../core/game-data/gameDataRepository';
import type { OperatorDefinition } from '../../../core/game-data/operatorDefinition';
import type {
  WeaponDefinition,
  GearDefinition,
  GearSetDefinition,
} from '../../../core/game-data/equipmentDefinition';
import type {
  ProjectDefinitionLibraryDocument,
  ScenarioDocument,
  TrackIndex,
} from '../../../core/project/schema';
import type {
  TrackLoadoutInstanceViewModel,
  LoadoutGearSlot as TrackGearSlot,
} from '../library/loadoutBuildViewModel';
import {
  allocateProjectTemplateId,
  deriveProjectGearTemplate,
  deriveProjectGearSetTemplate,
  deriveProjectOperatorTemplate,
  deriveProjectWeaponTemplate,
  getProjectDefinitionLibrary,
  replaceProjectGearTemplateDefinition,
  replaceProjectGearSetTemplateDefinition,
  replaceProjectOperatorTemplateDefinition,
  replaceProjectWeaponTemplateDefinition,
  switchTrackToCompatibleOperatorTemplate,
  switchTrackToCompatibleGearTemplate,
  switchTrackToCompatibleWeaponTemplate,
} from '../../../core/project/projectDefinitionLibrary';

/** 定义工作区拥有模板派生/保存/恢复和打开状态；页面只负责外层弹窗与模拟刷新。 */
export function useProjectDefinitionWorkspaces(options: {
  projectSession: ProjectEditorSession;
  gameDataRepository: GameDataRepository;
  scenario: Readonly<Ref<ScenarioDocument>>;
  selectedTrack: Readonly<Ref<TrackIndex>>;
  selectedLoadoutModel: Readonly<Ref<TrackLoadoutInstanceViewModel>>;
  projectDefinitionLibrary: Readonly<Ref<ProjectDefinitionLibraryDocument>>;
  names: {
    operator(slug: string): string;
    weapon(slug: string): string;
    gear(slug: string): string;
    gearSet(slug: string): string;
  };
  beforeOpen(kind: 'operator' | 'weapon' | 'gear'): void;
  onDefinitionChange(): void;
  ensureGameData(): Promise<unknown>;
  reportError(message: string): void;
}) {
  const {
    projectSession,
    gameDataRepository,
    scenario,
    selectedTrack,
    selectedLoadoutModel,
    projectDefinitionLibrary,
  } = options;
  const showOperatorDefinitionWorkspace = ref(false);
  const showWeaponDefinitionWorkspace = ref(false);
  const gearDefinitionWorkspaceSlot = ref<TrackGearSlot | null>(null);
  const gearSetDefinitionWorkspaceId = ref<string | null>(null);

  const selectedOperatorBaseDefinition = computed(() => {
    const slug = selectedLoadoutModel.value.operator?.operatorSlug;
    if (slug === undefined) return null;
    const template = projectDefinitionLibrary.value.operators[slug];
    return gameDataRepository.getOperator(template?.origin?.templateId ?? slug);
  });
  const selectedOperatorCustomDefinition = computed(() => {
    const slug = selectedLoadoutModel.value.operator?.operatorSlug;
    return slug === undefined
      ? undefined
      : projectDefinitionLibrary.value.operators[slug]?.definition;
  });

  const selectedWeaponBaseDefinition = computed(() => {
    const slug = selectedLoadoutModel.value.weapon?.weaponSlug;
    if (slug === undefined) return null;
    const template = projectDefinitionLibrary.value.weapons[slug];
    return gameDataRepository.getWeapon(template?.origin?.templateId ?? slug);
  });
  const selectedWeaponCustomDefinition = computed(() => {
    const slug = selectedLoadoutModel.value.weapon?.weaponSlug;
    return slug === undefined
      ? undefined
      : projectDefinitionLibrary.value.weapons[slug]?.definition;
  });
  const selectedGearDefinition = computed(() => {
    const slot = gearDefinitionWorkspaceSlot.value;
    return slot === null ? null : (selectedLoadoutModel.value.gears[slot]?.definition ?? null);
  });
  const selectedGearBaseDefinition = computed(() => {
    const current = selectedGearDefinition.value;
    if (current === null) return null;
    const template = projectDefinitionLibrary.value.gears[current.slug];
    return gameDataRepository.getGear(template?.origin?.templateId ?? current.slug);
  });
  const selectedGearCustomDefinition = computed(() => {
    const slug = selectedGearDefinition.value?.slug;
    return slug === undefined ? undefined : projectDefinitionLibrary.value.gears[slug]?.definition;
  });

  const selectedGearSetCustomDefinition = computed(() => {
    const id = gearSetDefinitionWorkspaceId.value;
    return id === null ? undefined : projectDefinitionLibrary.value.gearSets[id]?.definition;
  });
  const selectedGearSetBaseDefinition = computed(() => {
    const id = gearSetDefinitionWorkspaceId.value;
    if (id === null) return null;
    const template = projectDefinitionLibrary.value.gearSets[id];
    return gameDataRepository.getGearSet(template?.origin?.templateId ?? id);
  });

  function openOperatorDefinitionWorkspace(): void {
    const track = scenario.value.tracks[selectedTrack.value];
    const current = selectedLoadoutModel.value.operator?.definition ?? null;
    if (track?.operator === null || track === null || current === null) return;
    // 定义工作区取代构筑弹窗，不在其上再叠一个同尺寸模态框。
    options.beforeOpen('operator');
    if (projectDefinitionLibrary.value.operators[current.slug] !== undefined) {
      showOperatorDefinitionWorkspace.value = true;
      return;
    }

    const templateId = allocateProjectTemplateId(projectDefinitionLibrary.value, 'operator');
    const displayName = `${options.names.operator(current.slug)}（自定义）`;
    const changed = projectSession.commit('deriveProjectOperatorTemplate', project => {
      const nextProject = deriveProjectOperatorTemplate(project, {
        id: templateId,
        name: displayName,
        baseTemplateId: current.slug,
        definition: current,
      });
      const nextDefinition =
        getProjectDefinitionLibrary(nextProject).operators[templateId]!.definition;
      return {
        ...nextProject,
        scenarios: nextProject.scenarios.map(value =>
          value.id === nextProject.activeScenarioId
            ? switchTrackToCompatibleOperatorTemplate(
                value,
                selectedTrack.value,
                current,
                templateId,
                nextDefinition,
              )
            : value,
        ),
      };
    });
    if (!changed) return;
    options.onDefinitionChange();
    showOperatorDefinitionWorkspace.value = true;
  }

  function saveOperatorDefinition(definition: OperatorDefinition): void {
    projectSession.commit('saveProjectOperatorTemplate', project =>
      replaceProjectOperatorTemplateDefinition(project, definition.slug, definition),
    );
    options.onDefinitionChange();
  }

  function resetOperatorDefinition(): void {
    const slug = selectedLoadoutModel.value.operator?.operatorSlug;
    if (slug === undefined) return;
    const template = projectDefinitionLibrary.value.operators[slug];
    const base = selectedOperatorBaseDefinition.value;
    if (template === undefined || base === null) return;
    const definition = structuredClone({
      ...base,
      slug,
      displayName: template.name,
      assetSlug: base.assetSlug ?? base.slug,
    });
    projectSession.commit('resetProjectOperatorTemplate', project =>
      replaceProjectOperatorTemplateDefinition(project, slug, definition),
    );
    showOperatorDefinitionWorkspace.value = false;
    options.onDefinitionChange();
  }

  function openWeaponDefinitionWorkspace(): void {
    const track = scenario.value.tracks[selectedTrack.value];
    const current = selectedLoadoutModel.value.weapon?.definition ?? null;
    if (track?.weapon === null || track === null || current === null) return;
    options.beforeOpen('weapon');
    if (projectDefinitionLibrary.value.weapons[current.slug] !== undefined) {
      showWeaponDefinitionWorkspace.value = true;
      return;
    }

    const templateId = allocateProjectTemplateId(projectDefinitionLibrary.value, 'weapon');
    const displayName = `${options.names.weapon(current.slug)}（自定义）`;
    const changed = projectSession.commit('deriveProjectWeaponTemplate', project => {
      const nextProject = deriveProjectWeaponTemplate(project, {
        id: templateId,
        name: displayName,
        baseTemplateId: current.slug,
        definition: current,
      });
      const nextDefinition =
        getProjectDefinitionLibrary(nextProject).weapons[templateId]!.definition;
      return {
        ...nextProject,
        scenarios: nextProject.scenarios.map(value =>
          value.id === nextProject.activeScenarioId
            ? switchTrackToCompatibleWeaponTemplate(
                value,
                selectedTrack.value,
                templateId,
                nextDefinition,
              )
            : value,
        ),
      };
    });
    if (!changed) return;
    options.onDefinitionChange();
    showWeaponDefinitionWorkspace.value = true;
  }

  function saveWeaponDefinition(definition: WeaponDefinition): void {
    projectSession.commit('saveProjectWeaponTemplate', project =>
      replaceProjectWeaponTemplateDefinition(project, definition.slug, definition),
    );
    options.onDefinitionChange();
  }

  function resetWeaponDefinition(): void {
    const slug = selectedLoadoutModel.value.weapon?.weaponSlug;
    const base = selectedWeaponBaseDefinition.value;
    const template = slug === undefined ? undefined : projectDefinitionLibrary.value.weapons[slug];
    if (slug === undefined || template === undefined || base === null) return;
    const definition = structuredClone({
      ...base,
      slug,
      displayName: template.name,
      assetSlug: base.assetSlug ?? base.slug,
    });
    projectSession.commit('resetProjectWeaponTemplate', project =>
      replaceProjectWeaponTemplateDefinition(project, slug, definition),
    );
    showWeaponDefinitionWorkspace.value = false;
    options.onDefinitionChange();
  }

  async function openGearDefinitionWorkspace(slot: TrackGearSlot): Promise<void> {
    await options.ensureGameData();
    const track = scenario.value.tracks[selectedTrack.value];
    const current = selectedLoadoutModel.value.gears[slot]?.definition ?? null;
    if (track === null || track?.gears[slot] === null || current === null) return;
    options.beforeOpen('gear');
    gearDefinitionWorkspaceSlot.value = slot;
    if (projectDefinitionLibrary.value.gears[current.slug] !== undefined) return;

    const templateId = allocateProjectTemplateId(projectDefinitionLibrary.value, 'gear');
    const displayName = `${options.names.gear(current.slug)}（自定义）`;
    const changed = projectSession.commit('deriveProjectGearTemplate', project => {
      const nextProject = deriveProjectGearTemplate(project, {
        id: templateId,
        name: displayName,
        baseTemplateId: current.slug,
        definition: current,
      });
      const nextDefinition = getProjectDefinitionLibrary(nextProject).gears[templateId]!.definition;
      return {
        ...nextProject,
        scenarios: nextProject.scenarios.map(value =>
          value.id === nextProject.activeScenarioId
            ? switchTrackToCompatibleGearTemplate(
                value,
                selectedTrack.value,
                slot,
                templateId,
                nextDefinition,
              )
            : value,
        ),
      };
    });
    if (!changed) return;
    options.onDefinitionChange();
  }

  function saveGearDefinition(definition: GearDefinition): void {
    projectSession.commit('saveProjectGearTemplate', project =>
      replaceProjectGearTemplateDefinition(project, definition.slug, definition),
    );
    options.onDefinitionChange();
  }

  function resetGearDefinition(): void {
    const slug = selectedGearDefinition.value?.slug;
    const base = selectedGearBaseDefinition.value;
    const template = slug === undefined ? undefined : projectDefinitionLibrary.value.gears[slug];
    if (slug === undefined || template === undefined || base === null) return;
    const definition = structuredClone({
      ...base,
      slug,
      displayName: template.name,
      assetSlug: base.assetSlug ?? base.slug,
    });
    projectSession.commit('resetProjectGearTemplate', project =>
      replaceProjectGearTemplateDefinition(project, slug, definition),
    );
    gearDefinitionWorkspaceSlot.value = null;
    options.onDefinitionChange();
  }

  function openGearSetDefinitionWorkspace(gearDefinition: GearDefinition): void {
    const sourceSetId = gearDefinition.gearSetSlug;
    const gearTemplate = projectDefinitionLibrary.value.gears[gearDefinition.slug];
    if (sourceSetId === undefined || gearTemplate === undefined) return;

    const existingSet = projectDefinitionLibrary.value.gearSets[sourceSetId];
    if (existingSet !== undefined) {
      projectSession.commit('saveProjectGearBeforeEditingSet', project =>
        replaceProjectGearTemplateDefinition(project, gearDefinition.slug, gearDefinition),
      );
      gearDefinitionWorkspaceSlot.value = null;
      gearSetDefinitionWorkspaceId.value = sourceSetId;
      options.onDefinitionChange();
      return;
    }

    const baseSet = gameDataRepository.getGearSet(sourceSetId);
    if (baseSet === null) {
      options.reportError(`找不到套装定义：${sourceSetId}`);
      return;
    }
    const templateId = allocateProjectTemplateId(projectDefinitionLibrary.value, 'gearSet');
    const displayName = `${options.names.gearSet(sourceSetId)}（自定义）`;
    const changed = projectSession.commit('deriveProjectGearSetTemplate', project => {
      let nextProject = replaceProjectGearTemplateDefinition(
        project,
        gearDefinition.slug,
        gearDefinition,
      );
      nextProject = deriveProjectGearSetTemplate(nextProject, {
        id: templateId,
        name: displayName,
        baseTemplateId: sourceSetId,
        definition: baseSet,
      });
      return replaceProjectGearTemplateDefinition(nextProject, gearDefinition.slug, {
        ...gearDefinition,
        gearSetSlug: templateId,
      });
    });
    if (!changed) return;
    gearDefinitionWorkspaceSlot.value = null;
    gearSetDefinitionWorkspaceId.value = templateId;
    options.onDefinitionChange();
  }

  function saveGearSetDefinition(definition: GearSetDefinition): void {
    projectSession.commit('saveProjectGearSetTemplate', project =>
      replaceProjectGearSetTemplateDefinition(project, definition.slug, definition),
    );
    options.onDefinitionChange();
  }

  function resetGearSetDefinition(): void {
    const id = gearSetDefinitionWorkspaceId.value;
    const base = selectedGearSetBaseDefinition.value;
    const template = id === null ? undefined : projectDefinitionLibrary.value.gearSets[id];
    if (id === null || base === null || template === undefined) return;
    projectSession.commit('resetProjectGearSetTemplate', project =>
      replaceProjectGearSetTemplateDefinition(project, id, {
        ...structuredClone(base),
        slug: id,
        displayName: template.name,
      }),
    );
    gearSetDefinitionWorkspaceId.value = null;
    options.onDefinitionChange();
  }
  return {
    showOperatorDefinitionWorkspace,
    showWeaponDefinitionWorkspace,
    gearDefinitionWorkspaceSlot,
    gearSetDefinitionWorkspaceId,
    selectedOperatorBaseDefinition,
    selectedOperatorCustomDefinition,
    selectedWeaponBaseDefinition,
    selectedWeaponCustomDefinition,
    selectedGearBaseDefinition,
    selectedGearCustomDefinition,
    selectedGearSetCustomDefinition,
    selectedGearSetBaseDefinition,
    openOperatorDefinitionWorkspace,
    saveOperatorDefinition,
    resetOperatorDefinition,
    openWeaponDefinitionWorkspace,
    saveWeaponDefinition,
    resetWeaponDefinition,
    openGearDefinitionWorkspace,
    saveGearDefinition,
    resetGearDefinition,
    openGearSetDefinitionWorkspace,
    saveGearSetDefinition,
    resetGearSetDefinition,
  };
}
