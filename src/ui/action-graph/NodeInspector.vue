<script setup lang="ts">
import EditorHelp from './EditorHelp.vue';
import type { BlackboardScope } from '../../application/editor/graphBlackboard';
import { scopeName, scopeHelp } from './editorNodeText';
import { useI18n } from 'vue-i18n';

defineProps<{
  title: string;
  nodeId: string;
  help: string;
  scopes?: readonly BlackboardScope[];
  scopeWarnings?: readonly string[];
}>();
const { t } = useI18n();
</script>

<template>
  <section class="node-inspector">
    <header class="inspector-header">
      <strong>{{ title }}<EditorHelp v-if="help" :text="help" /></strong>
      <code>{{ nodeId }}</code>
    </header>
    <div v-if="scopes" class="node-context">
      <span class="context-label">{{ t('actionGraphEditor.scope') }}</span>
      <div class="context-values">
        <span v-for="scope in scopes" :key="scope.id"
          >{{ scopeName(scope) }}<EditorHelp :text="scopeHelp(scope)"
        /></span>
        <span v-if="!scopes.length">{{ t('actionGraphEditor.scopeUnknown') }}</span>
      </div>
      <p v-for="message in scopeWarnings" :key="message" class="context-warning">{{ message }}</p>
    </div>
    <slot />
  </section>
</template>

<style scoped>
.node-inspector {
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
.node-context {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 6px 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--ea-border);
  font-size: 12px;
  line-height: 18px;
}
.context-label {
  color: var(--ea-fg-muted);
}
.context-values {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-wrap: anywhere;
}
.context-warning {
  grid-column: 1 / -1;
  margin: 0;
  color: var(--ea-fg-muted);
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
.node-inspector :deep(form) {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.node-inspector :deep(.node-field) {
  display: grid;
  gap: 6px;
  min-width: 0;
  margin: 0;
}
.node-inspector :deep(.node-field > span) {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 12px;
  overflow-wrap: anywhere;
}
.node-inspector :deep(.node-field small) {
  margin-left: auto;
  color: var(--ea-fg-muted);
}
.node-inspector :deep(input),
.node-inspector :deep(select),
.node-inspector :deep(textarea) {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: 7px;
  border: 1px solid var(--ea-border);
  border-radius: 3px;
  background: var(--ea-fill-input);
  color: var(--ea-fg);
  font: 12px/1.5 var(--ea-font-family, sans-serif);
}
.node-inspector :deep(textarea) {
  resize: vertical;
  font-family: Consolas, monospace;
}
.node-inspector :deep(.field-error) {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: #ff9999;
  font-size: 12px;
}
.node-inspector :deep(.actions) {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.node-inspector :deep(.branch-preview) {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 11px;
}
</style>
