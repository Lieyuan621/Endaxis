<script setup lang="ts">
import { computed, provide, ref, shallowRef } from 'vue';
import DefinitionField from '@/ui/definition-editor/DefinitionField.vue';
import { definitionSchemas } from '@/ui/definition-editor/definitionSchemas.generated';
import { fieldSchemaForValue } from '@/ui/definition-editor/definitionFieldRuntime';
import type { DefinitionFieldSchema } from '@/ui/definition-editor/fieldSchema';
import {
  WorkspaceAssetSession,
  type WorkspaceAssetSource,
} from '@/ui/asset-workspace/workspaceSession';
import { inlineConditionBlackboardContext } from '@/application/editor/inlineConditionContext';
import { definitionConditionContextKey } from '@/ui/field-editor/inlineConditionContext';
const source: WorkspaceAssetSource = {
  id: 'gearSet:inline-condition',
  kind: 'gearSet',
  kindName: 'Gear set',
  name: 'Inline condition',
  custom: false,
  edit: {
    kind: 'gearSet',
    definition: {
      slug: 'inline-condition',
      blackboard: { rate: 2 },
      actionGraph: { main: { nodes: {} }, macros: {} },
      eventHandlers: [
        {
          key: 'listener',
          event: { kind: 'operatorHit' },
          sequence: { $sequence: null },
          condition: {
            kind: 'actionValueCompare',
            left: { kind: 'blackboard', key: 'rate' },
            operator: 'greater',
            right: { kind: 'constant', value: 1 },
          },
        },
      ],
    },
  },
};
const session = new WorkspaceAssetSession(source, 'project:gearSet:inline-condition');
const state = shallowRef(session.current);
const definition = computed(() =>
  state.value.edit.kind === 'gearSet' ? state.value.edit.definition : undefined,
);
provide(
  definitionConditionContextKey,
  computed(() => inlineConditionBlackboardContext('gearSet', definition.value)),
);
const root: DefinitionFieldSchema = definitionSchemas.gearSet;
const fields = fieldSchemaForValue(root, definition.value);
if (fields.kind !== 'object' || fields.fields.eventHandlers?.kind !== 'array')
  throw new Error('expected handlers');
const handler = fieldSchemaForValue(
  fields.fields.eventHandlers.element,
  definition.value!.eventHandlers![0],
  undefined,
  root.references,
);
if (handler.kind !== 'object') throw new Error('expected handler');
const schema = { ...handler.fields.condition!, references: root.references };
const readonly = ref(false);
const commits = ref(0);
function change(path: readonly (string | number)[], value: unknown) {
  session.change(path, value);
  state.value = session.current;
  commits.value++;
}
function history(direction: 'undo' | 'redo') {
  session.history[direction]();
  state.value = session.current;
}
</script>
<template>
  <section data-testid="inline-condition-panel">
    <label><input v-model="readonly" type="checkbox" />Readonly inline condition</label>
    <DefinitionField
      name="condition"
      :schema="schema"
      :value="definition?.eventHandlers?.[0]?.condition"
      :path="['eventHandlers', 0, 'condition']"
      :editable="!readonly"
      root
      @change="change"
    />
    <button @click="history('undo')">Undo inline condition</button
    ><button @click="history('redo')">Redo inline condition</button>
    <output data-testid="inline-condition-state">{{
      JSON.stringify(definition?.eventHandlers?.[0]?.condition)
    }}</output>
    <output data-testid="inline-condition-commits">{{ commits }}</output>
  </section>
</template>
