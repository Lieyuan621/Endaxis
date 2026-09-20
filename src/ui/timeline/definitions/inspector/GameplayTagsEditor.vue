<script setup lang="ts">
import { useId } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  GAMEPLAY_TAG_PATHS,
  parseGameplayTagReference,
} from '../../../../data/combat/gameplayTagCatalog';

const props = withDefaults(
  defineProps<{
    tags: readonly string[];
    minimum?: number;
    maximum?: number;
  }>(),
  { minimum: 1, maximum: Number.POSITIVE_INFINITY },
);
const emit = defineEmits<{ update: [tags: readonly string[]] }>();
const { t } = useI18n({ useScope: 'global' });
const datalistId = `gameplay-tags-${useId().replaceAll(':', '-')}`;

function displayedValue(tag: string): string {
  return tag;
}

function replace(index: number, event: Event): void {
  const input = event.target as HTMLInputElement;
  const tag = parseGameplayTagReference(input.value);
  if (tag === undefined) {
    input.value = displayedValue(props.tags[index]!);
    return;
  }
  const tags = [...props.tags];
  tags[index] = tag;
  emit('update', tags);
}

function append(event: Event): void {
  const input = event.target as HTMLInputElement;
  const tag = parseGameplayTagReference(input.value);
  if (tag === undefined || props.tags.length >= props.maximum) return;
  emit('update', [...props.tags, tag]);
  input.value = '';
}

function remove(index: number): void {
  if (props.tags.length <= props.minimum) return;
  emit(
    'update',
    props.tags.filter((_, itemIndex) => itemIndex !== index),
  );
}
</script>

<template>
  <div class="gameplay-tag-editor">
    <div v-for="(tag, index) in tags" :key="index" class="gameplay-tag-editor__row">
      <input
        type="text"
        :list="datalistId"
        :value="displayedValue(tag)"
        :aria-label="t('timeline.skillEditing.gameplayTagPath')"
        @change="replace(index, $event)"
      />
      <button
        type="button"
        :disabled="tags.length <= minimum"
        :title="t('timeline.skillEditing.deleteGameplayTag')"
        @click="remove(index)"
      >
        ×
      </button>
    </div>
    <input
      v-if="tags.length < maximum"
      class="gameplay-tag-editor__add"
      type="text"
      :list="datalistId"
      :placeholder="t('timeline.skillEditing.addGameplayTag')"
      :aria-label="t('timeline.skillEditing.addGameplayTag')"
      @change="append"
    />
    <datalist :id="datalistId">
      <option v-for="path in GAMEPLAY_TAG_PATHS" :key="path" :value="path" />
    </datalist>
  </div>
</template>

<style scoped>
.gameplay-tag-editor {
  min-width: 0;
  display: grid;
  gap: 6px;
}

.gameplay-tag-editor__row {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 28px;
  gap: 6px;
  align-items: center;
}

.gameplay-tag-editor input {
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
  height: 30px;
  padding: 4px 8px;
  font: inherit;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input);
  color: var(--ea-fg);
}

.gameplay-tag-editor button {
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input);
  color: var(--ea-fg);
}

.gameplay-tag-editor small {
  grid-column: 1 / -1;
  color: var(--ea-warning, #d6a45f);
}
</style>
