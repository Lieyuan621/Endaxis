<script setup>
import { onMounted, onUnmounted, ref, nextTick, computed, watch } from 'vue';
import { useTimelineStore } from '../stores/timelineStore.js';
import { useShareProject } from '@/composables/useShareProject';
import { useAppearance } from '@/composables/useAppearance';
import { ElLoading, ElMessage, ElMessageBox } from 'element-plus';
import { snapdom } from '@zumer/snapdom';
import { useI18n } from 'vue-i18n';
import { setLocale } from '@/i18n';

// 组件引入
import TimelineGrid from '../components/TimelineGrid.vue';
import ActionLibrary from '../components/ActionLibrary.vue';
import EnemySettingsPanel from '../components/EnemySettingsPanel.vue';
import ContingencyContractPanel from '../components/ContingencyContractPanel.vue';
import GlobalConfigSettingsPanel from '../components/GlobalConfigSettingsPanel.vue';
import GlobalConfigPresetPanel from '../components/GlobalConfigPresetPanel.vue';
import PropertiesPanel from '../components/PropertiesPanel.vue';
import ResourceMonitor from '../components/ResourceMonitor.vue';
import SimLogPanel from '../components/SimLogPanel.vue';
import DamageAnalysisDialog from '../components/DamageAnalysisDialog.vue';
import LoadingTerminal from '../components/LoadingTerminal.vue';
import SmallImageExportDialog from '../components/SmallImageExportDialog.vue';

import { addMetadataToPng, readMetadataFromPng } from '../utils/pngUtils';
import {
  attachLibraryDragGhostHint,
  createLibraryDragGhost,
  getDefaultLibraryDragOffsets,
  LIBRARY_PLACE_CANCEL_HINT_DELAY_MS,
  positionLibraryDragGhost,
  removeLibraryDragGhost,
} from '@/utils/libraryDragGhost';
import {
  findLibrarySkillByType,
  findLibrarySkillForPlaceRematch,
  getCycledTrackIndex,
  getLibrarySkillTypeFromHotkeyCode,
  getTrackIndexFromHotkeyEvent,
} from '@/utils/librarySkillHotkeys';
import {
  hasVisibleElementPlusDialog,
  isEditableShortcutTarget,
  isTimelineShortcutScopeBlocked as hasBlockedTimelineShortcutScope,
} from '@/utils/shortcutScope';

const store = useTimelineStore();
const { t, locale } = useI18n({ useScope: 'global' });
const { copyShareCode, importFromCode } = useShareProject();
const { appearance, setAppearance } = useAppearance();

const timelineGridRef = ref(null);

const TIMELINE_LAYOUT_KEY = 'endaxis:timeline-workbench-layout:v1';
const ACTIVITY_BAR_WIDTH = 48;
const PANEL_MAX_WIDTH = 480;
const LEFT_PANEL_MIN_WIDTH = 200;
const RIGHT_PANEL_MIN_WIDTH = 260;
const BOTTOM_PANEL_MIN_HEIGHT = 240;
const TIMELINE_MAIN_MIN_WIDTH = 540;
const TIMELINE_MAIN_MIN_HEIGHT = 600;
const DEFAULT_LEFT_PANEL_WIDTH = 200;
const DEFAULT_RIGHT_PANEL_WIDTH = 260;
const DEFAULT_BOTTOM_PANEL_HEIGHT = 240;
const BOTTOM_RESIZER_HEIGHT = 1;
const RIGHT_TOOLS_VISIBLE = true;
const watermarkEl = ref(null);
const watermarkSubText = ref('Created by Endaxis');
const appLayoutRef = ref(null);
const timelineWorkspaceRef = ref(null);
const timelineWorkspaceHeight = ref(0);
const leftPanelWidth = ref(DEFAULT_LEFT_PANEL_WIDTH);
const rightPanelWidth = ref(DEFAULT_RIGHT_PANEL_WIDTH);
const bottomPanelHeight = ref(DEFAULT_BOTTOM_PANEL_HEIGHT);
const isLeftPanelCollapsed = ref(false);
const isRightPanelCollapsed = ref(false);
const isBottomPanelCollapsed = ref(false);
const activeWorkbenchDrag = ref(null);
const rightPanelTool = ref('inspector'); // 'inspector' | 'battleLog'
const leftBottomTool = ref('enemy'); // 'enemy' | 'global' | 'contract'
const analysisDialogVisible = ref(false);
const resourceMonitorExpandAllToken = ref(0);
const resourceMonitorCollapsedCount = ref(0);

let workbenchDragState = null;
let timelineWorkspaceResizeObserver = null;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function updateTimelineWorkspaceMetrics() {
  timelineWorkspaceHeight.value = timelineWorkspaceRef.value?.clientHeight || 0;
}

function getMaxBottomPanelHeight(workspaceHeight = timelineWorkspaceHeight.value) {
  const availableHeight = Math.max(0, Number(workspaceHeight) || 0);
  if (availableHeight <= 0) return bottomPanelHeight.value;
  return Math.max(0, availableHeight - TIMELINE_MAIN_MIN_HEIGHT - BOTTOM_RESIZER_HEIGHT);
}

const bottomPanelMinHeight = computed(() => {
  const collapsedCount = Math.min(Math.max(Number(resourceMonitorCollapsedCount.value) || 0, 0), 2);
  if (collapsedCount === 1) return Math.round(BOTTOM_PANEL_MIN_HEIGHT * 0.75);
  if (collapsedCount >= 2) return Math.round(BOTTOM_PANEL_MIN_HEIGHT * 0.5);
  return BOTTOM_PANEL_MIN_HEIGHT;
});

