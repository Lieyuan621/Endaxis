<script setup lang="ts">
/**
 * 游戏内提示条（传送带 HUD）。
 *
 * 视觉规则（来自需求）：
 * - 一条横向轴线，动作图标像传送带一样自右向左经过「现在」线；
 * - 战技图标垂直居中对齐轴线；
 * - 终结技图标底边贴住轴线，整体在轴线上方；
 * - 连携技图标顶边贴住轴线，整体在轴线下方；
 * - 轴线最左侧用数字提示「下一个操作还剩多少秒」。
 *
 * 组件只负责渲染，时钟与位置由外层提供，便于单测与复用。
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { OverlayCast, OverlayPlan } from './plan';
import { filterCasts } from './plan';
import type { OverlayPreferences } from './preferences';
import {
  activeWindow,
  buildTimeTicks,
  computeBeltGeometry,
  countdownToNext,
  findNextCastIndex,
  formatCountdown,
  isVisibleAt,
  laneTop,
  samplePoints,
  seriesMax,
  xForTime,
} from './layout';

const props = defineProps<{
  plan: OverlayPlan;
  preferences: OverlayPreferences;
  now: number;
  isPlaying: boolean;
  finished?: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{ 'toggle-play': [] }>();

const { t } = useI18n({ useScope: 'global' });

const ICON_BASE = 42;

const ELEMENT_ACCENT: Record<string, string> = {
  physical: '#cfd8dc',
  heat: '#ff7a45',
  cryo: '#69c0ff',
  electric: '#b37feb',
  nature: '#95de64',
};

const trackRef = ref<HTMLElement | null>(null);
const trackWidth = ref(0);
let observer: ResizeObserver | null = null;

onMounted(() => {
  if (!trackRef.value || typeof ResizeObserver === 'undefined') return;
  observer = new ResizeObserver(entries => {
    const width = entries[0]?.contentRect?.width ?? 0;
    trackWidth.value = width;
  });
  observer.observe(trackRef.value);
  trackWidth.value = trackRef.value.clientWidth;
});

onBeforeUnmount(() => {
  observer?.disconnect();
  observer = null;
});

const scale = computed(() => props.preferences.scale || 1);
const iconSize = computed(() => Math.round(ICON_BASE * scale.value));
const geometry = computed(() => computeBeltGeometry({ iconSize: iconSize.value }));
const capWidth = computed(() => Math.round(94 * scale.value));
const rowHeight = computed(() => Math.round(26 * scale.value));
const width = computed(() => Math.round(props.preferences.width * scale.value));

const secondsAhead = computed(() => Math.max(2, props.preferences.secondsAhead));
const pxPerSecond = computed(() => {
  const usable = Math.max(0, trackWidth.value - iconSize.value * 0.5);
  return usable > 0 ? usable / secondsAhead.value : 0;
});

const casts = computed(() =>
  filterCasts(props.plan.casts, { showBasic: props.preferences.showBasic }),
);

const nextIndex = computed(() => findNextCastIndex(casts.value, props.now));
const nextCast = computed<OverlayCast | null>(() =>
  nextIndex.value >= 0 ? casts.value[nextIndex.value]! : null,
);
const countdown = computed(() => countdownToNext(casts.value, props.now));
const countdownText = computed(() => formatCountdown(countdown.value));
const countdownUrgent = computed(() => countdown.value !== null && countdown.value <= 1.2);

const ticks = computed(() =>
  pxPerSecond.value > 0
    ? buildTimeTicks(props.now, secondsAhead.value, pxPerSecond.value, 0)
    : [],
);

const visibleCasts = computed(() => {
  const pps = pxPerSecond.value;
  if (pps <= 0) return [];
  return casts.value.filter(cast =>
    isVisibleAt(cast.start, props.now, secondsAhead.value + 1, iconSize.value, pps),
  );
});

const failedIcons = reactive(new Set<string>());

function iconOf(cast: OverlayCast): string {
  const portrait = props.preferences.iconMode === 'portrait';
  const primary = portrait ? cast.portrait : cast.skillIcon;
  if (primary && !failedIcons.has(cast.id)) return primary;
  return cast.avatar;
}

function markIconFailed(cast: OverlayCast) {
  failedIcons.add(cast.id);
}

function accentOf(cast: OverlayCast | null): string {
  if (!cast) return 'rgba(255,255,255,0.4)';
  if (cast.type === 'ultimate') return '#ffd166';
  if (cast.type === 'comboSkill') return '#fdd900';
  if (cast.type === 'basicAttack' || cast.type === 'other') return '#93a1ad';
  return ELEMENT_ACCENT[cast.element] ?? '#cfd8dc';
}

function typeLabelOf(cast: OverlayCast | null): string {
  if (!cast) return t('overlay.typeIdle');
  const known = ['battleSkill', 'comboSkill', 'ultimate', 'basicAttack', 'dive', 'finisher'];
  if (known.includes(cast.type)) return t(`overlay.type.${cast.type}`);
  return t('overlay.type.other');
}

/** 倒计时左侧的类型标签：未开始 / 下一个技能 / 待命 / 完成。 */
const typeLabel = computed(() => {
  if (props.finished) return t('overlay.typeDone');
  if (nextCast.value) return typeLabelOf(nextCast.value);
  if (!props.isPlaying && props.now <= 0.01) return t('overlay.typeIdle');
  return t('overlay.typeStandby');
});
const typeAccent = computed(() => {
  if (props.finished) return '#9ef0e0';
  return accentOf(nextCast.value);
});

