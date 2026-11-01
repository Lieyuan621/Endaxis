<script setup lang="ts">
import TimelineStatusIcon from './TimelineStatusIcon.vue';
import { enemyLifecycleMarkerBounds } from './enemyLifecycleEditing';
import { enemyPresenceMarkerKey, layoutEnemyLifecycleMarkers } from './enemyLifecycleMarkerLayout';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaInput, EaNumberInput } from '../../../design-system';
import type { EnemyLifecycleDocument } from '../../../core/project/schema';
import type { InteractionLease } from '../../interaction/interactionSession';
import { snapTimelineFrame } from '../interaction/timelineSnap';
import { passedTimelineDragThreshold } from '../interaction/timelineDragThreshold';
import { useInteractionSession } from '../../interaction/interactionSessionContext';
import { usePopoverInteractionBoundary } from '../../interaction/usePopoverInteractionBoundary';
const props = defineProps<{
  iconSize?: number;
  targetSwitches?: readonly { id: string; frame: number }[];
  lifecycle?: EnemyLifecycleDocument;
  initialFrame: number;
  defaultSpawnFrame: number;
  endFrame: number;
  automaticDeath: boolean;
  actualDeathFrame?: number;
  readOnly: boolean;
  canPaste?: boolean;
  name: string;
  icon?: string;
  selected?: boolean;
  removable: boolean;
  framePx: (frame: number) => number;
  pxFrame: (px: number) => number;
  scrollLeft: number;
  snapFrames: number;
}>();
const emit = defineEmits<{
  add: [];
  copy: [];
  paste: [];
  update: [value: EnemyLifecycleDocument];
  select: [];
  openDetail: [];
  rename: [name: string];
  remove: [];
  setTarget: [frame: number, id?: string];
  removeTarget: [id: string];
}>();
const { t } = useI18n();
const draftName = ref(props.name);
watch(
  () => props.name,
  name => {
    draftName.value = name;
  },
);
const value = computed(
  () => props.lifecycle ?? { spawnFrame: props.defaultSpawnFrame, presenceChanges: [] },
);
const markerLayout = computed(() =>
  layoutEnemyLifecycleMarkers(
    props.lifecycle,
    props.defaultSpawnFrame,
    props.automaticDeath,
    props.actualDeathFrame,
    props.iconSize,
  ),
);
function markerStyle(id: string) {
  if (id.startsWith('target:')) return { top: '1px', height: `${(props.iconSize ?? 28) / 2}px` };
  const position = markerLayout.value.markers.get(id);
  return position
    ? {
        top: position.top + 'px',
        height: position.height + 'px',
        fontSize: Math.min(14, position.height) + 'px',
      }
    : {};
}