function getSafeLocalStorage() {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

function persistWorkbenchLayout() {
  const storage = getSafeLocalStorage();
  if (!storage) return;

  storage.setItem(
    TIMELINE_LAYOUT_KEY,
    JSON.stringify({
      leftPanelWidth: Math.round(leftPanelWidth.value),
      rightPanelWidth: Math.round(rightPanelWidth.value),
      bottomPanelHeight: Math.round(bottomPanelHeight.value),
      isLeftPanelCollapsed: isLeftPanelCollapsed.value,
      isRightPanelCollapsed: isRightPanelCollapsed.value,
      isBottomPanelCollapsed: isBottomPanelCollapsed.value,
      rightPanelTool: rightPanelTool.value,
      leftBottomTool: leftBottomTool.value,
    }),
  );
}

function restoreWorkbenchLayout() {
  const storage = getSafeLocalStorage();
  if (!storage) return;

  try {
    const raw = storage.getItem(TIMELINE_LAYOUT_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (Number.isFinite(parsed.leftPanelWidth)) {
      leftPanelWidth.value = clamp(parsed.leftPanelWidth, LEFT_PANEL_MIN_WIDTH, PANEL_MAX_WIDTH);
    }
    if (Number.isFinite(parsed.rightPanelWidth)) {
      rightPanelWidth.value = clamp(parsed.rightPanelWidth, RIGHT_PANEL_MIN_WIDTH, PANEL_MAX_WIDTH);
    }
    if (Number.isFinite(parsed.bottomPanelHeight)) {
      bottomPanelHeight.value = Math.max(0, parsed.bottomPanelHeight);
    }
    isLeftPanelCollapsed.value = parsed.isLeftPanelCollapsed === true;
    isRightPanelCollapsed.value = parsed.isRightPanelCollapsed === true;
    isBottomPanelCollapsed.value = parsed.isBottomPanelCollapsed === true;
    rightPanelTool.value = parsed.rightPanelTool === 'battleLog' ? 'battleLog' : 'inspector';
    leftBottomTool.value =
      parsed.leftBottomTool === 'contract' || parsed.leftBottomTool === 'global'
        ? parsed.leftBottomTool
        : 'enemy';
  } catch (error) {
    console.error(error);
  }
}

function resetWorkbenchLayout(target = 'all') {
  if (target === 'all' || target === 'left') {
    leftPanelWidth.value = DEFAULT_LEFT_PANEL_WIDTH;
    isLeftPanelCollapsed.value = false;
  }
  if (target === 'all' || target === 'right') {
    rightPanelWidth.value = DEFAULT_RIGHT_PANEL_WIDTH;
    isRightPanelCollapsed.value = false;
    rightPanelTool.value = 'inspector';
  }
  if (target === 'all' || target === 'bottom') {
    bottomPanelHeight.value = DEFAULT_BOTTOM_PANEL_HEIGHT;
    isBottomPanelCollapsed.value = false;
    leftBottomTool.value = 'enemy';
  }
  persistWorkbenchLayout();
}

function toggleWorkbenchPanel(target) {
  if (target === 'left') {
    isLeftPanelCollapsed.value = !isLeftPanelCollapsed.value;
  } else if (target === 'right') {
    isRightPanelCollapsed.value = !isRightPanelCollapsed.value;
  } else if (target === 'bottom') {
    if (isBottomPanelCollapsed.value) {
      resourceMonitorExpandAllToken.value += 1;
      isBottomPanelCollapsed.value = false;
    } else {
      isBottomPanelCollapsed.value = true;
    }
  }
  persistWorkbenchLayout();
}

function toggleRightTool(tool) {
  const nextTool = tool === 'battleLog' ? 'battleLog' : 'inspector';

  if (isRightPanelCollapsed.value) {
    rightPanelTool.value = nextTool;
    isRightPanelCollapsed.value = false;
    persistWorkbenchLayout();
    return;
  }

  if (rightPanelTool.value === nextTool) {
    isRightPanelCollapsed.value = true;
    persistWorkbenchLayout();
    return;
  }

  rightPanelTool.value = nextTool;
  persistWorkbenchLayout();
}

function beginWorkbenchResize(type, event) {
  event.preventDefault();
  activeWorkbenchDrag.value = type;
  workbenchDragState = {
    startX: event.clientX,
    startY: event.clientY,
    leftPanelWidth: leftPanelWidth.value,
    rightPanelWidth: rightPanelWidth.value,
    bottomPanelHeight: bottomPanelHeight.value,
  };
  document.body.style.userSelect = 'none';
  document.body.style.cursor = type === 'bottom' ? 'ns-resize' : 'ew-resize';
  window.addEventListener('pointermove', onWorkbenchResizeMove);
  window.addEventListener('pointerup', endWorkbenchResize);
}

function applyWorkbenchResize(event) {
  if (!activeWorkbenchDrag.value || !workbenchDragState) return;

  if (activeWorkbenchDrag.value === 'left' || activeWorkbenchDrag.value === 'right') {
    const rect = appLayoutRef.value?.getBoundingClientRect();
    if (!rect) return;

    const availableWidth = rect.width - TIMELINE_MAIN_MIN_WIDTH;

    if (activeWorkbenchDrag.value === 'left') {
      const maxPanelWidth = clamp(
        Math.floor(availableWidth / 2),
        LEFT_PANEL_MIN_WIDTH,
        PANEL_MAX_WIDTH,
      );
      const nextWidth =
        workbenchDragState.leftPanelWidth + (event.clientX - workbenchDragState.startX);
      leftPanelWidth.value = clamp(nextWidth, LEFT_PANEL_MIN_WIDTH, maxPanelWidth);
      return;
    }

    const maxPanelWidth = clamp(
      Math.floor(availableWidth / 2),
      RIGHT_PANEL_MIN_WIDTH,
      PANEL_MAX_WIDTH,
    );
    const nextWidth =
      workbenchDragState.rightPanelWidth - (event.clientX - workbenchDragState.startX);
    rightPanelWidth.value = clamp(nextWidth, RIGHT_PANEL_MIN_WIDTH, maxPanelWidth);
    return;
  }

  const rect = timelineWorkspaceRef.value?.getBoundingClientRect();
  if (!rect) return;

  const maxBottomHeight = getMaxBottomPanelHeight(rect.height);
  const minBottomHeight = Math.min(bottomPanelMinHeight.value, maxBottomHeight);
  const nextHeight =
    workbenchDragState.bottomPanelHeight - (event.clientY - workbenchDragState.startY);
  bottomPanelHeight.value = clamp(nextHeight, minBottomHeight, maxBottomHeight);
}

function onWorkbenchResizeMove(event) {
  applyWorkbenchResize(event);
}

function endWorkbenchResize() {
  workbenchDragState = null;
  activeWorkbenchDrag.value = null;
  document.body.style.userSelect = '';
  document.body.style.cursor = '';
  window.removeEventListener('pointermove', onWorkbenchResizeMove);
  window.removeEventListener('pointerup', endWorkbenchResize);
  persistWorkbenchLayout();
}

const appLayoutStyle = computed(() => ({
  gridTemplateColumns: `${ACTIVITY_BAR_WIDTH}px ${isLeftPanelCollapsed.value ? 0 : leftPanelWidth.value}px ${isLeftPanelCollapsed.value ? 0 : 1}px minmax(${TIMELINE_MAIN_MIN_WIDTH}px, 1fr) ${!RIGHT_TOOLS_VISIBLE || isRightPanelCollapsed.value ? 0 : 1}px ${!RIGHT_TOOLS_VISIBLE || isRightPanelCollapsed.value ? 0 : rightPanelWidth.value}px ${RIGHT_TOOLS_VISIBLE ? ACTIVITY_BAR_WIDTH : 0}px`,
}));

const effectiveBottomPanelHeight = computed(() => {
  if (isBottomPanelCollapsed.value) return 0;
  const maxBottomHeight = getMaxBottomPanelHeight();
  const minBottomHeight = Math.min(bottomPanelMinHeight.value, maxBottomHeight);
  return Math.round(clamp(bottomPanelHeight.value, minBottomHeight, maxBottomHeight));
});

function handleResourceMonitorSectionCollapseChange(count) {
  resourceMonitorCollapsedCount.value = Math.min(Math.max(Number(count) || 0, 0), 2);
}

const timelineWorkspaceStyle = computed(() => ({
  gridTemplateRows: `minmax(${TIMELINE_MAIN_MIN_HEIGHT}px, 1fr) ${isBottomPanelCollapsed.value ? 0 : BOTTOM_RESIZER_HEIGHT}px ${effectiveBottomPanelHeight.value}px`,
}));

const leftPanelStackStyle = computed(() => ({
  gridTemplateRows: isBottomPanelCollapsed.value
    ? 'minmax(0, 1fr)'
    : `minmax(0, 1fr) ${BOTTOM_RESIZER_HEIGHT}px ${effectiveBottomPanelHeight.value}px`,
}));

function toggleBottomTool(tool = 'enemy') {
  const nextTool = tool === 'contract' || tool === 'global' ? tool : 'enemy';

  if (isBottomPanelCollapsed.value) {
    leftBottomTool.value = nextTool;
    resourceMonitorExpandAllToken.value += 1;
    isBottomPanelCollapsed.value = false;
    persistWorkbenchLayout();
    return;
  }

  if (leftBottomTool.value === nextTool) {
    isBottomPanelCollapsed.value = true;
    persistWorkbenchLayout();
    return;
  }

  leftBottomTool.value = nextTool;
  persistWorkbenchLayout();
}

function toggleActivityPanel(target) {
  if (target === 'library') {
    isLeftPanelCollapsed.value = !isLeftPanelCollapsed.value;
  } else if (target === 'bottom') {
    toggleBottomTool('enemy');
    return;
  }
  persistWorkbenchLayout();
}

function closeBottomPanelFromResourceMonitor() {
  isBottomPanelCollapsed.value = true;
  persistWorkbenchLayout();
}

// === 方案管理逻辑 ===
const editingScenarioId = ref(null);
const renameInputRef = ref(null);

const currentScenario = computed(() => {
  return store.scenarioList.find(s => s.id === store.activeScenarioId) || store.scenarioList[0];
});

const formatIndex = index => {
  return (index + 1).toString().padStart(2, '0');
};

function startRenameCurrent() {
  if (!currentScenario.value) return;
  editingScenarioId.value = currentScenario.value.id;
  nextTick(() => {
    if (renameInputRef.value) {
      renameInputRef.value.focus();
      renameInputRef.value.select();
    }
  });
}

function finishRename() {
  editingScenarioId.value = null;
}

function handleDeleteCurrent() {
  if (!currentScenario.value) return;
  handleDeleteScenario(currentScenario.value.id);
}

function handleDeleteScenario(id) {
  ElMessageBox.confirm(t('timeline.scenario.deleteConfirm'), t('timeline.scenario.deleteTitle'), {
    confirmButtonText: t('common.delete'),
    cancelButtonText: t('common.cancel'),
    type: 'warning',
  })
    .then(() => {
      store.deleteScenario(id);
      ElMessage.success(t('timeline.scenario.deleted'));
    })
    .catch(() => {});
}

function handleDuplicateCurrent() {
  if (!currentScenario.value) return;
  if (store.scenarioList.length >= store.MAX_SCENARIOS) {
    ElMessage.warning(t('timeline.scenario.limit', { max: store.MAX_SCENARIOS }));
    return;
  }
  store.duplicateScenario(currentScenario.value.id);
  ElMessage.success(t('timeline.scenario.duplicated'));
}

function handleAddScenario() {
  if (store.scenarioList.length >= store.MAX_SCENARIOS) {
    ElMessage.warning(t('timeline.scenario.limit', { max: store.MAX_SCENARIOS }));
    return;
  }
  store.addScenario();
}

// === 滚动遮罩逻辑 ===
const tabsGroupRef = ref(null);
const tabsMaskStyle = ref({});

function updateScrollMask() {
  const el = tabsGroupRef.value;
  if (!el) return;

  const tolerance = 2;
  const isAtStart = el.scrollLeft <= tolerance;
  const isAtEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - tolerance;
  const isNoScroll = el.scrollWidth <= el.clientWidth;

  if (isNoScroll) {
    tabsMaskStyle.value = { maskImage: 'none', WebkitMaskImage: 'none' };
    return;
  }

  const startStr = isAtStart ? 'black 0%' : 'transparent 0px, black 20px';
  const endStr = isAtEnd ? 'black 100%' : 'black calc(100% - 20px), transparent 100%';

  const gradient = `linear-gradient(to right, ${startStr}, ${endStr})`;

  tabsMaskStyle.value = {
    maskImage: gradient,
    WebkitMaskImage: gradient,
  };
}

watch(
  () => store.scenarioList.length,
  async () => {
    await nextTick();
    updateScrollMask();
  },
);

onMounted(() => {
  restoreWorkbenchLayout();
  window.addEventListener('keydown', handleGlobalKeydown, true);
  window.addEventListener('resize', updateScrollMask); // 窗口缩放时重算
  nextTick(() => updateScrollMask());
});

onUnmounted(() => {
  endWorkbenchResize();
  window.removeEventListener('keydown', handleGlobalKeydown, true);
  window.removeEventListener('resize', updateScrollMask);
});

// === 文件导入相关 ===
const fileInputRef = ref(null);

function triggerImport() {
  if (fileInputRef.value) fileInputRef.value.click();
}

async function processFile(file) {
  if (!file) return;

  try {
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (fileExtension === 'png') {
      const metadata = await readMetadataFromPng(file, 'EndaxisData');
      if (metadata) {
        const success = await store.importShareString(metadata);
        if (success) {
          ElMessage.success(t('timeline.import.pngSuccess'));
          return true;
        }
      }
      ElMessage.warning(t('timeline.import.pngNoData'));
    } else {
      const success = await store.importProject(file);
      if (success) {
        ElMessage.success(t('timeline.import.projectLoaded'));
        return true;
      }
    }
  } catch (e) {
    ElMessage.error(t('timeline.import.failed', { msg: e.message }));
  }
  return false;
}

async function onFileSelected(event) {
  const file = event.target.files[0];
  await processFile(file);
  event.target.value = '';
}

// === 拖拽导入逻辑 ===
const isDragging = ref(false);
const isInternalDrag = ref(false);
let dragCounter = 0;
const moreMenuOpen = ref(false);
const shortcutsDialogVisible = ref(false);

const hasOperatorTracks = computed(() => store.teamTracksInfo.some(track => track.id));

function closeMoreMenu() {
  moreMenuOpen.value = false;
}

function openShortcutsFromMore() {
  closeMoreMenu();
  shortcutsDialogVisible.value = true;
}

function runMoreProjectAction(action) {
  closeMoreMenu();
  if (action === 'load') triggerImport();
  else if (action === 'receive') openImportShareDialog();
  else if (action === 'reset') handleReset();
}

function selectLocaleFromMore(next) {
  if (locale.value === next) return;
  setLocale(next);
}

function selectAppearanceFromMore(next) {
  if (next !== 'light' && next !== 'dark') return;
  if (appearance.value === next) return;
  setAppearance(next);
}

const shortcutHelpSections = computed(() => {
  locale.value;
  return [
    {
      title: t('timeline.shortcuts.sections.tracksSkills'),
      items: [
        { keys: 'F1 – F4', desc: t('timeline.shortcuts.items.selectTrack') },
        { keys: 'Tab / Shift + Tab', desc: t('timeline.shortcuts.items.cycleOperatorTrack') },
        {
          keys: '1',
          desc: t('timeline.shortcuts.items.placeSkill', {
            skill: t('hitEditor.skillTypes.basicAttack'),
          }),
        },
        {
          keys: '2',
          desc: t('timeline.shortcuts.items.placeSkill', {
            skill: t('hitEditor.skillTypes.battleSkill'),
          }),
        },
        {
          keys: '3',
          desc: t('timeline.shortcuts.items.placeSkill', {
            skill: t('hitEditor.skillTypes.comboSkill'),
          }),
        },
        {
          keys: '4',
          desc: t('timeline.shortcuts.items.placeSkill', {
            skill: t('hitEditor.skillTypes.ultimate'),
          }),
        },
        {
          keys: '5',
          desc: t('timeline.shortcuts.items.placeSkill', {
            skill: t('hitEditor.skillTypes.dive'),
          }),
        },
        {
          keys: '6',
          desc: t('timeline.shortcuts.items.placeSkill', {
            skill: t('hitEditor.skillTypes.finisher'),
          }),
        },
        {
          keys: t('timeline.shortcuts.keys.cancelPlace'),
          desc: t('timeline.shortcuts.items.cancelPlace'),
        },
      ],
    },
    {
      title: t('timeline.shortcuts.sections.edit'),
      items: [
        { keys: t('timeline.shortcuts.keys.undo'), desc: t('timeline.shortcuts.items.undo') },
        { keys: t('timeline.shortcuts.keys.redo'), desc: t('timeline.shortcuts.items.redo') },
        { keys: t('timeline.shortcuts.keys.copy'), desc: t('timeline.shortcuts.items.copy') },
        { keys: t('timeline.shortcuts.keys.paste'), desc: t('timeline.shortcuts.items.paste') },
        { keys: t('timeline.shortcuts.keys.delete'), desc: t('timeline.shortcuts.items.delete') },
        {
          keys: t('timeline.shortcuts.keys.nudgeLeft'),
          desc: t('timeline.shortcuts.items.nudgeLeft'),
        },
        {
          keys: t('timeline.shortcuts.keys.nudgeRight'),
          desc: t('timeline.shortcuts.items.nudgeRight'),
        },
      ],
    },
    {
      title: t('timeline.shortcuts.sections.tools'),
      items: [
        {
          keys: t('timeline.shortcuts.keys.cursorGuide'),
          desc: t('timeline.shortcuts.items.cursorGuide'),
        },
        {
          keys: t('timeline.shortcuts.keys.boxSelect'),
          desc: t('timeline.shortcuts.items.boxSelect'),
        },
        {
          keys: t('timeline.shortcuts.keys.multiSelect'),
          desc: t('timeline.shortcuts.items.multiSelect'),
        },
        {
          keys: t('timeline.shortcuts.keys.panTimeline'),
          desc: t('timeline.shortcuts.items.panTimeline'),
        },
        {
          keys: t('timeline.shortcuts.keys.snapPrecision'),
          desc: t('timeline.shortcuts.items.snapPrecision'),
        },
        {
          keys: t('timeline.shortcuts.keys.connectionTool'),
          desc: t('timeline.shortcuts.items.connectionTool'),
        },
        {
          keys: t('timeline.shortcuts.keys.snapToAction'),
          desc: t('timeline.shortcuts.items.snapToAction'),
        },
        {
          keys: t('timeline.shortcuts.keys.alignToAction'),
          desc: t('timeline.shortcuts.items.alignToAction'),
        },
      ],
    },
  ];
});

function hasFiles(e) {
  if (isInternalDrag.value) return false;
  return (
    e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')
  );
}

// 区分内部拖拽和外部拖拽
function onGlobalDragStart(e) {
  isInternalDrag.value = true;
}

function onGlobalDragEnd(e) {
  isInternalDrag.value = false;
}

function handleWindowDragEnter(e) {
  if (!hasFiles(e)) return;
  e.preventDefault();
  dragCounter++;
  if (dragCounter === 1) {
    isDragging.value = true;
  }
}

function handleWindowDragLeave(e) {
  if (!hasFiles(e)) return;
  e.preventDefault();
  dragCounter--;
  if (dragCounter === 0) {
    isDragging.value = false;
  }
}

function handleWindowDragOver(e) {
  if (!hasFiles(e)) return;
  e.preventDefault();
}

async function handleWindowDrop(e) {
  if (!hasFiles(e)) return;
  e.preventDefault();
  dragCounter = 0;
  isDragging.value = false;

  const file = e.dataTransfer?.files[0];
  if (file) {
    await processFile(file);
  }
}

// === 导出长图相关 ===
const exportDialogVisible = ref(false);
const exportForm = ref({ filename: '', duration: 60 });
const smallImageExportVisible = ref(false);

function openExportDialog() {
  const dateStr = new Date().toISOString().slice(0, 10);
  exportForm.value.filename = `Endaxis_Timeline_${dateStr}`;
  exportForm.value.duration = 60;
  exportDialogVisible.value = true;
}

const exportDurationMax = computed(() =>
  Math.max(10, Math.round(Number(store.TOTAL_DURATION) || 120)),
);

function openSmallImageExport() {
  const dateStr = new Date().toISOString().slice(0, 10);
  const current = String(exportForm.value.filename || '').trim();
  if (!current || /^Endaxis_Timeline_/i.test(current)) {
    exportForm.value.filename = `Endaxis_Card_${dateStr}`;
  }
  exportDialogVisible.value = false;
  smallImageExportVisible.value = true;
}

function handleExportJson() {
  let rawFilename = exportForm.value.filename || 'Endaxis_Export';
  rawFilename = rawFilename.trim();
  if (rawFilename.toLowerCase().endsWith('.png')) {
    rawFilename = rawFilename.slice(0, -4);
  }
  if (!rawFilename) {
    rawFilename = 'Endaxis_Export';
  }
  let userFilename = rawFilename;
  if (!userFilename.toLowerCase().endsWith('.json')) {
    userFilename += '.json';
  }
  store.exportProject({ filename: userFilename });
}

async function processExport() {
  exportDialogVisible.value = false;
  const userDuration = exportForm.value.duration;
  let rawFilename = exportForm.value.filename || 'Endaxis_Export';
  let userFilename = rawFilename;
  if (!userFilename.toLowerCase().endsWith('.png')) userFilename += '.png';

  const durationSeconds = userDuration;
  const pixelsPerSecond = store.timeBlockWidth;
  const sidebarWidth = 180;
  const rightMargin = 50;

  const contentWidth = durationSeconds * pixelsPerSecond;
  const totalWidth = sidebarWidth + contentWidth + rightMargin;

  const loading = ElLoading.service({
    lock: true,
    text: t('timeline.export.rendering', { seconds: durationSeconds }),
    background: 'rgba(0, 0, 0, 0.9)',
  });

  const originalShift = store.timelineShift;
  const originalScrollTop = store.timelineScrollTop;

  const timelineMain = document.querySelector('.timeline-main');
  const workspaceEl = document.querySelector('.timeline-workspace');
  const timelineGridContainer = document.querySelector('.timeline-grid-container');
  const gridLayout = document.querySelector('.timeline-grid-layout');
  const tracksViewport = document.querySelector('.tracks-content-viewport');
  const tracksScroller = document.querySelector('.tracks-content-scroller');
  const tracksHeader = document.querySelector('.tracks-header-sticky');
  const timeRuler = document.querySelector('.time-ruler-wrapper');
  const bottomResizer = document.querySelector('.workbench-resizer--bottom');
  const bottomPanel = document.querySelector('.resource-monitor-panel');
  const scrollers = document.querySelectorAll(
    '.tracks-content-viewport, .tracks-content-scroller, .chart-scroll-wrapper, .timeline-grid-container',
  );
  const tracksContent = document.querySelector('.tracks-content');
  const settingsScrollArea = document.querySelector('.settings-scroll-area');
  const mainPaths = document.querySelectorAll('path.main-path');
  const pathHoverZones = document.querySelectorAll('path.hover-zone');

  const styleMap = new Map();
  const scrollMap = new Map();
  const backupStyle = el => {
    if (el) styleMap.set(el, el.style.cssText);
  };
  const backupScroll = el => {
    if (el) scrollMap.set(el, { left: el.scrollLeft, top: el.scrollTop });
  };
  backupStyle(workspaceEl);
  backupStyle(timelineMain);
  backupStyle(timelineGridContainer);
  backupStyle(gridLayout);
  backupStyle(tracksViewport);
  backupStyle(tracksScroller);
  backupStyle(tracksHeader);
  backupStyle(timeRuler);
  backupStyle(bottomResizer);
  backupStyle(bottomPanel);
  backupStyle(tracksContent);
  backupStyle(settingsScrollArea);
  scrollers.forEach(el => backupStyle(el));
  scrollers.forEach(el => backupScroll(el));
  backupScroll(tracksHeader);
  mainPaths.forEach(el => backupStyle(el));
  pathHoverZones.forEach(el => backupStyle(el));

  try {
    if (!workspaceEl) throw new Error('timeline workspace missing');

    store.setTimelineShift(0);
    store.setIsCapturing(true);
    document.body.classList.add('capture-mode');
    scrollers.forEach(el => {
      el.scrollLeft = 0;
      el.scrollTop = 0;
    });
    if (tracksHeader) tracksHeader.scrollTop = 0;
    store.setScrollTop(0);

    watermarkSubText.value = rawFilename.replace(/\.png$/i, '');
    if (watermarkEl.value) {
      watermarkEl.value.style.display = 'block';
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    if (timelineMain) {
      timelineMain.style.width = `${totalWidth}px`;
      timelineMain.style.overflow = 'visible';
    }
    if (workspaceEl) {
      workspaceEl.style.width = `${totalWidth}px`;
      workspaceEl.style.overflow = 'visible';
    }
    if (gridLayout) {
      gridLayout.style.width = `${totalWidth}px`;
      gridLayout.style.display = 'grid';
      gridLayout.style.gridTemplateColumns = `${sidebarWidth}px ${contentWidth + rightMargin}px`;
      gridLayout.style.overflow = 'visible';
    }
    scrollers.forEach(el => {
      el.style.width = '100%';
      el.style.overflow = 'visible';
      el.style.maxWidth = 'none';
    });

    if (tracksContent) {
      tracksContent.style.width = `${contentWidth}px`;
      tracksContent.style.minWidth = `${contentWidth}px`;
      const svgs = tracksContent.querySelectorAll('svg');
      svgs.forEach(svg => {
        svg.style.width = `${contentWidth}px`;
        svg.setAttribute('width', contentWidth);
      });
    }

    if (settingsScrollArea) {
      settingsScrollArea.style.overflow = 'visible';
    }

    await nextTick();
    await new Promise(resolve => requestAnimationFrame(resolve));

    const rulerHeight = Math.max(
      1,
      Math.ceil(timeRuler?.getBoundingClientRect?.().height || timeRuler?.offsetHeight || 0),
    );
    const tracksFullHeight = Math.max(
      Math.ceil(tracksViewport?.scrollHeight || 0),
      Math.ceil(tracksScroller?.scrollHeight || 0),
      Math.ceil(tracksScroller?.offsetHeight || 0),
      Math.ceil(tracksViewport?.offsetHeight || 0),
    );
    const gridFullHeight = rulerHeight + tracksFullHeight;
    if (Number.isFinite(gridFullHeight) && gridFullHeight > 0) {
      if (gridLayout) {
        gridLayout.style.height = `${gridFullHeight}px`;
        gridLayout.style.minHeight = `${gridFullHeight}px`;
        gridLayout.style.gridTemplateRows = `${rulerHeight}px ${tracksFullHeight}px`;
      }
      if (timelineGridContainer) {
        timelineGridContainer.style.height = `${gridFullHeight}px`;
        timelineGridContainer.style.minHeight = `${gridFullHeight}px`;
      }
      if (tracksViewport) {
        tracksViewport.style.height = `${tracksFullHeight}px`;
        tracksViewport.style.minHeight = `${tracksFullHeight}px`;
        tracksViewport.style.overflow = 'visible';
      }
      if (tracksHeader) {
        tracksHeader.style.height = `${tracksFullHeight}px`;
        tracksHeader.style.minHeight = `${tracksFullHeight}px`;
        tracksHeader.style.overflow = 'visible';
      }
      if (workspaceEl) {
        const bottomResizerHeight = Math.ceil(bottomResizer?.offsetHeight || 0);
        const bottomPanelHeight = Math.ceil(
          bottomPanel?.scrollHeight || bottomPanel?.offsetHeight || 0,
        );
        const workspaceFullHeight = gridFullHeight + bottomResizerHeight + bottomPanelHeight;
        workspaceEl.style.height = `${workspaceFullHeight}px`;
        workspaceEl.style.minHeight = `${workspaceFullHeight}px`;
        workspaceEl.style.gridTemplateRows = `${gridFullHeight}px ${bottomResizerHeight}px ${bottomPanelHeight}px`;
      }
    }

    mainPaths.forEach(path => {
      const computed = window.getComputedStyle(path);
      path.style.strokeDasharray = computed.strokeDasharray;
      path.style.stroke = computed.stroke;
      path.style.strokeWidth = computed.strokeWidth;
    });

    pathHoverZones.forEach(path => {
      path.style.display = 'none';
    });

    await new Promise(resolve => setTimeout(resolve, 400));
    const captureHeight = Math.max(
      1,
      Math.ceil(workspaceEl.scrollHeight || workspaceEl.getBoundingClientRect().height || 0) + 20,
    );

    const capture = await snapdom(workspaceEl, {
      scale: 1.5,
      width: totalWidth,
      height: captureHeight,
    });

    const captureBlob = await capture.toBlob({ type: 'png', dpr: 1 });

    let pngBlob = captureBlob;

    try {
      // 仅包含当前截图的方案数据
      const shareString = await store.exportShareString({
        includeScenarios: store.activeScenarioId,
      });
      // 写入元数据失败不阻止导出
      pngBlob = await addMetadataToPng(captureBlob, 'EndaxisData', shareString);
    } catch (error) {
      console.error(error);
    }

    const link = document.createElement('a');
    link.href = URL.createObjectURL(pngBlob);
    link.download = userFilename;
    link.click();
    URL.revokeObjectURL(link.href);

    ElMessage.success(t('timeline.export.imageExported', { filename: userFilename }));
  } catch (error) {
    console.error(error);
    ElMessage.error(t('timeline.export.failed', { msg: error.message }));
  } finally {
    document.body.classList.remove('capture-mode');
    store.setIsCapturing(false);
    styleMap.forEach((cssText, el) => (el.style.cssText = cssText));
    scrollMap.forEach((position, el) => {
      el.scrollLeft = position.left;
      el.scrollTop = position.top;
    });
    if (watermarkEl.value) {
      watermarkEl.value.style.display = 'none';
    }
    store.setScrollTop(originalScrollTop);
    store.setTimelineShift(originalShift);
    loading.close();
  }
}

// === 重置与快捷键 ===
function handleReset() {
  ElMessageBox.confirm(t('timeline.reset.confirm'), t('common.warning'), {
    confirmButtonText: t('timeline.reset.confirmButton'),
    cancelButtonText: t('common.cancel'),
    type: 'warning',
  })
    .then(() => {
      store.resetProject();
      ElMessage.success(t('timeline.reset.done'));
    })
    .catch(() => {});
}

// === 接收数据码逻辑 ===
const importShareDialogVisible = ref(false);
const shareCodeInput = ref('');

function openImportShareDialog() {
  shareCodeInput.value = ''; // 清空输入框
  importShareDialogVisible.value = true;
}

async function handleImportShare() {
  const success = await importFromCode(shareCodeInput.value);
  if (success) {
    importShareDialogVisible.value = false;
    shareCodeInput.value = ''; // 成功后清空
  }
}

function claimShortcutEvent(e) {
  e.preventDefault();
  e.stopPropagation();
  if (typeof e.stopImmediatePropagation === 'function') {
    e.stopImmediatePropagation();
  }
}

function handleGlobalKeydown(e) {
  if (isEditableShortcutTarget(e.target) || isTimelineShortcutScopeBlocked()) return;

  if (e.key === 'Escape' && store.isLibraryPlaceMode) {
    claimShortcutEvent(e);
    store.cancelLibraryPlace();
    ElMessage.info({ message: t('timeline.shortcut.placeCancelled'), duration: 800 });
    return;
  }

  if (e.key === 'Tab' && !e.altKey && !e.ctrlKey && !e.metaKey) {
    claimShortcutEvent(e);
    handleLibraryTrackCycleHotkey(e.shiftKey ? -1 : 1);
    return;
  }

  if (!isLeftPanelCollapsed.value && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
    const trackIndex = getTrackIndexFromHotkeyEvent(e);
    if (trackIndex !== null) {
      claimShortcutEvent(e);
      handleLibraryTrackHotkey(trackIndex);
      return;
    }

    const skillType = getLibrarySkillTypeFromHotkeyCode(e.code);
    if (skillType) {
      claimShortcutEvent(e);
      handleLibrarySkillHotkey(skillType);
      return;
    }
  }

  if (e.ctrlKey && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
    claimShortcutEvent(e);
    store.undo();
    ElMessage.info({ message: t('timeline.shortcut.undo'), duration: 800 });
    return;
  }
  if (
    (e.ctrlKey && (e.key === 'y' || e.key === 'Y')) ||
    (e.ctrlKey && e.shiftKey && (e.key === 'z' || e.key === 'Z'))
  ) {
    claimShortcutEvent(e);
    store.redo();
    ElMessage.info({ message: t('timeline.shortcut.redo'), duration: 800 });
    return;
  }
  if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
    claimShortcutEvent(e);
    store.copySelection();
    ElMessage.success({ message: t('timeline.shortcut.copied'), duration: 800 });
    return;
  }
  if (e.ctrlKey && (e.key === 'v' || e.key === 'V')) {
    claimShortcutEvent(e);
    store.pasteSelection();
    ElMessage.success({ message: t('timeline.shortcut.pasted'), duration: 800 });
    return;
  }
  if (e.ctrlKey && (e.key === 'g' || e.key === 'G')) {
    claimShortcutEvent(e);
    store.toggleCursorGuide();
    ElMessage.info({
      message: store.showCursorGuide
        ? t('timeline.shortcut.cursorGuideOn')
        : t('timeline.shortcut.cursorGuideOff'),
      duration: 1500,
    });
    return;
  }
  if (e.ctrlKey && (e.key === 'b' || e.key === 'B')) {
    claimShortcutEvent(e);
    store.toggleBoxSelectMode();
    ElMessage.info({
      message: store.isBoxSelectMode
        ? t('timeline.shortcut.boxSelectOn')
        : t('timeline.shortcut.boxSelectOff'),
      duration: 1500,
    });
    return;
  }
  if (e.altKey && (e.key === 's' || e.key === 'S')) {
    claimShortcutEvent(e);
    store.toggleSnapStep();
    const mode =
      store.snapStep < 0.05
        ? t('timeline.shortcut.snapModeFrame')
        : t('timeline.shortcut.snapMode01');
    ElMessage.info({ message: t('timeline.shortcut.snapPrecision', { mode }), duration: 1000 });
    return;
  }
  if (e.altKey && (e.key === 'l' || e.key === 'L')) {
    claimShortcutEvent(e);
    store.toggleConnectionTool();
    ElMessage.info({
      message: t('timeline.shortcut.connectionTool', {
        state: store.enableConnectionTool ? t('common.on') : t('common.off'),
      }),
      duration: 1000,
    });
    return;
  }
}

function getPlaceSkillThemeColor(skill) {
  if (skill.customColor) return skill.customColor;
  if (skill.type === 'comboSkill') return store.getColor('link');
  if (skill.type === 'finisher') return store.getColor('execution');
  if (skill.type === 'basicAttack') return store.getColor('attack');
  if (skill.type === 'dive') return store.getColor('dodge');
  if (skill.type === 'battleSkill')
    return skill.element ? store.getColor(skill.element) : store.getColor('skill');
  if (skill.type === 'ultimate')
    return skill.element ? store.getColor(skill.element) : store.getColor('ultimate');
  if (skill.element) return store.getColor(skill.element);
  return store.getColor('default');
}

function handleLibraryTrackHotkey(trackIndex) {
  if (trackIndex < 0 || trackIndex >= store.tracks.length) return;
  const track = store.tracks[trackIndex];
  store.selectTrack(trackIndex);
  if (!track?.id) {
    timelineGridRef.value?.openCharacterSelector(trackIndex);
  }
}

function isTimelineShortcutScopeBlocked() {
  // 临时方案：当前由页面聚合弹窗状态来保护全局快捷键。
  // 后续应抽成注册式 shortcut scope，由弹窗、编辑器、拖拽态统一注册当前作用域。
  return hasBlockedTimelineShortcutScope({
    hasOpenElementPlusDialog: hasVisibleElementPlusDialog(),
    hasOpenDialog:
      analysisDialogVisible.value ||
      shortcutsDialogVisible.value ||
      exportDialogVisible.value ||
      smallImageExportVisible.value ||
      importShareDialogVisible.value,
    hasTimelineGridDialog: Boolean(timelineGridRef.value?.hasOpenDialog?.()),
  });
}

function handleLibraryTrackCycleHotkey(direction) {
  const trackIndex = getCycledTrackIndex(
    store.activeTrackIndex,
    store.tracks.length,
    direction,
    index => Boolean(store.tracks[index]?.id),
  );
  if (trackIndex === null) {
    ElMessage.warning({ message: t('timeline.shortcut.cycleNeedsOperator'), duration: 1200 });
    return;
  }
  handleLibraryTrackHotkey(trackIndex);
}

function handleLibrarySkillHotkey(skillType) {
  const activeIndex = store.activeTrackIndex;
  if (activeIndex === null || activeIndex === undefined) {
    ElMessage.warning({ message: t('timeline.shortcut.placeNeedsTrack'), duration: 1200 });
    return;
  }
  const track = store.tracks[activeIndex];
  if (!track?.id) {
    ElMessage.warning({ message: t('timeline.shortcut.placeNeedsOperator'), duration: 1200 });
    timelineGridRef.value?.openCharacterSelector(activeIndex);
    return;
  }

  const skill = findLibrarySkillByType(store.activeSkillLibrary, skillType);
  if (!skill) {
    ElMessage.warning({ message: t('timeline.shortcut.placeSkillMissing'), duration: 1200 });
    return;
  }

  const offsets = getDefaultLibraryDragOffsets();
  store.beginLibraryPlace({ ...skill, ...offsets });
  ElMessage.info({ message: t('timeline.shortcut.placeReady'), duration: 1000 });
}

let lastLibraryPlaceClientX = 0;
let lastLibraryPlaceClientY = 0;

/** When the active track/operator changes mid-place, stick the matching skill from that library. */
function rematchLibraryPlaceSkillForActiveTrack() {
  if (!store.isLibraryPlaceMode || !store.draggingSkillData) return;

  const activeIndex = store.activeTrackIndex;
  if (activeIndex === null || activeIndex === undefined) return;
  const track = store.tracks[activeIndex];
  if (!track?.id) return;

  const previous = store.draggingSkillData;
  const next = findLibrarySkillForPlaceRematch(store.activeSkillLibrary, previous);
  if (!next) {
    store.cancelLibraryPlace();
    ElMessage.warning({ message: t('timeline.shortcut.placeSkillMissing'), duration: 1200 });
    return;
  }
  if (next.id && previous.id && next.id === previous.id) return;

  store.beginLibraryPlace({
    ...next,
    librarySource: previous.librarySource || 'character',
    weaponId: previous.weaponId ?? null,
    dragOffsetX: previous.dragOffsetX,
    dragOffsetY: previous.dragOffsetY,
  });

  if (lastLibraryPlaceClientX || lastLibraryPlaceClientY) {
    nextTick(() => {
      const skill = store.draggingSkillData;
      if (!skill) return;
      positionLibraryDragGhost(
        lastLibraryPlaceClientX,
        lastLibraryPlaceClientY,
        Number(skill.dragOffsetX) || 10,
        Number(skill.dragOffsetY) || 25,
      );
    });
  }
}

function onLibraryPlacePointerMove(e) {
  if (!store.isLibraryPlaceMode || !store.draggingSkillData) return;
  const skill = store.draggingSkillData;
  lastLibraryPlaceClientX = e.clientX;
  lastLibraryPlaceClientY = e.clientY;
  positionLibraryDragGhost(
    e.clientX,
    e.clientY,
    Number(skill.dragOffsetX) || 10,
    Number(skill.dragOffsetY) || 25,
  );
}

/**
 * Cancel on `contextmenu` (not pointerdown): ending place mode earlier would remove this
 * listener and let the app/browser context menu open on the same right-click.
 * Non-left place is already ignored in TimelineGrid `onTrackPlacePointer`.
 */
function onLibraryPlaceContextMenu(e) {
  if (!store.isLibraryPlaceMode) return;
  claimShortcutEvent(e);
  store.cancelLibraryPlace();
  ElMessage.info({ message: t('timeline.shortcut.placeCancelled'), duration: 800 });
}

let libraryPlaceCancelHintTimer = null;

function clearLibraryPlaceCancelHintTimer() {
  if (libraryPlaceCancelHintTimer != null) {
    clearTimeout(libraryPlaceCancelHintTimer);
    libraryPlaceCancelHintTimer = null;
  }
}

function scheduleLibraryPlaceCancelHint() {
  clearLibraryPlaceCancelHintTimer();
  libraryPlaceCancelHintTimer = setTimeout(() => {
    libraryPlaceCancelHintTimer = null;
    if (!store.isLibraryPlaceMode) return;
    attachLibraryDragGhostHint(t('timeline.shortcut.placeCancelHint'));
  }, LIBRARY_PLACE_CANCEL_HINT_DELAY_MS);
}

watch(
  () => ({
    enabled: store.isLibraryPlaceMode,
    skillId: store.draggingSkillData?.id ?? null,
  }),
  ({ enabled }) => {
    clearLibraryPlaceCancelHintTimer();
    window.removeEventListener('pointermove', onLibraryPlacePointerMove);
    window.removeEventListener('contextmenu', onLibraryPlaceContextMenu, true);
    removeLibraryDragGhost();
    if (!enabled) return;
    const skill = store.draggingSkillData;
    if (!skill) return;
    createLibraryDragGhost(skill, store.timeBlockWidth, getPlaceSkillThemeColor);
    if (lastLibraryPlaceClientX || lastLibraryPlaceClientY) {
      positionLibraryDragGhost(
        lastLibraryPlaceClientX,
        lastLibraryPlaceClientY,
        Number(skill.dragOffsetX) || 10,
        Number(skill.dragOffsetY) || 25,
      );
    }
    scheduleLibraryPlaceCancelHint();
    window.addEventListener('pointermove', onLibraryPlacePointerMove);
    window.addEventListener('contextmenu', onLibraryPlaceContextMenu, true);
  },
);

watch(
  () => ({
    enabled: store.isLibraryPlaceMode,
    trackId: store.activeTrackId,
    libraryKey: store.activeSkillLibrary
      .map(skill => `${skill?.id ?? ''}:${skill?.skillKey ?? ''}:${skill?.type ?? ''}`)
      .join('|'),
  }),
  ({ enabled }) => {
    if (!enabled) return;
    rematchLibraryPlaceSkillForActiveTrack();
  },
);

watch(isLeftPanelCollapsed, collapsed => {
  if (collapsed && store.isLibraryPlaceMode) {
    store.cancelLibraryPlace();
  }
});

onMounted(() => {
  nextTick(() => {
    updateTimelineWorkspaceMetrics();
    if (typeof ResizeObserver !== 'undefined' && timelineWorkspaceRef.value) {
      timelineWorkspaceResizeObserver = new ResizeObserver(() => {
        updateTimelineWorkspaceMetrics();
      });
      timelineWorkspaceResizeObserver.observe(timelineWorkspaceRef.value);
    }
  });

  window.addEventListener('dragstart', onGlobalDragStart, true);
  window.addEventListener('dragend', onGlobalDragEnd, true);

  window.addEventListener('dragenter', handleWindowDragEnter);
  window.addEventListener('dragleave', handleWindowDragLeave);
  window.addEventListener('dragover', handleWindowDragOver);
  window.addEventListener('drop', handleWindowDrop);
});

onUnmounted(() => {
  clearLibraryPlaceCancelHintTimer();
  window.removeEventListener('pointermove', onLibraryPlacePointerMove);
  window.removeEventListener('contextmenu', onLibraryPlaceContextMenu, true);
  if (store.isLibraryPlaceMode) {
    store.cancelLibraryPlace();
  } else {
    removeLibraryDragGhost();
  }
  if (timelineWorkspaceResizeObserver) {
    timelineWorkspaceResizeObserver.disconnect();
    timelineWorkspaceResizeObserver = null;
  }

  window.removeEventListener('dragstart', onGlobalDragStart, true);
  window.removeEventListener('dragend', onGlobalDragEnd, true);

  window.removeEventListener('dragenter', handleWindowDragEnter);
  window.removeEventListener('dragleave', handleWindowDragLeave);
  window.removeEventListener('dragover', handleWindowDragOver);
  window.removeEventListener('drop', handleWindowDrop);
});
</script>

<template>
  <LoadingTerminal v-if="store.isLoading" full-screen :message="t('timeline.loading')" scanner />

  <div
    v-if="!store.isLoading"
    ref="appLayoutRef"
    class="app-layout workbench-layout"
    :style="appLayoutStyle"
  >
    <aside class="activity-bar">
      <div class="activity-bar__group activity-bar__group--top">
        <button
          type="button"
          class="activity-bar__button activity-bar__button--lib"
          :class="{ 'is-active': !isLeftPanelCollapsed }"
          :aria-label="t('timeline.activityBar.library')"
          :data-tooltip="t('timeline.activityBar.library')"
          @click="toggleActivityPanel('library')"
        >
          <img
            class="activity-bar__image-icon activity-bar__image-icon--lib"
            src="/icons/btn_character.webp"
            alt=""
            aria-hidden="true"
          />
        </button>
      </div>
      <div class="activity-bar__group activity-bar__group--bottom">
        <button
          type="button"
          class="activity-bar__button activity-bar__button--global"
          :class="{ 'is-active': !isBottomPanelCollapsed && leftBottomTool === 'global' }"
          :aria-label="t('timeline.activityBar.globalConfig')"
          :data-tooltip="t('timeline.activityBar.globalConfig')"
          @click="toggleBottomTool('global')"
        >
          <img
            class="activity-bar__image-icon activity-bar__image-icon--global"
            src="/icons/setting_tab_setting.webp"
            alt=""
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          class="activity-bar__button activity-bar__button--contract"
          :class="{ 'is-active': !isBottomPanelCollapsed && leftBottomTool === 'contract' }"
          :aria-label="t('timeline.activityBar.contract')"
          :data-tooltip="t('timeline.activityBar.contract')"
          @click="toggleBottomTool('contract')"
        >
          <img
            class="activity-bar__image-icon activity-bar__image-icon--contract"
            src="/contingency_contract/deco_contract_028.webp"
            alt=""
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          class="activity-bar__button activity-bar__button--panel"
          :class="{ 'is-active': !isBottomPanelCollapsed && leftBottomTool === 'enemy' }"
          :aria-label="t('timeline.activityBar.resourceMonitor')"
          :data-tooltip="t('timeline.activityBar.resourceMonitor')"
          @click="toggleBottomTool('enemy')"
        >
          <svg
            class="activity-bar__icon activity-bar__icon--panel"
            viewBox="0 0 288 288"
            aria-hidden="true"
          >
            <defs>
              <mask id="enemyPanelMask">
                <rect width="288" height="288" fill="black" />

                <g fill="white">
                  <rect x="74" y="38" width="140" height="38" />
                  <circle cx="80" cy="131" r="40" />
                  <path d=" M40 89 H248 V194 H210 L192 214 V256 H96 V214 L78 194 H40 Z " />
                </g>

                <g fill="black">
                  <path d="M95 130 L117 152 L95 174 L73 152 Z" />
                  <path d="M193 130 L215 152 L193 174 L171 152 Z" />
                </g>
              </mask>
            </defs>

            <rect width="288" height="288" fill="currentColor" mask="url(#enemyPanelMask)" />
          </svg>
        </button>
      </div>
    </aside>

    <aside class="workbench-panel action-library-panel">
      <template v-if="!isLeftPanelCollapsed">
        <div class="workbench-panel__body action-library-stack" :style="leftPanelStackStyle">
          <div class="action-library-stack__main action-library">
            <ActionLibrary
              :on-reset-panel="() => resetWorkbenchLayout('left')"
              :on-collapse-panel="() => toggleWorkbenchPanel('left')"
            />
          </div>
          <div v-if="!isBottomPanelCollapsed" class="action-library-stack__divider"></div>
          <div
            v-if="!isBottomPanelCollapsed"
            class="action-library-stack__bottom"
            :class="{
              'is-contract': leftBottomTool === 'contract',
            }"
          >
            <EnemySettingsPanel v-if="leftBottomTool === 'enemy'" />
            <GlobalConfigSettingsPanel v-else-if="leftBottomTool === 'global'" />
            <div v-else class="contract-side-panel">
              <img
                src="/contingency_contract/1/deco_contingency_select_tag_3.webp"
                alt=""
                aria-hidden="true"
              />
              <div class="contract-side-title">{{ t('contingencyContract.operationName') }}</div>
            </div>
          </div>
        </div>
      </template>
    </aside>

    <div
      v-if="!isLeftPanelCollapsed"
      class="workbench-resizer workbench-resizer--vertical workbench-resizer--left"
      :class="{ 'is-active': activeWorkbenchDrag === 'left' }"
      @pointerdown="beginWorkbenchResize('left', $event)"
      @dblclick="resetWorkbenchLayout('left')"
    ></div>

    <main class="timeline-main">
      <header class="timeline-header" @click="store.selectTrack(null)">
        <div class="tech-scenario-bar">
          <div class="ts-header-group">
            <button
              class="ea-btn ea-btn--icon ea-btn--icon-24 ea-btn--ghost ea-btn--no-shrink"
              @click="startRenameCurrent"
              :title="t('timeline.scenario.renameTooltip')"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path
                  d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                />
              </svg>
            </button>

            <button
              class="ea-btn ea-btn--icon ea-btn--icon-24 ea-btn--ghost ea-btn--no-shrink"
              @click="handleDuplicateCurrent"
              :title="t('timeline.scenario.duplicateTooltip')"
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
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>

            <button
              v-if="store.scenarioList.length > 1"
              class="ea-btn ea-btn--icon ea-btn--icon-24 ea-btn--ghost ea-btn--hover-danger ea-btn--no-shrink"
              @click="handleDeleteCurrent"
              :title="t('timeline.scenario.deleteTooltip')"
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
              >
                <polyline points="3 6 5 6 21 6"></polyline>
                <path
                  d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                ></path>
              </svg>
            </button>

            <div class="ts-title-wrapper">
              <div class="ts-deco-bracket">[</div>
              <input
                v-if="editingScenarioId === currentScenario?.id"
                ref="renameInputRef"
                v-model="currentScenario.name"
                @blur="finishRename"
                @keydown.enter="finishRename"
                class="ts-title-input"
              />
              <span v-else class="ts-title-text" @dblclick="startRenameCurrent">
                {{ currentScenario?.name || t('timeline.scenario.unnamed') }}
              </span>
              <div class="ts-deco-bracket">]</div>
            </div>
          </div>

          <div
            class="ts-tabs-group"
            ref="tabsGroupRef"
            :style="tabsMaskStyle"
            @scroll="updateScrollMask"
          >
            <div
              v-for="(sc, index) in store.scenarioList"
              :key="sc.id"
              class="ts-tab-item"
              :class="{ 'is-active': sc.id === store.activeScenarioId }"
              @click="store.switchScenario(sc.id)"
            >
              {{ formatIndex(index) }}
            </div>

            <button
              v-if="store.scenarioList.length < store.MAX_SCENARIOS"
              class="ea-btn ea-btn--icon ea-btn--icon-24 ea-btn--icon-plus ea-btn--no-shrink ts-add-btn"
              @click="handleAddScenario"
              :title="t('timeline.scenario.addTooltip')"
            >
              +
            </button>
          </div>
        </div>

        <div class="header-controls">
          <input
            type="file"
            ref="fileInputRef"
            style="display: none"
            accept=".json,.png"
            @change="onFileSelected"
          />

          <button
            class="ea-btn ea-btn--sm ea-btn--lift ea-btn--hover-green"
            type="button"
            :title="t('timeline.analysis.tooltip')"
            @click="analysisDialogVisible = true"
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
              <path d="M21 12a9 9 0 1 1-9-9v9z"></path>
              <path d="M12 3a9 9 0 0 1 9 9h-9z"></path>
            </svg>
            {{ t('timeline.analysis.button') }}
          </button>

          <button
            class="ea-btn ea-btn--sm ea-btn--lift ea-btn--hover-orange"
            type="button"
            :title="t('common.export')"
            @click="openExportDialog"
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
              <path d="M14 3h7v7"></path>
              <path d="M10 14L21 3"></path>
              <path d="M21 14v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h7"></path>
            </svg>
            {{ t('common.export') }}
          </button>

          <el-popover
            v-model:visible="moreMenuOpen"
            placement="bottom-end"
            :width="280"
            trigger="click"
            :show-arrow="false"
            popper-class="header-more-popper"
          >
            <template #reference>
              <button
                class="ea-btn ea-btn--sm ea-btn--lift"
                type="button"
                :class="{ 'is-active': moreMenuOpen }"
                :title="t('timeline.header.moreTooltip')"
                :aria-expanded="moreMenuOpen"
                :aria-label="t('timeline.header.more')"
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
                  <circle cx="12" cy="5" r="1.6" />
                  <circle cx="12" cy="12" r="1.6" />
                  <circle cx="12" cy="19" r="1.6" />
                </svg>
                {{ t('timeline.header.more') }}
              </button>
            </template>

            <div class="header-more-panel">
              <section class="header-more-section">
                <h4 class="header-more-section__title">
                  {{ t('timeline.header.sectionView') }}
                </h4>

                <div class="header-more-view-block">
                  <h5 class="header-more-subsection__title">
                    {{ t('timeline.header.sectionViewLayers') }}
                  </h5>
                  <div class="header-more-checklist header-more-checklist--grid">
                    <button
                      v-for="layerId in store.TIMELINE_VIEW_LAYER_IDS"
                      :key="layerId"
                      type="button"
                      class="header-more-check-row header-more-check-row--compact"
                      @click="store.toggleTimelineViewLayer(layerId)"
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
                          v-if="store.isTimelineViewLayerVisible(layerId)"
                          points="3,8 6.5,11.5 13,4.5"
                          stroke-width="2"
                        />
                      </svg>
                      <span>{{ t(`timeline.header.viewLayers.${layerId}`) }}</span>
                    </button>
                  </div>
                </div>

                <div class="header-more-view-block header-more-view-block--follow">
                  <h5 class="header-more-subsection__title">
                    {{ t('timeline.header.sectionViewOperators') }}
                  </h5>
                  <div v-if="hasOperatorTracks" class="header-more-checklist header-more-checklist--grid">
                    <template v-for="(track, index) in store.teamTracksInfo" :key="index">
                      <button
                        v-if="track.id"
                        type="button"
                        class="header-more-check-row header-more-check-row--compact"
                        @click="store.toggleOperatorEffectsVisible(index)"
                      >
                        <svg
                          viewBox="0 0 16 16"
                          width="12"
                          height="12"
                          fill="none"
                          :stroke="store.getCharacterElementColor(track.id)"
                          stroke-width="1.5"
                          aria-hidden="true"
                        >
                          <rect x="1" y="1" width="14" height="14" rx="2" />
                          <polyline
                            v-if="store.operatorEffectsVisible[index]"
                            points="3,8 6.5,11.5 13,4.5"
                            stroke-width="2"
                          />
                        </svg>
                        <span>{{ track.name }}</span>
                      </button>
                    </template>
                  </div>
                  <p v-else class="header-more-empty">{{ t('timeline.header.hideEffectsEmpty') }}</p>
                </div>

                <div class="header-more-view-block">
                  <h5 class="header-more-subsection__title">
                    {{ t('timeline.header.sectionDurationBarColor') }}
                  </h5>

                  <div class="header-more-checklist">
                    <button
                      type="button"
                      class="header-more-check-row"
                      @click="store.toggleColoredDurationBars()"
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
                          v-if="store.durationBarColor.enabled"
                          points="3,8 6.5,11.5 13,4.5"
                          stroke-width="2"
                        />
                      </svg>
                      <span>{{ t('timeline.header.coloredDurationBarsEnable') }}</span>
                    </button>
                  </div>

                  <div
                    v-if="store.durationBarColor.enabled"
                    class="header-more-color-controls"
                  >
                    <label class="header-more-tune-row">
                      <span class="header-more-tune-row__label">
                        {{ t('timeline.header.durationBarSaturation') }}
                        <em>{{ store.durationBarColor.saturation }}%</em>
                      </span>
                      <div class="ea-range-row">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          class="ea-range"
                          :value="store.durationBarColor.saturation"
                          @input="
                            store.setDurationBarColorSaturation(
                              Number(($event.target).value),
                            )
                          "
                        />
                      </div>
                    </label>

                    <label class="header-more-tune-row">
                      <span class="header-more-tune-row__label">
                        {{ t('timeline.header.durationBarLightness') }}
                        <em>{{ store.durationBarColor.lightness }}%</em>
                      </span>
                      <div class="ea-range-row">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          class="ea-range"
                          :value="store.durationBarColor.lightness"
                          @input="
                            store.setDurationBarColorLightness(
                              Number(($event.target).value),
                            )
                          "
                        />
                      </div>
                    </label>

                    <h5 class="header-more-subsection__title">
                      {{ t('timeline.header.durationBarColorSources') }}
                    </h5>
                    <div class="header-more-checklist header-more-checklist--grid">
                      <button
                        v-for="sourceId in store.DURATION_BAR_COLOR_SOURCE_IDS"
                        :key="sourceId"
                        type="button"
                        class="header-more-check-row header-more-check-row--compact"
                        @click="store.toggleDurationBarColorSource(sourceId)"
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
                            v-if="store.durationBarColor.sources[sourceId]"
                            points="3,8 6.5,11.5 13,4.5"
                            stroke-width="2"
                          />
                        </svg>
                        <span>{{ t(`timeline.header.durationBarColorSource.${sourceId}`) }}</span>
                      </button>
                    </div>

                    <h5 class="header-more-subsection__title">
                      {{ t('timeline.header.durationBarColorSurfaces') }}
                    </h5>
                    <div class="header-more-checklist header-more-checklist--grid">
                      <button
                        v-for="surfaceId in store.DURATION_BAR_COLOR_SURFACE_IDS"
                        :key="surfaceId"
                        type="button"
                        class="header-more-check-row header-more-check-row--compact"
                        @click="store.toggleDurationBarColorSurface(surfaceId)"
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
                            v-if="store.durationBarColor.surfaces[surfaceId]"
                            points="3,8 6.5,11.5 13,4.5"
                            stroke-width="2"
                          />
                        </svg>
                        <span>{{ t(`timeline.header.durationBarColorSurface.${surfaceId}`) }}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section class="header-more-section">
                <h4 class="header-more-section__title">
                  {{ t('timeline.header.sectionProject') }}
                </h4>
                <div class="header-more-actions">
                  <button
                    type="button"
                    class="ea-btn ea-btn--sm ea-btn--lift ea-btn--hover-blue header-more-action"
                    :title="t('timeline.header.loadTooltip')"
                    @click="runMoreProjectAction('load')"
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
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>{{ t('common.load') }}</span>
                  </button>
                  <button
                    type="button"
                    class="ea-btn ea-btn--sm ea-btn--lift ea-btn--hover-blue header-more-action"
                    :title="t('timeline.header.receiveTooltip')"
                    @click="runMoreProjectAction('receive')"
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
                    <span>{{ t('common.receive') }}</span>
                  </button>
                  <button
                    type="button"
                    class="ea-btn ea-btn--sm ea-btn--lift ea-btn--hover-danger-dark header-more-action"
                    :title="t('timeline.header.resetTooltip')"
                    @click="runMoreProjectAction('reset')"
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

              <section class="header-more-section">
                <h4 class="header-more-section__title">{{ t('timeline.header.sectionPrefs') }}</h4>
                <div class="header-more-pref-row">
                  <div class="header-more-locale" :title="t('timeline.header.languageTooltip')">
                    <button
                      type="button"
                      class="ea-btn ea-btn--sm ea-btn--lift ea-btn--hover-info header-more-locale__btn"
                      :class="{ 'is-active': locale === 'zh-CN' }"
                      :title="t('locale.zhCN')"
                      @click="selectLocaleFromMore('zh-CN')"
                    >
                      {{ t('locale.zhCNShort') }}
                    </button>
                    <button
                      type="button"
                      class="ea-btn ea-btn--sm ea-btn--lift ea-btn--hover-info header-more-locale__btn"
                      :class="{ 'is-active': locale === 'en' }"
                      :title="t('locale.en')"
                      @click="selectLocaleFromMore('en')"
                    >
                      {{ t('locale.enShort') }}
                    </button>
                    <button
                      type="button"
                      class="ea-btn ea-btn--sm ea-btn--lift ea-btn--hover-info header-more-locale__btn"
                      :class="{ 'is-active': locale === 'ru' }"
                      :title="t('locale.ru')"
                      @click="selectLocaleFromMore('ru')"
                    >
                      {{ t('locale.ruShort') }}
                    </button>
                  </div>
                  <button
                    type="button"
                    class="ea-btn ea-btn--sm ea-btn--lift header-more-action header-more-action--icon"
                    :title="t('timeline.header.shortcutsTooltip')"
                    :aria-label="t('timeline.header.shortcutsLabel')"
                    @click="openShortcutsFromMore"
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
                      <rect x="2" y="6" width="20" height="12" rx="2" />
                      <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
                    </svg>
                  </button>
                </div>
                <div class="header-more-pref-row header-more-pref-row--appearance">
                  <span class="header-more-appearance__label">{{ t('common.appearance') }}</span>
                  <div class="header-more-appearance" role="group" :aria-label="t('common.appearance')">
                    <button
                      type="button"
                      class="ea-btn ea-btn--sm ea-btn--lift header-more-appearance__btn"
                      :class="{ 'is-active': appearance === 'light' }"
                      :title="t('common.appearanceLight')"
                      :aria-label="t('common.appearanceLight')"
                      @click="selectAppearanceFromMore('light')"
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
                      class="ea-btn ea-btn--sm ea-btn--lift header-more-appearance__btn"
                      :class="{ 'is-active': appearance === 'dark' }"
                      :title="t('common.appearanceDark')"
                      :aria-label="t('common.appearanceDark')"
                      @click="selectAppearanceFromMore('dark')"
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
            </div>
          </el-popover>
        </div>
      </header>

      <div ref="timelineWorkspaceRef" class="timeline-workspace" :style="timelineWorkspaceStyle">
        <div class="timeline-grid-container"><TimelineGrid ref="timelineGridRef" /></div>

        <div
          v-if="!isBottomPanelCollapsed"
          class="workbench-resizer workbench-resizer--horizontal workbench-resizer--bottom"
          :class="{ 'is-active': activeWorkbenchDrag === 'bottom' }"
          @pointerdown="beginWorkbenchResize('bottom', $event)"
          @dblclick="resetWorkbenchLayout('bottom')"
        ></div>

        <div v-if="!isBottomPanelCollapsed" class="workbench-panel resource-monitor-panel">
          <div class="workbench-panel__body resource-monitor-panel__body">
            <ResourceMonitor
              v-if="leftBottomTool === 'enemy'"
              :expand-all-token="resourceMonitorExpandAllToken"
              @collapse-panel="closeBottomPanelFromResourceMonitor"
              @section-collapse-change="handleResourceMonitorSectionCollapseChange"
            />
            <GlobalConfigPresetPanel v-else-if="leftBottomTool === 'global'" />
            <ContingencyContractPanel v-else />
          </div>
        </div>

        <div class="export-watermark" ref="watermarkEl">
          Endaxis
          <span class="watermark-sub">{{ watermarkSubText }}</span>
        </div>
      </div>
    </main>

    <div
      v-if="RIGHT_TOOLS_VISIBLE && !isRightPanelCollapsed"
      class="workbench-resizer workbench-resizer--vertical workbench-resizer--right"
      :class="{ 'is-active': activeWorkbenchDrag === 'right' }"
      @pointerdown="beginWorkbenchResize('right', $event)"
      @dblclick="resetWorkbenchLayout('right')"
    ></div>

    <aside
      v-if="RIGHT_TOOLS_VISIBLE"
      class="workbench-panel properties-sidebar"
      :class="{ 'is-collapsed-rail': isRightPanelCollapsed }"
    >
      <template v-if="!isRightPanelCollapsed">
        <div class="workbench-panel__body properties-sidebar__body">
          <PropertiesPanel
            v-if="rightPanelTool === 'inspector'"
            :on-reset-panel="() => resetWorkbenchLayout('right')"
            :on-collapse-panel="() => toggleWorkbenchPanel('right')"
          />
          <SimLogPanel v-else :on-collapse-panel="() => toggleWorkbenchPanel('right')" />
        </div>
      </template>
    </aside>

    <aside v-if="RIGHT_TOOLS_VISIBLE" class="activity-bar activity-bar--right">
      <div class="activity-bar__group activity-bar__group--top">
        <button
          type="button"
          class="activity-bar__button activity-bar__button--inspector"
          :class="{ 'is-active': !isRightPanelCollapsed && rightPanelTool === 'inspector' }"
          :aria-label="t('timeline.activityBar.inspector')"
          :data-tooltip="t('timeline.activityBar.inspector')"
          @click="toggleRightTool('inspector')"
        >
          <img
            class="activity-bar__image-icon activity-bar__image-icon--inspector"
            src="/icons/btn_week_raid.webp"
            alt=""
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          class="activity-bar__button activity-bar__button--battle-log"
          :class="{ 'is-active': !isRightPanelCollapsed && rightPanelTool === 'battleLog' }"
          :aria-label="t('timeline.activityBar.battleLog')"
          :data-tooltip="t('timeline.activityBar.battleLog')"
          @click="toggleRightTool('battleLog')"
        >
          <img
            class="activity-bar__image-icon activity-bar__image-icon--battle-log"
            src="/icons/btn_manual.webp"
            alt=""
            aria-hidden="true"
          />
        </button>
      </div>
    </aside>

    <DamageAnalysisDialog
      :visible="analysisDialogVisible"
      @update:visible="analysisDialogVisible = $event"
    />

    <el-dialog
      v-model="shortcutsDialogVisible"
      :title="t('timeline.shortcuts.dialogTitle')"
      width="560px"
      align-center
      class="custom-dialog"
      :append-to-body="true"
    >
      <div class="shortcuts-help">
        <section
          v-for="section in shortcutHelpSections"
          :key="section.title"
          class="shortcuts-help__section"
        >
          <h3 class="shortcuts-help__title">{{ section.title }}</h3>
          <div class="shortcuts-help__list">
            <div
              v-for="item in section.items"
              :key="`${section.title}-${item.keys}`"
              class="shortcuts-help__row"
            >
              <span class="shortcuts-help__keys">{{ item.keys }}</span>
              <span class="shortcuts-help__desc">{{ item.desc }}</span>
            </div>
          </div>
        </section>
      </div>
    </el-dialog>

    <el-dialog
      v-model="exportDialogVisible"
      :title="t('timeline.export.dialogTitle')"
      width="640px"
      align-center
      class="custom-dialog export-settings-dialog"
    >
      <div class="export-form">
        <div class="form-item">
          <label>{{ t('timeline.export.filenameLabel') }}</label
          ><el-input
            v-model="exportForm.filename"
            :placeholder="t('timeline.export.filenamePlaceholder')"
            size="large"
          />
        </div>
        <div class="form-item">
          <label>{{ t('timeline.export.durationLabel') }}</label
          ><el-input-number
            v-model="exportForm.duration"
            :min="10"
            :max="exportDurationMax"
            :step="10"
            :precision="0"
            size="large"
            style="width: 100%"
          />
          <div class="hint">
            {{ t('timeline.export.durationHintMax', { max: exportDurationMax }) }}
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <button
            type="button"
            class="ea-btn ea-btn--sm ea-btn--lift ea-btn--outline-muted"
            @click="exportDialogVisible = false"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            class="ea-btn ea-btn--sm ea-btn--lift ea-btn--fill-success"
            @click="handleExportJson"
          >
            {{ t('timeline.export.exportJson') }}
          </button>
          <button
            type="button"
            class="ea-btn ea-btn--sm ea-btn--lift ea-btn--fill-success"
            @click="copyShareCode"
          >
            {{ t('timeline.export.copyCode') }}
          </button>
          <button
            type="button"
            class="ea-btn ea-btn--sm ea-btn--lift ea-btn--fill-gold"
            @click="openSmallImageExport"
          >
            {{ t('timeline.export.exportSmallImage') }}
          </button>
          <button
            type="button"
            class="ea-btn ea-btn--sm ea-btn--lift ea-btn--fill-gold"
            @click="processExport"
          >
            {{ t('timeline.export.exportImage') }}
          </button>
        </span>
      </template>
    </el-dialog>

    <SmallImageExportDialog
      v-model="smallImageExportVisible"
      :initial-filename="exportForm.filename"
      :initial-duration="exportForm.duration"
    />

    <el-dialog
      v-model="importShareDialogVisible"
      :title="t('timeline.import.dialogTitle')"
      width="500px"
      align-center
      class="custom-dialog"
      :append-to-body="true"
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
          v-model="shareCodeInput"
          type="textarea"
          :rows="6"
          :placeholder="t('timeline.import.dialogPlaceholder')"
          resize="none"
        />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <button
            type="button"
            class="ea-btn ea-btn--sm ea-btn--lift ea-btn--outline-muted"
            @click="importShareDialogVisible = false"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            class="ea-btn ea-btn--sm ea-btn--lift ea-btn--fill-gold"
            @click="handleImportShare"
          >
            {{ t('timeline.import.dialogConfirm') }}
          </button>
        </span>
      </template>
    </el-dialog>

    <div v-show="isDragging" class="drop-overlay">
      <div class="drop-content">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          width="64"
          height="64"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <p>{{ t('timeline.import.dropHint') }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* App Layout */
.app-layout {
  display: grid;
  grid-template-rows: 100vh;
  height: 100vh;
  overflow: hidden;
  background-color: var(--ea-workbench);
  font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}
.workbench-layout {
  gap: 0;
}
.activity-bar {
  position: relative;
  z-index: 50;
  grid-column: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--ea-activity-bg);
  border-right: 1px solid var(--ea-border-soft);
  padding: 10px 0 12px;
}
.activity-bar--right {
  grid-column: 7;
  border-right: none;
  border-left: 1px solid var(--ea-border-soft);
}
.activity-bar__group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 100%;
}
.activity-bar__group--top {
  padding-top: 2px;
}
.activity-bar__group--bottom {
  margin-top: auto;
  padding-top: 14px;
}
.activity-bar__button {
  position: relative;
  width: 100%;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--ea-icon-muted);
  cursor: pointer;
  padding: 0;
  transition:
    color 0.14s ease,
    background-color 0.14s ease,
    transform 0.14s ease;
}
.activity-bar__button::before {
  content: attr(data-tooltip);
  position: absolute;
  left: calc(100% + 8px);
  top: 50%;
  z-index: 30;
  max-width: 180px;
  padding: 5px 8px;
  border: 1px solid var(--ea-border);
  background: var(--ea-tooltip-bg);
  color: var(--ea-icon-strong);
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  opacity: 0;
  transform: translate(6px, -50%);
  transition:
    opacity 0.12s ease,
    transform 0.12s ease;
  pointer-events: none;
  box-shadow: 0 6px 18px var(--ea-shadow);
}
.activity-bar--right .activity-bar__button::before {
  left: auto;
  right: calc(100% + 8px);
  transform: translate(-6px, -50%);
}
.activity-bar__button::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: var(--ea-fill-soft);
  border: 1px solid var(--ea-border-soft);
  transform: translate(-50%, -50%);
  opacity: 0;
  transition:
    opacity 0.14s ease,
    background-color 0.14s ease,
    border-color 0.14s ease,
    transform 0.14s ease;
  pointer-events: none;
}
.activity-bar__button:hover {
  color: var(--ea-icon-strong);
  background: var(--ea-fill-soft);
  transform: translateY(-1px);
}
.activity-bar__button:hover::before {
  opacity: 1;
  transform: translate(0, -50%);
}
.activity-bar--right .activity-bar__button:hover::before {
  transform: translate(0, -50%);
}
.activity-bar__button:hover::after {
  opacity: 0.76;
  transform: translate(-50%, -52%);
  border-color: var(--ea-border);
}
.activity-bar__button.is-active {
  color: var(--ea-fg);
}
.activity-bar__button.is-active::after {
  opacity: 1;
  background: var(--ea-hover-fill);
  border-color: var(--ea-border-soft);
}
.activity-bar__icon {
  width: 24px;
  height: 24px;
  display: block;
  opacity: 0.78;
  transition:
    transform 0.14s ease,
    opacity 0.14s ease,
    filter 0.14s ease;
}
.activity-bar__button:hover .activity-bar__icon {
  opacity: 1;
  transform: translateY(-2px) scale(1.06);
  filter: drop-shadow(0 2px 8px rgba(255, 255, 255, 0.2));
}
.activity-bar__button.is-active .activity-bar__icon {
  opacity: 1;
  transform: scale(1.02);
}
.activity-bar__button.is-active:hover .activity-bar__icon {
  transform: translateY(-3px) scale(1.1);
  filter: drop-shadow(0 3px 10px rgba(255, 255, 255, 0.28));
}
.activity-bar__button--lib .activity-bar__image-icon--lib {
  width: 24px;
  height: 24px;
}
.activity-bar__button--global .activity-bar__image-icon--global,
.activity-bar__button--inspector .activity-bar__image-icon--inspector,
.activity-bar__button--battle-log .activity-bar__image-icon--battle-log {
  width: 24px;
  height: 24px;
}
.activity-bar__button--panel .activity-bar__icon {
  width: 24px;
  height: 24px;
  transform: translateY(0.5px);
}
.activity-bar__image-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
  display: block;
  opacity: 0.78;
  filter: saturate(0.9) brightness(0.82);
  transition:
    transform 0.14s ease,
    opacity 0.14s ease,
    filter 0.14s ease;
}
.activity-bar__button.is-active .activity-bar__image-icon {
  opacity: 1;
  filter: saturate(1.06) brightness(1.06) drop-shadow(0 2px 8px rgba(255, 255, 255, 0.2));
  transform: scale(1.04);
}
.activity-bar__button:hover .activity-bar__image-icon,
.activity-bar__button.is-active:hover .activity-bar__image-icon {
  opacity: 1;
  filter: saturate(1.12) brightness(1.12) drop-shadow(0 3px 10px rgba(255, 255, 255, 0.28));
  transform: translateY(-3px) scale(1.1);
}
.workbench-panel {
  position: relative;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--ea-workbench-panel);
  border-color: var(--ea-border);
}
:global(html[data-theme='light'] .workbench-panel) {
  box-shadow: inset 0 0 0 1px var(--ea-border-soft);
}
:global(html[data-theme='light'] .action-library-panel),
:global(html[data-theme='light'] .properties-sidebar) {
  box-shadow:
    inset 0 0 0 1px var(--ea-border-soft),
    0 0 0 1px var(--ea-border);
}
.action-library-panel {
  grid-column: 2;
}
.timeline-main {
  grid-column: 4;
}
.properties-sidebar {
  grid-column: 6;
}
.workbench-panel__header {
  height: 25px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 8px 0 10px;
  border-bottom: 1px solid var(--ea-border-soft);
  background: var(--ea-workbench-panel);
}
.workbench-panel__header--dense {
  height: 24px;
}
.workbench-panel__label {
  color: var(--ea-fg-muted);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.workbench-panel__tools {
  display: flex;
  align-items: center;
  gap: 2px;
}
.workbench-icon-btn {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--ea-icon-muted);
  cursor: pointer;
  padding: 0;
}
.workbench-icon-btn:hover {
  color: var(--ea-icon-strong);
  background: var(--ea-hover-fill);
}
.workbench-panel__body {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}
.panel-chrome {
  position: absolute;
  top: 8px;
  z-index: 35;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 4px 2px 6px;
  border-radius: 8px 0 0 8px;
  border: 1px solid var(--ea-border-soft);
  border-right: none;
  background: var(--ea-panel-chrome-bg);
  backdrop-filter: blur(4px);
  opacity: 0.18;
  transform: translateX(2px);
  transition:
    opacity 0.14s ease,
    background-color 0.14s ease,
    transform 0.14s ease;
}
.action-library-panel:hover .panel-chrome,
.properties-sidebar:hover .panel-chrome,
.resource-monitor-panel:hover .panel-chrome,
.panel-chrome:focus-within {
  opacity: 1;
  background: var(--ea-panel-chrome-bg-hover);
  transform: translateX(0);
}
.panel-chrome--left {
  right: 0;
}
.panel-chrome--right {
  right: 0;
}
.panel-chrome__btn {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--ea-icon-muted);
  cursor: pointer;
  padding: 0;
}
.panel-chrome__btn:hover {
  color: var(--ea-icon-strong);
  background: var(--ea-hover-fill);
}
.workbench-resizer {
  position: relative;
  background: var(--ea-border-soft);
  z-index: 30;
  touch-action: none;
}
.workbench-resizer--left {
  grid-column: 3;
}
.workbench-resizer--right {
  grid-column: 5;
}
.workbench-resizer::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0;
  transition:
    opacity 0.12s ease,
    background-color 0.12s ease;
}
.workbench-resizer:hover::before,
.workbench-resizer.is-active::before {
  opacity: 1;
  background: var(--ea-active-fill);
}
.workbench-resizer--vertical {
  cursor: ew-resize;
}
.workbench-resizer--horizontal {
  cursor: ns-resize;
}
.workbench-resizer--vertical::after {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  width: 9px;
  height: 100%;
  transform: translateX(-50%);
}
.workbench-resizer--horizontal::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 9px;
  transform: translateY(-50%);
}
.action-library-panel {
  z-index: 10;
}
.action-library-stack {
  display: grid;
  min-height: 0;
  background-color: var(--ea-workbench-panel);
}
.action-library-stack__main,
.action-library-stack__bottom {
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}
.action-library-stack__divider {
  height: 1px;
  background: var(--ea-border-soft);
}
.action-library-stack__bottom {
  background: var(--ea-workbench-panel);
  border-top: 1px solid var(--ea-border);
}
.action-library-stack__bottom.is-contract {
  border-top: none;
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
.action-library {
  background-color: var(--ea-workbench-panel);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  z-index: 10;
  height: 100%;
}
.timeline-main {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--ea-workbench-main);
  z-index: 1;
  min-width: 0;
}
.properties-sidebar {
  z-index: 10;
}
.properties-sidebar__body {
  background-color: var(--ea-workbench-panel);
}
.workbench-rail {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 10px;
}
.workbench-rail__button {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--ea-fg-muted);
  cursor: pointer;
  padding: 0;
}
.workbench-rail__button:hover {
  color: var(--ea-fg);
  background: var(--ea-hover-fill);
}

