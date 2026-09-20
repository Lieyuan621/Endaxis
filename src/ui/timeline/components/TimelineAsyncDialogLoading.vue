<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div class="timeline-async-dialog-loading" role="status" aria-live="polite">
    <span class="timeline-async-dialog-loading__spinner" aria-hidden="true" />
    <span>{{ t('timeline.loading') }}</span>
  </div>
</template>

<style scoped>
.timeline-async-dialog-loading {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--ea-fg);
  background: rgb(0 0 0 / 55%);
}

.timeline-async-dialog-loading__spinner {
  width: 22px;
  height: 22px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: timeline-async-dialog-spin 0.8s linear infinite;
}

@keyframes timeline-async-dialog-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
