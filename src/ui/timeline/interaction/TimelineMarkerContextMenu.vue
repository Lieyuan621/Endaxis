<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton } from '../../../design-system/index';
import { useInteractionSession } from '../../interaction/interactionSessionContext';
import { usePopoverInteractionBoundary } from '../../interaction/usePopoverInteractionBoundary';
const { t } = useI18n({ useScope: 'global' });

const props = defineProps<{
  readOnly?: boolean;
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
      <header v-if="!inheritanceBoundary">{{ existingLabel ?? t('contextMenu.globalOps') }}</header>
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
        v-if="cycleBoundary && !inheritanceBoundary"
        type="button"
        role="menuitem"
        class="menu-item"
        :disabled="canInherit === false"
        @click="$emit('inherit')"
      >
        <span class="menu-icon" aria-hidden="true">⟲</span>
        <span>{{ t('inheritance.createHere') }}</span>
      </EaButton>
      <div v-if="cycleBoundary && !inheritanceBoundary" class="divider"></div>
      <fieldset v-if="!inheritanceBoundary" :disabled="readOnly" class="menu-actions">
        <template v-if="existingLabel">
          <EaButton
            v-if="existingDodgeMode"
            type="button"
            role="menuitem"
            class="menu-item"
            @click="$emit('copyMarker')"
          >
            <span class="menu-icon" aria-hidden="true">⧉</span>
            <span>{{ labels.copyMarker }}</span>
            <kbd>Ctrl+C</kbd>
          </EaButton>
          <EaButton
            v-if="existingDodgeMode"
            type="button"
            role="menuitem"
            class="menu-item"
            @click="$emit('setDodgeMode', existingDodgeMode === 'dodge' ? 'perfectDodge' : 'dodge')"
          >
            <span class="menu-icon" aria-hidden="true">{{
              existingDodgeMode === 'dodge' ? '✦' : '↝'
            }}</span>
            <span>{{
              existingDodgeMode === 'dodge' ? labels.switchToPerfectDodge : labels.switchToDodge
            }}</span>
          </EaButton>
          <EaButton type="button" role="menuitem" class="menu-item danger" @click="$emit('delete')">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
              />
            </svg>
            <span>{{ labels.deleteMarker }}</span>
            <kbd>Delete</kbd>
          </EaButton>
        </template>
        <template v-else>
          <small class="menu-label">{{ t('comboControl.title') }}</small>
          <EaButton
            type="button"
            class="menu-item combo-control-entry"
            role="menuitem"
            @click="$emit('controlComboCooldown', 'ready')"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 11a8 8 0 1 1-2.3-5.7" />
              <path d="M20 4v7h-7" />
            </svg>
            <span>{{ t('comboControl.ready') }}</span>
          </EaButton>
          <EaButton
            type="button"
            class="menu-item combo-control-entry"
            role="menuitem"
            @click="$emit('controlComboCooldown', 'cooldown')"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            <span>{{ t('comboControl.cooldown') }}</span>
          </EaButton>
          <div class="divider"></div>
          <EaButton type="button" class="menu-item" role="menuitem" @click="$emit('addCycle')">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <line x1="12" y1="2" x2="12" y2="22" />
              <path d="M16 14c2 0 3-1 3-3s-1-3-3-3h-4" />
              <polyline points="14 10 12 8 14 6" />
            </svg>
            <span>{{ labels.addCycle }}</span>
          </EaButton>
          <EaButton
            type="button"
            class="menu-item"
            role="menuitem"
            @click="$emit('toggleSimulationStart')"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <line x1="12" y1="2" x2="12" y2="22" />
              <line x1="8" y1="6" x2="16" y2="6" />
              <line x1="8" y1="18" x2="16" y2="18" />
            </svg>
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
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <line x1="12" y1="2" x2="12" y2="22" />
              <line x1="8" y1="6" x2="16" y2="6" />
              <line x1="8" y1="18" x2="16" y2="18" />
            </svg>
            <span>{{
              hasSimulationEnd ? labels.removeSimulationEnd : labels.addSimulationEnd
            }}</span>
          </EaButton>
          <div class="menu-item has-submenu" role="menuitem" aria-haspopup="menu">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M16 3h5v5M8 21H3v-5M21 3l-7 7M3 21l7-7" />
            </svg>
            <span>{{ labels.switchOperator }}</span>
            <span class="arrow">▶</span>
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
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 3h6v4l3 5v7H6v-7l3-5V3Z" />
              <path d="M8 12h8" />
            </svg>
            <span>{{ labels.useConsumable }}</span>
          </EaButton>
          <EaButton
            type="button"
            class="menu-item"
            role="menuitem"
            :disabled="!canTargetTrack"
            @click="$emit('addDodge', 'dodge')"
          >
            <span class="menu-icon" aria-hidden="true">↝</span><span>{{ labels.dodge }}</span>
          </EaButton>
          <EaButton
            type="button"
            class="menu-item"
            role="menuitem"
            :disabled="!canTargetTrack"
            @click="$emit('addDodge', 'perfectDodge')"
          >
            <span class="menu-icon" aria-hidden="true">✦</span
            ><span>{{ labels.perfectDodge }}</span>
          </EaButton>
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
  min-width: 180px;
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
  color: #777;
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
  padding: 4px 12px;
  color: #777;
  font-size: 11px;
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
.menu-item > svg,
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
.menu-item svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
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
.menu-icon {
  width: 16px;
  text-align: center;
}
.menu-item.has-submenu {
  justify-content: space-between;
  gap: var(--ea-control-gap);
}
.menu-item .arrow {
  margin-left: 10px;
  color: #666;
  font-size: 10px;
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