/* Header */
.timeline-header {
  height: 50px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--ea-border-soft);
  background-color: var(--ea-workbench-header);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px 0 0;
  cursor: default;
  user-select: none;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.header-controls .ea-btn.is-active {
  background: var(--ea-active-fill);
  color: var(--ea-fg);
}

/* Light mode: white UI glyphs → ink silhouette (assets are white-on-transparent). */
:global(html[data-theme='light'] .activity-bar__image-icon){
  filter: brightness(0) opacity(0.72);
  opacity: 1;
}
:global(html[data-theme='light'] .activity-bar__button.is-active .activity-bar__image-icon){
  filter: brightness(0) opacity(0.92);
}
:global(html[data-theme='light'] .activity-bar__button:hover .activity-bar__image-icon),
:global(html[data-theme='light'] .activity-bar__button.is-active:hover .activity-bar__image-icon){
  filter: brightness(0) opacity(1);
  transform: translateY(-3px) scale(1.1);
}
:global(html[data-theme='light'] .header-more-action.ea-btn),
:global(html[data-theme='light'] .header-more-locale__btn.ea-btn),
:global(html[data-theme='light'] .header-more-appearance__btn.ea-btn){
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}
.shortcuts-help {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-height: min(60vh, 520px);
  overflow-y: auto;
  padding-right: 4px;
}
.shortcuts-help__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.shortcuts-help__title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: color-mix(in srgb, var(--ea-gold) 90%, transparent);
  letter-spacing: 0.4px;
}
.shortcuts-help__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.shortcuts-help__row {
  display: grid;
  grid-template-columns: minmax(168px, 220px) 1fr;
  gap: 20px;
  align-items: center;
  padding: 6px 8px;
  border-radius: 4px;
  background: var(--ea-fill-soft);
}
.shortcuts-help__keys {
  font-family:
    'Cascadia Mono', 'Cascadia Code', 'Segoe UI Mono', Consolas, 'SF Mono', Menlo,
    'Liberation Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  font-variant-ligatures: none;
  letter-spacing: 0.4px;
  color: var(--ea-fg);
  white-space: nowrap;
}
.shortcuts-help__desc {
  font-size: 12px;
  color: var(--ea-fg-secondary);
  line-height: 1.4;
}

