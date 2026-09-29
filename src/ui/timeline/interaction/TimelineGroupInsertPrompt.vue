<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton } from '../../../design-system/index';
import { useKeyboardShortcutScope } from '../../keyboard/keyboardShortcutRouter';

const props = defineProps<{ x: number; y: number }>();
const emit = defineEmits<{ join: []; close: [] }>();
const { t } = useI18n();
const panel = ref<HTMLElement>();
const position = ref({ left: '0px', top: '0px' });
async function reposition() {
  await nextTick();
  const bounds = panel.value?.getBoundingClientRect();
  if (!bounds) return;
  position.value = {
    left: `${Math.max(6, Math.min(props.x, window.innerWidth - bounds.width - 6))}px`,
    top: `${Math.max(6, Math.min(props.y + 8, window.innerHeight - bounds.height - 6))}px`,
  };
}
function outside(event: PointerEvent) {
  if (!panel.value?.contains(event.target as Node)) emit('close');
}
useKeyboardShortcutScope({
  id: 'timeline-group-insert-prompt',
  priority: 300,
  active: () => true,
  blockLowerScopes: true,
  handle: event => {
    if (event.key !== 'Escape') return false;
    emit('close');
    return true;
  },
});
watch(() => [props.x, props.y], reposition, { immediate: true });
onMounted(() => {
  window.addEventListener('pointerdown', outside, true);
  window.addEventListener('resize', reposition);
});
onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', outside, true);
  window.removeEventListener('resize', reposition);
});
</script>

<template>
  <Teleport to="body">
    <div
      ref="panel"
      class="group-insert-prompt"
      :style="position"
      @pointerdown.stop
      @contextmenu.prevent.stop
    >
      <EaButton size="sm" @click="emit('join')">{{ t('timeline.continuousGroup.join') }}</EaButton>
    </div>
  </Teleport>
</template>

<style scoped>
.group-insert-prompt {
  position: fixed;
  z-index: 100000;
  display: flex;
  border-radius: var(--ea-control-radius);
  background: var(--ea-panel-elevated);
  box-shadow: 0 4px 12px #0006;
}
</style>
