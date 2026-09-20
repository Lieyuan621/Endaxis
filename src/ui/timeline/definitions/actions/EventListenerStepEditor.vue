<script setup lang="ts">
import type { CombatStepForKind } from '../../../../../packages/game-data-contract/src/actions';
/**
 * 编辑技能时间线中的临时事件监听步骤。
 * 监听起止时间由外层调度项决定；这里仅维护事件匹配、条件和同步响应顺序。
 */
import { useI18n } from 'vue-i18n';
import { computed, inject } from 'vue';
import { definitionStructureNavigationKey } from '../definitionStructureNavigation';
import { createDefinitionEditContext, type DefinitionProperty } from '../definitionEditContext';
import { eventOwnerInspectorFields } from '../inspector/eventInspectorSchema';
import InspectorFields from '../inspector/InspectorFields.vue';
import type {
  CombatCondition,
  CombatEventResponseDefinition,
  CombatStepDefinition,
} from '../../../../core/game-data/operatorDefinition';
import { createCombatCondition } from './combatConditionEditorViewModel';
import type { EditableCombatStepKind } from '../skills/skillDefinitionEditorViewModel';
import { createCombatEventResponseDraft } from '../skills/skillDefinitionEditorViewModel';
import ActionSequenceEditor from './ActionSequenceEditor.vue';
import CombatConditionEditor from './CombatConditionEditor.vue';
import CombatEventTriggerEditor from './CombatEventTriggerEditor.vue';

type ListenerStep = CombatStepForKind<'listenForCombatEvents'>;

const props = defineProps<{
  step: ListenerStep;
  parametersBinding?: DefinitionProperty;
  skillLevel: number;
  createStep?: (kind: EditableCombatStepKind) => CombatStepDefinition;
  duplicateStep?: (step: CombatStepDefinition) => CombatStepDefinition;
}>();
const emit = defineEmits<{ update: [step: ListenerStep] }>();
const { t } = useI18n({ useScope: 'global' });
const navigateStructure = inject(definitionStructureNavigationKey, undefined);
// 未迁移的完整表单只保留一个根更新适配，不为字段再建历史或逐层转发事件。
const fallback = createDefinitionEditContext({
  read: () => props.step,
  commit: next => emit('update', next),
});
const parameters = computed(() => props.parametersBinding ?? fallback.root.child('parameters'));
const responseFields = eventOwnerInspectorFields<CombatEventResponseDefinition>(false);
function responseProperty(index: number) {
  return parameters.value.child('responses').child(index);
}

function changeResponses(
  change: (
    responses: readonly CombatEventResponseDefinition[],
  ) => readonly CombatEventResponseDefinition[],
): void {
  parameters.value
    .child('responses')
    .update(current => change(current as readonly CombatEventResponseDefinition[]));
}

function replaceResponse(index: number, response: CombatEventResponseDefinition): void {
  responseProperty(index).update(() => response);
}

function addResponse(): void {
  changeResponses(responses => [
    ...responses,
    createCombatEventResponseDraft(responses.map(response => response.key)),
  ]);
}

function removeResponse(index: number): void {
  changeResponses(responses =>
    responses.length <= 1 || responses[index] === undefined
      ? responses
      : responses.filter((_, itemIndex) => itemIndex !== index),
  );
}

function toggleCondition(index: number, enabled: boolean): void {
  const response = props.step.parameters.responses[index];
  if (response === undefined) return;
  const next = { ...response };
  if (enabled) next.condition = createCombatCondition('combatActive');
  else delete next.condition;
  replaceResponse(index, next);
}

function setCondition(index: number, condition: CombatCondition): void {
  const response = props.step.parameters.responses[index];
  if (response !== undefined) replaceResponse(index, { ...response, condition });
}
</script>

<template>
  <div v-if="navigateStructure?.canNavigate(step)" class="event-listener-editor">
    <p>{{ t('timeline.skillEditing.eventListenerWindowHint') }}</p>
    <button type="button" @click="navigateStructure?.(step)">在主图中编辑事件响应</button>
  </div>
  <div v-else class="event-listener-editor">
    <p>{{ t('timeline.skillEditing.eventListenerWindowHint') }}</p>
    <article
      v-for="(response, index) in step.parameters.responses"
      :key="`${response.key}:${index}`"
    >
      <header>
        <strong>{{ t('timeline.skillEditing.eventResponse', { index: index + 1 }) }}</strong>
        <button
          type="button"
          :disabled="step.parameters.responses.length <= 1"
          @click="removeResponse(index)"
        >
          ×
        </button>
      </header>
      <InspectorFields
        :value="response"
        :fields="responseFields"
        :binding="responseProperty(index)"
      />
      <CombatEventTriggerEditor
        :event="response.event"
        :binding="responseProperty(index).child('event')"
      />
      <label class="event-listener-editor__condition">
        <input
          type="checkbox"
          :checked="response.condition !== undefined"
          @change="toggleCondition(index, ($event.target as HTMLInputElement).checked)"
        />
        <span>{{ t('timeline.skillEditing.additionalCondition') }}</span>
      </label>
      <CombatConditionEditor
        v-if="response.condition"
        :condition="response.condition"
        @update="setCondition(index, $event)"
      />
      <ActionSequenceEditor
        :sequence="response.sequence"
        :skill-level="skillLevel"
        :create-step="createStep!"
        :duplicate-step="duplicateStep!"
        @update="replaceResponse(index, { ...response, sequence: $event })"
      />
    </article>
    <button type="button" class="event-listener-editor__add" @click="addResponse">
      + {{ t('timeline.skillEditing.addEventResponse') }}
    </button>
  </div>
</template>

<style scoped>
.event-listener-editor {
  display: grid;
  gap: 12px;
  padding: 14px;
}
.event-listener-editor > p {
  margin: 0;
  color: var(--ea-fg-muted);
  font-size: 11px;
}
.event-listener-editor article {
  display: grid;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--ea-border-soft);
}
.event-listener-editor header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.event-listener-editor button {
  min-height: 30px;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg);
  cursor: pointer;
}
.event-listener-editor button:disabled {
  opacity: 0.35;
  cursor: default;
}
.event-listener-editor__condition {
  display: flex;
  align-items: center;
  gap: 8px;
}
.event-listener-editor__add {
  justify-self: start;
  padding: 0 12px;
}
</style>
