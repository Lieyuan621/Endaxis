<script setup lang="ts">
import EditorHelp from '../editor/EditorHelp.vue';
import EditorInspector from '../editor/EditorInspector.vue';
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
  <EditorInspector :title="title" :identity="nodeId" :help="help">
    <template #context>
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
    </template>
    <slot />
  </EditorInspector>
</template>

<style scoped>
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
</style>
