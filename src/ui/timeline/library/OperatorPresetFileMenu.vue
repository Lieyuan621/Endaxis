<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaChevronIcon, EaPopover } from '@/design-system';
import { useInteractionSession } from '../../interaction/interactionSessionContext';
import { usePopoverInteractionBoundary } from '../../interaction/usePopoverInteractionBoundary';
defineProps<{ importDisabled: boolean; exportDisabled: boolean }>();
const emit = defineEmits<{ importFile: []; exportPresets: [] }>();
const { t } = useI18n();
const open = ref(false);
// 菜单位于预设的模态输入区内，复用该区域的浮层关闭和 Escape 行为。
usePopoverInteractionBoundary(
  useInteractionSession(),
  () => open.value,
  () => {
    open.value = false;
  },
);
function run(action: 'import' | 'export') {
  open.value = false;
  if (action === 'import') emit('importFile');
  else emit('exportPresets');
}
</script>
<template>
  <EaPopover
    v-model:visible="open"
    placement="bottom-end"
    trigger="click"
    :width="140"
    :popper-style="{ minWidth: '140px', padding: 'var(--ea-space-1)' }"
    :show-arrow="true"
  >
    <template #reference>
      <EaButton :aria-expanded="open" aria-haspopup="menu">
        {{ t('operatorPresets.more') }}
        <EaChevronIcon :direction="open ? 'up' : 'down'" />
      </EaButton>
    </template>
    <div class="preset-file-menu" role="menu" :aria-label="t('operatorPresets.more')">
      <EaButton variant="ghost" role="menuitem" :disabled="importDisabled" @click="run('import')">{{
        t('operatorPresets.import')
      }}</EaButton>
      <EaButton variant="ghost" role="menuitem" :disabled="exportDisabled" @click="run('export')">{{
        t('operatorPresets.export')
      }}</EaButton>
    </div>
  </EaPopover>
</template>
<style scoped>
.preset-file-menu {
  display: grid;
}
.preset-file-menu > .ea-button {
  justify-content: flex-start;
}
</style>
