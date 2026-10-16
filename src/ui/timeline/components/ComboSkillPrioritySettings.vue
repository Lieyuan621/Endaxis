<script setup lang="ts">
import { EaButton } from '@/design-system';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  enabled: boolean;
  readOnly?: boolean;
  operators: readonly { id: string | null; name: string; avatar: string | null }[];
}>();
const emit = defineEmits<{
  toggle: [];
  reorder: [order: string[]];
}>();
const { t } = useI18n();
const draft = ref<typeof props.operators | null>(null);
const draggedId = ref<string | null>(null);
const items = computed(() => draft.value ?? props.operators);
let pointerId: number | null = null;
let capture: HTMLElement | null = null;
let startX = 0;
let moved = false;

function cancel(): void {
  const id = pointerId;
  pointerId = null;
  if (id !== null && capture?.hasPointerCapture(id)) capture.releasePointerCapture(id);
  capture = null;
  draft.value = null;
  draggedId.value = null;
}
watch(() => [props.operators, props.enabled, props.readOnly], cancel);
onBeforeUnmount(cancel);

function begin(event: PointerEvent, id: string | null): void {
  if (event.button !== 0 || !event.isPrimary || props.readOnly || id === null) return;
  event.preventDefault();
  capture = (event.currentTarget as HTMLElement).parentElement;
  if (!capture) return;
  pointerId = event.pointerId;
  startX = event.clientX;
  moved = false;
  draft.value = [...props.operators];
  draggedId.value = id;
  capture.setPointerCapture(event.pointerId);
}

function move(event: PointerEvent): void {
  if (event.pointerId !== pointerId || !capture || !draft.value) return;
  if (!moved && Math.abs(event.clientX - startX) < 4) return;
  moved = true;
  const buttons = Array.from(capture.querySelectorAll<HTMLElement>('[data-priority-index]'));
  let targetIndex = 0;
  let distance = Infinity;
  buttons.forEach((button, index) => {
    if (draft.value?.[index]?.id === null) return;
    const rect = button.getBoundingClientRect();
    const next = Math.abs(event.clientX - (rect.left + rect.width / 2));
    if (next < distance) {
      distance = next;
      targetIndex = index;
    }
  });
  const current = draft.value.findIndex(item => item.id === draggedId.value);
  if (current < 0 || current === targetIndex) return;
  const order = [...draft.value];
  const [item] = order.splice(current, 1);
  order.splice(targetIndex, 0, item!);
  draft.value = order;
}

function finish(event: PointerEvent): void {
  if (event.pointerId !== pointerId) return;
  const order = moved
    ? draft.value?.flatMap(item => (item.id === null ? [] : [item.id]))
    : undefined;
  cancel();
  if (order) emit('reorder', order);
}

function keyboardMove(event: KeyboardEvent, index: number): void {
  if (props.readOnly || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  const next = index + (event.key === 'ArrowLeft' ? -1 : 1);
  if (!items.value[next]?.id) return;
  event.preventDefault();
  const order = [...items.value];
  [order[index], order[next]] = [order[next]!, order[index]!];
  emit(
    'reorder',
    order.flatMap(item => (item.id === null ? [] : [item.id])),
  );
}
</script>

<template>
  <div class="header-more-checklist">
    <EaButton
      class="header-more-check-row header-more-tool-row"
      :aria-pressed="enabled"
      :disabled="readOnly"
      @click="emit('toggle')"
    >
      <svg
        class="header-more-tool-row__icon"
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M4 6h16M4 12h12M4 18h8" />
      </svg>
      <span class="header-more-tool-row__label">{{ t('timeline.header.comboSkillPriority') }}</span>
      <svg
        class="header-more-tool-row__check"
        viewBox="0 0 16 16"
        width="13"
        height="13"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        aria-hidden="true"
      >
        <rect x="1" y="1" width="14" height="14" rx="2" />
        <polyline v-if="enabled" points="3,8 6.5,11.5 13,4.5" />
      </svg>
    </EaButton>
    <div
      v-if="enabled"
      class="combo-priority__portraits"
      @pointermove="move"
      @pointerup="finish"
      @pointercancel="cancel"
      @lostpointercapture="cancel"
      @keydown.esc="cancel"
    >
      <button
        v-for="(operator, index) in items"
        :key="operator.id ?? `empty:${index}`"
        type="button"
        class="combo-priority__operator"
        :class="{ dragging: draggedId === operator.id && operator.id !== null }"
        :data-priority-index="index"
        :disabled="readOnly || operator.id === null"
        :title="operator.name"
        :aria-label="operator.name"
        @pointerdown="begin($event, operator.id)"
        @keydown="keyboardMove($event, index)"
        @dragstart.prevent
      >
        <img
          v-if="operator.avatar"
          :src="operator.avatar"
          :alt="operator.name"
          class="operator-avatar-crop"
          draggable="false"
        />
        <span v-else class="combo-priority__empty" aria-hidden="true">—</span>
        <span class="combo-priority__rank">{{ index + 1 }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.combo-priority__portraits {
  display: flex;
  justify-content: center;
  gap: 10px;
  padding: 8px 10px;
  user-select: none;
  -webkit-user-select: none;
}
.combo-priority__operator {
  position: relative;
  width: 52px;
  height: 64px;
  padding: 0 0 12px;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: grab;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
.combo-priority__operator img {
  width: 52px;
  height: 52px;
  object-fit: cover;
  border: 1px solid var(--ea-border);
  border-radius: 50%;
  pointer-events: none;
}
.combo-priority__operator:hover img,
.combo-priority__operator.dragging img {
  border-color: var(--ea-gold);
}
.combo-priority__operator.dragging {
  cursor: grabbing;
  opacity: 0.65;
}
.combo-priority__operator:disabled {
  cursor: default;
}
.combo-priority__empty {
  display: grid;
  place-items: center;
  height: 52px;
  border: 1px dashed var(--ea-border);
  border-radius: 50%;
  opacity: 0.5;
}
.combo-priority__rank {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  font-size: 11px;
  line-height: 12px;
  color: var(--ea-fg-secondary);
}
</style>
