<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { EaButton } from '@/design-system';
import { useOverlayI18n } from '../../features/overlay/renderer/messages';
import type { PortableUpdateState } from './editorApi';

const { t } = useOverlayI18n();
const state = ref<PortableUpdateState>({ phase: 'idle' });
let disposed = false;
let unsubscribe: (() => void) | undefined;

onMounted(async () => {
  const api = window.endaxisDesktopEditor;
  if (!api?.onUpdateProgress) return;
  let receivedEvent = false;
  unsubscribe = api.onUpdateProgress(next => {
    receivedEvent = true;
    state.value = next;
  });
  const current = await api.updateState();
  if (!disposed && !receivedEvent && current) state.value = current;
});
onUnmounted(() => {
  disposed = true;
  unsubscribe?.();
  unsubscribe = undefined;
});
function restart() {
  void window.endaxisDesktopEditor?.restartUpdate();
}
function retry() {
  void window.endaxisDesktopEditor?.retryUpdate();
}
</script>

<template>
  <aside v-if="state.phase !== 'idle'" class="update-panel" :aria-label="t('update.title')">
    <strong role="status">{{ t('update.' + state.phase) }}</strong>
    <template v-if="state.phase === 'preparing'">
      <progress
        :value="state.completed"
        :max="state.total || 1"
        :aria-label="t('update.preparing')"
      />
      <small
        >{{ state.version }} · {{ Math.floor((100 * state.completed) / (state.total || 1)) }}% ·
        {{ t('update.downloaded', { size: (state.received / 1048576).toFixed(1) }) }}</small
      >
    </template>
    <template v-else-if="state.phase === 'ready'">
      <span>{{ state.version }}</span>
    </template>
    <span v-else-if="state.phase === 'failed'">{{ state.message }}</span>
    <div v-if="state.phase === 'failed' || state.phase === 'ready'" class="actions">
      <EaButton v-if="state.phase === 'ready'" size="sm" @click="restart">{{
        t('update.restart')
      }}</EaButton>
      <EaButton v-if="state.phase === 'failed'" size="sm" @click="retry">{{
        t('update.retry')
      }}</EaButton>
      <EaButton size="sm" @click="state = { phase: 'idle' }">{{ t('update.close') }}</EaButton>
    </div>
  </aside>
</template>

<style scoped>
.update-panel {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 2000;
  display: grid;
  gap: 0.5rem;
  width: min(21rem, calc(100vw - 2rem));
  box-sizing: border-box;
  padding: 0.9rem 1rem;
  background: var(--el-bg-color-overlay, #29292b);
  color: var(--el-text-color-primary, #eee);
  border: 1px solid var(--el-border-color, #555);
  box-shadow: 0 4px 18px #0004;
  overflow-wrap: anywhere;
}
progress {
  width: 100%;
  accent-color: #e4ba42;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
