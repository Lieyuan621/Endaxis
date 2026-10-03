<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue';
import type { DamageModifierCondition } from '../../../packages/game-data-contract/src/modifiers';
import {
  WorkspaceAssetSession,
  type WorkspaceAssetSource,
} from '../../../src/ui/asset-workspace/workspaceSession';
import { definitionSchemas } from '../../../src/ui/definition-editor/definitionSchemas.generated';
import { fieldSchemaForValue } from '../../../src/ui/definition-editor/definitionFieldRuntime';
import type { DefinitionFieldSchema } from '../../../src/ui/definition-editor/fieldSchema';
import DefinitionField from '../../../src/ui/definition-editor/DefinitionField.vue';
let condition: DamageModifierCondition = {
  kind: 'buffBlackboardCompare',
  left: 1,
  operator: 'equal',
  right: 2,
};
for (let depth = 0; depth < 12; depth++) condition = { kind: 'not', condition };
const source: WorkspaceAssetSource = {
  id: 'globalEffect:deep-fields',
  kind: 'globalEffect',
  kindName: 'Global effect',
  name: 'Deep fields',
  custom: false,
  edit: {
    kind: 'globalEffect',
    definition: {
      id: 'deep-fields',
      buff: {
        stackingType: 'unlimited',
        damageModifiers: [
          {
            enabledSide: 'attacker',
            processors: [{ kind: 'damageScale', side: 'attacker', zone: 'normal', addition: 1 }],
            condition,
          },
        ],
      },
    },
  },
};
const session = new WorkspaceAssetSession(source, 'project:globalEffect:deep-fields');
const state = shallowRef(session.current);
const readonly = ref(false);
const buff = computed(() =>
  state.value.edit.kind === 'globalEffect' ? state.value.edit.definition.buff : undefined,
);
const root: DefinitionFieldSchema = definitionSchemas.buff;
const shape = fieldSchemaForValue(root, buff.value);
if (shape.kind !== 'object') throw new Error('expected Buff schema');
const schema: DefinitionFieldSchema = {
  ...shape.fields.damageModifiers!,
  optional: false,
  references: root.references,
};
function change(path: readonly (string | number)[], value: unknown) {
  session.change(['buff', ...path], value);
  state.value = session.current;
}
function undo() {
  session.history.undo();
  state.value = session.current;
}
function redo() {
  session.history.redo();
  state.value = session.current;
}
</script>
<template>
  <section data-testid="finite-references">
    <h2>Recursive generated fields</h2>
    <label><input v-model="readonly" type="checkbox" />Readonly deep fields</label>
    <DefinitionField
      name="damageModifiers"
      :schema="schema"
      :value="buff?.damageModifiers"
      :path="['damageModifiers']"
      :editable="!readonly"
      :expand-depth="99"
      root
      @change="change"
    />
    <button @click="undo">Undo deep edit</button><button @click="redo">Redo deep edit</button>
    <output data-testid="finite-reference-value">{{
      JSON.stringify(buff?.damageModifiers)
    }}</output>
  </section>
</template>
