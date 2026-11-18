<script setup lang="ts">
import InputRegionBoundary from '../../keyboard/InputRegionBoundary.vue';
import { EaDialog } from '../../../design-system/index';

withDefaults(
  defineProps<{
    visible: boolean;
    embedded?: boolean;
    width: string;
    panelClass: string;
  }>(),
  { embedded: false },
);

const emit = defineEmits<{ 'update:visible': [visible: boolean] }>();
</script>

<template>
  <div v-if="embedded" class="build-dialog-surface" :class="panelClass">
    <slot />
    <div class="build-dialog-surface__footer"><slot name="footer" /></div>
  </div>
  <InputRegionBoundary v-else label="build-dialog" :active="visible" modal>
    <EaDialog
      :model-value="visible"
      :width="width"
      append-to-body
      align-center
      :class="panelClass"
      @update:model-value="emit('update:visible', $event)"
    >
      <slot />
      <template #footer><slot name="footer" /></template>
    </EaDialog>
  </InputRegionBoundary>
</template>

<style scoped>
.build-dialog-surface__footer {
  margin-top: 20px;
  border-top: 1px solid var(--ea-dialog-divider);
}
</style>
