<script setup lang="ts">
/**
 * 时间轴单轨固定头部，只展示定义身份和稳定配装槽位。
 * 选择、排序和编辑动作由父层 command 处理，本组件不修改项目对象。
 */
import type { TimelineTrackViewModel } from '../timelineEditorViewModel';
import type { LoadoutGearSlot } from '../library/loadoutBuildViewModel';
import OperatorSupportNotice from '../library/OperatorSupportNotice.vue';
import { getOperatorAvatarPath } from '../../gameAssetPaths';
import CustomNumberInput from '../../components/CustomNumberInput.vue';
import OperatorAvatar from '../../components/OperatorAvatar.vue';
import { EaButton } from '@/design-system';

const props = defineProps<{
  readOnly?: boolean;
  track: TimelineTrackViewModel;
  name: string;
  formName?: string | null;
  selected: boolean;
  reorderSource: boolean;
  reorderTarget: boolean;
  weaponIcon: string | null;
  gearIcons: Readonly<Record<LoadoutGearSlot, string | null>>;
  labels: Record<'operator' | 'weapon' | LoadoutGearSlot, string>;
  activeGearSetLabel: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  statDetailsAvailable?: boolean;
  statDetailsError?: string | null;
}>();

const emit = defineEmits<{
  select: [];
  operator: [];
  moveUp: [];
  moveDown: [];
  reorderDragStart: [event: DragEvent];
  reorderDragEnd: [];
  reorderDragEnter: [];
  reorderDragLeave: [];
  reorderDrop: [event: DragEvent];
  stats: [];
  weapon: [];
  gear: [slot: LoadoutGearSlot];
  updateInitialUltimateEnergy: [value: number];
}>();

function selectHeader(): void {
  emit('select');
}

function selectName(): void {
  emit('select');
  if (!props.readOnly && props.track.operatorSlug === null) emit('operator');
}

function updateInitialUltimateEnergy(value: unknown): void {
  const maximum = props.track.maxUltimateEnergy;
  if (maximum === null) return;
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return;
  emit('updateInitialUltimateEnergy', Math.min(maximum, Math.max(0, numericValue)));
}

function leaveReorderTarget(event: DragEvent): void {
  const current = event.currentTarget as HTMLElement;
  if (event.relatedTarget instanceof Node && current.contains(event.relatedTarget)) return;
  emit('reorderDragLeave');
}

function startReorder(event: DragEvent): void {
  if (props.readOnly) {
    event.preventDefault();
    return;
  }
  const header = (event.currentTarget as HTMLElement).closest('.track-header');
  if (header instanceof HTMLElement && event.dataTransfer !== null) {
    const bounds = header.getBoundingClientRect();
    // 拖动预览沿用整个轨道身份区，抓取位置不因从把手启动而跳动。
    event.dataTransfer.setDragImage(
      header,
      event.clientX - bounds.left,
      event.clientY - bounds.top,
    );
  }
  emit('reorderDragStart', event);
}
</script>

