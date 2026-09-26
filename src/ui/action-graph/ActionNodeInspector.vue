<script setup lang="ts">
/** 从契约生成的字段描述构建表单；特殊资源与控制流通过独立入口编辑。 */
import { computed, ref } from 'vue';
import { EaButton } from '@/design-system';
import type { ActionGraphNode } from '../../../packages/game-data-contract/src/actionGraph';
import { actionNodeSchemas } from './actionNodeSchemas.generated';
import { actionNodeTitle } from './nodePresentation';
import { nodeHelp, fieldName } from './editorNodeText';
import EditorHelp from './EditorHelp.vue';
import NodeInspector from './NodeInspector.vue';
import type { BlackboardScope } from '../../application/editor/graphBlackboard';
import NodeInspectorFields from './NodeInspectorFields.vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { listDataInputs } from '../../core/action-graph/actionGraphDataNodes';
import { containsActionGraph, containsGraphReference, readNodeField } from './nodeFieldValues';

const props = defineProps<{
  nodeId: string;
  scopes?: readonly BlackboardScope[];
  scopeWarnings?: readonly string[];
  node: ActionGraphNode;
  applyAction: (action: unknown) => boolean;
}>();
const emit = defineEmits<{
  pending: [value: boolean];
  openMacro: [macroId: string];
}>();
const schema = computed(() => actionNodeSchemas[props.node.action.kind]);
const fields = computed(() =>
  schema.value.fields.filter(
    field =>
      field.control !== 'sequence' &&
      !listDataInputs(readNodeField(props.node.action, field.path)).length &&
      field.control !== 'resource' &&
      !containsActionGraph(readNodeField(props.node.action, field.path)) &&
      !containsGraphReference(readNodeField(props.node.action, field.path)),
  ),
);
const resourceFields = computed(() =>
  schema.value.fields.filter(
    field =>
      field.control === 'resource' ||
      containsActionGraph(readNodeField(props.node.action, field.path)),
  ),
);
const branchFields = computed(() =>
  schema.value.fields.filter(
    field =>
      field.control !== 'sequence' &&
      field.control !== 'resource' &&
      !containsActionGraph(readNodeField(props.node.action, field.path)) &&
      containsGraphReference(readNodeField(props.node.action, field.path)),
  ),
);
const form = ref<InstanceType<typeof NodeInspectorFields>>();
defineExpose({ apply: () => form.value?.apply() ?? true });
</script>

<template>
  <NodeInspector
    :scopes="scopes"
    :scope-warnings="scopeWarnings"
    :title="actionNodeTitle(node.action.kind)"
    :node-id="nodeId"
    :help="nodeHelp(node.action.kind)"
  >
    <EaButton
      v-if="node.action.kind === 'callMacro'"
      size="sm"
      @click="emit('openMacro', node.action.macroId)"
      >{{ t('actionGraphEditor.openMacro') }} {{ node.action.macroId }}</EaButton
    >
    <EditorHelp v-if="resourceFields.length" :text="t('actionGraphEditor.resourceHelp')" />
    <NodeInspectorFields
      ref="form"
      :value="node.action"
      :kind="node.action.kind"
      :fields="fields"
      :apply-value="applyAction"
      @pending="emit('pending', $event)"
    />
    <details v-for="field in branchFields" :key="field.path.join('.')">
      <summary>
        {{ fieldName(field.path) }} · {{ t('actionGraphEditor.branchReadonly')
        }}<EditorHelp :text="t('actionGraphEditor.branchHelp')" />
      </summary>
      <pre class="branch-preview">{{
        JSON.stringify(readNodeField(node.action, field.path), null, 2)
      }}</pre>
    </details>
  </NodeInspector>
</template>
