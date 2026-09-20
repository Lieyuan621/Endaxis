<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type {
  ActionValueOperand,
  LevelValues,
} from '../../../../core/game-data/operatorDefinition';
import type { InspectorBuffAssignments } from '../inspector/inspectorFields';
import { editPropertyValue, type DefinitionProperty } from '../definitionEditContext';
import { nextInspectorEntryKey, renameInspectorEntry } from '../inspector/inspectorDictionary';
import ActionValueOperandEditor from '../actions/ActionValueOperandEditor.vue';
import LevelValuesEditor from '../LevelValuesEditor.vue';

const props = defineProps<{
  value: InspectorBuffAssignments;
  currentLevel: number;
  binding?: DefinitionProperty;
}>();
const emit = defineEmits<{ update: [value: InspectorBuffAssignments] }>();
const { t } = useI18n({ useScope: 'global' });
const assignments = computed(() => Object.entries(props.value));
const operandLabels = () => ({
  constant: t('timeline.skillEditing.operandConstant'),
  blackboard: t('timeline.skillEditing.operandBlackboard'),
  blackboardKey: t('timeline.skillEditing.operandBlackboardKey'),
  constantValue: t('timeline.skillEditing.operandConstantValue'),
});
// 不在展示时解析逐级数值；只有显式切换为表达式才替换整个值。
function change(edit: (value: InspectorBuffAssignments) => InspectorBuffAssignments) {
  editPropertyValue(props.binding, props.value, edit, next => emit('update', next));
}
function appendAssignment(): void {
  change(current => ({
    ...current,
    [nextInspectorEntryKey(current)]: { kind: 'constant', value: 0 },
  }));
}

function renameAssignment(oldKey: string, event: Event): void {
  const input = event.target as HTMLInputElement;
  change(current => {
    const next = renameInspectorEntry(current, oldKey, input.value);
    if (next === current) input.value = oldKey;
    return next as InspectorBuffAssignments;
  });
}

function setAssignment(key: string, value: ActionValueOperand | LevelValues): void {
  if (props.binding) props.binding.child(key).update(() => value);
  else change(current => (Object.hasOwn(current, key) ? { ...current, [key]: value } : current));
}

function toEditableOperand(value: LevelValues | ActionValueOperand): ActionValueOperand {
  if (typeof value === 'object' && 'kind' in value) return value;
  const resolved = Array.isArray(value)
    ? (value[Math.max(0, props.currentLevel - 1)] ?? value[0] ?? 0)
    : value;
  return { kind: 'constant', value: resolved };
}

function isLevelValues(value: LevelValues | ActionValueOperand): value is LevelValues {
  return typeof value === 'number' || Array.isArray(value);
}

function removeAssignment(key: string): void {
  change(current =>
    Object.hasOwn(current, key)
      ? Object.fromEntries(Object.entries(current).filter(([name]) => name !== key))
      : current,
  );
}
</script>
<template>
  <div class="buff-assignments">
    <div
      v-for="[key, value] in assignments"
      :key="key"
      class="buff-assignment"
      :data-property-path="binding ? JSON.stringify(binding.child(key).path) : undefined"
    >
      <input
        type="text"
        :value="key"
        :aria-label="t('timeline.skillEditing.assignmentTargetKey')"
        @change="renameAssignment(key, $event)"
      />
      <div v-if="isLevelValues(value)" class="buff-assignment__levels">
        <LevelValuesEditor
          :value="value"
          :current-level="currentLevel"
          @update="setAssignment(key, $event)"
        />
        <button type="button" @click="setAssignment(key, toEditableOperand(value))">
          {{ t('timeline.skillEditing.assignmentToExpression') }}
        </button>
      </div>
      <div v-else class="buff-assignment__levels">
        <ActionValueOperandEditor
          :value="value"
          :labels="operandLabels()"
          @update="setAssignment(key, $event)"
        />
        <button
          v-if="value.kind === 'constant'"
          type="button"
          @click="setAssignment(key, [value.value])"
        >
          {{ t('timeline.skillEditing.assignmentToLevels') }}
        </button>
      </div>
      <button
        type="button"
        class="buff-assignment__remove"
        :title="t('timeline.skillEditing.deleteAssignment')"
        @click="removeAssignment(key)"
      >
        ×
      </button>
    </div>
    <button type="button" class="buff-assignment__add" @click="appendAssignment">
      {{ t('timeline.skillEditing.addAssignment') }}
    </button>
  </div>
</template>
<style scoped>
.buff-assignments {
  display: grid;
  gap: 8px;
  min-width: 0;
}
.buff-assignment {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 30px;
  gap: 6px;
  padding: 8px;
  border: 1px solid var(--ea-border-soft);
  min-width: 0;
}
.buff-assignment__levels {
  grid-column: 1 / -1;
  grid-row: 2;
  display: grid;
  gap: 6px;
  min-width: 0;
}
.buff-assignment__remove {
  grid-column: 2;
  grid-row: 1;
  color: var(--ea-danger, #ff5c5c);
}
.buff-assignment input,
.buff-assignment button,
.buff-assignment__add {
  min-width: 0;
  min-height: 30px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input);
  color: var(--ea-fg);
}
.buff-assignment__add {
  justify-self: start;
  padding: 0 12px;
}
</style>
