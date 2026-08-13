<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import {
  ElAlert,
  ElDialog,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElPopover,
  ElMessageBox,
} from 'element-plus';
import { useTimelineStore } from '@/stores/timelineStore.js';
import { useI18n } from 'vue-i18n';
import { setLocale } from '@/i18n';
import { getGearPiece } from '@/data';
import {
  getGameSlotTypeName,
  getGearPieceGameName,
  getGearSetGameName,
  getEnemyGameName,
  getOperatorGameName,
  getWeaponGameName,
  getWeaponSkillName,
} from '@/data/gameText';
import { resolveLeveled } from '@/data/types';
import { toLegacyDisplayType } from '@/utils/hitModel';
import { collectActionCombatBadges } from '@/utils/actionCombatIcons';
import { getDisplayKeyCandidates } from '@/utils/effectDisplay';
import { translateBattleLogStatus } from '@/simulation/formatBattleLogLabels';
import { isEffectOriginDamage } from '@/simulation/normalizeOperatorLogForBattleLog';
import { sampleSpSeriesAtTime } from '@/simulation/projection/projectSpSeries';
import {
  buildCumulativeDamageSeries,
  buildEnemyEffectGuideTimeline,
  sampleEnemyEffectGuideTimeline,
} from '@/utils/timelineGuideData';
import {
  formatEquipmentEffectLabel,
  formatEquipmentEffectStatValue,
  mergeEquipmentElementPairEffects,
} from '@/utils/equipmentEffectDisplay';
import { getEquipmentLevelColor, isEquipmentArtificable } from '@/utils/equipmentLevels';
import {
  findOperatorInstance,
  findWeaponInstance,
  findGearInstance,
} from '@/stores/timeline/instanceLookup';
import { useAppearance } from '@/composables/useAppearance';
import { adaptColorForLightSurface, solidFillForLightTrack } from '@/utils/theme';
import { registerBackHandler } from '@/platform/nativeBridge';
import OperatorSelectionDialog from '@/components/selection/OperatorSelectionDialog.vue';
import WeaponSelectionDialog from '@/components/selection/WeaponSelectionDialog.vue';
import EquipmentSelectionDialog from '@/components/selection/EquipmentSelectionDialog.vue';
import EditOperatorInstanceDialog from '@/components/armory/EditOperatorInstanceDialog.vue';
import EditWeaponInstanceDialog from '@/components/armory/EditWeaponInstanceDialog.vue';
import EditTrackGearLoadoutDialog from '@/components/armory/EditTrackGearLoadoutDialog.vue';
import MobileSkillLibraryDrawer from '@/components/mobile/MobileSkillLibraryDrawer.vue';
import StatDetailDialog from '@/components/StatDetailDialog.vue';
import HitDamageDetailDialog from '@/components/HitDamageDetailDialog.vue';
import EnemySettingsPanel from '@/components/EnemySettingsPanel.vue';
import {
  getSnappedTimelineDragDelta,
  getStepSampleAtTime,
  getVerticalEdgeScrollSpeed,
  isTapGesture,
  pointerYToTimelineTime,
  snapTimelineTime,
  timelineYToTime,
} from '@/utils/mobileTimelineEditing';

const store = useTimelineStore();
const { t, te, locale } = useI18n({ useScope: 'global' });
const { appearance, setAppearance } = useAppearance();
const DEFAULT_ICON = '/icons/default_icon.webp';
const MOBILE_TIMELINE_PREFS_KEY = 'endaxis:mobile-timeline-prefs:v1';

function loadMobileTimelinePrefs() {
  try {
    const value = JSON.parse(localStorage.getItem(MOBILE_TIMELINE_PREFS_KEY) || '{}');
    return {
      showAllAttackSegments: value?.showAllAttackSegments === true,
      showAnomalies:
        typeof value?.showAnomalies === 'boolean'
          ? value.showAnomalies
          : value?.showBuffs !== false,
      showDurationBars: value?.showDurationBars !== false,
      showFreezeEffects: value?.showFreezeEffects !== false,
      showStaggerBreaks: value?.showStaggerBreaks !== false,
      showOperationHints: value?.showOperationHints !== false,
    };
  } catch {
    return {
      showAllAttackSegments: false,
      showAnomalies: true,
      showDurationBars: true,
      showFreezeEffects: true,
      showStaggerBreaks: true,
      showOperationHints: true,
    };
  }
}

const mobileTimelinePrefs = loadMobileTimelinePrefs();

const loadoutOpen = ref(false);
const loadoutTrackIndex = ref(null);
const operatorSelectionDialogRef = ref(null);
const weaponSelectionDialogRef = ref(null);
const equipmentSelectionDialogRef = ref(null);
const enemySettingsPanelRef = ref(null);
const operatorStatusOpen = ref(false);
const weaponStatusOpen = ref(false);
const equipmentStatusOpen = ref(false);
const statDetailOpen = ref(false);
const skillLibraryOpen = ref(false);
const pendingPlacementSkill = shallowRef(null);
const placementTrackIndex = ref(null);
const mobileScrollRef = ref(null);
const mobileTimelineRef = ref(null);
const mobileGuideVisible = ref(false);
const mobileGuideTime = ref(0);
const draggingActionId = ref(null);
const dragPreviewOffsetPx = ref(0);
const dragPreviewLogicalTime = ref(null);
let placementPointerStart = null;
let suppressActionClickUntil = 0;
let actionPointerSession = null;
let actionLongPressTimer = null;
let dragAutoScrollRaf = null;
let dragAutoScrollSpeed = 0;
let dragTargetIds = new Set();
let mobileGuidePointerId = null;
let mobileGuidePendingPointer = null;
let mobileGuideRaf = null;

const actionInfoOpen = ref(false);
const selectedActionId = ref(null);
const selectedDamageHit = shallowRef(null);
const skillDamageOpen = ref(false);
const effectDamageOpen = ref(false);

const importVisible = ref(false);
const shareCode = ref('');
const importing = ref(false);
const moreMenuOpen = ref(false);
const showAllAttackSegments = ref(mobileTimelinePrefs.showAllAttackSegments);
const showAnomalies = ref(mobileTimelinePrefs.showAnomalies);
const showDurationBars = ref(mobileTimelinePrefs.showDurationBars);
const showFreezeEffects = ref(mobileTimelinePrefs.showFreezeEffects);
const showStaggerBreaks = ref(mobileTimelinePrefs.showStaggerBreaks);
const showOperationHints = ref(mobileTimelinePrefs.showOperationHints);
let unregisterBackHandler = null;

const scenarioList = computed(() => (Array.isArray(store.scenarioList) ? store.scenarioList : []));
const selectedScenarioId = ref(store.activeScenarioId);
const scenarioSwitching = ref(false);
const historyFeedback = ref(null);
let historyFeedbackTimer = null;
const prepDurationDraft = ref(Number(store.prepDuration) || 5);
const battleDurationDraft = ref(Number(store.battleDuration) || 120);
const scenarioRenameActive = ref(false);
const scenarioRenameInputRef = ref(null);
const currentScenario = computed(
  () =>
    scenarioList.value.find(scenario => scenario?.id === store.activeScenarioId) ||
    scenarioList.value[0] ||
    null,
);

const tracks = computed(() => (Array.isArray(store.tracks) ? store.tracks.slice(0, 4) : []));
const activeMobileTrackIndex = computed(() => {
  const active = Number(store.activeTrackIndex);
  if (Number.isInteger(active) && active >= 0 && active < tracks.value.length) return active;
  const loadout = Number(loadoutTrackIndex.value);
  if (Number.isInteger(loadout) && loadout >= 0 && loadout < tracks.value.length) return loadout;
  return null;
});
const activeMobileTrack = computed(() => {
  const index = activeMobileTrackIndex.value;
  return index === null ? null : tracks.value[index] || null;
});
const activeEnemyDisplayName = computed(() => {
  void locale.value;
  if (store.activeEnemyId === 'custom') return t('resourceMonitor.enemy.custom');
  const enemy = (store.enemyDatabase || []).find(item => item?.id === store.activeEnemyId);
  return enemy ? getEnemyGameName(enemy.id, locale.value) : t('resourceMonitor.enemy.unknown');
});
const pxPerSecond = computed(() => {
  const raw = Number(store.timeBlockWidth) || 50;
  return Math.min(Math.max(raw, 20), 80);
});

const COLLAPSED_PREP_PX = 18;
const SKILL_COOLDOWN_COLOR = '#ff6fae';

function toRgba(color, alpha) {
  const a = Number(alpha);
  const clamped = Number.isFinite(a) ? Math.min(1, Math.max(0, a)) : 1;
  const s = String(color || '').trim();

  if (s.startsWith('#')) {
    const hex = s.slice(1);
    const full =
      hex.length === 3
        ? hex
            .split('')
            .map(ch => ch + ch)
            .join('')
        : hex;

    if (full.length === 6) {
      const r = parseInt(full.slice(0, 2), 16);
      const g = parseInt(full.slice(2, 4), 16);
      const b = parseInt(full.slice(4, 6), 16);
      if ([r, g, b].every(v => Number.isFinite(v))) {
        return `rgba(${r}, ${g}, ${b}, ${clamped})`;
      }
    }
  }

  return `rgba(255, 255, 255, ${clamped})`;
}

function timeToY(time) {
  const v = Number(time) || 0;
  const prep = Math.max(0, Number(store.prepDuration) || 0);
  const expanded = store.prepExpanded !== false;

  if (prep <= 0 || expanded) return v * pxPerSecond.value;
  if (v <= prep) return (v / prep) * COLLAPSED_PREP_PX;
  return COLLAPSED_PREP_PX + (v - prep) * pxPerSecond.value;
}

function mobileTimelineYToTime(offsetY) {
  return timelineYToTime({
    offsetY,
    pixelsPerSecond: pxPerSecond.value,
    prepDuration: Number(store.prepDuration) || 0,
    prepExpanded: store.prepExpanded !== false,
    collapsedPrepPx: COLLAPSED_PREP_PX,
  });
}

function flushMobileGuidePointer() {
  mobileGuideRaf = null;
  const pending = mobileGuidePendingPointer;
  mobileGuidePendingPointer = null;
  if (!pending) return;
  mobileGuideTime.value = pointerYToTimelineTime({
    clientY: pending.clientY,
    timelineTop: pending.timelineTop,
    pixelsPerSecond: pxPerSecond.value,
    snapStep: Number(store.snapStep) || 1 / 30,
    maxTime: viewDuration.value,
    prepDuration: prepDuration.value,
    prepExpanded: store.prepExpanded !== false,
    collapsedPrepPx: COLLAPSED_PREP_PX,
  });
}

function queueMobileGuidePointer(event) {
  const target = event.currentTarget;
  if (!(target instanceof HTMLElement)) return;
  mobileGuidePendingPointer = {
    clientY: event.clientY,
    timelineTop: target.getBoundingClientRect().top,
  };
  if (mobileGuideRaf == null) {
    mobileGuideRaf = window.requestAnimationFrame(flushMobileGuidePointer);
  }
}

function beginMobileGuide(event) {
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  mobileGuidePointerId = event.pointerId;
  mobileGuideVisible.value = true;
  event.currentTarget?.setPointerCapture?.(event.pointerId);
  queueMobileGuidePointer(event);
}

function moveMobileGuide(event) {
  if (event.pointerId !== mobileGuidePointerId) return;
  queueMobileGuidePointer(event);
}

function finishMobileGuide(event) {
  if (event.pointerId !== mobileGuidePointerId) return;
  queueMobileGuidePointer(event);
  event.currentTarget?.releasePointerCapture?.(event.pointerId);
  mobileGuidePointerId = null;
}

const viewDuration = computed(() => Number(store.viewDuration) || 0);
const timelineHeightPx = computed(() => Math.max(0, Math.ceil(timeToY(viewDuration.value))));
const prepDuration = computed(() => Math.max(0, Number(store.prepDuration) || 0));
const battleStartYPx = computed(() => Math.max(0, Math.round(timeToY(prepDuration.value))));
const prepHeightPx = computed(() => battleStartYPx.value);

function toggleMobilePrepExpanded() {
  cancelActionPointerSession();
  store.togglePrepExpanded();
}

function applyMobilePrepDuration(value) {
  const next = Number(value);
  if (Number.isFinite(next)) store.setPrepDuration(next);
  prepDurationDraft.value = Number(store.prepDuration) || 0;
}

function applyMobileBattleDuration(value) {
  const next = Number(value);
  if (Number.isFinite(next)) store.setBattleDuration(next);
  battleDurationDraft.value = Number(store.battleDuration) || 0;
}

function waitForUiPaint() {
  return new Promise(resolve => {
    if (typeof window.requestAnimationFrame !== 'function') {
      window.setTimeout(resolve, 16);
      return;
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(resolve);
    });
  });
}

async function handleScenarioChange(nextId) {
  const targetId = String(nextId || '');
  if (!targetId || targetId === store.activeScenarioId || scenarioSwitching.value) return;

  selectedScenarioId.value = targetId;
  cancelActionPointerSession();
  cancelPlacement();
  skillLibraryOpen.value = false;
  scenarioSwitching.value = true;

  try {
    await nextTick();
    await waitForUiPaint();
    store.switchScenario(targetId);
    await nextTick();
  } finally {
    selectedScenarioId.value = store.activeScenarioId;
    scenarioSwitching.value = false;
  }
}

function startScenarioRename() {
  if (!currentScenario.value || scenarioSwitching.value) return;
  scenarioRenameActive.value = true;
  nextTick(() => {
    scenarioRenameInputRef.value?.focus?.();
    scenarioRenameInputRef.value?.select?.();
  });
}

function finishScenarioRename() {
  scenarioRenameActive.value = false;
}

function handleDuplicateScenario() {
  if (!currentScenario.value || scenarioSwitching.value) return;
  if (scenarioList.value.length >= store.MAX_SCENARIOS) {
    ElMessage.warning(t('timeline.scenario.limit', { max: store.MAX_SCENARIOS }));
    return;
  }
  finishScenarioRename();
  cancelActionPointerSession();
  cancelPlacement();
  store.duplicateScenario(currentScenario.value.id);
  ElMessage.success(t('timeline.scenario.duplicated'));
}

function handleDeleteScenario() {
  const scenario = currentScenario.value;
  if (!scenario || scenarioSwitching.value || scenarioList.value.length <= 1) return;
  finishScenarioRename();
  ElMessageBox.confirm(t('timeline.scenario.deleteConfirm'), t('timeline.scenario.deleteTitle'), {
    confirmButtonText: t('common.delete'),
    cancelButtonText: t('common.cancel'),
    type: 'warning',
    lockScroll: false,
  })
    .then(() => {
      cancelActionPointerSession();
      cancelPlacement();
      store.deleteScenario(scenario.id);
      ElMessage.success(t('timeline.scenario.deleted'));
    })
    .catch(() => {});
}

function handleAddScenario() {
  if (scenarioSwitching.value) return;
  if (scenarioList.value.length >= store.MAX_SCENARIOS) {
    ElMessage.warning(t('timeline.scenario.limit', { max: store.MAX_SCENARIOS }));
    return;
  }
  finishScenarioRename();
  cancelActionPointerSession();
  cancelPlacement();
  store.addScenario();
}

onMounted(() => {
  try {
    document?.body?.classList?.add('endaxis-mobile-viewer');
  } catch {
    // ignore
  }
  unregisterBackHandler = registerBackHandler(() => {
    if (selectedDamageHit.value) {
      selectedDamageHit.value = null;
      return true;
    }
    if (statDetailOpen.value) {
      statDetailOpen.value = false;
      return true;
    }
    const selectionDialogs = [
      enemySettingsPanelRef.value,
      equipmentSelectionDialogRef.value,
      weaponSelectionDialogRef.value,
      operatorSelectionDialogRef.value,
    ];
    const openSelectionDialog = selectionDialogs.find(dialog => dialog?.isOpen?.());
    if (openSelectionDialog) {
      openSelectionDialog.close?.();
      return true;
    }
    if (operatorStatusOpen.value) {
      operatorStatusOpen.value = false;
      return true;
    }
    if (weaponStatusOpen.value) {
      weaponStatusOpen.value = false;
      return true;
    }
    if (equipmentStatusOpen.value) {
      equipmentStatusOpen.value = false;
      return true;
    }
    if (skillLibraryOpen.value) {
      skillLibraryOpen.value = false;
      return true;
    }
    if (pendingPlacementSkill.value) {
      cancelPlacement();
      return true;
    }
    if (scenarioRenameActive.value) {
      finishScenarioRename();
      return true;
    }
    if (mobileGuideVisible.value) {
      mobileGuideVisible.value = false;
      return true;
    }
    if (moreMenuOpen.value) {
      moreMenuOpen.value = false;
      return true;
    }
    if (actionInfoOpen.value) {
      actionInfoOpen.value = false;
      return true;
    }
    if (loadoutOpen.value) {
      loadoutOpen.value = false;
      return true;
    }
    if (importVisible.value) {
      importVisible.value = false;
      return true;
    }
    return false;
  });
});

onUnmounted(() => {
  cancelActionPointerSession();
  if (historyFeedbackTimer != null) window.clearTimeout(historyFeedbackTimer);
  historyFeedbackTimer = null;
  if (mobileGuideRaf != null) window.cancelAnimationFrame(mobileGuideRaf);
  mobileGuideRaf = null;
  mobileGuidePendingPointer = null;
  unregisterBackHandler?.();
  unregisterBackHandler = null;
  try {
    document?.body?.classList?.remove('endaxis-mobile-viewer');
  } catch {
    // ignore
  }
});

function changeLocale(next) {
  locale.value = setLocale(next);
}

function openEnemySelector() {
  enemySettingsPanelRef.value?.openSelector?.();
}

function openImportDialog() {
  moreMenuOpen.value = false;
  importVisible.value = true;
}

function handleReset() {
  moreMenuOpen.value = false;
  ElMessageBox.confirm(t('timeline.reset.confirm'), t('common.warning'), {
    confirmButtonText: t('timeline.reset.confirmButton'),
    cancelButtonText: t('common.cancel'),
    type: 'warning',
    lockScroll: false,
  })
    .then(() => {
      cancelActionPointerSession();
      cancelPlacement();
      store.resetProject();
      ElMessage.success(t('timeline.reset.done'));
    })
    .catch(() => {});
}

function getTrackAvatar(track) {
  const id = track?.id;
  const roster = Array.isArray(store.characterRoster) ? store.characterRoster : [];
  const found = roster.find(c => c && c.id === id);
  return found?.avatar || DEFAULT_ICON;
}

function getArtificingLevel(instance, slotIdx) {
  const levels = Array.isArray(instance?.artificingLevels) ? instance.artificingLevels : [];
  const level = Number(levels[slotIdx]) || 0;
  return Math.max(0, Math.min(3, level));
}

function getEquipmentSkillSlots(piece) {
  if (!piece) return [];
  return [piece.skill1, piece.skill2, piece.skill3]
    .filter(Boolean)
    .map(skill =>
      mergeEquipmentElementPairEffects(skill.effects || []).filter(
        effect => effect.kind === 'status',
      ),
    )
    .filter(slot => slot.length > 0);
}

function getEquipmentStatRows(piece, instance) {
  return getEquipmentSkillSlots(piece).map((slot, index) => {
    const effect = slot[0];
    const refine = getArtificingLevel(instance, index);
    return {
      key: `${effect?.id || effect?.stat?.modifier || 'stat'}-${index}`,
      label: formatEquipmentEffectLabel(effect, t, locale.value),
      value: effect
        ? formatEquipmentEffectStatValue(effect, resolveLeveled(effect.value, refine))
        : '',
      refine,
    };
  });
}

