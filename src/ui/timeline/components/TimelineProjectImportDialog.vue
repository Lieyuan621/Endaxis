<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaCheckbox, EaDialog, EaDialogActions } from '@/design-system';
import type { EndaxisProjectDocument } from '../../../core/project/schema';
const props = defineProps<{ project: EndaxisProjectDocument }>();
const emit = defineEmits<{
  close: [];
  confirm: [selection: { mode: 'replace' | 'append'; scenarioIds: string[] }];
}>();
const { t } = useI18n();
const mode = ref<'replace' | 'append'>('append');
const selected = ref(new Set(props.project.scenarios.map(scenario => scenario.id)));
function toggle(id: string, checked: boolean) {
  if (checked) selected.value.add(id);
  else selected.value.delete(id);
}
</script>
<template>
  <EaDialog
    :model-value="true"
    :title="t('projectTransfer.importTitle')"
    width="680px"
    class="custom-dialog"
    scroll-mode="body"
    @update:model-value="emit('close')"
  >
    <section class="project-transfer-section">
      <header class="project-transfer-section__header">
        <h3>{{ t('timeline.export.dataSectionTitle') }}</h3>
        <p>
          {{
            t('projectTransfer.selectedCount', {
              count: mode === 'replace' ? project.scenarios.length : selected.size,
            })
          }}
        </p>
      </header>
      <div
        class="project-transfer-scope"
        role="radiogroup"
        :aria-label="t('projectTransfer.importTitle')"
      >
        <EaButton
          size="sm"
          role="radio"
          :aria-checked="mode === 'replace'"
          :pressed="mode === 'replace'"
          @click="mode = 'replace'"
          >{{ t('projectTransfer.replace') }}</EaButton
        >
        <EaButton
          size="sm"
          role="radio"
          :aria-checked="mode === 'append'"
          :pressed="mode === 'append'"
          @click="mode = 'append'"
          >{{ t('projectTransfer.append') }}</EaButton
        >
      </div>
      <p class="project-import__note">
        {{ t(mode === 'replace' ? 'projectTransfer.replaceInfo' : 'projectTransfer.appendInfo') }}
      </p>
      <div v-if="mode === 'append'" class="project-transfer-toolbar">
        <EaCheckbox
          :model-value="selected.size === project.scenarios.length"
          :indeterminate="selected.size > 0 && selected.size < project.scenarios.length"
          @update:model-value="
            selected = new Set($event ? project.scenarios.map(scenario => scenario.id) : [])
          "
          >{{ t('operatorPresets.selectAll') }}</EaCheckbox
        >
      </div>
      <div class="project-transfer-list">
        <div v-for="scenario in project.scenarios" :key="scenario.id">
          <EaCheckbox
            v-if="mode === 'append'"
            :model-value="selected.has(scenario.id)"
            @update:model-value="toggle(scenario.id, $event)"
            >{{ scenario.name }}</EaCheckbox
          >
          <span v-else class="project-transfer-list__row">{{ scenario.name }}</span>
        </div>
      </div>
    </section>
    <template #footer
      ><EaDialogActions>
        <EaButton size="sm" @click="emit('close')">{{ t('common.cancel') }}</EaButton>
        <EaButton
          variant="primary"
          size="sm"
          :disabled="mode === 'append' && !selected.size"
          @click="emit('confirm', { mode, scenarioIds: [...selected] })"
          >{{
            t(
              mode === 'replace'
                ? 'projectTransfer.confirmReplace'
                : 'projectTransfer.confirmAppend',
            )
          }}</EaButton
        >
      </EaDialogActions></template
    >
  </EaDialog>
</template>
<style scoped src="./projectTransfer.css"></style>
<style scoped>
.project-import__note {
  margin: 0;
  color: var(--ea-fg-muted);
  font-size: 12px;
  line-height: 1.6;
}
</style>
