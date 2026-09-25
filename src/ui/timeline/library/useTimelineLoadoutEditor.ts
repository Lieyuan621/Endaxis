/**
 * 协调时间轴页面中的干员、武器和装备选择与编辑。
 * 它只持有弹窗等临时 UI 状态，所有持久化修改都通过场景会话提交，定义筛选也集中在这里完成。
 */
import { computed, ref, type Ref } from 'vue';
import {
  createDefaultGearInstance,
  createDefaultOperatorInstance,
  createDefaultWeaponInstance,
} from '../../../application/editor/loadoutBuildFactory';
import type {
  ScenarioCommand,
  ScenarioEditingSession,
} from '../../../application/editor/scenarioEditorSession';
import type {
  GameDataBrowser,
  GameDataRepository,
} from '../../../core/game-data/gameDataRepository';
import type { ScenarioDocument, TrackIndex } from '../../../core/project/schema';
import {
  resolveOperatorPanel,
  type ResolvedOperatorPanel,
} from '../../../core/compiler/resolveOperatorPanel';
import { resolveScenarioBuilds } from '../../../core/compiler/resolveScenarioBuilds';
import {
  updateTrackGearInstance,
  updateTrackOperatorInstance,
  updateTrackWeaponInstance,
  type OperatorInstanceChanges,
  type WeaponInstanceChanges,
} from './loadoutBuildCommands';
import { projectTrackLoadoutBuilds } from './loadoutBuildViewModel';
import type { TimelineDocumentIdAllocator } from '../interaction/placeSkillGroup';
import {
  setTrackGear,
  setTrackOperator,
  setTrackWeapon,
  type TrackGearSlot,
} from '../interaction/timelineDocumentCommands';

type TimelineGameData = GameDataRepository & GameDataBrowser;

export interface TimelineLoadoutEditorOptions {
  readonly scenario: Readonly<Ref<ScenarioDocument>>;
  readonly session: ScenarioEditingSession;
  readonly selectedTrack: Ref<TrackIndex>;
  readonly clearTimelineSelection: () => void;
  readonly gameData: TimelineGameData;
  /** 项目级自定义定义变更时，使仅依赖场景文档的投影重新计算。 */
  readonly definitionRevision?: Readonly<Ref<number>>;
  /** 创建轨道等持久化身份时的稳定 ID 分配器。 */
  readonly ids: TimelineDocumentIdAllocator;
}