function withBaseUrl(input) {
  const s = String(input || '').trim();
  if (!s) return '';

  if (/^https?:\/\//i.test(s)) return s;

  const baseUrl = import.meta.env.BASE_URL || '/';
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  if (s.startsWith('/')) return `${base}${s}`;
  return `${base}/${s}`;
}

function onAssetError(evt) {
  try {
    evt.target.src = withBaseUrl(DEFAULT_ICON);
  } catch {
    // ignore
  }
}

function getTrackName(track) {
  void locale.value;
  const id = track?.id;
  if (!id) return t('common.unknown');
  return getOperatorGameName(id, locale.value) || id || t('common.unknown');
}

function getSelectedWeaponName() {
  void locale.value;
  const slug = selectedWeaponInstance.value?.weaponSlug || selectedTrack.value?.weaponId;
  if (!slug) return '';
  return getWeaponGameName(slug, locale.value) || selectedWeapon.value?.name || slug;
}

function openLoadout(index) {
  const i = Number(index);
  if (!Number.isFinite(i) || i < 0 || i >= tracks.value.length) return;
  cancelPlacement();
  store.selectTrack(i);
  loadoutTrackIndex.value = i;
  loadoutOpen.value = true;
}

function resolveEditingTrackIndex(preferredIndex = activeMobileTrackIndex.value) {
  const preferred = Number(preferredIndex);
  if (Number.isInteger(preferred) && preferred >= 0 && preferred < tracks.value.length) {
    return preferred;
  }
  const firstAssigned = tracks.value.findIndex(track => track?.id);
  return firstAssigned >= 0 ? firstAssigned : 0;
}

function openOperatorSelection(index = loadoutTrackIndex.value) {
  const trackIndex = resolveEditingTrackIndex(index);
  loadoutTrackIndex.value = trackIndex;
  operatorSelectionDialogRef.value?.open?.(trackIndex);
}

function openWeaponSelection() {
  const trackIndex = resolveEditingTrackIndex(loadoutTrackIndex.value);
  if (!tracks.value[trackIndex]?.id) {
    openOperatorSelection(trackIndex);
    return;
  }
  weaponSelectionDialogRef.value?.open?.(trackIndex);
}

function openEquipmentSelection(slotKey) {
  const trackIndex = resolveEditingTrackIndex(loadoutTrackIndex.value);
  if (!tracks.value[trackIndex]?.id) {
    openOperatorSelection(trackIndex);
    return;
  }
  equipmentSelectionDialogRef.value?.open?.(trackIndex, slotKey);
}

function openOperatorStatus() {
  if (!selectedOperatorInstance.value) return;
  operatorStatusOpen.value = true;
}

function openWeaponStatus() {
  if (!selectedWeaponInstance.value) return;
  weaponStatusOpen.value = true;
}

function openEquipmentStatus() {
  if (!hasSelectedEquipment.value) return;
  equipmentStatusOpen.value = true;
}

function openStatDetail() {
  if (!selectedTrack.value?.operatorStatus) return;
  statDetailOpen.value = true;
}

function openSkillLibrary(index = activeMobileTrackIndex.value) {
  const trackIndex = resolveEditingTrackIndex(index);
  const track = tracks.value[trackIndex];
  if (!track?.id) {
    openOperatorSelection(trackIndex);
    return;
  }
  store.selectTrack(trackIndex);
  loadoutTrackIndex.value = trackIndex;
  loadoutOpen.value = false;
  skillLibraryOpen.value = true;
}

function beginSkillPlacement(skill) {
  const trackIndex = activeMobileTrackIndex.value;
  if (!skill || trackIndex === null || !tracks.value[trackIndex]?.id) return;
  pendingPlacementSkill.value = skill;
  placementTrackIndex.value = trackIndex;
  skillLibraryOpen.value = false;
}

function cancelPlacement() {
  pendingPlacementSkill.value = null;
  placementTrackIndex.value = null;
  placementPointerStart = null;
}

function getActionLogicalStart(action) {
  return Number(action?.logicalStartTime ?? action?.startTime) || 0;
}

function getActionDragTargets(track, sourceAction) {
  const allActions = tracks.value.flatMap(item => item?.actions || []);
  let targets = [sourceAction];

  if (sourceAction?.comboGroupId && sourceAction.comboLinked !== false) {
    targets = allActions.filter(action => action?.comboGroupId === sourceAction.comboGroupId);
  } else if (sourceAction?.attackGroupInstanceId) {
    targets = allActions.filter(
      action => action?.attackGroupInstanceId === sourceAction.attackGroupInstanceId,
    );
  } else if (
    sourceAction?.parentSkillId &&
    Number(sourceAction.segmentTotal) > 1 &&
    Number(sourceAction.segmentIndex) > 0
  ) {
    const ordered = Array.isArray(track?.actions) ? track.actions : [];
    const sourceIndex = ordered.indexOf(sourceAction);
    const segmentIndex = Number(sourceAction.segmentIndex);
    const segmentTotal = Number(sourceAction.segmentTotal);
    let first = sourceIndex;
    let last = sourceIndex;

    while (first > 0) {
      const current = ordered[first];
      const previous = ordered[first - 1];
      if (
        previous?.parentSkillId !== sourceAction.parentSkillId ||
        Number(previous?.segmentTotal) !== segmentTotal ||
        Number(previous?.segmentIndex) !== Number(current?.segmentIndex) - 1
      ) {
        break;
      }
      first -= 1;
    }
    while (last >= 0 && last < ordered.length - 1) {
      const current = ordered[last];
      const next = ordered[last + 1];
      if (
        next?.parentSkillId !== sourceAction.parentSkillId ||
        Number(next?.segmentTotal) !== segmentTotal ||
        Number(next?.segmentIndex) !== Number(current?.segmentIndex) + 1
      ) {
        break;
      }
      last += 1;
    }

    const contiguous = ordered.slice(first, last + 1);
    if (
      contiguous.length === segmentTotal &&
      Number(contiguous[0]?.segmentIndex) === 1 &&
      Number(contiguous.at(-1)?.segmentIndex) === segmentTotal &&
      segmentIndex <= segmentTotal
    ) {
      targets = contiguous;
    }
  }

  return [...new Map(targets.filter(Boolean).map(action => [action.instanceId, action])).values()];
}

function clearActionLongPressTimer() {
  if (actionLongPressTimer !== null) {
    window.clearTimeout(actionLongPressTimer);
    actionLongPressTimer = null;
  }
}

function stopDragAutoScroll() {
  dragAutoScrollSpeed = 0;
  if (dragAutoScrollRaf !== null) {
    window.cancelAnimationFrame(dragAutoScrollRaf);
    dragAutoScrollRaf = null;
  }
}

function clearDragPreviewFrame() {
  if (actionPointerSession?.previewRaf != null) {
    window.cancelAnimationFrame(actionPointerSession.previewRaf);
    actionPointerSession.previewRaf = null;
  }
}

function resetActionDragVisuals() {
  draggingActionId.value = null;
  dragPreviewOffsetPx.value = 0;
  dragPreviewLogicalTime.value = null;
  dragTargetIds = new Set();
  document?.body?.classList?.remove('is-mobile-action-dragging');
}

function cancelActionPointerSession() {
  clearActionLongPressTimer();
  stopDragAutoScroll();
  clearDragPreviewFrame();
  window.removeEventListener('pointermove', handleActionPointerMove);
  window.removeEventListener('pointerup', handleActionPointerUp);
  window.removeEventListener('pointercancel', handleActionPointerCancel);
  actionPointerSession = null;
  resetActionDragVisuals();
}

function beginActionDrag() {
  const session = actionPointerSession;
  if (!session || session.scrolling || session.dragging) return;

  const targets = getActionDragTargets(session.track, session.action);
  if (targets.some(action => action?.isLocked || action?.locked)) {
    ElMessage.warning({
      message: t('timelineGrid.action.locked'),
      duration: 1000,
      grouping: true,
    });
    clearActionLongPressTimer();
    return;
  }

  const timelineElement = mobileTimelineRef.value;
  if (!(timelineElement instanceof HTMLElement)) return;

  const timelineRect = timelineElement.getBoundingClientRect();
  const visualStart = getVisualActionStartTime(session.action);
  session.dragging = true;
  session.targets = targets;
  session.originalLogicalTimes = new Map(
    targets.map(action => [action.instanceId, getActionLogicalStart(action)]),
  );
  session.primaryLogicalStart = getActionLogicalStart(session.action);
  session.initialVisualStart = visualStart;
  session.pointerStartTime = mobileTimelineYToTime(session.startY - timelineRect.top);
  session.deltaTime = 0;
  dragTargetIds = new Set(targets.map(action => action.instanceId));
  draggingActionId.value = session.action.instanceId;
  dragPreviewLogicalTime.value = session.primaryLogicalStart;
  suppressActionClickUntil = Date.now() + 500;
  document?.body?.classList?.add('is-mobile-action-dragging');

  try {
    session.element?.setPointerCapture?.(session.pointerId);
  } catch {
    // Pointer capture may be unavailable in an embedded WebView.
  }
}

function flushActionDragPreview(clientY = actionPointerSession?.lastY) {
  const session = actionPointerSession;
  const timelineElement = mobileTimelineRef.value;
  if (
    !session?.dragging ||
    !(timelineElement instanceof HTMLElement) ||
    !Number.isFinite(clientY)
  ) {
    return;
  }

  const timelineRect = timelineElement.getBoundingClientRect();
  const pointerTime = mobileTimelineYToTime(clientY - timelineRect.top);
  const originalTimes = [...session.originalLogicalTimes.values()];
  const deltaTime = getSnappedTimelineDragDelta({
    initialStart: session.primaryLogicalStart,
    pointerDelta: pointerTime - session.pointerStartTime,
    startTimes: originalTimes,
    snapStep: Number(store.snapStep) || 1 / 30,
    minTime: store.prepExpanded === false ? prepDuration.value : 0,
    maxTime: viewDuration.value,
  });
  const previewLogicalStart = session.primaryLogicalStart + deltaTime;
  const previewVisualStart = session.initialVisualStart + deltaTime;

  session.deltaTime = deltaTime;
  dragPreviewLogicalTime.value = previewLogicalStart;
  dragPreviewOffsetPx.value = timeToY(previewVisualStart) - timeToY(session.initialVisualStart);
}

function scheduleActionDragPreview(clientY) {
  const session = actionPointerSession;
  if (!session?.dragging) return;
  session.lastY = clientY;
  if (session.previewRaf != null) return;
  session.previewRaf = window.requestAnimationFrame(() => {
    if (!actionPointerSession) return;
    actionPointerSession.previewRaf = null;
    flushActionDragPreview();
  });
}

function performDragAutoScroll() {
  const session = actionPointerSession;
  const scrollElement = mobileScrollRef.value;
  if (!session?.dragging || !(scrollElement instanceof HTMLElement) || dragAutoScrollSpeed === 0) {
    dragAutoScrollRaf = null;
    return;
  }

  const previousTop = scrollElement.scrollTop;
  scrollElement.scrollTop += dragAutoScrollSpeed;
  if (scrollElement.scrollTop !== previousTop) flushActionDragPreview(session.lastY);
  dragAutoScrollRaf = window.requestAnimationFrame(performDragAutoScroll);
}

function updateDragAutoScroll(clientY) {
  const scrollElement = mobileScrollRef.value;
  if (!(scrollElement instanceof HTMLElement)) return;
  const rect = scrollElement.getBoundingClientRect();
  dragAutoScrollSpeed = getVerticalEdgeScrollSpeed({
    clientY,
    top: rect.top,
    bottom: rect.bottom,
  });
  if (dragAutoScrollSpeed !== 0 && dragAutoScrollRaf === null) {
    dragAutoScrollRaf = window.requestAnimationFrame(performDragAutoScroll);
  } else if (dragAutoScrollSpeed === 0) {
    stopDragAutoScroll();
  }
}

function handleActionPointerDown(event, track, action) {
  if (
    pendingPlacementSkill.value ||
    actionPointerSession ||
    event.button !== 0 ||
    !action?.instanceId
  ) {
    return;
  }

  event.stopPropagation();

  actionPointerSession = {
    pointerId: event.pointerId,
    track,
    action,
    element: event.currentTarget,
    startX: event.clientX,
    startY: event.clientY,
    lastY: event.clientY,
    initialScrollTop: mobileScrollRef.value?.scrollTop || 0,
    scrolling: false,
    dragging: false,
    previewRaf: null,
  };

  window.addEventListener('pointermove', handleActionPointerMove, { passive: false });
  window.addEventListener('pointerup', handleActionPointerUp);
  window.addEventListener('pointercancel', handleActionPointerCancel);
  actionLongPressTimer = window.setTimeout(beginActionDrag, 280);
}

function handleActionPointerMove(event) {
  const session = actionPointerSession;
  if (!session || event.pointerId !== session.pointerId) return;

  const deltaX = event.clientX - session.startX;
  const deltaY = event.clientY - session.startY;
  const distance = Math.hypot(deltaX, deltaY);

  if (!session.dragging) {
    if (distance <= 8) return;
    clearActionLongPressTimer();
    session.scrolling = true;
    suppressActionClickUntil = Date.now() + 250;
    if (Math.abs(deltaY) >= Math.abs(deltaX) && mobileScrollRef.value) {
      event.preventDefault();
      mobileScrollRef.value.scrollTop = session.initialScrollTop - deltaY;
    }
    return;
  }

  event.preventDefault();
  scheduleActionDragPreview(event.clientY);
  updateDragAutoScroll(event.clientY);
}

function commitActionDrag() {
  const session = actionPointerSession;
  if (!session?.dragging) return;

  clearDragPreviewFrame();
  flushActionDragPreview(session.lastY);
  const deltaTime = Number(session.deltaTime) || 0;
  if (Math.abs(deltaTime) < 0.0001) return;

  tracks.value.forEach(track => {
    track.actions?.forEach(action => {
      if (action.logicalStartTime === undefined) action.logicalStartTime = action.startTime;
    });
  });
  session.targets.forEach(action => {
    const original = session.originalLogicalTimes.get(action.instanceId);
    if (!Number.isFinite(original)) return;
    const nextStart = snapTimelineTime(
      original + deltaTime,
      Number(store.snapStep) || 1 / 30,
      viewDuration.value,
    );
    action.logicalStartTime = nextStart;
    action.startTime = nextStart;
  });
  store.refreshAllActionShifts();
  tracks.value.forEach(track => {
    track.actions?.sort((a, b) => (Number(a.startTime) || 0) - (Number(b.startTime) || 0));
  });
  store.commitState();
}

function finishActionPointerSession(event, shouldCommit) {
  const session = actionPointerSession;
  if (!session || event.pointerId !== session.pointerId) return;
  if (shouldCommit) commitActionDrag();
  if (session.dragging || session.scrolling) suppressActionClickUntil = Date.now() + 350;
  cancelActionPointerSession();
}

function handleActionPointerUp(event) {
  finishActionPointerSession(event, true);
}

function handleActionPointerCancel(event) {
  finishActionPointerSession(event, false);
}

function handleTrackPointerDown(event, trackIndex) {
  if (!pendingPlacementSkill.value || trackIndex !== placementTrackIndex.value) return;
  placementPointerStart = {
    pointerId: event.pointerId,
    trackIndex,
    x: event.clientX,
    y: event.clientY,
  };
}

function handleTrackPointerCancel() {
  placementPointerStart = null;
}

function handleTrackPointerUp(event, trackIndex) {
  const start = placementPointerStart;
  placementPointerStart = null;
  if (
    !pendingPlacementSkill.value ||
    !start ||
    start.pointerId !== event.pointerId ||
    start.trackIndex !== trackIndex ||
    trackIndex !== placementTrackIndex.value ||
    !isTapGesture(start, { x: event.clientX, y: event.clientY })
  ) {
    return;
  }

  const track = tracks.value[trackIndex];
  const element = event.currentTarget;
  if (!track?.id || !(element instanceof HTMLElement)) return;

  const visualStartTime = pointerYToTimelineTime({
    clientY: event.clientY,
    timelineTop: element.getBoundingClientRect().top,
    pixelsPerSecond: pxPerSecond.value,
    snapStep: Number(store.snapStep) || 1 / 30,
    maxTime: viewDuration.value,
    prepDuration: prepDuration.value,
    prepExpanded: store.prepExpanded !== false,
    collapsedPrepPx: COLLAPSED_PREP_PX,
  });
  const minStartTime = store.prepExpanded === false ? prepDuration.value : 0;
  const startTime = Math.max(
    minStartTime,
    snapTimelineTime(
      typeof store.toGameTime === 'function' ? store.toGameTime(visualStartTime) : visualStartTime,
      Number(store.snapStep) || 1 / 30,
      viewDuration.value,
    ),
  );
  const skillName = pendingPlacementSkill.value.name || t('skillType.unknown');
  store.addSkillToTrack(track.id, pendingPlacementSkill.value, startTime);
  suppressActionClickUntil = Date.now() + 350;
  cancelPlacement();
  ElMessage.success(t('timeline.mobile.skillLibrary.placed', { name: skillName }));
}

function handleActionClick(instanceId) {
  if (pendingPlacementSkill.value || Date.now() < suppressActionClickUntil) return;
  openActionInfo(instanceId);
}

function finishHistoryFeedback(kind) {
  if (historyFeedbackTimer != null) window.clearTimeout(historyFeedbackTimer);
  historyFeedbackTimer = window.setTimeout(() => {
    historyFeedbackTimer = null;
    if (historyFeedback.value === kind) historyFeedback.value = null;
  }, 140);
}

async function handleUndo() {
  if (!store.canUndo || historyFeedback.value) return;
  cancelActionPointerSession();
  cancelPlacement();
  historyFeedback.value = 'undo';
  await nextTick();
  await waitForUiPaint();
  try {
    store.undo();
  } finally {
    finishHistoryFeedback('undo');
  }
}

async function handleRedo() {
  if (!store.canRedo || historyFeedback.value) return;
  cancelActionPointerSession();
  cancelPlacement();
  historyFeedback.value = 'redo';
  await nextTick();
  await waitForUiPaint();
  try {
    store.redo();
  } finally {
    finishHistoryFeedback('redo');
  }
}

const selectedTrack = computed(() => {
  const i = Number(loadoutTrackIndex.value);
  if (!Number.isFinite(i)) return null;
  return tracks.value[i] || null;
});

const selectedWeaponInstance = computed(() => {
  const id = selectedTrack.value?.weaponInstanceId;
  return id ? findWeaponInstance(id) : null;
});

const selectedWeapon = computed(() => {
  const id = selectedWeaponInstance.value?.weaponSlug || selectedTrack.value?.weaponId;
  if (!id || typeof store.getWeaponById !== 'function') return null;
  return store.getWeaponById(id) || null;
});

const selectedWeaponSkill1Level = computed(
  () => selectedWeaponInstance.value?.skill1Level ?? selectedTrack.value?.weaponCommon1Tier ?? 1,
);
const selectedWeaponSkill2Level = computed(
  () => selectedWeaponInstance.value?.skill2Level ?? selectedTrack.value?.weaponCommon2Tier ?? 1,
);
const selectedWeaponSkill3Level = computed(
  () => selectedWeaponInstance.value?.skill3Level ?? selectedTrack.value?.weaponBuffTier ?? 1,
);

function formatTierLabel(val) {
  const n = Number(val);
  if (!Number.isFinite(n)) return '-';
  return `${n}${t('common.levelSuffix')}`;
}

const selectedWeaponSkillLines = computed(() => {
  void locale.value;
  const slug = selectedWeaponInstance.value?.weaponSlug || selectedTrack.value?.weaponId;
  if (!slug || !selectedWeapon.value) return [];

  const levels = [
    selectedWeaponSkill1Level.value,
    selectedWeaponSkill2Level.value,
    selectedWeaponSkill3Level.value,
  ];

  return ['skill1', 'skill2', 'skill3'].map((skillKey, index) => ({
    key: skillKey,
    name: getWeaponSkillName(slug, skillKey, locale.value) || skillKey,
    tier: formatTierLabel(levels[index]),
  }));
});

const EQUIPMENT_SLOT_CONFIGS = [
  {
    slotKey: 'armor',
    idKey: 'equipArmorId',
    instanceKey: 'equipArmorInstanceId',
    tierKey: 'equipArmorRefineTier',
  },
  {
    slotKey: 'gloves',
    idKey: 'equipGlovesId',
    instanceKey: 'equipGlovesInstanceId',
    tierKey: 'equipGlovesRefineTier',
  },
  {
    slotKey: 'accessory1',
    idKey: 'equipAccessory1Id',
    instanceKey: 'equipAccessory1InstanceId',
    tierKey: 'equipAccessory1RefineTier',
  },
  {
    slotKey: 'accessory2',
    idKey: 'equipAccessory2Id',
    instanceKey: 'equipAccessory2InstanceId',
    tierKey: 'equipAccessory2RefineTier',
  },
];

const equipmentSlots = computed(() => {
  void locale.value;
  const track = selectedTrack.value;
  if (!track) return [];

  return EQUIPMENT_SLOT_CONFIGS.map(config => {
    const equipmentId = track[config.idKey] || null;
    const instance = track[config.instanceKey] ? findGearInstance(track[config.instanceKey]) : null;
    const pieceId = instance?.gearPieceId || equipmentId;
    const item =
      typeof store.getEquipmentById === 'function' ? store.getEquipmentById(pieceId) : null;
    const piece = pieceId ? getGearPiece(pieceId) : null;
    const level = Number(item?.level ?? piece?.levelRequirement) || 0;
    const isGold = isEquipmentArtificable(level);
    const trackRefine = Number(track[config.tierKey]);
    const stats = getEquipmentStatRows(piece, instance);
    const refineLevels = stats.map(row => Number(row.refine) || 0);
    const refineLabel =
      isGold && refineLevels.length > 0
        ? refineLevels.join('/')
        : isGold && Number.isFinite(trackRefine)
          ? String(Math.max(0, Math.min(3, trackRefine)))
          : null;

    return {
      slotKey: config.slotKey,
      slotLabel: t(`timelineGrid.equipmentSlot.${config.slotKey}`),
      id: pieceId || null,
      instance,
      item,
      piece,
      level: level || null,
      levelColor: getEquipmentLevelColor(level),
      isGold,
      name: pieceId ? getGearPieceGameName(pieceId, locale.value) || item?.name || pieceId : '',
      icon: piece?.icon || item?.icon || DEFAULT_ICON,
      setName:
        getGearSetGameName(piece?.setSlug || item?.category || '', locale.value) ||
        item?.categoryName ||
        '',
      slotTypeName: getGameSlotTypeName(piece?.slotType || item?.slot || '', locale.value),
      stats,
      refineLabel,
    };
  });
});

const hasSelectedEquipment = computed(() => equipmentSlots.value.some(slot => !!slot.instance));

const selectedOperatorInstance = computed(() => {
  const id = selectedTrack.value?.operatorInstanceId;
  return id ? findOperatorInstance(id) : null;
});

const selectedOperatorSummary = computed(() => {
  void locale.value;
  const inst = selectedOperatorInstance.value;
  if (!inst) return '';
  const parts = [];
  if (Number.isFinite(Number(inst.level))) {
    parts.push(`Lv${Number(inst.level)}`);
  }
  if (Number.isFinite(Number(inst.potential))) {
    parts.push(`${t('armory.common.potential')} ${Number(inst.potential)}`);
  }
  const gauge = Number(selectedTrack.value?.initialGauge);
  if (Number.isFinite(gauge) && gauge > 0) {
    parts.push(`${t('timelineGrid.track.initialGaugeShort')} ${gauge}`);
  }
  return parts.join(' · ');
});

const selectedSetBonusLabel = computed(() => {
  void locale.value;
  const trackId = selectedTrack.value?.id;
  if (!trackId || typeof store.getActiveSetBonusCategories !== 'function') return '';
  const cats = store.getActiveSetBonusCategories(trackId);
  if (!Array.isArray(cats) || cats.length === 0) return '';
  return cats
    .map(cat => getGearSetGameName(cat, locale.value) || cat)
    .filter(Boolean)
    .join(' / ');
});

function getTypeLabel(action) {
  if (action?.kind === 'attack_segment') {
    const total = Number(action.attackSequenceTotal) || 0;
    const idx = Number(action.attackSequenceIndex) || 0;
    if (total > 0 && idx > 0) {
      if (idx === total) {
        const named = String(action.name || '').trim();
        if (named) return named;
        return t('skillType.heavyAttack');
      }
      return `A${idx}`;
    }
  }

  const named = String(action?.name || '').trim();
  if (named && action?.kind !== 'attack_segment') return named;

  const type = toLegacyDisplayType(action?.type || 'unknown');
  const key = `skillType.${type}`;
  const out = t(key);
  return out === key ? String(type) : out;
}

function formatSec(val) {
  const n = Number(val);
  if (!Number.isFinite(n)) return '-';
  return (Math.round(n * 1000) / 1000).toFixed(3).replace(/\.?0+$/, '');
}

function formatAxisLabel(viewTime) {
  if (typeof store.formatAxisTimeLabel === 'function') {
    return store.formatAxisTimeLabel(viewTime);
  }
  return `${formatSec(viewTime)}s`;
}

function getActionColor(action, trackId = null) {
  const node = getCompiledAction(action)?.node || action;
  if (node?.customColor) return node.customColor;

  // Match ActionItem themeColor: type overrides first, then element, then operator element.
  if (node?.type === 'comboSkill') return store.getColor('link');
  if (node?.type === 'finisher') return store.getColor('execution');
  if (node?.type === 'basicAttack') return store.getColor('attack');
  if (node?.type === 'dive') return store.getColor('dodge');
  if (node?.element) return store.getColor(node.element);

  const resolvedTrackId =
    trackId ||
    action?.trackId ||
    (() => {
      const id = action?.instanceId;
      if (!id) return null;
      for (const track of store.tracks || []) {
        if (Array.isArray(track?.actions) && track.actions.some(a => a?.instanceId === id)) {
          return track.id;
        }
      }
      return null;
    })();

  if (resolvedTrackId && typeof store.getCharacterElementColor === 'function') {
    return store.getCharacterElementColor(resolvedTrackId);
  }
  return store.getColor('default');
}

function normalizeDuration(action) {
  const base = Number(action?.duration);
  if (Number.isFinite(base) && base > 0) return base;
  return 0.1;
}

function getCompiledAction(action) {
  const id = action?.instanceId;
  if (!id) return null;
  return store.compiledTimeline?.actionMap?.get(id) || null;
}

const freezeRegionBySourceId = computed(() => {
  const regions = Array.isArray(store.globalExtensions) ? store.globalExtensions : [];
  return new Map(
    regions.filter(region => region?.sourceId).map(region => [region.sourceId, region]),
  );
});

function getActionFreezeRegion(action) {
  return freezeRegionBySourceId.value.get(action?.instanceId) || null;
}

function getActionFreezeStyle(region) {
  const start = Number(region?.time) || 0;
  const amount = Math.max(0, Number(region?.amount) || 0);
  return {
    height: `${Math.max(2, timeToY(start + amount) - timeToY(start))}px`,
  };
}

function getVisualActionStartTime(action) {
  const resolved = getCompiledAction(action);
  return Number(resolved?.realStartTime ?? action?.startTime) || 0;
}

function getVisualActionEndTime(action) {
  const id = action?.instanceId;
  const storeEnd =
    typeof store.getActionVisualEndTime === 'function' ? store.getActionVisualEndTime(id) : null;
  const normalizedStoreEnd = Number(storeEnd);
  if (Number.isFinite(normalizedStoreEnd)) return normalizedStoreEnd;

  const start = getVisualActionStartTime(action);
  return start + normalizeDuration(action);
}

function getVisualActionDuration(action) {
  const start = getVisualActionStartTime(action);
  const end = getVisualActionEndTime(action);
  return Math.max(0.1, end - start);
}

function getActionStyle(action, track = null) {
  const start = getVisualActionStartTime(action);
  const duration = getVisualActionDuration(action);
  const top = timeToY(start);
  const bottom = timeToY(start + duration);
  const height = Math.max(16, bottom - top);

  const node = getCompiledAction(action)?.node || action;
  const rawColor = getActionColor(action, track?.id);
  const isDisabled = !!action?.isDisabled;
  const isAttack = node?.type === 'basicAttack' || toLegacyDisplayType(node?.type) === 'attack';
  // Light chrome: opaque pastel fills so track/grid do not show through.
  const isLight = appearance.value === 'light';
  const color = isLight ? adaptColorForLightSurface(rawColor) : rawColor;
  const fillAlpha = isAttack ? 0.06 : 0.18;
  const borderAlpha = isAttack ? (isLight ? 1 : 0.45) : isLight ? 1 : 0.9;
  const glowAlpha = isLight ? 0.12 : 0.16;

  const isDragTarget = dragTargetIds.has(action?.instanceId);
  return {
    top: `${top}px`,
    height: `${height}px`,
    borderColor: toRgba(color, borderAlpha),
    backgroundColor: isLight
      ? solidFillForLightTrack(color, isAttack ? 0.7 : 0.48)
      : toRgba(color, fillAlpha),
    boxShadow:
      isDisabled || isAttack
        ? isLight
          ? '0 0 0 1px rgba(26, 27, 30, 0.22)'
          : 'none'
        : isLight
          ? `0 0 0 1px rgba(26, 27, 30, 0.22), 0 0 8px ${toRgba(color, glowAlpha)}`
          : `0 0 8px ${toRgba(color, glowAlpha)}`,
    opacity: isDisabled ? 0.45 : 1,
    transform: isDragTarget ? `translateY(${dragPreviewOffsetPx.value}px)` : undefined,
    willChange: isDragTarget ? 'transform' : undefined,
    zIndex: isDragTarget ? 8 : 4,
  };
}

function getVisibleActions(track) {
  const list = Array.isArray(track?.actions) ? track.actions : [];
  return list.filter(action => {
    if (!action) return false;

    if (!showAllAttackSegments.value && action.kind === 'attack_segment') {
      const total = Number(action.attackSequenceTotal) || 0;
      const idx = Number(action.attackSequenceIndex) || 0;
      if (total > 0 && idx > 0) return idx === total;
    }

    return true;
  });
}

watch(
  [
    showAllAttackSegments,
    showAnomalies,
    showDurationBars,
    showFreezeEffects,
    showStaggerBreaks,
    showOperationHints,
  ],
  ([attackSegments, anomalies, durationBars, freezeEffects, staggerBreaks, operationHints]) => {
    try {
      localStorage.setItem(
        MOBILE_TIMELINE_PREFS_KEY,
        JSON.stringify({
          showAllAttackSegments: attackSegments,
          showAnomalies: anomalies,
          showDurationBars: durationBars,
          showFreezeEffects: freezeEffects,
          showStaggerBreaks: staggerBreaks,
          showOperationHints: operationHints,
        }),
      );
    } catch {
      // Ignore storage failures in private mode and restricted WebViews.
    }
  },
);

function buildActionCombatEntry(track, action) {
  const node = getCompiledAction(action)?.node || action;
  const badges = collectActionCombatBadges({
    action: node,
    trackId: track?.id || null,
    startTime: getVisualActionStartTime(action),
    endTime: getVisualActionEndTime(action),
    viz: store.enemyAfflictionViz,
    iconDatabase: store.iconDatabase,
  });
  const hiddenBadges = badges.length > 4 ? badges.slice(3) : [];
  const displayedBadges = hiddenBadges.length ? badges.slice(0, 3) : badges;
  const hasMultipleBadges = displayedBadges.length + Number(Boolean(hiddenBadges.length)) > 1;
  const durationBars = badges
    .filter(badge => !badge.isMarker && badge.duration > 0)
    .map((badge, index) => ({
      ...badge,
      lane: index,
      color: typeof store.getColor === 'function' ? store.getColor(badge.key) : '#aaaaaa',
    }));
  const skillCooldown = skillCooldownBySourceActionId.value.get(action?.instanceId);
  if (skillCooldown) {
    durationBars.push({
      id: `skill-cooldown-${action.instanceId}`,
      key: 'skillCooldown',
      startTime: skillCooldown.startTime,
      endTime: skillCooldown.expiresAt,
      duration: skillCooldown.expiresAt - skillCooldown.startTime,
      lane: durationBars.length,
      color: SKILL_COOLDOWN_COLOR,
    });
  }

  return {
    action,
    badges,
    displayedBadges,
    hiddenBadges,
    hasMultipleBadges,
    freezeRegion: getActionFreezeRegion(action),
    durationBars,
  };
}

const skillCooldownBySourceActionId = computed(() => {
  const result = new Map();
  for (const entry of Array.isArray(store.simLog) ? store.simLog : []) {
    if (entry?.type !== 'SKILL_COOLDOWN_APPLY') continue;
    const actionId = String(entry.payload?.sourceActionId || '').trim();
    const startTime = Number(entry.time);
    const expiresAt = Number(entry.payload?.expiresAt);
    if (!actionId || !Number.isFinite(startTime) || !Number.isFinite(expiresAt)) continue;
    if (expiresAt <= startTime) continue;
    result.set(actionId, { startTime, expiresAt });
  }
  return result;
});

/** Memoized per-track action entries so scroll/render does not rebuild combat badges. */
const visibleActionEntriesByTrackId = computed(() => {
  void store.enemyAfflictionViz;
  void store.iconDatabase;
  void store.compiledTimeline;
  void store.simLogRevision;
  void store.viewDuration;
  void store.prepDuration;
  void store.timeBlockWidth;

  const out = Object.create(null);
  for (const track of tracks.value) {
    const trackId = track?.id;
    if (!trackId) continue;
    out[trackId] = getVisibleActions(track).map(action => buildActionCombatEntry(track, action));
  }
  return out;
});

function getCombatIconTitle(typeKey) {
  void locale.value;
  for (const candidate of getDisplayKeyCandidates(typeKey)) {
    const localeKey = `effects.name.${candidate}`;
    const out = t(localeKey);
    if (out !== localeKey) return out;
  }
  return String(typeKey || '');
}

function getCombatIconOverflowTitle(badges) {
  return badges.map(badge => getCombatIconTitle(badge.key)).join('、');
}

function getDurationBarStyle(bar, action = null) {
  const top = Math.round(timeToY(bar.startTime));
  const bottom = Math.round(timeToY(bar.endTime ?? bar.startTime + bar.duration));
  const height = Math.max(10, bottom - top);
  const lane = Number(bar.lane) || 0;
  return {
    top: `${top}px`,
    height: `${height}px`,
    right: `${2 + lane * 10}px`,
    color: bar.color || '#aaaaaa',
    transform: dragTargetIds.has(action?.instanceId)
      ? `translateY(${dragPreviewOffsetPx.value}px)`
      : undefined,
    willChange: dragTargetIds.has(action?.instanceId) ? 'transform' : undefined,
  };
}

function formatBadgeDuration(duration) {
  if (typeof store.formatTimeLabel === 'function') {
    return store.formatTimeLabel(duration);
  }
  return `${formatSec(duration)}s`;
}

function openActionInfo(instanceId) {
  const id = String(instanceId || '').trim();
  if (!id) return;
  selectedDamageHit.value = null;
  skillDamageOpen.value = false;
  effectDamageOpen.value = false;
  selectedActionId.value = id;
  actionInfoOpen.value = true;
}

const selectedSourceAction = computed(() => {
  const id = String(selectedActionId.value || '').trim();
  if (!id) return null;
  for (const track of tracks.value) {
    const action = (Array.isArray(track?.actions) ? track.actions : []).find(
      item => item?.instanceId === id,
    );
    if (action) return action;
  }
  return null;
});

function toggleSelectedActionDisabled() {
  const id = String(selectedActionId.value || '').trim();
  const action = selectedSourceAction.value;
  if (!id || !action) return;
  store.updateAction(id, { isDisabled: !action.isDisabled });
}

function removeSelectedAction() {
  const id = String(selectedActionId.value || '').trim();
  if (!id || !selectedSourceAction.value) return;

  const attackGroupId = selectedSourceAction.value?.attackGroupInstanceId;
  const groupedIds = attackGroupId
    ? tracks.value
        .flatMap(track => (Array.isArray(track?.actions) ? track.actions : []))
        .filter(action => action?.attackGroupInstanceId === attackGroupId)
        .map(action => action.instanceId)
        .filter(Boolean)
    : [];
  if (groupedIds.length > 1) {
    store.setMultiSelection(groupedIds);
  } else {
    store.clearSelection();
    store.selectAction(id);
  }
  store.removeCurrentSelection();
  actionInfoOpen.value = false;
  selectedActionId.value = null;
}

const resolvedAction = computed(() => {
  const id = String(selectedActionId.value || '').trim();
  if (!id) return null;

  const timeline = store.compiledTimeline;
  const map = timeline?.actionMap;
  if (!map || typeof map.get !== 'function') return null;
  return map.get(id) || null;
});

const resolvedActionEndTime = computed(() => {
  if (!resolvedAction.value) return null;
  const storeEnd =
    typeof store.getActionVisualEndTime === 'function'
      ? store.getActionVisualEndTime(resolvedAction.value.id)
      : null;
  const normalizedStoreEnd = Number(storeEnd);
  if (Number.isFinite(normalizedStoreEnd)) return normalizedStoreEnd;

  return (
    (Number(resolvedAction.value.realStartTime) || 0) +
    (Number(resolvedAction.value.realDuration) || 0)
  );
});

const resolvedActionDuration = computed(() => {
  if (!resolvedAction.value || resolvedActionEndTime.value == null) return null;
  const start = Number(resolvedAction.value.realStartTime) || 0;
  return Math.max(0, Number(resolvedActionEndTime.value) - start);
});

const resolvedOperator = computed(() => {
  void locale.value;
  const id = resolvedAction.value?.trackId;
  if (!id) return null;
  const roster = Array.isArray(store.characterRoster) ? store.characterRoster : [];
  const found = roster.find(c => c && c.id === id);
  return {
    id,
    name: getOperatorGameName(id, locale.value) || found?.name || id,
    avatar: found?.avatar || DEFAULT_ICON,
  };
});

const resolvedActionNode = computed(() => resolvedAction.value?.node || null);

function getHitDisplayDamage(hitData) {
  return (
    Number(
      store.getHitDisplayDamage?.(hitData) ??
        hitData?._expectedDamage ??
        hitData?._damageBreakdown?.expectedDamage ??
        0,
    ) || 0
  );
}

function formatDamage(value) {
  return Math.floor(Number(value) || 0).toLocaleString();
}

function getEffectDamageSourceLabel(entry) {
  const hit = entry?.payload?.hitData;
  if (!hit) return '';
  const raw = String(hit.triggeredBy || hit._reactionMeta?.reactionType || hit.id || '').trim();
  const cleaned = raw.replace(/^(dot:|reaction:|triggered:)/, '');
  return cleaned ? translateBattleLogStatus(t, te, cleaned) || cleaned : '';
}

const selectedActionDamageHits = computed(() => {
  const actionId = String(selectedActionId.value || '').trim();
  if (!actionId || !resolvedAction.value) return [];

  const actionStart = Number(resolvedAction.value.realStartTime) || 0;
  return (Array.isArray(store.simLog) ? store.simLog : [])
    .filter(
      entry => entry?.type === 'DAMAGE_HIT' && String(entry?.payload?.actionId || '') === actionId,
    )
    .map(entry => ({
      hitData: entry.payload?.hitData || null,
      time: Number(entry.time) || 0,
      isEffectDamage: isEffectOriginDamage(entry),
      effectLabel: getEffectDamageSourceLabel(entry),
    }))
    .filter(entry => entry.hitData && !entry.hitData._noDamage)
    .map((entry, index) => ({
      ...entry,
      key: `${actionId}-${index}-${entry.time}`,
      index: index + 1,
      offset: Math.max(0, entry.time - actionStart),
      damage: getHitDisplayDamage(entry.hitData),
      hasDetail: !!entry.hitData?._damageBreakdown,
    }));
});

const selectedSkillDamageHits = computed(() =>
  selectedActionDamageHits.value
    .filter(hit => !hit.isEffectDamage)
    .map((hit, index) => ({ ...hit, displayIndex: index + 1 })),
);

const selectedEffectDamageHits = computed(() =>
  selectedActionDamageHits.value
    .filter(hit => hit.isEffectDamage)
    .map((hit, index) => ({ ...hit, displayIndex: index + 1 })),
);

function sumDamageHits(hits) {
  return hits.reduce((total, hit) => total + hit.damage, 0);
}

const selectedActionTotalDamage = computed(() => sumDamageHits(selectedActionDamageHits.value));

const selectedSkillDamageTotal = computed(() => sumDamageHits(selectedSkillDamageHits.value));
const selectedEffectDamageTotal = computed(() => sumDamageHits(selectedEffectDamageHits.value));

function openDamageHitDetail(hit) {
  if (!hit?.hasDetail) return;
  selectedDamageHit.value = hit.hitData;
}

function closeDamageHitDetail() {
  selectedDamageHit.value = null;
}

const resolvedActionStats = computed(() => {
  const node = resolvedActionNode.value;
  if (!node) return [];

  const rows = [];
  const spCost = Number(node.spCost);
  if (Number.isFinite(spCost)) {
    rows.push({ key: 'sp', label: t('timeline.mobile.actionInfo.spCost'), value: String(spCost) });
  }
  const cooldown = Number(node.cooldown);
  if (Number.isFinite(cooldown) && cooldown > 0) {
    rows.push({
      key: 'cd',
      label: t('timeline.mobile.actionInfo.cooldown'),
      value: `${formatSec(cooldown)}s`,
    });
  }
  const gaugeCost = Number(node.gaugeCost);
  if (Number.isFinite(gaugeCost) && gaugeCost > 0) {
    rows.push({
      key: 'gauge',
      label: t('timeline.mobile.actionInfo.gaugeCost'),
      value: String(gaugeCost),
    });
  }
  const hits = Array.isArray(node.hits) ? node.hits.length : 0;
  if (hits > 0) {
    rows.push({
      key: 'hits',
      label: t('timeline.mobile.actionInfo.hits'),
      value: String(hits),
    });
  }
  return rows;
});

const resolvedActionCombatIcons = computed(() => {
  const action = resolvedAction.value;
  if (!action) return [];
  return collectActionCombatBadges({
    action: action.node || action,
    trackId: action.trackId || null,
    startTime: Number(action.realStartTime) || 0,
    endTime: Number(resolvedActionEndTime.value) || Number(action.realStartTime) || 0,
    viz: store.enemyAfflictionViz,
    iconDatabase: store.iconDatabase,
  });
});

watch(
  () => store.compiledTimeline,
  () => {
    if (!actionInfoOpen.value) return;
    if (!resolvedAction.value) {
      selectedDamageHit.value = null;
      actionInfoOpen.value = false;
      selectedActionId.value = null;
    }
  },
);

const gridStyle = computed(() => {
  const secPx = pxPerSecond.value;
  return {
    height: `${timelineHeightPx.value}px`,
    '--sec-px': `${secPx}px`,
    '--grid-offset-y': store.prepExpanded === false ? `${prepHeightPx.value}px` : '0px',
  };
});

function formatMobileResourceValue(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '0';
  return String(Math.round(number * 1000) / 1000);
}

const mobileGuideTop = computed(() => Math.round(timeToY(mobileGuideTime.value)));
const mobileGuidePanelBelow = computed(() => mobileGuideTop.value < 112);
const mobileGuideSpSample = computed(() => {
  const points = Array.isArray(store.spSeries) ? store.spSeries : [];
  if (points.length > 0) return sampleSpSeriesAtTime(points, mobileGuideTime.value);
  return {
    sp: Number(store.systemConstants?.initialSp) || 0,
    refundSp: 0,
  };
});
const mobileGuideSpText = computed(() => {
  const sp = Math.floor(Number(mobileGuideSpSample.value?.sp) || 0);
  const refund = Math.floor(Number(mobileGuideSpSample.value?.refundSp) || 0);
  return refund > 0 ? `${sp} (+${refund})` : String(sp);
});
const mobileGuideGaugeRows = computed(() =>
  tracks.value
    .filter(track => track?.id)
    .map(track => {
      const points = store.gaugeSeriesByTrackId?.get(track.id) || [];
      const point = getStepSampleAtTime(points, mobileGuideTime.value);
      const value = Number(point?.val) || 0;
      const max = Math.max(0, Number(store.getTrackGaugeMax?.(track.id)) || 0);
      return {
        id: track.id,
        name: getTrackName(track),
        value: formatMobileResourceValue(value),
        max: formatMobileResourceValue(max),
        isFull: max > 0 && value >= max - 1e-9,
        color: store.getCharacterElementColor?.(track.id) || 'var(--ea-info)',
      };
    }),
);
const mobileGuideStaggerText = computed(() => {
  const point = getStepSampleAtTime(store.staggerSeries?.points || [], mobileGuideTime.value);
  const value = Math.floor(Number(point?.val) || 0);
  const max = Math.max(0, Number(store.systemConstants?.maxStagger) || 0);
  return max > 0 ? `${value}/${max}` : String(value);
});
const mobileDamageSeries = computed(() => {
  void store.simLogRevision;
  return buildCumulativeDamageSeries(
    (store.simLog || []).filter(entry => entry?.type === 'DAMAGE_HIT'),
    entry => Number(entry.time) || 0,
    entry =>
      Number(
        store.getHitDisplayDamage?.(entry.payload?.hitData) ??
          entry.payload?.hitData?._expectedDamage ??
          0,
      ) || 0,
  );
});
const mobileEnemyEffectTimeline = computed(() =>
  buildEnemyEffectGuideTimeline(store.enemyEffectLayout?.positionedSegments || []),
);
const mobileGuideEnemyEffects = computed(() =>
  sampleEnemyEffectGuideTimeline(mobileEnemyEffectTimeline.value, mobileGuideTime.value, 8),
);

function getMobileGuideEffectIcon(effect) {
  if (effect?.icon) return withBaseUrl(effect.icon);
  for (const candidate of getDisplayKeyCandidates(effect?.typeKey)) {
    if (store.iconDatabase?.[candidate]) return withBaseUrl(store.iconDatabase[candidate]);
  }
  return withBaseUrl(store.iconDatabase?.default || DEFAULT_ICON);
}
const mobileGuideEnemyHpText = computed(() => {
  const max = Math.max(0, Number(store.systemConstants?.enemyHp) || 0);
  if (max <= 0) return '';
  const point = getStepSampleAtTime(mobileDamageSeries.value, mobileGuideTime.value);
  const current = Math.max(0, Math.floor(max - (Number(point?.total) || 0)));
  return `${current.toLocaleString()} / ${Math.floor(max).toLocaleString()}`;
});

const activeMobileFreezeRegion = computed(() => {
  const sourceId = draggingActionId.value || (actionInfoOpen.value ? selectedActionId.value : null);
  return sourceId ? freezeRegionBySourceId.value.get(sourceId) || null : null;
});

const activeMobileFreezeStyle = computed(() => {
  const region = activeMobileFreezeRegion.value;
  if (!region) return null;
  const start = Number(region.time) || 0;
  const amount = Math.max(0, Number(region.amount) || 0);
  const previewOffset = draggingActionId.value === region.sourceId ? dragPreviewOffsetPx.value : 0;
  return {
    top: `${timeToY(start) + previewOffset}px`,
    height: `${Math.max(2, timeToY(start + amount) - timeToY(start))}px`,
  };
});

const timeTicks = computed(() => {
  const duration = viewDuration.value;
  const step = 1;
  if (!Number.isFinite(duration) || duration <= 0) return [];

  const ticks = [];
  const max = Math.floor(duration);
  const prep = prepDuration.value;
  for (let v = 0; v <= max; v += step) {
    if (store.prepExpanded === false && v < prep) continue;
    const isBattleStart = prep > 0 && Math.abs(v - prep) < 0.0001;
    const isMajor = isBattleStart || v % 5 === 0;
    ticks.push({ v, y: Math.round(timeToY(v)), isBattleStart, isMajor });
  }
  if (prep > 0) {
    ticks.push({ v: prep, y: Math.round(timeToY(prep)), isBattleStart: true, isMajor: true });
  }

  const byY = new Map();
  for (const item of ticks) {
    const k = item.y;
    const prev = byY.get(k);
    if (!prev || item.isBattleStart || item.isMajor) byY.set(k, item);
  }

  return Array.from(byY.values()).sort((a, b) => a.y - b.y);
});

const PERFECT_LINK_STATUS_IDS = new Set(['rossi-combo-perfect-timing-satisfied']);

function isPerfectLinkAction(action) {
  if (!action || toLegacyDisplayType(action.type) !== 'link') return false;
  const id = action.instanceId;
  if (!id) return false;
  return (store.operatorLog || []).some(
    entry =>
      entry?.type === 'OPERATOR_EFFECT_APPLY' &&
      entry?.actionId === id &&
      PERFECT_LINK_STATUS_IDS.has(entry?.id),
  );
}

const operationHintsRaw = computed(() => {
  const out = [];
  const safeTracks = tracks.value;

  safeTracks.forEach((track, index) => {
    if (!track?.id) return;
    const keyNum = index + 1;

    const actions = Array.isArray(track.actions) ? track.actions : [];
    for (const action of actions) {
      if (!action) continue;
      if ((action.triggerWindow || 0) < 0) continue;

      const displayType = toLegacyDisplayType(action.type);
      let label = '';
      let isHold = false;
      let customClass = '';

      if (displayType === 'skill') {
        label = `${keyNum}`;
        customClass = 'op-skill';
      } else if (displayType === 'link') {
        label = 'E';
        customClass = 'op-link';
      } else if (displayType === 'ultimate') {
        label = `${keyNum}H`;
        isHold = true;
        customClass = 'op-ultimate';
      } else {
        continue;
      }

      const y = Math.round(timeToY(action.startTime || 0));
      out.push({
        id: `op-${action.instanceId}`,
        y,
        label,
        isHold,
        customClass,
        perfectLink: isPerfectLinkAction(action),
      });
    }

    const switchEvents = Array.isArray(store.switchEvents) ? store.switchEvents : [];
    for (const sw of switchEvents) {
      if (!sw || sw.characterId !== track.id) continue;
      const y = Math.round(timeToY(sw.time));
      out.push({
        id: `op-sw-${sw.id}`,
        y,
        label: `F${keyNum}`,
        isHold: false,
        customClass: 'op-switch',
      });
    }
  });

  out.sort((a, b) => a.y - b.y);
  return out;
});

const operationLayout = computed(() => {
  const raw = Array.isArray(operationHintsRaw.value) ? operationHintsRaw.value : [];

  const CAP_H = 14;
  const GAP_Y = 2;

  const laneBottom = [];
  const placed = [];

  for (const m of raw) {
    const top = m.y - CAP_H / 2;
    let lane = -1;

    for (let i = 0; i < laneBottom.length; i++) {
      if (top >= laneBottom[i] + GAP_Y) {
        lane = i;
        break;
      }
    }

    if (lane < 0) {
      lane = laneBottom.length;
      laneBottom.push(-Infinity);
    }

    laneBottom[lane] = m.y + CAP_H / 2;
    placed.push({ ...m, lane });
  }

  const laneCount = Math.max(1, laneBottom.length);
  const laneCountClamped = Math.min(4, laneCount);

  const CAP_GAP = 2;
  const MAX_OP_W = 46;
  const MIN_CAP_W = 10;
  const minOpW = 2 + laneCountClamped * MIN_CAP_W + (laneCountClamped - 1) * CAP_GAP;
  const opW = Math.min(MAX_OP_W, Math.max(24, minOpW));
  const capW = Math.max(
    8,
    Math.floor((opW - 2 - (laneCountClamped - 1) * CAP_GAP) / laneCountClamped),
  );
  const capFs = capW <= 10 ? 8 : 9;

  const items = placed
    .filter(m => m.lane < laneCountClamped)
    .map(m => ({ ...m, lane: Math.min(m.lane, laneCountClamped - 1) }));

  return {
    items,
    vars: {
      '--opw': `${opW}px`,
      '--capw': `${capW}px`,
      '--capfs': `${capFs}px`,
      '--capgap': `${CAP_GAP}px`,
    },
  };
});

const mobileTimeRailStyle = computed(() =>
  showOperationHints.value
    ? operationLayout.value.vars
    : {
        '--opw': '0px',
        '--capw': '0px',
        '--capfs': '0px',
        '--capgap': '0px',
      },
);

const mobileStaggerBreakZones = computed(() => {
  const duration = Math.max(0, viewDuration.value);
  const segments = Array.isArray(store.staggerSeries?.lockSegments)
    ? store.staggerSeries.lockSegments
    : [];

  return segments.flatMap((segment, index) => {
    const start = Math.max(0, Math.min(duration, Number(segment?.start) || 0));
    const end = Math.max(start, Math.min(duration, Number(segment?.end) || 0));
    if (end <= start) return [];

    const top = Math.round(timeToY(start));
    const bottom = Math.round(timeToY(end));
    return [
      {
        id: `stagger-break-${index}-${start}-${end}`,
        top,
        height: Math.max(2, bottom - top),
      },
    ];
  });
});

watch(
  () => store.activeScenarioId,
  nextId => {
    finishScenarioRename();
    cancelPlacement();
    skillLibraryOpen.value = false;
    selectedScenarioId.value = nextId;
  },
  { flush: 'sync' },
);

watch(
  () => store.prepDuration,
  value => {
    prepDurationDraft.value = Number(value) || 0;
  },
);

watch(
  () => store.battleDuration,
  value => {
    battleDurationDraft.value = Number(value) || 0;
  },
);

async function doImport() {
  const code = String(shareCode.value || '').trim();
  if (!code) {
    ElMessage.warning(t('timeline.share.inputRequired'));
    return;
  }

  try {
    cancelPlacement();
    importing.value = true;
    const ok = await store.importShareString(code);
    if (!ok) {
      ElMessage.error(t('timeline.share.importFailed'));
      return;
    }

    ElMessage.success(t('timeline.share.imported'));
    importVisible.value = false;
  } catch (e) {
    ElMessage.error(t('timeline.share.importFailed'));
  } finally {
    importing.value = false;
  }
}
</script>

<template>
  <div class="mobile-viewer-root">
    <div class="mobile-topbar">
      <div class="mobile-topbar-actions">
        <div class="mobile-scenario-tools">
          <button
            type="button"
            class="ea-btn ea-btn--icon ea-btn--icon-24 ea-btn--ghost ea-btn--no-shrink mobile-scenario-tool"
            :disabled="scenarioSwitching"
            :title="t('timeline.scenario.renameTooltip')"
            :aria-label="t('timeline.scenario.renameTooltip')"
            @click="startScenarioRename"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
              <path
                d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
              />
            </svg>
          </button>
          <button
            type="button"
            class="ea-btn ea-btn--icon ea-btn--icon-24 ea-btn--ghost ea-btn--no-shrink mobile-scenario-tool"
            :disabled="scenarioSwitching"
            :title="t('timeline.scenario.duplicateTooltip')"
            :aria-label="t('timeline.scenario.duplicateTooltip')"
            @click="handleDuplicateScenario"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
          <button
            v-if="scenarioList.length > 1"
            type="button"
            class="ea-btn ea-btn--icon ea-btn--icon-24 ea-btn--ghost ea-btn--hover-danger ea-btn--no-shrink mobile-scenario-tool"
            :disabled="scenarioSwitching"
            :title="t('timeline.scenario.deleteTooltip')"
            :aria-label="t('timeline.scenario.deleteTooltip')"
            @click="handleDeleteScenario"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <polyline points="3 6 5 6 21 6" />
              <path
                d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
              />
            </svg>
          </button>
          <button
            v-if="scenarioList.length < store.MAX_SCENARIOS"
            type="button"
            class="ea-btn ea-btn--icon ea-btn--icon-24 ea-btn--ghost ea-btn--no-shrink mobile-scenario-tool"
            :disabled="scenarioSwitching"
            :title="t('timeline.scenario.addTooltip')"
            :aria-label="t('timeline.scenario.addTooltip')"
            @click="handleAddScenario"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>

        <div class="mobile-topbar-secondary">
          <input
            v-if="scenarioRenameActive && currentScenario"
            ref="scenarioRenameInputRef"
            v-model="currentScenario.name"
            class="mobile-scenario-input"
            :aria-label="t('timeline.scenario.renameTooltip')"
            @blur="finishScenarioRename"
            @keydown.enter="finishScenarioRename"
            @keydown.esc="finishScenarioRename"
          />
          <el-select
            v-else
            :model-value="selectedScenarioId"
            :disabled="scenarioSwitching"
            size="small"
            :class="['mobile-scenario-select', { 'is-switching': scenarioSwitching }]"
            :teleported="true"
            popper-class="mobile-scenario-popper"
            @change="handleScenarioChange"
          >
            <el-option
              v-for="(sc, idx) in scenarioList"
              :key="sc.id"
              :label="sc?.name || t('timeline.scenario.defaultName', { index: idx + 1 })"
              :value="sc.id"
            />
          </el-select>

          <el-popover
            v-model:visible="moreMenuOpen"
            trigger="click"
            placement="bottom-end"
            :teleported="true"
            :width="260"
            :show-arrow="true"
            popper-class="mobile-more-popper"
          >
            <template #reference>
              <button
                type="button"
                class="ea-btn ea-btn--sm ea-btn--lift mobile-more-trigger"
                :class="{ 'is-active': moreMenuOpen }"
                :title="t('timeline.mobile.more')"
                :aria-label="t('timeline.mobile.more')"
                :aria-expanded="moreMenuOpen"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="5" r="1.6"></circle>
                  <circle cx="12" cy="12" r="1.6"></circle>
                  <circle cx="12" cy="19" r="1.6"></circle>
                </svg>
              </button>
            </template>

            <div class="mobile-more-panel">
              <section class="mobile-more-section">
                <h4 class="mobile-more-section__title">{{ t('common.language') }}</h4>
                <div class="mobile-locale" :aria-label="t('common.language')">
                  <button
                    type="button"
                    class="ea-btn ea-btn--sm ea-btn--lift mobile-locale__btn"
                    :class="{ 'is-active': locale === 'zh-CN' }"
                    :aria-pressed="locale === 'zh-CN'"
                    @click="changeLocale('zh-CN')"
                  >
                    {{ t('locale.zhCN') }}
                  </button>
                  <button
                    type="button"
                    class="ea-btn ea-btn--sm ea-btn--lift mobile-locale__btn"
                    :class="{ 'is-active': locale === 'en' }"
                    :aria-pressed="locale === 'en'"
                    @click="changeLocale('en')"
                  >
                    {{ t('locale.en') }}
                  </button>
                </div>

                <div class="mobile-appearance-row">
                  <span class="mobile-appearance-row__label">{{ t('common.appearance') }}</span>
                  <div
                    class="mobile-appearance-row__btns"
                    role="group"
                    :aria-label="t('common.appearance')"
                  >
                    <button
                      type="button"
                      class="ea-btn ea-btn--sm ea-btn--lift mobile-appearance-btn"
                      :class="{ 'is-active': appearance === 'light' }"
                      :title="t('common.appearanceLight')"
                      :aria-label="t('common.appearanceLight')"
                      @click="setAppearance('light')"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="4" />
                        <path
                          d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      class="ea-btn ea-btn--sm ea-btn--lift mobile-appearance-btn"
                      :class="{ 'is-active': appearance === 'dark' }"
                      :title="t('common.appearanceDark')"
                      :aria-label="t('common.appearanceDark')"
                      @click="setAppearance('dark')"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </section>

              <section class="mobile-more-section">
                <h4 class="mobile-more-section__title">
                  {{ t('timeline.mobile.timeSettings.title') }}
                </h4>
                <div class="mobile-time-settings">
                  <label class="mobile-time-setting-row">
                    <span>{{ t('timeline.mobile.timeSettings.prepDuration') }}</span>
                    <span class="mobile-time-setting-row__control">
                      <el-input-number
                        v-model="prepDurationDraft"
                        :min="1 / 60"
                        :step="0.5"
                        :precision="2"
                        controls-position="right"
                        size="small"
                        @change="applyMobilePrepDuration"
                      />
                      <span>{{ t('timeline.mobile.timeSettings.seconds') }}</span>
                    </span>
                  </label>
                  <label class="mobile-time-setting-row">
                    <span>{{ t('timeline.mobile.timeSettings.battleDuration') }}</span>
                    <span class="mobile-time-setting-row__control">
                      <el-input-number
                        v-model="battleDurationDraft"
                        :min="30"
                        :max="600"
                        :step="10"
                        :precision="0"
                        controls-position="right"
                        size="small"
                        @change="applyMobileBattleDuration"
                      />
                      <span>{{ t('timeline.mobile.timeSettings.seconds') }}</span>
                    </span>
                  </label>
                  <button
                    type="button"
                    class="header-more-check-row header-more-check-row--compact mobile-prep-setting"
                    :aria-pressed="store.prepExpanded !== false"
                    @click="toggleMobilePrepExpanded"
                  >
                    <svg
                      viewBox="0 0 16 16"
                      width="12"
                      height="12"
                      fill="none"
                      stroke="color-mix(in srgb, var(--ea-gold) 85%, transparent)"
                      stroke-width="1.5"
                      aria-hidden="true"
                    >
                      <rect x="1" y="1" width="14" height="14" rx="2" />
                      <polyline
                        v-if="store.prepExpanded !== false"
                        points="3,8 6.5,11.5 13,4.5"
                        stroke-width="2"
                      />
                    </svg>
                    <span>{{ t('timeline.mobile.timeSettings.expandPrep') }}</span>
                  </button>
                </div>
              </section>

              <section class="mobile-more-section">
                <h4 class="mobile-more-section__title">
                  {{ t('timeline.mobile.display.title') }}
                </h4>
                <div class="header-more-checklist header-more-checklist--grid">
                  <button
                    type="button"
                    class="header-more-check-row header-more-check-row--compact"
                    :aria-pressed="showAllAttackSegments"
                    @click="showAllAttackSegments = !showAllAttackSegments"
                  >
                    <svg
                      viewBox="0 0 16 16"
                      width="12"
                      height="12"
                      fill="none"
                      stroke="color-mix(in srgb, var(--ea-gold) 85%, transparent)"
                      stroke-width="1.5"
                      aria-hidden="true"
                    >
                      <rect x="1" y="1" width="14" height="14" rx="2" />
                      <polyline
                        v-if="showAllAttackSegments"
                        points="3,8 6.5,11.5 13,4.5"
                        stroke-width="2"
                      />
                    </svg>
                    <span>{{ t('timeline.mobile.display.showAllAttackSegments') }}</span>
                  </button>
                  <button
                    type="button"
                    class="header-more-check-row header-more-check-row--compact"
                    :aria-pressed="showAnomalies"
                    @click="showAnomalies = !showAnomalies"
                  >
                    <svg
                      viewBox="0 0 16 16"
                      width="12"
                      height="12"
                      fill="none"
                      stroke="color-mix(in srgb, var(--ea-gold) 85%, transparent)"
                      stroke-width="1.5"
                      aria-hidden="true"
                    >
                      <rect x="1" y="1" width="14" height="14" rx="2" />
                      <polyline
                        v-if="showAnomalies"
                        points="3,8 6.5,11.5 13,4.5"
                        stroke-width="2"
                      />
                    </svg>
                    <span>{{ t('timeline.mobile.display.showAnomalies') }}</span>
                  </button>
                  <button
                    type="button"
                    class="header-more-check-row header-more-check-row--compact"
                    :aria-pressed="showDurationBars"
                    @click="showDurationBars = !showDurationBars"
                  >
                    <svg
                      viewBox="0 0 16 16"
                      width="12"
                      height="12"
                      fill="none"
                      stroke="color-mix(in srgb, var(--ea-gold) 85%, transparent)"
                      stroke-width="1.5"
                      aria-hidden="true"
                    >
                      <rect x="1" y="1" width="14" height="14" rx="2" />
                      <polyline
                        v-if="showDurationBars"
                        points="3,8 6.5,11.5 13,4.5"
                        stroke-width="2"
                      />
                    </svg>
                    <span>{{ t('timeline.mobile.display.showDurationBars') }}</span>
                  </button>
                  <button
                    type="button"
                    class="header-more-check-row header-more-check-row--compact"
                    :aria-pressed="showFreezeEffects"
                    @click="showFreezeEffects = !showFreezeEffects"
                  >
                    <svg
                      viewBox="0 0 16 16"
                      width="12"
                      height="12"
                      fill="none"
                      stroke="color-mix(in srgb, var(--ea-gold) 85%, transparent)"
                      stroke-width="1.5"
                      aria-hidden="true"
                    >
                      <rect x="1" y="1" width="14" height="14" rx="2" />
                      <polyline
                        v-if="showFreezeEffects"
                        points="3,8 6.5,11.5 13,4.5"
                        stroke-width="2"
                      />
                    </svg>
                    <span>{{ t('timeline.mobile.display.showFreezeEffects') }}</span>
                  </button>
                  <button
                    type="button"
                    class="header-more-check-row header-more-check-row--compact"
                    :aria-pressed="showStaggerBreaks"
                    @click="showStaggerBreaks = !showStaggerBreaks"
                  >
                    <svg
                      viewBox="0 0 16 16"
                      width="12"
                      height="12"
                      fill="none"
                      stroke="color-mix(in srgb, var(--ea-gold) 85%, transparent)"
                      stroke-width="1.5"
                      aria-hidden="true"
                    >
                      <rect x="1" y="1" width="14" height="14" rx="2" />
                      <polyline
                        v-if="showStaggerBreaks"
                        points="3,8 6.5,11.5 13,4.5"
                        stroke-width="2"
                      />
                    </svg>
                    <span>{{ t('timeline.mobile.display.showStaggerBreaks') }}</span>
                  </button>
                  <button
                    type="button"
                    class="header-more-check-row header-more-check-row--compact"
                    :aria-pressed="showOperationHints"
                    @click="showOperationHints = !showOperationHints"
                  >
                    <svg
                      viewBox="0 0 16 16"
                      width="12"
                      height="12"
                      fill="none"
                      stroke="color-mix(in srgb, var(--ea-gold) 85%, transparent)"
                      stroke-width="1.5"
                      aria-hidden="true"
                    >
                      <rect x="1" y="1" width="14" height="14" rx="2" />
                      <polyline
                        v-if="showOperationHints"
                        points="3,8 6.5,11.5 13,4.5"
                        stroke-width="2"
                      />
                    </svg>
                    <span>{{ t('timeline.mobile.display.showOperationHints') }}</span>
                  </button>
                </div>
              </section>

              <section class="mobile-more-section">
                <div class="mobile-project-actions">
                  <button
                    type="button"
                    class="ea-btn ea-btn--sm ea-btn--lift ea-btn--hover-blue mobile-project-action"
                    @click="openImportDialog"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="9 11 12 14 22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                    <span>{{ t('timeline.mobile.import') }}</span>
                  </button>
                  <button
                    type="button"
                    class="ea-btn ea-btn--sm ea-btn--lift ea-btn--hover-danger-dark mobile-project-action"
                    @click="handleReset"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path
                        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                      />
                    </svg>
                    <span>{{ t('common.reset') }}</span>
                  </button>
                </div>
              </section>
            </div>
          </el-popover>
        </div>
      </div>
    </div>

    <div class="mobile-editbar">
      <button type="button" class="mobile-editbar__library" @click="openSkillLibrary()">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            d="M4 5h16M4 12h16M4 19h10"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
        <span>
          {{
            activeMobileTrack?.id
              ? `${getTrackName(activeMobileTrack)} · ${t('timeline.mobile.skillLibrary.title')}`
              : t('timeline.mobile.skillLibrary.selectTrack')
          }}
        </span>
      </button>
      <button
        type="button"
        class="mobile-editbar__enemy"
        :title="t('resourceMonitor.enemy.dialogTitle')"
        :aria-label="t('resourceMonitor.enemy.dialogTitle')"
        @click="openEnemySelector"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2" />
          <path
            d="M12 2v4M12 18v4M2 12h4M18 12h4"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
        <span>{{ activeEnemyDisplayName }}</span>
      </button>
      <button
        type="button"
        class="mobile-editbar__icon mobile-editbar__icon--undo"
        :class="{ 'is-history-feedback': historyFeedback === 'undo' }"
        :disabled="!store.canUndo"
        :title="t('timeline.mobile.undo')"
        :aria-label="t('timeline.mobile.undo')"
        @click="handleUndo"
      >
        <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
          <path
            d="M9 7l-5 5 5 5M5 12h8a6 6 0 0 1 6 6"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <button
        type="button"
        class="mobile-editbar__icon mobile-editbar__icon--redo"
        :class="{ 'is-history-feedback': historyFeedback === 'redo' }"
        :disabled="!store.canRedo"
        :title="t('timeline.mobile.redo')"
        :aria-label="t('timeline.mobile.redo')"
        @click="handleRedo"
      >
        <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
          <path
            d="M15 7l5 5-5 5M19 12h-8a6 6 0 0 0-6 6"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>

    <div v-if="pendingPlacementSkill" class="mobile-placement-banner">
      <div>
        <strong>{{ pendingPlacementSkill.name }}</strong>
        <span>{{ t('timeline.mobile.skillLibrary.placeHint') }}</span>
      </div>
      <button type="button" @click="cancelPlacement">
        {{ t('common.cancel') }}
      </button>
    </div>

    <div ref="mobileScrollRef" class="mobile-scroll">
      <div class="mobile-tracks-header">
        <div class="mobile-time-head">{{ t('timeline.mobile.time') }}</div>
        <div v-for="(track, idx) in tracks" :key="idx" class="mobile-track-head">
          <button
            type="button"
            class="mobile-avatar mobile-avatar-btn"
            :aria-label="t('timeline.mobile.loadout.openAria', { name: getTrackName(track) })"
            @click.stop="openLoadout(idx)"
          >
            <img
              :src="withBaseUrl(getTrackAvatar(track))"
              :alt="getTrackName(track)"
              @error="onAssetError"
            />
          </button>
        </div>
      </div>

      <div class="mobile-timeline-wrap" :style="gridStyle">
        <div
          class="mobile-time-rail"
          :style="mobileTimeRailStyle"
          @pointerdown.prevent="beginMobileGuide"
          @pointermove.prevent="moveMobileGuide"
          @pointerup.prevent="finishMobileGuide"
          @pointercancel="finishMobileGuide"
        >
          <div
            v-if="prepDuration > 0"
            class="mobile-prep-zone mobile-prep-zone--rail"
            :class="{ 'is-collapsed': store.prepExpanded === false }"
            :style="{ height: `${prepHeightPx}px` }"
          ></div>
          <div
            v-if="prepDuration > 0"
            class="mobile-battle-start-line"
            :style="{ top: `${battleStartYPx}px` }"
          ></div>
          <div v-if="showStaggerBreaks" class="mobile-stagger-break-layer" aria-hidden="true">
            <div
              v-for="zone in mobileStaggerBreakZones"
              :key="zone.id"
              class="mobile-stagger-break-zone"
              :style="{ top: `${zone.top}px`, height: `${zone.height}px` }"
            ></div>
          </div>
          <div v-if="showOperationHints" class="mobile-op-layer">
            <div
              v-for="op in operationLayout.items"
              :key="op.id"
              class="mobile-key-cap"
              :class="[op.customClass, { 'is-hold': op.isHold, 'is-perfect-link': op.perfectLink }]"
              :style="{ top: `${op.y}px`, '--lane': op.lane }"
            >
              <span class="key-text">{{ op.label }}</span>
            </div>
          </div>
          <div class="mobile-time-ticks">
            <div
              v-for="tick in timeTicks"
              :key="`${tick.v}-${Math.round(tick.y)}`"
              class="mobile-time-tick"
              :class="{ 'is-battle-start': tick.isBattleStart, 'is-major': tick.isMajor }"
              :style="{ top: `${tick.y}px` }"
            >
              <div class="mobile-time-mark"></div>
              <div class="mobile-time-label">
                {{
                  typeof store.formatAxisTimeLabel === 'function'
                    ? store.formatAxisTimeLabel(tick.v)
                    : `${tick.v}s`
                }}
              </div>
            </div>
          </div>
        </div>

        <div ref="mobileTimelineRef" class="mobile-timeline">
          <div
            v-if="prepDuration > 0"
            class="mobile-prep-zone mobile-prep-zone--grid"
            :class="{ 'is-collapsed': store.prepExpanded === false }"
            :style="{ height: `${prepHeightPx}px` }"
          >
            <button
              type="button"
              class="mobile-prep-center-label"
              :title="
                store.prepExpanded === false
                  ? t('timelineGrid.prep.expand')
                  : t('timelineGrid.prep.collapseTitle')
              "
              :aria-label="
                store.prepExpanded === false
                  ? t('timelineGrid.prep.expand')
                  : t('timelineGrid.prep.collapseTitle')
              "
              :aria-expanded="store.prepExpanded !== false"
              @pointerdown.stop
              @pointerup.stop
              @click.stop="toggleMobilePrepExpanded"
            >
              <span>{{ t('timelineGrid.prep.title') }}</span>
              <span
                class="mobile-prep-title-icon"
                :class="{ 'is-collapsed': store.prepExpanded === false }"
                aria-hidden="true"
              >
                <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
                  <path
                    d="M3 10l5-5 5 5"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
            </button>
          </div>
          <div
            v-if="prepDuration > 0"
            class="mobile-battle-start-line mobile-battle-start-line--grid"
            :style="{ top: `${battleStartYPx}px` }"
          ></div>

          <div v-if="showFreezeEffects && activeMobileFreezeRegion" class="mobile-freeze-layer">
            <div class="mobile-freeze-region" :style="activeMobileFreezeStyle">
              <span>{{ store.formatTimeLabel(activeMobileFreezeRegion.amount) }}</span>
            </div>
          </div>

          <div
            v-for="(track, idx) in tracks"
            :key="idx"
            class="mobile-track-col"
            :class="{
              'is-placement-target': pendingPlacementSkill && idx === placementTrackIndex,
              'is-placement-muted': pendingPlacementSkill && idx !== placementTrackIndex,
            }"
            @pointerdown="handleTrackPointerDown($event, idx)"
            @pointerup="handleTrackPointerUp($event, idx)"
            @pointercancel="handleTrackPointerCancel"
          >
            <div class="mobile-actions-layer">
              <template
                v-for="entry in visibleActionEntriesByTrackId[track.id] || []"
                :key="entry.action.instanceId"
              >
                <div
                  v-for="bar in entry.durationBars"
                  v-show="showDurationBars"
                  :key="`dur_${entry.action.instanceId}_${bar.id}`"
                  class="mobile-cd-ibar"
                  :style="getDurationBarStyle(bar, entry.action)"
                  :title="`${getCombatIconTitle(bar.key)} · ${formatBadgeDuration(bar.duration)}`"
                >
                  <div class="mobile-cd-ibar__start"></div>
                  <div class="mobile-cd-ibar__line"></div>
                  <div class="mobile-cd-ibar__end"></div>
                  <span class="mobile-cd-ibar__text">{{ formatBadgeDuration(bar.duration) }}</span>
                </div>

                <div
                  class="mobile-action-block"
                  :style="getActionStyle(entry.action, track)"
                  :class="{
                    'is-info-target':
                      actionInfoOpen && selectedActionId === entry.action.instanceId,
                    'is-dragging': draggingActionId === entry.action.instanceId,
                    'is-drag-group': draggingActionId && dragTargetIds.has(entry.action.instanceId),
                    'has-multiple-badges': showAnomalies && entry.hasMultipleBadges,
                  }"
                  @pointerdown="handleActionPointerDown($event, track, entry.action)"
                  @contextmenu.prevent
                  @click.stop="handleActionClick(entry.action.instanceId)"
                >
                  <div
                    v-if="showFreezeEffects && entry.freezeRegion"
                    class="mobile-action-freeze"
                    :style="getActionFreezeStyle(entry.freezeRegion)"
                    :title="store.formatTimeLabel(entry.freezeRegion.amount)"
                  >
                    <div class="mobile-action-freeze__shimmer"></div>
                  </div>
                  <span class="mobile-action-text">{{ getTypeLabel(entry.action) }}</span>
                  <span
                    v-if="draggingActionId === entry.action.instanceId"
                    class="mobile-action-drag-time mono"
                  >
                    {{ formatAxisLabel(dragPreviewLogicalTime) }}
                  </span>
                  <div
                    v-if="showAnomalies && entry.badges.length"
                    class="mobile-action-icons"
                    :class="{ 'is-multiple': entry.hasMultipleBadges }"
                  >
                    <div
                      v-for="badge in entry.displayedBadges"
                      :key="`${entry.action.instanceId}_${badge.id}`"
                      class="mobile-action-icon-box"
                      :title="getCombatIconTitle(badge.key)"
                    >
                      <img
                        class="mobile-action-icon"
                        :src="withBaseUrl(badge.icon)"
                        :alt="getCombatIconTitle(badge.key)"
                        @error="onAssetError"
                      />
                      <span v-if="badge.stacks > 1" class="mobile-action-stacks">
                        {{ badge.stacks }}
                      </span>
                    </div>
                    <div
                      v-if="entry.hiddenBadges.length"
                      class="mobile-action-icon-more"
                      :title="getCombatIconOverflowTitle(entry.hiddenBadges)"
                    >
                      +{{ entry.hiddenBadges.length }}
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>

        <div
          v-if="mobileGuideVisible"
          class="mobile-resource-guide"
          :style="{ top: `${mobileGuideTop}px` }"
        >
          <div class="mobile-resource-guide__panel" :class="{ 'is-below': mobileGuidePanelBelow }">
            <button
              type="button"
              class="mobile-resource-guide__close"
              :title="t('common.close')"
              :aria-label="t('common.close')"
              @pointerdown.stop.prevent
              @click.stop="mobileGuideVisible = false"
            >
              <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
                <path
                  d="M18 6 6 18M6 6l12 12"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                />
              </svg>
            </button>
            <div class="mobile-resource-guide__summary">
              <span class="is-time">{{ formatAxisLabel(mobileGuideTime) }}</span>
              <span class="is-sp">{{ t('timelineGrid.cursor.sp') }}: {{ mobileGuideSpText }}</span>
              <span class="is-stagger"
                >{{ t('timelineGrid.cursor.stagger') }}: {{ mobileGuideStaggerText }}</span
              >
              <span v-if="mobileGuideEnemyHpText" class="is-hp"
                >HP: {{ mobileGuideEnemyHpText }}</span
              >
            </div>
            <div v-if="mobileGuideGaugeRows.length" class="mobile-resource-guide__gauges">
              <div class="mobile-resource-guide__gauge-title">
                {{ t('timelineGrid.cursor.gauge') }}
              </div>
              <div
                v-for="row in mobileGuideGaugeRows"
                :key="row.id"
                class="mobile-resource-guide__gauge"
                :class="{ 'is-full': row.isFull }"
                :style="{ '--guide-gauge-color': row.color }"
              >
                <span class="mobile-resource-guide__gauge-name">{{ row.name }}</span>
                <span class="mobile-resource-guide__gauge-value"
                  >{{ row.value }}/{{ row.max }}</span
                >
              </div>
            </div>
            <div
              v-if="mobileGuideEnemyEffects.buffs.length || mobileGuideEnemyEffects.overflow"
              class="mobile-resource-guide__effects"
            >
              <el-popover
                v-for="effect in mobileGuideEnemyEffects.buffs"
                :key="effect.typeKey"
                trigger="click"
                placement="top"
                :teleported="true"
                :content="getCombatIconTitle(effect.typeKey)"
              >
                <template #reference>
                  <button
                    type="button"
                    class="mobile-resource-guide__effect"
                    :class="{ 'is-disabled': effect.disabled }"
                    :aria-label="getCombatIconTitle(effect.typeKey)"
                    @pointerdown.stop
                  >
                    <img :src="getMobileGuideEffectIcon(effect)" alt="" @error="onAssetError" />
                    <span>{{ effect.stacks }}</span>
                  </button>
                </template>
              </el-popover>
              <span
                v-if="mobileGuideEnemyEffects.overflow"
                class="mobile-resource-guide__effect-more"
              >
                +{{ mobileGuideEnemyEffects.overflow }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-drawer
      v-model="actionInfoOpen"
      direction="btt"
      size="85%"
      :with-header="false"
      :append-to-body="true"
      :lock-scroll="false"
      :close-on-click-modal="false"
      class="mobile-actioninfo-drawer"
    >
      <div class="m-drawer">
        <div class="m-drawer__header">
          <div class="m-drawer__title">{{ t('timeline.mobile.actionInfo.title') }}</div>
          <button
            type="button"
            class="ea-btn ea-btn--icon ea-btn--icon-38 ea-btn--glass-rect ea-btn--radius-6 m-drawer__close"
            :aria-label="t('common.close')"
            @click="actionInfoOpen = false"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M18 6L6 18M6 6l12 12"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>

        <div class="m-drawer__content">
          <div v-if="resolvedAction" class="tech-style actioninfo-hero">
            <div class="actioninfo-hero__top">
              <div class="actioninfo-hero__avatar">
                <img
                  :src="withBaseUrl(resolvedOperator?.avatar)"
                  :alt="resolvedOperator?.name || ''"
                  @error="onAssetError"
                />
              </div>
              <div class="actioninfo-hero__meta">
                <div class="actioninfo-hero__name">
                  {{
                    resolvedAction?.node?.name || resolvedAction?.node?.id || t('common.unknown')
                  }}
                </div>
                <div class="actioninfo-hero__sub">
                  <span class="mono">{{ resolvedOperator?.name || resolvedAction.trackId }}</span>
                  <span class="dot">·</span>
                  <span class="mono">{{ getTypeLabel(resolvedAction.node) }}</span>
                </div>
              </div>
              <div v-if="resolvedActionCombatIcons.length" class="actioninfo-combat-icons">
                <div
                  v-for="icon in resolvedActionCombatIcons"
                  :key="`info_${icon.id}`"
                  class="actioninfo-combat-item"
                  :title="getCombatIconTitle(icon.key)"
                >
                  <div class="actioninfo-combat-icon-box">
                    <img
                      class="actioninfo-combat-icon"
                      :src="withBaseUrl(icon.icon)"
                      :alt="getCombatIconTitle(icon.key)"
                      @error="onAssetError"
                    />
                    <span class="actioninfo-combat-stacks">{{ icon.stacks }}</span>
                  </div>
                  <div class="actioninfo-combat-meta">
                    <div class="actioninfo-combat-name">{{ getCombatIconTitle(icon.key) }}</div>
                    <div v-if="!icon.isMarker && icon.duration > 0" class="actioninfo-combat-dur">
                      {{ formatBadgeDuration(icon.duration) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="actioninfo-hero__time">
              <div class="time-chip">
                <div class="time-chip__label">{{ t('timeline.mobile.actionInfo.start') }}</div>
                <div class="time-chip__val mono">
                  {{ formatAxisLabel(resolvedAction.realStartTime) }}
                </div>
              </div>
              <div class="time-chip">
                <div class="time-chip__label">{{ t('timeline.mobile.actionInfo.end') }}</div>
                <div class="time-chip__val mono">{{ formatAxisLabel(resolvedActionEndTime) }}</div>
              </div>
              <div class="time-chip">
                <div class="time-chip__label">{{ t('timeline.mobile.actionInfo.duration') }}</div>
                <div class="time-chip__val mono">{{ formatSec(resolvedActionDuration) }}s</div>
              </div>
            </div>
            <div v-if="resolvedActionStats.length" class="actioninfo-stats">
              <div v-for="row in resolvedActionStats" :key="row.key" class="actioninfo-stat">
                <div class="actioninfo-stat__label">{{ row.label }}</div>
                <div class="actioninfo-stat__val mono">{{ row.value }}</div>
              </div>
            </div>
            <section class="actioninfo-damage">
              <div class="actioninfo-damage__summary">
                <span>{{ t('timeline.mobile.actionInfo.totalDamage') }}</span>
                <strong class="mono">{{ formatDamage(selectedActionTotalDamage) }}</strong>
              </div>
              <div v-if="selectedActionDamageHits.length" class="actioninfo-damage__groups">
                <section v-if="selectedSkillDamageHits.length" class="actioninfo-damage__group">
                  <button
                    type="button"
                    class="actioninfo-damage__group-toggle"
                    :aria-expanded="skillDamageOpen"
                    @click="skillDamageOpen = !skillDamageOpen"
                  >
                    <span class="actioninfo-damage__group-title">
                      {{ t('battleLog.ui.skillDamage') }}
                      <small>{{ selectedSkillDamageHits.length }}</small>
                    </span>
                    <span class="actioninfo-damage__group-value">
                      <strong class="mono">{{ formatDamage(selectedSkillDamageTotal) }}</strong>
                      <svg
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                        aria-hidden="true"
                        :class="{ 'is-open': skillDamageOpen }"
                      >
                        <path
                          d="m8 10 4 4 4-4"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </span>
                  </button>
                  <div v-show="skillDamageOpen" class="actioninfo-damage__hits">
                    <button
                      v-for="hit in selectedSkillDamageHits"
                      :key="hit.key"
                      type="button"
                      class="actioninfo-damage-hit"
                      :class="{ 'has-detail': hit.hasDetail }"
                      :disabled="!hit.hasDetail"
                      @click="openDamageHitDetail(hit)"
                    >
                      <span class="actioninfo-damage-hit__label">
                        {{
                          t('timeline.mobile.actionInfo.damageHit', {
                            index: hit.displayIndex,
                          })
                        }}
                        <small class="mono">+{{ formatSec(hit.offset) }}s</small>
                      </span>
                      <strong class="mono">{{ formatDamage(hit.damage) }}</strong>
                    </button>
                  </div>
                </section>

                <section v-if="selectedEffectDamageHits.length" class="actioninfo-damage__group">
                  <button
                    type="button"
                    class="actioninfo-damage__group-toggle"
                    :aria-expanded="effectDamageOpen"
                    @click="effectDamageOpen = !effectDamageOpen"
                  >
                    <span class="actioninfo-damage__group-title">
                      {{ t('battleLog.ui.effectDamage') }}
                      <small>{{ selectedEffectDamageHits.length }}</small>
                    </span>
                    <span class="actioninfo-damage__group-value">
                      <strong class="mono">{{ formatDamage(selectedEffectDamageTotal) }}</strong>
                      <svg
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                        aria-hidden="true"
                        :class="{ 'is-open': effectDamageOpen }"
                      >
                        <path
                          d="m8 10 4 4 4-4"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </span>
                  </button>
                  <div v-show="effectDamageOpen" class="actioninfo-damage__hits">
                    <button
                      v-for="hit in selectedEffectDamageHits"
                      :key="hit.key"
                      type="button"
                      class="actioninfo-damage-hit"
                      :class="{ 'has-detail': hit.hasDetail }"
                      :disabled="!hit.hasDetail"
                      @click="openDamageHitDetail(hit)"
                    >
                      <span class="actioninfo-damage-hit__label">
                        <span>{{ hit.effectLabel || t('battleLog.ui.effectDamage') }}</span>
                        <small class="mono">
                          {{
                            t('timeline.mobile.actionInfo.damageHit', {
                              index: hit.displayIndex,
                            })
                          }}
                          · +{{ formatSec(hit.offset) }}s
                        </small>
                      </span>
                      <strong class="mono">{{ formatDamage(hit.damage) }}</strong>
                    </button>
                  </div>
                </section>
              </div>
              <div v-else class="actioninfo-damage__empty">
                {{ t('timeline.mobile.actionInfo.noDamage') }}
              </div>
            </section>
            <div class="actioninfo-actions tech-style">
              <button
                type="button"
                class="ea-btn ea-btn--sm ea-btn--glass-rect"
                @click="toggleSelectedActionDisabled"
              >
                {{
                  selectedSourceAction?.isDisabled
                    ? t('timeline.mobile.actionInfo.enable')
                    : t('timeline.mobile.actionInfo.disable')
                }}
              </button>
              <button
                type="button"
                class="ea-btn ea-btn--sm ea-btn--glass-rect ea-btn--accent-red ea-btn--glass-rect-danger"
                @click="removeSelectedAction"
              >
                {{ t('timeline.mobile.actionInfo.delete') }}
              </button>
            </div>
          </div>

          <div v-else class="tech-style">
            {{ t('timeline.mobile.actionInfo.notFound') }}
          </div>
        </div>
      </div>
    </el-drawer>

    <el-drawer
      v-model="loadoutOpen"
      direction="btt"
      size="85%"
      :with-header="false"
      :append-to-body="true"
      :lock-scroll="false"
      :close-on-click-modal="false"
      class="mobile-loadout-drawer"
    >
      <div class="m-drawer">
        <div class="m-drawer__header">
          <div class="m-drawer__title">{{ t('timeline.mobile.loadout.title') }}</div>
          <button
            type="button"
            class="ea-btn ea-btn--icon ea-btn--icon-38 ea-btn--glass-rect ea-btn--radius-6 m-drawer__close"
            :aria-label="t('common.close')"
            @click="loadoutOpen = false"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M18 6L6 18M6 6l12 12"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>

        <div class="m-drawer__content">
          <button
            v-if="selectedTrack"
            type="button"
            class="loadout-header loadout-editable tech-style"
            @click="openOperatorSelection(loadoutTrackIndex)"
          >
            <div class="loadout-operator">
              <div class="loadout-operator__avatar">
                <img
                  :src="withBaseUrl(getTrackAvatar(selectedTrack))"
                  :alt="getTrackName(selectedTrack)"
                  @error="onAssetError"
                />
              </div>
              <div class="loadout-operator__meta">
                <div class="loadout-operator__name">
                  {{
                    selectedTrack.id
                      ? getTrackName(selectedTrack)
                      : t('timeline.mobile.loadout.selectOperator')
                  }}
                </div>
                <div v-if="selectedOperatorSummary" class="loadout-operator__sub">
                  {{ selectedOperatorSummary }}
                </div>
                <div v-if="selectedSetBonusLabel" class="loadout-operator__bonus">
                  {{ selectedSetBonusLabel }}
                </div>
              </div>
            </div>
          </button>

          <div v-if="selectedTrack?.id" class="loadout-quick-actions">
            <button
              type="button"
              class="ea-btn ea-btn--sm ea-btn--lift ea-btn--outline-muted"
              :disabled="!selectedOperatorInstance"
              @click="openOperatorStatus"
            >
              {{ t('timeline.mobile.loadout.operatorStatus') }}
            </button>
            <button
              type="button"
              class="ea-btn ea-btn--sm ea-btn--lift ea-btn--outline-muted"
              :disabled="!selectedWeaponInstance"
              @click="openWeaponStatus"
            >
              {{ t('timeline.mobile.loadout.weapon') }}
            </button>
            <button
              type="button"
              class="ea-btn ea-btn--sm ea-btn--lift ea-btn--outline-muted"
              :disabled="!hasSelectedEquipment"
              @click="openEquipmentStatus"
            >
              {{ t('timeline.mobile.loadout.equipment') }}
            </button>
          </div>
          <button
            v-if="selectedTrack?.id"
            type="button"
            class="ea-btn ea-btn--sm ea-btn--lift ea-btn--outline-muted loadout-stat-action"
            :disabled="!selectedTrack.operatorStatus"
            @click="openStatDetail"
          >
            {{ t('statDetail.button') }}
          </button>
          <button
            v-if="selectedTrack?.id"
            type="button"
            class="ea-btn ea-btn--sm ea-btn--lift ea-btn--fill-gold loadout-skill-action"
            @click="openSkillLibrary(loadoutTrackIndex)"
          >
            {{ t('timeline.mobile.skillLibrary.title') }}
          </button>

          <div class="m-field">
            <div class="m-label">{{ t('timeline.mobile.loadout.weapon') }}</div>
            <button
              type="button"
              class="loadout-item loadout-editable tech-style"
              :disabled="!selectedTrack?.id"
              @click="openWeaponSelection"
            >
              <div class="loadout-item__icon">
                <img
                  :src="withBaseUrl(selectedWeapon?.icon || DEFAULT_ICON)"
                  :alt="getSelectedWeaponName()"
                  @error="onAssetError"
                />
              </div>
              <div class="loadout-item__main">
                <div class="loadout-item__title">
                  {{ getSelectedWeaponName() || t('actionLibrary.fallback.noWeapon') }}
                </div>
                <div
                  class="loadout-item__sub loadout-weapon-sub"
                  v-if="selectedTrack && selectedWeapon"
                >
                  <div
                    v-for="line in selectedWeaponSkillLines"
                    :key="line.key"
                    class="loadout-weapon-line"
                  >
                    <span class="loadout-weapon-name">{{ line.name }}</span>
                    <span class="loadout-weapon-tier mono">{{ line.tier }}</span>
                  </div>
                </div>
              </div>
            </button>
          </div>

          <div class="m-field">
            <div class="m-label">{{ t('timeline.mobile.loadout.equipment') }}</div>
            <div class="loadout-eq-list">
              <button
                v-for="slot in equipmentSlots"
                :key="slot.slotKey"
                type="button"
                class="loadout-item tech-style border-gear"
                :class="{ 'is-empty': !slot.id }"
                @click="openEquipmentSelection(slot.slotKey)"
              >
                <div class="loadout-item__icon">
                  <img
                    :src="withBaseUrl(slot.icon || DEFAULT_ICON)"
                    :alt="slot.name || ''"
                    @error="onAssetError"
                  />
                </div>
                <div class="loadout-item__main">
                  <div class="loadout-item__title">
                    <span class="slot-label">{{ slot.slotLabel }}</span>
                    <span class="title-main">{{
                      slot.name || t('actionLibrary.fallback.noEquip')
                    }}</span>
                  </div>
                  <div class="loadout-item__sub" v-if="slot.id">
                    <span class="mono" :style="{ color: slot.levelColor }"
                      >Lv{{ slot.level ?? '-' }}</span
                    >
                    <template v-if="slot.slotTypeName">
                      <span class="dot">·</span>
                      <span>{{ slot.slotTypeName }}</span>
                    </template>
                    <template v-if="slot.setName">
                      <span class="dot">·</span>
                      <span>{{ slot.setName }}</span>
                    </template>
                    <template v-if="slot.refineLabel !== null">
                      <span class="dot">·</span>
                      <span class="mono"
                        >{{ t('timelineGrid.equipmentDialog.refine') }} {{ slot.refineLabel }}</span
                      >
                    </template>
                  </div>
                  <div v-if="slot.stats.length" class="loadout-stat-list">
                    <div v-for="row in slot.stats" :key="row.key" class="loadout-stat-row">
                      <span>{{ row.label }}</span>
                      <strong class="mono">+{{ row.value }}</strong>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>

    <MobileSkillLibraryDrawer
      v-model="skillLibraryOpen"
      :track-name="activeMobileTrack?.id ? getTrackName(activeMobileTrack) : ''"
      @select="beginSkillPlacement"
    />
    <OperatorSelectionDialog ref="operatorSelectionDialogRef" />
    <WeaponSelectionDialog ref="weaponSelectionDialogRef" />
    <EquipmentSelectionDialog ref="equipmentSelectionDialogRef" />
    <EnemySettingsPanel ref="enemySettingsPanelRef" selector-only />
    <EditOperatorInstanceDialog
      :visible="operatorStatusOpen"
      :instance="selectedOperatorInstance"
      :display-name="selectedTrack?.id ? getTrackName(selectedTrack) : ''"
      @update:visible="operatorStatusOpen = $event"
    />
    <EditWeaponInstanceDialog
      :visible="weaponStatusOpen"
      :instance="selectedWeaponInstance"
      :display-name="getSelectedWeaponName()"
      @update:visible="weaponStatusOpen = $event"
    />
    <EditTrackGearLoadoutDialog
      :visible="equipmentStatusOpen"
      :track="selectedTrack"
      @update:visible="equipmentStatusOpen = $event"
    />
    <StatDetailDialog
      :visible="statDetailOpen"
      :operator-status="selectedTrack?.operatorStatus || null"
      :operator-name="selectedTrack?.id ? getTrackName(selectedTrack) : ''"
      @update:visible="statDetailOpen = $event"
    />
    <HitDamageDetailDialog
      :visible="!!selectedDamageHit"
      :breakdown="selectedDamageHit?._damageBreakdown || null"
      :hit-data="selectedDamageHit"
      @update:visible="closeDamageHitDetail"
    />

    <el-dialog
      v-model="importVisible"
      :title="t('timeline.import.dialogTitle')"
      width="92%"
      align-center
      class="custom-dialog"
      :append-to-body="true"
      :lock-scroll="false"
      :close-on-click-modal="false"
    >
      <div class="share-import-container">
        <p class="dialog-hint">{{ t('timeline.import.dialogHint') }}</p>

        <el-alert
          :title="t('timeline.import.dialogAlert')"
          type="warning"
          show-icon
          :closable="false"
          style="margin-bottom: 10px"
        />

        <el-input
          v-model="shareCode"
          type="textarea"
          :rows="6"
          :placeholder="t('timeline.import.dialogPlaceholder')"
          resize="none"
          autocomplete="off"
        />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <button
            type="button"
            class="ea-btn ea-btn--sm ea-btn--lift ea-btn--outline-muted"
            @click="importVisible = false"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            class="ea-btn ea-btn--sm ea-btn--lift ea-btn--fill-gold"
            :disabled="importing"
            @click="doImport"
          >
            {{ importing ? t('timeline.mobile.importing') : t('timeline.import.dialogConfirm') }}
          </button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.mobile-viewer-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--ea-bg-gradient);
  color: var(--ea-fg);
}

.mobile-topbar {
  height: 44px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 10px;
  box-sizing: border-box;
  border-bottom: 1px solid var(--ea-border-soft);
  background: var(--ea-chrome);
  backdrop-filter: blur(8px);
}

.mobile-topbar-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
}