type Marker = { id: string; frame: number; label: string; glyph: string };
const markers = computed<Marker[]>(() => [
  ...(props.targetSwitches ?? []).map(marker => ({
    id: 'target:' + marker.id,
    frame: marker.frame,
    label: t('timeline.enemies.mainTarget'),
    glyph: '◎',
  })),
  { id: 'spawn', frame: value.value.spawnFrame, label: t('timeline.enemies.spawn'), glyph: '◆' },
  ...value.value.presenceChanges.map(change => ({
    id: enemyPresenceMarkerKey(change.id),
    frame: change.frame,
    label: t(change.present ? 'timeline.enemies.enter' : 'timeline.enemies.exit'),
    glyph: change.present ? '▶' : '◀',
  })),
  ...(value.value.deathFrame !== undefined
    ? [
        {
          id: 'death',
          frame: value.value.deathFrame,
          label: t('timeline.enemies.death'),
          glyph: '×',
        },
      ]
    : []),
]);
const menu = ref<{ x: number; y: number; frame: number; marker?: Marker }>();
const coincidentMarkers = computed(() =>
  menu.value?.marker ? markers.value.filter(marker => marker.frame === menu.value!.frame) : [],
);
const menuElement = ref<HTMLElement>();
const drag = ref<{
  marker: Marker;
  x: number;
  y: number;
  pointerId: number;
  frame: number;
  started: boolean;
}>();
const session = useInteractionSession();
let lease: InteractionLease | null = null;
let capture: { element: HTMLElement; pointerId: number } | null = null;
let suppressDetailClick = false;
function cancelDrag() {
  if (drag.value?.started) suppressDetailClick = true;
  drag.value = undefined;
  lease?.release();
  lease = null;
  const previous = capture;
  capture = null;
  if (previous?.element.hasPointerCapture(previous.pointerId))
    previous.element.releasePointerCapture(previous.pointerId);
}
usePopoverInteractionBoundary(
  session,
  () => !!menu.value,
  () => {
    menu.value = undefined;
  },
);
watch(
  () => [props.lifecycle, props.readOnly, props.automaticDeath, props.initialFrame, props.endFrame],
  () => {
    cancelDrag();
    menu.value = undefined;
  },
);
function bounds(id: string): readonly [number, number] {
  if (id.startsWith('target:')) return [value.value.spawnFrame, props.endFrame];
  return enemyLifecycleMarkerBounds(value.value, id, props.initialFrame, props.endFrame);
}
function clampFrame(frame: number, id?: string) {
  const [min, max] = id ? bounds(id) : [value.value.spawnFrame, props.endFrame];
  return Math.max(min, Math.min(max, Math.round(frame)));
}
function setFrame(marker: Marker, frame: number) {
  if (props.readOnly || !Number.isFinite(frame)) return;
  frame = clampFrame(frame, marker.id);
  if (marker.id.startsWith('target:')) {
    if (!canTargetAtFrame(frame)) return;
    emit('setTarget', frame, marker.id.slice(7));
    menu.value = undefined;
    return;
  }
  const v = value.value;
  emit(
    'update',
    marker.id === 'spawn'
      ? { ...v, spawnFrame: frame }
      : marker.id === 'death'
        ? { ...v, deathFrame: frame }
        : {
            ...v,
            presenceChanges: v.presenceChanges.map(change =>
              enemyPresenceMarkerKey(change.id) === marker.id ? { ...change, frame } : change,
            ),
          },
  );
  menu.value = undefined;
}
function startDrag(event: PointerEvent, marker: Marker) {
  if (drag.value || props.readOnly || event.button !== 0) return;
  suppressDetailClick = false;
  emit('select');
  menu.value = undefined;
  const element = event.currentTarget;
  if (!(element instanceof HTMLElement)) return;
  lease = session.tryStart('enemy-lifecycle-marker', cancelDrag);
  if (!lease) return;
  element.setPointerCapture(event.pointerId);
  capture = { element, pointerId: event.pointerId };
  drag.value = {
    marker,
    x: event.clientX,
    y: event.clientY,
    pointerId: event.pointerId,
    frame: marker.frame,
    started: false,
  };
}
function moveDrag(event: PointerEvent) {
  const d = drag.value;
  if (!d || event.pointerId !== d.pointerId) return;
  if (!(event.buttons & 1)) {
    cancelDrag();
    return;
  }
  if (!d.started && !passedTimelineDragThreshold(d.x, d.y, event.clientX, event.clientY)) return;
  d.started = true;
  d.frame = clampFrame(
    snapTimelineFrame(
      props.pxFrame(props.framePx(d.marker.frame) + event.clientX - d.x),
      props.snapFrames,
      props.endFrame,
      props.initialFrame,
    ),
    d.marker.id,
  );
}
function endDrag(event: PointerEvent) {
  const d = drag.value;
  if (!d || d.pointerId !== event.pointerId) return;
  cancelDrag();
  if (d && d.frame !== d.marker.frame) setFrame(d.marker, d.frame);
}
async function openMenu(event: MouseEvent | KeyboardEvent, marker?: Marker) {
  emit('select');
  const element = event.currentTarget;
  if (!(element instanceof HTMLElement)) return;
  const anchor = element.getBoundingClientRect();
  const x = event instanceof MouseEvent ? event.clientX : anchor.right;
  const y = event instanceof MouseEvent ? event.clientY : anchor.bottom;
  const frame =
    marker?.frame ??
    clampFrame(
      snapTimelineFrame(
        props.pxFrame(x - anchor.left + props.scrollLeft),
        props.snapFrames,
        props.endFrame,
        props.initialFrame,
      ),
    );
  await showMenu(x, y, frame, marker?.id === 'spawn' ? undefined : marker);
}
async function showMenu(x: number, y: number, frame: number, marker?: Marker) {
  menu.value = { x, y, frame, marker };
  await nextTick();
  const rect = menuElement.value?.getBoundingClientRect();
  if (rect && menu.value) {
    menu.value.x = Math.max(6, Math.min(x, window.innerWidth - rect.width - 6));
    menu.value.y = Math.max(6, Math.min(y, window.innerHeight - rect.height - 6));
  }
}
const presenceAtMenu = computed(() => {
  let present = true;
  for (const change of value.value.presenceChanges)
    if (change.frame <= (menu.value?.frame ?? 0)) present = change.present;
  return present;
});
function canTargetAtFrame(frame: number): boolean {
  if (frame < value.value.spawnFrame) return false;
  const death = Math.min(value.value.deathFrame ?? Infinity, props.actualDeathFrame ?? Infinity);
  if (frame >= death) return false;
  let present = true;
  for (const change of value.value.presenceChanges)
    if (change.frame <= frame) present = change.present;
  return present;
}
function addEvent(kind: 'presence' | 'death') {
  if (!menu.value || props.readOnly) return;
  const frame = menu.value.frame;
  if (kind === 'death') emit('update', { ...value.value, deathFrame: frame });
  else
    emit('update', {
      ...value.value,
      presenceChanges: [
        ...value.value.presenceChanges.filter(change => change.frame !== frame),
        { id: crypto.randomUUID(), frame, present: !presenceAtMenu.value },
      ].sort((a, b) => a.frame - b.frame),
    });
  menu.value = undefined;
}
function removeMarker() {
  const marker = menu.value?.marker;
  if (!marker || marker.id === 'spawn' || props.readOnly) return;
  if (marker.id.startsWith('target:')) {
    emit('removeTarget', marker.id.slice(7));
    menu.value = undefined;
    return;
  }
  if (marker.id === 'death') {
    const { deathFrame: _, ...rest } = value.value;
    emit('update', rest);
  } else
    emit('update', {
      ...value.value,
      presenceChanges: value.value.presenceChanges.filter(
        change => enemyPresenceMarkerKey(change.id) !== marker.id,
      ),
    });
  menu.value = undefined;
}
function outside(event: PointerEvent) {
  if (event.target instanceof Node && !menuElement.value?.contains(event.target))
    menu.value = undefined;
}
onMounted(() => {
  window.addEventListener('pointerdown', outside, true);
  window.addEventListener('blur', cancelDrag);
});
onBeforeUnmount(() => {
  cancelDrag();
  window.removeEventListener('pointerdown', outside, true);
  window.removeEventListener('blur', cancelDrag);
});
</script>
<template>
  <div
    class="enemy-life-track"
    :style="{ '--enemy-icon-size': `${iconSize ?? 28}px` }"
    @contextmenu.prevent.stop="openMenu($event)"
  >
    <slot />
    <component
      :is="marker.id === 'spawn' ? TimelineStatusIcon : 'button'"
      :as="marker.id === 'spawn' ? 'button' : undefined"
      :size="iconSize ?? 28"
      v-for="marker in markers"
      :key="marker.id"
      class="life-marker"
      :class="{
        'life-avatar': marker.id === 'spawn',
        'life-target': marker.id.startsWith('target:'),
        selected: marker.id === 'spawn' && selected,
      }"
      :disabled="readOnly && marker.id !== 'spawn'"
      :aria-label="marker.id === 'spawn' ? name : marker.label"
      :title="`${name} · ${marker.label} · ${(marker.frame / 30).toFixed(2)}s`"
      :style="{
        ...markerStyle(marker.id),
        left:
          framePx(drag?.marker.id === marker.id ? drag.frame : marker.frame) - scrollLeft + 'px',
      }"
      @pointerdown.stop="startDrag($event, marker)"
      @pointermove="moveDrag"
      @pointerup="endDrag"
      @pointercancel="cancelDrag"
      @lostpointercapture="cancelDrag"
      @click.stop="emit('select')"
      @dblclick.stop="!suppressDetailClick && emit('openDetail')"
      @keydown.enter.prevent.stop="openMenu($event, marker)"
      @keydown.space.prevent.stop="openMenu($event, marker)"
      @contextmenu.prevent.stop="openMenu($event, marker)"
    >
      <template v-if="marker.id === 'spawn'">
        <img v-if="icon" :src="icon" alt="" draggable="false" />
        <span v-else>?</span>
      </template>
      <span v-else-if="marker.id.startsWith('target:')" class="target-cursor" aria-hidden="true" />
      <span v-else-if="marker.id.startsWith('presence:')" class="presence-glyph">{{
        marker.glyph
      }}</span>
      <template v-else>{{ marker.glyph }}</template>
      <span v-if="drag?.marker.id === marker.id" class="drag-time"
        >{{ (drag.frame / 30).toFixed(2) }}s</span
      >
    </component>
    <Teleport to="body">
      <div
        v-if="menu"
        ref="menuElement"
        class="enemy-life-menu"
        :style="{ left: menu.x + 'px', top: menu.y + 'px' }"
        @pointerdown.stop
        @contextmenu.prevent
      >
        <header>{{ name }} · {{ menu.marker?.label ?? (menu.frame / 30).toFixed(2) + 's' }}</header>
        <div v-if="coincidentMarkers.length > 1" class="coincident-markers">
          <EaButton
            v-for="marker in coincidentMarkers"
            :key="marker.id"
            :aria-pressed="menu.marker?.id === marker.id"
            @click="menu.marker = marker"
            >{{ marker.glyph }} {{ marker.label }}</EaButton
          >
        </div>
        <EaButton
          class="menu-item"
          @click="
            menu = undefined;
            emit('copy');
          "
          >{{ t('common.copy') }} <span class="menu-shortcut">Ctrl+C</span></EaButton
        >
        <EaButton
          class="menu-item"
          :disabled="readOnly || !canPaste"
          @click="
            menu = undefined;
            emit('paste');
          "
          >{{ t('common.paste') }} <span class="menu-shortcut">Ctrl+V</span></EaButton
        >
        <template v-if="menu.marker">
          <label
            >{{ t('timeline.enemies.timeSeconds') }}
            <EaNumberInput
              compact
              :model-value="menu.marker.frame / 30"
              :min="bounds(menu.marker.id)[0] / 30"
              :max="bounds(menu.marker.id)[1] / 30"
              :precision="2"
              :step="1 / 30"
              :disabled="readOnly"
              @change="
                value => value !== undefined && menu?.marker && setFrame(menu.marker, value * 30)
              "
            />
          </label>
          <EaButton
            v-if="menu.marker.id !== 'spawn'"
            class="menu-item"
            :disabled="readOnly"
            @click="removeMarker"
            >{{ t('common.delete') }}</EaButton
          >
        </template>
        <template v-else>
          <EaButton
            class="menu-item"
            :disabled="readOnly"
            @click="
              menu = undefined;
              emit('add');
            "
            >{{ t('timeline.enemies.add') }}</EaButton
          >
          <EaButton class="menu-item" :disabled="readOnly" @click="addEvent('presence')">{{
            t(presenceAtMenu ? 'timeline.enemies.exit' : 'timeline.enemies.enter')
          }}</EaButton>
          <EaButton class="menu-item" :disabled="readOnly" @click="addEvent('death')">{{
            t('timeline.enemies.manualDeath')
          }}</EaButton>
          <EaButton
            class="menu-item"
            :disabled="readOnly || !canTargetAtFrame(menu.frame)"
            @click="
              emit('setTarget', menu.frame);
              menu = undefined;
            "
            >{{ t('timeline.enemies.setMainTarget') }}</EaButton
          >
          <template v-if="removable">
            <label
              >{{ t('timeline.enemies.name')
              }}<EaInput v-model="draftName" :disabled="readOnly" @change="emit('rename', $event)"
            /></label>
            <EaButton
              class="menu-item"
              :disabled="readOnly"
              @click="
                emit('remove');
                menu = undefined;
              "
              >{{ t('common.delete') }}</EaButton
            >
          </template>
        </template>
      </div>
    </Teleport>
  </div>
