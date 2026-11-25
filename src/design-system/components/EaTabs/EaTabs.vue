<script setup lang="ts">
interface EaTabItem {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
  readonly id?: string;
  readonly panelId?: string;
}

const props = withDefaults(
  defineProps<{
    tabs: readonly EaTabItem[];
    modelValue: string;
    label: string;
    size?: 'sm' | 'md';
  }>(),
  { size: 'md' },
);

const emit = defineEmits<{
  'update:modelValue': [value: string, event: MouseEvent | KeyboardEvent];
}>();

function selectTab(tab: EaTabItem, event: MouseEvent | KeyboardEvent): void {
  if (!tab.disabled && tab.value !== props.modelValue) emit('update:modelValue', tab.value, event);
}

function onKeydown(event: KeyboardEvent, tab: EaTabItem): void {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  const enabled = props.tabs.filter(item => !item.disabled);
  if (enabled.length === 0) return;
  event.preventDefault();
  const current = enabled.findIndex(item => item.value === tab.value);
  const next =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? enabled.length - 1
        : (current + (event.key === 'ArrowRight' ? 1 : -1) + enabled.length) % enabled.length;
  const target = enabled[next];
  if (!target) return;
  selectTab(target, event);
  const buttons = (
    event.currentTarget as HTMLElement
  ).parentElement?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
  buttons?.[next]?.focus();
}
</script>

<template>
  <div
    class="ea-tabs"
    :class="`ea-tabs--${size}`"
    :style="{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }"
    role="tablist"
    :aria-label="label"
  >
    <button
      v-for="tab in tabs"
      :id="tab.id"
      :key="tab.value"
      type="button"
      role="tab"
      :disabled="tab.disabled"
      :aria-selected="modelValue === tab.value"
      :aria-controls="tab.panelId"
      :tabindex="modelValue === tab.value ? 0 : -1"
      :class="{ 'is-active': modelValue === tab.value }"
      @click="selectTab(tab, $event)"
      @keydown="onKeydown($event, tab)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<style scoped>
.ea-tabs {
  display: grid;
  width: 100%;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--ea-border-soft);
  background: var(--ea-fill-soft);
  box-sizing: border-box;
}

.ea-tabs button {
  min-width: 0;
  min-height: 34px;
  padding: 5px 14px;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--ea-fg-secondary);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 140ms ease,
    color 140ms ease,
    box-shadow 140ms ease;
}

.ea-tabs button:hover:not(:disabled) {
  color: var(--ea-fg);
  background: var(--ea-fill-muted);
}

.ea-tabs button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ea-tabs button.is-active,
.ea-tabs button.is-active:hover {
  color: var(--ea-gold);
  background: color-mix(in srgb, var(--ea-gold) 6%, var(--ea-dialog-bg));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ea-gold) 30%, transparent);
}

.ea-tabs button:focus-visible {
  outline: 1px solid var(--ea-gold);
  outline-offset: -2px;
}

.ea-tabs--sm button {
  min-height: 32px;
  padding: 4px 8px;
  font-size: 12px;
}
</style>