.mobile-topbar-actions :deep(.el-button + .el-button) {
  margin-left: 0 !important;
}

.mobile-scenario-tools {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  flex: 0 0 auto;
}

.mobile-topbar-secondary {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  min-width: 0;
  flex: 1 1 auto;
  margin-left: auto;
}

.mobile-scenario-input {
  height: 24px;
  min-width: 0;
  max-width: 288px;
  flex: 1 1 288px;
  padding: 0 8px;
  box-sizing: border-box;
  border: 1px solid var(--ea-btn-secondary-border);
  border-radius: 0;
  outline: none;
  background: var(--ea-fill-strong);
  color: var(--ea-fg-secondary);
  font: inherit;
  font-size: 12px;
  font-weight: 700;
}

.mobile-scenario-input:focus {
  border-color: color-mix(in srgb, var(--ea-gold) 60%, var(--ea-border));
}

.mobile-editbar {
  display: grid;
  height: 72px;
  grid-template-columns: minmax(0, 1fr) 34px 34px;
  grid-template-rows: 30px 30px;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-bottom: 1px solid var(--ea-border-soft);
  background: var(--ea-chrome);
  box-sizing: border-box;
}

.mobile-editbar__library,
.mobile-editbar__enemy,
.mobile-editbar__icon {
  display: inline-flex;
  height: 30px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-soft);
  color: var(--ea-fg-secondary);
}

