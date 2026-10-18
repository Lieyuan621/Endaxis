<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaCheckbox, EaDialog, EaDialogActions } from '@/design-system';
import type { OperatorBuildPreset } from '../../../application/editor/operatorBuildPreset';
import type { GameDataRepository } from '../../../core/game-data/gameDataRepository';
import InputRegionBoundary from '../../keyboard/InputRegionBoundary.vue';
import OperatorPresetBuildSummary from './OperatorPresetBuildSummary.vue';

const props = defineProps<{
  mode: 'import' | 'export';
  presets: readonly OperatorBuildPreset[];
  gameData: GameDataRepository;
}>();
const emit = defineEmits<{ close: []; confirm: [presets: OperatorBuildPreset[]] }>();
const { t } = useI18n();
const selected = ref(new Set(props.presets.map(preset => preset.id)));
const chosen = computed(() => props.presets.filter(preset => selected.value.has(preset.id)));
function toggle(id: string, checked: boolean) {
  if (checked) selected.value.add(id);
  else selected.value.delete(id);
}
</script>
<template>
  <InputRegionBoundary label="preset-transfer" active modal>
    <EaDialog
      :model-value="true"
      :title="t(`operatorPresets.${mode}`)"
      size="lg"
      scroll-mode="body"
      @update:model-value="emit('close')"
    >
      <div class="preset-transfer__toolbar">
        <EaCheckbox
          :model-value="chosen.length === presets.length && presets.length > 0"
          :indeterminate="chosen.length > 0 && chosen.length < presets.length"
          @update:model-value="selected = new Set($event ? presets.map(preset => preset.id) : [])"
          >{{ t('operatorPresets.selectAll') }}</EaCheckbox
        >
        <span>{{
          t('operatorPresets.selectedCount', { count: chosen.length, total: presets.length })
        }}</span>
      </div>
      <div class="preset-transfer__list">
        <article v-for="preset in presets" :key="preset.id" class="preset-transfer__card">
          <EaCheckbox
            :model-value="selected.has(preset.id)"
            @update:model-value="toggle(preset.id, $event)"
            >{{ preset.name }}</EaCheckbox
          >
          <OperatorPresetBuildSummary :build="preset.build" :game-data="gameData" />
        </article>
        <p v-if="!presets.length">{{ t('operatorPresets.noPresets') }}</p>
      </div>
      <template #footer>
        <EaDialogActions>
          <EaButton @click="emit('close')">{{ t('operatorPresets.cancel') }}</EaButton>
          <EaButton variant="primary" :disabled="!chosen.length" @click="emit('confirm', chosen)">{{
            t(`operatorPresets.${mode}Selected`)
          }}</EaButton>
        </EaDialogActions>
      </template>
    </EaDialog>
  </InputRegionBoundary>
</template>
<style scoped>
.preset-transfer__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.preset-transfer__list {
  display: grid;
  gap: 8px;
}
.preset-transfer__card {
  display: grid;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-soft);
}
</style>
