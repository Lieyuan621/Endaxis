<script setup lang="ts">
/**
 * 统一展示干员宽松转换提示，并在渲染边界把稳定能力代码翻译为用户文本。
 * 调用方不应传入生成器原始错误；完整支持时组件不产生 DOM。
 */
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { OperatorSupportViewModel } from './operatorSupportViewModel';

const props = withDefaults(
  defineProps<{
    support: OperatorSupportViewModel | null;
    compact?: boolean;
  }>(),
  { compact: false },
);

const { t } = useI18n({ useScope: 'global' });
const visible = computed(() => props.support?.completeness === 'partial');
const title = computed(() => {
  const capabilities = props.support?.missingCapabilities ?? [];
  const details = capabilities.map(item => {
    const label = t(`timeline.operatorSupport.capabilities.${item.capability}`);
    return item.skillGroupKeys?.length
      ? t('timeline.operatorSupport.scopedCapability', {
          capability: label,
          groups: item.skillGroupKeys.join(', '),
        })
      : label;
  });
  return [t('timeline.operatorSupport.partial'), ...details].join('\n');
});
</script>

<template>
  <span
    v-if="visible"
    class="operator-support-notice"
    :class="{ compact }"
    :title="title"
    role="status"
  >
    <span class="operator-support-notice__icon" aria-hidden="true">!</span>
    <span v-if="!compact">{{ t('timeline.operatorSupport.partial') }}</span>
  </span>
</template>

<style scoped>
.operator-support-notice {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--el-color-warning, #e6a23c);
  font-size: 11px;
  line-height: 1.2;
}

.operator-support-notice__icon {
  display: inline-grid;
  width: 14px;
  height: 14px;
  place-items: center;
  border: 1px solid currentColor;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 700;
}

.operator-support-notice.compact {
  position: absolute;
  top: 3px;
  right: 3px;
  z-index: 3;
}
</style>
