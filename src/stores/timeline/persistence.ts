// ─── Timeline persistence composable ────────────────────────────────────────
// Owns the durable-state boundary: localStorage autosave, project file
// import/export, client-side gzip share codes, and gathering / scattering the
// full scenario list. The serialization schema here (STORAGE_KEY, the snapshot
// object shape, serializeProjectData/deserializeProjectData) is load-bearing —
// existing saved timelines and share codes must keep round-tripping, so the
// logic is moved verbatim and only its store bindings are injected.

import { toRaw } from 'vue';
import type { Ref } from 'vue';
import { watchThrottled } from '@vueuse/core';
import { compressGzip, decompressGzip } from '@/utils/gzipUtils';
import { deserializeProjectData, serializeProjectData } from '@/utils/timeSerialization';
import { i18n } from '@/i18n';
import { createDefaultTracks } from './normalizers';
import type {
  Track,
  Connection,
  ScenarioListEntry,
  ScenarioData,
  ScenarioSnapshot,
  EnemyConfigState,
  CycleBoundary,
  SwitchEvent,
} from './types';

const tr = (key: string, params?: Record<string, unknown>) => i18n.global.t(key, params ?? {});

// ─── Dependencies ────────────────────────────────────────────────────────────

interface ArmoryStoreLike {
  clearAll: () => void;
}

interface PersistenceDeps {
  tracks: Ref<Track[]>;
  connections: Ref<Connection[]>;
  characterOverrides: Ref<Record<string, unknown>>;
  weaponOverrides: Ref<Record<string, unknown>>;
  equipmentCategoryOverrides: Ref<Record<string, unknown>>;
  systemConstants: Ref<EnemyConfigState>;
  scenarioList: Ref<ScenarioListEntry[]>;
  activeScenarioId: Ref<string>;
  activeEnemyId: Ref<string>;
  activeEnemyLevel: Ref<number>;
  customEnemyParams: Ref<EnemyConfigState>;
  cycleBoundaries: Ref<CycleBoundary[]>;
  switchEvents: Ref<SwitchEvent[]>;
  inheritedInitialEffects: Ref<Record<string, unknown>[]>;
  inheritedInitialEnemyState: Ref<Record<string, unknown> | null>;
  contingencyContractTags: Ref<number[]>;
  prepDuration: Ref<number>;
  prepExpanded: Ref<boolean>;
  battleDuration: Ref<number>;
  trackRowHeightWeights: Ref<number[]>;
  isLoading: Ref<boolean>;
  historyStack: Ref<string[]>;
  historyIndex: Ref<number>;
  operatorStore: ArmoryStoreLike & { operators: unknown };
  weaponStore: ArmoryStoreLike & { weapons: unknown };
  gearStore: ArmoryStoreLike & { gears: unknown };
  // Injected snapshot core + helpers (shared with the inline undo/redo system).
  _loadSnapshot: (data: ScenarioData | null | undefined) => void;
  restoreArmoryFromSnapshot: (snapshot: ScenarioSnapshot | null | undefined) => void;
  recomputeAllTrackOperatorStatuses: () => void;
  commitState: () => void;
  clearSelection: () => void;
  normalizeEnemyConfig: (
    base: Record<string, unknown> | null | undefined,
    patch?: Record<string, unknown>,
  ) => EnemyConfigState;
  normalizeEnemyLevel: (level: unknown) => number;
  createDefaultSystemConstantsState: () => EnemyConfigState;
  initializeOptimizerGameData: () => void;
  dropLegacyTimedStatusData: (snapshot: any) => any;
  normalizePrepConfig: (snapshot: any) => { snapshot: any; migrated: boolean };
}

// ─── Composable ──────────────────────────────────────────────────────────────

