<script setup lang="ts">
import { EaButton } from '../../../design-system/index';
import type { DefinitionDraftHistory } from './useDefinitionDraftHistory';

defineProps<{
  history: Pick<DefinitionDraftHistory<unknown>, 'restore' | 'canUndo' | 'canRedo'>;
}>();
</script>

<template>
  <div class="definition-history-controls" aria-label="当前保存范围的历史记录">
    <EaButton
      size="sm"
      type="button"
      :disabled="!history.canUndo.value"
      @click="history.restore('undo')"
    >
      撤销
    </EaButton>
    <EaButton
      size="sm"
      type="button"
      :disabled="!history.canRedo.value"
      @click="history.restore('redo')"
    >
      重做
    </EaButton>
  </div>
</template>

<style scoped>
.definition-history-controls {
  display: flex;
  flex: none;
  gap: 8px;
}
</style>
