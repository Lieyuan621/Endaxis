<script setup lang="ts">
/**
 * 编辑一条完整调度序列的帧范围和有序步骤列表。
 * 主体技能与事件监听器共用本组件；父级负责集合级操作和全局唯一键分配。
 */
import { useI18n } from 'vue-i18n';
import type {
  CombatStepDefinition,
  ScheduledSequenceDefinition,
} from '../../../../core/game-data/operatorDefinition';
import type { EditableCombatStepKind } from '../skills/skillDefinitionEditorViewModel';
import ActionSequenceEditor from './ActionSequenceEditor.vue';
import EditorFieldLabel from '../inspector/EditorFieldLabel.vue';

const props = defineProps<{
  sequence: ScheduledSequenceDefinition;
  skillLevel: number;
  title: string;
  startFrameChanged?: boolean;
  endFrameChanged?: boolean;
  createStep: (kind: EditableCombatStepKind) => CombatStepDefinition;
  duplicateStep: (step: CombatStepDefinition) => CombatStepDefinition;
  selectedStepPath?: string;
  inspectorOnly?: boolean;
}>();
const emit = defineEmits<{ update: [sequence: ScheduledSequenceDefinition] }>();
const { t } = useI18n({ useScope: 'global' });

function setFrame(field: 'startFrame' | 'endFrame', event: Event): void {
  const raw = (event.target as HTMLInputElement).value;
  const next = { ...props.sequence };
  if (field === 'endFrame' && raw === '') delete next.endFrame;
  else {
    const value = Math.round(Number(raw));
    if (!Number.isFinite(value) || value < 0) return;
    next[field] = value;
  }
  emit('update', next);
}

function setSequence(sequence: ScheduledSequenceDefinition['sequence']): void {
  emit('update', { ...props.sequence, sequence });
}
</script>

<template>
  <section class="scheduled-sequence-editor">
    <header class="scheduled-sequence-editor__heading">
      <h4>{{ title }}</h4>
      <slot name="actions" />
    </header>
    <div class="scheduled-sequence-editor__frames">
      <label>
        <span>
          <EditorFieldLabel
            :label="t('timeline.skillEditing.startFrame')"
            :help="t('timeline.skillEditing.fieldHelp.sequenceStartFrame')"
          />
          <b v-if="startFrameChanged">*</b>
        </span>
        <input
          type="number"
          min="0"
          step="1"
          :value="sequence.startFrame"
          @input="setFrame('startFrame', $event)"
        />
      </label>
      <label>
        <span>
          <EditorFieldLabel
            :label="t('timeline.skillEditing.endFrame')"
            :help="t('timeline.skillEditing.fieldHelp.sequenceEndFrame')"
          />
          <b v-if="endFrameChanged">*</b>
        </span>
        <input
          type="number"
          min="0"
          step="1"
          :value="sequence.endFrame ?? ''"
          @input="setFrame('endFrame', $event)"
        />
      </label>
    </div>
    <div class="scheduled-sequence-editor__body">
      <ActionSequenceEditor
        v-if="!inspectorOnly"
        :sequence="sequence.sequence"
        :skill-level="skillLevel"
        :create-step="createStep"
        :duplicate-step="duplicateStep"
        :selected-path="selectedStepPath"
        @update="setSequence"
      />
    </div>
  </section>
</template>

<style scoped>
.scheduled-sequence-editor {
  min-width: 0;
  border: 1px solid var(--ea-border-soft);
  background: var(--ea-workbench-panel);
}
.scheduled-sequence-editor__heading {
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 10px;
  border-bottom: 1px solid var(--ea-border-soft);
}
.scheduled-sequence-editor__heading h4 {
  flex: 1;
  margin: 0;
  padding: 9px 12px;
  color: var(--ea-fg);
  font-size: 12px;
}
.scheduled-sequence-editor__heading :deep(> *) {
  display: flex;
  gap: 4px;
}
.scheduled-sequence-editor__frames {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 16px;
  padding: 14px;
}
.scheduled-sequence-editor__frames label {
  display: grid;
  grid-template-columns: minmax(110px, 1fr) 140px;
  align-items: center;
  gap: 12px;
  color: var(--ea-fg-muted);
  font-size: 10px;
}
.scheduled-sequence-editor__frames b {
  color: var(--ea-gold);
}
.scheduled-sequence-editor input {
  width: 100%;
  height: 30px;
  min-width: 0;
  box-sizing: border-box;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg);
  padding: 0 6px;
}
.scheduled-sequence-editor__body {
  padding: 0 14px 14px;
}
</style>
