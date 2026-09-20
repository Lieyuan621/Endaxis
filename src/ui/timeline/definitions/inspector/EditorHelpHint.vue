<script setup lang="ts">
import { EaTooltip } from '@/design-system';
/**
 * 为技能编辑器中的领域概念提供补充说明。
 *
 * 调用方只传已经翻译的说明文本；本组件统一处理鼠标悬停、键盘聚焦和视觉样式，
 * 避免各步骤编辑器各自实现问号按钮。
 */
defineProps<{ text: string }>();
</script>

<template>
  <EaTooltip :content="text" placement="top" :show-after="180">
    <button type="button" class="editor-help-hint" :aria-label="text" @click.prevent>?</button>
  </EaTooltip>
</template>

<style scoped>
.editor-help-hint {
  width: 14px;
  height: 14px;
  flex: 0 0 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid var(--ea-border);
  border-radius: 50%;
  background: transparent;
  color: var(--ea-fg-muted);
  font: 700 9px/1 var(--ea-font-family, sans-serif);
  cursor: help;
}

.editor-help-hint:hover,
.editor-help-hint:focus-visible {
  border-color: var(--ea-gold);
  color: var(--ea-gold);
  outline: none;
}
</style>
