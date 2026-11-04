<script setup lang="ts">
import TimelineMenuActionIcon from './TimelineMenuActionIcon.vue';
/**
 * 时间轴动作的基础右键菜单，只负责定位、展示和派发命令意图。
 * 存档修改由编辑器应用层完成；Teleport 用于避免轨道裁剪和指针事件穿透。
 */
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
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
  deleteDisabled?: boolean;
  skillOptions?: boolean;
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
  cut: [];
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
      class="timeline-action-context-menu timeline-context-menu"
      :style="{ left: `${left}px`, top: `${top}px` }"
      role="menu"
      @contextmenu.prevent.stop
      @pointerdown.stop
      @pointermove.stop
      @wheel.stop
    >
      <div class="menu-header" :title="label">{{ label }}</div>
      <EaButton class="menu-item" variant="ghost" size="sm" role="menuitem" @click="$emit('copy')">
        <TimelineMenuActionIcon action="copy" />
        <span>{{ t('common.copy') }}</span>
        <kbd>Ctrl+C</kbd>
      </EaButton>
      <EaButton
        class="menu-item"
        variant="ghost"
        size="sm"
        role="menuitem"
        :disabled="deleteDisabled || inputReadOnly"
        @click="$emit('cut')"
      >
        <TimelineMenuActionIcon action="cut" />
        <span>{{ t('common.cut') }}</span>
        <kbd>Ctrl+X</kbd>
      </EaButton>
      <EaButton
        class="menu-item delete-item"
        variant="ghost"
        size="sm"
        type="button"
        role="menuitem"
        @click="$emit('delete')"
        :disabled="deleteDisabled || inputReadOnly"
      >
        <TimelineMenuActionIcon action="delete" />
        <span>{{ t('common.delete') }}</span>
        <kbd>Delete</kbd>
      </EaButton>
      <template v-if="skillOptions !== false">
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
      </template>
    </div>
  </Teleport>
</template>

<style scoped>
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
