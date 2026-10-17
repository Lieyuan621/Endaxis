<script setup lang="ts">
import { computed } from 'vue';
import { getEquipmentLevelColor } from '../../progression';
import './selectionDialog.css';

const props = defineProps<{ rarity?: number; equipmentLevel?: number }>();
const borderColor = computed(() => {
  if (props.equipmentLevel !== undefined) return getEquipmentLevelColor(props.equipmentLevel);
  if (props.rarity === undefined || props.rarity === 6) return undefined;
  return props.rarity === 5 ? '#ffc400' : props.rarity === 4 ? '#d8b4fe' : '#a0a0a0';
});
</script>

<template>
  <div
    class="card-avatar-wrapper"
    :class="{ 'is-six-star': equipmentLevel === undefined && rarity === 6 }"
    :style="{ borderColor }"
  >
    <slot />
  </div>
</template>
