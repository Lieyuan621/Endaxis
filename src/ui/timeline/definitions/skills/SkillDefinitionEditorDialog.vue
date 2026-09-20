<script setup lang="ts">
import { EaDialog } from '../../../../design-system/index';
/**
 * 技能逻辑编辑的独立工作区。属性面板只负责打开它；草稿、保存和取消均在弹窗边界内完成。
 * 弹窗关闭不会写场景，只有 save 事件会把完整定义交给编辑器命令层校验。
 */
import { computed, provide } from 'vue';
import '../definitionWorkspaceLayout.css';
import { useI18n } from 'vue-i18n';
import type { SkillDefinition } from '../../../../core/game-data/operatorDefinition';
import SkillDefinitionEditor from './SkillDefinitionEditor.vue';
import type { DefinitionDraftHistory } from '../useDefinitionDraftHistory';
import InputRegionBoundary from '../../../keyboard/InputRegionBoundary.vue';
import { ABILITY_ENTITY_IDS_KEY } from '../operators/abilityEntityEditorContext';

const props = defineProps<{
  visible: boolean;
  embedded?: boolean;
  title: string;
  templateDefinition: SkillDefinition | null;
  customDefinition: SkillDefinition | undefined;
  skillLevel: number;
  abilityEntityIds?: readonly string[];
  buffIds?: readonly string[];
  showReferencePins?: boolean;
  allowInvalidSave?: boolean;
  backLabel?: string;
  sharedHistory?: DefinitionDraftHistory<SkillDefinition>;
  viewStateKey?: string;
  navigationRequest?: { readonly propertyPath: readonly (string | number)[] };
}>();

const emit = defineEmits<{
  'update:visible': [visible: boolean];
  save: [definition: SkillDefinition];
  reset: [];
  reference: [reference: { readonly kind: 'buff' | 'entity'; readonly id: string }];
}>();
const { t } = useI18n({ useScope: 'global' });
provide(
  ABILITY_ENTITY_IDS_KEY,
  computed(() => props.abilityEntityIds ?? []),
);

const labels = () => ({
  section: t('timeline.skillEditing.section'),
  customized: t('timeline.skillEditing.customized'),
  timelineBlockFrames: t('timeline.skillEditing.timelineBlockFrames'),
  cooldownFrames: t('timeline.skillEditing.cooldownFrames'),
  levelArrayValue: t('timeline.skillEditing.levelArray'),
  costFrame: t('timeline.skillEditing.costFrame'),
  costs: t('timeline.skillEditing.costs'),
  costResource: t('timeline.skillEditing.resource'),
  costValue: t('timeline.skillEditing.value'),
  scheduledSequences: t('timeline.skillEditing.sequences'),
  startFrame: t('timeline.skillEditing.startFrame'),
  endFrame: t('timeline.skillEditing.endFrame'),
  stepKinds: t('timeline.skillEditing.steps'),
  save: t('timeline.skillEditing.save'),
  cancel: t('timeline.skillEditing.cancel'),
  reset: t('timeline.skillEditing.reset'),
  overview: t('timeline.skillEditing.overview'),
  structure: t('timeline.skillEditing.structure'),
  sequence: t('timeline.skillEditing.sequence'),
});
</script>

<template>
  <SkillDefinitionEditor
    v-if="embedded && visible && templateDefinition !== null"
    :template="templateDefinition"
    :custom-definition="customDefinition"
    :skill-level="skillLevel"
    :buff-ids="buffIds"
    :labels="labels()"
    :show-reference-pins="showReferencePins"
    :allow-invalid-save="allowInvalidSave"
    :back-label="backLabel"
    :shared-history="sharedHistory"
    :view-state-key="viewStateKey"
    :navigation-request="navigationRequest"
    @save="emit('save', $event)"
    @cancel="emit('update:visible', false)"
    @reset="emit('reset')"
    @reference="emit('reference', $event)"
  />
  <EaDialog
    v-else
    :model-value="visible"
    :title="`${t('timeline.skillEditing.section')} · ${title}`"
    width="min(1600px, calc(100vw - 32px))"
    top="16px"
    append-to-body
    destroy-on-close
    class="skill-definition-dialog definition-workspace-dialog definition-workspace-dialog--skill"
    @update:model-value="emit('update:visible', $event)"
  >
    <InputRegionBoundary label="skill-definition-dialog" :active="visible" modal>
      <SkillDefinitionEditor
        v-if="templateDefinition !== null"
        :template="templateDefinition"
        :custom-definition="customDefinition"
        :skill-level="skillLevel"
        :buff-ids="buffIds"
        :labels="labels()"
        :show-reference-pins="showReferencePins"
        :allow-invalid-save="allowInvalidSave"
        :back-label="backLabel"
        :navigation-request="navigationRequest"
        @save="emit('save', $event)"
        @cancel="emit('update:visible', false)"
        @reset="emit('reset')"
        @reference="emit('reference', $event)"
      />
    </InputRegionBoundary>
  </EaDialog>
</template>
