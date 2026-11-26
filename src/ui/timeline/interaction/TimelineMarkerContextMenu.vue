<script setup lang="ts">
import TimelineMenuActionIcon from './TimelineMenuActionIcon.vue';
import TimelineMarkerMenuIcon from './TimelineMarkerMenuIcon.vue';
import TimelineContextMenuPortal from './TimelineContextMenuPortal.vue';
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton } from '../../../design-system/index';
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
    switchToDodge: string;
    switchToPerfectDodge: string;
  };
}>();
const emit = defineEmits<{
  close: [];
  addCycle: [];
  toggleSimulationStart: [];
  toggleSimulationEnd: [];
  setDodgeMode: [mode: 'dodge' | 'perfectDodge'];
  copyMarker: [];
  cut: [];
  paste: [];
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
  <TimelineContextMenuPortal>
    <div
      v-if="visible"
      ref="menu"
      class="marker-context-menu timeline-context-menu"
      role="menu"
      :aria-label="labels.title"
      :style="{ left: `${left}px`, top: `${top}px` }"
      @pointerdown.stop
      @contextmenu.prevent
    >
      <header v-if="existingLabel && !inheritanceBoundary" class="menu-header">
        {{ existingLabel }}
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
          <EaButton
            type="button"
            role="menuitem"
            class="menu-item delete-item"
            @click="$emit('delete')"
          >
            <TimelineMenuActionIcon action="delete" />
            <span>{{ labels.deleteMarker }}</span>
            <kbd>Delete</kbd>
          </EaButton>
        </template>
        <template v-else>
          <slot name="track-placement" />
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
              :title="t('timeline.markerLabels.ready')"
              @click="$emit('controlComboCooldown', 'ready')"
            >
              <TimelineMarkerMenuIcon kind="comboReady" />
              <span>{{ t('timeline.markerContext.readyMenu') }}</span>
            </EaButton>
            <EaButton
              type="button"
              class="menu-item"
              role="menuitem"
              :title="t('timeline.markerLabels.cooldown')"
              @click="$emit('controlComboCooldown', 'cooldown')"
            >
              <TimelineMarkerMenuIcon kind="comboCooldown" />
              <span>{{ t('timeline.markerContext.cooldownMenu') }}</span>
            </EaButton>
          </div>
        </template>
      </fieldset>
    </div>
  </TimelineContextMenuPortal>
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
  min-width: 212px;
}
.menu-group + .menu-group {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid var(--ea-border-soft);
}
</style>