<template>
  <div
    class="track-header"
    :class="{
      'is-selected': selected,
      'is-reorder-source': reorderSource,
      'is-reorder-target': reorderTarget,
    }"
    @click.stop="selectHeader"
    @dragover.prevent
    @dragenter.prevent="$emit('reorderDragEnter')"
    @dragleave="leaveReorderTarget"
    @drop.prevent.stop="$emit('reorderDrop', $event)"
  >
    <span class="reorder-column">
      <EaButton
        variant="ghost"
        size="sm"
        icon-only
        type="button"
        class="reorder-button"
        :disabled="readOnly || !canMoveUp"
        :title="$t('common.moveUp')"
        :aria-label="$t('common.moveUp')"
        @click.stop="$emit('moveUp')"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="18 15 12 9 6 15" /></svg>
      </EaButton>
      <span
        class="drag-handle"
        :draggable="!readOnly"
        aria-hidden="true"
        @dragstart.stop="startReorder"
        @dragend.stop="$emit('reorderDragEnd')"
      >
        <svg viewBox="0 0 24 24">
          <circle cx="8" cy="4" r="2" />
          <circle cx="8" cy="12" r="2" />
          <circle cx="8" cy="20" r="2" />
          <circle cx="16" cy="4" r="2" />
          <circle cx="16" cy="12" r="2" />
          <circle cx="16" cy="20" r="2" />
        </svg>
      </span>
      <EaButton
        variant="ghost"
        size="sm"
        icon-only
        type="button"
        class="reorder-button"
        :disabled="readOnly || !canMoveDown"
        :title="$t('common.moveDown')"
        :aria-label="$t('common.moveDown')"
        @click.stop="$emit('moveDown')"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
      </EaButton>
    </span>
    <span class="identity-body">
      <div v-if="track.operatorSlug" class="initial-gauge-control" @click.stop>
        <span class="initial-gauge-label">{{ $t('timelineGrid.track.initialGaugeShort') }}</span>
        <span class="initial-gauge-input-wrap">
          <span v-if="readOnly">{{ track.initialUltimateEnergy }}</span>
          <CustomNumberInput
            v-else
            :model-value="track.initialUltimateEnergy"
            :min="0"
            :max="track.maxUltimateEnergy ?? 0"
            :step="1"
            active-color="#7dd3fc"
            border-color="#7dd3fc"
            text-align="center"
            @update:model-value="updateInitialUltimateEnergy"
          />
        </span>
        <span class="initial-gauge-max">/{{ track.maxUltimateEnergy ?? '?' }}</span>
      </div>
      <span class="operator-row">
        <button
          v-if="track.operatorSlug"
          type="button"
          class="avatar-shell avatar-trigger"
          :disabled="readOnly"
          :title="labels.operator"
          :aria-label="labels.operator"
          @click.stop="$emit('operator')"
        >
          <OperatorAvatar
            class="avatar"
            :src="getOperatorAvatarPath(track.operatorAssetSlug ?? track.operatorSlug)"
          />
          <span class="avatar-change-hint" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M21.5 2v6h-6" />
              <path d="M21.5 8A10 10 0 0 0 3 8" />
              <path d="M2.5 22v-6h6" />
              <path d="M2.5 16A10 10 0 0 0 21 16" />
            </svg>
          </span>
        </button>
        <button
          v-else
          type="button"
          class="avatar-shell avatar-trigger"
          :disabled="readOnly"
          :title="labels.operator"
          :aria-label="labels.operator"
          @click.stop="$emit('operator')"
        >
          <span class="empty-avatar" aria-hidden="true"></span>
        </button>
        <span
          class="operator-name-row"
          :class="{ 'has-support-notice': track.operatorSupport?.completeness === 'partial' }"
          @click.stop="selectName"
        >
          <span class="operator-name">{{ name }}</span>
          <span v-if="formName" class="operator-form-badge" :title="formName">{{ formName }}</span>
          <OperatorSupportNotice
            v-if="track.operatorSlug"
            :support="track.operatorSupport"
            compact
          />
        </span>
      </span>
      <EaButton
        variant="ghost"
        size="sm"
        v-if="track.operatorSlug"
        type="button"
        class="stat-detail-button"
        :disabled="!statDetailsAvailable"
        :title="
          statDetailsError
            ? $t('timeline.panel.unavailable', { reason: statDetailsError })
            : $t('statDetail.button')
        "
        @click.stop="$emit('stats')"
      >
        {{ $t('statDetail.button') }}
      </EaButton>
      <span v-if="track.operatorSlug" class="loadout-row">
        <button
          type="button"
          class="weapon-slot"
          :disabled="readOnly"
          :class="{ empty: weaponIcon === null }"
          :title="labels.weapon"
          :aria-label="labels.weapon"
          @click.stop="$emit('weapon')"
        >
          <img v-if="weaponIcon" :src="weaponIcon" alt="" />
          <span v-else class="weapon-placeholder" aria-hidden="true"></span>
        </button>
        <button
          v-for="slot in ['armor', 'gloves', 'accessory1', 'accessory2'] as const"
          :key="slot"
          type="button"
          class="gear-slot"
          :disabled="readOnly"
          :class="{ empty: gearIcons[slot] === null }"
          :title="labels[slot]"
          :aria-label="labels[slot]"
          @click.stop="$emit('gear', slot)"
        >
          <img v-if="gearIcons[slot]" :src="gearIcons[slot]!" alt="" />
          <span v-else class="gear-placeholder" aria-hidden="true"></span>
        </button>
      </span>
      <span class="gear-hint-row">
        <span class="set-bonus-hint" :class="{ 'is-hidden': activeGearSetLabel === '' }">
          {{ activeGearSetLabel }}
        </span>
      </span>
    </span>
  </div>
</template>

<style scoped>
.track-header {
  width: 180px;
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  align-items: center;
  box-sizing: border-box;
  padding: 0 0 0 4px;
  border: 1px solid transparent;
  border-bottom: 1px solid var(--ea-border-soft);
  border-right: 3px solid transparent;
  border-radius: 0;
  background: var(--ea-workbench-header);
  color: var(--ea-fg);
  text-align: left;
  cursor: pointer;
  transition: background 0.2s;
}

.track-header.is-selected {
  border-right-color: var(--ea-gold);
  background: var(--ea-track-row-active);
}

.track-header.is-reorder-source {
  opacity: 0.5;
}

.track-header.is-reorder-target {
  background-color: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.3);
}

.reorder-column {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: var(--ea-icon-muted);
  font-size: 11px;
}