.mobile-editbar__library,
.mobile-editbar__enemy {
  min-width: 0;
  justify-content: flex-start;
  gap: 7px;
  padding: 0 10px;
  font-size: 11px;
  font-weight: 800;
}

.mobile-editbar__library {
  grid-column: 1 / -1;
  grid-row: 2;
  width: 100%;
}

.mobile-editbar__enemy {
  grid-column: 1;
  grid-row: 1;
  width: 100%;
  max-width: none;
  color: var(--ea-danger-soft, #ff7875);
}

.mobile-editbar__library span,
.mobile-editbar__enemy span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-editbar__icon {
  width: 34px;
  flex: 0 0 34px;
  padding: 0;
  transition:
    border-color 140ms ease,
    background-color 140ms ease,
    color 140ms ease,
    opacity 140ms ease,
    transform 80ms ease,
    box-shadow 80ms ease;
  touch-action: manipulation;
}

.mobile-editbar__icon--undo {
  grid-column: 2;
  grid-row: 1;
}

.mobile-editbar__icon--redo {
  grid-column: 3;
  grid-row: 1;
}

.mobile-editbar__icon:not(:disabled):active,
.mobile-editbar__icon.is-history-feedback {
  border-color: color-mix(in srgb, var(--ea-gold) 70%, var(--ea-border));
  background: color-mix(in srgb, var(--ea-gold) 18%, var(--ea-fill-strong));
  color: var(--ea-gold);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ea-gold) 24%, transparent);
  transform: translateY(1px) scale(0.92);
}

