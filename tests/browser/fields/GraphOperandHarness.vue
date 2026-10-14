<script setup lang="ts">
import { computed, reactive, ref, shallowRef } from 'vue';
import type { ActionGraphStep } from '../../../packages/game-data-contract/src/actionGraph';
import type { ActionValueOperand } from '../../../packages/game-data-contract/src/conditions';
import { DefinitionDraftSession } from '../../../src/application/editor/definitionDraftSession';
import { replaceResourceNodeAction } from '../../../src/application/editor/actionGraphResourceEditing';
import ActionNodeInspector from '../../../src/ui/action-graph/ActionNodeInspector.vue';
import { useResourceGraphEditor } from '../../../src/ui/action-graph/useResourceGraphEditor';
import { createResourceEditorView } from '../../../src/ui/editor/resourceEditorView';
const props = defineProps<{
  field:
    | 'instantAttributeModifiers'
    | 'instantDamageScaleModifiers'
    | 'keywordEnhancements'
    | 'buffs'
    | 'items';
}>();
const referenceChoices = {
  buff: {
    family: 'buff',
    complete: true,
    candidates: [
      {
        identity: 'buff',
        value: 'buff',
        label: 'Buff',
        family: 'buff',
        scope: 'shared' as const,
        source: { id: 'test', label: 'Test', kind: 'builtin' as const },
        writable: false,
      },
    ],
  },
};
const action = (connected: boolean): ActionGraphStep => {
  const value: ActionValueOperand = connected
    ? { kind: 'valueNode', nodeId: 'shared' }
    : { kind: 'constant', value: 1 };
  switch (props.field) {
    case 'instantAttributeModifiers':
      return {
        kind: 'dealDamage',
        parameters: {
          damageType: 'physical',
          attackScale: 1,
          tags: [],
          instantAttributeModifiers: [
            {
              targetSide: 'attacker',
              attribute: 'Atk',
              slot: 'baseAddition',
              attributeTiming: 'runtime',
              value,
            },
          ],
        },
      };
    case 'instantDamageScaleModifiers':
      return {
        kind: 'dealDamage',
        parameters: {
          damageType: 'physical',
          attackScale: 1,
          tags: [],
          instantDamageScaleModifiers: [{ side: 'attacker', zone: 'normal', addition: value }],
        },
      };
    case 'keywordEnhancements':
    case 'buffs':
      return {
        kind: 'applyBuff',
        parameters: {
          targets: { kind: 'owner' },
          finishByAction: true,
          buffs: [
            {
              buffId: 'buff',
              ...(props.field === 'keywordEnhancements'
                ? { keywordEnhancements: [{ triggerBuffIds: ['buff'], operation: 'add', value }] }
                : { blackboardAssignments: { amount: value } }),
            },
          ],
        },
      };
    case 'items':
      return {
        kind: 'readSkillSettingData',
        parameters: { items: [{ values: [1, 2, 3, 4], column: value, storeKey: 'result' }] },
      };
  }
};
const history = new DefinitionDraftSession(
  {
    blackboard: { rate: 2 },
    onApply: { $sequence: 'damage' },
    actionGraph: {
      main: {
        nodes: {
          damage: { action: action(false), next: 'other' },
          other: { action: action(true), next: null },
        },
        dataNodes: {
          shared: {
            type: 'number' as const,
            expression: { kind: 'blackboard' as const, key: 'rate' },
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
  identity: () => props.field,
  label: () => props.field,
  change: update => {
    history.update(owner => update(owner) as typeof owner);
    current.value = history.current;
    commits.value++;
  },
});
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
  <section :data-testid="`graph-operand-${field}`">
    <label><input v-model="readonly" type="checkbox" />Readonly graph operands</label>
    <ActionNodeInspector
      :ref="
        value =>
          (editor.inspector.value = value
            ? (value as InstanceType<typeof ActionNodeInspector>)
            : undefined)
      "
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
    <button @click="travel('undo')">Undo modifiers</button
    ><button @click="travel('redo')">Redo modifiers</button>
    <output data-testid="graph-operand-state">{{ JSON.stringify(current) }}</output>
    <output data-testid="graph-operand-commits">{{ commits }}</output>
    <output data-testid="graph-operand-located">{{ located }}</output>
  </section>
</template>
