<script setup lang="ts">
/** 将字段名和可选的领域说明组合为统一标签。 */
import EditorHelpHint from './EditorHelpHint.vue';

defineProps<{ label: string; help?: string }>();
</script>

<template>
  <span class="editor-field-label">
    <span>{{ label }}</span>
    <EditorHelpHint v-if="help" :text="help" />
  </span>
</template>

<style scoped>
.editor-field-label {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
