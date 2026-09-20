<script setup lang="ts">
import type {
  CombatStepForKind,
  CombatStepParameters,
} from '../../../../../packages/game-data-contract/src/actions';
/**
 * 语义状态步骤的专用参数编辑器。
 *
 * 只处理 applyStatus 与 consumeStatus。每次更新都回传完整步骤对象，
 * 并保留 parameters 中未展示的字段（如状态修正 modifiers）。
 */
import { useI18n } from 'vue-i18n';
import { COMBAT_TARGETS, type CombatTarget } from '../../../../core/game-data/operatorDefinition';
import {
  replaceLevelValueForEditor,
  resolveLevelValueForEditor,
} from '../skills/skillDefinitionEditorViewModel';
import EditorFieldLabel from '../inspector/EditorFieldLabel.vue';
import StatusModifierEditor from '../equipment/StatusModifierEditor.vue';

type StatusStep = CombatStepForKind<'applyStatus' | 'consumeStatus'>;

const props = defineProps<{ step: StatusStep; skillLevel: number }>();
const emit = defineEmits<{ update: [step: StatusStep] }>();
const { t } = useI18n({ useScope: 'global' });

function isLevelValues(value: unknown): value is number | readonly number[] {
  return typeof value === 'number' || Array.isArray(value);
}

function setStatusKey(event: Event): void {
  const statusKey = (event.target as HTMLInputElement).value;
  emit('update', { ...props.step, parameters: { ...props.step.parameters, statusKey } });
}

function setTarget(event: Event): void {
  const target = (event.target as HTMLSelectElement).value as CombatTarget;
  if (!COMBAT_TARGETS.includes(target)) return;
  emit('update', { ...props.step, parameters: { ...props.step.parameters, target } });
}

function setDuration(event: Event): void {
  if (props.step.kind !== 'applyStatus') return;
  const raw = (event.target as HTMLInputElement).value;
  if (raw === '') {
    const parameters = { ...props.step.parameters };
    delete parameters.durationFrames;
    emit('update', { ...props.step, parameters });
    return;
  }
  const frames = Math.round(Number(raw));
  if (!Number.isFinite(frames) || frames < 0) return;
  const current = props.step.parameters.durationFrames;
  const durationFrames =
    current === undefined
      ? frames
      : isLevelValues(current)
        ? replaceLevelValueForEditor(current, props.skillLevel, frames)
        : current;
  emit('update', { ...props.step, parameters: { ...props.step.parameters, durationFrames } });
}

function durationAtCurrentLevel(): number | undefined {
  if (
    props.step.kind !== 'applyStatus' ||
    props.step.parameters.durationFrames === undefined ||
    !isLevelValues(props.step.parameters.durationFrames)
  ) {
    return undefined;
  }
  return resolveLevelValueForEditor(props.step.parameters.durationFrames, props.skillLevel);
}

function setStacks(event: Event): void {
  const raw = (event.target as HTMLInputElement).value;
  const stacks = raw === '' ? undefined : Math.round(Number(raw));
  if (stacks !== undefined && (!Number.isFinite(stacks) || stacks < 0)) return;
  const parameters = { ...props.step.parameters, stacks };
  if (stacks === undefined) delete parameters.stacks;
  emit('update', { ...props.step, parameters });
}

function setMaxStacks(event: Event): void {
  if (props.step.kind !== 'applyStatus') return;
  const raw = (event.target as HTMLInputElement).value;
  const maxStacks = raw === '' ? undefined : Math.round(Number(raw));
  if (maxStacks !== undefined && (!Number.isFinite(maxStacks) || maxStacks < 0)) return;
  const parameters = { ...props.step.parameters, maxStacks };
  if (maxStacks === undefined) delete parameters.maxStacks;
  emit('update', { ...props.step, parameters });
}

function setModifiers(
  modifiers: NonNullable<CombatStepParameters['applyStatus']['modifiers']>,
): void {
  if (props.step.kind !== 'applyStatus') return;
  const parameters = { ...props.step.parameters };
  if (modifiers.length === 0) delete parameters.modifiers;
  else parameters.modifiers = modifiers;
  emit('update', { ...props.step, parameters });
}
</script>

<template>
  <div class="step-editor__grid">
    <label>
      <EditorFieldLabel
        :label="t('timeline.skillEditing.statusKey')"
        :help="t('timeline.skillEditing.fieldHelp.statusKey')"
      />
      <input type="text" :value="step.parameters.statusKey" @input="setStatusKey" />
    </label>
    <label>
      <EditorFieldLabel
        :label="t('timeline.skillEditing.target')"
        :help="t('timeline.skillEditing.fieldHelp.statusTarget')"
      />
      <select :value="step.parameters.target" @change="setTarget">
        <option v-for="item in COMBAT_TARGETS" :key="item" :value="item">
          {{ t(`timeline.skillEditing.targets.${item}`) }}
        </option>
      </select>
    </label>
    <template v-if="step.kind === 'applyStatus'">
      <label>
        <EditorFieldLabel
          :label="t('timeline.skillEditing.durationFrames')"
          :help="t('timeline.skillEditing.fieldHelp.statusDuration')"
        />
        <input
          type="number"
          min="0"
          step="1"
          :value="durationAtCurrentLevel() ?? ''"
          @input="setDuration"
        />
      </label>
      <label>
        <span>{{ t('timeline.skillEditing.stacks') }}</span>
        <input
          type="number"
          min="0"
          step="1"
          :value="step.parameters.stacks ?? ''"
          @input="setStacks"
        />
      </label>
      <label>
        <EditorFieldLabel
          :label="t('timeline.skillEditing.maxStacks')"
          :help="t('timeline.skillEditing.fieldHelp.maxStacks')"
        />
        <input
          type="number"
          min="0"
          step="1"
          :value="step.parameters.maxStacks ?? ''"
          @input="setMaxStacks"
        />
      </label>
    </template>
    <template v-else>
      <label>
        <EditorFieldLabel
          :label="t('timeline.skillEditing.stacks')"
          :help="t('timeline.skillEditing.fieldHelp.consumeStacks')"
        />
        <input
          type="number"
          min="0"
          step="1"
          :value="step.parameters.stacks ?? ''"
          @input="setStacks"
        />
      </label>
    </template>
  </div>
  <StatusModifierEditor
    v-if="step.kind === 'applyStatus'"
    :modifiers="step.parameters.modifiers ?? []"
    :skill-level="skillLevel"
    @update="setModifiers"
  />
</template>
