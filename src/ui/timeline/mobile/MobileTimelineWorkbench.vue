<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  EaButton,
  EaCloseButton,
  EaDeleteIcon,
  EaDrawer,
  EaNumberInput,
  EaPlusIcon,
  EaPopover,
  EaSelect,
  type EaSelectValue,
} from '@/design-system';
import { notifyNativeAppReady, registerBackHandler } from '@/platform/nativeBridge';
import type { TrackIndex } from '../../../core/project/schema';
import type { TimelineDamageAnalysis } from '../results/timelineDamageAnalysis';
import TimelineCursorGuide, {
  type TimelineCursorEnemyEffect,
  type TimelineCursorGaugeRow,
} from '../components/TimelineCursorGuide.vue';
import TimelineAppearanceIcon from '../components/TimelineAppearanceIcon.vue';

export interface MobileCast {
  id: string;
  label: string;
  startFrame: number;
  visualStartFrame: number;
  durationFrames: number;
  color: string;
  isAttack: boolean;
  disabled: boolean;
  locked: boolean;
  combatBadges: readonly { id: string; icon: string; title: string; layers: number }[];
  hitMarkers: readonly {
    hitId: string;
    frame: number;
    executionFrame?: number;
    damage: number;
  }[];
  effectHits: readonly {
    sequence: number;
    frame: number;
    damage: number;
    hitId?: string;
  }[];
  durationBars: readonly {
    id: string;
    startFrame: number;
    endFrame: number;
    lane: number;
    color: string;
  }[];
}

export interface MobileTrack {
  index: TrackIndex;
  name: string;
  avatar: string | null;
  operatorLevel: number | null;
  operatorPotential: number | null;
  setBonus: string;
  weapon: { name: string; icon: string | null; level: number } | null;
  gears: readonly {
    slot: 'armor' | 'gloves' | 'accessory1' | 'accessory2';
    name: string;
    icon: string | null;
  }[];
  casts: readonly MobileCast[];
}

export interface MobileLibraryEntry {
  entryKey: string;
  label: string;
  operationType: string;
  color: string;
  icon: string;
  durationFrames: number;
  skills: readonly { skillKey: string; label: string }[];
}

export interface MobileOperationHint {
  id: string;
  frame: number;
  label: string;
  kind: 'skill' | 'combo' | 'ultimate' | 'switch';
  perfect: boolean;
}

const props = defineProps<{
  scenarioName: string;
  scenarios: readonly { id: string; name: string }[];
  activeScenarioId: string;
  tracks: readonly MobileTrack[];
  library: readonly MobileLibraryEntry[];
  selectedTrack: TrackIndex;
  selectedCastId: string | null;
  prepFrames: number;
  durationFrames: number;
  prepExpanded: boolean;
  minimumEditableFrame: number;
  readOnly: boolean;
  canUndo: boolean;
  canRedo: boolean;
  enemyName: string;
  analysis: TimelineDamageAnalysis;
  freezeBands: readonly { startFrame: number; endFrame: number; sourceCastId?: string }[];
  staggerBands: readonly { startFrame: number; endFrame: number }[];
  operationHints: readonly MobileOperationHint[];
  keycapMode: 'keyboard' | 'gamepad';
  locale: 'zh-CN' | 'en';
  appearance: 'light' | 'dark';
  guideMetrics: {
    time: string;
    sp: string | null;
    poise: string | null;
    enemyHealth: string | null;
    gauges: readonly TimelineCursorGaugeRow[];
  };
  guideEnemyEffects: readonly TimelineCursorEnemyEffect[];
  guideEnemyEffectOverflow: number;
}>();

const emit = defineEmits<{
  selectScenario: [id: string];
  renameScenario: [name: string];
  addScenario: [];
  duplicateScenario: [];
  deleteScenario: [];
  undo: [];
  redo: [];
  openProject: [];
  exportProject: [];
  resetProject: [];
  selectTrack: [index: TrackIndex];
  swapTracks: [from: TrackIndex, to: TrackIndex];
  openOperator: [index: TrackIndex];
  openWeapon: [index: TrackIndex];
  openGear: [index: TrackIndex, slot: 'armor' | 'gloves' | 'accessory1' | 'accessory2'];
  openOperatorBuild: [];
  openWeaponBuild: [];
  openGearBuild: [];
  openStats: [index: TrackIndex];
  selectCast: [id: string];
  moveCast: [id: string, index: TrackIndex, frame: number];
  placeSkill: [entryKey: string, skillKey: string | undefined, index: TrackIndex, frame: number];
  deleteCast: [];
  toggleCastDisabled: [];
  setPrepFrames: [frames: number];
  setDurationFrames: [frames: number];
  togglePrep: [];
  hitDetail: [index: TrackIndex, castId: string, hitId: string, executionFrame?: number];
  guideFrame: [frame: number | null];
  setLocale: [locale: 'zh-CN' | 'en'];
  setAppearance: [appearance: 'light' | 'dark'];
  setKeycapMode: [mode: 'keyboard' | 'gamepad'];
  receiveProject: [];
}>();

const { t } = useI18n();
const MobileAnalysisView = defineAsyncComponent(() => import('./MobileAnalysisView.vue'));
const view = ref<'timeline' | 'analysis'>('timeline');
const libraryOpen = ref(false);
const loadoutOpen = ref(false);
const inspectorOpen = ref(false);
const skillDamageOpen = ref(true);
const effectDamageOpen = ref(true);
const enemyOpen = ref(false);
const moreOpen = ref(false);
const DISPLAY_PREFS_KEY = 'endaxis:mobile-timeline-prefs:v1';
function readDisplayPrefs(): {
  freeze: boolean;
  stagger: boolean;
  duration: boolean;
  operations: boolean;
  anomalies: boolean;
} {
  try {
    const stored = JSON.parse(window.localStorage.getItem(DISPLAY_PREFS_KEY) || '{}');
    return {
      freeze: stored.showFreezeEffects !== false,
      stagger: stored.showStaggerBreaks !== false,
      duration: stored.showDurationBars !== false,
      operations: stored.showOperationHints !== false,
      anomalies:
        typeof stored.showAnomalies === 'boolean'
          ? stored.showAnomalies
          : stored.showBuffs !== false,
    };
  } catch {
    return { freeze: true, stagger: true, duration: true, operations: true, anomalies: true };
  }
}
const initialDisplayPrefs = readDisplayPrefs();
const showFreezeEffects = ref(initialDisplayPrefs.freeze);
const showStaggerBreaks = ref(initialDisplayPrefs.stagger);
const showDurationBars = ref(initialDisplayPrefs.duration);
const showOperationHints = ref(initialDisplayPrefs.operations);
const showAnomalies = ref(initialDisplayPrefs.anomalies);
watch(
  [showFreezeEffects, showStaggerBreaks, showDurationBars, showOperationHints, showAnomalies],
  ([freeze, stagger, duration, operations, anomalies]) => {
    try {
      const previous = JSON.parse(window.localStorage.getItem(DISPLAY_PREFS_KEY) || '{}');
      window.localStorage.setItem(
        DISPLAY_PREFS_KEY,
        JSON.stringify({
          ...previous,
          showFreezeEffects: freeze,
          showStaggerBreaks: stagger,
          showDurationBars: duration,
          showOperationHints: operations,
          showAnomalies: anomalies,
        }),
      );
    } catch {
      // Storage may be unavailable in an embedded browser; the in-session preference still works.
    }
  },
);
const renameActive = ref(false);
const renameDraft = ref(props.scenarioName);
const prepDraft = ref(props.prepFrames / 30);
const durationDraft = ref(props.durationFrames / 30);
const placement = ref<{ entryKey: string; skillKey?: string; label: string } | null>(null);
let placementPointerStart: {
  pointerId: number;
  index: TrackIndex;
  x: number;
  y: number;
} | null = null;
const guideFrame = ref<number | null>(null);
let guidePointerId: number | null = null;
const mobileScroll = ref<HTMLElement | null>(null);
const drag = ref<{
  id: string;
  index: TrackIndex;
  pointerId: number;
  clientX: number;
  clientY: number;
  lastClientY: number;
  startScrollTop: number;
  startFrame: number;
  visualStartFrame: number;
  previewFrame: number;
  previewVisualFrame: number;
  dragging: boolean;
  scrolling: boolean;
} | null>(null);
let longPressTimer: number | null = null;
let autoScrollFrame: number | null = null;
let suppressCastClickUntil = 0;
const trackDrag = ref<{
  index: TrackIndex;
  pointerId: number;
  clientX: number;
  target: TrackIndex;
  moved: boolean;
} | null>(null);
let suppressTrackClickUntil = 0;

watch(
  () => props.scenarioName,
  name => (renameDraft.value = name),
);
watch(
  () => props.prepFrames,
  frames => (prepDraft.value = frames / 30),
);
watch(
  () => props.durationFrames,
  frames => (durationDraft.value = frames / 30),
);
watch(
  () => props.selectedCastId,
  id => {
    if (id === null) inspectorOpen.value = false;
  },
);
watch(
  () => props.activeScenarioId,
  () => {
    placement.value = null;
    inspectorOpen.value = false;
    libraryOpen.value = false;
    clearGuide();
  },
);
watch(
  () => props.selectedTrack,
  () => {
    placement.value = null;
  },
);
watch(view, next => {
  if (next === 'analysis') clearGuide();
});

const PX_PER_SECOND = 50;
const PX_PER_FRAME = PX_PER_SECOND / 30;
const COLLAPSED_PREP_PX = 18;
const startFrame = computed(() => (props.prepExpanded ? -props.prepFrames : 0));
const prepHeight = computed(() =>
  props.prepExpanded
    ? props.prepFrames * PX_PER_FRAME
    : props.prepFrames > 0
      ? COLLAPSED_PREP_PX
      : 0,
);

function frameY(frame: number): number {
  if (props.prepExpanded) return (frame + props.prepFrames) * PX_PER_FRAME;
  if (frame < 0)
    return props.prepFrames > 0
      ? ((frame + props.prepFrames) / props.prepFrames) * COLLAPSED_PREP_PX
      : 0;
  return prepHeight.value + frame * PX_PER_FRAME;
}

function yFrame(y: number): number {
  if (props.prepExpanded) return y / PX_PER_FRAME - props.prepFrames;
  if (y < prepHeight.value)
    return props.prepFrames > 0 ? (y / COLLAPSED_PREP_PX - 1) * props.prepFrames : 0;
  return (y - prepHeight.value) / PX_PER_FRAME;
}

