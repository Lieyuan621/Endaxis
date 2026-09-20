<script setup lang="ts">
import type { CombatStepForKind } from '../../../../../packages/game-data-contract/src/actions';
/** 多分支选择的参数与候选顺序；分支内容继续使用公共序列编辑器。 */
import { computed, defineAsyncComponent } from 'vue';
import { useI18n } from 'vue-i18n';
import type {
  ActionSequenceDefinition,
  ActionValueOperand,
  CombatStepDefinition,
} from '../../../../core/game-data/operatorDefinition';
import type { EditableCombatStepKind } from '../skills/skillDefinitionEditorViewModel';
import ActionValueOperandEditor from './ActionValueOperandEditor.vue';
import type { InspectorPropertyPath } from '../inspector/inspectorProperty';

const SequenceEditor = defineAsyncComponent(() => import('./ActionSequenceEditor.vue'));
type SwitchStep = CombatStepForKind<'switch'>;
const props = defineProps<{
  step: SwitchStep;
  skillLevel: number;
  createStep?: (kind: EditableCombatStepKind) => CombatStepDefinition;
  duplicateStep?: (step: CombatStepDefinition) => CombatStepDefinition;
  selectedPath?: string;
  restoredPropertyPath?: InspectorPropertyPath;
  inspectorOnly?: boolean;
}>();
const emit = defineEmits<{
  update: [step: CombatStepDefinition, propertyPath?: InspectorPropertyPath];
}>();
// 只将请求交给命中的候选，避免所有序列同时抢选中与焦点。
const restoredOption = computed(() => {
  const path = props.restoredPropertyPath;
  if (
    path?.[0] !== 'options' ||
    typeof path[1] !== 'number' ||
    path[2] !== 'sequence' ||
    !props.step.options[path[1]]
  )
    return undefined;
  return { index: path[1], path: path.slice(3) };
});
const { t } = useI18n({ useScope: 'global' });
const labels = computed(() => ({
  constant: t('timeline.skillEditing.operandConstant'),
  blackboard: t('timeline.skillEditing.operandBlackboard'),
  blackboardKey: t('timeline.skillEditing.operandBlackboardKey'),
  constantValue: t('timeline.skillEditing.operandConstantValue'),
}));
function setChoice(choice: ActionValueOperand): void {
  emit('update', { ...props.step, parameters: { ...props.step.parameters, choice } });
}
function setAlwaysNext(event: Event): void {
  emit('update', {
    ...props.step,
    parameters: {
      ...props.step.parameters,
      alwaysNext: (event.target as HTMLInputElement).checked,
    },
  });
}
function replaceOptions(
  options: SwitchStep['options'],
  propertyPath?: InspectorPropertyPath,
): void {
  emit('update', { ...props.step, options }, propertyPath);
}
function setValue(index: number, value: ActionValueOperand): void {
  replaceOptions(
    props.step.options.map((option, at) => (at === index ? { ...option, value } : option)),
  );
}
function setSequence(
  index: number,
  sequence: ActionSequenceDefinition,
  propertyPath: InspectorPropertyPath = [],
): void {
  if (!props.step.options[index]) return;
  replaceOptions(
    props.step.options.map((option, at) => (at === index ? { ...option, sequence } : option)),
    ['options', index, 'sequence', ...propertyPath],
  );
}
function move(index: number, offset: -1 | 1): void {
  const options = [...props.step.options];
  const target = index + offset;
  if (target < 0 || target >= options.length) return;
  [options[index], options[target]] = [options[target]!, options[index]!];
  replaceOptions(options);
}
function addOption(): void {
  replaceOptions([
    ...props.step.options,
    { value: { kind: 'constant', value: props.step.options.length }, sequence: { steps: [] } },
  ]);
}
function childPath(index: number): string {
  const prefix = `options[${index}].sequence.`;
  return props.selectedPath?.startsWith(prefix) ? props.selectedPath.slice(prefix.length) : '';
}
</script>

<template>
  <div class="switch-editor">
    <label class="switch-editor__choice">
      <span>{{ t('timeline.skillEditing.switchChoice') }}</span>
      <ActionValueOperandEditor
        :value="step.parameters.choice"
        :labels="labels"
        @update="setChoice"
      />
    </label>
    <label class="switch-editor__continue">
      <input type="checkbox" :checked="step.parameters.alwaysNext" @change="setAlwaysNext" />
      {{ t('timeline.skillEditing.switchAlwaysNext') }}
    </label>
    <p class="switch-editor__hint">{{ t('timeline.skillEditing.switchOrderHint') }}</p>
    <section v-for="(option, index) in step.options" :key="index" class="switch-editor__option">
      <header>
        <strong>{{ t('timeline.skillEditing.switchOption') }} {{ index + 1 }}</strong>
        <div class="switch-editor__tools">
          <button
            type="button"
            :disabled="index === 0"
            :aria-label="t('common.moveUp')"
            @click="move(index, -1)"
          >
            ↑
          </button>
          <button
            type="button"
            :disabled="index === step.options.length - 1"
            :aria-label="t('common.moveDown')"
            @click="move(index, 1)"
          >
            ↓
          </button>
          <button
            type="button"
            :aria-label="t('common.delete')"
            @click="replaceOptions(step.options.filter((_, at) => at !== index))"
          >
            ×
          </button>
        </div>
      </header>
      <ActionValueOperandEditor
        :value="option.value"
        :labels="labels"
        @update="setValue(index, $event)"
      />
      <details
        v-if="!inspectorOnly && createStep && duplicateStep"
        :open="!!childPath(index) || restoredOption?.index === index"
      >
        <summary>
          {{ t('timeline.skillEditing.steps') }} ({{ option.sequence.steps.length }})
        </summary>
        <SequenceEditor
          :sequence="option.sequence"
          :skill-level="skillLevel"
          :create-step="createStep"
          :duplicate-step="duplicateStep"
          :selected-path="childPath(index)"
          :restored-property-path="
            restoredOption?.index === index ? restoredOption.path : undefined
          "
          @update="(sequence, path) => setSequence(index, sequence, path)"
        />
      </details>
    </section>
    <button type="button" @click="addOption">
      ＋ {{ t('timeline.skillEditing.switchAddOption') }}
    </button>
  </div>
</template>

<style scoped>
.switch-editor {
  display: grid;
  gap: 12px;
  min-width: 0;
  padding: 14px;
}
.switch-editor__choice,
.switch-editor__option {
  display: grid;
  gap: 8px;
  min-width: 0;
}
.switch-editor__option {
  border: 1px solid var(--ea-border);
  padding: 10px;
}
.switch-editor__option header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.switch-editor__tools {
  display: flex;
  gap: 4px;
}
.switch-editor__continue {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.switch-editor__hint {
  margin: 0;
  color: var(--ea-fg-muted);
  font-size: 12px;
}
.switch-editor button {
  min-height: 30px;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg);
  cursor: pointer;
}
.switch-editor button:disabled {
  opacity: 0.4;
  cursor: default;
}
.switch-editor summary {
  cursor: pointer;
  padding: 8px 0;
}
.switch-editor details {
  min-width: 0;
}
</style>