function itemStyle(cast: OverlayCast) {
  const x = xForTime(cast.start, props.now, pxPerSecond.value);
  return {
    '--ov-x': `${x}px`,
    '--ov-y': `${laneTop(cast.type, geometry.value)}px`,
    '--ov-size': `${iconSize.value}px`,
    '--ov-accent': accentOf(cast),
  } as Record<string, string>;
}

const spValue = computed(() => samplePoints(props.plan.spPoints, props.now, props.plan.initialSp));
const spRatio = computed(() => Math.min(1, Math.max(0, spValue.value / props.plan.maxSp)));
const nextSpCost = computed(() => Math.max(0, nextCast.value?.spCost ?? 0));
const spShort = computed(() => nextSpCost.value > 0 && spValue.value + 0.01 < nextSpCost.value);

const comboState = computed(() => {
  for (const track of props.plan.tracks) {
    const window = activeWindow(props.plan.comboWindows[track.trackId], props.now);
    if (window) return { track, remaining: Math.max(0, window.end - props.now) };
  }
  return null;
});

const gaugeChips = computed(() =>
  props.plan.tracks.map(track => {
    const points = props.plan.gaugePoints[track.trackId];
    const max = seriesMax(points, 1);
    const value = samplePoints(points, props.now, 0);
    const ratio = Math.min(1, Math.max(0, value / max));
    return {
      trackId: track.trackId,
      name: track.operatorName,
      avatar: track.avatar,
      ratio,
      ready: ratio >= 0.995,
    };
  }),
);

const rootStyle = computed(() => ({
  width: `${width.value}px`,
  '--ov-icon': `${iconSize.value}px`,
  '--ov-height': `${geometry.value.height}px`,
  '--ov-cap': `${capWidth.value}px`,
  '--ov-row': `${rowHeight.value}px`,
  '--ov-axis': `${geometry.value.axisY}px`,
  // 面板不透明度：0.2 几乎全透，1 完全不透
  '--ov-alpha': String(props.preferences.hudOpacity ?? 0.62),
}));
</script>