function snapFrame(frame: number): number {
  return Math.max(
    props.minimumEditableFrame,
    Math.min(props.durationFrames, Math.round(frame / 3) * 3),
  );
}

const displayEndFrame = computed(() =>
  Math.max(
    props.durationFrames,
    ...props.tracks.flatMap(track => [
      ...track.casts.map(cast => cast.visualStartFrame + cast.durationFrames),
      ...track.casts.flatMap(cast => cast.durationBars.map(bar => bar.endFrame)),
    ]),
  ),
);
const guidePanelBelow = computed(() => guideFrame.value !== null && frameY(guideFrame.value) < 112);
const timelineHeight = computed(() => Math.max(250, frameY(displayEndFrame.value) + 40));
const ticks = computed(() => {
  const result: { frame: number; top: number; major: boolean }[] = [];
  for (let frame = startFrame.value; frame <= displayEndFrame.value; frame += 30) {
    if (frame < 0 && !props.prepExpanded) continue;
    result.push({ frame, top: frameY(frame), major: frame === 0 || frame % 150 === 0 });
  }
  if (!result.some(tick => tick.frame === 0))
    result.push({ frame: 0, top: frameY(0), major: true });
  return result;
});
const mobileRailWidth = 48;
const operationLayout = computed(() => {
  const laneBottoms: number[] = [];
  const placed = [...props.operationHints]
    .sort((left, right) => left.frame - right.frame)
    .map(hint => {
      const top = frameY(hint.frame);
      let lane = laneBottoms.findIndex(bottom => top - 7 >= bottom + 2);
      if (lane < 0) {
        lane = laneBottoms.length;
        laneBottoms.push(-Infinity);
      }
      laneBottoms[lane] = top + 7;
      return { ...hint, top, lane };
    });
  const laneCount = Math.min(4, Math.max(1, laneBottoms.length));
  const capGap = 2;
  const width = Math.min(46, Math.max(24, 2 + laneCount * 10 + (laneCount - 1) * capGap));
  const capWidth = Math.max(8, Math.floor((width - 2 - (laneCount - 1) * capGap) / laneCount));
  return {
    items: placed.filter(hint => hint.lane < laneCount),
    vars: {
      '--opw': `${width}px`,
      '--capw': `${capWidth}px`,
      '--capfs': `${capWidth <= 10 ? 8 : 9}px`,
      '--capgap': `${capGap}px`,
    },
  };
});

const selectedTrackModel = computed(() => props.tracks[props.selectedTrack]);
const selectedCast = computed(() =>
  props.tracks.flatMap(track => track.casts).find(cast => cast.id === props.selectedCastId),
);
const selectedCastTrack = computed(() =>
  props.tracks.find(track => track.casts.some(cast => cast.id === props.selectedCastId)),
);
const activeFreezeBands = computed(() => {
  const castId = drag.value?.dragging
    ? drag.value.id
    : inspectorOpen.value
      ? props.selectedCastId
      : null;
  return castId === null ? [] : props.freezeBands.filter(band => band.sourceCastId === castId);
});
const selectedCastDamage = computed(
  () => selectedCast.value?.hitMarkers.reduce((sum, hit) => sum + hit.damage, 0) ?? 0,
);
const selectedEffectDamage = computed(
  () => selectedCast.value?.effectHits.reduce((sum, hit) => sum + hit.damage, 0) ?? 0,
);
const placementHint = computed(() => placement.value?.label ?? '');

function beginPlacement(entry: MobileLibraryEntry, skillKey?: string, label = entry.label): void {
  placementPointerStart = null;
  placement.value = { entryKey: entry.entryKey, ...(skillKey ? { skillKey } : {}), label };
  libraryOpen.value = false;
  view.value = 'timeline';
}

function beginPlacementOnTrack(event: PointerEvent, index: TrackIndex): void {
  if (event.button !== 0 || !placement.value || props.readOnly || index !== props.selectedTrack)
    return;
  placementPointerStart = {
    pointerId: event.pointerId,
    index,
    x: event.clientX,
    y: event.clientY,
  };
}

function placeAt(event: PointerEvent, index: TrackIndex): void {
  const start = placementPointerStart;
  placementPointerStart = null;
  if (
    !start ||
    !placement.value ||
    props.readOnly ||
    index !== props.selectedTrack ||
    start.index !== index ||
    start.pointerId !== event.pointerId ||
    Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8
  )
    return;
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const frame = snapFrame(yFrame(event.clientY - rect.top));
  const pending = placement.value;
  suppressCastClickUntil = Date.now() + 350;
  placement.value = null;
  emit('placeSkill', pending.entryKey, pending.skillKey, index, frame);
}

function openCast(id: string): void {
  emit('selectCast', id);
  inspectorOpen.value = true;
}

function handleCastClick(id: string): void {
  if (placement.value || Date.now() < suppressCastClickUntil) return;
  openCast(id);
}

function openLoadoutDialog(action: () => void): void {
  loadoutOpen.value = false;
  action();
}

function beginCastDrag(event: PointerEvent, cast: MobileCast, index: TrackIndex): void {
  if (event.button !== 0 || placement.value || drag.value) return;
  event.stopPropagation();
  drag.value = {
    id: cast.id,
    index,
    pointerId: event.pointerId,
    clientX: event.clientX,
    clientY: event.clientY,
    lastClientY: event.clientY,
    startScrollTop: mobileScroll.value?.scrollTop ?? 0,
    startFrame: cast.startFrame,
    visualStartFrame: cast.visualStartFrame,
    previewFrame: cast.startFrame,
    previewVisualFrame: cast.visualStartFrame,
    dragging: false,
    scrolling: false,
  };
  window.addEventListener('pointermove', moveCastDrag, { passive: false });
  window.addEventListener('pointerup', commitCastDrag);
  window.addEventListener('pointercancel', cancelCastDrag);
  longPressTimer = window.setTimeout(() => {
    const gesture = drag.value;
    if (gesture && !gesture.scrolling && !cast.locked && !props.readOnly) {
      gesture.dragging = true;
      suppressCastClickUntil = Date.now() + 500;
    }
    longPressTimer = null;
  }, 280);
}

function moveCastDrag(event: PointerEvent): void {
  const gesture = drag.value;
  if (!gesture || gesture.pointerId !== event.pointerId) return;
  gesture.lastClientY = event.clientY;
  const deltaY = event.clientY - gesture.clientY;
  if (!gesture.dragging) {
    if (Math.hypot(event.clientX - gesture.clientX, deltaY) <= 8) return;
    clearLongPress();
    gesture.scrolling = true;
    suppressCastClickUntil = Date.now() + 250;
    if (mobileScroll.value) mobileScroll.value.scrollTop = gesture.startScrollTop - deltaY;
    return;
  }
  event.preventDefault();
  updateDragPreview();
  if (autoScrollFrame === null) autoScrollFrame = window.requestAnimationFrame(autoScroll);
}

function finishCastDrag(event: PointerEvent, commit: boolean): void {
  const gesture = drag.value;
  if (!gesture || gesture.pointerId !== event.pointerId) return;
  if (commit && gesture.dragging && gesture.previewFrame !== gesture.startFrame) {
    if (!props.readOnly) emit('moveCast', gesture.id, gesture.index, gesture.previewFrame);
  }
  if (!commit || gesture.dragging || gesture.scrolling) suppressCastClickUntil = Date.now() + 350;
  cancelCastPointerSession();
}

function commitCastDrag(event: PointerEvent): void {
  finishCastDrag(event, true);
}

function cancelCastDrag(event: PointerEvent): void {
  finishCastDrag(event, false);
}

function cancelCastPointerSession(): void {
  clearLongPress();
  stopAutoScroll();
  window.removeEventListener('pointermove', moveCastDrag);
  window.removeEventListener('pointerup', commitCastDrag);
  window.removeEventListener('pointercancel', cancelCastDrag);
  drag.value = null;
}

function clearLongPress(): void {
  if (longPressTimer !== null) window.clearTimeout(longPressTimer);
  longPressTimer = null;
}

function stopAutoScroll(): void {
  if (autoScrollFrame !== null) window.cancelAnimationFrame(autoScrollFrame);
  autoScrollFrame = null;
}

function updateDragPreview(): void {
  const gesture = drag.value;
  if (!gesture || !gesture.dragging) return;
  const movement =
    gesture.lastClientY -
    gesture.clientY +
    (mobileScroll.value?.scrollTop ?? 0) -
    gesture.startScrollTop;
  const visualTarget = yFrame(frameY(gesture.visualStartFrame) + movement);
  gesture.previewFrame = snapFrame(gesture.startFrame + visualTarget - gesture.visualStartFrame);
  gesture.previewVisualFrame = gesture.visualStartFrame + gesture.previewFrame - gesture.startFrame;
}

function autoScroll(): void {
  autoScrollFrame = null;
  const gesture = drag.value;
  const scroll = mobileScroll.value;
  if (!gesture?.dragging || !scroll) return;
  const bounds = scroll.getBoundingClientRect();
  const edge = 48;
  const speed =
    gesture.lastClientY < bounds.top + edge
      ? -Math.min(12, (bounds.top + edge - gesture.lastClientY) / 4)
      : gesture.lastClientY > bounds.bottom - edge
        ? Math.min(12, (gesture.lastClientY - bounds.bottom + edge) / 4)
        : 0;
  if (speed === 0) return;
  scroll.scrollTop += speed;
  updateDragPreview();
  autoScrollFrame = window.requestAnimationFrame(autoScroll);
}

let unregisterBackHandler: (() => void) | null = null;
let readyFrame: number | null = null;
onMounted(() => {
  void nextTick().then(() => {
    readyFrame = window.requestAnimationFrame(() => {
      readyFrame = window.requestAnimationFrame(() => {
        readyFrame = null;
        notifyNativeAppReady();
      });
    });
  });
  unregisterBackHandler = registerBackHandler(() => {
    const visibleDialog = Array.from(document.querySelectorAll<HTMLElement>('.el-dialog'))
      .filter(dialog => dialog.getClientRects().length > 0)
      .at(-1);
    const dialogClose = visibleDialog?.querySelector<HTMLButtonElement>('.el-dialog__headerbtn');
    if (dialogClose) {
      dialogClose.click();
      return true;
    }
    if (visibleDialog) return true;
    const drawers = [moreOpen, enemyOpen, inspectorOpen, loadoutOpen, libraryOpen];
    const openDrawer = drawers.find(drawer => drawer.value);
    if (openDrawer) {
      openDrawer.value = false;
      return true;
    }
    if (placement.value) {
      placement.value = null;
      return true;
    }
    if (guideFrame.value !== null) {
      clearGuide();
      return true;
    }
    if (view.value === 'analysis') {
      view.value = 'timeline';
      return true;
    }
    return false;
  });
});
onUnmounted(() => {
  cancelCastPointerSession();
  if (readyFrame !== null) window.cancelAnimationFrame(readyFrame);
  unregisterBackHandler?.();
  emit('guideFrame', null);
});

