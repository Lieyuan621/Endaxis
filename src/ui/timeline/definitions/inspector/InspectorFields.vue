<script setup lang="ts" generic="T extends object">
import { computed, inject } from 'vue';
import type { InspectorValueAdapter } from './inspectorValueWrapper';
import { useI18n } from 'vue-i18n';
import { type InspectorField } from './inspectorFields';
import { defaultInspectorEditors, inspectorEditorRegistryKey } from './inspectorEditors';
import {
  inspectorProperty,
  type InspectorPropertyHandle,
  type InspectorPropertyPath,
} from './inspectorProperty';
import EditorFieldLabel from './EditorFieldLabel.vue';
import {
  guardDefinitionProperty,
  projectDefinitionProperty,
  type DefinitionProperty,
} from '../definitionEditContext';

const props = defineProps<{
  value: T;
  binding?: DefinitionProperty;
  fields: readonly InspectorField<T>[];
  currentLevel?: number;
  propertyPath?: InspectorPropertyPath;
  /** 内部 { value } 包装不是真实数据层级。 */
  valueAdapter?: InspectorValueAdapter<T>;
  /** 联合控件已经显示外层字段标题；内层仅渲染所选形式，不再重复标题。 */
  hideHeadings?: boolean;
  validate?: (value: T) => readonly { path: string; message: string }[];
}>();
const emit = defineEmits<{ update: [value: T, path?: InspectorPropertyPath] }>();
const { t, te } = useI18n({ useScope: 'global' });
const issues = computed(() => props.validate?.(props.value) ?? []);
const editors = inject(inspectorEditorRegistryKey, defaultInspectorEditors);
// 未包装的动态绑定仍在既有schema边界恢复T；包装模式由具名适配器构造T。
function readBindingValue(value: unknown): T {
  return props.valueAdapter ? props.valueAdapter.read(value) : (value as T);
}
function writeBindingValue(value: T): unknown {
  return props.valueAdapter ? props.valueAdapter.write(value) : value;
}
const properties = computed(() =>
  props.fields.map(field =>
    inspectorProperty(
      {
        read: () => (props.binding ? readBindingValue(props.binding.read()) : props.value),
        issues: () => issues.value,
        path: props.binding?.path ?? props.propertyPath,
        commit: (next, path) => {
          if (props.binding) props.binding.update(() => writeBindingValue(next), path);
          else emit('update', next, path);
        },
      },
      field,
      props.valueAdapter ? [] : undefined,
    ),
  ),
);
function editorProps(property: InspectorPropertyHandle<T>) {
  const field = property.field;
  return editors[field.widget ?? field.editor].props({
    field,
    binding: props.binding
      ? guardDefinitionProperty(
          projectDefinitionProperty(
            props.binding,
            props.valueAdapter || field.key === '' ? [] : [field.key],
            current => field.read(readBindingValue(current)),
            (current, input) => {
              const next = field.write(readBindingValue(current), input);
              return writeBindingValue(next);
            },
          ),
          () => !property.disabled,
        )
      : undefined,
    propertyPath: property.path,
    value: property.value,
    label: te(field.labelKey) ? t(field.labelKey) : field.key,
    disabled: property.disabled,
    currentLevel: props.currentLevel ?? 1,
    translate: key => (te(key) ? t(key) : (key.split('.').at(-1) ?? key)),
  });
}
</script>

<template>
  <div class="inspector-fields">
    <template v-if="!fields.some(field => field.key === '')">
      <p
        v-for="issue in issues.filter(issue => issue.path === '')"
        :key="issue.message"
        class="inspector-field__error"
        role="status"
      >
        {{ issue.message }}
      </p>
    </template>
    <div
      v-for="property in properties"
      :key="property.field.key"
      class="inspector-field"
      :data-field="property.field.key"
      :data-property-path="JSON.stringify(property.path)"
    >
      <div v-if="!hideHeadings" class="inspector-field__heading">
        <input
          v-if="property.field.optional && property.field.editor !== 'boolean'"
          type="checkbox"
          :aria-label="t(property.field.labelKey)"
          :checked="property.present"
          :disabled="property.disabled"
          @change="property.setPresent(($event.target as HTMLInputElement).checked)"
        />
        <EditorFieldLabel
          :label="te(property.field.labelKey) ? t(property.field.labelKey) : property.field.key"
          :help="
            property.field.helpKey && te(property.field.helpKey)
              ? t(property.field.helpKey)
              : undefined
          "
        />
      </div>
      <div
        v-if="!property.field.optional || property.field.editor === 'boolean' || property.present"
        class="inspector-field__control"
      >
        <component
          :is="editors[property.field.widget ?? property.field.editor].component"
          v-bind="editorProps(property)"
          @update="(next: unknown, path?: InspectorPropertyPath) => property.set(next, path)"
          @omit="property.setPresent(false)"
        />
      </div>
      <p
        v-for="issue in property.issues"
        :key="`${issue.path}:${issue.message}`"
        class="inspector-field__error"
        role="status"
      >
        {{ issue.message }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.inspector-fields {
  display: grid;
  gap: 12px;
  min-width: 0;
  grid-column: 1 / -1;
}
.inspector-field {
  display: grid;
  gap: 6px;
  min-width: 0;
}
.inspector-field__heading {
  display: flex;
  align-items: center;
  gap: 6px;
}
.inspector-field__control {
  min-width: 0;
}
.inspector-field__error {
  margin: 0;
  color: var(--el-color-danger);
  font-size: 12px;
  overflow-wrap: anywhere;
}
</style>
