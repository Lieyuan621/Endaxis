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
import type { SkillType } from '../../../core/game-data/operatorDefinition';
import { PROJECT_FPS } from '../../../core/project/schema';
import { useAppearance } from '../../appearance/useAppearance';
import { adaptColorForLightSurface, hexToRgba, solidFillForLightTrack } from '../../gameColors';
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
  showDecorations?: boolean;
  lockedText?: string;
  disabledText?: string;
  editedText?: string;
  moving?: boolean;
  /**
   * 技能已经开始，但模拟结果还不能确定技能块的结束时间。
   * 此时块宽暂用技能定义中的时长，右侧显示虚线，表示这不是已算出的终点。
   * 例如模拟只算到第 10 秒，而技能块应在第 12 秒结束。
   */
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
const { appearance } = useAppearance();
const isLightAppearance = computed(() => appearance.value === 'light');
const decorationsVisible = computed(() => props.showDecorations !== false);

const TYPE_SHORTHAND: Readonly<Partial<Record<SkillType, string>>> = {
  basicAttack: 'A',
  plungingAttack: 'D',
  finisher: 'X',
  battleSkill: 'C',
  comboSkill: 'E',
  ultimate: 'U',
  dodge: 'D',
};

const MAIN_ACTION_COLORS = {
  basicAttack: '#aaaaaa',
  battleSkill: '#ffffff',
  comboSkill: '#fdd900',
  dodge: '#69c0ff',
  finisher: '#a61d24',
  ultimate: '#00e5ff',
  default: '#8c8c8c',
} as const;

const displayLabel = computed(() => {
  if (props.pxPerFrame * PROJECT_FPS >= 30) return props.label;
  return props.skillType === null ? '?' : (TYPE_SHORTHAND[props.skillType] ?? '?');
});

const defaultAccent = computed(() => {
  switch (props.skillType) {
    case 'comboSkill':
      return MAIN_ACTION_COLORS.comboSkill;
    case 'finisher':
      return MAIN_ACTION_COLORS.finisher;
    case 'plungingAttack':
    case 'dodge':
      return MAIN_ACTION_COLORS.dodge;
    case 'ultimate':
      return MAIN_ACTION_COLORS.ultimate;
    case 'basicAttack':
      return MAIN_ACTION_COLORS.basicAttack;
    case 'battleSkill':
      return MAIN_ACTION_COLORS.battleSkill;
    default:
      return MAIN_ACTION_COLORS.default;
  }
});

const actionAccent = computed(() => props.color || defaultAccent.value);
const paintedAccent = computed(() =>
  isLightAppearance.value ? adaptColorForLightSurface(actionAccent.value) : actionAccent.value,
);
const showConnectionPorts = computed(() => {
  if (props.connectionDragging) {
    return hovered.value && props.connectionSourceActionId !== props.actionId;
  }
  if (!props.connectionToolEnabled) return false;
  return hovered.value || props.selected === true;
});