.header-more-panel {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.header-more-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.header-more-section + .header-more-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--ea-border);
}
.header-more-section__title {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: color-mix(in srgb, var(--ea-gold) 90%, transparent);
}
.header-more-view-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.header-more-view-block + .header-more-view-block {
  margin-top: 10px;
  padding-top: 12px;
  border-top: 1px solid var(--ea-border-soft);
}
.header-more-view-block + .header-more-view-block.header-more-view-block--follow {
  margin-top: 8px;
  padding-top: 0;
  border-top: none;
}
.header-more-subsection__title {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--ea-fg-muted);
}
.header-more-checklist {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 168px;
  overflow-y: auto;
  border: 1px solid var(--ea-border-soft);
  border-radius: 4px;
  background: var(--ea-fill-soft);
}
.header-more-checklist--grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  max-height: none;
  overflow: visible;
}
.header-more-checklist--grid .header-more-check-row {
  border-bottom: 1px solid var(--ea-border-soft);
}
.header-more-checklist--grid .header-more-check-row:nth-child(odd) {
  border-right: 1px solid var(--ea-border-soft);
}
.header-more-check-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin: 0;
  padding: 7px 9px;
  border: none;
  border-bottom: 1px solid var(--ea-border-soft);
  border-radius: 0;
  background: transparent;
  color: var(--ea-fg-secondary);
  font-size: 12px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}
