<script setup lang="ts">
import { computed, reactive, ref, shallowRef } from 'vue';
import type { ActionGraphStep } from '../../../packages/game-data-contract/src/actionGraph';
import { DefinitionDraftSession } from '../../../src/application/editor/definitionDraftSession';
import { replaceResourceNodeAction } from '../../../src/application/editor/actionGraphResourceEditing';
import ActionNodeInspector from '../../../src/ui/action-graph/ActionNodeInspector.vue';
import DataNodeInspector from '../../../src/ui/action-graph/DataNodeInspector.vue';
import { useResourceGraphEditor } from '../../../src/ui/action-graph/useResourceGraphEditor';
import { createResourceEditorView } from '../../../src/ui/editor/resourceEditorView';
const action = (markerId: string | { kind: 'stringNode'; nodeId: string }): ActionGraphStep => ({
  kind: 'createTimedMarker',
  parameters: {
    target: 'caster',
    markerId,
    durationSeconds: { kind: 'constant', value: 1 },
    autoFinishByAction: false,
  },
});
const history = new DefinitionDraftSession(
  {
    blackboard: { marker: '  exact marker  ' },
    onApply: { $sequence: 'first' },
    actionGraph: {
      main: {
        nodes: {
          first: { action: action('inline'), next: 'second' },
          second: { action: action({ kind: 'stringNode', nodeId: 'shared' }), next: null },
        },
        dataNodes: {
          shared: { type: 'string' as const, expression: { blackboardKey: 'marker' } },
          number: { type: 'number' as const, expression: { kind: 'constant' as const, value: 1 } },
        },
      },
      macros: {},
    },
  },
  true,
);
const current = shallowRef(history.current),
  readonly = ref(false),
  located = ref(''),
  commits = ref(0);
const view = reactive(createResourceEditorView());
view.selection = { kind: 'action', id: 'first' };
const editor = useResourceGraphEditor({
  view: () => view,
  owner: () => current.value,
  readonly: () => readonly.value,
  presentation: () => undefined,
  identity: () => 'string-graph',
  label: () => 'String graph',
  change: update => {
    history.update(owner => update(owner) as typeof owner);
    current.value = history.current;
    commits.value++;
  },
});
const inspector = editor.inspector;
const graph = computed(() => current.value.actionGraph.main);
function applyAction(value: unknown) {
  return editor.edit(owner => replaceResourceNodeAction(owner, { kind: 'main' }, 'first', value));
}
function applyData(expression: unknown) {
  return editor.edit(
    owner =>
      ({
        ...owner,
        actionGraph: {
          ...owner.actionGraph,
          main: {
            ...owner.actionGraph.main,
            dataNodes: {
              ...owner.actionGraph.main.dataNodes,
              shared: { type: 'string', expression },
            },
          },
        },
      }) as typeof owner,
  );
}
function travel(direction: 'undo' | 'redo') {
  if (!editor.canLeaveFields()) return;
  history[direction]();
  current.value = history.current;
}
</script>
<template>
  <section data-testid="string-graph">
    <label><input v-model="readonly" type="checkbox" />Readonly string graph</label>
    <ActionNodeInspector
      ref="inspector"
      node-id="first"
      :node="graph.nodes.first"
      :graph="graph"
      :graph-scope="editor.interactionScope.value"
      :readonly="readonly"
      :blackboard-context="editor.blackboardContext.value"
      :apply-action="applyAction"
      @pending="editor.pending.value = $event"
      @change-data="
        (path, source, constant, snapshot, id) =>
          editor.connectData('action', id, path, source, constant, snapshot)
      "
      @locate-data="located = $event"
    />
    <DataNodeInspector
      node-id="shared"
      :node="graph.dataNodes.shared"
      :graph="graph"
      :readonly="readonly"
      :apply="applyData"
    />
    <small v-if="editor.error.value" role="alert">{{ editor.error.value }}</small>
    <button @click="travel('undo')">Undo string graph</button
    ><button @click="travel('redo')">Redo string graph</button>
    <button @click="editor.removeData('shared')">Delete string source</button>
    <output data-testid="string-graph-state">{{ JSON.stringify(current) }}</output>
    <output data-testid="string-graph-located">{{ located }}</output>
    <output data-testid="string-graph-commits">{{ commits }}</output>
  </section>
</template>
