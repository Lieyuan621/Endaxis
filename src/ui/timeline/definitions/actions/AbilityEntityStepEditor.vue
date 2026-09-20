<script setup lang="ts">
import { ElIcon } from 'element-plus';
import type { CombatStepForKind } from '../../../../../packages/game-data-contract/src/actions';
/**
 * 编辑 spawnAbilityEntity 的自包含定义与生成参数。
 *
 * VFS 模板只属于生成证据；这里直接修改当前技能组件树中的 definition。
 * 子技能复用统一调度序列和战斗步骤编辑器，并通过异步组件打断递归导入环。
 */
import { computed, defineAsyncComponent, inject, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ArrowDown, ArrowUp, CopyDocument, Delete, Plus } from '@element-plus/icons-vue';
import {
  COMBAT_TARGETS,
  type AbilityEntityDefinition,
  type AbilityEntityChildSkillDefinition,
  type ActionValueOperand,
  type CombatStepDefinition,
  type CombatTarget,
  type LevelValues,
  type ScheduledSequenceDefinition,
} from '../../../../core/game-data/operatorDefinition';
import type { EditableCombatStepKind } from '../skills/skillDefinitionEditorViewModel';
import ActionValueOperandEditor from './ActionValueOperandEditor.vue';
import EditorFieldLabel from '../inspector/EditorFieldLabel.vue';
import SkillBlackboardEditor from '../skills/SkillBlackboardEditor.vue';
import { ABILITY_ENTITY_IDS_KEY } from '../operators/abilityEntityEditorContext';

const RecursiveScheduledSequenceEditor = defineAsyncComponent(
  () => import('./ScheduledSequenceEditor.vue'),
);

type AbilityEntityStep = CombatStepForKind<'spawnAbilityEntity'>;

const props = defineProps<{
  step: AbilityEntityStep;
  skillLevel: number;
  createStep?: (kind: EditableCombatStepKind) => CombatStepDefinition;
  duplicateStep?: (step: CombatStepDefinition) => CombatStepDefinition;
  definitionOnly?: boolean;
  selectedStructurePath?: string;
  inspectorOnly?: boolean;
}>();
const emit = defineEmits<{ update: [step: CombatStepDefinition] }>();
const { t } = useI18n({ useScope: 'global' });
const providedAbilityEntityIds = inject(
  ABILITY_ENTITY_IDS_KEY,
  computed(() => []),
);
const abilityEntityIds = computed(() => {
  const values = new Set(providedAbilityEntityIds.value);
  if (props.step.parameters.abilityEntityId.length > 0) {
    values.add(props.step.parameters.abilityEntityId);
  }
  return [...values].sort();
});
const editsInlineDefinition = computed(
  () => props.definitionOnly === true || props.step.parameters.definition !== undefined,
);
const selectedChildSequenceIndex = ref(0);
const selectedChildSequenceStepPath = computed(() => {
  const prefix = `childSkill.scheduledSequences[${selectedChildSequenceIndex.value}].sequence`;
  if (!props.selectedStructurePath?.startsWith(prefix)) return '';
  return props.selectedStructurePath.slice(prefix.length).replace(/^\./, '');
});

const assignments = computed(() =>
  Object.entries(props.step.parameters.blackboardAssignments ?? {}),
);
const editableDefinition = computed<AbilityEntityDefinition>(
  () =>
    props.step.parameters.definition ?? {
      lifetime: { kind: 'infinite' as const },
    },
);
const selectedChildSequence = computed(
  () => editableDefinition.value.childSkill?.scheduledSequences[selectedChildSequenceIndex.value],
);

watch(
  () => editableDefinition.value.childSkill?.scheduledSequences.length ?? 0,
  length => {
    selectedChildSequenceIndex.value = Math.max(
      0,
      Math.min(selectedChildSequenceIndex.value, length - 1),
    );
  },
);
watch(
  () => props.step.parameters.abilityEntityId,
  () => {
    selectedChildSequenceIndex.value = 0;
  },
);
watch(
  () => props.selectedStructurePath,
  path => {
    const match = path?.match(/^childSkill\.scheduledSequences\[(\d+)\]/);
    if (match === null || match === undefined) return;
    const index = Number(match[1]);
    if (
      index >= 0 &&
      index < (editableDefinition.value.childSkill?.scheduledSequences.length ?? 0)
    ) {
      selectedChildSequenceIndex.value = index;
    }
  },
  { immediate: true },
);
const operandLabels = () => ({
  constant: t('timeline.skillEditing.operandConstant'),
  blackboard: t('timeline.skillEditing.operandBlackboard'),
  blackboardKey: t('timeline.skillEditing.operandBlackboardKey'),
  constantValue: t('timeline.skillEditing.operandConstantValue'),
});