.header-more-check-row--compact {
  gap: 5px;
  padding: 5px 7px;
  font-size: 11px;
  font-weight: 600;
  min-width: 0;
}
.header-more-check-row--compact span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.header-more-check-row:last-child {
  border-bottom: none;
}
.header-more-check-row:hover {
  background: var(--ea-hover-fill);
  color: var(--ea-fg);
}
.header-more-check-row svg {
  flex-shrink: 0;
}
.header-more-color-controls {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 2px 0 0;
}
.header-more-tune-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 2px 2px 4px;
  color: var(--ea-fg-secondary);
  font-size: 11px;
  font-weight: 600;
  cursor: default;
}
.header-more-tune-row__label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.header-more-tune-row__label em {
  font-style: normal;
  color: color-mix(in srgb, var(--ea-gold) 85%, transparent);
  font-variant-numeric: tabular-nums;
}
.header-more-color-controls .header-more-subsection__title {
  margin-top: 2px;
}
.header-more-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.header-more-action.ea-btn {
  width: auto;
  flex: 0 0 auto;
  justify-content: flex-start;
  --ea-btn-bg: var(--ea-fill-soft);
  --ea-btn-border: var(--ea-border);
  --ea-btn-color: var(--ea-fg-secondary);
  --ea-btn-bg-hover: var(--ea-hover-fill);
  --ea-btn-border-hover: var(--ea-border-strong);
  --ea-btn-color-hover: var(--ea-fg);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}