.reorder-button,
.drag-handle {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

.reorder-button {
  cursor: pointer;
}

.reorder-button:hover:not(:disabled) {
  background: var(--ea-fill-soft);
  color: var(--ea-fg-secondary);
}

.reorder-button:disabled {
  opacity: 0.2;
}

.reorder-button svg,
.drag-handle svg {
  width: 12px;
  height: 12px;
  fill: currentColor;
}

.reorder-button svg {
  width: 10px;
  height: 10px;
  fill: none;
  stroke: currentColor;
  stroke-width: 3;
}

.identity-body {
  position: relative;
  min-width: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 6px;
  box-sizing: border-box;
}

.initial-gauge-control {
  --initial-gauge-accent: #7dd3fc;
  --initial-gauge-input-width: 54px;
  position: absolute;
  z-index: 3;
  top: calc(50% - 54px);
  left: 6px;
  width: calc(100% - 13px);
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  color: var(--initial-gauge-accent);
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
}

.initial-gauge-label,
.initial-gauge-max {
  flex: 0 0 auto;
  user-select: none;
}

.initial-gauge-label {
  color: var(--initial-gauge-accent);
  opacity: 0.92;
}

.initial-gauge-input-wrap {
  flex: 0 0 var(--initial-gauge-input-width);
  width: var(--initial-gauge-input-width);
  height: 20px;
}

.initial-gauge-input-wrap :deep(.custom-number-input) {
  height: 20px;
  background: rgb(0 0 0 / 20%);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--initial-gauge-accent) 38%, transparent) inset;
}

.initial-gauge-input-wrap :deep(.custom-number-input:focus-within) {
  background: color-mix(in srgb, var(--initial-gauge-accent) 12%, transparent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--initial-gauge-accent) 90%, transparent) inset;
}

.initial-gauge-input-wrap :deep(.value-display) {
  padding: 0 2px;
  color: var(--ea-fg, #e0f2fe);
  font-size: 10px;
  font-weight: 800;
  line-height: 20px;
}

.initial-gauge-input-wrap :deep(.controls-stack),
.initial-gauge-input-wrap :deep(.control-btn) {
  width: 14px;
}

.initial-gauge-input-wrap :deep(.control-btn) {
  color: var(--ea-fg-muted, rgb(125 211 252 / 62%));
  font-size: 9px;
}

.initial-gauge-input-wrap :deep(.control-btn:hover:not(:disabled)) {
  color: var(--ea-fg, #e0f2fe);
}

.initial-gauge-max {
  color: var(--ea-fg-muted, rgb(186 230 253 / 62%));
}

.operator-row {
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  color: inherit;
  text-align: left;
}

.avatar-shell {
  position: relative;
  flex: 0 0 auto;
  margin-right: 8px;
}

.avatar-trigger {
  appearance: none;
  width: 44px;
  min-width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
}

.avatar-trigger:disabled,
.weapon-slot:disabled,
.gear-slot:disabled {
  cursor: default;
}

.avatar,
.empty-avatar {
  display: block;
  width: 44px;
  height: 44px;
  border: 2px solid var(--ea-border-strong);
  border-radius: 50%;
}

.empty-avatar {
  position: relative;
  box-sizing: border-box;
  border-style: dashed;
  border-color: var(--ea-keycap-border);
  background: var(--ea-keycap-bg, var(--ea-fill-soft));
}

.empty-avatar::before,
.empty-avatar::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 16px;
  height: 2px;
  border-radius: 1px;
  background: var(--ea-icon-muted);
  transform: translate(-50%, -50%);
}

.empty-avatar::after {
  transform: translate(-50%, -50%) rotate(90deg);
}

.avatar-change-hint {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.62);
  color: #fff;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}

.avatar-change-hint svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.avatar-trigger:hover:not(:disabled) .avatar-change-hint {
  opacity: 1;
}

.avatar-trigger:hover:not(:disabled) .avatar {
  border-color: var(--ea-gold);
}

.avatar-trigger:hover:not(:disabled) .empty-avatar {
  border-color: var(--ea-gold);
  background: var(--ea-keycap-skill-bg, var(--ea-fill-soft));
}

.avatar-trigger:hover:not(:disabled) .empty-avatar::before,
.avatar-trigger:hover:not(:disabled) .empty-avatar::after {
  background: var(--ea-gold);
}

.avatar {
  border-color: #555;
}

.operator-name {
  display: block;
  min-width: 0;
  overflow: hidden;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  text-overflow: ellipsis;
  line-height: 18px;
  user-select: none;
}

.operator-name-row {
  position: relative;
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex: 1 1 auto;
  min-width: 0;
}

.operator-form-badge {
  flex: 0 0 auto;
  color: #00e5ff;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1;
  text-shadow: 0 0 8px rgba(0, 229, 255, 0.35);
  white-space: nowrap;
}

.operator-name-row.has-support-notice {
  padding-right: 20px;
}

.stat-detail-button {
  position: absolute;
  top: calc(50% - 29px);
  left: 62px;
  max-width: calc(100% - 64px);
  height: 18px;
  padding: 0 7px;
  border: 1px solid color-mix(in srgb, var(--ea-gold) 40%, transparent);
  border-radius: 0;
  background: color-mix(in srgb, var(--ea-gold) 12%, transparent);
  color: var(--ea-gold);
  font-size: 10px;
  font-weight: 700;
  line-height: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-detail-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.stat-detail-button:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--ea-gold) 72%, transparent);
  background: color-mix(in srgb, var(--ea-gold) 20%, transparent);
  color: var(--ea-gold-hover);
}

