<script setup lang="ts">
import OperatorAvatar from '@/ui/components/OperatorAvatar.vue';
import BuffStatusIcon from '@/ui/timeline/results/BuffStatusIcon.vue';
/** 图标中心经过判定线表示计划到点，不表示游戏中已成功施放。 */
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useOverlayI18n } from './messages';
import comboMark from './combo-mark.png';
import BuffStatusIconStrip from '@/ui/timeline/results/BuffStatusIconStrip.vue';
import { summarizeLastHitBuffs } from '@/ui/timeline/results/lastHitBuffSummary';
import type { OverlayCast, OverlayPlan } from './plan';
import { filterCasts } from './plan';
import { timelineOperationKeycapLabel } from '@/ui/timeline/timelineOperationMarkers';
import { statusEffectIcon } from './statusEffectIcons';
import type { OverlayPreferences } from './preferences';
import {
  activeWindow,
  buildTimeTicks,
  findNextCastGroup,
  formatCountdown,
  formatOverlayTime,
  samplePoints,
  xForTime,
} from './layout';

const props = defineProps<{
  plan: OverlayPlan;
  practiceIndex?: number;
  feedbackIds?: ReadonlySet<string>;
  preferences: OverlayPreferences;
  now: number;
  isPlaying: boolean;
  finished?: boolean;
  loading?: boolean;
  waitingRemaining?: number;
  hasStarted?: boolean;
}>();

const emit = defineEmits<{ 'toggle-play': [] }>();

const { t } = useOverlayI18n();

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
const laneHeight = computed(() => iconSize.value + 52 * scale.value);
const capWidth = computed(() => Math.round(94 * scale.value));
const rowHeight = computed(() => Math.round(26 * scale.value));
const width = computed(() => Math.round(props.preferences.width * scale.value));

const secondsAhead = computed(() => props.preferences.secondsAhead);
const gateX = computed(() =>
  Math.min(trackWidth.value * 0.3, Math.max(iconSize.value * 1.8, trackWidth.value * 0.12)),
);
const pxPerSecond = computed(() => {
  const usable = Math.max(0, trackWidth.value - gateX.value - iconSize.value * 0.8);
  return usable > 0 ? usable / secondsAhead.value : 0;
});

const practiceMode = computed(() => props.practiceIndex !== undefined);
const casts = computed(() =>
  practiceMode.value ? props.plan.casts : filterCasts(props.plan.casts, props.preferences),
);
const practicePositions = computed(
  () => new Map(casts.value.map((cast, index) => [cast.id, index])),
);
function castX(cast: OverlayCast) {
  return practiceMode.value
    ? gateX.value +
        ((practicePositions.value.get(cast.id) ?? 0) - props.practiceIndex!) *
          (iconSize.value * 1.65)
    : xForTime(cast.start, props.now, pxPerSecond.value, gateX.value);
}
function isPast(cast: OverlayCast) {
  return practiceMode.value
    ? (practicePositions.value.get(cast.id) ?? 0) < props.practiceIndex!
    : cast.start < props.now - 0.01;
}
const iconTop = computed(() => 30 * scale.value);
const rowSpacing = computed(() => (props.preferences.showStatusEffects ? 96 : 72) * scale.value);
const trackRows = computed(
  () =>
    new Map(
      [...props.plan.tracks]
        .sort((a, b) => a.trackIndex - b.trackIndex)
        .map((track, index) => [track.trackId, index]),
    ),
);
const layoutRowCount = computed(() =>
  !practiceMode.value && props.preferences.layoutMode === 'staggered'
    ? Math.max(1, trackRows.value.size)
    : 1,
);
const rowCount = computed(() => (practiceMode.value ? 1 : layoutRowCount.value));
const geometry = computed(() => ({
  height: laneHeight.value + 22 * scale.value + rowSpacing.value * (layoutRowCount.value - 1),
  axisY: iconTop.value + iconSize.value / 2,
}));

