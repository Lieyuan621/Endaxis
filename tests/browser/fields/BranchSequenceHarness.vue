<script setup lang="ts">
import { computed, provide, reactive, ref, shallowRef } from 'vue';
import type { ActionGraphStep } from '../../../packages/game-data-contract/src/actionGraph';
import { DefinitionDraftSession } from '../../../src/application/editor/definitionDraftSession';
import { replaceResourceNodeAction } from '../../../src/application/editor/actionGraphResourceEditing';
import ActionNodeInspector from '../../../src/ui/action-graph/ActionNodeInspector.vue';
import { useResourceGraphEditor } from '../../../src/ui/action-graph/useResourceGraphEditor';
import { createResourceEditorView } from '../../../src/ui/editor/resourceEditorView';
import { blackboardNavigationKey } from '../../../src/ui/field-editor/blackboardFieldContext';
const props = defineProps<{ kind: 'switch' | 'listenForCombatEvents' }>();
const action: ActionGraphStep =
  props.kind === 'switch'
    ? {
        kind: 'switch',
        parameters: { choice: { kind: 'constant', value: 1 }, alwaysNext: true },
        options: [
          { value: { kind: 'constant', value: 1 }, sequence: { $sequence: 'target' } },
          { value: { kind: 'constant', value: 1 }, sequence: { $sequence: 'target' } },
        ],
      }
    : {
        kind: 'listenForCombatEvents',
        parameters: {
          responses: [
            {
              key: 'first',
              event: { kind: 'operatorHit' },
              phase: 'dataAction',
              priority: 0,
              condition: { kind: 'conditionNode', nodeId: 'boolean' },
              sequence: { $sequence: 'target' },
            },
            { key: 'second', event: { kind: 'operatorHit' }, sequence: { $sequence: 'target' } },
          ],
        },
      };
const history = new DefinitionDraftSession(
  {
    scheduledSequences: [{ startFrame: 0, endFrame: 5, sequence: { $sequence: 'source' } }],
    actionGraph: {
      main: {
        nodes: {
          source: { action, next: null },
          target: { action: { kind: 'finishTimeline' as const, parameters: {} }, next: null },
        },
        dataNodes: {
          boolean: {
            type: 'boolean' as const,
            expression: { kind: 'constant' as const, value: true },
          },
        },
      },
      macros: {},
    },
  },
  true,
);
const current = shallowRef(history.current),
  readonly = ref(false),
  commits = ref(0),
  located = ref('');
const view = reactive(createResourceEditorView());
view.selection = { kind: 'action', id: 'source' };
const editor = useResourceGraphEditor({
  view: () => view,
  owner: () => current.value,
  readonly: () => readonly.value,
  presentation: () => undefined,
  identity: () => props.kind,
  label: () => props.kind,
  change: update => {
    history.update(owner => update(owner) as typeof owner);
    current.value = history.current;
    commits.value++;
  },
});
const inspector = editor.inspector,
  graph = computed(() => current.value.actionGraph.main);
provide(blackboardNavigationKey, target => {
  located.value = target.id;
  void editor.locateVariable(target.id, target.owner === 'data');
});
function applyAction(value: unknown) {
  return editor.edit(owner => replaceResourceNodeAction(owner, { kind: 'main' }, 'source', value));
}
function travel(direction: 'undo' | 'redo') {
  if (!editor.canLeaveFields()) return;
  history[direction]();
  current.value = history.current;
}
function disconnectFirst() {
  editor.connect(
    'source',
    props.kind === 'switch'
      ? ['action', 'options', '0', 'sequence', '$sequence']
      : ['action', 'parameters', 'responses', '0', 'sequence', '$sequence'],
    null,
  );
}
</script>
<template>
  <section :data-testid="`sequence-${kind}`">
    <label><input v-model="readonly" type="checkbox" />Readonly branches</label>
    <ActionNodeInspector
      ref="inspector"
      node-id="source"
      :node="graph.nodes.source"
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
    <small v-if="editor.error.value" role="alert">{{ editor.error.value }}</small>
    <button :disabled="readonly" @click="disconnectFirst">Disconnect first sequence</button>
    <button @click="travel('undo')">Undo branches</button
    ><button @click="travel('redo')">Redo branches</button>
    <output data-testid="sequence-state">{{ JSON.stringify(current) }}</output
    ><output data-testid="sequence-commits">{{ commits }}</output
    ><output data-testid="sequence-located">{{ located }}</output>
  </section>
</template>
