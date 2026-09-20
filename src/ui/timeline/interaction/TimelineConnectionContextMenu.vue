<script setup lang="ts">
/** 技能块连线的右键菜单。端口和删除命令交给编辑器提交。 */
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaDeleteIcon } from '../../../design-system/index';
import { useKeyboardShortcutScope } from '../../keyboard/keyboardShortcutRouter';
import { connectionPortI18nKey, type TimelineConnectionPort } from './timelineConnections';

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
  <Teleport to="body">
    <div
      v-if="visible"
      ref="menu"
      class="connection-context-menu ea-floating-surface"
      :style="{ left: `${left}px`, top: `${top}px` }"
      @contextmenu.prevent
    >
      <div class="menu-header">{{ t('contextMenu.connectionSettings') }}</div>
      <div v-for="side in ['from', 'to'] as const" :key="side" class="menu-submenu">
        <EaButton class="menu-item has-submenu" type="button" aria-haspopup="true">
          <span class="icon" aria-hidden="true">
            <svg
              v-if="side === 'from'"
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 9V5 M12 15V19 M9 12H5 M15 12H19" />
            </svg>
            <svg
              v-else
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="5" y="5" width="14" height="14" rx="2" />
              <path d="M12 12h.01" />
            </svg>
          </span>
          <span class="label">{{
            t(side === 'from' ? 'contextMenu.setSourcePort' : 'contextMenu.setTargetPort')
          }}</span>
          <span class="arrow">▶</span>
        </EaButton>
        <div class="submenu-grid ea-floating-surface">
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
  </Teleport>
</template>

<style scoped>
.connection-context-menu {
  position: fixed;
  z-index: var(--ea-z-context-menu);
  min-width: 180px;
  padding: 6px 0;
  font-size: 13px;
  user-select: none;
  animation: fade-in 0.1s ease-out;
}
.menu-header {
  padding: 6px 12px;
  font-size: 12px;
  color: var(--ea-fg-muted);
  font-weight: 600;
  border-bottom: 1px solid var(--ea-border-soft);
  margin-bottom: 4px;
  white-space: nowrap;
}
.menu-submenu {
  position: relative;
}
.menu-item {
  position: relative;
  display: flex;
  width: 100%;
  height: 32px;
  align-items: center;
  justify-content: flex-start;
  padding: 0 12px;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  color: var(--ea-floating-fg);
  cursor: pointer;
  font: inherit;
  text-align: left;
  transition: background 0.1s;
}
.menu-item .icon {
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  flex-shrink: 0;
}
.menu-item .label {
  flex-grow: 1;
  white-space: nowrap;
  text-align: left;
}
.menu-item .arrow {
  font-size: 10px;
  color: var(--ea-fg-faint);
  margin-left: 10px;
}
.shortcut-hint {
  font-size: 11px;
  color: var(--ea-fg-faint);
  margin-left: 10px;
  font-family: Consolas, monospace;
}
.submenu-grid {
  display: none;
  position: absolute;
  left: 100%;
  top: -4px;
  z-index: 100;
  grid-template-columns: repeat(3, 30px);
  grid-template-rows: repeat(3, 30px);
  gap: 2px;
  padding: 4px;
}
.menu-submenu:hover .submenu-grid,
.menu-submenu:focus-within .submenu-grid {
  display: grid;
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
.divider {
  height: 1px;
  margin: 5px 0;
  background: var(--ea-border-soft);
}
@media (hover: hover) and (pointer: fine) {
  .menu-item:hover {
    background: var(--ea-menu-hover-bg);
    color: var(--ea-menu-hover-fg);
  }
  .delete-item:hover {
    background: color-mix(in srgb, var(--ea-danger) 14%, transparent);
    color: var(--ea-danger);
  }
  .grid-item:hover {
    background: var(--ea-hover-fill);
    color: var(--ea-fg);
  }
}
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
