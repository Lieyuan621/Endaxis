<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div class="timeline-async-dialog-loading" role="status" aria-live="polite">
    <span class="ea-loading-indicator" aria-hidden="true" />
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

.timeline-async-dialog-loading .ea-loading-indicator {
  color: var(--ea-gold);
}
</style>