.mobile-editbar__icon.is-history-feedback,
.mobile-editbar__icon.is-history-feedback:disabled {
  cursor: default;
  opacity: 1;
  transition-duration: 0ms;
}

.mobile-editbar__icon:disabled {
  border-color: var(--ea-border-soft);
  background: transparent;
  color: var(--ea-fg-faint);
  cursor: not-allowed;
  opacity: 0.38;
}

.mobile-placement-banner {
  display: flex;
  min-height: 46px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 10px;
  border-bottom: 1px solid color-mix(in srgb, var(--ea-gold) 55%, var(--ea-border));
  background: color-mix(in srgb, var(--ea-gold) 10%, var(--ea-panel));
  box-sizing: border-box;
}

.mobile-placement-banner > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.mobile-placement-banner strong,
.mobile-placement-banner span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-placement-banner strong {
  color: var(--ea-fg);
  font-size: 12px;
}

.mobile-placement-banner span {
  color: var(--ea-fg-muted);
  font-size: 10px;
}

.mobile-placement-banner button {
  height: 30px;
  flex: 0 0 auto;
  padding: 0 10px;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-muted);
  color: var(--ea-fg-secondary);
}

.mobile-more-trigger.ea-btn {
  width: 34px;
  min-width: 34px;
  height: 24px;
  padding: 0;
  justify-content: center;
  --ea-btn-bg: var(--ea-btn-secondary-bg);
  --ea-btn-border: var(--ea-btn-secondary-border);
  --ea-btn-color: var(--ea-btn-secondary-fg);
  --ea-btn-bg-hover: var(--ea-btn-secondary-hover-bg);
  --ea-btn-border-hover: var(--ea-btn-secondary-hover-border);
  --ea-btn-color-hover: var(--ea-btn-secondary-hover-fg);
  --ea-btn-radius: 0;
  border-radius: 0;
}

