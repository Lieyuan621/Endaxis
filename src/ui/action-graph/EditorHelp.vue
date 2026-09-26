<script setup lang="ts">
import { EaTooltip } from '@/design-system';
import { useI18n } from 'vue-i18n';
defineProps<{ text: string }>();
defineOptions({ inheritAttrs: false });
const { t } = useI18n();
</script>
<template>
  <EaTooltip :content="text" placement="top" :show-after="180">
    <span
      v-bind="$attrs"
      class="editor-help"
      tabindex="0"
      role="img"
      :aria-label="`${t('actionGraphEditor.help')}: ${text}`"
      @pointerdown.stop
      @click.stop
      >?</span
    >
  </EaTooltip>
</template>
<style scoped>
.editor-help {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 12px;
  height: 12px;
  margin-left: 4px;
  border: 1px solid #687383;
  border-radius: 50%;
  color: #8e99a8;
  font: 9px/1 sans-serif;
  cursor: help;
  vertical-align: middle;
}
.editor-help:hover {
  color: #d0d8e2;
  border-color: currentColor;
}
.editor-help:focus-visible {
  outline: 2px solid #ffd26d;
}
</style>
