<script setup lang="ts">
/**
 * 小图导出的独立时间轴卡片。
 *
 * 卡片读取已经投影好的名称、头像和技能几何，不访问编辑器会话。这样预览与最终图片使用
 * 同一份稳定输入，调整尺寸时也不会触发战斗模拟。
 */
import { computed, ref } from 'vue';
import {
  timelineOperationKeycapLabel,
  type OperationKeycapMode,
  type TimelineOperationMarkerKind,
} from '../timelineOperationMarkers';

export interface TimelineShareAction {
  readonly id: string;
  readonly label: string;
  readonly skillType: string | null;
  readonly startFrame: number;
  readonly durationFrames: number;
  readonly disabled: boolean;
  readonly color?: string | null;
  readonly icon?: string | null;
}

export interface TimelineShareTrack {
  readonly id: string;
  readonly name: string;
  readonly avatar: string | null;
  readonly actions: readonly TimelineShareAction[];
}

const props = defineProps<{
  scenarioName: string;
  tracks: readonly TimelineShareTrack[];
  prepFrames: number;
  duration: number;
  cardWidth: number;
  blockHeight: number;
  pxPerSecond: number;
  showDurationBars: boolean;
  showCombatIcons: boolean;
  showKeycaps: boolean;
  keycapMode: OperationKeycapMode;
  showPrep: boolean;
  showTimeTicks: boolean;
  watermark: string;
  appearance: 'light' | 'dark';
}>();
const rootEl = ref<HTMLElement | null>(null);
defineExpose({ rootEl });

const visibleTracks = computed<TimelineShareTrack[]>(() => {
  const tracks = props.tracks.slice(0, 4);
  while (tracks.length < 4) {
    tracks.push({ id: `empty-${tracks.length}`, name: '', avatar: null, actions: [] });
  }
  return tracks;
});
const startFrame = computed(() => (props.showPrep ? -props.prepFrames : 0));
const endFrame = computed(() => props.duration * 30);
const pxPerFrame = computed(() => props.pxPerSecond / 30);
const timelineHeight = computed(() =>
  Math.max(120, (endFrame.value - startFrame.value) * pxPerFrame.value),
);
const tickFrames = computed(() => {
  if (!props.showTimeTicks) return [];
  const stepSeconds = props.duration <= 30 ? 1 : props.duration <= 90 ? 5 : 10;
  const stepFrames = stepSeconds * 30;
  const first = Math.ceil(startFrame.value / stepFrames) * stepFrames;
  const values: number[] = [];
  for (let frame = first; frame <= endFrame.value; frame += stepFrames) values.push(frame);
  return values;
});

function top(frame: number): number {
  return (frame - startFrame.value) * pxPerFrame.value;
}

function actionStyle(action: TimelineShareAction): Record<string, string> {
  const actionStart = Math.max(startFrame.value, action.startFrame);
  return {
    top: `${top(actionStart)}px`,
    height: `${props.blockHeight}px`,
    ...(action.color ? { '--share-action-accent': action.color } : {}),
  };
}

function durationStyle(action: TimelineShareAction): Record<string, string> {
  const actionStart = Math.max(startFrame.value, action.startFrame);
  const actionEnd = Math.min(endFrame.value, action.startFrame + action.durationFrames);
  return {
    top: `${top(actionStart)}px`,
    height: `${Math.max(8, top(actionEnd) - top(actionStart))}px`,
  };
}

function keycap(action: TimelineShareAction, trackIndex: number): string | null {
  const kind: TimelineOperationMarkerKind | null =
    action.skillType === 'battleSkill'
      ? 'skill'
      : action.skillType === 'comboSkill'
        ? 'combo'
        : action.skillType === 'ultimate'
          ? 'ultimate'
          : null;
  return kind === null
    ? null
    : timelineOperationKeycapLabel(kind, trackIndex, props.keycapMode, true);
}

function visible(action: TimelineShareAction): boolean {
  return (
    action.startFrame < endFrame.value &&
    action.startFrame + action.durationFrames > startFrame.value
  );
}
</script>