const nextCasts = computed(() =>
  props.finished
    ? []
    : practiceMode.value
      ? casts.value.slice(props.practiceIndex!, props.practiceIndex! + 1)
      : findNextCastGroup(casts.value, props.now),
);
const nextCast = computed<OverlayCast | null>(() => nextCasts.value[0] ?? null);
const countdown = computed(() =>
  nextCast.value ? Math.max(0, nextCast.value.start - props.now) : null,
);
const waiting = computed(() => (props.waitingRemaining ?? 0) > 0);
const countdownText = computed(() =>
  practiceMode.value
    ? `${Math.min(props.practiceIndex! + 1, casts.value.length)}/${casts.value.length}`
    : formatCountdown(waiting.value ? props.waitingRemaining! : countdown.value),
);
const countdownUrgent = computed(
  () =>
    !practiceMode.value &&
    !practiceMode.value &&
    props.isPlaying &&
    !waiting.value &&
    countdown.value !== null &&
    countdown.value <= 1.2,
);
const playbackState = computed(() => {
  if (props.finished) return 'finished';
  if (waiting.value) {
    if (props.isPlaying) return 'waiting';
    return props.hasStarted ? 'waitingPaused' : 'ready';
  }
  if (props.isPlaying) return 'playing';
  if (practiceMode.value) return props.hasStarted ? 'paused' : 'ready';
  return Math.abs(props.now - props.plan.startTime) <= 1e-6 ? 'ready' : 'paused';
});

const ticks = computed(() =>
  !practiceMode.value && pxPerSecond.value > 0
    ? buildTimeTicks(props.now, secondsAhead.value, pxPerSecond.value, gateX.value)
    : [],
);

const visibleCasts = computed(() => {
  const pps = pxPerSecond.value;
  if (pps <= 0) return [];
  return casts.value
    .filter(cast => {
      const x = castX(cast);
      return x >= iconSize.value * 0.5 && x <= trackWidth.value + iconSize.value;
    })
    .sort((a, b) => {
      // 后绘制的图标盖在上方；普通攻击置底，其余动作按时间从晚到早绘制。
      const aBasic = a.type === 'basicAttack' && !a.heavyAttack;
      const bBasic = b.type === 'basicAttack' && !b.heavyAttack;
      return Number(bBasic) - Number(aBasic) || b.start - a.start;
    });
});

const failedIcons = reactive(new Set<string>());
watch(
  () => props.plan,
  () => failedIcons.clear(),
);

function iconOf(cast: OverlayCast): string {
  if (cast.type === 'comboSkill') return cast.avatar;
  const primary = cast.skillIcon;
  if (primary && !failedIcons.has(primary)) return primary;
  return cast.avatar;
}

function markIconFailed(event: Event) {
  const source = (event.target as HTMLImageElement | null)?.getAttribute('src');
  if (source) failedIcons.add(source);
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
  if (cast.actionLabel) return cast.actionLabel;
  const known = [
    'battleSkill',
    'comboSkill',
    'ultimate',
    'basicAttack',
    'dive',
    'finisher',
    'switch',
  ];
  if (known.includes(cast.type)) return t(`overlay.type.${cast.type}`);
  return t('overlay.type.other');
}

function bottomLabel(cast: OverlayCast): string {
  const mode = props.preferences.labelMode;
  if (mode !== 'keyboard' && mode !== 'gamepad') return typeLabelOf(cast);
  if (['basicAttack', 'dive', 'finisher'].includes(cast.type))
    return mode === 'gamepad' ? 'X' : t('overlay.keys.mouseLeft');
  const kind =
    cast.type === 'battleSkill'
      ? 'skill'
      : cast.type === 'comboSkill'
        ? 'combo'
        : cast.type === 'ultimate'
          ? 'ultimate'
          : cast.type === 'switch'
            ? 'switch'
            : undefined;
  if (!kind) return typeLabelOf(cast);
  const key = timelineOperationKeycapLabel(
    kind === 'ultimate' ? 'skill' : kind,
    cast.trackIndex,
    mode,
  );
  return kind === 'ultimate' ? t('overlay.keys.hold', { key }) : key;
}

function actionLabel(cast: OverlayCast): string {
  const type = typeLabelOf(cast);
  const name = cast.name && cast.name !== cast.type && cast.name !== type ? cast.name : '';
  return `${cast.operatorName} · ${type}${name ? ` · ${name}` : ''}`;
}