.mobile-more-panel {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.mobile-more-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mobile-more-section + .mobile-more-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--ea-border);
}

.mobile-more-section__title {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: color-mix(in srgb, var(--ea-gold) 90%, transparent);
}

.mobile-time-settings {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mobile-time-setting-row {
  display: flex;
  min-height: 32px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--ea-fg-secondary);
  font-size: 12px;
  font-weight: 700;
}

.mobile-time-setting-row__control {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  color: var(--ea-fg-muted);
  font-family: 'Roboto Mono', 'Consolas', monospace;
  font-size: 10px;
}

.mobile-time-setting-row__control :deep(.el-input-number) {
  width: 116px;
}

.mobile-time-setting-row__control :deep(.el-input__wrapper) {
  border-radius: 0;
  background: var(--ea-fill-muted);
  box-shadow: 0 0 0 1px var(--ea-border) inset;
}

.mobile-time-setting-row__control :deep(.el-input__inner) {
  color: var(--ea-fg);
  font-family: 'Roboto Mono', 'Consolas', monospace;
}

.mobile-prep-setting {
  width: 100%;
}

.mobile-locale {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
}

.mobile-locale__btn.ea-btn,
.mobile-appearance-btn.ea-btn {
  min-width: 0;
  --ea-btn-bg: var(--ea-fill-soft);
  --ea-btn-border: var(--ea-border);
  --ea-btn-color: var(--ea-fg-secondary);
  --ea-btn-bg-hover: var(--ea-btn-primary-hover-bg);
  --ea-btn-border-hover: var(--ea-btn-primary-border);
  --ea-btn-color-hover: var(--ea-btn-primary-fg);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.mobile-locale__btn.ea-btn {
  width: 100%;
  padding: 5px 4px;
  font-size: 11px;
  white-space: nowrap;
}

.mobile-appearance-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  margin-top: 2px;
}