function update(parameters: AbilityEntityStep['parameters']): void {
  emit('update', { ...props.step, parameters });
}

function setText(field: 'abilityEntityId' | 'saveToContextKey', event: Event): void {
  const value = (event.target as HTMLInputElement).value;
  const parameters = { ...props.step.parameters };
  if (field === 'saveToContextKey' && value === '') delete parameters.saveToContextKey;
  else parameters[field] = value;
  update(parameters);
}

function setTarget(event: Event): void {
  const value = (event.target as HTMLSelectElement).value;
  const parameters = { ...props.step.parameters };
  if (value === '') delete parameters.target;
  else if (COMBAT_TARGETS.includes(value as CombatTarget))
    parameters.target = value as CombatTarget;
  update(parameters);
}

function setBoolean(field: 'dieWhenSourceDies' | 'inheritActionBlackboard', event: Event): void {
  const checked = (event.target as HTMLInputElement).checked;
  const parameters = { ...props.step.parameters };
  if (field === 'inheritActionBlackboard' && !checked) delete parameters[field];
  else parameters[field] = checked;
  update(parameters);
}

function setLifetimeKind(event: Event): void {
  const kind = (event.target as HTMLSelectElement).value as 'limited' | 'infinite';
  update({
    ...props.step.parameters,
    definition: {
      ...editableDefinition.value,
      lifetime:
        kind === 'infinite'
          ? { kind }
          : {
              kind,
              durationSeconds:
                editableDefinition.value.lifetime.kind === 'limited'
                  ? editableDefinition.value.lifetime.durationSeconds
                  : 10,
            },
    },
  });
}

function setLifetimeDuration(event: Event): void {
  if (editableDefinition.value.lifetime.kind !== 'limited') return;
  const durationSeconds = Number((event.target as HTMLInputElement).value);
  if (!Number.isFinite(durationSeconds) || durationSeconds < 0) return;
  update({
    ...props.step.parameters,
    definition: {
      ...editableDefinition.value,
      lifetime: { kind: 'limited', durationSeconds },
    },
  });
}

function toggleOverrideDuration(event: Event): void {
  const parameters = { ...props.step.parameters };
  if ((event.target as HTMLInputElement).checked) {
    parameters.overrideDurationSeconds = { kind: 'constant', value: 0 };
  } else delete parameters.overrideDurationSeconds;
  update(parameters);
}

function setOverrideDuration(overrideDurationSeconds: ActionValueOperand): void {
  update({ ...props.step.parameters, overrideDurationSeconds });
}

function appendAssignment(): void {
  const current = props.step.parameters.blackboardAssignments ?? {};
  let index = 1;
  while (`value${index}` in current) index += 1;
  update({
    ...props.step.parameters,
    blackboardAssignments: {
      ...current,
      [`value${index}`]: { kind: 'constant', value: 0 },
    },
  });
}

function removeAssignment(key: string): void {
  const blackboardAssignments = { ...props.step.parameters.blackboardAssignments };
  delete blackboardAssignments[key];
  const parameters = { ...props.step.parameters };
  if (Object.keys(blackboardAssignments).length === 0) delete parameters.blackboardAssignments;
  else parameters.blackboardAssignments = blackboardAssignments;
  update(parameters);
}

function renameAssignment(oldKey: string, event: Event): void {
  const newKey = (event.target as HTMLInputElement).value.trim();
  const current = props.step.parameters.blackboardAssignments ?? {};
  if (newKey.length === 0 || (newKey !== oldKey && newKey in current)) return;
  const blackboardAssignments: Record<string, ActionValueOperand> = {};
  for (const [key, value] of Object.entries(current)) {
    blackboardAssignments[key === oldKey ? newKey : key] = value;
  }
  update({ ...props.step.parameters, blackboardAssignments });
}

function setAssignment(key: string, value: ActionValueOperand): void {
  update({
    ...props.step.parameters,
    blackboardAssignments: {
      ...props.step.parameters.blackboardAssignments,
      [key]: value,
    },
  });
}

function setChildSkill(childSkill: AbilityEntityChildSkillDefinition | undefined): void {
  const definition = { ...editableDefinition.value };
  if (childSkill === undefined) delete definition.childSkill;
  else definition.childSkill = childSkill;
  update({ ...props.step.parameters, definition });
}

