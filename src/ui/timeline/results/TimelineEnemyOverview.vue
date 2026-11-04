<script setup lang="ts">
import {
  useKeyboardShortcutScope,
  isKeyboardShortcutIsolationTarget,
} from '../../keyboard/keyboardShortcutRouter';
import TimelineStatusIcon from './TimelineStatusIcon.vue';
import TimelinePointerTooltip from './TimelinePointerTooltip.vue';
import TimelineStatusDuration from './TimelineStatusDuration.vue';
import TimelineMonitorGrid from './TimelineMonitorGrid.vue';
import type { EnemyTargetSelection } from '../../../core/combat/enemies/enemyTargetSelection';
import { projectEnemyMainTargetSegments } from './enemyMainTargetSegments';
import { layoutEnemyLifecycleMarkers } from './enemyLifecycleMarkerLayout';
import { computed, ref, nextTick, onMounted, onBeforeUnmount, watch } from 'vue';
import { ENEMY_STATUS_CONTENT_TOP, enemyStatusRowSize } from './monitorSectionMinimums';
import { projectPoiseBrokenSegments } from '../../../core/projection/poiseCurves';
import EnemyLifecycleTrack from './EnemyLifecycleTrack.vue';
import type { EnemyLifecycleDocument } from '../../../core/project/schema';
import { useI18n } from 'vue-i18n';
import { useInteractionSession } from '../../interaction/interactionSessionContext';
import { usePopoverInteractionBoundary } from '../../interaction/usePopoverInteractionBoundary';
import { EaButton, EaCloseIcon, EaPlusIcon } from '../../../design-system';
import TimelineMenuActionIcon from '../interaction/TimelineMenuActionIcon.vue';
import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';
import type { EnemyHealthCurve } from '../../../core/projection/enemyHealthCurves';
import EnemyHealthMiniCurve from './EnemyHealthMiniCurve.vue';
import { ArrowRight, MoreFilled } from '@element-plus/icons-vue';

const HEALTH_CURVE_HEIGHT = 16;

