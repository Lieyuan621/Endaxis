<script setup lang="ts">
import { computed, reactive, ref, shallowRef } from 'vue';
import type { ActionGraphStep } from '../../../packages/game-data-contract/src/actionGraph';
import { DefinitionDraftSession } from '../../../src/application/editor/definitionDraftSession';
import { replaceResourceNodeAction } from '../../../src/application/editor/actionGraphResourceEditing';
import ActionNodeInspector from '../../../src/ui/action-graph/ActionNodeInspector.vue';
import { useResourceGraphEditor } from '../../../src/ui/action-graph/useResourceGraphEditor';
import { createResourceEditorView } from '../../../src/ui/editor/resourceEditorView';
const referenceChoices = {
  buff: {
    family: 'buff',
    complete: true,
    candidates: [
      {
        identity: 'child',
        value: 'child',
        label: 'Child',
        family: 'buff',
        scope: 'shared' as const,
        source: { id: 'test', label: 'Test', kind: 'builtin' as const },
        writable: false,
      },
    ],
  },
};
const action = (): ActionGraphStep => ({
  kind: 'createGlobalBuff',
  parameters: {
    globalBuffId: 'global',
    blackboardAssignments: { ratio: { kind: 'constant', value: 2 } },
    definition: {
      stackingType: 'unlimited',
      blackboard: { ratio: 'not numeric', local: 3 },
      durationSeconds: { blackboardKey: 'ratio' },
      sharedSpModifiers: [
        {
          attribute: 'spRecovery',
          operation: 'addition',
          applyToReturnSpGain: false,
          value: { kind: 'valueNode', nodeId: 'shared' },
        },
      ],
      children: [
        { buffId: 'child', blackboardAssignments: { amount: { kind: 'constant', value: 3 } } },
      ],
    },
  },
});
const history = new DefinitionDraftSession(
  {
    blackboard: { ratio: 99, creatorOnly: 8 },
    onApply: { $sequence: 'damage' },
    actionGraph: {
      main: {
        nodes: {
          damage: { action: action(), next: 'other' },
          other: {
            action: {
              kind: 'dealStagger' as const,
              parameters: { value: { kind: 'valueNode' as const, nodeId: 'shared' } },
            },
            next: null,
          },
        },
        dataNodes: {
          shared: {
            type: 'number' as const,
            expression: { kind: 'blackboard' as const, key: 'ratio' },
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
view.selection = { kind: 'action', id: 'damage' };
const editor = useResourceGraphEditor({
  view: () => view,
  owner: () => current.value,
  readonly: () => readonly.value,
  presentation: () => undefined,
  identity: () => 'global-definition',
  label: () => 'Global definition',
  change: update => {
    history.update(owner => update(owner) as typeof owner);
    current.value = history.current;
    commits.value++;
  },
});
const inspector = editor.inspector;
const graph = computed(() => current.value.actionGraph.main);
function applyAction(action: unknown) {
  return editor.edit(owner => replaceResourceNodeAction(owner, { kind: 'main' }, 'damage', action));
}
function travel(direction: 'undo' | 'redo') {
  if (!editor.canLeaveFields()) return;
  history[direction]();
  current.value = history.current;
}
</script>
<template>
  <section data-testid="global-buff-definition">
    <label><input v-model="readonly" type="checkbox" />Readonly GlobalBuff</label>
    <ActionNodeInspector
      ref="inspector"
      node-id="damage"
      :node="graph.nodes.damage"
      :graph="graph"
      :readonly="readonly"
      :blackboard-context="editor.blackboardContext.value"
      :apply-action="applyAction"
      :reference-choices="referenceChoices"
      @pending="editor.pending.value = $event"
      @change-data="
        (path, source, constant) => editor.connectData('action', 'damage', path, source, constant)
      "
      @locate-data="located = $event"
    />
    <small v-if="editor.error.value" role="alert">{{ editor.error.value }}</small>
    <button @click="travel('undo')">Undo GlobalBuff</button
    ><button @click="travel('redo')">Redo GlobalBuff</button>
    <output data-testid="graph-operand-state">{{ JSON.stringify(current) }}</output>
    <output data-testid="graph-operand-commits">{{ commits }}</output>
    <output data-testid="graph-operand-located">{{ located }}</output>
  </section>
</template>
