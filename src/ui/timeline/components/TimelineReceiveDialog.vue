<script setup lang="ts">
/** 接收导出的数据码；解码和打开项目由时间轴页面处理。 */
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaDialog, EaDialogActions, EaTextarea } from '@/design-system';

const props = defineProps<{ visible: boolean; busy: boolean }>();
const emit = defineEmits<{
  'update:visible': [visible: boolean];
  receive: [code: string];
}>();
const { t } = useI18n({ useScope: 'global' });
const code = ref('');

watch(
  () => props.visible,
  visible => {
    if (visible) code.value = '';
  },
);
</script>

<template>
  <EaDialog
    :model-value="visible"
    :title="t('timeline.import.dialogTitle')"
    width="500px"
    align-center
    class="custom-dialog"
    @update:model-value="emit('update:visible', $event)"
  >
    <p>{{ t('timeline.import.dialogHint') }}</p>
    <EaTextarea
      v-model="code"
      variant="code"
      :rows="6"
      :placeholder="t('timeline.import.dialogPlaceholder')"
      resize="none"
    />
    <template #footer>
      <EaDialogActions>
        <EaButton size="sm" type="button" :disabled="busy" @click="emit('update:visible', false)">
          {{ t('common.cancel') }}
        </EaButton>
        <EaButton
          variant="primary"
          size="sm"
          type="button"
          :disabled="busy || !code.trim()"
          @click="emit('receive', code.trim())"
        >
          {{ t('timeline.import.dialogConfirm') }}
        </EaButton>
      </EaDialogActions>
    </template>
  </EaDialog>
</template>
