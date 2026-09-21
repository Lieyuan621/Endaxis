<script setup lang="ts">
import { EaTooltip } from '@/design-system';
/**
 * 时间轴动作块的展示组件。
 *
 * 只管画形状、配色和编辑状态，不读项目数据也不碰模拟器；命中点、警告这类内容
 * 由外部算好传进来，不让这个组件像旧版 ActionItem 那样什么都管。
 */
import { computed, ref } from 'vue';
import { EditPen } from '@element-plus/icons-vue';
import { EaButton } from '../../../design-system/index';
import type { SkillType } from '../../../core/game-data/operatorDefinition';
import { PROJECT_FPS } from '../../../core/project/schema';
import type { TimelineConnectionPort } from './timelineConnections';
import {
  projectTimelineHitMarkerLeftPx,
  type TimelineHitMarkerView,
} from '../results/timelineHitProjection';

const props = defineProps<{
  actionId: string;
  label: string;
  skillType: SkillType | null;
  left: number;
  width: number;
  /** 同轨文档顺序投影出的稳定叠放序号；只参与 paint，不进入项目模型。 */
  stackOrder?: number;
  selected?: boolean;
  /** 原生成功分支回执确认的完美连携，不从时间邻接猜测。 */
  perfect?: boolean;
  disabled?: boolean;
  locked?: boolean;
  edited?: boolean;
  moving?: boolean;
  /** 已启动但在当前模拟终点前尚未到达实例局部可操作边界。 */
  durationPending?: boolean;
  color?: string | null;
  connectionToolEnabled?: boolean;
  connectionDragging?: boolean;
  connectionSourceActionId?: string | null;
  connectionTargetValid?: boolean;
  /** 合法性诊断归约到该技能块的警告标记。 */
  warning?: boolean;
  warningText?: string;
  warningFallbackText?: string;
  /** 技能块上的独立命中点标记，点击后打开命中详情。 */
  hits?: readonly TimelineHitMarkerView[];
  /** 由该技能产生的时间膨胀流光，沿用旧版从技能块左侧开始并裁剪到块内。 */
  timeDilationSegments?: readonly { readonly left: number; readonly width: number }[];
  /** 由运行时冷却回执投影出的现实时间持续条；不预测模拟终点外的结束帧。 */
  cooldownBars?: readonly {
    readonly offsetFrames: number;
    readonly durationFrames: number;
    readonly completed: boolean;
  }[];
  /** 由该次释放创建的精确强化 Buff 实例生命周期。 */
  enhancementBars?: readonly {
    readonly offsetFrames: number;
    readonly durationFrames: number;
    readonly completed: boolean;
  }[];
  pxPerFrame: number;
}>();

const emit = defineEmits<{
  select: [event: MouseEvent];
  movePointerDown: [event: PointerEvent];
  contextmenu: [event: MouseEvent];
  connectionPointerDown: [event: PointerEvent, port: TimelineConnectionPort];
  hitClick: [hitId: string, executionFrame?: number];
  hoverChange: [hovered: boolean];
}>();

const connectionPorts: readonly TimelineConnectionPort[] = ['top', 'right', 'bottom', 'left'];
const hovered = ref(false);
const showConnectionPorts = computed(() => {
  if (props.connectionDragging) {
    return hovered.value && props.connectionSourceActionId !== props.actionId;
  }
  if (!props.connectionToolEnabled) return false;
  return hovered.value || props.selected === true;
});

const blockStyle = computed(() => ({
  left: `${props.left}px`,
  width: `${Math.max(2, props.width)}px`,
  zIndex: `calc(${props.moving ? 20000 : props.selected ? 10000 : 10} + ${props.stackOrder ?? 0})`,
  ...(props.color ? { '--action-accent': props.color } : {}),
}));

function beginMove(event: PointerEvent): void {
  if (props.connectionToolEnabled) return;
  emit('movePointerDown', event);
}

function setHovered(value: boolean): void {
  hovered.value = value;
  emit('hoverChange', value);
}

function markerStyle(marker: TimelineHitMarkerView): Record<string, string> {
  return {
    left: `${projectTimelineHitMarkerLeftPx(marker.leftPx)}px`,
    '--hit-offset': `${marker.triggered ? 14 + (marker.triggeredStackIndex ?? 0) * 10 : 0}px`,
  };
}

function cooldownBarStyle(index: number): Record<string, string> {
  const bar = props.cooldownBars?.[index];
  if (bar === undefined) return {};
  return {
    left: `${bar.offsetFrames * props.pxPerFrame}px`,
    top: `${56 + ((props.skillType === 'ultimate' ? 1 : 0) + index) * 8}px`,
    width: `${Math.max(1, bar.durationFrames * props.pxPerFrame)}px`,
  };
}

