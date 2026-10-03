<script setup lang="ts">
import { shallowRef, ref } from 'vue';
import NodeInspectorFields from '@/ui/action-graph/NodeInspectorFields.vue';
import { actionNodeSchemas } from '@/ui/action-graph/actionNodeSchemas.generated';
import { DefinitionDraftSession } from '@/application/editor/definitionDraftSession';
const history = new DefinitionDraftSession(
  { parameters: { tags: ['Custom/One', 'Custom/One'] } },
  true,
);
const value = shallowRef(history.current);
const readonly = ref(false);
const field = actionNodeSchemas.heal.fields.find(f => f.path.at(-1) === 'tags')!;
function apply(next: unknown) {
  history.update(() => next as typeof value.value);
  value.value = history.current;
  return true;
}
function undo() {
  history.undo();
  value.value = history.current;
}
function redo() {
  history.redo();
  value.value = history.current;
}
</script>
<template>
  <section data-testid="tag-collection">
    <button @click="readonly = !readonly">Toggle tags readonly</button>
    <button @click="undo">Undo tags</button><button @click="redo">Redo tags</button>
    <NodeInspectorFields
      kind="heal"
      :value="value"
      :fields="[field]"
      :readonly="readonly"
      :apply-value="apply"
    />
    <pre data-testid="tag-state">{{ JSON.stringify(value) }}</pre>
  </section>
</template>
