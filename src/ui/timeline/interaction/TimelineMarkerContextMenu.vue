<script setup lang="ts">
import TimelineMenuActionIcon from './TimelineMenuActionIcon.vue';
import TimelineMarkerMenuIcon from './TimelineMarkerMenuIcon.vue';
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaChevronIcon } from '../../../design-system/index';
import { useInteractionSession } from '../../interaction/interactionSessionContext';
import { usePopoverInteractionBoundary } from '../../interaction/usePopoverInteractionBoundary';
const { t } = useI18n({ useScope: 'global' });
const isDev = import.meta.env.DEV;

const props = defineProps<{
  readOnly?: boolean;
  canCopy?: boolean;
  canPaste?: boolean;
  inheritanceBoundary?: boolean;
  cycleBoundary?: boolean;
  sourceAvailable?: boolean;
  canInherit?: boolean;
  visible: boolean;
  x: number;
  y: number;
  frame: number;
  canTargetTrack: boolean;
  switchTargets: readonly { trackIndex: number; name: string; avatar?: string }[];
  hasSimulationStart: boolean;
  hasSimulationEnd: boolean;
  existingLabel?: string;
  existingDodgeMode?: 'dodge' | 'perfectDodge';
  labels: {
    title: string;
    deleteMarker: string;
    copyMarker: string;
    addCycle: string;
    addSimulationStart: string;
    removeSimulationStart: string;
    addSimulationEnd: string;
    removeSimulationEnd: string;
    switchOperator: string;
    dodge: string;
    perfectDodge: string;
    switchToDodge: string;
    switchToPerfectDodge: string;
    useConsumable: string;
  };
}>();
const emit = defineEmits<{
  close: [];
  addCycle: [];
  toggleSimulationStart: [];
  toggleSimulationEnd: [];
  addSwitch: [trackIndex: number];
  addDodge: [mode: 'dodge' | 'perfectDodge'];
  setDodgeMode: [mode: 'dodge' | 'perfectDodge'];
  copyMarker: [];
  cut: [];
  paste: [];
  useConsumable: [];
  controlComboCooldown: [mode: 'cooldown' | 'ready'];
  delete: [];
  inherit: [];
  openSource: [];
}>();
const menu = ref<HTMLElement | null>(null);
usePopoverInteractionBoundary(
  useInteractionSession(),
  () => props.visible,
  () => emit('close'),
);
const left = ref(0);
const top = ref(0);