function enhancementBarStyle(index: number): Record<string, string> {
  const bar = props.enhancementBars?.[index];
  if (bar === undefined) return {};
  const firstRow =
    props.skillType === 'ultimate'
      ? Math.max(2, 1 + (props.cooldownBars?.length ?? 0))
      : (props.cooldownBars?.length ?? 0);
  return {
    left: `${bar.offsetFrames * props.pxPerFrame}px`,
    top: `${56 + (firstRow + index) * 8}px`,
    width: `${Math.max(1, bar.durationFrames * props.pxPerFrame)}px`,
  };
}

function formatDurationFrames(frames: number): string {
  const seconds = frames / PROJECT_FPS;
  return `${Number(seconds.toFixed(2))}s`;
}
</script>

<template>
  <EaButton
    variant="ghost"
    type="button"
    class="timeline-action-block"
    :data-timeline-action-id="actionId"
    :class="{
      'is-perfect-combo': perfect,
      'is-disabled': disabled,
      'is-locked': locked,
      'is-moving': moving,
      'is-duration-pending': durationPending,
      'is-connection-tool': connectionToolEnabled,
    }"
    :data-skill-type="skillType"
    :style="blockStyle"
    :draggable="false"
    @pointerdown="beginMove"
    @click.stop="$emit('select', $event)"
    @contextmenu.prevent.stop="$emit('contextmenu', $event)"
    @mouseenter="setHovered(true)"
    @mouseleave="setHovered(false)"
    :data-selected="selected"
  >
    <span
      v-for="(segment, index) in timeDilationSegments ?? []"
      :key="index"
      class="time-dilation-segment"
      :style="{ left: `${segment.left}px`, width: `${segment.width}px` }"
      aria-hidden="true"
    >
      <span class="time-dilation-shimmer"></span>
    </span>
    <span class="action-label">{{ label }}</span>
    <template v-if="skillType === 'ultimate' && !disabled">
      <span class="ultimate-side-bar ultimate-side-bar--left" aria-hidden="true"></span>
      <span class="ultimate-side-bar ultimate-side-bar--right" aria-hidden="true"></span>
    </template>
    <span
      v-for="hit in hits ?? []"
      :key="`${hit.hitId}:${hit.executionFrame ?? 'preview'}`"
      class="hit-marker"
      :class="{
        'is-critical': hit.critical,
        'is-triggered': hit.triggered,
        'is-forced-crit': hit.forcedCritical,
      }"
      :style="markerStyle(hit)"
      :title="hit.title ?? ''"
      draggable="false"
      @pointerdown.stop
      @mousedown.stop.prevent="$emit('hitClick', hit.hitId, hit.executionFrame)"
    ></span>
    <EaTooltip
      v-if="warning"
      :content="warningText || warningFallbackText || ''"
      placement="top"
      effect="dark"
      :show-after="80"
      popper-class="timeline-warning-tooltip"
    >
      <span class="warning-mark" :aria-label="warningFallbackText">
        <svg
          viewBox="0 0 24 24"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path
            d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
          ></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      </span>
    </EaTooltip>
    <EditPen
      v-if="edited"
      class="edited-mark"
      :class="{ 'is-shifted': disabled }"
      aria-label="edited"
    />
    <span v-if="locked" class="status-mark lock-mark" aria-label="locked">
      <svg
        viewBox="0 0 24 24"
        width="12"
        height="12"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    </span>
    <span v-if="disabled" class="status-mark disabled-mark" aria-label="disabled">
      <svg
        viewBox="0 0 24 24"
        width="12"
        height="12"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
      </svg>
    </span>
    <span
      v-for="(bar, index) in cooldownBars ?? []"
      :key="`cooldown:${index}`"
      class="cooldown-timeline-bar"
      :style="cooldownBarStyle(index)"
      aria-hidden="true"
    >
      <span class="cooldown-timeline-bar__duration">{{
        formatDurationFrames(bar.durationFrames)
      }}</span>
      <span class="cooldown-timeline-bar__end"></span>
    </span>
    <span
      v-for="(bar, index) in enhancementBars ?? []"
      :key="`enhancement:${index}`"
      class="enhancement-timeline-bar"
      :style="enhancementBarStyle(index)"
      aria-hidden="true"
    >
      <span class="enhancement-timeline-bar__duration">{{
        formatDurationFrames(bar.durationFrames)
      }}</span>
      <span class="enhancement-timeline-bar__end"></span>
    </span>
    <span
      v-for="port in connectionPorts"
      v-show="showConnectionPorts"
      :key="port"
      class="connection-port"
      :class="[
        `connection-port--${port}`,
        { 'is-invalid-target': connectionTargetValid === false },
      ]"
      :data-connection-action-id="actionId"
      :data-connection-port="port"
      @pointerdown.stop.prevent="$emit('connectionPointerDown', $event, port)"
    ></span>
  </EaButton>
