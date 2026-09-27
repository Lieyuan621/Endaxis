<script setup lang="ts">
import EditorHelp from './EditorHelp.vue';

/** 编辑器共用的检查器外壳；节点作用域、资产字段等由调用方提供，不在这里识别资源类型。 */
defineProps<{
  title: string;
  identity?: string;
  help?: string;
}>();
</script>

<template>
  <section class="editor-inspector">
    <header class="inspector-header">
      <strong>{{ title }}<EditorHelp v-if="help" :text="help" /></strong>
      <code v-if="identity">{{ identity }}</code>
    </header>
    <slot name="context" />
    <slot />
  </section>
</template>

<style scoped>
.editor-inspector {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  color: var(--ea-fg);
}
.inspector-header {
  display: grid;
  gap: 6px;
}
.inspector-header strong {
  font-size: 14px;
  line-height: 20px;
  overflow-wrap: anywhere;
}
.inspector-header code {
  color: var(--ea-fg-muted);
  overflow-wrap: anywhere;
  font-size: 11px;
}
.editor-inspector :deep(form) {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.editor-inspector :deep(.node-field) {
  display: grid;
  gap: 6px;
  min-width: 0;
  margin: 0;
}
.editor-inspector :deep(.definition-field label) {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 6px;
  font-size: 12px;
}
.editor-inspector :deep(.node-field > span) {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 12px;
  overflow-wrap: anywhere;
}
.editor-inspector :deep(.node-field small) {
  margin-left: auto;
  color: var(--ea-fg-muted);
}
.editor-inspector :deep(.field-error) {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: #ff9999;
  font-size: 12px;
}
.editor-inspector :deep(.actions) {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.editor-inspector :deep(.branch-preview) {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 11px;
}
</style>
