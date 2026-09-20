<script setup lang="ts">
import { ElIcon } from 'element-plus';
/**
 * 时间轴动作的基础右键菜单，只负责定位、展示和派发命令意图。
 * 存档修改由编辑器应用层完成；Teleport 用于避免轨道裁剪和指针事件穿透。
 */
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { CopyDocument } from '@element-plus/icons-vue';
import { EaButton } from '../../../design-system/index';
import { useKeyboardShortcutScope } from '../../keyboard/keyboardShortcutRouter';

const props = defineProps<{
  visible: boolean;
  x: number;
  y: number;
  label: string;
  locked: boolean;
  disabled: boolean;
  inputReadOnly?: boolean;
  color: string | null;
  compactVisible?: boolean;
  compactDisabledReason?: string;
  createGroupVisible?: boolean;
  createGroupDisabledReason?: string;
  dissolveGroupVisible?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  copy: [];
  compact: [];
  createGroup: [];
  dissolveGroup: [];
  delete: [];
  toggleLock: [];
  toggleDisabled: [];
  setColor: [color: string | null];
}>();

const { t } = useI18n({ useScope: 'global' });
const menu = ref<HTMLElement | null>(null);
const left = ref(0);
const top = ref(0);
const colors = [
  { value: null, labelKey: 'common.default', swatch: '#555' },
  { value: '#e0e0e0', labelKey: 'timelineGrid.elementFilter.physical', swatch: '#e0e0e0' },
  { value: '#ff4d4f', labelKey: 'timelineGrid.elementFilter.blaze', swatch: '#ff4d4f' },
  { value: '#00e5ff', labelKey: 'timelineGrid.elementFilter.cold', swatch: '#00e5ff' },
  { value: '#ffbf00', labelKey: 'timelineGrid.elementFilter.emag', swatch: '#ffbf00' },
  { value: '#52c41a', labelKey: 'timelineGrid.elementFilter.nature', swatch: '#52c41a' },
] as const;

async function positionMenu(): Promise<void> {
  if (!props.visible) return;
  await nextTick();
  const rect = menu.value?.getBoundingClientRect();
  if (rect === undefined) return;
  const margin = 6;
  left.value = Math.max(margin, Math.min(props.x, window.innerWidth - rect.width - margin));
  top.value = Math.max(margin, Math.min(props.y, window.innerHeight - rect.height - margin));
}

function closeFromOutside(event: PointerEvent): void {
  if (!props.visible || menu.value?.contains(event.target as Node)) return;
  emit('close');
}

useKeyboardShortcutScope({
  id: 'timeline-action-context-menu',
  priority: 300,
  active: () => props.visible,
  blockLowerScopes: true,
  handle: event => {
    if (event.key !== 'Escape') return false;
    emit('close');
    return true;
  },
});

watch(() => [props.visible, props.x, props.y], positionMenu, { immediate: true });

onMounted(() => {
  window.addEventListener('pointerdown', closeFromOutside, true);
  window.addEventListener('resize', positionMenu);
});

onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', closeFromOutside, true);
  window.removeEventListener('resize', positionMenu);
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="menu"
      class="timeline-action-context-menu"
      :style="{ left: `${left}px`, top: `${top}px` }"
      role="menu"
      @contextmenu.prevent.stop
      @pointerdown.stop
      @pointermove.stop
      @wheel.stop
    >
      <div class="menu-header" :title="label">{{ label }}</div>
      <EaButton
        class="menu-item"
        variant="ghost"
        size="sm"
        type="button"
        role="menuitem"
        @click="$emit('copy')"
      >
        <el-icon><CopyDocument /></el-icon>
        <span>{{ t('common.copy') }}</span>
        <kbd>Ctrl+C</kbd>
      </EaButton>
      <EaButton
        class="menu-item delete-item"
        variant="ghost"
        size="sm"
        type="button"
        role="menuitem"
        @click="$emit('delete')"
        :disabled="inputReadOnly"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path
            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
          ></path>
        </svg>
        <span>{{ t('common.delete') }}</span>
        <kbd>Delete</kbd>
      </EaButton>
      <div class="divider"></div>
      <EaButton
        v-if="createGroupVisible"
        class="menu-item"
        variant="ghost"
        size="sm"
        type="button"
        role="menuitem"
        :disabled="inputReadOnly || Boolean(createGroupDisabledReason)"
        :title="createGroupDisabledReason"
        @click="$emit('createGroup')"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2"
          ></path>
        </svg>
        <span>{{ t('timeline.continuousGroup.create') }}</span>
      </EaButton>
      <EaButton
        v-if="dissolveGroupVisible"
        class="menu-item"
        variant="ghost"
        size="sm"
        type="button"
        role="menuitem"
        @click="$emit('dissolveGroup')"
        :disabled="inputReadOnly"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="m3 3 18 18M9 14l-1 1M15 9l1-1M7 8l-3 3a5 5 0 0 0 7 7l1-1M12 7l1-1a5 5 0 0 1 7 7l-3 3"
          ></path>
        </svg>
        <span>{{ t('timeline.continuousGroup.dissolve') }}</span>
      </EaButton>
      <EaButton
        variant="ghost"
        size="sm"
        v-if="compactVisible"
        class="menu-item"
        type="button"
        role="menuitem"
        :disabled="inputReadOnly || Boolean(compactDisabledReason)"
        :title="compactDisabledReason"
        @click="$emit('compact')"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 4v16M7 7h5v10H7zM15 7h6v10h-6z"></path>
        </svg>
        <span>{{ t('timeline.compactSelection.label') }}</span>
      </EaButton>
      <EaButton
        class="menu-item"
        variant="ghost"
        size="sm"
        type="button"
        role="menuitem"
        @click="$emit('toggleLock')"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path v-if="locked" d="M7 11V7a5 5 0 0 1 9.9-1"></path>
          <path v-else d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <span>{{ t(locked ? 'contextMenu.unlockPosition' : 'contextMenu.lockPosition') }}</span>
      </EaButton>
      <EaButton
        class="menu-item"
        variant="ghost"
        size="sm"
        type="button"
        role="menuitem"
        @click="$emit('toggleDisabled')"
        :disabled="inputReadOnly"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <path v-if="disabled" d="M9 12l2 2 4-4"></path>
          <line v-else x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
        </svg>
        <span>{{ t(disabled ? 'contextMenu.enableCalc' : 'contextMenu.disableCalc') }}</span>
      </EaButton>
      <div class="divider"></div>
      <div class="menu-label">{{ t('contextMenu.color') }}</div>
      <div class="color-grid">
        <EaButton
          variant="ghost"
          size="sm"
          icon-only
          v-for="option in colors"
          :key="option.value ?? 'default'"
          type="button"
          class="color-dot"
          :style="{ background: option.swatch }"
          :title="t(option.labelKey)"
          :aria-label="t(option.labelKey)"
          @click="$emit('setColor', option.value)"
          :pressed="color === option.value"
        ></EaButton>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.timeline-action-context-menu {
  position: fixed;
  z-index: 10000;
  min-width: 180px;
  padding: 6px 0;
  border: 1px solid #444;
  border-radius: 6px;
  background: #2b2b2b;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.6);
  color: #e0e0e0;
  font:
    13px/1 'Segoe UI',
    Roboto,
    sans-serif;
  user-select: none;
}

.menu-header {
  max-width: 220px;
  margin-bottom: 4px;
  padding: 6px 12px 10px;
  overflow: hidden;
  border-bottom: 1px solid #3a3a3a;
  color: #888;
  font-size: 12px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-item {
  width: 100%;
  height: 32px;
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 0;
  background: transparent;
  color: #ccc;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.menu-item:hover {
  background: #007fd4;
  color: #fff;
}

.menu-item:disabled {
  color: #777;
  background: transparent;
  cursor: not-allowed;
}

.menu-item.delete-item:not(:disabled):hover {
  background: #ff7875;
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
  color: #888;
  font:
    11px/1 Consolas,
    monospace;
}

.menu-item:hover kbd {
  color: rgba(255, 255, 255, 0.75);
}

.divider {
  height: 1px;
  margin: 4px 0;
  background: #444;
}

.menu-label {
  padding: 4px 12px;
  color: #777;
  font-size: 11px;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(6, 20px);
  gap: 7px;
  padding: 5px 12px 7px;
}

.color-dot {
  width: 20px;
  height: 20px;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 50%;
  cursor: pointer;
}

.color-dot:hover,
.color-dot[aria-pressed='true'] {
  border-color: #fff;
  box-shadow: 0 0 0 1px #777;
}
</style>
