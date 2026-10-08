<script setup lang="ts">
import StringGraphHarness from './StringGraphHarness.vue';
import SpawnResourceHarness from './SpawnResourceHarness.vue';
import BranchSequenceHarness from './BranchSequenceHarness.vue';
import TimeScaleCurveHarness from './TimeScaleCurveHarness.vue';
import { computed, provide, ref, shallowRef } from 'vue';
import {
  referenceCatalog,
  referenceCandidate,
} from '../../../src/ui/field-editor/referenceTestFixtures';
import StringOperandField from '../../../src/ui/field-editor/StringOperandField.vue';
import ReferenceField from '../../../src/ui/field-editor/ReferenceField.vue';
import { referenceNavigationKey } from '../../../src/ui/field-editor/referenceNavigation';
import type { ReferenceCatalog } from '../../../src/application/editor/referenceResolver';
import DefinitionField from '../../../src/ui/definition-editor/DefinitionField.vue';
import DefinitionValueCreator from '../../../src/ui/definition-editor/DefinitionValueCreator.vue';
import NodeInspectorFields from '../../../src/ui/action-graph/NodeInspectorFields.vue';
import type { DefinitionFieldSchema } from '../../../src/ui/definition-editor/fieldSchema';
import type { NodeFieldSchema } from '../../../src/ui/action-graph/nodeSchema';
import StringCollectionHarness from './StringCollectionHarness.vue';
import NativeIdHarness from './NativeIdHarness.vue';
import GlobalBuffHarness from './GlobalBuffHarness.vue';
import GraphOperandHarness from './GraphOperandHarness.vue';
import ConditionListHarness from './ConditionListHarness.vue';
import StructuredValueHarness from './StructuredValueHarness.vue';