function toggleChildSkill(event: Event): void {
  setChildSkill(
    (event.target as HTMLInputElement).checked
      ? { skillId: 'custom-ability-entity-child', scheduledSequences: [] }
      : undefined,
  );
}

function setChildSkillId(event: Event): void {
  const childSkill = editableDefinition.value.childSkill;
  if (childSkill === undefined) return;
  setChildSkill({ ...childSkill, skillId: (event.target as HTMLInputElement).value });
}

function setChildBlackboard(blackboard: Readonly<Record<string, LevelValues>>): void {
  const childSkill = editableDefinition.value.childSkill;
  if (childSkill === undefined) return;
  const next = { ...childSkill };
  if (Object.keys(blackboard).length === 0) delete next.blackboard;
  else next.blackboard = blackboard;
  setChildSkill(next);
}

function replaceChildSequence(index: number, sequence: ScheduledSequenceDefinition): void {
  const childSkill = editableDefinition.value.childSkill;
  if (childSkill === undefined || childSkill.scheduledSequences[index] === undefined) return;
  const scheduledSequences = [...childSkill.scheduledSequences];
  scheduledSequences[index] = sequence;
  setChildSkill({ ...childSkill, scheduledSequences });
}

function appendChildSequence(): void {
  const childSkill = editableDefinition.value.childSkill;
  if (childSkill === undefined) return;
  selectedChildSequenceIndex.value = childSkill.scheduledSequences.length;
  setChildSkill({
    ...childSkill,
    scheduledSequences: [
      ...childSkill.scheduledSequences,
      { startFrame: 0, sequence: { steps: [] } },
    ],
  });
}

function moveChildSequence(index: number, offset: -1 | 1): void {
  const childSkill = editableDefinition.value.childSkill;
  if (childSkill === undefined) return;
  const target = index + offset;
  if (target < 0 || target >= childSkill.scheduledSequences.length) return;
  const scheduledSequences = [...childSkill.scheduledSequences];
  [scheduledSequences[index], scheduledSequences[target]] = [
    scheduledSequences[target]!,
    scheduledSequences[index]!,
  ];
  selectedChildSequenceIndex.value = target;
  setChildSkill({ ...childSkill, scheduledSequences });
}

function duplicateChildSequence(index: number): void {
  const childSkill = editableDefinition.value.childSkill;
  const sequence = childSkill?.scheduledSequences[index];
  if (childSkill === undefined || sequence === undefined || props.duplicateStep === undefined)
    return;
  const copy: ScheduledSequenceDefinition = {
    ...sequence,
    sequence: { steps: sequence.sequence.steps.map(props.duplicateStep) },
  };
  const scheduledSequences = [...childSkill.scheduledSequences];
  scheduledSequences.splice(index + 1, 0, copy);
  selectedChildSequenceIndex.value = index + 1;
  setChildSkill({ ...childSkill, scheduledSequences });
}

function removeChildSequence(index: number): void {
  const childSkill = editableDefinition.value.childSkill;
  if (childSkill === undefined) return;
  const scheduledSequences = childSkill.scheduledSequences.filter((_, i) => i !== index);
  selectedChildSequenceIndex.value = Math.max(
    0,
    Math.min(selectedChildSequenceIndex.value, scheduledSequences.length - 1),
  );
  setChildSkill({
    ...childSkill,
    scheduledSequences,
  });
}
</script>