export function useTimelineLoadoutEditor(options: TimelineLoadoutEditorOptions) {
  const operatorDialogTrack = ref<TrackIndex | null>(null);
  const weaponDialogTrack = ref<TrackIndex | null>(null);
  const gearDialogTarget = ref<{ trackIndex: TrackIndex; slot: TrackGearSlot } | null>(null);
  const showOperatorBuildDialog = ref(false);
  const showWeaponBuildDialog = ref(false);
  const showGearBuildDialog = ref(false);
  const panelDialogTrack = ref<TrackIndex | null>(null);

  function commit(commandName: string, command: ScenarioCommand): void {
    options.session.commit(commandName, command);
  }

  const loadoutModels = computed(() => {
    void options.definitionRevision?.value;
    return options.scenario.value.tracks.map((_, trackIndex) =>
      projectTrackLoadoutBuilds(options.scenario.value, trackIndex as TrackIndex, options.gameData),
    );
  });
  const selectedLoadoutModel = computed(() => loadoutModels.value[options.selectedTrack.value]!);
  const selectedWeaponSlug = computed(() => {
    const track = options.scenario.value.tracks[options.selectedTrack.value];
    return track?.weapon?.weaponSlug ?? null;
  });
  const selectableWeapons = computed(() => {
    const operatorSlug = selectedLoadoutModel.value.operator?.definition.slug ?? null;
    const operator = operatorSlug === null ? null : options.gameData.getOperator(operatorSlug);
    if (operator === null) return [];
    return options.gameData
      .getWeapons()
      .filter(weapon => weapon.weaponType === operator.weaponType);
  });
  const selectedGearSlug = computed(() => {
    const target = gearDialogTarget.value;
    if (target === null) return null;
    return options.scenario.value.tracks[target.trackIndex]?.gears[target.slot]?.gearSlug ?? null;
  });
  const selectableGears = computed(() => {
    const target = gearDialogTarget.value;
    if (target === null) return [];
    const slotType =
      target.slot === 'armor' || target.slot === 'gloves' ? target.slot : 'accessory';
    return options.gameData.getGears().filter(gear => gear.slotType === slotType);
  });
  const selectedGearBuild = computed(() => {
    const target = gearDialogTarget.value;
    return target === null
      ? null
      : (loadoutModels.value[target.trackIndex]?.gears[target.slot] ?? null);
  });
  const panelResolution = computed<{
    readonly panels: ReadonlyMap<TrackIndex, ResolvedOperatorPanel>;
    readonly error: string | null;
  }>(() => {
    void options.definitionRevision?.value;
    try {
      return {
        panels: new Map(
          resolveScenarioBuilds(options.scenario.value, options.gameData).map(build => [
            build.trackIndex,
            resolveOperatorPanel(build),
          ]),
        ),
        error: null,
      };
    } catch (error) {
      return {
        panels: new Map(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });
  const selectedPanel = computed(() => {
    const trackIndex = panelDialogTrack.value;
    return trackIndex === null ? null : (panelResolution.value.panels.get(trackIndex) ?? null);
  });

  function openOperatorDialog(trackIndex = options.selectedTrack.value): void {
    options.selectedTrack.value = trackIndex;
    options.clearTimelineSelection();
    operatorDialogTrack.value = trackIndex;
  }

  function selectTrack(trackIndex: TrackIndex): void {
    options.clearTimelineSelection();
    options.selectedTrack.value = trackIndex;
  }

  function selectOperator(slug: string): void {
    const trackIndex = operatorDialogTrack.value;
    if (trackIndex === null) return;
    const operator = options.gameData.getOperator(slug);
    if (operator === null) throw new Error(`missing operator definition '${slug}'`);
    commit('setTrackOperator', current =>
      setTrackOperator(
        current,
        trackIndex,
        createDefaultOperatorInstance(operator),
        options.ids.allocate('track'),
      ),
    );
    operatorDialogTrack.value = null;
  }

  function clearOperator(): void {
    const trackIndex = operatorDialogTrack.value;
    if (trackIndex === null) return;
    commit('clearTrackOperator', current =>
      setTrackOperator(current, trackIndex, null, options.ids.allocate('track')),
    );
    operatorDialogTrack.value = null;
  }

  function openWeaponDialog(trackIndex = options.selectedTrack.value): void {
    if (options.scenario.value.tracks[trackIndex]?.operator == null) return;
    options.selectedTrack.value = trackIndex;
    options.clearTimelineSelection();
    weaponDialogTrack.value = trackIndex;
  }

  function openPanelDialog(trackIndex = options.selectedTrack.value): void {
    if (!panelResolution.value.panels.has(trackIndex)) return;
    options.selectedTrack.value = trackIndex;
    options.clearTimelineSelection();
    panelDialogTrack.value = trackIndex;
  }

  function selectWeapon(slug: string): void {
    const trackIndex = weaponDialogTrack.value;
    if (trackIndex === null) return;
    const weapon = options.gameData.getWeapon(slug);
    if (weapon === null) throw new Error(`missing weapon definition '${slug}'`);
    commit('setTrackWeapon', current =>
      setTrackWeapon(current, trackIndex, createDefaultWeaponInstance(weapon)),
    );
    weaponDialogTrack.value = null;
  }

  function clearWeapon(): void {
    const trackIndex = weaponDialogTrack.value;
    if (trackIndex === null) return;
    commit('clearTrackWeapon', current => setTrackWeapon(current, trackIndex, null));
    weaponDialogTrack.value = null;
  }

  function openGearDialog(
    trackIndex = options.selectedTrack.value,
    slot: TrackGearSlot = 'armor',
  ): void {
    if (options.scenario.value.tracks[trackIndex]?.operator == null) return;
    options.selectedTrack.value = trackIndex;
    options.clearTimelineSelection();
    gearDialogTarget.value = { trackIndex, slot };
  }

  function selectGear(slug: string, artificingTier: number): void {
    const target = gearDialogTarget.value;
    if (target === null) return;
    const gear = options.gameData.getGear(slug);
    if (gear === null) throw new Error(`missing gear definition '${slug}'`);
    commit('setTrackGear', current =>
      setTrackGear(
        current,
        target.trackIndex,
        target.slot,
        createDefaultGearInstance(gear, artificingTier),
      ),
    );
  }

  function clearGear(): void {
    const target = gearDialogTarget.value;
    if (target === null) return;
    commit('clearTrackGear', current =>
      setTrackGear(current, target.trackIndex, target.slot, null),
    );
  }

  function changeGearRefineTier(artificingTier: number): void {
    const target = gearDialogTarget.value;
    const build = selectedGearBuild.value;
    if (target === null || build === null) return;
    commit('changeGearRefineTier', current =>
      updateTrackGearInstance(
        current,
        target.trackIndex,
        target.slot,
        build.definition.traits.map(() => artificingTier),
      ),
    );
  }

  function updateWeaponBuild(changes: WeaponInstanceChanges): void {
    commit('updateTrackWeaponInstance', current =>
      updateTrackWeaponInstance(current, options.selectedTrack.value, changes),
    );
  }

  function updateOperatorBuild(changes: OperatorInstanceChanges): void {
    commit('updateTrackOperatorInstance', current => {
      const index = options.selectedTrack.value;
      const instance = current.tracks[index]?.operator;
      if (instance == null) return current;
      return updateTrackOperatorInstance(
        current,
        index,
        changes,
        options.gameData.getOperator(instance.operatorSlug) ?? undefined,
      );
    });
  }

  function updateGearBuild(slot: TrackGearSlot, artificingLevels: readonly number[]): void {
    commit('updateTrackGearInstance', current =>
      updateTrackGearInstance(current, options.selectedTrack.value, slot, artificingLevels),
    );
  }

  return {
    operatorDialogTrack,
    weaponDialogTrack,
    gearDialogTarget,
    showOperatorBuildDialog,
    showWeaponBuildDialog,
    showGearBuildDialog,
    panelDialogTrack,
    loadoutModels,
    selectedLoadoutModel,
    selectedWeaponSlug,
    selectableWeapons,
    selectedGearSlug,
    selectableGears,
    selectedGearBuild,
    panelResolution,
    selectedPanel,
    openOperatorDialog,
    selectTrack,
    selectOperator,
    clearOperator,
    openWeaponDialog,
    openPanelDialog,
    selectWeapon,
    clearWeapon,
    openGearDialog,
    selectGear,
    clearGear,
    changeGearRefineTier,
    updateWeaponBuild,
    updateOperatorBuild,
    updateGearBuild,
  };
}
