<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaDialog, EaDialogActions } from '@/design-system';
import type { OperatorBuildPreset } from '../../../application/editor/operatorBuildPreset';
import type { GameDataRepository } from '../../../core/game-data/gameDataRepository';
import OperatorPresetSelection from './OperatorPresetSelection.vue';
defineProps<{ presets: readonly OperatorBuildPreset[]; gameData: GameDataRepository }>();
const emit = defineEmits<{ close: []; confirm: [presets: OperatorBuildPreset[]] }>();
const { t } = useI18n();
const chosen = ref<OperatorBuildPreset[]>([]);
</script>
<template>
  <EaDialog
    :model-value="true"
    :title="t('operatorPresets.import')"
    size="lg"
    scroll-mode="body"
    @update:model-value="emit('close')"
  >
    <p>{{ t('operatorPresets.importInfo') }}</p>
    <OperatorPresetSelection :presets="presets" :game-data="gameData" @change="chosen = $event" />
    <template #footer
      ><EaDialogActions>
        <EaButton @click="emit('close')">{{ t('operatorPresets.cancel') }}</EaButton>
        <EaButton variant="primary" :disabled="!chosen.length" @click="emit('confirm', chosen)">{{
          t('operatorPresets.importSelected')
        }}</EaButton>
      </EaDialogActions></template
    >
  </EaDialog>
</template>
