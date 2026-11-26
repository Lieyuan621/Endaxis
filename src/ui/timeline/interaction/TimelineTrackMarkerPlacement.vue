<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { EaButton, EaChevronIcon } from '../../../design-system';
import OperatorAvatar from '../../components/OperatorAvatar.vue';
import TimelineMarkerMenuIcon from './TimelineMarkerMenuIcon.vue';
import TimelineReceiveHitIcon from './TimelineReceiveHitIcon.vue';
import TimelinePickupIcon from './TimelinePickupIcon.vue';
import type { TrackIndex } from '../../../core/project/schema';

defineProps<{
  canTargetTrack: boolean;
  canReceiveHit: boolean;
  pickups: readonly { label: string; icon?: string; group: string }[];
  switchTargets: readonly { trackIndex: TrackIndex; name: string; avatar?: string }[];
}>();
defineEmits<{
  receiveHit: [];
  pickup: [group: string];
  addSwitch: [trackIndex: TrackIndex];
  addDodge: [mode: 'dodge' | 'perfectDodge'];
  useConsumable: [];
}>();
const { t } = useI18n({ useScope: 'global' });
</script>
<template>
  <div class="menu-group" role="group" :aria-label="t('contextMenu.trackActions')">
    <small class="menu-label">{{ t('contextMenu.trackActions') }}</small>
    <div class="menu-item has-submenu" role="menuitem" aria-haspopup="menu" tabindex="0">
      <TimelineMarkerMenuIcon kind="switchOperator" />
      <span>{{ t('timeline.markerContext.switchOperator') }}</span>
      <EaChevronIcon class="arrow" :size="12" :stroke-width="3" />
      <div class="submenu-list timeline-context-submenu" role="menu">
        <EaButton
          v-for="target in switchTargets"
          :key="target.trackIndex"
          type="button"
          class="submenu-list-item"
          role="menuitem"
          @click="$emit('addSwitch', target.trackIndex)"
        >
          <OperatorAvatar v-if="target.avatar" class="submenu-avatar" :src="target.avatar" alt="" />
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
      <span>{{ t('consumable.useFromContext') }}</span>
    </EaButton>
    <EaButton
      v-if="canReceiveHit"
      type="button"
      class="menu-item"
      variant="ghost"
      size="sm"
      role="menuitem"
      @click="$emit('receiveHit')"
    >
      <TimelineReceiveHitIcon />
      <span>{{ t('timeline.markerContext.operatorHit') }}</span>
    </EaButton>
    <EaButton
      v-for="drop in pickups"
      :key="drop.group"
      type="button"
      class="menu-item"
      variant="ghost"
      size="sm"
      role="menuitem"
      @click="$emit('pickup', drop.group)"
    >
      <TimelinePickupIcon :icon="drop.icon" />
      <span>{{ drop.label }}</span>
    </EaButton>
    <EaButton
      type="button"
      class="menu-item"
      role="menuitem"
      :disabled="!canTargetTrack"
      @click="$emit('addDodge', 'dodge')"
    >
      <TimelineMarkerMenuIcon kind="dodge" />
      <span>{{ t('timeline.markerContext.dodge') }}</span>
    </EaButton>
    <EaButton
      type="button"
      class="menu-item"
      role="menuitem"
      :disabled="!canTargetTrack"
      @click="$emit('addDodge', 'perfectDodge')"
    >
      <TimelineMarkerMenuIcon kind="perfectDodge" />
      <span>{{ t('timeline.markerContext.perfectDodge') }}</span>
    </EaButton>
  </div>
</template>
<style scoped>
.submenu-list {
  position: absolute;
  z-index: 100;
  top: -5px;
  left: calc(100% - 1px);
  min-width: 140px;
  padding: 4px 0;
  display: flex;
  flex-direction: column;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateX(-4px);
  transition:
    opacity 120ms ease,
    transform 120ms ease,
    visibility 0s linear 120ms;
}
.menu-item.has-submenu:hover .submenu-list,
.menu-item.has-submenu:focus-within .submenu-list {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateX(0);
  transition-delay: 0s;
}
.submenu-list-item {
  width: 100%;
  height: 33px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  color: var(--ea-fg-secondary);
  font: inherit;
  cursor: pointer;
  white-space: nowrap;
}
.submenu-list-item:hover {
  background: var(--ea-menu-hover-bg);
  color: var(--ea-fg);
}
.submenu-avatar {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border: 1px solid var(--ea-border-strong);
  border-radius: 50%;
}
</style>