function castTop(cast: MobileCast): number {
  return frameY(
    drag.value?.id === cast.id && drag.value.dragging
      ? drag.value.previewVisualFrame
      : cast.visualStartFrame,
  );
}

function castFreezeBands(cast: MobileCast) {
  const castEndFrame = cast.visualStartFrame + cast.durationFrames;
  return props.freezeBands.flatMap(band => {
    if (band.sourceCastId !== cast.id) return [];
    const startFrame = Math.max(cast.visualStartFrame, band.startFrame);
    const endFrame = Math.min(castEndFrame, band.endFrame);
    return endFrame <= startFrame
      ? []
      : [
          {
            top: (startFrame - cast.visualStartFrame) * PX_PER_FRAME,
            height: Math.max(2, (endFrame - startFrame) * PX_PER_FRAME),
          },
        ];
  });
}

function beginTrackDrag(event: PointerEvent, index: TrackIndex): void {
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  trackDrag.value = {
    index,
    pointerId: event.pointerId,
    clientX: event.clientX,
    target: index,
    moved: false,
  };
  (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
}

function moveTrackDrag(event: PointerEvent): void {
  const gesture = trackDrag.value;
  if (!gesture || gesture.pointerId !== event.pointerId) return;
  if (Math.abs(event.clientX - gesture.clientX) > 10) gesture.moved = true;
  const target = document
    .elementFromPoint(event.clientX, event.clientY)
    ?.closest<HTMLElement>('[data-mobile-track]');
  const index = Number(target?.dataset.mobileTrack);
  if (Number.isInteger(index) && index >= 0 && index < 4) gesture.target = index as TrackIndex;
}

function finishTrackDrag(event: PointerEvent, commit: boolean): void {
  const gesture = trackDrag.value;
  if (!gesture || gesture.pointerId !== event.pointerId) return;
  trackDrag.value = null;
  if (gesture.moved) {
    suppressTrackClickUntil = Date.now() + 350;
    if (commit && gesture.target !== gesture.index && !props.readOnly)
      emit('swapTracks', gesture.index, gesture.target);
  }
}

function openTrackLoadout(index: TrackIndex): void {
  if (Date.now() < suppressTrackClickUntil) return;
  emit('selectTrack', index);
  loadoutOpen.value = true;
}

function inspectTime(event: PointerEvent): void {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  guideFrame.value = Math.max(
    startFrame.value,
    Math.min(displayEndFrame.value, Math.round(yFrame(event.clientY - rect.top))),
  );
  emit('guideFrame', guideFrame.value);
}

function beginGuide(event: PointerEvent): void {
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  guidePointerId = event.pointerId;
  try {
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  } catch {
    // Embedded WebViews may not support pointer capture.
  }
  inspectTime(event);
}

function moveGuide(event: PointerEvent): void {
  if (event.pointerId === guidePointerId) inspectTime(event);
}

function finishGuide(event: PointerEvent): void {
  if (event.pointerId !== guidePointerId) return;
  inspectTime(event);
  const rail = event.currentTarget as HTMLElement;
  if (rail.hasPointerCapture?.(event.pointerId)) rail.releasePointerCapture(event.pointerId);
  guidePointerId = null;
}

function clearGuide(): void {
  guidePointerId = null;
  guideFrame.value = null;
  emit('guideFrame', null);
}

function commitRename(): void {
  renameActive.value = false;
  const name = renameDraft.value.trim();
  if (name && name !== props.scenarioName) emit('renameScenario', name);
  else renameDraft.value = props.scenarioName;
}

function formatFrame(frame: number): string {
  const seconds = frame / 30;
  return `${Number.isInteger(seconds) ? seconds : seconds.toFixed(1)}s`;
}

function formatAxisFrame(frame: number): string {
  const wholeFrames = Math.round(frame);
  const seconds = Math.floor(wholeFrames / 30);
  return `${seconds}s${((wholeFrames % 30) + 30) % 30}f`;
}

const DEFAULT_ICON = `${import.meta.env.BASE_URL}icons/default_icon.webp`;

function formatDamage(value: number): string {
  return new Intl.NumberFormat(props.locale, { maximumFractionDigits: 0 }).format(value);
}

function setScenario(value: EaSelectValue | EaSelectValue[]): void {
  if (typeof value === 'string') emit('selectScenario', value);
}
</script>

<template>
  <div class="mobile-viewer-root">
    <div v-if="view === 'timeline'" class="mobile-topbar">
      <div class="mobile-topbar-actions">
        <div class="mobile-scenario-tools">
          <EaButton
            variant="ghost"
            size="sm"
            icon-only
            class="mobile-scenario-tool"
            :aria-label="t('timeline.scenario.renameTooltip')"
            @click="renameActive = true"
            ><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
              <path
                d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
              /></svg
          ></EaButton>
          <EaButton
            variant="ghost"
            size="sm"
            icon-only
            class="mobile-scenario-tool"
            :aria-label="t('timeline.scenario.duplicateTooltip')"
            @click="emit('duplicateScenario')"
            ><svg
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
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg
          ></EaButton>
          <EaButton
            v-if="scenarios.length > 1"
            size="sm"
            icon-only
            class="mobile-scenario-tool"
            variant="danger"
            :aria-label="t('timeline.scenario.deleteTooltip')"
            @click="emit('deleteScenario')"
            ><EaDeleteIcon
          /></EaButton>
          <EaButton
            variant="ghost"
            size="sm"
            icon-only
            class="mobile-scenario-tool"
            :aria-label="t('timeline.scenario.addTooltip')"
            @click="emit('addScenario')"
            ><EaPlusIcon
          /></EaButton>
        </div>
        <div class="mobile-topbar-secondary">
          <input
            v-if="renameActive"
            v-model="renameDraft"
            class="mobile-rename"
            :aria-label="t('timeline.scenario.renameTooltip')"
            @blur="commitRename"
            @keydown.enter="commitRename"
            @keydown.esc="renameActive = false"
          />
          <EaSelect
            v-else
            class="mobile-scenario-select"
            size="sm"
            :model-value="activeScenarioId"
            :options="scenarios.map(item => ({ label: item.name, value: item.id }))"
            @change="setScenario"
          />
          <EaPopover
            v-model:visible="moreOpen"
            trigger="click"
            placement="bottom-end"
            :teleported="true"
            :width="260"
            :show-arrow="true"
            popper-class="mobile-more-popper"
          >
            <template #reference>
              <EaButton
                size="sm"
                icon-only
                class="mobile-more-trigger"
                :aria-label="t('timeline.header.more')"
                :aria-expanded="moreOpen"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="5" r="1.6" />
                  <circle cx="12" cy="12" r="1.6" />
                  <circle cx="12" cy="19" r="1.6" />
                </svg>
              </EaButton>
            </template>
            <div class="mobile-more-panel">
              <section class="mobile-more-section">
                <h4 class="mobile-more-section__title">{{ t('common.language') }}</h4>
                <div class="mobile-locale" role="group" :aria-label="t('common.language')">
                  <EaButton
                    size="sm"
                    class="mobile-locale__btn"
                    :pressed="locale === 'zh-CN'"
                    @click="emit('setLocale', 'zh-CN')"
                    >{{ t('locale.zhCN') }}</EaButton
                  ><EaButton
                    size="sm"
                    class="mobile-locale__btn"
                    :pressed="locale === 'en'"
                    @click="emit('setLocale', 'en')"
                    >{{ t('locale.en') }}</EaButton
                  >
                </div>
                <div class="mobile-appearance-row">
                  <span class="mobile-appearance-row__label">{{ t('common.appearance') }}</span>
                  <div
                    class="mobile-appearance-row__btns"
                    role="group"
                    :aria-label="t('common.appearance')"
                  >
                    <EaButton
                      size="sm"
                      class="mobile-appearance-btn"
                      :pressed="appearance === 'light'"
                      :title="t('common.appearanceLight')"
                      :aria-label="t('common.appearanceLight')"
                      @click="emit('setAppearance', 'light')"
                      ><TimelineAppearanceIcon mode="light" /></EaButton
                    ><EaButton
                      size="sm"
                      class="mobile-appearance-btn"
                      :pressed="appearance === 'dark'"
                      :title="t('common.appearanceDark')"
                      :aria-label="t('common.appearanceDark')"
                      @click="emit('setAppearance', 'dark')"
                      ><TimelineAppearanceIcon mode="dark"
                    /></EaButton>
                  </div>
                </div>
              </section>
              <section class="mobile-more-section">
                <h4 class="mobile-more-section__title">
                  {{ t('timeline.mobile.timeSettings.title') }}
                </h4>
                <div class="mobile-time-settings">
                  <label class="mobile-time-setting-row"
                    ><span>{{ t('timeline.mobile.timeSettings.prepDuration') }}</span
                    ><span class="mobile-time-setting-row__control"
                      ><EaNumberInput
                        v-model="prepDraft"
                        size="sm"
                        :min="0"
                        :step="0.5"
                        :precision="2"
                        controls-position="right"
                        @change="emit('setPrepFrames', Math.round(prepDraft * 30))"
                      />{{ t('timeline.mobile.timeSettings.seconds') }}</span
                    ></label
                  ><label class="mobile-time-setting-row"
                    ><span>{{ t('timeline.mobile.timeSettings.battleDuration') }}</span
                    ><span class="mobile-time-setting-row__control"
                      ><EaNumberInput
                        v-model="durationDraft"
                        size="sm"
                        :min="1"
                        :step="10"
                        :precision="0"
                        controls-position="right"
                        @change="emit('setDurationFrames', Math.round(durationDraft * 30))"
                      />{{ t('timeline.mobile.timeSettings.seconds') }}</span
                    ></label
                  >
                </div>
                <EaButton
                  class="header-more-check-row header-more-check-row--compact mobile-prep-setting"
                  :pressed="prepExpanded"
                  @click="emit('togglePrep')"
                  ><svg
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
                      v-if="prepExpanded"
                      points="3,8 6.5,11.5 13,4.5"
                      stroke-width="2"
                    /></svg
                  ><span>{{ t('timeline.mobile.timeSettings.expandPrep') }}</span></EaButton
                >
              </section>
              <section class="mobile-more-section">
                <h4 class="mobile-more-section__title">{{ t('timeline.mobile.display.title') }}</h4>
                <div class="header-more-checklist header-more-checklist--grid">
                  <EaButton
                    class="header-more-check-row header-more-check-row--compact"
                    :pressed="showDurationBars"
                    @click="showDurationBars = !showDurationBars"
                    ><svg
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
                      /></svg
                    ><span>{{ t('timeline.mobile.display.showDurationBars') }}</span></EaButton
                  ><EaButton
                    class="header-more-check-row header-more-check-row--compact"
                    :pressed="showFreezeEffects"
                    @click="showFreezeEffects = !showFreezeEffects"
                    ><svg
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
                      /></svg
                    ><span>{{ t('timeline.mobile.display.showFreezeEffects') }}</span></EaButton
                  ><EaButton
                    class="header-more-check-row header-more-check-row--compact"
                    :pressed="showStaggerBreaks"
                    @click="showStaggerBreaks = !showStaggerBreaks"
                    ><svg
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
                      /></svg
                    ><span>{{ t('timeline.mobile.display.showStaggerBreaks') }}</span></EaButton
                  ><EaButton
                    class="header-more-check-row header-more-check-row--compact"
                    :pressed="showAnomalies"
                    @click="showAnomalies = !showAnomalies"
                    ><svg
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
                      /></svg
                    ><span>{{ t('timeline.mobile.display.showAnomalies') }}</span></EaButton
                  ><EaButton
                    class="header-more-check-row header-more-check-row--compact"
                    :pressed="showOperationHints"
                    @click="showOperationHints = !showOperationHints"
                    ><svg
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
                      /></svg
                    ><span>{{ t('timeline.mobile.display.showOperationHints') }}</span></EaButton
                  >
                </div>
              </section>
              <section class="mobile-more-section">
                <h4 class="mobile-more-section__title">{{ t('display.keycapMode') }}</h4>
                <EaSelect
                  size="sm"
                  :model-value="keycapMode"
                  :options="[
                    { label: t('display.keyboardKeycaps'), value: 'keyboard' },
                    { label: t('display.gamepadKeycaps'), value: 'gamepad' },
                  ]"
                  @change="
                    value => {
                      if (typeof value === 'string')
                        emit('setKeycapMode', value as 'keyboard' | 'gamepad');
                    }
                  "
                />
              </section>
              <section class="mobile-more-section">
                <div class="mobile-project-actions">
                  <EaButton
                    size="sm"
                    class="mobile-project-action"
                    @click="
                      moreOpen = false;
                      emit('openProject');
                    "
                    ><svg
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
                      <line x1="12" y1="15" x2="12" y2="3" /></svg
                    ><span>{{ t('common.load') }}</span></EaButton
                  ><EaButton
                    size="sm"
                    class="mobile-project-action"
                    @click="
                      moreOpen = false;
                      emit('receiveProject');
                    "
                    ><svg
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
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg
                    ><span>{{ t('timeline.mobile.import') }}</span></EaButton
                  ><EaButton
                    size="sm"
                    class="mobile-project-action"
                    @click="
                      moreOpen = false;
                      emit('exportProject');
                    "
                    ><svg
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
                      <path d="M14 3h7v7" />
                      <path d="M10 14L21 3" />
                      <path d="M21 14v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h7" /></svg
                    ><span>{{ t('common.export') }}</span></EaButton
                  ><EaButton
                    size="sm"
                    variant="danger"
                    class="mobile-project-action"
                    @click="
                      moreOpen = false;
                      emit('resetProject');
                    "
                    ><svg
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
                      /></svg
                    ><span>{{ t('common.reset') }}</span></EaButton
                  >
                </div>
              </section>
            </div>
          </EaPopover>
        </div>
      </div>
    </div>

    <div v-if="view === 'timeline'" class="mobile-editbar">
      <EaButton class="mobile-editbar__library" @click="libraryOpen = true"
        ><svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <path d="M4 5h16M4 12h16M4 19h10" /></svg
        ><span>{{
          selectedTrackModel?.avatar
            ? `${selectedTrackModel.name} · ${t('timeline.mobile.skillLibrary.title')}`
            : t('timeline.mobile.skillLibrary.selectTrack')
        }}</span></EaButton
      >
      <EaButton class="mobile-editbar__enemy" @click="enemyOpen = true"
        ><svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="7" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" /></svg
        ><span>{{ enemyName }}</span></EaButton
      >
      <EaButton
        class="mobile-editbar__icon mobile-editbar__icon--undo"
        :disabled="!canUndo"
        :aria-label="t('timeline.mobile.undo')"
        @click="emit('undo')"
        ><svg
          viewBox="0 0 24 24"
          width="17"
          height="17"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M9 7l-5 5 5 5M5 12h8a6 6 0 0 1 6 6" /></svg
      ></EaButton>
      <EaButton
        class="mobile-editbar__icon mobile-editbar__icon--redo"
        :disabled="!canRedo"
        :aria-label="t('timeline.mobile.redo')"
        @click="emit('redo')"
        ><svg
          viewBox="0 0 24 24"
          width="17"
          height="17"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M15 7l5 5-5 5M19 12h-8a6 6 0 0 0-6 6" /></svg
      ></EaButton>
    </div>

    <div v-if="view === 'timeline' && placement" class="mobile-placement-banner">
      <div>
        <strong>{{ placementHint }}</strong
        ><span>{{ t('timeline.mobile.skillLibrary.placeHint') }}</span>
      </div>
      <EaButton size="sm" @click="placement = null">{{ t('common.cancel') }}</EaButton>
    </div>

    <div
      v-if="view === 'timeline'"
      ref="mobileScroll"
      class="mobile-scroll"
      :style="{ '--mobile-rail-width': `${mobileRailWidth}px` }"
    >
      <div class="mobile-tracks-header">
        <span class="mobile-time-head">{{ t('timeline.mobile.time') }}</span>
        <div
          v-for="track in tracks"
          :key="track.index"
          class="mobile-track-head"
          :data-mobile-track="track.index"
          :class="{
            'is-active': track.index === selectedTrack,
            'is-drop-target': trackDrag?.target === track.index && trackDrag?.moved,
          }"
        >
          <EaButton
            class="mobile-avatar mobile-avatar-btn"
            :aria-label="t('timeline.mobile.loadout.openAria', { name: track.name })"
            @pointerdown="beginTrackDrag($event, track.index)"
            @pointermove="moveTrackDrag"
            @pointerup="finishTrackDrag($event, true)"
            @pointercancel="finishTrackDrag($event, false)"
            @click.stop="openTrackLoadout(track.index)"
          >
            <img :src="track.avatar || DEFAULT_ICON" :alt="track.name" />
          </EaButton>
        </div>
      </div>
      <div
        class="mobile-timeline-wrap"
        :style="{ height: `${timelineHeight}px`, '--mobile-sec-px': `${PX_PER_SECOND}px` }"
      >
        <div
          class="mobile-time-rail"
          :style="showOperationHints ? operationLayout.vars : { '--opw': '0px' }"
          @pointerdown.prevent="beginGuide"
          @pointermove.prevent="moveGuide"
          @pointerup.prevent="finishGuide"
          @pointercancel="finishGuide"
        >
          <div v-if="showStaggerBreaks" class="mobile-stagger-layer">
            <div
              v-for="(band, index) in staggerBands"
              :key="index"
              class="mobile-stagger-band"
              :style="{
                top: `${frameY(band.startFrame)}px`,
                height: `${Math.max(1, frameY(band.endFrame) - frameY(band.startFrame))}px`,
              }"
            />
          </div>
          <div v-if="showOperationHints" class="mobile-operation-layer">
            <span
              v-for="hint in operationLayout.items"
              :key="hint.id"
              class="mobile-operation-keycap"
              :class="`is-${hint.kind}`"
              :style="{ top: `${hint.top}px`, '--lane': hint.lane }"
              :title="hint.label"
              >{{ hint.label }}<i v-if="hint.perfect"
            /></span>
          </div>
          <div class="mobile-time-ticks">
            <div
              v-for="tick in ticks"
              :key="tick.frame"
              class="mobile-time-tick"
              :class="{ 'is-major': tick.major, 'is-battle-start': tick.frame === 0 }"
              :style="{ top: `${tick.top}px` }"
            >
              <span class="mobile-time-mark" /><span class="mobile-time-label">{{
                formatAxisFrame(tick.frame)
              }}</span>
            </div>
          </div>
        </div>
        <div class="mobile-timeline">
          <div
            v-if="prepFrames > 0"
            class="mobile-prep-zone mobile-prep-zone--grid"
            :class="{ 'is-collapsed': !prepExpanded }"
            :style="{ height: `${prepHeight}px` }"
          >
            <EaButton class="mobile-prep-center-label" size="sm" @click="emit('togglePrep')"
              ><span>{{ t('timelineGrid.prep.title') }}</span
              ><span class="mobile-prep-title-icon" :class="{ 'is-collapsed': !prepExpanded }"
                ><svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
                  <path
                    d="M3 10l5-5 5 5"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  /></svg></span
            ></EaButton>
          </div>
          <div class="mobile-battle-start-line" :style="{ top: `${frameY(0)}px` }" />
          <div v-if="showFreezeEffects && activeFreezeBands.length" class="mobile-freeze-layer">
            <div
              v-for="(band, index) in activeFreezeBands"
              :key="index"
              class="mobile-freeze-band"
              :style="{
                top: `${frameY(band.startFrame)}px`,
                height: `${Math.max(1, frameY(band.endFrame) - frameY(band.startFrame))}px`,
              }"
            >
              <span>{{ formatFrame(band.endFrame - band.startFrame) }}</span>
            </div>
          </div>
          <div
            v-for="track in tracks"
            :key="track.index"
            class="mobile-track-col"
            :class="{
              'is-placement-target': placement && track.index === selectedTrack,
              'is-placement-muted': placement && track.index !== selectedTrack,
            }"
            @pointerdown="beginPlacementOnTrack($event, track.index)"
            @pointerup="placeAt($event, track.index)"
            @pointercancel="placementPointerStart = null"
          >
            <template v-for="cast in track.casts" :key="cast.id">
              <div
                v-for="bar in cast.durationBars"
                v-show="showDurationBars"
                :key="`${cast.id}-${bar.id}`"
                class="mobile-duration-bar"
                :style="{
                  top: `${frameY(bar.startFrame)}px`,
                  height: `${Math.max(10, frameY(bar.endFrame) - frameY(bar.startFrame))}px`,
                  right: `${2 + bar.lane * 10}px`,
                  color: bar.color,
                }"
              >
                <span class="mobile-duration-bar__start" />
                <span class="mobile-duration-bar__line" />
                <span class="mobile-duration-bar__end" />
                <span class="mobile-duration-bar__text">{{
                  formatFrame(bar.endFrame - bar.startFrame)
                }}</span>
              </div>
              <div
                class="mobile-action-block"
                :class="{
                  'is-selected': inspectorOpen && cast.id === selectedCastId,
                  'is-dragging': drag?.id === cast.id && drag.dragging,
                  'is-disabled': cast.disabled,
                  'is-attack': cast.isAttack,
                  'has-multiple-badges': showAnomalies && cast.combatBadges.length > 1,
                }"
                :style="{
                  top: `${castTop(cast)}px`,
                  height: `${Math.max(16, cast.durationFrames * PX_PER_FRAME)}px`,
                  '--mobile-cast-color': cast.color,
                }"
                role="button"
                tabindex="0"
                :aria-label="cast.label"
                @pointerdown="beginCastDrag($event, cast, track.index)"
                @contextmenu.prevent
                @click.stop="handleCastClick(cast.id)"
                @keydown.enter.prevent="openCast(cast.id)"
                @keydown.space.prevent="openCast(cast.id)"
              >
                <div
                  v-for="(band, index) in showFreezeEffects ? castFreezeBands(cast) : []"
                  :key="`${cast.id}-freeze-${index}`"
                  class="mobile-action-freeze"
                  :style="{ top: `${band.top}px`, height: `${band.height}px` }"
                >
                  <span class="mobile-action-freeze__shimmer" />
                </div>
                <span class="mobile-action-text">{{ cast.label }}</span>
                <small
                  v-if="drag?.id === cast.id && drag.dragging"
                  class="mobile-action-drag-time"
                  >{{ formatFrame(drag.previewFrame) }}</small
                >
                <div
                  v-if="showAnomalies && cast.combatBadges.length"
                  class="mobile-action-icons"
                  :class="{ 'is-multiple': cast.combatBadges.length > 1 }"
                >
                  <span
                    v-for="badge in cast.combatBadges.slice(
                      0,
                      cast.combatBadges.length > 4 ? 3 : 4,
                    )"
                    :key="badge.id"
                    class="mobile-action-icon-box"
                    :title="badge.title"
                    ><img class="mobile-action-icon" :src="badge.icon" :alt="badge.title" /><small
                      v-if="badge.layers > 1"
                      class="mobile-action-stacks"
                      >{{ badge.layers }}</small
                    ></span
                  >
                  <span
                    v-if="cast.combatBadges.length > 4"
                    class="mobile-action-icon-more"
                    :title="
                      cast.combatBadges
                        .slice(3)
                        .map(badge => badge.title)
                        .join('、')
                    "
                    >+{{ cast.combatBadges.length - 3 }}</span
                  >
                </div>
              </div>
            </template>
          </div>
        </div>
        <div
          v-if="guideFrame !== null"
          class="mobile-guide"
          :style="{ top: `${frameY(guideFrame)}px` }"
        >
          <div class="mobile-guide__panel" :class="{ 'is-below': guidePanelBelow }">
            <TimelineCursorGuide
              mobile
              :time="guideMetrics.time"
              :sp="guideMetrics.sp"
              :poise="guideMetrics.poise"
              :enemy-health="guideMetrics.enemyHealth"
              :gauges="guideMetrics.gauges"
              :enemy-effects="guideEnemyEffects.slice(0, 8)"
              :enemy-effect-overflow="
                guideEnemyEffectOverflow + Math.max(0, guideEnemyEffects.length - 8)
              "
            />
            <EaCloseButton
              size="sm"
              :label="t('common.close')"
              @pointerdown.stop.prevent
              @click.stop="clearGuide"
            />
          </div>
        </div>
      </div>
    </div>

    <MobileAnalysisView v-if="view === 'analysis'" :analysis="analysis" />

    <nav class="mobile-bottom-nav" :aria-label="t('timeline.mobile.app.navigation')">
      <EaButton :aria-current="view === 'timeline' ? 'page' : undefined" @click="view = 'timeline'"
        ><svg
          class="nav-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="16" />
          <path d="M6 15c2.2 0 2.8-6 5-6s2.8 6 5 6c1.5 0 2.1-2.1 3-3.3" /></svg
        >{{ t('timeline.mobile.app.timeline') }}</EaButton
      >
      <EaButton :aria-current="view === 'analysis' ? 'page' : undefined" @click="view = 'analysis'"
        ><svg
          class="nav-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12a9 9 0 1 1-9-9v9z" />
          <path d="M12 3a9 9 0 0 1 9 9h-9z" /></svg
        >{{ t('timeline.mobile.app.analysis') }}</EaButton
      >
    </nav>

    <EaDrawer v-model="libraryOpen" size="78%">
      <div class="skill-library-shell">
        <header class="skill-library-header">
          <div class="skill-library-heading">
            <strong>{{ t('timeline.mobile.skillLibrary.title') }}</strong>
            <span>{{
              selectedTrackModel?.avatar
                ? selectedTrackModel.name
                : t('timeline.mobile.skillLibrary.selectTrack')
            }}</span>
          </div>
          <EaButton size="lg" icon-only :aria-label="t('common.close')" @click="libraryOpen = false"
            ><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M18 6L6 18M6 6l12 12"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
              /></svg
          ></EaButton>
        </header>
        <div v-if="library.length" class="skill-library-list">
          <article
            v-for="entry in library"
            :key="entry.entryKey"
            class="skill-library-item"
            :style="{ '--skill-accent': entry.color }"
          >
            <EaButton
              class="skill-library-main"
              :disabled="readOnly"
              @click="beginPlacement(entry)"
            >
              <img v-if="entry.icon" :src="entry.icon" alt="" class="skill-library-icon" />
              <span class="skill-library-copy"
                ><span class="skill-library-meta"
                  >{{ entry.operationType }} · {{ formatFrame(entry.durationFrames) }}</span
                ><strong>{{ entry.label }}</strong></span
              >
            </EaButton>
            <div v-if="entry.skills.length > 1" class="skill-segment-list">
              <EaButton
                v-for="skill in entry.skills"
                :key="skill.skillKey"
                class="skill-segment-button"
                :disabled="readOnly"
                @click="beginPlacement(entry, skill.skillKey, skill.label)"
                >{{ skill.label }}</EaButton
              >
            </div>
          </article>
        </div>
        <div v-else class="skill-library-empty">{{ t('timeline.mobile.skillLibrary.empty') }}</div>
      </div>
    </EaDrawer>

    <EaDrawer v-model="loadoutOpen" size="85%">
      <div class="m-drawer">
        <header class="m-drawer__header">
          <strong class="m-drawer__title">{{ t('timeline.mobile.loadout.title') }}</strong
          ><EaCloseButton size="lg" :label="t('common.close')" @click="loadoutOpen = false" />
        </header>
        <div class="m-drawer__content">
          <EaButton
            class="loadout-header loadout-editable tech-style"
            @click="openLoadoutDialog(() => emit('openOperator', selectedTrack))"
          >
            <span class="loadout-operator"
              ><span class="loadout-operator__avatar"
                ><img :src="selectedTrackModel?.avatar || DEFAULT_ICON" alt="" /></span
              ><span class="loadout-operator__meta"
                ><strong class="loadout-operator__name">{{
                  selectedTrackModel?.avatar
                    ? selectedTrackModel.name
                    : t('timeline.mobile.loadout.selectOperator')
                }}</strong
                ><small
                  v-if="selectedTrackModel?.operatorLevel !== null"
                  class="loadout-operator__sub"
                  >Lv{{ selectedTrackModel?.operatorLevel }} · {{ t('armory.common.potential') }}
                  {{ selectedTrackModel?.operatorPotential ?? 0 }}</small
                ><small v-if="selectedTrackModel?.setBonus" class="loadout-operator__bonus">{{
                  selectedTrackModel.setBonus
                }}</small></span
              ></span
            >
          </EaButton>
          <div v-if="selectedTrackModel?.avatar" class="loadout-quick-actions">
            <EaButton
              size="sm"
              :disabled="!selectedTrackModel?.avatar"
              @click="openLoadoutDialog(() => emit('openOperatorBuild'))"
              >{{ t('timeline.mobile.loadout.operatorStatus') }}</EaButton
            >
            <EaButton
              size="sm"
              :disabled="!selectedTrackModel?.weapon"
              @click="openLoadoutDialog(() => emit('openWeaponBuild'))"
              >{{ t('timeline.mobile.loadout.weapon') }}</EaButton
            >
            <EaButton
              size="sm"
              :disabled="!selectedTrackModel?.gears.some(gear => gear.name)"
              @click="openLoadoutDialog(() => emit('openGearBuild'))"
              >{{ t('timeline.mobile.loadout.equipment') }}</EaButton
            >
          </div>
          <EaButton
            v-if="selectedTrackModel?.avatar"
            size="sm"
            class="loadout-stat-action"
            :disabled="!selectedTrackModel?.avatar"
            @click="openLoadoutDialog(() => emit('openStats', selectedTrack))"
            >{{ t('statDetail.button') }}</EaButton
          >
          <EaButton
            v-if="selectedTrackModel?.avatar"
            size="sm"
            variant="primary"
            class="loadout-skill-action"
            :disabled="!selectedTrackModel?.avatar"
            @click="
              libraryOpen = true;
              loadoutOpen = false;
            "
            >{{ t('timeline.mobile.skillLibrary.title') }}</EaButton
          >
          <section class="m-field">
            <h3 class="m-label">{{ t('timeline.mobile.loadout.weapon') }}</h3>
            <EaButton
              class="loadout-item loadout-editable tech-style"
              @click="
                openLoadoutDialog(() =>
                  selectedTrackModel?.avatar
                    ? emit('openWeapon', selectedTrack)
                    : emit('openOperator', selectedTrack),
                )
              "
              ><span class="loadout-item__icon"
                ><img :src="selectedTrackModel?.weapon?.icon || DEFAULT_ICON" alt="" /></span
              ><span class="loadout-item__main"
                ><strong class="loadout-item__title">{{
                  selectedTrackModel?.weapon?.name || t('actionLibrary.fallback.noWeapon')
                }}</strong
                ><small v-if="selectedTrackModel?.weapon" class="loadout-item__sub"
                  >Lv{{ selectedTrackModel.weapon.level }}</small
                ></span
              ></EaButton
            >
          </section>
          <section class="m-field">
            <h3 class="m-label">{{ t('timeline.mobile.loadout.equipment') }}</h3>
            <div class="loadout-eq-list">
              <EaButton
                v-for="gear in selectedTrackModel?.gears"
                :key="gear.slot"
                class="loadout-item loadout-editable tech-style border-gear"
                :class="{ 'is-empty': !gear.name }"
                @click="
                  openLoadoutDialog(() =>
                    selectedTrackModel?.avatar
                      ? emit('openGear', selectedTrack, gear.slot)
                      : emit('openOperator', selectedTrack),
                  )
                "
                ><span class="loadout-item__icon"
                  ><img :src="gear.icon || DEFAULT_ICON" alt="" /></span
                ><span class="loadout-item__main"
                  ><strong class="loadout-item__title"
                    ><span class="slot-label">{{
                      t(`timelineGrid.equipmentSlot.${gear.slot}`)
                    }}</span
                    ><span>{{ gear.name || t('actionLibrary.fallback.noEquip') }}</span></strong
                  ></span
                ></EaButton
              >
            </div>
          </section>
        </div>
      </div>
    </EaDrawer>

    <EaDrawer v-model="inspectorOpen" size="85%">
      <div class="m-drawer">
        <header class="m-drawer__header">
          <strong class="m-drawer__title">{{ t('timeline.mobile.actionInfo.title') }}</strong
          ><EaCloseButton size="lg" :label="t('common.close')" @click="inspectorOpen = false" />
        </header>
        <div class="m-drawer__content">
          <div v-if="selectedCast" class="actioninfo-hero">
            <div class="actioninfo-hero__top">
              <div class="actioninfo-hero__avatar">
                <img v-if="selectedCastTrack?.avatar" :src="selectedCastTrack.avatar" alt="" />
              </div>
              <div class="actioninfo-hero__meta">
                <strong class="actioninfo-hero__name">{{ selectedCast.label }}</strong
                ><span class="actioninfo-hero__sub">{{ selectedCastTrack?.name }}</span>
              </div>
            </div>
            <div class="actioninfo-hero__time">
              <div class="time-chip">
                <span class="time-chip__label">{{ t('timeline.mobile.actionInfo.start') }}</span
                ><strong class="time-chip__val">{{
                  formatFrame(selectedCast.visualStartFrame)
                }}</strong>
              </div>
              <div class="time-chip">
                <span class="time-chip__label">{{ t('timeline.mobile.actionInfo.end') }}</span
                ><strong class="time-chip__val">{{
                  formatFrame(selectedCast.visualStartFrame + selectedCast.durationFrames)
                }}</strong>
              </div>
              <div class="time-chip">
                <span class="time-chip__label">{{ t('timeline.mobile.actionInfo.duration') }}</span
                ><strong class="time-chip__val">{{
                  formatFrame(selectedCast.durationFrames)
                }}</strong>
              </div>
            </div>
          </div>
          <section v-if="selectedCast" class="actioninfo-damage">
            <div class="actioninfo-damage__summary">
              <span>{{ t('timeline.mobile.actionInfo.totalDamage') }}</span
              ><strong>{{ formatDamage(selectedCastDamage + selectedEffectDamage) }}</strong>
            </div>
            <div
              v-if="selectedCast.hitMarkers.length || selectedCast.effectHits.length"
              class="actioninfo-damage__groups"
            >
              <section v-if="selectedCast.hitMarkers.length" class="actioninfo-damage__group">
                <EaButton
                  class="actioninfo-damage__group-toggle"
                  :aria-expanded="skillDamageOpen"
                  @click="skillDamageOpen = !skillDamageOpen"
                  ><span class="actioninfo-damage__group-title"
                    >{{ t('battleLog.ui.skillDamage')
                    }}<small>{{ selectedCast.hitMarkers.length }}</small></span
                  ><span class="actioninfo-damage__group-value"
                    ><strong>{{ formatDamage(selectedCastDamage) }}</strong
                    ><svg
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      :class="{ 'is-open': skillDamageOpen }"
                      aria-hidden="true"
                    >
                      <path
                        d="m8 10 4 4 4-4"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      /></svg></span
                ></EaButton>
                <div v-show="skillDamageOpen" class="actioninfo-damage__hits">
                  <EaButton
                    v-for="(hit, index) in selectedCast.hitMarkers"
                    :key="`${hit.hitId}-${hit.frame}`"
                    class="actioninfo-damage-hit"
                    @click="
                      emit(
                        'hitDetail',
                        selectedCastTrack!.index,
                        selectedCast.id,
                        hit.hitId,
                        hit.executionFrame,
                      )
                    "
                    ><span class="actioninfo-damage-hit__label"
                      >{{ t('timeline.mobile.actionInfo.damageHit', { index: index + 1 })
                      }}<small
                        >+{{ formatFrame(hit.frame - selectedCast.visualStartFrame) }}</small
                      ></span
                    ><strong>{{ formatDamage(hit.damage) }}</strong></EaButton
                  >
                </div>
              </section>
              <section v-if="selectedCast.effectHits.length" class="actioninfo-damage__group">
                <EaButton
                  class="actioninfo-damage__group-toggle"
                  :aria-expanded="effectDamageOpen"
                  @click="effectDamageOpen = !effectDamageOpen"
                  ><span class="actioninfo-damage__group-title"
                    >{{ t('battleLog.ui.effectDamage')
                    }}<small>{{ selectedCast.effectHits.length }}</small></span
                  ><span class="actioninfo-damage__group-value"
                    ><strong>{{ formatDamage(selectedEffectDamage) }}</strong
                    ><svg
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      :class="{ 'is-open': effectDamageOpen }"
                      aria-hidden="true"
                    >
                      <path
                        d="m8 10 4 4 4-4"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      /></svg></span
                ></EaButton>
                <div v-show="effectDamageOpen" class="actioninfo-damage__hits">
                  <EaButton
                    v-for="(hit, index) in selectedCast.effectHits"
                    :key="hit.sequence"
                    class="actioninfo-damage-hit"
                    :disabled="!hit.hitId"
                    @click="
                      hit.hitId &&
                      emit(
                        'hitDetail',
                        selectedCastTrack!.index,
                        selectedCast.id,
                        hit.hitId,
                        hit.frame,
                      )
                    "
                    ><span class="actioninfo-damage-hit__label"
                      >{{ t('timeline.mobile.actionInfo.damageHit', { index: index + 1 })
                      }}<small
                        >+{{ formatFrame(hit.frame - selectedCast.visualStartFrame) }}</small
                      ></span
                    ><strong>{{ formatDamage(hit.damage) }}</strong></EaButton
                  >
                </div>
              </section>
            </div>
            <div v-else class="actioninfo-damage__empty">
              {{ t('timeline.mobile.actionInfo.noDamage') }}
            </div>
          </section>
          <div class="actioninfo-actions">
            <EaButton :disabled="readOnly || !selectedCast" @click="emit('toggleCastDisabled')">{{
              selectedCast?.disabled
                ? t('timeline.mobile.actionInfo.enable')
                : t('timeline.mobile.actionInfo.disable')
            }}</EaButton
            ><EaButton
              variant="danger"
              :disabled="readOnly || !selectedCast"
              @click="
                emit('deleteCast');
                inspectorOpen = false;
              "
              >{{ t('common.delete') }}</EaButton
            >
          </div>
        </div>
      </div>
    </EaDrawer>

    <EaDrawer v-model="enemyOpen" size="85%"
      ><div class="mobile-drawer">
        <header>
          <strong>{{ t('resourceMonitor.enemy.dialogTitle') }}</strong
          ><EaButton size="sm" @click="enemyOpen = false">{{ t('common.close') }}</EaButton>
        </header>
        <slot name="enemy" /></div
    ></EaDrawer>
  </div>
