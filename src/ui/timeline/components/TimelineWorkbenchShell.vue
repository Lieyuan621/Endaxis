<script setup lang="ts">
/**
 * 时间轴的七列工作台外壳，复刻既有面板几何和活动栏交互。
 * 内容区只通过插槽接入；本组件不读取项目、时间轴或战斗状态。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { EaButton, EaActivityRailButton } from '@/design-system';
import { useInteractionSession } from '../../interaction/interactionSessionContext';
import {
  resolveWorkbenchBottomHeight,
  resolveWorkbenchBottomHeightBounds,
  WORKBENCH_BOTTOM_DEFAULT_HEIGHT,
  WORKBENCH_BOTTOM_RESIZER_HEIGHT,
  WORKBENCH_HEADER_HEIGHT,
  WORKBENCH_TIMELINE_MIN_HEIGHT,
} from '../workbenchLayoutGeometry';

const WORKBENCH_LAYOUT_STORAGE_KEY = 'endaxis:timeline-workbench-layout:v1';
const DEFAULT_LEFT_WIDTH = 200;
const DEFAULT_RIGHT_WIDTH = 260;
const DEFAULT_BOTTOM_HEIGHT = WORKBENCH_BOTTOM_DEFAULT_HEIGHT;
const interactionSession = useInteractionSession();

const props = defineProps<{
  collapsedMonitorSectionCount?: number;
  labels: {
    library: string;
    globalConfig: string;
    contract: string;
    contractUnavailable: string;
    resourceMonitor: string;
    inspector: string;
    performance: string;
    battleLog: string;
    collapsePanel: string;
  };
}>();

const leftCollapsed = ref(false);
const rightCollapsed = ref(false);
const bottomCollapsed = ref(false);
const leftWidth = ref(DEFAULT_LEFT_WIDTH);
const rightWidth = ref(DEFAULT_RIGHT_WIDTH);
const bottomHeight = ref(DEFAULT_BOTTOM_HEIGHT);
const bottomExpandAllToken = ref(0);
const bottomTool = ref<'global' | 'contract' | 'enemy'>('enemy');
const rightTool = ref<'inspector' | 'performance' | 'battleLog'>('inspector');
const resizing = ref<'left' | 'right' | 'bottom' | null>(null);
const workbenchRef = ref<HTMLElement | null>(null);
const workbenchHeight = ref(0);
let stopResize: (() => void) | null = null;
let workbenchResizeObserver: ResizeObserver | null = null;

function updateWorkbenchHeight(): void {
  workbenchHeight.value = workbenchRef.value?.clientHeight ?? 0;
}

const effectiveBottomHeight = computed(() => {
  return resolveWorkbenchBottomHeight(
    workbenchHeight.value,
    bottomHeight.value,
    bottomCollapsed.value,
    bottomTool.value === 'enemy' ? (props.collapsedMonitorSectionCount ?? 0) : 0,
  );
});

const layoutStyle = computed(() => ({
  gridTemplateColumns: `48px ${leftCollapsed.value ? 0 : leftWidth.value}px ${leftCollapsed.value ? 0 : 1}px minmax(540px, 1fr) ${rightCollapsed.value ? 0 : 1}px ${rightCollapsed.value ? 0 : rightWidth.value}px 48px`,
  gridTemplateRows: `${WORKBENCH_HEADER_HEIGHT}px minmax(${WORKBENCH_TIMELINE_MIN_HEIGHT}px, 1fr) ${bottomCollapsed.value ? 0 : WORKBENCH_BOTTOM_RESIZER_HEIGHT}px ${effectiveBottomHeight.value}px`,
}));
const leftStackStyle = computed(() => ({
  gridTemplateRows: `minmax(0, 1fr) ${bottomCollapsed.value ? 0 : WORKBENCH_BOTTOM_RESIZER_HEIGHT}px ${effectiveBottomHeight.value}px`,
}));

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function restoreLayout(): void {
  let stored: unknown;
  try {
    const raw = window.localStorage.getItem(WORKBENCH_LAYOUT_STORAGE_KEY);
    if (raw === null) return;
    stored = JSON.parse(raw);
  } catch {
    return;
  }
  if (stored === null || typeof stored !== 'object') return;
  const value = stored as Record<string, unknown>;
  if (typeof value.leftCollapsed === 'boolean') leftCollapsed.value = value.leftCollapsed;
  if (typeof value.rightCollapsed === 'boolean') rightCollapsed.value = value.rightCollapsed;
  if (typeof value.bottomCollapsed === 'boolean') bottomCollapsed.value = value.bottomCollapsed;
  if (typeof value.leftWidth === 'number') leftWidth.value = clamp(value.leftWidth, 200, 480);
  if (typeof value.rightWidth === 'number') rightWidth.value = clamp(value.rightWidth, 260, 480);
  if (typeof value.bottomHeight === 'number') bottomHeight.value = Math.max(0, value.bottomHeight);
  if (
    value.bottomTool === 'global' ||
    value.bottomTool === 'contract' ||
    value.bottomTool === 'enemy'
  ) {
    bottomTool.value = value.bottomTool;
  }
  if (
    value.rightTool === 'inspector' ||
    value.rightTool === 'performance' ||
    value.rightTool === 'battleLog'
  ) {
    rightTool.value = value.rightTool;
  }
}

function persistLayout(): void {
  try {
    window.localStorage.setItem(
      WORKBENCH_LAYOUT_STORAGE_KEY,
      JSON.stringify({
        leftCollapsed: leftCollapsed.value,
        rightCollapsed: rightCollapsed.value,
        bottomCollapsed: bottomCollapsed.value,
        leftWidth: Math.round(leftWidth.value),
        rightWidth: Math.round(rightWidth.value),
        bottomHeight: Math.round(bottomHeight.value),
        bottomTool: bottomTool.value,
        rightTool: rightTool.value,
      }),
    );
  } catch {
    // Storage may be disabled; the workbench remains fully usable for this session.
  }
}

function resetPanelSize(panel: 'left' | 'right' | 'bottom'): void {
  if (panel === 'left') leftWidth.value = DEFAULT_LEFT_WIDTH;
  else if (panel === 'right') rightWidth.value = DEFAULT_RIGHT_WIDTH;
  else bottomHeight.value = DEFAULT_BOTTOM_HEIGHT;
}

function toggleLeft(): void {
  leftCollapsed.value = !leftCollapsed.value;
}

function selectBottom(tool: typeof bottomTool.value): void {
  if (!bottomCollapsed.value && bottomTool.value === tool) {
    bottomCollapsed.value = true;
    return;
  }
  bottomTool.value = tool;
  if (bottomCollapsed.value) bottomExpandAllToken.value += 1;
  bottomCollapsed.value = false;
}

function collapseBottom(): void {
  bottomCollapsed.value = true;
}

function selectRight(tool: typeof rightTool.value): void {
  if (!rightCollapsed.value && rightTool.value === tool) {
    rightCollapsed.value = true;
    return;
  }
  rightTool.value = tool;
  rightCollapsed.value = false;
}

function beginResize(target: NonNullable<typeof resizing.value>, event: PointerEvent): void {
  if (event.button !== 0) return;
  const lease = interactionSession.tryStart('workbench-resize', () => stopResize?.());
  if (lease === null) {
    event.preventDefault();
    return;
  }
  event.preventDefault();
  stopResize?.();
  resizing.value = target;
  const startX = event.clientX;
  const startY = event.clientY;
  const initialLeft = leftWidth.value;
  const initialRight = rightWidth.value;
  // Viewport/folding constraints can make the saved request differ from the visible panel.
  // Drag from what the user grabbed, not from an off-screen requested height.
  const initialBottom = effectiveBottomHeight.value;
  const onMove = (moveEvent: PointerEvent) => {
    if (moveEvent.pointerId !== event.pointerId || !lease.isCurrent()) return;
    if (target === 'left') {
      leftWidth.value = clamp(initialLeft + moveEvent.clientX - startX, 200, 480);
    } else if (target === 'right') {
      rightWidth.value = clamp(initialRight - moveEvent.clientX + startX, 260, 480);
    } else {
      const bounds = resolveWorkbenchBottomHeightBounds(
        workbenchRef.value?.clientHeight ?? 0,
        initialBottom,
        bottomTool.value === 'enemy' ? (props.collapsedMonitorSectionCount ?? 0) : 0,
      );
      bottomHeight.value = clamp(
        initialBottom - moveEvent.clientY + startY,
        bounds.minimum,
        bounds.maximum,
      );
    }
  };
  const finish = (finishEvent?: PointerEvent) => {
    if (finishEvent !== undefined && finishEvent.pointerId !== event.pointerId) return;
    lease.release();
    resizing.value = null;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', finish);
    window.removeEventListener('pointercancel', finish);
    stopResize = null;
  };
  stopResize = finish;
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', finish);
  window.addEventListener('pointercancel', finish);
}

onBeforeUnmount(() => {
  stopResize?.();
  workbenchResizeObserver?.disconnect();
  workbenchResizeObserver = null;
});

onMounted(() => {
  restoreLayout();
  updateWorkbenchHeight();
  if (typeof ResizeObserver !== 'undefined' && workbenchRef.value !== null) {
    workbenchResizeObserver = new ResizeObserver(updateWorkbenchHeight);
    workbenchResizeObserver.observe(workbenchRef.value);
  }
});
watch(
  [
    leftCollapsed,
    rightCollapsed,
    bottomCollapsed,
    leftWidth,
    rightWidth,
    bottomHeight,
    bottomTool,
    rightTool,
  ],
  persistLayout,
  { flush: 'post' },
);
</script>

<template>
  <div
    ref="workbenchRef"
    class="workbench-layout"
    :class="{
      'is-resizing': resizing !== null,
      'is-resizing-horizontal': resizing === 'left' || resizing === 'right',
      'is-resizing-vertical': resizing === 'bottom',
    }"
    :style="layoutStyle"
  >
    <aside class="activity-bar">
      <div class="activity-group">
        <EaActivityRailButton
          class="activity-button activity-button--library"
          side="left"
          :active="!leftCollapsed"
          :label="props.labels.library"
          @click="toggleLeft"
          icon="/icons/btn_character.webp"
        />
      </div>
      <div class="activity-group activity-group--bottom">
        <EaActivityRailButton
          class="activity-button activity-button--global"
          side="left"
          :active="!bottomCollapsed && bottomTool === 'global'"
          :label="props.labels.globalConfig"
          @click="selectBottom('global')"
          icon="/icons/global_config.webp"
        />
        <EaActivityRailButton
          class="activity-button activity-button--contract"
          side="left"
          :active="!bottomCollapsed && bottomTool === 'contract'"
          :label="props.labels.contract"
          @click="selectBottom('contract')"
          icon="/contingency_contract/deco_contract_028.webp"
          :icon-size="28"
        />
        <EaActivityRailButton
          class="activity-button activity-button--enemy"
          side="left"
          :active="!bottomCollapsed && bottomTool === 'enemy'"
          :label="props.labels.resourceMonitor"
          @click="selectBottom('enemy')"
          icon="/icons/icon_wiki_group_monster_hongshan.webp"
        />
      </div>
    </aside>

    <aside v-show="!leftCollapsed" class="workbench-panel left-panel" :style="leftStackStyle">
      <div class="left-main">
        <slot name="left" :reset-panel="() => resetPanelSize('left')" />
      </div>
      <div v-show="!bottomCollapsed" class="left-bottom-separator"></div>
      <div v-show="!bottomCollapsed" class="left-bottom">
        <slot name="left-bottom" :tool="bottomTool" />
      </div>
    </aside>
    <div
      v-show="!leftCollapsed"
      class="resizer resizer--left"
      @pointerdown="beginResize('left', $event)"
      @dblclick="resetPanelSize('left')"
    ></div>

    <main class="timeline-main">
      <header class="timeline-header"><slot name="header" /></header>
      <div class="timeline-center"><slot /></div>
      <div
        v-show="!bottomCollapsed"
        class="bottom-resizer"
        :class="{ 'is-active': resizing === 'bottom' }"
        @pointerdown="beginResize('bottom', $event)"
        @dblclick="resetPanelSize('bottom')"
      ></div>
      <section v-show="!bottomCollapsed" class="bottom-panel">
        <EaButton
          variant="ghost"
          size="sm"
          icon-only
          v-if="bottomTool !== 'enemy'"
          type="button"
          class="bottom-panel-collapse"
          :title="props.labels.collapsePanel"
          :aria-label="props.labels.collapsePanel"
          @click="collapseBottom"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
        </EaButton>
        <slot
          name="bottom"
          :tool="bottomTool"
          :collapse-panel="collapseBottom"
          :expand-all-token="bottomExpandAllToken"
        />
      </section>
    </main>

    <div
      v-show="!rightCollapsed"
      class="resizer resizer--right"
      @pointerdown="beginResize('right', $event)"
      @dblclick="resetPanelSize('right')"
    ></div>
    <aside v-show="!rightCollapsed" class="workbench-panel right-panel">
      <slot name="right" :tool="rightTool" />
    </aside>

    <aside class="activity-bar activity-bar--right">
      <div class="activity-group">
        <EaActivityRailButton
          class="activity-button activity-button--inspector"
          side="right"
          :active="!rightCollapsed && rightTool === 'inspector'"
          :label="props.labels.inspector"
          @click="selectRight('inspector')"
          icon="/icons/btn_week_raid.webp"
        />
        <EaActivityRailButton
          class="activity-button activity-button--battle-log"
          side="right"
          :active="!rightCollapsed && rightTool === 'battleLog'"
          :label="props.labels.battleLog"
          @click="selectRight('battleLog')"
          icon="/icons/btn_manual.webp"
        />
        <EaActivityRailButton
          class="activity-button activity-button--performance"
          side="right"
          :active="!rightCollapsed && rightTool === 'performance'"
          :label="props.labels.performance"
          @click="selectRight('performance')"
        >
          <template #icon>
            <svg
              class="ea-activity-rail-button__icon activity-performance-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M3 20h18" />
              <rect x="5" y="12" width="3" height="6" />
              <rect x="11" y="7" width="3" height="11" />
              <rect x="17" y="10" width="3" height="8" />
            </svg>
          </template>
        </EaActivityRailButton>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.workbench-layout {
  width: 100vw;
  height: 100vh;
  display: grid;
  /*
   * 时间轴内部会用较高层级抬起选中和拖动中的技能块。工作台必须形成自己的
   * 堆叠上下文，避免这些内部层级越过 append-to-body 的编辑器遮罩和弹窗。
   */
  isolation: isolate;
  overflow: hidden;
  background: var(--ea-workbench);
  color: var(--ea-fg);
  font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  letter-spacing: 0;
}