<template>
  <div class="ov-hud" :class="{ 'is-playing': isPlaying, 'is-finished': finished }" :style="rootStyle">
    <div class="ov-belt">
      <button
        class="ov-cap"
        type="button"
        :title="t('overlay.capHint')"
        :aria-label="t('overlay.capHint')"
        @click="emit('toggle-play')"
      >
        <span class="ov-cap__type" :style="{ color: typeAccent }">
          {{ typeLabel }}
        </span>
        <span class="ov-cap__value" :class="{ 'is-urgent': countdownUrgent }">
          {{ loading ? '--' : countdownText }}
        </span>
        <span class="ov-cap__unit">{{ t('overlay.secondsSuffix') }}</span>
      </button>

      <div ref="trackRef" class="ov-track">
        <div class="ov-track__axis" aria-hidden="true"></div>
        <span
          v-for="tick in ticks"
          :key="`tick-${tick.time}`"
          class="ov-tick"
          :class="{ 'is-major': tick.major }"
          :style="{ transform: `translate3d(${tick.x}px, 0, 0)` }"
          aria-hidden="true"
        ></span>
        <div class="ov-gate" aria-hidden="true">
          <span class="ov-gate__cap"></span>
        </div>

        <div
          v-for="cast in visibleCasts"
          :key="cast.id"
          class="ov-item"
          :class="[
            `ov-item--${cast.type}`,
            {
              'is-next': cast.id === nextCast?.id,
              'is-past': cast.start < now - 0.01,
              'is-ultimate': cast.type === 'ultimate',
              'is-combo': cast.type === 'comboSkill',
              'is-battle': cast.type === 'battleSkill',
              'is-portrait': preferences.iconMode === 'portrait',
            },
          ]"
          :style="itemStyle(cast)"
          :title="`${cast.operatorName} · ${cast.name}`"
        >
          <img :src="iconOf(cast)" alt="" draggable="false" @error="markIconFailed(cast)" />
          <span v-if="cast.segments > 1" class="ov-item__badge">{{ cast.segments }}</span>
        </div>
      </div>
    </div>

    <div v-if="preferences.showResources" class="ov-resources">
      <div class="ov-sp" :class="{ 'is-short': spShort }">
        <span class="ov-sp__label">{{ t('overlay.sp') }}</span>
        <span class="ov-sp__value">{{ Math.round(spValue) }}</span>
        <span class="ov-sp__bar"><span class="ov-sp__fill" :style="{ width: `${spRatio * 100}%` }"></span></span>
        <span v-if="nextSpCost > 0" class="ov-sp__cost">
          {{ t('overlay.spNext', { cost: nextSpCost }) }}
        </span>
      </div>

      <div class="ov-combo" :class="{ 'is-open': comboState }">
        <span class="ov-combo__dot" aria-hidden="true"></span>
        <span class="ov-combo__text">
          {{
            comboState
              ? t('overlay.comboOpen', { seconds: comboState.remaining.toFixed(1) })
              : t('overlay.comboIdle')
          }}
        </span>
      </div>

      <div class="ov-gauges">
        <div
          v-for="chip in gaugeChips"
          :key="chip.trackId"
          class="ov-gauge"
          :class="{ 'is-ready': chip.ready }"
          :title="chip.name"
        >
          <img :src="chip.avatar" alt="" draggable="false" />
          <span class="ov-gauge__bar">
            <span class="ov-gauge__fill" :style="{ width: `${chip.ratio * 100}%` }"></span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ov-hud {
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  /* 面板底色跟随「不透明度」设置：顶深底浅，最低 0.2 时几乎只剩文字。 */
  background: linear-gradient(
    180deg,
    rgb(9 12 18 / calc(var(--ov-alpha, 0.62) * 1)),
    rgb(9 12 18 / calc(var(--ov-alpha, 0.62) * 0.72))
  );
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.42),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(10px) saturate(130%);
  color: #f2f5f8;
  font-family: 'Segoe UI', 'Inter', system-ui, sans-serif;
  overflow: hidden;
  user-select: none;
  /* 底色很透时文字仍然清晰 */
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.72);
}

.ov-belt {
  display: flex;
  height: var(--ov-height);
  align-items: stretch;
}

.ov-cap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  width: var(--ov-cap);
  flex: 0 0 var(--ov-cap);
  padding: 0;
  border: none;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.07), rgba(0, 0, 0, 0.22));
  color: inherit;
  font: inherit;
  cursor: pointer;
  transition: background-color 160ms ease;
}

.ov-cap:focus-visible {
  outline: 2px solid rgba(255, 209, 102, 0.8);
  outline-offset: -3px;
}

.ov-cap__type {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  line-height: 1;
  opacity: 0.95;
}

.ov-cap__value {
  font-family: 'Roboto Mono', ui-monospace, monospace;
  font-size: calc(var(--ov-icon) * 0.86);
  font-weight: 700;
  line-height: 1.02;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.55);
}

.ov-cap__value.is-urgent {
  color: #ffd166;
  animation: ov-pulse 900ms ease-in-out infinite;
}

.ov-cap__unit {
  font-size: 9px;
  letter-spacing: 0.2em;
  opacity: 0.55;
  line-height: 1;
}

.ov-track {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  mask-image: linear-gradient(
    90deg,
    transparent 0,
    #000 var(--ov-icon),
    #000 calc(100% - 18px),
    transparent 100%
  );
}

.ov-track__axis {
  position: absolute;
  left: 0;
  right: 0;
  top: var(--ov-axis);
  height: 1px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.45) 0%,
    rgba(255, 255, 255, 0.28) 45%,
    rgba(255, 255, 255, 0.12) 100%
  );
  box-shadow: 0 0 8px rgba(180, 215, 255, 0.18);
}

.ov-tick {
  position: absolute;
  top: calc(var(--ov-axis) - 3px);
  left: 0;
  width: 1px;
  height: 6px;
  background: rgba(255, 255, 255, 0.16);
  will-change: transform;
}

.ov-tick.is-major {
  height: 11px;
  top: calc(var(--ov-axis) - 5px);
  background: rgba(255, 255, 255, 0.3);
}

.ov-gate {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 2px;
  background: linear-gradient(
    180deg,
    rgba(255, 209, 102, 0) 0%,
    rgba(255, 209, 102, 0.85) 35%,
    rgba(255, 209, 102, 0.85) 65%,
    rgba(255, 209, 102, 0) 100%
  );
  box-shadow: 0 0 12px rgba(255, 209, 102, 0.35);
}

