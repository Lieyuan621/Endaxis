<script setup lang="ts">
import type { BuffDuration } from '../../../../../packages/game-data-contract/src/buffs';

const props = withDefaults(
  defineProps<{
    value?: BuffDuration;
    integer?: boolean;
    minimum?: number;
  }>(),
  { integer: false },
);
const emit = defineEmits<{ update: [value: BuffDuration | undefined] }>();

function setKind(event: Event): void {
  const kind = (event.target as HTMLSelectElement).value;
  if (kind === 'unset') emit('update', undefined);
  else if (kind === 'blackboard') emit('update', { blackboardKey: '' });
  else emit('update', typeof props.value === 'number' ? props.value : (props.minimum ?? 0));
}

function setNumber(event: Event): void {
  const value = Number((event.target as HTMLInputElement).value);
  if (!Number.isFinite(value) || (props.minimum !== undefined && value < props.minimum)) return;
  emit('update', props.integer ? Math.trunc(value) : value);
}

function setBlackboardKey(event: Event): void {
  emit('update', { blackboardKey: (event.target as HTMLInputElement).value });
}
</script>

<template>
  <span class="buff-scalar-editor">
    <select
      :value="value === undefined ? 'unset' : typeof value === 'number' ? 'constant' : 'blackboard'"
      @change="setKind"
    >
      <option value="unset">未设置</option>
      <option value="constant">常量</option>
      <option value="blackboard">黑板</option>
    </select>
    <input
      v-if="typeof value === 'number'"
      type="number"
      :min="minimum"
      :step="integer ? 1 : 0.01"
      :value="value"
      @input="setNumber"
    />
    <input
      v-else-if="value !== undefined"
      type="text"
      placeholder="黑板键"
      :value="value.blackboardKey"
      @input="setBlackboardKey"
    />
  </span>
</template>

<style scoped>
.buff-scalar-editor {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(88px, 0.38fr) minmax(0, 1fr);
  gap: 6px;
}

.buff-scalar-editor > * {
  min-width: 0;
}
</style>
