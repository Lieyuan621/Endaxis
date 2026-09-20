<script setup lang="ts">
import { ref } from 'vue';
import type { OperatorEntityBlackboardInitializerDefinition } from '../../../../core/game-data/operatorDefinition';
import {
  buildOperatorInitializationGraph,
  appendOperatorInitializer,
  type OperatorInitializationDocument,
} from './operatorInitializationGraph';
import type { DefinitionDraftHistory } from '../useDefinitionDraftHistory';
import { conditionInspectorFields } from '../inspector/conditionInspectorSchema';
import { cloneStructureValue } from '../skillStructureEditorCommands';
import ActionSequenceGraphEditor from '../actions/ActionSequenceGraphEditor.vue';
import InspectorFields from '../inspector/InspectorFields.vue';

const props = defineProps<{
  navigationRequest?: { readonly propertyPath: readonly (string | number)[] };
  value: OperatorInitializationDocument;
  history: DefinitionDraftHistory<OperatorInitializationDocument>;
}>();
const selectedPath = ref<string>();
function add() {
  const next = appendOperatorInitializer(props.value);
  props.history.commit(next.document, { path: next.path });
  selectedPath.value = next.path;
}
</script>
<template>
  <div class="initialization-page">
    <ActionSequenceGraphEditor
      :sequence="value"
      :build-root="buildOperatorInitializationGraph"
      :custom-inspector="() => true"
      :shared-history="history"
      :selected-path="selectedPath"
      :navigation-request="navigationRequest"
      :show-details="false"
      :skill-level="1"
      :duplicate-step="cloneStructureValue"
      :create-step="
        () => {
          throw new Error('Initializers contain build conditions, not combat steps');
        }
      "
      @custom-add="add"
    >
      <template #inspector="{ node, value: current, update }">
        <div class="fields">
          <template v-if="node.kind === '黑板写入'">
            <template
              v-for="entry in [current as OperatorEntityBlackboardInitializerDefinition]"
              :key="node.sourcePath"
            >
              <label :data-property-path="JSON.stringify(['key'])"
                >写入黑板键<input
                  :value="entry.key"
                  @change="
                    update({ ...entry, key: ($event.target as HTMLInputElement).value }, ['key'])
                  "
              /></label>
              <label
                v-for="field in ['trueValue', 'falseValue'] as const"
                :key="field"
                :data-property-path="JSON.stringify([field])"
              >
                {{ field === 'trueValue' ? '条件成立时写入' : '条件不成立时写入' }}
                <input
                  type="number"
                  step="any"
                  :value="entry[field]"
                  @change="
                    ($event.target as HTMLInputElement).value !== '' &&
                    update(
                      { ...entry, [field]: Number(($event.target as HTMLInputElement).value) },
                      [field],
                    )
                  "
                />
              </label>
            </template>
          </template>
          <InspectorFields
            v-else-if="node.kind === '构筑条件'"
            :value="current as OperatorEntityBlackboardInitializerDefinition['condition']"
            :fields="conditionInspectorFields('deckAttributeCompare') ?? []"
            @update="update"
          />
          <p v-else>
            比较最终构筑属性，并将结果写入角色实体黑板。每项的判断条件在子节点中编辑；不改变技能自身的初始黑板。
          </p>
        </div>
      </template>
    </ActionSequenceGraphEditor>
  </div>
</template>
<style scoped>
.initialization-page {
  display: flex;
  flex: 1;
  min-height: 0;
}
.initialization-page > :deep(.sequence-graph) {
  flex: 1;
  height: auto;
  min-height: 0;
  border: 0;
}
.fields {
  display: grid;
  gap: 14px;
  min-width: 0;
}
.fields label {
  display: grid;
  gap: 6px;
  font-size: 12px;
}
.fields input {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  background: var(--ea-fill-input);
  color: var(--ea-fg);
  padding: 6px 8px;
  border: 1px solid var(--ea-border);
}
.fields p {
  color: var(--el-text-color-secondary);
  line-height: 1.7;
}
</style>
