<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { InspectorStringReference } from './inspectorFields';

defineProps<{ value: InspectorStringReference; label?: string }>();
const emit = defineEmits<{ update: [value: InspectorStringReference] }>();
const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div class="buff-reference">
    <select
      :aria-label="label ?? t('timeline.skillEditing.buffId')"
      :value="typeof value === 'string' ? 'constant' : 'blackboard'"
      @change="
        emit(
          'update',
          ($event.target as HTMLSelectElement).value === 'constant' ? '' : { blackboardKey: '' },
        )
      "
    >
      <option value="constant">{{ t('timeline.skillEditing.operandConstant') }}</option>
      <option value="blackboard">{{ t('timeline.skillEditing.operandBlackboard') }}</option>
    </select>
    <input
      type="text"
      :aria-label="
        typeof value === 'string'
          ? (label ?? t('timeline.skillEditing.buffId'))
          : t('timeline.skillEditing.operandBlackboardKey')
      "
      :value="typeof value === 'string' ? value : value.blackboardKey"
      @input="
        emit(
          'update',
          typeof value === 'string'
            ? ($event.target as HTMLInputElement).value
            : { blackboardKey: ($event.target as HTMLInputElement).value },
        )
      "
    />
  </div>
</template>

<style scoped>
.buff-reference {
  display: grid;
  gap: 6px;
  min-width: 0;
}
.buff-reference > * {
  min-width: 0;
  width: 100%;
  height: 32px;
  box-sizing: border-box;
  padding: 0 8px;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input);
  color: var(--ea-fg);
}
</style>
