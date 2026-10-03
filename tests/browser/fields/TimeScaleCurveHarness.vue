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
    curve: {
      next: null,
      action: {
        kind: 'startTimeDilation',
        parameters: {
          scope: 'global',
          slot: 'Test/Time',
          priority: 1,
          durationSeconds: { kind: 'constant', value: 1 },
          finishByAction: false,
          ignoredTargets: [],
          curve: {
            kind: 'inline',
            keys: [
              {
                time: 0,
                value: 1,
                inTangent: Infinity,
                outTangent: -Infinity,
                weightedMode: 0,
                inWeight: -2,
                outWeight: 4,
              },
              {
                time: 1,
                value: 0.5,
                inTangent: 0,
                outTangent: 0,
                weightedMode: 0,
                inWeight: 1 / 3,
                outWeight: 1 / 3,
              },
            ],
          },
        },
      },
    },
  },
};
const history = new DefinitionDraftSession({ actionGraph: { main: graph, macros: {} } }, true);
const current = shallowRef(history.current);
const readonly = ref(false);
const reject = ref(false);
const commits = ref(0);
const pending = ref(false);
const node = computed(() => current.value.actionGraph.main.nodes.curve!.action);
const curve = computed(() =>
  node.value.kind === 'startTimeDilation' ? node.value.parameters.curve : undefined,
);
const summary = computed(() =>
  curve.value?.kind === 'named'
    ? curve.value.key
    : curve.value?.keys
        .map(
          key =>
            `time=${key.time} value=${key.value} in=${key.inTangent} out=${key.outTangent} mode=${key.weightedMode} weights=${key.inWeight},${key.outWeight}`,
        )
        .join('; '),
);
const field = actionNodeSchemas.startTimeDilation.fields.find(
  field => field.path.at(-1) === 'curve',
)!;
function apply(value: unknown): boolean {
  if (reject.value || validateActionGraphStepDefinition(value, 'action').length) return false;
  history.update(owner =>
    updateResourceGraph(owner, { kind: 'main' }, graph => ({
      ...graph,
      nodes: { ...graph.nodes, curve: { ...graph.nodes.curve!, action: value as ActionGraphStep } },
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
  <section data-testid="time-scale-curve-panel">
    <h2>Time multiplier curve</h2>
    <label><input v-model="readonly" type="checkbox" />Read-only curve inspector</label>
    <label><input v-model="reject" type="checkbox" />Reject curve commits</label>
    <NodeInspectorFields
      :value="node"
      kind="startTimeDilation"
      :fields="[field]"
      :readonly="readonly"
      :apply-value="apply"
      @pending="pending = $event"
    />
    <button :disabled="!history.canUndo" @click="undo">Undo curve</button>
    <button :disabled="!history.canRedo" @click="redo">Redo curve</button>
    <output data-testid="curve-state">{{ summary }}</output>
    <output data-testid="curve-commits">{{ commits }}</output>
    <output data-testid="curve-pending">{{ pending }}</output>
  </section>
</template>