.mobile-appearance-row__label {
  font-size: 11px;
  font-weight: 600;
  color: var(--ea-fg-muted);
}

.mobile-appearance-row__btns {
  display: inline-grid;
  grid-template-columns: repeat(2, 28px);
  gap: 4px;
}

.mobile-appearance-btn.ea-btn {
  width: 28px;
  min-width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.mobile-locale__btn.ea-btn.is-active,
.mobile-appearance-btn.ea-btn.is-active {
  border-color: color-mix(in srgb, var(--ea-gold) 50%, transparent);
  background: color-mix(in srgb, var(--ea-gold) 10%, transparent);
  color: #ffe38a;
}

:global(html[data-theme='light'] .mobile-locale__btn.ea-btn.is-active),
:global(html[data-theme='light'] .mobile-appearance-btn.ea-btn.is-active) {
  border-color: rgba(180, 140, 0, 0.55);
  background: rgba(180, 140, 0, 0.12);
  color: var(--ea-gold);
}

.mobile-project-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.mobile-project-action.ea-btn {
  width: 100%;
  justify-content: flex-start;
  --ea-btn-bg: var(--ea-fill-soft);
  --ea-btn-border: var(--ea-border);
  --ea-btn-color: var(--ea-fg-secondary);
}

.mobile-scenario-select {
  width: 288px;
  min-width: 0;
  max-width: 288px;
  flex: 1 1 288px;
  --el-fill-color-blank: var(--ea-fill-strong);
  --el-border-color: var(--ea-btn-secondary-border);
  --el-border-color-hover: var(--ea-btn-secondary-hover-border);
  --el-text-color-regular: var(--ea-fg-secondary);
}

:deep(.mobile-scenario-select .el-input__wrapper),
:deep(.mobile-scenario-select .el-select__wrapper) {
  background-color: var(--ea-fill-strong) !important;
  box-shadow: 0 0 0 1px var(--ea-btn-secondary-border) inset !important;
  border-radius: 0 !important;
}

:deep(.mobile-scenario-select .el-input__inner),
:deep(.mobile-scenario-select .el-select__selected-item),
:deep(.mobile-scenario-select .el-select__placeholder) {
  color: var(--ea-fg-secondary) !important;
  font-size: 12px;
  font-weight: 700;
}

:deep(.mobile-scenario-select .el-input__suffix-inner),
:deep(.mobile-scenario-select .el-select__caret),
:deep(.mobile-scenario-select .el-icon) {
  color: var(--ea-fg-muted) !important;
}

:global(.mobile-scenario-popper.el-popper) {
  background-color: var(--ea-panel-elevated) !important;
  border: 1px solid var(--ea-dialog-border) !important;
  border-radius: 0 !important;
  box-shadow: 0 10px 30px var(--ea-shadow-strong) !important;
}

:global(.mobile-scenario-popper .el-popper__arrow) {
  overflow: hidden;
}

:global(.mobile-scenario-popper .el-popper__arrow::before) {
  background: var(--ea-panel-elevated) !important;
  border: 1px solid var(--ea-panel-elevated) !important;
}

:global(.mobile-scenario-popper .el-select-dropdown__item) {
  color: var(--ea-fg-secondary) !important;
}

:global(.mobile-scenario-popper .el-select-dropdown__item.hover),
:global(.mobile-scenario-popper .el-select-dropdown__item:hover) {
  background: var(--ea-select-hover-bg) !important;
  color: var(--ea-gold) !important;
}

:global(.mobile-scenario-popper .el-select-dropdown__item.selected) {
  color: var(--ea-gold) !important;
  background-color: var(--ea-select-hover-bg) !important;
}

:global(.mobile-more-popper.el-popover.el-popper) {
  padding: 12px;
  background: var(--ea-popover-bg);
  border: 1px solid var(--ea-border);
  border-radius: 0;
  color: var(--ea-fg-secondary);
  box-shadow: 0 10px 28px var(--ea-shadow-strong);
}

:global(.mobile-more-popper .el-popper__arrow::before) {
  background: var(--ea-popover-bg);
  border-color: var(--ea-border);
}

.mobile-scroll {
  flex: 1 1 auto;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
}

.mobile-tracks-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: grid;
  grid-template-columns: 48px repeat(4, minmax(0, 1fr));
  gap: 0;
  padding: 6px 6px 8px 6px;
  background: var(--ea-chrome-sticky);
  border-bottom: 1px solid var(--ea-border-soft);
}

.mobile-time-head {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  color: var(--ea-fg-muted);
}

.mobile-track-head {
  display: flex;
  justify-content: center;
}

.mobile-avatar {
  width: 44px;
  height: 44px;
  border: 1px solid var(--ea-border);
  box-sizing: border-box;
  background: var(--ea-fill-soft);
  overflow: hidden;
  border-radius: 0;
  box-shadow: 0 6px 18px var(--ea-shadow);
}
.mobile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.mobile-timeline-wrap {
  position: relative;
  display: grid;
  grid-template-columns: 48px 1fr;
  width: 100%;
  overflow: hidden;
}

.mobile-time-rail {
  position: relative;
  border-right: 1px solid var(--ea-border);
  background: var(--ea-fill-muted);
  box-sizing: border-box;
  touch-action: none;
  cursor: crosshair;
}

.mobile-resource-guide {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 20;
  height: 1px;
  border-top: 1px solid color-mix(in srgb, var(--ea-gold) 82%, transparent);
  box-shadow: 0 0 6px color-mix(in srgb, var(--ea-gold) 55%, transparent);
  pointer-events: none;
}

.mobile-resource-guide__panel {
  position: absolute;
  right: 6px;
  bottom: 5px;
  display: flex;
  width: min(286px, calc(100vw - 66px));
  max-width: calc(100vw - 66px);
  flex-direction: column;
  gap: 5px;
  padding: 6px 27px 6px 7px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border);
  border-radius: 0;
  background: var(--ea-tooltip-bg, rgba(16, 16, 16, 0.92));
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  box-shadow: 0 4px 14px var(--ea-shadow-strong);
  font-family: 'Roboto Mono', 'Consolas', monospace;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.25;
}

.mobile-resource-guide__close {
  position: absolute;
  top: 4px;
  right: 4px;
  display: inline-flex;
  width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 0;
  background: transparent;
  color: var(--ea-fg-muted);
  cursor: pointer;
  pointer-events: auto;
}

.mobile-resource-guide__close:hover,
.mobile-resource-guide__close:focus-visible {
  border-color: var(--ea-border);
  background: var(--ea-hover-fill);
  color: var(--ea-fg);
  outline: none;
}

.mobile-resource-guide__panel.is-below {
  top: 5px;
  bottom: auto;
}

.mobile-resource-guide__summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 3px 8px;
}

.mobile-resource-guide__summary .is-time {
  color: var(--ea-fg);
}

.mobile-resource-guide__summary .is-sp {
  color: var(--ea-gold);
}

.mobile-resource-guide__summary .is-stagger {
  color: var(--ea-danger-soft, #ff7875);
}

.mobile-resource-guide__summary .is-hp {
  color: var(--ea-danger, #ff4d4f);
}

.mobile-resource-guide__gauges {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 3px 8px;
  padding-top: 5px;
  border-top: 1px solid var(--ea-border-soft);
}

.mobile-resource-guide__gauge-title {
  grid-column: 1 / -1;
  color: var(--ea-info, #00e5ff);
}

.mobile-resource-guide__gauge {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 5px;
  padding-left: 5px;
  border-left: 2px solid var(--guide-gauge-color);
  color: var(--ea-fg-secondary);
}

.mobile-resource-guide__gauge-name {
  min-width: 0;
  overflow: hidden;
  color: var(--guide-gauge-color);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-resource-guide__gauge-value {
  flex: 0 0 auto;
  font-variant-numeric: tabular-nums;
}

.mobile-resource-guide__gauge.is-full .mobile-resource-guide__gauge-value {
  color: var(--guide-gauge-color);
  text-shadow: 0 0 5px color-mix(in srgb, var(--guide-gauge-color) 45%, transparent);
}

.mobile-resource-guide__effects {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  padding-top: 5px;
  border-top: 1px solid var(--ea-border-soft);
}

.mobile-resource-guide__effect {
  position: relative;
  display: block;
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  padding: 0;
  border: 1px solid var(--ea-keycap-skill-border, #999);
  border-radius: 0;
  background: var(--ea-keycap-skill-bg, #333);
  box-sizing: border-box;
  cursor: pointer;
  pointer-events: auto;
}

.mobile-resource-guide__effect.is-disabled {
  opacity: 0.42;
  filter: grayscale(0.5);
}

.mobile-resource-guide__effect img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mobile-resource-guide__effect span {
  position: absolute;
  right: -2px;
  bottom: -2px;
  padding: 0 2px;
  background: rgba(0, 0, 0, 0.82);
  color: var(--ea-gold);
  font-size: 8px;
  line-height: 1;
}

.mobile-resource-guide__effect-more {
  color: var(--ea-fg-muted);
  font-size: 10px;
}

.mobile-time-ticks {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: -1px;
  padding-left: var(--opw, 26px);
  pointer-events: none;
}

.mobile-stagger-break-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.mobile-stagger-break-zone {
  position: absolute;
  left: 0;
  right: 0;
  min-height: 2px;
  border-top: 1px solid rgba(255, 213, 145, 0.45);
  border-bottom: 1px solid rgba(255, 213, 145, 0.32);
  background:
    repeating-linear-gradient(
      135deg,
      rgba(255, 213, 145, 0.58) 0,
      rgba(255, 213, 145, 0.58) 2px,
      transparent 2px,
      transparent 10px
    ),
    rgba(255, 156, 110, 0.1);
  box-sizing: border-box;
  animation: mobile-stagger-break-pulse 2s ease-in-out infinite alternate;
}

@keyframes mobile-stagger-break-pulse {
  from {
    opacity: 0.45;
  }
  to {
    opacity: 0.85;
  }
}

.mobile-op-layer {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 2px;
  width: var(--opw, 22px);
  pointer-events: none;
}

.mobile-key-cap {
  position: absolute;
  left: calc(1px + var(--lane, 0) * (var(--capw, 20px) + var(--capgap, 2px)));
  width: var(--capw, 20px);
  height: 14px;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ea-keycap-bg);
  border: 1px solid var(--ea-keycap-border);
  border-radius: 2px;
  color: var(--ea-fg);
  font-weight: bold;
  font-family: Consolas, Monaco, monospace;
  box-shadow: 0 1px 1px var(--ea-shadow);
  white-space: nowrap;
  opacity: 0.92;
  font-size: var(--capfs, 9px);
  line-height: 1;
  overflow: hidden;
}

.mobile-key-cap.op-skill {
  background: var(--ea-keycap-skill-bg);
  border-color: var(--ea-keycap-skill-border);
}

.mobile-key-cap.op-link {
  background: color-mix(in srgb, var(--ea-gold) 20%, transparent);
  border-color: var(--ea-gold);
  color: var(--ea-gold);
}

.mobile-key-cap.op-link.is-perfect-link {
  background: rgba(255, 236, 122, 0.36);
  border-color: #fff2a8;
  color: #fff7cf;
  box-shadow:
    0 0 0 1px rgba(255, 242, 168, 0.85),
    0 0 10px color-mix(in srgb, var(--ea-gold) 80%, transparent);
  animation: mobile-perfect-link-pulse 1.15s ease-in-out infinite;
}

.mobile-key-cap.op-switch {
  background: rgba(211, 173, 255, 0.2);
  border-color: #d3adff;
  color: #d3adff;
}

.mobile-key-cap.is-hold {
  background: var(--ea-keycap-skill-bg);
  border-color: var(--ea-keycap-skill-border);
}

.mobile-key-cap .key-text {
  font-size: inherit;
  line-height: inherit;
}

@keyframes mobile-perfect-link-pulse {
  0%,
  100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.35);
  }
}

.mobile-time-tick {
  position: absolute;
  left: 0;
  right: 0;
  transform: none;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
  padding: 0 0 0 2px;
  --mark-len: 12px;
  --mark-color: var(--ea-mark);
}

.mobile-time-mark {
  height: 1px;
  width: 100%;
  background: linear-gradient(
    to left,
    var(--mark-color) 0,
    var(--mark-color) var(--mark-len),
    transparent var(--mark-len)
  );
}

.mobile-time-label {
  width: 100%;
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
  text-align: right;
  color: var(--ea-fg-muted);
  white-space: nowrap;
  padding-right: 2px;
}

.mobile-time-tick.is-major .mobile-time-mark {
  --mark-len: 18px;
  --mark-color: var(--ea-mark-major);
}

.mobile-time-tick.is-battle-start .mobile-time-mark {
  --mark-len: 22px;
  --mark-color: var(--ea-mark-strong);
}

.mobile-time-tick.is-battle-start .mobile-time-label {
  color: var(--ea-fg-secondary);
}

.mobile-prep-zone {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  background: var(--ea-prep-fill);
  border-bottom: 1px solid var(--ea-border);
  pointer-events: none;
}

.mobile-prep-zone--grid {
  z-index: 6;
}

.mobile-prep-center-label {
  position: absolute;
  left: 50%;
  top: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-height: 28px;
  padding: 0 6px;
  border: 0;
  background: transparent;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 2px;
  color: var(--ea-fg-faint);
  white-space: nowrap;
  pointer-events: auto;
  touch-action: manipulation;
  transform: translate(-50%, -50%);
}

.mobile-prep-title-icon {
  display: inline-flex;
  flex: 0 0 18px;
  width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  color: inherit;
}

.mobile-prep-title-icon.is-collapsed svg {
  transform: rotate(180deg);
}

.mobile-prep-zone--grid.is-collapsed .mobile-prep-center-label {
  min-height: 18px;
  padding: 0 4px;
  font-size: 9px;
  letter-spacing: 0;
}

.mobile-battle-start-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--ea-mark-strong);
  transform: translateY(-1px);
  pointer-events: none;
}

.mobile-battle-start-line--grid {
  z-index: 2;
}

.mobile-timeline {
  position: relative;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  width: 100%;
  overflow: hidden;
  background:
    linear-gradient(180deg, var(--ea-grid-wash), transparent 25%),
    repeating-linear-gradient(
      to bottom,
      var(--ea-grid-line) 0px,
      var(--ea-grid-line) 1px,
      transparent 1px,
      transparent var(--sec-px)
    );
  background-position:
    0 0,
    0 var(--grid-offset-y, 0px);
}

.mobile-freeze-layer {
  position: absolute;
  inset: 0;
  z-index: 2;
  overflow: hidden;
  pointer-events: none;
}

.mobile-freeze-region {
  position: absolute;
  left: 0;
  right: 0;
  min-height: 2px;
  border-top: 1px dashed color-mix(in srgb, var(--ea-fg) 24%, transparent);
  border-bottom: 1px dashed color-mix(in srgb, var(--ea-fg) 24%, transparent);
  background: color-mix(in srgb, var(--ea-panel) 52%, transparent);
  box-shadow: inset 0 0 14px color-mix(in srgb, #000 38%, transparent);
  box-sizing: border-box;
}

.mobile-freeze-region span {
  position: absolute;
  top: 50%;
  right: 4px;
  transform: translateY(-50%);
  color: var(--ea-fg-muted);
  font-size: 9px;
  font-weight: 800;
  line-height: 1;
  text-shadow: var(--ea-action-fg-shadow);
  white-space: nowrap;
}

.mobile-track-col {
  position: relative;
  border-left: 1px solid var(--ea-border-soft);
}
.mobile-track-col:first-child {
  border-left: none;
}

.mobile-track-col.is-placement-target {
  background: color-mix(in srgb, var(--ea-gold) 8%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ea-gold) 55%, transparent);
}

.mobile-track-col.is-placement-muted {
  opacity: 0.48;
}

.mobile-actions-layer {
  position: absolute;
  inset: 0;
  z-index: 3;
}

.mobile-action-block {
  position: absolute;
  left: 4px;
  right: 4px;
  border: 1px solid transparent;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  border-radius: 0;
  z-index: 4;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.mobile-action-block.is-drag-group {
  filter: brightness(1.08);
}

.mobile-action-block.is-dragging {
  outline: 1px solid color-mix(in srgb, var(--ea-gold) 90%, transparent);
  box-shadow: 0 0 12px color-mix(in srgb, var(--ea-gold) 24%, transparent) !important;
}

.mobile-action-freeze {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  max-height: calc(100% - 1px);
  overflow: hidden;
  border-bottom: 1px solid color-mix(in srgb, var(--ea-fg) 30%, transparent);
  background: color-mix(in srgb, var(--ea-fg) 6%, transparent);
  box-sizing: border-box;
  pointer-events: none;
  z-index: 1;
}

.mobile-action-freeze__shimmer {
  position: absolute;
  inset: 0;
  width: 200%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    color-mix(in srgb, var(--ea-fg) 16%, transparent) 50%,
    transparent 100%
  );
  animation: mobile-freeze-shimmer 1.5s linear infinite;
}

@keyframes mobile-freeze-shimmer {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(50%);
  }
}

