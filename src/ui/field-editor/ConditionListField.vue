<script setup lang="ts">
import { computed, nextTick, ref, shallowRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaSelect } from '@/design-system';
import type { CombatCondition } from '../../../packages/game-data-contract/src/conditions';
import { appendCondition, moveCondition, removeCondition } from './conditionList';
import { nodeName } from '../action-graph/editorNodeText';

const props = defineProps<{ value: unknown; editable: boolean; label: string }>();
const emit = defineEmits<{ change: [value: readonly CombatCondition[]]; discard: [] }>();
const { t } = useI18n();
const editing = ref(false);
const conditions = shallowRef<readonly CombatCondition[]>([]);
const choice = ref('');
const error = ref('');
const awaitingAcceptance = ref(false);
let session = 0;
const displayed = computed<readonly CombatCondition[]>(() =>
  editing.value ? conditions.value : Array.isArray(props.value) ? props.value : [],
);
function reset() {
  session++;
  editing.value = false;
  conditions.value = [];
  choice.value = '';
  error.value = '';
  awaitingAcceptance.value = false;
}
function begin() {
  if (!props.editable || editing.value) return;
  if (!Array.isArray(props.value)) {
    error.value = 'invalid';
    return;
  }
  session++;
  conditions.value = [...props.value];
  choice.value = '';
  error.value = '';
  editing.value = true;
}
function discard() {
  reset();
  emit('discard');
}
function revise() {
  // A rejected parent proposal must not outlive a revised local draft.
  if (error.value === 'rejected') emit('discard');
  error.value = '';
}
function add() {
  if (!props.editable || !editing.value || awaitingAcceptance.value) return;
  if (choice.value !== 'true' && choice.value !== 'false') return;
  revise();
  conditions.value = appendCondition(conditions.value, choice.value === 'true');
  choice.value = '';
}
function remove(index: number) {
  if (!props.editable || !editing.value || awaitingAcceptance.value) return;
  revise();
  conditions.value = removeCondition(conditions.value, index);
}
function move(index: number, direction: -1 | 1) {
  if (!props.editable || !editing.value || awaitingAcceptance.value) return;
  const target = index + direction;
  if (target < 0 || target >= conditions.value.length) return;
  revise();
  conditions.value = moveCondition(conditions.value, index, target);
}
async function apply() {
  if (!props.editable || !editing.value || awaitingAcceptance.value) return;
  const applyingSession = session;
  const next = conditions.value;
  if (JSON.stringify(next) === JSON.stringify(props.value)) {
    reset();
    return;
  }
  awaitingAcceptance.value = true;
  emit('change', next);
  await nextTick();
  if (!editing.value || applyingSession !== session) return;
  if (JSON.stringify(props.value) === JSON.stringify(next)) reset();
  else {
    awaitingAcceptance.value = false;
    error.value = 'rejected';
  }
}
function summary(condition: CombatCondition): string {
  if (condition?.kind === 'constant') return String(condition.value);
  if (condition?.kind === 'conditionNode')
    return `${t('conditionList.source')}: ${condition.nodeId}`;
  return condition?.kind ? nodeName(condition.kind) : t('conditionList.invalid');
}
// Accepted commits, undo/redo and external edits invalidate index-addressed local drafts.
watch(() => [props.value, props.editable], reset);
</script>

<template>
  <div
    class="condition-list"
    data-condition-list
    :aria-label="label"
    @keydown.esc.prevent.stop="discard"
  >
    <small>{{ t('conditionList.orderHint') }}</small>
    <div
      v-for="(condition, index) in displayed"
      :key="index"
      class="condition-list__row"
      :data-condition-index="index"
    >
      <span>{{ index + 1 }}. {{ summary(condition) }}</span>
      <template v-if="editing && editable">
        <EaButton
          size="sm"
          :disabled="index === 0 || awaitingAcceptance"
          :aria-label="t('conditionList.moveUpLabel', { index: index + 1 })"
          @click="move(index, -1)"
          >{{ t('conditionList.moveUp') }}</EaButton
        >
        <EaButton
          size="sm"
          :disabled="index === displayed.length - 1 || awaitingAcceptance"
          :aria-label="t('conditionList.moveDownLabel', { index: index + 1 })"
          @click="move(index, 1)"
          >{{ t('conditionList.moveDown') }}</EaButton
        >
        <EaButton
          size="sm"
          :disabled="awaitingAcceptance"
          :aria-label="t('conditionList.removeLabel', { index: index + 1 })"
          @click="remove(index)"
          >{{ t('conditionList.remove') }}</EaButton
        >
      </template>
    </div>
    <small v-if="!displayed.length">{{
      t(Array.isArray(value) ? 'conditionList.empty' : 'conditionList.invalid')
    }}</small>
    <EaButton v-if="!editing && editable" size="sm" @click="begin">{{
      t('conditionList.edit')
    }}</EaButton>
    <template v-if="editing && editable">
      <div class="condition-list__actions">
        <EaSelect
          v-model="choice"
          size="sm"
          :disabled="awaitingAcceptance"
          :aria-label="t('conditionList.newCondition')"
          :placeholder="t('conditionList.choose')"
          :options="[
            { value: 'true', label: t('graphDataInput.true') },
            { value: 'false', label: t('graphDataInput.false') },
          ]"
        />
        <EaButton
          size="sm"
          :disabled="(choice !== 'true' && choice !== 'false') || awaitingAcceptance"
          @click="add"
          >{{ t('conditionList.add') }}</EaButton
        >
      </div>
      <div class="condition-list__actions">
        <EaButton
          size="sm"
          variant="primary"
          :disabled="awaitingAcceptance"
          :aria-label="t('conditionList.applyLabel')"
          @click="apply"
          >{{ t('graphDataInput.apply') }}</EaButton
        >
        <EaButton size="sm" :aria-label="t('conditionList.cancelLabel')" @click="discard">{{
          t('graphDataInput.cancel')
        }}</EaButton>
      </div>
    </template>
    <small v-if="error" role="alert">{{ t(`conditionList.${error}`) }}</small>
  </div>
</template>

<style scoped>
.condition-list {
  display: grid;
  gap: 8px;
  min-width: 0;
}
.condition-list > small {
  color: var(--ea-text-muted);
}
.condition-list__row,
.condition-list__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.condition-list__row > span {
  flex: 1;
  overflow-wrap: anywhere;
}
.condition-list__actions :deep(.ea-select) {
  min-width: 90px;
}
.condition-list [role='alert'] {
  color: var(--ea-danger);
}
</style>
