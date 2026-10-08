<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaCheckbox, EaSelect } from '@/design-system';
import type { ActionGraphDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { CombatCondition } from '../../../packages/game-data-contract/src/conditions';
import TypedDataInput from '../action-graph/TypedDataInput.vue';
import { dataNodeSourceLabel } from '../action-graph/nodePresentation';
import EditorHelp from '../editor/EditorHelp.vue';

const props = defineProps<{
  value: unknown;
  graph: ActionGraphDefinition;
  label: string;
  description?: string;
  optional?: boolean;
  readonly?: boolean;
}>();
const emit = defineEmits<{ change: [value: CombatCondition | undefined]; open: [] }>();
const { t } = useI18n();
// 禁用后保留本地草稿，恢复时仍由宿主检查节点是否存在。
const draft = shallowRef<CombatCondition>();
watch(
  () => props.value,
  value => {
    if (value !== undefined) draft.value = value as CombatCondition;
  },
  { immediate: true },
);
const source = computed(() => {
  const value = props.value as CombatCondition | undefined;
  return value?.kind === 'conditionNode' ? value.nodeId : null;
});
const input = computed(() => ({
  path: [],
  type: 'boolean' as const,
  source: source.value,
  value: props.value,
}));
const options = computed(() =>
  Object.entries(props.graph.dataNodes ?? {})
    .filter(([, node]) => node.type === 'boolean')
    .map(([id, node]) => ({ value: id, label: dataNodeSourceLabel(node, id) })),
);
function change(value: CombatCondition | undefined) {
  if (!props.readonly) emit('change', value);
}
</script>

<template>
  <div class="condition-input-field">
    <EaCheckbox
      v-if="optional"
      :model-value="value !== undefined"
      :disabled="readonly"
      @change="
        enabled => change(enabled ? (draft ?? { kind: 'constant', value: true }) : undefined)
      "
    >
      {{ label }}<EditorHelp v-if="description" :text="description" />
    </EaCheckbox>
    <label v-else>{{ label }}<EditorHelp v-if="description" :text="description" /></label>
    <TypedDataInput
      :input="input"
      :label="label"
      :readonly="readonly || (optional && value === undefined)"
      :reset-key="graph"
      :source-label="options.find(option => option.value === source)?.label"
      @constant="
        value => {
          if (typeof value === 'boolean') change({ kind: 'constant', value });
        }
      "
      @locate="emit('open')"
    />
    <EaSelect
      v-if="!readonly"
      :model-value="source ?? ''"
      :options="options"
      :disabled="optional && value === undefined"
      :aria-label="t('graphDataInput.sourceLabel', { label })"
      :placeholder="t('graphDataInput.chooseSource')"
      @change="
        id => {
          if (typeof id === 'string' && graph.dataNodes?.[id]?.type === 'boolean')
            change({ kind: 'conditionNode', nodeId: id });
        }
      "
    />
  </div>
</template>

<style scoped>
.condition-input-field {
  display: grid;
  gap: 8px;
}
</style>
