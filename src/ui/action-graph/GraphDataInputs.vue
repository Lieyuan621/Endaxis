<script setup lang="ts">
import type { GraphInteractionSnapshot } from './graphInteractionSnapshot';
import { computed, toRaw } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { EaSelect } from '@/design-system';
import type { ActionGraphDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import { actionTypedInputs, dataTypedInputs } from './typedGraphInputs';
import { dataNodeTitle } from './nodePresentation';
import { fieldName } from './editorNodeText';
import TypedDataInput from './TypedDataInput.vue';
const props = defineProps<{
  graph: ActionGraphDefinition;
  graphScope?: string;
  owner: 'action' | 'data';
  nodeId: string;
  readonly?: boolean;
}>();
const emit = defineEmits<{
  change: [
    path: readonly string[],
    source: string | null,
    constant: number | boolean | string | undefined,
    graph: GraphInteractionSnapshot,
    nodeId: string,
  ];
  locate: [id: string];
}>();
const inputOwner = computed(() =>
  props.owner === 'action'
    ? props.graph.nodes[props.nodeId]?.action
    : props.graph.dataNodes?.[props.nodeId]?.expression,
);
const inputs = computed(() => {
  const action = props.graph.nodes[props.nodeId]?.action;
  const data = props.graph.dataNodes?.[props.nodeId];
  const projected =
    props.owner === 'action'
      ? action
        ? actionTypedInputs(action)
        : []
      : data
        ? dataTypedInputs(data)
        : [];
  return projected.map(input => ({
    ...input,
    graph: { value: toRaw(props.graph), scope: props.graphScope },
    nodeId: props.nodeId,
  }));
});
function sourceLabel(id: string) {
  const node = props.graph.dataNodes?.[id];
  return node ? `${dataNodeTitle(node)} · ${id}` : t('graphDataInput.missingSource', { id });
}
</script>
<template>
  <section v-if="inputs.length" class="graph-data-inputs" :aria-label="t('graphDataInput.group')">
    <div
      v-for="input in inputs"
      :key="JSON.stringify([owner, nodeId, input.path])"
      class="graph-data-inputs__field"
      :data-input-path="input.path.join('.')"
      :data-input-type="input.type"
    >
      <label
        >{{ fieldName(input.path) }} <small>{{ input.type }}</small></label
      >
      <TypedDataInput
        :input="input"
        :allow-literal-edit="input.type !== 'string' || input.source !== null"
        :reset-key="inputOwner"
        :label="fieldName(input.path)"
        :readonly="readonly"
        :source-label="input.source === null ? undefined : sourceLabel(input.source)"
        @constant="emit('change', input.path, null, $event, input.graph, input.nodeId)"
        @locate="emit('locate', $event)"
      />
      <EaSelect
        v-if="!readonly"
        size="sm"
        :aria-label="t('graphDataInput.sourceLabel', { label: fieldName(input.path) })"
        :model-value="input.source ?? ''"
        :placeholder="t('graphDataInput.chooseSource')"
        :options="
          Object.entries(graph.dataNodes ?? {})
            .filter(
              ([id, node]) => node.type === input.type && !(owner === 'data' && id === nodeId),
            )
            .map(([id]) => ({ value: id, label: sourceLabel(id) }))
        "
        @change="
          value => {
            if (typeof value === 'string' && value)
              emit('change', input.path, value, undefined, input.graph, input.nodeId);
          }
        "
      />
    </div>
  </section>
</template>
<style scoped>
.graph-data-inputs {
  display: grid;
  gap: 12px;
  margin: 12px 0;
}
.graph-data-inputs__field {
  display: grid;
  gap: 6px;
}
.graph-data-inputs__field small {
  color: var(--ea-text-muted);
}
</style>
