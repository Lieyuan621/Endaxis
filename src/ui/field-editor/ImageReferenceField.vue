<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaInput, EaSelect } from '@/design-system';
import { imageCatalog, resolveImage } from '../imageResources';

const props = defineProps<{
  value: unknown;
  label: string;
  optional?: boolean;
  readonly?: boolean;
}>();
const emit = defineEmits<{ change: [value: string | undefined] }>();
const { t } = useI18n();
const open = ref(false);
const query = ref('');
const category = ref('');
const shown = ref(60);
const selected = computed(() => resolveImage(props.value));
const categories = [...new Set(imageCatalog.map(item => item.category))];
const matches = computed(() =>
  imageCatalog.filter(
    item =>
      (!category.value || item.category === category.value) &&
      item.ref.toLowerCase().includes(query.value.trim().toLowerCase()),
  ),
);
function choose(id: string | undefined) {
  if (props.readonly || (id === undefined ? !props.optional : !resolveImage(id))) return;
  emit('change', id);
  open.value = false;
}
</script>

<template>
  <div class="image-reference-field">
    <span>{{ label }}</span>
    <div class="image-reference-field__current">
      <img v-if="selected" :src="selected" alt="" draggable="false" />
      <span class="image-reference-field__id" :title="typeof value === 'string' ? value : ''">{{
        value || t('imagePicker.default')
      }}</span>
      <EaButton v-if="!readonly" @click="open = !open">{{ t('imagePicker.choose') }}</EaButton>
      <EaButton v-if="!readonly && optional && value !== undefined" @click="choose(undefined)">{{
        t('imagePicker.clear')
      }}</EaButton>
    </div>
    <p v-if="value && !selected" role="alert">{{ t('imagePicker.missing') }}</p>
    <div v-if="open && !readonly" class="image-reference-field__picker">
      <EaInput
        v-model="query"
        :placeholder="t('imagePicker.search')"
        @update:model-value="shown = 60"
      />
      <EaSelect
        :model-value="category"
        :aria-label="t('imagePicker.category')"
        :placeholder="t('imagePicker.all')"
        :options="[
          { value: '', label: t('imagePicker.all') },
          ...categories.map(value => ({ value, label: t('imagePicker.categories.' + value) })),
        ]"
        @update:model-value="
          value => {
            category = String(value ?? '');
            shown = 60;
          }
        "
      />
      <div class="image-reference-field__grid">
        <button
          v-for="item in matches.slice(0, shown)"
          :key="item.ref"
          type="button"
          :title="item.ref"
          :aria-label="item.ref"
          :aria-pressed="value === item.ref"
          @click="choose(item.ref)"
        >
          <img :src="item.path" alt="" loading="lazy" draggable="false" />
        </button>
      </div>
      <p v-if="matches.length === 0">{{ t('imagePicker.empty') }}</p>
      <EaButton v-if="matches.length > shown" @click="shown += 60">{{
        t('imagePicker.more')
      }}</EaButton>
    </div>
  </div>
</template>

<style scoped>
.image-reference-field {
  display: grid;
  gap: 8px;
  min-width: 0;
}
.image-reference-field__current {
  display: grid;
  grid-template-columns: 40px auto auto;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.image-reference-field__current > img {
  width: 40px;
  height: 40px;
  object-fit: contain;
  flex-shrink: 0;
}
.image-reference-field__id {
  grid-column: 1 / -1;
  grid-row: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.image-reference-field__picker {
  display: grid;
  gap: 8px;
}
.image-reference-field__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(52px, 1fr));
  gap: 6px;
  max-height: 280px;
  overflow-y: auto;
}
.image-reference-field__grid button {
  border: 1px solid var(--ea-border-color, #555);
  background: transparent;
  cursor: pointer;
  padding: 4px;
}
.image-reference-field__grid button:hover,
.image-reference-field__grid button[aria-pressed='true'] {
  border-color: var(--ea-color-primary, #f5dc56);
  background: #f5dc561a;
}
.image-reference-field__grid img {
  width: 100%;
  height: 44px;
  object-fit: contain;
}
</style>
