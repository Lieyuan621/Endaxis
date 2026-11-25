<script setup lang="ts">
/** 技能块连线的右键菜单。端口和删除命令交给编辑器提交。 */
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaChevronIcon, EaDeleteIcon } from '../../../design-system/index';
import { useKeyboardShortcutScope } from '../../keyboard/keyboardShortcutRouter';
import { connectionPortI18nKey, type TimelineConnectionPort } from './timelineConnections';
import TimelineContextMenuPortal from './TimelineContextMenuPortal.vue';

const props = defineProps<{
  visible: boolean;
  x: number;
  y: number;
  fromPort: TimelineConnectionPort;
  toPort: TimelineConnectionPort;
}>();
const emit = defineEmits<{
  close: [];
  delete: [];
  changePort: [side: 'from' | 'to', port: TimelineConnectionPort];
}>();

const { t } = useI18n({ useScope: 'global' });
const menu = ref<HTMLElement | null>(null);
const left = ref(0);
const top = ref(0);
const portOptions = [
  { port: 'top-left', angle: -45 },
  { port: 'top', angle: 0 },
  { port: 'top-right', angle: 45 },
  { port: 'left', angle: -90 },
  null,
  { port: 'right', angle: 90 },
  { port: 'bottom-left', angle: -135 },
  { port: 'bottom', angle: 180 },
  { port: 'bottom-right', angle: 135 },
] as const;

async function positionMenu(): Promise<void> {
  if (!props.visible) return;
  await nextTick();
  const rect = menu.value?.getBoundingClientRect();
  if (rect === undefined) return;
  left.value = Math.max(6, Math.min(props.x, window.innerWidth - rect.width - 6));
  top.value = Math.max(6, Math.min(props.y, window.innerHeight - rect.height - 6));
}

function closeFromOutside(event: PointerEvent): void {
  if (props.visible && !menu.value?.contains(event.target as Node)) emit('close');
}

useKeyboardShortcutScope({
  id: 'timeline-connection-context-menu',
  priority: 300,
  active: () => props.visible,
  blockLowerScopes: true,
  handle: event => {
    if (event.key === 'Escape') {
      emit('close');
      return true;
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      emit('delete');
      return true;
    }
    return false;
  },
});

watch(() => [props.visible, props.x, props.y], positionMenu, { immediate: true });
onMounted(() => window.addEventListener('pointerdown', closeFromOutside));
onBeforeUnmount(() => window.removeEventListener('pointerdown', closeFromOutside));
</script>

<template>
  <TimelineContextMenuPortal>
    <div
      v-if="visible"
      ref="menu"
      class="timeline-context-menu"
      :style="{ left: `${left}px`, top: `${top}px` }"
      @contextmenu.prevent
    >
      <div class="menu-header">{{ t('contextMenu.connectionSettings') }}</div>
      <div v-for="side in ['from', 'to'] as const" :key="side" class="menu-submenu">
        <EaButton class="menu-item has-submenu" type="button" aria-haspopup="true">
          <span class="icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <template v-if="side === 'from'">
                <rect x="2.5" y="7.5" width="9" height="9" />
                <path d="M11.5 12H21m-3.5-3.5L21 12l-3.5 3.5" />
              </template>
              <template v-else>
                <rect x="12.5" y="7.5" width="9" height="9" />
                <path d="M3 12h9.5M9 8.5l3.5 3.5L9 15.5" />
              </template>
            </svg>
          </span>
          <span class="label">{{
            t(side === 'from' ? 'contextMenu.setSourcePort' : 'contextMenu.setTargetPort')
          }}</span>
          <EaChevronIcon class="arrow" :size="12" :stroke-width="3" />
        </EaButton>
        <div class="submenu-grid timeline-context-submenu">
          <template v-for="(option, index) in portOptions" :key="index">
            <span v-if="option === null" class="grid-spacer" />
            <EaButton
              v-else
              class="grid-item"
              icon-only
              type="button"
              :pressed="(side === 'from' ? fromPort : toPort) === option.port"
              :title="t(connectionPortI18nKey(option.port))"
              @click="emit('changePort', side, option.port)"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                :style="{ transform: `rotate(${option.angle}deg)` }"
                aria-hidden="true"
              >
                <path d="M12 21 L12 3 M12 3 L5 10 M12 3 L19 10" />
              </svg>
            </EaButton>
          </template>
        </div>
      </div>
      <div class="divider" />
      <EaButton class="menu-item delete-item" type="button" @click="emit('delete')">
        <span class="icon"><EaDeleteIcon /></span><span class="label">{{ t('common.delete') }}</span
        ><span class="shortcut-hint">Delete</span>
      </EaButton>
    </div>
  </TimelineContextMenuPortal>
</template>

<style scoped>
.menu-submenu {
  position: relative;
}
.submenu-grid {
  display: grid;
  position: absolute;
  left: calc(100% - 1px);
  top: -5px;
  z-index: 100;
  grid-template-columns: repeat(3, 30px);
  grid-template-rows: repeat(3, 30px);
  gap: 2px;
  padding: 4px;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateX(-4px);
  transition:
    opacity 120ms ease,
    transform 120ms ease,
    visibility 0s linear 120ms;
}
.menu-submenu:hover .submenu-grid,
.menu-submenu:focus-within .submenu-grid {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateX(0);
  transition-delay: 0s;
}
.grid-item {
  width: 30px;
  height: 30px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  color: #888;
}
.grid-item[aria-pressed='true'] {
  background: var(--ea-gold);
  color: #000;
}
.grid-spacer {
  width: 30px;
  height: 30px;
}
@media (hover: hover) and (pointer: fine) {
  .grid-item:hover {
    background: var(--ea-hover-fill);
    color: var(--ea-fg);
  }
}
</style>
