<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { ref } from 'vue';
import { EaButton } from '../../../design-system/index';

const props = defineProps<{
  error: string | null;
}>();
const { t } = useI18n();
const errorText = ref<HTMLTextAreaElement>();
async function copyError() {
  if (props.error === null) return;
  try {
    await navigator.clipboard.writeText(props.error);
  } catch {
    // 浏览器不允许剪贴板写入时仍能用 Ctrl+C 复制完整文本，不再抛出第二条错误。
    errorText.value?.focus();
    errorText.value?.select();
  }
}
</script>

<template>
  <aside
    v-if="error !== null"
    class="simulation-error-notice"
    role="alert"
    @pointerdown.stop
    @mousedown.stop
    @keydown.stop
  >
    <header>
      <strong>{{ t('timeline.simulationFailed') }}</strong>
      <EaButton size="sm" variant="ghost" @click="copyError">{{ t('common.copy') }}</EaButton>
    </header>
    <textarea
      ref="errorText"
      readonly
      :value="error"
      :aria-label="t('timeline.simulationFailed')"
      spellcheck="false"
    />
  </aside>
</template>

<style scoped>
.simulation-error-notice {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 3000;
  box-sizing: border-box;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 3px;
  width: 360px;
  height: 120px;
  padding: 9px 12px;
  border: 1px solid rgb(210 75 75 / 45%);
  border-radius: 6px;
  background: var(--ea-bg-elevated);
  box-shadow: 0 6px 18px rgb(0 0 0 / 22%);
  color: var(--ea-fg-muted);
  font-size: 11px;
  pointer-events: auto;
  user-select: text;
  -webkit-user-select: text;
}

.simulation-error-notice header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.simulation-error-notice strong {
  color: #d94b4b;
  font-size: 12px;
  line-height: 16px;
}

.simulation-error-notice textarea {
  width: 100%;
  min-height: 0;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  resize: none;
  overflow: auto;
  user-select: text;
  -webkit-user-select: text;
  line-height: 15px;
  overflow-wrap: anywhere;
}

@media (max-width: 480px) {
  .simulation-error-notice {
    right: 12px;
    bottom: 12px;
    width: calc(100vw - 24px);
  }
}
</style>