.loadout-row {
  position: absolute;
  left: 0;
  top: calc(50% + 33px);
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 22px;
}

.gear-hint-row {
  position: absolute;
  left: 0;
  top: calc(50% + 57px);
  width: calc(100% - 12px);
  height: 22px;
}

.set-bonus-hint {
  display: block;
  height: 22px;
  margin-left: 36px;
  overflow: hidden;
  color: #2dd4bf;
  font-size: 12px;
  font-weight: 800;
  line-height: 22px;
  letter-spacing: 0.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.6;
  user-select: none;
}

.set-bonus-hint.is-hidden {
  visibility: hidden;
}

.weapon-slot,
.gear-slot {
  appearance: none;
  display: grid;
  place-items: center;
  box-sizing: border-box;
  padding: 0;
  overflow: hidden;
  border: 2px solid var(--ea-keycap-border, var(--ea-border-strong));
  border-radius: 6px;
  background: var(--ea-keycap-bg, var(--ea-fill-soft));
  color: var(--ea-icon-muted);
  cursor: pointer;
}

.weapon-slot.empty,
.gear-slot.empty {
  border-style: dashed;
  border-color: var(--ea-keycap-skill-border);
}

.weapon-slot:hover:not(:disabled) {
  border-color: var(--ea-gold);
  background: var(--ea-keycap-skill-bg, var(--ea-fill-soft));
}

.gear-slot:hover:not(:disabled) {
  border-color: #2dd4bf;
  background: var(--ea-keycap-skill-bg, var(--ea-fill-soft));
}

.weapon-slot img,
.gear-slot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.weapon-placeholder,
.gear-placeholder {
  position: relative;
  width: 100%;
  height: 100%;
}

.weapon-placeholder::before,
.weapon-placeholder::after,
.gear-placeholder::before,
.gear-placeholder::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 1px;
  background: var(--ea-fg-muted, #888);
  transform: translate(-50%, -50%);
  transition: background 0.2s;
}

.weapon-placeholder::before {
  width: 16px;
  height: 2px;
}

.weapon-placeholder::after {
  width: 2px;
  height: 16px;
}

.gear-placeholder::before {
  width: 12px;
  height: 2px;
}

.gear-placeholder::after {
  width: 2px;
  height: 12px;
}

.weapon-slot:hover:not(:disabled) .weapon-placeholder::before,
.weapon-slot:hover:not(:disabled) .weapon-placeholder::after {
  background: var(--ea-gold);
}

.gear-slot:hover:not(:disabled) .gear-placeholder::before,
.gear-slot:hover:not(:disabled) .gear-placeholder::after {
  background: #2dd4bf;
}

.weapon-slot {
  width: 32px;
  height: 32px;
}

.gear-slot {
  width: 22px;
  height: 22px;
}

:global(html[data-theme='light'] .track-header .initial-gauge-control) {
  --initial-gauge-accent: #0b6e99;
}

:global(html[data-theme='light'] .track-header .initial-gauge-input-wrap .custom-number-input) {
  background: var(--ea-surface-row);
  box-shadow: 0 0 0 1px rgb(11 110 153 / 35%) inset;
}

:global(
  html[data-theme='light'] .track-header .initial-gauge-input-wrap .custom-number-input:focus-within
) {
  background: #fff;
  box-shadow: 0 0 0 1px rgb(11 110 153 / 75%) inset;
}

:global(html[data-theme='light'] .track-header .stat-detail-button) {
  border-color: color-mix(in srgb, var(--ea-gold) 45%, transparent);
  background: #fff;
  color: var(--ea-gold);
  box-shadow: 0 1px 2px rgb(26 27 30 / 8%);
}

:global(html[data-theme='light'] .track-header .stat-detail-button:hover:not(:disabled)) {
  background: color-mix(in srgb, var(--ea-gold) 14%, #fff);
  border-color: var(--ea-gold);
  color: var(--ea-gold-hover);
}
</style>