/** 倒计时左侧的类型标签：未开始 / 下一个技能 / 待命 / 完成。 */
const typeLabel = computed(() => {
  if (props.finished) return t('overlay.typeDone');
  if (waiting.value) return t('overlay.waitingLabel');
  if (nextCast.value) return typeLabelOf(nextCast.value);
  if (!props.isPlaying && props.now <= 0.01) return t('overlay.typeIdle');
  return t('overlay.typeStandby');
});
const typeAccent = computed(() => {
  if (props.finished) return '#9ef0e0';
  if (waiting.value) return '#ffd166';
  return accentOf(nextCast.value);
});

function itemStyle(cast: OverlayCast) {
  const x = castX(cast);
  const size = iconSize.value;
  return {
    '--ov-x': `${x - size / 2}px`,
    '--ov-y': `${iconTop.value + (!practiceMode.value && props.preferences.layoutMode === 'staggered' ? (trackRows.value.get(cast.trackId) ?? 0) : 0) * rowSpacing.value}px`,
    '--ov-size': `${size}px`,
    '--ov-accent': accentOf(cast),
    '--ov-element': ELEMENT_ACCENT[cast.element] ?? '#cfd8dc',
    opacity: String(
      Math.min(
        1,
        Math.max(0, (x - iconSize.value / 2) / Math.max(1, gateX.value - iconSize.value / 2)) *
          1.15,
      ),
    ),
  } as Record<string, string>;
}

const spValue = computed(() => samplePoints(props.plan.spPoints, props.now, props.plan.initialSp));
const spRatio = computed(() => Math.min(1, Math.max(0, spValue.value / props.plan.maxSp)));
const nextSpCost = computed(() => {
  if (!nextCasts.value.length) return null;
  let total = 0;
  for (const cast of nextCasts.value) {
    if (cast.spCost === null) return null;
    total += cast.spCost;
  }
  return total;
});
const spShort = computed(
  () =>
    nextSpCost.value !== null && nextSpCost.value > 0 && spValue.value + 0.01 < nextSpCost.value,
);

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
    const max = props.plan.gaugeMaxValues[track.trackId];
    const value = samplePoints(points, props.now, 0);
    const ratio =
      max !== undefined && Number.isFinite(max) && max > 0
        ? Math.min(1, Math.max(0, value / max))
        : 0;
    return {
      trackId: track.trackId,
      name: track.operatorName,
      avatar: track.avatar,
      ratio,
      ready: ratio >= 1,
    };
  }),
);

const enemyBuffSummary = computed(() =>
  summarizeLastHitBuffs(
    (props.plan.enemyBuffs ?? []).map(buff => ({ ...buff, tooltip: buff.name })),
    Math.round(props.now * (props.plan.frameRate ?? 30)),
  ),
);

const rootStyle = computed(() => ({
  width: `${width.value}px`,
  '--ov-icon': `${iconSize.value}px`,
  '--ov-height': `${geometry.value.height}px`,
  '--ov-cap': `${capWidth.value}px`,
  '--ov-row': `${rowHeight.value}px`,
  '--ov-axis': `${geometry.value.axisY}px`,
  '--ov-gate': `${gateX.value}px`,
  '--ov-gate-label-y': `${iconTop.value + iconSize.value * 1.325 + 8 + iconSize.value * 0.15}px`,
  '--ov-gate-top': `${geometry.value.axisY - iconSize.value / 2 - 20 * scale.value}px`,
  '--ov-gate-height': `${iconSize.value + 40 * scale.value + rowSpacing.value * (rowCount.value - 1)}px`,
  // 面板不透明度：0.2 几乎全透，1 完全不透
  '--ov-alpha': String(props.preferences.hudOpacity ?? 0.62),
}));
</script>