<template>
  <div class="ability-entity-editor">
    <div v-if="!definitionOnly" class="step-editor__grid">
      <label>
        <EditorFieldLabel :label="t('timeline.skillEditing.abilityEntityId')" />
        <select
          :value="step.parameters.abilityEntityId"
          @change="setText('abilityEntityId', $event)"
        >
          <option v-for="id in abilityEntityIds" :key="id" :value="id">{{ id }}</option>
        </select>
      </label>
      <label>
        <EditorFieldLabel :label="t('timeline.skillEditing.abilityEntityTarget')" />
        <select :value="step.parameters.target ?? ''" @change="setTarget">
          <option value="">—</option>
          <option v-for="target in COMBAT_TARGETS" :key="target" :value="target">
            {{ target }}
          </option>
        </select>
      </label>
      <label>
        <EditorFieldLabel :label="t('timeline.skillEditing.abilityEntityContextKey')" />
        <input
          type="text"
          :value="step.parameters.saveToContextKey ?? ''"
          @input="setText('saveToContextKey', $event)"
        />
      </label>
      <label class="step-editor__check step-editor__check--field">
        <input
          type="checkbox"
          :checked="step.parameters.dieWhenSourceDies"
          @change="setBoolean('dieWhenSourceDies', $event)"
        />
        <EditorFieldLabel :label="t('timeline.skillEditing.abilityEntityDieWithSource')" />
      </label>
      <label class="step-editor__check step-editor__check--field">
        <input
          type="checkbox"
          :checked="step.parameters.inheritActionBlackboard ?? false"
          @change="setBoolean('inheritActionBlackboard', $event)"
        />
        <EditorFieldLabel :label="t('timeline.skillEditing.abilityEntityInheritBlackboard')" />
      </label>
    </div>

    <p
      v-if="!definitionOnly && !editsInlineDefinition"
      class="ability-entity-editor__reference-hint"
    >
      {{ t('timeline.skillEditing.abilityEntityManagedAtOperator') }}
    </p>

    <fieldset v-if="editsInlineDefinition">
      <legend>{{ t('timeline.skillEditing.abilityEntityDefinition') }}</legend>
      <div class="step-editor__grid ability-entity-editor__definition">
        <label>
          <EditorFieldLabel :label="t('timeline.skillEditing.abilityEntityLifetime')" />
          <select :value="editableDefinition.lifetime.kind" @change="setLifetimeKind">
            <option value="limited">
              {{ t('timeline.skillEditing.abilityEntityLifetimeLimited') }}
            </option>
            <option value="infinite">
              {{ t('timeline.skillEditing.abilityEntityLifetimeInfinite') }}
            </option>
          </select>
        </label>
        <label v-if="editableDefinition.lifetime.kind === 'limited'">
          <EditorFieldLabel :label="t('timeline.skillEditing.durationSeconds')" />
          <input
            type="number"
            min="0"
            step="0.01"
            :value="editableDefinition.lifetime.durationSeconds"
            @input="setLifetimeDuration"
          />
        </label>
      </div>
    </fieldset>

    <fieldset v-if="!definitionOnly">
      <legend>
        <label class="step-editor__check">
          <input
            type="checkbox"
            :checked="step.parameters.overrideDurationSeconds !== undefined"
            @change="toggleOverrideDuration"
          />
          {{ t('timeline.skillEditing.abilityEntityOverrideDuration') }}
        </label>
      </legend>
      <ActionValueOperandEditor
        v-if="step.parameters.overrideDurationSeconds"
        :value="step.parameters.overrideDurationSeconds"
        :labels="operandLabels()"
        @update="setOverrideDuration"
      />
    </fieldset>

    <fieldset v-if="!definitionOnly">
      <legend>{{ t('timeline.skillEditing.abilityEntityAssignments') }}</legend>
      <div v-for="[key, value] in assignments" :key="key" class="ability-entity-editor__assignment">
        <input type="text" :value="key" @change="renameAssignment(key, $event)" />
        <ActionValueOperandEditor
          :value="value"
          :labels="operandLabels()"
          @update="setAssignment(key, $event)"
        />
        <button type="button" @click="removeAssignment(key)">
          <el-icon><Delete /></el-icon>
        </button>
      </div>
      <button type="button" class="ability-entity-editor__add" @click="appendAssignment">
        <el-icon><Plus /></el-icon>{{ t('timeline.skillEditing.addAssignment') }}
      </button>
    </fieldset>

    <fieldset v-if="editsInlineDefinition && !inspectorOnly">
      <legend>
        <label class="step-editor__check">
          <input
            type="checkbox"
            :checked="editableDefinition.childSkill !== undefined"
            @change="toggleChildSkill"
          />
          {{ t('timeline.skillEditing.abilityEntityChildSkill') }}
        </label>
      </legend>
      <template v-if="editableDefinition.childSkill">
        <div class="step-editor__grid">
          <label>
            <EditorFieldLabel :label="t('timeline.skillEditing.abilityEntityChildSkillId')" />
            <input
              type="text"
              :value="editableDefinition.childSkill.skillId"
              @input="setChildSkillId"
            />
          </label>
        </div>
        <SkillBlackboardEditor
          :blackboard="editableDefinition.childSkill.blackboard ?? {}"
          :skill-level="skillLevel"
          collapsible
          initially-collapsed
          @update="setChildBlackboard"
        />
        <div class="ability-entity-editor__heading">
          <strong>{{ t('timeline.skillEditing.abilityEntityChildTimeline') }}</strong>
          <button type="button" @click="appendChildSequence">
            <el-icon><Plus /></el-icon>
          </button>
        </div>
        <div
          v-if="
            createStep &&
            duplicateStep &&
            editableDefinition.childSkill.scheduledSequences.length > 0
          "
          class="ability-entity-editor__timeline-workspace"
        >
          <aside class="ability-entity-editor__sequence-list">
            <button
              v-for="(sequence, index) in editableDefinition.childSkill.scheduledSequences"
              :key="index"
              type="button"
              :class="{ active: index === selectedChildSequenceIndex }"
              @click="selectedChildSequenceIndex = index"
            >
              <strong>{{ t('timeline.skillEditing.sequenceItem', { index: index + 1 }) }}</strong>
              <span>
                {{ sequence.startFrame }}–{{ sequence.endFrame ?? '∞' }} ·
                {{
                  t('timeline.skillEditing.abilityEntitySequenceStepCount', {
                    count: sequence.sequence.steps.length,
                  })
                }}
              </span>
            </button>
          </aside>
          <RecursiveScheduledSequenceEditor
            v-if="selectedChildSequence"
            :key="selectedChildSequenceIndex"
            :sequence="selectedChildSequence"
            :skill-level="skillLevel"
            :title="
              t('timeline.skillEditing.sequenceItem', {
                index: selectedChildSequenceIndex + 1,
              })
            "
            :create-step="createStep"
            :duplicate-step="duplicateStep"
            :selected-step-path="selectedChildSequenceStepPath"
            @update="replaceChildSequence(selectedChildSequenceIndex, $event)"
          >
            <template #actions>
              <button
                type="button"
                :disabled="selectedChildSequenceIndex === 0"
                @click="moveChildSequence(selectedChildSequenceIndex, -1)"
              >
                <el-icon><ArrowUp /></el-icon>
              </button>
              <button
                type="button"
                :disabled="
                  selectedChildSequenceIndex ===
                  editableDefinition.childSkill!.scheduledSequences.length - 1
                "
                @click="moveChildSequence(selectedChildSequenceIndex, 1)"
              >
                <el-icon><ArrowDown /></el-icon>
              </button>
              <button type="button" @click="duplicateChildSequence(selectedChildSequenceIndex)">
                <el-icon><CopyDocument /></el-icon>
              </button>
              <button type="button" @click="removeChildSequence(selectedChildSequenceIndex)">
                <el-icon><Delete /></el-icon>
              </button>
            </template>
          </RecursiveScheduledSequenceEditor>
        </div>
      </template>
    </fieldset>
  </div>
