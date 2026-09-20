<script setup lang="ts">
import type { AbilityEntityDefinitionNumber } from '../../../../core/game-data/operatorDefinition';

const props = defineProps<{ value: AbilityEntityDefinitionNumber }>();
const emit = defineEmits<{ update: [value: AbilityEntityDefinitionNumber] }>();

function setKind(event: Event): void {
  const kind = (event.target as HTMLSelectElement).value;
  emit(
    'update',
    kind === 'number'
      ? typeof props.value === 'number'
        ? props.value
        : props.value.fallback
      : typeof props.value === 'number'
        ? { blackboardKey: 'EntityBB_value', fallback: props.value }
        : props.value,
  );
}

function setNumber(event: Event): void {
  const value = Number((event.target as HTMLInputElement).value);
  if (!Number.isFinite(value)) return;
  emit('update', value);
}

function setBlackboardKey(event: Event): void {
  if (typeof props.value === 'number') return;
  emit('update', { ...props.value, blackboardKey: (event.target as HTMLInputElement).value });
}

function setFallback(event: Event): void {
  if (typeof props.value === 'number') return;
  const fallback = Number((event.target as HTMLInputElement).value);
  if (!Number.isFinite(fallback)) return;
  emit('update', { ...props.value, fallback });
}
</script>

<template>
  <div class="entity-number">
    <select :value="typeof value === 'number' ? 'number' : 'blackboard'" @change="setKind">
      <option value="number">固定值</option>
      <option value="blackboard">实体黑板值</option>
    </select>
    <input
      v-if="typeof value === 'number'"
      type="number"
      step="0.01"
      :value="value"
      @input="setNumber"
    />
    <template v-else>
      <input
        type="text"
        :value="value.blackboardKey"
        placeholder="EntityBB_ 键"
        @input="setBlackboardKey"
      />
      <input
        type="number"
        step="0.01"
        :value="value.fallback"
        placeholder="缺失时回退值"
        @input="setFallback"
      />
    </template>
  </div>
</template>

<style scoped>
.entity-number {
  min-width: 0;
  display: grid;
  grid-template-columns: 105px minmax(0, 1fr);
  gap: 8px;
}
.entity-number:has(> input + input) {
  grid-template-columns: 105px minmax(90px, 1fr) minmax(70px, 0.6fr);
}
.entity-number input,
.entity-number select {
  min-width: 0;
  height: 30px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg);
}
</style>
