<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue';
import type {
  ActionGraphDataNode,
  ActionGraphDefinition,
} from '../../../packages/game-data-contract/src/actionGraph';
import { updateResourceGraph } from '../../../src/application/editor/actionGraphResourceEditing';
import { DefinitionDraftSession } from '../../../src/application/editor/definitionDraftSession';
import { setGraphDataInput } from '../../../src/application/editor/graphDataInputEditing';
import DataNodeInspector from '../../../src/ui/action-graph/DataNodeInspector.vue';
import { dataTypedInputs } from '../../../src/ui/action-graph/typedGraphInputs';
import { moveCondition } from '../../../src/ui/field-editor/conditionList';

const initialAll: ActionGraphDataNode = {
  type: 'boolean',
  expression: {
    kind: 'all',
    conditions: [
      { kind: 'constant', value: true },
      { kind: 'conditionNode', nodeId: 'shared' },
      { kind: 'constant', value: false },
    ],
  },
};
const initialGraph: ActionGraphDefinition = {
  nodes: {},
  dataNodes: {
    all: initialAll,
    alias: { ...initialAll },
    any: { type: 'boolean', expression: { kind: 'any', conditions: [] } },
    shared: { type: 'boolean', expression: { kind: 'combatActive' } },
    otherConsumer: {
      type: 'boolean',
      expression: { kind: 'not', condition: { kind: 'conditionNode', nodeId: 'shared' } },
    },
  },
};

// 与资源编辑器共用验证与历史入口；这里只替代弹窗宿主，不替代字段组件。
const session = new DefinitionDraftSession(
  { actionGraph: { main: initialGraph, macros: {} } },
  true,
);
const document = shallowRef(session.current);
const graph = computed(() => document.value.actionGraph.main);
const commits = ref(0);
const attempts = ref(0);
const canUndo = ref(false);
const canRedo = ref(false);
const reject = ref(false);
const readonly = ref(false);
const selectedAllId = ref<'all' | 'alias'>('all');
const error = ref('');
const located = ref('');
const retainedSlot = ref(false);
const pending = ref<Record<string, boolean>>({});
const allInspector = ref<InstanceType<typeof DataNodeInspector>>();
const anyInspector = ref<InstanceType<typeof DataNodeInspector>>();

function syncHistory() {
  document.value = session.current;
  canUndo.value = session.canUndo;
  canRedo.value = session.canRedo;
}

function edit(change: (current: ActionGraphDefinition) => ActionGraphDefinition): boolean {
  attempts.value++;
  if (reject.value) return false;
  try {
    const changed = session.update(owner => updateResourceGraph(owner, { kind: 'main' }, change));
    error.value = '';
    if (changed) commits.value++;
    syncHistory();
    return true;
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason);
    return false;
  }
}

function applyExpression(id: string, expression: unknown): boolean {
  return edit(current => {
    const node = current.dataNodes?.[id];
    if (!node) throw new Error(`Missing fixture data node: ${id}`);
    return {
      ...current,
      dataNodes: {
        ...current.dataNodes,
        [id]: { ...node, expression } as ActionGraphDataNode,
      },
    };
  });
}

function changeInput(
  id: string,
  path: readonly string[],
  source: string | null,
  constant?: number | boolean,
) {
  edit(current => {
    const node = current.dataNodes?.[id];
    const input =
      node && dataTypedInputs(node).find(item => item.path.join('.') === path.join('.'));
    if (!input) throw new Error(`Missing fixture data input: ${id}.${path.join('.')}`);
    return setGraphDataInput(current, 'data', id, input, source, constant);
  });
}

function undo() {
  session.undo();
  syncHistory();
}

function redo() {
  session.redo();
  syncHistory();
}

function applyPending() {
  allInspector.value?.apply();
  anyInspector.value?.apply();
}

function reorderExternally() {
  const original = dataTypedInputs(graph.value.dataNodes!.all!)[0]!.value;
  const changed = edit(current => {
    const node = current.dataNodes?.all;
    if (node?.type !== 'boolean' || node.expression.kind !== 'all')
      throw new Error('Expected the all fixture condition list');
    return {
      ...current,
      dataNodes: {
        ...current.dataNodes,
        all: {
          ...node,
          expression: {
            ...node.expression,
            conditions: moveCondition(node.expression.conditions, 2, 1),
          },
        },
      },
    };
  });
  if (changed)
    retainedSlot.value = dataTypedInputs(graph.value.dataNodes!.all!)[0]!.value === original;
}
</script>

<template>
  <section data-testid="condition-lists">
    <h2>Condition list resource inspector</h2>
    <p>Real definition draft history and graph validation; no project save or canvas host.</p>
    <label><input v-model="reject" type="checkbox" />Reject condition commits</label>
    <label><input v-model="readonly" type="checkbox" />Read-only condition inspector</label>
    <button @click="selectedAllId = 'all'">Select all condition node</button>
    <button @click="selectedAllId = 'alias'">Select alias condition node</button>
    <button :disabled="!canUndo" @click="undo">Undo condition graph</button>
    <button :disabled="!canRedo" @click="redo">Redo condition graph</button>
    <button @click="applyPending">Apply inspector drafts</button>
    <button @click="reorderExternally">Reorder all conditions externally</button>
    <output data-testid="condition-commits">{{ commits }}</output>
    <output data-testid="condition-attempts">{{ attempts }}</output>
    <output data-testid="condition-pending">{{ JSON.stringify(pending) }}</output>
    <output data-testid="condition-located">{{ located }}</output>
    <output data-testid="condition-retained-slot">{{ retainedSlot }}</output>
    <output data-testid="condition-shared-expression">{{
      graph.dataNodes?.all?.expression === graph.dataNodes?.alias?.expression
    }}</output>
    <output data-testid="condition-selected-node">{{ selectedAllId }}</output>
    <output data-testid="condition-shared">{{ JSON.stringify(graph.dataNodes?.shared) }}</output>
    <output data-testid="condition-other">{{
      JSON.stringify(graph.dataNodes?.otherConsumer)
    }}</output>
    <output v-if="error" role="alert">{{ error }}</output>
    <section data-testid="condition-all">
      <DataNodeInspector
        ref="allInspector"
        :node="graph.dataNodes![selectedAllId]!"
        :node-id="selectedAllId"
        :graph="graph"
        :readonly="readonly"
        :apply="expression => applyExpression(selectedAllId, expression)"
        @change-data="
          (path, source, constant) => changeInput(selectedAllId, path, source, constant)
        "
        @locate-data="located = $event"
        @pending="pending[selectedAllId] = $event"
      />
      <output data-testid="condition-all-value">{{
        JSON.stringify(graph.dataNodes?.all?.expression)
      }}</output>
      <output data-testid="condition-alias-value">{{
        JSON.stringify(graph.dataNodes?.alias?.expression)
      }}</output>
    </section>
    <section data-testid="condition-any">
      <DataNodeInspector
        ref="anyInspector"
        :node="graph.dataNodes!.any!"
        node-id="any"
        :graph="graph"
        :apply="expression => applyExpression('any', expression)"
        @change-data="(path, source, constant) => changeInput('any', path, source, constant)"
        @locate-data="located = $event"
        @pending="pending.any = $event"
      />
      <output data-testid="condition-any-value">{{
        JSON.stringify(graph.dataNodes?.any?.expression)
      }}</output>
    </section>
    <section data-testid="condition-readonly">
      <DataNodeInspector
        :node="graph.dataNodes!.all!"
        node-id="all"
        :graph="graph"
        readonly
        :apply="() => false"
        @locate-data="located = $event"
      />
    </section>
  </section>
</template>