</template>

<style scoped>
.timeline-action-block {
  --action-accent: #a5a5a8;
  --action-fill: color-mix(in srgb, var(--action-accent) 15%, transparent);
  position: absolute;
  /* 与旧版 actions-container 一致：技能块盖住挤入技能区域的 Buff 效果条。 */
  z-index: 10;
  top: var(--timeline-action-top, 55px);
  height: 50px;
  min-width: 0;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  padding: 0 8px;
  border: 2px dashed var(--action-accent);
  background: var(--action-fill);
  color: var(--ea-action-fg, rgba(255, 255, 255, 0.9));
  font-family: inherit;
  font-size: inherit;
  font-weight: 700;
  line-height: normal;
  text-shadow: var(--ea-action-fg-shadow, 0 1px 2px rgba(0, 0, 0, 0.8));
  white-space: nowrap;
  cursor: grab;
  user-select: none;
}

.timeline-action-block:hover {
  filter: brightness(1.18);
}

.timeline-action-block[data-selected='true'] {
  border: 2px dashed var(--ea-action-selected, #fff);
  box-shadow: 0 0 10px color-mix(in srgb, var(--action-accent) 50%, transparent);
}

.timeline-action-block.is-moving {
  cursor: grabbing;
  filter: brightness(1.25);
  box-shadow: 0 0 14px color-mix(in srgb, var(--action-accent) 65%, transparent);
}

.timeline-action-block.is-perfect-combo::after {
  content: '';
  position: absolute;
  inset: -3px;
  z-index: 4;
  box-sizing: border-box;
  border: 1px solid rgb(255 242 168 / 90%);
  border-radius: 3px;
  box-shadow: 0 0 14px color-mix(in srgb, var(--ea-gold) 70%, transparent);
  pointer-events: none;
  animation: perfect-combo-action-pulse 1.15s ease-in-out infinite;
}

@keyframes perfect-combo-action-pulse {
  0%,
  100% {
    opacity: 0.65;
  }
  50% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .timeline-action-block.is-perfect-combo::after,
  .time-dilation-shimmer {
    animation: none;
  }

  .timeline-action-block.is-perfect-combo::after {
    opacity: 1;
  }
}

.timeline-action-block.is-duration-pending {
  border-right-style: dashed;
}

.timeline-action-block.is-disabled {
  border: 2px dashed #555;
  background-color: rgba(40, 40, 40, 0.3);
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 5px,
    rgba(0, 0, 0, 0.5) 5px,
    rgba(0, 0, 0, 0.5) 10px
  );
  color: #777;
  opacity: 0.6;
}

.timeline-action-block.is-locked {
  cursor: not-allowed;
}

.timeline-action-block.is-connection-tool {
  cursor: default;
}

.connection-port {
  position: absolute;
  z-index: 3;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--action-accent);
  box-shadow: 0 0 0 1px var(--ea-workbench-bg);
  cursor: crosshair;
}

.connection-port:hover {
  background: var(--ea-gold);
  transform: scale(1.2);
}

.connection-port.is-invalid-target {
  opacity: 0.28;
  filter: grayscale(1);
  pointer-events: none;
}

.connection-port--top {
  top: -5px;
  left: 50%;
  translate: -50% 0;
}

.connection-port--right {
  top: 50%;
  right: -5px;
  translate: 0 -50%;
}

.connection-port--bottom {
  bottom: -5px;
  left: 50%;
  translate: -50% 0;
}

.connection-port--left {
  top: 50%;
  left: -5px;
  translate: 0 -50%;
}

.timeline-action-block[data-skill-type='battleSkill'] {
  --action-accent: #ff5a5f;
}

.timeline-action-block[data-skill-type='comboSkill'] {
  --action-accent: #facc15;
}

.timeline-action-block:not(.is-disabled)[data-skill-type='ultimate'] {
  --action-accent: #22c55e;
  background: radial-gradient(
    circle at center,
    color-mix(in srgb, var(--action-accent) 50%, transparent) 0%,
    color-mix(in srgb, var(--action-accent) 20%, transparent) 70%,
    color-mix(in srgb, var(--action-accent) 10%, transparent) 100%
  );
}

.timeline-action-block[data-skill-type='basicAttack'] {
  --action-accent: #a5a5a8;
}

