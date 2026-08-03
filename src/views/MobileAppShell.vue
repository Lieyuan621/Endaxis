<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { registerBackHandler } from '@/platform/nativeBridge';
import MobileTimelineViewer from './MobileTimelineViewer.vue';
import MobileAnalysisView from './mobile/MobileAnalysisView.vue';

type AppView = 'timeline' | 'analysis';

const { t } = useI18n({ useScope: 'global' });
const view = ref<AppView>('timeline');
let unregisterBackHandler: (() => void) | null = null;

onMounted(() => {
  unregisterBackHandler = registerBackHandler(() => {
    if (view.value === 'timeline') return false;
    view.value = 'timeline';
    return true;
  });
});

onUnmounted(() => {
  unregisterBackHandler?.();
});
</script>

<template>
  <div class="mobile-app-shell">
    <main class="app-content">
      <MobileTimelineViewer v-if="view === 'timeline'" />
      <MobileAnalysisView v-else />
    </main>

    <nav class="bottom-nav" :aria-label="t('timeline.mobile.app.navigation')">
      <button type="button" :class="{ active: view === 'timeline' }" @click="view = 'timeline'">
        <svg
          class="nav-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="16" />
          <path d="M6 15c2.2 0 2.8-6 5-6s2.8 6 5 6c1.5 0 2.1-2.1 3-3.3" />
        </svg>
        {{ t('timeline.mobile.app.timeline') }}
      </button>
      <button type="button" :class="{ active: view === 'analysis' }" @click="view = 'analysis'">
        <svg
          class="nav-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12a9 9 0 1 1-9-9v9z" />
          <path d="M12 3a9 9 0 0 1 9 9h-9z" />
        </svg>
        {{ t('timeline.mobile.app.analysis') }}
      </button>
    </nav>
  </div>
</template>

<style scoped>
.mobile-app-shell {
  width: 100%;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--ea-bg);
  color: var(--ea-fg);
}
.app-content {
  width: 100%;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}
.bottom-nav {
  min-height: 58px;
  padding-bottom: env(safe-area-inset-bottom);
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  border-top: 1px solid var(--ea-border);
  background: var(--ea-chrome);
}
.bottom-nav button {
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--ea-fg-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  font-size: 10px;
}
.nav-icon {
  width: 21px;
  height: 21px;
  flex: 0 0 21px;
}
.bottom-nav button.active {
  color: var(--ea-gold);
}
</style>
