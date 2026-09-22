<script setup lang="ts">
import { projectDodgeMarkerDiagnostics } from '../../core/projection/dodgeMarkerDiagnostics';
import { projectDodgeMarkerEffects } from '../../core/projection/dodgeMarkerEffects';
import {
  computed,
  defineAsyncComponent,
  h,
  nextTick,
  onMounted,
  onScopeDispose,
  provide,
  ref,
  shallowRef,
  watch,
  toRaw,
  type Component,
} from 'vue';
import { durationBarColorKey } from './results/durationBarColorContext';
import TimelineAsyncDialogLoading from './components/TimelineAsyncDialogLoading.vue';
import {
  provideInteractionSession,
  useInteractionBarrier,
} from '../interaction/interactionSessionContext';
import type { InteractionLease } from '../interaction/interactionSession';
import { observeNativeDragLifetime } from '../interaction/nativeDragLifecycle';
import { useAsyncModalBoundary } from '../interaction/useAsyncModalBoundary';
import { isInsideTimelineDropRegion } from './interaction/timelineDropRegion';
import {
  createTimelineScrollSync,
  createTimelineVerticalScrollSync,
} from './interaction/timelineScrollSync';
import { normalizeDurationBarColorPrefs } from './results/durationBarColor';
import { useI18n } from 'vue-i18n';
import { ElLoading, ElMessage, ElMessageBox } from 'element-plus';
import { ScenarioEditConstraintError } from '../../application/editor/scenarioEditConstraints';
import { createInheritedScenario } from '../../application/editor/scenarioInheritance';
import { getSkillCastPlacementAnchor } from '../../core/project/skillCastPlacement';
import { EaButton, EaNumberInput, EaSelect, type EaSelectValue } from '@/design-system';
import { useAppearance } from '../appearance/useAppearance';
import { formatTimeWithFrames } from './timeFormatting';
import { ELEMENT_COLORS } from '../gameColors';
import { ALL_GAME_TEXT_FAMILIES, setLocale } from '../../i18n';
import {
  getEnemyGameName,
  getConsumableGameDescription,
  getConsumableGameName,
  getGearPieceGameName,
  getGearSetGameName,
  getOperatorCombatSkillName,
  getOperatorFormName,
  getOperatorGameName,
  getOperatorPotentialName,
  getOperatorTalentName,
  getWeaponGameName,
  getWeaponSkillName,
} from '../gameText';
import SkillLibraryCard from './library/SkillLibraryCard.vue';
import {
  createLibraryDragGhost,
  suppressNativeLibraryDragImage,
  attachLibraryDragGhostHint,
  LIBRARY_PLACE_CANCEL_HINT_DELAY_MS,
  positionLibraryDragGhost,
  getDefaultLibraryDragOffsets,
  removeLibraryDragGhost,
} from '../interaction/libraryDragGhost';
import TimelineActionBlock from './interaction/TimelineActionBlock.vue';
import TimelineSkillCastGroupMarker from './interaction/TimelineSkillCastGroupMarker.vue';
import TimelineActionContextMenu from './interaction/TimelineActionContextMenu.vue';
import TimelineActionInspector from './interaction/TimelineActionInspector.vue';
import TimelineLibrarySkillInspector from './library/TimelineLibrarySkillInspector.vue';
import TimelineExternalEventInspector from './interaction/TimelineExternalEventInspector.vue';
import TimelineCornerToolbar from './components/TimelineCornerToolbar.vue';
import TimelineConnectionLayer from './interaction/TimelineConnectionLayer.vue';
import TimelineConnectionContextMenu from './interaction/TimelineConnectionContextMenu.vue';
import TimelineCursorGuide, {
  type TimelineCursorGaugeRow,
} from './components/TimelineCursorGuide.vue';
import TimelineHeaderToolbar from './components/TimelineHeaderToolbar.vue';
import type { TimelineShareTrack } from './components/TimelineShareCard.vue';
import TimelineRuler from './components/TimelineRuler.vue';
import TimelineTrackHeader from './components/TimelineTrackHeader.vue';
import OperatorAvatar from '../components/OperatorAvatar.vue';
import TimelineWorkbenchShell from './components/TimelineWorkbenchShell.vue';
import TimelineResourceCurves from './results/TimelineResourceCurves.vue';
import TimelineSimulationErrorNotice from './results/TimelineSimulationErrorNotice.vue';
import TimelineTrackGauge from './results/TimelineTrackGauge.vue';
import TimelineTimeDilationBands from './results/TimelineTimeDilationBands.vue';
import TimelineEnemyEffects from './results/TimelineEnemyEffects.vue';
import TimelineEnemyStatusSections from './results/TimelineEnemyStatusSections.vue';
import TimelineBuffBands from './results/TimelineBuffBands.vue';
import type { BuffDetailTarget } from './results/buffDetail';
import TimelineOperatorPassiveUiBands from './results/TimelineOperatorPassiveUiBands.vue';
import {
  projectTimelineTrackEffectLayout,
  resizeTimelineTrackPair,
  resolveCompactTrackHeights,
  TIMELINE_TRACK_BASE_HEIGHT,
  TIMELINE_TRACK_MIN_HEIGHT,
} from './results/timelineTrackEffectLayout';
import TimelineComboWindowBands from './results/TimelineComboWindowBands.vue';
import SimulationPerformanceAudit from './results/SimulationPerformanceAudit.vue';
import EnemySettingsPanel from './components/EnemySettingsPanel.vue';
import GlobalResourcePanel from './components/GlobalResourcePanel.vue';
import ContingencyContractPanel from './components/ContingencyContractPanel.vue';
import { CONTINGENCY_CONTRACT_MECHANIC_PREFIX } from '../../data/mechanics/contingencyContractAdapter';
import { contingencyContractMechanicId } from '../../data/mechanics/contingencyContractCatalog';
import {
  formatContingencyContractBuffSourceName,
  localizedContingencyContractTagName,
  resolveContingencyContractBuffPresentation,
} from './contingencyContractBuffPresentation';
import {
  ActiveScenarioEditorSession,
  ProjectEditorSession,
} from '../../application/editor/projectEditorSession';
import { AdaptiveTimelineSimulationService } from '../../application/simulation/adaptiveTimelineSimulationService';
import { createEditorSimulationService } from '../../application/simulation/editorSimulationService';
import { WorkerScenarioSimulationService } from '../../application/simulation/workerScenarioSimulationService';
import { useProjectDefinitionWorkspaces } from './definitions/useProjectDefinitionWorkspaces';
import { useScenarioSimulation } from './useScenarioSimulation';
import { formatSkillBlockWarnings } from './skillBlockWarnings';
import { projectCombatHudSnapshot } from '../../core/projection/combatHudSnapshot';
import { projectActiveGearSetLabels } from './library/activeGearSetHint';
import { passedTimelineDragThreshold } from './interaction/timelineDragThreshold';
import { projectTimelineEdgeAutoScrollDelta } from './interaction/timelineEdgeAutoScroll';
import { resolveTimelineMarkerPointerFrame } from './interaction/timelineMarkerMoveGeometry';
import { resolveOperatorPanelContributionSourceLabel } from './library/operatorPanelContributionPresentation';
import type { OperatorPanelContributionReceipt } from '../../core/compiler/resolveOperatorPanel';
import { projectEnemyEffectViz } from '../../core/projection/enemyEffectViz';
import { elementalAttachments } from '../../data/buffs/elementalAttachments';

import { SINGLE_ENEMY_TARGET_ID } from '../../core/projection/enemyHealthChangePoints';
import {
  projectPoiseBrokenSegments,
  projectPoiseKnotSegments,
} from '../../core/projection/poiseCurves';
import { projectComboWindowTimelineViz } from '../../core/projection/comboWindowTimelineViz';
import { projectSkillCooldownTimelineViz } from '../../core/projection/skillCooldownTimelineViz';
import { projectTimelineComboCooldowns } from '../../core/projection/timelineComboCooldowns';
import { projectSkillEnhancementTimelineViz } from '../../core/projection/skillEnhancementTimelineViz';
import { resolveControlTimeline } from '../../core/project/resolveControlTimeline';
import {
  getSkillCastPlacementChains,
  resolveSkillCastStartFrames,
} from '../../core/project/skillCastPlacement';
import {
  layoutBuffTimelineSegments,
  mergeOverlappingBuffTimelineSegments,
  projectBuffTimelineViz,
  type BuffTimelineSegment,
  type PositionedDisplayBuffTimelineSegment,
} from '../../core/projection/buffTimelineViz';
import {
  layoutOperatorPassiveUiTimelineSegments,
  projectOperatorPassiveUiTimelineViz,
  type OperatorPassiveUiTimelineSegment,
  type PositionedOperatorPassiveUiTimelineSegment,
} from '../../core/projection/operatorPassiveUiTimelineViz';
import type { OperatorUltimateEnergyCurve } from '../../core/projection/resourceCurves';
import {
  PROJECT_FPS,
  type EndaxisProjectDocument,
  type ExternalCombatEventDocument,
  type ProjectDefinitionLibraryDocument,
  type ScenarioDocument,
  type TrackIndex,
} from '../../core/project/schema';
import { getProjectDefinitionLibrary } from '../../core/project/projectDefinitionLibrary';
import { createEmptyProject } from '../../core/project/createProject';
import {
  inspectProjectInput,
  parseProjectDocument,
  serializeProjectDocument,
} from '../../core/project/serialization';
import { openProject } from '../../application/openProject';
import { selectProjectExportScope, useProjectFileSession } from './projectFileSession';
import type { ExportScenarioScope } from './components/TimelineExportDialog.vue';
import {
  captureTimelineLongImage,
  compressProjectCode,
  decompressProjectCode,
  downloadBlob,
  imageFilename,
} from './timelineExport';
import { embedProjectCodeInPng } from './pngProjectData';
import { projectOpenFailureMessage } from './projectOpenFailureMessage';
import { formatLegacyConversionReport } from './legacyConversionReport';
import type { ProjectGameDataRepository } from '../../data/projectGameDataRepository';
import { captureScenarioSimulationGameData } from '../../application/simulation/scenarioSimulationGameData';
import { diffSkillDefinition } from '../../core/game-data/diffSkillDefinition';
import { resolveSkillTemplateDefinition } from '../../core/compiler/resolveSkillDefinition';
import type {
  OperatorDefinition,
  SkillDefinition,
  SkillType,
} from '../../core/game-data/operatorDefinition';
import type {
  GearDefinition,
  GearSetDefinition,
  WeaponDefinition,
} from '../../core/game-data/equipmentDefinition';
import {
  getIconAssetPath,
  getOperatorAvatarPath,
  getOperatorSkillIconPath,
  getWeaponActionIconPath,
} from '../gameAssetPaths';
import { groupPlacedSkillSequence, placeLibrarySkillGroup } from './interaction/placeSkillGroup';
import { resolveOperatorPresentationFormKey } from './library/operatorFormPresentation';
import { SkillPlacementTransaction } from './interaction/skillPlacementTransaction';
import {
  resolveCompactSkillSelection,
  compactSkillSelectionByWidths,
} from './library/compactSkillSelection';
import {
  layoutSkillGroupPlacement,
  resolveSkillGroupPlacementSkills,
  skillPlacementDisplayFrames,
} from '../../application/editor/skillGroupPlacement';
import { createProjectDocumentIdAllocator } from './projectDocumentIdAllocator';
import {
  projectTimelineEditor,
  type TimelineSkillLibraryEntryViewModel,
} from './timelineEditorViewModel';
import {
  frameToTimelinePx,
  resolveTimelineCursorGuidePosition,
  timelinePxToFrame,
  timelineTotalWidth,
} from './timelineGeometry';
import {
  projectCastTimeDilationSegments,
  projectSkillCastActualDurationFrames,
  projectSkillCastActualStartFrames,
  projectSkillCastInterruptionFrames,
  projectTimelineTimeDilationBands,
} from '../../core/projection/timelineDisplayTime';
import { useTimelineLoadoutEditor } from './library/useTimelineLoadoutEditor';
import { timelineVisibleSkillEnds } from './timelineVisibleSkillEnds';
import {
  matchingPublishedSkillCastIds,
  projectCompatibleHitFrames,
  projectMovingSkillCastStartFrames,
  projectSkillCastInputFacts,
  resolveSkillCastGroupSelection,
} from './interaction/skillCastGroupInteraction';
import { useTimelineEnemyEditor } from './useTimelineEnemyEditor';
import {
  createEmptyTimelineActionSelection,
  deleteSelectedTimelineActions,
  reconcileTimelineActionSelection,
  selectTimelineAction,
  type TimelineActionSelection,
} from './interaction/timelineActionSelection';
import {
  clearTimelineEditorSelection,
  createTimelineEditorSelection,
  selectTimelineActionsIdentity,
  selectTimelineMarkerIdentity,
  selectTimelineTrackIdentity,
  type TimelineMarkerKind,
} from './interaction/timelineEditorSelection';
import {
  copyTimelineActions,
  copyTimelineDodgeMarker,
  pasteTimelineActions,
  type TimelineActionClipboard,
} from './interaction/timelineClipboard';
import {
  createSkillCastGroup,
  dissolveSkillCastGroups,
  moveSkillCasts,
  moveSkillCast,
  swapTimelineTracks,
  setSkillCastLocked,
  setSkillCastDisabled,
  setSkillCastColor,
  setSkillCastRandomSeed,
  setSkillCastForcedCritical,
  setSkillCastCustomDefinition,
  resetSkillCastToTemplate,
  updateBattleResourceRule,
  setBattleDurationFrames,
  setBattlePrepFrames,
  setTimelinePrepExpanded,
  setGlobalOperatorStatModifiers,
  setGlobalConfig,
  type EditableBattleResourceRule,
  updateTrackInitialUltimateEnergy,
  applyInitialUltimateEnergyPreset,
  resolveInitialUltimateEnergyPresetMode,
  setUnifiedInitialUltimateEnergy,
  type TrackGearSlot,
  addCycleBoundary,
  moveCycleBoundary,
  removeCycleBoundary,
  addControlSwitch,
  moveControlSwitch,
  setControlSwitchTrack,
  removeControlSwitch,
  addDodgeMarker,
  moveDodgeMarker,
  removeDodgeMarker,
  updateDodgeMarker,
  addExternalEventMarker,
  moveExternalEventMarker,
  removeExternalEventMarker,
  setSimulationRangeBoundary,
  clearSimulationRangeBoundary,
} from './interaction/timelineDocumentCommands';
import {
  isKeyboardShortcutIsolationTarget,
  useKeyboardShortcutScope,
  useKeyboardInputRegion,
} from '../keyboard/keyboardShortcutRouter';
import {
  skillLibrarySegmentLabel,
  skillLibraryNameEntry,
  timelineSkillBlockLabel,
  timelineSkillBlockLabelForKey,
  timelineSkillSegmentLabel,
  type TimelineSkillSegmentLabels,
} from './timelineSkillLabels';
import {
  MAX_PROJECT_SCENARIOS,
  allocateScenarioId,
  resetProjectScenarios,
  type TimelineResetMode,
  addProjectScenario,
  deleteActiveScenario,
  duplicateActiveScenario,
  renameActiveScenario,
  switchProjectScenario,
} from './scenarioProjectCommands';
import { useTimelineMarqueeGesture } from './interaction/useTimelineMarqueeGesture';
import { useTimelineViewportPan } from './interaction/useTimelineViewportPan';
import { handleTimelineEditorShortcut } from './interaction/timelineKeyboardShortcuts';
import {
  COARSE_TIMELINE_SNAP_FRAMES,
  PRECISE_TIMELINE_SNAP_FRAMES,
  snapTimelineFrame,
} from './interaction/timelineSnap';
import { findAdjacentOccupiedTrack } from './interaction/timelineTrackSelection';
import { useTimelineCastMove } from './interaction/useTimelineCastMove';
import { resolveTimelineLibraryDropFrame } from './interaction/timelineLibraryDropGeometry';
import {
  resolveTimelineCastAlignmentFrame,
  resolveTimelineCastAlignmentSpan,
  type TimelineCastAlignmentMode,
} from './interaction/timelineCastAlignment';
import { useTimelineZoom } from './interaction/useTimelineZoom';
import type { TimelineOperationMarkerInput } from './timelineOperationMarkers';
import { projectRossiComboSuccessCastIds } from '../operators/rossi/comboSuccessEvidence';
import {
  canCreateSkillCastConnection,
  createSkillCastConnection,
  retargetSkillCastConnection,
  removeTimelineConnection,
  updateTimelineConnection,
  type TimelineConnectionPort,
  type UpdateTimelineConnectionInput,
} from './interaction/timelineConnections';
import {
  shouldDisplayTimelineHitMarker,
  type TimelineHitMarkerView,
} from './results/timelineHitProjection';
import {
  projectHitEffectsByCast,
  projectTimelineHitReceipts,
  projectTimelineHitOccurrences,
  type TimelineHitEffectLabel,
} from './results/timelineHitEffects';
import { projectPublishedHitDetail } from './results/publishedHitDetail';
import { layoutEnemyDamageHits } from './results/enemyDamageHitLayout';
import { useSimulationReceiptSelection } from './results/useSimulationReceiptSelection';
import {
  collectOperatorBuffDisplayNameKeys,
  type BuffDisplayName,
  resolveBuffDisplayName,
} from './results/buffDisplayName';
import type { CombatReceiptEntry } from '../../core/combat/receipt/combatReceipt';
import BattleLogPanel from './results/BattleLogPanel.vue';
import { usePublishedSimulationDisplay } from './results/usePublishedSimulationDisplay';
import {
  resolvePublishedBuffSource,
  capturePublishedEquipmentSources,
  resolvePublishedEquipmentTrait,
} from './results/publishedBuffSource';
import { createCombatObjectIconResolver } from './results/combatObjectIcons';
import { isEnemyTimelineBuffVisible } from './results/enemyStatusRows';
import {
  isPhysicalStatusRowBuff,
  projectPhysicalStatusDisplay,
} from './results/physicalStatusDisplay';

import TimelineMarkerContextMenu from './interaction/TimelineMarkerContextMenu.vue';
import ConsumableSelectionDialog from './components/ConsumableSelectionDialog.vue';
import { projectPublishedTimelineDamageAnalysis } from './results/timelineDamageAnalysis';
import {
  TIMELINE_VIEW_LAYER_IDS,
  normalizeTimelineViewLayers,
  toggleTimelineViewLayerState,
  type TimelineViewLayerId,
} from './results/timelineViewLayers';
import {
  normalizeTimelineOperatorEffectsVisibility,
  toggleTimelineOperatorEffectsVisibility,
} from './results/timelineOperatorEffectsVisibility';
import {
  ABILITY_ENTITY_SAMPLE_CAST_ID,
  ABILITY_ENTITY_SAMPLE_TRACK_INDEX,
} from './timelineSampleScenario';

// 定义编辑器只在用户明确打开时加载。它们会引入完整的行为编辑组件树，常驻在
// 时间轴首页既浪费内存，也会让 Vite 在首次打开页面时转换大量不会使用的源码。
function defineLazyDialog<T extends Component>(load: () => Promise<{ default: T }>) {
  return defineAsyncComponent<T>({
    loader: load,
    loadingComponent: TimelineAsyncDialogLoading,
    delay: 150,
  });
}

const loadGearDefinitionWorkspaceDialog = () =>
  import('./definitions/equipment/GearDefinitionWorkspaceDialog.vue');
const loadGearSetDefinitionWorkspaceDialog = () =>
  import('./definitions/equipment/GearSetDefinitionWorkspaceDialog.vue');
const loadOperatorDefinitionWorkspaceDialog = () =>
  import('./definitions/operators/OperatorDefinitionWorkspaceDialog.vue');
const loadWeaponDefinitionWorkspaceDialog = () =>
  import('./definitions/equipment/WeaponDefinitionWorkspaceDialog.vue');
const GearDefinitionWorkspaceDialog = defineLazyDialog(loadGearDefinitionWorkspaceDialog);
const GearSetDefinitionWorkspaceDialog = defineLazyDialog(loadGearSetDefinitionWorkspaceDialog);
const OperatorDefinitionWorkspaceDialog = defineLazyDialog(loadOperatorDefinitionWorkspaceDialog);
const WeaponDefinitionWorkspaceDialog = defineLazyDialog(loadWeaponDefinitionWorkspaceDialog);
const SkillDefinitionEditorDialog = defineLazyDialog(
  () => import('./definitions/skills/SkillDefinitionEditorDialog.vue'),
);
const GearSelectionDialog = defineLazyDialog(() => import('./library/GearSelectionDialog.vue'));
const GearLoadoutBuildDialog = defineLazyDialog(
  () => import('./library/GearLoadoutBuildDialog.vue'),
);
const OperatorPanelDialog = defineLazyDialog(() => import('./library/OperatorPanelDialog.vue'));
const OperatorBuildDialog = defineLazyDialog(() => import('./library/OperatorBuildDialog.vue'));
const WeaponBuildDialog = defineLazyDialog(() => import('./library/WeaponBuildDialog.vue'));
const OperatorSelectionDialog = defineLazyDialog(
  () => import('./library/OperatorSelectionDialog.vue'),
);
const WeaponSelectionDialog = defineLazyDialog(() => import('./library/WeaponSelectionDialog.vue'));
const TimelineResetDialog = defineLazyDialog(() => import('./components/TimelineResetDialog.vue'));
const TimelineReceiveDialog = defineLazyDialog(
  () => import('./components/TimelineReceiveDialog.vue'),
);
// 标记详情包含来源图，只在选中标记时加载，避免布局库进入时间轴启动包。
const TimelineDocumentMarkerInspector = defineAsyncComponent(
  () => import('./interaction/TimelineDocumentMarkerInspector.vue'),
);
const TimelineHitDetailDialog = defineLazyDialog(
  () => import('./results/TimelineHitDetailDialog.vue'),
);
const TimelineBuffDetailDialog = defineLazyDialog(
  () => import('./results/TimelineBuffDetailDialog.vue'),
);
const TimelineOperatorPassiveUiDetailDialog = defineLazyDialog(
  () => import('./results/TimelineOperatorPassiveUiDetailDialog.vue'),
);
const TimelineExportDialog = defineLazyDialog(
  () => import('./components/TimelineExportDialog.vue'),
);
const TimelineSmallImageExportDialog = defineLazyDialog(
  () => import('./components/TimelineSmallImageExportDialog.vue'),
);
const DamageAnalysisDialog = defineLazyDialog(() => import('./results/DamageAnalysisDialog.vue'));
const TimelineShortcutHelpDialog = defineLazyDialog(
  () => import('./interaction/TimelineShortcutHelpDialog.vue'),
);

const { t, te, locale } = useI18n({ useScope: 'global' });
const { appearance, setAppearance } = useAppearance();
const TIMELINE_TRACK_HEADER_WIDTH = 180;
const TIMELINE_RULER_HEIGHT = 60;
const TIMELINE_SCROLLBAR_SIZE = 12;
const TIMELINE_COMPACT_TRACKS_VERTICAL_PADDING = 20;
const INTERACTIVE_SIMULATION_BUDGET_MS = 1000 / 60;
const {
  timelineZoomPercent,
  pxPerFrame,
  setTimelineZoomPercent,
  updateTimelineZoomPercent,
  handleTimelineWheel,
} = useTimelineZoom({
  viewport: () => timelineScroll.value,
  prepFrames: () => scenario.value.battle.prepFrames,
  prepEndFrame: () => scenario.value.inheritance?.frame ?? 0,
  prepExpanded: () => scenario.value.editor.prepExpanded,
  trackHeaderWidth: TIMELINE_TRACK_HEADER_WIDTH,
  verticalPanEnabled: () => buffLayoutMode.value !== 'compact',
});
const CURSOR_GUIDE_STORAGE_KEY = 'endaxis:timeline-cursor-guide:v1';
const showCursorGuide = ref(window.localStorage.getItem(CURSOR_GUIDE_STORAGE_KEY) === 'true');
watch(showCursorGuide, visible =>
  window.localStorage.setItem(CURSOR_GUIDE_STORAGE_KEY, String(visible)),
);
const boxSelectEnabled = ref(false);
const connectionToolEnabled = ref(false);
const leftPanelCollapsed = ref(false);
const KEYCAP_MODE_STORAGE_KEY = 'endaxis:timeline-keycap-mode:v1';
const savedKeycapMode = window.localStorage.getItem(KEYCAP_MODE_STORAGE_KEY);
const keycapMode = ref<'keyboard' | 'gamepad'>(
  savedKeycapMode === 'gamepad' || savedKeycapMode === 'xbox' ? 'gamepad' : 'keyboard',
);
watch(keycapMode, mode => window.localStorage.setItem(KEYCAP_MODE_STORAGE_KEY, mode));
const BUFF_LAYOUT_STORAGE_KEY = 'endaxis:timeline-buff-layout:v1';
const TRACK_HEIGHTS_STORAGE_KEY = 'endaxis:timeline-compact-track-heights:v1';
const buffLayoutMode = ref<'compact' | 'loose'>(
  window.localStorage.getItem(BUFF_LAYOUT_STORAGE_KEY) === 'loose' ? 'loose' : 'compact',
);
watch(buffLayoutMode, mode => {
  window.localStorage.setItem(BUFF_LAYOUT_STORAGE_KEY, mode);
  if (mode !== 'compact') return;
  void nextTick(() => {
    if (timelineScroll.value !== null) timelineScroll.value.scrollTop = 0;
    timelineScrollTop.value = 0;
  });
});
const DURATION_COLOR_STORAGE_KEY = 'endaxis:timeline-duration-bar-color:v1';
const durationBarColor = ref(
  normalizeDurationBarColorPrefs(
    (() => {
      try {
        return JSON.parse(window.localStorage.getItem(DURATION_COLOR_STORAGE_KEY) ?? 'null');
      } catch {
        return undefined;
      }
    })(),
  ),
);
provide(durationBarColorKey, durationBarColor);
watch(
  durationBarColor,
  value => {
    try {
      window.localStorage.setItem(DURATION_COLOR_STORAGE_KEY, JSON.stringify(value));
    } catch {
      /* Display settings remain usable when browser storage is unavailable. */
    }
  },
  { deep: true },
);
function loadCompactTrackHeights(): readonly number[] {
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(TRACK_HEIGHTS_STORAGE_KEY) ?? '[]',
    );
    if (!Array.isArray(parsed) || parsed.length !== 4) throw new Error('invalid track heights');
    return parsed.map(value =>
      typeof value === 'number' && Number.isFinite(value)
        ? Math.max(TIMELINE_TRACK_MIN_HEIGHT, Math.round(value))
        : TIMELINE_TRACK_BASE_HEIGHT,
    );
  } catch {
    return Array.from({ length: 4 }, () => TIMELINE_TRACK_BASE_HEIGHT);
  }
}
const compactTrackHeights = ref(loadCompactTrackHeights());
watch(compactTrackHeights, heights =>
  window.localStorage.setItem(TRACK_HEIGHTS_STORAGE_KEY, JSON.stringify(heights)),
);
const VIEW_LAYERS_STORAGE_KEY = 'endaxis:timeline-view-layers:v1';
function loadTimelineViewLayers() {
  try {
    const raw = window.localStorage.getItem(VIEW_LAYERS_STORAGE_KEY);
    return normalizeTimelineViewLayers(raw === null ? null : JSON.parse(raw));
  } catch {
    return normalizeTimelineViewLayers(null);
  }
}
const timelineViewLayers = ref(loadTimelineViewLayers());
watch(
  timelineViewLayers,
  layers => window.localStorage.setItem(VIEW_LAYERS_STORAGE_KEY, JSON.stringify(layers)),
  { deep: true },
);
function toggleTimelineViewLayer(layerId: TimelineViewLayerId): void {
  timelineViewLayers.value = toggleTimelineViewLayerState(timelineViewLayers.value, layerId);
}
const OPERATOR_EFFECTS_STORAGE_KEY = 'endaxis:timeline-operator-effects:v1';
function loadTimelineOperatorEffectsVisibility() {
  try {
    const raw = window.localStorage.getItem(OPERATOR_EFFECTS_STORAGE_KEY);
    return normalizeTimelineOperatorEffectsVisibility(raw === null ? null : JSON.parse(raw));
  } catch {
    return normalizeTimelineOperatorEffectsVisibility(null);
  }
}
const operatorEffectsVisibility = ref(loadTimelineOperatorEffectsVisibility());
watch(operatorEffectsVisibility, visibility =>
  window.localStorage.setItem(OPERATOR_EFFECTS_STORAGE_KEY, JSON.stringify(visibility)),
);
function isOperatorEffectsVisible(trackIndex: TrackIndex): boolean {
  return operatorEffectsVisibility.value[trackIndex] !== false;
}
function toggleOperatorEffectsVisibility(trackIndex: number): void {
  if (!Number.isInteger(trackIndex) || trackIndex < 0 || trackIndex > 3) return;
  operatorEffectsVisibility.value = toggleTimelineOperatorEffectsVisibility(
    operatorEffectsVisibility.value,
    trackIndex as TrackIndex,
  );
}
async function selectTimelineLocale(next: 'zh-CN' | 'en'): Promise<void> {
  if (locale.value === next) return;
  await setLocale(next, ALL_GAME_TEXT_FAMILIES);
}
const timelineSelection = shallowRef(
  createTimelineEditorSelection(ABILITY_ENTITY_SAMPLE_TRACK_INDEX, {
    selectedIds: new Set([ABILITY_ENTITY_SAMPLE_CAST_ID]),
    primaryId: ABILITY_ENTITY_SAMPLE_CAST_ID,
  }),
);
const selectedTrack = computed<TrackIndex>({
  get: () => timelineSelection.value.activeTrackIndex,
  set: trackIndex => {
    timelineSelection.value = selectTimelineTrackIdentity(timelineSelection.value, trackIndex);
  },
});
const actionSelection = computed(() => timelineSelection.value.actions);
const selectedCastId = computed(() => actionSelection.value.primaryId);
const showSkillDefinitionEditor = ref(false);
const showDamageAnalysis = ref(false);
const showExportDialog = ref(false);
const showReceiveDialog = ref(false);
const receivingProjectCode = ref(false);
const showSmallImageExport = ref(false);
const smallImageExportInitial = ref({ filename: '', duration: 60 });
const showShortcutHelp = ref(false);
const buffDetailTarget = ref<BuffDetailTarget | null>(null);
const passiveUiDetailSegment = ref<PositionedOperatorPassiveUiTimelineSegment | null>(null);
const passiveUiDetailTitle = ref('');
const projectDefinitionLibrary = shallowRef<ProjectDefinitionLibraryDocument>({
  operators: {},
  weapons: {},
  gears: {},
  gearSets: {},
});
const operatorDefinitionRevision = ref(0);
const hoveredCastId = ref<string | null>(null);
const timelineClipboard = shallowRef<TimelineActionClipboard | null>(null);
const projectFileInput = ref<HTMLInputElement | null>(null);
const cursorFrame = ref(30);
const cursorGuide = ref<{ leftPx: number; sampleFrame: number } | null>(null);
const timelinePointerClientX = ref<number | null>(null);
const snapFrames = ref<number>(PRECISE_TIMELINE_SNAP_FRAMES);
const timelineSurface = ref<HTMLElement | null>(null);
const timelineScroll = ref<HTMLElement | null>(null);
const timelineHorizontalScrollbar = ref<HTMLElement | null>(null);
const timelineVerticalScrollbar = ref<HTMLElement | null>(null);
const timelineScrollLeft = ref(0);
const timelineScrollTop = ref(0);
const timelineViewportWidth = ref(1200);
const timelineViewportHeight = ref(0);
const displayedCompactTrackHeights = computed(() =>
  resolveCompactTrackHeights(
    compactTrackHeights.value,
    timelineViewportHeight.value -
      TIMELINE_RULER_HEIGHT -
      TIMELINE_SCROLLBAR_SIZE -
      TIMELINE_COMPACT_TRACKS_VERTICAL_PADDING * 2,
  ),
);
const timelineVerticalScrollbarWidth = ref(0);
const timelineVerticalScrollRange = ref(0);
const timelineVerticalScrollbarHeight = computed(() =>
  Math.max(0, timelineViewportHeight.value - TIMELINE_RULER_HEIGHT - TIMELINE_SCROLLBAR_SIZE),
);
let timelineResizeObserver: ResizeObserver | null = null;
const connectionDrag = ref<{
  /** 面板按钮启动的连线等待下一次点击目标，因此没有固定 pointerId。 */
  pointerId: number | null;
  lease: InteractionLease;
  skillCastId: string;
  existingConnectionId?: string;
  port: TimelineConnectionPort;
  pointer: { x: number; y: number };
} | null>(null);
const selectedConnectionId = ref<string | null>(null);
const connectionContextTarget = ref<{ id: string; x: number; y: number } | null>(null);
const contextConnection = computed(() =>
  scenario.value.connections.find(
    connection => connection.id === connectionContextTarget.value?.id,
  ),
);
type TimelineDragPayload =
  | {
      kind: 'librarySkill';
      entryKey: string;
      skillGroupKey: string;
      variantKey?: string;
      skillKey?: string;
      dragOffsetX: number;
    }
  | { kind: 'trackOrder'; trackIndex: TrackIndex };

const dragPayload = ref<TimelineDragPayload | null>(null);
const trackOrderDropTarget = ref<TrackIndex | null>(null);
interface TimelineLibraryPlacement {
  readonly entryKey: string;
  readonly skillGroupKey: string;
  readonly skillType: SkillType;
  readonly variantKey?: string;
  readonly skillKey?: string;
}
const libraryPlacement = ref<TimelineLibraryPlacement | null>(null);
const selectedConsumableUseId = ref<string | null>(null);
const consumableDialogTarget = ref<{ trackIndex: TrackIndex; frame: number } | null>(null);
const consumableMoveGesture = shallowRef<{
  pointerId: number;
  trackIndex: TrackIndex;
  useId: string;
  initialPointerX: number;
  initialPointerY: number;
  initialFrame: number;
  previewFrame: number;
  dragStarted: boolean;
} | null>(null);
const workbenchInputRegion = useKeyboardInputRegion({
  label: 'timeline-workbench',
  parent: null,
  active: () => true,
});
const interactionSession = provideInteractionSession(workbenchInputRegion);
const serviceModalBoundary = useAsyncModalBoundary(interactionSession, workbenchInputRegion);
let libraryDragLease: InteractionLease | null = null;
let disposeLibraryDragLifetime: (() => void) | null = null;
const trackDropRegions = new Map<TrackIndex, HTMLElement>();
function registerTrackDropRegion(trackIndex: TrackIndex, element: unknown): void {
  if (element instanceof HTMLElement) trackDropRegions.set(trackIndex, element);
  else trackDropRegions.delete(trackIndex);
}
let libraryPlacementLease: InteractionLease | null = null;
let trackOrderLease: InteractionLease | null = null;
const selectedLibrarySkill = ref<{ entryKey: string; skillKey?: string } | null>(null);
let lastPlacementPointer: { x: number; y: number } | null = null;
const alignmentGuide = ref<{
  readonly targetCastId: string;
  readonly left: number;
  readonly top: number;
  readonly height: number;
  readonly mode: TimelineCastAlignmentMode;
  readonly label: string;
  readonly color: string;
} | null>(null);
const contextMenuTarget = ref<{
  x: number;
  y: number;
  trackIndex: TrackIndex;
  skillCastId: string;
} | null>(null);
const selectedMarker = computed<{ kind: TimelineMarkerKind; id: string } | null>({
  get: () => {
    const primary = timelineSelection.value.primary;
    return primary.kind === 'marker' ? { kind: primary.markerKind, id: primary.id } : null;
  },
  set: marker => {
    timelineSelection.value =
      marker === null
        ? clearTimelineEditorSelection(timelineSelection.value)
        : selectTimelineMarkerIdentity(timelineSelection.value, marker.kind, marker.id);
  },
});
const markerContextTarget = ref<{
  x: number;
  y: number;
  frame: number;
  trackIndex: TrackIndex;
  existing?:
    | { kind: TimelineMarkerKind; id: string; label: string }
    | { kind: 'consumableUse'; id: string; label: string };
} | null>(null);
const markerMoveGesture = shallowRef<{
  pointerId: number;
  initialPointerX: number;
  initialPointerY: number;
  latestPointerX: number;
  latestPointerY: number;
  dragStarted: boolean;
  kind: TimelineMarkerKind;
  id: string;
  initialFrame: number;
  previewFrame: number;
  /** 闪避拖动期间的原轴；预览可模拟，松手后才提交一次编辑记录。 */
  baseScenario: ScenarioDocument;
} | null>(null);
let stopMarkerMove: (() => void) | null = null;
let markerMoveAutoScrollFrame: number | null = null;

/** 初始方案只在挂载时读取；编辑会话不回写调用方传入的对象。 */
const props = defineProps<{
  initialScenario?: ScenarioDocument;
  initialProject?: unknown;
  gameDataRepository: ProjectGameDataRepository;
  browserPersistenceEnabled?: boolean;
  browserRestoreError?: string;
  browserRestoreRaw?: string;
}>();
const gameDataRepository = props.gameDataRepository;
const consumables = gameDataRepository.getConsumables();
const suppliedProject =
  props.initialProject === undefined
    ? undefined
    : parseProjectDocument(props.initialProject, { gameDataRepository });
if (suppliedProject !== undefined && !suppliedProject.ok)
  throw new Error('临时预览轴未通过项目校验');
const initialProject = suppliedProject?.ok
  ? structuredClone(suppliedProject.value)
  : createEmptyProject({
      projectId: 'sample',
      scenarioName: t('timeline.scenario.defaultName', { index: 1 }),
      createdWith: 'endaxis',
    });
if (props.initialScenario !== undefined) {
  const initialScenario = structuredClone(toRaw(props.initialScenario));
  initialProject.activeScenarioId = initialScenario.id;
  initialProject.scenarios = [initialScenario];
}
const projectSession = new ProjectEditorSession(initialProject);
projectDefinitionLibrary.value = getProjectDefinitionLibrary(initialProject);
const scenarioSession = new ActiveScenarioEditorSession(projectSession);
const projectRevision = ref(0);
const projectScenarios = computed(() => {
  projectRevision.value;
  return projectSession.snapshot.project.scenarios;
});
const activeProjectScenarioId = computed(() => {
  projectRevision.value;
  return projectSession.snapshot.project.activeScenarioId;
});
const configurationReadOnly = computed(() => scenario.value.inheritance !== undefined);
const damageAnalysis = computed(() =>
  projectPublishedTimelineDamageAnalysis(
    publishedSimulation.value,
    publishedOperatorName,
    damageElementLabel,
    slug => {
      const element = slug === null ? undefined : publishedOperators.value.get(slug)?.element;
      return element === 'physical' ? '#c9c9c9' : (ELEMENT_COLORS[element ?? ''] ?? '#888888');
    },
    damageType =>
      damageType === 'physical' ? '#c9c9c9' : (ELEMENT_COLORS[damageType] ?? '#888888'),
  ),
);
const publishedRandomMode = computed(
  () => publishedSimulation.value?.scenario.battle.random?.mode ?? 'expected',
);
const publishedGlobalRandomSeed = computed(
  () => publishedSimulation.value?.scenario.battle.random?.globalSeed ?? 0,
);
const ids = createProjectDocumentIdAllocator(() => projectSession.snapshot.project);
const { browserSaveError, projectFileReader, exportProjectFile } = useProjectFileSession(
  projectSession,
  {
    persistToBrowser: props.browserPersistenceEnabled === true,
  },
);
watch(browserSaveError, error => {
  if (error !== null) ElMessage.error(`浏览器自动保存失败：${error}`);
});
onMounted(() => {
  if (props.browserRestoreError !== undefined) {
    const raw = props.browserRestoreRaw;
    if (raw === undefined) {
      void ElMessageBox.alert(
        `浏览器项目恢复失败：${props.browserRestoreError}。未能读取原始存档，请检查浏览器存储；当前页面可以继续编辑。`,
        '项目恢复失败',
      );
      return;
    }
    void ElMessageBox.confirm(
      `浏览器项目恢复失败：${props.browserRestoreError}。当前已打开空项目，继续编辑会自动保存并覆盖浏览器中的旧存档。建议先下载原始存档。`,
      '项目恢复失败',
      {
        confirmButtonText: '下载原始存档',
        cancelButtonText: '继续编辑',
        showClose: false,
        closeOnClickModal: false,
        closeOnPressEscape: false,
        beforeClose: (action, _instance, done) => {
          if (action === 'confirm') {
            downloadBlob(
              new Blob([raw], { type: 'application/json' }),
              `Endaxis_Browser_Recovery_${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
            );
          }
          done();
        },
      },
    ).catch(() => {});
  }
});
const scenario = shallowRef(scenarioSession.snapshot.scenario);
/** 折叠准备区只保留展开入口；此时不能把新的时间轴输入写进不可见历史。 */
const minimumEditableInputFrame = computed(() =>
  scenario.value.inheritance?.frame !== undefined
    ? scenario.value.inheritance.frame
    : scenario.value.editor.prepExpanded
      ? -scenario.value.battle.prepFrames
      : 0,
);
const timelinePrepPreviewFrames = ref<number | null>(null);
const displayedTimelinePrepFrames = computed(
  () => timelinePrepPreviewFrames.value ?? scenario.value.battle.prepFrames,
);
let stopTimelinePrepResize: (() => void) | null = null;
const canUndo = ref(scenarioSession.canUndo);
const canRedo = ref(scenarioSession.canRedo);
const unsubscribeScenarioSession = scenarioSession.subscribe(snapshot => {
  // 复制方案可以保留内部ID；切换、撤销和重做都按方案身份清理，不能靠技能ID变化碰巧清空。
  if (snapshot.scenario.id !== scenario.value.id) resetTransientScenarioUi();
  scenario.value = snapshot.scenario;
  canUndo.value = scenarioSession.canUndo;
  canRedo.value = scenarioSession.canRedo;
  if (timelineSelection.value.primary.kind === 'actions') {
    applyActionSelection(
      reconcileTimelineActionSelection(actionSelection.value, snapshot.scenario),
    );
  }
});
const unsubscribeProjectSession = projectSession.subscribe(snapshot => {
  projectRevision.value = snapshot.revision;
  const library = getProjectDefinitionLibrary(snapshot.project);
  if (library === projectDefinitionLibrary.value) return;
  projectDefinitionLibrary.value = library;
  operatorDefinitionRevision.value += 1;
});
onScopeDispose(() => {
  unsubscribeScenarioSession();
  unsubscribeProjectSession();
  scenarioSession.dispose();
  finishCompactTrackResize();
  cancelConnectionDrag();
  cancelCastMove();
  stopMarkerMove?.();
  finishSkillDrag();
});

function commitScenario(
  commandName: string,
  command: (current: ScenarioDocument) => ScenarioDocument,
): boolean {
  try {
    return scenarioSession.commit(commandName, command);
  } catch (error) {
    if (!(error instanceof ScenarioEditConstraintError)) throw error;
    ElMessage.warning(t('timelineGrid.action.locked'));
    return false;
  }
}

function requestOpenProject(): void {
  projectFileInput.value?.click();
}

function requestReceiveProject(): void {
  showReceiveDialog.value = true;
}

async function receiveProjectCode(code: string): Promise<void> {
  if (receivingProjectCode.value) return;
  receivingProjectCode.value = true;
  try {
    const content = await decompressProjectCode(code);
    if (await openProjectContent(content)) showReceiveDialog.value = false;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('timeline.share.importFailed'));
  } finally {
    receivingProjectCode.value = false;
  }
}

async function handleProjectFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (file === undefined) return;
  try {
    const content =
      /\.png$/i.test(file.name) || file.type === 'image/png'
        ? await projectFileReader.readPng(file)
        : await projectFileReader.read(file);
    if (content !== null) await openProjectContent(content);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '打开项目失败');
  }
}

async function openProjectContent(content: string): Promise<boolean> {
  let legacy = false;
  const legacyTimingMode = ref<'repair' | 'preserve'>('preserve');
  try {
    let parsedInput: unknown = content;
    try {
      parsedInput = JSON.parse(content) as unknown;
    } catch {
      // 当前格式的统一打开入口会给出具体的 JSON 错误。
    }
    legacy = inspectProjectInput(parsedInput).kind === 'legacy';
    if (legacy) {
      try {
        await serviceModalBoundary.run(() =>
          ElMessageBox.confirm(
            () =>
              h('div', [
                h('p', '检测到旧版本轴。请选择技能时间的处理方式，原文件不会修改。'),
                h(EaSelect, {
                  modelValue: legacyTimingMode.value,
                  'aria-label': '旧轴时间处理方式',
                  options: [
                    { label: '智能修复时间', value: 'repair' },
                    { label: '保留原时间', value: 'preserve' },
                  ],
                  'onUpdate:modelValue': value => {
                    if (value === 'repair' || value === 'preserve') legacyTimingMode.value = value;
                  },
                }),
                h(
                  'p',
                  legacyTimingMode.value === 'repair'
                    ? '按新版技能时长和接续规则顺延技能，可能改变增益覆盖。'
                    : '保留旧轴技能位置，仅换算帧率。重叠和不可接续会在轴上显示告警。',
                ),
                h('p', '两种方式都会判断技能形态，并按需要补主控切换。'),
              ]),
            '转换旧版本轴',
            {
              confirmButtonText: '确定并转换',
              cancelButtonText: '取消',
              type: 'warning',
            },
          ),
        );
      } catch {
        return false;
      }
    }
    await ensureAllGameData();
    let projectInput: unknown = parsedInput;
    let convertedLegacyProject = false;
    let legacyConversionReport: Parameters<typeof formatLegacyConversionReport>[0] | null = null;
    if (legacy) {
      const loading = ElLoading.service({
        lock: true,
        text: '正在转换旧版本轴…',
        background: 'rgba(0, 0, 0, 0.9)',
      });
      try {
        const [{ convertLegacyTimeline }, { default: legacyMappings }] = await Promise.all([
          import('../../application/legacyTimeline/convert'),
          import('../../application/legacyTimeline/mappings.json'),
        ]);
        const conversion = convertLegacyTimeline(
          parsedInput,
          gameDataRepository,
          legacyMappings as Parameters<typeof convertLegacyTimeline>[2],
          { timingMode: legacyTimingMode.value },
        );
        legacyConversionReport = conversion.report;
        if (conversion.project === null) {
          await showLegacyConversionReport(conversion.report, true);
          return false;
        }
        projectInput = conversion.project;
        convertedLegacyProject = true;
      } finally {
        loading.close();
      }
    }
    const result = openProject(projectInput, {
      gameDataRepository: gameDataRepository,
    });
    if (!result.ok) {
      ElMessage.error(projectOpenFailureMessage(result));
      return false;
    }
    await acceptOpenedProject(result.project, convertedLegacyProject);
    if (
      legacyConversionReport !== null &&
      (legacyConversionReport.issues.length > 0 || legacyConversionReport.fatalIssues.length > 0)
    ) {
      await showLegacyConversionReport(legacyConversionReport, false);
    }
    return true;
  } catch (error) {
    if (legacy) {
      await showLegacyConversionReport(
        {
          issues: [],
          fatalIssues: [
            { path: '', message: error instanceof Error ? error.message : '旧版本轴转换失败' },
          ],
          unresolvedSkills: [],
          identityChanges: [],
          sequenceExpansions: [],
          resourceAdjustments: [],
          timingAdjustments: [],
          skillFormAdjustments: [],
          controlSwitchAdjustments: [],
          inferredControlSwitches: [],
        },
        true,
      );
    } else {
      ElMessage.error(error instanceof Error ? error.message : '打开项目失败');
    }
    return false;
  }
}

async function showLegacyConversionReport(
  report: Parameters<typeof formatLegacyConversionReport>[0],
  blocked: boolean,
): Promise<void> {
  const message = formatLegacyConversionReport(report);
  try {
    await serviceModalBoundary.run(() =>
      ElMessageBox.alert(
        h(
          'div',
          {
            style: {
              maxHeight: '55vh',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            },
          },
          message,
        ),
        blocked ? '旧版本轴转换失败' : '旧版本轴转换报告',
        {
          confirmButtonText: '知道了',
          type: blocked ? 'error' : 'warning',
        },
      ),
    );
  } catch {
    // 关闭报告只结束查看，不改变已经完成的转换结果。
  }
}

async function acceptOpenedProject(
  project: EndaxisProjectDocument,
  convertedLegacyProject = false,
): Promise<void> {
  showSkillDefinitionEditor.value = false;
  showOperatorDefinitionWorkspace.value = false;
  showWeaponDefinitionWorkspace.value = false;
  gearDefinitionWorkspaceSlot.value = null;
  gearSetDefinitionWorkspaceId.value = null;
  resetSimulationPublication();
  projectSession.replaceProject(project);
  selectedTrack.value = 0;
  clearTimelineSelection();
  timelineClipboard.value = null;
  simulationService.clearCache();
  await nextTick();
  void simulateNow();
  ElMessage.success(
    convertedLegacyProject
      ? '旧版本轴已自动转换并打开，请导出为新版项目。原文件未修改。'
      : `已打开项目：${scenarioSession.snapshot.scenario.name}`,
  );
}

function exportProject(options: { filename: string; scope: ExportScenarioScope }): void {
  try {
    exportProjectFile(options.filename, options.scope);
    ElMessage.success(t('timeline.export.exportJson'));
  } catch (error) {
    ElMessage.error(
      t('timeline.export.failed', {
        msg: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}

async function copyProjectCode(options: { scope: ExportScenarioScope }): Promise<void> {
  try {
    await navigator.clipboard.writeText(await createProjectShareCode(options.scope));
    ElMessage.success(t('timeline.share.copied'));
  } catch (error) {
    ElMessage.error(
      t('timeline.share.copyFailed', {
        msg: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}

async function createProjectShareCode(scope: ExportScenarioScope): Promise<string> {
  const json = serializeProjectDocument(
    selectProjectExportScope(projectSession.snapshot.project, scope),
  );
  return compressProjectCode(json);
}

function createCurrentScenarioShareCode(): Promise<string> {
  return createProjectShareCode('current');
}

function openSmallImageExport(options: { filename: string; duration: number }): void {
  smallImageExportInitial.value = options;
  showExportDialog.value = false;
  showSmallImageExport.value = true;
}

async function exportTimelineLongImage(options: {
  filename: string;
  duration: number;
}): Promise<void> {
  showExportDialog.value = false;
  const loading = ElLoading.service({
    lock: true,
    text: t('timeline.export.rendering', { seconds: options.duration }),
    background: 'rgba(0, 0, 0, 0.9)',
  });
  try {
    await nextTick();
    const timelineMain = document.querySelector<HTMLElement>('.timeline-main');
    if (timelineMain === null) throw new Error('timeline workspace missing');
    const prepWidth = timelineFramePx(scenario.value.inheritance?.frame ?? 0);
    const filename = imageFilename(options.filename);
    const blob = await captureTimelineLongImage(timelineMain, {
      durationSeconds: options.duration,
      pxPerFrame: pxPerFrame.value,
      prepWidth,
      trackHeaderWidth: TIMELINE_TRACK_HEADER_WIDTH,
    });
    const exportImage = await embedProjectCodeInPng(blob, await createCurrentScenarioShareCode());
    downloadBlob(exportImage, filename);
    ElMessage.success(t('timeline.export.imageExported', { filename }));
  } catch (error) {
    ElMessage.error(
      t('timeline.export.failed', {
        msg: error instanceof Error ? error.message : String(error),
      }),
    );
  } finally {
    loading.close();
  }
}

/** 项目模板库与版本化数据的联合查询端口；实例只保存模板 ID 和养成/配装状态。 */
const editorGameDataRepository = {
  ...gameDataRepository,
  getOperator: (slug: string) =>
    projectDefinitionLibrary.value.operators[slug]?.definition ??
    gameDataRepository.getOperator(slug),
  getOperators: () => [
    ...gameDataRepository.getOperators(),
    ...Object.values(projectDefinitionLibrary.value.operators).map(value => value.definition),
  ],
  getWeapon: (slug: string) =>
    projectDefinitionLibrary.value.weapons[slug]?.definition ?? gameDataRepository.getWeapon(slug),
  getWeapons: () => [
    ...gameDataRepository.getWeapons(),
    ...Object.values(projectDefinitionLibrary.value.weapons).map(value => value.definition),
  ],
  getGear: (slug: string) =>
    projectDefinitionLibrary.value.gears[slug]?.definition ?? gameDataRepository.getGear(slug),
  getGears: () => [
    ...gameDataRepository.getGears(),
    ...Object.values(projectDefinitionLibrary.value.gears).map(value => value.definition),
  ],
  getGearSet: (slug: string) =>
    projectDefinitionLibrary.value.gearSets[slug]?.definition ??
    gameDataRepository.getGearSet(slug),
  getGearSets: () => [
    ...gameDataRepository.getGearSets(),
    ...Object.values(projectDefinitionLibrary.value.gearSets).map(value => value.definition),
  ],
};

const operatorBuffDisplayNameKeys = computed(() => {
  operatorDefinitionRevision.value;
  const names = new Map<string, BuffDisplayName>(
    collectOperatorBuffDisplayNameKeys(editorGameDataRepository.getOperators()),
  );
  for (const buff of scenario.value.globalConfig.customBuffs ?? [])
    names.set(buff.id, { text: buff.name });
  return names;
});

const {
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
  openOperatorDialog: openOperatorDialogNow,
  selectTrack,
  selectOperator,
  clearOperator,
  openWeaponDialog: openWeaponDialogNow,
  openPanelDialog,
  selectWeapon,
  clearWeapon,
  openGearDialog: openGearDialogNow,
  selectGear,
  clearGear,
  changeGearRefineTier,
  updateWeaponBuild,
  updateOperatorBuild,
  updateGearBuild,
} = useTimelineLoadoutEditor({
  scenario,
  session: scenarioSession,
  selectedTrack,
  clearTimelineSelection,
  gameData: editorGameDataRepository,
  definitionRevision: operatorDefinitionRevision,
  ids,
});

let fullGameDataRevisionApplied = false;
async function ensureAllGameData(): Promise<void> {
  await gameDataRepository.ensureAllDefinitions();
  if (fullGameDataRevisionApplied) return;
  fullGameDataRevisionApplied = true;
  operatorDefinitionRevision.value += 1;
}

let gameDataDialogOpening = false;
async function openAfterGameDataLoad(open: () => void): Promise<void> {
  if (gameDataDialogOpening) return;
  if (fullGameDataRevisionApplied) {
    open();
    return;
  }
  gameDataDialogOpening = true;
  const loading = ElLoading.service({ lock: true, text: t('timeline.loading') });
  try {
    await ensureAllGameData();
    open();
    await nextTick();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : String(error));
  } finally {
    loading.close();
    gameDataDialogOpening = false;
  }
}

async function openOperatorDialog(trackIndex?: TrackIndex): Promise<void> {
  await openAfterGameDataLoad(() => openOperatorDialogNow(trackIndex));
}

async function openWeaponDialog(trackIndex?: TrackIndex): Promise<void> {
  await openAfterGameDataLoad(() => openWeaponDialogNow(trackIndex));
}

async function openGearDialog(trackIndex?: TrackIndex, slot?: TrackGearSlot): Promise<void> {
  await openAfterGameDataLoad(() => openGearDialogNow(trackIndex, slot));
}
const {
  enemies,
  selectedDefinition: selectedEnemyDefinition,
  selectDefinitionEnemy,
  selectCustomEnemy,
  saveEnemyValues,
} = useTimelineEnemyEditor({
  scenario,
  session: scenarioSession,
  gameData: editorGameDataRepository,
  fps: PROJECT_FPS,
});
const viewModel = computed(() => {
  void operatorDefinitionRevision.value;
  return projectTimelineEditor(scenario.value, editorGameDataRepository);
});
const exportShareTracks = computed<readonly TimelineShareTrack[]>(() =>
  viewModel.value.tracks
    .filter(track => track.operatorInstanceId !== null)
    .map(track => ({
      id: track.operatorInstanceId!,
      name: operatorName(track.operatorSlug),
      avatar:
        track.operatorAssetSlug === null ? null : getOperatorAvatarPath(track.operatorAssetSlug),
      actions: track.skillCasts.map(cast => ({
        id: cast.id,
        label: timelineCastLabel(cast, track),
        skillType: cast.skillType,
        startFrame: cast.startFrame,
        durationFrames: cast.durationFrames,
        disabled: cast.disabled,
        color: cast.color,
        icon:
          track.operatorAssetSlug === null || cast.skillType === null
            ? null
            : getOperatorSkillIconPath(track.operatorAssetSlug, cast.skillType),
      })),
    })),
);
const initialUltimateEnergyPresetMode = computed(() =>
  resolveInitialUltimateEnergyPresetMode(scenario.value),
);
const initialUltimateEnergyDisplayValue = computed(() => {
  const mode = initialUltimateEnergyPresetMode.value;
  if (mode === 'empty') return t('timelineGrid.toolbar.initialGaugeEmptyShort');
  if (mode === 'full') return t('timelineGrid.toolbar.initialGaugeFullShort');
  const values = scenario.value.tracks.flatMap(track =>
    track === null ? [] : [track.initialState.ultimateEnergy],
  );
  return values.length > 0 && values.every(value => value === values[0])
    ? String(values[0])
    : t('timelineGrid.toolbar.initialGaugeCustomShort');
});
const maximumUltimateEnergyByTrack = computed(() =>
  viewModel.value.tracks.map(track => track.maxUltimateEnergy),
);
const selectedTrackModel = computed(() => viewModel.value.tracks[selectedTrack.value]!);
const selectedConsumableUse = computed(() => {
  const id = selectedConsumableUseId.value;
  if (id === null) return null;
  for (let trackIndex = 0; trackIndex < scenario.value.tracks.length; trackIndex += 1) {
    const track = scenario.value.tracks[trackIndex];
    const use = track?.consumableUses?.find(candidate => candidate.id === id);
    if (use !== undefined) return { trackIndex: trackIndex as TrackIndex, use };
  }
  return null;
});
const selectedLibraryEntry = computed(() => {
  const selection = selectedLibrarySkill.value;
  if (selection === null) return null;
  return (
    selectedTrackModel.value.skillLibrary.find(entry => entry.entryKey === selection.entryKey) ??
    null
  );
});
const placementLibraryEntry = computed(() => {
  const placement = libraryPlacement.value;
  if (placement === null) return null;
  return (
    selectedTrackModel.value.skillLibrary.find(entry => entry.entryKey === placement.entryKey) ??
    null
  );
});
function librarySkillPreview(entry: TimelineSkillLibraryEntryViewModel, skillKey?: string) {
  const placedSkillKey = skillKey ?? entry.placementSkillKey;
  const segment = entry.skills.find(skill => skill.skillKey === placedSkillKey);
  return {
    name:
      placedSkillKey === undefined
        ? skillLibraryTypeLabel(entry)
        : (timelineSkillSegmentLabel(entry, placedSkillKey, skillSegmentLabels()) ??
          skillLibraryTypeLabel(entry)),
    duration:
      segment === undefined
        ? skillDurationSeconds(entry)
        : skillPlacementDisplayFrames(segment.timelineBlockFrames) / PROJECT_FPS,
    color: skillAccentColor(entry.skillType, selectedTrackModel.value.operatorSlug),
    scale: pxPerFrame.value * PROJECT_FPS,
  };
}

watch(
  () => {
    const entry = placementLibraryEntry.value;
    const placement = libraryPlacement.value;
    if (entry === null || placement === null) return null;
    return librarySkillPreview(entry, placement.skillKey);
  },
  (preview, _previous, onCleanup) => {
    if (preview === null) return;
    createLibraryDragGhost(preview, preview.scale, () => preview.color);
    if (lastPlacementPointer !== null)
      positionLibraryDragGhost(lastPlacementPointer.x, lastPlacementPointer.y);
    const timer = window.setTimeout(
      () => attachLibraryDragGhostHint(t('timeline.shortcut.placeCancelHint')),
      LIBRARY_PLACE_CANCEL_HINT_DELAY_MS,
    );
    onCleanup(() => {
      window.clearTimeout(timer);
      removeLibraryDragGhost();
    });
  },
  // 与原生拖拽共用 ghost；取消放置时先清理，再允许新拖拽创建自己的预览。
  { flush: 'sync' },
);

function updateLibraryPlacementPointer(event: PointerEvent): void {
  lastPlacementPointer = { x: event.clientX, y: event.clientY };
  if (libraryPlacement.value !== null) positionLibraryDragGhost(event.clientX, event.clientY);
}

onMounted(() => {
  window.addEventListener('pointermove', updateLibraryPlacementPointer);
  window.addEventListener('contextmenu', cancelPlacementFromContextMenu, true);
});
onScopeDispose(() => {
  window.removeEventListener('pointermove', updateLibraryPlacementPointer);
  window.removeEventListener('contextmenu', cancelPlacementFromContextMenu, true);
});
watch(selectedTrack, () => {
  selectedLibrarySkill.value = null;
  const placement = libraryPlacement.value;
  if (placement === null) return;
  const replacement = selectedTrackModel.value.skillLibrary.find(
    entry =>
      entry.skillType === placement.skillType &&
      entry.variantKey === undefined &&
      entry.placementSkillKey === undefined,
  );
  if (replacement === undefined) {
    cancelLibraryPlacement();
    return;
  }
  libraryPlacement.value = {
    entryKey: replacement.entryKey,
    skillGroupKey: replacement.skillGroupKey,
    skillType: replacement.skillType,
    ...(replacement.variantKey === undefined ? {} : { variantKey: replacement.variantKey }),
  };
});
const simulationService = new AdaptiveTimelineSimulationService(
  new WorkerScenarioSimulationService(
    new Worker(
      new URL('../../application/simulation/scenarioSimulation.worker.ts', import.meta.url),
      {
        type: 'module',
      },
    ),
    currentScenario => captureScenarioSimulationGameData(currentScenario, editorGameDataRepository),
  ),
  () => createEditorSimulationService(editorGameDataRepository),
);
onScopeDispose(() => simulationService.dispose());
const skillPlacementTransaction = new SkillPlacementTransaction(
  simulationService,
  () => projectRevision.value,
);
onScopeDispose(() => skillPlacementTransaction.cancel());
const {
  published: publishedSimulation,
  run: simulationRun,
  error: simulationError,
  performanceSamples: simulationPerformanceSamples,
  diagnosticsByCastId,
  simulateNow,
  resetPublication: resetSimulationPublication,
} = useScenarioSimulation({
  scenario,
  service: simulationService,
});
const {
  battleLogSnapshot,
  publishedOperators,
  publishedWeaponSources,
  publishedGearIcons,
  publishedGearSources,
  publishedGearSetIcons,
  publishedReceiptEntries,
} = usePublishedSimulationDisplay(
  publishedSimulation,
  editorGameDataRepository,
  () => editorGameDataRepository.getWeapons(),
  {
    skill: timelineCastLabel,
    operator: name =>
      name.displayName ??
      (name.assetSlug === null
        ? t('timeline.emptyTrack')
        : getOperatorGameName(name.assetSlug, locale.value)),
  },
  () => editorGameDataRepository.getGears(),
  () => editorGameDataRepository.getGearSets(),
);
const dodgeMarkerResults = computed(() =>
  projectDodgeMarkerDiagnostics(publishedReceiptEntries.value),
);
const dodgeMarkerWarningIds = computed(
  () =>
    new Set(
      [...dodgeMarkerResults.value]
        .filter(([, result]) => result.status !== 'normal')
        .map(([id]) => id),
    ),
);
const dodgeMarkerDiagnosticsById = computed(
  () =>
    new Map(
      [...dodgeMarkerResults.value].map(([id, result]) => [
        id,
        result.messages.flatMap(message => {
          if (message.code === 'interruptedSkill') {
            const label =
              message.castId === undefined ? undefined : axisSkillBlockLabel(message.castId);
            return label === undefined
              ? []
              : [
                  t('timeline.documentMarkerInspector.results.interruptedSkill', {
                    skillName: label,
                  }),
                ];
          }
          return [t(`timeline.documentMarkerInspector.results.${message.code}`)];
        }),
      ]),
    ),
);
const {
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
  openOperatorDefinitionWorkspace: openOperatorDefinitionWorkspaceNow,
  saveOperatorDefinition,
  resetOperatorDefinition,
  openWeaponDefinitionWorkspace: openWeaponDefinitionWorkspaceNow,
  saveWeaponDefinition,
  resetWeaponDefinition,
  openGearDefinitionWorkspace: openGearDefinitionWorkspaceNow,
  saveGearDefinition,
  resetGearDefinition,
  openGearSetDefinitionWorkspace: openGearSetDefinitionWorkspaceNow,
  saveGearSetDefinition,
  resetGearSetDefinition,
} = useProjectDefinitionWorkspaces({
  projectSession,
  gameDataRepository,
  scenario,
  selectedTrack,
  selectedLoadoutModel,
  projectDefinitionLibrary,
  names: {
    operator: slug => getOperatorGameName(slug, locale.value),
    weapon: slug => getWeaponGameName(slug, locale.value),
    gear: slug => getGearPieceGameName(slug, locale.value),
    gearSet: slug => getGearSetGameName(slug, locale.value),
  },
  beforeOpen: kind => {
    if (kind === 'operator') showOperatorBuildDialog.value = false;
    else if (kind === 'weapon') showWeaponBuildDialog.value = false;
    else showGearBuildDialog.value = false;
  },
  onDefinitionChange: refreshSimulationAfterDefinitionChange,
  ensureGameData: ensureAllGameData,
  reportError: message => {
    ElMessage.error(message);
  },
});

let definitionWorkspaceOpening = false;
async function openLoadedDefinitionWorkspace(
  load: () => Promise<unknown>,
  open: () => void | Promise<void>,
): Promise<void> {
  if (definitionWorkspaceOpening) return;
  definitionWorkspaceOpening = true;
  const loading = ElLoading.service({ lock: true, text: t('timeline.loading') });
  try {
    await load();
    await open();
    await nextTick();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : String(error));
  } finally {
    loading.close();
    definitionWorkspaceOpening = false;
  }
}

function openOperatorDefinitionWorkspace(): Promise<void> {
  return openLoadedDefinitionWorkspace(
    () => Promise.all([loadOperatorDefinitionWorkspaceDialog(), ensureAllGameData()]),
    openOperatorDefinitionWorkspaceNow,
  );
}

function openWeaponDefinitionWorkspace(): Promise<void> {
  return openLoadedDefinitionWorkspace(
    () => Promise.all([loadWeaponDefinitionWorkspaceDialog(), ensureAllGameData()]),
    openWeaponDefinitionWorkspaceNow,
  );
}

function openGearDefinitionWorkspace(slot: TrackGearSlot): Promise<void> {
  return openLoadedDefinitionWorkspace(loadGearDefinitionWorkspaceDialog, () =>
    openGearDefinitionWorkspaceNow(slot),
  );
}

function openGearSetDefinitionWorkspace(definition: GearDefinition): Promise<void> {
  return openLoadedDefinitionWorkspace(loadGearSetDefinitionWorkspaceDialog, () =>
    openGearSetDefinitionWorkspaceNow(definition),
  );
}
const selectedLibraryInspectorModel = computed(() => {
  const entry = selectedLibraryEntry.value;
  if (entry === null) {
    return {
      name: '',
      operatorName: '',
      typeLabel: '',
      skillGroupKey: '',
      level: 1,
      durationFrames: 0,
      segments: [] as readonly string[],
      customOperatorDefinition: false,
    };
  }
  return {
    name: selectedLibrarySkillName(),
    operatorName: operatorName(selectedTrackModel.value.operatorSlug),
    typeLabel: skillLibraryTypeLabel(entry),
    skillGroupKey: entry.skillGroupKey,
    level: entry.level,
    durationFrames: selectedLibrarySkillDurationFrames(),
    segments: skillSegments(entry).map(segment => segment.label),
    customOperatorDefinition: selectedOperatorCustomDefinition.value !== undefined,
  };
});
const selectedOperatorRequiredSkillReferences = computed(() => {
  projectRevision.value;
  const slug = selectedLoadoutModel.value.operator?.operatorSlug;
  if (slug === undefined) return [];
  return projectSession.snapshot.project.scenarios.flatMap(projectScenario =>
    projectScenario.tracks.flatMap(track => {
      if (track?.operator?.operatorSlug !== slug) return [];
      return track.skillCasts.flatMap(cast =>
        cast.source.kind === 'operatorSkill'
          ? [
              {
                skillGroupKey: cast.source.skillGroupKey,
                skillKey: cast.source.skillKey,
                castId: cast.id,
              },
            ]
          : [],
      );
    }),
  );
});
const selectedOperatorDefinitionSkillLevel = computed(() =>
  Math.max(1, ...Object.values(selectedLoadoutModel.value.operator?.skillLevels ?? {})),
);
const customGearDefinitionSlugs = computed(() => Object.keys(projectDefinitionLibrary.value.gears));
const gearSetIds = computed(() => editorGameDataRepository.getGearSets().map(value => value.slug));
const gearSetNames = computed<Readonly<Record<string, string>>>(() =>
  Object.fromEntries(
    editorGameDataRepository
      .getGearSets()
      .map(definition => [
        definition.slug,
        definition.displayName ?? getGearSetGameName(definition.slug, locale.value),
      ]),
  ),
);
const gearSetTextSlugs = computed<Readonly<Record<string, string>>>(() =>
  Object.fromEntries(
    Object.values(projectDefinitionLibrary.value.gearSets).map(template => [
      template.id,
      template.origin?.templateId ?? template.id,
    ]),
  ),
);
const activeGearSetLabelsByTrack = computed(() =>
  loadoutModels.value.map(loadout =>
    projectActiveGearSetLabels(loadout, gearSetNames.value).join(' / '),
  ),
);
const operatorBuildPanel = computed(() => {
  return panelResolution.value.panels.get(selectedTrack.value) ?? null;
});
const operatorFormNamesByTrack = computed<readonly (string | null)[]>(() =>
  viewModel.value.tracks.map(track => {
    const operator = loadoutModels.value[track.trackIndex]?.operator ?? null;
    const panel = panelResolution.value.panels.get(track.trackIndex) ?? null;
    if (operator === null || panel === null) return null;
    const formKey = resolveOperatorPresentationFormKey(operator.definition, panel.attributes);
    if (formKey === null) return null;
    return getOperatorFormName(
      operator.definition.assetSlug ?? operator.operatorSlug,
      formKey,
      locale.value,
    );
  }),
);
const selectedOperatorFormName = computed(
  () => operatorFormNamesByTrack.value[selectedTrack.value] ?? null,
);

/**
 * 项目定义提交可能同时替换活动场景，也可能只替换定义库。
 * 统一等 Vue 场景 watcher 先标脏/排队，再立即模拟；simulateNow 会清掉该待执行定时器，保证只跑一份。
 */
function refreshSimulationAfterDefinitionChange(): void {
  simulationService.clearCache();
  void nextTick(simulateNow);
}

const panelDialogOperator = computed(() => {
  const trackIndex = panelDialogTrack.value;
  return trackIndex === null
    ? null
    : (loadoutModels.value[trackIndex]?.operator?.definition ?? null);
});
const panelDialogOperatorName = computed(() =>
  operatorName(panelDialogOperator.value?.slug ?? null),
);
const selectedCastModel = computed(() => {
  if (selectedCastId.value === null) return null;
  for (const trackModel of viewModel.value.tracks) {
    const castModel = trackModel.skillCasts.find(cast => cast.id === selectedCastId.value);
    const cast = scenario.value.tracks[trackModel.trackIndex]?.skillCasts.find(
      candidate => candidate.id === selectedCastId.value,
    );
    if (castModel !== undefined && cast !== undefined) {
      const operator = editorGameDataRepository.getOperator(trackModel.operatorSlug ?? '');
      let template: SkillDefinition | null = null;
      if (operator !== null) {
        try {
          template = resolveSkillTemplateDefinition(cast, operator).definition;
        } catch {
          // 模板内部 key 可自由编辑；失配由技能块原地诊断，不删除时间轴内容。
        }
      }
      const diffCount =
        cast.customDefinition === undefined || template === null
          ? 0
          : diffSkillDefinition(template, cast.customDefinition).length;
      const source = cast.source;
      const skillLevel =
        source.kind === 'operatorSkill'
          ? (trackModel.skillLibrary.find(
              entry =>
                entry.skillGroupKey === source.skillGroupKey &&
                entry.skills.some(skill => skill.skillKey === source.skillKey),
            )?.level ?? 1)
          : 1;
      return {
        trackIndex: trackModel.trackIndex,
        cast,
        skillType: castModel.skillType,
        label: timelineCastLabel(castModel, trackModel),
        edited: cast.customDefinition !== undefined,
        diffCount,
        templateDefinition: template,
        currentDefinition: cast.customDefinition ?? template,
        skillLevel,
      };
    }
  }
  return null;
});
const selectedExternalEventMarker = computed(() => {
  if (selectedMarker.value?.kind !== 'externalEvent') return null;
  return (
    (scenario.value.battle.externalEventMarkers ?? []).find(
      marker => marker.id === selectedMarker.value?.id,
    ) ?? null
  );
});
const selectedExternalEventTargetLabel = computed(() => {
  const marker = selectedExternalEventMarker.value;
  if (marker === null) return '';
  if (marker.target.scope === 'team') return t('timeline.markerInspector.teamTarget');
  const track = scenario.value.tracks[marker.target.trackIndex];
  return track === null || track.operator === null
    ? t('timeline.emptyTrack')
    : operatorName(track.operator.operatorSlug);
});
const selectedDocumentMarker = computed(() => {
  const selection = selectedMarker.value;
  if (selection === null || selection.kind === 'externalEvent') return null;
  if (selection.kind === 'cycleBoundary') {
    const marker = scenario.value.battle.cycleBoundaries.find(item => item.id === selection.id);
    return marker === undefined ? null : { ...marker, kind: selection.kind };
  }
  if (selection.kind === 'controlSwitch') {
    const marker = scenario.value.battle.controlSwitches.find(item => item.id === selection.id);
    return marker === undefined ? null : { ...marker, kind: selection.kind };
  }
  if (selection.kind === 'dodge') {
    const marker = (scenario.value.battle.dodgeMarkers ?? []).find(
      item => item.id === selection.id,
    );
    return marker === undefined ? null : { ...marker, kind: selection.kind };
  }
  const frame =
    selection.kind === 'simulationStart'
      ? scenario.value.battle.simulationRange?.startFrame
      : scenario.value.battle.simulationRange?.endFrame;
  return frame === undefined ? null : { id: selection.id, kind: selection.kind, frame };
});
const selectedDodgeEffects = computed(() => {
  const marker = selectedDocumentMarker.value;
  if (marker?.kind !== 'dodge') return [];
  const operatorId = scenario.value.tracks[marker.trackIndex]?.id;
  return operatorId === undefined
    ? []
    : projectDodgeMarkerEffects(publishedReceiptEntries.value, operatorId, marker.id);
});
const occupiedTrackOptions = computed(() =>
  scenario.value.tracks.flatMap((track, index) =>
    track === null || track.operator === null
      ? []
      : [
          {
            trackIndex: index as TrackIndex,
            label: t('timeline.documentMarkerInspector.trackOption', {
              index: index + 1,
              name: operatorName(track.operator.operatorSlug),
            }),
          },
        ],
  ),
);
function connectionPort(value: string | undefined, fallback: TimelineConnectionPort) {
  return value === 'top' ||
    value === 'right' ||
    value === 'bottom' ||
    value === 'left' ||
    value === 'top-left' ||
    value === 'top-right' ||
    value === 'bottom-left' ||
    value === 'bottom-right'
    ? value
    : fallback;
}

function axisSkillBlockLabel(skillCastId: string): string | undefined {
  for (const track of viewModel.value.tracks) {
    const cast = track.skillCasts.find(candidate => candidate.id === skillCastId);
    if (cast !== undefined) return timelineCastLabel(cast, track);
  }
  return undefined;
}

/** 实际路由可能指向尚未放置的技能，仍使用轴上技能块的命名规则展示。 */
function triggeredSkillBlockLabel(skillCastId: string, skillKey: string): string | undefined {
  const track = viewModel.value.tracks.find(candidate =>
    candidate.skillCasts.some(cast => cast.id === skillCastId),
  );
  if (track === undefined) return undefined;
  return (
    timelineSkillBlockLabelForKey(track.skillLibrary, skillKey, skillSegmentLabels(), entry =>
      skillTypeLabel(entry.skillType),
    ) ?? undefined
  );
}

function timelineCastLabelById(skillCastId: string): string {
  return axisSkillBlockLabel(skillCastId) ?? skillCastId;
}

const selectedCastConnections = computed(() => {
  const selected = selectedCastModel.value;
  if (selected === null) return [];
  return scenario.value.connections
    .filter(
      connection =>
        connection.from.skillCastId === selected.cast.id ||
        connection.to.skillCastId === selected.cast.id,
    )
    .map(connection => {
      const outgoing = connection.from.skillCastId === selected.cast.id;
      const other = outgoing ? connection.to : connection.from;
      return {
        id: connection.id,
        outgoing,
        otherLabel: timelineCastLabelById(other.skillCastId),
        fromPort: connectionPort(connection.from.port, 'right'),
        toPort: connectionPort(connection.to.port, 'left'),
      } as const;
    });
});
const commonAbilityEntityDefinitions =
  gameDataRepository.getCommonAbilityEntityDefinitions?.() ?? {};
const commonBuffDefinitions = gameDataRepository.getCommonBuffDefinitions?.() ?? {};
const selectedCastAbilityEntityIds = computed(() => {
  const selected = selectedCastModel.value;
  if (selected === null) return Object.keys(commonAbilityEntityDefinitions).sort();
  const track = scenario.value.tracks[selected.trackIndex];
  const operator =
    track?.operator === null || track?.operator === undefined
      ? null
      : editorGameDataRepository.getOperator(track.operator.operatorSlug);
  return Object.keys({
    ...commonAbilityEntityDefinitions,
    ...(operator?.abilityEntityDefinitions ?? {}),
  }).sort();
});
const selectedCastBuffIds = computed(() => {
  const selected = selectedCastModel.value;
  const common = editorGameDataRepository.getCommonBuffDefinitions?.() ?? {};
  if (selected === null) return Object.keys(common).sort();
  const track = scenario.value.tracks[selected.trackIndex];
  const operator =
    track?.operator === null || track?.operator === undefined
      ? null
      : editorGameDataRepository.getOperator(track.operator.operatorSlug);
  return Object.keys({ ...common, ...(operator?.buffDefinitions ?? {}) }).sort();
});
const compatibleSkillCastReceiptIds = computed(() =>
  matchingPublishedSkillCastIds(scenario.value, publishedSimulation.value?.scenario),
);
const publishedSkillCastActualStartFrames = computed(() =>
  simulationRun.value === null
    ? new Map<string, number>()
    : projectSkillCastActualStartFrames(publishedReceiptEntries.value),
);
const publishedSkillCastActualDurationFrames = computed(() =>
  simulationRun.value === null
    ? new Map<string, number>()
    : projectSkillCastActualDurationFrames(publishedReceiptEntries.value),
);
const publishedSkillCastInputFacts = computed(() =>
  projectSkillCastInputFacts(publishedReceiptEntries.value),
);
const skillCastInputFrames = computed(
  () =>
    new Map(
      [...publishedSkillCastInputFacts.value.frames].filter(([id]) =>
        compatibleSkillCastReceiptIds.value.has(id),
      ),
    ),
);
const skillCastActualStartFrames = computed(
  () =>
    new Map(
      [...publishedSkillCastActualStartFrames.value].filter(([id]) =>
        compatibleSkillCastReceiptIds.value.has(id),
      ),
    ),
);
const skillCastActualDurationFrames = computed(
  () =>
    new Map(
      [
        ...publishedSkillCastActualDurationFrames.value,
        ...[...publishedSkillCastInputFacts.value.switchedToBuff].map(id => [id, 1] as const),
      ].filter(([id]) => compatibleSkillCastReceiptIds.value.has(id)),
    ),
);
const skillCastPlacementActualFrames = computed(
  () => new Map([...skillCastInputFrames.value, ...skillCastActualStartFrames.value]),
);
const skillCastDefinitionDurations = computed(
  () =>
    new Map(
      viewModel.value.tracks.flatMap(track =>
        track.skillCasts.map(
          cast => [cast.id, skillPlacementDisplayFrames(cast.durationFrames)] as const,
        ),
      ),
    ),
);

function resolveDisplayedSkillStarts(document: ScenarioDocument): ReadonlyMap<string, number> {
  return new Map(
    document.tracks.flatMap(track => [
      ...resolveSkillCastStartFrames(
        track?.skillCasts ?? [],
        cast =>
          skillCastActualDurationFrames.value.get(cast.id) ??
          skillCastDefinitionDurations.value.get(cast.id) ??
          0,
        skillCastPlacementActualFrames.value,
      ),
    ]),
  );
}

const resolvedSkillCastStartFrames = computed(() => resolveDisplayedSkillStarts(scenario.value));
const { castMoveGesture, beginCastMove, cancelCastMove, discardCastMove, consumeCastClick } =
  useTimelineCastMove({
    prepEndFrame: computed(() => scenario.value.inheritance?.frame ?? 0),
    isInputReadOnly: isHistoricalSkillInput,
    minimumInputFrame: minimumEditableInputFrame,
    scenario,
    actionSelection,
    interactionSession,
    simulationService,
    resolvedSkillCastStartFrames,
    timelineScroll,
    pxPerFrame,
    snapFrames,
    cursorFrame,
    trackHeaderWidth: TIMELINE_TRACK_HEADER_WIDTH,
    rulerHeight: TIMELINE_RULER_HEIGHT,
    verticalAutoScrollEnabled: () => buffLayoutMode.value !== 'compact',
    timelineFramePx,
    alignSelectedCastToTarget,
    applyActionSelection,
    commitScenario,
    simulateNow,
    warnLocked: () => ElMessage.warning(t('timelineGrid.action.locked')),
  });
const displayedSkillCastStartFrames = computed(() => {
  const gesture = castMoveGesture.value;
  // 等待新回执时只平移上一版完整结果；新回执发布后，立即使用其中的组内间距。
  const publishedStarts =
    gesture === null
      ? resolvedSkillCastStartFrames.value
      : resolveDisplayedSkillStarts(gesture.baseScenario);
  return projectMovingSkillCastStartFrames(
    publishedStarts,
    gesture === null
      ? null
      : {
          anchorId: gesture.skillCastId,
          castIds: gesture.skillCastIds,
          baseStartFrames: gesture.baseStartFrames,
          previewActualFrame: gesture.previewActualFrame,
        },
  );
});
const skillCastGroupsByTrack = computed(() =>
  scenario.value.tracks.map(track =>
    getSkillCastPlacementChains(track?.skillCasts ?? []).filter(chain => chain.casts.length > 1),
  ),
);
const groupedSkillCastIds = computed(
  () =>
    new Set(
      skillCastGroupsByTrack.value.flatMap(groups =>
        groups.flatMap(group => group.casts.map(cast => cast.id)),
      ),
    ),
);
const publishedPerfectComboCastIds = computed(() =>
  simulationRun.value === null
    ? new Set<string>()
    : projectRossiComboSuccessCastIds(publishedReceiptEntries.value),
);
const perfectComboCastIds = computed(
  () =>
    new Set(
      [...publishedPerfectComboCastIds.value].filter(id =>
        compatibleSkillCastReceiptIds.value.has(id),
      ),
    ),
);
const rulerOperations = computed<TimelineOperationMarkerInput[]>(() => {
  const operations: TimelineOperationMarkerInput[] = [];
  for (const track of viewModel.value.tracks) {
    for (const cast of track.skillCasts) {
      const kind =
        cast.skillType === 'battleSkill'
          ? 'skill'
          : cast.skillType === 'comboSkill'
            ? 'combo'
            : cast.skillType === 'ultimate'
              ? 'ultimate'
              : null;
      if (kind === null) continue;
      operations.push({
        id: `cast:${cast.id}`,
        kind,
        trackIndex: track.trackIndex,
        frame: castActualStartFrame(cast.id, cast.startFrame),
        ...(kind === 'combo' && perfectComboCastIds.value.has(cast.id) ? { perfect: true } : {}),
        ...(kind === 'ultimate'
          ? { durationFrames: castActualDurationFrame(cast.id, cast.durationFrames) }
          : {}),
      });
    }
  }
  for (const marker of scenario.value.battle.controlSwitches) {
    operations.push({
      id: `switch:${marker.id}`,
      kind: 'switch',
      trackIndex: marker.trackIndex,
      frame: displayedMarkerFrame('controlSwitch', marker.id, marker.frame),
    });
  }
  return operations;
});
const publishedTimeDilationBands = computed(() => {
  if (simulationRun.value === null) return [];
  return projectTimelineTimeDilationBands(publishedReceiptEntries.value, simulationRun.value.frame);
});
const timeDilationBands = computed(() => {
  const bands = publishedTimeDilationBands.value.filter(
    band =>
      band.sourceCastId === undefined || compatibleSkillCastReceiptIds.value.has(band.sourceCastId),
  );
  const gesture = castMoveGesture.value;
  if (gesture === null) return bands;
  return bands.map(band => {
    if (band.sourceCastId === undefined || !gesture.skillCastIds.includes(band.sourceCastId))
      return band;
    const publishedFrame = skillCastActualStartFrames.value.get(band.sourceCastId);
    const displayedFrame = displayedSkillCastStartFrames.value.get(band.sourceCastId);
    const deltaFrames =
      publishedFrame === undefined || displayedFrame === undefined
        ? 0
        : displayedFrame - publishedFrame;
    return deltaFrames === 0
      ? band
      : Object.freeze({
          ...band,
          startFrame: band.startFrame + deltaFrames,
          endFrame: band.endFrame + deltaFrames,
        });
  });
});
const highlightedTimeDilationSourceIds = computed<ReadonlySet<string>>(() => {
  const visibleCastIds = new Set(
    viewModel.value.tracks.flatMap(track =>
      isOperatorEffectsVisible(track.trackIndex) ? track.skillCasts.map(cast => cast.id) : [],
    ),
  );
  const ids = new Set(
    [...actionSelection.value.selectedIds].filter(castId => visibleCastIds.has(castId)),
  );
  if (hoveredCastId.value !== null && visibleCastIds.has(hoveredCastId.value)) {
    ids.add(hoveredCastId.value);
  }
  return ids;
});
const timelineWidth = computed(() =>
  timelineTotalWidth(
    displayedTimelinePrepFrames.value,
    scenario.value.battle.durationFrames,
    pxPerFrame.value,
    scenario.value.editor.prepExpanded,
    scenario.value.inheritance?.frame ?? 0,
  ),
);
function timelineFramePx(frame: number, prepFrames = scenario.value.battle.prepFrames): number {
  return frameToTimelinePx(
    frame,
    prepFrames,
    pxPerFrame.value,
    scenario.value.editor.prepExpanded,
    scenario.value.inheritance?.frame ?? 0,
  );
}
function timelineFrameSpanPx(startFrame: number, durationFrames: number): number {
  return Math.max(0, timelineFramePx(startFrame + durationFrames) - timelineFramePx(startFrame));
}
const timelineSurfaceStyle = computed<Record<string, string>>(() => ({
  width: `${TIMELINE_TRACK_HEADER_WIDTH + timelineWidth.value}px`,
  '--timeline-grid-step': `${PROJECT_FPS * pxPerFrame.value}px`,
  '--timeline-grid-origin': `${
    TIMELINE_TRACK_HEADER_WIDTH + timelineFramePx(0, displayedTimelinePrepFrames.value)
  }px`,
  '--timeline-grid-origin-lane': `${timelineFramePx(0, displayedTimelinePrepFrames.value)}px`,
}));

const syncTimelineScroll = createTimelineScrollSync();
const syncTimelineVerticalScroll = createTimelineVerticalScrollSync();

function updateTimelineViewportMetrics(): void {
  const viewport = timelineScroll.value;
  if (viewport === null) return;
  if (buffLayoutMode.value === 'compact' && viewport.scrollTop !== 0) viewport.scrollTop = 0;
  timelineScrollLeft.value = viewport.scrollLeft;
  timelineScrollTop.value = viewport.scrollTop;
  timelineViewportWidth.value = viewport.clientWidth;
  timelineViewportHeight.value = viewport.clientHeight;
  timelineVerticalScrollRange.value = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
  timelineVerticalScrollbarWidth.value =
    buffLayoutMode.value === 'compact' || timelineVerticalScrollRange.value === 0 ? 0 : 8;
  const scrollbar = timelineHorizontalScrollbar.value;
  if (scrollbar !== null) syncTimelineScroll(viewport, scrollbar);
  const verticalScrollbar = timelineVerticalScrollbar.value;
  if (verticalScrollbar !== null) syncTimelineVerticalScroll(viewport, verticalScrollbar);
}

function updateTimelineHorizontalScroll(event: Event): void {
  const viewport = timelineScroll.value;
  const scrollbar = event.currentTarget as HTMLElement | null;
  if (viewport === null || scrollbar === null) return;
  syncTimelineScroll(scrollbar, viewport);
}

function updateTimelineVerticalScroll(event: Event): void {
  const viewport = timelineScroll.value;
  const scrollbar = event.currentTarget as HTMLElement | null;
  if (viewport !== null && scrollbar !== null) syncTimelineVerticalScroll(scrollbar, viewport);
}

onMounted(() => {
  updateTimelineViewportMetrics();
  if (typeof ResizeObserver === 'undefined' || timelineScroll.value === null) return;
  timelineResizeObserver = new ResizeObserver(updateTimelineViewportMetrics);
  timelineResizeObserver.observe(timelineScroll.value);
  if (timelineSurface.value !== null) timelineResizeObserver.observe(timelineSurface.value);
});

onScopeDispose(() => {
  timelineResizeObserver?.disconnect();
  timelineResizeObserver = null;
});

function castTimeDilationSegments(
  castId: string,
  placementFrame: number,
  durationFrames: number,
): readonly { readonly left: number; readonly width: number }[] {
  if (!compatibleSkillCastReceiptIds.value.has(castId)) return [];
  const castStartFrame = castActualStartFrame(castId, placementFrame);
  return projectCastTimeDilationSegments(
    timeDilationBands.value,
    castId,
    castStartFrame,
    durationFrames,
  ).map(segment => ({
    left: timelineFramePx(castStartFrame + segment.offsetFrames) - timelineFramePx(castStartFrame),
    width: timelineFrameSpanPx(castStartFrame + segment.offsetFrames, segment.durationFrames),
  }));
}

function setCastHovered(castId: string, hovered: boolean): void {
  if (hovered) hoveredCastId.value = castId;
  else {
    if (hoveredCastId.value === castId) hoveredCastId.value = null;
    if (alignmentGuide.value?.targetCastId === castId) alignmentGuide.value = null;
  }
}

function alignmentMode(event: PointerEvent, block: HTMLElement): TimelineCastAlignmentMode {
  const leftHalf = event.clientX < block.getBoundingClientRect().left + block.offsetWidth / 2;
  if (event.shiftKey) return leftHalf ? 'alignStart' : 'alignEnd';
  return leftHalf ? 'snapBefore' : 'snapAfter';
}

function alignmentPresentation(mode: TimelineCastAlignmentMode): {
  label: string;
  result: string;
  color: string;
} {
  if (mode === 'snapBefore') {
    return {
      label: t('timelineGrid.alignGuide.snapFront'),
      result: t('timelineGrid.alignResult.snappedFront'),
      color: '#00e5ff',
    };
  }
  if (mode === 'snapAfter') {
    return {
      label: t('timelineGrid.alignGuide.snapBack'),
      result: t('timelineGrid.alignResult.snappedBack'),
      color: '#00e5ff',
    };
  }
  if (mode === 'alignStart') {
    return {
      label: t('timelineGrid.alignGuide.alignLeft'),
      result: t('timelineGrid.alignResult.alignedLeft'),
      color: '#ff4fd8',
    };
  }
  return {
    label: t('timelineGrid.alignGuide.alignRight'),
    result: t('timelineGrid.alignResult.alignedRight'),
    color: '#ff4fd8',
  };
}

function updateAlignmentGuide(event: PointerEvent, targetCastId: string): void {
  const sourceCastId = actionSelection.value.primaryId;
  const surface = timelineSurface.value;
  const block = event.currentTarget as HTMLElement;
  if (!event.altKey || sourceCastId === null || sourceCastId === targetCastId || surface === null) {
    alignmentGuide.value = null;
    return;
  }
  const mode = alignmentMode(event, block);
  const presentation = alignmentPresentation(mode);
  const blockRect = block.getBoundingClientRect();
  const surfaceRect = surface.getBoundingClientRect();
  const useLeftEdge = mode === 'snapBefore' || mode === 'alignStart';
  const source = castAlignmentSpan(sourceCastId);
  const target = castAlignmentSpan(targetCastId);
  if (source === undefined || target === undefined || source.anchorId === target.anchorId) {
    alignmentGuide.value = null;
    return;
  }
  alignmentGuide.value = {
    targetCastId,
    left:
      TIMELINE_TRACK_HEADER_WIDTH +
      timelineFramePx(useLeftEdge ? target.startFrame : target.startFrame + target.durationFrames),
    top: blockRect.top - surfaceRect.top,
    height: blockRect.height,
    mode,
    label: presentation.label,
    color: presentation.color,
  };
}

function castAlignmentSpan(castId: string) {
  for (const track of viewModel.value.tracks) {
    const span = resolveTimelineCastAlignmentSpan(
      castId,
      track.skillCasts.map(cast => ({
        id: cast.id,
        startFrame: castActualStartFrame(cast.id, cast.startFrame),
        endFrame:
          visibleSkillEndFrames.value.get(cast.id) ??
          castActualStartFrame(cast.id, cast.startFrame) +
            castActualDurationFrame(cast.id, cast.durationFrames),
        locked: cast.locked || isHistoricalSkillInput(cast.id),
      })),
      skillCastGroupsByTrack.value[track.trackIndex]!.map(group =>
        group.casts.map(cast => cast.id),
      ),
    );
    if (span !== undefined) return { ...span, trackIndex: track.trackIndex };
  }
  return undefined;
}

function alignSelectedCastToTarget(event: PointerEvent, targetCastId: string): boolean {
  const sourceCastId = actionSelection.value.primaryId;
  if (!event.altKey || sourceCastId === null || sourceCastId === targetCastId) return false;
  event.preventDefault();
  event.stopPropagation();
  const block = event.currentTarget as HTMLElement;
  const mode = alignmentMode(event, block);
  if (isHistoricalSkillInput(sourceCastId)) return true;
  const source = castAlignmentSpan(sourceCastId);
  const target = castAlignmentSpan(targetCastId);
  if (source === undefined || target === undefined || source.locked) return true;
  if (source.anchorId === target.anchorId) return true;
  const frame = resolveTimelineCastAlignmentFrame({
    mode,
    targetStartFrame: target.startFrame,
    targetDurationFrames: target.durationFrames,
    sourceDurationFrames: source.durationFrames,
    snapFrames: snapFrames.value,
    minimumFrame: minimumEditableInputFrame.value,
    maximumFrame: scenario.value.battle.durationFrames,
  });
  const changed = commitScenario('alignSkillCast', current =>
    moveSkillCast(
      current,
      source.trackIndex,
      source.anchorId,
      frame,
      displayedSkillCastStartFrames.value,
    ),
  );
  alignmentGuide.value = null;
  if (changed) ElMessage.success(alignmentPresentation(mode).result);
  else ElMessage.warning(t('timelineGrid.alignResult.unchanged'));
  return true;
}

function castActualStartFrame(castId: string, placementFrame: number): number {
  return displayedSkillCastStartFrames.value.get(castId) ?? placementFrame;
}

function castActualDurationFrame(castId: string, definitionDurationFrames: number): number {
  return (
    skillCastActualDurationFrames.value.get(castId) ??
    skillPlacementDisplayFrames(definitionDurationFrames)
  );
}

const publishedSkillCastInterruptionFrames = computed(() =>
  projectSkillCastInterruptionFrames(publishedReceiptEntries.value),
);
const visibleSkillEndFrames = computed(() => {
  const ends = new Map<string, number>();
  const interruptions = new Map(
    [...publishedSkillCastInterruptionFrames.value].filter(([id]) =>
      compatibleSkillCastReceiptIds.value.has(id),
    ),
  );
  for (const track of viewModel.value.tracks) {
    for (const [id, end] of timelineVisibleSkillEnds(
      track.skillCasts.map(cast => ({
        id: cast.id,
        startFrame: castActualStartFrame(cast.id, cast.startFrame),
        durationFrames: Math.min(
          skillCastActualDurationFrames.value.get(cast.id) ??
            (interruptions.has(cast.id)
              ? Infinity
              : skillPlacementDisplayFrames(cast.durationFrames)),
          Math.max(
            0,
            (interruptions.get(cast.id) ?? Infinity) -
              (skillCastActualStartFrames.value.get(cast.id) ?? cast.startFrame),
          ),
        ),
      })),
    ))
      ends.set(id, end);
  }
  return ends;
});

function castActualDurationPending(castId: string, definitionDurationFrames: number): boolean {
  return (
    definitionDurationFrames > 0 &&
    skillCastActualStartFrames.value.has(castId) &&
    !skillCastActualDurationFrames.value.has(castId)
  );
}

function timelinePointerActualFrame(pointerPx: number): number {
  return Math.max(
    minimumEditableInputFrame.value,
    timelinePxToFrame(
      pointerPx,
      scenario.value.battle.prepFrames,
      pxPerFrame.value,
      scenario.value.editor.prepExpanded,
      scenario.value.inheritance?.frame ?? 0,
    ),
  );
}
function formatGuideNumber(value: number | null): string {
  if (value === null) return '--';
  return String(Math.round(value * 1000) / 1000);
}

function castWarningTitle(castId: string, definitionUnavailable = false): string {
  if (!definitionUnavailable && !compatibleSkillCastReceiptIds.value.has(castId)) return '';
  return formatSkillBlockWarnings({
    reasons: diagnosticsByCastId.value.get(castId) ?? [],
    skillLabel: axisSkillBlockLabel(castId),
    definitionUnavailable,
    castLabel: axisSkillBlockLabel,
    triggeredSkillLabel: skillKey => triggeredSkillBlockLabel(castId, skillKey),
    t,
  });
}

// 同一发布回执只解析一次；不能每个技能、每次指针移动都重扫整份日志。
const hitReceipts = computed(() => projectTimelineHitReceipts(publishedReceiptEntries.value));
const castHitEffects = computed(() => {
  const current = simulationRun.value;
  if (current === null) {
    return new Map<string, ReadonlyMap<string, TimelineHitEffectLabel>>();
  }
  const byCastId = new Map<string, ReadonlyMap<string, TimelineHitEffectLabel>>();
  const models = new Map(
    viewModel.value.tracks.flatMap(track => track.skillCasts).map(cast => [cast.id, cast]),
  );
  for (const track of scenario.value.tracks) {
    if (track === null) continue;
    for (const cast of track.skillCasts) {
      if (!compatibleSkillCastReceiptIds.value.has(cast.id)) continue;
      const castModel = models.get(cast.id);
      byCastId.set(
        cast.id,
        projectHitEffectsByCast(
          scenario.value,
          publishedReceiptEntries.value,
          cast.id,
          castModel?.hitMarkers ?? [],
          hitReceipts.value,
        ),
      );
    }
  }
  return byCastId;
});
const hitActualFrames = computed(() =>
  projectCompatibleHitFrames(hitReceipts.value.damages, compatibleSkillCastReceiptIds.value),
);

/** 敌人瞬时效果标记；附着和法术异常的持续展示统一由可见 Buff 生命周期负责。 */
const attachmentBuffIds = new Set(
  elementalAttachments.buffs
    .filter(buff => buff.role?.kind === 'elementalAttachment')
    .map(buff => buff.id),
);
const enemyEffectViz = computed(() => {
  const current = simulationRun.value;
  if (current === null) {
    return { markers: [] };
  }
  // 拖动草稿会立即把模拟标脏，但上一份成功回执仍是比空白更稳定的视觉占位；
  // 新模拟完成后 simulationRun 会整体替换，效果条随之原子更新，避免来回闪烁。
  return projectEnemyEffectViz(publishedReceiptEntries.value, current.frame);
});

const poiseBrokenSegments = computed(() => {
  const current = simulationRun.value;
  return current === null
    ? []
    : projectPoiseBrokenSegments(publishedReceiptEntries.value, current.frame);
});
const poiseKnotSegments = computed(() => {
  const current = simulationRun.value;
  if (current === null) return [];
  const stagger = scenario.value.enemy.editable.stagger;
  return projectPoiseKnotSegments(
    publishedReceiptEntries.value,
    stagger.maximum,
    stagger.knotThresholds,
    stagger.knotBreakDurationFrames,
    current.frame,
  );
});

/** 所有持续状态统一由原生可见 Buff 生命周期投影，Buff 实例就是稳定展示身份。 */
const buffTimelineSegments = computed(() => {
  const current = simulationRun.value;
  return current === null
    ? []
    : projectBuffTimelineViz(publishedReceiptEntries.value, current.frame);
});

/** 光标快照只消费已经生成的生命周期段，不回查或重算 Buff 运行时。 */
const combatHudInitialSkillSlots = computed(() =>
  viewModel.value.tracks.flatMap(track => {
    if (track.operatorInstanceId === null || track.operatorSlug === null) return [];
    const definition = editorGameDataRepository.getOperator(track.operatorSlug);
    return [
      {
        operatorId: track.operatorInstanceId,
        slots: (definition?.skillSlots ?? []).map(slot => ({
          skillSlotKey: slot.key,
          currentSkillKey: slot.baseSkillKey,
        })),
      },
    ];
  }),
);

const combatHudOperatorPassiveUis = computed(() =>
  viewModel.value.tracks.flatMap(track => {
    if (track.operatorInstanceId === null || track.operatorSlug === null) return [];
    const definition = editorGameDataRepository.getOperator(track.operatorSlug)?.passiveUi;
    return definition === undefined ? [] : [{ operatorId: track.operatorInstanceId, definition }];
  }),
);

/** 专属 UI 不只采样光标快照；非零状态还要保留完整生命周期供轨道展示。 */
const operatorPassiveUiTimelineSegments = computed(() => {
  const current = simulationRun.value;
  return current === null
    ? []
    : projectOperatorPassiveUiTimelineViz(
        publishedReceiptEntries.value,
        current.frame,
        combatHudOperatorPassiveUis.value,
      );
});

const operatorControlTimeline = computed(() =>
  resolveControlTimeline(
    scenario.value.tracks,
    scenario.value.battle.controlSwitches,
    -scenario.value.battle.prepFrames,
  ),
);

/** 旧版底部摘要固定取最后一次敌人受伤时刻，而不是跟随隐藏的编辑光标。 */
const collapsedMonitorSectionCount = ref(0);
const enemyLastDamageFrame = computed(() => {
  const current = simulationRun.value;
  if (current === null) return null;
  return (
    current.enemyHealthCurve.points.filter(point => point.sequence !== null).at(-1)?.frame ?? null
  );
});

const combatHudSnapshot = computed(() => {
  const current = simulationRun.value;
  if (current === null) return null;
  return projectCombatHudSnapshot({
    frame: enemyLastDamageFrame.value ?? 0,
    endFrame: current.frame,
    enemyHealthCurve: current.enemyHealthCurve,
    poiseCurve: current.poiseCurve,
    resourceCurves: current.resourceCurves,
    receiptEntries: publishedReceiptEntries.value,
    operatorSkillSlots: combatHudInitialSkillSlots.value,
    operatorPassiveUis: combatHudOperatorPassiveUis.value,
    buffProgressCurves: current.buffProgressCurves,
    controlTimeline: operatorControlTimeline.value,
  });
});

const comboWindowSegments = computed(() => {
  const current = simulationRun.value;
  return current === null
    ? []
    : projectComboWindowTimelineViz(publishedReceiptEntries.value, current.frame);
});

const skillCooldownSegments = computed(() => {
  const current = simulationRun.value;
  return current === null
    ? []
    : projectSkillCooldownTimelineViz(publishedReceiptEntries.value, current.frame);
});
const controlledComboCooldownBands = computed(() => {
  const run = simulationRun.value;
  return run === null
    ? []
    : projectTimelineComboCooldowns(publishedReceiptEntries.value, run.frame);
});

const skillEnhancementSegments = computed(() => {
  const current = simulationRun.value;
  if (current === null) return [];
  return projectSkillEnhancementTimelineViz(
    publishedReceiptEntries.value,
    current.frame,
    viewModel.value.tracks.flatMap(track =>
      track.operatorInstanceId === null
        ? []
        : track.skillCasts.flatMap(cast =>
            cast.enhancementStateBuffId === undefined
              ? []
              : [
                  {
                    castId: cast.id,
                    targetId: track.operatorInstanceId!,
                    buffId: cast.enhancementStateBuffId,
                  },
                ],
          ),
    ),
  );
});

function cooldownBarsForCast(castId: string, castStartFrame: number) {
  if (!compatibleSkillCastReceiptIds.value.has(castId)) return [];
  const publishedStart = skillCastPlacementActualFrames.value.get(castId) ?? castStartFrame;
  return skillCooldownSegments.value
    .filter(segment => segment.castId === castId)
    .map(segment => ({
      offsetFrames: segment.startFrame - publishedStart,
      durationFrames: Math.max(0, segment.endFrame - segment.startFrame),
      completed: segment.completed,
    }))
    .filter(segment => segment.durationFrames > 0);
}

function enhancementBarsForCast(castId: string, castStartFrame: number) {
  if (!compatibleSkillCastReceiptIds.value.has(castId)) return [];
  const publishedStart = skillCastPlacementActualFrames.value.get(castId) ?? castStartFrame;
  return skillEnhancementSegments.value
    .filter(segment => segment.castId === castId)
    .map(segment => ({
      offsetFrames: segment.startFrame - publishedStart,
      durationFrames: Math.max(0, segment.endFrame - segment.startFrame),
      completed: segment.completed,
    }))
    .filter(segment => segment.durationFrames > 0);
}

function comboWindowSegmentsFor(operatorId: string | null) {
  return operatorId === null
    ? []
    : comboWindowSegments.value.filter(segment => segment.operatorId === operatorId);
}

const positionedBuffsByTarget = computed(() => {
  const grouped = new Map<string, BuffTimelineSegment[]>();
  for (const segment of buffTimelineSegments.value) {
    if (
      segment.targetId === SINGLE_ENEMY_TARGET_ID &&
      (isPhysicalStatusRowBuff(segment) || !isEnemyTimelineBuffVisible(segment))
    )
      continue;
    const list = grouped.get(segment.targetId) ?? [];
    list.push(segment);
    grouped.set(segment.targetId, list);
  }
  const physical = projectPhysicalStatusDisplay(
    publishedReceiptEntries.value,
    simulationRun.value?.frame ?? 0,
  ).filter(segment => segment.targetId === SINGLE_ENEMY_TARGET_ID);
  if (physical.length && !grouped.has(SINGLE_ENEMY_TARGET_ID))
    grouped.set(SINGLE_ENEMY_TARGET_ID, []);
  const positioned = new Map<string, PositionedDisplayBuffTimelineSegment[]>();
  for (const [targetId, segments] of grouped) {
    const displaySegments = [
      ...mergeOverlappingBuffTimelineSegments(segments),
      ...(targetId === SINGLE_ENEMY_TARGET_ID ? physical : []),
    ];
    positioned.set(
      targetId,
      targetId === SINGLE_ENEMY_TARGET_ID
        ? [...layoutBuffTimelineSegments(displaySegments)]
        : [
            ...layoutBuffTimelineSegments(
              displaySegments.filter(segment => segment.placement === 'upper'),
            ),
            ...layoutBuffTimelineSegments(
              displaySegments.filter(segment => segment.placement === 'lower'),
            ),
          ],
    );
  }
  return positioned;
});

const positionedOperatorPassiveUisByTarget = computed(() => {
  const grouped = new Map<string, OperatorPassiveUiTimelineSegment[]>();
  for (const segment of operatorPassiveUiTimelineSegments.value) {
    const list = grouped.get(segment.operatorId) ?? [];
    list.push(segment);
    grouped.set(segment.operatorId, list);
  }
  const positioned = new Map<string, readonly PositionedOperatorPassiveUiTimelineSegment[]>();
  for (const [operatorId, segments] of grouped) {
    const upperBuffLaneCount = Math.max(
      0,
      ...(positionedBuffsByTarget.value.get(operatorId) ?? [])
        .filter(segment => segment.placement === 'upper')
        .map(segment => segment.lane + 1),
    );
    positioned.set(
      operatorId,
      layoutOperatorPassiveUiTimelineSegments(segments, upperBuffLaneCount),
    );
  }
  return positioned;
});

function buffSegmentsForTarget(
  targetId: string | null,
  placement?: BuffTimelineSegment['placement'],
): readonly PositionedDisplayBuffTimelineSegment[] {
  if (targetId === null) return [];
  const segments = positionedBuffsByTarget.value.get(targetId) ?? [];
  return placement === undefined
    ? segments
    : segments.filter(segment => segment.placement === placement);
}

function operatorPassiveUiSegmentsForTarget(
  targetId: string | null,
): readonly PositionedOperatorPassiveUiTimelineSegment[] {
  return targetId === null ? [] : (positionedOperatorPassiveUisByTarget.value.get(targetId) ?? []);
}

function trackEffectLayout(trackIndex: TrackIndex, targetId: string | null) {
  const laneCount = (placement: BuffTimelineSegment['placement']): number => {
    if (targetId === null || !isOperatorEffectsVisible(trackIndex)) return 0;
    const buffLaneCount = Math.max(
      0,
      ...buffSegmentsForTarget(targetId, placement).map(segment => segment.lane + 1),
    );
    return placement === 'upper'
      ? Math.max(
          buffLaneCount,
          ...operatorPassiveUiSegmentsForTarget(targetId).map(segment => segment.lane + 1),
        )
      : buffLaneCount;
  };
  return projectTimelineTrackEffectLayout({
    mode: buffLayoutMode.value,
    upperLaneCount: laneCount('upper'),
    lowerLaneCount: laneCount('lower'),
    compactHeight: displayedCompactTrackHeights.value[trackIndex],
  });
}

interface CompactTrackResizeGesture {
  readonly pointerId: number;
  readonly lease: InteractionLease;
  readonly dividerIndex: TrackIndex;
  readonly startY: number;
  readonly initialHeights: readonly number[];
  readonly initialWeights: readonly number[];
}

const compactTrackResizeGesture = ref<CompactTrackResizeGesture | null>(null);

function finishCompactTrackResize(event?: PointerEvent): void {
  if (compactTrackResizeGesture.value === null) return;
  if (event !== undefined && event.pointerId !== compactTrackResizeGesture.value.pointerId) return;
  compactTrackResizeGesture.value.lease.release();
  compactTrackResizeGesture.value = null;
  document.documentElement.classList.remove('is-track-resizing');
  window.removeEventListener('pointermove', updateCompactTrackResize);
  window.removeEventListener('pointerup', finishCompactTrackResize);
  window.removeEventListener('pointercancel', cancelCompactTrackResize);
}

function cancelCompactTrackResize(event?: PointerEvent): void {
  const gesture = compactTrackResizeGesture.value;
  if (event !== undefined && event.pointerId !== gesture?.pointerId) return;
  if (gesture !== null) compactTrackHeights.value = gesture.initialWeights;
  finishCompactTrackResize();
}

function updateCompactTrackResize(event: PointerEvent): void {
  const gesture = compactTrackResizeGesture.value;
  if (gesture === null || event.pointerId !== gesture.pointerId || !gesture.lease.isCurrent())
    return;
  compactTrackHeights.value = resizeTimelineTrackPair(
    gesture.initialHeights,
    gesture.dividerIndex,
    event.clientY - gesture.startY,
  );
}

function beginCompactTrackResize(event: PointerEvent, dividerIndex: TrackIndex): void {
  if (
    buffLayoutMode.value !== 'compact' ||
    event.button !== 0 ||
    dividerIndex >= compactTrackHeights.value.length - 1
  ) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  const lease = interactionSession.tryStart('track-resize', cancelCompactTrackResize);
  if (lease === null) return;
  compactTrackResizeGesture.value = {
    pointerId: event.pointerId,
    lease,
    dividerIndex,
    startY: event.clientY,
    initialHeights: displayedCompactTrackHeights.value,
    initialWeights: compactTrackHeights.value,
  };
  document.documentElement.classList.add('is-track-resizing');
  window.addEventListener('pointermove', updateCompactTrackResize);
  window.addEventListener('pointerup', finishCompactTrackResize);
  window.addEventListener('pointercancel', cancelCompactTrackResize);
}

function resetCompactTrackLayout(): void {
  cancelCompactTrackResize();
  compactTrackHeights.value = compactTrackHeights.value.map(() => TIMELINE_TRACK_BASE_HEIGHT);
}

function damageElementLabel(element: string): string {
  const key = `hitEditor.elements.${element}`;
  const translated = t(key);
  return translated === key ? element : translated;
}

/** 各干员元素的轨道充能曲线颜色（与旧版 gauge 的干员元素色一致）。 */
const GAUGE_ELEMENT_COLORS: Readonly<Record<string, string>> = {
  electric: '#ffec3d',
  heat: '#ff5a5f',
  cryo: '#69c0ff',
  nature: '#52c41a',
  physical: '#a5a5a8',
};

function gaugeColorFor(trackIndex: TrackIndex): string {
  const operatorSlug = viewModel.value.tracks[trackIndex]?.operatorSlug ?? null;
  const element =
    operatorSlug === null ? null : editorGameDataRepository.getOperator(operatorSlug)?.element;
  return element === undefined || element === null
    ? '#00e5ff'
    : (GAUGE_ELEMENT_COLORS[element] ?? '#00e5ff');
}

const operatorEffectsOptions = computed(() =>
  viewModel.value.tracks.flatMap(track =>
    track.operatorInstanceId === null
      ? []
      : [
          {
            trackIndex: track.trackIndex,
            name: operatorName(track.operatorSlug),
            color: gaugeColorFor(track.trackIndex),
            visible: isOperatorEffectsVisible(track.trackIndex),
          },
        ],
  ),
);
const visibleEffectTrackIndices = computed(() =>
  viewModel.value.tracks
    .filter(track => isOperatorEffectsVisible(track.trackIndex))
    .map(track => track.trackIndex),
);

function gaugeCurveFor(trackIndex: TrackIndex): OperatorUltimateEnergyCurve | null {
  const current = simulationRun.value;
  const track = viewModel.value.tracks[trackIndex];
  if (current === null || track === undefined || track.operatorInstanceId === null) return null;
  return (
    current.resourceCurves.ultimateEnergy.find(
      curve => curve.operatorId === track.operatorInstanceId,
    ) ?? null
  );
}
function reactionName(reaction: string): string {
  const key = `effects.name.${reaction}`;
  const translated = t(key);
  return translated === key ? reaction : translated;
}

function hitMarkerTitle(label: TimelineHitEffectLabel | undefined): string {
  if (label === undefined) return '';
  const parts: string[] = [];
  for (const damage of label.damage) {
    parts.push(
      `${Math.round(damage.value)}${publishedRandomMode.value === 'sampled' && damage.isCritical ? '!' : ''} ${damageElementLabel(damage.damageType)}`,
    );
  }
  for (const infliction of label.infliction) {
    parts.push(`${damageElementLabel(infliction.element)}${t('timeline.hitInflictionSuffix')}`);
  }
  for (const reaction of label.reactions) {
    const name = reactionName(reaction.reaction);
    parts.push(
      reaction.applied
        ? `${name} Lv${reaction.level}`
        : `${name}${t('timeline.hitReactionConsumed')}`,
    );
  }
  return parts.join(' · ');
}

const publishedHitOccurrences = computed(() =>
  projectTimelineHitOccurrences(publishedReceiptEntries.value),
);
const hitOccurrences = computed(
  () =>
    new Map(
      [...publishedHitOccurrences.value].filter(([id]) =>
        compatibleSkillCastReceiptIds.value.has(id),
      ),
    ),
);
function castHitMarkers(trackIndex: TrackIndex, castId: string): TimelineHitMarkerView[] {
  if (simulationRun.value !== null && !compatibleSkillCastReceiptIds.value.has(castId)) return [];
  const castModel = viewModel.value.tracks[trackIndex]?.skillCasts.find(
    candidate => candidate.id === castId,
  );
  const cast = scenario.value.tracks[trackIndex]?.skillCasts.find(
    candidate => candidate.id === castId,
  );
  if (castModel === undefined || cast === undefined) return [];
  const effects = castHitEffects.value.get(castId);
  const publishedStartFrame = skillCastActualStartFrames.value.get(castId) ?? castModel.startFrame;
  if (simulationRun.value !== null) {
    return (hitOccurrences.value.get(castId) ?? []).map(hit => ({
      stepKey: hit.stepKey,
      hitId: hit.hitId,
      executionFrame: hit.frame,
      leftPx: timelineFramePx(hit.frame) - timelineFramePx(publishedStartFrame),
      triggered: hit.triggered,
      triggeredStackIndex: hit.triggeredStackIndex,
      linkBuffed: hit.linkBuffed,
      forcedCritical: cast.simulationInputs?.criticalOverrides?.[hit.stepKey] === true,
      title: hitMarkerTitle(hit.label),
    }));
  }
  return castModel.hitMarkers
    .filter(marker =>
      shouldDisplayTimelineHitMarker(marker, simulationRun.value !== null, hitActualFrames.value),
    )
    .map(marker => ({
      stepKey: marker.stepKey,
      hitId: marker.hitId,
      leftPx:
        timelineFramePx(
          hitActualFrames.value.get(marker.hitId) ?? publishedStartFrame + marker.frameOffset,
        ) - timelineFramePx(publishedStartFrame),
      forcedCritical: cast.simulationInputs?.criticalOverrides?.[marker.stepKey] === true,
      ...(effects === undefined ? {} : { title: hitMarkerTitle(effects.get(marker.hitId)) }),
    }));
}

const hitDetailTarget = ref<{
  trackIndex: TrackIndex;
  castId: string;
  hitId: string;
  executionFrame?: number;
} | null>(null);
const enemyDamageDetailSequence = useSimulationReceiptSelection(simulationRun);
const publishedHitDetail = computed(() =>
  projectPublishedHitDetail(publishedSimulation.value, hitDetailTarget.value),
);
const enemyDamageDetailEntries = computed(() => {
  if (enemyDamageDetailSequence.value === null) return [];
  const entries = publishedReceiptEntries.value;
  return (
    layoutEnemyDamageHits(
      entries,
      buffSegmentsForTarget('enemy'),
      enemyEffectViz.value.markers,
      attachmentBuffIds,
    ).find(position =>
      position.group.some(entry => entry.sequence === enemyDamageDetailSequence.value),
    )?.group ?? []
  );
});
function enemyDamageSourceDescription(entry: CombatReceiptEntry) {
  const sourceActionId =
    typeof entry.data?.sourceActionId === 'string' ? entry.data.sourceActionId : undefined;
  const track = publishedSimulation.value?.scenario.tracks.find(
    track => track?.id === entry.sourceId,
  );
  const operatorSlug = track?.operator?.operatorSlug;
  return [
    operatorSlug ? publishedOperatorName(operatorSlug) : entry.sourceId,
    buffSourceName({ sourceActionId, sourceId: entry.sourceId }),
    typeof entry.data?.spellBurstType === 'string'
      ? t('battleLog.receiptTypes.SpellBurstApplied')
      : resolveBuffDisplayName(
          String(entry.data?.buffId ?? ''),
          { t, te },
          undefined,
          undefined,
          operatorBuffDisplayNameKeys.value,
        ),
  ]
    .filter(Boolean)
    .join(' · ');
}
function enemyDamageOperatorPanel(entry: CombatReceiptEntry) {
  return (
    simulationRun.value?.operatorPanels.find(panel => panel.operatorId === entry.sourceId) ?? null
  );
}
const hitDetail = computed(() => {
  const target = hitDetailTarget.value;
  if (target === null) return null;
  const track = scenario.value.tracks[target.trackIndex];
  const cast = track?.skillCasts.find(candidate => candidate.id === target.castId);
  if (track === null || cast === undefined || track.operator === null) return null;
  const castModel = viewModel.value.tracks[target.trackIndex]?.skillCasts.find(
    candidate => candidate.id === target.castId,
  );
  const marker =
    castModel?.hitMarkers.find(candidate => candidate.hitId === target.hitId) ??
    hitOccurrences.value
      .get(target.castId)
      ?.find(
        candidate => candidate.hitId === target.hitId && candidate.frame === target.executionFrame,
      ) ??
    null;
  if (marker === null) return null;
  return { cast, marker };
});
const hitDetailForceCritical = computed(() => {
  const detail = hitDetail.value;
  return detail?.cast.simulationInputs?.criticalOverrides?.[detail.marker.stepKey] === true;
});
const hitDetailOperatorPanel = computed(() => {
  const target = hitDetailTarget.value;
  const current = simulationRun.value;
  if (current === null) return null;
  if (target !== null) return publishedHitDetail.value?.operatorPanel ?? null;
  const operatorId = enemyDamageDetailEntries.value[0]?.sourceId;
  return current.operatorPanels.find(panel => panel.operatorId === operatorId) ?? null;
});

function hitDetailContributionSourceLabel(
  entry: Pick<OperatorPanelContributionReceipt, 'source'>,
  sequence?: number,
): string {
  const target = hitDetailTarget.value;
  const track =
    target !== null
      ? publishedHitDetail.value?.track
      : publishedSimulation.value?.scenario.tracks.find(
          track =>
            track?.id ===
            enemyDamageDetailEntries.value.find(hit => hit.sequence === sequence)?.sourceId,
        );
  const operatorSlug = track?.operator?.operatorSlug ?? null;
  return resolveOperatorPanelContributionSourceLabel(entry, {
    operator:
      operatorSlug === null || operatorSlug === undefined
        ? null
        : (publishedOperators.value.get(operatorSlug) ?? null),
    weapons: publishedWeaponSources.value,
    locale: locale.value,
    translate: t,
  });
}

function toggleHitDetailForceCritical(forced: boolean): void {
  const target = hitDetailTarget.value;
  const detail = hitDetail.value;
  if (target === null || detail === null) return;
  const changed = commitScenario('setSkillCastForcedCritical', current =>
    setSkillCastForcedCritical(
      current,
      target.trackIndex,
      target.castId,
      detail.marker.stepKey,
      forced,
    ),
  );
  if (changed) void simulateNow();
}
function formatGuideFrame(frame: number): string {
  const seconds = Math.floor(frame / PROJECT_FPS);
  return `${seconds}s${frame % PROJECT_FPS}f`;
}

const cursorGuideMetrics = computed(() => {
  const frame = cursorGuide.value?.sampleFrame ?? 0;
  let sp: string | null = null;
  let poise: string | null = null;
  let enemyHealth: string | null = null;
  const gauges: TimelineCursorGaugeRow[] = [];
  const current = simulationRun.value;
  const snapshot =
    current === null || frame > current.frame
      ? null
      : projectCombatHudSnapshot({
          frame,
          endFrame: current.frame,
          enemyHealthCurve: current.enemyHealthCurve,
          poiseCurve: current.poiseCurve,
          resourceCurves: current.resourceCurves,
          receiptEntries: publishedReceiptEntries.value,
          operatorSkillSlots: combatHudInitialSkillSlots.value,
          operatorPassiveUis: combatHudOperatorPassiveUis.value,
        });
  if (current !== null && snapshot !== null) {
    sp = String(Math.floor(Number(snapshot.sp.current) || 0));
    enemyHealth = `${Math.floor(Number(snapshot.enemy.health.current) || 0).toLocaleString()} / ${Math.floor(snapshot.enemy.health.maximum).toLocaleString()}`;
    if (snapshot.enemy.poise !== null) {
      poise = `${Math.floor(Number(snapshot.enemy.poise.current) || 0)}/${Math.floor(snapshot.enemy.poise.maximum)}`;
    }
    for (const operator of snapshot.operators) {
      const trackIndex = viewModel.value.tracks.findIndex(
        track => track.operatorInstanceId === operator.operatorId,
      );
      const track = trackIndex < 0 ? undefined : viewModel.value.tracks[trackIndex];
      if (track === undefined) continue;
      gauges.push({
        id: operator.operatorId,
        name: operatorName(track.operatorSlug),
        current: formatGuideNumber(operator.ultimateEnergy.current),
        max: formatGuideNumber(operator.ultimateEnergy.maximum),
        color: gaugeColorFor(trackIndex as TrackIndex),
        isFull:
          operator.ultimateEnergy.current !== null &&
          operator.ultimateEnergy.current >= operator.ultimateEnergy.maximum,
      });
    }
  }
  return { time: formatGuideFrame(frame), sp, poise, enemyHealth, gauges };
});

const CURSOR_EFFECT_ICON_LIMIT = 10;
const cursorEnemyEffects = computed(() => {
  const frame = cursorGuide.value?.sampleFrame ?? 0;
  const byBuffId = new Map<
    string,
    { buffId: string; title: string; icon: string | null; layers: number }
  >();
  for (const segment of buffSegmentsForTarget(SINGLE_ENEMY_TARGET_ID)) {
    if (segment.startFrame > frame || segment.endFrame <= frame) continue;
    const previous = byBuffId.get(segment.buffId);
    if (previous !== undefined && previous.layers >= segment.layers) continue;
    byBuffId.set(segment.buffId, {
      buffId: segment.buffId,
      title:
        buffDisplayName(segment) ??
        resolveBuffDisplayName(
          segment.buffId,
          { t, te },
          undefined,
          undefined,
          operatorBuffDisplayNameKeys.value,
        ),
      icon: buffIcon(segment) ?? segment.iconPath ?? getIconAssetPath(segment.iconId) ?? null,
      layers: segment.layers,
    });
  }
  const all = [...byBuffId.values()].sort((left, right) => left.buffId.localeCompare(right.buffId));
  return {
    effects: all.slice(0, CURSOR_EFFECT_ICON_LIMIT),
    overflow: Math.max(0, all.length - CURSOR_EFFECT_ICON_LIMIT),
  };
});

function publishedOperatorName(slug: string | null): string {
  if (slug === null) return t('timeline.emptyTrack');
  const metadata = publishedOperators.value.get(slug);
  return metadata?.displayName ?? getOperatorGameName(metadata?.assetSlug ?? slug, locale.value);
}

function publishedOperatorInstanceName(operatorId: string): string {
  const track = publishedSimulation.value?.scenario.tracks.find(track => track?.id === operatorId);
  const slug = track?.operator?.operatorSlug;
  return slug === undefined ? operatorId : publishedOperatorName(slug);
}

const publishedObjectIcon = computed(() =>
  createCombatObjectIconResolver(
    publishedReceiptEntries.value,
    publishedSimulation.value?.scenario,
    publishedOperators.value,
    publishedWeaponSources.value,
    publishedGearIcons.value,
    publishedGearSetIcons.value,
  ),
);

function operatorName(slug: string | null): string {
  if (slug === null) return t('timeline.emptyTrack');
  const definition = editorGameDataRepository.getOperator(slug);
  return (
    definition?.displayName ?? getOperatorGameName(definition?.assetSlug ?? slug, locale.value)
  );
}

function enemyName(enemyId: string): string {
  return getEnemyGameName(enemyId, locale.value);
}

const enemyHudName = computed(() =>
  scenario.value.enemy.source.kind === 'prefab'
    ? enemyName(scenario.value.enemy.source.enemyId)
    : t('resourceMonitor.enemy.custom'),
);

function skillName(groupKey: string, slug: string | null): string {
  if (slug === null) return groupKey;
  const definition = editorGameDataRepository.getOperator(slug);
  return getOperatorCombatSkillName(definition?.assetSlug ?? slug, groupKey, locale.value);
}

type BuffPresentationSource = {
  readonly sourceId?: string;
  readonly sourceActionId?: string;
};

function contingencyContractBuffName(segment: BuffPresentationSource): string | undefined {
  const presentation = resolveContingencyContractBuffPresentation(
    segment.sourceActionId,
    publishedSimulation.value?.scenario.mechanics.selections ?? [],
  );
  return presentation === undefined
    ? undefined
    : localizedContingencyContractTagName(presentation.tag, locale.value);
}

function buffDisplayName(segment: BuffPresentationSource): string | undefined {
  return contingencyContractBuffName(segment);
}

function buffIcon(segment: BuffPresentationSource): string | undefined {
  const source = resolvePublishedBuffSource(
    segment,
    publishedSimulation.value?.scenario,
    publishedOperators.value,
    publishedWeaponSources.value,
  );
  if (source?.kind === 'weapon') return source.iconPath;
  if (source?.kind === 'gearSet') return publishedGearSetIcons.value.get(source.slug);
  return undefined;
}

function buffSourceName(segment: BuffPresentationSource): string | undefined {
  const contractTagName = contingencyContractBuffName(segment);
  if (contractTagName !== undefined) {
    return formatContingencyContractBuffSourceName(
      t('contingencyContract.title'),
      t('contingencyContract.operationName'),
      contractTagName,
    );
  }
  const source = resolvePublishedBuffSource(
    segment,
    publishedSimulation.value?.scenario,
    publishedOperators.value,
    publishedWeaponSources.value,
  );
  if (source === undefined) return undefined;
  switch (source.kind) {
    case 'custom':
      return source.name;
    case 'skill':
      return source.slug === null
        ? source.key
        : getOperatorCombatSkillName(
            source.slug,
            source.key,
            locale.value,
            source.fallbackKey === undefined
              ? undefined
              : getOperatorCombatSkillName(source.slug, source.fallbackKey, locale.value),
          );
    case 'weapon':
      return source.name ?? getWeaponGameName(source.slug, locale.value);
    case 'gear':
      return getGearPieceGameName(source.slug, locale.value);
    case 'gearSet':
      return getGearSetGameName(source.slug, locale.value);
    case 'talent':
      return getOperatorTalentName(source.slug, source.index, 0, locale.value);
    case 'potential':
      return getOperatorPotentialName(source.slug, source.index, locale.value);
  }
}

function publishedActionPresentation(
  ownerId: string,
  actionId: string,
): { name: string; kind: string } | undefined {
  const source = resolvePublishedBuffSource(
    { sourceId: ownerId, sourceActionId: actionId },
    publishedSimulation.value?.scenario,
    publishedOperators.value,
    publishedWeaponSources.value,
    publishedGearSources.value,
  );
  if (!source) return undefined;
  const sourceName = buffSourceName({ sourceId: ownerId, sourceActionId: actionId });
  if (!sourceName) return undefined;
  let name: string = sourceName;
  if (source.kind === 'weapon') {
    const trait = resolvePublishedEquipmentTrait(source, actionId);
    if (trait)
      name += ` · ${
        trait === 'skill1' || trait === 'skill2' || trait === 'skill3'
          ? getWeaponSkillName(source.slug, trait, locale.value)
          : trait
      }`;
  }
  if (source.kind === 'gear') {
    const trait = resolvePublishedEquipmentTrait(source, actionId);
    name = source.name ?? getGearPieceGameName(source.slug, locale.value) ?? source.slug;
    if (trait)
      name += ` · ${t('objectOrigins.traitNumber', { number: source.traits!.findIndex(item => item.key === trait) + 1 })}`;
  }
  if (source.kind === 'skill' || source.kind === 'talent' || source.kind === 'potential')
    name = `${publishedOperatorInstanceName(ownerId)} · ${name}`;
  return { name, kind: t(`objectOrigins.actionKinds.${source.kind}`) };
}

function openBuffDetail(target: BuffDetailTarget): void {
  buffDetailTarget.value = target;
}

function openOperatorPassiveUiDetail(
  segment: PositionedOperatorPassiveUiTimelineSegment,
  title: string,
): void {
  passiveUiDetailSegment.value = segment;
  passiveUiDetailTitle.value = title;
}

function operatorSkillDisplayName(operatorSlug: string | null, skillKey: string): string | null {
  const nameKey = editorGameDataRepository.getOperator(operatorSlug ?? '')?.skillDisplayNameKeys?.[
    skillKey
  ];
  if (nameKey === undefined) return null;
  const translated = t(nameKey);
  return translated === nameKey ? null : translated;
}

function skillLibraryEntryName(entry: TimelineSkillLibraryEntryViewModel): string {
  const assetSlug = selectedTrackModel.value.operatorAssetSlug;
  if (assetSlug === null) return entry.placementSkillKey ?? entry.variantKey ?? entry.skillGroupKey;
  if (entry.placementSkillKey !== undefined) {
    const displayName = operatorSkillDisplayName(
      selectedTrackModel.value.operatorSlug,
      entry.placementSkillKey,
    );
    if (displayName !== null) return displayName;
    return getOperatorCombatSkillName(assetSlug, entry.placementSkillKey, locale.value);
  }
  const nameEntry =
    entry.skillType === 'finisher' || entry.skillType === 'plungingAttack'
      ? (selectedTrackModel.value.skillLibrary.find(
          candidate => candidate.skillType === 'basicAttack' && candidate.variantKey === undefined,
        ) ?? entry)
      : entry;
  return getOperatorCombatSkillName(
    assetSlug,
    nameEntry.skillGroupKey,
    locale.value,
    undefined,
    nameEntry.variantKey,
  );
}

function skillTypeLabel(skillType: string): string {
  const displayType =
    skillType === 'basicAttack'
      ? 'attack'
      : skillType === 'battleSkill'
        ? 'skill'
        : skillType === 'comboSkill'
          ? 'link'
          : skillType === 'finisher'
            ? 'execution'
            : skillType === 'plungingAttack'
              ? 'dive'
              : skillType;
  return t(`skillType.${displayType}`);
}

function skillSegmentLabels(): TimelineSkillSegmentLabels {
  return {
    heavyAttack: t('skillType.heavyAttack'),
    battleSkill: t('skillType.skill'),
    comboSkill: t('skillType.link'),
  };
}

function skillLibraryTypeLabel(entry: TimelineSkillLibraryEntryViewModel): string {
  if (entry.placementSkillKey !== undefined) {
    const displayName = operatorSkillDisplayName(
      selectedTrackModel.value.operatorSlug,
      entry.placementSkillKey,
    );
    if (displayName !== null) return displayName;
  }
  const type = skillTypeLabel(entry.skillType);
  return entry.nameQualifier === undefined
    ? type
    : t(`skillType.nameQualifier.${entry.nameQualifier}`, { type });
}

function battleReceiptEventLabel(event: string): string {
  const receiptKey = `battleLog.receiptTypes.${event}`;
  const receiptTranslated = t(receiptKey);
  if (receiptTranslated !== receiptKey) return receiptTranslated;
  const key = `battleLog.types.${event}`;
  const translated = t(key);
  return translated === key ? event : translated;
}

function timelineCastLabel(
  cast: (typeof viewModel.value.tracks)[number]['skillCasts'][number],
  track: (typeof viewModel.value.tracks)[number],
): string {
  const source = cast.source;
  if (source.kind === 'custom') return source.name;
  const entry = track.skillLibrary.find(
    candidate =>
      candidate.skillGroupKey === source.skillGroupKey &&
      candidate.skills.some(skill => skill.skillKey === source.skillKey),
  );
  const fallbackLabel = cast.skillType === null ? source.skillKey : skillTypeLabel(cast.skillType);
  return entry === undefined
    ? fallbackLabel
    : timelineSkillBlockLabel(
        entry,
        source.skillKey,
        skillSegmentLabels(),
        operatorSkillDisplayName(track.operatorSlug, source.skillKey) ?? fallbackLabel,
      );
}

const OPERATOR_ELEMENT_SKILL_COLORS: Readonly<Record<string, string>> = {
  heat: '#ff4d4f',
  cryo: '#00e5ff',
  electric: '#ffbf00',
  nature: '#52c41a',
  physical: '#e0e0e0',
};

/**
 * 照录旧版技能块配色边界：普攻、连携、处决和下落攻击由技能类型定色，
 * 战技与终结技继承干员属性色。轮廓差异仍由 TimelineActionBlock 的技能类型样式负责。
 */
function skillAccentColor(skillType: string | null, operatorSlug: string | null): string {
  const typeColor =
    skillType === 'basicAttack'
      ? '#aaaaaa'
      : skillType === 'comboSkill'
        ? '#fdd900'
        : skillType === 'finisher'
          ? '#a61d24'
          : skillType === 'plungingAttack'
            ? '#69c0ff'
            : null;
  if (typeColor !== null) return typeColor;

  const element =
    operatorSlug === null ? null : editorGameDataRepository.getOperator(operatorSlug)?.element;
  if (element !== null && element !== undefined) {
    return OPERATOR_ELEMENT_SKILL_COLORS[element] ?? '#8c8c8c';
  }
  return skillType === 'ultimate' ? '#00e5ff' : skillType === 'battleSkill' ? '#ffffff' : '#8c8c8c';
}

function skillDisplayIcon(skillType: string, operatorSlug: string | null): string {
  if (operatorSlug === null) return '';
  const operator = editorGameDataRepository.getOperator(operatorSlug);
  const assetSlug = operator?.assetSlug ?? operatorSlug;
  if (skillType === 'battleSkill' || skillType === 'comboSkill' || skillType === 'ultimate') {
    return getOperatorSkillIconPath(assetSlug, skillType) ?? '';
  }
  const weaponType = operator?.weaponType ?? 'sword';
  return getWeaponActionIconPath(weaponType);
}

function skillDurationSeconds(entry: TimelineSkillLibraryEntryViewModel): number {
  const frames = layoutSkillGroupPlacement(
    entry.skills.filter(skill => entry.groupPlacementSkillKeys.includes(skill.skillKey)),
  ).durationFrames;
  return Math.round((frames / 30) * 1000) / 1000;
}

function applyActionSelection(selection: TimelineActionSelection): void {
  if (selection.primaryId !== null) selectedLibrarySkill.value = null;
  let activeTrackIndex = timelineSelection.value.activeTrackIndex;
  const primaryId = selection.primaryId;
  if (primaryId !== null) {
    const ownerIndex = scenario.value.tracks.findIndex(track =>
      track?.skillCasts.some(cast => cast.id === primaryId),
    );
    if (ownerIndex >= 0) activeTrackIndex = ownerIndex as TrackIndex;
  }
  timelineSelection.value = selectTimelineActionsIdentity(
    timelineSelection.value,
    selection,
    activeTrackIndex,
  );
}

function clearTimelineSelection(): void {
  selectedLibrarySkill.value = null;
  timelineSelection.value = clearTimelineEditorSelection(timelineSelection.value);
}

function selectLibrarySkill(entry: TimelineSkillLibraryEntryViewModel, skillKey?: string): void {
  cancelLibraryPlacement();
  clearTimelineSelection();
  selectedLibrarySkill.value = {
    entryKey: entry.entryKey,
    ...(skillKey === undefined ? {} : { skillKey }),
  };
}

function selectedLibrarySkillName(): string {
  const entry = selectedLibraryEntry.value;
  const skillKey = selectedLibrarySkill.value?.skillKey;
  if (entry === null || skillKey === undefined) {
    return entry === null ? '' : skillLibraryEntryName(entry);
  }
  return skillName(skillKey, selectedTrackModel.value.operatorSlug);
}

function selectedLibrarySkillDurationFrames(): number {
  const entry = selectedLibraryEntry.value;
  if (entry === null) return 0;
  const skillKey = selectedLibrarySkill.value?.skillKey;
  if (skillKey !== undefined) {
    return skillPlacementDisplayFrames(
      entry.skills.find(skill => skill.skillKey === skillKey)?.timelineBlockFrames ?? 0,
    );
  }
  return layoutSkillGroupPlacement(
    entry.skills.filter(skill => entry.groupPlacementSkillKeys.includes(skill.skillKey)),
  ).durationFrames;
}

function isTrackIdentitySelected(trackIndex: TrackIndex): boolean {
  const primary = timelineSelection.value.primary;
  return primary.kind === 'track' && primary.trackIndex === trackIndex;
}

function locateBattleLogEntry(frame: number, castId: string | null): void {
  const targetFrame = Math.max(
    -scenario.value.battle.prepFrames,
    Math.min(scenario.value.battle.durationFrames, frame),
  );
  cursorFrame.value = targetFrame;
  if (castId !== null) {
    for (const track of viewModel.value.tracks) {
      if (!track.skillCasts.some(cast => cast.id === castId)) continue;
      selectedTrack.value = track.trackIndex;
      applyActionSelection(
        selectTimelineAction(createEmptyTimelineActionSelection(), castId, false),
      );
      break;
    }
  }
  void nextTick(() => {
    const viewport = timelineScroll.value;
    if (viewport === null) return;
    const targetLeft =
      TIMELINE_TRACK_HEADER_WIDTH + timelineFramePx(targetFrame) - viewport.clientWidth / 2;
    viewport.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
  });
}

function pointerInTimelineSurface(event: PointerEvent): { x: number; y: number } | null {
  const surface = timelineSurface.value;
  if (surface === null) return null;
  const rect = surface.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function updateConnectionDrag(event: PointerEvent): void {
  if (
    connectionDrag.value === null ||
    (connectionDrag.value.pointerId !== null && connectionDrag.value.pointerId !== event.pointerId)
  )
    return;
  const pointer = pointerInTimelineSurface(event);
  if (pointer === null || connectionDrag.value === null) return;
  connectionDrag.value = { ...connectionDrag.value, pointer };
}

function cancelConnectionDrag(event?: PointerEvent): void {
  if (
    event !== undefined &&
    connectionDrag.value?.pointerId !== null &&
    connectionDrag.value?.pointerId !== event.pointerId
  )
    return;
  connectionDrag.value?.lease.release();
  connectionDrag.value = null;
  window.removeEventListener('pointermove', updateConnectionDrag);
  window.removeEventListener('pointerup', finishConnectionDrag);
  window.removeEventListener('pointercancel', cancelConnectionDrag);
}

function finishConnectionDrag(event: PointerEvent): void {
  const drag = connectionDrag.value;
  if (drag === null || (drag.pointerId !== null && drag.pointerId !== event.pointerId)) return;
  const elements = document.elementsFromPoint(event.clientX, event.clientY);
  const target = elements
    .map(element =>
      element.closest<HTMLElement>('[data-connection-action-id][data-connection-port]'),
    )
    .find((element): element is HTMLElement => element !== null);
  const block = elements
    .map(element => element.closest<HTMLElement>('[data-timeline-action-id]'))
    .find((element): element is HTMLElement => element !== null);
  cancelConnectionDrag();
  const targetSkillCastId = target?.dataset.connectionActionId ?? block?.dataset.timelineActionId;
  let targetPortValue = target?.dataset.connectionPort;
  if (targetPortValue === undefined && block !== undefined) {
    const rect = block.getBoundingClientRect();
    const distances = [
      ['left', event.clientX - rect.left],
      ['right', rect.right - event.clientX],
      ['top', event.clientY - rect.top],
      ['bottom', rect.bottom - event.clientY],
    ] as const;
    targetPortValue = distances.reduce((nearest, current) =>
      current[1] < nearest[1] ? current : nearest,
    )[0];
  }
  if (targetSkillCastId === undefined || targetPortValue === undefined) return;
  if (targetSkillCastId === drag.skillCastId) return;

  if (drag.existingConnectionId !== undefined) {
    commitScenario('retargetTimelineConnection', current =>
      retargetSkillCastConnection(
        current,
        drag.existingConnectionId!,
        targetSkillCastId,
        targetPortValue as TimelineConnectionPort,
      ),
    );
    return;
  }

  commitScenario('createTimelineConnection', current =>
    createSkillCastConnection(current, {
      id: ids.allocate('connection'),
      fromSkillCastId: drag.skillCastId,
      fromPort: drag.port,
      toSkillCastId: targetSkillCastId,
      toPort: targetPortValue as TimelineConnectionPort,
    }),
  );
}

function beginConnectionDrag(
  event: PointerEvent,
  skillCastId: string,
  port: TimelineConnectionPort,
): void {
  if (!connectionToolEnabled.value || event.button !== 0) return;
  const pointer = pointerInTimelineSurface(event);
  if (pointer === null) return;
  const lease = interactionSession.tryStart('connection-drag', cancelConnectionDrag);
  if (lease === null) return;
  connectionDrag.value = { skillCastId, port, pointer, pointerId: event.pointerId, lease };
  window.addEventListener('pointermove', updateConnectionDrag);
  window.addEventListener('pointerup', finishConnectionDrag);
  window.addEventListener('pointercancel', cancelConnectionDrag);
}

function isConnectionTargetValid(targetSkillCastId: string): boolean {
  const drag = connectionDrag.value;
  return (
    drag === null ||
    canCreateSkillCastConnection(
      scenario.value,
      drag.skillCastId,
      targetSkillCastId,
      drag.existingConnectionId,
    )
  );
}

function toggleConnectionTool(): boolean {
  connectionToolEnabled.value = !connectionToolEnabled.value;
  if (!connectionToolEnabled.value) cancelConnectionDrag();
  return true;
}

function deleteTimelineConnection(connectionId: string): void {
  if (selectedConnectionId.value === connectionId) selectedConnectionId.value = null;
  if (connectionContextTarget.value?.id === connectionId) connectionContextTarget.value = null;
  commitScenario('removeTimelineConnection', current =>
    removeTimelineConnection(current, connectionId),
  );
}

function selectTimelineConnection(connectionId: string): void {
  selectedConnectionId.value = selectedConnectionId.value === connectionId ? null : connectionId;
  clearTimelineSelection();
}

function openConnectionContextMenu(event: MouseEvent, connectionId: string): void {
  selectedConnectionId.value = connectionId;
  clearTimelineSelection();
  connectionContextTarget.value = { id: connectionId, x: event.clientX, y: event.clientY };
}

function updateConnectionContextPort(side: 'from' | 'to', port: TimelineConnectionPort): void {
  const target = connectionContextTarget.value;
  if (target === null) return;
  updateSelectedCastConnection(target.id, side === 'from' ? { fromPort: port } : { toPort: port });
  connectionContextTarget.value = null;
}

function beginConnectionRetarget(event: PointerEvent, connectionId: string): void {
  if (event.button !== 0) return;
  const connection = scenario.value.connections.find(candidate => candidate.id === connectionId);
  if (connection === undefined) return;
  const pointer = pointerInTimelineSurface(event);
  if (pointer === null) return;
  const lease = interactionSession.tryStart('connection-drag', cancelConnectionDrag);
  if (lease === null) return;
  selectedConnectionId.value = connectionId;
  connectionDrag.value = {
    skillCastId: connection.from.skillCastId,
    port: connectionPort(connection.from.port, 'right'),
    existingConnectionId: connectionId,
    pointer,
    pointerId: event.pointerId,
    lease,
  };
  window.addEventListener('pointermove', updateConnectionDrag);
  window.addEventListener('pointerup', finishConnectionDrag);
  window.addEventListener('pointercancel', cancelConnectionDrag);
}

function beginSelectedCastConnection(): void {
  const selected = selectedCastModel.value;
  if (selected === null) return;
  if (connectionDrag.value !== null) {
    cancelConnectionDrag();
    return;
  }
  const block = document.querySelector<HTMLElement>(
    `[data-timeline-action-id="${CSS.escape(selected.cast.id)}"]`,
  );
  const surface = timelineSurface.value;
  if (block === null || surface === null) return;
  const blockRect = block.getBoundingClientRect();
  const surfaceRect = surface.getBoundingClientRect();
  const lease = interactionSession.tryStart('connection-drag', cancelConnectionDrag);
  if (lease === null) return;
  connectionToolEnabled.value = true;
  connectionDrag.value = {
    skillCastId: selected.cast.id,
    port: 'right',
    pointer: {
      x: blockRect.right - surfaceRect.left,
      y: blockRect.top + blockRect.height / 2 - surfaceRect.top,
    },
    pointerId: null,
    lease,
  };
  window.addEventListener('pointermove', updateConnectionDrag);
  window.addEventListener('pointerup', finishConnectionDrag);
  window.addEventListener('pointercancel', cancelConnectionDrag);
}

function updateSelectedCastConnection(
  connectionId: string,
  patch: UpdateTimelineConnectionInput,
): void {
  commitScenario('updateTimelineConnection', current =>
    updateTimelineConnection(current, connectionId, patch),
  );
}

function handleActionSelection(event: MouseEvent, skillCastId: string): void {
  if (consumeCastClick(skillCastId)) return;
  selectedConnectionId.value = null;
  connectionContextTarget.value = null;
  selectedConsumableUseId.value = null;
  applyActionSelection(
    selectTimelineAction(actionSelection.value, skillCastId, event.ctrlKey || event.metaKey),
  );
}

function skillSegments(entry: TimelineSkillLibraryEntryViewModel) {
  return entry.skills.map(skill => ({
    id: skill.skillKey,
    label:
      skillLibrarySegmentLabel(entry, skill.skillKey, skillSegmentLabels()) ??
      skillName(skill.skillKey, selectedTrackModel.value.operatorSlug),
    selected:
      (libraryPlacement.value?.entryKey === entry.entryKey &&
        libraryPlacement.value?.skillKey === skill.skillKey) ||
      (selectedLibrarySkill.value?.entryKey === entry.entryKey &&
        selectedLibrarySkill.value?.skillKey === skill.skillKey),
    disabled: false,
  }));
}

function selectTimelinePosition(event: MouseEvent): void {
  const lane = event.currentTarget as HTMLElement;
  cursorFrame.value = Math.max(
    -scenario.value.battle.prepFrames,
    Math.min(
      scenario.value.battle.durationFrames,
      timelinePointerActualFrame(event.clientX - lane.getBoundingClientRect().left),
    ),
  );
  clearTimelineSelection();
  selectedConsumableUseId.value = null;
}

function seekTimeline(frame: number): void {
  cursorFrame.value = frame;
  clearTimelineSelection();
  selectedConnectionId.value = null;
  selectedConsumableUseId.value = null;
}

const { marqueeStyle, beginMarqueeGesture, consumeLaneClickSuppression } =
  useTimelineMarqueeGesture({
    interactionSession,
    surface: timelineSurface,
    getSelection: () => actionSelection.value,
    applySelection: applyActionSelection,
  });
const { isPanning, beginViewportPan } = useTimelineViewportPan({
  viewport: timelineScroll,
  interactionSession,
  verticalPanEnabled: () => buffLayoutMode.value !== 'compact',
});

function captureLibraryPlacementPointerDown(event: PointerEvent): void {
  if (libraryPlacement.value !== null) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
}

function handleTimelineLanePointerDown(event: PointerEvent): void {
  if (beginViewportPan(event)) return;
  if (boxSelectEnabled.value) {
    beginMarqueeGesture(event, false);
    return;
  }
  if (event.ctrlKey || event.metaKey) beginMarqueeGesture(event, true);
}

function openConsumableSelectionFromContext(): void {
  const target = markerContextTarget.value;
  if (target === null || target.existing !== undefined) return;
  const track = scenario.value.tracks[target.trackIndex];
  if (track === null || track.operator === null) return;
  consumableDialogTarget.value = { trackIndex: target.trackIndex, frame: target.frame };
  markerContextTarget.value = null;
}

function addConsumableFromDialog(consumableId: string): void {
  const target = consumableDialogTarget.value;
  if (target === null) return;
  const id = ids.allocate('consumableUse');
  commitScenario('placeConsumableUse', current => ({
    ...current,
    tracks: current.tracks.map((track, index) =>
      index !== target.trackIndex || track === null
        ? track
        : {
            ...track,
            consumableUses: [
              ...(track.consumableUses ?? []),
              { id, frame: target.frame, consumableId },
            ],
          },
    ) as typeof current.tracks,
  }));
  consumableDialogTarget.value = null;
  selectedTrack.value = target.trackIndex;
  selectedConsumableUseId.value = id;
  clearTimelineSelection();
}

function updateSelectedConsumableUse(patch: { frame?: number; consumableId?: string }): void {
  const selected = selectedConsumableUse.value;
  if (selected === null) return;
  commitScenario('updateConsumableUse', current => ({
    ...current,
    tracks: current.tracks.map((track, index) =>
      index !== selected.trackIndex || track === null
        ? track
        : {
            ...track,
            consumableUses: (track.consumableUses ?? []).map(use =>
              use.id === selected.use.id ? { ...use, ...patch } : use,
            ),
          },
    ) as typeof current.tracks,
  }));
}

function setSelectedConsumableId(value: EaSelectValue | EaSelectValue[]): void {
  if (typeof value === 'string') updateSelectedConsumableUse({ consumableId: value });
}

function setSelectedConsumableFrame(value: number | undefined): void {
  if (!Number.isInteger(value)) return;
  updateSelectedConsumableUse({
    frame: Math.max(
      minimumEditableInputFrame.value,
      Math.min(scenario.value.battle.durationFrames, value!),
    ),
  });
}

function removeSelectedConsumableUse(): void {
  const selected = selectedConsumableUse.value;
  if (selected === null) return;
  commitScenario('removeConsumableUse', current => ({
    ...current,
    tracks: current.tracks.map((track, index) =>
      index !== selected.trackIndex || track === null
        ? track
        : {
            ...track,
            consumableUses: (track.consumableUses ?? []).filter(use => use.id !== selected.use.id),
          },
    ) as typeof current.tracks,
  }));
  selectedConsumableUseId.value = null;
}

function displayedConsumableUseFrame(useId: string, frame: number): number {
  const gesture = consumableMoveGesture.value;
  return gesture?.useId === useId ? gesture.previewFrame : frame;
}

function beginConsumableUseMove(
  event: PointerEvent,
  trackIndex: TrackIndex,
  useId: string,
  frame: number,
): void {
  if (event.button !== 0 || interactionSession.current !== null) return;
  const surface = timelineSurface.value;
  if (surface === null) return;
  event.preventDefault();
  event.stopPropagation();
  selectedTrack.value = trackIndex;
  clearTimelineSelection();
  selectedConsumableUseId.value = useId;
  if (isHistoricalInputFrame(frame)) return;
  const lease = interactionSession.tryStart('consumable-use-move', () => {
    consumableMoveGesture.value = null;
  });
  if (lease === null) return;
  const grabOffsetPx =
    event.clientX -
    surface.getBoundingClientRect().left -
    TIMELINE_TRACK_HEADER_WIDTH -
    timelineFramePx(frame);
  consumableMoveGesture.value = {
    pointerId: event.pointerId,
    trackIndex,
    useId,
    initialPointerX: event.clientX,
    initialPointerY: event.clientY,
    initialFrame: frame,
    previewFrame: frame,
    dragStarted: false,
  };
  const move = (moveEvent: PointerEvent) => {
    const gesture = consumableMoveGesture.value;
    if (gesture === null || moveEvent.pointerId !== gesture.pointerId) return;
    const dragStarted =
      gesture.dragStarted ||
      passedTimelineDragThreshold(
        gesture.initialPointerX,
        gesture.initialPointerY,
        moveEvent.clientX,
        moveEvent.clientY,
      );
    consumableMoveGesture.value = {
      ...gesture,
      dragStarted,
      previewFrame: dragStarted
        ? pointerMarkerFrame(moveEvent.clientX, grabOffsetPx, -scenario.value.battle.prepFrames)
        : gesture.initialFrame,
    };
  };
  const cleanup = () => {
    lease.release();
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', finish);
    window.removeEventListener('pointercancel', cancel);
  };
  const finish = (finishEvent: PointerEvent) => {
    move(finishEvent);
    const gesture = consumableMoveGesture.value;
    if (gesture === null || finishEvent.pointerId !== gesture.pointerId) return;
    consumableMoveGesture.value = null;
    cleanup();
    if (gesture.dragStarted && gesture.previewFrame !== gesture.initialFrame) {
      updateSelectedConsumableUse({ frame: gesture.previewFrame });
    }
  };
  const cancel = (cancelEvent: PointerEvent) => {
    if (cancelEvent.pointerId !== consumableMoveGesture.value?.pointerId) return;
    consumableMoveGesture.value = null;
    cleanup();
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', finish);
  window.addEventListener('pointercancel', cancel);
}

function handleTimelineLaneClick(event: MouseEvent): void {
  if (consumeLaneClickSuppression()) return;
  selectTimelinePosition(event);
}

function pointerMarkerFrame(clientX: number, grabOffsetPx = 0, minimumFrame = 0): number {
  const surface = timelineSurface.value;
  if (surface === null) return cursorFrame.value;
  return resolveTimelineMarkerPointerFrame({
    clientX,
    grabOffsetPx,
    surfaceLeftPx: surface.getBoundingClientRect().left,
    trackHeaderWidthPx: TIMELINE_TRACK_HEADER_WIDTH,
    pxPerFrame: pxPerFrame.value,
    prepFrames: scenario.value.battle.prepFrames,
    prepEndFrame: scenario.value.inheritance?.frame ?? 0,
    snapFrames: snapFrames.value,
    maximumFrame: scenario.value.battle.durationFrames,
    minimumFrame: Math.max(minimumFrame, minimumEditableInputFrame.value),
    prepExpanded: scenario.value.editor.prepExpanded,
  });
}

function openMarkerContextMenu(event: MouseEvent, trackIndex: TrackIndex): void {
  if (libraryPlacement.value !== null) {
    event.preventDefault();
    event.stopPropagation();
    cancelLibraryPlacement();
    return;
  }
  if ((event.target as HTMLElement).closest('.timeline-action-block, .timeline-marker')) return;
  event.preventDefault();
  markerContextTarget.value = {
    x: event.clientX,
    y: event.clientY,
    frame: pointerMarkerFrame(event.clientX, 0, -scenario.value.battle.prepFrames),
    trackIndex,
  };
  contextMenuTarget.value = null;
}

function openExistingConsumableContextMenu(
  event: MouseEvent,
  trackIndex: TrackIndex,
  useId: string,
  frame: number,
  label: string,
): void {
  event.preventDefault();
  event.stopPropagation();
  selectedTrack.value = trackIndex;
  selectedConsumableUseId.value = useId;
  clearTimelineSelection();
  markerContextTarget.value = {
    x: event.clientX,
    y: event.clientY,
    frame,
    trackIndex,
    existing: { kind: 'consumableUse', id: useId, label },
  };
  contextMenuTarget.value = null;
}

function cancelPlacementFromContextMenu(event: MouseEvent): void {
  if (libraryPlacement.value === null) return;
  event.preventDefault();
  event.stopPropagation();
  cancelLibraryPlacementWithFeedback();
}

function openExistingMarkerContextMenu(
  event: MouseEvent,
  kind: TimelineMarkerKind,
  id: string,
  frame: number,
  trackIndex: TrackIndex,
  label: string,
): void {
  event.preventDefault();
  event.stopPropagation();
  markerContextTarget.value = {
    x: event.clientX,
    y: event.clientY,
    frame,
    trackIndex,
    existing: { kind, id, label },
  };
}

const creatingInheritedScenario = ref(false);
async function inheritFromContext(): Promise<void> {
  const target = markerContextTarget.value;
  if (target?.existing?.kind !== 'cycleBoundary' || creatingInheritedScenario.value) return;
  const boundary = scenario.value.battle.cycleBoundaries.find(
    item => item.id === target.existing?.id,
  );
  if (boundary === undefined) return;
  const project = projectSession.snapshot.project;
  if (project.scenarios.length >= MAX_PROJECT_SCENARIOS) return;
  const source = scenario.value;
  const revision = projectRevision.value;
  const frame = boundary.frame;
  markerContextTarget.value = null;
  creatingInheritedScenario.value = true;
  const loading = ElLoading.service({ text: t('inheritance.createHere'), lock: true });
  try {
    const result = await simulationService.simulate(source, source.battle.durationFrames);
    if (projectRevision.value !== revision) {
      ElMessage.warning(t('inheritance.changed'));
      return;
    }
    const frames = new Map<string, number>();
    for (const entry of result.receiptEntries) {
      if (entry.event === 'SkillInputProcessed' && typeof entry.data?.castId === 'string')
        frames.set(entry.data.castId, entry.frame);
    }
    const inherited = createInheritedScenario(source, {
      id: allocateScenarioId(project),
      name: t('inheritance.name', { name: source.name }),
      frame,
      resolveSkillFrame: (document, id) => (document === source ? frames.get(id) : undefined),
    });
    projectSession.commit('inheritScenario', current => ({
      ...current,
      activeScenarioId: inherited.id,
      scenarios: [...current.scenarios, inherited],
    }));
    ElMessage.success(t('inheritance.created'));
  } catch (error) {
    ElMessage.error(
      `${t('inheritance.failed')}: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    creatingInheritedScenario.value = false;
    loading.close();
  }
}

function addMarkerFromContext(
  kind: 'cycle' | 'simulationStart' | 'simulationEnd' | 'comboCooldown' | 'comboReady',
): void {
  const target = markerContextTarget.value;
  if (target === null || target.existing !== undefined) return;
  const battleFrame = Math.max(0, target.frame);
  if (kind === 'cycle') {
    commitScenario('addCycleBoundary', current =>
      addCycleBoundary(current, ids.allocate('cycleBoundary'), battleFrame),
    );
  } else if (kind === 'simulationStart' || kind === 'simulationEnd') {
    const boundary = kind === 'simulationStart' ? 'start' : 'end';
    const hasBoundary = scenario.value.battle.simulationRange?.[`${boundary}Frame`] !== undefined;
    commitScenario(
      hasBoundary ? 'clearSimulationRangeBoundary' : 'setSimulationRangeBoundary',
      current =>
        hasBoundary
          ? clearSimulationRangeBoundary(current, boundary)
          : setSimulationRangeBoundary(current, boundary, battleFrame),
    );
  } else {
    const event: ExternalCombatEventDocument = {
      kind: 'comboCooldownControl',
      mode: kind === 'comboReady' ? 'ready' : 'cooldown',
    };
    const eventTarget = { scope: 'team' } as const;
    commitScenario('addExternalEventMarker', current =>
      addExternalEventMarker(
        current,
        ids.allocate('externalEvent'),
        battleFrame,
        eventTarget,
        event,
      ),
    );
  }
  markerContextTarget.value = null;
}

function addSwitchMarkerFromContext(trackIndex: number): void {
  const target = markerContextTarget.value;
  if (target === null || target.existing !== undefined) return;
  commitScenario('addControlSwitch', current =>
    addControlSwitch(
      current,
      ids.allocate('controlSwitch'),
      Math.max(0, target.frame),
      trackIndex as TrackIndex,
    ),
  );
  markerContextTarget.value = null;
}

function skillLibraryCardName(entry: TimelineSkillLibraryEntryViewModel): string {
  return skillLibraryEntryName(skillLibraryNameEntry(entry, selectedTrackModel.value.skillLibrary));
}

function addDodgeMarkerFromContext(mode: 'dodge' | 'perfectDodge'): void {
  const target = markerContextTarget.value;
  if (target === null || target.existing !== undefined) return;
  commitScenario('addDodgeMarker', current =>
    addDodgeMarker(current, {
      id: ids.allocate('dodge'),
      frame: target.frame,
      trackIndex: target.trackIndex,
      direction: 'forward',
      mode:
        mode === 'perfectDodge'
          ? { kind: 'perfectDodge', successDelayFrames: 0 }
          : { kind: 'dodge' },
    }),
  );
  markerContextTarget.value = null;
}

function setDodgeMarkerMode(id: string, mode: 'dodge' | 'perfectDodge'): void {
  const marker = (scenario.value.battle.dodgeMarkers ?? []).find(item => item.id === id);
  if (marker === undefined || marker.mode.kind === mode) return;
  const successDelayFrames = Math.max(
    0,
    (scenario.value.inheritance?.frame ?? marker.frame) - marker.frame,
  );
  commitScenario('updateDodgeMarker', current =>
    updateDodgeMarker(current, id, {
      mode: mode === 'perfectDodge' ? { kind: mode, successDelayFrames } : { kind: mode },
    }),
  );
}

function setDodgeMarkerModeFromContext(mode: 'dodge' | 'perfectDodge'): void {
  const existing = markerContextTarget.value?.existing;
  if (existing?.kind !== 'dodge') return;
  setDodgeMarkerMode(existing.id, mode);
  markerContextTarget.value = null;
}

function copyDodgeMarkerFromContext(): void {
  const existing = markerContextTarget.value?.existing;
  if (existing?.kind !== 'dodge') return;
  timelineClipboard.value = copyTimelineDodgeMarker(scenario.value, existing.id);
  markerContextTarget.value = null;
}

function removeSelectedMarker(kind: TimelineMarkerKind, id: string): boolean {
  const changed = commitScenario('removeTimelineMarker', current =>
    kind === 'cycleBoundary'
      ? removeCycleBoundary(current, id)
      : kind === 'controlSwitch'
        ? removeControlSwitch(current, id)
        : kind === 'externalEvent'
          ? removeExternalEventMarker(current, id)
          : kind === 'dodge'
            ? removeDodgeMarker(current, id)
            : clearSimulationRangeBoundary(current, kind === 'simulationStart' ? 'start' : 'end'),
  );
  if (changed) selectedMarker.value = null;
  return changed;
}

function removeMarkerFromContext(): void {
  const existing = markerContextTarget.value?.existing;
  if (existing === undefined) return;
  if (existing.kind === 'consumableUse') {
    selectedConsumableUseId.value = existing.id;
    removeSelectedConsumableUse();
  } else {
    removeSelectedMarker(existing.kind, existing.id);
  }
  markerContextTarget.value = null;
}

function setSelectedExternalEventFrame(frame: number): void {
  const marker = selectedExternalEventMarker.value;
  if (marker === null) return;
  commitScenario('moveExternalEventMarker', current =>
    moveExternalEventMarker(current, marker.id, frame),
  );
}

function removeSelectedExternalEvent(): void {
  const marker = selectedExternalEventMarker.value;
  if (marker !== null) removeSelectedMarker('externalEvent', marker.id);
}

function setSelectedDocumentMarkerFrame(frame: number): void {
  const marker = selectedDocumentMarker.value;
  if (marker === null) return;
  commitScenario('moveTimelineMarker', current =>
    marker.kind === 'cycleBoundary'
      ? moveCycleBoundary(current, marker.id, frame)
      : marker.kind === 'controlSwitch'
        ? moveControlSwitch(current, marker.id, frame)
        : marker.kind === 'dodge'
          ? moveDodgeMarker(current, marker.id, frame)
          : setSimulationRangeBoundary(
              current,
              marker.kind === 'simulationStart' ? 'start' : 'end',
              frame,
            ),
  );
}

function setTimelinePrepFrames(frames: number): void {
  commitScenario('setBattlePrepFrames', current => setBattlePrepFrames(current, frames));
}

function setPrepExpanded(expanded: boolean): void {
  commitScenario('setTimelinePrepExpanded', current => setTimelinePrepExpanded(current, expanded));
  if (scenario.value.inheritance) void nextTick(locateInheritanceBoundary);
}

function beginTimelinePrepResize(event: PointerEvent): void {
  if (scenario.value.inheritance) {
    beginInheritedHistoryResize(event);
    return;
  }
  if (configurationReadOnly.value) return;
  if (!scenario.value.editor.prepExpanded) return;
  if (event.button !== 0) return;
  const surface = timelineSurface.value;
  if (surface === null) return;
  event.preventDefault();
  event.stopPropagation();
  const lease = interactionSession.tryStart('timeline-prep-resize', () =>
    stopTimelinePrepResize?.(),
  );
  if (lease === null) return;
  const update = (moveEvent: PointerEvent) => {
    if (moveEvent.pointerId !== event.pointerId) return;
    const localPx =
      moveEvent.clientX - surface.getBoundingClientRect().left - TIMELINE_TRACK_HEADER_WIDTH;
    const frame = Math.max(
      0,
      Math.round(localPx / pxPerFrame.value / snapFrames.value) * snapFrames.value,
    );
    timelinePrepPreviewFrames.value = frame;
  };
  const teardownPrepResize = () => {
    lease.release();
    window.removeEventListener('pointermove', update);
    window.removeEventListener('pointerup', finishPrepResize);
    window.removeEventListener('pointercancel', cancelPrepResize);
    stopTimelinePrepResize = null;
  };
  const finishPrepResize = (finishEvent: PointerEvent) => {
    if (finishEvent.pointerId !== event.pointerId) return;
    const frames = timelinePrepPreviewFrames.value;
    teardownPrepResize();
    if (frames !== null && frames !== scenario.value.battle.prepFrames) {
      setTimelinePrepFrames(frames);
    }
    timelinePrepPreviewFrames.value = null;
  };
  const cancelPrepResize = (cancelEvent?: PointerEvent) => {
    if (cancelEvent !== undefined && cancelEvent.pointerId !== event.pointerId) return;
    teardownPrepResize();
    timelinePrepPreviewFrames.value = null;
  };
  stopTimelinePrepResize = cancelPrepResize;
  timelinePrepPreviewFrames.value = scenario.value.battle.prepFrames;
  window.addEventListener('pointermove', update);
  window.addEventListener('pointerup', finishPrepResize);
  window.addEventListener('pointercancel', cancelPrepResize);
}

onScopeDispose(() => stopTimelinePrepResize?.());

/** 拖动继承分界只调整可见历史宽度，继承帧与已冻结输入保持不变。 */
function beginInheritedHistoryResize(event: PointerEvent): void {
  const viewport = timelineScroll.value;
  if (viewport === null || event.button !== 0 || !scenario.value.editor.prepExpanded) return;
  event.preventDefault();
  event.stopPropagation();
  const lease = interactionSession.tryStart('timeline-prep-resize', () =>
    stopTimelinePrepResize?.(),
  );
  if (lease === null) return;
  const originX = event.clientX;
  const originScroll = viewport.scrollLeft;
  const move = (next: PointerEvent) => {
    if (next.pointerId !== event.pointerId) return;
    viewport.scrollLeft = Math.max(0, originScroll + originX - next.clientX);
    updateTimelineViewportMetrics();
  };
  const cleanup = () => {
    lease.release();
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', finish);
    window.removeEventListener('pointercancel', cancel);
    stopTimelinePrepResize = null;
  };
  const finish = (next: PointerEvent) => {
    if (next.pointerId === event.pointerId) cleanup();
  };
  const cancel = () => {
    viewport.scrollLeft = originScroll;
    updateTimelineViewportMetrics();
    cleanup();
  };
  stopTimelinePrepResize = cancel;
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', finish);
  window.addEventListener('pointercancel', cancel);
}

function setTimelineDurationFrames(frames: number): void {
  const boundedFrames = Math.max(PROJECT_FPS * 30, Math.min(PROJECT_FPS * 600, frames));
  commitScenario('setBattleDurationFrames', current =>
    setBattleDurationFrames(current, boundedFrames),
  );
}

function setSelectedControlSwitchTrack(trackIndex: TrackIndex): void {
  const marker = selectedDocumentMarker.value;
  if (marker?.kind !== 'controlSwitch') return;
  commitScenario('setControlSwitchTrack', current =>
    setControlSwitchTrack(current, marker.id, trackIndex),
  );
}

function updateSelectedDodgeMarker(patch: Parameters<typeof updateDodgeMarker>[2]): void {
  const marker = selectedDocumentMarker.value;
  if (marker?.kind !== 'dodge') return;
  commitScenario('updateDodgeMarker', current => updateDodgeMarker(current, marker.id, patch));
}

function setSelectedDodgeTrack(trackIndex: TrackIndex): void {
  updateSelectedDodgeMarker({ trackIndex });
}

function setSelectedDodgeDirection(direction: 'forward' | 'backward'): void {
  updateSelectedDodgeMarker({ direction });
}

function setSelectedDodgeMode(mode: 'dodge' | 'perfectDodge'): void {
  const marker = selectedDocumentMarker.value;
  if (marker?.kind !== 'dodge') return;
  setDodgeMarkerMode(marker.id, mode);
}

function setSelectedDodgeSuccessDelayFrames(successDelayFrames: number): void {
  updateSelectedDodgeMarker({ mode: { kind: 'perfectDodge', successDelayFrames } });
}

function removeSelectedDocumentMarker(): void {
  const marker = selectedDocumentMarker.value;
  if (marker !== null) removeSelectedMarker(marker.kind, marker.id);
}

function displayedMarkerFrame(kind: TimelineMarkerKind, id: string, frame: number): number {
  const gesture = markerMoveGesture.value;
  return gesture?.kind === kind && gesture.id === id ? gesture.previewFrame : frame;
}

function isHistoricalInputFrame(frame: number): boolean {
  const boundary = scenario.value.inheritance?.frame;
  return boundary !== undefined && frame < boundary;
}

function isHistoricalSkillInput(id: string): boolean {
  for (const track of scenario.value.tracks) {
    if (track?.skillCasts.some(cast => cast.id === id))
      return isHistoricalInputFrame(
        getSkillCastPlacementAnchor(track.skillCasts, id).placement.startFrame!,
      );
  }
  return false;
}

function beginMarkerMove(
  event: PointerEvent,
  kind: TimelineMarkerKind,
  id: string,
  frame: number,
  trackIndex: TrackIndex = selectedTrack.value,
): void {
  if (event.button !== 0) return;
  if (interactionSession.current !== null) return;
  event.preventDefault();
  event.stopPropagation();
  stopMarkerMove?.();
  if (trackIndex !== selectedTrack.value) selectedTrack.value = trackIndex;
  if (
    (kind === 'simulationStart' && configurationReadOnly.value) ||
    ((kind === 'controlSwitch' || kind === 'externalEvent' || kind === 'dodge') &&
      isHistoricalInputFrame(frame))
  ) {
    clearTimelineSelection();
    selectedMarker.value = { kind, id };
    return;
  }
  const surface = timelineSurface.value;
  if (surface === null) return;
  const lease = interactionSession.tryStart('marker-move', () => stopMarkerMove?.())!;
  const grabOffsetPx =
    event.clientX -
    surface.getBoundingClientRect().left -
    TIMELINE_TRACK_HEADER_WIDTH -
    timelineFramePx(frame);
  const wasComboControlSelected =
    selectedMarker.value?.kind === kind &&
    selectedMarker.value.id === id &&
    selectedExternalEventMarker.value?.event.kind === 'comboCooldownControl';
  clearTimelineSelection();
  selectedMarker.value = { kind, id };
  markerMoveGesture.value = {
    pointerId: event.pointerId,
    initialPointerX: event.clientX,
    initialPointerY: event.clientY,
    latestPointerX: event.clientX,
    latestPointerY: event.clientY,
    dragStarted: false,
    kind,
    id,
    initialFrame: frame,
    previewFrame: frame,
    baseScenario: scenario.value,
  };
  if (kind === 'dodge') simulationService.beginInteractiveSession();
  const update = (pointerId: number, clientX: number, clientY: number, fromAutoScroll = false) => {
    let gesture = markerMoveGesture.value;
    if (gesture === null || gesture.pointerId !== pointerId) return;
    if (!fromAutoScroll) {
      gesture = { ...gesture, latestPointerX: clientX, latestPointerY: clientY };
      markerMoveGesture.value = gesture;
    }
    if (
      !gesture.dragStarted &&
      !passedTimelineDragThreshold(
        gesture.initialPointerX,
        gesture.initialPointerY,
        clientX,
        clientY,
      )
    ) {
      return;
    }
    if (!fromAutoScroll) scheduleMarkerMoveAutoScroll(update);
    const previewFrame = pointerMarkerFrame(
      clientX,
      grabOffsetPx,
      kind === 'dodge'
        ? (scenario.value.inheritance?.frame ?? -scenario.value.battle.prepFrames)
        : kind === 'controlSwitch'
          ? -scenario.value.battle.prepFrames
          : 0,
    );
    if (previewFrame === gesture.previewFrame) return;
    markerMoveGesture.value = {
      ...gesture,
      dragStarted: true,
      previewFrame,
    };
    if (kind === 'dodge') {
      scenario.value = moveDodgeMarker(gesture.baseScenario, id, previewFrame);
    }
  };
  const move = (moveEvent: PointerEvent) =>
    update(moveEvent.pointerId, moveEvent.clientX, moveEvent.clientY);
  const cleanup = () => {
    if (kind === 'dodge') simulationService.endInteractiveSession();
    lease.release();
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', finish);
    window.removeEventListener('pointercancel', cancel);
    if (markerMoveAutoScrollFrame !== null) cancelAnimationFrame(markerMoveAutoScrollFrame);
    markerMoveAutoScrollFrame = null;
    stopMarkerMove = null;
  };
  const cancel = (cancelEvent?: PointerEvent) => {
    const gesture = markerMoveGesture.value;
    if (cancelEvent !== undefined && gesture?.pointerId !== cancelEvent.pointerId) return;
    if (gesture?.kind === 'dodge') scenario.value = gesture.baseScenario;
    markerMoveGesture.value = null;
    cleanup();
  };
  const finish = (finishEvent: PointerEvent) => {
    update(finishEvent.pointerId, finishEvent.clientX, finishEvent.clientY);
    const gesture = markerMoveGesture.value;
    if (gesture === null || gesture.pointerId !== finishEvent.pointerId) return;
    markerMoveGesture.value = null;
    cleanup();
    if (!gesture.dragStarted && wasComboControlSelected) clearTimelineSelection();
    if (gesture.kind === 'dodge') scenario.value = gesture.baseScenario;
    if (gesture.previewFrame === gesture.initialFrame) return;
    commitScenario('moveTimelineMarker', current =>
      gesture.kind === 'cycleBoundary'
        ? moveCycleBoundary(current, gesture.id, gesture.previewFrame)
        : gesture.kind === 'controlSwitch'
          ? moveControlSwitch(current, gesture.id, gesture.previewFrame)
          : gesture.kind === 'externalEvent'
            ? moveExternalEventMarker(current, gesture.id, gesture.previewFrame)
            : gesture.kind === 'dodge'
              ? moveDodgeMarker(current, gesture.id, gesture.previewFrame)
              : setSimulationRangeBoundary(
                  current,
                  gesture.kind === 'simulationStart' ? 'start' : 'end',
                  gesture.previewFrame,
                ),
    );
  };
  stopMarkerMove = cancel;
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', finish);
  window.addEventListener('pointercancel', cancel);
}

function scheduleMarkerMoveAutoScroll(
  update: (pointerId: number, clientX: number, clientY: number, fromAutoScroll?: boolean) => void,
): void {
  if (markerMoveAutoScrollFrame !== null) return;
  const tick = () => {
    markerMoveAutoScrollFrame = null;
    const gesture = markerMoveGesture.value;
    const viewport = timelineScroll.value;
    if (gesture === null || viewport === null || !gesture.dragStarted) return;
    const rect = viewport.getBoundingClientRect();
    const delta = projectTimelineEdgeAutoScrollDelta({
      pointerX: gesture.latestPointerX,
      pointerY: gesture.latestPointerY,
      left: rect.left + TIMELINE_TRACK_HEADER_WIDTH,
      right: rect.right,
      top: rect.top + TIMELINE_RULER_HEIGHT,
      bottom: rect.bottom,
    });
    if (delta.x === 0) return;
    const previousLeft = viewport.scrollLeft;
    viewport.scrollLeft += delta.x;
    if (viewport.scrollLeft === previousLeft) return;
    update(gesture.pointerId, gesture.latestPointerX, gesture.latestPointerY, true);
    markerMoveAutoScrollFrame = requestAnimationFrame(tick);
  };
  markerMoveAutoScrollFrame = requestAnimationFrame(tick);
}

function updateCursorGuide(event: MouseEvent): void {
  const surface = timelineSurface.value;
  if (surface === null) {
    timelinePointerClientX.value = null;
    cursorGuide.value = null;
    return;
  }
  const surfaceRect = surface.getBoundingClientRect();
  timelinePointerClientX.value =
    event.clientX >= surfaceRect.left + TIMELINE_TRACK_HEADER_WIDTH &&
    event.clientY >= surfaceRect.top + TIMELINE_RULER_HEIGHT
      ? event.clientX
      : null;
  if (!showCursorGuide.value) {
    cursorGuide.value = null;
    return;
  }
  if (event.clientY < surfaceRect.top + TIMELINE_RULER_HEIGHT) {
    cursorGuide.value = null;
    return;
  }
  const pointerPx = event.clientX - surfaceRect.left - TIMELINE_TRACK_HEADER_WIDTH;
  const guide = resolveTimelineCursorGuidePosition(
    pointerPx,
    scenario.value.battle.prepFrames,
    scenario.value.battle.durationFrames,
    pxPerFrame.value,
    scenario.value.editor.prepExpanded,
    scenario.value.inheritance?.frame ?? 0,
  );
  cursorGuide.value = {
    ...guide,
  };
}

function hideCursorGuide(): void {
  timelinePointerClientX.value = null;
  cursorGuide.value = null;
}

function beginLibraryPlacement(entry: TimelineSkillLibraryEntryViewModel, skillKey?: string): void {
  if (libraryPlacementLease === null) {
    libraryPlacementLease = interactionSession.tryStart(
      'library-placement',
      cancelLibraryPlacement,
      { blocksKeyboard: false },
    );
    if (libraryPlacementLease === null) return;
  }
  skillPlacementTransaction.cancel();
  const placedSkillKey = skillKey ?? entry.placementSkillKey;
  libraryPlacement.value = {
    entryKey: entry.entryKey,
    skillGroupKey: entry.skillGroupKey,
    skillType: entry.skillType,
    ...(entry.variantKey === undefined ? {} : { variantKey: entry.variantKey }),
    ...(placedSkillKey === undefined ? {} : { skillKey: placedSkillKey }),
  };
  clearTimelineSelection();
}

function cancelLibraryPlacement(): boolean {
  libraryPlacementLease?.release();
  libraryPlacementLease = null;
  const cancelledPending = skillPlacementTransaction.cancel();
  if (libraryPlacement.value === null) return cancelledPending;
  libraryPlacement.value = null;
  return true;
}

function libraryEntrySelected(entry: TimelineSkillLibraryEntryViewModel): boolean {
  const drag = dragPayload.value;
  if (drag?.kind === 'librarySkill' && drag.entryKey === entry.entryKey) {
    return true;
  }
  const placement = libraryPlacement.value;
  return (
    (placement !== null && placement.entryKey === entry.entryKey) ||
    selectedLibrarySkill.value?.entryKey === entry.entryKey
  );
}

function placePendingLibrarySkill(event: PointerEvent, trackIndex: TrackIndex): boolean {
  const placement = libraryPlacement.value;
  if (placement === null || event.button !== 0) return false;
  event.preventDefault();
  event.stopPropagation();
  if (trackIndex !== selectedTrack.value) {
    ElMessage.warning(t('timeline.shortcut.placeActiveTrackOnly'));
    return true;
  }
  const lane = event.currentTarget as HTMLElement;
  const frame = snapTimelineFrame(
    timelinePointerActualFrame(
      event.clientX -
        getDefaultLibraryDragOffsets().dragOffsetX -
        lane.getBoundingClientRect().left,
    ),
    snapFrames.value,
    scenario.value.battle.durationFrames,
    minimumEditableInputFrame.value,
  );
  cursorFrame.value = frame;
  cancelLibraryPlacement();
  void placeGroup(
    placement.skillGroupKey,
    placement.skillKey,
    frame,
    trackIndex,
    placement.variantKey,
  );
  return true;
}

async function placeGroup(
  skillGroupKey: string,
  skillKey?: string,
  startFrame = cursorFrame.value,
  trackIndex = selectedTrack.value,
  variantKey?: string,
): Promise<void> {
  startFrame = Math.max(minimumEditableInputFrame.value, startFrame);
  const operatorSlug = viewModel.value.tracks[trackIndex]?.operatorSlug ?? null;
  const operator =
    operatorSlug === null ? null : editorGameDataRepository.getOperator(operatorSlug);
  if (operator === null) return;
  const shouldAutoGroup =
    skillKey === undefined &&
    operator.skillGroups.find(group => group.key === skillGroupKey)?.skillType === 'basicAttack';
  const result = placeLibrarySkillGroup({
    scenario: scenario.value,
    trackIndex,
    operator,
    skillGroupKey,
    ...(variantKey === undefined ? {} : { variantKey }),
    ...(skillKey === undefined ? {} : { skillKey }),
    startFrame,
    ids,
  });
  let placedScenario = result.scenario;
  let placedIds = result.skillCastIds;
  if (result.skillCastIds.length > 1 || result.extension !== undefined) {
    const planned = await skillPlacementTransaction.resolve(result);
    if (planned === null) return;
    placedScenario = planned.scenario;
    placedIds = planned.skillCastIds ?? placedIds;
    if (planned.incomplete)
      ElMessage.warning(
        t(
          result.extension
            ? 'timeline.recursiveChainPlacementIncomplete'
            : 'timeline.chainPlacementIncomplete',
        ),
      );
    if ('error' in planned)
      ElMessage.error(
        planned.error instanceof Error ? planned.error.message : t('timeline.chainPlacementFailed'),
      );
  } else {
    skillPlacementTransaction.cancel();
  }
  if (shouldAutoGroup && placedIds.length > 1) {
    placedScenario = groupPlacedSkillSequence(placedScenario, placedIds);
  }
  commitScenario('placeSkillGroup', () => placedScenario);
  const lastPlacedId = placedIds.at(-1);
  if (lastPlacedId === undefined) clearTimelineSelection();
  else applyActionSelection(selectTimelineAction(actionSelection.value, lastPlacedId, false));
  const placed = placedScenario.tracks[trackIndex]?.skillCasts ?? [];
  const last = placed.find(cast => cast.id === lastPlacedId);
  if (last !== undefined) {
    const lastSkillDuration = resolvePlacedSkillDurationFrames(
      operator,
      skillGroupKey,
      last.source.kind === 'operatorSkill' ? last.source.skillKey : skillKey,
      variantKey,
    );
    cursorFrame.value = resolvedSkillCastStartFrames.value.get(last.id)! + lastSkillDuration;
  }
}

const LEGACY_SKILL_HOTKEY_TYPES: Readonly<Record<1 | 2 | 3 | 4 | 5 | 6, SkillType>> = {
  1: 'basicAttack',
  2: 'battleSkill',
  3: 'comboSkill',
  4: 'ultimate',
  5: 'plungingAttack',
  6: 'finisher',
};

function selectTrackByShortcut(trackIndex: TrackIndex): boolean {
  if (leftPanelCollapsed.value) return false;
  selectTrack(trackIndex);
  if (viewModel.value.tracks[trackIndex]?.operatorSlug === null) {
    void openOperatorDialog(trackIndex);
  }
  return true;
}

function placeSkillByShortcut(slot: 1 | 2 | 3 | 4 | 5 | 6): boolean {
  if (leftPanelCollapsed.value) return false;
  if (selectedTrackModel.value.operatorSlug === null) {
    ElMessage.warning(t('timeline.shortcut.placeNeedsOperator'));
    void openOperatorDialog(selectedTrack.value);
    return true;
  }
  const skillType = LEGACY_SKILL_HOTKEY_TYPES[slot];
  const entry =
    selectedTrackModel.value.skillLibrary.find(
      candidate =>
        candidate.skillType === skillType &&
        candidate.variantKey === undefined &&
        candidate.placementSkillKey === undefined,
    ) ?? selectedTrackModel.value.skillLibrary.find(candidate => candidate.skillType === skillType);
  if (entry === undefined) {
    ElMessage.warning(t('timeline.shortcut.placeSkillMissing'));
    return true;
  }
  beginLibraryPlacement(entry);
  ElMessage.info({ message: t('timeline.shortcut.placeReady'), duration: 1000 });
  return true;
}

function resolvePlacedSkillDurationFrames(
  operator: ReturnType<typeof gameDataRepository.getOperator>,
  skillGroupKey: string,
  skillKey?: string,
  variantKey?: string,
): number {
  if (operator === null) return 0;
  const group = operator.skillGroups.find(g => g.key === skillGroupKey);
  if (group === undefined) return 0;
  const lastSkill = resolveSkillGroupPlacementSkills(group, variantKey, skillKey).at(-1);
  return skillPlacementDisplayFrames(lastSkill?.timelineBlockFrames ?? 0);
}

function resolveLibraryDropRegion(event: DragEvent): HTMLElement | null {
  const viewport = timelineScroll.value;
  const lane = trackDropRegions.get(selectedTrack.value);
  // Do not drop through an unrelated/teleported panel into the canvas behind it.
  if (
    viewport === null ||
    lane === undefined ||
    !lane.isConnected ||
    !(event.target instanceof Node) ||
    !viewport.contains(event.target)
  )
    return null;
  const rect = viewport.getBoundingClientRect();
  return isInsideTimelineDropRegion({
    x: event.clientX,
    y: event.clientY,
    lane: lane.getBoundingClientRect(),
    viewport: {
      left: rect.left,
      top: rect.top,
      right: rect.left + viewport.clientWidth,
      bottom: rect.top + viewport.clientHeight,
    },
    headerWidth: TIMELINE_TRACK_HEADER_WIDTH,
    rulerHeight: TIMELINE_RULER_HEIGHT,
  })
    ? lane
    : null;
}

// Negotiate on entry too: a quick release after crossing a child/overlay may happen
// before the browser sends its next dragover at the new target.
function guardLibrarySkillDragOver(event: DragEvent): void {
  if (dragPayload.value?.kind !== 'librarySkill') return;
  positionLibraryDragGhost(event.clientX, event.clientY);
  event.preventDefault();
  event.stopPropagation();
  if (event.dataTransfer !== null) {
    event.dataTransfer.dropEffect = resolveLibraryDropRegion(event) === null ? 'none' : 'copy';
  }
}

/** The active workbench routes the drop before child controls can consume its text payload. */
function guardLibrarySkillDrop(event: DragEvent): void {
  if (dragPayload.value?.kind !== 'librarySkill') return;
  event.preventDefault();
  event.stopPropagation();
  const lane = resolveLibraryDropRegion(event);
  if (lane === null) finishSkillDrag();
  else dropTimelinePayload(event, selectedTrack.value, lane);
}

function beginSkillDrag(
  event: DragEvent,
  entry: TimelineSkillLibraryEntryViewModel,
  skillKey?: string,
): void {
  if (!(event.target instanceof Element) || !event.target.isConnected) {
    event.preventDefault();
    return;
  }
  const placedSkillKey = skillKey ?? entry.placementSkillKey;
  const lease = interactionSession.tryStart('library-drag', finishSkillDrag);
  if (lease === null) {
    event.preventDefault();
    return;
  }
  libraryDragLease = lease;
  disposeLibraryDragLifetime = observeNativeDragLifetime(event.target, () => {
    if (lease.isCurrent()) finishSkillDrag();
  });
  window.addEventListener('drop', guardLibrarySkillDrop, true);
  window.addEventListener('dragover', guardLibrarySkillDragOver, true);
  window.addEventListener('dragenter', guardLibrarySkillDragOver, true);
  const offsets = getDefaultLibraryDragOffsets();
  dragPayload.value = {
    kind: 'librarySkill',
    entryKey: entry.entryKey,
    skillGroupKey: entry.skillGroupKey,
    ...(entry.variantKey === undefined ? {} : { variantKey: entry.variantKey }),
    ...(placedSkillKey === undefined ? {} : { skillKey: placedSkillKey }),
    dragOffsetX: offsets.dragOffsetX,
  };
  const preview = librarySkillPreview(entry, placedSkillKey);
  createLibraryDragGhost(preview, preview.scale, () => preview.color);
  positionLibraryDragGhost(event.clientX, event.clientY);
  if (event.dataTransfer !== null) {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('text/plain', placedSkillKey ?? entry.skillGroupKey);
    suppressNativeLibraryDragImage(event.dataTransfer);
  }
}

function finishSkillDrag(): void {
  disposeLibraryDragLifetime?.();
  disposeLibraryDragLifetime = null;
  libraryDragLease?.release();
  libraryDragLease = null;
  window.removeEventListener('drop', guardLibrarySkillDrop, true);
  window.removeEventListener('dragover', guardLibrarySkillDragOver, true);
  window.removeEventListener('dragenter', guardLibrarySkillDragOver, true);
  if (dragPayload.value?.kind === 'librarySkill') dragPayload.value = null;
  removeLibraryDragGhost();
}

function beginTrackOrderDrag(event: DragEvent, trackIndex: TrackIndex): void {
  const lease = interactionSession.tryStart('track-order', finishTrackOrderDrag);
  if (lease === null) {
    event.preventDefault();
    return;
  }
  trackOrderLease = lease;
  dragPayload.value = { kind: 'trackOrder', trackIndex };
  trackOrderDropTarget.value = null;
  if (event.dataTransfer !== null) event.dataTransfer.effectAllowed = 'move';
}

function finishTrackOrderDrag(): void {
  trackOrderLease?.release();
  trackOrderLease = null;
  if (dragPayload.value?.kind === 'trackOrder') dragPayload.value = null;
  trackOrderDropTarget.value = null;
}

function swapTrackOrder(fromIndex: TrackIndex, toIndex: TrackIndex): void {
  if (fromIndex === toIndex) return;
  commitScenario('swapTimelineTracks', current => swapTimelineTracks(current, fromIndex, toIndex));
  if (selectedTrack.value === fromIndex) selectedTrack.value = toIndex;
  else if (selectedTrack.value === toIndex) selectedTrack.value = fromIndex;
}

function dropTrackOrder(event: DragEvent, trackIndex: TrackIndex): void {
  const payload = dragPayload.value;
  if (payload?.kind !== 'trackOrder') return;
  event.preventDefault();
  finishTrackOrderDrag();
  dragPayload.value = null;
  trackOrderDropTarget.value = null;
  swapTrackOrder(payload.trackIndex, trackIndex);
}

function allowTimelinePayloadDrop(event: DragEvent): void {
  event.preventDefault();
  if (event.dataTransfer !== null) {
    event.dataTransfer.dropEffect = dragPayload.value?.kind === 'librarySkill' ? 'copy' : 'move';
  }
}

function dropTimelinePayload(
  event: DragEvent,
  trackIndex: TrackIndex,
  dropRegion?: HTMLElement,
): void {
  const payload = dragPayload.value;
  dragPayload.value = null;
  if (payload === null) return;
  event.preventDefault();
  trackOrderDropTarget.value = null;
  if (payload.kind === 'trackOrder') {
    finishTrackOrderDrag();
    swapTrackOrder(payload.trackIndex, trackIndex);
    return;
  }
  finishSkillDrag();
  if (trackIndex !== selectedTrack.value) return;
  const lane = dropRegion ?? (event.currentTarget as HTMLElement);
  const frame = resolveTimelineLibraryDropFrame({
    clientX: event.clientX,
    laneLeftPx: lane.getBoundingClientRect().left,
    dragOffsetPx: payload.dragOffsetX,
    pxPerFrame: pxPerFrame.value,
    prepFrames: scenario.value.battle.prepFrames,
    prepEndFrame: scenario.value.inheritance?.frame ?? 0,
    prepExpanded: scenario.value.editor.prepExpanded,
    snapFrames: snapFrames.value,
    maximumFrame: scenario.value.battle.durationFrames,
    minimumFrame: minimumEditableInputFrame.value,
  });
  cursorFrame.value = frame;
  void placeGroup(payload.skillGroupKey, payload.skillKey, frame, trackIndex, payload.variantKey);
}

const resetDialogVisible = ref(false);

function resetScenario(mode: TimelineResetMode): void {
  const command = (project: EndaxisProjectDocument) =>
    resetProjectScenarios(
      project,
      mode,
      mode === 'all' ? t('timeline.scenario.defaultName', { index: 1 }) : undefined,
    );
  const changed =
    mode === 'currentKeepLoadout' && scenario.value.inheritance !== undefined
      ? projectSession.commit('resetScenarios', command)
      : projectSession.commitScenarioReplacement('resetScenarios', command);
  if (!changed) return;
  resetTransientScenarioUi();
  cursorFrame.value = 0;
  timelineScroll.value?.scrollTo({ left: 0, top: 0 });
}

function resetTransientScenarioUi(): void {
  // 丢弃旧方案的拖动预览，不能让取消回调把旧草稿写回已切换的方案。
  discardCastMove();
  interactionSession.cancel();
  selectedTrack.value = 0;
  clearTimelineSelection();
  cursorFrame.value = 30;
  cursorGuide.value = null;
  hoveredCastId.value = null;
  alignmentGuide.value = null;
  contextMenuTarget.value = null;
  markerContextTarget.value = null;
  cancelLibraryPlacement();
  hitDetailTarget.value = null;
  enemyDamageDetailSequence.value = null;
  buffDetailTarget.value = null;
  passiveUiDetailSegment.value = null;
  passiveUiDetailTitle.value = '';
  showDamageAnalysis.value = false;
  showExportDialog.value = false;
  showSmallImageExport.value = false;
  showSkillDefinitionEditor.value = false;
  showOperatorDefinitionWorkspace.value = false;
  showWeaponDefinitionWorkspace.value = false;
  gearDefinitionWorkspaceSlot.value = null;
  gearSetDefinitionWorkspaceId.value = null;
  operatorDialogTrack.value = null;
  weaponDialogTrack.value = null;
  gearDialogTarget.value = null;
  panelDialogTrack.value = null;
  showOperatorBuildDialog.value = false;
  showWeaponBuildDialog.value = false;
  showGearBuildDialog.value = false;
  resetDialogVisible.value = false;
}

function renameScenario(name: string): void {
  projectSession.commit('renameScenario', project => renameActiveScenario(project, name));
}

function selectScenario(scenarioId: string): void {
  projectSession.commit('switchScenario', project => switchProjectScenario(project, scenarioId));
}

function locateInheritanceBoundary(): void {
  const boundary = scenario.value.inheritance?.frame;
  const viewport = timelineScroll.value;
  if (boundary === undefined || viewport === null) return;
  // 继承边界替代准备区分界，位于轨道头右侧；历史仍保留，向左滚动即可查看。
  viewport.scrollLeft = scenario.value.editor.prepExpanded
    ? Math.max(0, timelineFramePx(boundary - 10 * PROJECT_FPS))
    : 0;
  updateTimelineViewportMetrics();
}

function openInheritanceInfo(event: MouseEvent): void {
  if (!scenario.value.inheritance) return;
  openExistingMarkerContextMenu(
    event,
    'simulationStart',
    'simulationStart',
    scenario.value.inheritance.frame,
    selectedTrack.value,
    `${t('inheritance.boundary')} · ${formatGuideFrame(scenario.value.inheritance.frame)}`,
  );
}

function openInheritedSource(): void {
  const source = scenario.value.inheritance?.sourceScenarioId;
  markerContextTarget.value = null;
  if (source !== undefined && projectScenarios.value.some(item => item.id === source))
    selectScenario(source);
}

watch(
  [() => scenario.value.id, () => scenario.value.inheritance?.frame, timelineScroll],
  () => {
    void nextTick(locateInheritanceBoundary);
  },
  { immediate: true, flush: 'post' },
);

function addScenario(): void {
  const project = projectSession.snapshot.project;
  if (project.scenarios.length >= MAX_PROJECT_SCENARIOS) {
    ElMessage.warning(t('timeline.scenario.limit', { max: MAX_PROJECT_SCENARIOS }));
    return;
  }
  projectSession.commit('addScenario', current =>
    addProjectScenario(
      current,
      t('timeline.scenario.defaultName', { index: current.scenarios.length + 1 }),
    ),
  );
}

function duplicateScenario(): void {
  const project = projectSession.snapshot.project;
  if (project.scenarios.length >= MAX_PROJECT_SCENARIOS) {
    ElMessage.warning(t('timeline.scenario.limit', { max: MAX_PROJECT_SCENARIOS }));
    return;
  }
  const changed = projectSession.commit('duplicateScenario', current =>
    duplicateActiveScenario(current, t('timeline.scenario.copySuffix')),
  );
  if (!changed) return;
  ElMessage.success(t('timeline.scenario.duplicated'));
}

async function removeScenario(): Promise<void> {
  try {
    await serviceModalBoundary.run(() =>
      ElMessageBox.confirm(
        t('timeline.scenario.deleteConfirm'),
        t('timeline.scenario.deleteTitle'),
        {
          confirmButtonText: t('common.delete'),
          cancelButtonText: t('common.cancel'),
          type: 'warning',
        },
      ),
    );
  } catch {
    return;
  }
  const changed = projectSession.commit('deleteScenario', deleteActiveScenario);
  if (!changed) return;
  ElMessage.success(t('timeline.scenario.deleted'));
}

function restoreEditorHistory(direction: 'undo' | 'redo'): boolean {
  const restored = direction === 'undo' ? scenarioSession.undo() : scenarioSession.redo();
  if (!restored) return false;
  clearTimelineSelection();
  contextMenuTarget.value = null;
  // 历史项可能只改变定义库而保持活动场景引用不变，不能只依赖场景 watcher。
  refreshSimulationAfterDefinitionChange();
  return true;
}

function openCastContextMenu(event: MouseEvent, trackIndex: TrackIndex, skillCastId: string): void {
  if (actionSelection.value.selectedIds.has(skillCastId)) {
    applyActionSelection({ ...actionSelection.value, primaryId: skillCastId });
  } else {
    applyActionSelection(selectTimelineAction(actionSelection.value, skillCastId, false));
  }
  contextMenuTarget.value = { x: event.clientX, y: event.clientY, trackIndex, skillCastId };
}

function toggleContextCastField(field: 'locked' | 'disabled'): void {
  const target = contextMenuTarget.value;
  if (target === null) return;
  const cast = scenario.value.tracks[target.trackIndex]?.skillCasts.find(
    candidate => candidate.id === target.skillCastId,
  );
  if (cast === undefined) return;
  const currentValue = cast.presentation?.[field] ?? false;
  const command = field === 'locked' ? setSkillCastLocked : setSkillCastDisabled;
  commitScenario(`toggleSkillCast${field.charAt(0).toUpperCase() + field.slice(1)}`, current =>
    command(current, target.trackIndex, target.skillCastId, !currentValue),
  );
  contextMenuTarget.value = null;
}

function deleteContextCast(): void {
  const target = contextMenuTarget.value;
  if (target === null) return;
  const selection = actionSelection.value.selectedIds.has(target.skillCastId)
    ? actionSelection.value
    : selectTimelineAction(actionSelection.value, target.skillCastId, false);
  deleteSelectedTimelineActions(scenarioSession, selection);
  clearTimelineSelection();
  contextMenuTarget.value = null;
}

function copyContextSelection(): void {
  copySelectedActions();
  contextMenuTarget.value = null;
}

const compactSelection = computed(() =>
  resolveCompactSkillSelection(scenario.value, actionSelection.value.selectedIds),
);
const continuousGroupSelection = computed(() =>
  resolveSkillCastGroupSelection(
    scenario.value,
    actionSelection.value.selectedIds,
    displayedSkillCastStartFrames.value,
  ),
);
const selectionIncludesContinuousGroup = computed(() =>
  skillCastGroupsByTrack.value.some(groups =>
    groups.some(group => group.casts.some(cast => actionSelection.value.selectedIds.has(cast.id))),
  ),
);

function createSelectedSkillCastGroup(): void {
  const selection = continuousGroupSelection.value;
  if (!selection.ok || selection.alreadyGrouped) return;
  const starts = displayedSkillCastStartFrames.value;
  commitScenario('createSkillCastGroup', current =>
    createSkillCastGroup(current, selection.castIds, starts),
  );
  contextMenuTarget.value = null;
}

function dissolveSelectedSkillCastGroups(): void {
  const starts = displayedSkillCastStartFrames.value;
  const selectedIds = actionSelection.value.selectedIds;
  commitScenario('dissolveSkillCastGroups', current =>
    dissolveSkillCastGroups(current, selectedIds, starts),
  );
  contextMenuTarget.value = null;
}

function selectSkillCastGroup(castIds: readonly string[]): void {
  applyActionSelection({ selectedIds: new Set(castIds), primaryId: castIds[0] ?? null });
}

function skillCastGroupEndFrame(castIds: readonly string[]): number {
  return Math.max(
    ...castIds.map(id => {
      const start = displayedSkillCastStartFrames.value.get(id)!;
      return Math.max(start, visibleSkillEndFrames.value.get(id) ?? start);
    }),
  );
}

async function compactSelectedSkills(): Promise<void> {
  const selection = compactSelection.value;
  contextMenuTarget.value = null;
  if (!selection.ok) return;
  const original = scenario.value;
  const widths = new Map(
    viewModel.value.tracks.flatMap(track =>
      track.skillCasts.map(
        cast => [cast.id, castActualDurationFrame(cast.id, cast.durationFrames)] as const,
      ),
    ),
  );
  const result = await skillPlacementTransaction.resolve(
    { scenario: original, skillCastIds: selection.castIds },
    'compact',
  );
  if (result === null) return;
  const compacted = result.incomplete
    ? compactSkillSelectionByWidths(original, selection.castIds, widths, result.plannedStartFrames)
    : result.scenario;
  if (result.incomplete) {
    ElMessage.warning(t('timeline.compactSelection.incomplete'));
  }
  if ('error' in result)
    ElMessage.error(
      result.error instanceof Error ? result.error.message : t('timeline.chainPlacementFailed'),
    );
  const originalFrames = new Map(
    original.tracks.flatMap(track =>
      (track?.skillCasts ?? []).map(cast => [cast.id, cast.placement.startFrame] as const),
    ),
  );
  if (
    !compacted.tracks.some(track =>
      track?.skillCasts.some(cast => originalFrames.get(cast.id) !== cast.placement.startFrame),
    )
  )
    return;
  commitScenario('compactSelectedSkills', () => compacted);
}

function pasteClipboardAtTimelinePosition(): void {
  const clipboard = timelineClipboard.value;
  if (clipboard === null) return;
  const minimumFrame = minimumEditableInputFrame.value;
  const pasteFrame =
    timelinePointerClientX.value === null
      ? snapTimelineFrame(
          cursorFrame.value,
          snapFrames.value,
          scenario.value.battle.durationFrames,
          minimumFrame,
        )
      : pointerMarkerFrame(timelinePointerClientX.value, 0, minimumFrame);
  const result = pasteTimelineActions(scenario.value, clipboard, pasteFrame, ids);
  if (result.dodgeMarkerId !== undefined) {
    if (commitScenario('pasteDodgeMarker', () => result.scenario)) {
      clearTimelineSelection();
      selectedMarker.value = { kind: 'dodge', id: result.dodgeMarkerId };
    }
    return;
  }
  if (result.skillCastIds.length === 0) return;
  commitScenario('pasteSkillCasts', () => result.scenario);
  applyActionSelection({
    selectedIds: new Set(result.skillCastIds),
    primaryId: result.skillCastIds.at(-1) ?? null,
  });
}

function copySelectedActions(): boolean {
  if (selectedMarker.value?.kind === 'dodge') {
    timelineClipboard.value = copyTimelineDodgeMarker(scenario.value, selectedMarker.value.id);
    return timelineClipboard.value !== null;
  }
  if (actionSelection.value.selectedIds.size === 0) return false;
  timelineClipboard.value = copyTimelineActions(
    scenario.value,
    actionSelection.value.selectedIds,
    displayedSkillCastStartFrames.value,
  );
  return timelineClipboard.value !== null;
}

function deleteSelectedActions(): boolean {
  if (selectedMarker.value !== null) {
    return removeSelectedMarker(selectedMarker.value.kind, selectedMarker.value.id);
  }
  const deleted = deleteSelectedTimelineActions(scenarioSession, actionSelection.value);
  if (deleted) clearTimelineSelection();
  return deleted;
}

function nudgeSelectedActions(deltaFrames: -1 | 1): boolean {
  const marker = selectedExternalEventMarker.value ?? selectedDocumentMarker.value;
  if (marker !== null) {
    const frame = Math.max(
      0,
      Math.min(scenario.value.battle.durationFrames, marker.frame + deltaFrames * snapFrames.value),
    );
    if (frame !== marker.frame) {
      if (selectedExternalEventMarker.value !== null) {
        commitScenario('moveExternalEventMarker', current =>
          moveExternalEventMarker(current, marker.id, frame),
        );
      } else {
        setSelectedDocumentMarkerFrame(frame);
      }
    }
    // Consume the shortcut even at a boundary; it must not scroll the page.
    return true;
  }
  const selection = actionSelection.value;
  const anchorSkillCastId = selection.primaryId ?? selection.selectedIds.values().next().value;
  if (anchorSkillCastId === undefined) return false;
  for (const [trackIndex, track] of scenario.value.tracks.entries()) {
    const anchor = track?.skillCasts.find(cast => cast.id === anchorSkillCastId);
    if (anchor === undefined) continue;
    return commitScenario('moveSkillCasts', current =>
      moveSkillCasts(
        current,
        selection.selectedIds,
        trackIndex as TrackIndex,
        anchorSkillCastId,
        Math.max(
          minimumEditableInputFrame.value,
          resolvedSkillCastStartFrames.value.get(anchor.id)! + deltaFrames * snapFrames.value,
        ),
        resolvedSkillCastStartFrames.value,
      ),
    );
  }
  return false;
}

function toggleSnapPrecision(): boolean {
  snapFrames.value =
    snapFrames.value === PRECISE_TIMELINE_SNAP_FRAMES
      ? COARSE_TIMELINE_SNAP_FRAMES
      : PRECISE_TIMELINE_SNAP_FRAMES;
  return true;
}

function toggleCursorGuide(): boolean {
  showCursorGuide.value = !showCursorGuide.value;
  return true;
}

function toggleBoxSelect(): boolean {
  boxSelectEnabled.value = !boxSelectEnabled.value;
  return true;
}

function cycleOccupiedTrack(direction: -1 | 1): boolean {
  const nextTrackIndex = findAdjacentOccupiedTrack(
    scenario.value.tracks,
    selectedTrack.value,
    direction,
  );
  if (nextTrackIndex === null) {
    ElMessage.warning(t('timeline.shortcut.cycleNeedsOperator'));
    return true;
  }
  // 与 main 一致：只有一个已配置干员时，Tab 回绕到当前轨道也要重新应用选择，
  // 这样会清理技能块选择并给出明确的轨道选中反馈，而不是看起来毫无反应。
  selectTrack(nextTrackIndex);
  return true;
}

const hasTimelineContextMenu = computed(
  () =>
    contextMenuTarget.value !== null ||
    markerContextTarget.value !== null ||
    connectionContextTarget.value !== null,
);

function restoreEditorHistoryByShortcut(direction: 'undo' | 'redo'): boolean {
  const restored = restoreEditorHistory(direction);
  if (restored) {
    ElMessage.info({ message: t(`timeline.shortcut.${direction}`), duration: 800 });
  }
  return restored;
}

function copySelectedActionsByShortcut(): boolean {
  const copied = copySelectedActions();
  if (copied) ElMessage.success({ message: t('timeline.shortcut.copied'), duration: 800 });
  return copied;
}

function pasteSelectedActionsByShortcut(): boolean {
  if (timelineClipboard.value === null) return false;
  pasteClipboardAtTimelinePosition();
  ElMessage.success({ message: t('timeline.shortcut.pasted'), duration: 800 });
  return true;
}

function deleteSelectionByShortcut(): boolean {
  const deleted =
    selectedConnectionId.value === null
      ? deleteSelectedActions()
      : (deleteTimelineConnection(selectedConnectionId.value), true);
  if (deleted) {
    ElMessage.success({ message: t('timelineGrid.selection.deleted'), duration: 800 });
  }
  return deleted;
}

function toggleCursorGuideByShortcut(): boolean {
  toggleCursorGuide();
  ElMessage.info({
    message: t(
      showCursorGuide.value
        ? 'timeline.shortcut.cursorGuideOn'
        : 'timeline.shortcut.cursorGuideOff',
    ),
    duration: 1500,
  });
  return true;
}

function toggleBoxSelectByShortcut(): boolean {
  toggleBoxSelect();
  ElMessage.info({
    message: t(
      boxSelectEnabled.value ? 'timeline.shortcut.boxSelectOn' : 'timeline.shortcut.boxSelectOff',
    ),
    duration: 1500,
  });
  return true;
}

function toggleSnapPrecisionByShortcut(): boolean {
  toggleSnapPrecision();
  ElMessage.info({
    message: t('timeline.shortcut.snapPrecision', {
      mode: t(
        snapFrames.value === PRECISE_TIMELINE_SNAP_FRAMES
          ? 'timeline.shortcut.snapModeFrame'
          : 'timeline.shortcut.snapMode01',
      ),
    }),
    duration: 1000,
  });
  return true;
}

function toggleConnectionToolByShortcut(): boolean {
  toggleConnectionTool();
  ElMessage.info({
    message: t('timeline.shortcut.connectionTool', {
      state: t(connectionToolEnabled.value ? 'common.on' : 'common.off'),
    }),
    duration: 1000,
  });
  return true;
}

function cancelLibraryPlacementWithFeedback(): boolean {
  const cancelled = cancelLibraryPlacement();
  if (cancelled) {
    ElMessage.info({ message: t('timeline.shortcut.placeCancelled'), duration: 800 });
  }
  return cancelled;
}

useInteractionBarrier(interactionSession, () => hasTimelineContextMenu.value);

useKeyboardShortcutScope({
  id: 'timeline-library-placement',
  region: workbenchInputRegion,
  priority: 1100,
  active: () => libraryPlacement.value !== null,
  handle: event => {
    if (event.key !== 'Escape' || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
      return false;
    return cancelLibraryPlacementWithFeedback();
  },
});

useKeyboardShortcutScope({
  id: 'timeline-overlay',
  region: workbenchInputRegion,
  priority: 100,
  active: () => hasTimelineContextMenu.value,
  handle: () => false,
  blockLowerScopes: true,
});

useKeyboardShortcutScope({
  id: 'timeline-editor',
  region: workbenchInputRegion,
  priority: 10,
  active: () => !hasTimelineContextMenu.value,
  handleClipboard: event => {
    if (isKeyboardShortcutIsolationTarget(event.target)) return false;
    if (event.type === 'copy') return copySelectedActionsByShortcut();
    if (event.type !== 'paste') return false;
    return pasteSelectedActionsByShortcut();
  },
  handle: event => {
    if (isKeyboardShortcutIsolationTarget(event.target)) return false;
    return handleTimelineEditorShortcut(event, {
      undo: () => restoreEditorHistoryByShortcut('undo'),
      redo: () => restoreEditorHistoryByShortcut('redo'),
      copy: copySelectedActionsByShortcut,
      paste: pasteSelectedActionsByShortcut,
      delete: deleteSelectionByShortcut,
      nudgeLeft: () => nudgeSelectedActions(-1),
      nudgeRight: () => nudgeSelectedActions(1),
      toggleSnapPrecision: toggleSnapPrecisionByShortcut,
      toggleCursorGuide: toggleCursorGuideByShortcut,
      toggleBoxSelect: toggleBoxSelectByShortcut,
      toggleConnectionTool: toggleConnectionToolByShortcut,
      cycleTrack: cycleOccupiedTrack,
      selectTrack: selectTrackByShortcut,
      placeSkill: placeSkillByShortcut,
      cancelPlacement: cancelLibraryPlacementWithFeedback,
    });
  },
});

function moveTrack(trackIndex: TrackIndex, direction: -1 | 1): void {
  const targetIndex = (trackIndex + direction) as TrackIndex;
  if (targetIndex < 0 || targetIndex > 3) return;
  swapTrackOrder(trackIndex, targetIndex);
}

function setTrackInitialUltimateEnergy(trackIndex: TrackIndex, value: number): void {
  const maximum = viewModel.value.tracks[trackIndex]?.maxUltimateEnergy ?? null;
  if (maximum === null) return;
  commitScenario('updateTrackInitialUltimateEnergy', current =>
    updateTrackInitialUltimateEnergy(current, trackIndex, value, maximum),
  );
}

function cycleInitialUltimateEnergyPreset(): void {
  if (configurationReadOnly.value) return;
  const modes = ['empty', 'full', 'custom'] as const;
  const currentIndex = modes.indexOf(initialUltimateEnergyPresetMode.value);
  const mode = modes[(currentIndex + 1) % modes.length]!;
  commitScenario('applyInitialUltimateEnergyPreset', current =>
    applyInitialUltimateEnergyPreset(current, mode, maximumUltimateEnergyByTrack.value),
  );
}

function setUnifiedTrackInitialUltimateEnergy(value: number): void {
  if (configurationReadOnly.value) return;
  commitScenario('setUnifiedInitialUltimateEnergy', current =>
    setUnifiedInitialUltimateEnergy(current, value, maximumUltimateEnergyByTrack.value),
  );
}

function setBattleResourceRule(field: EditableBattleResourceRule, value: number): void {
  commitScenario('updateBattleResourceRule', current =>
    updateBattleResourceRule(current, field, value),
  );
}

function updateGlobalConfig(config: Parameters<typeof setGlobalConfig>[1]): void {
  commitScenario('setGlobalConfig', current => setGlobalConfig(current, config));
}

function setGlobalModifiers(modifiers: Parameters<typeof setGlobalOperatorStatModifiers>[1]): void {
  commitScenario('setGlobalOperatorStatModifiers', current =>
    setGlobalOperatorStatModifiers(current, modifiers),
  );
}

const selectedContingencyContractTagIds = computed(() =>
  scenario.value.mechanics.selections.flatMap(selection => {
    if (
      !selection.enabled ||
      !selection.mechanicId.startsWith(CONTINGENCY_CONTRACT_MECHANIC_PREFIX)
    ) {
      return [];
    }
    const tagId = Number(selection.mechanicId.slice(CONTINGENCY_CONTRACT_MECHANIC_PREFIX.length));
    return Number.isInteger(tagId) ? [tagId] : [];
  }),
);

function setSelectedContingencyContractTagIds(tagIds: readonly number[]): void {
  commitScenario('setContingencyContractTags', current => ({
    ...current,
    mechanics: {
      selections: [
        ...current.mechanics.selections.filter(
          selection => !selection.mechanicId.startsWith(CONTINGENCY_CONTRACT_MECHANIC_PREFIX),
        ),
        ...tagIds.map(tagId => ({
          id: `mechanic:contingency-contract:${tagId}`,
          mechanicId: contingencyContractMechanicId(tagId),
          enabled: true,
          parameters: {},
        })),
      ],
    },
  }));
}

function setContextCastColor(color: string | null): void {
  const target = contextMenuTarget.value;
  if (target === null) return;
  commitScenario('setSkillCastColor', current =>
    setSkillCastColor(current, target.trackIndex, target.skillCastId, color),
  );
  contextMenuTarget.value = null;
}

function setSelectedCastRandomSeed(seed: number | null): void {
  const selected = selectedCastModel.value;
  if (selected === null) return;
  commitScenario('setSkillCastRandomSeed', current =>
    setSkillCastRandomSeed(current, selected.trackIndex, selected.cast.id, seed),
  );
}

function rollSelectedCastRandomSeed(): void {
  setSelectedCastRandomSeed(globalThis.crypto.getRandomValues(new Uint32Array(1))[0]!);
}

function setScenarioRandomMode(mode: 'expected' | 'sampled'): void {
  commitScenario('setScenarioRandomMode', current => ({
    ...current,
    battle: {
      ...current.battle,
      random: { mode, globalSeed: current.battle.random?.globalSeed ?? 0 },
    },
  }));
}

function setGlobalRandomSeed(globalSeed: number): void {
  commitScenario('setGlobalRandomSeed', current => ({
    ...current,
    battle: {
      ...current.battle,
      random: { mode: current.battle.random?.mode ?? 'expected', globalSeed },
    },
  }));
}

function rollGlobalRandomSeed(): void {
  setGlobalRandomSeed(globalThis.crypto.getRandomValues(new Uint32Array(1))[0]!);
}

function setSelectedCastStartFrame(frame: number): void {
  const selected = selectedCastModel.value;
  if (selected === null || selected.cast.placement.afterCastId !== undefined) return;
  commitScenario('moveSkillCast', current =>
    moveSkillCast(
      current,
      selected.trackIndex,
      selected.cast.id,
      frame,
      displayedSkillCastStartFrames.value,
    ),
  );
}

function setSelectedCastLocked(locked: boolean): void {
  const selected = selectedCastModel.value;
  if (selected === null) return;
  commitScenario('setSkillCastLocked', current =>
    setSkillCastLocked(current, selected.trackIndex, selected.cast.id, locked),
  );
}

function setSelectedCastDisabled(disabled: boolean): void {
  const selected = selectedCastModel.value;
  if (selected === null) return;
  commitScenario('setSkillCastDisabled', current =>
    setSkillCastDisabled(current, selected.trackIndex, selected.cast.id, disabled),
  );
}

function setSelectedCastColor(color: string | null): void {
  const selected = selectedCastModel.value;
  if (selected === null) return;
  commitScenario('setSkillCastColor', current =>
    setSkillCastColor(current, selected.trackIndex, selected.cast.id, color),
  );
}

function resetSelectedCastDefinition(): void {
  const selected = selectedCastModel.value;
  if (selected === null || !selected.edited) return;
  commitScenario('resetSkillCastToTemplate', current =>
    resetSkillCastToTemplate(current, selected.trackIndex, selected.cast.id),
  );
  showSkillDefinitionEditor.value = false;
}

/**
 * 保存技能逻辑编辑：把完整草稿交给统一命令入口做最后校验后写入场景。
 * 校验失败时命令抛错，场景保持不变。
 */
function saveSelectedCastDefinition(draft: SkillDefinition): void {
  const selected = selectedCastModel.value;
  if (selected === null) return;
  commitScenario('setSkillCastCustomDefinition', current =>
    setSkillCastCustomDefinition(current, selected.trackIndex, selected.cast.id, draft),
  );
  showSkillDefinitionEditor.value = false;
}

function setPanelDialogVisible(visible: boolean): void {
  if (!visible) panelDialogTrack.value = null;
}
</script>

<template>
  <TimelineResetDialog
    v-if="resetDialogVisible"
    v-model="resetDialogVisible"
    :inherited="scenario.inheritance !== undefined"
    @confirm="resetScenario"
  />
  <input
    ref="projectFileInput"
    class="project-file-input"
    type="file"
    accept="application/json,.json,image/png,.png"
    @change="handleProjectFileChange"
  />
  <TimelineWorkbenchShell
    :collapsed-monitor-section-count="collapsedMonitorSectionCount"
    @left-collapsed-change="leftPanelCollapsed = $event"
    :labels="{
      library: t('timeline.activityBar.library'),
      globalConfig: t('timeline.activityBar.globalConfig'),
      contract: t('timeline.activityBar.contract'),
      contractUnavailable: t('timeline.activityBar.contractUnavailable'),
      resourceMonitor: t('timeline.activityBar.resourceMonitor'),
      inspector: t('timeline.activityBar.inspector'),
      performance: t('timeline.performance.title'),
      battleLog: t('timeline.activityBar.battleLog'),
      collapsePanel: t('common.close'),
    }"
  >
    <template #left>
      <section class="skill-sidebar">
        <div class="library-header">
          <div class="library-header__main">
            <h3 class="operator-heading">
              <span class="operator-heading__mark"></span>
              <span class="operator-heading__main">{{
                operatorName(selectedTrackModel.operatorSlug)
              }}</span>
              <span
                v-if="selectedOperatorFormName"
                class="operator-form-badge"
                :title="selectedOperatorFormName"
                >{{ selectedOperatorFormName }}</span
              >
            </h3>
          </div>
          <div class="library-header__divider"></div>
          <div class="library-section-title library-section-title--status">
            <strong>{{ t('actionLibrary.section.operatorStatusAdjust') }}</strong>
            <span>{{ t('actionLibrary.hints.adjustOperatorStatus') }}</span>
          </div>
          <div class="sidebar-tabs" role="group">
            <EaButton
              variant="ghost"
              type="button"
              :disabled="configurationReadOnly || selectedLoadoutModel.operator === null"
              @click="showOperatorBuildDialog = true"
            >
              {{ t('timeline.operatorTab') }}
            </EaButton>
            <EaButton
              variant="ghost"
              type="button"
              :disabled="configurationReadOnly || selectedLoadoutModel.weapon === null"
              @click="showWeaponBuildDialog = true"
            >
              {{ t('timeline.weaponTab') }}
            </EaButton>
            <EaButton
              variant="ghost"
              type="button"
              :disabled="
                configurationReadOnly || !Object.values(selectedLoadoutModel.gears).some(Boolean)
              "
              @click="showGearBuildDialog = true"
            >
              {{ t('timeline.gearTab') }}
            </EaButton>
          </div>
        </div>
        <div class="skill-section">
          <div class="library-section-title">
            <strong>{{ t('actionLibrary.section.operatorSkillLibrary') }}</strong>
            <span>{{ t('actionLibrary.hints.clickOrDrag') }}</span>
          </div>
          <div class="skill-list">
            <SkillLibraryCard
              v-for="entry in selectedTrackModel.skillLibrary"
              :key="entry.entryKey"
              :name="skillLibraryCardName(entry)"
              :tooltip="skillLibraryTypeLabel(entry)"
              :type-label="skillLibraryTypeLabel(entry)"
              :duration="skillDurationSeconds(entry)"
              :icon="skillDisplayIcon(entry.skillType, selectedTrackModel.operatorSlug)"
              :accent-color="skillAccentColor(entry.skillType, selectedTrackModel.operatorSlug)"
              :selected="libraryEntrySelected(entry)"
              :segments="skillSegments(entry)"
              @dragstart="beginSkillDrag($event, entry)"
              @dragstart-segment="beginSkillDrag($event.event, entry, $event.skillKey)"
              @select="selectLibrarySkill(entry)"
              @select-segment="selectLibrarySkill(entry, $event)"
            />
          </div>
        </div>
      </section>
    </template>

    <template #left-bottom="{ tool }">
      <EnemySettingsPanel
        :read-only="configurationReadOnly"
        v-if="tool === 'enemy'"
        :enemy="scenario.enemy"
        :definition="selectedEnemyDefinition"
        :enemies="enemies"
        :fps="PROJECT_FPS"
        :name-of="enemyName"
        :labels="{
          all: t('common.all'),
          close: t('common.close'),
          confirm: t('common.confirm'),
          custom: t('resourceMonitor.enemy.custom'),
          customDescription: t('resourceMonitor.enemy.customDesc'),
          unknown: t('resourceMonitor.enemy.unknown'),
          clickToChange: t('resourceMonitor.enemy.clickToChange'),
          selectTitle: t('resourceMonitor.enemy.dialogTitle'),
          searchPlaceholder: t('resourceMonitor.enemy.searchPlaceholder'),
          level: t('resourceMonitor.enemy.level'),
          empty: t('resourceMonitor.enemy.empty'),
          editStats: t('resourceMonitor.enemy.editStats'),
          editStatsTitle: t('resourceMonitor.enemy.editStatsTitle'),
          enemyHp: t('resourceMonitor.labels.enemyHp'),
          defense: t('statDetail.defense'),
          finisherMultiplier: `${t('skillType.execution')}${t('hitDetail.multipliers')}`,
          maximumStagger: t('resourceMonitor.labels.maxStagger'),
          staggerNodes: t('resourceMonitor.labels.staggerNodes'),
          nodeDuration: t('resourceMonitor.labels.nodeDuration'),
          brokenDuration: t('resourceMonitor.labels.breakDuration'),
          finisherRecovery: t('resourceMonitor.labels.executionRecovery'),
          superArmor: t('resourceMonitor.labels.superArmor'),
          resistances: t('resourceMonitor.labels.resistanceTitle'),
          resistance: {
            physical: t('resourceMonitor.resistance.physical'),
            heat: t('resourceMonitor.resistance.heat'),
            cryo: t('resourceMonitor.resistance.cryo'),
            electric: t('resourceMonitor.resistance.electric'),
            nature: t('resourceMonitor.resistance.nature'),
          },
          tier: {
            normal: t('enemyTier.normal'),
            advanced: t('enemyTier.advanced'),
            elite: t('enemyTier.elite'),
            boss: t('enemyTier.boss'),
            leader: t('enemyTier.leader'),
          },
        }"
        @select-definition="selectDefinitionEnemy"
        @select-custom="selectCustomEnemy"
        @save="saveEnemyValues"
      />
      <GlobalResourcePanel
        :read-only="configurationReadOnly"
        v-else-if="tool === 'global'"
        mode="modifiers"
        :config="scenario.globalConfig"
        @set-modifiers="setGlobalModifiers"
        @set-config="updateGlobalConfig"
      />
      <div v-else-if="tool === 'contract'" class="contract-side-panel">
        <img
          src="/contingency_contract/1/deco_contingency_select_tag_3.webp"
          alt=""
          aria-hidden="true"
        />
        <div class="contract-side-title">{{ t('contingencyContract.operationName') }}</div>
      </div>
      <div v-else class="empty-panel">{{ t('timeline.activityBar.contractUnavailable') }}</div>
    </template>

    <template #header>
      <TimelineHeaderToolbar
        :configuration-read-only="configurationReadOnly"
        :scenario-name="scenario.name"
        :scenarios="projectScenarios"
        :active-scenario-id="activeProjectScenarioId"
        :max-scenarios="MAX_PROJECT_SCENARIOS"
        :cursor-guide-enabled="showCursorGuide"
        :box-select-enabled="boxSelectEnabled"
        :connection-tool-enabled="connectionToolEnabled"
        @toggle-box-select="toggleBoxSelect"
        @toggle-connection-tool="toggleConnectionTool"
        :buff-layout-mode="buffLayoutMode"
        :keycap-mode="keycapMode"
        @toggle-cursor-guide="toggleCursorGuide"
        @set-buff-layout="buffLayoutMode = $event"
        :view-layers="timelineViewLayers"
        :view-layer-ids="TIMELINE_VIEW_LAYER_IDS"
        :operator-effects="operatorEffectsOptions"
        :locale="locale"
        :appearance="appearance"
        :random-mode="scenario.battle.random?.mode ?? 'expected'"
        :global-random-seed="scenario.battle.random?.globalSeed ?? 0"
        :labels="{
          rename: t('timeline.scenario.renameTooltip'),
          duplicate: t('timeline.scenario.duplicateTooltip'),
          delete: t('timeline.scenario.deleteTooltip'),
          add: t('timeline.scenario.addTooltip'),
          analysis: t('timeline.analysis.button'),
          open: t('common.load'),
          export: t('common.export'),
          more: t('timeline.header.more'),
          reset: t('common.reset'),
          view: t('timeline.header.sectionViewLayers'),
          viewLayers: {
            upperEffects: t('timeline.header.viewLayers.upperEffects'),
            lowerBuffs: t('timeline.header.viewLayers.lowerBuffs'),
            gauge: t('timeline.header.viewLayers.gauge'),
            skillDecorations: t('timeline.header.viewLayers.skillDecorations'),
            skillErrors: t('timeline.header.viewLayers.skillErrors'),
            hitMarkers: t('timeline.header.viewLayers.hitMarkers'),
            comboWindows: t('timeline.header.viewLayers.comboWindows'),
            switchMarkers: t('timeline.header.viewLayers.switchMarkers'),
            effectLinks: t('timeline.header.viewLayers.effectLinks'),
          },
          viewOperators: t('timeline.header.sectionViewOperators'),
          viewOperatorsEmpty: t('timeline.header.hideEffectsEmpty'),
          shortcuts: t('timeline.header.shortcutsLabel'),
          preferences: t('timeline.header.sectionPrefs'),
          keycapMode: t('display.keycapMode'),
          keyboardKeycaps: t('display.keyboardKeycaps'),
          gamepadKeycaps: t('display.gamepadKeycaps'),
          appearance: t('common.appearance'),
          appearanceLight: t('common.appearanceLight'),
          appearanceDark: t('common.appearanceDark'),
          locales: {
            zhCN: t('locale.zhCNShort'),
            en: t('locale.enShort'),
          },
        }"
        @analysis="showDamageAnalysis = true"
        @shortcuts="showShortcutHelp = true"
        @rename="renameScenario"
        @duplicate="duplicateScenario"
        @delete="removeScenario"
        @add="addScenario"
        @select="selectScenario"
        @open="requestOpenProject"
        @receive="requestReceiveProject"
        @export="showExportDialog = true"
        @reset="resetDialogVisible = true"
        @toggle-view-layer="toggleTimelineViewLayer"
        @toggle-operator-effects="toggleOperatorEffectsVisibility"
        @set-locale="selectTimelineLocale"
        @set-appearance="setAppearance"
        @set-keycap-mode="keycapMode = $event"
        @set-random-mode="setScenarioRandomMode"
        @set-global-random-seed="setGlobalRandomSeed"
        @roll-global-random-seed="rollGlobalRandomSeed"
        @clear-selection="clearTimelineSelection"
      />
    </template>

    <div class="timeline-workspace">
      <div
        ref="timelineScroll"
        class="timeline-scroll"
        :class="{
          'is-panning': isPanning,
          'is-compact-buff-layout': buffLayoutMode === 'compact',
        }"
        @wheel="handleTimelineWheel"
        @scroll="updateTimelineViewportMetrics"
      >
        <div
          ref="timelineSurface"
          class="timeline-surface"
          :class="{
            'is-library-placing': libraryPlacement !== null,
            'is-history-collapsed': !scenario.editor.prepExpanded,
          }"
          :style="timelineSurfaceStyle"
          @mousemove="updateCursorGuide"
          @mouseleave="hideCursorGuide"
          @contextmenu.capture="cancelPlacementFromContextMenu"
        >
          <div class="corner-placeholder">
            <TimelineCornerToolbar
              :configuration-read-only="configurationReadOnly"
              :snap-label="snapFrames === PRECISE_TIMELINE_SNAP_FRAMES ? '1f' : '0.1s'"
              :zoom-percent="timelineZoomPercent"
              :initial-gauge-mode="initialUltimateEnergyPresetMode"
              :initial-gauge-display-value="initialUltimateEnergyDisplayValue"
              :labels="{
                initialGauge: t('timelineGrid.toolbar.initialGauge'),
                snapPrecision: t('timelineGrid.toolbar.snapPrecision'),
                zoom: 'SCALE',
              }"
              @toggle-snap-precision="toggleSnapPrecision"
              @cycle-initial-gauge="cycleInitialUltimateEnergyPreset"
              @set-unified-initial-gauge="setUnifiedTrackInitialUltimateEnergy"
              @update-zoom-percent="updateTimelineZoomPercent"
              @set-zoom-percent="setTimelineZoomPercent"
            />
          </div>
          <TimelineRuler
            :prep-read-only="configurationReadOnly"
            class="timeline-ruler"
            :style="{ width: `${timelineWidth}px` }"
            :prep-frames="displayedTimelinePrepFrames"
            :prep-expanded="scenario.editor.prepExpanded"
            :prep-end-frame="scenario.inheritance?.frame ?? 0"
            :duration-frames="scenario.battle.durationFrames"
            :cursor-frame="cursorFrame"
            :px-per-frame="pxPerFrame"
            :snap-frames="snapFrames"
            :operations="rulerOperations"
            :keycap-mode="keycapMode"
            :visible-left-px="Math.max(0, timelineScrollLeft - TIMELINE_TRACK_HEADER_WIDTH)"
            :visible-width-px="timelineViewportWidth"
            @seek="seekTimeline"
            @prep-info="openInheritanceInfo"
            @resize-history="beginInheritedHistoryResize"
            @set-prep-frames="setTimelinePrepFrames"
            @set-duration-frames="setTimelineDurationFrames"
          />
          <div
            class="timeline-battle-start-boundary"
            :class="{ 'is-prep-collapsed': !scenario.editor.prepExpanded }"
            :style="{
              left: `${TIMELINE_TRACK_HEADER_WIDTH + timelineFramePx(scenario.inheritance?.frame ?? 0, displayedTimelinePrepFrames)}px`,
            }"
            :title="
              t(
                configurationReadOnly
                  ? 'inheritance.boundary'
                  : 'timelineGrid.prep.setDurationTitle',
              )
            "
            @pointerdown="beginTimelinePrepResize"
            @contextmenu="openInheritanceInfo"
          ></div>
          <div
            v-if="
              scenario.battle.prepFrames + (scenario.inheritance?.frame ?? 0) > 0 &&
              !scenario.editor.prepExpanded
            "
            class="prep-collapsed-entry"
            :style="{ left: `${TIMELINE_TRACK_HEADER_WIDTH}px` }"
          >
            <span>{{
              t(configurationReadOnly ? 'inheritance.boundary' : 'timelineGrid.prep.title')
            }}</span>
            <EaButton
              variant="ghost"
              size="sm"
              icon-only
              type="button"
              :title="t('timelineGrid.prep.expand')"
              @click.stop="setPrepExpanded(true)"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="8 6 16 12 8 18" /></svg>
            </EaButton>
            <span>{{ t('timelineGrid.prep.expand') }}</span>
          </div>
          <div
            v-else-if="scenario.battle.prepFrames + (scenario.inheritance?.frame ?? 0) > 0"
            class="prep-expanded-collapse"
            :style="{
              left: `${TIMELINE_TRACK_HEADER_WIDTH + Math.max(0, timelineFramePx(scenario.inheritance?.frame ?? 0) - 18)}px`,
            }"
          >
            <EaButton
              variant="ghost"
              size="sm"
              icon-only
              type="button"
              :title="
                t(
                  configurationReadOnly
                    ? 'inheritance.collapseHistory'
                    : 'timelineGrid.prep.collapseTitle',
                )
              "
              @click.stop="setPrepExpanded(false)"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <polyline points="16 6 8 12 16 18" />
              </svg>
            </EaButton>
          </div>
          <TimelineConnectionLayer
            v-if="timelineViewLayers.effectLinks || connectionDrag !== null"
            :scenario="scenario"
            :tracks="viewModel.tracks"
            :px-per-frame="pxPerFrame"
            :prep-expanded="scenario.editor.prepExpanded"
            :prep-end-frame="scenario.inheritance?.frame ?? 0"
            :track-header-width="TIMELINE_TRACK_HEADER_WIDTH"
            :cast-actual-start-frames="skillCastActualStartFrames"
            :cast-actual-duration-frames="skillCastActualDurationFrames"
            :selected-connection-id="selectedConnectionId"
            :hovered-skill-cast-id="hoveredCastId"
            :dragging-connection="connectionDrag !== null"
            :visible-track-indices="visibleEffectTrackIndices"
            :ruler-height="TIMELINE_RULER_HEIGHT"
            :track-layouts="
              viewModel.tracks.map(track =>
                trackEffectLayout(track.trackIndex, track.operatorInstanceId),
              )
            "
            :preview="connectionDrag"
            @select="selectTimelineConnection"
            @contextmenu="openConnectionContextMenu"
            @retarget="beginConnectionRetarget"
          />
          <div
            v-if="showCursorGuide && cursorGuide !== null && marqueeStyle === null"
            class="cursor-guide"
            :style="{ left: `${TIMELINE_TRACK_HEADER_WIDTH + cursorGuide.leftPx}px` }"
          >
            <div
              class="cursor-guide__info"
              :style="{ transform: `translate3d(0, ${timelineScrollTop + 4}px, 0)` }"
            >
              <TimelineCursorGuide
                :time="cursorGuideMetrics.time"
                :sp="cursorGuideMetrics.sp"
                :poise="cursorGuideMetrics.poise"
                :enemy-health="cursorGuideMetrics.enemyHealth"
                :gauges="cursorGuideMetrics.gauges"
                :enemy-effects="cursorEnemyEffects.effects"
                :enemy-effect-overflow="cursorEnemyEffects.overflow"
              />
            </div>
          </div>
          <div
            v-if="alignmentGuide !== null"
            class="alignment-guide"
            :style="{
              left: `${alignmentGuide.left}px`,
              top: `${alignmentGuide.top}px`,
              height: `${alignmentGuide.height}px`,
              color: alignmentGuide.color,
            }"
          >
            <span>{{ alignmentGuide.label }}</span>
          </div>
          <TimelineTimeDilationBands
            :bands="timeDilationBands"
            :source-cast-ids="highlightedTimeDilationSourceIds"
            :prep-frames="scenario.battle.prepFrames"
            :prep-expanded="scenario.editor.prepExpanded"
            :prep-end-frame="scenario.inheritance?.frame ?? 0"
            :px-per-frame="pxPerFrame"
            :horizontal-offset="TIMELINE_TRACK_HEADER_WIDTH"
          />
          <div
            v-if="
              !scenario.inheritance && scenario.battle.simulationRange?.startFrame !== undefined
            "
            class="simulation-range-dim simulation-range-dim--start"
            :style="{
              left: `${TIMELINE_TRACK_HEADER_WIDTH}px`,
              width: `${timelineFramePx(displayedMarkerFrame('simulationStart', 'simulationStart', scenario.battle.simulationRange.startFrame))}px`,
            }"
          ></div>
          <div
            v-if="scenario.battle.simulationRange?.endFrame !== undefined"
            class="simulation-range-dim simulation-range-dim--end"
            :style="{
              left: `${TIMELINE_TRACK_HEADER_WIDTH + timelineFramePx(displayedMarkerFrame('simulationEnd', 'simulationEnd', scenario.battle.simulationRange.endFrame))}px`,
            }"
          ></div>
          <div
            v-if="
              !scenario.inheritance && scenario.battle.simulationRange?.startFrame !== undefined
            "
            class="timeline-marker simulation-range-marker simulation-range-marker--start"
            :class="{ selected: selectedMarker?.kind === 'simulationStart' }"
            :style="{
              left: `${TIMELINE_TRACK_HEADER_WIDTH + timelineFramePx(displayedMarkerFrame('simulationStart', 'simulationStart', scenario.battle.simulationRange.startFrame))}px`,
            }"
            @pointerdown="
              beginMarkerMove(
                $event,
                'simulationStart',
                'simulationStart',
                scenario.battle.simulationRange.startFrame,
              )
            "
            @contextmenu="
              openExistingMarkerContextMenu(
                $event,
                'simulationStart',
                'simulationStart',
                scenario.battle.simulationRange.startFrame,
                selectedTrack,
                t(
                  configurationReadOnly
                    ? 'inheritance.boundary'
                    : 'timeline.markerLabels.simulationStart',
                ),
              )
            "
          >
            <span>{{
              formatGuideFrame(
                displayedMarkerFrame(
                  'simulationStart',
                  'simulationStart',
                  scenario.battle.simulationRange.startFrame,
                ),
              )
            }}</span>
            <b>{{
              t(
                configurationReadOnly
                  ? 'inheritance.boundary'
                  : 'timeline.markerLabels.simulationStart',
              )
            }}</b>
          </div>
          <div
            v-if="scenario.battle.simulationRange?.endFrame !== undefined"
            class="timeline-marker simulation-range-marker simulation-range-marker--end"
            :class="{ selected: selectedMarker?.kind === 'simulationEnd' }"
            :style="{
              left: `${TIMELINE_TRACK_HEADER_WIDTH + timelineFramePx(displayedMarkerFrame('simulationEnd', 'simulationEnd', scenario.battle.simulationRange.endFrame))}px`,
            }"
            @pointerdown="
              beginMarkerMove(
                $event,
                'simulationEnd',
                'simulationEnd',
                scenario.battle.simulationRange.endFrame,
              )
            "
            @contextmenu="
              openExistingMarkerContextMenu(
                $event,
                'simulationEnd',
                'simulationEnd',
                scenario.battle.simulationRange.endFrame,
                selectedTrack,
                t('timeline.markerLabels.simulationEnd'),
              )
            "
          >
            <span>{{
              formatGuideFrame(
                displayedMarkerFrame(
                  'simulationEnd',
                  'simulationEnd',
                  scenario.battle.simulationRange.endFrame,
                ),
              )
            }}</span>
            <b>{{ t('timeline.markerLabels.simulationEnd') }}</b>
          </div>
          <div
            v-for="boundary in scenario.battle.cycleBoundaries"
            :key="boundary.id"
            class="timeline-marker cycle-boundary-marker"
            :class="{
              selected:
                selectedMarker?.kind === 'cycleBoundary' && selectedMarker.id === boundary.id,
            }"
            :style="{
              left: `${TIMELINE_TRACK_HEADER_WIDTH + timelineFramePx(displayedMarkerFrame('cycleBoundary', boundary.id, boundary.frame))}px`,
            }"
            @pointerdown="beginMarkerMove($event, 'cycleBoundary', boundary.id, boundary.frame)"
            @contextmenu="
              openExistingMarkerContextMenu(
                $event,
                'cycleBoundary',
                boundary.id,
                boundary.frame,
                selectedTrack,
                t('timeline.markerLabels.cycleBoundary'),
              )
            "
          >
            <span>{{
              formatGuideFrame(displayedMarkerFrame('cycleBoundary', boundary.id, boundary.frame))
            }}</span>
            <b>{{ t('timeline.markerLabels.cycleBoundary') }}</b>
          </div>
          <div
            v-for="marker in (scenario.battle.externalEventMarkers ?? []).filter(
              item => item.target.scope === 'team',
            )"
            :key="marker.id"
            class="timeline-marker team-event-marker"
            :class="{
              'combo-cooldown-guide': true,
              'is-ready': marker.event.mode === 'ready',
              selected: selectedMarker?.kind === 'externalEvent' && selectedMarker.id === marker.id,
            }"
            :title="t(`comboControl.${marker.event.mode}`)"
            :style="{
              left: `${TIMELINE_TRACK_HEADER_WIDTH + timelineFramePx(displayedMarkerFrame('externalEvent', marker.id, marker.frame))}px`,
            }"
            @pointerdown="beginMarkerMove($event, 'externalEvent', marker.id, marker.frame)"
            @contextmenu="
              openExistingMarkerContextMenu(
                $event,
                'externalEvent',
                marker.id,
                marker.frame,
                selectedTrack,
                t(`comboControl.${marker.event.mode}`),
              )
            "
          >
            <div class="combo-cooldown-marker">
              <svg v-if="marker.event.mode === 'ready'" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 11a8 8 0 1 1-2.3-5.7" />
                <path d="M20 4v7h-7" />
              </svg>
              <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="8" />
                <path d="M12 7v5l3 2" />
              </svg>
            </div>
          </div>

          <div class="track-stack">
            <div
              v-for="track in viewModel.tracks"
              :key="track.trackIndex"
              class="track-row"
              :class="{ selected: isTrackIdentitySelected(track.trackIndex) }"
              :style="{
                height: `${trackEffectLayout(track.trackIndex, track.operatorInstanceId).height}px`,
              }"
            >
              <TimelineTrackHeader
                :read-only="configurationReadOnly"
                class="track-identity"
                :track="track"
                :name="operatorName(track.operatorSlug)"
                :form-name="operatorFormNamesByTrack[track.trackIndex] ?? null"
                :selected="isTrackIdentitySelected(track.trackIndex)"
                :reorder-source="
                  dragPayload?.kind === 'trackOrder' && dragPayload.trackIndex === track.trackIndex
                "
                :reorder-target="
                  trackOrderDropTarget === track.trackIndex &&
                  !(
                    dragPayload?.kind === 'trackOrder' &&
                    dragPayload.trackIndex === track.trackIndex
                  )
                "
                :can-move-up="track.trackIndex > 0"
                :can-move-down="track.trackIndex < 3"
                :stat-details-available="panelResolution.panels.has(track.trackIndex)"
                :stat-details-error="panelResolution.error"
                :weapon-icon="loadoutModels[track.trackIndex]?.weapon?.definition.iconPath ?? null"
                :gear-icons="{
                  armor: loadoutModels[track.trackIndex]?.gears.armor?.definition.iconPath ?? null,
                  gloves:
                    loadoutModels[track.trackIndex]?.gears.gloves?.definition.iconPath ?? null,
                  accessory1:
                    loadoutModels[track.trackIndex]?.gears.accessory1?.definition.iconPath ?? null,
                  accessory2:
                    loadoutModels[track.trackIndex]?.gears.accessory2?.definition.iconPath ?? null,
                }"
                :active-gear-set-label="activeGearSetLabelsByTrack[track.trackIndex] ?? ''"
                :labels="{
                  operator: t('timelineGrid.track.changeOperatorTooltip'),
                  weapon: t('timelineGrid.track.selectWeaponTooltip'),
                  armor: t('timelineGrid.equipmentSlot.armor'),
                  gloves: t('timelineGrid.equipmentSlot.gloves'),
                  accessory1: t('timelineGrid.equipmentSlot.accessory1'),
                  accessory2: t('timelineGrid.equipmentSlot.accessory2'),
                }"
                @select="selectTrack(track.trackIndex)"
                @operator="openOperatorDialog(track.trackIndex)"
                @move-up="moveTrack(track.trackIndex, -1)"
                @move-down="moveTrack(track.trackIndex, 1)"
                @reorder-drag-start="beginTrackOrderDrag($event, track.trackIndex)"
                @reorder-drag-end="finishTrackOrderDrag"
                @reorder-drag-enter="
                  trackOrderDropTarget =
                    dragPayload?.kind === 'trackOrder' ? track.trackIndex : null
                "
                @reorder-drag-leave="
                  trackOrderDropTarget =
                    trackOrderDropTarget === track.trackIndex ? null : trackOrderDropTarget
                "
                @reorder-drop="dropTrackOrder($event, track.trackIndex)"
                @stats="openPanelDialog(track.trackIndex)"
                @weapon="openWeaponDialog(track.trackIndex)"
                @gear="openGearDialog(track.trackIndex, $event)"
                @update-initial-ultimate-energy="
                  setTrackInitialUltimateEnergy(track.trackIndex, $event)
                "
              />
              <div
                :ref="element => registerTrackDropRegion(track.trackIndex, element)"
                class="track-lane"
                :data-track-index="track.trackIndex"
                :style="{
                  width: `${timelineWidth}px`,
                  height: `${trackEffectLayout(track.trackIndex, track.operatorInstanceId).height}px`,
                  '--timeline-action-top': `${trackEffectLayout(track.trackIndex, track.operatorInstanceId).actionTop}px`,
                  '--timeline-action-guide-top': `${trackEffectLayout(track.trackIndex, track.operatorInstanceId).actionTop - 2}px`,
                }"
                @pointerdown.capture="captureLibraryPlacementPointerDown"
                @pointerdown="handleTimelineLanePointerDown"
                @pointerup.capture="placePendingLibrarySkill($event, track.trackIndex)"
                @click="handleTimelineLaneClick"
                @contextmenu="openMarkerContextMenu($event, track.trackIndex)"
                @dragover="allowTimelinePayloadDrop"
                @drop.prevent="dropTimelinePayload($event, track.trackIndex)"
              >
                <template
                  v-if="
                    timelineViewLayers.skillDecorations &&
                    isOperatorEffectsVisible(track.trackIndex)
                  "
                >
                  <div
                    v-for="band in controlledComboCooldownBands.filter(
                      item => item.operatorId === track.operatorInstanceId,
                    )"
                    :key="`${band.skillId}:${band.startFrame}`"
                    class="controlled-combo-cooldown-bar"
                    :style="{
                      left: `${timelineFramePx(band.startFrame)}px`,
                      width: `${timelineFrameSpanPx(band.startFrame, band.endFrame - band.startFrame)}px`,
                    }"
                  >
                    <span>{{
                      formatTimeWithFrames((band.endFrame - band.startFrame) / PROJECT_FPS)
                    }}</span
                    ><i></i>
                  </div>
                </template>
                <TimelineTrackGauge
                  v-if="timelineViewLayers.gauge && isOperatorEffectsVisible(track.trackIndex)"
                  :curve="gaugeCurveFor(track.trackIndex)"
                  :color="gaugeColorFor(track.trackIndex)"
                  :prep-frames="scenario.battle.prepFrames"
                  :prep-expanded="scenario.editor.prepExpanded"
                  :prep-end-frame="scenario.inheritance?.frame ?? 0"
                  :duration-frames="scenario.battle.durationFrames"
                  :px-per-frame="pxPerFrame"
                />
                <TimelineBuffBands
                  v-if="
                    timelineViewLayers.upperEffects && isOperatorEffectsVisible(track.trackIndex)
                  "
                  :segments="buffSegmentsForTarget(track.operatorInstanceId, 'upper')"
                  :source-name="buffSourceName"
                  :display-name="buffDisplayName"
                  :operator-buff-name-keys="operatorBuffDisplayNameKeys"
                  :icon="buffIcon"
                  :prep-frames="scenario.battle.prepFrames"
                  :prep-expanded="scenario.editor.prepExpanded"
                  :prep-end-frame="scenario.inheritance?.frame ?? 0"
                  :px-per-frame="pxPerFrame"
                  placement="upper"
                  :action-top="
                    trackEffectLayout(track.trackIndex, track.operatorInstanceId).actionTop
                  "
                  @open-detail="openBuffDetail"
                />
                <TimelineOperatorPassiveUiBands
                  v-if="
                    timelineViewLayers.upperEffects && isOperatorEffectsVisible(track.trackIndex)
                  "
                  :segments="operatorPassiveUiSegmentsForTarget(track.operatorInstanceId)"
                  :prep-frames="scenario.battle.prepFrames"
                  :prep-expanded="scenario.editor.prepExpanded"
                  :prep-end-frame="scenario.inheritance?.frame ?? 0"
                  :px-per-frame="pxPerFrame"
                  :action-top="
                    trackEffectLayout(track.trackIndex, track.operatorInstanceId).actionTop
                  "
                  :operator-name="operatorName(track.operatorSlug)"
                  @open-detail="openOperatorPassiveUiDetail"
                />
                <TimelineBuffBands
                  v-if="timelineViewLayers.lowerBuffs && isOperatorEffectsVisible(track.trackIndex)"
                  :segments="buffSegmentsForTarget(track.operatorInstanceId, 'lower')"
                  :source-name="buffSourceName"
                  :display-name="buffDisplayName"
                  :operator-buff-name-keys="operatorBuffDisplayNameKeys"
                  :icon="buffIcon"
                  :prep-frames="scenario.battle.prepFrames"
                  :prep-expanded="scenario.editor.prepExpanded"
                  :prep-end-frame="scenario.inheritance?.frame ?? 0"
                  :px-per-frame="pxPerFrame"
                  placement="lower"
                  :action-top="
                    trackEffectLayout(track.trackIndex, track.operatorInstanceId).actionTop
                  "
                  @open-detail="openBuffDetail"
                />
                <TimelineComboWindowBands
                  v-if="
                    timelineViewLayers.comboWindows && isOperatorEffectsVisible(track.trackIndex)
                  "
                  :segments="comboWindowSegmentsFor(track.operatorInstanceId)"
                  :prep-frames="scenario.battle.prepFrames"
                  :prep-expanded="scenario.editor.prepExpanded"
                  :prep-end-frame="scenario.inheritance?.frame ?? 0"
                  :px-per-frame="pxPerFrame"
                  :action-top="
                    trackEffectLayout(track.trackIndex, track.operatorInstanceId).actionTop
                  "
                  :label="t('timeline.header.viewLayers.comboWindows')"
                  :perfect-label="t('effects.name.perfectTiming')"
                />
                <div
                  class="prep-zone"
                  :style="{
                    width: `${timelineFramePx(scenario.inheritance?.frame ?? 0, displayedTimelinePrepFrames)}px`,
                  }"
                ></div>
                <div
                  class="battle-start-line"
                  :style="{
                    left: `${timelineFramePx(scenario.inheritance?.frame ?? 0, displayedTimelinePrepFrames)}px`,
                  }"
                ></div>
                <EaButton
                  v-for="use in scenario.tracks[track.trackIndex]?.consumableUses ?? []"
                  :key="use.id"
                  type="button"
                  variant="ghost"
                  icon-only
                  class="timeline-marker consumable-use-marker"
                  :class="{
                    dragging:
                      consumableMoveGesture?.useId === use.id && consumableMoveGesture.dragStarted,
                  }"
                  :pressed="selectedConsumableUseId === use.id"
                  :style="{
                    left: `${timelineFramePx(displayedConsumableUseFrame(use.id, use.frame))}px`,
                  }"
                  :title="getConsumableGameName(use.consumableId)"
                  @pointerdown="beginConsumableUseMove($event, track.trackIndex, use.id, use.frame)"
                  @click.stop="
                    selectedConsumableUseId = use.id;
                    clearTimelineSelection();
                  "
                  @contextmenu="
                    openExistingConsumableContextMenu(
                      $event,
                      track.trackIndex,
                      use.id,
                      use.frame,
                      getConsumableGameName(use.consumableId),
                    )
                  "
                >
                  <img
                    :src="gameDataRepository.getConsumable(use.consumableId)?.iconPath"
                    alt=""
                    aria-hidden="true"
                  />
                </EaButton>
                <div
                  v-if="
                    timelineViewLayers.switchMarkers && isOperatorEffectsVisible(track.trackIndex)
                  "
                  v-for="marker in scenario.battle.controlSwitches.filter(
                    item => item.trackIndex === track.trackIndex,
                  )"
                  :key="marker.id"
                  class="timeline-marker track-switch-marker"
                  :class="{
                    selected:
                      selectedMarker?.kind === 'controlSwitch' && selectedMarker.id === marker.id,
                    dragging:
                      markerMoveGesture?.kind === 'controlSwitch' &&
                      markerMoveGesture.id === marker.id &&
                      markerMoveGesture.dragStarted,
                  }"
                  :style="{
                    left: `${timelineFramePx(displayedMarkerFrame('controlSwitch', marker.id, marker.frame))}px`,
                  }"
                  @pointerdown="
                    beginMarkerMove(
                      $event,
                      'controlSwitch',
                      marker.id,
                      marker.frame,
                      track.trackIndex,
                    )
                  "
                  @click.stop
                  @contextmenu="
                    openExistingMarkerContextMenu(
                      $event,
                      'controlSwitch',
                      marker.id,
                      marker.frame,
                      track.trackIndex,
                      t('timeline.markerLabels.controlSwitch'),
                    )
                  "
                >
                  <OperatorAvatar
                    v-if="track.operatorSlug"
                    class="track-switch-marker__avatar"
                    :src="getOperatorAvatarPath(track.operatorAssetSlug ?? track.operatorSlug)"
                  />
                  <span class="track-switch-marker__time">
                    {{
                      formatGuideFrame(
                        displayedMarkerFrame('controlSwitch', marker.id, marker.frame),
                      )
                    }}
                  </span>
                  <i class="track-switch-marker__pointer"></i>
                </div>
                <div
                  v-for="marker in (scenario.battle.dodgeMarkers ?? []).filter(
                    item => item.trackIndex === track.trackIndex,
                  )"
                  :key="marker.id"
                  class="timeline-marker dodge-marker"
                  :class="{
                    'dodge-marker--perfect': marker.mode.kind === 'perfectDodge',
                    'dodge-marker--warning': dodgeMarkerWarningIds.has(marker.id),
                    selected: selectedMarker?.kind === 'dodge' && selectedMarker.id === marker.id,
                    dragging:
                      markerMoveGesture?.kind === 'dodge' &&
                      markerMoveGesture.id === marker.id &&
                      markerMoveGesture.dragStarted,
                  }"
                  :style="{
                    left: `${timelineFramePx(displayedMarkerFrame('dodge', marker.id, marker.frame))}px`,
                  }"
                  :title="
                    dodgeMarkerDiagnosticsById.get(marker.id)?.join('\n') ||
                    t(`timeline.markerLabels.${marker.mode.kind}`)
                  "
                  @pointerdown="
                    beginMarkerMove($event, 'dodge', marker.id, marker.frame, track.trackIndex)
                  "
                  @click.stop
                  @contextmenu="
                    openExistingMarkerContextMenu(
                      $event,
                      'dodge',
                      marker.id,
                      marker.frame,
                      track.trackIndex,
                      t(`timeline.markerLabels.${marker.mode.kind}`),
                    )
                  "
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 15c4-7 9-8 16-6M13 5l7 4-5 6" />
                    <path
                      v-if="marker.mode.kind === 'perfectDodge'"
                      d="m6 4 .8 2.2L9 7l-2.2.8L6 10l-.8-2.2L3 7l2.2-.8Z"
                    />
                  </svg>
                  <span v-if="dodgeMarkerWarningIds.has(marker.id)" class="dodge-marker__warning">{{
                    dodgeMarkerResults.get(marker.id)?.status === 'warning' ? '!' : '?'
                  }}</span>
                  <span
                    v-if="
                      selectedMarker?.kind === 'dodge' &&
                      selectedMarker.id === marker.id &&
                      marker.mode.kind === 'perfectDodge' &&
                      marker.mode.successDelayFrames > 0
                    "
                    class="dodge-marker__success-point"
                    :style="{
                      left: `calc(50% + ${timelineFramePx(marker.frame + marker.mode.successDelayFrames) - timelineFramePx(marker.frame)}px)`,
                    }"
                    aria-hidden="true"
                  ></span>
                  <i class="dodge-marker__pointer"></i>
                </div>
                <TimelineSkillCastGroupMarker
                  v-for="group in skillCastGroupsByTrack[track.trackIndex]"
                  :key="group.anchor.id"
                  :left="timelineFramePx(displayedSkillCastStartFrames.get(group.anchor.id)!)"
                  :width="
                    timelineFrameSpanPx(
                      displayedSkillCastStartFrames.get(group.anchor.id)!,
                      skillCastGroupEndFrame(group.casts.map(cast => cast.id)) -
                        displayedSkillCastStartFrames.get(group.anchor.id)!,
                    )
                  "
                  :label="t('timeline.continuousGroup.label', { count: group.casts.length })"
                  :selected="group.casts.every(cast => actionSelection.selectedIds.has(cast.id))"
                  @select="selectSkillCastGroup(group.casts.map(cast => cast.id))"
                />
                <TimelineActionBlock
                  v-for="(cast, castIndex) in track.skillCasts"
                  :key="cast.id"
                  :action-id="cast.id"
                  :label="timelineCastLabel(cast, track)"
                  :skill-type="cast.skillType"
                  :left="timelineFramePx(castActualStartFrame(cast.id, cast.startFrame))"
                  :width="
                    timelineFrameSpanPx(
                      castActualStartFrame(cast.id, cast.startFrame),
                      Math.max(
                        0,
                        (visibleSkillEndFrames.get(cast.id) ?? cast.startFrame) -
                          castActualStartFrame(cast.id, cast.startFrame),
                      ),
                    )
                  "
                  :stack-order="castIndex"
                  :duration-pending="castActualDurationPending(cast.id, cast.durationFrames)"
                  :selected="actionSelection.selectedIds.has(cast.id)"
                  :perfect="perfectComboCastIds.has(cast.id)"
                  :moving="
                    !castMoveGesture?.committed &&
                    castMoveGesture?.dragStarted &&
                    castMoveGesture?.skillCastIds.includes(cast.id)
                  "
                  :disabled="cast.disabled"
                  :locked="cast.locked"
                  :edited="cast.edited"
                  :show-decorations="
                    timelineViewLayers.skillDecorations &&
                    isOperatorEffectsVisible(track.trackIndex)
                  "
                  :locked-text="t('actionItem.lockedTitle')"
                  :disabled-text="t('actionItem.disabledTitle')"
                  :edited-text="t('actionItem.editedTitle')"
                  :color="cast.color ?? skillAccentColor(cast.skillType, track.operatorSlug)"
                  :connection-tool-enabled="connectionToolEnabled"
                  :connection-dragging="connectionDrag !== null"
                  :connection-source-action-id="connectionDrag?.skillCastId ?? null"
                  :connection-target-valid="isConnectionTargetValid(cast.id)"
                  :warning="
                    timelineViewLayers.skillErrors &&
                    ((compatibleSkillCastReceiptIds.has(cast.id) &&
                      diagnosticsByCastId.has(cast.id)) ||
                      cast.resolutionIssue !== undefined)
                  "
                  :warning-text="castWarningTitle(cast.id, cast.resolutionIssue !== undefined)"
                  :warning-fallback-text="t('common.warning')"
                  :hits="
                    timelineViewLayers.hitMarkers && isOperatorEffectsVisible(track.trackIndex)
                      ? castHitMarkers(track.trackIndex, cast.id)
                      : []
                  "
                  :time-dilation-segments="
                    timelineViewLayers.skillDecorations &&
                    isOperatorEffectsVisible(track.trackIndex)
                      ? castTimeDilationSegments(
                          cast.id,
                          cast.startFrame,
                          castActualDurationFrame(cast.id, cast.durationFrames),
                        )
                      : []
                  "
                  :cooldown-bars="
                    timelineViewLayers.skillDecorations &&
                    isOperatorEffectsVisible(track.trackIndex)
                      ? cooldownBarsForCast(cast.id, cast.startFrame)
                      : []
                  "
                  :enhancement-bars="
                    timelineViewLayers.skillDecorations &&
                    isOperatorEffectsVisible(track.trackIndex)
                      ? enhancementBarsForCast(
                          cast.id,
                          castActualStartFrame(cast.id, cast.startFrame),
                        )
                      : []
                  "
                  :px-per-frame="pxPerFrame"
                  @select="handleActionSelection($event, cast.id)"
                  @hit-click="
                    (hitId, executionFrame) =>
                      (hitDetailTarget = {
                        trackIndex: track.trackIndex,
                        castId: cast.id,
                        hitId,
                        ...(executionFrame === undefined ? {} : { executionFrame }),
                      })
                  "
                  @connection-pointer-down="
                    (event, port) => beginConnectionDrag(event, cast.id, port)
                  "
                  @move-pointer-down="beginCastMove($event, track.trackIndex, cast.id)"
                  @pointermove="updateAlignmentGuide($event, cast.id)"
                  @hover-change="setCastHovered(cast.id, $event)"
                  @contextmenu="openCastContextMenu($event, track.trackIndex, cast.id)"
                />
              </div>
              <div
                v-if="
                  buffLayoutMode === 'compact' && track.trackIndex < viewModel.tracks.length - 1
                "
                class="track-row-resizer"
                :class="{
                  'is-active': compactTrackResizeGesture?.dividerIndex === track.trackIndex,
                }"
                :aria-label="t('timelineGrid.toolbar.resizeTrack')"
                role="separator"
                aria-orientation="horizontal"
                @pointerdown="beginCompactTrackResize($event, track.trackIndex)"
                @dblclick.stop="resetCompactTrackLayout()"
              ></div>
            </div>
          </div>
        </div>
      </div>
      <div
        ref="timelineHorizontalScrollbar"
        class="timeline-horizontal-scrollbar"
        :aria-label="t('timelineGrid.toolbar.horizontalScroll')"
        :style="{ marginRight: `${timelineVerticalScrollbarWidth}px` }"
        tabindex="0"
        @scroll="updateTimelineHorizontalScroll"
      >
        <div
          class="timeline-horizontal-scrollbar__spacer"
          :style="{ width: `${timelineWidth}px` }"
        ></div>
      </div>
      <div
        ref="timelineVerticalScrollbar"
        class="timeline-vertical-scrollbar"
        :class="{
          'is-hidden': buffLayoutMode === 'compact' || timelineVerticalScrollRange === 0,
        }"
        :aria-label="t('timelineGrid.toolbar.verticalScroll')"
        tabindex="0"
        @scroll="updateTimelineVerticalScroll"
      >
        <div
          class="timeline-vertical-scrollbar__spacer"
          :style="{ height: `${timelineVerticalScrollbarHeight + timelineVerticalScrollRange}px` }"
        ></div>
      </div>
    </div>
    <div v-if="marqueeStyle" class="timeline-marquee" :style="marqueeStyle"></div>

    <template #bottom="{ tool, collapsePanel, expandAllToken }">
      <GlobalResourcePanel
        :read-only="configurationReadOnly"
        v-if="tool === 'global'"
        mode="presets"
        :config="scenario.globalConfig"
        @set-modifiers="setGlobalModifiers"
        @set-config="updateGlobalConfig"
      />
      <section v-else-if="tool === 'enemy'" class="simulation-panel">
        <div v-if="simulationRun !== null" class="simulation-curves">
          <TimelineEnemyStatusSections
            @collapsed-count-change="collapsedMonitorSectionCount = $event"
            :expand-all-token="expandAllToken"
            :labels="{
              affliction: t('resourceMonitor.modules.enemyStatus'),
              poise: t('resourceMonitor.modules.stagger'),
              sp: t('resourceMonitor.modules.sp'),
            }"
            :collapse-label="t('common.close')"
            :expand-label="t('timelineGrid.prep.expand')"
            @collapse-panel="collapsePanel"
          >
            <template #affliction>
              <TimelineEnemyEffects
                @open-damage-detail="
                  hitDetailTarget = null;
                  enemyDamageDetailSequence = $event;
                "
                :duration-frames="scenario.battle.durationFrames"
                v-if="combatHudSnapshot !== null"
                :viz="enemyEffectViz"
                :attachment-buff-ids="attachmentBuffIds"
                :buffs="buffSegmentsForTarget('enemy')"
                :source-name="buffSourceName"
                :display-name="buffDisplayName"
                :operator-buff-name-keys="operatorBuffDisplayNameKeys"
                :icon="buffIcon"
                :timeline-width="timelineWidth"
                :prep-frames="scenario.battle.prepFrames"
                :prep-expanded="scenario.editor.prepExpanded"
                :prep-end-frame="scenario.inheritance?.frame ?? 0"
                :px-per-frame="pxPerFrame"
                :track-header-width="TIMELINE_TRACK_HEADER_WIDTH"
                :scroll-left="timelineScrollLeft"
                :snapshot-frame="enemyLastDamageFrame"
                :hud-snapshot="combatHudSnapshot.enemy"
                :enemy-name="enemyHudName"
                :enemy-level="scenario.enemy.source.level"
                :poise-knot-thresholds="scenario.enemy.editable.stagger.knotThresholds"
                :hud-labels="{
                  status: t('resourceMonitor.modules.enemyStatus'),
                  hp: t('timeline.simGuide.enemyHp'),
                  poise: t('timeline.simGuide.poise'),
                  recovering: t('timeline.simGuide.poiseRecovering'),
                  brokenEndWindow: t('timeline.simGuide.poiseBrokenEndWindow'),
                }"
                :labels="{
                  burst: t('timeline.effect.burst'),
                  reaction: t('timeline.effect.reaction'),
                  reactionConsumed: t('timeline.effect.reactionConsumed'),
                }"
                @open-buff-detail="openBuffDetail"
              />
            </template>
            <template #poise>
              <TimelineResourceCurves
                :poise-broken-segments="poiseBrokenSegments"
                :poise-knot-segments="poiseKnotSegments"
                :poise-knot-thresholds="scenario.enemy.editable.stagger.knotThresholds"
                :poise-broken-label="t('resourceMonitor.stagger.weak')"
                :sp-curve="simulationRun.resourceCurves.sp"
                :poise-curve="simulationRun.poiseCurve"
                :visible-kinds="['poise']"
                :poise-label="t('resourceMonitor.modules.stagger')"
                :timeline-width="timelineWidth"
                :duration-frames="scenario.battle.durationFrames"
                :cursor-frame="simulationRun.frame"
                :prep-frames="scenario.battle.prepFrames"
                :prep-expanded="scenario.editor.prepExpanded"
                :prep-end-frame="scenario.inheritance?.frame ?? 0"
                :px-per-frame="pxPerFrame"
                :track-header-width="TIMELINE_TRACK_HEADER_WIDTH"
                :scroll-left="timelineScrollLeft"
              />
            </template>
            <template #sp>
              <TimelineResourceCurves
                :sp-curve="simulationRun.resourceCurves.sp"
                :visible-kinds="['sp']"
                :timeline-width="timelineWidth"
                :duration-frames="scenario.battle.durationFrames"
                :cursor-frame="cursorFrame"
                :sp-insufficient-label="t('resourceMonitor.sp.insufficient')"
                :prep-frames="scenario.battle.prepFrames"
                :prep-expanded="scenario.editor.prepExpanded"
                :prep-end-frame="scenario.inheritance?.frame ?? 0"
                :px-per-frame="pxPerFrame"
                :track-header-width="TIMELINE_TRACK_HEADER_WIDTH"
                :scroll-left="timelineScrollLeft"
                :sp-label="t('resourceMonitor.modules.sp')"
                :initial-sp="scenario.battle.resourceRules.initialSp"
                :configuration-read-only="configurationReadOnly"
                :sp-recovery-per-second="scenario.battle.resourceRules.spRecoveryPerSecond"
                :initial-sp-label="t('resourceMonitor.labels.initialSp')"
                :sp-recovery-label="t('resourceMonitor.labels.spPerSecond')"
                @update-resource-rule="setBattleResourceRule"
              />
            </template>
          </TimelineEnemyStatusSections>
        </div>
        <div v-else class="simulation-panel__empty">—</div>
      </section>
      <ContingencyContractPanel
        :read-only="configurationReadOnly"
        v-else-if="tool === 'contract'"
        :selected-tag-ids="selectedContingencyContractTagIds"
        :locale="locale"
        @set-selected-tag-ids="setSelectedContingencyContractTagIds"
      />
      <div v-else class="empty-panel">{{ t('timeline.activityBar.contractUnavailable') }}</div>
    </template>
    <template #right="{ tool }">
      <TimelineExternalEventInspector
        v-if="tool === 'inspector' && selectedExternalEventMarker !== null"
        :marker="selectedExternalEventMarker"
        :read-only="isHistoricalInputFrame(selectedExternalEventMarker.frame)"
        :maximum-frame="scenario.battle.durationFrames"
        :target-label="selectedExternalEventTargetLabel"
        @set-frame="setSelectedExternalEventFrame"
        @remove="removeSelectedExternalEvent"
      />
      <TimelineDocumentMarkerInspector
        v-else-if="tool === 'inspector' && selectedDocumentMarker !== null"
        :kind="selectedDocumentMarker.kind"
        :read-only="
          (selectedDocumentMarker.kind === 'simulationStart' && configurationReadOnly) ||
          ((selectedDocumentMarker.kind === 'controlSwitch' ||
            selectedDocumentMarker.kind === 'dodge') &&
            isHistoricalInputFrame(selectedDocumentMarker.frame))
        "
        :id="selectedDocumentMarker.id"
        :success-read-only="
          selectedDocumentMarker.kind === 'dodge' &&
          selectedDocumentMarker.mode.kind === 'perfectDodge'
            ? isHistoricalInputFrame(
                selectedDocumentMarker.frame + selectedDocumentMarker.mode.successDelayFrames,
              )
            : false
        "
        :minimum-success-delay-frames="
          Math.max(
            0,
            (scenario.inheritance?.frame ?? selectedDocumentMarker.frame) -
              selectedDocumentMarker.frame,
          )
        "
        :frame="selectedDocumentMarker.frame"
        :minimum-frame="
          selectedDocumentMarker.kind === 'controlSwitch' || selectedDocumentMarker.kind === 'dodge'
            ? -scenario.battle.prepFrames
            : 0
        "
        :maximum-frame="scenario.battle.durationFrames"
        :track-index="
          selectedDocumentMarker.kind === 'controlSwitch' || selectedDocumentMarker.kind === 'dodge'
            ? selectedDocumentMarker.trackIndex
            : undefined
        "
        :direction="
          selectedDocumentMarker.kind === 'dodge' ? selectedDocumentMarker.direction : undefined
        "
        :dodge-mode="
          selectedDocumentMarker.kind === 'dodge' ? selectedDocumentMarker.mode.kind : undefined
        "
        :success-delay-frames="
          selectedDocumentMarker.kind === 'dodge' &&
          selectedDocumentMarker.mode.kind === 'perfectDodge'
            ? selectedDocumentMarker.mode.successDelayFrames
            : undefined
        "
        :dodge-diagnostics="
          selectedDocumentMarker.kind === 'dodge'
            ? (dodgeMarkerDiagnosticsById.get(selectedDocumentMarker.id) ?? [])
            : []
        "
        :dodge-effects="selectedDodgeEffects"
        :receipt-entries="publishedReceiptEntries"
        :operator-label="publishedOperatorInstanceName"
        :object-icon="publishedObjectIcon"
        :action-presentation="publishedActionPresentation"
        :buff-label="
          buffId =>
            resolveBuffDisplayName(
              buffId,
              { t, te },
              undefined,
              undefined,
              operatorBuffDisplayNameKeys,
            )
        "
        :skill-cast-label="axisSkillBlockLabel"
        :track-options="occupiedTrackOptions"
        @set-frame="setSelectedDocumentMarkerFrame"
        @set-track-index="
          selectedDocumentMarker.kind === 'dodge'
            ? setSelectedDodgeTrack($event)
            : setSelectedControlSwitchTrack($event)
        "
        @set-direction="setSelectedDodgeDirection"
        @set-dodge-mode="setSelectedDodgeMode"
        @set-success-delay-frames="setSelectedDodgeSuccessDelayFrames"
        @remove="removeSelectedDocumentMarker"
      />
      <TimelineActionInspector
        v-else-if="
          tool === 'inspector' && selectedLibraryEntry === null && selectedConsumableUse === null
        "
        :cast="selectedCastModel?.cast ?? null"
        :input-read-only="selectedCastId !== null && isHistoricalSkillInput(selectedCastId)"
        :label="selectedCastModel?.label ?? ''"
        :edited="selectedCastModel?.edited ?? false"
        :diff-count="selectedCastModel?.diffCount ?? 0"
        :template-definition="selectedCastModel?.templateDefinition ?? null"
        :current-definition="selectedCastModel?.currentDefinition ?? null"
        :skill-level="selectedCastModel?.skillLevel ?? 1"
        :minimum-frame="-scenario.battle.prepFrames"
        :maximum-frame="scenario.battle.durationFrames"
        :connections="selectedCastConnections"
        :connection-dragging="
          connectionDrag !== null && connectionDrag.skillCastId === selectedCastId
        "
        :actual-start-frame="
          selectedCastId === null ? undefined : skillCastPlacementActualFrames.get(selectedCastId)
        "
        :grouped="selectedCastId !== null && groupedSkillCastIds.has(selectedCastId)"
        @dissolve-group="dissolveSelectedSkillCastGroups"
        @edit-definition="showSkillDefinitionEditor = true"
        @reset-definition="resetSelectedCastDefinition"
        @set-random-seed="setSelectedCastRandomSeed"
        @roll-random-seed="rollSelectedCastRandomSeed"
        @set-start-frame="setSelectedCastStartFrame"
        @set-locked="setSelectedCastLocked"
        @set-disabled="setSelectedCastDisabled"
        @set-color="setSelectedCastColor"
        @begin-connection="beginSelectedCastConnection"
        @remove-connection="deleteTimelineConnection"
        @update-connection="updateSelectedCastConnection"
      />
      <section
        v-else-if="tool === 'inspector' && selectedConsumableUse !== null"
        class="consumable-inspector"
      >
        <h3>{{ t('consumable.inspectorTitle') }}</h3>
        <label>
          <span>{{ t('consumable.item') }}</span>
          <EaSelect
            size="sm"
            :model-value="selectedConsumableUse.use.consumableId"
            :disabled="isHistoricalInputFrame(selectedConsumableUse.use.frame)"
            :options="
              consumables.map(item => ({ label: getConsumableGameName(item.id), value: item.id }))
            "
            @change="setSelectedConsumableId"
          />
        </label>
        <label>
          <span>{{ t('consumable.frame') }}</span>
          <EaNumberInput
            size="sm"
            controls-position="right"
            :min="-scenario.battle.prepFrames"
            :max="scenario.battle.durationFrames"
            :model-value="selectedConsumableUse.use.frame"
            :disabled="isHistoricalInputFrame(selectedConsumableUse.use.frame)"
            @change="setSelectedConsumableFrame"
          />
        </label>
        <p>
          {{ getConsumableGameDescription(selectedConsumableUse.use.consumableId) }}
        </p>
        <EaButton
          variant="ghost"
          type="button"
          :disabled="isHistoricalInputFrame(selectedConsumableUse.use.frame)"
          @click="removeSelectedConsumableUse"
        >
          {{ t('common.delete') }}
        </EaButton>
      </section>
      <TimelineLibrarySkillInspector
        v-else-if="tool === 'inspector'"
        :name="selectedLibraryInspectorModel.name"
        :operator-name="selectedLibraryInspectorModel.operatorName"
        :type-label="selectedLibraryInspectorModel.typeLabel"
        :skill-group-key="selectedLibraryInspectorModel.skillGroupKey"
        :level="selectedLibraryInspectorModel.level"
        :duration-frames="selectedLibraryInspectorModel.durationFrames"
        :segments="selectedLibraryInspectorModel.segments"
        :custom-operator-definition="selectedLibraryInspectorModel.customOperatorDefinition"
        @edit-operator-definition="openOperatorDefinitionWorkspace"
      />
      <SimulationPerformanceAudit
        v-else-if="tool === 'performance'"
        :samples="simulationPerformanceSamples"
        :budget-ms="INTERACTIVE_SIMULATION_BUDGET_MS"
        :labels="{
          title: t('timeline.performance.title'),
          latest: t('timeline.performance.latest'),
          p95: t('timeline.performance.p95'),
          cacheHit: t('timeline.performance.cacheHit'),
          cacheLookup: t('timeline.performance.cacheLookup'),
          simulation: t('timeline.performance.simulation'),
          projection: t('timeline.performance.projection'),
          budget: t('timeline.performance.budget'),
          noSamples: t('timeline.performance.noSamples'),
        }"
      />
      <BattleLogPanel
        v-else-if="tool === 'battleLog'"
        :log="battleLogSnapshot"
        :event-label="battleReceiptEventLabel"
        :damage-type-label="damageElementLabel"
        :selected-cast-id="selectedCastId"
        @locate="locateBattleLogEntry"
      />
    </template>
  </TimelineWorkbenchShell>
  <TimelineConnectionContextMenu
    :visible="connectionContextTarget !== null && contextConnection !== undefined"
    :x="connectionContextTarget?.x ?? 0"
    :y="connectionContextTarget?.y ?? 0"
    :from-port="connectionPort(contextConnection?.from.port, 'right')"
    :to-port="connectionPort(contextConnection?.to.port, 'left')"
    @close="connectionContextTarget = null"
    @delete="contextConnection && deleteTimelineConnection(contextConnection.id)"
    @change-port="updateConnectionContextPort"
  />
  <TimelineActionContextMenu
    :input-read-only="[...actionSelection.selectedIds].some(isHistoricalSkillInput)"
    :visible="contextMenuTarget !== null"
    :x="contextMenuTarget?.x ?? 0"
    :y="contextMenuTarget?.y ?? 0"
    :label="selectedCastModel?.label ?? ''"
    :locked="selectedCastModel?.cast.presentation?.locked ?? false"
    :disabled="selectedCastModel?.cast.presentation?.disabled ?? false"
    :color="selectedCastModel?.cast.presentation?.color ?? null"
    :compact-visible="actionSelection.selectedIds.size > 1"
    :create-group-visible="
      actionSelection.selectedIds.size > 1 &&
      !(continuousGroupSelection.ok && continuousGroupSelection.alreadyGrouped)
    "
    :create-group-disabled-reason="
      continuousGroupSelection.ok
        ? undefined
        : t(`timeline.continuousGroup.${continuousGroupSelection.reason}`)
    "
    :dissolve-group-visible="selectionIncludesContinuousGroup"
    :compact-disabled-reason="
      compactSelection.ok ? undefined : t(`timeline.compactSelection.${compactSelection.reason}`)
    "
    @compact="compactSelectedSkills"
    @create-group="createSelectedSkillCastGroup"
    @dissolve-group="dissolveSelectedSkillCastGroups"
    @close="contextMenuTarget = null"
    @copy="copyContextSelection"
    @delete="deleteContextCast"
    @toggle-lock="toggleContextCastField('locked')"
    @toggle-disabled="toggleContextCastField('disabled')"
    @set-color="setContextCastColor"
  />
  <TimelineMarkerContextMenu
    :cycle-boundary="markerContextTarget?.existing?.kind === 'cycleBoundary'"
    :inheritance-boundary="
      configurationReadOnly && markerContextTarget?.existing?.kind === 'simulationStart'
    "
    :source-available="
      projectScenarios.some(item => item.id === scenario.inheritance?.sourceScenarioId)
    "
    @open-source="openInheritedSource"
    :read-only="
      scenario.inheritance !== undefined &&
      ((markerContextTarget?.frame ?? 0) < scenario.inheritance.frame ||
        markerContextTarget?.existing?.kind === 'simulationStart')
    "
    :can-inherit="
      !creatingInheritedScenario &&
      projectScenarios.length < MAX_PROJECT_SCENARIOS &&
      (scenario.inheritance === undefined ||
        (markerContextTarget?.frame ?? 0) >= scenario.inheritance.frame)
    "
    :visible="markerContextTarget !== null"
    :x="markerContextTarget?.x ?? 0"
    :y="markerContextTarget?.y ?? 0"
    :frame="markerContextTarget?.frame ?? 0"
    :can-target-track="
      scenario.tracks[markerContextTarget?.trackIndex ?? selectedTrack]?.operator != null
    "
    :switch-targets="
      viewModel.tracks
        .filter(track => track.operatorSlug !== null)
        .map(track => ({
          trackIndex: track.trackIndex,
          name: operatorName(track.operatorSlug),
          avatar:
            track.operatorAssetSlug === null
              ? undefined
              : getOperatorAvatarPath(track.operatorAssetSlug),
        }))
    "
    :has-simulation-start="scenario.battle.simulationRange?.startFrame !== undefined"
    :has-simulation-end="scenario.battle.simulationRange?.endFrame !== undefined"
    :existing-label="markerContextTarget?.existing?.label"
    :existing-dodge-mode="
      markerContextTarget?.existing?.kind === 'dodge'
        ? scenario.battle.dodgeMarkers?.find(
            marker => marker.id === markerContextTarget?.existing?.id,
          )?.mode.kind
        : undefined
    "
    :labels="{
      title: t('timeline.markerContext.title'),
      deleteMarker: t('timeline.markerContext.deleteMarker'),
      copyMarker: t('timeline.markerContext.copyMarker'),
      addCycle: t('timeline.markerContext.addCycle'),
      addSimulationStart: t('timeline.markerContext.addSimulationStart'),
      removeSimulationStart: t('timeline.markerContext.removeSimulationStart'),
      addSimulationEnd: t('timeline.markerContext.addSimulationEnd'),
      removeSimulationEnd: t('timeline.markerContext.removeSimulationEnd'),
      switchOperator: t('timeline.markerContext.switchOperator'),
      dodge: t('timeline.markerContext.dodge'),
      perfectDodge: t('timeline.markerContext.perfectDodge'),
      switchToDodge: t('timeline.markerContext.switchToDodge'),
      switchToPerfectDodge: t('timeline.markerContext.switchToPerfectDodge'),
      useConsumable: t('consumable.useFromContext'),
    }"
    @close="markerContextTarget = null"
    @inherit="inheritFromContext"
    @add-cycle="addMarkerFromContext('cycle')"
    @toggle-simulation-start="addMarkerFromContext('simulationStart')"
    @toggle-simulation-end="addMarkerFromContext('simulationEnd')"
    @add-switch="addSwitchMarkerFromContext"
    @add-dodge="addDodgeMarkerFromContext"
    @set-dodge-mode="setDodgeMarkerModeFromContext"
    @copy-marker="copyDodgeMarkerFromContext"
    @use-consumable="openConsumableSelectionFromContext"
    @control-combo-cooldown="
      addMarkerFromContext($event === 'ready' ? 'comboReady' : 'comboCooldown')
    "
    @delete="removeMarkerFromContext"
  />
  <ConsumableSelectionDialog
    :visible="consumableDialogTarget !== null"
    :consumables="consumables"
    @close="consumableDialogTarget = null"
    @select="addConsumableFromDialog"
  />
  <OperatorSelectionDialog
    v-if="operatorDialogTrack !== null"
    :visible="operatorDialogTrack !== null"
    :operators="editorGameDataRepository.getOperators()"
    :selected-slugs="
      viewModel.tracks.flatMap(track => (track.operatorSlug === null ? [] : [track.operatorSlug]))
    "
    @close="operatorDialogTrack = null"
    @select="selectOperator"
    @clear="clearOperator"
  />
  <WeaponSelectionDialog
    v-if="weaponDialogTrack !== null"
    :visible="weaponDialogTrack !== null"
    :weapons="selectableWeapons"
    :selected-slug="selectedWeaponSlug"
    :labels="{
      title: t('timeline.weaponDialog.title'),
      searchPlaceholder: t('timelineGrid.weaponDialog.searchPlaceholder'),
      unequip: t('common.unequip'),
      close: t('common.close'),
      empty: t('timeline.weaponDialog.empty'),
      partialSupport: t('timeline.weaponDialog.partialSupport'),
    }"
    @close="weaponDialogTrack = null"
    @select="selectWeapon"
    @clear="clearWeapon"
  />
  <GearSelectionDialog
    v-if="gearDialogTarget !== null"
    :visible="gearDialogTarget !== null"
    :gears="selectableGears"
    :selected-slug="selectedGearSlug"
    :selected-artificing-levels="selectedGearBuild?.artificingLevels ?? []"
    :active-slot-key="gearDialogTarget?.slot ?? 'armor'"
    :operator-definition="selectedLoadoutModel.operator?.definition ?? null"
    :gear-set-names="gearSetNames"
    :labels="{
      title: t('timelineGrid.equipmentDialog.title', {
        slot: t(`timelineGrid.equipmentSlot.${gearDialogTarget?.slot ?? 'armor'}`),
      }),
      searchPlaceholder: t('timelineGrid.equipmentDialog.searchPlaceholder'),
      unequip: t('common.unequip'),
      close: t('common.close'),
      empty: t('timelineGrid.equipmentDialog.empty'),
      partialSupport: t('timeline.gearDialog.partialSupport'),
      defense: t('timeline.gearDialog.defense'),
      noSet: t('timeline.gearDialog.noSet'),
    }"
    @close="gearDialogTarget = null"
    @select="selectGear"
    @clear="clearGear"
    @change-refine-tier="changeGearRefineTier"
  />
  <WeaponBuildDialog
    v-if="showWeaponBuildDialog"
    :visible="showWeaponBuildDialog"
    :weapon="selectedLoadoutModel.weapon"
    :custom-definition="selectedWeaponCustomDefinition"
    @update:visible="showWeaponBuildDialog = $event"
    @change="updateWeaponBuild"
    @edit-definition="openWeaponDefinitionWorkspace"
  />
  <WeaponDefinitionWorkspaceDialog
    v-if="
      showWeaponDefinitionWorkspace &&
      selectedWeaponBaseDefinition &&
      selectedWeaponCustomDefinition
    "
    :visible="showWeaponDefinitionWorkspace"
    :base-definition="selectedWeaponBaseDefinition"
    :custom-definition="selectedWeaponCustomDefinition"
    @update:visible="showWeaponDefinitionWorkspace = $event"
    @save="saveWeaponDefinition"
    @reset="resetWeaponDefinition"
  />
  <OperatorBuildDialog
    v-if="showOperatorBuildDialog"
    :visible="showOperatorBuildDialog"
    :operator="selectedLoadoutModel.operator"
    :custom-definition="selectedOperatorCustomDefinition"
    :build-attributes="operatorBuildPanel?.attributes ?? null"
    @update:visible="showOperatorBuildDialog = $event"
    @change="updateOperatorBuild"
    @edit-definition="openOperatorDefinitionWorkspace"
  />
  <OperatorDefinitionWorkspaceDialog
    v-if="showOperatorDefinitionWorkspace && selectedOperatorBaseDefinition"
    :visible="showOperatorDefinitionWorkspace"
    :base-definition="selectedOperatorBaseDefinition"
    :custom-definition="selectedOperatorCustomDefinition"
    :common-ability-entity-definitions="commonAbilityEntityDefinitions"
    :common-buff-definitions="commonBuffDefinitions"
    :skill-level="selectedOperatorDefinitionSkillLevel"
    :required-skill-references="selectedOperatorRequiredSkillReferences"
    @update:visible="showOperatorDefinitionWorkspace = $event"
    @save="saveOperatorDefinition"
    @reset="resetOperatorDefinition"
  />
  <GearLoadoutBuildDialog
    v-if="showGearBuildDialog"
    :visible="showGearBuildDialog"
    :gears="selectedLoadoutModel.gears"
    :custom-definition-slugs="customGearDefinitionSlugs"
    :gear-set-names="gearSetNames"
    :gear-set-text-slugs="gearSetTextSlugs"
    @update:visible="showGearBuildDialog = $event"
    @update="updateGearBuild"
    @edit-definition="openGearDefinitionWorkspace"
  />
  <GearDefinitionWorkspaceDialog
    v-if="
      gearDefinitionWorkspaceSlot !== null &&
      selectedGearBaseDefinition &&
      selectedGearCustomDefinition
    "
    :visible="gearDefinitionWorkspaceSlot !== null"
    :base-definition="selectedGearBaseDefinition"
    :custom-definition="selectedGearCustomDefinition"
    :gear-set-ids="gearSetIds"
    @update:visible="gearDefinitionWorkspaceSlot = $event ? gearDefinitionWorkspaceSlot : null"
    @save="saveGearDefinition"
    @reset="resetGearDefinition"
    @edit-gear-set="openGearSetDefinitionWorkspace"
  />
  <GearSetDefinitionWorkspaceDialog
    v-if="
      gearSetDefinitionWorkspaceId !== null &&
      selectedGearSetBaseDefinition &&
      selectedGearSetCustomDefinition
    "
    :visible="gearSetDefinitionWorkspaceId !== null"
    :base-definition="selectedGearSetBaseDefinition"
    :custom-definition="selectedGearSetCustomDefinition"
    @update:visible="gearSetDefinitionWorkspaceId = $event ? gearSetDefinitionWorkspaceId : null"
    @save="saveGearSetDefinition"
    @reset="resetGearSetDefinition"
  />
  <OperatorPanelDialog
    v-if="panelDialogTrack !== null"
    :visible="panelDialogTrack !== null"
    :panel="selectedPanel"
    :operator="panelDialogOperator"
    :operator-name="panelDialogOperatorName"
    :weapons="capturePublishedEquipmentSources(editorGameDataRepository.getWeapons())"
    @update:visible="setPanelDialogVisible"
  />
  <SkillDefinitionEditorDialog
    v-if="showSkillDefinitionEditor"
    :visible="showSkillDefinitionEditor"
    :title="selectedCastModel?.label ?? ''"
    :template-definition="selectedCastModel?.templateDefinition ?? null"
    :custom-definition="selectedCastModel?.cast.customDefinition"
    :skill-level="selectedCastModel?.skillLevel ?? 1"
    :ability-entity-ids="selectedCastAbilityEntityIds"
    :buff-ids="selectedCastBuffIds"
    @update:visible="showSkillDefinitionEditor = $event"
    @save="saveSelectedCastDefinition"
    @reset="resetSelectedCastDefinition"
  />
  <TimelineHitDetailDialog
    :object-icon="publishedObjectIcon"
    :action-presentation="publishedActionPresentation"
    :operator-label="publishedOperatorInstanceName"
    :receipt-entries="publishedReceiptEntries"
    :damage-zone-label="zone => t(`hitDetail.damageZones.${zone}`)"
    v-if="hitDetailTarget !== null || enemyDamageDetailSequence !== null"
    :random-mode="publishedRandomMode"
    :operator-panel-for-entry="hitDetailTarget === null ? enemyDamageOperatorPanel : undefined"
    :source-label="t('timeline.buffDetail.source')"
    :buff-label="
      item =>
        item.buffId === undefined
          ? item.sourceId
          : (buffSourceName(item) ??
            resolveBuffDisplayName(
              item.buffId,
              { t, te },
              undefined,
              undefined,
              operatorBuffDisplayNameKeys,
            ) ??
            item.buffId)
    "
    :source-description="hitDetailTarget === null ? enemyDamageSourceDescription : undefined"
    :visible="hitDetailTarget !== null || enemyDamageDetailSequence !== null"
    :allow-force-critical="hitDetailTarget !== null"
    :force-critical="hitDetailForceCritical"
    :result-force-critical="publishedHitDetail?.forcedCritical ?? false"
    :entries="
      hitDetailTarget !== null ? (publishedHitDetail?.entries ?? []) : enemyDamageDetailEntries
    "
    :operator-panel="hitDetailOperatorPanel"
    :contribution-source-label="hitDetailContributionSourceLabel"
    :damage-type-label="damageElementLabel"
    :skill-type-label="skillTypeLabel"
    :labels="{
      dialogTitle: t('hitDetail.title'),
      context: t('hitDetail.context'),
      result: t('hitDetail.result'),
      base: t('hitDetail.base'),
      multipliers: t('hitDetail.multipliers'),
      skillType: t('hitDetail.skillType'),
      element: t('hitDetail.element'),
      expectedDamage: t('hitDetail.expectedDamage'),
      actualDamage: t('hitDetail.actualDamage'),
      forcedDamage: t('hitDetail.forcedDamage'),
      forceCrit: t('hitDetail.forceCrit'),
      criticalDamage: t('hitDetail.critDamage'),
      nonCriticalDamage: t('hitDetail.nonCritDamage'),
      attack: t('hitDetail.attack'),
      staticBuildAttack: t('hitDetail.staticBuildAttack'),
      basicTotal: t('statDetail.basicTotal'),
      attackSlot: (slot: string) => t(`statDetail.attackSlots.${slot}`),
      attributeBonus: t('statDetail.attributeBonus'),
      scalingCoefficient: t('timeline.skillEditing.scalingCoefficient'),
      attributeLabel: (attribute: string) => t(`stats.${attribute}`),
      fromSource: (name: string) => t('statDetail.fromSource', { name }),
      skillMultiplier: t('hitDetail.multiplier'),
      baseDamage: t('hitDetail.baseDamage'),
      damageBonus: t('hitDetail.dmgBonus'),
      criticalExpectation: t('hitDetail.critMult'),
      criticalResult: t('hitDetail.criticalResult'),
      criticalRate: t('hitDetail.rawCritRate'),
      criticalHit: t('hitDetail.criticalHit'),
      nonCriticalHit: t('hitDetail.nonCriticalHit'),
      cannotCritical: t('hitDetail.cannotCritical'),
      directMultiplier: t('hitDetail.directMult'),
      damageTaken: t('hitDetail.dmgTaken'),
      defenseMultiplier: t('hitDetail.defMult'),
      resistanceMultiplier: t('hitDetail.resMult'),
      defenseDetail: (value: number) => t('hitDetail.defDetail', { def: value }),
    }"
    @close="
      hitDetailTarget = null;
      enemyDamageDetailSequence = null;
    "
    @toggle-force-critical="toggleHitDetailForceCritical"
  />
  <TimelineBuffDetailDialog
    :receipt-entries="publishedReceiptEntries"
    :operator-label="publishedOperatorInstanceName"
    :object-icon="publishedObjectIcon"
    :action-presentation="publishedActionPresentation"
    v-if="buffDetailTarget !== null"
    :visible="buffDetailTarget !== null"
    :target="buffDetailTarget"
    :fps="PROJECT_FPS"
    :labels="{
      title: t('timeline.buffDetail.title'),
      source: t('timeline.buffDetail.source'),
      effect: t('timeline.buffDetail.effect'),
      layers: t('timeline.buffDetail.layers'),
      start: t('timeline.buffDetail.start'),
      startReason: t('timeline.buffDetail.startReason'),
      end: t('timeline.buffDetail.end'),
      endReason: t('timeline.buffDetail.endReason'),
      duration: t('timeline.buffDetail.duration'),
      frames: value => t('timeline.buffDetail.frames', { value }),
      buffId: t('timeline.buffDetail.buffId'),
    }"
    @update:visible="buffDetailTarget = $event ? buffDetailTarget : null"
  />
  <TimelineOperatorPassiveUiDetailDialog
    :receipt-entries="publishedReceiptEntries"
    :operator-label="publishedOperatorInstanceName"
    :object-icon="publishedObjectIcon"
    :action-presentation="publishedActionPresentation"
    v-if="passiveUiDetailSegment !== null"
    :visible="passiveUiDetailSegment !== null"
    :segment="passiveUiDetailSegment"
    :title="passiveUiDetailTitle"
    :fps="PROJECT_FPS"
    @update:visible="passiveUiDetailSegment = $event ? passiveUiDetailSegment : null"
  />
  <TimelineReceiveDialog
    v-if="showReceiveDialog"
    :visible="showReceiveDialog"
    :busy="receivingProjectCode"
    @update:visible="showReceiveDialog = $event"
    @receive="receiveProjectCode"
  />
  <TimelineExportDialog
    v-if="showExportDialog"
    :visible="showExportDialog"
    :current-scenario-name="scenario.name"
    :scenario-count="projectScenarios.length"
    :max-duration="Math.max(10, Math.round(scenario.battle.durationFrames / PROJECT_FPS))"
    @update:visible="showExportDialog = $event"
    @export-json="exportProject"
    @copy-code="copyProjectCode"
    @export-small-image="openSmallImageExport"
    @export-image="exportTimelineLongImage"
  />
  <TimelineSmallImageExportDialog
    v-if="showSmallImageExport"
    :visible="showSmallImageExport"
    :initial-filename="smallImageExportInitial.filename"
    :initial-duration="smallImageExportInitial.duration"
    :max-duration="Math.max(10, Math.round(scenario.battle.durationFrames / PROJECT_FPS))"
    :scenario-name="scenario.name"
    :tracks="exportShareTracks"
    :prep-frames="scenario.battle.prepFrames"
    :editor-appearance="appearance"
    :keycap-mode="keycapMode"
    :create-share-code="createCurrentScenarioShareCode"
    :labels="{
      title: t('timeline.export.smallPreviewTitle'),
      filename: t('timeline.export.filenameLabel'),
      filenamePlaceholder: t('timeline.export.filenamePlaceholder'),
      duration: t('timeline.export.durationLabel'),
      durationHint: `${t('timeline.export.durationHintMax', {
        max: Math.max(10, Math.round(scenario.battle.durationFrames / PROJECT_FPS)),
      })} · ${t('timeline.export.smallDurationHint')}`,
      cardAppearance: t('timeline.export.cardAppearanceLabel'),
      light: t('common.appearanceLight'),
      dark: t('common.appearanceDark'),
      cardWidth: t('timeline.export.cardWidthLabel'),
      blockHeight: t('timeline.export.blockHeightLabel'),
      timeScale: t('timeline.export.timeScaleLabel'),
      showCombatIcons: t('timeline.export.showCombatIcons'),
      showDurationBars: t('timeline.export.showDurationBars'),
      showKeycaps: t('timeline.export.showKeycaps'),
      showPrep: t('timeline.export.showPrep'),
      showTimeTicks: t('timeline.export.showTimeTicks'),
      cancel: t('common.cancel'),
      save: t('timeline.export.saveSmallImage'),
      rendering: t('timeline.export.smallRendering'),
      exported: filename => t('timeline.export.smallImageExported', { filename }),
      failed: msg => t('timeline.export.failed', { msg }),
    }"
    @update:visible="showSmallImageExport = $event"
  />
  <DamageAnalysisDialog
    v-if="showDamageAnalysis"
    :visible="showDamageAnalysis"
    :analysis="damageAnalysis"
    :locale="locale"
    :random-mode="publishedRandomMode"
    :global-random-seed="publishedGlobalRandomSeed"
    :labels="{
      title: t('timeline.analysis.dialogTitle'),
      warning: t('timeline.analysis.warning'),
      noData: t('timeline.analysis.noData'),
      damageByOperator: t('timeline.analysis.damageByOperator'),
      contributionByOperator: t('timeline.analysis.contributionByOperator'),
      damageByElement: t('timeline.analysis.damageByElement'),
      totalDamage: t('timeline.analysis.totalDamage'),
      expectedTotalDamage: t('timeline.analysis.expectedTotalDamage'),
      sampledTotalDamage: t('timeline.analysis.sampledTotalDamage'),
      expectedModeDescription: t('timeline.analysis.expectedModeDescription'),
      sampledModeDescription: (seed: string) =>
        t('timeline.analysis.sampledModeDescription', { seed }),
      rotationTime: t('timeline.analysis.rotationTime'),
      dps: t('timeline.analysis.dps'),
      unattributedDamage: (value: string) => t('timeline.analysis.unattributedDamage', { value }),
      damage: t('timeline.analysis.damage'),
      faqTitle: t('timeline.analysis.faqTitle'),
      faq: [
        [t('timeline.analysis.faq1Q'), t('timeline.analysis.faq1A')],
        [t('timeline.analysis.faq2Q'), t('timeline.analysis.faq2A')],
        [t('timeline.analysis.faq3Q'), t('timeline.analysis.faq3A')],
        [t('timeline.analysis.faq4Q'), t('timeline.analysis.faq4A')],
      ],
    }"
    @update:visible="showDamageAnalysis = $event"
  />
  <TimelineSimulationErrorNotice :error="simulationError" />
  <TimelineShortcutHelpDialog
    v-if="showShortcutHelp"
    :visible="showShortcutHelp"
    @update:visible="showShortcutHelp = $event"
  />
</template>

<style scoped>
.project-file-input {
  display: none;
}

button {
  height: 28px;
  border: 1px solid var(--ea-border);
  border-radius: 2px;
  background: var(--ea-fill-soft);
  color: inherit;
  padding: 0 9px;
  font: inherit;
  cursor: pointer;
}

button:hover:not(:disabled) {
  border-color: var(--ea-gold);
  color: var(--ea-gold);
}

button:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

.skill-sidebar {
  height: 100%;
  min-height: 0;
  padding: 15px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 15px;
  overflow-y: auto;
  scrollbar-width: none;
}

.skill-sidebar::-webkit-scrollbar {
  display: none;
}

.library-header {
  display: flex;
  flex-direction: column;
}

.library-header__main {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.operator-heading {
  margin: 0;
  width: 100%;
  height: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--ea-fg);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1px;
  text-align: left;
}

.library-header__divider {
  height: 2px;
  margin-top: 3px;
  background: linear-gradient(90deg, var(--ea-gold) 0%, transparent 100%);
  opacity: 0.3;
}

.operator-heading__mark {
  flex: 0 0 auto;
  width: 4px;
  height: 18px;
  background: var(--ea-gold);
}

.operator-heading__main {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.operator-form-badge {
  flex: 0 0 auto;
  color: #00e5ff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1;
  text-shadow: 0 0 8px rgba(0, 229, 255, 0.35);
  white-space: nowrap;
}

.sidebar-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 6px;
}

.sidebar-tabs button {
  min-width: 0;
  padding: 0 4px;
  font-size: 12px;
  white-space: nowrap;
}

.library-section-title {
  display: flex;
  flex-direction: column;
  padding-left: 10px;
  border-left: 2px solid #444;
}

.library-section-title strong {
  color: var(--ea-fg);
  font-size: 14px;
}

.library-section-title span {
  color: var(--ea-fg-secondary);
  font-size: 10px;
}

.library-section-title--status {
  margin-top: 12px;
}

.skill-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.skill-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 12px;
}

.consumable-use-marker img {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.timeline-workspace,
.timeline-scroll {
  min-width: 0;
  min-height: 0;
}

.timeline-workspace {
  position: relative;
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  overflow: hidden;
}

.timeline-marquee {
  position: fixed;
  z-index: 100;
  box-sizing: border-box;
  box-shadow: 0 0 0 1px rgb(0 0 0 / 50%);
  --marquee-horizontal: linear-gradient(to right, rgb(255 255 255 / 90%) 60%, transparent 60%);
  --marquee-vertical: linear-gradient(to bottom, rgb(255 255 255 / 90%) 60%, transparent 60%);
  background-image:
    var(--marquee-horizontal), var(--marquee-horizontal), var(--marquee-vertical),
    var(--marquee-vertical);
  background-position: top, bottom, left, right;
  background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
  background-size:
    10px 1px,
    10px 1px,
    1px 10px,
    1px 10px;
  pointer-events: none;
}

.timeline-scroll {
  grid-column: 1;
  grid-row: 1;
  width: 100%;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: none;
}

.timeline-scroll::-webkit-scrollbar {
  display: none;
}

.timeline-scroll.is-compact-buff-layout {
  overflow-y: hidden;
}

.timeline-horizontal-scrollbar {
  grid-column: 1;
  grid-row: 1;
  align-self: end;
  position: relative;
  z-index: 100;
  min-width: 0;
  height: 12px;
  margin-left: 180px;
  overflow-x: auto;
  overflow-y: hidden;
  opacity: 0.7;
  transition: opacity 200ms ease;
}

.timeline-horizontal-scrollbar:hover,
.timeline-horizontal-scrollbar:focus-visible {
  opacity: 1;
}

.timeline-horizontal-scrollbar__spacer {
  height: 1px;
}

.timeline-vertical-scrollbar {
  position: absolute;
  z-index: 100;
  top: 60px;
  right: 0;
  bottom: 12px;
  width: 8px;
  overflow-x: hidden;
  overflow-y: auto;
  opacity: 0.7;
  transition: opacity 200ms ease;
}

.timeline-vertical-scrollbar:hover,
.timeline-vertical-scrollbar:focus-visible {
  opacity: 1;
}

.timeline-vertical-scrollbar.is-hidden {
  visibility: hidden;
  pointer-events: none;
}

.timeline-vertical-scrollbar__spacer {
  width: 1px;
}

.timeline-scroll.is-panning {
  cursor: grabbing;
  user-select: none;
}

.timeline-surface {
  position: relative;
  min-width: 100%;
  min-height: 100%;
  -webkit-user-select: none;
  user-select: none;
}

/* 标尺和左上工具区仍有可编辑数字框；只为真实文本编辑控件恢复选择。 */
.timeline-surface :is(input, textarea, [contenteditable='true']) {
  -webkit-user-select: text;
  user-select: text;
}

.timeline-surface.is-library-placing .track-lane {
  cursor: copy;
}

.corner-placeholder {
  position: sticky;
  top: 0;
  left: 0;
  /* The ruler row participates in normal vertical scrolling. Its opaque layer
     only prevents later track content from painting over it while it is visible. */
  z-index: 120;
  width: 180px;
  height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-sizing: border-box;
  padding: 0 2px 0 8px;
  border-right: 1px solid var(--ea-border);
  border-bottom: 1px solid var(--ea-border);
  background: var(--ea-workbench-header);
}

.timeline-ruler {
  position: sticky;
  top: 0;
  z-index: 110;
  margin-top: -60px;
  margin-left: 180px;
}

.timeline-battle-start-boundary {
  position: absolute;
  z-index: 11;
  top: 60px;
  bottom: 0;
  width: 14px;
  margin-left: -7px;
  cursor: ew-resize;
  touch-action: none;
}

.timeline-battle-start-boundary::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 6px;
  width: 2px;
  background: color-mix(in srgb, var(--ea-mark-strong) 70%, transparent);
  pointer-events: none;
}

.timeline-battle-start-boundary.is-prep-collapsed {
  cursor: default;
}

.prep-collapsed-entry,
.prep-expanded-collapse {
  position: absolute;
  /* 与轨道分隔线重合时，准备区按钮优先命中；仍低于固定轨道头和标尺。 */
  z-index: 41;
  top: calc(60px + (100% - 60px) / 2);
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}

.prep-collapsed-entry {
  width: 18px;
  gap: 8px;
}

.prep-collapsed-entry > span {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  color: var(--ea-fg-secondary);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 2px;
  text-shadow: 0 2px 8px var(--ea-shadow);
}

.prep-collapsed-entry button,
.prep-expanded-collapse button {
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--ea-fg-secondary);
  cursor: pointer;
  pointer-events: auto;
}

.prep-collapsed-entry button {
  color: var(--ea-fg);
}

.prep-collapsed-entry button:focus-visible,
.prep-expanded-collapse button:focus-visible {
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--ea-gold) 35%, transparent);
}

@media (hover: hover) and (pointer: fine) {
  .prep-collapsed-entry button:hover,
  .prep-expanded-collapse button:hover {
    color: var(--ea-gold);
  }
}
.prep-collapsed-entry svg,
.prep-expanded-collapse svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.cursor-guide {
  position: absolute;
  top: 60px;
  bottom: 0;
  width: 1px;
  background: color-mix(in srgb, var(--ea-gold) 80%, transparent);
  box-shadow: 0 0 6px var(--ea-gold);
  z-index: 3000;
  pointer-events: none;
}

.cursor-guide__info {
  width: max-content;
  will-change: transform;
}

.alignment-guide {
  position: absolute;
  z-index: 20;
  width: 1px;
  border-left: 2px solid currentColor;
  box-shadow: 0 0 7px currentColor;
  pointer-events: none;
}

.alignment-guide::after {
  content: '';
  position: absolute;
  inset: 0 -6px;
  border-top: 1px solid currentColor;
  border-bottom: 1px solid currentColor;
  background: color-mix(in srgb, currentColor 9%, transparent);
}

.alignment-guide span {
  position: absolute;
  left: 6px;
  top: -21px;
  padding: 2px 5px;
  border: 1px solid currentColor;
  background: var(--ea-tooltip-bg);
  color: currentColor;
  font-size: 10px;
  white-space: nowrap;
}

.timeline-marker {
  position: absolute;
  z-index: 8;
  box-sizing: border-box;
  user-select: none;
  cursor: ew-resize;
}

.consumable-use-marker {
  top: calc(var(--timeline-action-top, 55px) - 36px);
  z-index: 31;
  width: 28px;
  height: 28px;
  padding: 2px;
  transform: translateX(-14px);
  border: 1px solid rgb(255 255 255 / 55%);
  border-radius: 50%;
  background: rgb(25 28 34 / 92%);
  cursor: pointer;
}

.consumable-use-marker.dragging {
  cursor: grabbing;
}

.consumable-use-marker::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  width: 1px;
  height: 8px;
  background: rgb(255 255 255 / 65%);
}

.consumable-use-marker[aria-pressed='true'] {
  border-color: var(--ea-accent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--ea-accent) 45%, transparent);
}

.consumable-inspector {
  display: grid;
  gap: 12px;
  padding: 14px;
}

.consumable-inspector label {
  display: grid;
  gap: 5px;
}

.simulation-range-dim {
  position: absolute;
  z-index: 7;
  top: 60px;
  bottom: 0;
  background: rgb(0 0 0 / 35%);
  pointer-events: none;
}

.simulation-range-dim--end {
  right: 0;
}

.simulation-range-marker {
  top: 60px;
  bottom: 0;
  width: 1px;
  background: #22cc44;
  box-shadow: 0 0 6px #22cc44;
  transition:
    background-color 0.1s,
    box-shadow 0.1s;
}

.simulation-range-marker--end {
  background: #cc2222;
  box-shadow: 0 0 6px #cc2222;
}

.simulation-range-marker::after {
  content: '';
  position: absolute;
  inset: 0 -6px;
}

.simulation-range-marker:hover {
  width: 2px;
  background: #33ee55;
  box-shadow: 0 0 8px #33ee55;
}

.simulation-range-marker--end:hover {
  background: #ee3333;
  box-shadow: 0 0 8px #ee3333;
}

.simulation-range-marker.selected {
  z-index: 30;
  width: 2px;
  background: #fff;
  box-shadow:
    0 0 8px #fff,
    0 0 12px rgb(255 255 255 / 50%);
}

.simulation-range-marker > span,
.simulation-range-marker > b {
  position: absolute;
  left: 0;
  padding: 2px 4px;
  background: #22cc44;
  color: #fff;
  font-size: 10px;
  font-family: monospace;
  font-weight: 700;
  line-height: 1;
  pointer-events: none;
  white-space: nowrap;
}

.simulation-range-marker--end > span,
.simulation-range-marker--end > b {
  background: #cc2222;
  color: #fff;
}

.simulation-range-marker > span {
  top: 0;
  border-radius: 0 4px 4px 0;
  box-shadow: 0 1px 3px rgb(0 0 0 / 30%);
}

.simulation-range-marker > b {
  top: 16px;
  background: transparent;
  color: #22cc44;
  text-shadow: 0 0 2px rgb(34 204 68 / 50%);
}

.simulation-range-marker--end > b {
  background: transparent;
  color: #cc2222;
  text-shadow: 0 0 2px rgb(204 34 34 / 50%);
}

.simulation-range-marker.selected > span {
  background: #fff;
  color: #000;
}

.simulation-range-marker.selected > b {
  color: #fff;
  text-shadow: 0 0 2px rgb(255 255 255 / 80%);
}

.cycle-boundary-marker {
  top: 60px;
  bottom: 0;
  width: 1px;
  background: #d3adff;
  box-shadow: 0 0 6px #d3adff;
  cursor: grab;
  transition:
    background-color 0.1s,
    box-shadow 0.1s;
}

.cycle-boundary-marker:hover {
  width: 2px;
  background: #e0c4ff;
  box-shadow: 0 0 8px #e0c4ff;
}

.cycle-boundary-marker.selected {
  z-index: 30;
  width: 2px;
  background: #fff;
  box-shadow:
    0 0 8px #fff,
    0 0 12px rgb(255 255 255 / 50%);
}

.team-event-marker {
  top: 60px;
  bottom: 0;
  width: 1px;
  border-left: 1px dashed #ff7875;
  box-shadow: none;
}

.cycle-boundary-marker::after,
.team-event-marker::after {
  content: '';
  position: absolute;
  inset: 0 -5px;
}

.cycle-boundary-marker > span,
.cycle-boundary-marker > b {
  position: absolute;
  left: 0;
  padding: 2px 4px;
  font-size: 10px;
  font-family: monospace;
  font-weight: 700;
  line-height: 1;
  pointer-events: none;
  white-space: nowrap;
}

.cycle-boundary-marker > span {
  top: 0;
  border-radius: 0 4px 4px 0;
  background: #d3adff;
  color: #222;
  box-shadow: 0 1px 3px rgb(0 0 0 / 30%);
}

.cycle-boundary-marker > b {
  top: 16px;
  background: transparent;
  color: #d3adff;
  text-shadow: 0 0 2px rgb(211 173 255 / 50%);
}

.cycle-boundary-marker.selected > span {
  background: #fff;
  color: #000;
}

.cycle-boundary-marker.selected > b {
  color: #fff;
  text-shadow: 0 0 2px rgb(255 255 255 / 80%);
}

.team-event-marker > span,
.team-event-marker > b {
  position: absolute;
  left: 4px;
  padding: 2px 4px;
  background: rgb(80 16 20 / 92%);
  color: #ffccc7;
  font-size: 10px;
  font-weight: 500;
  white-space: nowrap;
}

.team-event-marker > span {
  top: 2px;
}

.team-event-marker > b {
  top: 20px;
}

.track-switch-marker {
  top: calc(var(--timeline-action-top, 55px) - 42px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  z-index: 30;
  padding: 0;
  border: 0;
  background: transparent;
  transform: translateX(-50%);
  transition: transform 0.1s;
  cursor: grab;
}

.track-switch-marker.dragging {
  transition: none;
  cursor: grabbing;
}

.track-switch-marker__avatar.operator-avatar-crop {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #d3adff;
  background: #222;
  box-shadow: 0 2px 4px rgb(0 0 0 / 50%);
}

.track-switch-marker__time {
  padding: 1px 5px;
  border: 1px solid rgb(211 173 255 / 65%);
  border-radius: 10px;
  background: rgb(24 18 30 / 92%);
  box-shadow: 0 1px 4px rgb(0 0 0 / 35%);
  color: #f0dcff;
  font-size: 9px;
  font-weight: bold;
  line-height: 1.2;
  text-shadow: 0 1px 2px rgb(0 0 0 / 80%);
  white-space: nowrap;
}

.track-switch-marker__pointer {
  width: 0;
  height: 0;
  border-top: 7px solid #d3adff;
  border-right: 5px solid transparent;
  border-left: 5px solid transparent;
  filter: drop-shadow(0 1px 2px rgb(0 0 0 / 40%));
}

.dodge-marker {
  top: calc(var(--timeline-action-top, 55px) - 34px);
  width: 24px;
  height: 24px;
  z-index: 31;
  display: grid;
  place-items: center;
  border: 1px solid #67e8f9;
  border-radius: 3px;
  background: rgb(9 35 43 / 94%);
  color: #a5f3fc;
  transform: translateX(-50%);
  cursor: grab;
}

.dodge-marker.dragging {
  cursor: grabbing;
}

.dodge-marker--perfect {
  border-color: #f6d365;
  background: rgb(58 44 8 / 95%);
  color: #ffe69a;
}

.dodge-marker > svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.dodge-marker__pointer {
  position: absolute;
  top: 23px;
  width: 0;
  height: 0;
  border-top: 6px solid currentColor;
  border-right: 4px solid transparent;
  border-left: 4px solid transparent;
}

.dodge-marker__success-point {
  position: absolute;
  top: 26px;
  width: 7px;
  height: 7px;
  border: 1px solid #ffe69a;
  background: #3a2c08;
  box-shadow: 0 0 5px #f6d365;
  transform: translateX(-50%) rotate(45deg);
  pointer-events: none;
}

.dodge-marker__warning {
  position: absolute;
  top: -6px;
  right: -6px;
  display: grid;
  width: 12px;
  height: 12px;
  place-items: center;
  border: 1px solid #151515;
  border-radius: 50%;
  background: #f1c40f;
  color: #171717;
  font-size: 9px;
  font-weight: 800;
  line-height: 1;
}

.dodge-marker.selected {
  border-color: #fff;
  box-shadow: 0 0 7px currentColor;
}

.timeline-marker.track-switch-marker.selected {
  outline: 0;
}

.track-switch-marker.selected .track-switch-marker__avatar {
  border-color: #fff;
  box-shadow: 0 0 8px #fff;
}

.track-switch-marker.selected .track-switch-marker__time {
  border-color: rgb(255 255 255 / 85%);
  color: #fff;
}

.track-switch-marker.selected .track-switch-marker__pointer {
  border-top-color: #fff;
}

.timeline-marker.selected:not(.simulation-range-marker):not(.cycle-boundary-marker):not(
    .track-switch-marker
  ) {
  outline: 2px solid var(--ea-gold);
  outline-offset: 2px;
}

.team-event-marker.combo-cooldown-guide {
  --combo-control-color: #f15b8a;
  width: 1px;
  border: 0;
  background: color-mix(in srgb, var(--combo-control-color) 55%, transparent);
  cursor: grab;
  /* 图标可高于 0 秒线命中区，竖线本身仍不抢准备区拖动。 */
  z-index: auto;
}
.controlled-combo-cooldown-bar {
  position: absolute;
  top: calc(var(--timeline-action-top) + 57px);
  height: 2px;
  background: var(--ea-gold);
  color: var(--ea-gold);
  opacity: 0.9;
  pointer-events: none;
  z-index: 14;
}
.controlled-combo-cooldown-bar span {
  position: absolute;
  top: 4px;
  left: 0;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}
.controlled-combo-cooldown-bar i {
  position: absolute;
  top: 50%;
  right: 0;
  width: 1px;
  height: 8px;
  background: currentColor;
  transform: translateY(-50%);
}
.team-event-marker.combo-cooldown-guide.is-ready {
  --combo-control-color: #20d9d2;
}
.combo-cooldown-guide.selected {
  width: 2px;
  background: #fff;
  box-shadow: 0 0 8px rgb(255 255 255 / 75%);
  outline: 0;
  z-index: 31;
}
.combo-cooldown-marker {
  position: absolute;
  z-index: 12;
  top: 0;
  left: 50%;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  color: #161616;
  background: var(--combo-control-color);
  border: 1px solid color-mix(in srgb, var(--combo-control-color) 72%, #fff);
  transform: translateX(-50%);
  box-shadow: 0 2px 6px rgb(0 0 0 / 45%);
}
.combo-cooldown-guide.selected .combo-cooldown-marker {
  color: #111;
  background: #fff;
  border-color: #fff;
}
.combo-cooldown-marker svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.simulation-panel {
  height: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.simulation-curves {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.simulation-curves > :deep(.enemy-status-sections) {
  flex: 1 0 auto;
  width: 100%;
  height: 100%;
}

.simulation-panel__empty {
  flex: 1;
  display: grid;
  place-items: center;
  color: var(--ea-fg-muted);
}

.track-stack {
  width: fit-content;
  min-width: 100%;
  box-sizing: border-box;
}

/* 紧凑模式均分高度时保留 main 的上下边距；松散模式直接与标尺和准备区衔接。 */
.timeline-scroll.is-compact-buff-layout .track-stack::before,
.timeline-scroll.is-compact-buff-layout .track-stack::after {
  content: '';
  position: sticky;
  left: 0;
  z-index: 80;
  display: block;
  width: 180px;
  height: 20px;
  box-sizing: border-box;
  border-right: 1px solid var(--ea-border);
  background: var(--ea-workbench-header);
}

.track-row {
  position: relative;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  height: 160px;
  border-bottom: 1px solid var(--ea-border-soft);
}

.track-identity {
  position: sticky;
  left: 0;
  /* 必须盖过技能、标记、连线和时间膨胀层，横向滚动时形成稳定的轨道头遮罩。 */
  z-index: 80;
  isolation: isolate;
}

.track-lane {
  position: relative;
  z-index: 1;
  height: var(--timeline-track-height, 160px);
  overflow: hidden;
  background-image: linear-gradient(to right, var(--ea-grid-line) 1px, transparent 1px);
  background-position: var(--timeline-grid-origin-lane) var(--timeline-action-top);
  background-size: var(--timeline-grid-step) 54px;
  background-repeat: repeat-x;
}

/* 折叠栏只保留展开入口，不展示历史层；跨起点的条带仅露出起点之后的部分。 */
.timeline-surface.is-history-collapsed .track-lane {
  clip-path: inset(0 0 0 18px);
}

.track-lane::before {
  content: '';
  position: absolute;
  z-index: 1;
  top: var(--timeline-action-guide-top, 53px);
  right: 0;
  left: 0;
  height: 54px;
  box-sizing: border-box;
  border-top: 2px solid transparent;
  border-bottom: 2px solid transparent;
  background: var(--ea-grid-wash, rgba(255, 255, 255, 0.025));
  pointer-events: none;
}

.track-row.selected .track-lane::before {
  border-color: var(--ea-border-strong);
  border-style: dashed;
}

.track-row-resizer {
  position: absolute;
  z-index: 40;
  right: 0;
  bottom: -5px;
  left: 0;
  height: 10px;
  cursor: ns-resize;
  touch-action: none;
}

.track-row-resizer::after {
  content: '';
  position: absolute;
  top: 50%;
  right: 0;
  left: 180px;
  height: 1px;
  background: var(--ea-border);
  transform: translateY(-50%);
  transition:
    background-color 120ms ease,
    box-shadow 120ms ease,
    height 120ms ease;
}

.track-row-resizer:hover::after,
.track-row-resizer:focus-visible::after,
.track-row-resizer.is-active::after {
  height: 2px;
  background: color-mix(in srgb, var(--ea-gold) 55%, transparent);
  box-shadow: 0 0 10px color-mix(in srgb, var(--ea-gold) 22%, transparent);
}

:global(html.is-track-resizing),
:global(html.is-track-resizing *) {
  cursor: ns-resize !important;
  user-select: none !important;
}

.prep-zone {
  position: absolute;
  inset: 0 auto 0 0;
  box-sizing: border-box;
  border-right: 1px solid var(--ea-border);
  background: var(--ea-prep-fill);
  z-index: 0;
  pointer-events: none;
}

.battle-start-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--ea-mark-strong);
  transform: translateX(-1px);
  pointer-events: none;
}

.empty-panel {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--ea-fg-muted);
  font-size: 12px;
}

.contract-side-panel {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  box-sizing: border-box;
  background: var(--ea-workbench-panel);
  overflow: hidden;
}

.contract-side-panel img {
  width: min(82px, 48%);
  max-height: 82px;
  object-fit: contain;
  opacity: 0.78;
  filter: saturate(1.02) brightness(0.92);
}

.contract-side-title {
  color: #ff4d4f;
  font-size: 13px;
  font-weight: 900;
  text-align: center;
  white-space: nowrap;
}
</style>