.timeline-action-block:not([data-selected='true']):not(
    .is-disabled
  )[data-skill-type='basicAttack'] {
  border: 1.5px solid color-mix(in srgb, var(--action-accent) 40%, transparent);
}

.timeline-action-block:not([data-selected='true']):not(.is-disabled)[data-skill-type='comboSkill'],
.timeline-action-block:not([data-selected='true']):not(.is-disabled)[data-skill-type='ultimate'] {
  border: 1.5px solid var(--action-accent);
  border-radius: 2px;
}

.action-label {
  position: relative;
  z-index: 2;
  overflow: visible;
}

.ultimate-side-bar {
  position: absolute;
  z-index: 2;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--action-accent);
  pointer-events: none;
}

.ultimate-side-bar--left {
  left: 0;
  border-radius: 2px 0 0 2px;
}

.ultimate-side-bar--right {
  right: 0;
  border-radius: 0 2px 2px 0;
}

.cooldown-timeline-bar {
  position: absolute;
  z-index: 2;
  height: 2px;
  background: var(--action-accent);
  opacity: 0.6;
  pointer-events: none;
}

.cooldown-timeline-bar__duration {
  position: absolute;
  top: 3px;
  left: 0;
  color: var(--action-accent);
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
}

.cooldown-timeline-bar__end {
  position: absolute;
  top: -3px;
  width: 1px;
  height: 8px;
  background: var(--action-accent);
}

.cooldown-timeline-bar__end {
  right: 0;
}

.enhancement-timeline-bar {
  position: absolute;
  z-index: 2;
  height: 2px;
  background: #b37feb;
  opacity: 0.8;
  pointer-events: none;
}

.enhancement-timeline-bar__duration {
  position: absolute;
  top: 3px;
  left: 0;
  color: #b37feb;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
}

.enhancement-timeline-bar__end {
  position: absolute;
  top: -3px;
  width: 1px;
  height: 8px;
  background: #b37feb;
}

.enhancement-timeline-bar__end {
  right: 0;
}

.time-dilation-segment {
  position: absolute;
  z-index: 1;
  top: 0;
  bottom: 0;
  overflow: hidden;
  border-right: 1px solid rgba(255, 255, 255, 0.3);
  pointer-events: none;
}

.time-dilation-shimmer {
  position: absolute;
  inset: 0;
  width: 200%;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  will-change: transform;
  animation: time-dilation-shimmer 1.5s infinite linear;
}

@keyframes time-dilation-shimmer {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(50%);
  }
}

.status-mark {
  position: absolute;
  z-index: 25;
  top: 2px;
  width: 12px;
  height: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 1px 2px rgb(0 0 0 / 80%));
  pointer-events: none;
}

.edited-mark {
  position: absolute;
  top: 3px;
  right: 4px;
  width: 11px;
  height: 11px;
  color: var(--ea-gold);
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.8));
}

.edited-mark.is-shifted {
  right: 16px;
}

.lock-mark {
  left: 2px;
}

.disabled-mark {
  right: 2px;
}

.warning-mark {
  position: absolute;
  top: 2px;
  right: 2px;
  z-index: 25;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 12px;
  color: #ff4d4f;
  filter: drop-shadow(0 1px 2px rgb(0 0 0 / 80%));
  cursor: default;
}

.hit-marker {
  position: absolute;
  bottom: -4px;
  z-index: 20;
  width: 6px;
  height: 6px;
  background: #ff4d4f;
  border: 1px solid #333;
  transform: translate(-50%, var(--hit-offset, 0px)) rotate(45deg);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  pointer-events: auto;
  cursor: default;
}

.hit-marker.is-triggered {
  background: #faad14;
  border-color: #d48806;
}

.hit-marker:hover {
  background: var(--ea-gold);
  border-color: #fff;
  transform: translate(-50%, var(--hit-offset, 0px)) rotate(45deg) scale(1.65);
  box-shadow: 0 0 8px var(--ea-gold);
  z-index: 30;
}

.hit-marker.is-triggered:hover {
  transform: translate(-50%, var(--hit-offset, 0px)) rotate(45deg) scale(1.35);
}

.hit-marker.is-critical,
.hit-marker.is-forced-crit {
  background-color: #ff6b6b;
  border-color: #ffd166;
  box-shadow: 0 0 8px rgba(255, 209, 102, 0.9);
}

:global(html[data-theme='light'] .timeline-action-block) {
  color: var(--ea-action-fg, #1a1b1e);
  text-shadow: none;
}

:global(html[data-theme='light'] .timeline-action-block:hover) {
  filter: brightness(1.04);
}

:global(.timeline-warning-tooltip) {
  max-width: min(320px, calc(100vw - 48px));
  white-space: normal;
  overflow-wrap: anywhere;
}
</style>
