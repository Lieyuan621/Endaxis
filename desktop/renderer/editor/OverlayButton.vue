<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { EaButton } from '@/design-system';
import type { TimelineExportContext } from '@/ui/timeline/timelineEditorHost';
import { exportEditorOverlay } from '../../features/overlay/renderer/exportEditorOverlay';
import { useOverlayI18n } from '../../features/overlay/renderer/messages';

const props = defineProps<{ context: TimelineExportContext }>();
const { t } = useOverlayI18n();

let enabled = false;
let channel: BroadcastChannel | null = null;
let running = false;
let pending = false;
let openRequested = false;
let disposed = false;

async function publish(showWindow = false) {
  pending = true;
  openRequested ||= showWindow;
  if (running) return;
  running = true;
  try {
    while (pending && !disposed) {
      pending = false;
      const show = openRequested;
      openRequested = false;
      await exportEditorOverlay({
        repository: props.context.repository,
        ensureCurrentSimulation: props.context.ensureCurrentSimulation,
        read: props.context.read,
        showWindow: show,
        message: key => t(`overlay.${key}`),
        onError: message => {
          if (show || !pending) ElMessage.error(message);
        },
      });
    }
  } finally {
    running = false;
  }
}
function openOverlay() {
  enabled = true;
  void publish(true);
}
watch(
  () => {
    const state = props.context.read();
    return [state.project.activeScenarioId, state.revision, state.published, state.locale];
  },
  () => {
    const state = props.context.read();
    const active = state.project.scenarios.find(item => item.id === state.project.activeScenarioId);
    // 自动同步等待编辑器发布当前方案，不因拖动中的每次修改额外发起模拟。
    if (enabled && state.published?.scenario === active) void publish();
  },
  { flush: 'post' },
);
onMounted(() => {
  channel = new BroadcastChannel('endaxis-overlay');
  channel.onmessage = event => {
    if (event.data !== 'request-refresh') return;
    enabled = true;
    void publish();
  };
  // 编辑器刷新后，仍打开的提示条重新订阅当前方案。
  channel.postMessage('editor-ready');
});
onUnmounted(() => {
  disposed = true;
  channel?.close();
});
</script>

<template>
  <EaButton
    size="sm"
    type="button"
    class="command-button--overlay"
    :title="t('overlay.openHint')"
    @click="openOverlay"
  >
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <rect x="2.5" y="4.5" width="19" height="12" rx="2" />
      <path d="M8 20h8" />
      <path d="M12 16.5V20" />
    </svg>
    {{ t('overlay.open') }}
  </EaButton>
</template>
