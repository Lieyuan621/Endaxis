<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaCheckbox, EaNumberInput } from '@/design-system';
import {
  DEFAULT_TRUST_ATTRIBUTE_BONUS,
  type OperatorDefinition,
} from '../../../packages/game-data-contract/src/operators';
import DefinitionField from '../definition-editor/DefinitionField.vue';
import { definitionSchemas } from '../definition-editor/definitionSchemas.generated';
import type { DefinitionFieldSchema } from '../definition-editor/fieldSchema';

const props = defineProps<{ definition: OperatorDefinition; editable: boolean; page: string }>();
const emit = defineEmits<{ change: [path: readonly (string | number)[], value: unknown] }>();
const { t } = useI18n();
const schema = definitionSchemas.operator;
const fields: Readonly<Record<string, DefinitionFieldSchema>> =
  schema.kind === 'object' ? schema.fields : {};
const basicFields = [
  'rarity',
  'role',
  'element',
  'weaponType',
  'mainAttribute',
  'secondaryAttribute',
] as const;
const levels = [1, 20, 40, 60, 80, 90];
const attributes = [
  'baseAttack',
  'baseHealth',
  'strength',
  'agility',
  'intellect',
  'will',
] as const;
const trust = computed(() => props.definition.trustAttributeBonus ?? DEFAULT_TRUST_ATTRIBUTE_BONUS);
const trustAttributes = ['strength', 'agility', 'intellect', 'will', 'main', 'secondary'] as const;
function toggleTrustAttribute(attribute: (typeof trustAttributes)[number], checked: boolean) {
  if (!props.editable) return;
  const current: readonly string[] = trust.value.attributes;
  const attributes = checked
    ? [...current, attribute]
    : current.filter(value => value !== attribute);
  emit('change', ['trustAttributeBonus'], { ...trust.value, attributes });
}
function updateGrowth(
  attribute: (typeof attributes)[number],
  index: number,
  value: number | undefined,
) {
  if (!props.editable || value === undefined || !Number.isFinite(value) || value < 0) return;
  emit('change', ['attributes', attribute, index], value);
}
function updateTrust(index: number, value: number | undefined) {
  if (!props.editable || value === undefined || !Number.isFinite(value)) return;
  const values = [...trust.value.values];
  values[index] = value;
  emit('change', ['trustAttributeBonus'], { ...trust.value, values });
}
</script>

<template>
  <section class="operator-properties">
    <template v-if="page === 'overview'">
      <h2>{{ t('assetWorkspace.workspace.overview') }}</h2>
      <div class="operator-properties__form">
        <DefinitionField
          v-for="key in basicFields"
          :key="key"
          :name="key"
          :value="definition[key]"
          :schema="fields[key]"
          :path="[key]"
          :editable="editable"
          @change="(path, value) => emit('change', path, value)"
        />
      </div>
      <h2>{{ t('definitionEditor.fields.trustAttributeBonus') }}</h2>
      <div class="operator-properties__trust-targets">
        <EaCheckbox
          v-for="attribute in trustAttributes"
          :key="attribute"
          :model-value="(trust.attributes as readonly string[]).includes(attribute)"
          :disabled="!editable"
          @change="toggleTrustAttribute(attribute, $event)"
        >
          {{
            attribute === 'main' || attribute === 'secondary'
              ? t(`definitionEditor.fields.${attribute}Attribute`)
              : t(`definitionEditor.options.${attribute}`)
          }}
        </EaCheckbox>
      </div>
      <div class="operator-properties__trust">
        <label v-for="(value, index) in trust.values" :key="index">
          <span>{{ t('assetWorkspace.operatorProperties.trustNode', { number: index + 1 }) }}</span>
          <EaNumberInput
            :aria-label="t('assetWorkspace.operatorProperties.trustNode', { number: index + 1 })"
            :model-value="value"
            :disabled="!editable"
            :controls="false"
            @change="updateTrust(index, $event)"
          />
        </label>
      </div>
    </template>
    <template v-else>
      <h2>{{ t('assetWorkspace.workspace.growth') }}</h2>
      <table class="operator-properties__growth">
        <thead>
          <tr>
            <th>{{ t('assetWorkspace.operatorProperties.attribute') }}</th>
            <th v-for="level in levels" :key="level">Lv{{ level }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="attribute in attributes" :key="attribute">
            <th scope="row">{{ t(`assetWorkspace.operatorProperties.${attribute}`) }}</th>
            <td v-for="(level, index) in levels" :key="level">
              <EaNumberInput
                :aria-label="`${t(`assetWorkspace.operatorProperties.${attribute}`)} Lv${level}`"
                :model-value="definition.attributes[attribute][index]"
                :disabled="!editable"
                :controls="false"
                :min="0"
                @change="updateGrowth(attribute, index, $event)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </template>
  </section>
</template>

<style scoped>
.operator-properties {
  max-width: 960px;
}
.operator-properties h2 {
  margin: 0 0 18px;
  font-size: 15px;
}
.operator-properties__form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 32px;
  max-width: 720px;
  margin-bottom: 28px;
}
.operator-properties__growth {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 13px;
}
.operator-properties__growth th {
  height: 34px;
  padding: 4px 8px;
  text-align: left;
  font-weight: 500;
  color: var(--ea-fg-secondary);
}
.operator-properties__growth th:first-child {
  width: 100px;
}
.operator-properties__growth td {
  padding: 6px 8px;
  border-bottom: 1px solid var(--ea-border-soft);
}
.operator-properties__growth :deep(.el-input-number) {
  width: 100%;
}
.operator-properties__trust {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  max-width: 720px;
}
.operator-properties__trust label {
  display: grid;
  gap: 8px;
  font-size: 12px;
}
.operator-properties__trust-targets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 13px;
}
@media (max-width: 900px) {
  .operator-properties__form {
    grid-template-columns: 1fr;
  }
}
</style>