</template>
<style scoped>
.enemy-life-track {
  position: relative;
  overflow: clip;
}
.life-marker {
  position: absolute;
  top: 3px;
  z-index: 2;
  padding: 0;
  width: var(--enemy-icon-size, 28px);
  height: var(--enemy-icon-size, 28px);
  display: grid;
  place-items: center;
  line-height: 1;
  transform: translateX(-50%);
  color: #ead5b0;
  cursor: ew-resize;
  touch-action: none;
}
.presence-glyph {
  transform: scale(0.8);
  pointer-events: none;
}
.life-marker:hover {
  color: white;
}
.life-marker:not(.life-avatar) {
  border: 0;
  background: transparent;
}
.life-marker:disabled {
  cursor: default;
}
.life-target {
  z-index: 3;
  display: grid;
  place-items: center;
  color: #fff;
  filter: drop-shadow(0 1px 1px rgb(0 0 0 / 70%));
}
.life-target:hover {
  background: transparent;
}
.target-cursor {
  width: calc(var(--enemy-icon-size, 28px) * 0.4);
  height: 100%;
  clip-path: polygon(0 0, 100% 0, 100% 65%, 50% 100%, 0 65%);
  background: currentColor;
  pointer-events: none;
}
.life-marker.life-avatar {
  position: absolute;
  z-index: 2;
  width: var(--enemy-icon-size, 28px);
  height: var(--enemy-icon-size, 28px);
  box-sizing: border-box;
  top: 1px;
  transform: none;
}
.life-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}
.life-avatar.selected {
  border-color: var(--ea-color-primary, #e5c84b);
  box-shadow: inset 0 0 0 1px var(--ea-color-primary, #e5c84b);
}
.drag-time {
  position: absolute;
  left: 14px;
  top: 0;
  background: #222;
  padding: 2px 4px;
  white-space: nowrap;
  pointer-events: none;
}
.enemy-life-menu {
  position: fixed;
  z-index: 10000;
  min-width: 220px;
  max-width: calc(100vw - 12px);
  padding: 6px 0;
  border: 1px solid #444;
  border-radius: 6px;
  background: #2b2b2b;
  box-shadow: 0 6px 16px #0009;
  color: #ccc;
  font-size: 13px;
}
.enemy-life-menu header {
  padding: 6px 12px;
  border-bottom: 1px solid #3a3a3a;
  color: #aaa;
}
.coincident-markers {
  display: flex;
  gap: 6px;
  padding: 8px 12px 0;
}
.coincident-markers [aria-pressed='true'] {
  color: var(--el-color-primary);
  border-color: currentColor;
}
.enemy-life-menu label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
}
.enemy-life-menu label > :last-child {
  width: 110px;
}
.menu-item {
  display: flex;
  width: 100%;
  height: 32px;
  padding: 0 12px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  justify-content: flex-start;
}
.menu-item:hover:not(:disabled) {
  background: #007fd4;
  color: white;
}
.menu-shortcut {
  margin-left: auto;
  color: var(--ea-fg-muted);
}
</style>
