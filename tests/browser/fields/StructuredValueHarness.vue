<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue';
import type {
  ActionGraphDefinition,
  ActionGraphStep,
} from '../../../packages/game-data-contract/src/actionGraph';
import { DefinitionDraftSession } from '../../../src/application/editor/definitionDraftSession';
import { updateResourceGraph } from '../../../src/application/editor/actionGraphResourceEditing';
import { validateActionGraphStepDefinition } from '../../../src/core/game-data/validation/actionPrograms';
import { actionNodeSchemas } from '../../../src/ui/action-graph/actionNodeSchemas.generated';
import NodeInspectorFields from '../../../src/ui/action-graph/NodeInspectorFields.vue';

const graph: ActionGraphDefinition = {
  nodes: {
    query: {
      action: {
        kind: 'findCharacterTeamTargets',
        parameters: {
          saveToContextKey: 'team',
          selection: { kind: 'lowestHealthRatioOperator', excludeCaster: true },
        },
      },
      next: 'sibling',
    },
    sibling: {
      action: {
        kind: 'setContextFlag',
        parameters: { flag: 'keep', value: true, target: 'caster' },
      },
      next: null,
    },
  },
};
const history = new DefinitionDraftSession({ actionGraph: { main: graph, macros: {} } }, true);
const current = shallowRef(history.current);
const readonly = ref(false);
const reject = ref(false);
const pending = ref(false);
const commits = ref(0);
const attempts = ref(0);
const node = computed(() => current.value.actionGraph.main.nodes.query!.action);
const selection = actionNodeSchemas.findCharacterTeamTargets.fields.find(
  field => field.path.at(-1) === 'selection',
)!;
function apply(value: unknown): boolean {
  attempts.value++;
  if (reject.value || validateActionGraphStepDefinition(value, 'action').length) return false;
  history.update(owner =>
    updateResourceGraph(owner, { kind: 'main' }, graph => ({
      ...graph,
      nodes: { ...graph.nodes, query: { ...graph.nodes.query!, action: value as ActionGraphStep } },
    })),
  );
  current.value = history.current;
  commits.value++;
  return true;
}
function undo() {
  history.undo();
  current.value = history.current;
}
function redo() {
  history.redo();
  current.value = history.current;
}
</script>
<template>
  <section data-testid="structured-query">
    <h2>Structured query</h2>
    <label><input v-model="readonly" type="checkbox" />Read-only structured inspector</label>
    <label><input v-model="reject" type="checkbox" />Reject structured commits</label>
    <NodeInspectorFields
      :value="node"
      kind="findCharacterTeamTargets"
      :fields="[selection]"
      :readonly="readonly"
      :apply-value="apply"
      @pending="pending = $event"
    />
    <button :disabled="!history.canUndo" @click="undo">Undo structure</button>
    <button :disabled="!history.canRedo" @click="redo">Redo structure</button>
    <output data-testid="structured-state">{{ JSON.stringify(current) }}</output>
    <output data-testid="structured-commits">{{ commits }}</output>
    <output data-testid="structured-attempts">{{ attempts }}</output>
    <output data-testid="structured-pending">{{ pending }}</output>
  </section>
</template>