.workbench-layout.is-resizing {
  user-select: none;
}

.workbench-layout.is-resizing-horizontal,
.workbench-layout.is-resizing-horizontal * {
  cursor: ew-resize !important;
}

.workbench-layout.is-resizing-vertical,
.workbench-layout.is-resizing-vertical * {
  cursor: ns-resize !important;
}

.activity-bar {
  position: relative;
  z-index: 50;
  grid-column: 1;
  grid-row: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0 12px;
  border-right: 1px solid var(--ea-border-soft);
  background: var(--ea-activity-bg);
}

.activity-bar--right {
  grid-column: 7;
  border-right: 0;
  border-left: 1px solid var(--ea-border-soft);
}

.activity-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding-top: 2px;
}

.activity-group--bottom {
  margin-top: auto;
  padding-top: 14px;
}

.activity-performance-icon {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.2;
  stroke-linecap: square;
  stroke-linejoin: miter;
}

.activity-performance-icon rect {
  fill: currentColor;
  stroke: none;
}

.workbench-panel {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--ea-workbench-panel);
}

.left-panel {
  grid-column: 2;
  grid-row: 1 / -1;
  display: grid;
}

.left-main,
.left-bottom {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.left-bottom-separator {
  min-width: 0;
  min-height: 0;
  background: var(--ea-border-soft);
}

.timeline-main {
  position: relative;
  grid-column: 4;
  grid-row: 1 / -1;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: subgrid;
  overflow: hidden;
  background: var(--ea-workbench-main);
}

.timeline-header {
  grid-row: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--ea-border-soft);
  background: var(--ea-workbench-header);
}