const props = defineProps<{
  enemies: readonly {
    id: string;
    name: string;
    icon?: string;
    lifecycle?: EnemyLifecycleDocument;
  }[];
  targetSwitches?: readonly { id: string; frame: number; targetId: string }[];
  selectedId: string;
  healthCurve?: EnemyHealthCurve | null;
  entries: readonly CombatReceiptEntry[];
  publishedTargetSelection: EnemyTargetSelection;
  publishedInitialFrame: number;
  publishedEndFrame: number;
  endFrame: number;
  initialFrame: number;
  minimumEditableFrame: number;
  automaticDeath: boolean;
  framePx: (frame: number) => number;
  pxFrame: (px: number) => number;
  scrollLeft: number;
  snapFrames: number;
  headerWidth: number;
  timelineWidth: number;
  durationFrames: number;
  prepFrames: number;
  prepEndFrame: number;
  prepExpanded: boolean;
  pxPerFrame: number;
  readOnly: boolean;
  canPaste?: boolean;
  statusLanes: (id: string) => number;
}>();
const emit = defineEmits<{
  add: [];
  copy: [id: string];
  paste: [beforeId?: string];
  reorder: [id: string, beforeId?: string];
  setTarget: [targetId: string, frame: number, id?: string];
  removeTarget: [id: string];
  rename: [id: string, name: string];
  remove: [id: string];
  select: [id: string];
  openDetail: [id: string];
  updateLifecycle: [id: string, value: EnemyLifecycleDocument];
}>();
const menu = ref<{ x: number; y: number; enemyId?: string }>();
const menuElement = ref<HTMLElement>();
usePopoverInteractionBoundary(
  useInteractionSession(),
  () => !!menu.value,
  () => {
    menu.value = undefined;
  },
);
async function openMenu(event: MouseEvent, enemyId?: string) {
  menu.value = { x: event.clientX, y: event.clientY, enemyId };
  await nextTick();
  const rect = menuElement.value?.getBoundingClientRect();
  if (rect && menu.value)
    menu.value = {
      ...menu.value,
      x: Math.max(0, Math.min(event.clientX, window.innerWidth - rect.width - 4)),
      y: Math.max(0, Math.min(event.clientY, window.innerHeight - rect.height - 4)),
    };
}
function closeOutside(event: PointerEvent) {
  if (event.target instanceof Node && !menuElement.value?.contains(event.target))
    menu.value = undefined;
}
function addEnemy() {
  menu.value = undefined;
  if (!props.readOnly) emit('add');
}
function openMenuDetail() {
  const id = menu.value?.enemyId;
  menu.value = undefined;
  if (id) emit('openDetail', id);
}
const draggedRow = ref<string>();
const dropTarget = ref<{ id: string; after: boolean }>();
function finishDrag() {
  draggedRow.value = undefined;
  dropTarget.value = undefined;
}
function beginDrag(event: DragEvent, id: string) {
  if (props.readOnly) {
    event.preventDefault();
    return;
  }
  draggedRow.value = id;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', id);
  }
}
function previewDrop(event: DragEvent, id: string, axis: 'x' | 'y' = 'y') {
  if (!draggedRow.value || props.readOnly) return;
  event.preventDefault();
  if (id === draggedRow.value) {
    dropTarget.value = undefined;
    return;
  }
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  dropTarget.value = {
    id,
    after:
      axis === 'x'
        ? event.clientX >= rect.left + rect.width / 2
        : event.clientY >= rect.top + rect.height / 2,
  };
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
}
function leaveRow(event: DragEvent) {
  if (
    !(event.relatedTarget instanceof Node) ||
    !(event.currentTarget as HTMLElement).contains(event.relatedTarget)
  )
    dropTarget.value = undefined;
}
function dropRow() {
  if (!props.readOnly && draggedRow.value && dropTarget.value) {
    const remaining = props.enemies.filter(enemy => enemy.id !== draggedRow.value);
    const index = remaining.findIndex(enemy => enemy.id === dropTarget.value!.id);
    if (index >= 0)
      emit('reorder', draggedRow.value, remaining[index + (dropTarget.value.after ? 1 : 0)]?.id);
  }
  finishDrag();
}
function scrollEnemyIntoView(id: string) {
  const container = root.value?.querySelector<HTMLElement>('.enemy-overview__rows');
  const index = props.enemies.findIndex(enemy => enemy.id === id);
  const row = container?.querySelectorAll<HTMLElement>('.enemy-overview__row')[index];
  if (!container || !row) return;
  const top = row.offsetTop;
  const bottom = top + row.offsetHeight;
  if (top < container.scrollTop) container.scrollTop = top;
  else if (bottom > container.scrollTop + container.clientHeight)
    container.scrollTop = Math.max(
      0,
      row.offsetHeight > container.clientHeight ? top : bottom - container.clientHeight,
    );
}
async function locateEnemy(id: string) {
  emit('select', id);
  await nextTick();
  scrollEnemyIntoView(id);
}
watch(
  () => props.selectedId,
  async id => {
    await nextTick();
    scrollEnemyIntoView(id);
  },
);
function selectEnemy(id: string) {
  emit('select', id);
}
const { t } = useI18n();
const menuTitle = computed(() => {
  if (!menu.value?.enemyId) return t('timeline.enemies.title');
  const index = props.enemies.findIndex(enemy => enemy.id === menu.value?.enemyId);
  return index < 0 ? t('timeline.enemies.title') : `${index + 1}. ${props.enemies[index]!.name}`;
});
const root = ref<HTMLElement>();
const pasteBeforeId = ref<string>();
function updatePastePosition(event: MouseEvent) {
  const rows = root.value?.querySelectorAll<HTMLElement>('.enemy-overview__row');
  pasteBeforeId.value = undefined;
  if (!rows) return;
  for (let index = 0; index < rows.length; index++) {
    const rect = rows[index]!.getBoundingClientRect();
    if (event.clientY < rect.top + rect.height / 2) {
      pasteBeforeId.value = props.enemies[index]?.id;
      return;
    }
  }
}
function copyEnemy(id = menu.value?.enemyId ?? props.selectedId) {
  menu.value = undefined;
  emit('copy', id);
}
function removeMenuEnemy() {
  const id = menu.value?.enemyId;
  menu.value = undefined;
  if (id && !props.readOnly && props.enemies.length > 1) emit('remove', id);
}
function pasteEnemy() {
  menu.value = undefined;
  if (!props.readOnly && props.canPaste) emit('paste', pasteBeforeId.value);
}
function ownFocus(event: PointerEvent) {
  if (!isKeyboardShortcutIsolationTarget(event.target)) root.value?.focus({ preventScroll: true });
}
function clipboardCommand(command: string): boolean {
  if (command === 'copy') {
    copyEnemy();
    return true;
  }
  if (command === 'paste') {
    pasteEnemy();
    return true;
  }
  return false;
}
useKeyboardShortcutScope({
  id: 'enemy-overview',
  priority: 20,
  active: () =>
    typeof document !== 'undefined' &&
    !!root.value?.contains(document.activeElement) &&
    !menu.value,
  handle: event =>
    !isKeyboardShortcutIsolationTarget(event.target) &&
    (event.ctrlKey || event.metaKey) &&
    !event.altKey &&
    !event.shiftKey &&
    clipboardCommand(
      event.key.toLowerCase() === 'c' ? 'copy' : event.key.toLowerCase() === 'v' ? 'paste' : '',
    ),
  handleClipboard: event =>
    !isKeyboardShortcutIsolationTarget(event.target) && clipboardCommand(event.type),
});
const height = ref(0);
let observer: ResizeObserver | undefined;
onMounted(() => {
  window.addEventListener('pointerdown', closeOutside, true);
  window.addEventListener('blur', finishDrag);
  if (!root.value) return;
  height.value = root.value.clientHeight;
  observer = new ResizeObserver(() => {
    height.value = root.value?.clientHeight ?? 0;
  });
  observer.observe(root.value);
  nextTick(() => scrollEnemyIntoView(props.selectedId));
});
onBeforeUnmount(() => {
  observer?.disconnect();
  window.removeEventListener('pointerdown', closeOutside, true);
  window.removeEventListener('blur', finishDrag);
});
const iconSize = computed(() =>
  enemyStatusRowSize(
    height.value -
      ENEMY_STATUS_CONTENT_TOP -
      props.enemies.length * 4 -
      (props.healthCurve ? HEALTH_CURVE_HEIGHT : 0),
    props.enemies.reduce(
      (sum, enemy) =>
        sum +
        (enemy.id === props.selectedId ? props.statusLanes(enemy.id) : 0) +
        Math.ceil(
          layoutEnemyLifecycleMarkers(
            enemy.lifecycle,
            props.initialFrame,
            props.automaticDeath,
            undefined,
            20,
          ).height / 24,
        ),
      0,
    ),
  ),
);
const rowPitch = computed(() => iconSize.value + 4);
const mainTargetSegments = computed(() =>
  projectEnemyMainTargetSegments(
    props.entries,
    props.publishedTargetSelection,
    props.publishedInitialFrame,
    props.publishedEndFrame,
  ),
);
const rows = computed(() =>
  props.enemies.map(enemy => {
    const segments: { start: number; end: number; present: boolean }[] = [];
    let start: number | undefined;
    let present = false;
    let death: number | undefined;
    for (const entry of props.entries) {
      if (
        entry.event !== 'EnemyLifecycleChanged' ||
        entry.targetId !== enemy.id ||
        entry.frame > props.publishedEndFrame
      )
        continue;
      if (start !== undefined && entry.frame > start)
        segments.push({ start, end: entry.frame, present });
      if (entry.data?.current === 'dead') {
        death = entry.frame;
        start = undefined;
        break;
      }
      start = entry.frame;
      present = entry.data?.current === 'present';
    }
    if (start !== undefined && props.publishedEndFrame > start)
      segments.push({ start, end: props.publishedEndFrame, present });
    const projectedSegments = segments
      .flatMap(segment =>
        mainTargetSegments.value.map(target => ({
          ...segment,
          start: Math.max(props.initialFrame, segment.start, target.start),
          end: Math.min(props.endFrame, segment.end, target.end),
          mainTarget: target.targetId === enemy.id,
        })),
      )
      .filter(segment => segment.end > segment.start);
    const mergedSegments: typeof projectedSegments = [];
    for (const segment of projectedSegments) {
      const previous = mergedSegments.at(-1);
      if (
        previous?.end === segment.start &&
        previous.present === segment.present &&
        previous.mainTarget === segment.mainTarget
      )
        previous.end = segment.end;
      else mergedSegments.push(segment);
    }
    const healthCurve = enemy.id === props.selectedId ? props.healthCurve : null;
    const healthStartFrame = Math.max(props.initialFrame, segments[0]?.start ?? props.endFrame);
    const healthEndFrame = Math.min(props.endFrame, props.publishedEndFrame, death ?? Infinity);
    const healthHeight =
      enemy.id === props.selectedId && healthCurve && healthEndFrame > healthStartFrame
        ? HEALTH_CURVE_HEIGHT
        : 0;
    return {
      ...enemy,
      healthCurve,
      healthStartFrame,
      healthEndFrame,
      healthHeight,
      markerLayout: layoutEnemyLifecycleMarkers(
        enemy.lifecycle,
        segments[0]?.start ?? props.initialFrame,
        props.automaticDeath,
        death,
        iconSize.value,
      ),
      spawnFrame: enemy.lifecycle?.spawnFrame ?? segments[0]?.start ?? props.initialFrame,
      segments: mergedSegments,
      death,
      statusClipStart: props.framePx(
        Math.max(props.initialFrame, segments[0]?.start ?? props.endFrame),
      ),
      statusClipEnd: props.framePx(
        Math.max(props.initialFrame, segments[0]?.start ?? props.endFrame, death ?? props.endFrame),
      ),
      broken: projectPoiseBrokenSegments(
        props.entries,
        Math.max(0, props.publishedEndFrame),
        enemy.id,
      )
        .map(segment => ({
          startFrame: Math.max(
            props.initialFrame,
            segments[0]?.start ?? props.endFrame,
            segment.startFrame,
          ),
          endFrame: Math.min(death ?? props.endFrame, segment.endFrame),
        }))
        .filter(segment => segment.endFrame > segment.startFrame),
    };
  }),
);
</script>