const stringOperand = shallowRef<unknown>('stale-id');
// This host deliberately models state/history only, not the application's command history.
const schemas = {
  union: { kind: 'union', variants: [{ kind: 'string' }, { kind: 'null' }] },
  optional: { kind: 'string', optional: true },
  array: { kind: 'array', element: { kind: 'string' } },
  record: { kind: 'record', value: { kind: 'string' } },
} satisfies Record<string, DefinitionFieldSchema>;
const state = shallowRef<Record<string, unknown>>({
  union: 'stale-id',
  optional: 'stale-id',
  array: ['stale-id'],
  record: { first: 'stale-id' },
});
const history: Record<string, unknown>[] = [];
const commits = ref(0);
const catalog = ref<'available' | 'empty' | 'unknown'>('available');
const choices = computed(() =>
  catalog.value === 'unknown'
    ? undefined
    : {
        buff: referenceCatalog('buff', catalog.value === 'empty' ? [] : ['known']),
      },
);
const scopeMode = ref<'valid' | 'collision' | 'invisible'>('valid');
const visits = ref(0);
provide(referenceNavigationKey, () => {
  visits.value++;
});
const scopedChoices = computed<ReferenceCatalog>(() => {
  const candidate = referenceCandidate('known', 'buff', {
    owner: 'owner-a',
    scope: 'owner',
    writable: false,
    target: { assetId: 'builtin', resourcePath: ['buffs', 0] },
  });
  return {
    family: 'buff',
    complete: true,
    owner: scopeMode.value === 'invisible' ? 'owner-b' : 'owner-a',
    candidates:
      scopeMode.value === 'collision'
        ? [
            candidate,
            {
              ...candidate,
              identity: 'builtin:known',
              source: { id: 'builtin', label: 'Built-in', kind: 'builtin' },
            },
          ]
        : [candidate],
  };
});
function replace(current: unknown, path: readonly (string | number)[], value: unknown): unknown {
  if (!path.length) return value;
  const [key, ...rest] = path;
  if (Array.isArray(current)) {
    const copy = [...current];
    copy[Number(key)] = replace(copy[Number(key)], rest, value);
    return copy;
  }
  const copy = { ...(current as Record<string, unknown>) };
  if (!rest.length && value === undefined) delete copy[key!];
  else copy[key!] = replace(copy[key!], rest, value);
  return copy;
}
function change(path: readonly (string | number)[], value: unknown) {
  history.push(state.value);
  state.value = replace(state.value, path, value) as Record<string, unknown>;
  commits.value++;
}
function undo() {
  const previous = history.pop();
  if (previous) state.value = previous;
}
const creatorOpen = ref(false);
const created = shallowRef<unknown>(null);
const creatorSchema: DefinitionFieldSchema = {
  kind: 'union',
  variants: [{ kind: 'string' }, { kind: 'null' }],
};
const node = shallowRef<unknown>({ buffId: 'stale-id', amount: 1 });
const nodeCommits = ref(0);
const rejectNode = ref(false);
const pending = ref(false);
const fields: NodeFieldSchema[] = [
  {
    path: ['buffId'],
    description: '',
    control: 'string',
    valueSchema: { kind: 'string', referenceKind: 'buff' },
  },
  { path: ['amount'], description: '', control: 'number', valueSchema: { kind: 'number' } },
];
function applyNode(value: unknown) {
  if (rejectNode.value) return false;
  node.value = value;
  nodeCommits.value++;
  return true;
}
</script>
<template>
  <main>
    <h1>Real field components</h1>
    <p>Fixture state/history only; this is not application command-history E2E coverage.</p>
    <button @click="catalog = 'available'">Available catalog</button>
    <button @click="catalog = 'empty'">Empty catalog</button>
    <button @click="catalog = 'unknown'">Unknown catalog</button>
    <button @click="undo">Host undo</button>
    <output data-testid="state">{{ JSON.stringify(state) }}</output>
    <output data-testid="commits">{{ commits }}</output>
    <section v-for="(schema, name) in schemas" :key="name" :data-testid="name">
      <h2>{{ name }}</h2>
      <DefinitionField
        :name="name"
        :schema="schema"
        :value="state[name]"
        :path="[name]"
        reference-kind="buff"
        :reference-choices="choices"
        editable
        root
        @change="change"
      />
    </section>
    <section data-testid="scoped-reference">
      <button @click="scopeMode = 'valid'">Unique target</button>
      <button @click="scopeMode = 'collision'">Duplicate target</button>
      <button @click="scopeMode = 'invisible'">Invisible target</button>
      <ReferenceField
        label="Read-only buff"
        reference-kind="buff"
        value="known"
        :choices="scopedChoices"
        disabled
      />
      <output data-testid="navigation-count">{{ visits }}</output>
    </section>
    <section data-testid="creator">
      <h2>Creator</h2>
      <button @click="creatorOpen = true">Open creator</button>
      <DefinitionValueCreator
        v-if="creatorOpen"
        :schema="creatorSchema"
        editable
        reference-kind="buff"
        :reference-choices="choices"
        @cancel="creatorOpen = false"
        @create="
          created = $event;
          creatorOpen = false;
        "
      />
      <output data-testid="created">{{ JSON.stringify(created) }}</output>
    </section>
    <section data-testid="node">
      <h2>Node inspector</h2>
      <label><input v-model="rejectNode" type="checkbox" />Reject node commits</label>
      <NodeInspectorFields
        :value="node"
        kind="applyBuff"
        :fields="fields"
        :reference-choices="choices"
        :apply-value="applyNode"
        @pending="pending = $event"
      />
      <output data-testid="node-value">{{ JSON.stringify(node) }}</output>
      <output data-testid="node-commits">{{ nodeCommits }}</output>
      <output data-testid="node-pending">{{ pending }}</output>
    </section>
    <section data-testid="string-operand">
      <h2>String operand</h2>
      <StringOperandField
        :value="stringOperand"
        label="Dynamic Buff"
        editable
        required
        reference-kind="buff"
        :reference-choices="choices"
        @change="stringOperand = $event"
      />
      <output data-testid="string-operand-value">{{ JSON.stringify(stringOperand) }}</output>
    </section>
    <ConditionListHarness />
    <StringCollectionHarness />
    <NativeIdHarness />
    <GraphOperandHarness field="instantAttributeModifiers" />
    <GraphOperandHarness field="instantDamageScaleModifiers" />
    <GraphOperandHarness field="keywordEnhancements" />
    <GraphOperandHarness field="onActionEndBuffs" />
    <GraphOperandHarness field="items" />
    <StringGraphHarness />
    <GlobalBuffHarness />
    <SpawnResourceHarness />
    <BranchSequenceHarness kind="switch" />
    <BranchSequenceHarness kind="listenForCombatEvents" />
    <StructuredValueHarness />
    <TimeScaleCurveHarness />
  </main>
</template>
<style>
body {
  margin: 20px;
}
main {
  max-width: 700px;
}
section {
  margin: 16px 0;
}
output {
  display: block;
  white-space: pre-wrap;
}
button {
  margin: 4px;
}
</style>
