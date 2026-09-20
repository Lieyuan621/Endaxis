<script setup lang="ts">
import { shallowRef, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaDialog, EaDialogActions, EaInput } from '@/design-system';
import type { GlobalBuffDocument } from '../../../core/project/schema';
import { validateGlobalConfig } from '../../../core/project/scenarioValidation';
import InputRegionBoundary from '../../keyboard/InputRegionBoundary.vue';
import BuffDefinitionGraphEditor from '../definitions/buffs/BuffDefinitionGraphEditor.vue';
const props = defineProps<{ buff: GlobalBuffDocument }>();
const emit = defineEmits<{ save: [buff: GlobalBuffDocument]; close: [] }>();
const { t } = useI18n({ useScope: 'global' });
const draft = shallowRef<GlobalBuffDocument>(JSON.parse(JSON.stringify(props.buff)));
const error = ref('');
function save() {
  const value = { ...draft.value, name: draft.value.name.trim() };
  const issues: { path: string; message: string }[] = [];
  validateGlobalConfig({ modifiers: [], customBuffs: [value] }, 'globalConfig', issues);
  error.value = issues.map(issue => issue.message).join('\n');
  if (!issues.length) emit('save', value);
}
</script>
<template>
  <InputRegionBoundary label="global-buff-editor" active modal>
    <EaDialog
      :model-value="true"
      width="min(1200px, 95vw)"
      append-to-body
      align-center
      class="armory-dialog global-buff-dialog"
      :title="t('globalConfig.customBuff')"
      @update:model-value="emit('close')"
    >
      <label class="buff-name"
        >{{ t('globalConfig.buffName') }}
        <EaInput
          :model-value="draft.name"
          @update:model-value="draft = { ...draft, name: $event }"
        />
      </label>
      <div class="buff-graph">
        <BuffDefinitionGraphEditor
          :buff-id="draft.id"
          :definition="draft.definition"
          :skill-level="1"
          fill-available
          @update="draft = { ...draft, definition: $event }"
        />
      </div>
      <p v-if="error" role="alert" class="buff-error">{{ error }}</p>
      <template #footer>
        <EaDialogActions>
          <EaButton @click="emit('close')">{{ t('common.cancel') }}</EaButton>
          <EaButton @click="save">{{ t('common.confirm') }}</EaButton>
        </EaDialogActions>
      </template>
    </EaDialog>
  </InputRegionBoundary>
</template>
<style scoped>
.buff-name {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.buff-name :deep(.ea-input) {
  flex: 1;
}
.buff-graph {
  height: 60vh;
  min-height: 320px;
}
.buff-error {
  color: var(--ea-danger);
  white-space: pre-wrap;
}
</style>
