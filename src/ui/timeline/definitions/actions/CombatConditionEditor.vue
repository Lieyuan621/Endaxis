<script setup lang="ts">
import { computed, defineAsyncComponent, inject, provide } from 'vue';
import { definitionPropertyKey } from '../definitionEditContext';
import { useI18n } from 'vue-i18n';
import {
  COMBAT_CONDITION_KINDS,
  type CombatCondition,
  type CombatConditionKind,
} from '../../../../core/game-data/operatorDefinition';
import { createCombatCondition } from './combatConditionEditorViewModel';
import { conditionInspectorFields } from '../inspector/conditionInspectorSchema';
import { validateComparisonInspector } from '../inspector/combatInspectorFields';
import InspectorFields from '../inspector/InspectorFields.vue';
import { createInspectorField } from '../inspector/inspectorFields';
import type { InspectorPropertyPath } from '../inspector/inspectorProperty';

const Workspace = defineAsyncComponent(() => import('./CombatConditionWorkspace.vue'));
const definitionProperty = inject(definitionPropertyKey, undefined);
provide(definitionPropertyKey, undefined);
const props = defineProps<{
  condition: CombatCondition;
  layerOnly?: boolean;
  restoredPropertyPath?: InspectorPropertyPath;
}>();
const emit = defineEmits<{
  update: [condition: CombatCondition, propertyPath?: InspectorPropertyPath];
}>();
const { t } = useI18n({ useScope: 'global' });
const automaticFields = computed(() => conditionInspectorFields(props.condition.kind));
// 类型切换是替换整个条件的显式命令，仍通过同一个字段句柄和宿主历史提交。
const kindField = createInspectorField<CombatCondition>('kind', {
  editor: 'enum',
  options: COMBAT_CONDITION_KINDS,
  labelKey: 'timeline.skillEditing.conditionKind',
  helpKey: 'timeline.skillEditing.fieldHelp.conditionKind',
  optionLabelPrefix: 'timeline.skillEditing.conditionKinds.',
  replace: (_, kind) => createCombatCondition(kind as CombatConditionKind),
});
const fields = computed(() => [kindField, ...(automaticFields.value ?? [])]);
</script>
<template>
  <Workspace
    :restored-property-path="restoredPropertyPath"
    v-if="!layerOnly"
    :condition="condition"
    @update="(next, path) => emit('update', next, path)"
  />
  <section v-else class="condition-editor">
    <InspectorFields
      :binding="definitionProperty"
      :value="condition"
      :fields="fields"
      :validate="validateComparisonInspector"
      @update="(next, path) => emit('update', next, path)"
    />
    <p
      v-if="
        automaticFields?.length === 0 &&
        !(condition.kind === 'not' || condition.kind === 'all' || condition.kind === 'any')
      "
      class="condition-editor__note"
    >
      {{ t('timeline.skillEditing.conditionNoParameters') }}
    </p>
    <p
      v-if="condition.kind === 'not' || condition.kind === 'all' || condition.kind === 'any'"
      class="condition-editor__note"
    >
      {{ t('timeline.skillEditing.conditionStructureInGraph') }}
    </p>
    <p v-else-if="!automaticFields" class="condition-editor__note">
      {{ t('timeline.skillEditing.unsupportedConditionStructure') }}
    </p>
  </section>
</template>

<style scoped>
.condition-editor {
  min-width: 0;
  display: grid;
  gap: 9px;
  padding: 10px;
  border: 1px solid var(--ea-border-soft);
}
.condition-editor__note {
  margin: 0;
  color: var(--ea-fg-muted);
  font-size: 11px;
}
</style>