const blockStyle = computed<Record<string, string>>(() => {
  const accent = paintedAccent.value;
  const light = isLightAppearance.value;
  const surface = 'var(--ea-workbench-main, #18181c)';
  const warningOffset = props.warning ? 14 : 0;
  const disabledOffset = decorationsVisible.value && props.disabled ? 14 : 0;
  return {
    left: `${props.left}px`,
    width: `${Math.max(2, props.width)}px`,
    zIndex: `calc(${props.moving ? 20000 : props.selected ? 10000 : 10} + ${props.stackOrder ?? 0})`,
    '--action-accent': accent,
    '--action-surface': surface,
    '--action-fill': light
      ? solidFillForLightTrack(accent, props.skillType === 'basicAttack' ? 0.7 : 0.48)
      : hexToRgba(accent, 0.15),
    '--action-ultimate-center': light
      ? solidFillForLightTrack(accent, 0.32)
      : hexToRgba(accent, 0.5),
    '--action-ultimate-middle': light
      ? solidFillForLightTrack(accent, 0.5)
      : hexToRgba(accent, 0.2),
    '--action-ultimate-edge': light ? solidFillForLightTrack(accent, 0.64) : hexToRgba(accent, 0.1),
    '--action-selected': light ? '#1a1b1e' : '#ffffff',
    '--action-edge-ring': light ? '0 0 0 1px rgb(26 27 30 / 22%)' : 'none',
    '--action-backdrop-filter': light ? 'none' : 'blur(4px)',
    '--action-glow': hexToRgba(accent, light ? 0.18 : 0.5),
    '--action-attack-border': light ? accent : hexToRgba(accent, 0.4),
    '--action-perfect-fill': light
      ? solidFillForLightTrack('#c8a000', 0.55)
      : 'rgba(255, 236, 122, 0.18)',
    '--action-perfect-color': light ? 'var(--ea-gold)' : '#fff7cf',
    '--action-perfect-shadow': light
      ? '0 0 0 1px rgba(140, 110, 0, 0.55), 0 0 10px rgba(180, 140, 0, 0.22)'
      : '0 0 0 1px rgba(255, 242, 168, 0.75), 0 0 14px color-mix(in srgb, var(--ea-gold) 55%, transparent)',
    '--cooldown-accent': light
      ? adaptColorForLightSurface(
          props.skillType === 'comboSkill'
            ? MAIN_ACTION_COLORS.comboSkill
            : props.skillType === 'ultimate'
              ? MAIN_ACTION_COLORS.ultimate
              : '#ff6fae',
        )
      : props.skillType === 'comboSkill'
        ? 'var(--ea-gold)'
        : props.skillType === 'ultimate'
          ? MAIN_ACTION_COLORS.ultimate
          : '#ff6fae',
    '--enhancement-accent': light ? adaptColorForLightSurface('#b37feb') : '#b37feb',
    '--disabled-mark-right': `${2 + warningOffset}px`,
    '--edited-mark-right': `${2 + warningOffset + disabledOffset}px`,
  };
});

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
  <button
    type="button"
    :aria-pressed="selected"
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
    <template v-if="decorationsVisible">
      <span
        v-for="(segment, index) in timeDilationSegments ?? []"
        :key="index"
        class="time-dilation-segment"
        :style="{ left: `${segment.left}px`, width: `${segment.width}px` }"
        aria-hidden="true"
      >
        <span class="time-dilation-shimmer"></span>
      </span>
    </template>
    <span class="action-label">{{ displayLabel }}</span>
    <template v-if="decorationsVisible && skillType === 'ultimate' && !disabled">
      <span class="ultimate-side-bar ultimate-side-bar--left" aria-hidden="true"></span>
      <span
        v-if="!durationPending"
        class="ultimate-side-bar ultimate-side-bar--right"
        aria-hidden="true"
      ></span>
    </template>
    <span v-if="durationPending" class="duration-pending-mark" aria-hidden="true"></span>
    <span
      v-for="hit in hits ?? []"
      :key="`${hit.hitId}:${hit.executionFrame ?? 'preview'}`"
      class="hit-marker"
      :class="{
        'is-link-buffed': hit.linkBuffed,
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
      v-if="decorationsVisible && edited"
      class="edited-mark"
      :aria-label="editedText"
      :title="editedText"
    />
    <span
      v-if="decorationsVisible && locked"
      class="status-mark lock-mark"
      :aria-label="lockedText"
      :title="lockedText"
    >
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
    <span
      v-if="decorationsVisible && disabled"
      class="status-mark disabled-mark"
      :aria-label="disabledText"
      :title="disabledText"
    >
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
      v-if="decorationsVisible"
      v-for="(bar, index) in cooldownBars ?? []"
      :key="`cooldown:${index}`"
      class="cooldown-timeline-bar"
      :class="{ 'is-pending': !bar.completed }"
      :style="cooldownBarStyle(index)"
      aria-hidden="true"
    >
      <span class="cooldown-timeline-bar__duration">{{
        formatDurationFrames(bar.durationFrames)
      }}</span>
      <span v-if="bar.completed" class="cooldown-timeline-bar__end"></span>
    </span>
    <span
      v-if="decorationsVisible"
      v-for="(bar, index) in enhancementBars ?? []"
      :key="`enhancement:${index}`"
      class="enhancement-timeline-bar"
      :class="{ 'is-pending': !bar.completed }"
      :style="enhancementBarStyle(index)"
      aria-hidden="true"
    >
      <span class="enhancement-timeline-bar__duration">{{
        formatDurationFrames(bar.durationFrames)
      }}</span>
      <span v-if="bar.completed" class="enhancement-timeline-bar__end"></span>
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
  </button>
</template>

