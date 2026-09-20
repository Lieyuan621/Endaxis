<script setup lang="ts">
import { computed, nextTick, onMounted, onBeforeUnmount, ref } from 'vue';
import { useInteractionSession } from '../../interaction/interactionSessionContext';
import { usePopoverInteractionBoundary } from '../../interaction/usePopoverInteractionBoundary';
const props = defineProps<{
  anchor: { x: number; y: number };
  title: string;
  options: readonly { value: string; label: string; detail?: string }[];
}>();
const emit = defineEmits<{ select: [kind: string]; close: [] }>();
const popover = ref<HTMLElement>();
const search = ref<HTMLInputElement>();
const query = ref('');
const focused = ref(0);
const position = ref({ left: '12px', top: '12px', maxHeight: '320px' });
const filtered = computed(() =>
  props.options.filter(option =>
    `${option.label} ${option.value}`.toLowerCase().includes(query.value.trim().toLowerCase()),
  ),
);
usePopoverInteractionBoundary(
  useInteractionSession(),
  () => true,
  () => emit('close'),
);
function place() {
  const height = Math.min(420, window.innerHeight - 24);
  position.value = {
    left: `${Math.max(12, Math.min(props.anchor.x, window.innerWidth - 292))}px`,
    top: `${Math.max(12, Math.min(props.anchor.y, window.innerHeight - height - 12))}px`,
    maxHeight: `${height}px`,
  };
}
function outside(event: PointerEvent) {
  if (!popover.value?.contains(event.target as Node)) emit('close');
}
function keys(event: KeyboardEvent) {
  if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) return;
  event.preventDefault();
  event.stopPropagation();
  if (event.key === 'Enter') {
    const kind = filtered.value[focused.value];
    if (kind) emit('select', kind.value);
    return;
  }
  const count = filtered.value.length;
  focused.value = count
    ? (focused.value + (event.key === 'ArrowDown' ? 1 : -1) + count) % count
    : 0;
  void nextTick(() =>
    popover.value?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }),
  );
}
onMounted(() => {
  place();
  search.value?.focus();
  document.addEventListener('pointerdown', outside);
  window.addEventListener('resize', place);
});
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', outside);
  window.removeEventListener('resize', place);
});
</script>
<template>
  <Teleport to="body"
    ><section
      ref="popover"
      class="reference-picker"
      :style="position"
      :aria-label="title"
      @keydown="keys"
    >
      <input
        ref="search"
        v-model="query"
        :aria-label="`搜索${title}`"
        :placeholder="`搜索${title}`"
        @input="focused = 0"
      />
      <div role="listbox" :aria-label="title">
        <button
          v-for="(option, index) in filtered"
          :key="option.value"
          role="option"
          :aria-selected="focused === index"
          @click="emit('select', option.value)"
        >
          {{ option.label }}<small v-if="option.detail">{{ option.detail }}</small>
        </button>
        <p v-if="!filtered.length">没有匹配项</p>
      </div>
    </section></Teleport
  >
</template>
<style scoped>
.reference-picker {
  position: fixed;
  z-index: var(--ea-z-popover, 4000);
  width: min(280px, calc(100vw - 24px));
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 8px;
  background: var(--ea-bg-overlay, #262626);
  color: var(--ea-fg);
  border: 1px solid var(--ea-border);
  box-shadow: 0 8px 24px #0008;
}
.reference-picker input {
  width: 100%;
  box-sizing: border-box;
  background: var(--ea-fill-input);
  color: inherit;
  border: 1px solid var(--ea-border);
  padding: 7px;
  margin-bottom: 6px;
}
[role='listbox'] {
  overflow: auto;
  min-height: 0;
}
.reference-picker button {
  display: block;
  width: 100%;
  padding: 7px 8px;
  text-align: left;
  background: transparent;
  color: inherit;
  border: 0;
}
.reference-picker button:hover,
.reference-picker [aria-selected='true'] {
  background: var(--ea-fill-hover, #454545);
}
.reference-picker p {
  font-size: 12px;
  color: var(--ea-text-secondary);
}
.reference-picker small {
  display: block;
  opacity: 0.65;
  margin-top: 3px;
}
.reference-picker button {
  overflow-wrap: anywhere;
}
</style>