</template>

<style scoped>
.ability-entity-editor {
  container-type: inline-size;
  padding-bottom: 1px;
}
.ability-entity-editor__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 10px 0;
}
.ability-entity-editor__reference-hint {
  margin: 10px 0;
  padding: 10px 12px;
  border-left: 2px solid var(--ea-gold);
  background: var(--ea-fill-soft);
  color: var(--ea-fg-muted);
  font-size: 12px;
}
.ability-entity-editor button {
  min-width: 30px;
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg);
}
.ability-entity-editor__timeline-workspace {
  display: grid;
  min-width: 0;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}
.ability-entity-editor__sequence-list {
  display: grid;
  min-width: 0;
  gap: 6px;
}
.ability-entity-editor__sequence-list > button {
  width: 100%;
  min-width: 0;
  display: grid;
  gap: 5px;
  justify-items: start;
  padding: 10px 12px;
  text-align: left;
}
.ability-entity-editor__sequence-list > button.active {
  border-color: var(--ea-gold);
  background: var(--ea-active-fill);
  box-shadow: inset 3px 0 0 var(--ea-gold);
}
.ability-entity-editor__sequence-list strong,
.ability-entity-editor__sequence-list span {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ability-entity-editor__sequence-list span {
  color: var(--ea-fg-muted);
  font-size: 11px;
}
.ability-entity-editor__assignment > input {
  width: 100%;
  height: 30px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg);
  padding: 0 6px;
}
.ability-entity-editor__assignment {
  display: grid;
  grid-template-columns: minmax(120px, 0.5fr) minmax(260px, 1fr) 30px;
  align-items: end;
  gap: 8px;
  margin-bottom: 8px;
}
.ability-entity-editor__add {
  margin-top: 4px;
  padding: 0 10px;
}
.ability-entity-editor :deep(.editor-section) {
  padding: 0 14px 14px;
}
.ability-entity-editor :deep(.section-heading) {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ability-entity-editor :deep(.scheduled-sequence-editor) {
  min-width: 0;
}
@container (max-width: 980px) {
  .ability-entity-editor__timeline-workspace {
    grid-template-columns: 1fr;
  }
  .ability-entity-editor__sequence-list {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
}
</style>