<template>
  <article
    ref="rootEl"
    class="timeline-share-card"
    :class="[`is-${appearance}`, { 'is-gamepad-keycaps': keycapMode === 'gamepad' }]"
    :style="{
      width: `${Math.max(280, Math.min(540, cardWidth))}px`,
      height: `${52 + timelineHeight}px`,
      '--share-second': `${pxPerSecond}px`,
      '--share-operation-width': keycapMode === 'gamepad' ? '120px' : '76px',
    }"
    :title="scenarioName"
  >
    <header class="share-header">
      <span v-if="showTimeTicks" class="share-header__time">TIME</span>
      <span v-else></span>
      <div
        v-for="track in visibleTracks"
        :key="track.id"
        class="share-header__operator"
        :class="{ 'is-empty': track.avatar === null }"
      >
        <img v-if="track.avatar" :src="track.avatar" :alt="track.name" />
      </div>
      <span v-if="showKeycaps"></span>
    </header>

    <div class="share-body" :style="{ height: `${timelineHeight}px` }">
      <aside v-if="showTimeTicks" class="share-time-rail">
        <i
          v-if="showPrep && prepFrames > 0"
          class="share-prep"
          :style="{ height: `${top(0)}px` }"
        ></i>
        <i class="share-zero" :style="{ top: `${top(0)}px` }"></i>
        <span
          v-for="frame in tickFrames"
          :key="frame"
          class="share-tick"
          :class="{ 'is-zero': frame === 0 }"
          :style="{ top: `${top(frame)}px` }"
        >
          <i></i>{{ frame / 30 }}s
        </span>
      </aside>
      <aside v-else></aside>

      <main class="share-tracks">
        <i
          v-if="showPrep && prepFrames > 0"
          class="share-prep share-prep--tracks"
          :style="{ height: `${top(0)}px` }"
        >
          <span>PREP</span>
        </i>
        <i class="share-zero" :style="{ top: `${top(0)}px` }"></i>
        <section v-for="track in visibleTracks" :key="track.id" class="share-track">
          <template v-for="action in track.actions.filter(visible)" :key="action.id">
            <i
              v-if="showDurationBars && action.durationFrames > 0"
              class="share-duration"
              :style="durationStyle(action)"
            >
              <span>{{ (action.durationFrames / 30).toFixed(1).replace(/\.0$/, '') }}s</span>
            </i>
            <div
              class="share-action"
              :class="[`is-${action.skillType ?? 'custom'}`, { 'is-disabled': action.disabled }]"
              :style="actionStyle(action)"
              :title="action.label"
            >
              <img v-if="showCombatIcons && action.icon" :src="action.icon" alt="" />
              <span>{{ action.label }}</span>
            </div>
          </template>
        </section>
      </main>

      <aside v-if="showKeycaps" class="share-operation-rail">
        <template v-for="(track, trackIndex) in visibleTracks" :key="track.id">
          <span
            v-for="action in track.actions.filter(
              action => visible(action) && keycap(action, trackIndex) !== null,
            )"
            :key="action.id"
            class="share-keycap"
            :class="[`is-${action.skillType ?? 'custom'}`]"
            :style="{
              top: `${top(action.startFrame)}px`,
              left: `${keycapMode === 'gamepad' ? 2 + trackIndex * 30 : 4 + trackIndex * 18}px`,
            }"
          >
            {{ keycap(action, trackIndex) }}
          </span>
        </template>
      </aside>
      <aside v-else></aside>
    </div>

    <footer>{{ watermark }}</footer>
  </article>
</template>

<style scoped>
.timeline-share-card {
  --share-bg: #121218;
  --share-panel: #0c0c10;
  --share-line: rgb(255 255 255 / 12%);
  --share-text: #fff;
  --share-muted: rgb(255 255 255 / 55%);
  --share-gold: #ffd800;
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--share-gold) 22%, transparent);
  background: var(--share-bg);
  color: var(--share-text);
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.timeline-share-card.is-light {
  --share-bg: #e8ebf0;
  --share-panel: #dce2eb;
  --share-line: rgb(26 27 30 / 14%);
  --share-text: #1a1b1e;
  --share-muted: rgb(26 27 30 / 55%);
  --share-gold: #c4a400;
}

.share-header {
  display: grid;
  grid-template-columns: 36px repeat(4, minmax(0, 1fr)) var(--share-operation-width);
  flex: 0 0 52px;
  align-items: center;
  padding: 6px 4px 8px;
  border-bottom: 1px solid color-mix(in srgb, var(--share-gold) 18%, transparent);
  background: var(--share-panel);
}

.share-header__time {
  color: var(--share-muted);
  font-size: 10px;
  font-weight: 800;
  text-align: center;
}

.share-header__operator {
  display: flex;
  justify-content: center;
  opacity: 1;
}

.share-header__operator.is-empty {
  opacity: 0.35;
}

.share-header__operator img {
  display: block;
  width: 36px;
  height: 36px;
  border: 1px solid var(--share-line);
  object-fit: cover;
  object-position: center;
}

.share-body {
  position: relative;
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) var(--share-operation-width);
  flex: 0 0 auto;
}

.share-time-rail,
.share-operation-rail {
  position: relative;
  background: rgb(0 0 0 / 18%);
}

