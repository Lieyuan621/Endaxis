<script setup lang="ts">
import type { ReferenceChoices } from '../definition-editor/fieldInputConfig';
/** 技能块单独编辑时的宿主；图操作和各面板与资产工作区共用。 */
import { computed, reactive, ref } from 'vue';
import { EaButton, EaDialog } from '@/design-system';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillGraphPresentation } from '../../core/project/graphPresentation';
import { readGraphPresentation } from '../../core/project/graphPresentation';
import { DefinitionDraftSession } from '../../application/editor/definitionDraftSession';
import InputRegionBoundary from '../keyboard/InputRegionBoundary.vue';
import {
  useInteractionBarrier,
  useInteractionSession,
} from '../interaction/interactionSessionContext';
import { useSkillGraphEditor } from './useSkillGraphEditor';
import SkillGraphPanels from './SkillGraphPanels.vue';
import { createResourceEditorView } from '../editor/resourceEditorView';

const props = defineProps<{
  referenceChoices?: ReferenceChoices;
  definition: SkillDefinition;
  custom: boolean;
  allowCustomize?: boolean;
  label: string;
  presentation?: SkillGraphPresentation;
  saveDefinition: (
    definition: SkillDefinition,
    presentation: SkillGraphPresentation,
    createCustom: boolean,
  ) => void | Promise<void>;
}>();
const emit = defineEmits<{ close: [] }>();
useInteractionBarrier(useInteractionSession(), () => true);
const session = new DefinitionDraftSession(
  {
    definition: props.definition,
    presentation: readGraphPresentation(props.custom ? props.presentation : undefined),
  },
  props.custom,
);
const revision = ref(0);
const saving = ref(false);
const current = computed(() => {
  void revision.value;
  return session.current;
});
const editable = computed(() => {
  void revision.value;
  return session.editable;
});
const canUndo = computed(() => {
  void revision.value;
  return session.canUndo;
});
const canRedo = computed(() => {
  void revision.value;
  return session.canRedo;
});
const view = reactive(createResourceEditorView());
const editor = reactive(
  useSkillGraphEditor({
    view: () => view,
    definition: () => current.value.definition,
    editable: () => editable.value,
    busy: () => saving.value,
    label: () => props.label,
    identity: () => props.definition.key,
    presentation: () => current.value.presentation,
    change: (change, layout) => {
      session.update(value => {
        const definition = change(value.definition);
        const presentation = layout ?? value.presentation;
        return definition === value.definition && presentation === value.presentation
          ? value
          : { definition, presentation };
      });
      revision.value++;
    },
    undo: () => {
      session.undo();
      revision.value++;
    },
    redo: () => {
      session.redo();
      revision.value++;
    },
  }),
);
function customize() {
  if (props.allowCustomize === false) return;
  session.customize();
  revision.value++;
}
async function save() {
  if (!editable.value || !editor.canLeaveFields()) return;
  saving.value = true;
  try {
    const value = session.exportDefinition();
    await props.saveDefinition(value.definition, value.presentation, !props.custom);
    emit('close');
  } catch (cause) {
    editor.error = cause instanceof Error ? cause.message : String(cause);
  } finally {
    saving.value = false;
  }
}
</script>
<template>
  <InputRegionBoundary label="skill-graph-editor" :active="true" modal>
    <EaDialog
      :model-value="true"
      class="skill-graph-dialog"
      size="full"
      fullscreen
      :title="`技能图 · ${label}`"
      :busy="saving"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @update:model-value="emit('close')"
    >
      <div
        :ref="value => (editor.editorRoot = value as HTMLElement)"
        class="skill-graph-editor"
        @keydown="editor.onKeydown"
      >
        <header class="editor-toolbar">
          <strong>技能图 · {{ label }}</strong>
          <span>{{ editable ? '自定义图 · 仅修改当前技能块' : '库图 · 只读' }}</span>
          <div class="spacer" />
          <EaButton
            v-if="editor.address.kind === 'main'"
            size="sm"
            :disabled="editor.blocked"
            @click="editor.timelineOpen ? editor.closeTimeline() : editor.openTimeline()"
          >
            {{ editor.timelineOpen ? '收起时间线' : '查看时间线' }}
          </EaButton>
          <EaButton v-if="!editable && allowCustomize !== false" size="sm" @click="customize"
            >自定义</EaButton
          >
          <EaButton
            v-if="editable"
            size="sm"
            :disabled="editor.blocked || !canUndo"
            @click="editor.undo"
            >撤销</EaButton
          >
          <EaButton
            v-if="editable"
            size="sm"
            :disabled="editor.blocked || !canRedo"
            @click="editor.redo"
            >重做</EaButton
          >
          <EaButton size="sm" :disabled="saving" @click="emit('close')">取消</EaButton>
          <EaButton
            v-if="editable"
            size="sm"
            :disabled="editor.blocked"
            :loading="saving"
            @click="save"
            >保存</EaButton
          >
        </header>
        <div
          class="editor-panels"
          :inert="editor.timelineGesture || Boolean(editor.resizeGesture) || saving"
        >
          <SkillGraphPanels area="tools" :editor="editor" />
          <SkillGraphPanels area="canvas" :editor="editor" />
          <SkillGraphPanels
            area="inspector"
            :editor="editor"
            :reference-choices="referenceChoices"
          />
        </div>
        <SkillGraphPanels area="timeline" :editor="editor" />
        <pre v-if="editor.error" role="alert">{{ editor.error }}</pre>
      </div>
    </EaDialog>
  </InputRegionBoundary>
</template>
<style scoped>
:global(.skill-graph-dialog .el-dialog__header) {
  display: none;
}
:global(.skill-graph-dialog .el-dialog__body) {
  padding: 0;
  height: 100%;
  overflow: hidden;
}
.skill-graph-editor {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-bottom: 1px solid var(--ea-border);
}
.spacer {
  flex: 1;
}
.editor-panels {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 214px minmax(0, 1fr) 270px;
}
</style>