.mobile-action-icons {
  position: absolute;
  right: 2px;
  top: 50%;
  transform: translateY(-50%);
  display: grid;
  grid-template-columns: 14px;
  grid-auto-rows: 14px;
  gap: 2px;
  z-index: 5;
  pointer-events: none;
}

.mobile-action-icons.is-multiple {
  grid-template-columns: repeat(2, 14px);
}

.mobile-action-icon-box {
  position: relative;
  width: 14px;
  height: 14px;
  flex: 0 0 auto;
}

.mobile-action-icon {
  width: 14px;
  height: 14px;
  display: block;
  object-fit: contain;
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.8));
}

.mobile-action-icon-more {
  width: 14px;
  height: 14px;
  display: grid;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--ea-fg) 28%, transparent);
  background: color-mix(in srgb, var(--ea-panel) 88%, transparent);
  color: var(--ea-fg-muted);
  font-size: 8px;
  font-weight: 800;
  line-height: 1;
  box-sizing: border-box;
}

.mobile-action-stacks {
  position: absolute;
  right: -3px;
  bottom: -3px;
  min-width: 10px;
  padding: 0 2px;
  background: var(--ea-stack-bg);
  color: var(--ea-gold);
  font-size: 8px;
  line-height: 1.1;
  font-weight: 800;
  text-align: center;
}

.mobile-action-text {
  position: relative;
  z-index: 2;
  font-size: 12px;
  font-weight: 800;
  color: var(--ea-action-fg);
  text-shadow: var(--ea-action-fg-shadow);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 18px;
  letter-spacing: 1px;
  text-align: center;
  max-width: 100%;
}

.mobile-action-block.has-multiple-badges .mobile-action-text {
  padding-right: 34px;
  padding-left: 4px;
}

.mobile-action-drag-time {
  position: absolute;
  top: -17px;
  right: 0;
  z-index: 9;
  padding: 2px 4px;
  border: 1px solid color-mix(in srgb, var(--ea-gold) 48%, transparent);
  background: var(--ea-panel-elevated);
  color: var(--ea-gold);
  font-size: 9px;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
  pointer-events: none;
}

.mobile-cd-ibar {
  position: absolute;
  width: 2px;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  z-index: 2;
}

.mobile-cd-ibar__line {
  flex: 1 1 auto;
  width: 2px;
  background: currentColor;
  opacity: 0.9;
}

.mobile-cd-ibar__start,
.mobile-cd-ibar__end {
  width: 8px;
  height: 1px;
  background: currentColor;
  flex: 0 0 auto;
}

.mobile-cd-ibar__text {
  position: absolute;
  left: 6px;
  top: 0;
  font-size: 9px;
  font-weight: 800;
  line-height: 1;
  color: currentColor;
  white-space: nowrap;
  text-shadow: var(--ea-action-fg-shadow);
}

:deep(.el-dialog) {
  background-color: var(--ea-dialog-bg);
  border: 1px solid var(--ea-dialog-border);
  border-radius: 8px;
  box-shadow: 0 10px 30px var(--ea-shadow-strong);
}
:deep(.el-dialog__header) {
  margin-right: 0;
  border-bottom: 1px solid var(--ea-dialog-divider);
  padding: 15px 20px;
}
:deep(.el-dialog__title) {
  color: var(--ea-dialog-title);
  font-size: 16px;
  font-weight: 600;
}
:deep(.el-dialog__body) {
  color: var(--ea-dialog-body);
  padding: 25px 25px 10px 25px;
}
:deep(.el-dialog__footer) {
  padding: 15px 25px 20px;
  border-top: 1px solid var(--ea-dialog-divider);
}

.share-import-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.dialog-hint {
  color: var(--ea-dialog-hint);
  font-size: 12px;
  margin: 0;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  width: 100%;
}

.tech-style {
  background: linear-gradient(135deg, var(--ea-fill-soft) 0%, transparent 100%);
  border: 1px solid var(--ea-border);
  border-left: 3px solid var(--ea-gold);
  padding: 14px;
  overflow: visible;
}

.tech-style.border-gear {
  border-left-color: var(--ea-gear-accent, #2dd4bf);
}

:deep(.el-textarea__inner) {
  background-color: var(--ea-fill-input) !important;
  box-shadow: inset 0 0 0 1px var(--ea-border) !important;
  color: var(--ea-fg) !important;
  border: none !important;
  font-family: monospace;
}
:deep(.el-textarea__inner:focus) {
  background-color: var(--ea-panel-elevated) !important;
  box-shadow: inset 0 0 0 1px var(--ea-gold) !important;
}

:global(body.endaxis-mobile-viewer) {
  overflow-x: hidden !important;
}

:global(body.endaxis-mobile-viewer.el-popup-parent--hidden) {
  padding-right: 0 !important;
}

:global(body.endaxis-mobile-viewer .enemy-selector-dialog) {
  width: min(94vw, 640px) !important;
  height: min(88dvh, 760px);
  max-height: 88dvh;
  margin: auto !important;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:global(body.endaxis-mobile-viewer .enemy-selector-dialog .el-dialog__header) {
  flex: 0 0 auto;
  padding: 12px 14px 8px;
}

:global(body.endaxis-mobile-viewer .enemy-selector-dialog .el-dialog__body) {
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  overflow: hidden;
  padding: 8px 10px 10px;
}

:global(body.endaxis-mobile-viewer .enemy-selector-dialog .selector-header) {
  flex: 0 0 auto;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  margin-bottom: 8px;
}

:global(body.endaxis-mobile-viewer .enemy-selector-dialog .selector-header .el-input) {
  width: 100% !important;
}

:global(body.endaxis-mobile-viewer .enemy-selector-dialog .enemy-level-picker) {
  align-items: flex-start;
  flex-direction: column;
  gap: 5px;
}

:global(body.endaxis-mobile-viewer .enemy-selector-dialog .enemy-level-buttons) {
  width: 100%;
  flex-wrap: wrap;
}

:global(body.endaxis-mobile-viewer .enemy-selector-dialog .enemy-level-btn) {
  min-width: 0;
  flex: 1 1 42px;
}

:global(body.endaxis-mobile-viewer .enemy-selector-dialog .enemy-filter-rows) {
  max-height: none;
  flex: 0 0 auto;
  margin-bottom: 8px;
  overflow: hidden;
}

:global(body.endaxis-mobile-viewer .enemy-selector-dialog .category-tabs),
:global(body.endaxis-mobile-viewer .enemy-selector-dialog .tier-filters) {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
  width: 100%;
  max-width: 100%;
  padding-bottom: 2px;
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

:global(body.endaxis-mobile-viewer .enemy-selector-dialog .category-tabs::-webkit-scrollbar),
:global(body.endaxis-mobile-viewer .enemy-selector-dialog .tier-filters::-webkit-scrollbar) {
  display: none;
}

:global(body.endaxis-mobile-viewer .enemy-selector-dialog .category-tabs .ea-btn),
:global(body.endaxis-mobile-viewer .enemy-selector-dialog .tier-filters .ea-btn) {
  width: auto;
  min-width: max-content;
  flex: 0 0 auto;
  min-height: 32px;
  justify-content: center;
  padding-right: 10px;
  padding-left: 10px;
  white-space: nowrap;
  line-height: 1.2;
}

:global(body.endaxis-mobile-viewer .enemy-selector-dialog .enemy-list-grid) {
  min-height: 0;
  max-height: none;
  flex: 1 1 auto;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 6px 2px;
}

:global(body.endaxis-mobile-viewer .enemy-selector-dialog .enemy-group-section) {
  margin-bottom: 16px;
}

:global(body.endaxis-mobile-viewer .enemy-selector-dialog .group-items) {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

@media (max-width: 479px) {
  :global(body.endaxis-mobile-viewer .enemy-selector-dialog .group-items) {
    grid-template-columns: minmax(0, 1fr);
  }
}

:global(.mobile-loadout-drawer),
:global(.mobile-actioninfo-drawer) {
  background: var(--ea-panel) !important;
}

:global(.mobile-loadout-drawer .el-drawer__body),
:global(.mobile-actioninfo-drawer .el-drawer__body) {
  padding: 0 !important;
  background: var(--ea-panel) !important;
}

.m-drawer {
  padding: 0;
  box-sizing: border-box;
  height: 100%;
  overflow-y: auto;
  background: var(--ea-panel);
  color: var(--ea-fg);
}

.m-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  position: sticky;
  top: 0;
  z-index: 20;
  padding: 14px 12px 10px 12px;
  background: var(--ea-panel);
  border-bottom: 0;
}

.m-drawer__title {
  font-size: 14px;
  font-weight: 900;
}

.m-drawer__close {
  flex-shrink: 0;
}

.m-drawer__content {
  padding: 12px 12px calc(16px + env(safe-area-inset-bottom)) 12px;
  box-sizing: border-box;
}

.m-field {
  margin-bottom: 14px;
}

.m-label {
  font-size: 12px;
  color: var(--ea-fg-muted);
  font-weight: 900;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.mobile-avatar-btn {
  background: transparent;
  border: none;
  padding: 0;
  line-height: 0;
}

.mobile-avatar-btn:not(.is-disabled) {
  cursor: pointer;
}

.mobile-avatar-btn.is-disabled {
  opacity: 0.55;
}

.mobile-action-block {
  cursor: pointer;
}

.mobile-action-block.is-info-target {
  outline: 1px solid color-mix(in srgb, var(--ea-gold) 85%, transparent);
  box-shadow: 0 0 10px color-mix(in srgb, var(--ea-gold) 14%, transparent);
}

.actioninfo-hero {
  margin-bottom: 14px;
}

.actioninfo-hero__top {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.actioninfo-hero__avatar {
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  border: 1px solid color-mix(in srgb, var(--ea-gold) 22%, transparent);
  background: color-mix(in srgb, var(--ea-gold) 6%, transparent);
  overflow: hidden;
}

.actioninfo-hero__avatar img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.actioninfo-hero__meta {
  min-width: 0;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.actioninfo-hero__name {
  font-size: 14px;
  font-weight: 900;
  color: var(--ea-fg);
  line-height: 1.15;
}

.actioninfo-hero__sub {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 11px;
  color: var(--ea-fg-muted);
}

.actioninfo-combat-icons {
  display: flex;
  width: min(42%, 150px);
  min-width: 0;
  flex: 0 1 150px;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.actioninfo-combat-item {
  display: flex;
  max-width: 100%;
  align-items: center;
  justify-content: flex-end;
  gap: 7px;
}

.actioninfo-combat-icon-box {
  position: relative;
  width: 22px;
  height: 22px;
  flex: 0 0 auto;
  order: 2;
}

.actioninfo-combat-icon {
  width: 22px;
  height: 22px;
  display: block;
  object-fit: contain;
}

.actioninfo-combat-stacks {
  position: absolute;
  right: -4px;
  bottom: -3px;
  min-width: 11px;
  padding: 0 2px;
  background: var(--ea-stack-bg);
  color: var(--ea-gold);
  font-size: 9px;
  line-height: 1.1;
  font-weight: 800;
  text-align: center;
}

.actioninfo-combat-meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  text-align: right;
}

.actioninfo-combat-name {
  max-width: 100%;
  overflow: hidden;
  font-size: 12px;
  font-weight: 700;
  color: var(--ea-fg-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actioninfo-combat-dur {
  font-size: 11px;
  color: var(--ea-fg-muted);
  font-family:
    'Roboto Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
}

.actioninfo-hero__time {
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.actioninfo-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
}

.actioninfo-damage {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--ea-border-soft);
}

.actioninfo-damage__summary,
.actioninfo-damage-hit {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.actioninfo-damage__summary {
  color: var(--ea-fg-secondary);
  font-size: 12px;
}

.actioninfo-damage__summary strong {
  color: var(--ea-gold);
  font-size: 17px;
}

.actioninfo-damage__groups {
  display: flex;
  flex-direction: column;
  margin-top: 8px;
  border-top: 1px solid var(--ea-border-soft);
}

.actioninfo-damage__group {
  border-bottom: 1px solid var(--ea-border-soft);
}

.actioninfo-damage__group-toggle {
  display: flex;
  width: 100%;
  min-height: 40px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 2px;
  border: 0;
  background: transparent;
  color: var(--ea-fg-secondary);
  text-align: left;
}

.actioninfo-damage__group-title,
.actioninfo-damage__group-value {
  display: inline-flex;
  align-items: center;
}

.actioninfo-damage__group-title {
  min-width: 0;
  gap: 6px;
  font-size: 11px;
  font-weight: 800;
}

.actioninfo-damage__group-title small {
  min-width: 18px;
  padding: 1px 5px;
  border: 1px solid var(--ea-border-soft);
  color: var(--ea-fg-muted);
  font-size: 9px;
  line-height: 14px;
  text-align: center;
}

.actioninfo-damage__group-value {
  flex: 0 0 auto;
  gap: 7px;
}

.actioninfo-damage__group-value strong {
  color: var(--ea-fg);
  font-size: 12px;
}

.actioninfo-damage__group-value svg {
  color: var(--ea-fg-muted);
  transition: transform 140ms ease;
}

.actioninfo-damage__group-value svg.is-open {
  transform: rotate(180deg);
}

.actioninfo-damage__hits {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--ea-border-soft);
}

.actioninfo-damage-hit {
  width: 100%;
  min-height: 38px;
  padding: 6px 2px;
  border: 0;
  border-bottom: 1px solid color-mix(in srgb, var(--ea-border-soft) 70%, transparent);
  background: transparent;
  color: var(--ea-fg-secondary);
  text-align: left;
}

.actioninfo-damage-hit.has-detail:active {
  background: var(--ea-fill-soft);
}

.actioninfo-damage-hit:disabled {
  opacity: 1;
}

.actioninfo-damage-hit__label {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  font-size: 11px;
  font-weight: 700;
}

.actioninfo-damage-hit__label small,
.actioninfo-damage__empty {
  color: var(--ea-fg-muted);
  font-size: 10px;
  font-weight: 500;
}

.actioninfo-damage-hit strong {
  flex: 0 0 auto;
  color: var(--ea-fg);
  font-size: 12px;
}

.actioninfo-damage__empty {
  padding-top: 8px;
}

.time-chip {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 8px 10px;
  border: 1px solid var(--ea-border-soft);
  background: var(--ea-fill-soft);
}

.time-chip__label {
  font-size: 11px;
  color: var(--ea-fg-muted);
  font-weight: 900;
}

.time-chip__val {
  font-size: 12px;
  color: var(--ea-fg-secondary);
}

.loadout-header {
  margin-bottom: 14px;
}

.loadout-editable {
  width: 100%;
  border: 1px solid var(--ea-border-soft);
  color: inherit;
  font: inherit;
  text-align: left;
}

.loadout-header.loadout-editable {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.loadout-quick-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}

.loadout-quick-actions .ea-btn {
  width: 100%;
}

.loadout-skill-action {
  width: 100%;
  margin-bottom: 14px;
}

.loadout-stat-action {
  width: 100%;
  margin-bottom: 8px;
}

.loadout-operator {
  display: flex;
  gap: 12px;
  align-items: center;
}

.loadout-operator__avatar {
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  border: 1px solid color-mix(in srgb, var(--ea-gold) 22%, transparent);
  background: color-mix(in srgb, var(--ea-gold) 6%, transparent);
  overflow: hidden;
}

.loadout-operator__avatar img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.loadout-operator__meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.loadout-operator__name {
  font-size: 14px;
  font-weight: 900;
  color: var(--ea-fg);
  line-height: 1.15;
}

.loadout-operator__sub {
  font-size: 11px;
  color: var(--ea-fg-faint);
  font-family:
    'Roboto Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
}

.loadout-operator__bonus {
  margin-top: 4px;
  font-size: 11px;
  font-weight: 700;
  color: var(--ea-gear-accent-fg);
  line-height: 1.3;
}

.loadout-eq-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.loadout-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  width: 100%;
  border: 1px solid var(--ea-border-soft);
  color: inherit;
  font: inherit;
  text-align: left;
}

.loadout-item.is-empty {
  opacity: 0.72;
}

.loadout-item__icon {
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-soft);
  overflow: hidden;
}

.loadout-eq-list .loadout-item__icon {
  border-color: var(--ea-gear-accent, #2dd4bf);
}

.loadout-item__icon img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.loadout-item__main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1 1 auto;
}

.loadout-item__title {
  display: flex;
  gap: 10px;
  align-items: baseline;
  flex-wrap: wrap;
  line-height: 1.2;
  color: var(--ea-fg-secondary);
  font-weight: 900;
  font-size: 13px;
}

.loadout-item__sub {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 11px;
  color: var(--ea-fg-muted);
}

.loadout-stat-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 100%;
}

.loadout-stat-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 11px;
  color: var(--ea-fg-secondary);
}

.loadout-stat-row strong {
  color: var(--ea-fg);
  font-weight: 800;
}

.loadout-weapon-sub {
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.loadout-weapon-line {
  width: 100%;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.loadout-weapon-name {
  flex: 1 1 auto;
  min-width: 0;
  word-break: break-word;
}

.loadout-weapon-tier {
  flex: 0 0 auto;
  opacity: 0.85;
  white-space: nowrap;
}

.actioninfo-stats {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.actioninfo-stat {
  padding: 8px 10px;
  border: 1px solid var(--ea-border-soft);
  background: var(--ea-fill-soft);
}

.actioninfo-stat__label {
  font-size: 10px;
  letter-spacing: 0.04em;
  color: var(--ea-fg-faint);
  margin-bottom: 4px;
}

.actioninfo-stat__val {
  font-size: 13px;
  font-weight: 800;
  color: var(--ea-fg);
}

.mono {
  font-family:
    'Roboto Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
}

.dot {
  opacity: 0.35;
}

.slot-label {
  color: var(--ea-gear-accent-fg);
}

.title-main {
  min-width: 0;
  word-break: break-word;
}
</style>