async function position(): Promise<void> {
  if (!props.visible) return;
  await nextTick();
  const rect = menu.value?.getBoundingClientRect();
  if (rect === undefined) return;
  left.value = Math.max(6, Math.min(props.x, window.innerWidth - rect.width - 6));
  top.value = Math.max(6, Math.min(props.y, window.innerHeight - rect.height - 6));
}
function outside(event: PointerEvent): void {
  if (props.visible && !menu.value?.contains(event.target as Node)) emit('close');
}
watch(() => [props.visible, props.x, props.y], position, { immediate: true });
onMounted(() => {
  window.addEventListener('pointerdown', outside, true);
});
onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', outside, true);
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="menu"
      class="marker-context-menu"
      role="menu"
      :aria-label="labels.title"
      :style="{ left: `${left}px`, top: `${top}px` }"
      @pointerdown.stop
      @contextmenu.prevent
    >
      <header v-if="!inheritanceBoundary">
        {{ existingLabel ?? t('contextMenu.timelineOps') }}
      </header>
      <template v-if="inheritanceBoundary">
        <EaButton
          type="button"
          role="menuitem"
          class="menu-item"
          :disabled="!sourceAvailable"
          @click="$emit('openSource')"
        >
          <span>{{ t(sourceAvailable ? 'inheritance.source' : 'inheritance.sourceMissing') }}</span>
        </EaButton>
      </template>
      <EaButton
        v-if="isDev && cycleBoundary && !inheritanceBoundary"
        type="button"
        role="menuitem"
        class="menu-item"
        :disabled="canInherit === false"
        @click="$emit('inherit')"
      >
        <TimelineMarkerMenuIcon kind="inherit" />
        <span>{{ t('inheritance.createHere') }}</span>
      </EaButton>
      <div v-if="isDev && cycleBoundary && !inheritanceBoundary" class="divider"></div>
      <EaButton
        v-if="existingLabel && canCopy && !inheritanceBoundary"
        type="button"
        role="menuitem"
        class="menu-item"
        @click="$emit('copyMarker')"
      >
        <TimelineMenuActionIcon action="copy" />
        <span>{{ labels.copyMarker }}</span>
        <kbd>Ctrl+C</kbd>
      </EaButton>
      <fieldset v-if="!inheritanceBoundary" :disabled="readOnly" class="menu-actions">
        <EaButton
          v-if="existingLabel && canCopy"
          class="menu-item"
          role="menuitem"
          @click="$emit('cut')"
        >
          <TimelineMenuActionIcon action="cut" />
          <span>{{ t('common.cut') }}</span>
          <kbd>Ctrl+X</kbd>
        </EaButton>
        <EaButton
          v-if="!existingLabel && canPaste"
          class="menu-item"
          role="menuitem"
          @click="$emit('paste')"
        >
          <TimelineMenuActionIcon action="paste" />
          <span>{{ t('common.paste') }}</span>
          <kbd>Ctrl+V</kbd>
        </EaButton>
        <div v-if="!existingLabel && canPaste" class="divider"></div>
        <template v-if="existingLabel">
          <EaButton
            v-if="existingDodgeMode"
            type="button"
            role="menuitem"
            class="menu-item"
            @click="$emit('setDodgeMode', existingDodgeMode === 'dodge' ? 'perfectDodge' : 'dodge')"
          >
            <TimelineMarkerMenuIcon
              :kind="existingDodgeMode === 'dodge' ? 'perfectDodge' : 'dodge'"
            />
            <span>{{
              existingDodgeMode === 'dodge' ? labels.switchToPerfectDodge : labels.switchToDodge
            }}</span>
          </EaButton>
          <EaButton type="button" role="menuitem" class="menu-item danger" @click="$emit('delete')">
            <TimelineMenuActionIcon action="delete" />
            <span>{{ labels.deleteMarker }}</span>
            <kbd>Delete</kbd>
          </EaButton>
        </template>
        <template v-else>
          <div class="menu-group" role="group" :aria-label="t('contextMenu.trackActions')">
            <small class="menu-label">{{ t('contextMenu.trackActions') }}</small>
            <div class="menu-item has-submenu" role="menuitem" aria-haspopup="menu">
              <TimelineMarkerMenuIcon kind="switchOperator" />
              <span>{{ labels.switchOperator }}</span>
              <EaChevronIcon class="arrow" :size="12" :stroke-width="3" />
              <div class="submenu-list" role="menu">
                <EaButton
                  v-for="target in switchTargets"
                  :key="target.trackIndex"
                  type="button"
                  class="submenu-list-item"
                  role="menuitem"
                  @click="$emit('addSwitch', target.trackIndex)"
                >
                  <img v-if="target.avatar" :src="target.avatar" alt="" />
                  <span>{{ target.name }}</span>
                </EaButton>
              </div>
            </div>
            <EaButton
              type="button"
              class="menu-item"
              role="menuitem"
              :disabled="!canTargetTrack"
              @click="$emit('useConsumable')"
            >
              <TimelineMarkerMenuIcon kind="consumable" />
              <span>{{ labels.useConsumable }}</span>
            </EaButton>
            <EaButton
              type="button"
              class="menu-item"
              role="menuitem"
              :disabled="!canTargetTrack"
              @click="$emit('addDodge', 'dodge')"
            >
              <TimelineMarkerMenuIcon kind="dodge" />
              <span>{{ labels.dodge }}</span>
            </EaButton>
            <EaButton
              type="button"
              class="menu-item"
              role="menuitem"
              :disabled="!canTargetTrack"
              @click="$emit('addDodge', 'perfectDodge')"
            >
              <TimelineMarkerMenuIcon kind="perfectDodge" />
              <span>{{ labels.perfectDodge }}</span>
            </EaButton>
          </div>
          <div class="menu-group" role="group" :aria-label="t('contextMenu.timelineMarkers')">
            <small class="menu-label">{{ t('contextMenu.timelineMarkers') }}</small>
            <EaButton type="button" class="menu-item" role="menuitem" @click="$emit('addCycle')">
              <TimelineMarkerMenuIcon kind="cycleBoundary" />
              <span>{{ labels.addCycle }}</span>
            </EaButton>
            <EaButton
              type="button"
              class="menu-item"
              role="menuitem"
              @click="$emit('toggleSimulationStart')"
            >
              <TimelineMarkerMenuIcon kind="simulationStart" />
              <span>{{
                hasSimulationStart ? labels.removeSimulationStart : labels.addSimulationStart
              }}</span>
            </EaButton>
            <EaButton
              type="button"
              class="menu-item"
              role="menuitem"
              @click="$emit('toggleSimulationEnd')"
            >
              <TimelineMarkerMenuIcon kind="simulationEnd" />
              <span>{{
                hasSimulationEnd ? labels.removeSimulationEnd : labels.addSimulationEnd
              }}</span>
            </EaButton>
          </div>
          <div class="menu-group" role="group" :aria-label="t('contextMenu.teamCombo')">
            <small class="menu-label">{{ t('contextMenu.teamCombo') }}</small>
            <EaButton
              type="button"
              class="menu-item"
              role="menuitem"
              :title="t('comboControl.ready')"
              @click="$emit('controlComboCooldown', 'ready')"
            >
              <TimelineMarkerMenuIcon kind="comboReady" />
              <span>{{ t('comboControl.readyMenu') }}</span>
            </EaButton>
            <EaButton
              type="button"
              class="menu-item"
              role="menuitem"
              :title="t('comboControl.cooldown')"
              @click="$emit('controlComboCooldown', 'cooldown')"
            >
              <TimelineMarkerMenuIcon kind="comboCooldown" />
              <span>{{ t('comboControl.cooldownMenu') }}</span>
            </EaButton>
          </div>
        </template>
      </fieldset>
    </div>
  </Teleport>
