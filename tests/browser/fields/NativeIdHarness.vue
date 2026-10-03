<script setup lang="ts">
import { shallowRef, ref } from 'vue';
import NodeInspectorFields from '@/ui/action-graph/NodeInspectorFields.vue';
import { actionNodeSchemas } from '@/ui/action-graph/actionNodeSchemas.generated';
import { DefinitionDraftSession } from '@/application/editor/definitionDraftSession';
import { replaceResourceNodeAction } from '@/application/editor/actionGraphResourceEditing';
const history = new DefinitionDraftSession(
  {
    actionGraph: {
      main: {
        nodes: {
          finish: {
            action: {
              kind: 'finishGlobalBuffsById' as const,
              parameters: { globalBuffIds: ['unknown', 'unknown'], reason: 'other' as const },
            },
            next: null,
          },
        },
      },
      macros: {},
    },
  },
  true,
);
const value = shallowRef(history.current.actionGraph.main.nodes.finish.action);
const readonly = ref(false);
const commits = ref(0);
function apply(action: unknown) {
  const accepted = history.update(owner =>
    replaceResourceNodeAction(owner, { kind: 'main' }, 'finish', action),
  );
  value.value = history.current.actionGraph.main.nodes.finish.action;
  if (accepted) commits.value++;
  return accepted;
}
function moveHistory(direction: 'undo' | 'redo') {
  history[direction]();
  value.value = history.current.actionGraph.main.nodes.finish.action;
}
</script>
<template>
  <section data-testid="native-id-query">
    <label><input v-model="readonly" type="checkbox" />Readonly native IDs</label>
    <button @click="moveHistory('undo')">Undo native IDs</button>
    <button @click="moveHistory('redo')">Redo native IDs</button>
    <NodeInspectorFields
      kind="finishGlobalBuffsById"
      :value="value"
      :fields="actionNodeSchemas.finishGlobalBuffsById.fields"
      :readonly="readonly"
      :reference-choices="{}"
      :apply-value="apply"
    />
    <pre data-testid="native-id-state">{{ JSON.stringify(value) }}</pre>
    <output data-testid="native-id-commits">{{ commits }}</output>
  </section>
</template>