<template>
  <div
    class="ov-hud"
    :class="{
      'is-playing': isPlaying,
      'is-finished': finished,
      'is-compact': preferences.compactMode,
    }"
    :style="rootStyle"
  >
    <div v-if="!preferences.compactMode" class="ov-summary">
      <slot name="summary-prefix" />
      <span class="ov-playback" :class="`ov-playback--${playbackState}`">
        {{ t(`overlay.playback.${playbackState}`) }}
      </span>
      <span class="ov-clock" :title="t('overlay.playback.timeHint')">
        {{ formatOverlayTime(now) }} / {{ formatOverlayTime(plan.duration) }}
      </span>
      <div class="ov-next" :class="{ 'is-urgent': countdownUrgent }">
        <span class="ov-next__label">{{ t('overlay.nextActions') }}</span>
        <span v-for="cast in nextCasts.slice(0, 2)" :key="cast.id" class="ov-next__item">
          {{ actionLabel(cast) }}
        </span>
        <span v-if="nextCasts.length > 2" class="ov-next__more">
          {{ t('overlay.moreActions', { count: nextCasts.length - 2 }) }}
        </span>
        <span v-if="!nextCast" class="ov-next__item">{{ typeLabel }}</span>
      </div>
    </div>
    <div class="ov-belt">
      <button
        v-if="!preferences.compactMode"
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
        <span class="ov-cap__unit">{{
          t(
            practiceMode
              ? 'overlay.practice.step'
              : waiting
                ? 'overlay.waitingUnit'
                : 'overlay.secondsSuffix',
          )
        }}</span>
      </button>

      <div ref="trackRef" class="ov-track">
        <div
          v-for="row in rowCount"
          :key="row"
          class="ov-track__axis"
          :style="{ top: `${geometry.axisY + (row - 1) * rowSpacing}px` }"
          aria-hidden="true"
        ></div>
        <span
          v-for="tick in ticks"
          :key="`tick-${tick.time}`"
          class="ov-tick"
          :class="{ 'is-major': tick.major }"
          :style="{ transform: `translate3d(${tick.x}px, 0, 0)` }"
          aria-hidden="true"
        ></span>
        <div v-if="!practiceMode" class="ov-gate" aria-hidden="true">
          <span class="ov-gate__cap"></span>
          <span class="ov-gate__label">{{ t('overlay.now') }}</span>
        </div>

        <div
          v-for="cast in visibleCasts"
          :key="cast.id"
          class="ov-item"
          :class="[
            `ov-item--${cast.type}`,
            {
              'is-confirmed': feedbackIds?.has(cast.id),
              'is-practice-target': practiceMode && nextCasts.some(next => next.id === cast.id),
              'is-next': nextCasts.some(next => next.id === cast.id),
              'is-past': isPast(cast),
              'is-ultimate': cast.type === 'ultimate',
              'is-combo': cast.type === 'comboSkill',
              'is-battle': cast.type === 'battleSkill',
            },
          ]"
          :style="itemStyle(cast)"
          :title="`${cast.operatorName} · ${cast.name}`"
        >
          <img
            v-if="cast.type === 'comboSkill'"
            class="ov-item__combo-mark"
            :src="comboMark"
            alt=""
            draggable="false"
          />
          <span class="ov-item__frame">
            <OperatorAvatar
              v-if="
                cast.type === 'comboSkill' || !cast.skillIcon || failedIcons.has(cast.skillIcon)
              "
              class="ov-item__avatar"
              :src="cast.avatar"
            />
            <img v-else :src="iconOf(cast)" alt="" draggable="false" @error="markIconFailed" />
          </span>
          <span
            v-if="cast.type === 'comboSkill' && cast.skillIcon && !failedIcons.has(cast.skillIcon)"
            class="ov-item__inset"
          >
            <img :src="cast.skillIcon" alt="" draggable="false" @error="markIconFailed" />
          </span>
          <span
            v-else-if="
              cast.type === 'basicAttack' || cast.type === 'battleSkill' || cast.type === 'ultimate'
            "
            class="ov-item__inset"
          >
            <OperatorAvatar class="ov-item__avatar" :src="cast.avatar" />
          </span>
          <span
            v-if="
              preferences.showStatusEffects &&
              cast.statusEffects?.some(effect => statusEffectIcon(effect.result))
            "
            class="ov-item__effects"
          >
            <span
              v-for="effect in cast.statusEffects?.filter(effect =>
                statusEffectIcon(effect.result),
              )"
              :key="`${effect.from ?? ''}:${effect.result}`"
            >
              <template v-if="effect.from && statusEffectIcon(effect.from)">
                <BuffStatusIcon
                  :icon="statusEffectIcon(effect.from)"
                  :label="t(`overlay.effects.${effect.from}`)"
                />
                <span aria-hidden="true">→</span>
              </template>
              <BuffStatusIcon
                :icon="statusEffectIcon(effect.result)"
                :label="t(`overlay.effects.${effect.result}`)"
              />
            </span>
          </span>
          <span class="ov-item__label" :title="bottomLabel(cast)">{{ bottomLabel(cast) }}</span>
          <span v-if="cast.segments > 1" class="ov-item__badge">{{ cast.segments }}</span>
        </div>
      </div>
    </div>

    <div
      v-if="
        !preferences.compactMode && (plan.spPoints.length || Object.keys(plan.gaugePoints).length)
      "
      class="ov-resources"
    >
      <div class="ov-sp" :class="{ 'is-short': spShort }">
        <span class="ov-sp__label">{{ t('overlay.sp') }}</span>
        <span class="ov-sp__value">{{ Math.round(spValue) }}</span>
        <span class="ov-sp__bar"
          ><span class="ov-sp__fill" :style="{ width: `${spRatio * 100}%` }"></span
        ></span>
        <span v-if="nextSpCost !== null && nextSpCost > 0" class="ov-sp__cost">
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

      <BuffStatusIconStrip
        class="ov-enemy-buffs"
        :buffs="enemyBuffSummary.buffs"
        :overflow="enemyBuffSummary.overflow"
        :aria-label="t('overlay.enemyBuffs')"
      />
      <div class="ov-gauges">
        <div
          v-for="chip in gaugeChips"
          :key="chip.trackId"
          class="ov-gauge"
          :class="{ 'is-ready': chip.ready }"
          :title="chip.name"
        >
          <OperatorAvatar class="ov-gauge__avatar" :src="chip.avatar" />
          <span class="ov-gauge__bar">
            <span class="ov-gauge__fill" :style="{ width: `${chip.ratio * 100}%` }"></span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ov-enemy-buffs {
  --buff-status-size: calc(var(--ov-row) * 0.52);
  flex: 1;
  min-width: 0;
  margin-top: 0;
}
.ov-item__effects {
  --buff-status-size: calc(var(--ov-icon) * 0.3);
  position: absolute;
  left: 50%;
  top: calc(100% + var(--ov-size) * 0.325 + 8px);
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  font-size: calc(var(--ov-size) * 0.24);
  color: #fff;
  text-shadow: 0 1px 3px #000;
  pointer-events: auto;
}
.ov-item__effects > span {
  display: flex;
  align-items: center;
  gap: 2px;
}
.ov-hud {
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  /* 渐变仅改变底色，整块面板使用同一不透明度。 */
  background: linear-gradient(
    180deg,
    rgb(9 12 18 / var(--ov-alpha, 0.62)),
    rgb(18 22 28 / var(--ov-alpha, 0.62))
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

.ov-hud.is-compact {
  background: transparent;
  border-color: transparent;
  box-shadow: none;
  backdrop-filter: none;
}
.ov-hud.is-compact .ov-belt {
  background: transparent;
  border-color: transparent;
}
.ov-hud.is-compact .ov-tick {
  display: none;
}
.ov-summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 12px;
  min-height: var(--ov-row);
  padding: 4px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-size: calc(var(--ov-icon) * 0.27);
  line-height: 1.4;
}

.ov-playback,
.ov-clock,
.ov-next__label,
.ov-next__more {
  flex: 0 0 auto;
}

.ov-playback {
  color: #cfd8dc;
}

.ov-playback--playing,
.ov-playback--finished {
  color: #9ef0e0;
}

.ov-playback--paused,
.ov-playback--waiting,
.ov-playback--waitingPaused {
  color: #ffd166;
}

.ov-clock {
  font-family: 'Roboto Mono', ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
  color: rgba(255, 255, 255, 0.65);
}

.ov-next {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 300px;
  min-width: 0;
}

.ov-next__label,
.ov-next__more {
  color: rgba(255, 255, 255, 0.55);
}

.ov-next__item {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ov-next.is-urgent .ov-next__item {
  color: #ffd166;
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
  mask-image: linear-gradient(90deg, #000 0, #000 calc(100% - 18px), transparent 100%);
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
  z-index: 1;
  pointer-events: none;
  top: var(--ov-gate-top);
  height: var(--ov-gate-height);
  left: var(--ov-gate);
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
  top: 5px;
  left: -3px;
  width: 8px;
  height: 8px;
  transform: translateY(-50%) rotate(45deg);
  background: #ffd166;
  box-shadow: 0 0 10px rgba(255, 209, 102, 0.55);
}

.ov-gate__label {
  position: absolute;
  top: calc(var(--ov-gate-label-y) - var(--ov-gate-top));
  left: 0;
  transform: translate(-50%, -50%);
  white-space: nowrap;
  color: #ffd166;
  font-size: 10px;
}

.ov-item.is-practice-target::before {
  content: '';
  position: absolute;
  inset: -6px;
  border: 2px solid #ffd166;
  border-radius: 8px;
  pointer-events: none;
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

.ov-item__frame {
  display: block;
  width: 100%;
  height: 100%;
  border: 1.5px solid var(--ov-accent);
  border-radius: 7px;
  background: #151a20;
  padding: 3px;
}

.ov-item__frame > img,
.ov-item__inset > img {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 4px;
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

.ov-item:is(.ov-item--basicAttack, .is-battle, .is-ultimate, .is-combo) .ov-item__frame {
  position: relative;
  box-sizing: border-box;
  border-radius: 50%;
  border: 1px solid #c8c8c3;
  padding: 4px;
  background: #303130;
  box-shadow: 0 0 0 2px #171918;
  overflow: hidden;
}

.ov-item:is(.is-battle, .is-ultimate) .ov-item__frame::before {
  content: '';
  position: absolute;
  inset: 4px;
  border-radius: 50%;
  background: var(--ov-element);
}
.ov-item.is-battle .ov-item__frame::before {
  background: conic-gradient(
    transparent 0deg 120deg,
    var(--ov-element) 120deg 240deg,
    transparent 240deg
  );
}
.ov-item:is(.ov-item--basicAttack, .is-battle, .is-ultimate, .is-combo) .ov-item__frame > img {
  position: relative;
  border-radius: 50%;
  object-fit: contain;
  background: transparent;
  box-shadow: none;
}
.ov-item.is-combo .ov-item__frame {
  border: 2px solid #f5f5ef;
  padding: 2px;
}
.ov-item__avatar {
  width: 100%;
  height: 100%;
  border-radius: inherit;
}
.ov-item--basicAttack .ov-item__frame {
  background: #000;
}
.ov-item__inset {
  position: absolute;
  right: -4%;
  bottom: -2%;
  width: 38%;
  height: 38%;
  border: 1px solid #f5f5ef;
  border-radius: 50%;
  background: #303130;
}
.ov-item__inset > img {
  border-radius: 50%;
  background: transparent;
  box-shadow: none;
}
.ov-item .ov-item__combo-mark {
  position: absolute;
  width: 40%;
  height: 40%;
  left: 30%;
  bottom: calc(100% + 3px);
  object-fit: contain;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
}
.ov-item--finisher .ov-item__frame {
  border-radius: 50%;
}
.ov-item--dive .ov-item__frame {
  border-radius: 5px 5px 50% 50%;
}

.ov-item.is-next .ov-item__frame {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.3);
}

.ov-item.is-confirmed .ov-item__frame::after {
  content: '';
  position: absolute;
  inset: 0;
  border: 3px solid #b8ffe4;
  border-radius: inherit;
  animation: input-confirm 420ms ease-out both;
  pointer-events: none;
}
.ov-item.is-confirmed .ov-item__frame {
  animation: input-frame-confirm 420ms ease-out both;
}
@keyframes input-confirm {
  from {
    opacity: 1;
    transform: scale(0.85);
  }
  to {
    opacity: 0;
    transform: scale(1.25);
  }
}
@keyframes input-frame-confirm {
  from {
    box-shadow: 0 0 14px 3px #8affe0;
  }
  to {
    box-shadow: 0 0 0 0 transparent;
  }
}
.ov-item.is-past img {
  filter: saturate(0.4);
}

.ov-item__label {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: calc(var(--ov-size) * 1.7);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
  line-height: 1.3;
  font-size: calc(var(--ov-size) * 0.25);
}
.ov-item__label {
  top: calc(100% + 5px);
  color: #fff;
  font-weight: 700;
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
}

.is-playing .ov-combo.is-open .ov-combo__dot {
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

.ov-gauge__avatar {
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

.ov-gauge.is-ready .ov-gauge__avatar {
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

@media (prefers-reduced-motion: reduce) {
  .ov-cap__value.is-urgent,
  .is-playing .ov-combo.is-open .ov-combo__dot {
    animation: none;
  }
}
</style>