.ov-gate__cap {
  position: absolute;
  top: var(--ov-axis);
  left: -3px;
  width: 8px;
  height: 8px;
  transform: translateY(-50%) rotate(45deg);
  background: #ffd166;
  box-shadow: 0 0 10px rgba(255, 209, 102, 0.55);
}

.ov-item {
  position: absolute;
  top: 0;
  left: 0;
  width: var(--ov-size);
  height: var(--ov-size);
  transform: translate3d(var(--ov-x), var(--ov-y), 0);
  will-change: transform;
}

.ov-item img {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  border: 1.5px solid var(--ov-accent);
  box-sizing: border-box;
  object-fit: cover;
  background: rgba(0, 0, 0, 0.4);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.55),
    inset 0 0 10px rgba(0, 0, 0, 0.35);
  transition:
    opacity 140ms linear,
    filter 140ms linear;
}

/* 三类技能的对齐由 laneTop() 决定，这里只补类型上的视觉暗示：终结技更亮、连携技带虚线感 */
.ov-item.is-portrait img {
  object-position: center 18%;
}

.ov-item.is-ultimate img {
  border-width: 2px;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.45),
    0 0 14px rgba(255, 209, 102, 0.35),
    0 2px 8px rgba(0, 0, 0, 0.5);
}

.ov-item.is-combo img {
  border-style: dashed;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.45),
    0 2px 8px rgba(0, 0, 0, 0.5);
}

.ov-item.is-next img {
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.22),
    0 0 18px var(--ov-accent),
    0 2px 10px rgba(0, 0, 0, 0.55);
  animation: ov-breathe 1400ms ease-in-out infinite;
}

.ov-item.is-past img {
  opacity: 0.28;
  filter: saturate(0.4);
}

.ov-item__badge {
  position: absolute;
  right: -3px;
  bottom: -3px;
  min-width: 13px;
  padding: 0 3px;
  border-radius: 7px;
  background: rgba(9, 12, 18, 0.92);
  border: 1px solid var(--ov-accent);
  color: var(--ov-accent);
  font-family: 'Roboto Mono', monospace;
  font-size: 9px;
  line-height: 12px;
  text-align: center;
}

.ov-resources {
  display: flex;
  align-items: center;
  gap: 14px;
  height: var(--ov-row);
  padding: 0 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(0, 0, 0, 0.16));
  font-size: 10px;
  letter-spacing: 0.02em;
  color: rgba(255, 255, 255, 0.72);
  white-space: nowrap;
}

.ov-sp {
  display: flex;
  align-items: center;
  gap: 5px;
}

.ov-sp__label {
  opacity: 0.55;
  letter-spacing: 0.12em;
}

.ov-sp__value {
  font-family: 'Roboto Mono', ui-monospace, monospace;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: #9ef0e0;
}

.ov-sp__cost {
  font-family: 'Roboto Mono', ui-monospace, monospace;
  opacity: 0.45;
}

.ov-sp__bar {
  width: 76px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;
}

.ov-sp__fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #4fd1c5, #9ef0e0);
  transition: width 120ms linear;
}

.ov-sp.is-short .ov-sp__value {
  color: #ff9b9b;
}

.ov-sp.is-short .ov-sp__fill {
  background: linear-gradient(90deg, #ff7875, #ffb3b0);
}

.ov-combo {
  display: flex;
  align-items: center;
  gap: 5px;
  opacity: 0.5;
}

.ov-combo.is-open {
  opacity: 1;
  color: #ffe08a;
}

.ov-combo__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.35);
}

.ov-combo.is-open .ov-combo__dot {
  background: #fdd900;
  box-shadow: 0 0 8px #fdd900;
  animation: ov-pulse 1200ms ease-in-out infinite;
}

.ov-gauges {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.ov-gauge {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ov-gauge img {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.25);
  opacity: 0.85;
}

.ov-gauge__bar {
  width: 30px;
  height: 3px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.14);
  overflow: hidden;
}

.ov-gauge__fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: rgba(255, 255, 255, 0.6);
  transition: width 140ms linear;
}

.ov-gauge.is-ready img {
  border-color: #ffd166;
  opacity: 1;
}

.ov-gauge.is-ready .ov-gauge__fill {
  background: #ffd166;
  box-shadow: 0 0 6px rgba(255, 209, 102, 0.7);
}

@keyframes ov-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.55;
  }
}

@keyframes ov-breathe {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ov-item.is-next img,
  .ov-cap__value.is-urgent,
  .ov-combo.is-open .ov-combo__dot {
    animation: none;
  }
}
</style>