<style scoped>
.timeline-action-block {
  --action-accent: #a5a5a8;
  --action-surface: var(--ea-workbench-main, #18181c);
  --action-fill: color-mix(in srgb, var(--action-accent) 15%, transparent);
  position: absolute;
  /* 与旧版 actions-container 一致：技能块盖住挤入技能区域的 Buff 效果条。 */
  z-index: 10;
  top: var(--timeline-action-top, 55px);
  height: 50px;
  min-width: 0;
  box-sizing: border-box;
  appearance: none;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  padding: 0;
  border: 2px dashed var(--action-accent);
  /* 先铺不透明轨道底色，再叠半透明技能色；避免充能曲线和网格透进技能块。 */
  background-color: var(--action-surface);
  background-image: linear-gradient(var(--action-fill), var(--action-fill));
  color: var(--ea-action-fg, rgba(255, 255, 255, 0.9));
  box-shadow: var(--action-edge-ring, none);
  backdrop-filter: var(--action-backdrop-filter, blur(4px));
  font-family: inherit;
  font-size: inherit;
  font-weight: 700;
  line-height: normal;
  text-shadow: var(--ea-action-fg-shadow, 0 1px 2px rgba(0, 0, 0, 0.8));
  white-space: nowrap;
  cursor: grab;
  user-select: none;
  transition:
    background-color 0.2s,
    box-shadow 0.2s,
    filter 0.2s;
}

@media (hover: hover) and (pointer: fine) {
  .timeline-action-block:hover:not(:disabled) {
    border: 2px dashed var(--action-accent);
    background-image: linear-gradient(var(--action-fill), var(--action-fill));
    color: var(--ea-action-fg, rgba(255, 255, 255, 0.9));
    filter: brightness(1.2);
  }

  .timeline-action-block[data-selected='true']:hover:not(:disabled) {
    border: 2px dashed var(--action-selected, #fff);
    background-image: linear-gradient(var(--action-fill), var(--action-fill));
    color: var(--ea-action-fg, rgba(255, 255, 255, 0.9));
    box-shadow: 0 0 10px color-mix(in srgb, var(--action-accent) 50%, transparent);
  }

  .timeline-action-block:not([data-selected='true']):not(
      .is-disabled
    )[data-skill-type='basicAttack']:hover:not(:disabled) {
    border: 1.5px solid color-mix(in srgb, var(--action-accent) 40%, transparent);
  }

  .timeline-action-block:not(.is-disabled)[data-skill-type='comboSkill']:hover:not(:disabled),
  .timeline-action-block:not(.is-disabled)[data-skill-type='ultimate']:hover:not(:disabled) {
    border: 1.5px solid var(--action-accent);
  }

  .timeline-action-block.is-perfect-combo:hover:not(:disabled) {
    border-color: #fff2a8;
    background-image: linear-gradient(var(--action-perfect-fill), var(--action-perfect-fill));
    color: var(--action-perfect-color);
    box-shadow: var(--action-perfect-shadow);
  }

  .timeline-action-block:not(.is-disabled)[data-skill-type='ultimate']:hover:not(:disabled) {
    background-image: radial-gradient(
      circle at center,
      var(--action-ultimate-center) 0%,
      var(--action-ultimate-middle) 70%,
      var(--action-ultimate-edge) 100%
    );
  }

  .timeline-action-block.is-disabled:hover:not(:disabled) {
    border: 2px dashed #555;
    background-color: rgb(40 40 40 / 30%);
    background-image: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 5px,
      rgb(0 0 0 / 50%) 5px,
      rgb(0 0 0 / 50%) 10px
    );
    color: #777;
    filter: brightness(1.08);
  }

  :global(html[data-theme='light'] .timeline-action-block:hover:not(:disabled)) {
    filter: brightness(1.04);
  }
}

.timeline-action-block[data-selected='true'] {
  border: 2px dashed var(--ea-action-selected, #fff);
  border-color: var(--action-selected, #fff);
  background-image: linear-gradient(var(--action-fill), var(--action-fill));
  color: var(--ea-action-fg, rgba(255, 255, 255, 0.9));
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
  inset: -2px;
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
  border-right-color: transparent;
}

.duration-pending-mark {
  position: absolute;
  z-index: 3;
  top: -2px;
  right: -1px;
  bottom: -2px;
  width: 14px;
  border-right: 2px dotted var(--action-accent);
  background: linear-gradient(to right, transparent, var(--action-surface) 80%);
  pointer-events: none;
}

.timeline-action-block.is-disabled {
  border: 2px dashed #555;
  background-color: rgb(40 40 40 / 30%);
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

.timeline-action-block:not(.is-disabled)[data-skill-type='ultimate'] {
  padding-right: 6px;
  padding-left: 6px;
  border: 1.5px solid var(--action-accent);
  border-radius: 2px;
  background-image: radial-gradient(
    circle at center,
    var(--action-ultimate-center) 0%,
    var(--action-ultimate-middle) 70%,
    var(--action-ultimate-edge) 100%
  );
  box-shadow: 0 0 15px var(--action-glow);
}

.timeline-action-block:not([data-selected='true']):not(
    .is-disabled
  )[data-skill-type='basicAttack'] {
  border: 1.5px solid var(--action-attack-border);
}

.timeline-action-block:not(.is-disabled)[data-skill-type='comboSkill'] {
  border: 1.5px solid var(--action-accent);
  border-radius: 2px;
  background-image: linear-gradient(var(--action-fill), var(--action-fill));
  box-shadow: var(--action-edge-ring, none);
}

.timeline-action-block:not(.is-disabled)[data-skill-type='comboSkill'][data-selected='true'] {
  box-shadow: 0 0 8px var(--action-glow);
}

.timeline-action-block:not(.is-disabled).is-perfect-combo {
  border-color: #fff2a8;
  background-image: linear-gradient(var(--action-perfect-fill), var(--action-perfect-fill));
  color: var(--action-perfect-color);
  box-shadow: var(--action-perfect-shadow);
}

.action-label {
  position: relative;
  z-index: 2;
  flex: 0 0 auto;
  overflow: visible;
  text-overflow: clip;
  white-space: nowrap;
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
  background: var(--cooldown-accent, #ff6fae);
  opacity: 0.6;
  pointer-events: none;
}

.cooldown-timeline-bar__duration {
  position: absolute;
  top: 3px;
  left: 0;
  color: var(--cooldown-accent, #ff6fae);
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
}

.cooldown-timeline-bar__end {
  position: absolute;
  top: -3px;
  width: 1px;
  height: 8px;
  background: var(--cooldown-accent, #ff6fae);
}

.cooldown-timeline-bar__end {
  right: 0;
}

.enhancement-timeline-bar {
  position: absolute;
  z-index: 2;
  height: 2px;
  background: var(--enhancement-accent, #b37feb);
  opacity: 0.8;
  pointer-events: none;
}

.enhancement-timeline-bar__duration {
  position: absolute;
  top: 3px;
  left: 0;
  color: var(--enhancement-accent, #b37feb);
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
}

.enhancement-timeline-bar__end {
  position: absolute;
  top: -3px;
  width: 1px;
  height: 8px;
  background: var(--enhancement-accent, #b37feb);
}

.enhancement-timeline-bar__end {
  right: 0;
}

.cooldown-timeline-bar.is-pending {
  background: repeating-linear-gradient(
    90deg,
    var(--cooldown-accent, #ff6fae) 0 5px,
    transparent 5px 8px
  );
}

.enhancement-timeline-bar.is-pending {
  background: repeating-linear-gradient(
    90deg,
    var(--enhancement-accent, #b37feb) 0 5px,
    transparent 5px 8px
  );
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
  right: var(--edited-mark-right, 4px);
  width: 11px;
  height: 11px;
  color: var(--ea-gold);
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.8));
  pointer-events: none;
}

.lock-mark {
  left: 2px;
}

.disabled-mark {
  right: var(--disabled-mark-right, 2px);
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

.hit-marker.is-link-buffed {
  border-color: #3a9fd4;
  background: #64c8ff;
  box-shadow: 0 0 6px rgb(100 200 255 / 80%);
}

@media (hover: hover) and (pointer: fine) {
  .hit-marker:hover {
    z-index: 30;
    border-color: #fff;
    background: var(--ea-gold);
    box-shadow: 0 0 8px var(--ea-gold);
    transform: translate(-50%, var(--hit-offset, 0px)) rotate(45deg) scale(1.65);
  }

  .hit-marker.is-triggered:hover {
    transform: translate(-50%, var(--hit-offset, 0px)) rotate(45deg) scale(1.35);
  }
}

.hit-marker.is-forced-crit {
  background-color: #ff6b6b;
  border-color: #ffd166;
  box-shadow: 0 0 8px rgba(255, 209, 102, 0.9);
}

:global(html[data-theme='light'] .timeline-action-block) {
  color: var(--ea-action-fg, #1a1b1e);
  text-shadow: none;
}

:global(html[data-theme='light'] .timeline-action-block.is-disabled) {
  border-color: #9aa0a8;
  background-color: rgb(26 27 30 / 8%);
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 5px,
    rgb(26 27 30 / 12%) 5px,
    rgb(26 27 30 / 12%) 10px
  );
  color: #7a7f88;
}

@media (hover: hover) and (pointer: fine) {
  :global(html[data-theme='light'] .timeline-action-block.is-disabled:hover:not(:disabled)) {
    border-color: #9aa0a8;
    background-color: rgb(26 27 30 / 8%);
    background-image: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 5px,
      rgb(26 27 30 / 12%) 5px,
      rgb(26 27 30 / 12%) 10px
    );
    color: #7a7f88;
  }
}

:global(html[data-theme='light'] .timeline-action-block.is-perfect-combo::after) {
  border-color: rgb(140 110 0 / 70%);
  box-shadow: 0 0 10px rgb(180 140 0 / 22%);
}

:global(.timeline-warning-tooltip) {
  max-width: min(320px, calc(100vw - 48px));
  white-space: normal;
  overflow-wrap: anywhere;
}

:global(.timeline-warning-tooltip.el-popper.is-dark) {
  --ea-floating-border: rgb(255 77 79 / 45%);
}

:global(html[data-theme='light'] .timeline-warning-tooltip.el-popper.is-dark) {
  --ea-floating-border: color-mix(in srgb, #e11d48 45%, var(--ea-dialog-border, #d8dbe0));
}
</style>