.share-time-rail {
  border-right: 1px solid var(--share-line);
}

.share-operation-rail {
  overflow: hidden;
  border-left: 1px solid var(--share-line);
}

.share-tracks {
  position: relative;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  background: repeating-linear-gradient(
    to bottom,
    color-mix(in srgb, var(--share-text) 4%, transparent) 0,
    color-mix(in srgb, var(--share-text) 4%, transparent) 1px,
    transparent 1px,
    transparent var(--share-second)
  );
}

.share-track {
  position: relative;
  border-left: 1px solid color-mix(in srgb, var(--share-text) 8%, transparent);
}

.share-track:first-of-type {
  border-left: 0;
}

.share-prep {
  position: absolute;
  inset: 0 0 auto;
  z-index: 1;
  box-sizing: border-box;
  border-bottom: 1px solid var(--share-line);
  background: color-mix(in srgb, var(--share-text) 4%, transparent);
}

.share-prep--tracks {
  display: flex;
  align-items: center;
  justify-content: center;
  color: color-mix(in srgb, var(--share-text) 38%, transparent);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
}

.share-zero {
  position: absolute;
  right: 0;
  left: 0;
  z-index: 5;
  height: 2px;
  transform: translateY(-1px);
  background: color-mix(in srgb, var(--share-text) 40%, transparent);
  pointer-events: none;
}

.share-tick {
  position: absolute;
  right: 2px;
  left: 4px;
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 2px;
  transform: translateY(-50%);
  color: var(--share-muted);
  font-size: 8px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  white-space: nowrap;
}

.share-tick i {
  flex: 0 0 4px;
  height: 1px;
  background: color-mix(in srgb, var(--share-text) 32%, transparent);
}

.share-tick.is-zero {
  color: color-mix(in srgb, var(--share-text) 82%, transparent);
  font-weight: 700;
}

.share-action {
  --share-action-accent: var(--share-gold);
  position: absolute;
  right: 2px;
  left: 2px;
  z-index: 10;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  border: 1px solid color-mix(in srgb, var(--share-action-accent) 90%, transparent);
  background: color-mix(in srgb, var(--share-action-accent) 22%, transparent);
  color: #fff;
}

.is-light .share-action {
  background: color-mix(in srgb, var(--share-action-accent) 30%, #fff);
  color: #1a1b1e;
}

.share-action.is-disabled {
  opacity: 0.45;
  filter: grayscale(1);
}

.share-action > span {
  z-index: 1;
  max-width: 100%;
  overflow: hidden;
  padding: 0 4px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.4px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.share-action > img {
  position: absolute;
  top: 50%;
  right: 1px;
  z-index: 2;
  width: 16px;
  height: 16px;
  transform: translateY(-50%);
  object-fit: contain;
  filter: drop-shadow(0 0 1px rgb(0 0 0 / 85%));
}

.share-action.is-battleSkill {
  --share-action-accent: #42a5f5;
}

.share-action.is-comboSkill {
  --share-action-accent: #ffd600;
}

.share-action.is-ultimate {
  --share-action-accent: #ffb300;
}

.share-action.is-finisher {
  --share-action-accent: #ef5350;
}

.share-duration {
  position: absolute;
  right: 1px;
  z-index: 8;
  width: 2px;
  border-block: 1px solid currentColor;
  background: currentColor;
  color: var(--share-action-accent, var(--share-gold));
  pointer-events: none;
}

.share-duration span {
  position: absolute;
  top: 0;
  right: 4px;
  color: currentColor;
  font-size: 8px;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
}

.share-keycap {
  position: absolute;
  z-index: 8;
  box-sizing: border-box;
  display: flex;
  width: 16px;
  height: 12px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transform: translateY(-50%);
  border: 1px solid #888;
  border-radius: 2px;
  background: #3a3a3a;
  color: #fff;
  font-family: Consolas, Monaco, monospace;
  font-size: 8px;
  font-weight: 700;
  line-height: 1;
}

.is-gamepad-keycaps .share-keycap {
  width: 28px;
  font-size: 7px;
}

.share-keycap.is-comboSkill {
  border-color: var(--share-gold);
  background: color-mix(in srgb, var(--share-gold) 20%, transparent);
  color: var(--share-gold);
}

.is-light .share-keycap {
  border-color: #8b95a3;
  background: #c8d0db;
  color: #1a1b1e;
}

.timeline-share-card footer {
  position: absolute;
  right: 8px;
  bottom: 6px;
  z-index: 20;
  color: color-mix(in srgb, var(--share-gold) 35%, transparent);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  pointer-events: none;
}
</style>