.header-more-action.ea-btn.ea-btn--hover-blue:hover {
  --ea-btn-bg-hover: rgba(74, 144, 226, 0.14);
  --ea-btn-border-hover: var(--ea-blue);
  --ea-btn-color-hover: #9ec5f5;
}
.header-more-action.ea-btn.ea-btn--hover-danger-dark:hover {
  --ea-btn-bg-hover: rgba(255, 77, 79, 0.12);
  --ea-btn-border-hover: var(--ea-danger-soft);
  --ea-btn-color-hover: var(--ea-danger-soft);
}
.header-more-empty {
  margin: 0;
  padding: 8px;
  font-size: 12px;
  color: var(--ea-fg-faint);
}
.header-more-pref-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 6px;
}
.header-more-pref-row .header-more-action--icon {
  margin-left: auto;
}
.header-more-locale {
  display: inline-grid;
  grid-template-columns: repeat(3, 1.75rem);
  gap: 4px;
  flex: 0 0 auto;
}
.header-more-pref-row--appearance {
  justify-content: space-between;
  margin-top: 2px;
}
.header-more-appearance__label {
  font-size: 11px;
  font-weight: 600;
  color: var(--ea-fg-muted);
}
.header-more-appearance {
  display: inline-grid;
  grid-template-columns: repeat(2, 28px);
  gap: 4px;
  flex: 0 0 auto;
}
.header-more-locale__btn.ea-btn,
.header-more-appearance__btn.ea-btn {
  width: 100%;
  min-width: 0;
  --ea-btn-px: 0;
  --ea-btn-py: 5px;
  --ea-btn-font-size: 11px;
  --ea-btn-bg: var(--ea-fill-soft);
  --ea-btn-border: var(--ea-border);
  --ea-btn-color: var(--ea-fg-secondary);
  --ea-btn-bg-hover: var(--ea-btn-primary-hover-bg);
  --ea-btn-border-hover: var(--ea-btn-primary-border);
  --ea-btn-color-hover: var(--ea-btn-primary-fg);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}
