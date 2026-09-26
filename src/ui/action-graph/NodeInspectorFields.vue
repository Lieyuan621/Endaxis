<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton } from '@/design-system';
import EditorHelp from './EditorHelp.vue';
import NodeLevelValues from './NodeLevelValues.vue';
import type { NodeFieldSchema } from './nodeSchema';
import { fieldName, fieldHelp, optionName } from './editorNodeText';
import {
  containsActionGraph,
  containsGraphReference,
  formatNodeField,
  parseNodeField,
  readNodeField,
  writeNodeField,
} from './nodeFieldValues';

const props = defineProps<{
  value: unknown;
  kind: string;
  fields: readonly NodeFieldSchema[];
  choices?: Readonly<Record<string, readonly string[]>>;
  applyValue: (value: unknown) => boolean;
}>();
const emit = defineEmits<{ pending: [value: boolean] }>();
const { t } = useI18n();
const inputs = ref<Record<string, string>>({});
const pending = ref(false);
const error = ref('');

function reset() {
  inputs.value = Object.fromEntries(
    props.fields.map(field => [
      field.path.join('.'),
      formatNodeField(readNodeField(props.value, field.path), field),
    ]),
  );
  pending.value = false;
  error.value = '';
  emit('pending', false);
}
watch(() => props.value, reset, { immediate: true });
function change(key: string, value: string) {
  inputs.value[key] = value;
  pending.value = true;
  emit('pending', true);
}
function selectedOptions(field: NodeFieldSchema): unknown[] {
  const text = inputs.value[field.path.join('.')];
  return text ? JSON.parse(text) : [];
}
function toggleOption(field: NodeFieldSchema, option: string | number | boolean, checked: boolean) {
  const values = selectedOptions(field).filter(value => value !== option);
  if (checked) values.push(option);
  change(field.path.join('.'), JSON.stringify(values));
  apply();
}
function apply(): boolean {
  if (!pending.value) return true;
  try {
    let value = props.value;
    for (const field of props.fields) {
      const text = inputs.value[field.path.join('.')] ?? '';
      if (text === formatNodeField(readNodeField(props.value, field.path), field)) continue;
      const parsed = parseNodeField(text, { ...field, label: fieldName(field.path, props.kind) });
      if (containsActionGraph(parsed) || containsGraphReference(parsed)) {
        error.value = t('actionGraphEditor.invalid');
        return false;
      }
      value = writeNodeField(value, field.path, parsed);
    }
    if (!props.applyValue(value)) {
      error.value = t('actionGraphEditor.invalid');
      return false;
    }
    reset();
    return true;
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause);
    return false;
  }
}
defineExpose({ apply });
</script>

<template>
  <form @submit.prevent="apply" @keydown.esc.prevent.stop="reset">
    <div v-for="field in fields" :key="field.path.join('.')" class="node-field">
      <span>
        <span class="field-name"
          >{{ fieldName(field.path, kind)
          }}<EditorHelp v-if="fieldHelp(field.path, kind)" :text="fieldHelp(field.path, kind)"
        /></span>
        <small v-if="!field.required">{{ t('actionGraphEditor.optional') }}</small>
      </span>
      <NodeLevelValues
        v-if="field.control === 'levelValues'"
        :text="inputs[field.path.join('.')] ?? ''"
        :required="field.required"
        :label="fieldName(field.path, kind)"
        @change="
          change(field.path.join('.'), $event);
          apply();
        "
      />
      <div v-else-if="field.control === 'multiselect'" class="field-options">
        <label v-for="option in field.options" :key="String(option)">
          <input
            type="checkbox"
            :checked="selectedOptions(field).includes(option)"
            @change="toggleOption(field, option, ($event.target as HTMLInputElement).checked)"
          />
          {{ optionName(option, field.type) }}
        </label>
        <EaButton
          v-if="!field.required && inputs[field.path.join('.')]"
          size="sm"
          @click="
            change(field.path.join('.'), '');
            apply();
          "
          >{{ t('actionGraphEditor.unset') }}</EaButton
        >
      </div>
      <select
        v-else-if="choices?.[field.path.join('.')]"
        :aria-label="fieldName(field.path, kind)"
        :value="inputs[field.path.join('.')]"
        @change="
          change(field.path.join('.'), ($event.target as HTMLSelectElement).value);
          apply();
        "
      >
        <option v-for="value in choices[field.path.join('.')]" :key="value" :value="value">
          {{ value }}
        </option>
      </select>
      <select
        v-else-if="field.control === 'select' || field.control === 'boolean'"
        :aria-label="fieldName(field.path, kind)"
        :value="inputs[field.path.join('.')]"
        @change="
          change(field.path.join('.'), ($event.target as HTMLSelectElement).value);
          apply();
        "
      >
        <option v-if="!field.required" value="">{{ t('actionGraphEditor.unset') }}</option>
        <option
          v-for="option in field.control === 'boolean' ? [true, false] : field.options"
          :key="String(option)"
          :value="JSON.stringify(option)"
        >
          {{ optionName(option, field.type) }}
        </option>
      </select>
      <input
        v-else-if="field.control === 'number' || field.control === 'string'"
        :aria-label="fieldName(field.path, kind)"
        :type="field.control === 'number' ? 'number' : 'text'"
        step="any"
        :value="inputs[field.path.join('.')]"
        @input="change(field.path.join('.'), ($event.target as HTMLInputElement).value)"
        @blur="apply"
      />
      <textarea
        v-else
        :aria-label="fieldName(field.path, kind)"
        spellcheck="false"
        :rows="Math.min(8, Math.max(2, (inputs[field.path.join('.')] ?? '').split('\n').length))"
        :value="inputs[field.path.join('.')]"
        @input="change(field.path.join('.'), ($event.target as HTMLTextAreaElement).value)"
        @blur="apply"
        @keydown.ctrl.enter.prevent="apply"
        @keydown.meta.enter.prevent="apply"
      />
    </div>
    <pre v-if="error" class="field-error" role="alert">{{ error }}</pre>
    <div v-if="pending" class="actions">
      <EaButton type="submit" size="sm" variant="primary">{{
        t('actionGraphEditor.apply')
      }}</EaButton>
      <EaButton size="sm" @click="reset">{{ t('actionGraphEditor.discard') }}</EaButton>
    </div>
  </form>
</template>

<style scoped>
.field-options {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
}
.field-options label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
}
.field-options input[type='checkbox'] {
  width: 14px;
  height: 14px;
  margin: 0;
  padding: 0;
}
</style>
