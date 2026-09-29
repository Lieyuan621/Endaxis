<script setup lang="ts">
import { EaButton } from '../../../design-system/index';

const props = defineProps<{
  state: 'base' | 'active' | 'empty' | 'locked';
  label: string;
}>();

const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <EaButton
    size="sm"
    icon-only
    class="armory-level-slot"
    :class="`armory-level-slot--${props.state}`"
    :aria-label="label"
    :pressed="state === 'active' ? true : state === 'empty' ? false : undefined"
    :disabled="state === 'base' || state === 'locked'"
    @click="emit('click')"
  >
    <svg
      v-if="state === 'base' || state === 'active'"
      class="armory-level-slot__icon"
      viewBox="0 0 16 16"
      aria-hidden="true"
    >
      <path d="M4.5 12.5 11.5 3.5" />
    </svg>
    <span v-else-if="state === 'locked'" class="armory-level-slot__locked" aria-hidden="true"
      >&times;</span
    >
  </EaButton>
</template>

<style scoped>
.armory-level-slot.ea-button {
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 0;
  box-shadow: none;
}

.armory-level-slot__icon {
  width: 12px;
  height: 12px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: square;
}

.armory-level-slot--base.ea-button {
  background: var(--ea-fill-muted, rgba(255, 255, 255, 0.12));
  color: var(--ea-fg-secondary, #bbb);
}

.armory-level-slot--active.ea-button {
  background: color-mix(in srgb, var(--ea-gold) 22%, transparent);
  color: var(--ea-gold);
}

.armory-level-slot--empty.ea-button {
  border-color: var(--ea-border, rgba(255, 255, 255, 0.1));
  background: var(--ea-fill-soft, rgba(255, 255, 255, 0.04));
  color: transparent;
}

.armory-level-slot--locked.ea-button {
  background: var(--ea-fill-soft, rgba(255, 255, 255, 0.03));
  color: var(--ea-fg-faint, rgba(255, 255, 255, 0.2));
}

.armory-level-slot--base.ea-button,
.armory-level-slot--locked.ea-button {
  opacity: 1;
  cursor: default;
}

.armory-level-slot__locked {
  font-size: 14px;
  line-height: 1;
}

@media (hover: hover) and (pointer: fine) {
  .armory-level-slot--active.ea-button:hover:not(:disabled) {
    border-color: transparent;
    background: color-mix(in srgb, var(--ea-gold-hover, var(--ea-gold)) 30%, transparent);
    color: var(--ea-gold-hover, var(--ea-gold));
    box-shadow: none;
  }

  .armory-level-slot--empty.ea-button:hover:not(:disabled) {
    border-color: var(--ea-gold-hover, var(--ea-gold));
    background: color-mix(in srgb, var(--ea-gold-hover, var(--ea-gold)) 12%, transparent);
    color: transparent;
    box-shadow: none;
  }
}
</style>
