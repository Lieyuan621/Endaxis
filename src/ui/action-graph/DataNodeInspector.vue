<script setup lang="ts">
import type { GraphInteractionSnapshot } from './graphInteractionSnapshot';
import type { ActionGraphDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { BlackboardFieldContext } from '@/application/editor/blackboardFieldContext';
import { isConditionListField } from '../field-editor/conditionListSchema';
import GraphDataInputs from './GraphDataInputs.vue';
import { dataTypedInputs } from './typedGraphInputs';
import type { ReferenceChoices } from '../definition-editor/fieldInputConfig';
/** 数据节点参数编辑；数据来源只能通过图上的数据引脚替换。 */
import { computed, ref } from 'vue';
import type { ActionGraphDataNode } from '../../../packages/game-data-contract/src/actionGraph';
import { dataNodeKind } from './nodePresentation';
import { dataNodeSchemas } from './actionNodeSchemas.generated';
import { listDataInputs } from '../../core/action-graph/actionGraphDataNodes';
import { readNodeField } from './nodeFieldValues';
import { nodeName, nodeHelp } from './editorNodeText';
import NodeInspector from './NodeInspector.vue';
import type { BlackboardScope } from '../../application/editor/graphBlackboard';
import NodeInspectorFields from './NodeInspectorFields.vue';
const props = defineProps<{
  referenceChoices?: ReferenceChoices;
  blackboardContext?: BlackboardFieldContext;
  graph?: ActionGraphDefinition;
  graphScope?: string;
  readonly?: boolean;
  node: ActionGraphDataNode;
  nodeId: string;
  scopes?: readonly BlackboardScope[];
  scopeWarnings?: readonly string[];
  variableKeys?: readonly string[];
  apply: (expression: unknown) => boolean;
}>();
const emit = defineEmits<{
  pending: [value: boolean];
  changeData: [
    path: readonly string[],
    source: string | null,
    constant: number | boolean | string | undefined,
    graph: GraphInteractionSnapshot,
    nodeId: string,
  ];
  locateData: [id: string];
}>();
const kind = computed(() => dataNodeKind(props.node));
const formValue = computed(() =>
  props.node.type === 'string' ? props.node : props.node.expression,
);
function applyForm(value: unknown): boolean {
  return props.apply(
    props.node.type === 'string' ? (value as { expression: unknown }).expression : value,
  );
}
const schema = computed(() => dataNodeSchemas[`${props.node.type}:${kind.value}`]);
const fields = computed(
  () =>
    schema.value?.fields.filter(
      field =>
        isConditionListField(field) ||
        (!dataTypedInputs(props.node).some(
          input =>
            input.path.join('.') === field.path.join('.') &&
            !(input.type === 'string' && input.source === null),
        ) &&
          !listDataInputs(readNodeField(formValue.value, field.path)).length),
    ) ?? [],
);
const choices = computed((): Readonly<Record<string, readonly string[]>> => {
  if (props.node.type === 'string') return {};
  if (props.node.expression.kind === 'blackboard') return { key: props.variableKeys ?? [] };
  if (props.node.expression.kind === 'parameter') return { parameter: props.variableKeys ?? [] };
  return {};
});
const form = ref<InstanceType<typeof NodeInspectorFields>>();
defineExpose({ apply: () => form.value?.apply() ?? true });
</script>
<template>
  <NodeInspector
    :scopes="scopes"
    :scope-warnings="scopeWarnings"
    :title="nodeName(kind)"
    :node-id="nodeId"
    :help="nodeHelp(kind)"
  >
    <GraphDataInputs
      v-if="graph"
      :graph="graph"
      :graph-scope="graphScope"
      owner="data"
      :node-id="nodeId"
      :readonly="readonly"
      @change="
        (path, source, constant, snapshot, id) =>
          emit('changeData', path, source, constant, snapshot, id)
      "
      @locate="emit('locateData', $event)"
    />
    <NodeInspectorFields
      :key="nodeId"
      :reference-choices="referenceChoices"
      :blackboard-context="blackboardContext"
      :readonly="readonly"
      ref="form"
      :value="formValue"
      :kind="kind"
      :fields="fields"
      :choices="choices"
      :apply-value="applyForm"
      @pending="emit('pending', $event)"
    />
  </NodeInspector>
</template>
