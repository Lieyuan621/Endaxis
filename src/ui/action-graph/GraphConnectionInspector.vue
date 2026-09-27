<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { EaButton } from '@/design-system';
import EditorInspector from '../editor/EditorInspector.vue';
defineProps<{ source: string; target: string }>();
const emit = defineEmits<{ locateSource: []; locateTarget: [] }>();
const { t } = useI18n();
</script>

<template>
  <EditorInspector :title="t('editor.executionConnection')">
    <dl>
      <dt>{{ t('editor.connectionSource') }}</dt>
      <dd>{{ source }}</dd>
      <dt>{{ t('editor.connectionTarget') }}</dt>
      <dd>{{ target }}</dd>
    </dl>
    <div class="connection-actions">
      <EaButton size="sm" @click="emit('locateSource')">{{ t('editor.locateSource') }}</EaButton>
      <EaButton size="sm" @click="emit('locateTarget')">{{ t('editor.locateTarget') }}</EaButton>
    </div>
  </EditorInspector>
</template>

<style scoped>
dl {
  margin: 0 0 12px;
}
dt {
  color: var(--ea-fg-muted);
  margin-top: 8px;
}
dd {
  margin: 4px 0 0;
  overflow-wrap: anywhere;
}
.connection-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