.header-more-appearance__btn.ea-btn {
  width: 28px;
  min-width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.header-more-locale__btn.ea-btn.is-active,
.header-more-appearance__btn.ea-btn.is-active {
  border-color: color-mix(in srgb, var(--ea-gold) 50%, transparent);
  background: color-mix(in srgb, var(--ea-gold) 10%, transparent);
  color: #ffe38a;
}
:global(html[data-theme='light'] .header-more-locale__btn.ea-btn.is-active),
:global(html[data-theme='light'] .header-more-appearance__btn.ea-btn.is-active){
  border-color: rgba(180, 140, 0, 0.55);
  background: rgba(180, 140, 0, 0.12);
  color: var(--ea-gold);
}
.header-more-action--icon.ea-btn {
  flex: 0 0 auto;
  width: 28px;
  min-width: 28px;
  padding-left: 0;
  padding-right: 0;
  --ea-btn-px: 0;
  justify-content: center;
}

/* === 方案选择器样式 === */
.tech-scenario-bar {
  display: flex;
  align-items: center;
  height: 36px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0) 100%);
  padding: 0 10px;
  flex: 1;
  min-width: 0;
  margin-right: 20px;
}

.ts-header-group {
  display: flex;
  align-items: center;
  gap: 4px;
  position: relative;
  padding-right: 10px;
  width: 260px;
  flex-shrink: 0;
  overflow: hidden;
}