</template>

<style scoped>
.mobile-viewer-root {
  height: 100vh;
  height: 100dvh;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--ea-bg-gradient);
  color: var(--ea-fg);
}
.mobile-topbar {
  height: calc(44px + env(safe-area-inset-top));
  flex: none;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: env(safe-area-inset-top) 10px 0;
  border-bottom: 1px solid var(--ea-border-soft);
  background: var(--ea-chrome);
  backdrop-filter: blur(8px);
  box-sizing: border-box;
}
.mobile-topbar-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-width: 0;
}
.mobile-scenario-tools {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  flex: none;
}
.mobile-scenario-tool.ea-button {
  width: 28px;
  min-width: 28px;
  height: 26px;
  padding: 0;
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
.mobile-scenario-select {
  min-width: 0;
  width: 288px;
  max-width: 288px;
  flex: 1 1 288px;
  --el-fill-color-blank: var(--ea-fill-strong);
  --el-border-color: var(--ea-btn-secondary-border);
  --el-border-color-hover: var(--ea-btn-secondary-hover-border);
  --el-text-color-regular: var(--ea-fg-secondary);
}
.mobile-scenario-select :deep(.el-select__wrapper) {
  background: var(--ea-fill-strong);
  box-shadow: inset 0 0 0 1px var(--ea-btn-secondary-border);
  border-radius: 0;
}
.mobile-more-trigger.ea-button {
  width: 34px;
  min-width: 34px;
  height: 24px;
  padding: 0;
  border-radius: 0;
}
:global(.mobile-more-popper) {
  max-height: min(78vh, 640px);
  overflow-y: auto;
}
.mobile-more-panel {
  display: flex;
  flex-direction: column;
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
  color: color-mix(in srgb, var(--ea-gold) 90%, transparent);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.mobile-locale {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
}
.mobile-locale__btn.ea-button,
.mobile-appearance-btn.ea-button {
  min-width: 0;
  --ea-control-bg: var(--ea-fill-soft);
  --ea-control-border: var(--ea-border);
  --ea-control-fg: var(--ea-fg-secondary);
  --ea-control-bg-hover: var(--ea-btn-primary-hover-bg);
  --ea-control-border-hover: var(--ea-btn-primary-border);
  --ea-control-fg-hover: var(--ea-btn-primary-fg);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}
.mobile-locale__btn.ea-button {
  width: 100%;
  padding: 5px 4px;
  font-size: 11px;
  white-space: nowrap;
}
.mobile-locale__btn.ea-button[aria-pressed='true'],
.mobile-appearance-btn.ea-button[aria-pressed='true'] {
  border-color: color-mix(in srgb, var(--ea-gold) 50%, transparent);
  background: color-mix(in srgb, var(--ea-gold) 10%, transparent);
  color: #ffe38a;
}
:global(html[data-theme='light'] .mobile-locale__btn.ea-button[aria-pressed='true']),
:global(html[data-theme='light'] .mobile-appearance-btn.ea-button[aria-pressed='true']) {
  border-color: rgba(180, 140, 0, 0.55);
  background: rgba(180, 140, 0, 0.12);
  color: var(--ea-gold);
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
  color: var(--ea-fg-muted);
  font-size: 11px;
  font-weight: 600;
}
.mobile-appearance-row__btns {
  display: inline-grid;
  grid-template-columns: repeat(2, 28px);
  gap: 4px;
}
.mobile-appearance-btn.ea-button {
  width: 28px;
  min-width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
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
  font:
    10px 'Roboto Mono',
    Consolas,
    monospace;
}
.mobile-time-setting-row__control :deep(.ea-number-input) {
  width: 116px;
}
.mobile-prep-setting {
  width: 100%;
}
.mobile-project-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.mobile-project-action.ea-button {
  width: 100%;
  min-width: 0;
  justify-content: flex-start;
  --ea-control-bg: var(--ea-fill-soft);
  --ea-control-border: var(--ea-border);
  --ea-control-fg: var(--ea-fg-secondary);
}
.mobile-rename {
  min-width: 0;
  max-width: 288px;
  flex: 1 1 288px;
  background: var(--ea-fill-strong);
  border: 1px solid var(--ea-btn-secondary-border);
  color: var(--ea-fg-secondary);
  font: inherit;
  font-size: 12px;
  font-weight: 700;
}
.mobile-editbar {
  height: 72px;
  flex: none;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 34px 34px;
  grid-template-rows: 30px 30px;
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
  border-radius: 0;
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
.mobile-editbar__enemy {
  grid-column: 1;
  grid-row: 1;
  width: 100%;
  color: var(--ea-danger-soft, #ff7875);
}
.mobile-editbar__library {
  grid-column: 1/-1;
  grid-row: 2;
  width: 100%;
}
.mobile-editbar__library span,
.mobile-editbar__enemy span {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.mobile-editbar__icon {
  width: 34px;
  padding: 0;
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
.mobile-editbar__icon:disabled {
  border-color: var(--ea-border-soft);
  background: transparent;
  color: var(--ea-fg-faint);
  opacity: 0.38;
}
.mobile-placement-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-bottom: 1px solid color-mix(in srgb, var(--ea-gold) 55%, var(--ea-border));
  background: color-mix(in srgb, var(--ea-gold) 10%, var(--ea-panel));
}
.mobile-placement-banner div {
  min-width: 0;
  display: flex;
  flex-direction: column;
  font-size: 11px;
}
.mobile-placement-banner span {
  color: var(--ea-fg-muted);
}
.mobile-scroll {
  flex: 1;
  min-height: 0;
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
  grid-template-columns: var(--mobile-rail-width) repeat(4, minmax(0, 1fr));
  padding: 6px 6px 8px;
  background: var(--ea-chrome-sticky);
  border-bottom: 1px solid var(--ea-border-soft);
}
.mobile-time-head {
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  color: var(--ea-fg-muted);
}
.mobile-track-head {
  position: relative;
  display: grid;
  place-items: center;
}
.mobile-track-head.is-drop-target {
  background: color-mix(in srgb, var(--ea-gold) 16%, transparent);
  box-shadow: inset 0 -2px var(--ea-gold);
}
.mobile-avatar {
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid var(--ea-border);
  border-radius: 0;
  overflow: hidden;
  touch-action: pan-y;
  background: var(--ea-fill-soft);
  box-shadow: 0 6px 18px var(--ea-shadow);
}
.mobile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.mobile-avatar-btn.ea-button {
  padding: 0;
  border: 0;
  background: transparent;
  line-height: 0;
}
.mobile-timeline-wrap {
  position: relative;
  display: grid;
  grid-template-columns: var(--mobile-rail-width) minmax(0, 1fr);
  overflow: hidden;
}
.mobile-time-rail {
  position: relative;
  border-right: 1px solid var(--ea-border);
  background: var(--ea-fill-muted);
  touch-action: none;
  cursor: crosshair;
}
.mobile-time-ticks {
  position: absolute;
  inset: 0 -1px 0 0;
  padding-left: var(--opw, 26px);
  pointer-events: none;
}
.mobile-time-tick {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-left: 2px;
  color: var(--ea-fg-muted);
  --mark-len: 12px;
  --mark-color: var(--ea-mark);
}
.mobile-time-mark {
  height: 1px;
  width: 100%;
  background: linear-gradient(
    to left,
    var(--mark-color) 0 var(--mark-len),
    transparent var(--mark-len)
  );
}
.mobile-time-label {
  width: 100%;
  padding-right: 2px;
  box-sizing: border-box;
  color: var(--ea-fg-muted);
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
  text-align: right;
  white-space: nowrap;
}
.mobile-time-tick.is-major {
  --mark-len: 18px;
  --mark-color: var(--ea-mark-major);
}
.mobile-time-tick.is-battle-start {
  --mark-len: 22px;
  --mark-color: var(--ea-mark-strong);
}
.mobile-time-tick.is-battle-start .mobile-time-label {
  color: var(--ea-fg-secondary);
}
.mobile-operation-layer {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 2px;
  width: var(--opw, 22px);
  pointer-events: none;
}
.mobile-operation-keycap {
  position: absolute;
  left: calc(1px + var(--lane, 0) * (var(--capw, 20px) + var(--capgap, 2px)));
  width: var(--capw, 20px);
  height: 14px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateY(-50%);
  border: 1px solid var(--ea-keycap-border);
  background: var(--ea-keycap-bg);
  color: var(--ea-fg);
  border-radius: 2px;
  font:
    700 var(--capfs, 9px) Consolas,
    Monaco,
    monospace;
  white-space: nowrap;
  overflow: hidden;
  box-shadow: 0 1px 1px var(--ea-shadow);
}
.mobile-operation-keycap.is-skill,
.mobile-operation-keycap.is-combo,
.mobile-operation-keycap.is-ultimate {
  border-color: var(--ea-keycap-skill-border);
  background: var(--ea-keycap-skill-bg);
}
.mobile-operation-keycap.is-combo i {
  position: absolute;
  right: -3px;
  top: -3px;
  width: 4px;
  height: 4px;
  background: var(--ea-gold);
}
.mobile-timeline {
  position: relative;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  overflow: hidden;
  background:
    linear-gradient(180deg, var(--ea-grid-wash), transparent 25%),
    repeating-linear-gradient(
      to bottom,
      var(--ea-grid-line) 0px,
      var(--ea-grid-line) 1px,
      transparent 1px,
      transparent var(--mobile-sec-px)
    );
}
.mobile-prep-zone {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  z-index: 6;
  background: var(--ea-prep-fill);
  border-bottom: 1px solid var(--ea-border);
  pointer-events: none;
}
.mobile-prep-center-label.ea-button {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 3px;
  min-height: 28px;
  border: 0;
  background: transparent;
  color: var(--ea-fg-faint);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 2px;
  pointer-events: auto;
}
.mobile-prep-zone.is-collapsed .mobile-prep-center-label {
  min-height: 18px;
  font-size: 9px;
  letter-spacing: 0;
}
.mobile-prep-title-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
}
.mobile-prep-title-icon.is-collapsed svg {
  transform: rotate(180deg);
}
.mobile-battle-start-line {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 2;
  height: 2px;
  background: var(--ea-mark-strong);
  transform: translateY(-1px);
  pointer-events: none;
}
.mobile-track-col {
  position: relative;
  z-index: 3;
  border-left: 1px solid var(--ea-border-soft);
}
.mobile-track-col:first-child {
  border-left: 0;
}
.mobile-track-col.is-placement-target {
  background: color-mix(in srgb, var(--ea-gold) 8%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ea-gold) 55%, transparent);
}
.mobile-track-col.is-placement-muted {
  opacity: 0.48;
}
.mobile-action-block {
  position: absolute;
  left: 4px;
  right: 4px;
  z-index: 4;
  min-height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  box-sizing: border-box;
  border: 1px solid color-mix(in srgb, var(--mobile-cast-color) 90%, transparent);
  border-radius: 0;
  background: color-mix(in srgb, var(--mobile-cast-color) 18%, transparent);
  box-shadow: 0 0 8px color-mix(in srgb, var(--mobile-cast-color) 16%, transparent);
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  cursor: pointer;
}
.mobile-action-block.is-selected,
.mobile-action-block.is-dragging {
  outline: 1px solid color-mix(in srgb, var(--ea-gold) 90%, transparent);
  box-shadow: 0 0 12px color-mix(in srgb, var(--ea-gold) 24%, transparent);
}
.mobile-action-block.is-attack {
  border-color: color-mix(in srgb, var(--mobile-cast-color) 45%, transparent);
  background: color-mix(in srgb, var(--mobile-cast-color) 6%, transparent);
  box-shadow: none;
}
.mobile-action-block.is-disabled {
  opacity: 0.45;
}
.mobile-action-freeze {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 1;
  max-height: calc(100% - 1px);
  overflow: hidden;
  border-bottom: 1px solid color-mix(in srgb, var(--ea-fg) 30%, transparent);
  background: color-mix(in srgb, var(--ea-fg) 6%, transparent);
  pointer-events: none;
}
.mobile-action-freeze__shimmer {
  position: absolute;
  inset: 0;
  width: 200%;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--ea-fg) 16%, transparent),
    transparent
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
  z-index: 5;
  display: grid;
  grid-template-columns: 14px;
  grid-auto-rows: 14px;
  gap: 2px;
  transform: translateY(-50%);
  pointer-events: none;
}
.mobile-action-icons.is-multiple {
  grid-template-columns: repeat(2, 14px);
}
.mobile-action-icon-box {
  position: relative;
  width: 14px;
  height: 14px;
}
.mobile-action-icon {
  display: block;
  width: 14px;
  height: 14px;
  object-fit: contain;
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.8));
}
.mobile-action-icon-more {
  display: grid;
  place-items: center;
  width: 14px;
  height: 14px;
  box-sizing: border-box;
  border: 1px solid color-mix(in srgb, var(--ea-fg) 28%, transparent);
  background: color-mix(in srgb, var(--ea-panel) 88%, transparent);
  color: var(--ea-fg-muted);
  font-size: 8px;
  font-weight: 800;
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
  font-weight: 800;
  text-align: center;
}
.mobile-action-text {
  position: relative;
  z-index: 2;
  max-width: 100%;
  padding: 0 18px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--ea-action-fg);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1px;
  text-align: center;
  text-shadow: var(--ea-action-fg-shadow);
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
}
.mobile-guide {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 20;
  height: 1px;
  border-top: 1px solid color-mix(in srgb, var(--ea-gold) 82%, transparent);
  box-shadow: 0 0 6px color-mix(in srgb, var(--ea-gold) 55%, transparent);
  pointer-events: none;
}
.mobile-guide__panel {
  position: absolute;
  right: 6px;
  bottom: 5px;
  width: min(286px, calc(100vw - 66px));
}
.mobile-guide__panel.is-below {
  top: 5px;
  bottom: auto;
}
.mobile-guide__panel :deep(.timeline-cursor-guide-panel) {
  width: 100%;
  max-width: 100%;
}
.mobile-guide__panel :deep(.ea-close-button) {
  position: absolute;
  top: 4px;
  right: 4px;
  pointer-events: auto;
}
.mobile-bottom-nav {
  min-height: 58px;
  flex: none;
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding-bottom: env(safe-area-inset-bottom);
  border-top: 1px solid var(--ea-border);
  background: var(--ea-chrome);
}
.mobile-bottom-nav :deep(.ea-button) {
  position: relative;
  height: auto;
  min-width: 0;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--ea-fg-muted);
  font-size: 10px;
}
.mobile-bottom-nav :deep([aria-current='page']) {
  color: var(--ea-gold);
}
.mobile-bottom-nav :deep([aria-current='page']::before) {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  width: 28px;
  height: 2px;
  background: var(--ea-gold);
  transform: translateX(-50%);
}
.nav-icon {
  width: 21px;
  height: 21px;
  flex: 0 0 21px;
}
.mobile-freeze-layer {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}
.mobile-freeze-band {
  position: absolute;
  left: 0;
  right: 0;
  min-height: 2px;
  box-sizing: border-box;
  border-block: 1px dashed color-mix(in srgb, var(--ea-fg) 24%, transparent);
  background: color-mix(in srgb, var(--ea-panel) 52%, transparent);
  box-shadow: inset 0 0 14px color-mix(in srgb, #000 38%, transparent);
}
.mobile-freeze-band span {
  position: absolute;
  top: 50%;
  right: 4px;
  transform: translateY(-50%);
  color: var(--ea-fg-muted);
  font-size: 9px;
  font-weight: 800;
  white-space: nowrap;
}
.mobile-stagger-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.mobile-stagger-band {
  position: absolute;
  left: 0;
  right: 0;
  min-height: 2px;
  box-sizing: border-box;
  border-top: 1px solid rgba(255, 213, 145, 0.45);
  border-bottom: 1px solid rgba(255, 213, 145, 0.32);
  background:
    repeating-linear-gradient(135deg, rgba(255, 213, 145, 0.58) 0 2px, transparent 2px 10px),
    rgba(255, 156, 110, 0.1);
}
.mobile-duration-bar {
  position: absolute;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 2px;
  pointer-events: none;
}
.mobile-duration-bar__line {
  flex: 1 1 auto;
  width: 2px;
  background: currentColor;
  opacity: 0.9;
}
.mobile-duration-bar__start,
.mobile-duration-bar__end {
  flex: 0 0 auto;
  width: 8px;
  height: 1px;
  background: currentColor;
}
.mobile-duration-bar__text {
  position: absolute;
  left: 6px;
  top: 0;
  color: currentColor;
  font-size: 9px;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
  text-shadow: var(--ea-action-fg-shadow);
}
.mobile-drawer {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 100%;
  padding: 12px;
  box-sizing: border-box;
  background: var(--ea-panel);
  color: var(--ea-fg);
}
.mobile-drawer header {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--ea-border);
  background: var(--ea-panel);
}
.mobile-drawer > label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}
.mobile-drawer > label :deep(.ea-number-input),
.mobile-drawer > label :deep(.ea-select) {
  width: min(55%, 205px);
  flex: 0 0 min(55%, 205px);
}
.mobile-drawer :deep(.enemy-settings-panel) {
  height: auto;
  overflow: visible;
  flex: none;
}
.mobile-drawer :deep(.enemy-settings-panel .stats-summary) {
  flex: none;
  min-height: auto;
}
.skill-library-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: var(--ea-fg);
}
.skill-library-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid var(--ea-border-soft);
}
.skill-library-heading {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}
.skill-library-heading strong {
  font-size: 14px;
}
.skill-library-heading span {
  overflow: hidden;
  color: var(--ea-fg-muted);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.skill-library-list {
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px calc(18px + env(safe-area-inset-bottom));
  overflow-y: auto;
  overscroll-behavior: contain;
}
.skill-library-item {
  border-left: 3px solid var(--skill-accent);
  background: var(--ea-fill-soft);
}
.skill-library-main.ea-button {
  display: flex;
  width: 100%;
  min-height: 58px;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--ea-border-soft);
  border-left: 0;
  background: transparent;
  color: var(--ea-fg);
  text-align: left;
}
.skill-library-icon {
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  object-fit: contain;
}
.skill-library-copy {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 3px;
}
.skill-library-copy strong {
  overflow-wrap: anywhere;
  font-size: 13px;
}
.skill-library-meta {
  color: var(--ea-fg-muted);
  font-size: 10px;
}
.skill-segment-list {
  display: flex;
  gap: 6px;
  padding: 8px 10px 9px;
  overflow-x: auto;
}
.skill-segment-button.ea-button {
  min-width: 36px;
  height: 30px;
  flex: 0 0 auto;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-muted);
  color: var(--ea-fg-secondary);
  font:
    700 11px 'Roboto Mono',
    monospace;
}
.skill-library-empty {
  padding: 36px 16px;
  color: var(--ea-fg-muted);
  font-size: 13px;
  text-align: center;
}
@media (min-width: 769px) and (max-width: 1366px) {
  .skill-library-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-content: start;
  }
}
.m-drawer {
  height: 100%;
  overflow-y: auto;
  background: var(--ea-panel);
  color: var(--ea-fg);
}
.m-drawer__header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 12px 10px;
  background: var(--ea-panel);
}
.m-drawer__title {
  font-size: 14px;
  font-weight: 900;
}
.m-drawer__content {
  padding: 12px 12px calc(16px + env(safe-area-inset-bottom));
}
.m-field {
  margin-bottom: 14px;
}
.m-label {
  margin: 0 0 8px;
  color: var(--ea-fg-muted);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.5px;
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
.loadout-header.ea-button {
  display: flex;
  height: auto;
  min-height: 76px;
  width: 100%;
  justify-content: flex-start;
  margin-bottom: 14px;
  padding: 14px;
  border: 1px solid var(--ea-border);
  border-left: 3px solid var(--ea-gold);
  background: linear-gradient(135deg, var(--ea-fill-soft) 0%, transparent 100%);
  text-align: left;
}
.loadout-operator {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}
.loadout-operator__avatar {
  display: grid;
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--ea-gold) 22%, transparent);
  background: color-mix(in srgb, var(--ea-gold) 6%, transparent);
  overflow: hidden;
}
.loadout-operator__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.loadout-operator__meta,
.loadout-item__main {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}
.loadout-operator__name,
.loadout-item__title {
  overflow: hidden;
  color: var(--ea-fg);
  font-size: 13px;
  text-overflow: ellipsis;
}
.loadout-operator__name {
  font-size: 14px;
  font-weight: 900;
}
.loadout-operator__sub,
.loadout-item__sub {
  color: var(--ea-fg-faint);
  font-size: 11px;
}
.loadout-operator__bonus {
  color: var(--ea-gold);
  font-size: 10px;
}
.loadout-quick-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}
.loadout-quick-actions :deep(.ea-button) {
  min-width: 0;
  white-space: normal;
}
.loadout-stat-action.ea-button,
.loadout-skill-action.ea-button {
  width: 100%;
  margin-bottom: 8px;
}
.loadout-eq-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.loadout-item.ea-button {
  display: flex;
  width: 100%;
  height: auto;
  min-height: 66px;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--ea-border);
  border-left: 3px solid var(--ea-gold);
  background: linear-gradient(135deg, var(--ea-fill-soft) 0%, transparent 100%);
  text-align: left;
}
.loadout-item.border-gear.ea-button {
  border-left-color: var(--ea-gear-accent, #2dd4bf);
}
.loadout-item.is-empty {
  opacity: 0.72;
}
.loadout-item__icon {
  display: grid;
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
  place-items: center;
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
  object-fit: contain;
}
.loadout-item__title {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 10px;
  line-height: 1.2;
}
.loadout-item__title .slot-label {
  color: var(--ea-gear-accent-fg);
  font-size: 13px;
}
.loadout-editable:not(:disabled):hover {
  border-color: var(--ea-gold);
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
  flex: 0 0 44px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--ea-gold) 22%, transparent);
  background: color-mix(in srgb, var(--ea-gold) 6%, transparent);
}
.actioninfo-hero__avatar img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.actioninfo-hero__meta {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}
.actioninfo-hero__name {
  color: var(--ea-fg);
  font-size: 14px;
  font-weight: 900;
  line-height: 1.15;
}
.actioninfo-hero__sub {
  color: var(--ea-fg-muted);
  font-size: 11px;
}
.actioninfo-hero__time {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin-top: 12px;
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
  color: var(--ea-fg-muted);
  font-size: 11px;
  font-weight: 900;
}
.time-chip__val {
  color: var(--ea-fg-secondary);
  font:
    700 12px 'Roboto Mono',
    Consolas,
    monospace;
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
.actioninfo-damage__group-toggle.ea-button {
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
  gap: 6px;
}
.actioninfo-damage__group-title {
  font-size: 11px;
  font-weight: 800;
}
.actioninfo-damage__group-title small {
  min-width: 18px;
  padding: 1px 5px;
  border: 1px solid var(--ea-border-soft);
  color: var(--ea-fg-muted);
  font-size: 9px;
  text-align: center;
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
.actioninfo-damage-hit.ea-button {
  width: 100%;
  min-height: 38px;
  padding: 6px 2px;
  border: 0;
  border-bottom: 1px solid var(--ea-border-soft);
  background: transparent;
  color: var(--ea-fg-secondary);
  text-align: left;
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
.actioninfo-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
}
</style>