export function useTimelinePersistence(deps: PersistenceDeps) {
  const {
    tracks,
    connections,
    characterOverrides,
    weaponOverrides,
    equipmentCategoryOverrides,
    systemConstants,
    scenarioList,
    activeScenarioId,
    activeEnemyId,
    activeEnemyLevel,
    customEnemyParams,
    cycleBoundaries,
    switchEvents,
    inheritedInitialEffects,
    inheritedInitialEnemyState,
    contingencyContractTags,
    prepDuration,
    prepExpanded,
    battleDuration,
    trackRowHeightWeights,
    isLoading,
    historyStack,
    historyIndex,
    operatorStore,
    weaponStore,
    gearStore,
    _loadSnapshot,
    restoreArmoryFromSnapshot,
    recomputeAllTrackOperatorStatuses,
    commitState,
    clearSelection,
    normalizeEnemyConfig,
    normalizeEnemyLevel,
    createDefaultSystemConstantsState,
    initializeOptimizerGameData,
    dropLegacyTimedStatusData,
    normalizePrepConfig,
  } = deps;

  const STORAGE_KEY = 'endaxis_autosave';

  function initAutoSave() {
    watchThrottled(
      [
        tracks,
        connections,
        characterOverrides,
        weaponOverrides,
        equipmentCategoryOverrides,
        systemConstants,
        scenarioList,
        activeScenarioId,
        activeEnemyId,
        activeEnemyLevel,
        customEnemyParams,
        cycleBoundaries,
        switchEvents,
        inheritedInitialEffects,
        inheritedInitialEnemyState,
        contingencyContractTags,
        trackRowHeightWeights,
        () => operatorStore.operators,
        () => weaponStore.weapons,
        () => gearStore.gears,
      ],
      ([
        newTracks,
        newConns,
        newOverrides,
        newWeaponOverrides,
        newEquipmentCatOverrides,
        newSys,
        newScList,
        newActiveId,
        newEnemyId,
        newEnemyLevel,
        newCustomParams,
        newBoundaries,
        newSwEvents,
        newInheritedInitialEffects,
        newInheritedInitialEnemyState,
        newContingencyContractTags,
        newTrackRowHeightWeights,
        newOperators,
        newWeapons,
        newGears,
      ]) => {
        if (isLoading.value) return;

        const listToSave: any[] = JSON.parse(JSON.stringify(newScList));
        listToSave.forEach(sc => {
          if (sc?.data) dropLegacyTimedStatusData(sc.data);
        });
        const currentSc = listToSave.find(s => s.id === newActiveId);

        if (currentSc) {
          currentSc.data = {
            tracks: newTracks,
            connections: newConns,
            operators: toRaw(newOperators),
            weapons: toRaw(newWeapons),
            gears: toRaw(newGears),
            characterOverrides: newOverrides,
            weaponOverrides: newWeaponOverrides,
            equipmentCategoryOverrides: newEquipmentCatOverrides,
            prepDuration: prepDuration.value,
            prepExpanded: prepExpanded.value,
            battleDuration: battleDuration.value,
            trackRowHeightWeights: newTrackRowHeightWeights,
            systemConstants: newSys,
            activeEnemyId: newEnemyId,
            activeEnemyLevel: newEnemyLevel,
            customEnemyParams: newCustomParams,
            cycleBoundaries: newBoundaries,
            switchEvents: newSwEvents,
            inheritedInitialEffects: newInheritedInitialEffects,
            inheritedInitialEnemyState: newInheritedInitialEnemyState,
            contingencyContractTags: newContingencyContractTags,
          };
        }

        const snapshot = {
          version: '1.0.0',
          timestamp: Date.now(),
          scenarioList: listToSave,
          activeScenarioId: newActiveId,
          systemConstants: newSys,
          activeEnemyId: newEnemyId,
          activeEnemyLevel: newEnemyLevel,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeProjectData(snapshot)));
      },
      { deep: true, throttle: 500 },
    );
  }

  function loadFromBrowser() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const data = deserializeProjectData(JSON.parse(raw)) as {
          scenarioList?: any[];
          systemConstants?: Record<string, unknown>;
          activeEnemyLevel?: unknown;
          activeScenarioId?: string;
        };

        if (!data.scenarioList) return false;

        if (data.systemConstants) {
          systemConstants.value = normalizeEnemyConfig(systemConstants.value, data.systemConstants);
        }
        activeEnemyLevel.value = normalizeEnemyLevel(
          data.activeEnemyLevel ?? activeEnemyLevel.value,
        );

        scenarioList.value = data.scenarioList.map(sc => {
          const cloned = JSON.parse(JSON.stringify(sc));
          if (cloned?.data) {
            const normalized = normalizePrepConfig(cloned.data);
            cloned.data = dropLegacyTimedStatusData(normalized.snapshot);
          }
          return cloned;
        });
        activeScenarioId.value = data.activeScenarioId || scenarioList.value[0]!.id;

        const currentSc = scenarioList.value.find(s => s.id === activeScenarioId.value);
        if (currentSc && currentSc.data) {
          _loadSnapshot(currentSc.data);
        } else {
          restoreArmoryFromSnapshot(null);
          tracks.value = createDefaultTracks();
          connections.value = [];
          characterOverrides.value = {};
          weaponOverrides.value = {};
          equipmentCategoryOverrides.value = {};
          prepDuration.value = 5;
          prepExpanded.value = true;
          battleDuration.value = 120;
          trackRowHeightWeights.value = [];
          inheritedInitialEffects.value = [];
          inheritedInitialEnemyState.value = null;
          recomputeAllTrackOperatorStatuses();
        }

        historyStack.value = [];
        historyIndex.value = -1;
        commitState();
        return true;
      } catch (e) {
        console.error('Auto-save load failed:', e);
      }
    }
    return false;
  }

  function resetProject() {
    localStorage.removeItem(STORAGE_KEY);
    operatorStore.clearAll();
    weaponStore.clearAll();
    gearStore.clearAll();
    tracks.value = createDefaultTracks();
    connections.value = [];
    characterOverrides.value = {};
    weaponOverrides.value = {};
    equipmentCategoryOverrides.value = {};
    cycleBoundaries.value = [];
    switchEvents.value = [];
    inheritedInitialEffects.value = [];
    inheritedInitialEnemyState.value = null;
    prepDuration.value = 5;
    prepExpanded.value = true;
    battleDuration.value = 120;
    trackRowHeightWeights.value = [];

    systemConstants.value = createDefaultSystemConstantsState();

    activeEnemyId.value = 'custom';
    activeEnemyLevel.value = 90;
    // Reset scenarios to the default single-scenario state.
    scenarioList.value = [
      { id: 'default_sc', name: tr('timeline.scenario.defaultName', { index: 1 }), data: null },
    ];
    activeScenarioId.value = 'default_sc';

    recomputeAllTrackOperatorStatuses();
    clearSelection();
    historyStack.value = [];
    historyIndex.value = -1;
    commitState();
  }

  async function fetchGameData() {
    try {
      isLoading.value = true;
      initializeOptimizerGameData();
      historyStack.value = [];
      historyIndex.value = -1;
      recomputeAllTrackOperatorStatuses();
      commitState();
    } catch (error) {
      console.error('Load failed:', error);
    } finally {
      isLoading.value = false;
    }
  }

  function getProjectData({
    includeScenarios = null,
  }: { includeScenarios?: string | string[] | null } = {}) {
    let listToExport: any[] = JSON.parse(JSON.stringify(scenarioList.value));
    listToExport.forEach(sc => {
      if (sc?.data) dropLegacyTimedStatusData(sc.data);
    });

    if (includeScenarios) {
      const ids = Array.isArray(includeScenarios) ? includeScenarios : [includeScenarios];
      const allowedSet = new Set(ids);
      listToExport = listToExport.filter(s => allowedSet.has(s.id));
    }

    const currentSc = listToExport.find(s => s.id === activeScenarioId.value);
    if (currentSc) {
      currentSc.data = {
        tracks: tracks.value,
        connections: connections.value,
        operators: toRaw(operatorStore.operators),
        weapons: toRaw(weaponStore.weapons),
        gears: toRaw(gearStore.gears),
        characterOverrides: characterOverrides.value,
        weaponOverrides: weaponOverrides.value,
        equipmentCategoryOverrides: equipmentCategoryOverrides.value,
        prepDuration: prepDuration.value,
        prepExpanded: prepExpanded.value,
        battleDuration: battleDuration.value,
        trackRowHeightWeights: trackRowHeightWeights.value,
        systemConstants: systemConstants.value,
        activeEnemyId: activeEnemyId.value,
        activeEnemyLevel: activeEnemyLevel.value,
        customEnemyParams: customEnemyParams.value,
        cycleBoundaries: cycleBoundaries.value,
        switchEvents: switchEvents.value,
        inheritedInitialEffects: inheritedInitialEffects.value,
        inheritedInitialEnemyState: inheritedInitialEnemyState.value,
        contingencyContractTags: contingencyContractTags.value,
      };
    }

    return {
      timestamp: Date.now(),
      version: '1.0.0',
      scenarioList: listToExport,
      activeScenarioId: activeScenarioId.value,
      systemConstants: systemConstants.value,
      activeEnemyId: activeEnemyId.value,
      activeEnemyLevel: activeEnemyLevel.value,
    };
  }

  function exportProject({ filename }: { filename?: string } = {}) {
    const projectData = serializeProjectData(getProjectData());

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const baseName =
      filename && filename.trim()
        ? filename.trim()
        : `endaxis_project_${new Date().toISOString().slice(0, 10)}.json`;
    link.download = baseName.toLowerCase().endsWith('.json') ? baseName : `${baseName}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function exportShareString({
    includeScenarios = null,
  }: { includeScenarios?: string | string[] | null } = {}) {
    const projectData = serializeProjectData(getProjectData({ includeScenarios }));
    const jsonString = JSON.stringify(projectData);
    return await compressGzip(jsonString);
  }

  async function importShareString(compressedStr: string) {
    try {
      const jsonString = await decompressGzip(compressedStr);
      if (!jsonString) return false;

      const data = JSON.parse(jsonString);
      return loadProjectData(data);
    } catch (e) {
      console.error('Import share code failed:', e);
      return false;
    }
  }

  function loadProjectData(data: unknown) {
    try {
      const normalizedData = deserializeProjectData(data) as {
        systemConstants?: Record<string, unknown>;
        activeEnemyId?: string;
        activeEnemyLevel?: unknown;
        customEnemyParams?: Record<string, unknown>;
        scenarioList?: any[];
        activeScenarioId?: string;
      };

      if (normalizedData.systemConstants) {
        systemConstants.value = normalizeEnemyConfig(
          systemConstants.value,
          normalizedData.systemConstants,
        );
      }

      if (normalizedData.activeEnemyId) {
        activeEnemyId.value = normalizedData.activeEnemyId;
      }
      activeEnemyLevel.value = normalizeEnemyLevel(
        normalizedData.activeEnemyLevel ?? activeEnemyLevel.value,
      );

      if (normalizedData.customEnemyParams) {
        customEnemyParams.value = normalizeEnemyConfig(
          customEnemyParams.value,
          normalizedData.customEnemyParams,
        );
      }

      if (normalizedData.scenarioList) {
        // normalize & migrate legacy scenarios
        scenarioList.value = normalizedData.scenarioList.map(sc => {
          const cloned = JSON.parse(JSON.stringify(sc));
          if (cloned?.data) {
            const normalized = normalizePrepConfig(cloned.data);
            cloned.data = dropLegacyTimedStatusData(normalized.snapshot);
          }
          return cloned;
        });
        const validId = scenarioList.value.find(s => s.id === normalizedData.activeScenarioId)
          ? normalizedData.activeScenarioId!
          : scenarioList.value[0]!.id;
        activeScenarioId.value = validId;

        const currentSc = scenarioList.value.find(s => s.id === activeScenarioId.value);
        if (currentSc && currentSc.data) {
          _loadSnapshot(currentSc.data);
        } else {
          tracks.value = createDefaultTracks();
          connections.value = [];
          characterOverrides.value = {};
          weaponOverrides.value = {};
          cycleBoundaries.value = [];
          switchEvents.value = [];
          equipmentCategoryOverrides.value = {};
          prepDuration.value = 5;
          prepExpanded.value = true;
          battleDuration.value = 120;
        }
      }

      clearSelection();
      historyStack.value = [];
      historyIndex.value = -1;
      commitState();
      return true;
    } catch (err) {
      console.error('Load project data failed:', err);
      return false;
    }
  }

  async function importProject(file: Blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          const success = loadProjectData(data);
          if (success) resolve(true);
          else reject(new Error('Invalid data structure'));
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsText(file);
    });
  }

  return {
    STORAGE_KEY,
    initAutoSave,
    loadFromBrowser,
    resetProject,
    fetchGameData,
    getProjectData,
    exportProject,
    exportShareString,
    importShareString,
    loadProjectData,
    importProject,
  };
}