<template>
  <section
    ref="root"
    class="enemy-overview"
    tabindex="-1"
    @pointerdown.capture="ownFocus"
    @pointermove="updatePastePosition"
    @contextmenu.capture="updatePastePosition"
    @contextmenu.prevent.stop="openMenu($event)"
    :style="{
      '--enemy-header-width': headerWidth + 'px',
      '--enemy-bar-top': 1 + (iconSize - 16) / 2 + 'px',
    }"
  >
    <TimelineMonitorGrid
      :width="headerWidth + timelineWidth"
      :duration-frames="durationFrames"
      :prep-frames="prepFrames"
      :prep-end-frame="prepEndFrame"
      :prep-expanded="prepExpanded"
      :px-per-frame="pxPerFrame"
      :track-header-width="headerWidth"
      :scroll-left="scrollLeft"
    />
    <header>
      <span>{{ t('timeline.enemies.title') }}</span>
      <EaButton
        type="button"
        variant="ghost"
        size="sm"
        icon-only
        class="enemy-overview__add"
        :disabled="readOnly"
        :title="t('timeline.enemies.add')"
        :aria-label="t('timeline.enemies.add')"
        @click.stop="addEnemy"
      >
        <EaPlusIcon />
      </EaButton>
    </header>
    <Teleport to="body"
      ><div
        v-if="menu"
        ref="menuElement"
        class="enemy-overview-menu timeline-context-menu"
        :style="{ left: menu.x + 'px', top: menu.y + 'px' }"
        @pointerdown.stop
        @contextmenu.prevent
      >
        <div class="menu-header">
          {{ menuTitle }}
        </div>
        <EaButton
          v-if="menu.enemyId"
          class="menu-item"
          variant="ghost"
          size="sm"
          @click="openMenuDetail"
        >
          <span class="menu-icon" aria-hidden="true"><ArrowRight /></span>
          <span>{{ t('timeline.enemies.openDetail') }}</span>
        </EaButton>
        <EaButton
          v-if="!menu.enemyId"
          class="menu-item"
          variant="ghost"
          size="sm"
          :disabled="readOnly"
          @click="addEnemy"
        >
          <span class="menu-icon" aria-hidden="true"><EaPlusIcon /></span>
          <span>{{ t('timeline.enemies.add') }}</span>
        </EaButton>
        <EaButton class="menu-item" variant="ghost" size="sm" @click="copyEnemy()">
          <TimelineMenuActionIcon action="copy" />
          <span>{{ t('common.copy') }}</span>
          <kbd>Ctrl+C</kbd>
        </EaButton>
        <EaButton
          class="menu-item"
          variant="ghost"
          size="sm"
          :disabled="readOnly || !canPaste"
          @click="pasteEnemy"
          ><TimelineMenuActionIcon action="paste" />
          <span>{{ t('common.paste') }}</span>
          <kbd>Ctrl+V</kbd></EaButton
        >
        <EaButton
          v-if="menu.enemyId"
          class="menu-item delete-item"
          variant="ghost"
          size="sm"
          :disabled="readOnly || enemies.length <= 1"
          @click="removeMenuEnemy"
          ><TimelineMenuActionIcon action="delete" />
          <span>{{ t('common.delete') }}</span></EaButton
        >
      </div></Teleport
    >
    <div class="enemy-overview__rows">
      <div
        v-for="(row, index) in rows"
        :key="row.id"
        class="enemy-overview__row"
        :class="{
          'is-selected': selectedId === row.id,
          'is-reorder-source': draggedRow === row.id,
          'is-drop-before': dropTarget?.id === row.id && !dropTarget.after,
          'is-drop-after': dropTarget?.id === row.id && dropTarget.after,
        }"
        @dragover="previewDrop($event, row.id)"
        @dragleave="leaveRow"
        @drop.prevent.stop="dropRow"
        :style="{
          height:
            row.markerLayout.height +
            6 +
            row.healthHeight +
            (row.id === selectedId ? statusLanes(row.id) * rowPitch : 0) +
            'px',
          '--enemy-label-control-height': row.markerLayout.height + 6 + 'px',
        }"
      >
        <div class="enemy-overview__label">
          <button
            type="button"
            class="enemy-overview__avatar"
            :class="{ 'is-selected': selectedId === row.id }"
            :draggable="!readOnly"
            :title="`${index + 1}. ${row.name}`"
            :aria-label="`${index + 1}. ${row.name}`"
            :aria-pressed="selectedId === row.id"
            @dragstart="beginDrag($event, row.id)"
            @dragend="finishDrag"
            @click.stop="locateEnemy(row.id)"
            @dblclick.stop="emit('openDetail', row.id)"
            @contextmenu.prevent.stop="openMenu($event, row.id)"
          >
            <TimelineStatusIcon
              :size="Math.min(iconSize, 20)"
              :src="row.icon"
              fallback="?"
              aria-hidden="true"
            />
            <span class="enemy-overview__index" aria-hidden="true">{{ index + 1 }}</span>
            <span class="enemy-overview__name">{{ row.name }}</span>
          </button>
          <EaButton
            type="button"
            variant="ghost"
            size="sm"
            icon-only
            class="enemy-overview__row-action"
            :title="t('timeline.enemies.moreActions')"
            :aria-label="`${index + 1}. ${row.name} · ${t('timeline.enemies.moreActions')}`"
            @click.stop="openMenu($event, row.id)"
          >
            <MoreFilled />
          </EaButton>
        </div>
        <EnemyLifecycleTrack
          @add="addEnemy"
          :can-paste="canPaste"
          @copy="copyEnemy(row.id)"
          @paste="pasteEnemy"
          :icon-size="iconSize"
          class="enemy-overview__lane"
          :lifecycle="row.lifecycle"
          :default-spawn-frame="row.spawnFrame"
          :initial-frame="initialFrame"
          :minimum-editable-frame="minimumEditableFrame"
          :end-frame="endFrame"
          :automatic-death="automaticDeath"
          :actual-death-frame="row.death"
          :read-only="readOnly"
          :name="row.name"
          :icon="row.icon"
          :selected="row.id === selectedId"
          :removable="enemies.length > 1"
          :target-switches="(targetSwitches ?? []).filter(marker => marker.targetId === row.id)"
          @set-target="(frame, id) => emit('setTarget', row.id, frame, id)"
          @remove-target="emit('removeTarget', $event)"
          :frame-px="framePx"
          :px-frame="pxFrame"
          :scroll-left="scrollLeft"
          :snap-frames="snapFrames"
          @select="selectEnemy(row.id)"
          @open-detail="emit('openDetail', row.id)"
          @update="emit('updateLifecycle', row.id, $event)"
          @rename="emit('rename', row.id, $event)"
          @remove="emit('remove', row.id)"
        >
          <EnemyHealthMiniCurve
            v-if="row.healthHeight && row.healthCurve"
            :name="row.name"
            :curve="row.healthCurve"
            :start-frame="row.healthStartFrame"
            :end-frame="row.healthEndFrame"
            :top="row.markerLayout.height + 2"
            :frame-px="framePx"
            :px-frame="pxFrame"
            :scroll-left="scrollLeft"
          />
          <div
            v-if="row.id === selectedId"
            class="enemy-overview__hits"
            :style="{ left: -scrollLeft + 'px' }"
          >
            <slot
              name="hits"
              :id="row.id"
              :icon-size="iconSize"
              :status-top="row.markerLayout.height + 2 + row.healthHeight"
            />
          </div>
          <div
            v-if="row.id === selectedId"
            class="enemy-overview__states"
            :style="{
              left: -scrollLeft + 'px',
              top: row.markerLayout.height + 2 + row.healthHeight + 'px',
              height: statusLanes(row.id) * rowPitch + 'px',
              clipPath:
                'polygon(' +
                row.statusClipStart +
                'px 0, ' +
                row.statusClipEnd +
                'px 0, ' +
                row.statusClipEnd +
                'px 100%, ' +
                row.statusClipStart +
                'px 100%)',
            }"
          >
            <slot
              name="states"
              :id="row.id"
              :icon-size="iconSize"
              :status-top="row.markerLayout.height + 2 + row.healthHeight"
            />
          </div>
          <TimelinePointerTooltip
            v-for="(segment, index) in row.segments"
            :key="index"
            v-slot="{ events }"
            :text="
              row.name +
              ' · ' +
              t(segment.present ? 'timeline.enemies.present' : 'timeline.enemies.absent') +
              (segment.mainTarget ? ' · ' + t('timeline.enemies.mainTarget') : '')
            "
          >
            <TimelineStatusDuration
              as="button"
              v-on="events"
              :aria-label="
                row.name +
                ' · ' +
                t(segment.present ? 'timeline.enemies.present' : 'timeline.enemies.absent') +
                (segment.mainTarget ? ' · ' + t('timeline.enemies.mainTarget') : '')
              "
              class="enemy-overview__segment"
              :class="{ absent: !segment.present, 'is-main-target': segment.mainTarget }"
              :style="{
                marginLeft: segment.start === row.spawnFrame ? '2px' : '0px',
                left:
                  framePx(segment.start) -
                  scrollLeft +
                  (segment.start === row.spawnFrame ? iconSize : 0) +
                  'px',
                width:
                  Math.max(
                    0,
                    framePx(segment.end) -
                      framePx(segment.start) -
                      (segment.start === row.spawnFrame ? iconSize + 2 : 0),
                  ) + 'px',
              }"
              @click="selectEnemy(row.id)"
              @dblclick="emit('openDetail', row.id)"
            />
          </TimelinePointerTooltip>
          <span
            v-for="segment in row.broken"
            :key="'poise:' + segment.startFrame"
            class="enemy-overview__poise"
            aria-hidden="true"
            :style="{
              left: framePx(segment.startFrame) - scrollLeft + 'px',
              width: Math.max(1, framePx(segment.endFrame) - framePx(segment.startFrame)) + 'px',
            }"
          />
          <span
            v-if="
              automaticDeath && row.death !== undefined && row.death !== row.lifecycle?.deathFrame
            "
            class="enemy-overview__death"
            :title="t('timeline.enemies.death')"
            role="img"
            :aria-label="row.name + ' · ' + t('timeline.enemies.death')"
            :style="{
              left: framePx(row.death) - scrollLeft + 'px',
              top: row.markerLayout.markers.get('actualDeath')!.top + 'px',
              height: row.markerLayout.markers.get('actualDeath')!.height + 'px',
              width: iconSize + 'px',
              fontSize: Math.min(14, row.markerLayout.markers.get('actualDeath')!.height) + 'px',
            }"
            ><EaCloseIcon size="1em"
          /></span>
        </EnemyLifecycleTrack>
      </div>
    </div>
  </section>