.timeline-center {
  grid-row: 2;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.bottom-resizer {
  position: relative;
  z-index: 30;
  grid-row: 3;
  background: var(--ea-border-soft);
  cursor: ns-resize;
  touch-action: none;
}

.bottom-resizer::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 9px;
  transform: translateY(-50%);
}

.bottom-resizer::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0;
  background: var(--ea-active-fill);
  transition: opacity 0.12s ease;
}

.bottom-resizer:hover::before,
.bottom-resizer[aria-pressed='true']::before {
  opacity: 1;
}

.bottom-panel {
  position: relative;
  grid-row: 4;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--ea-workbench-panel);
}

.bottom-panel-collapse {
  position: absolute;
  z-index: 45;
  top: 0;
  left: calc(180px + (100% - 180px) / 2);
  width: 28px;
  height: 16px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--ea-fg-secondary);
  cursor: pointer;
  transform: translate(-50%, -50%);
}

.bottom-panel-collapse.ea-button.ea-button--icon-only {
  width: 28px;
  min-width: 28px;
  height: 16px;
}

.bottom-panel-collapse:hover,
.bottom-panel-collapse:focus-visible {
  color: var(--ea-fg);
}

.bottom-panel-collapse svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.right-panel {
  grid-column: 6;
  grid-row: 1 / -1;
}

.resizer {
  position: relative;
  grid-row: 1 / -1;
  z-index: 30;
  background: var(--ea-border-soft);
  cursor: ew-resize;
  touch-action: none;
}

.resizer::after {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  width: 9px;
  height: 100%;
  transform: translateX(-50%);
}

.resizer:hover {
  background: var(--ea-active-fill);
}

.resizer--left {
  grid-column: 3;
}

.resizer--right {
  grid-column: 5;
}
</style>