</template>

<style scoped>
.menu-actions {
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}
.menu-actions:disabled .menu-item {
  opacity: 0.45;
  cursor: not-allowed;
}
.marker-context-menu {
  position: fixed;
  z-index: 10000;
  min-width: 212px;
  padding: 6px 0;
  border: 1px solid #444;
  border-radius: 6px;
  background: #2b2b2b;
  box-shadow: 0 6px 16px rgb(0 0 0 / 60%);
  color: #e0e0e0;
  font-family: 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  user-select: none;
  animation: marker-menu-fade-in 0.1s ease-out;
}
.marker-context-menu header {
  max-width: 200px;
  margin-bottom: 4px;
  padding: 6px 12px;
  overflow: hidden;
  border-bottom: 1px solid #3a3a3a;
  color: #aaa;
  font-size: 12px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.divider {
  height: 1px;
  margin: 4px 0;
  background: #3a3a3a;
}
.menu-label {
  display: block;
  max-width: 280px;
  padding: 5px 12px 3px;
  color: #aaa;
  font-size: 11px;
}
.menu-group + .menu-group {
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid #3a3a3a;
}
.menu-item {
  position: relative;
  width: 100%;
  height: 32px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border: 0;
  background: transparent;
  color: #ccc;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.menu-item > .menu-icon {
  width: 20px;
  margin-right: 8px;
  flex: 0 0 20px;
}
.menu-item > span:not(.menu-icon):not(.arrow) {
  flex-grow: 1;
  white-space: nowrap;
}
.menu-item:hover:not(:disabled) {
  background: #007fd4;
  color: #fff;
}
.menu-item.danger:hover:not(:disabled) {
  background: #ff7875;
}
.menu-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.menu-item kbd {
  margin-left: 10px;
  color: #888;
  font:
    11px/1 Consolas,
    monospace;
}
.menu-item:hover kbd {
  color: rgb(255 255 255 / 75%);
}
.menu-item.has-submenu {
  justify-content: space-between;
  gap: var(--ea-control-gap);
}
.menu-item .arrow {
  margin-left: 10px;
  color: #666;
}
.submenu-list {
  position: absolute;
  z-index: 100;
  top: -4px;
  left: 100%;
  min-width: 140px;
  padding: 4px 0;
  display: none;
  flex-direction: column;
  border: 1px solid #444;
  border-radius: 6px;
  background: #2b2b2b;
  box-shadow: 4px 4px 12px rgb(0 0 0 / 50%);
}
.menu-item.has-submenu:hover .submenu-list {
  display: flex;
}
.submenu-list-item {
  width: 100%;
  height: 32px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  color: #ccc;
  font: inherit;
  cursor: pointer;
  white-space: nowrap;
}
.submenu-list-item:hover {
  background: #007fd4;
  color: #fff;
}
.submenu-list-item img {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border: 1px solid #666;
  border-radius: 50%;
  object-fit: cover;
}
@keyframes marker-menu-fade-in {
  from {
    opacity: 0;
    transform: translateY(-2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