</template>

<style scoped>
.enemy-overview {
  outline: none;
  position: relative;
  height: 100%;
  min-height: 0;
  overflow: clip;
  border-bottom: 1px solid var(--ea-border-soft);
}
header {
  position: absolute;
  z-index: 3;
  inset: 0 auto auto 0;
  width: var(--enemy-header-width);
  height: 18px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 0 0 0 8px;
  border-left: 3px solid #ff7875;
  border-right: 1px solid var(--ea-divider, rgb(255 255 255 / 16%));
  background: var(--ea-workbench-panel, #252526);
  color: #ff7875;
  font-size: 11px;
  font-weight: 600;
}
.enemy-overview__add.ea-button {
  width: 20px;
  height: 18px;
  margin-left: auto;
  padding: 0;
  border-left: 1px solid var(--ea-border-soft);
  color: var(--ea-gold);
}
.enemy-overview__add svg {
  width: 13px;
  height: 13px;
}
.enemy-overview__rows {
  position: relative;
  box-sizing: border-box;
  height: 100%;
  padding-top: 18px;
  overflow-y: auto;
}
.enemy-overview__row {
  position: relative;
  display: grid;
  grid-template-columns: var(--enemy-header-width) minmax(0, 1fr);
  min-width: 0;
}
.enemy-overview__label {
  position: relative;
  z-index: 2;
  min-width: 0;
  box-sizing: border-box;
  border-left: 3px solid transparent;
  border-right: 1px solid var(--ea-divider, rgb(255 255 255 / 16%));
  border-bottom: 1px solid var(--ea-border-soft);
  background: var(--ea-workbench-panel, #252526);
  display: flex;
  align-items: flex-start;
}
.enemy-overview__row.is-selected .enemy-overview__label {
  border-left-color: var(--ea-gold);
  background: color-mix(in srgb, var(--ea-gold) 8%, var(--ea-workbench-panel, #252526));
}
.enemy-overview__avatar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1 1 auto;
  min-width: 0;
  height: min(28px, var(--enemy-label-control-height));
  padding: 2px 6px;
  border: 0;
  background: transparent;
  color: var(--ea-fg);
  text-align: left;
  font: inherit;
  cursor: pointer;
}
.enemy-overview__row-action.ea-button {
  flex: 0 0 20px;
  width: 20px;
  height: min(24px, var(--enemy-label-control-height));
  padding: 0;
  color: var(--ea-fg-muted);
  opacity: 0.5;
}
.enemy-overview__row-action svg {
  width: 13px;
  height: 13px;
}
.enemy-overview__row-action.ea-button:hover,
.enemy-overview__row-action.ea-button:focus-visible,
.enemy-overview__row.is-selected .enemy-overview__row-action.ea-button {
  opacity: 1;
  color: var(--ea-gold);
}
.enemy-overview__avatar:hover {
  background: rgb(255 255 255 / 7%);
}
.enemy-overview__avatar:focus-visible {
  outline: 2px solid var(--ea-gold);
  outline-offset: -2px;
}
.enemy-overview__name {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 11px;
}
.enemy-overview__index {
  flex: 0 0 12px;
  color: var(--ea-fg-muted);
  font-size: 10px;
  text-align: right;
}
.enemy-overview__avatar.is-selected .enemy-overview__name {
  color: var(--ea-gold);
}
.enemy-overview__hits {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 15;
}
.enemy-overview__states {
  position: absolute;
  top: 28px;
  right: 0;
}
.enemy-overview__lane {
  position: relative;
  min-width: 0;
  overflow: clip;
  border-bottom: 1px solid var(--ea-border-soft);
}
.enemy-overview__row.is-selected .enemy-overview__lane {
  background: rgb(255 255 255 / 2%);
}
.enemy-overview__segment.anomaly-duration-bar {
  position: absolute;
  top: var(--enemy-bar-top);
  background: transparent;
  box-shadow: none;
  cursor: pointer;
  opacity: 0.65;
}
.enemy-overview__segment.anomaly-duration-bar::before {
  content: '';
  position: absolute;
  inset: 50% 0 auto;
  height: 3px;
  transform: translateY(-50%);
  border-radius: 2px;
  background: #456b69;
  pointer-events: none;
}
.enemy-overview__segment.anomaly-duration-bar:hover {
  box-shadow: none;
}
.enemy-overview__segment :deep(.striped-bg) {
  display: none;
}
.enemy-overview__row.is-selected .enemy-overview__segment {
  opacity: 1;
}

.enemy-overview__segment.absent::before {
  background: repeating-linear-gradient(90deg, #607576 0 4px, transparent 4px 8px);
}
.enemy-overview__segment.is-main-target:not(.absent)::before {
  background: #79b9b3;
}
.enemy-overview__segment.is-main-target:not(.absent) {
  opacity: 1;
}
.enemy-overview__poise {
  position: absolute;
  top: calc(var(--enemy-bar-top) + 6px);
  height: 4px;
  z-index: 1;
  pointer-events: none;
  background: repeating-linear-gradient(
    135deg,
    rgb(255 213 145 / 60%) 0 2px,
    rgb(255 156 110 / 10%) 2px 10px
  );
}
.enemy-overview__death {
  position: absolute;
  z-index: 3;
  display: grid;
  place-items: center;
  top: 2px;
  transform: translateX(-50%);
  color: #ed7272;
  font-size: 16px;
  line-height: 1;
  pointer-events: none;
}
.enemy-overview__row.is-reorder-source {
  opacity: 0.5;
}
.enemy-overview__row.is-drop-before,
.enemy-overview__row.is-drop-after {
  background: rgb(255 255 255 / 8%);
}
.enemy-overview__row.is-drop-before::after,
.enemy-overview__row.is-drop-after::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--ea-gold);
  z-index: 50;
  pointer-events: none;
}
.enemy-overview__row.is-drop-before::after {
  top: 0;
}
.enemy-overview__row.is-drop-after::after {
  bottom: 0;
}
.enemy-overview__avatar[draggable='true'] {
  cursor: grab;
}
</style>
