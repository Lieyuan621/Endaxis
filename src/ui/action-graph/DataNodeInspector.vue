<script setup lang="ts">
/** 数据节点参数编辑；数据来源只能通过图上的数据引脚替换。 */
import { computed, ref } from 'vue';
import type { ActionGraphDataNode } from '../../../packages/game-data-contract/src/actionGraph';
import { dataNodeSchemas } from './actionNodeSchemas.generated';
import { listDataInputs } from '../../core/action-graph/actionGraphDataNodes';
import { readNodeField } from './nodeFieldValues';
import { nodeName, nodeHelp } from './editorNodeText';
import NodeInspector from './NodeInspector.vue';
import type { BlackboardScope } from '../../application/editor/graphBlackboard';
import NodeInspectorFields from './NodeInspectorFields.vue';
const props = defineProps<{
  node: ActionGraphDataNode;
  nodeId: string;
  scopes?: readonly BlackboardScope[];
  scopeWarnings?: readonly string[];
  variableKeys?: readonly string[];
  apply: (expression: unknown) => boolean;
}>();
const emit = defineEmits<{ pending: [value: boolean] }>();
const schema = computed(() => dataNodeSchemas[`${props.node.type}:${props.node.expression.kind}`]);
const fields = computed(
  () =>
    schema.value?.fields.filter(
      field => !listDataInputs(readNodeField(props.node.expression, field.path)).length,
    ) ?? [],
);
const choices = computed((): Readonly<Record<string, readonly string[]>> => {
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
    :title="nodeName(node.expression.kind)"
    :node-id="nodeId"
    :help="nodeHelp(node.expression.kind)"
  >
    <NodeInspectorFields
      ref="form"
      :value="node.expression"
      :kind="node.expression.kind"
      :fields="fields"
      :choices="choices"
      :apply-value="apply"
      @pending="emit('pending', $event)"
    />
  </NodeInspector>
</template>