.ts-tabs-group {
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  padding: 0;
  border-radius: 0;
  flex-grow: 1;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.ts-tabs-group::-webkit-scrollbar {
  display: none;
}

.ts-title-wrapper {
  display: flex;
  align-items: baseline;
  color: var(--ea-fg);
  font-size: 16px;
  font-weight: bold;
  font-family: 'Segoe UI', sans-serif;
  letter-spacing: 0.5px;
  margin-left: 4px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ts-deco-bracket {
  color: var(--ea-fg-faint);
  font-weight: 300;
  margin: 0 2px;
  user-select: none;
  flex-shrink: 0;
}

.ts-title-text {
  white-space: nowrap;
  cursor: pointer;
  border-bottom: 1px dashed transparent;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ts-title-text:hover {
  border-bottom-color: var(--ea-fg-muted);
}

.ts-title-input {
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--ea-gold);
  color: var(--ea-gold);
  font-size: 16px;
  font-weight: bold;
  width: 120px;
  outline: none;
  padding: 0;
}

.ts-tab-item {
  min-width: 40px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Roboto Mono', monospace;
  font-size: 12px;
  font-weight: bold;
  color: var(--ea-tab-idle-fg);
  background-color: var(--ea-tab-idle-bg);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  flex-shrink: 0;
}
.ts-tab-item:hover {
  background-color: var(--ea-hover-fill);
  color: var(--ea-fg);
}
.ts-tab-item.is-active {
  background-color: var(--ea-tab-active-bg);
  color: var(--ea-tab-active-fg);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.ts-add-btn {
  margin-left: 4px;
  font-size: 14px;
}

/* Workspace & Panels */
.timeline-workspace {
  flex-grow: 1;
  display: grid;
  overflow: hidden;
  position: relative;
  min-height: 0;
  background: var(--ea-workbench-main);
}
.timeline-grid-container {
  grid-row: 1;
  overflow: hidden;
  min-height: 0;
  min-width: 0;
}
.workbench-resizer--bottom {
  grid-row: 2;
}
.resource-monitor-panel {
  grid-row: 3;
  z-index: 20;
  background: var(--ea-workbench-panel);
  min-height: 0;
}
.resource-monitor-panel__body {
  background: var(--ea-workbench-panel);
  position: relative;
}

/* Export Dialog Styles */
.export-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 10px 0;
}
.dialog-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.dialog-footer .ea-btn {
  flex: 0 0 auto;
  white-space: nowrap;
  min-width: max-content;
}
.export-settings-dialog .dialog-footer {
  gap: 8px 10px;
}
.form-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: var(--ea-fg-secondary);
}
.hint {
  font-size: 12px;
  color: var(--ea-dialog-hint);
  margin-top: 6px;
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
:deep(.el-textarea__inner) {
  background-color: var(--ea-fill-input);
  box-shadow: inset 0 0 0 1px var(--ea-border);
  color: var(--ea-fg);
  border: none;
  font-family: monospace;
}
:deep(.el-textarea__inner:focus) {
  box-shadow: inset 0 0 0 1px var(--ea-gold);
}
/* === 水印样式 === */
.export-watermark {
  display: none;
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 9999;
  text-align: right;
  pointer-events: none;
  user-select: none;
  font-family: 'Segoe UI', sans-serif;
  font-size: 24px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.15);
}

:global(html[data-theme='light'] .export-watermark) {
  color: rgba(26, 27, 30, 0.18);
}

.watermark-sub {
  display: block;
  font-size: 12px;
  opacity: 0.7;
}
/* Element Plus dialog chrome — follow appearance tokens */
:deep(.el-dialog) {
  background-color: var(--ea-dialog-bg);
  border: 1px solid var(--ea-dialog-border);
  border-radius: 0;
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
:deep(.el-input__wrapper) {
  background-color: var(--ea-fill-input);
  box-shadow: 0 0 0 1px var(--ea-border) inset;
  padding: 4px 11px;
}
:deep(.el-input__inner) {
  color: var(--ea-fg);
  height: 36px;
  line-height: 36px;
}
:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--ea-border-strong) inset;
}
:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--ea-gold) inset;
}

.drop-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.85);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.drop-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--ea-gold);
  gap: 20px;
  font-size: 24px;
  font-weight: bold;
}
</style>

<style>
.header-more-popper.el-popover.el-popper {
  padding: 12px;
  background: var(--ea-popover-bg);
  border: 1px solid var(--ea-border);
  box-shadow: 0 10px 28px var(--ea-shadow-strong);
}
.header-more-popper.el-popper.is-light,
.header-more-popper.el-popper {
  color: var(--ea-fg-secondary);
}
</style>
